export function SetupNotice() {
  return (
    <section className="panel setup-note">
      <div className="stack-sm">
        <p className="eyebrow">Demo Mode</p>
        <h2 className="section-title">Supabase is not configured yet.</h2>
        <p className="muted">
          The compare screen is using seeded demo data so you can inspect the UI.
          Add your Supabase URL and anon key to start reading and writing live data.
        </p>
        <code className="tag">
          NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY
        </code>
      </div>
    </section>
  );
}
