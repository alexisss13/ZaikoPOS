'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { DollarSign, Lock, AlertCircle } from 'lucide-react';

// Interfaz estricta para los datos que vienen del backend
interface SessionData {
  id: string;
  openedAt: string | Date;
  initialCash: number | string; // Prisma decimal se serializa a string o number
  income: number | string;
  // Agrega otros campos si los necesitas
}

interface CashManagerProps {
  branchId: string;
  currentSession: SessionData | null;
}

export function CashManager({ branchId, currentSession }: CashManagerProps) {
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lógica de Apertura
  const handleOpen = async () => {
    setError(null);
    if (!amount) return setError('Ingresa un monto válido');
    
    setLoading(true);
    try {
      const res = await fetch('/api/cash/open', {
        method: 'POST',
        body: JSON.stringify({ 
            branchId, 
            initialCash: Number(amount) 
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al abrir caja');
      }
      
      // Aquí idealmente refrescas la página:
      window.location.reload(); 
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Lógica de Cierre
  const handleClose = async () => {
    setError(null);
    if (!amount) return setError('Ingresa el monto contado');

    setLoading(true);
    try {
      const res = await fetch('/api/cash/close', {
        method: 'POST',
        body: JSON.stringify({ 
            cashSessionId: currentSession?.id, 
            finalCash: Number(amount) 
        }),
      });

      if (!res.ok) {
         const data = await res.json();
         throw new Error(data.error || 'Error al cerrar caja');
      }

      window.location.reload();
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // VISTA 1: ABRIR CAJA (Si no hay sesión)
  if (!currentSession) {
    return (
      <Card className="w-full max-w-md mx-auto mt-10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" /> Apertura de Caja
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Monto Inicial (S/)</label>
            <Input 
              type="number" 
              placeholder="0.00" 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button onClick={handleOpen} className="w-full" disabled={loading}>
            {loading ? 'Abriendo...' : 'Abrir Caja'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // VISTA 2: CAJA ABIERTA (Resumen y Cierre)
  return (
    <Card className="w-full max-w-md mx-auto mt-10 border-green-500/20">
      <CardHeader>
        <CardTitle className="text-green-600 flex justify-between items-center">
          <span>Caja Abierta</span>
          <span className="text-sm font-normal text-muted-foreground">
            {new Date(currentSession.openedAt).toLocaleTimeString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-muted p-2 rounded">
            <p className="text-xs text-muted-foreground">Inicial</p>
            <p className="font-bold">S/ {Number(currentSession.initialCash).toFixed(2)}</p>
          </div>
          <div className="bg-muted p-2 rounded">
            <p className="text-xs text-muted-foreground">Ventas (Efec.)</p>
            <p className="font-bold text-green-600">S/ {Number(currentSession.income).toFixed(2)}</p>
          </div>
        </div>

        <div className="border-t pt-4">
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Lock className="w-4 h-4" /> Arqueo de Cierre
          </h3>
          <div className="space-y-2">
            <label className="text-sm">Efectivo en Cajón (Contado)</label>
            <Input 
              type="number" 
              placeholder="Total contado..." 
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button 
            variant="destructive" 
            className="w-full mt-4" 
            onClick={handleClose}
            disabled={loading}
          >
            {loading ? 'Cerrando...' : 'Cerrar Caja y Turno'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}