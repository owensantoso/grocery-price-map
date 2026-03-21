"use client";

import { useActionState } from "react";
import { createItemAction, type ActionState } from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";
import { CANONICAL_ITEM_UNITS, MEASUREMENT_LABELS } from "@/lib/measurements";

const initialState: ActionState = {
  message: "",
  status: "idle",
};

export function ItemForm({ disabled }: { disabled?: boolean }) {
  const [state, formAction] = useActionState(createItemAction, initialState);

  return (
    <form action={formAction} className="panel panel-muted stack-md">
      <div className="stack-xs">
        <h2 className="section-title">Add a canonical item</h2>
        <p className="muted">
          Keep units simple in v1. New items normalize by `count`, `g`, or `ml`.
        </p>
      </div>
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
      <div className="form-grid">
        <label className="form-field">
          <span>Name</span>
          <input className="input" disabled={disabled} name="name" required />
          {state.fieldErrors?.name?.[0] ? (
            <span className="field-error">{state.fieldErrors.name[0]}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span>Category</span>
          <input
            className="input"
            disabled={disabled}
            name="category"
            placeholder="Protein, Produce, Dairy"
          />
        </label>
        <label className="form-field">
          <span>Normalization unit</span>
          <select className="select" defaultValue="count" disabled={disabled} name="comparisonUnit">
            {CANONICAL_ITEM_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {MEASUREMENT_LABELS[unit]}
              </option>
            ))}
          </select>
        </label>
        <label className="form-field">
          <span>Normalization amount</span>
          <input
            className="input"
            defaultValue="1"
            disabled={disabled}
            min="0.01"
            name="comparisonBasisAmount"
            required
            step="0.01"
            type="number"
          />
          {state.fieldErrors?.comparisonBasisAmount?.[0] ? (
            <span className="field-error">
              {state.fieldErrors.comparisonBasisAmount[0]}
            </span>
          ) : null}
        </label>
      </div>
      <SubmitButton block>Add item</SubmitButton>
    </form>
  );
}
