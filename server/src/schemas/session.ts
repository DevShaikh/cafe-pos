import { z } from "zod";

export const sessionIdSchema = z.uuid();
export const idempotencyKeySchema = z.string().trim().min(1).max(200);
export const listSessionsQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
  })
  .strict();

export type ListSessionsInput = z.infer<typeof listSessionsQuerySchema>;
