import { useState, useEffect, useCallback } from 'react';
import { offlineDB, OfflineSalePayload, OfflineSale } from '@/lib/offline/db';
import { useNetwork } from './use-network';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export function useOfflineSales() {
  const isOnline = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  // Helper para actualizar conteo
  const refreshCount = useCallback(async () => {
    try {
      const count = await offlineDB.getCount();
      setPendingCount(count);
    } catch (e) {
      console.error("Error leyendo IndexedDB:", e);
    }
  }, []);

  // CORRECCIÓN 1: Envolver la llamada inicial en una función async interna
  useEffect(() => {
    let isMounted = true;
    
    const init = async () => {
      if (isMounted) await refreshCount();
    };
    
    init();

    return () => { isMounted = false; };
  }, [refreshCount]);

  const saveOfflineSale = async (payload: OfflineSalePayload, userId: string, branchId: string) => {
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
    return localId;
  };

  const syncSales = useCallback(async () => {
    // Verificaciones iniciales para evitar ejecuciones innecesarias
    if (!isOnline || isSyncing) return;
    
    const sales = await offlineDB.getAllSales();
    if (sales.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;

    for (const sale of sales) {
      try {
        const body = { ...sale.payload, externalId: sale.localId };
        
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
          successCount++;
        } else {
          const status = res.status;
          
          if (status >= 400 && status < 500) {
            console.error(`[Sync] Venta rechazada ${sale.localId} (Status ${status})`);
            await offlineDB.removeSale(sale.localId); 
            toast.error(`Venta offline rechazada por el servidor.`);
          } else {
            console.warn(`[Sync] Error servidor ${sale.localId}, se reintentará.`);
            break; // Parar loop en errores de servidor
          }
        }
      } catch (error) {
        console.error('[Sync] Fallo de red crítico');
        break; 
      }
    }

    if (successCount > 0) toast.success(`${successCount} ventas sincronizadas.`);
    await refreshCount();
    setIsSyncing(false);
  }, [isOnline, isSyncing, refreshCount]);

  // CORRECCIÓN 2: Envolver el auto-sync para evitar setState síncrono implícito
  useEffect(() => {
    let isMounted = true;

    const runAutoSync = async () => {
      // Validamos aquí adentro también para asegurar consistencia
      if (isOnline && pendingCount > 0 && !isSyncing) {
         if (isMounted) await syncSales();
      }
    };

    runAutoSync();

    return () => { isMounted = false; };
  }, [isOnline, pendingCount, isSyncing, syncSales]);

  return { isOnline, pendingCount, isSyncing, saveOfflineSale, triggerSync: syncSales };
}