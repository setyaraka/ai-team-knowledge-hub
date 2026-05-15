import { generateText } from "@/lib/ai/gemini";
import { query } from "@/lib/db/client";
import { env } from "@/lib/env";
import { buildRagPrompt } from "@/lib/rag/prompts";
import { retrieveRelevantChunks } from "@/lib/rag/retriever";

function estimateTokens(text: string) {
  return Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.33);
}

export async function answerQuestion(userId: string, message: string, chatId?: string, topK = env.RAG_TOP_K) {
  const chat =
    chatId ??
    (
      await query<{ id: string }>(
        "INSERT INTO chats (user_id, title) VALUES ($1, $2) RETURNING id",
        [userId, message.slice(0, 80)]
      )
    ).rows[0].id;

  await query(
    "INSERT INTO messages (chat_id, role, content, token_count) VALUES ($1, 'user', $2, $3)",
    [chat, message, estimateTokens(message)]
  );

  const chunks = await retrieveRelevantChunks(userId, message, topK);

  if (chunks.length === 0) {
    const fallback =
      "I do not know from the uploaded documents yet. Upload or finish processing relevant documents, then ask again.";
    await query(
      "INSERT INTO messages (chat_id, role, content, citations, token_count) VALUES ($1, 'assistant', $2, $3, $4)",
      [chat, fallback, JSON.stringify([]), estimateTokens(fallback)]
    );
    return { chatId: chat, answer: fallback, citations: [] };
  }

  const answer = await generateText(buildRagPrompt(message, chunks));
  const citations = chunks.map((chunk, index) => ({
    marker: index + 1,
    documentId: chunk.documentId,
    documentName: chunk.filename,
    chunkId: chunk.chunkId,
    chunkIndex: chunk.chunkIndex,
    similarity: chunk.similarity,
    quote: chunk.content.slice(0, 260)
  }));

  await query(
    "INSERT INTO messages (chat_id, role, content, citations, token_count) VALUES ($1, 'assistant', $2, $3, $4)",
    [chat, answer, JSON.stringify(citations), estimateTokens(answer)]
  );
  await query("UPDATE chats SET updated_at = now() WHERE id = $1", [chat]);

  return { chatId: chat, answer, citations };
}
