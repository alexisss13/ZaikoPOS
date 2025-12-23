'use client';

import { useState, useMemo } from 'react';
import { useOfflineSales } from '@/hooks/use-offline-sales';
import { OfflineIndicator } from '@/components/pos/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentMethod } from '@prisma/client';
import { toast } from 'sonner';
import { usePosStore } from '@/store/pos-store';
import { Trash2, ShoppingCart, Search, Loader2, AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';
import { ProductCard } from '@/components/pos/ProductCard';
import { useCatalog } from '@/hooks/use-catalog';
import { useAuth } from '@/context/auth-context';
import { UIProduct } from '@/types/product'; // Importar tipo para evitar 'any'

interface PosPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export default function PosPage() {
  const { branchId, userId, role } = useAuth();
  const { isOnline, pendingCount, isSyncing, saveOfflineSale, triggerSync, conflicts } = useOfflineSales();
  const { items, total, addItem, clearCart, removeItem } = usePosStore();
  
  // mutate viene del hook corregido
  const { products, loading: isLoadingCatalog, isOfflineMode, isValidating, mutate } = useCatalog(branchId);

  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    const lower = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      (p.code && p.code.toLowerCase().includes(lower))
    );
  }, [searchTerm, products]);

  const handleProcessSale = async (payments: PosPayment[]) => { 
    if (items.length === 0) { toast.error("Carrito vacío"); return; }
    
    setIsProcessing(true);
    
    const payload = {
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      payments, 
    };

    try {
      if (isOnline && !isOfflineMode) {
        const res = await fetch('/api/sales', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': userId,
            'x-branch-id': branchId
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
           const err = await res.json();
           if (res.status === 409) {
               toast.error(`Stock insuficiente: ${err.productId}`);
               setIsProcessing(false);
               return;
           }
           if (res.status >= 500) throw new Error('Fallo servidor');
           toast.error("Error al procesar venta");
           setIsProcessing(false);
           return;
        }

        toast.success("Venta Exitosa");
        clearCart();
        // Optimistic Update: Refrescar stock inmediatamente
        mutate(); 
      } else {
        throw new Error('Modo Offline');
      }

    } catch (error) {
      await saveOfflineSale(payload, userId, branchId);
      toast.warning("Guardado Offline", { description: "Se subirá al reconectar." });
      clearCart();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      
      {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
      <div className="flex-1 flex flex-col h-full border-r bg-white/50">
        
        <div className="p-4 bg-white border-b space-y-3">
             {conflicts.length > 0 && (
                 <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>{conflicts.length} conflictos de sincronización.</span>
                    </div>
                 </div>
             )}

             <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input 
                    placeholder="Buscar..." 
                    className={`pl-9 ${isOfflineMode ? 'border-amber-300 ring-amber-300' : ''}`}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                    />
                </div>
                {isOfflineMode ? (
                    <div className="flex items-center gap-1 text-amber-600 text-xs font-medium px-3 py-2 bg-amber-50 rounded-full border border-amber-200">
                        <WifiOff className="w-3 h-3" />
                        <span>Offline</span>
                    </div>
                ) : isValidating ? (
                    <div className="flex items-center gap-1 text-blue-600 text-xs font-medium px-3 py-2 bg-blue-50 rounded-full">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        <span>Sync</span>
                    </div>
                ) : null}
             </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
            {isLoadingCatalog ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-20">
                    {filteredProducts.map(p => (
                        <ProductCard 
                            key={p.id} 
                            product={p} 
                            // Corrección del tipo 'any': Tipamos explícitamente el argumento
                            onAdd={(prod: UIProduct) => {
                                if (prod.stock <= 0) return toast.error("Agotado");
                                addItem(prod); // El store maneja la conversión interna si es necesaria
                            }} 
                        />
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* SECCIÓN DERECHA: CARRITO */}
      <div className="w-full md:w-[400px] bg-white shadow-xl flex flex-col h-full border-l z-20">
          <div className="p-4 border-b flex justify-between items-center bg-white">
              <h1 className="font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" /> Carrito
              </h1>
              <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase border">
                      {role}
                  </span>
                  <OfflineIndicator isOnline={isOnline} pendingCount={pendingCount} isSyncing={isSyncing} onSync={triggerSync} />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map(item => (
                  <div key={item.productId} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                      <div>
                          <p className="font-medium text-sm">{item.name}</p>
                          <div className="text-xs text-muted-foreground mt-1">
                              {item.quantity} x S/ {item.price.toFixed(2)}
                          </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <span className="font-bold">S/ {item.subtotal.toFixed(2)}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => removeItem(item.productId)}>
                              <Trash2 className="w-4 h-4" />
                          </Button>
                      </div>
                  </div>
              ))}
          </div>

          <div className="p-4 border-t space-y-3 bg-white">
              <div className="flex justify-between items-end">
                  <span className="font-medium text-muted-foreground">Total</span>
                  <span className="text-3xl font-bold text-primary">S/ {total.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" className="w-full h-12 text-lg font-bold"
                disabled={items.length === 0 || isProcessing}
                onClick={() => handleProcessSale([{ method: PaymentMethod.CASH, amount: total }])}
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : 'COBRAR'}
              </Button>
          </div>
      </div>
    </div>
  );
}