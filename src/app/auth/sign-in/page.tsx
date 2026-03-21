import Link from "next/link";
import { signInWithGoogleAction } from "@/app/actions";
import { SetupNotice } from "@/components/setup-notice";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {};
  const configured = isSupabaseConfigured();

  return (
    <div className="stack-lg">
      {!configured ? <SetupNotice /> : null}
      <section className="panel auth-card">
        <div className="sign-in-grid">
          <div className="stack-md">
            <div className="stack-xs">
              <p className="eyebrow">Shared Price Tracking</p>
              <h1 className="hero-title">Sign in to read and submit grocery prices.</h1>
              <p className="hero-copy">
                Google sign-in keeps every item, store, and price log attributable
                to a real user from the first version onward.
              </p>
            </div>
            <form action={signInWithGoogleAction}>
              <button className="button button-primary" disabled={!configured} type="submit">
                Continue with Google
              </button>
            </form>
            {params.error ? (
              <p className="form-error">
                Sign-in failed. Check your Supabase OAuth settings and callback URL.
              </p>
            ) : null}
          </div>
          <div className="stack-md">
            <div className="panel panel-muted stack-sm">
              <h2>What you get</h2>
              <div className="divider" />
              <p className="auth-meta">Shared stores and items</p>
              <p className="auth-meta">Owned price logs with history</p>
              <p className="auth-meta">Normalized compare view across exact locations</p>
            </div>
            <Link className="button button-secondary" href="/">
              Back to compare
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
