export interface UIProduct {
  id: string;
  name: string;
  price: number;
  stock: number;
  code: string | null;
  minStock: number;
  category?: string;   // Nombre de la categoría (para mostrar)
  categoryId?: string; // ID de la relación (para lógica)
  active: boolean;     // Estado del producto
}

export interface ProductApiResponse {
  data: UIProduct[];
  metadata: {
    total: number;
    page: number;
    totalPages: number;
  };
}