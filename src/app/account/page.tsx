import Link from "next/link";
import { PriceLogFeed } from "@/components/logs/price-log-feed";
import { SetupNotice } from "@/components/setup-notice";
import { getPriceLogsSnapshot } from "@/lib/queries";

export default async function AccountPage() {
  const snapshot = await getPriceLogsSnapshot();

  return (
    <div className="stack-lg">
      {!snapshot.isConfigured ? <SetupNotice /> : null}
      {snapshot.isConfigured && !snapshot.viewer ? (
        <section className="panel callout">
          <div className="stack-sm">
            <h1 className="section-title">Sign in to view your account activity.</h1>
            <Link className="button button-primary" href="/auth/sign-in">
              Sign in
            </Link>
          </div>
        </section>
      ) : (
        <>
          <section className="panel hero hero-card">
            <div className="stack-sm">
              <p className="eyebrow">Account</p>
              <h1 className="hero-title">{snapshot.viewer?.email}</h1>
              <p className="hero-copy">
                Your own submitted logs live here, separate from the public shared feed.
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

          <section className="panel stack-md">
            <div className="stack-xs">
              <h2 className="section-title">Your logs</h2>
              <p className="muted">Owner-only editing lives here and on each log page.</p>
            </div>
            <PriceLogFeed
              emptyMessage="You have not submitted any logs yet."
              entries={snapshot.ownLogs}
              showEditLink
            />
          </section>
        </>
      )}
    </div>
  );
}
