"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { startTransition, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AutocompleteField,
  type AutocompleteOption,
} from "@/components/forms/autocomplete-field";
import { PriceLogFeed } from "@/components/logs/price-log-feed";
import { LogPhoto } from "@/components/logs/log-photo";
import {
  formatCurrency,
  formatDate,
  formatPackage,
} from "@/lib/format";
import type { CompareEntry, ItemRecord } from "@/lib/models";
import { getPhotoUrl } from "@/lib/photos";

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
  const router = useRouter();
  const [selectedStoreId, setSelectedStoreId] = useState<string | null>(
    initialStoreId ?? entries[0]?.store.id ?? null,
  );
  const [selectedSearchItemId, setSelectedSearchItemId] = useState(selectedItemId ?? "");
  const selectedSearchItem =
    itemOptions.find((item) => item.id === selectedSearchItemId) ??
    itemOptions.find((item) => item.id === selectedItemId) ??
    null;
  const searchOptions: AutocompleteOption[] = itemOptions.map((item) => ({
    hint:
      item.category && item.category.trim().length > 0
        ? `${item.category} • ${item.comparison_basis_amount}${item.comparison_unit}`
        : `${item.comparison_basis_amount}${item.comparison_unit}`,
    id: item.id,
    label: item.name,
  }));

  const featuredEntry = entries[0] ?? null;
  const selectedEntry =
    entries.find((entry) => entry.store.id === selectedStoreId) ?? featuredEntry;
  const selectedHistoryEntries =
    selectedEntry && selectedEntry.history.length > 0
      ? selectedEntry.history
      : selectedEntry
        ? [
            {
              canEdit: false,
              item: selectedEntry.item,
              log: selectedEntry.latestLog,
              store: selectedEntry.store,
              voteSummary: {
                downvotes: 0,
                score: 0,
                upvotes: 0,
                viewerVote: 0 as const,
              },
            },
          ]
        : [];

  function navigateToItem(itemId: string) {
    startTransition(() => {
      router.replace(`/?item=${itemId}#price-map`);
    });
  }

  return (
    <div className="stack-lg">
      <section className="panel hero hero-card">
        <div className="stack-md">
          <div className="stack-xs">
            <p className="eyebrow">{isDemo ? "Demo compare view" : "Live compare view"}</p>
            <h1 className="hero-title">Where is the cheapest...</h1>
            <p className="hero-copy">
              Choose one canonical item and jump straight to the best recent log.
            </p>
          </div>
          <form
            className="compare-search"
            onSubmit={(event) => {
              event.preventDefault();
              const match = itemOptions.find((item) => item.id === selectedSearchItemId);

              if (!match) {
                return;
              }

              startTransition(() => {
                router.replace(`/?item=${match.id}#price-map`);
              });
            }}
          >
            <div className="compare-search__field">
              <AutocompleteField
                defaultOptionId={selectedItemId ?? undefined}
                label="Item"
                name="itemId"
                onClear={() => setSelectedSearchItemId("")}
                onCommit={(option) => navigateToItem(option.id)}
                onSelect={(option) => setSelectedSearchItemId(option?.id ?? "")}
                options={searchOptions}
                placeholder="Eggs, chicken breast, pork mince..."
                showClearButton
              />
            </div>
            <button className="button button-primary" type="submit">
              Search
            </button>
          </form>
        </div>
        {featuredEntry ? (
          <article className="featured-result panel panel-muted">
            <p className="eyebrow">Best current result</p>
            <Link className="featured-result__price" href={`/logs/${featuredEntry.latestLog.id}`}>
              {formatCurrency(featuredEntry.latestLog.normalized_price_yen)} /{" "}
              {featuredEntry.item.comparison_basis_amount}
              {featuredEntry.item.comparison_unit}
            </Link>
            <a
              className="featured-result__store"
              href={featuredEntry.store.store_url}
              rel="noreferrer"
              target="_blank"
            >
              at {featuredEntry.store.name}
            </a>
            <p className="muted">
              {featuredEntry.store.address_text} • {formatDate(featuredEntry.latestLog.observed_at)}
            </p>
          </article>
        ) : null}
      </section>

      {entries.length === 0 ? (
        <section className="panel empty-state">
          No observations yet for this item. Add a price log once items and stores exist.
        </section>
      ) : (
        <section className="compare-layout">
          <div className="stack-md">
            <section className="panel map-panel stack-sm" id="price-map">
              <div className="split-header">
                <div className="stack-xs">
                  <h2 className="section-title">
                    {selectedSearchItem?.name ?? "Store"} Price Map
                  </h2>
                  <p className="muted">
                    Click a store marker to inspect the corresponding latest log. Your
                    location can appear here too if you allow browser geolocation.
                  </p>
                </div>
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
                    Direct log links for this store and item combination.
                  </p>
                </div>
                <PriceLogFeed
                  disableVoting
                  emptyMessage="No logs yet for this store/item combination."
                  entries={selectedHistoryEntries}
                />
              </section>
            ) : null}
          </div>
          <aside className="panel stack-md">
            <div className="stack-xs">
              <h2 className="section-title">Latest prices by store</h2>
              <p className="list-summary">{entries.length} stores in comparison</p>
            </div>
            <div className="list-rows">
              {entries.map((entry, index) => (
                (() => {
                  const photoPath = entry.latestLog.photo_path;
                  const photoUrl = photoPath ? getPhotoUrl(photoPath) : null;

                  return (
                <article
                  className={`result-card ${
                    entry.store.id === selectedStoreId ? "is-selected" : ""
                  }`}
                  key={entry.store.id}
                >
                  <div className="result-card__lead">
                    <div className="result-card__media">
                      {photoUrl ? (
                        <LogPhoto
                          alt={`${entry.item.name} photo from ${entry.store.name}`}
                          className="log-photo log-photo--square"
                          src={photoUrl}
                        />
                      ) : (
                        <div
                          aria-hidden="true"
                          className="log-photo log-photo--square log-photo--placeholder"
                        />
                      )}
                    </div>
                    <div className="result-card__top">
                      <div className="stack-xs">
                        <Link className="store-link" href={`/stores/${entry.store.id}`}>
                          {index + 1}. {entry.store.name}
                        </Link>
                        <span className="muted">{entry.store.address_text}</span>
                      </div>
                      <Link className="price-pill" href={`/logs/${entry.latestLog.id}`}>
                        {formatCurrency(entry.latestLog.normalized_price_yen)} /{" "}
                        {entry.item.comparison_basis_amount}
                        {entry.item.comparison_unit}
                      </Link>
                    </div>
                  </div>
                  <div className="meta-row">
                    <span className="tag">paid {formatCurrency(entry.latestLog.total_price_yen)}</span>
                    <span className="tag">
                      {formatPackage(entry.latestLog.package_amount, entry.latestLog.package_unit)}
                    </span>
                    <span className="tag">{formatDate(entry.latestLog.observed_at)}</span>
                  </div>
                  <div className="result-card__actions">
                    <button
                      className="button-inline"
                      onClick={() => setSelectedStoreId(entry.store.id)}
                      type="button"
                    >
                      Show on map
                    </button>
                    {entry.latestLog.listing_url ? (
                      <a
                        className="button-inline"
                        href={entry.latestLog.listing_url}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Item listing
                      </a>
                    ) : null}
                  </div>
                </article>
                  );
                })()
              ))}
            </div>
          </aside>
        </section>
      )}
    </div>
  );
}
