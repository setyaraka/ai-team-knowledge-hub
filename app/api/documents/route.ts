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
        id,
        filename,
        content_type AS "contentType",
        size_bytes AS "sizeBytes",
        status,
        summary,
        key_points AS "keyPoints",
        action_items AS "actionItems",
        metadata,
        error_message AS "errorMessage",
        created_at AS "createdAt",
        processed_at AS "processedAt"
      FROM documents
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [user.id]
    );

    return json({ documents: result.rows });
  } catch (error) {
    return errorResponse(error);
  }
}
