"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import {
  accountSettingsSchema,
  commentSchema,
  itemSchema,
  priceLogSchema,
  storeSchema,
} from "@/lib/action-validation";
import { normalizePriceForItem, type MeasurementUnit } from "@/lib/measurements";
import {
  dataUrlToBuffer,
  MAX_PHOTO_BYTES,
  PRICE_LOG_PHOTO_BUCKET,
} from "@/lib/photos";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeExternalUrl } from "@/lib/urls";

export type ActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message: string;
  status: "error" | "idle";
};

type VoteActionState = {
  message: string;
  status: "error" | "idle";
};

const RATE_LIMIT_RULES = {
  commentCreate: { action: "comment-create", limit: 12, windowMs: 60_000 },
  commentVote: { action: "comment-vote", limit: 60, windowMs: 60_000 },
  itemCreate: { action: "item-create", limit: 12, windowMs: 3_600_000 },
  logCreate: { action: "log-create", limit: 30, windowMs: 3_600_000 },
  logEdit: { action: "log-edit", limit: 60, windowMs: 3_600_000 },
  logVote: { action: "log-vote", limit: 60, windowMs: 60_000 },
  storeCreate: { action: "store-create", limit: 12, windowMs: 3_600_000 },
} as const;

function formatRateLimitWindow(windowMs: number) {
  const minutes = Math.round(windowMs / 60_000);

  if (minutes < 60) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

async function consumeRateLimit(input: {
  action: string;
  limit: number;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
  userId: string;
  windowMs: number;
}) {
  const { action, limit, supabase, userId, windowMs } = input;
  const since = new Date(Date.now() - windowMs).toISOString();

  const { count, error: countError } = await supabase
    .from("action_events")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action", action)
    .gte("created_at", since);

  if (countError) {
    throw new Error(countError.message);
  }

  if ((count ?? 0) >= limit) {
    throw new Error(
      `Rate limit reached for this action. Try again in ${formatRateLimitWindow(windowMs)}.`,
    );
  }

  const { error: insertError } = await supabase.from("action_events").insert({
    action,
    user_id: userId,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

function getConfiguredSiteUrl(headerOrigin: string | null) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (siteUrl) {
    return siteUrl;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_SITE_URL must be set in production.");
  }

  return headerOrigin ?? "http://localhost:3000";
}

async function uploadPhotoIfPresent(input: {
  existingPath?: string | null;
  photoDataUrl?: string | null;
  supabase: NonNullable<Awaited<ReturnType<typeof createSupabaseServerClient>>>;
  userId: string;
}) {
  const { existingPath, photoDataUrl, supabase, userId } = input;

  if (!photoDataUrl) {
    return existingPath ?? null;
  }

  const payloadLimit = Math.ceil((MAX_PHOTO_BYTES * 4) / 3) + 512_000;

  try {
    // Guard against oversized payloads before base64 decode to keep memory use bounded.
    if (photoDataUrl.length > payloadLimit) {
      throw new Error(
        "Photo payload is too large for upload. Try a tighter crop or a simpler image.",
      );
    }

    const { buffer, contentType } = dataUrlToBuffer(photoDataUrl);
    const extension = contentType === "image/webp" ? "webp" : "jpg";
    const path = `${userId}/${randomUUID()}.${extension}`;

    const { error } = await supabase.storage
      .from(PRICE_LOG_PHOTO_BUCKET)
      .upload(path, buffer, {
        contentType,
        upsert: false,
      });

    if (error) {
      console.error("Photo storage upload failed", {
        bodyPayloadLength: photoDataUrl.length,
        bucket: PRICE_LOG_PHOTO_BUCKET,
        contentType,
        decodedBytes: buffer.byteLength,
        error: error.message,
        path,
        userId,
      });
      throw new Error(`Photo upload failed: ${error.message}`);
    }

    if (existingPath) {
      await supabase.storage.from(PRICE_LOG_PHOTO_BUCKET).remove([existingPath]);
    }

    return path;
  } catch (error) {
    console.error("Photo decode/upload failed", {
      bodyPayloadLength: photoDataUrl.length,
      existingPath: existingPath ?? null,
      message: error instanceof Error ? error.message : "Unknown photo error",
      payloadLimit,
      userId,
    });
    throw error instanceof Error
      ? error
      : new Error("Photo upload failed before it could be saved.");
  }
}

function toActionState(error: unknown, fieldErrors?: Record<string, string[] | undefined>) {
  return {
    fieldErrors,
    message: error instanceof Error ? error.message : "Something went wrong.",
    status: "error" as const,
  };
}

function rethrowIfRedirectError(error: unknown) {
  if (isRedirectError(error)) {
    throw error;
  }
}

function revalidateSharedItems() {
  revalidateTag("items", "max");
}

function revalidateSharedStores() {
  revalidateTag("stores", "max");
}

function revalidatePriceLogCaches(input?: {
  itemId?: string | null;
  logId?: string | null;
  storeId?: string | null;
}) {
  revalidateTag("price-logs", "max");

  if (input?.itemId) {
    revalidateTag(`price-logs:item:${input.itemId}`, "max");
  }

  if (input?.storeId) {
    revalidateTag(`price-logs:store:${input.storeId}`, "max");
  }

  if (input?.logId) {
    revalidateTag(`price-log:${input.logId}`, "max");
  }
}

async function requireAuthedClient() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase is not configured. Add your env vars first.");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You need to sign in before making changes.");
  }

  return { supabase, user };
}

export async function createItemAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = itemSchema.safeParse({
    category: formData.get("category"),
    comparisonBasisAmount: formData.get("comparisonBasisAmount"),
    comparisonUnit: formData.get("comparisonUnit"),
    name: formData.get("name"),
    returnTo: formData.get("returnTo"),
  });

  if (!parsed.success) {
    return toActionState(
      new Error("Fix the item fields and try again."),
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const { supabase, user } = await requireAuthedClient();
    await consumeRateLimit({
      ...RATE_LIMIT_RULES.itemCreate,
      supabase,
      userId: user.id,
    });

    const { error } = await supabase.from("items").insert({
      category: parsed.data.category || null,
      comparison_basis_amount: parsed.data.comparisonBasisAmount,
      comparison_unit: parsed.data.comparisonUnit,
      created_by: user.id,
      name: parsed.data.name,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidateSharedItems();
    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath("/items");
    revalidatePath("/prices/new");

    if (parsed.data.returnTo === "prices-new") {
      redirect(`/prices/new?prefillItem=${encodeURIComponent(parsed.data.name)}`);
    }

    redirect("/items");
  } catch (error) {
    rethrowIfRedirectError(error);
    return toActionState(error);
  }
}

export async function updateAccountSettingsAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = accountSettingsSchema.safeParse({
    publicName: formData.get("publicName"),
  });

  if (!parsed.success) {
    return toActionState(
      new Error("Fix the username and try again."),
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const { supabase, user } = await requireAuthedClient();
    const normalizedPublicName = parsed.data.publicName.trim();

    const { data: conflict } = await supabase
      .from("profiles")
      .select("id")
      .ilike("public_name", normalizedPublicName)
      .neq("id", user.id)
      .maybeSingle();

    if (conflict) {
      throw new Error("That username is already taken.");
    }

    const { data: updatedProfile, error } = await supabase
      .from("profiles")
      .update({
        public_name: normalizedPublicName,
      })
      .eq("id", user.id)
      .select("id");

    if (error) {
      throw new Error(error.message);
    }

    if (!updatedProfile || updatedProfile.length === 0) {
      throw new Error(
        "Profile update was blocked. Apply the latest Supabase migration for profile self-updates.",
      );
    }

    const { error: metadataError } = await supabase.auth.updateUser({
      data: {
        public_name: normalizedPublicName,
      },
    });

    if (metadataError) {
      throw new Error(metadataError.message);
    }

    revalidatePath("/", "layout");
    revalidatePath("/logs");
    revalidatePath("/account");
    revalidatePath("/settings");
    revalidatePath("/stores");
    redirect(`/settings?saved=1&updated=${Date.now()}`);
  } catch (error) {
    rethrowIfRedirectError(error);
    return toActionState(error);
  }
}

export async function createStoreAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = storeSchema.safeParse({
    addressText: formData.get("addressText"),
    chainName: formData.get("chainName"),
    latitude: formData.get("latitude") ? Number(formData.get("latitude")) : null,
    longitude: formData.get("longitude") ? Number(formData.get("longitude")) : null,
    name: formData.get("name"),
    notes: formData.get("notes"),
    returnTo: formData.get("returnTo"),
    storeKind: formData.get("storeKind"),
    storeUrl: formData.get("storeUrl"),
  });

  if (!parsed.success) {
    return toActionState(
      new Error("Fix the store fields and try again."),
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const { supabase, user } = await requireAuthedClient();
    await consumeRateLimit({
      ...RATE_LIMIT_RULES.storeCreate,
      supabase,
      userId: user.id,
    });
    const normalizedStoreUrl = normalizeExternalUrl(parsed.data.storeUrl);

    const { data: duplicateStore } = await supabase
      .from("stores")
      .select("id, name")
      .eq("store_url", normalizedStoreUrl)
      .maybeSingle();

    if (duplicateStore) {
      throw new Error(`A store with this link already exists: ${duplicateStore.name}`);
    }

    const { error } = await supabase.from("stores").insert({
      address_text: parsed.data.addressText,
      chain_name: parsed.data.chainName || null,
      created_by: user.id,
      latitude: parsed.data.storeKind === "physical" ? parsed.data.latitude : null,
      longitude: parsed.data.storeKind === "physical" ? parsed.data.longitude : null,
      name: parsed.data.name,
      notes: parsed.data.notes || null,
      store_kind: parsed.data.storeKind,
      store_url: normalizedStoreUrl,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidateSharedStores();
    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath("/stores");
    revalidatePath("/prices/new");

    if (parsed.data.returnTo === "prices-new") {
      redirect(`/prices/new?prefillStore=${encodeURIComponent(parsed.data.name)}`);
    }

    redirect("/stores");
  } catch (error) {
    rethrowIfRedirectError(error);
    return toActionState(error);
  }
}

export async function createPriceLogAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = priceLogSchema.safeParse({
    itemId: formData.get("itemId"),
    listingUrl: formData.get("listingUrl"),
    notes: formData.get("notes"),
    observedAt: formData.get("observedAt"),
    packageAmount: formData.get("packageAmount"),
    photoDataUrl: formData.get("photoDataUrl"),
    priceTaxExcludedYen: formData.get("priceTaxExcludedYen"),
    storeId: formData.get("storeId"),
    totalPriceYen: formData.get("totalPriceYen"),
  });

  if (!parsed.success) {
    return toActionState(
      new Error("Fix the price log fields and try again."),
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const { supabase, user } = await requireAuthedClient();
    await consumeRateLimit({
      ...RATE_LIMIT_RULES.logCreate,
      supabase,
      userId: user.id,
    });
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("comparison_basis_amount, comparison_unit")
      .eq("id", parsed.data.itemId)
      .single();

    if (itemError || !item) {
      throw new Error("Select a valid item before logging a price.");
    }

    const normalizedPrice = normalizePriceForItem({
      comparisonBasisAmount: item.comparison_basis_amount,
      comparisonUnit: item.comparison_unit as MeasurementUnit,
      packageAmount: parsed.data.packageAmount,
      packageUnit: item.comparison_unit as MeasurementUnit,
      totalPriceYen: parsed.data.totalPriceYen,
    });
    const photoPath = await uploadPhotoIfPresent({
      photoDataUrl: parsed.data.photoDataUrl || null,
      supabase,
      userId: user.id,
    });

    const { data: insertedLog, error } = await supabase
      .from("price_logs")
      .insert({
        item_id: parsed.data.itemId,
        listing_url: parsed.data.listingUrl
          ? normalizeExternalUrl(parsed.data.listingUrl)
          : null,
        normalized_price_yen: normalizedPrice,
        notes: parsed.data.notes || null,
        observed_at: parsed.data.observedAt,
        package_amount: parsed.data.packageAmount,
        package_unit: item.comparison_unit,
        photo_path: photoPath,
        price_tax_excluded_yen: parsed.data.priceTaxExcludedYen,
        store_id: parsed.data.storeId,
        submitted_by: user.id,
        total_price_yen: parsed.data.totalPriceYen,
      })
      .select("id")
      .single();

    if (error || !insertedLog) {
      throw new Error(error?.message ?? "Failed to create the price log.");
    }

    revalidatePriceLogCaches({
      itemId: parsed.data.itemId,
      logId: insertedLog.id,
      storeId: parsed.data.storeId,
    });
    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath("/prices/new");
    revalidatePath(`/logs/${insertedLog.id}`);
    redirect(`/logs/${insertedLog.id}`);
  } catch (error) {
    rethrowIfRedirectError(error);
    return toActionState(error);
  }
}

export async function updatePriceLogAction(
  logId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = priceLogSchema.safeParse({
    itemId: formData.get("itemId"),
    listingUrl: formData.get("listingUrl"),
    notes: formData.get("notes"),
    observedAt: formData.get("observedAt"),
    packageAmount: formData.get("packageAmount"),
    photoDataUrl: formData.get("photoDataUrl"),
    priceTaxExcludedYen: formData.get("priceTaxExcludedYen"),
    storeId: formData.get("storeId"),
    totalPriceYen: formData.get("totalPriceYen"),
  });

  if (!parsed.success) {
    return toActionState(
      new Error("Fix the price log fields and try again."),
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const { supabase, user } = await requireAuthedClient();
    await consumeRateLimit({
      ...RATE_LIMIT_RULES.logEdit,
      supabase,
      userId: user.id,
    });
    const { data: item, error: itemError } = await supabase
      .from("items")
      .select("comparison_basis_amount, comparison_unit")
      .eq("id", parsed.data.itemId)
      .single();

    if (itemError || !item) {
      throw new Error("Select a valid item before saving this log.");
    }

    const normalizedPrice = normalizePriceForItem({
      comparisonBasisAmount: item.comparison_basis_amount,
      comparisonUnit: item.comparison_unit as MeasurementUnit,
      packageAmount: parsed.data.packageAmount,
      packageUnit: item.comparison_unit as MeasurementUnit,
      totalPriceYen: parsed.data.totalPriceYen,
    });

    const { data: existing, error: existingError } = await supabase
      .from("price_logs")
      .select("submitted_by, photo_path, item_id, store_id")
      .eq("id", logId)
      .single();

    if (existingError || !existing) {
      throw new Error("This log no longer exists.");
    }

    if (existing.submitted_by !== user.id) {
      throw new Error("Only the original submitter can edit this log.");
    }

    const photoPath = await uploadPhotoIfPresent({
      existingPath: existing.photo_path,
      photoDataUrl: parsed.data.photoDataUrl || null,
      supabase,
      userId: user.id,
    });

    const { error } = await supabase
      .from("price_logs")
      .update({
        item_id: parsed.data.itemId,
        listing_url: parsed.data.listingUrl
          ? normalizeExternalUrl(parsed.data.listingUrl)
          : null,
        normalized_price_yen: normalizedPrice,
        notes: parsed.data.notes || null,
        observed_at: parsed.data.observedAt,
        package_amount: parsed.data.packageAmount,
        package_unit: item.comparison_unit,
        photo_path: photoPath,
        price_tax_excluded_yen: parsed.data.priceTaxExcludedYen,
        store_id: parsed.data.storeId,
        total_price_yen: parsed.data.totalPriceYen,
      })
      .eq("id", logId)
      .eq("submitted_by", user.id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePriceLogCaches({
      itemId: parsed.data.itemId,
      logId,
      storeId: parsed.data.storeId,
    });
    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath(`/logs/${logId}`);
    revalidatePath(`/logs/${logId}/edit`);
    revalidatePath("/prices/new");
    redirect(`/logs/${logId}`);
  } catch (error) {
    rethrowIfRedirectError(error);
    return toActionState(error);
  }
}

export async function deletePriceLogAction(logId: string) {
  try {
    const { supabase, user } = await requireAuthedClient();

    const { data: existing, error: existingError } = await supabase
      .from("price_logs")
      .select("submitted_by, photo_path, item_id, store_id")
      .eq("id", logId)
      .single();

    if (existingError || !existing) {
      throw new Error("This log no longer exists.");
    }

    if (existing.submitted_by !== user.id) {
      throw new Error("Only the original submitter can delete this log.");
    }

    if (existing.photo_path) {
      const { error: removePhotoError } = await supabase.storage
        .from(PRICE_LOG_PHOTO_BUCKET)
        .remove([existing.photo_path]);

      if (removePhotoError) {
        console.error("Photo remove failed during log delete", {
          error: removePhotoError.message,
          logId,
          path: existing.photo_path,
          userId: user.id,
        });
      }
    }

    const { error: deleteError } = await supabase
      .from("price_logs")
      .delete()
      .eq("id", logId)
      .eq("submitted_by", user.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    revalidatePriceLogCaches({
      itemId: existing.item_id,
      logId,
      storeId: existing.store_id,
    });
    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath("/prices/new");
    revalidatePath(`/logs/${logId}`);
    revalidatePath(`/logs/${logId}/edit`);
    redirect("/logs");
  } catch (error) {
    rethrowIfRedirectError(error);
    throw error instanceof Error ? error : new Error("Could not delete this log.");
  }
}

export async function voteOnPriceLogAction(
  logId: string,
  value: -1 | 0 | 1,
): Promise<VoteActionState> {
  try {
    const { supabase, user } = await requireAuthedClient();
    await consumeRateLimit({
      ...RATE_LIMIT_RULES.logVote,
      supabase,
      userId: user.id,
    });
    if (value === 0) {
      const { error: deleteError } = await supabase
        .from("price_log_votes")
        .delete()
        .eq("log_id", logId)
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    } else {
      const { error: upsertError } = await supabase.from("price_log_votes").upsert(
        {
          log_id: logId,
          user_id: user.id,
          value,
        },
        {
          onConflict: "log_id,user_id",
        },
      );

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }

    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath(`/logs/${logId}`);

    return {
      message: "",
      status: "idle",
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Could not update vote.",
      status: "error",
    };
  }
}

export async function createPriceLogCommentAction(
  logId: string,
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = commentSchema.safeParse({
    body: formData.get("body"),
  });

  if (!parsed.success) {
    return toActionState(
      new Error("Write a comment before posting."),
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const { supabase, user } = await requireAuthedClient();
    await consumeRateLimit({
      ...RATE_LIMIT_RULES.commentCreate,
      supabase,
      userId: user.id,
    });
    const { error } = await supabase.from("price_log_comments").insert({
      author_id: user.id,
      body: parsed.data.body,
      log_id: logId,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath(`/logs/${logId}`);

    return {
      message: "",
      status: "idle",
    };
  } catch (error) {
    return toActionState(error);
  }
}

export async function voteOnCommentAction(
  commentId: string,
  value: -1 | 0 | 1,
): Promise<VoteActionState> {
  try {
    const { supabase, user } = await requireAuthedClient();
    await consumeRateLimit({
      ...RATE_LIMIT_RULES.commentVote,
      supabase,
      userId: user.id,
    });

    if (value === 0) {
      const { error: deleteError } = await supabase
        .from("price_log_comment_votes")
        .delete()
        .eq("comment_id", commentId)
        .eq("user_id", user.id);

      if (deleteError) {
        throw new Error(deleteError.message);
      }
    } else {
      const { error: upsertError } = await supabase
        .from("price_log_comment_votes")
        .upsert(
          {
            comment_id: commentId,
            user_id: user.id,
            value,
          },
          {
            onConflict: "comment_id,user_id",
          },
        );

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }

    return {
      message: "",
      status: "idle",
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Could not update vote.",
      status: "error",
    };
  }
}

export async function signInWithGoogleAction() {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    redirect("/auth/sign-in?error=config");
  }

  const headerStore = await headers();
  const origin = getConfiguredSiteUrl(headerStore.get("origin"));

  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: new URL("/auth/callback", origin).toString(),
    },
    provider: "google",
  });

  if (error || !data.url) {
    redirect("/auth/sign-in?error=oauth");
  }

  redirect(data.url);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/auth/sign-in");
}
