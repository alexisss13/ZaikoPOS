import { SWRConfiguration } from 'swr';

// Configuración global optimizada de SWR
export const swrConfig: SWRConfiguration = {
  // Reducir revalidaciones automáticas
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  
  // Deduplicación de peticiones
  dedupingInterval: 5000, // 5 segundos
  
  // Mantener datos en caché
  keepPreviousData: true,
  
  // Timeout de peticiones
  fetcher: (url: string) => fetch(url).then(r => {
    if (!r.ok) throw new Error('Network response was not ok');
    return r.json();
  }),
  
  // Manejo de errores
  onError: (error) => {
    console.error('[SWR Error]', error);
  },
  
  // Configuración de caché
  provider: () => new Map(),
};

// Fetcher optimizado con timeout
export const fetcherWithTimeout = async (url: string, timeout = 10000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, {
      signal: controller.signal,
    });
    clearTimeout(id);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};
