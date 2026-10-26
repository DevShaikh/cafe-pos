import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { devtools, persist } from "zustand/middleware";
import { Receipt, OrderStates, OrderType } from "@/types";
import { CartItem } from "./cart.store";

type OrderActions = {
  addReceipt: (receiptData: {
    items: CartItem[];
    subtotal: number;
    tax: number;
    total: number;
    orderType: OrderType;
  }) => Receipt;
  markAsPaid: (id: string) => void;
  clearOrders: () => void;
};

type OrderStore = OrderStates & { actions: OrderActions };

const store = create<OrderStore>()(
  devtools(
    persist(
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
