"use server";

import { redirect } from "next/navigation";
import { checkPassword, createSession } from "@/lib/auth";

export async function login(formData: FormData) {
  const password = String(formData.get("password") ?? "");

  if (!checkPassword(password)) {
    redirect("/admin/login?error=1");
  }

  await createSession();
  redirect("/admin");
}
