import Link from "next/link";
import { CompareDashboard } from "@/components/compare/compare-dashboard";
import { SetupNotice } from "@/components/setup-notice";
import { getComparisonSnapshot } from "@/lib/queries";

type PageProps = {
  searchParams?: Promise<{
    item?: string;
    store?: string;
  }>;
};

export default async function Home({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const snapshot = await getComparisonSnapshot(params.item);

  return (
    <div className="stack-lg">
      {!snapshot.isConfigured ? <SetupNotice /> : null}
      {!snapshot.viewer && snapshot.isConfigured ? (
        <section className="panel callout">
          <div className="stack-sm">
            <p className="eyebrow">Sign In Required</p>
            <h1 className="section-title">Compare prices with your shared data.</h1>
            <p className="muted">
              This project uses Supabase auth, so you need to sign in with Google
              before reading or adding shared prices.
            </p>
            <div className="inline-actions">
              <Link className="button button-primary" href="/auth/sign-in">
                Continue to sign in
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <CompareDashboard
          key={snapshot.selectedItem?.id ?? "empty"}
          entries={snapshot.entries}
          initialStoreId={params.store ?? snapshot.entries[0]?.store.id ?? null}
          isDemo={snapshot.isDemo}
          itemOptions={snapshot.items}
          selectedItemId={snapshot.selectedItem?.id ?? null}
        />
      )}
    </div>
  );
}
