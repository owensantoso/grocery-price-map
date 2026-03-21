"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { normalizePriceForItem } from "@/lib/measurements";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ActionState = {
  fieldErrors?: Record<string, string[] | undefined>;
  message: string;
  status: "error" | "idle";
};

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
  comparisonUnit: z.enum(["count", "piece", "g", "kg", "ml", "l"]),
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
    revalidatePath("/items");
    revalidatePath("/prices/new");
    redirect("/items");
  } catch (error) {
    return toActionState(error);
  }
}

const storeSchema = z.object({
  addressText: z.string().trim().min(1, "Address or landmark is required."),
  chainName: z.string().trim().optional(),
  latitude: z.coerce.number(),
  longitude: z.coerce.number(),
  name: z.string().trim().min(1, "Store name is required."),
  notes: z.string().trim().optional(),
});

export async function createStoreAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = storeSchema.safeParse({
    addressText: formData.get("addressText"),
    chainName: formData.get("chainName"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    name: formData.get("name"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return toActionState(
      new Error("Fix the store fields and try again."),
      parsed.error.flatten().fieldErrors,
    );
  }

  try {
    const { supabase, user } = await requireAuthedClient();

    const { error } = await supabase.from("stores").insert({
      address_text: parsed.data.addressText,
      chain_name: parsed.data.chainName || null,
      created_by: user.id,
      latitude: parsed.data.latitude,
      longitude: parsed.data.longitude,
      name: parsed.data.name,
      notes: parsed.data.notes || null,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/");
    revalidatePath("/stores");
    revalidatePath("/prices/new");
    redirect("/stores");
  } catch (error) {
    return toActionState(error);
  }
}

const priceLogSchema = z.object({
  itemId: z.string().min(1),
  notes: z.string().trim().optional(),
  observedAt: z.string().trim().min(1, "Observed date is required."),
  packageAmount: z.coerce.number().positive(),
  packageUnit: z.enum(["count", "piece", "g", "kg", "ml", "l"]),
  storeId: z.string().min(1),
  totalPriceYen: z.coerce.number().positive(),
});

export async function createPriceLogAction(
  _previousState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = priceLogSchema.safeParse({
    itemId: formData.get("itemId"),
    notes: formData.get("notes"),
    observedAt: formData.get("observedAt"),
    packageAmount: formData.get("packageAmount"),
    packageUnit: formData.get("packageUnit"),
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
      comparisonUnit: item.comparison_unit,
      packageAmount: parsed.data.packageAmount,
      packageUnit: parsed.data.packageUnit,
      totalPriceYen: parsed.data.totalPriceYen,
    });

    const { error } = await supabase.from("price_logs").insert({
      item_id: parsed.data.itemId,
      normalized_price_yen: normalizedPrice,
      notes: parsed.data.notes || null,
      observed_at: parsed.data.observedAt,
      package_amount: parsed.data.packageAmount,
      package_unit: parsed.data.packageUnit,
      store_id: parsed.data.storeId,
      submitted_by: user.id,
      total_price_yen: parsed.data.totalPriceYen,
    });

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/");
    revalidatePath("/prices/new");
    redirect(`/?item=${parsed.data.itemId}`);
  } catch (error) {
    return toActionState(error);
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
