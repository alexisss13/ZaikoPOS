'use client';

import { useState } from 'react';
import { useAccountingLogic, haptic } from './useAccountingLogic';
import {
  CalculatorIcon,
  FileScriptIcon,
  Wallet01Icon,
  FileValidationIcon,
  ChartUpIcon,
  Money01Icon,
  ArrowRight01Icon,
  Calendar03Icon,
  Add01Icon,
  Search01Icon,
  FilterIcon,
  ArrowUp01Icon,
  ArrowDown01Icon,
} from 'hugeicons-react';

type MobileView = 'home' | 'accounts' | 'journal' | 'reports';

export default function AccountingMobile() {
  const logic = useAccountingLogic();
  const { stats, isLoading, mobileJournalEntries, accounts } = logic;
  const [currentView, setCurrentView] = useState<MobileView>('home');
  const [searchQuery, setSearchQuery] = useState('');

  if (isLoading) {
    return (
      <div 
        className="flex flex-col h-full w-full overflow-y-auto pb-24 px-4 pt-4 gap-4 bg-slate-50"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
          contain: 'layout style paint',
        }}
      >
        <div className="flex flex-col gap-1.5">
          <div className="h-6 bg-slate-200 rounded-lg w-48 animate-pulse" />
          <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-28 animate-pulse">
              <div className="h-3 bg-slate-200 rounded w-2/3 mb-2" />
              <div className="h-6 bg-slate-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Vista: Home (Dashboard)
  if (currentView === 'home') {
    return (
      <div 
        className="flex flex-col h-full w-full overflow-y-auto pb-24 bg-slate-50"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
          contain: 'layout style paint',
        }}
      >
        {/* Header con gradiente */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 pt-6 pb-8 rounded-b-[2rem] shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-white mb-1">
                Contabilidad
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-300">
                <Calendar03Icon className="w-3.5 h-3.5" />
                <span>{new Date().toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })}</span>
              </div>
            </div>
            <button
              onClick={() => { haptic(8); }}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
            >
              <FilterIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Stats Cards - Dentro del header */}
          <div className="grid grid-cols-2 gap-3">
            {/* Ingresos */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <ArrowUp01Icon className="w-4 h-4 text-emerald-400" />
                </div>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide">Ingresos</span>
              </div>
              <p className="text-2xl font-bold text-white">S/ {stats.totalIncome.toFixed(2)}</p>
            </div>

            {/* Gastos */}
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <ArrowDown01Icon className="w-4 h-4 text-red-400" />
                </div>
                <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide">Gastos</span>
              </div>
              <p className="text-2xl font-bold text-white">S/ {stats.totalExpenses.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 py-6 space-y-6">
          {/* Utilidad Neta Card */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <CalculatorIcon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-bold text-white/90">Utilidad Neta</span>
              </div>
              <span className="text-xs font-bold text-white/70 bg-white/20 px-2.5 py-1 rounded-lg">
                Este mes
              </span>
            </div>
            <p className="text-3xl font-bold text-white mb-1">S/ {stats.netProfit.toFixed(2)}</p>
            <p className="text-xs text-white/70">
              {stats.netProfit >= 0 ? '↗ Ganancia' : '↘ Pérdida'}
            </p>
          </div>

          {/* Quick Actions Grid */}
          <div>
            <h2 className="text-sm font-bold text-slate-900 mb-3 px-1">Acciones Rápidas</h2>
            <div className="grid grid-cols-2 gap-3">
              {/* Ver Asientos */}
              <button
                onClick={() => { haptic(8); setCurrentView('journal'); }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-[0.97] transition-transform"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  transform: 'translateZ(0)',
                }}
              >
                <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
                  <FileScriptIcon className="w-6 h-6 text-slate-700" />
                </div>
                <p className="font-bold text-sm text-slate-900 mb-0.5">Asientos</p>
                <p className="text-xs text-slate-500">{mobileJournalEntries.length} registros</p>
              </button>

              {/* Ver Cuentas */}
              <button
                onClick={() => { haptic(8); setCurrentView('accounts'); }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-[0.97] transition-transform"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  transform: 'translateZ(0)',
                }}
              >
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                  <Wallet01Icon className="w-6 h-6 text-blue-600" />
                </div>
                <p className="font-bold text-sm text-slate-900 mb-0.5">Cuentas</p>
                <p className="text-xs text-slate-500">{accounts?.length || 0} activas</p>
              </button>

              {/* Reportes */}
              <button
                onClick={() => { haptic(8); setCurrentView('reports'); }}
                className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-[0.97] transition-transform"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  transform: 'translateZ(0)',
                }}
              >
                <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                  <FileValidationIcon className="w-6 h-6 text-purple-600" />
                </div>
                <p className="font-bold text-sm text-slate-900 mb-0.5">Reportes</p>
                <p className="text-xs text-slate-500">Estados financieros</p>
              </button>

              {/* Nuevo Asiento */}
              <button
                onClick={() => { haptic(8); }}
                className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 shadow-lg active:scale-[0.97] transition-transform"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  transform: 'translateZ(0)',
                }}
              >
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                  <Add01Icon className="w-6 h-6 text-white" />
                </div>
                <p className="font-bold text-sm text-white mb-0.5">Nuevo</p>
                <p className="text-xs text-white/80">Crear asiento</p>
              </button>
            </div>
          </div>

          {/* Actividad Reciente */}
          <div>
            <div className="flex items-center justify-between mb-3 px-1">
              <h2 className="text-sm font-bold text-slate-900">Actividad Reciente</h2>
              {mobileJournalEntries.length > 0 && (
                <button 
                  onClick={() => { haptic(8); setCurrentView('journal'); }}
                  className="text-xs font-bold text-blue-600 flex items-center gap-1"
                >
                  Ver todo
                  <ArrowRight01Icon className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {mobileJournalEntries.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <FileScriptIcon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1">Sin actividad</p>
                <p className="text-xs text-slate-500">Los asientos recientes aparecerán aquí</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {mobileJournalEntries.slice(0, 5).map((entry) => {
                  const totalDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0);
                  
                  return (
                    <button
                      key={entry.id}
                      onClick={() => { haptic(8); }}
                      className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform text-left"
                      style={{ 
                        WebkitTapHighlightColor: 'transparent',
                        transform: 'translateZ(0)',
                      }}
                    >
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <FileScriptIcon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 mb-0.5 truncate">Asiento #{entry.entryNumber}</p>
                        <p className="text-xs text-slate-500 truncate">{entry.description}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-slate-900">S/ {totalDebit.toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(entry.entryDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Vista: Cuentas
  if (currentView === 'accounts') {
    const filteredAccounts = (accounts || []).filter(acc => 
      acc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.code.includes(searchQuery)
    );

    return (
      <div 
        className="flex flex-col h-full w-full overflow-hidden bg-slate-50"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
        }}
      >
        {/* Header */}
        <div className="bg-white px-4 pt-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => { haptic(8); setCurrentView('home'); }}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowRight01Icon className="w-5 h-5 text-slate-700 rotate-180" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">Plan de Cuentas</h1>
              <p className="text-xs text-slate-500">{accounts?.length || 0} cuentas activas</p>
            </div>
            <button
              onClick={() => { haptic(8); }}
              className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center active:scale-95 transition-transform shadow-sm"
            >
              <Add01Icon className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cuenta..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl bg-slate-100 border-none text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-300"
            />
          </div>
        </div>

        {/* Accounts List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          {filteredAccounts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mt-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <Wallet01Icon className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">Sin resultados</p>
              <p className="text-xs text-slate-500">No se encontraron cuentas</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAccounts.map((account) => {
                const typeColors = {
                  ASSET: 'bg-blue-50 text-blue-700 border-blue-200',
                  LIABILITY: 'bg-red-50 text-red-700 border-red-200',
                  EQUITY: 'bg-purple-50 text-purple-700 border-purple-200',
                  REVENUE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                  EXPENSE: 'bg-orange-50 text-orange-700 border-orange-200',
                };

                const typeLabels = {
                  ASSET: 'Activo',
                  LIABILITY: 'Pasivo',
                  EQUITY: 'Patrimonio',
                  REVENUE: 'Ingreso',
                  EXPENSE: 'Gasto',
                };

                return (
                  <button
                    key={account.id}
                    onClick={() => { haptic(8); }}
                    className="w-full bg-white rounded-xl border border-slate-200 p-4 text-left shadow-sm active:scale-[0.98] transition-transform"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      transform: 'translateZ(0)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {account.code}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${typeColors[account.type]}`}>
                            {typeLabels[account.type]}
                          </span>
                        </div>
                        <p className="font-bold text-sm text-slate-900 truncate">{account.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-xs text-slate-500">Saldo</span>
                      <span className="text-sm font-bold text-slate-900">S/ {Number(account.balance).toFixed(2)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista: Asientos (Journal)
  if (currentView === 'journal') {
    return (
      <div 
        className="flex flex-col h-full w-full overflow-hidden bg-slate-50"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
        }}
      >
        {/* Header */}
        <div className="bg-white px-4 pt-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => { haptic(8); setCurrentView('home'); }}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowRight01Icon className="w-5 h-5 text-slate-700 rotate-180" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">Asientos Contables</h1>
              <p className="text-xs text-slate-500">{mobileJournalEntries.length} registros</p>
            </div>
            <button
              onClick={() => { haptic(8); }}
              className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center active:scale-95 transition-transform shadow-sm"
            >
              <Add01Icon className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Journal Entries List */}
        <div className="flex-1 overflow-y-auto px-4 py-4 pb-24">
          {mobileJournalEntries.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center mt-4">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <FileScriptIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">Sin asientos</p>
              <p className="text-xs text-slate-500">Los asientos contables aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {mobileJournalEntries.map((entry) => {
                const totalDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0);
                const totalCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit), 0);
                
                return (
                  <button
                    key={entry.id}
                    onClick={() => { haptic(8); }}
                    className="w-full bg-white rounded-2xl border border-slate-200 p-4 text-left shadow-sm active:scale-[0.98] transition-transform"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      transform: 'translateZ(0)',
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <FileScriptIcon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 mb-0.5">Asiento #{entry.entryNumber}</p>
                        <p className="text-xs text-slate-500 truncate">{entry.description}</p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          {new Date(entry.entryDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                      <div className="bg-emerald-50 rounded-lg p-2">
                        <p className="text-[10px] font-bold text-emerald-700 mb-0.5">DÉBITO</p>
                        <p className="text-sm font-bold text-emerald-900">S/ {totalDebit.toFixed(2)}</p>
                      </div>
                      <div className="bg-red-50 rounded-lg p-2">
                        <p className="text-[10px] font-bold text-red-700 mb-0.5">CRÉDITO</p>
                        <p className="text-sm font-bold text-red-900">S/ {totalCredit.toFixed(2)}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Vista: Reportes
  if (currentView === 'reports') {
    return (
      <div 
        className="flex flex-col h-full w-full overflow-hidden bg-slate-50"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
        }}
      >
        {/* Header */}
        <div className="bg-white px-4 pt-6 pb-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { haptic(8); setCurrentView('home'); }}
              className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
            >
              <ArrowRight01Icon className="w-5 h-5 text-slate-700 rotate-180" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">Reportes</h1>
              <p className="text-xs text-slate-500">Estados financieros</p>
            </div>
          </div>
        </div>

        {/* Reports Content */}
        <div className="flex-1 overflow-y-auto px-4 py-6 pb-24">
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-3">
              <FileValidationIcon className="w-8 h-8 text-purple-600" />
            </div>
            <p className="text-sm font-bold text-slate-900 mb-1">Próximamente</p>
            <p className="text-xs text-slate-500">Los reportes financieros estarán disponibles pronto</p>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
