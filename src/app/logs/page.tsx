import Link from "next/link";
import { PriceLogFeed } from "@/components/logs/price-log-feed";
import { LogSortControl } from "@/components/logs/log-sort-control";
import { SetupNotice } from "@/components/setup-notice";
import { getPriceLogsSnapshot, type PriceLogSort } from "@/lib/queries";

const SORT_OPTIONS: Array<{ label: string; value: PriceLogSort }> = [
  { label: "Most recent", value: "recent" },
  { label: "Oldest first", value: "oldest" },
  { label: "Most upvoted", value: "upvoted" },
  { label: "Most downvoted", value: "downvoted" },
  { label: "Cheapest", value: "cheapest" },
  { label: "Most expensive", value: "expensive" },
];

type LogsPageProps = {
  searchParams?: Promise<{
    sort?: PriceLogSort;
  }>;
};

export default async function LogsPage({ searchParams }: LogsPageProps) {
  const params = (await searchParams) ?? {};
  const selectedSort = SORT_OPTIONS.some((option) => option.value === params.sort)
    ? (params.sort as PriceLogSort)
    : "recent";
  const snapshot = await getPriceLogsSnapshot(selectedSort);

  return (
    <div className="stack-lg">
      {!snapshot.isConfigured ? <SetupNotice /> : null}
      <>
        <section className="panel hero hero-card">
          <div className="stack-sm">
            <p className="eyebrow">{snapshot.isDemo ? "Demo logs" : "Shared log feed"}</p>
            <h1 className="hero-title">All recent grocery logs</h1>
            <p className="hero-copy">
              Browse every submitted observation by recency, then jump into the full
              log or open the store directly.
            </p>
            {!snapshot.viewer && snapshot.isConfigured ? (
              <div className="inline-actions">
                <Link className="button button-primary" href="/auth/sign-in">
                  Sign in to add, comment, or vote
                </Link>
              </div>
            ) : null}
          </div>
        </section>

        <section className="panel stack-md">
          <div className="split-header">
            <div className="stack-xs">
              <h2 className="section-title">All logs</h2>
              <p className="muted">Browse the shared feed in whatever order is most useful.</p>
            </div>
            <LogSortControl options={SORT_OPTIONS} selectedSort={selectedSort} />
          </div>
          <PriceLogFeed
            disableVoting={!snapshot.viewer}
            emptyMessage="No logs exist yet. Add one after creating items and stores."
            entries={snapshot.allLogs}
          />
        </section>
      </>
    </div>
  );
}
