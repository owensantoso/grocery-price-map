import Link from "next/link";
import { LogVoteControls } from "@/components/logs/log-vote-controls";
import { formatCurrency, formatDate, formatPackage } from "@/lib/format";
import type { PriceLogListEntry } from "@/lib/models";

type PriceLogCardProps = {
  entry: PriceLogListEntry;
  showEditLink?: boolean;
};

export function PriceLogCard({ entry, showEditLink }: PriceLogCardProps) {
  return (
    <article className="result-card log-card">
      <div className="log-card__vote">
        <LogVoteControls
          compact
          key={`${entry.log.id}:${entry.voteSummary.score}:${entry.voteSummary.viewerVote}`}
          logId={entry.log.id}
          summary={entry.voteSummary}
        />
      </div>
      <div className="log-card__content stack-sm">
        <div className="result-card__top">
          <div className="stack-xs">
            <Link className="store-link" href={`/logs/${entry.log.id}`}>
              {entry.item.name}
            </Link>
            <a
              className="muted"
              href={entry.store.store_url}
              rel="noreferrer"
              target="_blank"
            >
              {entry.store.name}
            </a>
          </div>
          <Link className="price-pill" href={`/logs/${entry.log.id}`}>
            {formatCurrency(entry.log.normalized_price_yen)} /{" "}
            {entry.item.comparison_basis_amount}
            {entry.item.comparison_unit}
          </Link>
        </div>
        <div className="meta-row">
          <span className="tag">
            {formatPackage(entry.log.package_amount, entry.log.package_unit)}
          </span>
          <span className="tag">paid {formatCurrency(entry.log.total_price_yen)}</span>
          <span className="tag">
            ex tax {formatCurrency(entry.log.price_tax_excluded_yen)}
          </span>
          <span className="tag">observed {formatDate(entry.log.observed_at)}</span>
        </div>
        {entry.log.notes ? <p className="muted">{entry.log.notes}</p> : null}
        <div className="result-card__actions">
          <Link className="button-inline" href={`/logs/${entry.log.id}`}>
            Open full log
          </Link>
          {showEditLink && entry.canEdit ? (
            <Link className="button-inline" href={`/logs/${entry.log.id}/edit`}>
              Edit your log
            </Link>
          ) : null}
          {entry.log.listing_url ? (
            <a
              className="button-inline"
              href={entry.log.listing_url}
              rel="noreferrer"
              target="_blank"
            >
              Item listing
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
