'use client';

import { useState, useEffect, useMemo } from 'react';
import { useOfflineSales } from '@/hooks/use-offline-sales';
import { OfflineIndicator } from '@/components/pos/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentMethod } from '@prisma/client';
import { toast } from 'sonner';
import { usePosStore } from '@/store/pos-store';
import { Trash2, ShoppingCart, Search } from 'lucide-react';
import { ProductCard, UIProduct } from '@/components/pos/ProductCard';

// Definimos el tipo para evitar el 'any' en los pagos
interface PosPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export default function PosPage() {
  const { 
    isOnline, 
    pendingCount, 
    isSyncing, 
    saveOfflineSale, 
    triggerSync 
  } = useOfflineSales();

  // Conexión con el Store Global
  const { items, total, addItem, clearCart, removeItem } = usePosStore();

  const [isProcessing, setIsProcessing] = useState(false);
  // Usamos la interfaz correcta que exporta el ProductCard
  const [products, setProducts] = useState<UIProduct[]>([]);
  const [search, setSearch] = useState('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // 1. CARGAR PRODUCTOS
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // NOTA: Recuerda reemplazar este ID con el que te dio el seed en la consola
        // Si no tienes el ID a mano, el array estará vacío pero no dará error.
        const res = await fetch('/api/products?branchId=branch-uuid-mock'); 
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Error cargando productos", error);
        toast.error("Error al cargar el catálogo");
      } finally {
        setIsLoadingProducts(false);
      }
    };
    fetchProducts();
  }, []);

  // 2. FILTRADO RÁPIDO (Memoizado)
  const filteredProducts = useMemo(() => {
    if (!search) return products;
    const lower = search.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lower) || 
      (p.code && p.code.toLowerCase().includes(lower))
    );
  }, [search, products]);

  // 3. PROCESAR VENTA
  const handleProcessSale = async (payments: PosPayment[]) => { 
    if (items.length === 0) {
      toast.error("El carrito está vacío");
      return;
    }

    const totalPayments = payments.reduce((acc, p) => acc + p.amount, 0);
    // Permitimos margen de 0.01 por redondeo flotante
    if (Math.abs(totalPayments - total) > 0.01) {
      toast.error("El pago no cubre el total de la venta");
      return;
    }

    setIsProcessing(true);
    
    // Construir Payload
    const payload = {
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        price: i.price
      })),
      payments: payments, 
      customerId: undefined
    };

    const userId = 'user-uuid-mock'; 
    const branchId = 'branch-uuid-mock';

    try {
      if (isOnline) {
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
          const errorData = await res.json();
          if (res.status === 400 || res.status === 409) {
            toast.error("Error de venta", { description: errorData.error });
            setIsProcessing(false);
            return; 
          }
          throw new Error('Error de servidor');
        }

        toast.success("Venta registrada correctamente");
        clearCart(); 
      } else {
        throw new Error('Sin conexión');
      }

    } catch (error) {
      console.log('Activando modo offline por:', error);
      try {
        await saveOfflineSale(payload, userId, branchId);
        toast.warning("Modo Sin Conexión", {
          description: "Venta guardada localmente.",
          duration: 5000,
        });
        clearCart(); 
      } catch (saveError) {
        console.error("Fallo crítico:", saveError);
        toast.error("Error Crítico", { description: "No se pudo guardar." });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row bg-slate-50 overflow-hidden">
      
      {/* SECCIÓN IZQUIERDA: CATÁLOGO */}
      <div className="flex-1 flex flex-col h-full p-4 gap-4 overflow-hidden border-r">
        
        {/* BUSCADOR */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Buscar por nombre o código..." 
            className="pl-9 bg-white shadow-sm h-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {/* GRID DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20">
          {isLoadingProducts ? (
            <div className="flex flex-col items-center justify-center h-40 gap-2 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p>Cargando catálogo...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-60 text-muted-foreground">
              <Search className="w-12 h-12 mb-2 opacity-20" />
              <p>No se encontraron productos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map(p => (
                <ProductCard 
                  key={p.id} 
                  product={p} 
                  // YA NO NECESITAS 'as any', TypeScript ahora entiende que son compatibles
                  onAdd={(prod) => addItem(prod)} 
                />
              ))}
            </div>
          )}
        </div>
      </div>


      {/* SECCIÓN DERECHA: CARRITO (LADO FIJO) */}
      <div className="w-full md:w-100px bg-white shadow-xl flex flex-col h-full z-20">
        
        {/* HEADER CARRITO */}
        <div className="p-4 border-b bg-white flex justify-between items-center">
            <h1 className="font-bold flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Carrito
            </h1>
            <OfflineIndicator 
                isOnline={isOnline}
                isSyncing={isSyncing}
                pendingCount={pendingCount}
                onSync={triggerSync}
            />
        </div>

        {/* LISTA CARRITO (SCROLLABLE) */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {items.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <ShoppingCart className="w-16 h-16 mb-4 stroke-1" />
                    <p className="font-medium">Tu carrito está vacío</p>
                    <p className="text-xs">Escanea o selecciona productos</p>
                </div>
            ) : (
                items.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm group hover:border-primary/50 transition-colors">
                        <div>
                           <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                           <p className="text-xs text-muted-foreground mt-1">
                             <span className="font-semibold text-foreground">{item.quantity}</span> x S/ {item.price.toFixed(2)}
                           </p>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="font-bold text-sm">S/ {item.subtotal.toFixed(2)}</span>
                           <Button 
                             variant="ghost" 
                             size="icon" 
                             className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-50"
                             onClick={() => removeItem(item.productId)}
                           >
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                      </div>
                ))
            )}
        </div>

        {/* FOOTER TOTALES */}
        <div className="p-4 border-t bg-white space-y-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
             <div className="flex justify-between items-end">
                <span className="text-muted-foreground font-medium">Total a Pagar</span>
                <span className="text-3xl font-bold text-primary">S/ {total.toFixed(2)}</span>
             </div>
             
             <Button 
                size="lg" 
                className="w-full h-12 text-lg font-bold shadow-lg shadow-primary/20"
                disabled={isProcessing || items.length === 0}
                onClick={() => handleProcessSale([{ method: PaymentMethod.CASH, amount: total }])}
             >
                {isProcessing ? (
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Procesando...
                    </div>
                ) : 'COBRAR (Espacio)'}
             </Button>
        </div>

      </div>

    </div>
  );
}