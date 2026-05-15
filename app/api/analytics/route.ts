import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { query } from "@/lib/db/client";
import { errorResponse, json } from "@/lib/http";

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser(request);
    const result = await query(
      `
      SELECT
        (SELECT COUNT(*)::int FROM documents WHERE user_id = $1) AS "documentCount",
        (SELECT COUNT(*)::int FROM documents WHERE user_id = $1 AND status = 'ready') AS "readyDocumentCount",
        (SELECT COUNT(*)::int FROM document_chunks dc JOIN documents d ON d.id = dc.document_id WHERE d.user_id = $1) AS "chunkCount",
        (SELECT COUNT(*)::int FROM chats WHERE user_id = $1) AS "chatCount",
        (SELECT COALESCE(SUM(m.token_count), 0)::int FROM messages m JOIN chats c ON c.id = m.chat_id WHERE c.user_id = $1) AS "tokenUsage"
      `,
      [user.id]
    );

    return json(result.rows[0]);
  } catch (error) {
    return errorResponse(error);
  }
}
