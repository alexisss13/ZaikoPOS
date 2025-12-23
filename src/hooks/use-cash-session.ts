import useSWR from 'swr';
import { useCallback } from 'react';
import { toast } from 'sonner';

interface CashSession {
  id: string;
  status: 'OPEN' | 'CLOSED';
  initialCash: number;
  openedAt: string;
}

interface CashResponse {
  session: CashSession | null;
}

interface CloseResponse {
  difference: number | string; // La API puede devolver decimal como string
}

// Fetcher genérico tipado
const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCashSession() {
  // Consultamos el estado actual de la caja del usuario
  const { data, error, isLoading, mutate } = useSWR<CashResponse>(
    '/api/cash/current', 
    fetcher,
    {
        revalidateOnFocus: true,
        shouldRetryOnError: false
    }
  );

  const openSession = useCallback(async (initialCash: number) => {
    try {
      const res = await fetch('/api/cash/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialCash }),
      });

      if (!res.ok) throw new Error('Error abriendo caja');
      
      toast.success('Caja abierta correctamente');
      mutate(); // Recargar estado
      return true;
    } catch (error: unknown) {
      // TIPADO SEGURO: Verificamos si es un Error real
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error desconocido al abrir caja');
      }
      return false;
    }
  }, [mutate]);

  const closeSession = useCallback(async (finalCash: number, comments?: string) => {
    try {
      const res = await fetch('/api/cash/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalCash, comments }),
      });

      if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error cerrando caja');
      }
      
      const responseData = await res.json() as CloseResponse;
      const diff = Number(responseData.difference);
      
      if (Math.abs(diff) < 0.5) toast.success('Caja cuadrada perfecta 🎯');
      else if (diff > 0) toast.warning(`Sobra dinero: +S/ ${diff.toFixed(2)}`);
      else toast.error(`Falta dinero: S/ ${diff.toFixed(2)}`);

      mutate(); // Recargar estado (volverá a null/closed)
      return responseData;
    } catch (error: unknown) {
      // TIPADO SEGURO: Eliminamos el 'any'
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error desconocido al cerrar caja');
      }
      return null;
    }
  }, [mutate]);

  return {
    session: data?.session,
    isLoading,
    isError: !!error,
    openSession,
    closeSession
  };
}