import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { UIProduct } from '@/types/product';
import { cacheProducts, searchProductsOffline } from '@/lib/offline/products-db';

// Definir estructura de respuesta de la API
interface ProductsResponse {
  data: UIProduct[];
}

// Fetcher tipado
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Offline');
  return res.json();
});

export function useCatalog(branchId: string | undefined) {
  const [offlineProducts, setOfflineProducts] = useState<UIProduct[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // SWR Tipado correctamente
  const { data, error, isValidating, mutate } = useSWR<ProductsResponse>(
    branchId ? `/api/products?branchId=${branchId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, 
      shouldRetryOnError: false, 
      onSuccess: (responseData) => {
        setIsOfflineMode(false);
        cacheProducts(responseData.data).catch(console.error);
      },
      onError: () => {
        setIsOfflineMode(true);
      }
    }
  );

  useEffect(() => {
    if (error || !data) {
      searchProductsOffline('').then((cached) => {
        setOfflineProducts(cached);
      });
    }
  }, [error, data]);

  const searchCatalog = (query: string) => {
    // Prioridad: Data Online -> Data Offline
    const source = data?.data || offlineProducts;
    if (!query) return source;
    
    const lower = query.toLowerCase();
    return source.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      (p.code && p.code.toLowerCase().includes(lower))
    );
  };

  return {
    products: data?.data || offlineProducts,
    loading: !data && !error && offlineProducts.length === 0,
    isValidating,
    isOfflineMode: !!error || isOfflineMode,
    searchCatalog,
    mutate // <--- AHORA SÍ SE EXPORTA
  };
}