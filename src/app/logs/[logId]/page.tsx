import Link from "next/link";
import { notFound } from "next/navigation";
import { LogVoteControls } from "@/components/logs/log-vote-controls";
import { formatCurrency, formatDate, formatPackage } from "@/lib/format";
import { getPriceLogDetail } from "@/lib/queries";

type PageProps = {
  params: Promise<{
    logId: string;
  }>;
};

export default async function LogDetailPage({ params }: PageProps) {
  const { logId } = await params;
  const detail = await getPriceLogDetail(logId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="stack-lg">
      <section className="panel hero hero-card">
        <div className="stack-sm">
          <p className="eyebrow">Item log</p>
          <h1 className="hero-title">{detail.item.name}</h1>
          <p className="hero-title hero-title--subtle">
            {formatCurrency(detail.log.normalized_price_yen)} /{" "}
            {detail.item.comparison_basis_amount}
            {detail.item.comparison_unit}
          </p>
          <div className="stack-xs">
            <a
              className="store-link"
              href={detail.store.store_url}
              rel="noreferrer"
              target="_blank"
            >
              {detail.store.name}
            </a>
            <p className="muted">{detail.store.address_text}</p>
          </div>
        </div>
        <div className="featured-result panel panel-muted current-log-panel">
          <div className="current-log-panel__vote">
            <LogVoteControls
              disabled={false}
              logId={detail.log.id}
              summary={detail.voteSummary}
            />
          </div>
          <div className="current-log-panel__content stack-sm">
            <p className="eyebrow">Current log</p>
            <p className="muted">
              paid {formatCurrency(detail.log.total_price_yen)} • ex tax{" "}
              {formatCurrency(detail.log.price_tax_excluded_yen)}
            </p>
            <p className="muted">
              {formatPackage(detail.log.package_amount, detail.log.package_unit)} • observed{" "}
              {formatDate(detail.log.observed_at)}
            </p>
            {detail.log.notes ? <p>{detail.log.notes}</p> : null}
            <div className="inline-actions">
              {detail.log.listing_url ? (
                <a
                  className="button-inline"
                  href={detail.log.listing_url}
                  rel="noreferrer"
                  target="_blank"
                >
                  Open item listing
                </a>
              ) : null}
              {detail.canEdit ? (
                <Link className="button button-secondary" href={`/logs/${detail.log.id}/edit`}>
                  Edit your log
                </Link>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="compare-layout">
        <div className="panel stack-md">
          <div className="stack-xs">
            <h2 className="section-title">History at this store</h2>
            <p className="muted">
              Every recorded observation for this store and item pair.
            </p>
          </div>
          <div className="history-list">
            {detail.sameStoreHistory.map((log) => (
              <div className="history-row" key={log.id}>
                <div className="stack-xs">
                  <Link className="store-link" href={`/logs/${log.id}`}>
                    {formatCurrency(log.normalized_price_yen)} /{" "}
                    {detail.item.comparison_basis_amount}
                    {detail.item.comparison_unit}
                  </Link>
                  <span className="muted">
                    paid {formatCurrency(log.total_price_yen)} • ex tax{" "}
                    {formatCurrency(log.price_tax_excluded_yen)}
                  </span>
                </div>
                <div className="stack-xs" style={{ alignItems: "flex-end" }}>
                  <span className="tag">{formatPackage(log.package_amount, log.package_unit)}</span>
                  <span className="muted">{formatDate(log.observed_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <aside className="panel stack-md">
          <div className="stack-xs">
            <h2 className="section-title">Latest across stores</h2>
            <p className="muted">
              Jump back into the compare context for the same item.
            </p>
          </div>
          <div className="list-rows">
            {detail.latestAcrossStores.map((entry) => (
              <article className="result-card" key={entry.store.id}>
                <div className="stack-xs">
                  <a
                    className="store-link"
                    href={entry.store.store_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {entry.store.name}
                  </a>
                  <span className="muted">{entry.store.address_text}</span>
                </div>
                <Link className="price-pill" href={`/logs/${entry.latestLog.id}`}>
                  {formatCurrency(entry.latestLog.normalized_price_yen)} /{" "}
                  {entry.item.comparison_basis_amount}
                  {entry.item.comparison_unit}
                </Link>
              </article>
            ))}
          </div>
        </aside>
      </section>

      <section className="panel stack-md">
        <div className="stack-xs">
          <h2 className="section-title">Recent logs for this item</h2>
          <p className="muted">
            All submitted logs for {detail.item.name}, sorted by recency.
          </p>
        </div>
        <div className="list-rows">
          {detail.recentItemLogs.map((entry) => (
            <article className="result-card" key={entry.log.id}>
              <div className="result-card__top">
                <div className="stack-xs">
                  <a
                    className="store-link"
                    href={entry.store.store_url}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {entry.store.name}
                  </a>
                  <span className="muted">{entry.store.address_text}</span>
                </div>
                <Link className="price-pill" href={`/logs/${entry.log.id}`}>
                  {formatCurrency(entry.log.normalized_price_yen)} /{" "}
                  {detail.item.comparison_basis_amount}
                  {detail.item.comparison_unit}
                </Link>
              </div>
              <div className="meta-row">
                <span className="tag">
                  {formatPackage(entry.log.package_amount, entry.log.package_unit)}
                </span>
                <span className="tag">observed {formatDate(entry.log.observed_at)}</span>
                <span className="tag">score {entry.voteSummary.score}</span>
              </div>
              {entry.log.notes ? <p className="muted">{entry.log.notes}</p> : null}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
