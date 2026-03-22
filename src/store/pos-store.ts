import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { CartItem, PosState, PosInputProduct, PosPayment } from '@/types/pos';
import { PaymentMethod } from '@prisma/client';

// Utilidad interna para recalcular totales y vuelto
const calculateTotals = (items: CartItem[], discount: number, tenderedAmount: number) => {
  const subtotal = items.reduce((acc, item) => acc + item.subtotal, 0);
  const total = Math.max(0, subtotal - discount);
  
  // El vuelto solo se calcula si lo entregado es mayor al total
  const changeAmount = Math.max(0, tenderedAmount - total);
  
  return { subtotal, total, changeAmount };
};

export const usePosStore = create<PosState>()(
  persist(
    (set, get) => ({
      // Estados iniciales
      items: [],
      subtotal: 0,
      discount: 0,
      total: 0,
      payments: [],
      tenderedAmount: 0,
      changeAmount: 0,

      // ==========================================
      // ACCIONES DE CARRITO
      // ==========================================
      addItem: (product: PosInputProduct) => {
        const { items, discount, tenderedAmount } = get();
        const existingItem = items.find((i) => i.productId === product.id);
        
        let price = 0;
        if (typeof product.price === 'number') {
            price = product.price;
        } else if (typeof product.price === 'object' && 'toNumber' in product.price) {
            price = product.price.toNumber();
        } else {
            price = Number(product.price);
        }

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

        const totals = calculateTotals(newItems, discount, tenderedAmount);
        set({ items: newItems, ...totals });
      },

      removeItem: (productId: string) => {
        const { items, discount, tenderedAmount } = get();
        const newItems = items.filter((i) => i.productId !== productId);
        const totals = calculateTotals(newItems, discount, tenderedAmount);
        set({ items: newItems, ...totals });
      },

      updateQuantity: (productId: string, quantity: number) => {
        const { items, discount, tenderedAmount } = get();
        
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        const newItems = items.map((i) => 
          i.productId === productId 
            ? { ...i, quantity, subtotal: quantity * i.price }
            : i
        );

        const totals = calculateTotals(newItems, discount, tenderedAmount);
        set({ items: newItems, ...totals });
      },

      setDiscount: (amount: number) => {
        const { items, tenderedAmount } = get();
        const totals = calculateTotals(items, amount, tenderedAmount);
        set({ discount: amount, ...totals });
      },

      clearCart: () => {
        set({ 
          items: [], subtotal: 0, discount: 0, total: 0, 
          payments: [], tenderedAmount: 0, changeAmount: 0 
        });
      },

      // ==========================================
      // ACCIONES DE PAGO
      // ==========================================
      addPayment: (payment: PosPayment) => {
        const { payments } = get();
        const existingIndex = payments.findIndex(p => p.method === payment.method);
        
        // CORRECCIÓN AQUÍ: Se usa const en lugar de let
        const newPayments = [...payments]; 
        if (existingIndex >= 0) {
          // Si ya existe el método (ej. agrega más efectivo), lo sumamos
          newPayments[existingIndex] = { 
            ...newPayments[existingIndex], 
            amount: newPayments[existingIndex].amount + payment.amount 
          };
        } else {
          newPayments.push(payment);
        }
        
        set({ payments: newPayments });
      },

      removePayment: (method: PaymentMethod) => {
        const { payments } = get();
        set({ payments: payments.filter(p => p.method !== method) });
      },

      setTenderedAmount: (amount: number) => {
        const { items, discount } = get();
        // Al setear el monto entregado, recalculamos todo para actualizar el vuelto
        const totals = calculateTotals(items, discount, amount);
        set({ tenderedAmount: amount, ...totals });
      },

      clearPayments: () => {
        set({ payments: [], tenderedAmount: 0, changeAmount: 0 });
      }
    }),
    {
      name: 'zaiko-pos-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);