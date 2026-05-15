import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const uploadOptionsSchema = z.object({
  chunkSize: z.coerce.number().int().min(200).max(4000).optional(),
  chunkOverlap: z.coerce.number().int().min(0).max(1000).optional(),
  metadata: z.string().optional()
});

export const chatRequestSchema = z.object({
  message: z.string().min(1).max(4000),
  chatId: z.string().uuid().optional(),
  topK: z.number().int().min(1).max(20).optional()
});
