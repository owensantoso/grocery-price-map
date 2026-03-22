import Link from "next/link";
import { PriceLogFeed } from "@/components/logs/price-log-feed";
import { SetupNotice } from "@/components/setup-notice";
import { getPriceLogsSnapshot } from "@/lib/queries";

export default async function LogsPage() {
  const snapshot = await getPriceLogsSnapshot();

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
          <div className="stack-xs">
            <h2 className="section-title">All logs</h2>
            <p className="muted">Sorted by observed date, newest first.</p>
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
