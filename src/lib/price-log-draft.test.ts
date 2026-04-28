import { describe, expect, it } from "vitest";
import {
  parseStoredPriceLogDraft,
  serializePriceLogDraft,
} from "./price-log-draft";

describe("price log draft helpers", () => {
  it("serializes only safe scalar draft fields", () => {
    const serialized = serializePriceLogDraft({
      displayPrice: "328",
      itemId: "item-1",
      listingUrl: "https://example.com/item",
      notes: "promo sticker",
      observedAt: "2026-04-29",
      packageAmount: "500",
      photoDataUrl: "data:image/webp;base64,abc",
      priceIncludesTax: false,
      storeId: "store-1",
    });

    expect(JSON.parse(serialized)).toEqual({
      draft: {
        displayPrice: "328",
        itemId: "item-1",
        listingUrl: "https://example.com/item",
        notes: "promo sticker",
        observedAt: "2026-04-29",
        packageAmount: "500",
        priceIncludesTax: false,
        storeId: "store-1",
      },
      version: 1,
    });
    expect(serialized).not.toContain("photoDataUrl");
  });

  it("restores a valid stored draft", () => {
    const stored = JSON.stringify({
      draft: {
        displayPrice: "128",
        itemId: "item-2",
        listingUrl: "",
        notes: "",
        observedAt: "2026-04-28",
        packageAmount: "1",
        priceIncludesTax: true,
        storeId: "store-2",
      },
      version: 1,
    });

    expect(parseStoredPriceLogDraft(stored)).toEqual({
      displayPrice: "128",
      itemId: "item-2",
      listingUrl: "",
      notes: "",
      observedAt: "2026-04-28",
      packageAmount: "1",
      priceIncludesTax: true,
      storeId: "store-2",
    });
  });

  it("ignores malformed or invalid stored data", () => {
    expect(parseStoredPriceLogDraft("{nope")).toBeNull();
    expect(parseStoredPriceLogDraft(null)).toBeNull();
    expect(parseStoredPriceLogDraft(JSON.stringify({ version: 2, draft: {} }))).toBeNull();
    expect(
      parseStoredPriceLogDraft(
        JSON.stringify({
          draft: {
            displayPrice: "128",
            itemId: "item-2",
            listingUrl: "",
            notes: "",
            observedAt: "2026-04-28",
            packageAmount: "1",
            priceIncludesTax: "yes",
            storeId: "store-2",
          },
          version: 1,
        }),
      ),
    ).toBeNull();
  });
});
