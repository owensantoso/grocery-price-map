import Link from "next/link";
import { PriceLogForm } from "@/components/forms/price-log-form";
import { SetupNotice } from "@/components/setup-notice";
import { getPriceEntrySnapshot } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function NewPricePage() {
  const snapshot = await getPriceEntrySnapshot();
  const configured = isSupabaseConfigured();

  return (
    <div className="stack-lg">
      {!configured ? <SetupNotice /> : null}
      {configured && !snapshot.viewer ? (
        <section className="panel callout">
          <div className="stack-sm">
            <h1 className="section-title">Sign in to submit shared price observations.</h1>
            <Link className="button button-primary" href="/auth/sign-in">
              Sign in
            </Link>
          </div>
        </section>
      ) : snapshot.items.length === 0 || snapshot.stores.length === 0 ? (
        <section className="panel callout stack-sm">
          <h1 className="section-title">Add items and stores first.</h1>
          <p className="muted">
            Price logs need both a canonical item and an exact store location.
          </p>
          <div className="inline-actions">
            <Link className="button button-secondary" href="/items">
              Manage items
            </Link>
            <Link className="button button-secondary" href="/stores">
              Manage stores
            </Link>
          </div>
        </section>
      ) : (
        <>
          <PriceLogForm
            disabled={!configured}
            items={snapshot.items}
            stores={snapshot.stores}
          />
        </>
      )}
    </div>
  );
}
