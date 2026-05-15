import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return json({ error: "Validation failed", details: error.flatten() }, 400);
  }

  const status = typeof error === "object" && error && "status" in error ? Number(error.status) : 500;
  const message = error instanceof Error ? error.message : "Unexpected error";
  console.error("api.error", { status, message, error });
  return json({ error: status === 500 ? "Internal server error" : message }, status);
}

export function assertApiError(condition: unknown, message: string, status = 400): asserts condition {
  if (!condition) {
    throw Object.assign(new Error(message), { status });
  }
}
