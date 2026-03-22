import { PaymentMethod } from '@prisma/client';

export interface CartItem {
  productId: string;
  name: string;
  price: number;    // Precio snapshot al momento de agregar
  quantity: number;
  subtotal: number; // price * quantity
  minStock: number; // Para validaciones visuales
}

export interface PosInputProduct {
  id: string;
  name: string;
  // Aceptamos number (Frontend) o Decimal/string (Backend)
  price: number | string | { toNumber: () => number }; 
  minStock?: number; 
  code?: string | null;
}

// NUEVO: Interfaz para los pagos mixtos
export interface PosPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string | null;
}

export interface PosState {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  
  // NUEVO: Estados Financieros
  payments: PosPayment[];
  tenderedAmount: number;
  changeAmount: number;
  
  // Acciones de Carrito
  addItem: (product: PosInputProduct) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  setDiscount: (amount: number) => void;
  clearCart: () => void;

  // NUEVO: Acciones de Pago
  addPayment: (payment: PosPayment) => void;
  removePayment: (method: PaymentMethod) => void;
  setTenderedAmount: (amount: number) => void;
  clearPayments: () => void;
}