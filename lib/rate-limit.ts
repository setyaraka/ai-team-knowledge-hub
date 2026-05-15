import type { NextRequest } from "next/server";
import { env } from "@/lib/env";

const hits = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(request: NextRequest, keyPrefix = "api") {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    request.headers.get("x-real-ip") ??
    "local";
  const key = `${keyPrefix}:${ip}`;
  const now = Date.now();
  const windowMs = env.RATE_LIMIT_WINDOW_SECONDS * 1000;
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  entry.count += 1;
  if (entry.count > env.RATE_LIMIT_REQUESTS) {
    throw Object.assign(new Error("Too many requests"), { status: 429 });
  }
}
