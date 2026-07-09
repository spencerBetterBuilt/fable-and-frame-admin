"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createSlot(formData: FormData) {
  const sessionTypeId = String(formData.get("sessionTypeId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const durationMin = Number(formData.get("durationMin") ?? 30);

  if (!sessionTypeId || !date || !startTime) return;

  await prisma.slot.create({
    data: {
      sessionTypeId,
      date: new Date(`${date}T00:00:00`),
      startTime,
      durationMin,
    },
  });
  revalidatePath("/admin/slots");
  revalidatePath("/");
}

export async function updateSlot(slotId: string, formData: FormData) {
  const sessionTypeId = String(formData.get("sessionTypeId") ?? "");
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("startTime") ?? "");
  const durationMin = Number(formData.get("durationMin") ?? 30);

  if (!sessionTypeId || !date || !startTime) return;

  // A pending checkout (Booking exists but isBooked is still false) already
  // points a lead at this slot's date/time — block edits so we don't change
  // it out from under them mid-checkout.
  const booking = await prisma.booking.findUnique({ where: { slotId } });
  if (booking) return;

  await prisma.slot.update({
    where: { id: slotId },
    data: {
      sessionTypeId,
      date: new Date(`${date}T00:00:00`),
      startTime,
      durationMin,
    },
  });
  revalidatePath("/admin/slots");
  revalidatePath("/");
}

export async function deleteSlot(slotId: string) {
  // Guard on any Booking row, not just isBooked — a pending (unpaid) booking
  // still holds a foreign key to this slot and would fail deletion.
  const booking = await prisma.booking.findUnique({ where: { slotId } });
  if (booking) return;

  await prisma.slot.delete({ where: { id: slotId } });
  revalidatePath("/admin/slots");
  revalidatePath("/");
}
