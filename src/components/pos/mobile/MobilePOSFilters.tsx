'use client';

import { memo } from 'react';
import { createPortal } from 'react-dom';
import { 
  ArrowLeft01Icon, 
  DashboardSquare01Icon, 
  Globe02Icon, 
  Store01Icon, 
  Tag01Icon,
  CheckmarkCircle02Icon,
  FilterIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';

interface Branch {
  id: string;
  name: string;
  ecommerceCode: string | null;
  logoUrl?: string | null;
}

interface Category {
  id: string;
  name: string;
}

interface MobilePOSFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  
  // Filtros de sucursal
  codeFilter: string;
  onCodeFilterChange: (code: string) => void;
  visibleCodes: string[];
  getBranchByCode: (code: string) => Branch | undefined;
  
  // Filtros de categoría
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
  
  disabled?: boolean;
}

function MobilePOSFiltersComponent({
  isOpen,
  onClose,
  codeFilter,
  onCodeFilterChange,
  visibleCodes,
  getBranchByCode,
  categories,
  selectedCategory,
  onCategoryChange,
  disabled = false,
}: MobilePOSFiltersProps) {
  
  const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };

  const handleCodeFilter = (code: string) => {
    haptic(8);
    onCodeFilterChange(code);
    onCategoryChange('ALL'); // Reset categoría al cambiar sucursal
  };

  const handleCategoryFilter = (categoryId: string) => {
    haptic(8);
    onCategoryChange(categoryId);
  };

  const clearAllFilters = () => {
    haptic(15);
    onCodeFilterChange('ALL');
    onCategoryChange('ALL');
  };

  const hasActiveFilters = codeFilter !== 'ALL' || selectedCategory !== 'ALL';

  if (!isOpen) return null;

  // Construir opciones de catálogo
  const catalogOptions = [
    { value: 'ALL', label: 'Todos', icon: <DashboardSquare01Icon className="w-5 h-5" /> },
    { value: 'GENERAL', label: 'Compartidos', icon: <Globe02Icon className="w-5 h-5" /> },
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
  ];

  return createPortal(
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={() => { haptic(8); onClose(); }}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">Filtros</h2>
          <p className="text-xs text-slate-500">Personaliza tu búsqueda</p>
        </div>
        <Button
          onClick={() => { haptic(8); onClose(); }}
          className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4"
        >
          Aplicar
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Catálogo */}
        {visibleCodes.length > 0 && (
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
                const isSelected = codeFilter === option.value;
                
                return (
                  <button
                    key={option.value}
                    onClick={() => handleCodeFilter(option.value)}
                    disabled={disabled}
                    className={`p-3 rounded-xl border-2 transition-all text-left active:scale-95 disabled:opacity-30 ${
                      isSelected 
                        ? 'border-slate-900 bg-slate-50' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate">{option.label}</p>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                          <CheckmarkCircle02Icon className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Categorías */}
        {categories.length > 0 && (
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
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => handleCategoryFilter('ALL')}
                disabled={disabled}
                className={`w-full p-3 rounded-xl border-2 transition-all text-left active:scale-95 disabled:opacity-30 ${
                  selectedCategory === 'ALL'
                    ? 'border-slate-900 bg-slate-50' 
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                    <Tag01Icon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-900">Todas las categorías</p>
                  </div>
                  {selectedCategory === 'ALL' && (
                    <div className="w-4 h-4 rounded-full bg-slate-900 flex items-center justify-center">
                      <CheckmarkCircle02Icon className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              </button>
              
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                
                return (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryFilter(cat.id)}
                    disabled={disabled}
                    className={`w-full p-3 rounded-xl border-2 transition-all text-left active:scale-95 disabled:opacity-30 ${
                      isSelected 
                        ? 'border-slate-900 bg-slate-50' 
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Tag01Icon className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-slate-900">{cat.name}</p>
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
        )}

        {/* Botón Limpiar filtros */}
        {hasActiveFilters && (
          <div className="pb-20">
            <button
              onClick={clearAllFilters}
              disabled={disabled}
              className="w-full py-3.5 rounded-xl border-2 border-red-200 bg-red-50 text-red-600 text-sm font-bold active:scale-[0.98] transition-transform disabled:opacity-30"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              Limpiar todos los filtros
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

export const MobilePOSFilters = memo(MobilePOSFiltersComponent);