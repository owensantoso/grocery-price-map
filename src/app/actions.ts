"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  accountSettingsSchema,
  commentSchema,
  itemSchema,
  priceLogSchema,
  storeSchema,
} from "@/lib/action-validation";
import {
  consumeRateLimit,
  getConfiguredSiteUrl,
  RATE_LIMIT_RULES,
  requireAuthedClient,
  rethrowIfRedirectError,
  revalidatePriceLogCaches,
  revalidateSharedItems,
  revalidateSharedStores,
  toActionState,
  type ActionState,
  type VoteActionState,
} from "@/lib/action-helpers";
import { createDiagnosticContext, startDiagnosticSpan } from "@/lib/diagnostics";
import { normalizePriceForItem, type MeasurementUnit } from "@/lib/measurements";
import {
  removePriceLogPhoto,
  uploadPhotoIfPresent,
} from "@/lib/price-log-photo-actions";
import { excludedFromIncluded } from "@/lib/pricing";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { normalizeExternalUrl } from "@/lib/urls";

export type { ActionState } from "@/lib/action-helpers";

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

  const diagnostics = createDiagnosticContext({
    component: "price_log_action",
    operation: "create",
  });
  const span = startDiagnosticSpan(diagnostics, {
    attrs: {
      hasListingUrl: Boolean(parsed.data.listingUrl),
      hasPhoto: Boolean(parsed.data.photoDataUrl),
      itemId: parsed.data.itemId,
      storeId: parsed.data.storeId,
    },
    event: "price_log_create",
  });

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
    const priceTaxExcludedYen = excludedFromIncluded(parsed.data.totalPriceYen);
    const photoPath = await uploadPhotoIfPresent({
      diagnostics: createDiagnosticContext({
        component: "price_log_photo",
        operation: "upload",
        parentSpanId: span.spanId,
        traceId: span.traceId,
      }),
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
        price_tax_excluded_yen: priceTaxExcludedYen,
        store_id: parsed.data.storeId,
        submitted_by: user.id,
        total_price_yen: parsed.data.totalPriceYen,
      })
      .select("id")
      .single();

    if (error || !insertedLog) {
      await removePriceLogPhoto({
        diagnostics: createDiagnosticContext({
          component: "price_log_photo",
          operation: "cleanup",
          parentSpanId: span.spanId,
          traceId: span.traceId,
        }),
        path: photoPath,
        reason: "create_insert_failed",
        supabase,
      });
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
    span.end({
      attrs: {
        insertedLogId: insertedLog.id,
        photoAttached: Boolean(photoPath),
      },
    });
    redirect(`/logs/${insertedLog.id}`);
  } catch (error) {
    rethrowIfRedirectError(error);
    span.error(error);
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

  const diagnostics = createDiagnosticContext({
    component: "price_log_action",
    operation: "update",
  });
  const span = startDiagnosticSpan(diagnostics, {
    attrs: {
      hasListingUrl: Boolean(parsed.data.listingUrl),
      hasPhoto: Boolean(parsed.data.photoDataUrl),
      itemId: parsed.data.itemId,
      logId,
      storeId: parsed.data.storeId,
    },
    event: "price_log_update",
  });

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
    const priceTaxExcludedYen = excludedFromIncluded(parsed.data.totalPriceYen);

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

    const uploadedPhotoPath = await uploadPhotoIfPresent({
      diagnostics: createDiagnosticContext({
        component: "price_log_photo",
        operation: "upload",
        parentSpanId: span.spanId,
        traceId: span.traceId,
      }),
      photoDataUrl: parsed.data.photoDataUrl || null,
      supabase,
      userId: user.id,
    });
    const photoPath = uploadedPhotoPath ?? existing.photo_path;

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
        price_tax_excluded_yen: priceTaxExcludedYen,
        store_id: parsed.data.storeId,
        total_price_yen: parsed.data.totalPriceYen,
      })
      .eq("id", logId)
      .eq("submitted_by", user.id);

    if (error) {
      await removePriceLogPhoto({
        diagnostics: createDiagnosticContext({
          component: "price_log_photo",
          operation: "cleanup",
          parentSpanId: span.spanId,
          traceId: span.traceId,
        }),
        logId,
        path: uploadedPhotoPath,
        reason: "update_failed",
        supabase,
      });
      throw new Error(error.message);
    }

    if (uploadedPhotoPath && existing.photo_path) {
      await removePriceLogPhoto({
        diagnostics: createDiagnosticContext({
          component: "price_log_photo",
          operation: "cleanup",
          parentSpanId: span.spanId,
          traceId: span.traceId,
        }),
        logId,
        path: existing.photo_path,
        reason: "update_replaced",
        supabase,
      });
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
    span.end({
      attrs: {
        logId,
        photoAttached: Boolean(photoPath),
        photoReplaced: Boolean(uploadedPhotoPath && existing.photo_path),
      },
    });
    redirect(`/logs/${logId}`);
  } catch (error) {
    rethrowIfRedirectError(error);
    span.error(error);
    return toActionState(error);
  }
}

export async function deletePriceLogAction(logId: string) {
  const diagnostics = createDiagnosticContext({
    component: "price_log_action",
    operation: "delete",
  });
  const span = startDiagnosticSpan(diagnostics, {
    attrs: {
      logId,
    },
    event: "price_log_delete",
  });

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

    const { error: deleteError } = await supabase
      .from("price_logs")
      .delete()
      .eq("id", logId)
      .eq("submitted_by", user.id);

    if (deleteError) {
      throw new Error(deleteError.message);
    }

    await removePriceLogPhoto({
      diagnostics: createDiagnosticContext({
        component: "price_log_photo",
        operation: "cleanup",
        parentSpanId: span.spanId,
        traceId: span.traceId,
      }),
      logId,
      path: existing.photo_path,
      reason: "delete_succeeded",
      supabase,
    });

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
    span.end({
      attrs: {
        hadPhoto: Boolean(existing.photo_path),
        logId,
      },
    });
    redirect("/logs");
  } catch (error) {
    rethrowIfRedirectError(error);
    span.error(error);
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
