import { z } from "zod";

export const loginSchema = z.object({
  staffId: z.uuid(),
  pin: z.string().regex(/^\d{4}$/, "Enter your 4-digit PIN."),
}).strict();

export type LoginInput = z.infer<typeof loginSchema>;
