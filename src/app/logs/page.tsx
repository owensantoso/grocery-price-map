import Link from "next/link";
import { PriceLogCard } from "@/components/logs/price-log-card";
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
          {snapshot.allLogs.length === 0 ? (
            <div className="empty-state">
              No logs exist yet. Add one after creating items and stores.
            </div>
          ) : (
            <div className="list-rows">
              {snapshot.allLogs.map((entry) => (
                <PriceLogCard
                  disableVoting={!snapshot.viewer}
                  entry={entry}
                  key={entry.log.id}
                />
              ))}
            </div>
          )}
        </section>
      </>
    </div>
  );
}
