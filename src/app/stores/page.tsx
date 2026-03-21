import Link from "next/link";
import { StoreForm } from "@/components/forms/store-form";
import { SetupNotice } from "@/components/setup-notice";
import { StoreDirectoryMap } from "@/components/stores/store-directory-map";
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
          <section className="store-directory-grid">
            <section className="panel stack-md">
              <div className="stack-xs">
                <p className="eyebrow">Shared store registry</p>
                <h1 className="section-title">Exact store locations and links</h1>
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
                        <span className="muted">
                          {store.chain_name ?? "Independent store"} • {store.store_kind}
                        </span>
                      </div>
                      <div className="stack-xs">
                        <span>{store.address_text}</span>
                        <a
                          className="store-link"
                          href={store.store_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          Open link
                        </a>
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
            <section className="panel stack-sm">
              <div className="stack-xs">
                <h2 className="section-title">Store map</h2>
                <p className="muted">
                  Physical stores appear on the map. Online-only stores stay in the list.
                </p>
              </div>
              <StoreDirectoryMap stores={snapshot.stores} />
            </section>
          </section>
        </>
      )}
    </div>
  );
}
