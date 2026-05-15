import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { answerQuestion } from "@/lib/rag/chat";
import { errorResponse, json } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { chatRequestSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    rateLimit(request, "chat");
    const user = await requireUser(request);
    const body = chatRequestSchema.parse(await request.json());
    const result = await answerQuestion(user.id, body.message, body.chatId, body.topK);
    return json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
