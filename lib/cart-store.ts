import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  image: string;
  material: string;
  color: string;
  quantity: number;
  dimX?: number;
  dimY?: number;
  dimZ?: number;
  dimensions?: { x: number; y: number; z: number };
  unitPrice: number;
}

export interface CartItemInput {
  id?: string;
  productId: string;
  name: string;
  image: string;
  material: string;
  color: string;
  quantity: number;
  dimX?: number;
  dimY?: number;
  dimZ?: number;
  dimensions?: { x: number; y: number; z: number };
  unitPrice: number;
}

interface CartState {
  items: CartItem[];
  addItem: (item: CartItemInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getSubtotal: () => number;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item) =>
        set((state) => {
          const id = item.id || Math.random().toString(36).slice(2);
          // Normalize dimensions
          const dimX = item.dimX ?? item.dimensions?.x ?? 50;
          const dimY = item.dimY ?? item.dimensions?.y ?? 50;
          const dimZ = item.dimZ ?? item.dimensions?.z ?? 50;
          return {
            items: [
              ...(state?.items ?? []),
              {
                ...item,
                id,
                dimX,
                dimY,
                dimZ,
                dimensions: { x: dimX, y: dimY, z: dimZ },
              },
            ],
          };
        }),
      removeItem: (id) =>
        set((state) => ({
          items: (state?.items ?? []).filter((i) => i?.id !== id),
        })),
      updateQuantity: (id, quantity) =>
        set((state) => ({
          items: (state?.items ?? []).map((i) =>
            i?.id === id
              ? { ...(i ?? {}), quantity: Math.max(1, quantity) }
              : i,
          ),
        })),
      clearCart: () => set({ items: [] }),
      getSubtotal: () => {
        const items = get()?.items ?? [];
        return items.reduce(
          (sum, i) => sum + (i?.unitPrice ?? 0) * (i?.quantity ?? 1),
          0,
        );
      },
    }),
    { name: "3dprint-cart" },
  ),
);
