"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export async function createLead(slotId: string, formData: FormData) {
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { booking: true, sessionType: true },
  });
  if (!slot || slot.booking?.paymentStatus === "paid") {
    redirect("/");
  }

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const addOnQuantityRaw = formData.get("addOnQuantity");
  const addOnQuantity = slot.sessionType.addOnUnitLabel && addOnQuantityRaw
    ? Number(addOnQuantityRaw)
    : null;

  if (!name || !email) {
    redirect(`/book/${slotId}?error=missing-fields`);
  }

  const lead = await prisma.lead.create({
    data: {
      name,
      email,
      phone: phone || null,
      notes: notes || null,
      addOnQuantity,
      status: "inquired",
    },
  });

  redirect(`/book/${slotId}/checkout?leadId=${lead.id}`);
}
