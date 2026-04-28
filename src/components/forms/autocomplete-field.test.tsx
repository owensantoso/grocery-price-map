import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AutocompleteField } from "./autocomplete-field";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const options = [
  { id: "item-rice", label: "Rice", hint: "Pantry", kindLabel: "Item" },
  { id: "item-milk", label: "Milk", hint: "Dairy", kindLabel: "Item" },
];

beforeEach(() => {
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

describe("AutocompleteField", () => {
  it("connects the combobox to the active listbox option", () => {
    render(<AutocompleteField label="Item" name="itemId" options={options} />);

    const input = screen.getByRole("combobox", { name: "Item" });
    fireEvent.focus(input);

    const riceOption = screen.getByRole("option", { name: /Rice/ });
    expect(input).toHaveAttribute("aria-controls");
    expect(input).toHaveAttribute("aria-activedescendant", riceOption.id);
    expect(riceOption).toHaveAttribute("aria-selected", "false");

    fireEvent.keyDown(input, { key: "ArrowDown" });

    const milkOption = screen.getByRole("option", { name: /Milk/ });
    expect(input).toHaveAttribute("aria-activedescendant", milkOption.id);
  });

  it("supports keyboard activation of the create action row", () => {
    const onCreateAction = vi.fn();

    render(
      <AutocompleteField
        createActionLabel="item"
        label="Item"
        name="itemId"
        onCreateAction={onCreateAction}
        options={options}
      />,
    );

    const input = screen.getByRole("combobox", { name: "Item" });
    fireEvent.change(input, { target: { value: "Tofu" } });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onCreateAction).toHaveBeenCalledWith("Tofu");
  });
});
