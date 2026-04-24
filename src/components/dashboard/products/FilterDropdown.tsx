// src/components/dashboard/products/FilterDropdown.tsx
'use client';

import { memo, useState, useCallback } from 'react';
import { FilterIcon, Tick01Icon } from 'hugeicons-react';

interface FilterOption {
  id: string;
  name: string;
}

interface FilterDropdownProps {
  label: string;
  currentValue: string;
  options: FilterOption[];
  onSelect: (value: string) => void;
  allLabel?: string;
  width?: string;
}

function FilterDropdownComponent({
  label,
  currentValue,
  options,
  onSelect,
  allLabel = 'Todas',
  width = 'w-[220px]',
}: FilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = useCallback((value: string) => {
    onSelect(value);
    setIsOpen(false);
  }, [onSelect]);

  const handleToggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <>
      {isOpen && <div className="fixed inset-0 z-20" onClick={handleClose} />}
      <div className="relative">
        <div 
          className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${currentValue !== 'ALL' || isOpen ? 'text-slate-900 bg-slate-100' : ''}`}
          onClick={handleToggle}
        >
          {label} <FilterIcon className={`w-3.5 h-3.5 ${currentValue !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
        </div>
        {isOpen && (
          <div className={`absolute top-10 left-3 ${width} bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar`}>
            <button 
              onClick={() => handleSelect('ALL')} 
              className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${currentValue === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {allLabel} {currentValue === 'ALL' && <Tick01Icon className="w-3.5 h-3.5" />}
            </button>
            {options.length > 0 && <div className="h-px bg-slate-100 my-1 mx-2" />}
            {options.length === 0 && <div className="px-3 py-2 text-xs text-slate-400 text-center italic">Sin opciones</div>}
            {options.map(option => (
              <button 
                key={option.id} 
                onClick={() => handleSelect(option.id)} 
                className={`text-left px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors flex items-center justify-between ${currentValue === option.id ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                <span className="truncate pr-2">{option.name}</span>
                {currentValue === option.id && <Tick01Icon className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

// Memoizar para evitar re-renders innecesarios
const areEqual = (prevProps: FilterDropdownProps, nextProps: FilterDropdownProps) => {
  if (prevProps.currentValue !== nextProps.currentValue) return false;
  if (prevProps.options.length !== nextProps.options.length) return false;
  if (prevProps.label !== nextProps.label) return false;
  return true;
};

export const FilterDropdown = memo(FilterDropdownComponent, areEqual);
