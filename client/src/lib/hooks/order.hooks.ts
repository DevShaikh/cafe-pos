import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  createOrder,
  getOrders,
  getSalesReport,
  recordOrderPayment,
  type CreateOrderInput,
  type OrderFilters,
} from "@/lib/services/order.service";
import type { PaymentMethod } from "@/types";

export const orderKeys = {
  all: ["orders"] as const,
  pages: (filters: OrderFilters) => ["orders", "pages", filters] as const,
  sales: (filters: OrderFilters) => ["reports", "sales", filters] as const,
};

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.all,
    queryFn: async ({ signal }) =>
      (await getOrders({ limit: 1 }, signal)).data.data,
  });
}

export function useInfiniteOrders(filters: OrderFilters, enabled = true) {
  return useInfiniteQuery({
    queryKey: orderKeys.pages(filters),
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam, signal }) =>
      (await getOrders({ ...filters, cursor: pageParam, limit: 50 }, signal))
        .data.data,
    getNextPageParam: (lastPage) =>
      lastPage.hasMore ? lastPage.nextCursor : undefined,
    enabled,
  });
}

export function useSalesReport(filters: OrderFilters, enabled = true) {
  return useQuery({
    queryKey: orderKeys.sales(filters),
    queryFn: async ({ signal }) =>
      (await getSalesReport(filters, signal)).data.data,
    enabled,
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ input, idempotencyKey }: { input: CreateOrderInput; idempotencyKey: string }) =>
      createOrder(input, idempotencyKey).then((response) => response.data.data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
}

export function useRecordOrderPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, method, idempotencyKey }: { orderId: string; method: PaymentMethod; idempotencyKey: string }) =>
      recordOrderPayment(orderId, method, idempotencyKey).then((response) => response.data.data),
    onSettled: () => queryClient.invalidateQueries({ queryKey: orderKeys.all }),
  });
}
