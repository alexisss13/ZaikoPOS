'use client';

import { useState, useMemo } from 'react';
import { useOfflineSales } from '@/hooks/use-offline-sales';
import { OfflineIndicator } from '@/components/pos/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { PaymentMethod } from '@prisma/client';
import { toast } from 'sonner';
import { usePosStore } from '@/store/pos-store';
import { Trash2, ShoppingCart, Loader2 } from 'lucide-react';
import { ProductCard } from '@/components/pos/ProductCard';
import { PosHeader } from '@/components/pos/PosHeader'; // <--- NUEVO HEADER
import { useCatalog } from '@/hooks/use-catalog';
import { useAuth } from '@/context/auth-context';
import { UIProduct } from '@/types/product';

interface PosPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export default function PosPage() {
  const { branchId, userId, role } = useAuth();
  const { isOnline, pendingCount, isSyncing, saveOfflineSale, triggerSync, conflicts } = useOfflineSales();
  const { items, total, addItem, clearCart, removeItem } = usePosStore();
  
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
           if (res.status === 409) toast.error(`Stock insuficiente: ${err.productId}`);
           else if (res.status >= 500) throw new Error('Fallo servidor');
           else toast.error("Error al procesar venta");
           
           setIsProcessing(false);
           return;
        }

        toast.success("Venta Exitosa");
        clearCart();
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
      
      {/* --- COLUMNA IZQUIERDA: CATÁLOGO --- */}
      <div className="flex-1 flex flex-col h-full border-r bg-white/50">
        
        {/* Header Limpio y Modularizado */}
        <PosHeader 
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isOfflineMode={isOfflineMode}
          isValidating={isValidating}
          conflictsCount={conflicts.length}
        />

        {/* GRID */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50">
            {isLoadingCatalog ? (
                <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary w-8 h-8" /></div>
            ) : filteredProducts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-60">
                    <p>No se encontraron productos</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-20">
                    {filteredProducts.map(p => (
                        <ProductCard 
                            key={p.id} 
                            product={p} 
                            onAdd={(prod: UIProduct) => {
                                if (prod.stock <= 0) return toast.error("Agotado");
                                addItem(prod);
                            }} 
                        />
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* --- COLUMNA DERECHA: CARRITO --- */}
      <div className="w-full md:w-[420px] bg-white shadow-2xl flex flex-col h-full border-l z-20">
          <div className="p-4 border-b flex justify-between items-center bg-white shadow-sm">
              <h1 className="font-bold flex items-center gap-2 text-lg">
                  <ShoppingCart className="w-5 h-5 text-primary" /> Carrito
              </h1>
              <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono bg-slate-100 px-2 py-1 rounded text-slate-500 uppercase border font-bold">
                      {role}
                  </span>
                  <OfflineIndicator isOnline={isOnline} pendingCount={pendingCount} isSyncing={isSyncing} onSync={triggerSync} />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-300">
                    <ShoppingCart className="w-16 h-16 mb-4 stroke-1" />
                    <p>Carrito vacío</p>
                 </div>
              ) : (
                items.map(item => (
                    <div key={item.productId} className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm group hover:border-primary/40 transition-colors">
                        <div>
                            <p className="font-medium text-sm text-slate-900">{item.name}</p>
                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded border">{item.quantity} un</span>
                                <span>x S/ {item.price.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-slate-900">S/ {item.subtotal.toFixed(2)}</span>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50" onClick={() => removeItem(item.productId)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))
              )}
          </div>

          <div className="p-6 border-t space-y-4 bg-white shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-10">
              <div className="flex justify-between items-end">
                  <span className="font-medium text-slate-500">Total a Pagar</span>
                  <span className="text-4xl font-extrabold text-primary tracking-tight">S/ {total.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" className="w-full h-14 text-xl font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all"
                disabled={items.length === 0 || isProcessing}
                onClick={() => handleProcessSale([{ method: PaymentMethod.CASH, amount: total }])}
              >
                {isProcessing ? <div className="flex items-center gap-2"><Loader2 className="animate-spin" /> PROCESANDO</div> : 'COBRAR (ESPACIO)'}
              </Button>
          </div>
      </div>
    </div>
  );
}