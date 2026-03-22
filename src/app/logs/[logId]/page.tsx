import Link from "next/link";
import { notFound } from "next/navigation";
import { CommentThread } from "@/components/comments/comment-thread";
import { PriceLogFeed } from "@/components/logs/price-log-feed";
import { LogVoteControls } from "@/components/logs/log-vote-controls";
import { LogPhoto } from "@/components/logs/log-photo";
import { formatCurrency, formatDate, formatPackage } from "@/lib/format";
import { getPhotoUrl } from "@/lib/photos";
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

  const photoUrl = getPhotoUrl(detail.log.photo_path);

  return (
    <div className="stack-lg">
      <section className="panel hero hero-card log-hero">
        <div className="log-hero__vote">
          <LogVoteControls
            disabled={!detail.viewer}
            key={`${detail.log.id}:${detail.voteSummary.score}:${detail.voteSummary.viewerVote}`}
            logId={detail.log.id}
            showBreakdown={false}
            summary={detail.voteSummary}
          />
        </div>
        <div className="stack-sm log-hero__main">
          <p className="eyebrow">Item log</p>
          <h1 className="hero-title">{detail.item.name}</h1>
          <p className="hero-title hero-title--subtle">
            {formatCurrency(detail.log.normalized_price_yen)} /{" "}
            {detail.item.comparison_basis_amount}
            {detail.item.comparison_unit}
          </p>
          <div className="stack-xs">
            <Link className="store-link" href={`/stores/${detail.store.id}`}>
              {detail.store.name}
            </Link>
            <p className="muted">{detail.store.address_text}</p>
          </div>
          {photoUrl ? (
            <LogPhoto
              alt={`${detail.item.name} price log photo`}
              className="log-photo--hero"
              src={photoUrl}
            />
          ) : (
            <div className="photo-placeholder">
              <span className="eyebrow">Photo placeholder</span>
              <p className="muted">
                Log photos will appear here once a submission includes one.
              </p>
            </div>
          )}
        </div>
        <div className="featured-result panel panel-muted current-log-panel log-hero__side">
          <div className="current-log-panel__content stack-sm">
            <p className="eyebrow">Current log</p>
            <p className="muted">
              paid {formatCurrency(detail.log.total_price_yen)} • ex tax{" "}
              {formatCurrency(detail.log.price_tax_excluded_yen)}
            </p>
            <p className="muted">
              {formatPackage(detail.log.package_amount, detail.log.package_unit)} •{" "}
              {formatDate(detail.log.observed_at)}
            </p>
            <p className="field-help">
              {detail.voteSummary.upvotes} up / {detail.voteSummary.downvotes} down
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
            {!detail.viewer ? <p className="field-help">Sign in to vote or comment.</p> : null}
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
        <PriceLogFeed
          disableVoting={!detail.viewer}
          emptyMessage="No logs yet at this store."
          entries={detail.sameStoreHistory}
        />
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
                  <Link className="store-link" href={`/stores/${entry.store.id}`}>
                    {entry.store.name}
                  </Link>
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

      <CommentThread canInteract={Boolean(detail.viewer)} comments={detail.comments} logId={detail.log.id} />

      <section className="panel stack-md">
        <div className="stack-xs">
          <h2 className="section-title">Recent logs for this item</h2>
          <p className="muted">
            All submitted logs for {detail.item.name}, sorted by recency.
          </p>
        </div>
        <PriceLogFeed
          disableVoting={!detail.viewer}
          emptyMessage={`No logs yet for ${detail.item.name}.`}
          entries={detail.recentItemLogs}
        />
      </section>
    </div>
  );
}
