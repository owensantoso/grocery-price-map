import Link from "next/link";
import { AccountSettingsForm } from "@/components/forms/account-settings-form";
import { SetupNotice } from "@/components/setup-notice";
import { getAccountSettingsSnapshot } from "@/lib/queries";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams?: Promise<{ saved?: string }>;
}) {
  const snapshot = await getAccountSettingsSnapshot();
  const params = (await searchParams) ?? {};

  return (
    <div className="stack-lg">
      {!snapshot.isConfigured ? <SetupNotice /> : null}
      {snapshot.isConfigured && !snapshot.viewer ? (
        <section className="panel callout">
          <div className="stack-sm">
            <h1 className="section-title">Sign in to manage your account settings.</h1>
            <Link className="button button-primary" href="/auth/sign-in">
              Sign in
            </Link>
          </div>
        </section>
      ) : snapshot.profile ? (
        <>
          <section className="panel hero hero-card">
            <div className="stack-sm">
              <p className="eyebrow">Account settings</p>
              <h1 className="hero-title">@{snapshot.profile.public_name}</h1>
              <p className="hero-copy">
                Update the public username shown on comments and shared activity.
              </p>
            </div>
            <div className="featured-result panel panel-muted stack-sm">
              <p className="eyebrow">Account details</p>
              <p className="muted">Email: {snapshot.profile.email}</p>
              <p className="muted">
                Joined: {new Date(snapshot.profile.created_at).toLocaleDateString("en-CA")}
              </p>
              <Link className="button-inline" href="/account">
                Open My Logs
              </Link>
            </div>
          </section>

          {params.saved === "1" ? <section className="panel banner">Settings updated.</section> : null}

          <section className="panel stack-md">
            <div className="stack-xs">
              <h2 className="section-title">Public profile</h2>
              <p className="muted">Your username is visible anywhere the site credits you.</p>
            </div>
            <AccountSettingsForm defaultUsername={snapshot.profile.public_name ?? ""} />
          </section>
        </>
      ) : null}
    </div>
  );
}
