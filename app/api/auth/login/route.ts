import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/repository";
import { createSession } from "@/lib/session";

/** Maximum field lengths — avoids feeding unbounded strings to scrypt. */
const MAX_EMAIL_LENGTH = 320;
const MAX_PASSWORD_LENGTH = 1024;

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Enter an email and password." }, { status: 400 });
  }

  if (!body.email || !body.password) {
    return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
  }

  if (body.email.length > MAX_EMAIL_LENGTH || body.password.length > MAX_PASSWORD_LENGTH) {
    // Return the same message as an auth failure to avoid leaking policy details.
    return NextResponse.json({ error: "The email or password is incorrect." }, { status: 401 });
  }

  const user = authenticateUser(body.email, body.password);
  if (!user) {
    return NextResponse.json({ error: "The email or password is incorrect." }, { status: 401 });
  }

  await createSession(user.id);
  return NextResponse.json({ user });
}
