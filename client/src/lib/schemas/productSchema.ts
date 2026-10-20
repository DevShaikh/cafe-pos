import { z } from "zod";

export const productSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.string().regex(/^\d+\.\d{2}$/),
  category: z.string(),
  imageUrl: z.url().nullable(),
  isAvailable: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Product = z.infer<typeof productSchema>;

export const productsResponseSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  data: z.array(productSchema),
});

export type ProductsResponse = z.infer<typeof productsResponseSchema>;
