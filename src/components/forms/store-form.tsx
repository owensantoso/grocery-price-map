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

function parseCoordinateInput(value: string) {
  if (value.trim() === "") {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return parsed;
}

function formatCoordinate(value: number | null) {
  return value === null ? "" : String(value);
}

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
      {storeKind === "physical" ? (
        <div className="stack-sm">
          <div className="form-grid">
            <label className="form-field">
              <span>Latitude</span>
              <input
                aria-describedby={
                  state.fieldErrors?.latitude?.[0] ? "store-latitude-error" : undefined
                }
                aria-invalid={state.fieldErrors?.latitude?.[0] ? true : undefined}
                className="input"
                disabled={disabled}
                inputMode="decimal"
                max={90}
                min={-90}
                name="latitude"
                onChange={(event) => {
                  setLocation((current) => ({
                    latitude: parseCoordinateInput(event.target.value),
                    longitude: current.longitude,
                  }));
                }}
                placeholder="35.6895"
                required
                step="0.000001"
                type="number"
                value={formatCoordinate(location.latitude)}
              />
              {state.fieldErrors?.latitude?.[0] ? (
                <span className="field-error" id="store-latitude-error">
                  {state.fieldErrors.latitude[0]}
                </span>
              ) : null}
            </label>
            <label className="form-field">
              <span>Longitude</span>
              <input
                aria-describedby={
                  state.fieldErrors?.longitude?.[0] ? "store-longitude-error" : undefined
                }
                aria-invalid={state.fieldErrors?.longitude?.[0] ? true : undefined}
                className="input"
                disabled={disabled}
                inputMode="decimal"
                max={180}
                min={-180}
                name="longitude"
                onChange={(event) => {
                  setLocation((current) => ({
                    latitude: current.latitude,
                    longitude: parseCoordinateInput(event.target.value),
                  }));
                }}
                placeholder="139.6917"
                required
                step="0.000001"
                type="number"
                value={formatCoordinate(location.longitude)}
              />
              {state.fieldErrors?.longitude?.[0] ? (
                <span className="field-error" id="store-longitude-error">
                  {state.fieldErrors.longitude[0]}
                </span>
              ) : null}
            </label>
          </div>
          <DynamicLocationPicker
            latitude={location.latitude}
            longitude={location.longitude}
            onChange={setLocation}
          />
          <p className="field-help">
            {location.latitude !== null && location.longitude !== null
              ? `Pinned at ${location.latitude}, ${location.longitude}`
              : "No coordinates yet. Enter latitude and longitude, or click anywhere on the map to place the store."}
          </p>
        </div>
      ) : (
        <>
          <input name="latitude" type="hidden" value="" />
          <input name="longitude" type="hidden" value="" />
        </>
      )}
      <SubmitButton block>Add store</SubmitButton>
    </form>
  );
}
