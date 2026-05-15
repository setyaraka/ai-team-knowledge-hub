import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { query } from "@/lib/db/client";
import { getSessionFromRequest, type SessionUser } from "@/lib/auth/tokens";

export { clearSessionCookie, createSessionToken, getSessionFromRequest, setSessionCookie } from "@/lib/auth/tokens";

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function requireUser(request: NextRequest): Promise<SessionUser> {
  const user = await getSessionFromRequest(request);
  if (!user) {
    throw Object.assign(new Error("Unauthorized"), { status: 401 });
  }
  return user;
}

export async function findUserByEmail(email: string) {
  const result = await query<SessionUser & { password_hash: string }>(
    "SELECT id, email, name, role, password_hash FROM users WHERE email = $1",
    [email.toLowerCase()]
  );
  return result.rows[0] ?? null;
}
