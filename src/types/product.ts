// src/types/product.ts
export interface UIProduct {
  id: string;
  name: string;
  price: number;     // Ya transformado de Decimal
  stock: number;
  code: string | null;
  minStock: number;
  category?: string;
}

export interface ProductApiResponse {
  data: UIProduct[];
  metadata: {
    total: number;
    page: number;
    totalPages: number;
  };
}