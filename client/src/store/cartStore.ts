import { create } from "zustand";
import { useShallow } from "zustand/shallow";
import { devtools } from "zustand/middleware";

type cartStates = {
  readonly cartItems: Record<string, number>;
};

type cartActions = {
  setCartStore: (state: Partial<cartStates>) => void;
  clearCartStore: () => void;
};

type cartStore = cartStates & {
  actions: cartActions;
};

const store = create<cartStore>()(
  devtools((set) => ({
    cartItems: {},
    actions: {
      setCartStore: (state) =>
        set((prev) => ({
          ...prev,
          ...state,
        })),
      clearCartStore: () => set({ cartItems: {} }),
    },
  })),
);

export const useCartStore = () =>
  store(
    useShallow((state) => ({
      cartItems: state.cartItems,
    })),
  );

export const useCartActions = () => store((state) => state.actions);
