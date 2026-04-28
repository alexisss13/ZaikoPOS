'use client';

import { useState } from 'react';
import { ArrowLeft01Icon, FilterIcon, Clock01Icon, CheckmarkCircle02Icon, CancelCircleIcon, LayoutGridIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';

interface FiltersMobileFormProps {
  onClose: () => void;
  onApply: (filters: { status: string; dateFrom: string; dateTo: string }) => void;
  currentStatus: string;
  currentDateFrom: string;
  currentDateTo: string;
}

export function FiltersMobileForm({ onClose, onApply, currentStatus, currentDateFrom, currentDateTo }: FiltersMobileFormProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);
  const [dateFrom, setDateFrom] = useState(currentDateFrom);
  const [dateTo, setDateTo] = useState(currentDateTo);

  const handleApply = () => {
    onApply({ status: selectedStatus, dateFrom, dateTo });
    onClose();
  };

  const clearDateFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const statusOptions = [
    { value: 'ALL', label: 'Todas', icon: LayoutGridIcon, color: 'bg-slate-100 text-slate-700' },
    { value: 'PENDING', label: 'Pendientes', icon: Clock01Icon, color: 'bg-yellow-100 text-yellow-700' },
    { value: 'RECEIVED', label: 'Recibidas', icon: CheckmarkCircle02Icon, color: 'bg-green-100 text-green-700' },
    { value: 'CANCELLED', label: 'Canceladas', icon: CancelCircleIcon, color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">Filtros</h2>
          <p className="text-xs text-slate-500">Personaliza tu búsqueda</p>
        </div>
        <Button
          onClick={handleApply}
          className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4"
        >
          Aplicar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-4">
          {/* Estado de Órdenes */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
                <FilterIcon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Estado de Órdenes</p>
                <p className="text-xs text-slate-500">Filtra por estado de las órdenes</p>
              </div>
            </div>
            
            <div className="space-y-2">
              {statusOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedStatus === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value)}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                      isSelected 
                        ? 'border-slate-900 bg-slate-50' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${option.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{option.label}</p>
                        <p className="text-xs text-slate-500">
                          {option.value === 'ALL' && 'Mostrar todas las órdenes'}
                          {option.value === 'PENDING' && 'Órdenes pendientes de recibir'}
                          {option.value === 'RECEIVED' && 'Órdenes ya recibidas'}
                          {option.value === 'CANCELLED' && 'Órdenes canceladas'}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                          <CheckmarkCircle02Icon className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filtros por Fecha */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-30">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-900">Rango de Fechas</p>
                <p className="text-xs text-slate-500">Filtra por fecha de orden</p>
              </div>
              {(dateFrom || dateTo) && (
                <button
                  onClick={clearDateFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold"
                >
                  Limpiar
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 mb-1 block">
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-11 px-3 text-sm bg-white border border-slate-200 rounded-xl outline-none transition-all focus:ring-2 focus:ring-blue-300 focus:border-blue-400"
                />
              </div>
              {(dateFrom || dateTo) && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <span className="font-bold">Filtro activo:</span> 
                    {dateFrom && dateTo ? ` Del ${new Date(dateFrom).toLocaleDateString('es-PE')} al ${new Date(dateTo).toLocaleDateString('es-PE')}` :
                     dateFrom ? ` Desde ${new Date(dateFrom).toLocaleDateString('es-PE')}` :
                     ` Hasta ${new Date(dateTo).toLocaleDateString('es-PE')}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}