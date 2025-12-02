import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';

interface ProductsState {
    favoriteProducts: string[];
    addFavorite: (productId: string) => void;
    removeFavorite: (productId: string) => void;
    toggleFavorite: (productId: string) => void;
    isFavorite: (productId: string) => boolean;
}

export const useProductsStore = create(
    immer<ProductsState>((set, get) => ({
        favoriteProducts: [],

        addFavorite: (productId) =>
            set((state) => {
                if (!state.favoriteProducts.includes(productId)) {
                    state.favoriteProducts.push(productId);
                }
            }),

        removeFavorite: (productId) =>
            set((state) => {
                state.favoriteProducts = state.favoriteProducts.filter(
                    (id) => id !== productId
                );
            }),

        toggleFavorite: (productId) =>
            set((state) => {
                const index = state.favoriteProducts.indexOf(productId);
                if (index > -1) {
                    state.favoriteProducts.splice(index, 1);
                } else {
                    state.favoriteProducts.push(productId);
                }
            }),

        isFavorite: (productId) => get().favoriteProducts.includes(productId),
    }))
);
