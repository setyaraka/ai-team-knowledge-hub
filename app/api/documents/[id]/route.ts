import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { query } from "@/lib/db/client";
import { errorResponse, json } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const user = await requireUser(request);
    const { id } = await params;
    const result = await query("DELETE FROM documents WHERE id = $1 AND user_id = $2 RETURNING id", [id, user.id]);

    if (result.rowCount === 0) {
      throw Object.assign(new Error("Document not found"), { status: 404 });
    }

    return json({ ok: true });
  } catch (error) {
    return errorResponse(error);
  }
}
