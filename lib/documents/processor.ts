import { embedMany, generateText } from "@/lib/ai/openai";
import { query, vectorLiteral } from "@/lib/db/client";
import { chunkText } from "@/lib/documents/chunk";
import { extractText } from "@/lib/documents/extract";
import { env } from "@/lib/env";
import { buildSummaryPrompt } from "@/lib/rag/prompts";

type ProcessOptions = {
  chunkSize?: number;
  chunkOverlap?: number;
  metadata?: Record<string, unknown>;
};

function safeJsonSummary(raw: string) {
  // Try to find a JSON block in the response
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  const jsonStr = jsonMatch ? jsonMatch[0] : raw;

  try {
    return JSON.parse(jsonStr) as { summary?: string; keyPoints?: string[]; actionItems?: string[] };
  } catch (e) {
    console.error("Failed to parse AI summary JSON:", e);
    // If it's still failing, try one more time by cleaning common markdown
    try {
      const cleaned = raw.replace(/```json/g, "").replace(/```/g, "").trim();
      return JSON.parse(cleaned) as { summary?: string; keyPoints?: string[]; actionItems?: string[] };
    } catch {
      // Last resort: return the raw text as summary
      return { 
        summary: raw.replace(/```json/g, "").replace(/```/g, "").trim().slice(0, 1000), 
        keyPoints: [], 
        actionItems: [] 
      };
    }
  }
}

export async function createDocumentRecord(userId: string, file: File, options: ProcessOptions) {
  const result = await query<{ id: string }>(
    `
    INSERT INTO documents (user_id, filename, content_type, size_bytes, metadata)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
    `,
    [userId, file.name, file.type, file.size, JSON.stringify(options.metadata ?? {})]
  );
  return result.rows[0].id;
}

export async function processDocument(documentId: string, file: File, options: ProcessOptions = {}) {
  try {
    const text = await extractText(file);
    if (text.trim().length < 20) {
      throw new Error("Document did not contain enough extractable text");
    }

    const chunkSize = options.chunkSize ?? env.DEFAULT_CHUNK_SIZE;
    const chunkOverlap = options.chunkOverlap ?? env.DEFAULT_CHUNK_OVERLAP;
    const chunks = chunkText(text, chunkSize, chunkOverlap);
    const embeddings = await embedMany(chunks.map((chunk) => chunk.content));

    for (const chunk of chunks) {
      await query(
        `
        INSERT INTO document_chunks (document_id, chunk_index, content, token_count, embedding, metadata)
        VALUES ($1, $2, $3, $4, $5::vector, $6)
        `,
        [
          documentId,
          chunk.index,
          chunk.content,
          chunk.tokenCount,
          vectorLiteral(embeddings[chunk.index]),
          JSON.stringify({ chunkSize, chunkOverlap })
        ]
      );
    }

    const document = await query<{ filename: string }>("SELECT filename FROM documents WHERE id = $1", [documentId]);
    const summaryRaw = await generateText(buildSummaryPrompt(document.rows[0].filename, text), true);
    const summary = safeJsonSummary(summaryRaw);

    await query(
      `
      UPDATE documents
      SET status = 'ready',
          summary = $2,
          key_points = $3,
          action_items = $4,
          processed_at = now()
      WHERE id = $1
      `,
      [
        documentId,
        summary.summary ?? "",
        JSON.stringify(summary.keyPoints ?? []),
        JSON.stringify(summary.actionItems ?? [])
      ]
    );
  } catch (error) {
    await query("UPDATE documents SET status = 'failed', error_message = $2 WHERE id = $1", [
      documentId,
      error instanceof Error ? error.message : "Processing failed"
    ]);
    throw error;
  }
}
