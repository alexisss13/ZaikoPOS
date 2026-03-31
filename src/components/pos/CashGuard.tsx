'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Lock, Wallet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function CashGuard({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading, mutate } = useSWR('/api/cash/current', fetcher);
  
  const [initialAmount, setInitialAmount] = useState('');
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!initialAmount || isNaN(Number(initialAmount)) || Number(initialAmount) < 0) {
      return toast.error('Ingresa un monto válido');
    }

    setIsOpening(true);
    try {
      const res = await fetch('/api/cash/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ initialAmount: Number(initialAmount) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al abrir caja');

      toast.success('Caja abierta correctamente. ¡Buen turno!');
      mutate(); 
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado al abrir la caja';
      toast.error(errorMessage);
    } finally {
      setIsOpening(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <p className="font-bold text-sm">Verificando estado de caja...</p>
      </div>
    );
  }

  if (session && !session.error) {
    return <>{children}</>;
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-900 p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
      
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative z-10 border border-slate-200">
        
        <div className="w-16 h-16 bg-sky-50 rounded-2xl flex items-center justify-center mb-6 mx-auto shadow-inner border border-sky-100">
          <Lock className="w-8 h-8 text-sky-600" />
        </div>
        
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Caja Cerrada</h2>
          <p className="text-slate-500 text-sm font-medium">
            Para iniciar a vender, debes declarar el monto inicial en efectivo (sencillo) de tu caja.
          </p>
        </div>

        <form onSubmit={handleOpenCash} className="space-y-6">
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              <Wallet className="w-4 h-4 text-blue-500" /> Monto de Apertura
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-black">S/</span>
              </div>
              <Input
                type="number"
                step="0.10"
                min="0"
                autoFocus
                placeholder="0.00"
                value={initialAmount}
                onChange={(e) => setInitialAmount(e.target.value)}
                className="pl-10 h-14 text-xl font-black bg-slate-50 border-slate-200 focus-visible:ring-blue-500 transition-all rounded-xl"
                disabled={isOpening}
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 rounded-xl"
            disabled={isOpening}
          >
            {isOpening ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Abrir Turno'
            )}
          </Button>
        </form>
        
      </div>
    </div>
  );
}