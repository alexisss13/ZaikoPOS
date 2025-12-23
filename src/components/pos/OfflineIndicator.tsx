'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Wifi, WifiOff, RefreshCw, CloudUpload } from 'lucide-react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  onSync: () => void;
}

export function OfflineIndicator({ 
  isOnline, 
  isSyncing, 
  pendingCount, 
  onSync 
}: OfflineIndicatorProps) {
  
  if (isSyncing) {
    return (
      <Badge variant="outline" className="gap-2 bg-blue-50 text-blue-700 border-blue-200 animate-pulse">
        <RefreshCw className="h-3 w-3 animate-spin" />
        <span>Sincronizando {pendingCount}...</span>
      </Badge>
    );
  }

  if (!isOnline) {
    return (
      <Badge variant="destructive" className="gap-2">
        <WifiOff className="h-3 w-3" />
        <span>Sin Conexión ({pendingCount} pendientes)</span>
      </Badge>
    );
  }

  if (pendingCount > 0) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        className="h-6 gap-2 text-xs border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100"
        onClick={onSync}
      >
        <CloudUpload className="h-3 w-3" />
        <span>{pendingCount} pendientes (Click para subir)</span>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground/50">
      <Wifi className="h-3 w-3" />
      <span>Conectado</span>
    </div>
  );
}