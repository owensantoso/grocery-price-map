import { describe, expect, it } from "vitest";
import { commentSchema, priceLogSchema, storeSchema } from "./action-validation";

describe("server action validation schemas", () => {
  it("requires physical stores to include coordinates", () => {
    const parsed = storeSchema.safeParse({
      addressText: "Nishi-Eifuku",
      chainName: "",
      latitude: null,
      longitude: null,
      name: "Corner Market",
      notes: "",
      returnTo: "",
      storeKind: "physical",
      storeUrl: "https://example.com/store",
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      expect(parsed.error.flatten().fieldErrors.latitude).toContain(
        "Physical stores need a map pin.",
      );
    }
  });

  it("allows online stores without coordinates", () => {
    const parsed = storeSchema.safeParse({
      addressText: "Ships nationally",
      chainName: "",
      latitude: null,
      longitude: null,
      name: "Online Market",
      notes: "",
      returnTo: "",
      storeKind: "online",
      storeUrl: "https://example.com/store",
    });

    expect(parsed.success).toBe(true);
  });

  it("rejects incomplete price logs before Supabase writes run", () => {
    const parsed = priceLogSchema.safeParse({
      itemId: "",
      listingUrl: "not a url",
      notes: "",
      observedAt: "",
      packageAmount: "0",
      photoDataUrl: "",
      priceTaxExcludedYen: "-1",
      storeId: "",
      totalPriceYen: "0",
    });

    expect(parsed.success).toBe(false);

    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;

      expect(fieldErrors.itemId).toBeDefined();
      expect(fieldErrors.listingUrl).toContain("Item listing URL must be a valid URL.");
      expect(fieldErrors.observedAt).toContain("Observed date is required.");
      expect(fieldErrors.packageAmount).toBeDefined();
      expect(fieldErrors.priceTaxExcludedYen).toBeDefined();
      expect(fieldErrors.storeId).toBeDefined();
      expect(fieldErrors.totalPriceYen).toBeDefined();
    }
  });

  it("trims comments and rejects empty bodies", () => {
    expect(commentSchema.safeParse({ body: "   " }).success).toBe(false);
    expect(commentSchema.parse({ body: "  Good price  " })).toEqual({
      body: "Good price",
    });
  });
});
