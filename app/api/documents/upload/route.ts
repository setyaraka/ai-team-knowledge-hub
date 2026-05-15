import type { NextRequest } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { createDocumentRecord, processDocument } from "@/lib/documents/processor";
import { validateFile } from "@/lib/documents/extract";
import { env } from "@/lib/env";
import { errorResponse, json } from "@/lib/http";
import { rateLimit } from "@/lib/rate-limit";
import { uploadOptionsSchema } from "@/lib/validation/schemas";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    rateLimit(request, "upload");
    const user = await requireUser(request);
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      throw Object.assign(new Error("Missing file"), { status: 400 });
    }

    validateFile(file, env.MAX_UPLOAD_MB * 1024 * 1024);
    const options = uploadOptionsSchema.parse({
      chunkSize: form.get("chunkSize") ?? undefined,
      chunkOverlap: form.get("chunkOverlap") ?? undefined,
      metadata: form.get("metadata") ?? undefined
    });
    const metadata = options.metadata ? JSON.parse(options.metadata) : {};
    const documentId = await createDocumentRecord(user.id, file, { ...options, metadata });

    processDocument(documentId, file, { ...options, metadata }).catch((error) => {
      console.error("document.processing.background_error", { documentId, error });
    });

    return json({ documentId, status: "processing" }, 202);
  } catch (error) {
    return errorResponse(error);
  }
}
