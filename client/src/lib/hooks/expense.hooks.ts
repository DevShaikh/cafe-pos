import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createExpense,
  getExpenses,
  type CreateExpenseInput,
  type ExpenseFilters,
} from "@/lib/services/expense.service";

export const expenseKeys = {
  all: ["expenses"] as const,
  pages: (filters: ExpenseFilters) => ["expenses", "pages", filters] as const,
};

export function useInfiniteExpenses(
  filters: ExpenseFilters,
  enabled = true,
) {
  return useInfiniteQuery({
    queryKey: expenseKeys.pages(filters),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      (
        await getExpenses(
          { ...filters, cursor: pageParam, limit: 10 },
          signal,
        )
      ).data.data,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled,
  });
}

export function useCreateExpense() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateExpenseInput) =>
      createExpense(input).then((response) => response.data.data),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: expenseKeys.all }),
  });
}
