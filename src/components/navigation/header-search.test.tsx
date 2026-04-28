import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HeaderSearch } from "./header-search";
import type { ItemRecord, StoreRecord } from "@/lib/models";

const push = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
  useSearchParams: () => new URLSearchParams(),
}));

const items = [
  {
    category: "Pantry",
    comparison_basis_amount: 100,
    comparison_unit: "g",
    id: "rice",
    name: "Rice",
  } as unknown as ItemRecord,
];

const stores = [
  {
    address_text: "Tokyo",
    id: "store-1",
    name: "Market",
  } as unknown as StoreRecord,
];

beforeEach(() => {
  push.mockClear();
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      addListener: vi.fn(),
      matches: false,
      removeEventListener: vi.fn(),
      removeListener: vi.fn(),
    }),
  });
});

describe("HeaderSearch", () => {
  it("closes with Escape and returns focus to the search toggle", async () => {
    render(<HeaderSearch items={items} stores={stores} />);

    const toggle = screen.getByRole("button", { name: "Search" });
    fireEvent.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");

    const input = screen.getByRole("combobox", { name: "Search" });
    await waitFor(() => expect(input).toHaveFocus());

    fireEvent.keyDown(input, { key: "Escape" });

    await waitFor(() => {
      expect(toggle).toHaveAttribute("aria-expanded", "false");
      expect(toggle).toHaveFocus();
    });
  });
});
