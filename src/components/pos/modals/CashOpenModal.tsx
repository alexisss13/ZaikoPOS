'use client';

import { memo } from 'react';
import { Wallet, MapPin, ChevronRight, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { BranchBasic } from '../hooks/usePOSData';

interface CashOpenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  initialCash: string;
  setInitialCash: (value: string) => void;
  selectedBranch: string;
  setSelectedBranch: (value: string) => void;
  branches?: BranchBasic[];
  isGlobalUser: boolean;
  isOpening: boolean;
}

function CashOpenModalComponent({
  isOpen,
  onClose,
  onSubmit,
  initialCash,
  setInitialCash,
  selectedBranch,
  setSelectedBranch,
  branches,
  isGlobalUser,
  isOpening,
}: CashOpenModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-3xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Apertura de Caja</DialogTitle>
          <DialogDescription>Configura el monto inicial para comenzar tu turno</DialogDescription>
        </DialogHeader>
        
        {/* Header mejorado para móvil */}
        <div className="px-6 pt-8 pb-6 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-slate-100/50">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shadow-md">
              <Wallet className="w-7 h-7 text-slate-700" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black text-slate-900 tracking-tight">Apertura de Caja</h2>
              <p className="text-sm text-slate-600 font-medium mt-1 leading-relaxed">
                {isGlobalUser ? "Selecciona sucursal y monto inicial" : "Configura el monto inicial de efectivo"}
              </p>
            </div>
          </div>
        </div>

        {/* Form Content mejorado */}
        <div className="p-6 bg-white">
          <form onSubmit={onSubmit} className="space-y-6">
            
            {isGlobalUser && (
              <div className="space-y-3">
                <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" /> Sucursal
                </Label>
                <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={isOpening}>
                  <SelectTrigger className="w-full h-12 text-base font-semibold bg-slate-50 border-slate-200 rounded-xl focus:ring-slate-400 transition-all">
                    <SelectValue placeholder="Seleccionar sucursal..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {branches?.map(b => (
                      <SelectItem key={b.id} value={b.id} className="font-medium text-slate-700 py-3">
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-slate-500" /> Monto Inicial
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                  <span className="text-slate-500 font-bold text-xl">S/</span>
                </div>
                <Input
                  type="number"
                  step="0.10"
                  min="0"
                  autoFocus={!isGlobalUser}
                  placeholder="0.00"
                  value={initialCash}
                  onChange={(e) => setInitialCash(e.target.value)}
                  className="pl-14 h-16 text-3xl font-black text-slate-900 bg-slate-50 border-slate-200 focus-visible:ring-slate-400 transition-all rounded-2xl tabular-nums text-center"
                  disabled={isOpening}
                  required
                />
              </div>
              <p className="text-xs text-slate-500 text-center font-medium">
                Ingresa el efectivo que tienes para comenzar
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isOpening}
                className="flex-1 h-12 text-sm font-bold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 h-12 text-base font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                disabled={isOpening || (isGlobalUser && !selectedBranch)}
              >
                {isOpening ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Abriendo...</span>
                  </>
                ) : (
                  <>
                    <span>Iniciar Turno</span>
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export const CashOpenModal = memo(CashOpenModalComponent);