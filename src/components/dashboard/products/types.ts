export interface Product {
  id: string;
  title: string;
  categoryId: string;
  supplierId?: string | null;
  basePrice: number;
  cost?: number;
  wholesalePrice?: number | null;
  wholesaleMinCount?: number | null;
  minStock?: number;
  barcode?: string | null;
  sku?: string | null;
  code?: string | null;
  active: boolean;
  images?: string[];
  branchOwnerId?: string | null;
  category?: { name: string; ecommerceCode: string | null };
  supplier?: { name: string };
  variants?: any[];
  branchStocks?: { branchId: string; quantity: number }[];
}

export interface Branch {
  id: string;
  ecommerceCode: string | null;
  name: string;
  logoUrl?: string | null;
}

export interface Category {
  id: string;
  name: string;
  ecommerceCode?: string | null;
}
