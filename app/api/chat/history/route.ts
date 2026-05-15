import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { query } from "@/lib/db/client";
import { errorResponse, json } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const chats = await query(
      `
      SELECT id, title, created_at AS "createdAt", updated_at AS "updatedAt"
      FROM chats
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 20
      `,
      [user.id]
    );

    const messages = await query(
      `
      SELECT m.id, m.chat_id AS "chatId", m.role, m.content, m.citations, m.created_at AS "createdAt"
      FROM messages m
      JOIN chats c ON c.id = m.chat_id
      WHERE c.user_id = $1
      ORDER BY m.created_at ASC
      LIMIT 200
      `,
      [user.id]
    );

    return json({ chats: chats.rows, messages: messages.rows });
  } catch (error) {
    return errorResponse(error);
  }
}
