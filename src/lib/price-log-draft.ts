export type PriceLogDraft = {
  displayPrice: string;
  itemId: string;
  listingUrl: string;
  notes: string;
  observedAt: string;
  packageAmount: string;
  priceIncludesTax: boolean;
  storeId: string;
};

export type PriceLogDraftInput = Partial<PriceLogDraft> & Record<string, unknown>;
export const PRICE_LOG_DRAFT_STORAGE_KEY = "grocery-price-map:price-log-draft:v1";

const draftStringFields = [
  "displayPrice",
  "itemId",
  "listingUrl",
  "notes",
  "observedAt",
  "packageAmount",
  "storeId",
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function serializePriceLogDraft(input: PriceLogDraftInput) {
  const draft: PriceLogDraft = {
    displayPrice: "",
    itemId: "",
    listingUrl: "",
    notes: "",
    observedAt: "",
    packageAmount: "",
    priceIncludesTax:
      typeof input.priceIncludesTax === "boolean" ? input.priceIncludesTax : true,
    storeId: "",
  };

  for (const field of draftStringFields) {
    const value = input[field];
    draft[field] = typeof value === "string" ? value : "";
  }

  return JSON.stringify({ draft, version: 1 });
}

export function parseStoredPriceLogDraft(stored: string | null): PriceLogDraft | null {
  if (!stored) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(stored);

    if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.draft)) {
      return null;
    }

    for (const field of draftStringFields) {
      if (typeof parsed.draft[field] !== "string") {
        return null;
      }
    }

    if (typeof parsed.draft.priceIncludesTax !== "boolean") {
      return null;
    }

    const draft = parsed.draft as Record<(typeof draftStringFields)[number], string> & {
      priceIncludesTax: boolean;
    };

    return {
      displayPrice: draft.displayPrice,
      itemId: draft.itemId,
      listingUrl: draft.listingUrl,
      notes: draft.notes,
      observedAt: draft.observedAt,
      packageAmount: draft.packageAmount,
      priceIncludesTax: draft.priceIncludesTax,
      storeId: draft.storeId,
    };
  } catch {
    return null;
  }
}
