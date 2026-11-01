import { apiClient } from "@/lib/services/api-client";
import type { ServiceResponse } from "@/types";

export const expenseCategories = [
  { value: "INGREDIENTS", label: "Ingredients" },
  { value: "PACKAGING", label: "Packaging" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "RENT", label: "Rent" },
  { value: "MAINTENANCE", label: "Maintenance" },
  { value: "TRANSPORT", label: "Transport" },
  { value: "OTHER", label: "Other" },
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number]["value"];

export type Expense = {
  id: string;
  description: string;
  category: ExpenseCategory;
  amountPaisa: number;
  spentAt: string;
  note: string | null;
  createdAt: string;
  createdBy: { name: string };
};

export type ExpenseFilters = {
  from?: string;
  to?: string;
  category?: ExpenseCategory;
};

export type ExpensePageParams = ExpenseFilters & {
  cursor?: string | null;
  limit?: number;
};

export type ExpensesPage = {
  items: Expense[];
  totalPaisa: number;
  totalCount: number;
  hasMore: boolean;
  nextCursor: string | null;
};

export type CreateExpenseInput = {
  description: string;
  category: ExpenseCategory;
  amountPaisa: number;
  spentAt: string;
  note: string | null;
};

export const getExpenses = (
  params: ExpensePageParams = {},
  signal?: AbortSignal,
): ServiceResponse<ExpensesPage> =>
  apiClient.get("/expenses", { params, signal });

export const createExpense = (
  input: CreateExpenseInput,
): ServiceResponse<Expense> => apiClient.post("/expenses", input);
