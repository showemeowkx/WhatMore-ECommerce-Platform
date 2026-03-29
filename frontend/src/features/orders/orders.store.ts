import { create } from "zustand";
import { persist } from "zustand/middleware";

interface OrdersState {
  hasNewOrders: boolean;
  lastViewedAt: string | null;
  setHasNewOrders: (status: boolean) => void;
  markAsViewed: () => void;
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      hasNewOrders: false,
      lastViewedAt: null,

      setHasNewOrders: (status) => set({ hasNewOrders: status }),

      markAsViewed: () =>
        set({
          hasNewOrders: false,
          lastViewedAt: new Date().toISOString(),
        }),
    }),
    {
      name: "orders-storage",
    },
  ),
);
