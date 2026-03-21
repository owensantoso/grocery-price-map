import Link from "next/link";
import { notFound } from "next/navigation";
import { updatePriceLogAction } from "@/app/actions";
import { PriceLogForm } from "@/components/forms/price-log-form";
import { getEditablePriceLogSnapshot } from "@/lib/queries";

type PageProps = {
  params: Promise<{
    logId: string;
  }>;
};

export default async function EditLogPage({ params }: PageProps) {
  const { logId } = await params;
  const snapshot = await getEditablePriceLogSnapshot(logId);

  if (!snapshot.viewer || !snapshot.log) {
    notFound();
  }

  return (
    <div className="stack-lg">
      <section className="panel callout">
        <div className="stack-sm">
          <p className="eyebrow">Edit log</p>
          <h1 className="section-title">Update your original submission</h1>
          <p className="muted">
            Only the original submitter can edit a log. Changes keep the same log
            identity and update the normalized ranking immediately.
          </p>
          <Link className="button-inline" href={`/logs/${logId}`}>
            Back to log detail
          </Link>
        </div>
      </section>
      <PriceLogForm
        initialLog={snapshot.log}
        items={snapshot.items}
        stores={snapshot.stores}
        submitAction={updatePriceLogAction.bind(null, logId)}
        submitLabel="Save changes"
        title="Edit this price observation"
      />
    </div>
  );
}
