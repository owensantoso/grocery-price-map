"use client";

import { useActionState, useState } from "react";
import { createPriceLogAction, type ActionState } from "@/app/actions";
import {
  AutocompleteField,
  type AutocompleteOption,
} from "@/components/forms/autocomplete-field";
import { SubmitButton } from "@/components/forms/submit-button";
import { type ItemRecord, type PriceLogRecord, type StoreRecord } from "@/lib/models";
import { excludedFromIncluded, includedFromExcluded } from "@/lib/pricing";

const initialState: ActionState = {
  message: "",
  status: "idle",
};

type PriceLogFormProps = {
  disabled?: boolean;
  initialLog?: PriceLogRecord | null;
  items: ItemRecord[];
  stores: StoreRecord[];
  submitAction?: (
    state: ActionState,
    payload: FormData,
  ) => Promise<ActionState>;
  submitLabel?: string;
  title?: string;
};

function stringifyNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function PriceLogForm({
  disabled,
  initialLog,
  items,
  stores,
  submitAction = createPriceLogAction,
  submitLabel = "Add log",
  title = "Log a price observation",
}: PriceLogFormProps) {
  const [state, formAction] = useActionState(submitAction, initialState);
  const [selectedItemId, setSelectedItemId] = useState(initialLog?.item_id ?? items[0]?.id ?? "");
  const [selectedStoreId, setSelectedStoreId] = useState(initialLog?.store_id ?? stores[0]?.id ?? "");
  const [priceIncluded, setPriceIncluded] = useState(
    initialLog ? stringifyNumber(initialLog.total_price_yen) : "",
  );
  const [priceExcluded, setPriceExcluded] = useState(
    initialLog ? stringifyNumber(initialLog.price_tax_excluded_yen) : "",
  );
  const [packageAmount, setPackageAmount] = useState(
    initialLog
      ? stringifyNumber(initialLog.package_amount)
      : items[0]
        ? stringifyNumber(items[0].comparison_basis_amount)
        : "",
  );

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ??
    items.find((item) => item.id === initialLog?.item_id) ??
    items[0] ??
    null;
  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ??
    stores.find((store) => store.id === initialLog?.store_id) ??
    stores[0] ??
    null;
  const itemOptions: AutocompleteOption[] = items.map((item) => ({
    hint:
      item.category && item.category.trim().length > 0
        ? `${item.category} • ${item.comparison_basis_amount}${item.comparison_unit}`
        : `${item.comparison_basis_amount}${item.comparison_unit}`,
    id: item.id,
    label: item.name,
  }));
  const storeOptions: AutocompleteOption[] = stores.map((store) => ({
    hint: store.address_text,
    id: store.id,
    label: store.name,
  }));

  return (
    <form action={formAction} className="panel panel-muted stack-md">
      <div className="stack-xs">
        <h2 className="section-title">{title}</h2>
        <p className="muted">
          Enter either tax-included or tax-excluded price. The other field updates
          using a 10% tax assumption.
        </p>
      </div>
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
      <div className="form-grid">
        <AutocompleteField
          defaultOptionId={selectedStore?.id}
          disabled={disabled}
          error={state.fieldErrors?.storeId?.[0]}
          label="Store"
          name="storeId"
          onSelect={(option) => setSelectedStoreId(option?.id ?? "")}
          options={storeOptions}
          placeholder="Search or choose a saved store"
        />
        <AutocompleteField
          defaultOptionId={selectedItem?.id}
          disabled={disabled}
          error={state.fieldErrors?.itemId?.[0]}
          label="Item"
          name="itemId"
          onSelect={(option) => {
            const nextItem =
              items.find((item) => item.id === option?.id) ?? items[0] ?? null;
            setSelectedItemId(option?.id ?? "");

            if (nextItem) {
              setPackageAmount(stringifyNumber(nextItem.comparison_basis_amount));
            }
          }}
          options={itemOptions}
          placeholder="Search or choose a canonical item"
        />
        <label className="form-field">
          <span>
            Package amount{selectedItem ? ` (${selectedItem.comparison_unit})` : ""}
          </span>
          <input
            className="input"
            disabled={disabled}
            min="0.01"
            name="packageAmount"
            onChange={(event) => setPackageAmount(event.target.value)}
            required
            step="0.01"
            type="number"
            value={packageAmount}
          />
          {state.fieldErrors?.packageAmount?.[0] ? (
            <span className="field-error">{state.fieldErrors.packageAmount[0]}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span>Observed date</span>
          <input
            className="input"
            defaultValue={initialLog?.observed_at ?? new Date().toISOString().slice(0, 10)}
            disabled={disabled}
            name="observedAt"
            required
            type="date"
          />
        </label>
        <label className="form-field">
          <span>Tax included price (JPY)</span>
          <div className="input-prefix">
            <span className="input-prefix__label">¥</span>
            <input
              className="input input-prefix__control"
              disabled={disabled}
              inputMode="numeric"
              min="0"
              name="totalPriceYen"
              onChange={(event) => {
                const nextValue = event.target.value;
                setPriceIncluded(nextValue);

                if (nextValue === "") {
                  setPriceExcluded("");
                  return;
                }

                setPriceExcluded(
                  stringifyNumber(excludedFromIncluded(Number(nextValue))),
                );
              }}
              required
              step="1"
              type="number"
              value={priceIncluded}
            />
          </div>
        </label>
        <label className="form-field">
          <span>Tax excluded price (JPY)</span>
          <div className="input-prefix">
            <span className="input-prefix__label">¥</span>
            <input
              className="input input-prefix__control"
              disabled={disabled}
              inputMode="numeric"
              min="0"
              name="priceTaxExcludedYen"
              onChange={(event) => {
                const nextValue = event.target.value;
                setPriceExcluded(nextValue);

                if (nextValue === "") {
                  setPriceIncluded("");
                  return;
                }

                setPriceIncluded(
                  stringifyNumber(includedFromExcluded(Number(nextValue))),
                );
              }}
              required
              step="1"
              type="number"
              value={priceExcluded}
            />
          </div>
        </label>
        <label className="form-field form-field--wide">
          <span>Item listing URL (optional)</span>
          <input
            className="input"
            defaultValue={initialLog?.listing_url ?? ""}
            disabled={disabled}
            name="listingUrl"
            placeholder="Useful for online stores or recurring product pages"
            type="url"
          />
        </label>
        <label className="form-field form-field--wide">
          <span>Notes</span>
          <textarea
            className="textarea"
            defaultValue={initialLog?.notes ?? ""}
            disabled={disabled}
            name="notes"
            placeholder="Quality notes, promo sticker, carton size, section of the store"
          />
        </label>
      </div>
      {selectedItem ? (
        <div className="banner">
          Normalizing against {selectedItem.name}:{" "}
          <strong>
            {stringifyNumber(selectedItem.comparison_basis_amount)}
            {selectedItem.comparison_unit}
          </strong>
        </div>
      ) : null}
      {selectedStore ? (
        <p className="field-help">
          Selected store link will be attached to this log. Add an item listing URL
          too if this is an online listing.
        </p>
      ) : null}
      <SubmitButton block>{submitLabel}</SubmitButton>
    </form>
  );
}
