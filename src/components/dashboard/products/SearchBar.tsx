'use client';

import { memo, useState, useEffect, useCallback } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  onSearchChange: (value: string) => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  inputClassName?: string;
}

function SearchBarComponent({ 
  onSearchChange, 
  placeholder = "Buscar...",
  debounceMs = 200,
  className = "",
  inputClassName = ""
}: SearchBarProps) {
  // ⚡ Estado LOCAL - no causa re-renders del padre
  const [localValue, setLocalValue] = useState('');

  // Debounce interno - solo notifica al padre cuando el usuario deja de escribir
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localValue);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [localValue, debounceMs, onSearchChange]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const handleClear = useCallback(() => {
    setLocalValue('');
    onSearchChange('');
  }, [onSearchChange]);

  return (
    <div className={`relative ${className}`}>
      {!className.includes('absolute') && (
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      )}
      <Input
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        className={inputClassName || "pl-10 pr-9 h-10 bg-white border-slate-200 rounded-xl text-sm shadow-sm"}
      />
      {localValue && !className.includes('absolute') && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-slate-100"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
        </button>
      )}
    </div>
  );
}

// Memo para evitar re-renders innecesarios
export const SearchBar = memo(SearchBarComponent);
