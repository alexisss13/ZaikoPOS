import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, PosState, PosInputProduct } from '@/types/pos';

// Utilidad interna para recalcular totales
const calculateTotals = (items: CartItem[], discount: number) => {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  return { subtotal, total };
};

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,

      addItem: (product: PosInputProduct) => {
        const { items, discount } = get();
        const existingItem = items.find((i) => i.productId === product.id);
        
        // NORMALIZACIÓN DE PRECIO:
        // Si viene de Prisma es Decimal/String, si viene de UI es Number.
        let price = 0;
        if (typeof product.price === 'number') {
            price = product.price;
        } else if (typeof product.price === 'object' && 'toNumber' in product.price) {
            price = product.price.toNumber(); // Caso Prisma Decimal
        } else {
            price = Number(product.price);
        }

        // Manejo seguro de minStock
        const minStock = product.minStock || 0;

        let newItems;

        if (existingItem) {
          newItems = items.map((i) => 
            i.productId === product.id 
              ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.price }
              : i
          );
        } else {
          newItems = [...items, {
            productId: product.id,
            name: product.name,
            price: price,
            quantity: 1,
            subtotal: price,
            minStock: minStock
          }];
        }

        const totals = calculateTotals(newItems, discount);
        set({ items: newItems, ...totals });
      },

      removeItem: (productId: string) => {
        const { items, discount } = get();
        const newItems = items.filter((i) => i.productId !== productId);
        const totals = calculateTotals(newItems, discount);
        set({ items: newItems, ...totals });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { items, discount } = get();
        
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const newItems = items.map((i) => 
          i.productId === productId 
            ? { ...i, quantity, subtotal: quantity * i.price }
            : i
        );

        const totals = calculateTotals(newItems, discount);
        set({ items: newItems, ...totals });
      },

      setDiscount: (amount: number) => {
        const { items } = get();
        const totals = calculateTotals(items, amount);
        set({ discount: amount, ...totals });
      },

      clearCart: () => {
        set({ items: [], subtotal: 0, discount: 0, total: 0 });
      }
    }),
    {
      name: 'zaiko-pos-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);