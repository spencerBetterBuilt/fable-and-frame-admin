import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatusBadge } from "@/components/StatusBadge";
import { formatSlotDate, formatSlotTimeRange } from "@/lib/format";
import { createManualLead } from "./actions";

const STATUSES = [
  "inquired",
  "booked",
  "paid",
  "contract_sent",
  "shot",
  "delivered",
];

const inputClasses =
  "bg-ivory border border-sage-deep/60 rounded-sm px-3 py-2 font-body text-sm text-ink";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;

  const leads = await prisma.lead.findMany({
    where: status ? { status } : undefined,
    include: { booking: { include: { slot: { include: { sessionType: true } } } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-ink mb-6">Leads</h1>

      <section className="border border-sage-deep/30 px-6 py-5 mb-6">
        <h2 className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep mb-3">
          Add Lead Manually
        </h2>
        <p className="font-body text-xs text-ink/60 mb-3">
          For inquiries that came in outside the booking page (DM, phone, email).
        </p>
        <form action={createManualLead} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-ink/60">Name</span>
            <input name="name" type="text" required className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-ink/60">Email</span>
            <input name="email" type="email" required className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-ink/60">Phone</span>
            <input name="phone" type="tel" className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-ink/60">Notes</span>
            <input name="notes" type="text" className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-ink/60">Status</span>
            <select name="status" defaultValue="inquired" className={inputClasses}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          </label>
          <button
            type="submit"
            className="bg-ink text-ivory font-body text-xs uppercase tracking-[0.06em] px-4 py-2.5 hover:bg-cinematic-dark"
          >
            Add Lead
          </button>
        </form>
      </section>

      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/admin"
          className={`font-body text-xs uppercase tracking-[0.06em] px-3 py-1.5 border ${
            !status ? "border-ink bg-ink text-ivory" : "border-sage-deep/40 text-ink/70"
          }`}
        >
          All
        </Link>
        {STATUSES.map((s) => (
          <Link
            key={s}
            href={`/admin?status=${s}`}
            className={`font-body text-xs uppercase tracking-[0.06em] px-3 py-1.5 border ${
              status === s ? "border-ink bg-ink text-ivory" : "border-sage-deep/40 text-ink/70"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {leads.length === 0 ? (
        <p className="font-body text-ink/70">No leads yet.</p>
      ) : (
        <div className="overflow-x-auto border border-sage-deep/30">
          <table className="w-full text-left font-body text-sm">
            <thead>
              <tr className="bg-ivory-deep">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Session Type</th>
                <th className="px-4 py-3">Slot</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Contract</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-sage-deep/20">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/leads/${lead.id}`}
                      className="text-dusty-blue-deep underline"
                    >
                      {lead.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink/80">{lead.email}</td>
                  <td className="px-4 py-3 text-ink/80">
                    {lead.booking?.slot.sessionType.name ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-ink/80">
                    {lead.booking?.slot
                      ? `${formatSlotDate(lead.booking.slot.date)} · ${formatSlotTimeRange(
                          lead.booking.slot.startTime,
                          lead.booking.slot.durationMin
                        )}`
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3">
                    {lead.booking ? (
                      <StatusBadge status={lead.booking.paymentStatus} />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {lead.booking ? (
                      <StatusBadge status={lead.booking.contractStatus} />
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
