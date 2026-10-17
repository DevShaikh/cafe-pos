import { z } from "zod";

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string(),
  price: z.number(),
  imageUrl: z.url(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Product = z.infer<typeof productSchema>;
