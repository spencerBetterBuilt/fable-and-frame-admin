import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { sendEmail, renderBrandedEmail } from "@/lib/email";
import { formatSlotDate, formatSlotTimeRange } from "@/lib/format";

// Source of truth for "this booking got paid." Called from both the Stripe
// webhook (checkout.session.completed) and the success-redirect page, since
// either one can race to be first — the paymentStatus !== "paid" guard below
// makes this safe to call twice for the same session.
export async function fulfillCheckoutSession(session: Stripe.Checkout.Session) {
  if (session.payment_status !== "paid") return;

  const { leadId, slotId, bookingId } = session.metadata ?? {};
  if (!leadId || !slotId || !bookingId) return;

  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.paymentStatus === "paid") return;

  const paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id ?? null;

  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: { paymentStatus: "paid", stripePaymentId: paymentIntentId },
    }),
    prisma.slot.update({
      where: { id: slotId },
      data: { isBooked: true },
    }),
    prisma.lead.update({
      where: { id: leadId },
      data: { status: "paid" },
    }),
  ]);

  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { booking: { include: { slot: { include: { sessionType: true } } } } },
  });
  if (!lead) return;

  const slot = lead.booking?.slot;
  const sessionType = slot?.sessionType;
  const sessionTypeName = sessionType?.name ?? "your session";

  const detailLines = slot
    ? [
        formatSlotDate(slot.date),
        formatSlotTimeRange(slot.startTime, slot.durationMin),
        sessionType?.location ?? "location to be confirmed",
      ]
    : [];
  const details = detailLines.length
    ? detailLines.join("\n")
    : "We'll follow up shortly with your session details.";

  const paymentLine = sessionType?.isFullPayment
    ? "Your payment has been received."
    : "Your deposit has been received.";

  const bodyText = `Thanks for booking ${sessionTypeName} with Fable & Frame Studios. ${paymentLine}\n\n${details}\n\nNext, we'll send over a contract to review and sign — keep an eye on your inbox.`;

  const html = renderBrandedEmail({
    heading: "You're Booked!",
    bodyHtml: `<p style="margin:0 0 16px;">Thanks for booking <strong>${sessionTypeName}</strong> with Fable &amp; Frame Studios. ${paymentLine}</p><p style="margin:0;">Next, we'll send over a contract to review and sign — keep an eye on your inbox.</p>`,
    detailLines: detailLines.length ? detailLines : undefined,
  });

  await sendEmail(lead.email, "You're booked with Fable & Frame Studios!", bodyText, html);
}
