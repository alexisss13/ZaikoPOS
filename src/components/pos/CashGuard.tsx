'use client';

import { useState } from 'react';
import { useCashSession } from '@/hooks/use-cash-session';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Store, Banknote } from 'lucide-react';

export function CashGuard({ children }: { children: React.ReactNode }) {
  const { session, isLoading, openSession } = useCashSession();
  const [initialCash, setInitialCash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpen = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await openSession(Number(initialCash));
    setIsSubmitting(false);
  };

  // 1. Cargando estado...
  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground text-sm">Verificando caja...</p>
        </div>
      </div>
    );
  }

  // 2. Si hay sesión abierta, renderizamos el POS (children)
  if (session?.status === 'OPEN') {
    return <>{children}</>;
  }

  // 3. Si NO hay sesión, mostramos Formulario de Apertura
  return (
    <div className="h-screen flex items-center justify-center bg-slate-100 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">
            <Store className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Apertura de Caja</CardTitle>
          <CardDescription>
            Debes abrir caja antes de realizar ventas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleOpen} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cash">Dinero Inicial en Caja (Sencillo)</Label>
              <div className="relative">
                <Banknote className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="cash"
                  type="number" 
                  step="0.10"
                  min="0"
                  placeholder="0.00"
                  className="pl-9 text-lg font-medium"
                  value={initialCash}
                  onChange={(e) => setInitialCash(e.target.value)}
                  required 
                  autoFocus
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Cuenta las monedas y billetes que tienes físicamente.
              </p>
            </div>
            
            <Button type="submit" size="lg" className="w-full" disabled={isSubmitting || !initialCash}>
              {isSubmitting ? <Loader2 className="animate-spin" /> : 'ABRIR CAJA E INICIAR'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}