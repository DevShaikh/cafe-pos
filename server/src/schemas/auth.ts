import { z } from "zod";

export const loginSchema = z.object({
  staffId: z.uuid(),
  pin: z.string().regex(/^\d{4}$/, "Enter your 4-digit PIN."),
}).strict();

export const initialSetupSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    pin: z.string().regex(/^\d{4}$/, "Enter a 4-digit PIN."),
  })
  .strict();

export type LoginInput = z.infer<typeof loginSchema>;
export type InitialSetupInput = z.infer<typeof initialSetupSchema>;
