"use client";

import { useActionState, useState } from "react";
import { createPriceLogAction, type ActionState } from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { type ItemRecord, type StoreRecord } from "@/lib/models";
import { excludedFromIncluded, includedFromExcluded } from "@/lib/pricing";

const initialState: ActionState = {
  message: "",
  status: "idle",
};

type PriceLogFormProps = {
  disabled?: boolean;
  items: ItemRecord[];
  stores: StoreRecord[];
};

function stringifyNumber(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function PriceLogForm({
  disabled,
  items,
  stores,
}: PriceLogFormProps) {
  const [state, formAction] = useActionState(createPriceLogAction, initialState);
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");
  const [selectedStoreId, setSelectedStoreId] = useState(stores[0]?.id ?? "");
  const [priceIncluded, setPriceIncluded] = useState("");
  const [priceExcluded, setPriceExcluded] = useState("");
  const [packageAmount, setPackageAmount] = useState(
    items[0] ? stringifyNumber(items[0].comparison_basis_amount) : "",
  );

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ?? items[0] ?? null;
  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ?? stores[0] ?? null;

  return (
    <form action={formAction} className="panel panel-muted stack-md">
      <div className="stack-xs">
        <h2 className="section-title">Log a price observation</h2>
        <p className="muted">
          Enter either tax-included or tax-excluded price. The other field updates
          using a 10% tax assumption.
        </p>
      </div>
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
      <div className="form-grid">
        <label className="form-field">
          <span>Store</span>
          <select
            className="select"
            disabled={disabled}
            name="storeId"
            onChange={(event) => setSelectedStoreId(event.target.value)}
            required
            value={selectedStoreId}
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Item</span>
          <select
            className="select"
            disabled={disabled}
            name="itemId"
            onChange={(event) => {
              const nextItem =
                items.find((item) => item.id === event.target.value) ?? items[0] ?? null;
              setSelectedItemId(event.target.value);

              if (nextItem) {
                setPackageAmount(stringifyNumber(nextItem.comparison_basis_amount));
              }
            }}
            required
            value={selectedItemId}
          >
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
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
        </label>
        <label className="form-field">
          <span>Observed date</span>
          <input
            className="input"
            defaultValue={new Date().toISOString().slice(0, 10)}
            disabled={disabled}
            name="observedAt"
            required
            type="date"
          />
        </label>
        <label className="form-field">
          <span>Tax included price (actual paid)</span>
          <input
            className="input"
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
        </label>
        <label className="form-field">
          <span>Tax excluded price</span>
          <input
            className="input"
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
        </label>
        <label className="form-field form-field--wide">
          <span>Item listing URL (optional)</span>
          <input
            className="input"
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
      <SubmitButton block>Add log</SubmitButton>
    </form>
  );
}
