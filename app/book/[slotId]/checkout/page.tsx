import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/app/generated/prisma/client";
import { stripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

async function getOrigin() {
  const headerList = await headers();
  const host = headerList.get("host");
  const protocol = host?.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ slotId: string }>;
  searchParams: Promise<{ leadId?: string }>;
}) {
  const { slotId } = await params;
  const { leadId } = await searchParams;

  const slot = leadId
    ? await prisma.slot.findUnique({
        where: { id: slotId },
        include: { booking: true, sessionType: true },
      })
    : null;
  const lead = leadId
    ? await prisma.lead.findUnique({ where: { id: leadId } })
    : null;

  // A booking already on this slot for a *different* lead means someone
  // else claimed it first (in the gap before either of them pays) — send
  // this visitor back rather than crashing on the unique constraint below.
  // If it's the same lead retrying (e.g. hit back after a cancelled
  // checkout), fall through and reuse/refresh their existing booking.
  const heldByOtherLead = slot?.booking && slot.booking.leadId !== lead?.id;

  if (!slot || heldByOtherLead || !lead) {
    redirect("/");
  }

  let booking;
  try {
    booking = await prisma.booking.upsert({
      where: { leadId: lead.id },
      update: {},
      create: {
        leadId: lead.id,
        slotId: slot.id,
        paymentStatus: "pending",
        contractStatus: "not_sent",
      },
    });
  } catch (err) {
    // True simultaneous race: both visitors passed the availability check
    // above before either had created a booking, and the database's unique
    // constraint on Booking.slotId let only one of them through. Send the
    // loser back to the slot page, which now correctly shows "no longer
    // available" since the winner's booking exists.
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      redirect(`/book/${slot.id}`);
    }
    throw err;
  }

  const origin = await getOrigin();

  const { sessionType } = slot;
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      quantity: 1,
      price_data: {
        currency: "usd",
        unit_amount: sessionType.depositCents,
        product_data: {
          name: `${sessionType.name}${sessionType.isFullPayment ? "" : " — Deposit"}`,
        },
      },
    },
  ];

  if (sessionType.addOnUnitLabel && sessionType.addOnUnitPriceCents != null) {
    const extraUnits = Math.max(
      0,
      (lead.addOnQuantity ?? sessionType.addOnIncludedUnits) - sessionType.addOnIncludedUnits
    );
    if (extraUnits > 0) {
      lineItems.push({
        quantity: extraUnits,
        price_data: {
          currency: "usd",
          unit_amount: sessionType.addOnUnitPriceCents,
          product_data: {
            name: `Additional ${sessionType.addOnUnitLabel} (×${extraUnits})`,
          },
        },
      });
    }
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: lead.email,
    line_items: lineItems,
    metadata: {
      leadId: lead.id,
      slotId: slot.id,
      bookingId: booking.id,
    },
    success_url: `${origin}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/book/${slot.id}`,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { stripeSessionId: session.id },
  });
  await prisma.lead.update({
    where: { id: lead.id },
    data: { status: "booked" },
  });

  redirect(session.url!);
}
