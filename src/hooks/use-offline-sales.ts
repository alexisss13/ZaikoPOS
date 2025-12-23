import { useState, useEffect, useCallback } from 'react';
import { offlineDB, OfflineSalePayload, OfflineSale } from '@/lib/offline/db';
import { useNetwork } from './use-network';
import { v4 as uuidv4 } from 'uuid';

export function useOfflineSales() {
  const isOnline = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // 1. Cargar conteo inicial
  const refreshCount = useCallback(async () => {
    const count = await offlineDB.getCount();
    setPendingCount(count);
  }, []);

  // FIX: Definimos una función interna async para ejecutar la promesa
  useEffect(() => {
    const init = async () => {
      await refreshCount();
    };
    init();
  }, [refreshCount]);

  // 2. Función para guardar venta offline
  const saveOfflineSale = async (
    payload: OfflineSalePayload, 
    userId: string, 
    branchId: string
  ) => {
    const localId = uuidv4();
    const sale: OfflineSale = {
      localId,
      payload,
      context: { userId, branchId },
      createdAtLocal: Date.now(),
      retryCount: 0,
    };

    await offlineDB.addSale(sale);
    await refreshCount();
    console.log(`[Offline] Venta guardada localmente: ${localId}`);
    return localId;
  };

  // 3. Lógica de Sincronización (FIFO)
  const syncSales = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    const sales = await offlineDB.getAllSales();
    if (sales.length === 0) return;

    setIsSyncing(true);
    console.log(`[Sync] Iniciando sincronización de ${sales.length} ventas...`);

    for (const sale of sales) {
      try {
        console.log(`[Sync] Procesando venta: ${sale.localId}`);

        const body = {
          ...sale.payload,
          externalId: sale.localId 
        };

        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': sale.context.userId,
            'x-branch-id': sale.context.branchId,
          },
          body: JSON.stringify(body),
        });

        if (res.ok) {
          await offlineDB.removeSale(sale.localId);
          console.log(`[Sync] Venta sincronizada y eliminada: ${sale.localId}`);
        } else {
          const errorData = await res.json();
          
          if (res.status === 400) {
            console.error(`[Sync] Error fatal (400) en venta ${sale.localId}:`, errorData);
            break; 
          } else if (res.status === 409) {
            console.error(`[Sync] Conflicto (409) en venta ${sale.localId}:`, errorData);
            break; 
          } else {
            console.warn(`[Sync] Error transitorio (${res.status}) en venta ${sale.localId}`);
            break; 
          }
        }

      } catch (networkError) {
        console.error('[Sync] Error de red durante sync, pausando...', networkError);
        break; 
      }
    }

    await refreshCount();
    setIsSyncing(false);
  }, [isOnline, isSyncing, refreshCount]);

  // 4. Trigger automático: Cuando vuelve internet
  // FIX: Usamos el mismo patrón de función interna async
  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      const runSync = async () => {
        await syncSales();
      };
      runSync();
    }
  }, [isOnline, pendingCount, syncSales]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    saveOfflineSale,
    triggerSync: syncSales,
  };
}