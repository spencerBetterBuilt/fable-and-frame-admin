import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatSlotDate, formatSlotTimeRange } from "@/lib/format";
import { createSlot, updateSlot, deleteSlot } from "./actions";

export const dynamic = "force-dynamic";

const inputClasses =
  "bg-ivory border border-sage-deep/60 rounded-sm px-3 py-2 font-body text-sm text-ink";

export default async function SlotsPage() {
  const [slots, sessionTypes] = await Promise.all([
    prisma.slot.findMany({
      include: { booking: true, sessionType: true },
      orderBy: [{ date: "asc" }, { startTime: "asc" }],
    }),
    prisma.sessionType.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl text-ink mb-6">Manage Slots</h1>

      {sessionTypes.length === 0 ? (
        <p className="font-body text-ink/70">
          Add a{" "}
          <Link href="/admin/session-types" className="underline">
            session type
          </Link>{" "}
          first — slots are created against one.
        </p>
      ) : (
        <section className="border border-sage-deep/30 px-6 py-5 mb-8">
          <h2 className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep mb-3">
            Add Slot
          </h2>
          <form action={createSlot} className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink/60">Session Type</span>
              <select name="sessionTypeId" required className={inputClasses}>
                {sessionTypes.map((sessionType) => (
                  <option key={sessionType.id} value={sessionType.id}>
                    {sessionType.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink/60">Date</span>
              <input name="date" type="date" required className={inputClasses} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink/60">Start Time</span>
              <input name="startTime" type="time" required className={inputClasses} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="font-body text-xs text-ink/60">Duration (min)</span>
              <input
                name="durationMin"
                type="number"
                min={5}
                step={5}
                defaultValue={30}
                required
                className={`${inputClasses} w-24`}
              />
            </label>
            <button
              type="submit"
              className="bg-ink text-ivory font-body text-xs uppercase tracking-[0.06em] px-4 py-2.5 hover:bg-cinematic-dark"
            >
              Add Slot
            </button>
          </form>
        </section>
      )}

      {slots.length === 0 ? (
        <p className="font-body text-ink/70">No slots yet — add one above.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {slots.map((slot) => {
            const boundUpdate = updateSlot.bind(null, slot.id);
            const boundDelete = deleteSlot.bind(null, slot.id);
            // Any Booking row (even an unpaid/pending one from an abandoned
            // checkout) holds a foreign key to this slot, so edits/deletes
            // are blocked as soon as one exists — not only once isBooked
            // flips true on confirmed payment.
            const isLocked = Boolean(slot.booking);
            const label = slot.isBooked ? "Booked" : slot.booking ? "Pending" : "Open";
            return (
              <li
                key={slot.id}
                className="border border-sage-deep/30 px-6 py-4 flex flex-wrap items-end justify-between gap-3"
              >
                <form action={boundUpdate} className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-xs text-ink/60">Session Type</span>
                    <select
                      name="sessionTypeId"
                      defaultValue={slot.sessionTypeId}
                      required
                      className={inputClasses}
                      disabled={isLocked}
                    >
                      {sessionTypes.map((sessionType) => (
                        <option key={sessionType.id} value={sessionType.id}>
                          {sessionType.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-xs text-ink/60">Date</span>
                    <input
                      name="date"
                      type="date"
                      defaultValue={slot.date.toISOString().slice(0, 10)}
                      required
                      className={inputClasses}
                      disabled={isLocked}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-xs text-ink/60">Start Time</span>
                    <input
                      name="startTime"
                      type="time"
                      defaultValue={slot.startTime}
                      required
                      className={inputClasses}
                      disabled={isLocked}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-xs text-ink/60">Duration (min)</span>
                    <input
                      name="durationMin"
                      type="number"
                      min={5}
                      step={5}
                      defaultValue={slot.durationMin}
                      required
                      className={`${inputClasses} w-24`}
                      disabled={isLocked}
                    />
                  </label>
                  <span className="font-body text-xs text-ink/60 self-center">
                    {label} · {formatSlotDate(slot.date)} ·{" "}
                    {formatSlotTimeRange(slot.startTime, slot.durationMin)}
                  </span>
                  {!isLocked && (
                    <button
                      type="submit"
                      className="bg-ink text-ivory font-body text-xs uppercase tracking-[0.06em] px-4 py-2.5 hover:bg-cinematic-dark"
                    >
                      Save
                    </button>
                  )}
                </form>
                {!isLocked && (
                  <form action={boundDelete}>
                    <button
                      type="submit"
                      className="font-body text-xs uppercase tracking-[0.06em] text-ink/60 underline hover:text-ink"
                    >
                      Delete
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
