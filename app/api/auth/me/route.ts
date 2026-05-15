import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/lib/auth/session";
import { json } from "@/lib/http";

export async function GET(request: NextRequest) {
  const user = await getSessionFromRequest(request);
  return json({ user });
}
