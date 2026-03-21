import Link from "next/link";
import { StoreForm } from "@/components/forms/store-form";
import { SetupNotice } from "@/components/setup-notice";
import { getStoresSnapshot } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export default async function StoresPage() {
  const snapshot = await getStoresSnapshot();
  const configured = isSupabaseConfigured();

  return (
    <div className="stack-lg">
      {!configured ? <SetupNotice /> : null}
      {configured && !snapshot.viewer ? (
        <section className="panel callout">
          <div className="stack-sm">
            <h1 className="section-title">Sign in to manage the shared store map.</h1>
            <Link className="button button-primary" href="/auth/sign-in">
              Sign in
            </Link>
          </div>
        </section>
      ) : (
        <>
          <StoreForm disabled={!configured} />
          <section className="panel stack-md">
            <div className="stack-xs">
              <p className="eyebrow">Shared store registry</p>
              <h1 className="section-title">Exact store locations</h1>
            </div>
            {snapshot.stores.length === 0 ? (
              <div className="empty-state">
                No stores exist yet. Add a real location before logging prices.
              </div>
            ) : (
              <div className="list-table">
                {snapshot.stores.map((store) => (
                  <div className="list-table__row" key={store.id}>
                    <div className="stack-xs">
                      <strong>{store.name}</strong>
                      <span className="muted">{store.chain_name ?? "Independent store"}</span>
                    </div>
                    <div className="stack-xs">
                      <span>{store.address_text}</span>
                      <span className="muted">
                        {store.latitude}, {store.longitude}
                      </span>
                    </div>
                    <div className="stack-xs">
                      <span className="tag">Notes</span>
                      <span className="muted">{store.notes ?? "No notes yet."}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
