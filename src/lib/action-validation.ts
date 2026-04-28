import { z } from "zod";

function hasAtMostDecimalPlaces(value: number, places: number) {
  const factor = 10 ** places;

  return Number.isInteger(Math.round(value * factor * 1_000_000) / 1_000_000);
}

export const itemSchema = z.object({
  category: z.string().trim().optional(),
  comparisonBasisAmount: z.coerce.number().positive(),
  comparisonUnit: z.enum(["count", "g", "ml"]),
  name: z.string().trim().min(1, "Name is required."),
  returnTo: z.string().trim().optional(),
});

export const accountSettingsSchema = z.object({
  publicName: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(32, "Username must be 32 characters or fewer.")
    .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i, {
      message: "Username can use letters, numbers, and hyphens only.",
    }),
});

export const storeSchema = z
  .object({
    addressText: z.string().trim().min(1, "Address or descriptor is required."),
    chainName: z.string().trim().optional(),
    latitude: z.coerce.number().nullable(),
    longitude: z.coerce.number().nullable(),
    name: z.string().trim().min(1, "Store name is required."),
    notes: z.string().trim().optional(),
    returnTo: z.string().trim().optional(),
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

export const priceLogSchema = z.object({
  itemId: z.string().min(1),
  listingUrl: z
    .union([z.string().trim().url("Item listing URL must be a valid URL."), z.literal("")])
    .optional(),
  notes: z.string().trim().optional(),
  observedAt: z.string().trim().min(1, "Observed date is required."),
  packageAmount: z.coerce
    .number()
    .positive()
    .refine((value) => hasAtMostDecimalPlaces(value, 2), {
      message: "Package amount can use at most 2 decimal places.",
    }),
  photoDataUrl: z.string().trim().optional(),
  priceTaxExcludedYen: z.coerce.number().positive(),
  storeId: z.string().min(1),
  totalPriceYen: z.coerce.number().positive(),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty."),
});
