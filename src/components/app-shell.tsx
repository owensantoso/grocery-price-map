import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { AccountMenu } from "@/components/navigation/account-menu";
import { PrimaryNav } from "@/components/navigation/primary-nav";
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
          <div className="app-header__top">
            <div className="brand-lockup">
              <span className="brand-lockup__mark">Tokyo Grocery Ledger</span>
              <span className="brand-lockup__title">Grocery Price Map</span>
              <span className="brand-lockup__subtitle">
                Store-specific prices, normalized and kept as history.
              </span>
            </div>
            <div className="header-actions header-actions--mobile">
              <AccountMenu configured={configured} viewerEmail={viewer?.email ?? null} />
            </div>
          </div>
          <div className="app-header__bottom">
            <PrimaryNav />
            <div className="header-actions header-actions--desktop">
            {configured && viewer ? (
              <>
                <Link className="tag header-account-link" href="/account">
                  {viewer.email}
                </Link>
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
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
}
