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
    orderType: OrderType;
  }) => void;
  markAsPaid: (id: string) => void;
  clearOrders: () => void;
};

type OrderStore = OrderStates & { actions: OrderActions };

const store = create<OrderStore>()(
  devtools(
    persist(
      (set) => ({
        receipts: [],
        nextReceiptNumber: 1001,
        actions: {
          addReceipt: (data) =>
            set((state) => {
              const newReceipt: Receipt = {
                ...data,
                id: crypto.randomUUID(),
                receiptNumber: state.nextReceiptNumber,
                status: "UNPAID",
                createdAt: new Date().toISOString(),
                paidAt: null,
              };
              return {
                receipts: [newReceipt, ...state.receipts],
                nextReceiptNumber: state.nextReceiptNumber + 1,
              };
            }),
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
        partialize: (state) => ({
          receipts: state.receipts,
          nextReceiptNumber: state.nextReceiptNumber,
        }),
      },
    ),
  ),
);

export const useOrderStore = () =>
  store(useShallow((state) => ({ receipts: state.receipts })));
export const useOrderActions = () => store((state) => state.actions);
