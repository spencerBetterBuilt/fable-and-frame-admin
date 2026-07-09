import Link from "next/link";
import { stripe } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/booking";

export const dynamic = "force-dynamic";

export default async function ConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let paid = false;
  let notCompleted = false;

  if (session_id) {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    if (session.payment_status === "paid") {
      paid = true;
      // Usually a no-op here — the webhook is the source of truth and has
      // likely already fulfilled this session. This is an idempotent
      // fallback for local dev (no webhook listener running) or a slow webhook.
      await fulfillCheckoutSession(session);
    } else {
      notCompleted = true;
    }
  }

  return (
    <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
      {notCompleted ? (
        <>
          <h1 className="font-display text-3xl sm:text-4xl text-ink mb-4">
            Payment not completed
          </h1>
          <p className="font-body text-ink/80 mb-6">
            It looks like checkout wasn&apos;t finished. No worries — you can
            pick a time and try again.
          </p>
          <Link href="/" className="font-body text-dusty-blue-deep underline">
            Back to available sessions
          </Link>
        </>
      ) : (
        <>
          <h1 className="font-display text-3xl sm:text-4xl text-ink mb-4">
            You&apos;re booked!
          </h1>
          <p className="font-body text-ink/80 leading-relaxed">
            Thank you for booking a session with Fable &amp; Frame Studios.
            Your deposit {paid ? "has been received" : "is being processed"}.
            Next, we&apos;ll send over a contract to review and sign — keep
            an eye on your inbox.
          </p>
        </>
      )}
    </main>
  );
}
