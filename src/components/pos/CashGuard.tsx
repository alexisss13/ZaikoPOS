// src/components/pos/CashGuard.tsx
'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Wallet, Loader2, Store, ArrowRight, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface BranchBasic { 
  id: string; 
  name: string; 
}

export function CashGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  
  // SOLUCIÓN: Mantenemos la variable como 'data' para evitar colisiones de nombres
  const { data, isLoading, mutate } = useSWR('/api/cash/current', fetcher);
  
  const isGlobalUser = user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';
  
  const { data: branches, isLoading: loadingBranches } = useSWR<BranchBasic[]>(
    isGlobalUser ? '/api/branches' : null, 
    fetcher
  );

  const [initialAmount, setInitialAmount] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isOpening, setIsOpening] = useState(false);

  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isGlobalUser && !selectedBranch) {
      return toast.error('Debes seleccionar una sucursal para aperturar la caja.');
    }

    if (!initialAmount || isNaN(Number(initialAmount)) || Number(initialAmount) < 0) {
      return toast.error('Ingresa un monto inicial válido.');
    }

    setIsOpening(true);
    try {
      const payload: { initialCash: number; branchId?: string } = { 
        initialCash: Number(initialAmount) 
      };

      if (isGlobalUser && selectedBranch) {
        payload.branchId = selectedBranch;
      }

      const res = await fetch('/api/cash/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al abrir caja');

      toast.success('Caja abierta correctamente. ¡Buen turno!');
      mutate(); 
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado al abrir caja';
      toast.error(errorMessage);
    } finally {
      setIsOpening(false);
    }
  };

  if (isLoading || (isGlobalUser && loadingBranches)) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-white text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        <p className="font-semibold text-sm">Validando credenciales y sesión...</p>
      </div>
    );
  }

  // SOLUCIÓN: Validamos leyendo la propiedad session dentro de data
  if (data && !data.error && data.session?.status === 'OPEN') {
    return <>{children}</>;
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-slate-50/50 p-4 font-sans animate-in fade-in duration-300">
      <div className="w-full max-w-sm bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
        
        <div className="px-6 pt-8 pb-6 text-center border-b border-slate-100 bg-slate-50/50">
          <div className="mx-auto w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-sm mb-4">
            <Store className="w-6 h-6 text-slate-700" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Apertura de Caja</h2>
          <p className="text-xs font-medium text-slate-500 mt-1.5 px-4 leading-relaxed">
            {isGlobalUser 
              ? "Como administrador, elige en qué sucursal registrarás esta sesión de caja."
              : "Ingresa el monto base en efectivo para iniciar tu turno de ventas."}
          </p>
        </div>

        <div className="p-6 bg-white">
          <form onSubmit={handleOpenCash} className="space-y-5">
            
            {isGlobalUser && (
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" /> Sucursal
                </label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={isOpening}>
                  <SelectTrigger className="w-full h-12 text-sm font-semibold bg-slate-50 border-slate-200 rounded-xl focus:ring-slate-400 transition-all shadow-sm">
                    <SelectValue placeholder="Seleccionar sucursal..." />
                  </SelectTrigger>
                  <SelectContent>
                    {branches?.map(b => (
                      <SelectItem key={b.id} value={b.id} className="font-medium text-slate-700">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-slate-400" /> Monto Inicial
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <span className="text-slate-400 font-bold text-lg">S/</span>
                </div>
                <Input
                  type="number"
                  step="0.10"
                  min="0"
                  autoFocus={!isGlobalUser}
                  placeholder="0.00"
                  value={initialAmount}
                  onChange={(e) => setInitialAmount(e.target.value)}
                  className="pl-11 h-12 text-xl font-black text-slate-900 bg-slate-50 border-slate-200 focus-visible:ring-slate-400 transition-all rounded-xl shadow-sm tabular-nums"
                  disabled={isOpening}
                  required
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-[0.98] flex items-center justify-center mt-2"
              disabled={isOpening || (isGlobalUser && !selectedBranch)}
            >
              {isOpening ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Iniciar Turno <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}