import type { RetrievedChunk } from "@/lib/rag/retriever";

export function buildRagPrompt(question: string, chunks: RetrievedChunk[]) {
  const context = chunks
    .map(
      (chunk, index) => `
[${index + 1}] Document: ${chunk.filename}
Chunk: ${chunk.chunkIndex}
Source ID: ${chunk.chunkId}
Content:
${chunk.content}`
    )
    .join("\n\n");

  return `
You are an internal company knowledge assistant. Answer only from the retrieved context.

Rules:
- If the context does not contain enough evidence, say you do not know from the uploaded documents.
- Do not invent facts, policies, numbers, names, dates, or action items.
- Cite every factual claim using bracket citations like [1] or [2].
- Keep the answer direct and useful.
- End with a "Sources" section listing the cited documents.

Retrieved context:
${context || "No context retrieved."}

Question:
${question}
`;
}

export function buildSummaryPrompt(filename: string, content: string) {
  return `
Summarize this internal company document.

Return JSON only with this shape:
{
  "summary": "short paragraph",
  "keyPoints": ["point"],
  "actionItems": ["action"]
}

Document: ${filename}
Content:
${content.slice(0, 24000)}
`;
}
