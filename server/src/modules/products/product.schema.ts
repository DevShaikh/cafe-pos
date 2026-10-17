import { z } from "zod";

export const productListQuerySchema = z
  .object({
    search: z.string().trim().min(1).max(100).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    includeUnavailable: z.enum(["true", "false"]).default("false"),
  })
  .strict();

export const productIdSchema = z.uuid();

export const createProductSchema = z
  .object({
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(2000).optional(),
    price: z
      .string()
      .regex(/^(?:0|[1-9]\d{0,7})(?:\.\d{1,2})?$/, {
        message: "Price must be a non-negative amount with at most two decimals.",
      }),
    category: z.string().trim().min(1).max(60),
    imageUrl: z.url().optional(),
  })
  .strict();

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
