'use client';

import { useState } from 'react';
import { 
  ArrowLeft01Icon, 
  FilterIcon, 
  DashboardSquare01Icon, 
  ArrowDataTransferHorizontalIcon,
  Store01Icon,
  UnavailableIcon,
  Tag01Icon,
  PackageIcon,
  CheckmarkCircle02Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';

interface FiltersMobileFormProps {
  onClose: () => void;
  onApply: (filters: { 
    codeFilter: string; 
    categoryFilter: string; 
    stockFilter: string; 
  }) => void;
  currentFilters: {
    codeFilter: string;
    categoryFilter: string;
    stockFilter: string;
  };
  visibleCodes: string[];
  getBranchByCode: (code: string) => any;
  availableCategories: any[];
}

export function FiltersMobileForm({ 
  onClose, 
  onApply, 
  currentFilters,
  visibleCodes,
  getBranchByCode,
  availableCategories
}: FiltersMobileFormProps) {
  const [selectedCodeFilter, setSelectedCodeFilter] = useState(currentFilters.codeFilter);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState(currentFilters.categoryFilter);
  const [selectedStockFilter, setSelectedStockFilter] = useState(currentFilters.stockFilter);

  const handleApply = () => {
    onApply({
      codeFilter: selectedCodeFilter,
      categoryFilter: selectedCategoryFilter,
      stockFilter: selectedStockFilter
    });
    onClose();
  };

  const catalogOptions = [
    { value: 'ALL', label: 'Todos', icon: <DashboardSquare01Icon className="w-5 h-5" /> },
    { value: 'GENERAL', label: 'Compartidos', icon: <ArrowDataTransferHorizontalIcon className="w-5 h-5" /> },
    ...visibleCodes.map(code => { 
      const b = getBranchByCode(code); 
      return { 
        value: code, 
        label: b?.name || code, 
        icon: b?.logoUrl ? 
          <img src={b.logoUrl} className="w-5 h-5 rounded object-cover" alt="" /> : 
          <Store01Icon className="w-5 h-5" /> 
      }; 
    }),
    { value: 'INACTIVE', label: 'Inactivos', icon: <UnavailableIcon className="w-5 h-5" /> },
  ];

  const stockOptions = [
    { value: 'ALL', label: 'Todos', description: 'Mostrar todos los productos', color: 'bg-slate-100 text-slate-700' },
    { value: 'LOW', label: 'Stock Bajo', description: 'Productos con stock por debajo del mínimo', color: 'bg-amber-100 text-amber-700' },
    { value: 'OUT', label: 'Agotados', description: 'Productos sin stock disponible', color: 'bg-red-100 text-red-700' },
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
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Catálogo */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <DashboardSquare01Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Catálogo</p>
              <p className="text-xs text-slate-500">Selecciona una sucursal</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            {catalogOptions.map((option) => {
              const isSelected = selectedCodeFilter === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => {
                    setSelectedCodeFilter(option.value);
                    if (option.value !== 'ALL') {
                      setSelectedCategoryFilter('ALL'); // Reset category when changing catalog
                    }
                  }}
                  className={`p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-slate-900 bg-slate-50' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      {option.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{option.label}</p>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                        <CheckmarkCircle02Icon className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Categorías */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Tag01Icon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Categoría</p>
              <p className="text-xs text-slate-500">Filtra por categoría de producto</p>
            </div>
          </div>
          
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <button
              onClick={() => setSelectedCategoryFilter('ALL')}
              className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                selectedCategoryFilter === 'ALL'
                  ? 'border-slate-900 bg-slate-50' 
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                  <Tag01Icon className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-slate-900">Todas las categorías</p>
                </div>
                {selectedCategoryFilter === 'ALL' && (
                  <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                    <CheckmarkCircle02Icon className="w-2.5 h-2.5 text-white" />
                  </div>
                )}
              </div>
            </button>
            
            {availableCategories.map((category) => {
              const isSelected = selectedCategoryFilter === category.id;
              
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategoryFilter(category.id)}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-slate-900 bg-slate-50' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Tag01Icon className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{category.name}</p>
                    </div>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                        <CheckmarkCircle02Icon className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Nivel de Stock */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-30">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <PackageIcon className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-slate-900">Nivel de Stock</p>
              <p className="text-xs text-slate-500">Filtra por disponibilidad</p>
            </div>
          </div>
          
          <div className="space-y-2">
            {stockOptions.map((option) => {
              const isSelected = selectedStockFilter === option.value;
              
              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStockFilter(option.value)}
                  className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                    isSelected 
                      ? 'border-slate-900 bg-slate-50' 
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${option.color}`}>
                      <PackageIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900">{option.label}</p>
                      <p className="text-xs text-slate-500">{option.description}</p>
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
  );
}