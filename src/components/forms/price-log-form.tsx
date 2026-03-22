"use client";

import { useActionState, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import { createPriceLogAction, type ActionState } from "@/app/actions";
import { useDebugFlag } from "@/components/debug/use-debug-flag";
import {
  AutocompleteField,
  type AutocompleteFieldHandle,
  type AutocompleteOption,
} from "@/components/forms/autocomplete-field";
import { LogPhotoInput } from "@/components/forms/log-photo-input";
import { SubmitButton } from "@/components/forms/submit-button";
import { type ItemRecord, type PriceLogRecord, type StoreRecord } from "@/lib/models";
import { getPhotoUrl } from "@/lib/photos";
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

function sanitizeCurrencyInput(value: string) {
  const stripped = value.replace(/[^\d.]/g, "");
  const [whole = "", ...fractionParts] = stripped.split(".");

  if (fractionParts.length === 0) {
    return whole;
  }

  return `${whole}.${fractionParts.join("")}`;
}

function sanitizeDecimalInput(value: string) {
  return sanitizeCurrencyInput(value);
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
  const router = useRouter();
  const [state, formAction] = useActionState(submitAction, initialState);
  const [selectedItemId, setSelectedItemId] = useState(initialLog?.item_id ?? "");
  const [selectedStoreId, setSelectedStoreId] = useState(initialLog?.store_id ?? "");
  const [priceValue, setPriceValue] = useState(
    initialLog ? stringifyNumber(initialLog.total_price_yen) : "",
  );
  const [priceIncludesTax, setPriceIncludesTax] = useState(true);
  const [packageAmount, setPackageAmount] = useState(
    initialLog
      ? stringifyNumber(initialLog.package_amount)
      : "",
  );
  const debugEnabled = useDebugFlag();
  const storeFieldRef = useRef<AutocompleteFieldHandle | null>(null);
  const itemFieldRef = useRef<AutocompleteFieldHandle | null>(null);
  const packageAmountRef = useRef<HTMLInputElement | null>(null);
  const priceFieldRef = useRef<HTMLInputElement | null>(null);
  const lastAutoFocusTarget = useRef<string | null>(null);

  const selectedItem =
    items.find((item) => item.id === selectedItemId) ??
    items.find((item) => item.id === initialLog?.item_id) ??
    null;
  const selectedStore =
    stores.find((store) => store.id === selectedStoreId) ??
    stores.find((store) => store.id === initialLog?.store_id) ??
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

  function handlePriceChange(nextValue: string) {
    setPriceValue(sanitizeCurrencyInput(nextValue));
  }

  function focusField(
    ref: RefObject<HTMLInputElement | null>,
    targetName: string,
  ) {
    const node = ref.current;

    if (!node) {
      return;
    }

    lastAutoFocusTarget.current = targetName;

    const focusNow = () => {
      node.focus({ preventScroll: true });

      if (typeof node.setSelectionRange === "function") {
        const valueLength = node.value.length;
        node.setSelectionRange(valueLength, valueLength);
      }
    };

    window.requestAnimationFrame(focusNow);
    window.setTimeout(() => {
      if (document.activeElement !== node) {
        focusNow();
      }
    }, 10);
  }

  function advanceOnBlur(
    ref: RefObject<HTMLInputElement | null>,
    targetName: string,
    currentValue: string,
  ) {
    window.requestAnimationFrame(() => {
      const activeElement = document.activeElement;

      if (
        currentValue.trim().length === 0 ||
        lastAutoFocusTarget.current === targetName ||
        (activeElement instanceof HTMLElement &&
          activeElement !== document.body &&
          activeElement.tagName !== "BODY")
      ) {
        lastAutoFocusTarget.current = null;
        return;
      }

      focusField(ref, targetName);
    });
  }

  const parsedPrice =
    priceValue.trim().length > 0 ? Number(priceValue) : null;
  const totalPriceYen =
    parsedPrice === null
      ? ""
      : stringifyNumber(
          priceIncludesTax ? parsedPrice : includedFromExcluded(parsedPrice),
        );
  const priceTaxExcludedYen =
    parsedPrice === null
      ? ""
      : stringifyNumber(
          priceIncludesTax ? excludedFromIncluded(parsedPrice) : parsedPrice,
        );

  return (
    <form action={formAction} className="panel panel-muted stack-md">
      <div className="stack-xs">
        <h2 className="section-title">{title}</h2>
        <p className="muted">
          Enter the shelf price once. The app calculates the tax-adjusted value using
          an 8% tax assumption.
        </p>
      </div>
      {state.status === "error" ? <p className="form-error">{state.message}</p> : null}
      <input name="totalPriceYen" type="hidden" value={totalPriceYen} />
      <input name="priceTaxExcludedYen" type="hidden" value={priceTaxExcludedYen} />
      <section className="form-section stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Core details</p>
          <p className="muted">Pick the store and item, then record the package and price.</p>
        </div>
        <div className="form-grid">
        <AutocompleteField
          createActionLabel="store"
          defaultOptionId={selectedStore?.id ?? undefined}
          disabled={disabled}
          error={state.fieldErrors?.storeId?.[0]}
          label="Store"
          name="storeId"
          onCreateAction={(query) => {
            router.push(`/stores?prefillName=${encodeURIComponent(query)}`);
          }}
          onClear={() => setSelectedStoreId("")}
          onCommit={() => itemFieldRef.current?.focus()}
          onSelect={(option) => setSelectedStoreId(option?.id ?? "")}
          options={storeOptions}
          placeholder="Search or choose a saved store"
          ref={storeFieldRef}
          showClearButton
        />
        <AutocompleteField
          createActionLabel="item"
          defaultOptionId={selectedItem?.id ?? undefined}
          disabled={disabled}
          error={state.fieldErrors?.itemId?.[0]}
          label="Item"
          name="itemId"
          onCreateAction={(query) => {
            router.push(`/items?prefillName=${encodeURIComponent(query)}`);
          }}
          onClear={() => {
            setSelectedItemId("");
            setPackageAmount("");
          }}
          onCommit={() => packageAmountRef.current?.focus()}
          onSelect={(option) => {
            setSelectedItemId(option?.id ?? "");
            setPackageAmount("");
          }}
          options={itemOptions}
          placeholder="Search or choose a canonical item"
          ref={itemFieldRef}
          showClearButton
        />
        <label className="form-field">
          <span>
            Package amount{selectedItem ? ` (${selectedItem.comparison_unit})` : ""}
          </span>
          <input
            className="input"
            disabled={disabled}
            inputMode="decimal"
            name="packageAmount"
            onBlur={() => advanceOnBlur(priceFieldRef, "price", packageAmount)}
            onChange={(event) => setPackageAmount(sanitizeDecimalInput(event.target.value))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                focusField(priceFieldRef, "price");
              }
            }}
            enterKeyHint="next"
            pattern="[0-9]*[.]?[0-9]*"
            placeholder={selectedItem ? `${selectedItem.comparison_basis_amount}` : "e.g. 500"}
            ref={packageAmountRef}
            required
            type="text"
            value={packageAmount}
          />
          {state.fieldErrors?.packageAmount?.[0] ? (
            <span className="field-error">{state.fieldErrors.packageAmount[0]}</span>
          ) : null}
        </label>
        <label className="form-field">
          <span>Price (JPY)</span>
          <div className="input-prefix">
            <span className="input-prefix__label">¥</span>
            <input
              className="input input-prefix__control"
              disabled={disabled}
              inputMode="decimal"
              name="displayPrice"
              onChange={(event) => handlePriceChange(event.target.value)}
              onInput={(event) =>
                handlePriceChange((event.target as HTMLInputElement).value)
              }
              enterKeyHint="next"
              pattern="[0-9]*"
              placeholder="e.g. 328"
              ref={priceFieldRef}
              required
              type="text"
              value={priceValue}
            />
          </div>
          <label className="checkbox-row">
            <input
              checked={priceIncludesTax}
              disabled={disabled}
              onChange={(event) => setPriceIncludesTax(event.target.checked)}
              type="checkbox"
            />
            <span>Tax included?</span>
          </label>
          <p className="field-help">
            {priceValue
              ? priceIncludesTax
                ? `Tax excluded price: ¥${priceTaxExcludedYen}`
                : `Tax included price: ¥${totalPriceYen}`
              : "The tax-adjusted price will appear here."}
          </p>
        </label>
        </div>
      </section>
      <section className="form-section form-section--secondary stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Extras</p>
          <p className="muted">Optional context, links, date, and notes for the log.</p>
        </div>
        <div className="form-grid">
        <LogPhotoInput existingPhotoUrl={getPhotoUrl(initialLog?.photo_path ?? null)} />
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
        <label className="form-field">
          <span>Observed date</span>
          <input
            className="input input-date"
            defaultValue={initialLog?.observed_at ?? new Date().toISOString().slice(0, 10)}
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
            defaultValue={initialLog?.notes ?? ""}
            disabled={disabled}
            name="notes"
            placeholder="Quality notes, promo sticker, carton size, section of the store"
          />
        </label>
        </div>
      </section>
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
      {debugEnabled ? (
        <div className="debug-panel">
          <strong>Price form debug</strong>
          <span>selectedStoreId: {selectedStoreId || "(none)"}</span>
          <span>selectedItemId: {selectedItemId || "(none)"}</span>
          <span>packageAmount: {packageAmount || "(empty)"}</span>
          <span>priceValue: {priceValue || "(empty)"}</span>
          <span>priceIncludesTax: {String(priceIncludesTax)}</span>
          <span>totalPriceYen: {totalPriceYen || "(empty)"}</span>
          <span>priceTaxExcludedYen: {priceTaxExcludedYen || "(empty)"}</span>
        </div>
      ) : null}
      <SubmitButton block>{submitLabel}</SubmitButton>
    </form>
  );
}
