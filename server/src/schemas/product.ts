import { z } from "zod";

export const productIdSchema = z.uuid();

export const productListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    includeUnavailable: z.enum(["true", "false"]).default("false"),
  })
  .strict();

export const createProductSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    pricePaisa: z.number().int().min(0).max(9_999_999_999),
    category: z.string().trim().min(1).max(60),
    imageUrl: z.url({ protocol: /^https?$/ }).optional(),
  })
  .strict();

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
