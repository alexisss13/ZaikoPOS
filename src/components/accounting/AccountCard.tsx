'use client';

import { memo, useCallback, useState } from 'react';
import { Wallet01Icon, ArrowDown01Icon } from 'hugeicons-react';
import type { Account } from './useAccountingLogic';

interface AccountCardProps {
  account: Account;
  onEdit: (account: Account) => void;
}

function AccountCardComponent({ account, onEdit }: AccountCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };
  
  const handleToggle = useCallback(() => {
    haptic(8);
    setIsExpanded(prev => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    haptic(8);
    onEdit(account);
  }, [onEdit, account]);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'ASSET': return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' };
      case 'LIABILITY': return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
      case 'EQUITY': return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' };
      case 'REVENUE': return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
      case 'EXPENSE': return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };
      default: return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    }
  };

  const typeColor = getTypeColor(account.type);
  const typeLabel = {
    ASSET: 'Activo',
    LIABILITY: 'Pasivo',
    EQUITY: 'Patrimonio',
    REVENUE: 'Ingreso',
    EXPENSE: 'Gasto',
  }[account.type] || account.type;

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 100px', transform: 'translateZ(0)', contain: 'layout style paint' }}>
      {/* Header */}
      <div className="p-4 cursor-pointer select-none" onClick={handleToggle} style={{ WebkitTapHighlightColor: 'transparent' }}>
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0 flex items-center justify-center" style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <Wallet01Icon className="w-6 h-6 text-slate-600" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight mb-0.5 truncate">{account.code} - {account.name}</h3>
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <span className="text-xs text-slate-400 truncate">{typeLabel}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900">S/ {Number(account.balance).toFixed(2)}</span>
              <div className={`px-2 py-0.5 rounded-full text-xs font-bold border ${typeColor.bg} ${typeColor.text} ${typeColor.border}`}>
                {typeLabel}
              </div>
            </div>
          </div>

          <ArrowDown01Icon className={`w-4 h-4 text-slate-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} style={{ transform: isExpanded ? 'rotate(180deg) translateZ(0)' : 'translateZ(0)', willChange: 'transform' }} />
        </div>
      </div>

      {/* Expandible */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Código */}
            <div className="bg-white rounded-2xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Código</span>
              </div>
              <span className="text-base font-bold text-slate-900">{account.code}</span>
            </div>

            {/* Saldo */}
            <div className="bg-white rounded-2xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Saldo</span>
              </div>
              <span className="text-base font-bold text-slate-900">S/ {Number(account.balance).toFixed(2)}</span>
            </div>
          </div>

          {/* Botón */}
          <button
            onClick={handleEdit}
            className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
            style={{ WebkitTapHighlightColor: 'transparent' }}
          >
            Ver detalles
          </button>
        </div>
      )}
    </div>
  );
}

export const AccountCard = memo(AccountCardComponent);
