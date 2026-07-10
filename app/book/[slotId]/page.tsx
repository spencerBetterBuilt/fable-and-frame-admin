import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { CtaButton } from "@/components/CtaButton";
import { formatSlotDate, formatSlotTimeRange } from "@/lib/format";
import { createLead } from "./actions";

export const dynamic = "force-dynamic";

export default async function IntakePage({
  params,
  searchParams,
}: {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { slotId } = await params;
  const { error } = await searchParams;
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { booking: true, sessionType: true },
  });

  if (!slot || slot.booking) {
    return (
      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
        <p className="font-body text-ink/80">
          Sorry, this slot is no longer available.
        </p>
        <Link href="/" className="font-body text-dusty-blue-deep underline mt-4 inline-block">
          Back to available sessions
        </Link>
      </main>
    );
  }

  const boundCreateLead = createLead.bind(null, slotId);

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
      <p className="font-body text-sm uppercase tracking-[0.08em] text-sage-deep mb-2">
        {formatSlotDate(slot.date)} · {formatSlotTimeRange(slot.startTime, slot.durationMin)}
      </p>
      <h1 className="font-display text-3xl sm:text-4xl text-ink mb-8">
        {slot.sessionType.name}
      </h1>

      {error === "missing-fields" && (
        <p className="font-body text-sm text-ink border border-ink/40 px-4 py-3 mb-6">
          Please fill in your name and email.
        </p>
      )}

      <form action={boundCreateLead} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep">
            Name
          </span>
          <input
            name="name"
            type="text"
            required
            className="bg-ivory border border-sage-deep/60 rounded-sm px-4 py-3.5 font-body text-ink focus:outline-none focus:border-dusty-blue-deep"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep">
            Email
          </span>
          <input
            name="email"
            type="email"
            required
            className="bg-ivory border border-sage-deep/60 rounded-sm px-4 py-3.5 font-body text-ink focus:outline-none focus:border-dusty-blue-deep"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep">
            Phone (optional)
          </span>
          <input
            name="phone"
            type="tel"
            className="bg-ivory border border-sage-deep/60 rounded-sm px-4 py-3.5 font-body text-ink focus:outline-none focus:border-dusty-blue-deep"
          />
        </label>

        {slot.sessionType.addOnUnitLabel && (
          <label className="flex flex-col gap-1.5">
            <span className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep">
              Number of {slot.sessionType.addOnUnitLabel}s
            </span>
            <input
              name="addOnQuantity"
              type="number"
              min={slot.sessionType.addOnIncludedUnits}
              step={1}
              defaultValue={slot.sessionType.addOnIncludedUnits}
              required
              className="bg-ivory border border-sage-deep/60 rounded-sm px-4 py-3.5 font-body text-ink focus:outline-none focus:border-dusty-blue-deep w-32"
            />
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep">
            Anything else we should know? (optional)
          </span>
          <textarea
            name="notes"
            rows={4}
            className="bg-ivory border border-sage-deep/60 rounded-sm px-4 py-3.5 font-body text-ink focus:outline-none focus:border-dusty-blue-deep"
          />
        </label>

        <CtaButton type="submit" className="mt-2 self-start">
          Continue to Payment
        </CtaButton>
      </form>
    </main>
  );
}
