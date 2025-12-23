'use client';

import { useState } from 'react';
import { useCashSession } from '@/hooks/use-cash-session';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LogOut, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function CloseCashDialog() {
  const { closeSession } = useCashSession();
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ difference: number } | null>(null);

  const handleClose = async () => {
    if (!amount) return;
    setLoading(true);
    
    // Llamamos al hook corregido
    const res = await closeSession(Number(amount));
    
    setLoading(false);
    if (res) {
      // Si fue exitoso, guardamos el resultado para mostrarlo antes de cerrar el modal
      // Nota: El hook hace mutate(), así que el CashGuard eventualmente sacará al usuario,
      // pero queremos mostrar el resultado un momento.
      setResult({ difference: Number(res.difference) });
      // Limpiamos input
      setAmount('');
    }
  };

  // Si ya tenemos resultado, mostramos el resumen final
  if (result !== null) {
    const diff = result.difference;
    const isPerfect = Math.abs(diff) < 0.5;
    const isShort = diff < 0;

    return (
      <Dialog open={true} onOpenChange={() => setIsOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isPerfect ? <CheckCircle className="text-green-500" /> : <AlertTriangle className="text-amber-500" />}
              Resumen de Cierre
            </DialogTitle>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <Alert variant={isPerfect ? "default" : "destructive"} className={isPerfect ? "border-green-500 bg-green-50" : ""}>
               <AlertTitle>{isPerfect ? "¡Caja Cuadrada!" : (isShort ? "Faltante de Dinero" : "Sobrante de Dinero")}</AlertTitle>
               <AlertDescription className="text-lg font-bold mt-2">
                 {diff > 0 ? '+' : ''} S/ {diff.toFixed(2)}
               </AlertDescription>
            </Alert>
            <p className="text-sm text-muted-foreground text-center">
              La sesión ha sido cerrada correctamente.
            </p>
          </div>

          <DialogFooter>
             {/* Al cerrar aquí, el CashGuard detectará que no hay sesión y mostrará el Login/Apertura */}
            <Button onClick={() => window.location.reload()} className="w-full">
              Entendido, Salir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm" className="gap-2">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Cerrar Caja</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cerrar Turno de Caja</DialogTitle>
          <DialogDescription>
            Cuenta todo el dinero físico (monedas y billetes) e ingrésalo aquí.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="final-cash">Dinero en Efectivo Real</Label>
            <Input
              id="final-cash"
              type="number"
              placeholder="0.00"
              className="text-right text-lg font-bold"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleClose} disabled={!amount || loading} variant="destructive">
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Cerrar Turno
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}