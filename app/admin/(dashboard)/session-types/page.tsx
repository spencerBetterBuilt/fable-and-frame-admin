import { prisma } from "@/lib/prisma";
import { formatCents } from "@/lib/format";
import { createSessionType, updateSessionType } from "./actions";

export const dynamic = "force-dynamic";

const inputClasses =
  "bg-ivory border border-sage-deep/60 rounded-sm px-3 py-2 font-body text-sm text-ink";

export default async function SessionTypesPage() {
  const sessionTypes = await prisma.sessionType.findMany({
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-2xl text-ink mb-2">Session Types</h1>
      <p className="font-body text-sm text-ink/60 mb-6">
        Each session type is an offering (e.g. Pet Mini Session, Family Portrait
        Session) with its own deposit price and default duration. Slots are
        created against a session type on the{" "}
        <a href="/admin/slots" className="underline">
          Slots
        </a>{" "}
        page.
      </p>

      <section className="border border-sage-deep/30 px-6 py-5 mb-8">
        <h2 className="font-body text-xs uppercase tracking-[0.08em] text-sage-deep mb-3">
          Add Session Type
        </h2>
        <form action={createSessionType} className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-ink/60">Name</span>
            <input name="name" type="text" required className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-ink/60">Deposit ($)</span>
            <input
              name="depositDollars"
              type="number"
              min={1}
              step={1}
              required
              className={`${inputClasses} w-28`}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="font-body text-xs text-ink/60">Default Duration (min)</span>
            <input
              name="durationMin"
              type="number"
              min={5}
              step={5}
              defaultValue={30}
              required
              className={`${inputClasses} w-28`}
            />
          </label>
          <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <span className="font-body text-xs text-ink/60">Description (optional)</span>
            <input name="description" type="text" className={inputClasses} />
          </label>
          <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <span className="font-body text-xs text-ink/60">Location (optional)</span>
            <input name="location" type="text" className={inputClasses} />
          </label>
          <button
            type="submit"
            className="bg-ink text-ivory font-body text-xs uppercase tracking-[0.06em] px-4 py-2.5 hover:bg-cinematic-dark"
          >
            Add
          </button>
        </form>
      </section>

      {sessionTypes.length === 0 ? (
        <p className="font-body text-ink/70">No session types yet — add one above.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {sessionTypes.map((sessionType) => {
            const boundUpdate = updateSessionType.bind(null, sessionType.id);
            return (
              <li key={sessionType.id} className="border border-sage-deep/30 px-6 py-4">
                <form action={boundUpdate} className="flex flex-wrap items-end gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-xs text-ink/60">Name</span>
                    <input
                      name="name"
                      type="text"
                      defaultValue={sessionType.name}
                      required
                      className={inputClasses}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-xs text-ink/60">Deposit ($)</span>
                    <input
                      name="depositDollars"
                      type="number"
                      min={1}
                      step={1}
                      defaultValue={sessionType.depositCents / 100}
                      required
                      className={`${inputClasses} w-28`}
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="font-body text-xs text-ink/60">Default Duration (min)</span>
                    <input
                      name="durationMin"
                      type="number"
                      min={5}
                      step={5}
                      defaultValue={sessionType.durationMin}
                      required
                      className={`${inputClasses} w-28`}
                    />
                  </label>
                  <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
                    <span className="font-body text-xs text-ink/60">Description</span>
                    <input
                      name="description"
                      type="text"
                      defaultValue={sessionType.description ?? ""}
                      className={inputClasses}
                    />
                  </label>
                  <label className="flex flex-col gap-1 flex-1 min-w-[200px]">
                    <span className="font-body text-xs text-ink/60">Location</span>
                    <input
                      name="location"
                      type="text"
                      defaultValue={sessionType.location ?? ""}
                      className={inputClasses}
                    />
                  </label>
                  <label className="flex items-center gap-2 pb-2.5">
                    <input
                      name="isActive"
                      type="checkbox"
                      defaultChecked={sessionType.isActive}
                      className="h-4 w-4"
                    />
                    <span className="font-body text-xs text-ink/60">
                      Active (bookable publicly)
                    </span>
                  </label>
                  <button
                    type="submit"
                    className="bg-ink text-ivory font-body text-xs uppercase tracking-[0.06em] px-4 py-2.5 hover:bg-cinematic-dark"
                  >
                    Save
                  </button>
                  <span className="font-body text-xs text-ink/50 self-center">
                    Currently: {formatCents(sessionType.depositCents)} deposit
                  </span>
                </form>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
