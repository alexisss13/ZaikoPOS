'use client';

import { memo } from 'react';
import { ShoppingBag01Icon } from 'hugeicons-react';

interface MobileCartFABProps {
  itemCount: number;
  total: number;
  onClick: () => void;
  disabled?: boolean;
}

function MobileCartFABComponent({ itemCount, total, onClick, disabled }: MobileCartFABProps) {
  if (itemCount === 0) return null;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="fixed bottom-20 right-4 z-40 flex flex-col items-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
    >
      {/* Botón principal */}
      <div className="relative bg-slate-900 text-white rounded-2xl shadow-2xl p-4 border-2 border-white">
        <ShoppingBag01Icon className="w-6 h-6" />
        
        {/* Badge con contador */}
        {itemCount > 0 && (
          <div className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center text-xs font-black shadow-lg border-2 border-white">
            {itemCount > 99 ? '99+' : itemCount}
          </div>
        )}
      </div>

      {/* Total */}
      <div className="bg-white text-slate-900 px-3 py-1.5 rounded-full shadow-lg text-xs font-black border border-slate-200">
        S/ {total.toFixed(2)}
      </div>
    </button>
  );
}

export const MobileCartFAB = memo(MobileCartFABComponent);
