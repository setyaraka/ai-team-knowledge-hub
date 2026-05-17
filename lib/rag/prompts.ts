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
- DO NOT add a "Sources" or bibliography section at the end of your response under any circumstances, the system will handle displaying the sources separately.

Retrieved context:
${context || "No context retrieved."}

Question:
${question}
`;
}

export function buildSummaryPrompt(filename: string, content: string) {
  return `
Buat ringkasan untuk dokumen internal perusahaan berikut dalam Bahasa Indonesia.

  Return raw JSON only, NO markdown code blocks, NO backticks.
  Use this exact JSON structure:
  {
    "summary": "paragraf pendek yang merangkum dokumen dalam Bahasa Indonesia",
    "keyPoints": ["poin penting 1 dalam Bahasa Indonesia", "poin penting 2 dalam Bahasa Indonesia"],
    "actionItems": ["tindakan yang harus dilakukan 1 dalam Bahasa Indonesia", "tindakan yang harus dilakukan 2 dalam Bahasa Indonesia"]
  }

Dokumen: ${filename}
Konten:
${content.slice(0, 24000)}
`;
}
