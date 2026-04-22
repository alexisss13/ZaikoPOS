'use client';

import { memo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LayoutGrid, Globe, Store, PowerOff, X } from 'lucide-react';

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

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl px-0 pb-6 max-h-[85vh] overflow-y-auto"
      >
        <SheetHeader className="px-5 pt-3 pb-0">
          <div className="flex justify-center pb-2">
            <div className="w-10 h-1 rounded-full bg-slate-200" />
          </div>
          <SheetTitle className="text-xl font-black text-slate-900 text-left">Filtros</SheetTitle>
        </SheetHeader>
        
        <div className="px-5 pt-4 space-y-5">
          {/* Filtros de Sucursal */}
          {visibleCodes.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Catálogo</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleCodeFilter('ALL')}
                  disabled={disabled}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform ${
                    codeFilter === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <LayoutGrid className="w-3 h-3" />
                  Todos
                </button>
                
                <button
                  onClick={() => handleCodeFilter('GENERAL')}
                  disabled={disabled}
                  className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform ${
                    codeFilter === 'GENERAL'
                      ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Globe className="w-3 h-3" />
                  Compartidos
                </button>

                {visibleCodes.map(code => {
                  const branch = getBranchByCode(code);
                  return (
                    <button
                      key={code}
                      onClick={() => handleCodeFilter(code)}
                      disabled={disabled}
                      className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform truncate ${
                        codeFilter === code
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {branch?.logoUrl ? (
                        <img src={branch.logoUrl} className="w-3 h-3 rounded-sm object-cover" alt="" />
                      ) : (
                        <Store className="w-3 h-3" />
                      )}
                      {branch?.name || code}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filtros de Categoría */}
          {categories.length > 0 && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Categoría</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleCategoryFilter('ALL')}
                  disabled={disabled}
                  className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform ${
                    selectedCategory === 'ALL'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                      : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  Todas
                </button>
                
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryFilter(cat.id)}
                    disabled={disabled}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform truncate ${
                      selectedCategory === cat.id
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            {(codeFilter !== 'ALL' || selectedCategory !== 'ALL') && (
              <button
                onClick={clearAllFilters}
                disabled={disabled}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 active:scale-95 transition-transform"
              >
                Limpiar
              </button>
            )}
            <button
              onClick={() => { haptic(8); onClose(); }}
              disabled={disabled}
              className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold active:scale-95 transition-transform"
            >
              Aplicar
            </button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export const MobilePOSFilters = memo(MobilePOSFiltersComponent);