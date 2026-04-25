'use client';

import { memo, useCallback, useState } from 'react';
import { FileScriptIcon, ArrowDown01Icon } from 'hugeicons-react';
import type { JournalEntry } from './useAccountingLogic';

interface JournalEntryCardProps {
  entry: JournalEntry;
  onEdit: (entry: JournalEntry) => void;
}

function JournalEntryCardComponent({ entry, onEdit }: JournalEntryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };
  
  const handleToggle = useCallback(() => {
    haptic(8);
    setIsExpanded(prev => !prev);
  }, []);

  const handleEdit = useCallback(() => {
    haptic(8);
    onEdit(entry);
  }, [onEdit, entry]);

  const totalDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0);
  const totalCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit), 0);

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: '0 100px', transform: 'translateZ(0)', contain: 'layout style paint' }}>
      {/* Header */}
      <div className="p-4 cursor-pointer select-none" onClick={handleToggle} style={{ WebkitTapHighlightColor: 'transparent' }}>
        <div className="flex items-center gap-3">
          {/* Icon */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0 flex items-center justify-center" style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <FileScriptIcon className="w-6 h-6 text-slate-600" />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight mb-0.5 truncate">Asiento #{entry.entryNumber}</h3>
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <span className="text-xs text-slate-400 truncate">{entry.description}</span>
              {entry.sourceId && (
                <>
                  <span className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                  <span className="text-[10px] font-mono text-slate-300 truncate max-w-[70px]">{entry.sourceId}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-emerald-600">D: S/ {totalDebit.toFixed(2)}</span>
                <span className="text-xs font-bold text-red-600">C: S/ {totalCredit.toFixed(2)}</span>
              </div>
              <div className="px-2 py-0.5 rounded-full text-xs font-bold border bg-slate-50 text-slate-700 border-slate-200">
                {new Date(entry.entryDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
              </div>
            </div>
          </div>

          <ArrowDown01Icon className={`w-4 h-4 text-slate-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} style={{ transform: isExpanded ? 'rotate(180deg) translateZ(0)' : 'translateZ(0)', willChange: 'transform' }} />
        </div>
      </div>

      {/* Expandible */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50">
          {/* Líneas del asiento */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Líneas del Asiento</span>
            </div>
            {entry.lines.map((line) => (
              <div key={line.id} className="bg-white rounded-2xl p-3 border border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{line.account.code} - {line.account.name}</p>
                    {line.description && (
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">{line.description}</p>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {Number(line.debit) > 0 && (
                      <span className="text-xs font-bold text-emerald-600">D: S/ {Number(line.debit).toFixed(2)}</span>
                    )}
                    {Number(line.credit) > 0 && (
                      <span className="text-xs font-bold text-red-600">C: S/ {Number(line.credit).toFixed(2)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Totales */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Total Débito</span>
              </div>
              <span className="text-base font-bold text-emerald-700">S/ {totalDebit.toFixed(2)}</span>
            </div>

            <div className="bg-red-50 rounded-2xl p-3 border border-red-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="text-[10px] font-bold text-red-600 uppercase tracking-wide">Total Crédito</span>
              </div>
              <span className="text-base font-bold text-red-700">S/ {totalCredit.toFixed(2)}</span>
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

export const JournalEntryCard = memo(JournalEntryCardComponent);
