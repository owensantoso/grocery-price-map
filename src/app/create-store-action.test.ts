import { beforeEach, describe, expect, it, vi } from "vitest";
import { createStoreAction } from "./actions";

const backend = vi.hoisted(() => ({
  result: { data: { id: "created-location-id" } as { id: string } | null, error: null as { message: string } | null },
}));
vi.mock("next/headers", () => ({ headers: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (path: string) => { throw new Error(`NEXT_REDIRECT:${path}`); },
}));
vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));
vi.mock("@/lib/price-log-photo-actions", () => ({ removePriceLogPhoto: vi.fn(), uploadPhotoIfPresent: vi.fn() }));
vi.mock("@/lib/action-helpers", () => ({
  consumeRateLimit: vi.fn(), getConfiguredSiteUrl: vi.fn(), RATE_LIMIT_RULES: { storeCreate: {} },
  requireAuthedClient: async () => ({
    user: { id: "user" },
    supabase: { from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
      insert: () => Object.assign(Promise.resolve(backend.result), {
        select: () => ({ single: async () => backend.result }),
      }),
    }) },
  }),
  rethrowIfRedirectError: (error: unknown) => {
    if (error instanceof Error && error.message.startsWith("NEXT_REDIRECT:")) throw error;
  },
  revalidatePriceLogCaches: vi.fn(), revalidateSharedItems: vi.fn(), revalidateSharedStores: vi.fn(),
  toActionState: (error: Error) => ({ message: error.message, status: "error" }),
}));

function storeForm(returnTo = "prices-new") {
  const form = new FormData();
  for (const [key, value] of Object.entries({
    addressText: "New location", chainName: "", name: "Same Market", notes: "",
    returnTo, storeKind: "online", storeUrl: "https://example.com/new-location",
  })) form.set(key, value);
  return form;
}

describe("create store return", () => {
  beforeEach(() => { backend.result = { data: { id: "created-location-id" }, error: null }; });

  it("returns the inserted record ID to price entry rather than the non-unique name", async () => {
    await expect(createStoreAction({ message: "", status: "idle" }, storeForm()))
      .rejects.toThrow("NEXT_REDIRECT:/prices/new?prefillStoreId=created-location-id");
  });

  it("keeps ordinary store creation returning to the directory", async () => {
    await expect(createStoreAction({ message: "", status: "idle" }, storeForm("")))
      .rejects.toThrow("NEXT_REDIRECT:/stores");
  });

  it("shows insertion failures without redirecting", async () => {
    backend.result = { data: null, error: { message: "Insert denied" } };
    expect(await createStoreAction({ message: "", status: "idle" }, storeForm()))
      .toEqual({ message: "Insert denied", status: "error" });
  });

  it("does not redirect with an invented identity when no inserted row is returned", async () => {
    backend.result = { data: null, error: null };
    const result = await createStoreAction({ message: "", status: "idle" }, storeForm());
    expect(result.status).toBe("error");
    expect(result.message).toContain("Refresh the store directory");
  });
});
