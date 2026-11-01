import { z } from "zod";

export const expenseCategories = [
  "INGREDIENTS",
  "PACKAGING",
  "UTILITIES",
  "RENT",
  "MAINTENANCE",
  "TRANSPORT",
  "OTHER",
] as const;

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

export const listExpensesQuerySchema = z
  .object({
    ...dateRangeFields,
    category: z.enum(expenseCategories).optional(),
    search: z.string().trim().max(100).optional(),
    cursor: z.uuid().optional(),
    limit: z.coerce.number().int().min(1).max(100).default(50),
  })
  .strict()
  .superRefine(validateDateRange);

export const createExpenseSchema = z
  .object({
    description: z.string().trim().min(1).max(120),
    category: z.enum(expenseCategories),
    amountPaisa: z.number().int().min(1).max(2_147_483_647),
    spentAt: z.iso.datetime({ offset: true }),
    note: z.string().trim().max(500).nullable().optional(),
  })
  .strict();

export type ListExpensesInput = z.infer<typeof listExpensesQuerySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
