import Link from "next/link";
import { notFound } from "next/navigation";
import { PriceLogFeed } from "@/components/logs/price-log-feed";
import { LogPhoto } from "@/components/logs/log-photo";
import { formatDate } from "@/lib/format";
import { getPhotoUrl } from "@/lib/photos";
import { getStoreDetail } from "@/lib/queries";

type StoreDetailPageProps = {
  params: Promise<{
    storeId: string;
  }>;
};

export default async function StoreDetailPage({ params }: StoreDetailPageProps) {
  const { storeId } = await params;
  const detail = await getStoreDetail(storeId);

  if (!detail) {
    notFound();
  }

  return (
    <div className="stack-lg">
      <section className="panel hero hero-card">
        <div className="stack-sm">
          <p className="eyebrow">Store page</p>
          <h1 className="hero-title">{detail.store.name}</h1>
          <p className="hero-copy">
            All recent logs and submitted photos for this exact store location.
          </p>
          <div className="stack-xs">
            <p className="muted">
              {detail.store.chain_name ?? "Independent store"} • {detail.store.store_kind}
            </p>
            <p className="muted">{detail.store.address_text}</p>
          </div>
        </div>
        <div className="featured-result panel panel-muted">
          <p className="eyebrow">Store links</p>
          <a
            className="button button-primary"
            href={detail.store.store_url}
            rel="noreferrer"
            target="_blank"
          >
            Open store link
          </a>
          <p className="muted">{detail.store.notes ?? "No extra notes for this store yet."}</p>
        </div>
      </section>

      <section className="panel stack-md">
        <div className="stack-xs">
          <h2 className="section-title">Store gallery</h2>
          <p className="muted">Every submitted photo tied to this store.</p>
        </div>
        {detail.photoGallery.length === 0 ? (
          <div className="empty-state">
            No photos have been uploaded for this store yet.
          </div>
        ) : (
          <div className="photo-gallery-grid">
            {detail.photoGallery.map((entry) => {
              const photoUrl = entry.log.photo_path ? getPhotoUrl(entry.log.photo_path) : null;

              if (!photoUrl) {
                return null;
              }

              return (
                <article className="photo-gallery-card" key={entry.log.id}>
                  <LogPhoto
                    alt={`${entry.item.name} photo from ${detail.store.name}`}
                    className="log-photo log-photo--gallery"
                    src={photoUrl}
                  />
                  <div className="stack-xs">
                    <Link className="store-link" href={`/logs/${entry.log.id}`}>
                      {entry.item.name}
                    </Link>
                    <span className="muted">observed {formatDate(entry.log.observed_at)}</span>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="panel stack-md">
        <div className="stack-xs">
          <h2 className="section-title">Recent logs from this store</h2>
          <p className="muted">
            Price logs from {detail.store.name}, newest first.
          </p>
        </div>
        <PriceLogFeed
          disableVoting={!detail.viewer}
          emptyMessage="No logs yet for this store."
          entries={detail.recentLogs}
          showEditLink
        />
      </section>
    </div>
  );
}
