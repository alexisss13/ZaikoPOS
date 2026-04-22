import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface BranchBasic { 
  id: string; 
  name: string; 
  ecommerceCode: string | null; 
  logos?: { 
    isotipo?: string; 
    isotipoWhite?: string; 
    imagotipo?: string; 
    imagotipoWhite?: string; 
    alternate?: string; 
  } | null; 
}

export interface Category { 
  id: string; 
  name: string; 
  ecommerceCode?: string | null; 
}

export interface Product {
  id: string; 
  title: string; 
  basePrice: number; 
  wholesalePrice: number | null;
  wholesaleMinCount: number | null; 
  discountPercentage: number;
  images: string[]; 
  categoryId: string;
  category?: { name: string; ecommerceCode: string | null };
  variants: ProductVariant[];
}

export interface ProductVariant {
  id: string; 
  name: string; 
  sku: string | null; 
  barcode: string | null;
  price: number | null; 
  cost: number; 
  minStock: number; 
  active: boolean;
  attributes: unknown; 
  images: string[];
  stock: { branchId: string; quantity: number }[];
}

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  wholesalePrice: number | null;
  wholesaleMinCount: number | null;
  discountPercentage: number;
  images: string[];
  cartQuantity: number;
  localStock: number;
}

export function usePOSData() {
  const { data: cashData, isLoading: loadingCash, mutate: mutateCash } = useSWR('/api/cash/current', fetcher);
  const { data: products, isLoading: loadingProducts, mutate: mutateProducts } = useSWR<Product[]>('/api/products', fetcher);
  const { data: categories, isLoading: loadingCats } = useSWR<Category[]>('/api/categories', fetcher);
  const { data: branches } = useSWR<BranchBasic[]>('/api/branches', fetcher);

  const cashSession = cashData?.session;
  const hasCashOpen = cashSession?.status === 'OPEN';

  return {
    // Cash
    cashSession,
    hasCashOpen,
    loadingCash,
    mutateCash,
    
    // Products
    products,
    loadingProducts,
    mutateProducts,
    
    // Categories
    categories,
    loadingCats,
    
    // Branches
    branches,
  };
}