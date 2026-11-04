import { z } from "zod";

export const updateTaxSettingsSchema = z
  .object({
    taxEnabled: z.boolean(),
    taxRateBps: z.number().int().min(0).max(10_000),
    orderTypeVisibilityEnabled: z.boolean().optional().default(false),
  })
  .strict();

export type UpdateTaxSettingsInput = z.infer<typeof updateTaxSettingsSchema>;
