import Link from "next/link";
import { signOutAction } from "@/app/actions";
import type { Viewer } from "@/lib/models";

type AppShellProps = {
  children: React.ReactNode;
  configured: boolean;
  viewer: Viewer | null;
};

export function AppShell({ children, configured, viewer }: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__inner">
          <div className="brand-lockup">
            <span className="brand-lockup__mark">Tokyo Grocery Ledger</span>
            <span className="brand-lockup__title">Grocery Price Map</span>
            <span className="brand-lockup__subtitle">
              Store-specific prices, normalized and kept as history.
            </span>
          </div>
          <nav className="main-nav" aria-label="Primary">
            <Link href="/">Compare</Link>
            <Link href="/prices/new">Add Price</Link>
            <Link href="/stores">Stores</Link>
            <Link href="/items">Items</Link>
          </nav>
          <div className="header-actions">
            {configured && viewer ? (
              <>
                <span className="tag">{viewer.email}</span>
                <form action={signOutAction}>
                  <button className="button button-secondary" type="submit">
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <Link className="button button-primary" href="/auth/sign-in">
                {configured ? "Sign in with Google" : "Setup required"}
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
