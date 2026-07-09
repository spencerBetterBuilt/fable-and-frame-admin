import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { ConfirmSubmitButton } from "@/components/ConfirmSubmitButton";
import { formatSlotDate, formatSlotTimeRange } from "@/lib/format";
import { updateLeadStatus, updateBookingContract, deleteLead } from "./actions";

const STATUSES = [
  "inquired",
  "booked",
  "paid",
  "contract_sent",
  "shot",
  "delivered",
];

const CONTRACT_STATUSES = ["not_sent", "sent", "signed"];

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { booking: { include: { slot: { include: { sessionType: true } } } } },
  });

  if (!lead) {
    notFound();
  }

  const boundUpdateStatus = updateLeadStatus.bind(null, lead.id);
  const boundUpdateContract = lead.booking
    ? updateBookingContract.bind(null, lead.booking.id, lead.id)
    : null;
  const boundDeleteLead = deleteLead.bind(null, lead.id);

  return (
    <div className="max-w-3xl">
      <Link href="/admin" className="font-body text-sm text-dusty-blue-deep underline">
        ← Back to leads
      </Link>

      <h1 className="font-display text-2xl text-ink mt-4 mb-6">{lead.name}</h1>

      <section className="border border-sage-deep/30 px-6 py-5 mb-6">
        <h2 className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep mb-3">
          Lead Info
        </h2>
        <dl className="grid grid-cols-[120px_1fr] gap-y-2 font-body text-sm text-ink">
          <dt className="text-ink/60">Email</dt>
          <dd>{lead.email}</dd>
          <dt className="text-ink/60">Phone</dt>
          <dd>{lead.phone ?? "—"}</dd>
          <dt className="text-ink/60">Notes</dt>
          <dd>{lead.notes ?? "—"}</dd>
          <dt className="text-ink/60">Inquired</dt>
          <dd>{lead.createdAt.toLocaleString()}</dd>
        </dl>
      </section>

      {lead.booking && (
        <section className="border border-sage-deep/30 px-6 py-5 mb-6">
          <h2 className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep mb-3">
            Booking Info
          </h2>
          <dl className="grid grid-cols-[120px_1fr] gap-y-2 font-body text-sm text-ink">
            <dt className="text-ink/60">Session Type</dt>
            <dd>{lead.booking.slot.sessionType.name}</dd>
            <dt className="text-ink/60">Slot</dt>
            <dd>
              {formatSlotDate(lead.booking.slot.date)} ·{" "}
              {formatSlotTimeRange(
                lead.booking.slot.startTime,
                lead.booking.slot.durationMin
              )}
            </dd>
            <dt className="text-ink/60">Payment</dt>
            <dd>
              <StatusBadge status={lead.booking.paymentStatus} />
            </dd>
            <dt className="text-ink/60">Stripe Session</dt>
            <dd className="break-all text-ink/70">
              {lead.booking.stripeSessionId ?? "—"}
            </dd>
          </dl>
        </section>
      )}

      <section className="border border-sage-deep/30 px-6 py-5 mb-6">
        <h2 className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep mb-3">
          Pipeline Status
        </h2>
        <form action={boundUpdateStatus} className="flex items-end gap-3">
          <select
            name="status"
            defaultValue={lead.status}
            className="bg-ivory border border-sage-deep/60 rounded-sm px-3 py-2.5 font-body text-sm text-ink"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace("_", " ")}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-ink text-ivory font-body text-xs uppercase tracking-[0.06em] px-4 py-2.5 hover:bg-cinematic-dark"
          >
            Update Status
          </button>
        </form>
      </section>

      {lead.booking && boundUpdateContract && (
        <section className="border border-sage-deep/30 px-6 py-5">
          <h2 className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep mb-3">
            Pixieset Contract
          </h2>
          <form action={boundUpdateContract} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs text-ink/60">Contract Link</span>
              <input
                name="contractLink"
                type="url"
                defaultValue={lead.booking.contractLink ?? ""}
                placeholder="https://fableandframestudios.pixieset.com/..."
                className="bg-ivory border border-sage-deep/60 rounded-sm px-3 py-2.5 font-body text-sm text-ink"
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="font-body text-xs text-ink/60">Contract Status</span>
              <select
                name="contractStatus"
                defaultValue={lead.booking.contractStatus}
                className="bg-ivory border border-sage-deep/60 rounded-sm px-3 py-2.5 font-body text-sm text-ink w-fit"
              >
                {CONTRACT_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="bg-ink text-ivory font-body text-xs uppercase tracking-[0.06em] px-4 py-2.5 hover:bg-cinematic-dark self-start"
            >
              Save Contract Info
            </button>
          </form>
        </section>
      )}

      <section className="border border-sage-deep/30 px-6 py-5 mt-6">
        <h2 className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep mb-3">
          Delete Lead
        </h2>
        <p className="font-body text-xs text-ink/60 mb-3">
          Permanently removes this lead{lead.booking ? " and its booking, and reopens the slot" : ""}. This can&apos;t be undone.
        </p>
        <form action={boundDeleteLead}>
          <ConfirmSubmitButton
            confirmMessage={`Delete ${lead.name}? This can't be undone.`}
            className="font-body text-xs uppercase tracking-[0.06em] text-ink/60 underline hover:text-ink"
          >
            Delete Lead
          </ConfirmSubmitButton>
        </form>
      </section>
    </div>
  );
}
