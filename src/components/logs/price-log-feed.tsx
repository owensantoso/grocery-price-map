import { PriceLogCard } from "@/components/logs/price-log-card";
import type { PriceLogListEntry } from "@/lib/models";

type PriceLogFeedProps = {
  disableVoting?: boolean;
  emptyMessage?: string;
  entries: PriceLogListEntry[];
  showEditLink?: boolean;
};

export function PriceLogFeed({
  disableVoting,
  emptyMessage = "No logs yet.",
  entries,
  showEditLink,
}: PriceLogFeedProps) {
  if (entries.length === 0) {
    return <div className="empty-state">{emptyMessage}</div>;
  }

  return (
    <div className="list-rows">
      {entries.map((entry) => (
        <PriceLogCard
          disableVoting={disableVoting}
          entry={entry}
          key={entry.log.id}
          showEditLink={showEditLink}
        />
      ))}
    </div>
  );
}
