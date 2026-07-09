import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "ff_admin_session";
const SESSION_PAYLOAD = "admin-session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

function sessionSecret() {
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) {
    throw new Error("ADMIN_PASSWORD environment variable is not set");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", sessionSecret()).update(value).digest("hex");
}

export function sessionToken() {
  return `${SESSION_PAYLOAD}.${sign(SESSION_PAYLOAD)}`;
}

export function checkPassword(candidate: string) {
  const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? "");
  const actual = Buffer.from(candidate);
  return (
    expected.length > 0 &&
    expected.length === actual.length &&
    timingSafeEqual(expected, actual)
  );
}

export async function createSession() {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(SESSION_COOKIE)?.value;
  if (!cookie) return false;
  return cookie === sessionToken();
}
