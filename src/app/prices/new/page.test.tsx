import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewPricePage from "./page";
import { demoItems, demoStores } from "@/lib/demo-data";
import { getPriceEntrySnapshot } from "@/lib/queries";
import { PRICE_LOG_DRAFT_STORAGE_KEY, serializePriceLogDraft } from "@/lib/price-log-draft";

vi.mock("@/app/actions", () => ({ createPriceLogAction: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock("@/lib/queries", () => ({ getPriceEntrySnapshot: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));

const stores = [
  { ...demoStores[0], id: "existing-store", name: "Same Market" },
  { ...demoStores[1], id: "new-store", name: "Same Market" },
];

async function payload(params: { prefillStoreId?: string; prefillStore?: string }) {
  const view = render(await NewPricePage({ searchParams: Promise.resolve(params) }));
  return new FormData(view.container.querySelector("form")!);
}

describe("new price page store return", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.stubGlobal("matchMedia", vi.fn(() => ({
      matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn(),
    })));
    vi.mocked(getPriceEntrySnapshot).mockResolvedValue({
      items: demoItems, stores, viewer: { id: "user", publicName: "user", email: "user@example.com" },
    });
  });

  it("selects the created location even when an older location has the same name", async () => {
    const form = await payload({ prefillStoreId: "new-store", prefillStore: "Same Market" });
    expect(form.get("storeId")).toBe("new-store");
  });

  it("keeps draft fields while the new location takes precedence over the draft's store", async () => {
    sessionStorage.setItem(PRICE_LOG_DRAFT_STORAGE_KEY, serializePriceLogDraft({
      storeId: "existing-store", itemId: demoItems[0].id, displayPrice: "320",
      packageAmount: "6", notes: "Keep my draft", observedAt: "2026-10-02",
    }));
    const form = await payload({ prefillStoreId: "new-store" });
    expect(form.get("storeId")).toBe("new-store");
    expect(form.get("itemId")).toBe(demoItems[0].id);
    expect(form.get("packageAmount")).toBe("6");
    expect(form.get("totalPriceYen")).toBe("320");
    expect(form.get("notes")).toBe("Keep my draft");
    expect(form.get("observedAt")).toBe("2026-10-02");
  });

  it("does not substitute a same-name location for an unavailable explicit ID", async () => {
    sessionStorage.setItem(PRICE_LOG_DRAFT_STORAGE_KEY, serializePriceLogDraft({
      storeId: "existing-store", notes: "Keep this even if the new store disappeared",
    }));
    const form = await payload({ prefillStoreId: "unavailable", prefillStore: "Same Market" });
    expect(form.get("storeId")).toBe("");
    expect(form.get("notes")).toBe("Keep this even if the new store disappeared");
  });

  it("still supports existing name-only links", async () => {
    const form = await payload({ prefillStore: "Same Market" });
    expect(form.get("storeId")).toBe("existing-store");
  });
});
