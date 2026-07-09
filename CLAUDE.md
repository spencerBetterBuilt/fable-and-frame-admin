# Fable & Frame Studios — Booking & CRM Admin Tool (V1)

## Anchor Goal

Build a working V1 web app, deployed at **admin.fableandframestudios.com** (confirmed against the registered marketing-site domain `fableandframestudios.com` — plural "studios", matching `astro.config.mjs` and the Pixieset client-login link in the main site repo), that lets Fable & Frame Studios (photographer Madyson Call) do three things end-to-end:

1. **Publish available session slots** and let the public **book a time slot, submit their info, and pay a deposit via Stripe Checkout** on a branded booking page.
2. **Track every lead/booking through a simple pipeline** (`Inquired → Booked → Paid → Contract Sent → Shot → Delivered`) in a password-protected admin dashboard.
3. **Hand off contract signing to Pixieset** — this tool does not host or manage e-signatures; after payment, the client is pointed to a Pixieset contract link (manually attached per booking by Madyson/Spencer in V1).

This is being built to replace an ad-hoc Google Form + spreadsheet workflow that broke down under a viral surge of 100+ pet mini-session inquiries. The immediate real-world use case is **pet-themed mini portrait sessions**, but the data model and UI should be generic enough to reuse for other fixed-concept session types later (not weddings — weddings stay a manual/custom process).

This is a small, low-stakes internal tool for a two-person creative business (not a commercial SaaS product). Favor simple, working, and maintainable over robust or "enterprise-correct." Do not over-engineer auth, roles, or infrastructure.

**Definition of done for this first pass:** a person can visit the booking page, pick a slot, fill out the form, get redirected to Stripe Checkout (test mode is fine), and land on a confirmation page — and a separate admin login can view that lead sitting in the pipeline with correct status. Payment webhook wiring, Pixieset link-attachment, and production Stripe keys will be connected in a follow-up pass — stub these clearly rather than blocking the build on them.

---

## Tech Stack

- **Framework:** Next.js (App Router), TypeScript
- **Styling:** Tailwind CSS, using the design tokens defined below (do not invent new colors/fonts)
- **Database:** Postgres via Prisma ORM (Neon/Vercel Postgres — see "Live database" below; SQLite was the original V1 choice but doesn't survive Vercel's serverless filesystem, so this was swapped before any real deployment)
- **Payments:** Stripe Checkout (hosted page — do not build custom card fields, do not touch raw card data)
- **Auth (admin only):** Simple password-gated session (e.g. a single shared admin password + signed cookie session). No user roles, no multi-user permissions, no OAuth. This is not client-facing security-sensitive data — keep it lightweight.
- **Deployment target:** Vercel (or wherever the main Astro marketing site is hosted — match that platform if there's an existing account/preference; the marketing site repo has no `vercel.json`/`netlify.toml` committed, so confirm the actual host with Spencer before deploying)
- **Email:** Stub only in V1 — log intended emails to console with a clear `// TODO: wire up transactional email (Resend or similar)` comment rather than integrating a provider now.

This app is a **separate deployable** from the main Astro marketing site — different subdomain, different framework, no shared build pipeline. It only needs to share the visual design system, not the codebase.

---

## Design System (reuse, don't reinvent)

Pull colors, typography, spacing, and component styles from the marketing site's `DESIGN.md` (`../DESIGN.md` relative to this app). Key constraints for this tool specifically:

**Public booking page** (client-facing — must feel on-brand):
- Ivory/sage/dusty-blue palette, Cormorant Garamond for headings, Quicksand for body/labels/buttons — same as the marketing site.
- Reuse the primary button style (Ink background, Ivory text, rectangular, no rounding) for the CTA ("Book This Session" / "Continue to Payment").
- Keep it simple and single-column — this is a functional booking flow, not a hero-driven marketing page. Skip film grain, parallax, and ambient glow entirely here; those are marketing-site-only treatments. Flat, clean, and fast is correct for this page.

**Admin dashboard** (internal tool — utilitarian is fine):
- Reuse the color palette and typography for consistency, but this can be a standard data-table-and-form UI. Do not over-invest in polish here — clarity and speed of use for Madyson matter more than editorial styling. A clean table, status badges, and simple forms are enough.

---

## Data Model (Prisma schema)

> Updated post-V1: the business runs more than one fixed-concept session type
> (pet minis, family portraits, etc.), so pricing/duration/name live on a
> `SessionType` row rather than a hardcoded constant. See "Implementation
> Status" below for what changed and why.

```prisma
model SessionType {
  id            String   @id @default(cuid())
  name          String   // e.g. "Pet Mini Session", "Family Portrait Session"
  depositCents  Int
  durationMin   Int      @default(30) // default slot length when adding new slots of this type
  description   String?
  isActive      Boolean  @default(true) // inactive types are hidden from the public booking page but keep historical slots/leads intact
  createdAt     DateTime @default(now())
  slots         Slot[]
}

model Lead {
  id        String   @id @default(cuid())
  name      String
  email     String
  phone     String?
  notes     String?  // free text: pet info, family details, or any other intake notes
  status    String   @default("inquired") // inquired | booked | paid | contract_sent | shot | delivered
  createdAt DateTime @default(now())
  booking   Booking?
}

model Slot {
  id            String      @id @default(cuid())
  sessionTypeId String
  sessionType   SessionType @relation(fields: [sessionTypeId], references: [id])
  date          DateTime
  startTime     String      // e.g. "14:00"
  durationMin   Int         @default(30)
  isBooked      Boolean     @default(false)
  booking       Booking?
}

model Booking {
  id                String   @id @default(cuid())
  leadId            String   @unique
  lead              Lead     @relation(fields: [leadId], references: [id])
  slotId            String   @unique
  slot              Slot     @relation(fields: [slotId], references: [id])
  stripeSessionId   String?
  stripePaymentId   String?
  paymentStatus     String   @default("pending") // pending | paid | failed
  contractLink      String?  // manually pasted Pixieset contract URL
  contractStatus    String   @default("not_sent") // not_sent | sent | signed
  createdAt         DateTime @default(now())
}
```

---

## Pages & Routes

### Public
- `/` — Session offer landing/booking page: open slots grouped by `SessionType` (name, deposit, duration shown per group), click a slot to proceed.
- `/book/[slotId]` — Intake form (name, email, phone, notes) for the selected slot.
- `/book/[slotId]/checkout` — Creates a Stripe Checkout session server-side (price/name pulled from `slot.sessionType`) and redirects to Stripe's hosted page. On success, mark the `Slot.isBooked = true`, create the `Booking`, and set `Lead.status = "booked"`.
- `/book/confirmation` — Simple "You're booked!" page with next steps (contract will follow by email — even though email is stubbed in V1, still show this messaging).

### Admin (behind password gate)
- `/admin/login` — Single shared password form.
- `/admin` — Dashboard: table of all leads/bookings with status and session type, sortable/filterable by status. Click a row to expand/edit.
- `/admin/leads/[id]` — Detail view: lead info, booking info, session type, payment status, manually paste/update the Pixieset contract link, manually advance `status` through the pipeline (dropdown or buttons).
- `/admin/slots` — Slot management: add/edit/delete available slots (session type, date, time, duration).
- `/admin/session-types` — Manage offerings: add/edit name, deposit price, default duration, description, and active/inactive per session type.

---

## Core Flows

**Public booking flow:**
1. Visitor lands on `/`, sees available slots.
2. Picks a slot → intake form → submits (creates `Lead`, status `inquired`).
3. Redirected to Stripe Checkout for deposit/full payment.
4. On successful payment (webhook or success-redirect check in V1 — webhook is the correct approach, but a simple success-URL check is an acceptable stub if webhook wiring is deferred to the follow-up pass), `Booking` is created, `Slot.isBooked = true`, `Lead.status = "paid"`.
5. Confirmation page shown.

**Admin flow:**
1. Madyson/Spencer logs into `/admin`.
2. Sees all leads in a pipeline table, filterable by status.
3. Manually pastes the Pixieset contract link once sent, updates `contractStatus` and `Lead.status` as things progress (contract sent → signed → shot → delivered).
4. Manages available slots in `/admin/slots`.

---

## Explicit V1 Scope Boundaries

**Build these:**
- Booking page, intake form, Stripe Checkout redirect, confirmation page
- Slot management (CRUD)
- Admin dashboard with lead/booking table and status pipeline
- Basic password-gated admin auth

**Do NOT build in V1 (stub or skip entirely):**
- Real transactional email sending (console.log placeholder only)
- Pixieset API integration (contract link is manually pasted by a human — there is no public API for this, don't attempt one)
- Bulk/marketing email (Mailchimp/Flodesk is a separate tool, out of scope here)
- Multi-user roles/permissions
- SMS notifications
- Payment plans/partial payment logic beyond a single Stripe Checkout charge
- Automated review requests or post-delivery follow-up sequences

If something outside this scope seems tempting to add "while you're in there," flag it instead of building it.

---

## What I'll Wire Up After This First Pass

- ~~Real Stripe keys + webhook endpoint verification~~ — webhook signature verification and `checkout.session.completed` handling are now live (test-mode keys still used locally; live keys still needed for production, see Implementation Status)
- A real transactional email provider
- Production deployment/env vars on Vercel
- DNS for admin.fableandframestudios.com

Leave clear `// TODO` comments and a short `.env.example` file listing every environment variable the app expects (`DATABASE_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `ADMIN_PASSWORD`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`) so the handoff is unambiguous.

---

## Implementation Status (as of 2026-07-09)

V1 is built and has been tested end to end with a real Stripe test-mode payment (test card `4242 4242 4242 4242`) — booking flow, admin pipeline, and slot management all confirmed working in a real browser, not just via typecheck/build.

### Post-V1 update: real webhook + multi-session-type CRM (2026-07-09)

Two follow-up changes, done together:

- **Stripe webhook is real, not a stub.** `app/api/stripe/webhook/route.ts` verifies the signature (`stripe.webhooks.constructEvent` with `STRIPE_WEBHOOK_SECRET`) and handles `checkout.session.completed`. The actual "mark paid + send confirmation email" logic lives in `lib/booking.ts` (`fulfillCheckoutSession`), shared between the webhook and the `/book/confirmation` success-URL check — both are idempotent (guarded on `booking.paymentStatus !== "paid"`), so whichever fires first wins and the other is a no-op. The webhook is the source of truth; the confirmation-page check is now just a fallback for when a webhook listener isn't running (e.g. local dev without `stripe listen`) or is slow.
  - Verified locally end-to-end with the Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) forwarding real test-mode events.
- **Generalized beyond pet minis into a real multi-offering CRM.** The business runs more than one fixed-concept session type, so a hardcoded `lib/session-config.ts` (name/price/duration) no longer fit. Added a `SessionType` model (name, deposit price, default duration, description, active/inactive) — see the Data Model section above. `Slot.sessionTypeId` is now required; `Lead.petInfo` was renamed to a generic `Lead.notes`. New `/admin/session-types` page manages offerings; `/admin/slots` picks a type per slot; `/` groups open slots by type; checkout pulls price/name from `slot.sessionType`.
  - `lib/session-config.ts` was deleted (no remaining references).
  - This required a schema migration (`20260709034641_add_session_types`). The local `dev.db` only had disposable test data at the time, so it was wiped and reseeded with one `SessionType` row ("Pet Mini Session", $50 deposit, 15 min) matching the old hardcoded values, rather than writing a data-backfill migration.
- Confirmed in a real browser (Playwright) that the pre-payment path works correctly with the new model: added a second session type, added a slot against it, saw slots grouped by type on `/`, and reached Stripe Checkout showing the correct dynamic price/name pulled from `SessionType`. Actually completing a test-card payment through Stripe's hosted Checkout UI under headless automation was not confirmed — Stripe's payment-method accordion didn't cooperate with headless Playwright — so a manual browser run of the full pay-through-confirmation path is still recommended before considering this fully verified.

### Stack notes (newer major versions than typical training data — check before assuming old APIs)
- **Next.js 16.2.10** — `middleware.ts` is deprecated; this app uses **`proxy.ts`** (function name `proxy`, not `middleware`) to gate `/admin/*`. `cookies()`, `params`, and `searchParams` are all async/Promises (no sync fallback in v16). Turbopack is the default dev/build tool.
- **Prisma 7.8.0** — uses the new `prisma-client` generator (output at `app/generated/prisma`, gitignored) instead of the classic `@prisma/client` package import. No `datasource url` in `schema.prisma` — the DB connection is a **driver adapter** (`@prisma/adapter-neon`, wired in `lib/prisma.ts`) passed to the `PrismaClient` constructor.
- **Tailwind v4** — CSS-first config via `@theme` in `app/globals.css` (no `tailwind.config.js`). Brand tokens (colors, fonts) are defined there, pulled from `../DESIGN.md`.
- **Stripe SDK v22.**

### Where this diverged from/extended the spec above
- **Domain corrected**: the Anchor Goal originally said `admin.fableandframestudio.com` (singular). Fixed to `admin.fableandframestudios.com` (plural) to match the real registered domain (`astro.config.mjs`'s `site:` and the Pixieset client-login link both use plural).
- **`inquired → booked → paid` gap resolved**: the pipeline list implies a distinct "booked" stage, but the Core Flows narrative jumped straight from `inquired` to `paid`. Resolved as: `Lead.status` → `"booked"` when the Stripe Checkout session + `Booking` row are created (`/book/[slotId]/checkout`), → `"paid"` once payment is confirmed (`/book/confirmation`).
- **Slot availability is keyed off booking existence, not just `isBooked`.** `isBooked` only flips true on *confirmed payment*. A slot with a **pending** (unpaid, in-progress) booking is still excluded from the public list and intake form — otherwise a second visitor could select an already-in-progress slot and hit a database error. This was a real bug caught during manual testing (deleting/reusing a slot with a dangling pending booking threw a foreign-key error) and is now fixed everywhere: `/` listing, `/book/[slotId]` availability check, `/admin/slots` edit/delete guards.
- **True concurrent double-booking** (two people submitting the same slot within the same instant) is handled at the database level — `Booking.slotId` is unique, so only one insert can win. The checkout page (`app/book/[slotId]/checkout/page.tsx`) catches that specific Prisma `P2002` error and sends the loser back to the (now correctly-unavailable) slot page instead of showing a raw error.
- **Added beyond spec**: a manual **"Add Lead"** form on `/admin` (name/email/phone/pet info/status, no slot or payment) — for inquiries that come in via DM/phone/email rather than the public booking page. Flagged and confirmed with Spencer before building, since it wasn't in the original scope boundaries.
- **Added beyond spec**: **Delete Lead** on `/admin/leads/[id]` (with a confirm dialog). Deleting a lead with a booking also deletes the booking and resets `Slot.isBooked` back to `false`, so it doubles as the way to release a slot stuck by an abandoned checkout.

### Running locally
```
cd admin
npm install        # if not already
npm run dev         # http://localhost:3000
```
`DATABASE_URL` in `.env` must point at a real Postgres connection string (see "Live database" below) — `npm run dev` will throw on startup otherwise. `ADMIN_PASSWORD` and `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` also need real (test-mode) values; see `.env.example`. Restart the dev server after changing `.env` (Prisma/Stripe/admin-password changes aren't hot-reloaded; page/action code changes are via Turbopack).

**⚠️ Do not put a `sk_live_...` key in this local `.env`.** We caught this once already — test-mode keys (`sk_test_...`) are required for local dev so Stripe's test card numbers work; a live key would attempt to charge a real card.

### Live database (2026-07-09 update)

V1 shipped on SQLite (a local `dev.db` file via `@prisma/adapter-better-sqlite3`) because it was "zero external setup" for getting a working app fast. That doesn't survive a real deployment: Vercel serverless functions have an ephemeral/read-only filesystem, and multiple function instances wouldn't share the same file anyway — writes would either fail or silently vanish. Before this app can be deployed, that had to change.

**Status: done.** A Neon Postgres database (`neon-bronze-book`, provisioned through Vercel's Neon integration — Vercel Storage → Postgres just provisions Neon under the hood) is live and migrated.

- `schema.prisma`'s datasource is `postgresql`. The driver adapter in `lib/prisma.ts` is `@prisma/adapter-neon` (`@neondatabase/serverless` under the hood) — the standard pairing for Vercel/Neon Postgres.
- The old SQLite-dialect migrations were deleted (incompatible SQL dialect, no real data to preserve) and replaced with a fresh Postgres-native migration: `prisma/migrations/20260709044437_init`, applied via `npx prisma migrate dev --name init` against the real Neon connection string.
- The `SessionType` seed row ("Pet Mini Session", $50 deposit, 15 min) was re-inserted directly against Neon (one-off script, not a committed seed file).
- Confirmed the app boots against the live database: `npm run dev` served `/` and correctly pulled "Pet Mini Session" from Neon rather than local SQLite.
- **Still worth checking:** confirm in the Vercel dashboard (Project → Settings → Environment Variables) that the integration synced `DATABASE_URL` to production, not just to this local `.env`. That wasn't verified from here.
- Local dev and production currently point at the **same** Neon database/branch — fine for now given it's a two-person low-stakes tool, but worth splitting into a separate dev branch (Neon branching is free) before real client data starts flowing through it, so local experimentation can't touch live leads.

### Still needed before production
- Real Stripe **live** keys, and a production webhook endpoint registered in the Stripe Dashboard with its own signing secret set as `STRIPE_WEBHOOK_SECRET` (webhook handling itself is done — see above)
- Confirm the placeholder $50 deposit price on the seeded "Pet Mini Session" `SessionType` row — currently a flagged guess, not a real number from Madyson. (Now editable directly in `/admin/session-types`, no code change needed.)
- A real transactional email provider (currently `lib/email.ts` just `console.log`s)
- Production deployment/env vars + DNS for `admin.fableandframestudios.com`
- Confirm `DATABASE_URL` is actually set in Vercel's production env vars (see "Live database" above)
- Manually verify a full test-card payment through the real browser UI end-to-end (headless Playwright automation got stuck on Stripe's hosted Checkout card-entry UI — not a code issue, just an automation gap; the pre-payment path through checkout creation was confirmed working)

---

@AGENTS.md
