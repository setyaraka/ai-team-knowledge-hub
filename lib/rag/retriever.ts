import { query, vectorLiteral } from "@/lib/db/client";
import { embedText } from "@/lib/ai/openai";
import { env } from "@/lib/env";

export type RetrievedChunk = {
  chunkId: string;
  documentId: string;
  filename: string;
  chunkIndex: number;
  content: string;
  similarity: number;
};

export async function retrieveRelevantChunks(
  userId: string,
  questionOrEmbedding: string | number[],
  topK = env.RAG_TOP_K
) {
  const embedding =
    typeof questionOrEmbedding === "string"
      ? await embedText(questionOrEmbedding)
      : questionOrEmbedding;
  const result = await query<RetrievedChunk>(
    `
    SELECT
      dc.id AS "chunkId",
      d.id AS "documentId",
      d.filename,
      dc.chunk_index AS "chunkIndex",
      dc.content,
      1 - (dc.embedding <=> $2::vector) AS similarity
    FROM document_chunks dc
    JOIN documents d ON d.id = dc.document_id
    WHERE d.user_id = $1 AND d.status = 'ready' AND dc.embedding IS NOT NULL
    ORDER BY dc.embedding <=> $2::vector
    LIMIT $3
    `,
    [userId, vectorLiteral(embedding), topK]
  );

  return result.rows;
}
