import { z } from "zod";

export const productSchema = z.object({
  id: z.uuid(),
  name: z.string(),
  description: z.string().nullable(),
  pricePaisa: z.number().int().nonnegative(),
  imageUrl: z
    .union([
      z.url(),
      z.string().regex(
        /^\/api\/products\/images\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(?:jpg|png|webp)$/i,
      ),
    ])
    .nullable(),
  category: z.string(),
  isAvailable: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Product = z.infer<typeof productSchema>;
