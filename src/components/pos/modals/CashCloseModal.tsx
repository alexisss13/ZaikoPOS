'use client';

import { memo } from 'react';
import { Logout01Icon, CalculatorIcon, CheckmarkCircle02Icon, Loading02Icon } from 'hugeicons-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CashCloseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  onExit: () => void;
  finalCash: string;
  setFinalCash: (value: string) => void;
  isClosing: boolean;
  closeResult: { difference: number } | null;
}

function CashCloseModalComponent({
  isOpen,
  onClose,
  onSubmit,
  onExit,
  finalCash,
  setFinalCash,
  isClosing,
  closeResult,
}: CashCloseModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !closeResult && onClose()}>
      <DialogContent className="w-[95vw] max-w-md font-sans p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Cierre de Caja</DialogTitle>
          <DialogDescription>Declara el efectivo final para cerrar tu turno</DialogDescription>
        </DialogHeader>
        
        {closeResult ? (
          // Vista de resultado mejorada para móvil
          <>
            <div className="px-6 pt-8 pb-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50">
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 border rounded-2xl flex items-center justify-center shadow-md ${Math.abs(closeResult.difference) < 0.5 ? 'bg-white border-slate-200 text-slate-700' : 'bg-white border-slate-200 text-slate-700'}`}>
                  <CheckmarkCircle02Icon className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Turno Cerrado</h2>
                  <p className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    La auditoría de caja ha concluido
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-white text-center">
              <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 ${Math.abs(closeResult.difference) < 0.5 ? 'bg-green-100 text-green-600' : Math.abs(closeResult.difference) <= 5 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600'}`}>
                <span className="text-2xl font-black tabular-nums">
                  {closeResult.difference > 0 ? '+' : ''}{closeResult.difference.toFixed(2)}
                </span>
              </div>
              
              <p className="text-sm text-slate-600 font-medium leading-relaxed mb-1">
                {Math.abs(closeResult.difference) < 0.5 
                  ? '¡Perfecto! Tu caja está balanceada.' 
                  : closeResult.difference > 0 
                    ? `Tienes S/ ${closeResult.difference.toFixed(2)} de más en caja.`
                    : `Te faltan S/ ${Math.abs(closeResult.difference).toFixed(2)} en caja.`
                }
              </p>

              <Button onClick={onExit} className="w-full h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-all active:scale-[0.98] mt-6">
                Entendido
              </Button>
            </div>
          </>
        ) : (
          // Vista del formulario mejorada para móvil
          <>
            <div className="px-6 pt-8 pb-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-md">
                  <Logout01Icon className="w-7 h-7 text-slate-700" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Cerrar Turno</h2>
                  <p className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                    Declara el efectivo total contabilizado
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-white">
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <CalculatorIcon className="w-4 h-4 text-slate-500" /> Efectivo Físico Total
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                    <span className="text-slate-500 font-bold text-xl">S/</span>
                  </div>
                  <Input
                    type="number"
                    step="0.10"
                    placeholder="0.00"
                    className="pl-14 h-16 text-3xl font-black text-slate-900 border-slate-200 focus-visible:ring-slate-400 rounded-2xl bg-slate-50 tabular-nums transition-all text-center"
                    value={finalCash}
                    onChange={(e) => setFinalCash(e.target.value)}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-slate-500 text-center font-medium">
                  Cuenta todo el efectivo que tienes en caja
                </p>
              </div>

              <div className="flex gap-3 pt-6">
                <Button 
                  variant="outline" 
                  onClick={onClose} 
                  disabled={isClosing} 
                  className="flex-1 h-12 text-sm font-bold text-slate-600 border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={onSubmit} 
                  disabled={!finalCash || isClosing} 
                  className="flex-1 h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-lg rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isClosing ? (
                    <>
                      <Loading02Icon className="w-5 h-5 animate-spin" />
                      <span>Cerrando...</span>
                    </>
                  ) : (
                    <span>Cerrar Caja</span>
                  )}
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

export const CashCloseModal = memo(CashCloseModalComponent);