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
      <CompareDashboard
        key={snapshot.selectedItem?.id ?? "empty"}
        entries={snapshot.entries}
        initialStoreId={params.store ?? snapshot.entries[0]?.store.id ?? null}
        isDemo={snapshot.isDemo}
        itemOptions={snapshot.items}
        selectedItemId={snapshot.selectedItem?.id ?? null}
      />
      {!snapshot.viewer && snapshot.isConfigured ? (
        <section className="panel callout">
          <div className="stack-sm">
            <p className="eyebrow">Read Publicly, Contribute With Sign-In</p>
            <p className="muted">
              You can browse prices without an account. Sign in to add logs, comments,
              and votes.
            </p>
            <div className="inline-actions">
              <Link className="button button-primary" href="/auth/sign-in">
                Sign in to contribute
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
