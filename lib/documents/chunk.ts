export type TextChunk = {
  content: string;
  index: number;
  tokenCount: number;
};

function estimateTokens(text: string) {
  return Math.ceil(text.trim().split(/\s+/).filter(Boolean).length * 1.33);
}

export function chunkText(text: string, chunkSize: number, overlap: number): TextChunk[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").trim();
  const words = normalized.split(/\s+/).filter(Boolean);
  const chunks: TextChunk[] = [];
  const safeOverlap = Math.min(overlap, chunkSize - 1);
  let start = 0;

  while (start < words.length) {
    const end = Math.min(start + chunkSize, words.length);
    const content = words.slice(start, end).join(" ");
    chunks.push({ content, index: chunks.length, tokenCount: estimateTokens(content) });
    if (end === words.length) break;
    start = end - safeOverlap;
  }

  return chunks;
}
