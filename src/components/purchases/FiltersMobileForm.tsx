'use client';

import { useState } from 'react';
import { ArrowLeft01Icon, FilterIcon, Clock01Icon, CheckmarkCircle02Icon, CancelCircleIcon, LayoutGridIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';

interface FiltersMobileFormProps {
  onClose: () => void;
  onApply: (filters: { status: string }) => void;
  currentStatus: string;
}

export function FiltersMobileForm({ onClose, onApply, currentStatus }: FiltersMobileFormProps) {
  const [selectedStatus, setSelectedStatus] = useState(currentStatus);

  const handleApply = () => {
    onApply({ status: selectedStatus });
    onClose();
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
        </div>
      </div>
    </div>
  );
}