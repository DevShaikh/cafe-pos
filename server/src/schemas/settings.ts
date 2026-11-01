import { z } from "zod";

export const updateTaxSettingsSchema = z
  .object({
    taxEnabled: z.boolean(),
    taxRateBps: z.number().int().min(0).max(10_000),
  })
  .strict();

export type UpdateTaxSettingsInput = z.infer<
  typeof updateTaxSettingsSchema
>;
