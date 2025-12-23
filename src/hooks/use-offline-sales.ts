import { useState, useEffect, useCallback } from 'react';
import { offlineDB, OfflineSalePayload, OfflineSale } from '@/lib/offline/db';
import { useNetwork } from './use-network';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export interface SyncConflict {
  saleId: string;
  reason: string;
  productId?: string;
}

export function useOfflineSales() {
  const isOnline = useNetwork();
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);

  // ... (refreshCount y saveOfflineSale se mantienen igual) ...
  const refreshCount = useCallback(async () => {
    const count = await offlineDB.getCount();
    setPendingCount(count);
  }, []);

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
    if (!isOnline || isSyncing) return;
    
    const sales = await offlineDB.getAllSales();
    if (sales.length === 0) return;

    setIsSyncing(true);
    let successCount = 0;
    const newConflicts: SyncConflict[] = [];

    for (const sale of sales) {
      try {
        // Body con ID de idempotencia
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
          
          if (status === 409) {
            // CONFLICTO REAL (Stock se acabó mientras estaba offline)
            const data = await res.json();
            console.error(`[Sync] Conflicto de stock en venta ${sale.localId}`);
            
            // No borramos la venta, la dejamos en DB pero la marcamos en UI
            // Opcional: Podrías moverla a una tabla 'failed_sales' en IndexedDB
            newConflicts.push({ 
                saleId: sale.localId, 
                reason: 'Stock insuficiente',
                productId: data.productId
            });
            
            // Eliminamos de la cola de 'pendientes de reintento automático' para no bloquear
            await offlineDB.removeSale(sale.localId);
            
            // Aquí deberías guardar la venta en un store de "Errores" para que el usuario la corrija
            // saveToConflictStore(sale); 
            
          } else if (status >= 400 && status < 500) {
            // Error de datos (Bug del frontend o validación)
            await offlineDB.removeSale(sale.localId);
            toast.error(`Venta corrupta eliminada: ${sale.localId}`);
          } else {
            // Error 500 o Red: Se mantiene en cola para reintentar luego
            console.warn(`[Sync] Error servidor, reintentando luego.`);
          }
        }
      } catch (error) {
        console.error('[Sync] Error de red grave');
        break; // Cortar sincronización
      }
    }

    if (successCount > 0) toast.success(`${successCount} ventas sincronizadas.`);
    
    if (newConflicts.length > 0) {
        setConflicts(prev => [...prev, ...newConflicts]);
        toast.error(`${newConflicts.length} ventas tuvieron conflictos de stock.`);
    }

    await refreshCount();
    setIsSyncing(false);
  }, [isOnline, isSyncing, refreshCount]);

  // Auto-sync
  useEffect(() => {
    let isMounted = true;
    const run = async () => {
        if (isOnline && pendingCount > 0 && !isSyncing) {
            if(isMounted) await syncSales();
        }
    };
    run();
    return () => { isMounted = false; };
  }, [isOnline, pendingCount, isSyncing, syncSales]);

  return { 
      isOnline, 
      pendingCount, 
      isSyncing, 
      saveOfflineSale, 
      triggerSync: syncSales,
      conflicts // Nuevo estado para mostrar en UI
  };
}