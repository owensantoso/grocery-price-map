"use client";

import { useRouter } from "next/navigation";
import { AutocompleteField, type AutocompleteOption } from "@/components/forms/autocomplete-field";
import type { ItemRecord, StoreRecord } from "@/lib/models";

type HeaderSearchProps = {
  items: ItemRecord[];
  stores: StoreRecord[];
};

export function HeaderSearch({ items, stores }: HeaderSearchProps) {
  const router = useRouter();

  const options: AutocompleteOption[] = [
    ...stores.map((store) => ({
      hint: store.address_text,
      id: `store:${store.id}`,
      kind: "store" as const,
      kindLabel: "Store",
      label: store.name,
    })),
    ...items.map((item) => ({
      hint: item.category
        ? `${item.category} • ${item.comparison_basis_amount}${item.comparison_unit}`
        : `${item.comparison_basis_amount}${item.comparison_unit}`,
      id: `item:${item.id}`,
      kind: "item" as const,
      kindLabel: "Item",
      label: item.name,
    })),
  ];

  return (
    <div className="header-search">
      <AutocompleteField
        label="Search"
        name="globalSearch"
        onCommit={(option) => {
          const [kind, id] = option.id.split(":");

          if (kind === "store") {
            router.push(`/stores/${id}`);
            return;
          }

          router.push(`/?item=${id}#price-map`);
        }}
        options={options}
        placeholder="Search stores or items..."
        showClearButton
      />
    </div>
  );
}
