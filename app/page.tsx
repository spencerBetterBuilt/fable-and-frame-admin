import { prisma } from "@/lib/prisma";
import { CtaLink } from "@/components/CtaButton";
import { formatSlotDate, formatSlotTimeRange, formatCents } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const sessionTypes = await prisma.sessionType.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "asc" },
    include: {
      slots: {
        // Exclude slots with any booking, not just paid ones — a pending
        // (unpaid) booking from an in-progress or abandoned checkout still
        // holds this slot, so it shouldn't be offered to a second visitor.
        where: { booking: null },
        orderBy: [{ date: "asc" }, { startTime: "asc" }],
      },
    },
  });

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
      <header className="mb-12">
        <h1 className="font-display text-4xl sm:text-5xl text-ink mb-3">
          Book a Session
        </h1>
        <p className="font-body text-ink/80 leading-relaxed">
          Pick a session type below, choose an open time, and reserve your
          spot.
        </p>
      </header>

      {sessionTypes.length === 0 ? (
        <p className="font-body text-ink/70 border border-sage-deep/30 px-6 py-8 text-center">
          No sessions are currently open for booking — check back soon.
        </p>
      ) : (
        <div className="flex flex-col gap-12">
          {sessionTypes.map((sessionType) => (
            <section key={sessionType.id}>
              <h2 className="font-display text-2xl text-ink mb-1">
                {sessionType.name}
              </h2>
              <p className="font-body text-sm text-ink/70 mb-5">
                {sessionType.durationMin}-minute session
                {sessionType.description ? ` · ${sessionType.description}` : ""} ·{" "}
                {formatCents(sessionType.depositCents)}
                {sessionType.isFullPayment ? "" : " deposit"}
                {sessionType.addOnUnitLabel && sessionType.addOnUnitPriceCents != null
                  ? ` (includes ${sessionType.addOnIncludedUnits} ${sessionType.addOnUnitLabel}${
                      sessionType.addOnIncludedUnits > 1 ? "s" : ""
                    }, +${formatCents(sessionType.addOnUnitPriceCents)}/additional ${
                      sessionType.addOnUnitLabel
                    })`
                  : ""}
              </p>

              {sessionType.slots.length === 0 ? (
                <p className="font-body text-sm text-ink/60 border border-sage-deep/30 px-6 py-5">
                  No open times right now — check back soon.
                </p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {sessionType.slots.map((slot) => (
                    <li
                      key={slot.id}
                      className="flex items-center justify-between gap-4 border border-sage-deep/30 px-6 py-5"
                    >
                      <div>
                        <p className="font-body font-medium text-ink">
                          {formatSlotDate(slot.date)}
                        </p>
                        <p className="font-body text-sm text-ink/70">
                          {formatSlotTimeRange(slot.startTime, slot.durationMin)}
                        </p>
                      </div>
                      <CtaLink href={`/book/${slot.id}`}>Book This Session</CtaLink>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
