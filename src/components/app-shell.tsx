import { AccountMenu } from "@/components/navigation/account-menu";
import { HeaderSearch } from "@/components/navigation/header-search";
import { PrimaryNav } from "@/components/navigation/primary-nav";
import type { ItemRecord, StoreRecord, Viewer } from "@/lib/models";

type AppShellProps = {
  children: React.ReactNode;
  configured: boolean;
  items: ItemRecord[];
  stores: StoreRecord[];
  viewer: Viewer | null;
};

export function AppShell({ children, configured, items, stores, viewer }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="app-header__top">
            <div className="brand-lockup">
              <span className="brand-lockup__mark">Tokyo Grocery Ledger</span>
              <span className="brand-lockup__title">Grocery Price Map</span>
              <span className="brand-lockup__subtitle">
                Store-specific prices, normalized and kept as history.
              </span>
            </div>
            <HeaderSearch items={items} stores={stores} />
            <div className="header-top-actions">
              <AccountMenu
                configured={configured}
                viewerEmail={viewer?.email ?? null}
                viewerName={viewer?.publicName ?? null}
              />
            </div>
          </div>
          <div className="app-header__bottom">
            <PrimaryNav />
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
