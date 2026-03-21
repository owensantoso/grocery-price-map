"use client";

import dynamic from "next/dynamic";
import { useActionState, useState } from "react";
import { createStoreAction, type ActionState } from "@/app/actions";
import { SubmitButton } from "@/components/forms/submit-button";

const DynamicLocationPicker = dynamic(
  () =>
    import("@/components/map/store-location-picker").then((module) => module.StoreLocationPicker),
  {
    loading: () => <div className="map-canvas" />,
    ssr: false,
  },
);

const initialState: ActionState = {
  message: "",
  status: "idle",
};

export function StoreForm({ disabled }: { disabled?: boolean }) {
  const [state, formAction] = useActionState(createStoreAction, initialState);
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });

  return (
    <form action={formAction} className="panel panel-muted stack-md">
      <div className="split-header">
        <div className="stack-xs">
          <h2 className="section-title">Add a store</h2>
          <p className="muted">
            Stores are exact locations, not just the chain. Click the map to drop
            the pin, then drag to refine it.
          </p>
        </div>
        <SubmitButton>Add store</SubmitButton>
      </div>
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
      <div className="form-grid">
        <label className="form-field">
          <span>Store name</span>
          <input className="input" disabled={disabled} name="name" required />
          {state.fieldErrors?.name?.[0] ? (
            <span className="field-error">{state.fieldErrors.name[0]}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span>Chain name</span>
          <input
            className="input"
            disabled={disabled}
            name="chainName"
            placeholder="Optional"
          />
        </label>
        <label className="form-field form-field--wide">
          <span>Address or landmark</span>
          <input
            className="input"
            disabled={disabled}
            name="addressText"
            placeholder="Nishi-Eifuku, Suginami-ku"
            required
          />
        </label>
        <label className="form-field form-field--wide">
          <span>Notes</span>
          <textarea
            className="textarea"
            disabled={disabled}
            name="notes"
            placeholder="Why this store matters, entrance details, opening hours"
          />
        </label>
      </div>
      <input name="latitude" type="hidden" value={location.latitude ?? ""} />
      <input name="longitude" type="hidden" value={location.longitude ?? ""} />
      <div className="stack-sm">
        <DynamicLocationPicker
          latitude={location.latitude}
          longitude={location.longitude}
          onChange={setLocation}
        />
        <p className="field-help">
          {location.latitude !== null && location.longitude !== null
            ? `Pinned at ${location.latitude}, ${location.longitude}`
            : "No pin yet. Click anywhere on the map to place the store."}
        </p>
        {state.fieldErrors?.latitude?.[0] ? (
          <span className="field-error">{state.fieldErrors.latitude[0]}</span>
        ) : null}
      </div>
    </form>
  );
}
