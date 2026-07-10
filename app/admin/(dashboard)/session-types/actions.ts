"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

function parseAddOn(formData: FormData) {
  const addOnUnitLabel = String(formData.get("addOnUnitLabel") ?? "").trim();
  const addOnUnitPriceDollars = Number(formData.get("addOnUnitPriceDollars") ?? 0);
  const addOnIncludedUnits = Number(formData.get("addOnIncludedUnits") ?? 1);

  if (!addOnUnitLabel) {
    return { addOnUnitLabel: null, addOnUnitPriceCents: null, addOnIncludedUnits: 1 };
  }
  return {
    addOnUnitLabel,
    addOnUnitPriceCents: Math.round(addOnUnitPriceDollars * 100),
    addOnIncludedUnits,
  };
}

export async function createSessionType(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const depositDollars = Number(formData.get("depositDollars") ?? 0);
  const durationMin = Number(formData.get("durationMin") ?? 30);
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const isFullPayment = formData.get("isDeposit") !== "on";
  const addOn = parseAddOn(formData);

  if (!name || !depositDollars) return;

  await prisma.sessionType.create({
    data: {
      name,
      depositCents: Math.round(depositDollars * 100),
      isFullPayment,
      durationMin,
      description: description || null,
      location: location || null,
      ...addOn,
    },
  });
  revalidatePath("/admin/session-types");
  revalidatePath("/admin/slots");
  revalidatePath("/");
}

export async function updateSessionType(sessionTypeId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const depositDollars = Number(formData.get("depositDollars") ?? 0);
  const durationMin = Number(formData.get("durationMin") ?? 30);
  const description = String(formData.get("description") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const isActive = formData.get("isActive") === "on";
  const isFullPayment = formData.get("isDeposit") !== "on";
  const addOn = parseAddOn(formData);

  if (!name || !depositDollars) return;

  await prisma.sessionType.update({
    where: { id: sessionTypeId },
    data: {
      name,
      depositCents: Math.round(depositDollars * 100),
      isFullPayment,
      durationMin,
      description: description || null,
      location: location || null,
      isActive,
      ...addOn,
    },
  });
  revalidatePath("/admin/session-types");
  revalidatePath("/admin/slots");
  revalidatePath("/");
}
