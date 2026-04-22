'use client';

import { memo } from 'react';
import { Search, UserPlus, HistoryIcon, ArrowRightLeft, SlidersHorizontal, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface Branch {
  id: string;
  name: string;
  ecommerceCode: string | null;
  logoUrl?: string | null;
}

interface MobilePOSHeaderProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNewCustomer: () => void;
  onHistory: () => void;
  onCashTransaction: () => void;
  onCloseCash: () => void;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
  disabled?: boolean;
}

function MobilePOSHeaderComponent({
  searchTerm,
  onSearchChange,
  onNewCustomer,
  onHistory,
  onCashTransaction,
  onCloseCash,
  onOpenFilters,
  hasActiveFilters,
  disabled = false,
}: MobilePOSHeaderProps) {
  
  return (
    <div className="flex flex-col gap-2.5 pb-2">
      {/* Título y acciones */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-slate-900 leading-tight">POS</h1>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Botón de filtros solo ícono */}
          <button
            onClick={onOpenFilters}
            disabled={disabled}
            className="relative h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-30"
            title="Filtros"
          >
            <SlidersHorizontal className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                •
              </span>
            )}
          </button>
          
          {/* Botones de acción sin bordes como productos */}
          <button
            onClick={onNewCustomer}
            disabled={disabled}
            className="h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-30"
            title="Registrar cliente"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={onHistory}
            disabled={disabled}
            className="h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-30"
            title="Historial"
          >
            <HistoryIcon className="w-4 h-4" />
          </button>
          <button
            onClick={onCashTransaction}
            disabled={disabled}
            className="h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-30"
            title="Ingresos/Egresos"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </button>
          <button
            onClick={onCloseCash}
            disabled={disabled}
            className="h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-30"
            title="Cerrar caja"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        <Input
          placeholder="Buscar producto, SKU..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          disabled={disabled}
          className="pl-9 pr-4 h-9 bg-white border-slate-200 rounded-xl text-sm shadow-sm"
        />
      </div>
    </div>
  );
}

export const MobilePOSHeader = memo(MobilePOSHeaderComponent);
