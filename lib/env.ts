import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  GEMINI_API_KEY: z.string().min(1),
  GEMINI_CHAT_MODEL: z.string().default("gemini-1.5-flash"),
  GEMINI_EMBEDDING_MODEL: z.string().default("gemini-embedding-001"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  MAX_UPLOAD_MB: z.coerce.number().int().positive().default(10),
  DEFAULT_CHUNK_SIZE: z.coerce.number().int().min(200).max(4000).default(900),
  DEFAULT_CHUNK_OVERLAP: z.coerce.number().int().min(0).max(1000).default(150),
  RAG_TOP_K: z.coerce.number().int().min(1).max(20).default(5),
  RATE_LIMIT_REQUESTS: z.coerce.number().int().positive().default(60),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60)
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_CHAT_MODEL: process.env.GEMINI_CHAT_MODEL,
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  MAX_UPLOAD_MB: process.env.MAX_UPLOAD_MB,
  DEFAULT_CHUNK_SIZE: process.env.DEFAULT_CHUNK_SIZE,
  DEFAULT_CHUNK_OVERLAP: process.env.DEFAULT_CHUNK_OVERLAP,
  RAG_TOP_K: process.env.RAG_TOP_K,
  RATE_LIMIT_REQUESTS: process.env.RATE_LIMIT_REQUESTS,
  RATE_LIMIT_WINDOW_SECONDS: process.env.RATE_LIMIT_WINDOW_SECONDS
});
