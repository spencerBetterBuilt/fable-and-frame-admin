"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function updateLeadStatus(leadId: string, formData: FormData) {
  const status = String(formData.get("status") ?? "");
  await prisma.lead.update({ where: { id: leadId }, data: { status } });
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin");
}

export async function updateBookingContract(
  bookingId: string,
  leadId: string,
  formData: FormData
) {
  const contractLink = String(formData.get("contractLink") ?? "").trim();
  const contractStatus = String(formData.get("contractStatus") ?? "not_sent");

  await prisma.booking.update({
    where: { id: bookingId },
    data: { contractLink: contractLink || null, contractStatus },
  });
  revalidatePath(`/admin/leads/${leadId}`);
  revalidatePath("/admin");
}

export async function deleteLead(leadId: string) {
  const lead = await prisma.lead.findUnique({
    where: { id: leadId },
    include: { booking: true },
  });
  if (!lead) redirect("/admin");

  await prisma.$transaction([
    ...(lead.booking ? [prisma.booking.delete({ where: { id: lead.booking.id } })] : []),
    // Freed slot goes fully back to "Open" — otherwise it'd stay stuck as
    // isBooked=true with no booking pointing at it, forever unbookable.
    ...(lead.booking
      ? [prisma.slot.update({ where: { id: lead.booking.slotId }, data: { isBooked: false } })]
      : []),
    prisma.lead.delete({ where: { id: leadId } }),
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/slots");
  revalidatePath("/");
  redirect("/admin");
}
