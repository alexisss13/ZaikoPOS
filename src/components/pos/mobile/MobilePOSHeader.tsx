'use client';

import { memo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { 
  SlidersHorizontalIcon, 
  UserAdd01Icon, 
  Time02Icon, 
  ArrowDataTransferHorizontalIcon, 
  Logout01Icon, 
  Search01Icon,
  MoreHorizontalIcon
} from 'hugeicons-react';

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
  cartItemCount?: number;
  cartTotal?: number;
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
  cartItemCount = 0,
  cartTotal = 0,
}: MobilePOSHeaderProps) {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div className="flex flex-col gap-2.5 pb-2">
      {/* Header compacto con stats inline */}
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-black text-slate-900 leading-tight">POS</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-bold text-emerald-600">
              {cartItemCount} {cartItemCount === 1 ? 'producto' : 'productos'}
            </span>
            <span className="text-[11px] text-slate-300">•</span>
            <span className="text-[11px] font-bold text-slate-900">
              S/ {cartTotal.toFixed(2)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5">
          {/* Botón de filtros */}
          <button
            onClick={onOpenFilters}
            disabled={disabled}
            className="relative h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-30"
          >
            <SlidersHorizontalIcon className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                •
              </span>
            )}
          </button>
          
          {/* Menú de acciones */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={disabled}
              className="h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all disabled:opacity-30"
            >
              <MoreHorizontalIcon className="w-4 h-4" />
            </button>
            
            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 w-44 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50">
                  <button
                    onClick={() => { onNewCustomer(); setShowMenu(false); }}
                    disabled={disabled}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <UserAdd01Icon className="w-4 h-4 text-slate-400" />
                    Cliente
                  </button>
                  <button
                    onClick={() => { onHistory(); setShowMenu(false); }}
                    disabled={disabled}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <Time02Icon className="w-4 h-4 text-slate-400" />
                    Historial
                  </button>
                  <button
                    onClick={() => { onCashTransaction(); setShowMenu(false); }}
                    disabled={disabled}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-30"
                  >
                    <ArrowDataTransferHorizontalIcon className="w-4 h-4 text-slate-400" />
                    Ingresos/Egresos
                  </button>
                  <div className="h-px bg-slate-100 mx-2 my-1" />
                  <button
                    onClick={() => { onCloseCash(); setShowMenu(false); }}
                    disabled={disabled}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-30"
                  >
                    <Logout01Icon className="w-4 h-4 text-red-500" />
                    Cerrar Caja
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Barra de búsqueda compacta */}
      <div className="relative">
        <Search01Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
