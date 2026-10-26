import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createOrder,
  getOrders,
  recordOrderPayment,
  type CreateOrderInput,
} from "@/lib/services/order.service";
import type { PaymentMethod } from "@/types";

export const orderKeys = {
  all: ["orders"] as const,
};

export function useOrders() {
  return useQuery({
    queryKey: orderKeys.all,
    queryFn: async ({ signal }) => (await getOrders(signal)).data.data,
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
