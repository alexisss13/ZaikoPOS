'use client';

import { memo } from 'react';
import { ShoppingBag01Icon, ArrowRight01Icon } from 'hugeicons-react';

interface MobileCartFABProps {
  itemCount: number;
  total: number;
  onClick: () => void;
  disabled?: boolean;
}

function MobileCartFABComponent({ itemCount, total, onClick, disabled }: MobileCartFABProps) {
  if (itemCount === 0) return null;

  return (
    <div 
      className="fixed left-0 right-0 z-40 px-4 pb-2"
      style={{ 
        bottom: 'calc(4.5rem + env(safe-area-inset-bottom, 0px))',
        pointerEvents: 'none',
      }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full flex items-center gap-3 bg-slate-900 text-white rounded-2xl px-4 py-3.5 shadow-2xl shadow-slate-900/30 active:scale-[0.98] transition-transform disabled:opacity-50 border border-slate-700"
        style={{ 
          WebkitTapHighlightColor: 'transparent',
          pointerEvents: 'auto',
        }}
      >
        {/* Ícono con badge */}
        <div className="relative shrink-0">
          <ShoppingBag01Icon className="w-5 h-5 text-white" />
          <div className="absolute -top-1.5 -right-2 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-black border-2 border-slate-900">
            {itemCount > 99 ? '99' : itemCount}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 text-left pl-1">
          <p className="text-xs font-medium text-slate-300">
            {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
          </p>
        </div>

        {/* Total + Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-base font-black tabular-nums">
            S/ {total.toFixed(2)}
          </span>
          <div className="w-7 h-7 bg-white/15 rounded-lg flex items-center justify-center">
            <ArrowRight01Icon className="w-4 h-4" />
          </div>
        </div>
      </button>
    </div>
  );
}

export const MobileCartFAB = memo(MobileCartFABComponent);
