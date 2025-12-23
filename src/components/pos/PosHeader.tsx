'use client';

import { Search, WifiOff, RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { AlertTriangle } from 'lucide-react';
import { CloseCashDialog } from './CloseCashDialog'; // Importamos el nuevo componente

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
  return (
    <div className="p-4 bg-white border-b space-y-3 shrink-0">
      {/* Alerta de Conflictos */}
      {conflictsCount > 0 && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md flex items-center justify-between text-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            <span>{conflictsCount} ventas no sincronizadas (Stock).</span>
          </div>
        </div>
      )}

      <div className="flex gap-3 items-center justify-between">
        {/* Buscador */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Buscar producto (nombre o código)..." 
            className={`pl-9 ${isOfflineMode ? 'border-amber-300 ring-amber-300 bg-amber-50/20' : ''}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Indicadores de Estado */}
        <div className="flex items-center gap-3">
            {isOfflineMode ? (
            <div className="hidden md:flex items-center gap-1 text-amber-600 text-xs font-medium px-3 py-2 bg-amber-50 rounded-full border border-amber-200">
                <WifiOff className="w-3 h-3" />
                <span>Modo Offline</span>
            </div>
            ) : isValidating ? (
            <div className="hidden md:flex items-center gap-1 text-blue-600 text-xs font-medium px-3 py-2 bg-blue-50 rounded-full">
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Sync Stock</span>
            </div>
            ) : null}

            {/* BOTÓN DE CIERRE DE CAJA */}
            <CloseCashDialog />
        </div>
      </div>
    </div>
  );
}