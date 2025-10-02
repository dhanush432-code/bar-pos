// store/cartStore.ts
import { create } from 'zustand';
import { IProduct } from '@/models/Product';

export interface CartItem extends IProduct {
  quantity: number;
}

type CartState = {
  items: CartItem[];
  addItem: (product: IProduct) => void;
  removeItem: (barcode: string) => void;
  increaseQuantity: (barcode: string) => void;
  decreaseQuantity: (barcode: string) => void;
  clearCart: () => void;
  getTotal: () => number;
};

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  addItem: (product) => {
    const { items } = get();
    const existingItem = items.find((item) => item.barcode === product.barcode);

    if (existingItem) {
      // If item exists, just increase quantity
      set({
        items: items.map((item) =>
          item.barcode === product.barcode ? { ...item, quantity: item.quantity + 1 } : item
        ),
      });
    } else {
      // Otherwise, add new item
      set({ items: [...items, { ...product, quantity: 1 }] });
    }
  },
  removeItem: (barcode) => {
    set({
      items: get().items.filter((item) => item.barcode !== barcode),
    });
  },
  increaseQuantity: (barcode) => {
    set({
      items: get().items.map((item) =>
        item.barcode === barcode ? { ...item, quantity: item.quantity + 1 } : item
      ),
    });
  },
  decreaseQuantity: (barcode) => {
    set({
      items: get().items
        .map((item) =>
          item.barcode === barcode ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
        )
    });
  },
  clearCart: () => set({ items: [] }),
  getTotal: () => {
    return get().items.reduce((total, item) => total + item.sRate * item.quantity, 0);
  },
}));