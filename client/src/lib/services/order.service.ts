import { apiClient } from "@/lib/services/api-client";
import type { OrderType, PaymentMethod, Receipt, ServerOrder, ServiceResponse } from "@/types";

export type CreateOrderInput = {
  orderType: OrderType;
  items: { productId: string; quantity: number }[];
};

export const getOrders = (signal?: AbortSignal): ServiceResponse<ServerOrder[]> =>
  apiClient.get("/orders?limit=200", { signal });

export const createOrder = (
  input: CreateOrderInput,
  idempotencyKey: string,
): ServiceResponse<ServerOrder> =>
  apiClient.post("/orders", input, {
    headers: { "Idempotency-Key": idempotencyKey },
  });

export const recordOrderPayment = (
  orderId: string,
  method: PaymentMethod,
  idempotencyKey: string,
): ServiceResponse<ServerOrder> =>
  apiClient.post(
    `/orders/${encodeURIComponent(orderId)}/payments`,
    { method },
    { headers: { "Idempotency-Key": idempotencyKey } },
  );

export function toReceipt(order: ServerOrder): Receipt {
  return {
    id: order.id,
    receiptNumber: order.receiptNumber,
    items: order.items.map((item) => ({
      id: item.productId ?? item.id,
      name: item.nameSnapshot,
      pricePaisa: item.unitPricePaisa,
      quantity: item.quantity,
    })),
    subtotalPaisa: order.subtotalPaisa,
    taxPaisa: order.taxPaisa,
    totalPaisa: order.totalPaisa,
    taxRateBps: order.taxRateBps,
    orderType: order.orderType,
    status: order.status === "PAID" ? "PAID" : order.status === "VOIDED" ? "VOIDED" : "UNPAID",
    createdAt: order.createdAt,
    paidAt: order.paidAt,
  };
}
