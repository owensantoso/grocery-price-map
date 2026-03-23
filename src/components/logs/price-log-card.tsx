import Link from "next/link";
import { LogVoteControls } from "@/components/logs/log-vote-controls";
import { LogPhoto } from "@/components/logs/log-photo";
import { formatCurrency, formatDate, formatPackage } from "@/lib/format";
import type { PriceLogListEntry } from "@/lib/models";
import { getPhotoUrl } from "@/lib/photos";

type PriceLogCardProps = {
  disableVoting?: boolean;
  entry: PriceLogListEntry;
  showEditLink?: boolean;
};

export function PriceLogCard({
  disableVoting,
  entry,
  showEditLink,
}: PriceLogCardProps) {
  const photoUrl = getPhotoUrl(entry.log.photo_path);
  const storeHref = `/stores/${entry.store.id}`;
  const fullLogHref = `/logs/${entry.log.id}`;
  const hasActions = (showEditLink && entry.canEdit) || Boolean(entry.log.listing_url);
  const title = `${entry.item.name}: ${formatPackage(
    entry.log.package_amount,
    entry.log.package_unit,
  )} for ${formatCurrency(entry.log.total_price_yen)}`;

  return (
    <article className="result-card log-card">
      <div className="log-card__vote">
        <LogVoteControls
          compact
          disabled={disableVoting}
          key={`${entry.log.id}:${entry.voteSummary.score}:${entry.voteSummary.viewerVote}`}
          logId={entry.log.id}
          summary={entry.voteSummary}
        />
      </div>
      <div className="result-card__media log-card__media">
        {photoUrl ? (
          <LogPhoto
            alt={`${entry.item.name} price log photo`}
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
      <div className="log-card__content stack-sm">
        <div className="stack-xs">
          <Link className="store-link log-card__title" href={fullLogHref} prefetch>
            {title}
          </Link>
          <Link className="muted log-card__subtitle-link" href={storeHref} prefetch>
            {entry.store.name}
          </Link>
          <div className="muted log-card__subtitle">
            <span>{formatDate(entry.log.observed_at)}</span>
          </div>
        </div>
        {hasActions ? (
          <div className="result-card__actions">
            {showEditLink && entry.canEdit ? (
              <Link className="button-inline" href={`/logs/${entry.log.id}/edit`} prefetch>
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
        ) : null}
      </div>
    </article>
  );
}
