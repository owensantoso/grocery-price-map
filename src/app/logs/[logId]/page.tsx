import Link from "next/link";
import { notFound } from "next/navigation";
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
          <h1 className="hero-title">
            {formatCurrency(detail.log.normalized_price_yen)} /{" "}
            {detail.item.comparison_basis_amount}
            {detail.item.comparison_unit}
          </h1>
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
        <div className="featured-result panel panel-muted">
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
                  <strong>
                    {formatCurrency(log.normalized_price_yen)} /{" "}
                    {detail.item.comparison_basis_amount}
                    {detail.item.comparison_unit}
                  </strong>
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
                  {formatCurrency(entry.latestLog.normalized_price_yen)}
                </Link>
              </article>
            ))}
          </div>
        </aside>
      </section>
    </div>
  );
}
