import Link from "next/link";
import { ItemForm } from "@/components/forms/item-form";
import { SetupNotice } from "@/components/setup-notice";
import { formatUnitValue } from "@/lib/format";
import { getItemsSnapshot } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type ItemsPageProps = {
  searchParams?: Promise<{
    prefillName?: string;
    returnTo?: string;
  }>;
};

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const params = (await searchParams) ?? {};
  const snapshot = await getItemsSnapshot();
  const configured = isSupabaseConfigured();

  return (
    <div className="stack-lg">
      {!configured ? <SetupNotice /> : null}
      {configured && !snapshot.viewer ? (
        <section className="panel callout">
          <div className="stack-sm">
            <h1 className="section-title">Browse canonical items publicly.</h1>
            <p className="muted">
              Sign in if you want to add or manage shared item definitions.
            </p>
            <Link className="button button-primary" href="/auth/sign-in">
              Sign in
            </Link>
          </div>
        </section>
      ) : null}
      {snapshot.viewer ? (
        <ItemForm
          disabled={!configured}
          initialName={params.prefillName ?? ""}
          returnTo={params.returnTo}
        />
      ) : null}
      <section className="panel stack-md">
        <div className="stack-xs">
          <p className="eyebrow">Current item catalog</p>
          <h1 className="section-title">Canonical items and normalization rules</h1>
        </div>
        {snapshot.items.length === 0 ? (
          <div className="empty-state">
            No items exist yet. Create canonical names before logging prices.
          </div>
        ) : (
          <div className="list-table">
            {snapshot.items.map((item) => (
              <div className="list-table__row" key={item.id}>
                <div className="stack-xs">
                  <strong>{item.name}</strong>
                  <span className="muted">{item.category ?? "Uncategorized"}</span>
                </div>
                <div className="stack-xs">
                  <span className="tag">Basis</span>
                  <strong>
                    {formatUnitValue(
                      item.comparison_basis_amount,
                      item.comparison_unit,
                    )}
                  </strong>
                </div>
                <div className="stack-xs">
                  <span className="tag">Owner</span>
                  <span className="muted">Shared catalog</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
