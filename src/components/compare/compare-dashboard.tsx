"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { formatCurrency, formatDate, formatPackage, formatUnitValue } from "@/lib/format";
import type { CompareEntry, ItemRecord } from "@/lib/models";

const DynamicComparisonMap = dynamic(
  () =>
    import("@/components/compare/comparison-map").then((module) => module.ComparisonMap),
  {
    loading: () => <div className="map-canvas" />,
    ssr: false,
  },
);

type CompareDashboardProps = {
  entries: CompareEntry[];
  initialStoreId: string | null;
  isDemo: boolean;
  itemOptions: ItemRecord[];
  selectedItemId: string | null;
};

export function CompareDashboard({
  entries,
  initialStoreId,
  isDemo,
  itemOptions,
  selectedItemId,
}: CompareDashboardProps) {
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    initialStoreId ?? entries[0]?.store.id ?? null,
  );

  const selectedEntry =
    entries.find((entry) => entry.store.id === selectedStoreId) ?? entries[0] ?? null;

  return (
    <div className="stack-lg">
      <section className="panel hero hero-card">
        <div className="stack-md">
          <div className="stack-xs">
            <p className="eyebrow">{isDemo ? "Demo compare view" : "Live compare view"}</p>
            <h1 className="hero-title">Find the cheapest recent price by exact store.</h1>
            <p className="hero-copy">
              Compare one canonical item at a time, keep the original package
              sizes visible, and use the latest observation per store without losing
              price history.
            </p>
          </div>
          <form className="inline-actions" method="get">
            <label className="form-field">
              <span className="visually-hidden">Choose item</span>
              <select
                className="select"
                defaultValue={selectedItemId ?? ""}
                name="item"
                onChange={(event) => event.currentTarget.form?.requestSubmit()}
              >
                {itemOptions.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          </form>
        </div>
        <div className="hero-grid">
          <div className="stat-tile">
            <strong>{entries.length}</strong>
            <span className="muted">stores in the current comparison</span>
          </div>
          <div className="stat-tile">
            <strong>
              {selectedEntry ? formatCurrency(selectedEntry.latestLog.normalized_price_yen) : "--"}
            </strong>
            <span className="muted">best normalized price right now</span>
          </div>
          <div className="stat-tile">
            <strong>
              {selectedEntry
                ? formatUnitValue(
                    selectedEntry.item.comparison_basis_amount,
                    selectedEntry.item.comparison_unit,
                  )
                : "--"}
            </strong>
            <span className="muted">normalization basis for ranking</span>
          </div>
        </div>
      </section>

      {entries.length === 0 ? (
        <section className="panel empty-state">
          No observations yet for this item. Add a price log once items and stores exist.
        </section>
      ) : (
        <section className="shell-grid">
          <div className="panel stack-md">
            <div className="split-header">
              <div className="stack-xs">
                <h2 className="section-title">Latest prices by store</h2>
                <p className="muted">
                  Ranked by normalized price, then by most recent observation.
                </p>
              </div>
            </div>
            <div className="list-rows">
              {entries.map((entry, index) => (
                <button
                  key={entry.store.id}
                  className={`result-card ${
                    entry.store.id === selectedStoreId ? "is-selected" : ""
                  }`}
                  onClick={() => setSelectedStoreId(entry.store.id)}
                  type="button"
                >
                  <div className="result-card__top">
                    <div className="stack-xs">
                      <strong>
                        {index + 1}. {entry.store.name}
                      </strong>
                      <span className="muted">{entry.store.address_text}</span>
                    </div>
                    <span className="price-pill">
                      {formatCurrency(entry.latestLog.normalized_price_yen)}
                    </span>
                  </div>
                  <div className="meta-row">
                    <span className="tag">
                      shelf {formatCurrency(entry.latestLog.total_price_yen)}
                    </span>
                    <span className="tag">
                      pack {formatPackage(entry.latestLog.package_amount, entry.latestLog.package_unit)}
                    </span>
                    <span className="tag">
                      observed {formatDate(entry.latestLog.observed_at)}
                    </span>
                  </div>
                  {entry.latestLog.notes ? <p className="muted">{entry.latestLog.notes}</p> : null}
                </button>
              ))}
            </div>
          </div>
          <div className="stack-md">
            <section className="panel map-panel stack-sm">
              <div className="stack-xs">
                <h2 className="section-title">Store map</h2>
                <p className="muted">
                  Click a store card or map pin to inspect the same observation.
                </p>
              </div>
              <DynamicComparisonMap
                entries={entries}
                onSelectStore={setSelectedStoreId}
                selectedStoreId={selectedStoreId}
              />
            </section>
            {selectedEntry ? (
              <section className="panel stack-sm">
                <div className="stack-xs">
                  <p className="eyebrow">Selected store history</p>
                  <h2 className="section-title">{selectedEntry.store.name}</h2>
                  <p className="muted">
                    Latest price plus earlier observations for the currently selected
                    item.
                  </p>
                </div>
                <div className="history-list">
                  {selectedEntry.history.map((log) => (
                    <div className="history-row" key={log.id}>
                      <div className="stack-xs">
                        <strong>{formatCurrency(log.total_price_yen)}</strong>
                        <span className="muted">
                          {formatPackage(log.package_amount, log.package_unit)}
                        </span>
                      </div>
                      <div className="stack-xs" style={{ alignItems: "flex-end" }}>
                        <span className="price-pill price-pill--neutral">
                          {formatCurrency(log.normalized_price_yen)}
                        </span>
                        <span className="muted">{formatDate(log.observed_at)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      )}
    </div>
  );
}
