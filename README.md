# Fable & Frame Studios — Booking & CRM Admin Tool

A separate Next.js app (own deploy, own subdomain) for booking fixed-concept photo sessions (pet minis, family portraits, etc.) and tracking leads through the pipeline. See [`CLAUDE.md`](./CLAUDE.md) for the full spec and as-built implementation notes — read that first if you're picking this up cold.

## Setup

```bash
npm install
```

Copy `.env.example` to `.env` and fill in real values:

- `DATABASE_URL` — a Postgres connection string (Neon or Vercel Postgres; get one from their dashboard — a free dev branch works fine locally). SQLite is no longer supported.
- `STRIPE_SECRET_KEY` / `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` — **test-mode** keys (`sk_test_...` / `pk_test_...`) from the Stripe Dashboard. Do not use live keys locally.
- `STRIPE_WEBHOOK_SECRET` — run `stripe listen --forward-to localhost:3000/api/stripe/webhook` (Stripe CLI) and paste the `whsec_...` it prints
- `ADMIN_PASSWORD` — the shared admin login password (also doubles as the session-cookie signing secret)

Once `DATABASE_URL` points at a real (even empty) Postgres database:

```bash
npx prisma migrate dev
```

## Running

```bash
npm run dev
```

- Public booking flow: [http://localhost:3000/](http://localhost:3000/)
- Admin: [http://localhost:3000/admin/login](http://localhost:3000/admin/login)

Restart the dev server after editing `.env` (env changes aren't hot-reloaded; page/action code is).

## Testing a full booking

1. Log into `/admin`, add an open slot at `/admin/slots`.
2. On `/`, click through the intake form for that slot.
3. On the real Stripe Checkout page, use a test card: `4242 4242 4242 4242`, any future expiry, any CVC/ZIP.
4. Confirm the lead shows up in `/admin` with status **Paid**.

## Build / deploy

```bash
npm run build
npm run start
```

Not yet configured for production — see the "Still needed before production" section in `CLAUDE.md`.
