"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizePriceForItem, type MeasurementUnit } from "@/lib/measurements";
import { dataUrlToBuffer, PRICE_LOG_PHOTO_BUCKET } from "@/lib/photos";
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
    throw new Error(error.message);
  }

  if (existingPath) {
    await supabase.storage.from(PRICE_LOG_PHOTO_BUCKET).remove([existingPath]);
  }

  return path;
}

function toActionState(error: unknown, fieldErrors?: Record<string, string[] | undefined>) {
  return {
    fieldErrors,
    message: error instanceof Error ? error.message : "Something went wrong.",
    status: "error" as const,
  };
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

const itemSchema = z.object({
  category: z.string().trim().optional(),
  comparisonBasisAmount: z.coerce.number().positive(),
  comparisonUnit: z.enum(["count", "g", "ml"]),
  name: z.string().trim().min(1, "Name is required."),
});

export async function createItemAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = itemSchema.safeParse({
    category: formData.get("category"),
    comparisonBasisAmount: formData.get("comparisonBasisAmount"),
    comparisonUnit: formData.get("comparisonUnit"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return toActionState(
      new Error("Fix the item fields and try again."),
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const { supabase, user } = await requireAuthedClient();

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

    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath("/items");
    revalidatePath("/prices/new");
    redirect("/items");
  } catch (error) {
    return toActionState(error);
  }
}

const storeSchema = z
  .object({
    addressText: z.string().trim().min(1, "Address or descriptor is required."),
    chainName: z.string().trim().optional(),
    latitude: z.coerce.number().nullable(),
    longitude: z.coerce.number().nullable(),
    name: z.string().trim().min(1, "Store name is required."),
    notes: z.string().trim().optional(),
    storeKind: z.enum(["physical", "online"]),
    storeUrl: z.string().trim().url("Store link must be a valid URL."),
  })
  .superRefine((value, context) => {
    if (
      value.storeKind === "physical" &&
      (value.latitude === null || value.longitude === null)
    ) {
      context.addIssue({
        code: "custom",
        message: "Physical stores need a map pin.",
        path: ["latitude"],
      });
    }
  });

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

    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath("/stores");
    revalidatePath("/prices/new");
    redirect("/stores");
  } catch (error) {
    return toActionState(error);
  }
}

const priceLogSchema = z.object({
  itemId: z.string().min(1),
  listingUrl: z
    .union([z.string().trim().url("Item listing URL must be a valid URL."), z.literal("")])
    .optional(),
  notes: z.string().trim().optional(),
  observedAt: z.string().trim().min(1, "Observed date is required."),
  packageAmount: z.coerce.number().positive(),
  photoDataUrl: z.string().trim().optional(),
  priceTaxExcludedYen: z.coerce.number().positive(),
  storeId: z.string().min(1),
  totalPriceYen: z.coerce.number().positive(),
});

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

    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath("/prices/new");
    revalidatePath(`/logs/${insertedLog.id}`);
    redirect(`/logs/${insertedLog.id}`);
  } catch (error) {
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
      .select("submitted_by, photo_path")
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

    revalidatePath("/");
    revalidatePath("/logs");
    revalidatePath(`/logs/${logId}`);
    revalidatePath(`/logs/${logId}/edit`);
    revalidatePath("/prices/new");
    redirect(`/logs/${logId}`);
  } catch (error) {
    return toActionState(error);
  }
}

export async function voteOnPriceLogAction(
  logId: string,
  value: -1 | 0 | 1,
): Promise<VoteActionState> {
  try {
    const { supabase, user } = await requireAuthedClient();
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

const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty."),
});

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
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? headerStore.get("origin") ?? "http://localhost:3000";

  const { data, error } = await supabase.auth.signInWithOAuth({
    options: {
      redirectTo: `${origin}/auth/callback`,
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
