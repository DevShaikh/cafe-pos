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
    description: z.string().trim().max(2000).nullable().optional(),
    pricePaisa: z.number().int().min(0).max(9_999_999_999),
    category: z.string().trim().min(1).max(60),
    imageUrl: z.url({ protocol: /^https?$/ }).optional(),
  })
  .strict();

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    pricePaisa: z.number().int().min(0).max(9_999_999_999).optional(),
    category: z.string().trim().min(1).max(60).optional(),
    imageUrl: z.url({ protocol: /^https?$/ }).nullable().optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one product field must be provided.",
  });

export const createCategorySchema = z
  .object({ name: z.string().trim().min(1).max(60) })
  .strict();

export const updateCategorySchema = createCategorySchema;
export const categoryIdSchema = z.string().trim().min(1).max(64);

export type ProductListQuery = z.infer<typeof productListQuerySchema>;
export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
