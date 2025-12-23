'use client';

import { useState, useMemo } from 'react';
import { useOfflineSales } from '@/hooks/use-offline-sales';
import { OfflineIndicator } from '@/components/pos/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentMethod } from '@prisma/client';
import { toast } from 'sonner';
import { usePosStore } from '@/store/pos-store';
import { Trash2, ShoppingCart, Search, Loader2, WifiOff, RefreshCw } from 'lucide-react';
import { ProductCard } from '@/components/pos/ProductCard';
import { useCatalog } from '@/hooks/use-catalog';
import { useAuth } from '@/context/auth-context';

interface PosPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export default function PosPage() {
  // --- 1. HOOKS DE ARQUITECTURA ---
  const { branchId, userId, role } = useAuth();
  const { isOnline, pendingCount, isSyncing, saveOfflineSale, triggerSync } = useOfflineSales();
  const { items, total, addItem, clearCart, removeItem } = usePosStore();
  
  // --- 2. GESTIÓN DE CATÁLOGO (SWR + Cache) ---
  const { 
    products: allProducts, // SWR nos da todo el array, filtramos aquí
    loading: isLoadingCatalog, 
    isValidating,
    isOfflineMode 
  } = useCatalog(branchId);

  // --- 3. ESTADO LOCAL ---
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrado Client-Side (Extremadamente rápido para < 2000 productos)
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return allProducts;
    const lower = searchTerm.toLowerCase();
    return allProducts.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      p.code?.toLowerCase().includes(lower)
    );
  }, [searchTerm, allProducts]);

  // --- 4. LÓGICA DE VENTA ---
  const handleProcessSale = async (payments: PosPayment[]) => { 
    if (items.length === 0) { toast.error("Carrito vacío"); return; }
    
    // Validar montos...
    const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);
    if (Math.abs(totalPayments - total) > 0.01) {
        toast.error("Pago incompleto"); return;
    }

    setIsProcessing(true);
    
    const payload = {
      items: items.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
      payments, 
      customerId: undefined
    };

    try {
      // Intentamos venta ONLINE solo si SWR dice que no estamos en modo offline estricto
      // y el navegador dice que hay línea.
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
           // Si falla por 500 o timeout, lanzamos error para caer en el catch y guardar offline
           if (res.status >= 500) throw new Error('Fallo servidor, guardando offline');
           
           // Si es 400 (stock), mostramos el error real y NO guardamos offline
           const err = await res.json();
           toast.error(err.error || "Error al procesar venta");
           setIsProcessing(false);
           return;
        }

        toast.success("Venta Exitosa");
        clearCart();
      } else {
        throw new Error('Modo Offline detectado');
      }

    } catch (error) {
      // FALLBACK OFFLINE
      console.log('Guardando localmente...', error);
      await saveOfflineSale(payload, userId, branchId);
      toast.warning("Venta guardada offline", {
        description: "Se sincronizará cuando vuelva la conexión."
      });
      clearCart();
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      
      {/* --- COLUMNA IZQUIERDA: CATÁLOGO --- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden border-r bg-slate-50/50">
        
        {/* HEADER CATÁLOGO */}
        <div className="p-4 flex gap-3 items-center bg-white border-b">
             <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Buscar productos..." 
                  className={`pl-9 ${isOfflineMode ? 'border-amber-300 focus-visible:ring-amber-300' : ''}`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
             </div>
             {/* Indicador de estado de Red/Datos */}
             {isOfflineMode ? (
                 <div className="flex items-center gap-1 text-amber-600 text-xs font-medium px-3 py-2 bg-amber-50 rounded-full border border-amber-200">
                    <WifiOff className="w-3 h-3" />
                    <span>Offline</span>
                 </div>
             ) : isValidating ? (
                 <div className="flex items-center gap-1 text-blue-600 text-xs font-medium px-3 py-2 bg-blue-50 rounded-full">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Actualizando...</span>
                 </div>
             ) : null}
        </div>

        {/* GRID */}
        <div className="flex-1 overflow-y-auto p-4">
            {isLoadingCatalog ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin mb-2" />
                    <p>Cargando catálogo...</p>
                </div>
            ) : filteredProducts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-60 text-muted-foreground opacity-60">
                    <Search className="w-12 h-12 mb-2" />
                    <p>No se encontraron productos</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pb-20">
                    {filteredProducts.map(p => (
                        <ProductCard 
                            key={p.id} 
                            product={p} 
                            onAdd={(prod) => {
                                if (prod.stock <= 0) return toast.error("Sin stock");
                                addItem(prod);
                            }} 
                        />
                    ))}
                </div>
            )}
        </div>
      </div>

      {/* --- COLUMNA DERECHA: CARRITO --- */}
      <div className="w-full md:w-[400px] bg-white shadow-xl flex flex-col h-full z-20 border-l">
          <div className="p-4 border-b flex justify-between items-center bg-white">
              <h1 className="font-bold flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5" />
                  <span className="hidden sm:inline">Carrito</span>
              </h1>
              <OfflineIndicator 
                  isOnline={isOnline} 
                  pendingCount={pendingCount} 
                  isSyncing={isSyncing} 
                  onSync={triggerSync}
              />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-40">
                      <ShoppingCart className="w-12 h-12 mb-2" />
                      <p>Carrito vacío</p>
                  </div>
              ) : (
                  items.map(item => (
                      <div key={item.productId} className="flex justify-between items-center bg-slate-50 p-3 rounded-lg border">
                          <div>
                              <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                                  <span className="bg-white px-2 py-0.5 rounded border">{item.quantity}</span>
                                  <span>x S/ {item.price.toFixed(2)}</span>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <span className="font-bold">S/ {item.subtotal.toFixed(2)}</span>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50" onClick={() => removeItem(item.productId)}>
                                  <Trash2 className="w-4 h-4" />
                              </Button>
                          </div>
                      </div>
                  ))
              )}
          </div>

          <div className="p-4 border-t bg-slate-50 space-y-3">
              <div className="flex justify-between items-end">
                  <span className="text-muted-foreground font-medium">Total</span>
                  <span className="text-3xl font-bold text-primary">S/ {total.toFixed(2)}</span>
              </div>
              <Button 
                size="lg" 
                className="w-full h-12 text-lg font-bold shadow-md" 
                disabled={items.length === 0 || isProcessing}
                onClick={() => handleProcessSale([{ method: PaymentMethod.CASH, amount: total }])}
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : `COBRAR S/ ${total.toFixed(2)}`}
              </Button>
          </div>
      </div>
    </div>
  );
}