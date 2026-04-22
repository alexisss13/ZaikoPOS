'use client';

import { memo } from 'react';
import { X } from 'lucide-react';

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

interface MobilePOSActiveFiltersProps {
  codeFilter: string;
  selectedCategory: string;
  getBranchByCode: (code: string) => Branch | undefined;
  categories: Category[];
  onClearCodeFilter: () => void;
  onClearCategoryFilter: () => void;
}

function MobilePOSActiveFiltersComponent({
  codeFilter,
  selectedCategory,
  getBranchByCode,
  categories,
  onClearCodeFilter,
  onClearCategoryFilter,
}: MobilePOSActiveFiltersProps) {
  
  const hasActiveFilters = codeFilter !== 'ALL' || selectedCategory !== 'ALL';
  
  if (!hasActiveFilters) return null;

  const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };

  return (
    <div className="flex gap-1.5 flex-wrap px-4 pb-2">
      {codeFilter !== 'ALL' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-full">
          {codeFilter === 'GENERAL' 
            ? 'Compartidos' 
            : getBranchByCode(codeFilter)?.name || codeFilter
          }
          <button 
            onClick={() => { haptic(8); onClearCodeFilter(); }}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}
      
      {selectedCategory !== 'ALL' && (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white text-xs font-semibold rounded-full">
          {categories.find(c => c.id === selectedCategory)?.name || 'Categoría'}
          <button 
            onClick={() => { haptic(8); onClearCategoryFilter(); }}
            className="hover:bg-white/20 rounded-full p-0.5 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      )}
    </div>
  );
}

export const MobilePOSActiveFilters = memo(MobilePOSActiveFiltersComponent);