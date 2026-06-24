import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useEffect, useState } from "react";
import type { User } from "@/shared";
import { setTokens, loadTokens } from "@/lib/api-client";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setAuth: (user, accessToken, refreshToken) => {
        setTokens(accessToken, refreshToken);
        set({ user, isAuthenticated: true });
      },
      clearAuth: () => {
        setTokens(null, null);
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: "kharcha-auth",
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => () => {
        loadTokens();
      },
    }
  )
);

export function useAuthHydration() {
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    const finishHydration = () => {
      loadTokens();
      setHasHydrated(true);
    };

    if (useAuthStore.persist.hasHydrated()) {
      finishHydration();
      return;
    }

    return useAuthStore.persist.onFinishHydration(finishHydration);
  }, []);

  return hasHydrated;
}

interface FilterState {
  search: string;
  categoryId: string;
  month: number | undefined;
  year: number | undefined;
  paymentMethod: string;
  amountMin: number | undefined;
  amountMax: number | undefined;
  dateFrom: string;
  dateTo: string;
  setFilter: <K extends keyof Omit<FilterState, "setFilter" | "resetFilters">>(
    key: K,
    value: FilterState[K]
  ) => void;
  resetFilters: () => void;
}

const defaultFilters = {
  search: "",
  categoryId: "",
  month: undefined as number | undefined,
  year: new Date().getFullYear(),
  paymentMethod: "",
  amountMin: undefined as number | undefined,
  amountMax: undefined as number | undefined,
  dateFrom: "",
  dateTo: "",
};

export const useExpenseFiltersStore = create<FilterState>((set) => ({
  ...defaultFilters,
  setFilter: (key, value) => set({ [key]: value }),
  resetFilters: () => set(defaultFilters),
}));
