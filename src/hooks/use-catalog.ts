import useSWR from 'swr';
import { useState, useEffect } from 'react';
import { UIProduct } from '@/types/product';
import { cacheProducts, searchProductsOffline } from '@/lib/offline/products-db';

// Fetcher simple para SWR
const fetcher = (url: string) => fetch(url).then((res) => {
  if (!res.ok) throw new Error('Offline');
  return res.json();
});

export function useCatalog(branchId: string | undefined) {
  const [offlineProducts, setOfflineProducts] = useState<UIProduct[]>([]);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  // SWR: Polling inteligente (revalida cada 1 min o al volver a la pestaña)
  const { data, error, isValidating } = useSWR<{ data: UIProduct[] }>(
    branchId ? `/api/products?branchId=${branchId}` : null,
    fetcher,
    {
      revalidateOnFocus: true,
      refreshInterval: 60000, // Actualiza stock cada minuto
      shouldRetryOnError: false, // Manejamos el error nosotros
      onSuccess: (data) => {
        // Si hay éxito, guardamos en caché (Estrategia: Network First)
        setIsOfflineMode(false);
        cacheProducts(data.data).catch(console.error);
      },
      onError: () => {
        // Si falla (internet caído), activamos modo offline
        setIsOfflineMode(true);
      }
    }
  );

  // Efecto para cargar datos offline si SWR falla o está cargando inicial
  useEffect(() => {
    if (error || !data) {
      searchProductsOffline('').then((cached) => {
        setOfflineProducts(cached);
        if (cached.length > 0 && !data && !error) {
             // Mostramos caché mientras carga lo nuevo (Stale-While-Revalidate pattern)
             // Opcional: setIsOfflineMode(true); 
        }
      });
    }
  }, [error, data]);

  // Lógica de búsqueda (Filtra sobre los datos que tengamos: Online u Offline)
  const searchCatalog = (query: string) => {
    const source = (data?.data || offlineProducts);
    if (!query) return source;
    
    const lower = query.toLowerCase();
    return source.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.code?.toLowerCase().includes(lower)
    );
  };

  return {
    // Si tenemos data fresca, la usamos. Si no, usamos la offline.
    products: data?.data || offlineProducts,
    loading: !data && !error && offlineProducts.length === 0,
    isValidating, // Para mostrar un spinner pequeñito de "actualizando stock..."
    isOfflineMode: !!error || isOfflineMode,
    searchCatalog
  };
}