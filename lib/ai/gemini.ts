import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@/lib/env";

const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY || "");

export type Citation = {
  documentId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  quote: string;
};

export async function embedText(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
  const result = await model.embedContent({
    content: { role: "user", parts: [{ text }] },
    outputDimensionality: 768,
  } as any);
  return result.embedding.values;
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const model = genAI.getGenerativeModel({ model: env.GEMINI_EMBEDDING_MODEL });
  const embeddings: number[][] = [];

  for (const text of texts) {
    const result = await model.embedContent({
      content: { role: "user", parts: [{ text }] },
      outputDimensionality: 768,
    } as any);
    embeddings.push(result.embedding.values);
  }

  return embeddings;
}

export async function generateText(prompt: string, isJson: boolean = false) {
  const model = genAI.getGenerativeModel({
    model: env.GEMINI_CHAT_MODEL,
    generationConfig: {
      temperature: 0.2,
      topP: 0.8,
      maxOutputTokens: 1400,
      responseMimeType: isJson ? "application/json" : "text/plain"
    }
  });

  const result = await model.generateContent(prompt);
  return result.response.text();
}
