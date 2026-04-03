// src/components/pos/CashSidebarButton.tsx
'use client';

import { useCashSession } from '@/hooks/use-cash-session';
import { CloseCashDialog } from '@/components/pos/CloseCashDialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Lock, Unlock } from 'lucide-react';
import { useState } from 'react';

export function CashSidebarButton() {
  const { session, isLoading } = useCashSession();
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);

  if (isLoading) return null;

  const isOpen = session?.status === 'OPEN';

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={() => isOpen && setIsCloseModalOpen(true)}
            className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all shadow-sm ring-1 
              ${isOpen 
                ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 ring-emerald-200' 
                : 'bg-rose-50 text-rose-600 cursor-not-allowed ring-rose-200'
              }`}
          >
            {isOpen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            
            {/* Indicador de estado */}
            <span className={`absolute top-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white 
              ${isOpen ? 'bg-emerald-500' : 'bg-rose-500'}`} 
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="right" className="font-semibold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
          {isOpen ? 'Caja Abierta (Click para cerrar)' : 'Caja Cerrada'}
        </TooltipContent>
      </Tooltip>

      {/* Solo renderizamos el modal si está abierto, el estado de apertura lo maneja CashGuard */}
      {isOpen && (
        <CloseCashDialog 
          isOpen={isCloseModalOpen} 
          onOpenChange={setIsCloseModalOpen} 
        />
      )}
    </>
  );
}