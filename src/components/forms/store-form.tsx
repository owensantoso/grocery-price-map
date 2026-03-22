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

export function StoreForm({
  disabled,
  initialName = "",
  returnTo,
}: {
  disabled?: boolean;
  initialName?: string;
  returnTo?: string;
}) {
  const [state, formAction] = useActionState(createStoreAction, initialState);
  const [storeKind, setStoreKind] = useState<"physical" | "online">("physical");
  const [location, setLocation] = useState<{ latitude: number | null; longitude: number | null }>({
    latitude: null,
    longitude: null,
  });

  const linkLabel = storeKind === "physical" ? "Google Maps link" : "Store website";

  return (
    <form action={formAction} className="panel panel-muted stack-md">
      <input name="returnTo" type="hidden" value={returnTo ?? ""} />
      <div className="stack-xs">
        <h2 className="section-title">Add a store</h2>
        <p className="muted">
          Use a Google Maps link for physical stores so duplicates are easier to spot.
          Online stores can use their homepage instead.
        </p>
      </div>
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
      <div className="form-grid">
        <label className="form-field">
          <span>Store name</span>
          <input
            className="input"
            defaultValue={initialName}
            disabled={disabled}
            name="name"
            required
          />
          {state.fieldErrors?.name?.[0] ? (
            <span className="field-error">{state.fieldErrors.name[0]}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span>Store type</span>
          <select
            className="select"
            disabled={disabled}
            name="storeKind"
            onChange={(event) => {
              const nextKind = event.target.value as "physical" | "online";
              setStoreKind(nextKind);

              if (nextKind === "online") {
                setLocation({
                  latitude: null,
                  longitude: null,
                });
              }
            }}
            value={storeKind}
          >
            <option value="physical">Physical store</option>
            <option value="online">Online store</option>
          </select>
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
        <label className="form-field">
          <span>{linkLabel}</span>
          <input
            className="input"
            disabled={disabled}
            name="storeUrl"
            placeholder={
              storeKind === "physical"
                ? "https://maps.google.com/..."
                : "https://shop.example.com"
            }
            required
            type="url"
          />
          {state.fieldErrors?.storeUrl?.[0] ? (
            <span className="field-error">{state.fieldErrors.storeUrl[0]}</span>
          ) : null}
        </label>
        <label className="form-field form-field--wide">
          <span>Address or descriptor</span>
          <input
            className="input"
            disabled={disabled}
            name="addressText"
            placeholder={
              storeKind === "physical"
                ? "Nishi-Eifuku, Suginami-ku"
                : "Online store / shipping region"
            }
            required
          />
        </label>
        <label className="form-field form-field--wide">
          <span>Notes</span>
          <textarea
            className="textarea"
            disabled={disabled}
            name="notes"
            placeholder="Why this store matters, special stock notes, online shipping details"
          />
        </label>
      </div>
      <input name="latitude" type="hidden" value={location.latitude ?? ""} />
      <input name="longitude" type="hidden" value={location.longitude ?? ""} />
      {storeKind === "physical" ? (
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
      ) : null}
      <SubmitButton block>Add store</SubmitButton>
    </form>
  );
}
