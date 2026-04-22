'use client';

import { memo } from 'react';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileCashClosedProps {
  onOpenCash: () => void;
}

function MobileCashClosedComponent({ onOpenCash }: MobileCashClosedProps) {
  return (
    <div className="flex flex-col h-full w-full gap-5" style={{ willChange: 'auto' }}>
      {/* Header siguiendo el estilo de productos */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-900 leading-tight">POS</h1>
            <p className="text-xs text-slate-400 mt-0.5">Caja cerrada</p>
          </div>
        </div>
      </div>

      {/* Contenido principal - mismo estilo que productos cuando no hay datos */}
      <div className="flex flex-col items-center justify-center flex-1 gap-4 p-6 pb-24">
        <Wallet className="w-16 h-16 text-slate-300" />
        <div className="text-center">
          <h2 className="text-lg font-bold text-slate-900 mb-2">Abre tu caja para comenzar</h2>
          <p className="text-sm text-slate-500 text-center max-w-xs leading-relaxed">
            Configura el monto inicial de efectivo para gestionar ventas y transacciones
          </p>
        </div>
        <Button 
          onClick={onOpenCash} 
          className="mt-2 h-11 px-6 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-95"
        >
          Abrir Caja
        </Button>
      </div>
    </div>
  );
}

export const MobileCashClosed = memo(MobileCashClosedComponent);