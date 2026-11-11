import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { findUserById } from "./repository";

const COOKIE_NAME = "farm_portal_session";
const SESSION_LENGTH_SECONDS = 60 * 60 * 12;
const secret = process.env.AUTH_SECRET ?? "development-only-change-me";

function signature(value: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export async function createSession(userId: string) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_LENGTH_SECONDS;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString("base64url");
  const token = `${payload}.${signature(payload)}`;

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_LENGTH_SECONDS,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return null;

  const [payload, suppliedSignature] = token.split(".");
  if (!payload || !suppliedSignature) return null;

  const expected = Buffer.from(signature(payload));
  const supplied = Buffer.from(suppliedSignature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) return null;

  try {
    const session = JSON.parse(Buffer.from(payload, "base64url").toString()) as {
      userId: string;
      expiresAt: number;
    };
    if (session.expiresAt <= Math.floor(Date.now() / 1000)) return null;
    return findUserById(session.userId);
  } catch {
    return null;
  }
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
