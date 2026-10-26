import { z } from "zod";

export const createOrderSchema = z
  .object({
    orderType: z.enum(["DINE_IN", "TAKEAWAY"]),
    items: z
      .array(
        z
          .object({
            productId: z.uuid(),
            quantity: z.number().int().min(1).max(999),
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict()
  .superRefine(({ items }, context) => {
    const productIds = items.map(({ productId }) => productId);
    if (new Set(productIds).size !== productIds.length) {
      context.addIssue({
        code: "custom",
        path: ["items"],
        message: "Each product may appear only once in an order.",
      });
    }
  });

export const recordPaymentSchema = z
  .object({
    method: z.enum(["CASH", "CARD_MANUAL", "EASYPAISA", "OTHER"]),
  })
  .strict();

export const orderIdSchema = z.uuid();
export const idempotencyKeySchema = z.string().trim().min(1).max(200);
const dateRangeFields = {
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
};

function validateDateRange(
  range: { from?: string; to?: string },
  context: z.RefinementCtx,
) {
  if (range.from && range.to && Date.parse(range.from) >= Date.parse(range.to)) {
    context.addIssue({
      code: "custom",
      path: ["to"],
      message: "The end date must be later than the start date.",
    });
  }
}

export const listOrdersQuerySchema = z
  .object({
    ...dateRangeFields,
    cursor: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict()
  .superRefine(validateDateRange);

export const salesReportQuerySchema = z
  .object(dateRangeFields)
  .strict()
  .superRefine(validateDateRange);

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type RecordPaymentInput = z.infer<typeof recordPaymentSchema>;
export type ListOrdersInput = z.infer<typeof listOrdersQuerySchema>;
export type SalesReportInput = z.infer<typeof salesReportQuerySchema>;
