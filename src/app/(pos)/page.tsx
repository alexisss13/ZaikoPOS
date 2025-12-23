'use client';

import { useState } from 'react';
import { useOfflineSales } from '@/hooks/use-offline-sales';
import { OfflineIndicator } from '@/components/pos/OfflineIndicator';
import { Button } from '@/components/ui/button';
import { PaymentMethod } from '@prisma/client';
import { toast } from 'sonner'; // <--- CAMBIO: Import direct from sonner

// Definimos el tipo para evitar el 'any'
interface PosPayment {
  method: PaymentMethod;
  amount: number;
  reference?: string;
}

export default function PosPage() {
  // YA NO NECESITAMOS: const { toast } = useToast();
  
  const { 
    isOnline, 
    pendingCount, 
    isSyncing, 
    saveOfflineSale, 
    triggerSync 
  } = useOfflineSales();

  const [isProcessing, setIsProcessing] = useState(false);
  
  const handleProcessSale = async (payments: PosPayment[]) => { 
    setIsProcessing(true);
    
    // Mock de items
    const payload = {
      items: [
        { productId: 'uuid-demo', quantity: 1, price: 100 } 
      ],
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
          // Errores de lógica (400/409)
          if (res.status === 400 || res.status === 409) {
            toast.error("Error de venta", { 
              description: errorData.error 
            });
            setIsProcessing(false);
            return; 
          }
          throw new Error('Error de servidor');
        }

        // Éxito Online
        toast.success("Venta registrada correctamente");
      } else {
        throw new Error('Sin conexión');
      }

    } catch (error) {
      console.log('Activando modo offline por:', error);

      try {
        await saveOfflineSale(payload, userId, branchId);
        
        // Alerta Amarilla para Offline
        toast.warning("Modo Sin Conexión", {
          description: "Venta guardada localmente. Se subirá al volver internet.",
          duration: 5000,
        });

      } catch (saveError) {
        console.error("Fallo crítico al guardar offline:", saveError);
        toast.error("Error Crítico", {
          description: "No se pudo guardar ni online ni offline."
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* HEADER POS */}
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-xl font-bold">Zaiko POS</h1>
        
        <OfflineIndicator 
          isOnline={isOnline}
          isSyncing={isSyncing}
          pendingCount={pendingCount}
          onSync={triggerSync}
        />
      </div>

      <div className="h-64 bg-slate-50 rounded flex items-center justify-center border border-dashed text-muted-foreground">
        Area de Productos y Carrito (Próximamente)
      </div>

      <div className="flex justify-end">
        <Button 
          size="lg" 
          disabled={isProcessing}
          onClick={() => handleProcessSale([{ method: PaymentMethod.CASH, amount: 100 }])}
        >
          {isProcessing ? 'Procesando...' : 'Cobrar S/ 100.00'}
        </Button>
      </div>
    </div>
  );
}