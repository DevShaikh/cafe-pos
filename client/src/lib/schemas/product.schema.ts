import { z } from "zod";

export const productSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  price: z.string().regex(/^\d+\.\d{2}$/),
  imageUrl: z.url().nullable(),
  category: z.string(),
  isAvailable: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Product = z.infer<typeof productSchema>;
