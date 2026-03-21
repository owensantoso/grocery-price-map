import Link from "next/link";
import { PriceLogCard } from "@/components/logs/price-log-card";
import { SetupNotice } from "@/components/setup-notice";
import { getPriceLogsSnapshot } from "@/lib/queries";

export default async function LogsPage() {
  const snapshot = await getPriceLogsSnapshot();

  return (
    <div className="stack-lg">
      {!snapshot.isConfigured ? <SetupNotice /> : null}
      {snapshot.isConfigured && !snapshot.viewer ? (
        <section className="panel callout">
          <div className="stack-sm">
            <h1 className="section-title">Sign in to browse shared price logs.</h1>
            <Link className="button button-primary" href="/auth/sign-in">
              Sign in
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="panel hero hero-card">
            <div className="stack-sm">
              <p className="eyebrow">{snapshot.isDemo ? "Demo logs" : "Shared log feed"}</p>
              <h1 className="hero-title">All recent grocery logs</h1>
              <p className="hero-copy">
                Browse every submitted observation by recency, then jump into the full
                log or open the store directly.
              </p>
            </div>
            <div className="featured-result panel panel-muted">
              <p className="eyebrow">Your activity</p>
              <strong className="hero-title" style={{ fontSize: "2rem" }}>
                {snapshot.ownLogs.length}
              </strong>
              <p className="muted">logs submitted by you</p>
              <Link className="button button-primary" href="/prices/new">
                Add another log
              </Link>
            </div>
          </section>

          <section className="compare-layout">
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
                    <PriceLogCard entry={entry} key={entry.log.id} />
                  ))}
                </div>
              )}
            </section>
            <aside className="panel stack-md">
              <div className="stack-xs">
                <h2 className="section-title">Your logs</h2>
                <p className="muted">Owner-only editing lives here and on each log page.</p>
              </div>
              {snapshot.ownLogs.length === 0 ? (
                <div className="empty-state">
                  You have not submitted any logs yet.
                </div>
              ) : (
                <div className="list-rows">
                  {snapshot.ownLogs.map((entry) => (
                    <PriceLogCard entry={entry} key={entry.log.id} showEditLink />
                  ))}
                </div>
              )}
            </aside>
          </section>
        </>
      )}
    </div>
  );
}
