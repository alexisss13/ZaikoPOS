// src/components/pos/PosHeader.tsx
'use client';

import { useState } from 'react';
import { Search, WifiOff, RefreshCw, AlertTriangle, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CloseCashDialog } from './CloseCashDialog'; 

interface PosHeaderProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  isOfflineMode: boolean;
  isValidating: boolean;
  conflictsCount: number;
}

export function PosHeader({ 
  searchTerm, 
  setSearchTerm, 
  isOfflineMode, 
  isValidating, 
  conflictsCount 
}: PosHeaderProps) {
  // 🚀 ESTADO QUE CONTROLA EL MODAL
  const [isCloseCashOpen, setIsCloseCashOpen] = useState(false);

  return (
    <div className="p-4 bg-white border-b border-slate-100 space-y-3 shrink-0 z-10 relative">
      
      {/* Alerta de Conflictos */}
      {conflictsCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2 shadow-sm">
          <div className="flex items-center gap-2 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>{conflictsCount} ventas no sincronizadas (Stock).</span>
          </div>
        </div>
      )}

      <div className="flex gap-4 items-center justify-between">
        
        {/* Buscador */}
        <div className="relative flex-1 max-w-md group transition-all">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-slate-900 transition-colors" />
          <Input 
            placeholder="Buscar producto (nombre, código, SKU)..." 
            className={`pl-10 h-10 rounded-xl transition-all shadow-sm ${isOfflineMode ? 'border-amber-300 ring-amber-300 bg-amber-50/20' : 'bg-slate-50 border-slate-200 focus-visible:ring-slate-300 focus-visible:bg-white'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Indicadores de Estado y Acciones */}
        <div className="flex items-center gap-3">
            {isOfflineMode ? (
              <div className="hidden md:flex items-center gap-1.5 text-amber-700 text-xs font-bold px-3 py-2 bg-amber-50 rounded-xl border border-amber-200 shadow-sm">
                  <WifiOff className="w-3.5 h-3.5" />
                  <span>Modo Offline</span>
              </div>
            ) : isValidating ? (
              <div className="hidden md:flex items-center gap-1.5 text-blue-700 text-xs font-bold px-3 py-2 bg-blue-50 rounded-xl border border-blue-100 shadow-sm">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Sync Stock</span>
              </div>
            ) : null}

            {/* 🚀 BOTÓN QUE ABRE EL MODAL */}
            <Button 
              variant="destructive" 
              className="gap-2 h-10 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 shadow-sm active:scale-95 transition-all"
              onClick={() => setIsCloseCashOpen(true)}
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Cerrar Caja</span>
            </Button>
            
            {/* 🚀 MODAL AHORA RECIBE SUS PROPS */}
            <CloseCashDialog 
              isOpen={isCloseCashOpen} 
              onOpenChange={setIsCloseCashOpen} 
            />
        </div>
      </div>
    </div>
  );
}