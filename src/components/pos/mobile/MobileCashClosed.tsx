'use client';

import { memo, useState } from 'react';
import { Wallet, MapPin, ChevronRight, Loader2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { BranchBasic } from '../hooks/usePOSData';

interface MobileCashClosedProps {
  onOpenCash: (e: React.FormEvent) => void;
  initialCash: string;
  setInitialCash: (value: string) => void;
  selectedBranch: string;
  setSelectedBranch: (value: string) => void;
  branches?: BranchBasic[];
  isGlobalUser: boolean;
  isOpening: boolean;
}

function MobileCashClosedComponent({
  onOpenCash,
  initialCash,
  setInitialCash,
  selectedBranch,
  setSelectedBranch,
  branches,
  isGlobalUser,
  isOpening,
}: MobileCashClosedProps) {
  const [showForm, setShowForm] = useState(false);

  if (!showForm) {
    // Vista inicial - mismo estilo que productos
    return (
      <div className="flex flex-col h-full w-full gap-5" style={{ willChange: 'auto' }}>
        {/* Header siguiendo el estilo de productos */}
        <div className="flex flex-col gap-3 px-4">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">POS</h1>
              <p className="text-xs text-slate-400 mt-0.5">Caja cerrada</p>
            </div>
          </div>
        </div>

        {/* Contenido principal - mismo estilo que productos cuando no hay datos */}
        <div className="flex flex-col items-center justify-center flex-1 gap-6 p-6 pb-24">
          {/* Ícono con gradiente mejorado */}
          <div className="w-24 h-24 bg-gradient-to-br from-slate-100 via-slate-50 to-white rounded-3xl flex items-center justify-center border border-slate-200 shadow-sm">
            <Wallet className="w-12 h-12 text-slate-600" strokeWidth={2} />
          </div>
          
          <div className="text-center space-y-3">
            <h2 className="text-xl font-black text-slate-900 leading-tight">¡Hora de vender!</h2>
            <p className="text-sm text-slate-500 text-center max-w-xs leading-relaxed">
              Configura el monto inicial de efectivo para gestionar ventas y transacciones
            </p>
          </div>
          
          <Button 
            onClick={() => setShowForm(true)} 
            className="mt-4 h-12 px-8 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-2xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center gap-2"
          >
            <Wallet className="w-5 h-5" />
            Abrir Caja
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Vista del formulario - experiencia fluida tipo app
  return (
    <div className="flex flex-col h-full w-full bg-slate-50" style={{ willChange: 'auto' }}>
      {/* Header profesional con fondo */}
      <div className="bg-white border-b border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={() => setShowForm(false)}
            disabled={isOpening}
            className="flex items-center justify-center w-9 h-9 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-30 active:scale-95 shrink-0"
          >
            <ChevronRight className="w-5 h-5 rotate-180" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-black text-slate-900 leading-tight">Apertura de Caja</h1>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-tight">
              {isGlobalUser ? "Selecciona sucursal y configura el monto" : "Configura el monto inicial de efectivo"}
            </p>
          </div>
        </div>
      </div>

      {/* Contenido del formulario compacto */}
      <div className="flex-1 flex flex-col px-4 pb-24 overflow-y-auto bg-slate-50">
        {/* Ícono y mensaje reducido */}
        <div className="text-center mb-5 pt-6">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mx-auto mb-2.5 border border-slate-200 shadow-sm">
            <Wallet className="w-7 h-7 text-slate-700" strokeWidth={2.5} />
          </div>
          <h2 className="text-base font-black text-slate-900 mb-0.5">¡Comencemos el turno!</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Configura tu caja para empezar a vender
          </p>
        </div>

        <form onSubmit={onOpenCash} className="space-y-4 max-w-sm mx-auto w-full">
          
          {isGlobalUser && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500" /> Selecciona tu sucursal
              </Label>
              <div className="grid grid-cols-2 gap-2.5">
                {branches?.map(b => {
                  const logoUrl = b.logos?.isotipo || b.logos?.imagotipo || b.logos?.alternate;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBranch(b.id)}
                      disabled={isOpening}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all active:scale-95 disabled:opacity-30 shadow-sm ${
                        selectedBranch === b.id
                          ? 'bg-slate-900 border-slate-900 text-white shadow-lg'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center overflow-hidden ${
                        selectedBranch === b.id ? '' : ''
                      }`}>
                        {logoUrl ? (
                          <img src={logoUrl} alt={b.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className={`w-6 h-6 ${selectedBranch === b.id ? 'text-white' : 'text-slate-400'}`} />
                        )}
                      </div>
                      <span className="text-xs font-bold text-center leading-tight">{b.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Campo de monto compacto */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-slate-500" /> Monto Inicial
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-slate-500 font-bold text-base">S/</span>
              </div>
              <Input
                type="number"
                step="0.10"
                min="0"
                autoFocus={!isGlobalUser}
                placeholder="0.00"
                value={initialCash}
                onChange={(e) => setInitialCash(e.target.value)}
                className="pl-10 h-11 text-xl font-black text-slate-900 bg-white border-2 border-slate-200 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:border-slate-400 transition-all rounded-xl tabular-nums text-center shadow-sm"
                disabled={isOpening}
                required
              />
            </div>
            <p className="text-[10px] text-slate-500 text-center font-medium">
              Cuenta el efectivo que tienes para comenzar
            </p>
          </div>

          {/* Botón de acción compacto */}
          <div className="pt-2">
            <Button 
              type="submit" 
              className="w-full h-11 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              disabled={isOpening || (isGlobalUser && !selectedBranch) || !initialCash}
            >
              {isOpening ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Abriendo caja...</span>
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" />
                  <span>Iniciar Turno</span>
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const MobileCashClosed = memo(MobileCashClosedComponent);