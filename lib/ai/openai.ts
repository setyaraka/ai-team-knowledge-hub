import OpenAI from "openai";
import { env } from "@/lib/env";

const client = new OpenAI({
  apiKey: env.SUMOPOD_API_KEY || "sk-Pv8A3N7myoQBeUe5ifr7fQ",
  baseURL: "https://ai.sumopod.com/v1",
});

export async function embedText(text: string): Promise<number[]> {
  const isOaiEmbedding = env.GEMINI_EMBEDDING_MODEL.includes("text-embedding-3");
  const response = await client.embeddings.create({
    model: env.GEMINI_EMBEDDING_MODEL,
    input: text,
    ...(isOaiEmbedding ? { dimensions: 768 } : {}),
  });
  
  return response.data[0].embedding;
}

export async function embedMany(texts: string[]): Promise<number[][]> {
  const isOaiEmbedding = env.GEMINI_EMBEDDING_MODEL.includes("text-embedding-3");
  const response = await client.embeddings.create({
    model: env.GEMINI_EMBEDDING_MODEL,
    input: texts,
    ...(isOaiEmbedding ? { dimensions: 768 } : {}),
  });
  
  return response.data.map(d => d.embedding);
}

export async function generateText(prompt: string, isJson: boolean = false): Promise<string> {
  const response = await client.chat.completions.create({
    model: env.GEMINI_CHAT_MODEL,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
    max_tokens: 1400,
    response_format: isJson ? { type: "json_object" } : { type: "text" },
  });

  return response.choices[0].message.content || "";
}
