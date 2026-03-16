import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface User {
  id: number;
  phone: string;
  name?: string | null;
  surname?: string | null;
  email?: string | null;
  imagePath?: string;
  isAdmin?: boolean;
  selectedStoreId?: number | null;
  deliveryAddress?: string | null;
  apartment?: string | null;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;

  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  setSelectedStore: (storeId: number) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      setAuth: (token, user) => set({ token, user, isAuthenticated: true }),

      setUser: (user) => set({ user }),

      logout: () =>
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        }),

      updateUser: (updates) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },

      setSelectedStore: (storeId) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, selectedStoreId: storeId } });
        }
      },
    }),
    {
      name: "psa-auth-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
