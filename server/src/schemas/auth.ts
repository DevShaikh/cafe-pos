import { z } from "zod";

export const loginSchema = z.object({
  staffId: z.uuid(),
  pin: z.string().min(4, "PIN must be at least 4 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;
