// src/types/product.ts
export interface UIProduct {
  id: string;
  name: string;
  price: number;     // Ya transformado de Decimal
  stock: number;
  code: string | null;
  minStock: number;
  category?: string; // Ahora sí viene de la relación
  active: boolean;   // Nuevo campo
}

export interface ProductApiResponse {
  data: UIProduct[];
  metadata: {
    total: number;
    page: number;
    totalPages: number;
  };
}