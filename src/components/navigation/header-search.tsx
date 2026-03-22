"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AutocompleteField, type AutocompleteOption } from "@/components/forms/autocomplete-field";
import type { ItemRecord, StoreRecord } from "@/lib/models";

type HeaderSearchProps = {
  items: ItemRecord[];
  stores: StoreRecord[];
};

export function HeaderSearch({ items, stores }: HeaderSearchProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  function handleCommit(option: AutocompleteOption) {
    const [kind, id] = option.id.split(":");

    setIsOpen(false);

    if (kind === "store") {
      router.push(`/stores/${id}`);
      return;
    }

    router.push(`/?item=${id}#price-map`);
  }

  return (
    <div className={`header-search ${isOpen ? "is-open" : ""}`} ref={rootRef}>
      <button
        aria-expanded={isOpen}
        className="header-search__toggle"
        onClick={() => setIsOpen((current) => !current)}
        type="button"
      >
        <span aria-hidden="true">⌕</span>
        <span>Search</span>
      </button>
      <div className="header-search__panel">
        <div className="header-search__field">
          <span aria-hidden="true" className="header-search__icon">
            ⌕
          </span>
          <AutocompleteField
            label="Search"
            name="globalSearch"
            onCommit={handleCommit}
            options={options}
            placeholder="Search stores or items..."
            showClearButton
          />
        </div>
      </div>
    </div>
  );
}
