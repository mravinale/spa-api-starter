/**
 * Global Store (Optional)
 * 
 * With the simplified architecture, features manage their own stores directly.
 * This file can be used for truly global state (theme, auth, etc.)
 * 
 * Example feature stores:
 * - useProductsStore (from @features/Products/productsStore)
 * - useAuthStore (if needed)
 */

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface GlobalState {
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

export const useGlobalStore = create(
  immer<GlobalState>((set) => ({
    theme: 'light',
    setTheme: (theme) => set((state) => {
      state.theme = theme;
    }),
  }))
);
