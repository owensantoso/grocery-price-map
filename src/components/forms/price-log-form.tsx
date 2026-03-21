"use client";

import { useActionState, useMemo, useState } from "react";
import { createPriceLogAction, type ActionState } from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { formatUnitValue } from "@/lib/format";
import { type ItemRecord, type StoreRecord } from "@/lib/models";
import { MEASUREMENT_LABELS, MEASUREMENT_UNITS } from "@/lib/measurements";

const initialState: ActionState = {
  message: "",
  status: "idle",
};

type PriceLogFormProps = {
  disabled?: boolean;
  items: ItemRecord[];
  stores: StoreRecord[];
};

export function PriceLogForm({
  disabled,
  items,
  stores,
}: PriceLogFormProps) {
  const [state, formAction] = useActionState(createPriceLogAction, initialState);
  const [selectedItemId, setSelectedItemId] = useState(items[0]?.id ?? "");

  const selectedItem = useMemo(
    () => items.find((item) => item.id === selectedItemId) ?? items[0] ?? null,
    [items, selectedItemId],
  );

  return (
    <form action={formAction} className="panel panel-muted stack-md">
      <div className="split-header">
        <div className="stack-xs">
          <h2 className="section-title">Log a price observation</h2>
          <p className="muted">
            The app stores the original shelf price and also computes the normalized
            comparison price for ranking.
          </p>
        </div>
        <SubmitButton>Add log</SubmitButton>
      </div>
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
      <div className="form-grid">
        <label className="form-field">
          <span>Store</span>
          <select className="select" disabled={disabled} name="storeId" required>
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
            onChange={(event) => setSelectedItemId(event.target.value)}
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
          <span>Package amount</span>
          <input
            className="input"
            defaultValue="1"
            disabled={disabled}
            min="0.01"
            name="packageAmount"
            required
            step="0.01"
            type="number"
          />
        </label>
        <label className="form-field">
          <span>Package unit</span>
          <select className="select" defaultValue="count" disabled={disabled} name="packageUnit">
            {MEASUREMENT_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {MEASUREMENT_LABELS[unit]}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Total price (JPY)</span>
          <input
            className="input"
            defaultValue="0"
            disabled={disabled}
            min="1"
            name="totalPriceYen"
            required
            step="1"
            type="number"
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
            {formatUnitValue(
              selectedItem.comparison_basis_amount,
              selectedItem.comparison_unit,
            )}
          </strong>
        </div>
      ) : null}
    </form>
  );
}
