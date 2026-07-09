"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { destroySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function logout() {
  await destroySession();
  redirect("/admin/login");
}

// For inquiries that come in outside the public booking page (DM, phone,
// email) — no slot/payment required, since those channels don't touch
// Stripe or a Slot at all.
export async function createManualLead(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const status = String(formData.get("status") ?? "inquired");

  if (!name || !email) return;

  await prisma.lead.create({
    data: {
      name,
      email,
      phone: phone || null,
      notes: notes || null,
      status,
    },
  });
  revalidatePath("/admin");
}
