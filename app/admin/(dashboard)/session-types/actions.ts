"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function createSessionType(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const depositDollars = Number(formData.get("depositDollars") ?? 0);
  const durationMin = Number(formData.get("durationMin") ?? 30);
  const description = String(formData.get("description") ?? "").trim();

  if (!name || !depositDollars) return;

  await prisma.sessionType.create({
    data: {
      name,
      depositCents: Math.round(depositDollars * 100),
      durationMin,
      description: description || null,
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
  const isActive = formData.get("isActive") === "on";

  if (!name || !depositDollars) return;

  await prisma.sessionType.update({
    where: { id: sessionTypeId },
    data: {
      name,
      depositCents: Math.round(depositDollars * 100),
      durationMin,
      description: description || null,
      isActive,
    },
  });
  revalidatePath("/admin/session-types");
  revalidatePath("/admin/slots");
  revalidatePath("/");
}
