import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { devtools } from "zustand/middleware";

export type CartItem = {
  id: string;
  name: string;
  pricePaisa: number;
  quantity: number;
};

type cartStates = {
  cartItems: Record<string, CartItem>;
};

type cartActions = {
  setCartStore: (state: Partial<cartStates>) => void;
  clearCartStore: () => void;
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
};

type cartStore = cartStates & { actions: cartActions };

const store = create<cartStore>()(
  devtools((set) => ({
    cartItems: {},
    actions: {
      setCartStore: (state) => set((prev) => ({ ...prev, ...state })),
      clearCartStore: () => set({ cartItems: {} }),
      addItem: (item) =>
        set((state) => {
          const existing = state.cartItems[item.id];
          return {
            cartItems: {
              ...state.cartItems,
              [item.id]: existing
                ? { ...existing, quantity: existing.quantity + 1 }
                : { ...item, quantity: 1 },
            },
          };
        }),
      removeItem: (id) =>
        set((state) => {
          const newItems = { ...state.cartItems };
          delete newItems[id];
          return { cartItems: newItems };
        }),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          cartItems: {
            ...state.cartItems,
            [id]: { ...state.cartItems[id], quantity },
          },
        })),
    },
  })),
);

export const useCartStore = () =>
  store(useShallow((state) => ({ cartItems: state.cartItems })));
export const useCartActions = () => store((state) => state.actions);
