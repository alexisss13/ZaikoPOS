// src/components/pos/CloseCashDialog.tsx
'use client';

import { useState } from 'react';
import { useCashSession } from '@/hooks/use-cash-session';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, AlertTriangle, CheckCircle2, Calculator, LogOut } from 'lucide-react';

interface CloseCashDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CloseCashDialog({ isOpen, onOpenChange }: CloseCashDialogProps) {
  const { closeSession } = useCashSession();
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ difference: number } | null>(null);

  const handleClose = async () => {
    if (!amount) return;
    setLoading(true);
    
    const res = await closeSession(Number(amount));
    
    setLoading(false);
    if (res) {
      setResult({ difference: Number(res.difference) });
      setAmount('');
    }
  };

  const handleExit = () => {
    setResult(null);
    onOpenChange(false);
    window.location.reload();
  };

  // ---------------------------------------------------------------------------
  // VISTA DE RESULTADO (Cuando ya se cerró la caja)
  // ---------------------------------------------------------------------------
  if (result !== null) {
    const diff = result.difference;
    const isPerfect = Math.abs(diff) < 0.5;
    const isShort = diff < 0;

    return (
      <Dialog open={isOpen} onOpenChange={handleExit}>
        <DialogContent className="sm:max-w-sm font-sans p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[1.5rem] animate-in zoom-in-95 duration-300">
          
          <div className={`p-8 text-center flex flex-col items-center justify-center border-b ${isPerfect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-sm mb-5 ${isPerfect ? 'bg-white border border-emerald-200 text-emerald-600' : 'bg-white border border-rose-200 text-rose-600'}`}>
              {isPerfect ? <CheckCircle2 className="w-8 h-8" strokeWidth={2.5} /> : <AlertTriangle className="w-8 h-8" strokeWidth={2.5} />}
            </div>
            
            <span className={`text-[11px] font-bold uppercase tracking-widest mb-2 ${isPerfect ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPerfect ? "Caja Cuadrada Perfecta" : (isShort ? "Faltante Detectado" : "Sobrante Detectado")}
            </span>
            
            <span className={`text-5xl font-black tabular-nums tracking-tighter leading-none ${isPerfect ? 'text-emerald-950' : 'text-rose-950'}`}>
              {diff > 0 ? '+' : ''}{diff < 0 ? '-' : ''}<span className="text-2xl mr-1 opacity-50">S/</span>{Math.abs(diff).toFixed(2)}
            </span>
          </div>

          <div className="px-6 py-5 bg-white text-center">
            <p className="text-xs font-medium text-slate-500 leading-relaxed">
              La auditoría de caja ha concluido y el turno fue finalizado correctamente. Registrado con zona horaria oficial (America/Lima).
            </p>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100/60">
            <Button onClick={handleExit} className="w-full h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-[0.98]">
              Entendido, Salir del POS
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ---------------------------------------------------------------------------
  // VISTA DEL FORMULARIO DE CIERRE
  // ---------------------------------------------------------------------------
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm font-sans p-0 overflow-hidden bg-white border-none shadow-2xl rounded-[1.5rem] animate-in zoom-in-95 duration-200">
        
        {/* HEADER ELEGANTE */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100/80 bg-white flex justify-between items-start">
          <div className="flex flex-col text-left mt-1">
            <DialogTitle className="text-[22px] font-black text-slate-900 tracking-tight leading-none">
              Cerrar Turno
            </DialogTitle>
            <DialogDescription className="text-xs font-medium text-slate-500 mt-2">
              Ingrese el efectivo total contabilizado en la caja física.
            </DialogDescription>
          </div>
          <div className="w-10 h-10 bg-slate-50 border border-slate-200/60 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <LogOut className="w-5 h-5 text-slate-600" />
          </div>
        </div>
        
        {/* CUERPO DEL FORMULARIO */}
        <div className="p-6 bg-slate-50/30">
          <div className="space-y-3">
            <Label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Calculator className="w-3.5 h-3.5 text-slate-400" /> Efectivo Físico Total
            </Label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold text-lg transition-colors group-focus-within:text-slate-900">S/</span>
              </div>
              <Input
                type="number"
                step="0.10"
                placeholder="0.00"
                className="pl-11 h-14 text-2xl font-black text-slate-900 border-slate-200 focus-visible:ring-1 focus-visible:ring-slate-400 rounded-xl bg-white tabular-nums shadow-sm transition-all"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
              />
            </div>
          </div>
        </div>

        {/* FOOTER DE BOTONES */}
        <div className="p-4 bg-white border-t border-slate-100/80 flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={loading} 
            className="flex-1 h-12 text-xs font-bold text-slate-600 border-slate-200/80 bg-white hover:bg-slate-50 rounded-xl transition-colors shadow-sm"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleClose} 
            disabled={!amount || loading} 
            className="flex-[1.5] h-12 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md rounded-xl active:scale-[0.98] transition-all flex items-center justify-center"
          >
            {loading ? <Loader2 className="animate-spin w-4 h-4 mr-2" /> : null}
            Declarar y Cerrar
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}