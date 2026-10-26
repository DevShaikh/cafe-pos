import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { devtools, persist } from "zustand/middleware";
import { Receipt, OrderStates, OrderType } from "@/types";
import { CartItem } from "./cart.store";

type OrderActions = {
  addReceipt: (receiptData: {
    items: CartItem[];
    subtotalPaisa: number;
    taxPaisa: number;
    totalPaisa: number;
    taxRateBps: number;
    orderType: OrderType;
  }) => Receipt;
  markAsPaid: (id: string) => void;
  clearOrders: () => void;
};

type OrderStore = OrderStates & { actions: OrderActions };
type PersistedOrderState = Pick<OrderStore, "receipts" | "nextReceiptNumber">;

function toPaisa(value: unknown): number {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
}

function migrateReceipt(value: unknown): Receipt {
  const oldReceipt =
    value && typeof value === "object"
      ? (value as Record<string, unknown>)
      : {};
  const oldItems = Array.isArray(oldReceipt.items) ? oldReceipt.items : [];

  const items = oldItems.map((value) => {
    const oldItem =
      value && typeof value === "object"
        ? (value as Record<string, unknown>)
        : {};
    return {
      id: String(oldItem.id ?? ""),
      name: String(oldItem.name ?? ""),
      pricePaisa:
        typeof oldItem.pricePaisa === "number"
          ? oldItem.pricePaisa
          : toPaisa(oldItem.price),
      quantity:
        typeof oldItem.quantity === "number" && oldItem.quantity > 0
          ? Math.trunc(oldItem.quantity)
          : 1,
    };
  });

  return {
    id: String(oldReceipt.id ?? crypto.randomUUID()),
    receiptNumber:
      typeof oldReceipt.receiptNumber === "number"
        ? oldReceipt.receiptNumber
        : 0,
    items,
    subtotalPaisa:
      typeof oldReceipt.subtotalPaisa === "number"
        ? oldReceipt.subtotalPaisa
        : toPaisa(oldReceipt.subtotal),
    taxPaisa:
      typeof oldReceipt.taxPaisa === "number"
        ? oldReceipt.taxPaisa
        : toPaisa(oldReceipt.tax),
    totalPaisa:
      typeof oldReceipt.totalPaisa === "number"
        ? oldReceipt.totalPaisa
        : toPaisa(oldReceipt.total),
    taxRateBps:
      typeof oldReceipt.taxRateBps === "number" ? oldReceipt.taxRateBps : 800,
    orderType: oldReceipt.orderType === "TAKEAWAY" ? "TAKEAWAY" : "DINE_IN",
    status: oldReceipt.status === "PAID" ? "PAID" : "UNPAID",
    createdAt: String(oldReceipt.createdAt ?? new Date().toISOString()),
    paidAt: typeof oldReceipt.paidAt === "string" ? oldReceipt.paidAt : null,
  };
}

function migratePersistedOrderState(
  persistedState: unknown,
): PersistedOrderState {
  const oldState =
    persistedState && typeof persistedState === "object"
      ? (persistedState as {
          receipts?: unknown;
          nextReceiptNumber?: unknown;
        })
      : {};

  return {
    receipts: Array.isArray(oldState.receipts)
      ? oldState.receipts.map(migrateReceipt)
      : [],
    nextReceiptNumber:
      typeof oldState.nextReceiptNumber === "number"
        ? oldState.nextReceiptNumber
        : 1001,
  };
}

const store = create<OrderStore>()(
  devtools(
    persist<OrderStore, [], [], PersistedOrderState>(
      (set, get) => ({
        receipts: [],
        nextReceiptNumber: 1001,
        actions: {
          addReceipt: (data) => {
            // Read the current receipt number from the state
            const currentReceiptNumber = get().nextReceiptNumber;

            const newReceipt: Receipt = {
              ...data,
              id: crypto.randomUUID(),
              receiptNumber: currentReceiptNumber,
              status: "UNPAID",
              createdAt: new Date().toISOString(),
              paidAt: null,
            };

            set((state) => ({
              receipts: [newReceipt, ...state.receipts],
              nextReceiptNumber: state.nextReceiptNumber + 1,
            }));

            return newReceipt;
          },
          markAsPaid: (id) =>
            set((state) => ({
              receipts: state.receipts.map((r) =>
                r.id === id
                  ? { ...r, status: "PAID", paidAt: new Date().toISOString() }
                  : r,
              ),
            })),
          clearOrders: () => set({ receipts: [], nextReceiptNumber: 1001 }),
        },
      }),
      {
        name: "cafe-pos-orders",
        version: 1,
        partialize: (state) => ({
          receipts: state.receipts,
          nextReceiptNumber: state.nextReceiptNumber,
        }),
        migrate: migratePersistedOrderState,
      },
    ),
  ),
);

export const useOrderStore = () =>
  store(useShallow((state) => ({ receipts: state.receipts })));
export const useOrderActions = () => store((state) => state.actions);
