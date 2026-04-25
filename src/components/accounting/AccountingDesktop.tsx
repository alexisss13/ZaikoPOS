'use client';

import { useAccountingLogic } from './useAccountingLogic';
import { Button } from '@/components/ui/button';
import { SearchBar } from '@/components/dashboard/products/SearchBar';
import AccountModal from './AccountModal';
import JournalEntryModal from './JournalEntryModal';
import {
  CalculatorIcon,
  FileScriptIcon,
  Wallet01Icon,
  FileValidationIcon,
  PlusSignIcon,
  Search01Icon,
  ChartUpIcon,
  Money01Icon,
} from 'hugeicons-react';

export default function AccountingDesktop() {
  const logic = useAccountingLogic();
  const {
    stats,
    isLoading,
    activeTab,
    setActiveTab,
    handleSearchChange,
    filteredAccounts,
    filteredJournalEntries,
    accounts,
    mutateAccounts,
    mutateJournal,
    isAccountModalOpen,
    setIsAccountModalOpen,
    isJournalModalOpen,
    setIsJournalModalOpen,
    selectedAccount,
    setSelectedAccount,
    selectedJournal,
    setSelectedJournal,
  } = logic;

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full gap-5">
        <div className="flex items-center gap-2.5">
          <div className="h-7 bg-slate-100 rounded w-48 animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full gap-4 animate-in fade-in duration-200">
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Contabilidad</h1>
          <CalculatorIcon className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search01Icon className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <div className="w-full">
              <SearchBar 
                onSearchChange={handleSearchChange} 
                placeholder="Buscar..." 
                debounceMs={200} 
                className="w-full" 
                inputClassName="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
              />
            </div>
          </div>
          {activeTab === 'accounts' && (
            <Button 
              onClick={() => setIsAccountModalOpen(true)} 
              className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0"
            >
              <PlusSignIcon className="w-4 h-4 mr-1.5" />
              <span className="font-bold">Nueva Cuenta</span>
            </Button>
          )}
          {activeTab === 'journal' && (
            <Button 
              onClick={() => setIsJournalModalOpen(true)} 
              className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0"
            >
              <PlusSignIcon className="w-4 h-4 mr-1.5" />
              <span className="font-bold">Nuevo Asiento</span>
            </Button>
          )}
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar shrink-0">
        <button 
          onClick={() => setActiveTab('dashboard')} 
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <CalculatorIcon className="w-3.5 h-3.5" /> Panel
        </button>
        <button 
          onClick={() => setActiveTab('journal')} 
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'journal' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <FileScriptIcon className="w-3.5 h-3.5" /> Asientos
        </button>
        <button 
          onClick={() => setActiveTab('accounts')} 
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'accounts' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <Wallet01Icon className="w-3.5 h-3.5" /> Cuentas
        </button>
        <button 
          onClick={() => setActiveTab('reports')} 
          className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${activeTab === 'reports' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
        >
          <FileValidationIcon className="w-3.5 h-3.5" /> Reportes
        </button>
      </div>

      {/* CONTENT */}
      <div className="overflow-auto flex-1 relative custom-scrollbar">
        {activeTab === 'dashboard' && (
          <div className="space-y-3 h-full flex flex-col">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Ingresos */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <ChartUpIcon className="w-5 h-5 text-emerald-600" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ingresos</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">S/ {stats.totalIncome.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Este mes</p>
              </div>

              {/* Gastos */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <Money01Icon className="w-5 h-5 text-red-600" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Gastos</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">S/ {stats.totalExpenses.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Este mes</p>
              </div>

              {/* Utilidad */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <CalculatorIcon className="w-5 h-5 text-blue-600" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Utilidad Neta</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">S/ {stats.netProfit.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Margen: {stats.totalIncome > 0 ? ((stats.netProfit / stats.totalIncome) * 100).toFixed(1) : 0}%</p>
              </div>

              {/* Efectivo */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between mb-2.5">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Money01Icon className="w-5 h-5 text-amber-600" strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Efectivo</p>
                <p className="text-2xl font-bold text-slate-900 tabular-nums">S/ {stats.cashBalance.toFixed(2)}</p>
                <p className="text-[10px] text-slate-500 mt-1">Disponible</p>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm flex-1 min-h-0 flex flex-col">
              <h3 className="text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2.5">Actividad Reciente</h3>
              <div className="space-y-1 overflow-y-auto flex-1 custom-scrollbar">
                {filteredJournalEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                    <FileScriptIcon className="w-8 h-8 mb-2 opacity-50" strokeWidth={1.5} />
                    <p className="text-xs">Sin asientos recientes</p>
                  </div>
                ) : (
                  filteredJournalEntries.slice(0, 5).map((entry) => {
                    const totalDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0);
                    const totalCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit), 0);
                    
                    return (
                      <div
                        key={entry.id}
                        className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100 hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                            <FileScriptIcon className="w-4 h-4 text-slate-600" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-slate-900">Asiento #{entry.entryNumber}</p>
                            <p className="text-[10px] text-slate-500">{entry.description}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-emerald-600">D: S/ {totalDebit.toFixed(2)}</span>
                            <span className="text-xs font-bold text-red-600">C: S/ {totalCredit.toFixed(2)}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{new Date(entry.entryDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'journal' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-semibold rounded-tl-xl">Número</th>
                  <th className="px-5 py-3.5 font-semibold">Descripción</th>
                  <th className="px-5 py-3.5 font-semibold">Fecha</th>
                  <th className="px-5 py-3.5 font-semibold">Débito</th>
                  <th className="px-5 py-3.5 font-semibold">Crédito</th>
                  <th className="px-5 py-3.5 font-semibold rounded-tr-xl text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {filteredJournalEntries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <FileScriptIcon className="w-10 h-10 text-slate-200" strokeWidth={1} />
                        <p className="font-medium text-sm text-slate-500">No se encontraron asientos</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredJournalEntries.map((entry) => {
                    const totalDebit = entry.lines.reduce((sum, line) => sum + Number(line.debit), 0);
                    const totalCredit = entry.lines.reduce((sum, line) => sum + Number(line.credit), 0);
                    
                    return (
                      <tr key={entry.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-slate-900">#{entry.entryNumber}</span>
                        </td>
                        <td className="px-5 py-4">
                          <p className="text-sm text-slate-900">{entry.description}</p>
                          {entry.sourceId && (
                            <p className="text-xs text-slate-400 mt-0.5">Ref: {entry.sourceId}</p>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs text-slate-600">{new Date(entry.entryDate).toLocaleDateString('es-PE')}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-emerald-600">S/ {totalDebit.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-red-600">S/ {totalCredit.toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => {
                              setSelectedJournal(entry);
                              setIsJournalModalOpen(true);
                            }}
                          >
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'accounts' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <table className="w-full text-left border-separate border-spacing-0">
              <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5 font-semibold rounded-tl-xl">Código</th>
                  <th className="px-5 py-3.5 font-semibold">Nombre</th>
                  <th className="px-5 py-3.5 font-semibold">Tipo</th>
                  <th className="px-5 py-3.5 font-semibold">Saldo</th>
                  <th className="px-5 py-3.5 font-semibold rounded-tr-xl text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50/80">
                {filteredAccounts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                        <Wallet01Icon className="w-10 h-10 text-slate-200" strokeWidth={1} />
                        <p className="font-medium text-sm text-slate-500">No se encontraron cuentas</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAccounts.map((account) => {
                    const typeLabel = {
                      ASSET: 'Activo',
                      LIABILITY: 'Pasivo',
                      EQUITY: 'Patrimonio',
                      REVENUE: 'Ingreso',
                      EXPENSE: 'Gasto',
                    }[account.type] || account.type;

                    return (
                      <tr key={account.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-slate-900">{account.code}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm text-slate-900">{account.name}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs font-bold text-slate-600">{typeLabel}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-sm font-bold text-slate-900">S/ {Number(account.balance).toFixed(2)}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 text-xs"
                            onClick={() => {
                              setSelectedAccount(account);
                              setIsAccountModalOpen(true);
                            }}
                          >
                            Ver
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="grid grid-cols-3 gap-4">
            <button className="p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all text-left">
              <h4 className="font-bold text-slate-900 mb-1">Balance General</h4>
              <p className="text-sm text-slate-500">Estado de situación financiera</p>
            </button>
            <button className="p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all text-left">
              <h4 className="font-bold text-slate-900 mb-1">Estado de Resultados</h4>
              <p className="text-sm text-slate-500">Ingresos y gastos del período</p>
            </button>
            <button className="p-6 bg-white border-2 border-slate-200 rounded-2xl hover:border-slate-300 hover:bg-slate-50 transition-all text-left">
              <h4 className="font-bold text-slate-900 mb-1">Flujo de Efectivo</h4>
              <p className="text-sm text-slate-500">Movimientos de caja</p>
            </button>
          </div>
        )}
      </div>

      {/* MODALS */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => {
          setIsAccountModalOpen(false);
          setSelectedAccount(null);
        }}
        onSuccess={() => {
          mutateAccounts();
        }}
        account={selectedAccount}
        accounts={accounts || []}
      />

      <JournalEntryModal
        isOpen={isJournalModalOpen}
        onClose={() => {
          setIsJournalModalOpen(false);
          setSelectedJournal(null);
        }}
        onSuccess={() => {
          mutateJournal();
        }}
        entry={selectedJournal}
        accounts={accounts || []}
      />
    </div>
  );
}
