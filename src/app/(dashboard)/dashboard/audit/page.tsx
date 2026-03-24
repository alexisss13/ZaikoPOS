'use client';

import useSWR from 'swr';
import { useState } from 'react';
import { 
  ShieldCheck, AlertTriangle, Info, XCircle, ChevronLeft, ChevronRight, Filter, Building, Clock, Calendar, Bug, Search, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface AuditLog {
  id: string;
  action: string;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
  business: { name: string };
  user?: { name: string | null; email: string | null; role: string } | null;
}

interface AuditResponse {
  data: AuditLog[];
  pagination: { total: number; page: number; totalPages: number };
}

const ACTION_LABELS: Record<string, string> = {
  SYSTEM_ERROR: 'Error del Sistema',
  DELETE_USER: 'Usuario Eliminado',
  VOID_SALE: 'Venta Anulada',
  LOGIN: 'Inicio de Sesión',
  LOGOUT: 'Cierre de Sesión',
  CREATE_USER: 'Usuario Creado',
};

const SEVERITY_CONFIG: Record<string, { color: string; icon: React.ElementType; bg: string; badge: string }> = {
  SYSTEM_ERROR: { color: 'text-red-600', bg: 'bg-red-50', badge: 'border-red-200 bg-red-100/50', icon: XCircle },
  DELETE_USER: { color: 'text-red-600', bg: 'bg-red-50', badge: 'border-red-200 bg-red-100/50', icon: XCircle },
  VOID_SALE: { color: 'text-orange-600', bg: 'bg-orange-50', badge: 'border-orange-200 bg-orange-100/50', icon: AlertTriangle },
  LOGIN: { color: 'text-blue-600', bg: 'bg-blue-50', badge: 'border-blue-200 bg-blue-100/50', icon: Info },
  LOGOUT: { color: 'text-slate-500', bg: 'bg-slate-100', badge: 'border-slate-200 bg-slate-100/50', icon: Clock },
  CREATE_USER: { color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'border-emerald-200 bg-emerald-100/50', icon: ShieldCheck },
};

export default function AuditLogsPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [businessFilter, setBusinessFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState(''); 
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { data: businesses } = useSWR<{id: string, name: string}[]>('/api/businesses', fetcher);
  
  const apiUrl = `/api/audit?page=${currentPage}&limit=15&severity=${severityFilter}&businessId=${businessFilter}${startDate ? `&startDate=${startDate}` : ''}${endDate ? `&endDate=${endDate}` : ''}`;
  const { data: auditRes, isLoading, mutate } = useSWR<AuditResponse>(apiUrl, fetcher, { keepPreviousData: true });

  const displayedLogs = auditRes?.data.filter(log => {
    if (!searchQuery) return true;
    const lowerQuery = searchQuery.toLowerCase();
    return log.details?.toLowerCase().includes(lowerQuery) || 
           log.user?.name?.toLowerCase().includes(lowerQuery) ||
           log.user?.email?.toLowerCase().includes(lowerQuery);
  }) || [];

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    return {
      date: new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(d),
      time: new Intl.DateTimeFormat('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).format(d)
    };
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await mutate();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const handleGenerateTestLogs = async () => {
    if (!businesses || businesses.length === 0) {
      return toast.error('Necesitas tener al menos 1 cliente (negocio) creado para generar logs.');
    }
    
    const testBusinessId = businesses[0].id;
    const mockLogs = [
      { action: 'SYSTEM_ERROR', details: 'Fallo de conexión simulado con SUNAT. Error código 502.', businessId: testBusinessId },
      { action: 'VOID_SALE', details: 'El cajero solicitó anular la boleta B001-00042 por error de digitación.', businessId: testBusinessId },
      { action: 'CREATE_USER', details: 'Se ha registrado un nuevo Jefe de Tienda para la sucursal Norte.', businessId: testBusinessId },
    ];

    toast.loading('Generando logs de prueba...');
    for (const log of mockLogs) {
      await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(log) });
    }
    toast.success('Logs generados correctamente');
    mutate(); 
  };

  const clearFilters = () => {
    setStartDate(''); setEndDate(''); setSeverityFilter('ALL'); setBusinessFilter('ALL'); setSearchQuery(''); setCurrentPage(1);
  };

  return (
    <div className="space-y-6 pb-20 max-w-7xl mx-auto w-full">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" /> Auditoría de Seguridad
          </h1>
          <p className="text-slate-500 text-sm mt-1">Registro centralizado de eventos y acciones críticas del sistema.</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button onClick={handleRefresh} variant="outline" className="w-10 px-0 shrink-0 text-slate-600 bg-white" title="Actualizar datos">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-primary' : ''}`} />
          </Button>
          <Button onClick={handleGenerateTestLogs} variant="outline" className="gap-2 text-indigo-600 border-indigo-200 bg-indigo-50 hover:bg-indigo-100 flex-1 md:flex-none">
            <Bug className="w-4 h-4" /> Simular Evento
          </Button>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar en el detalle o usuario..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-slate-50 w-full"
            />
          </div>
          <Select value={businessFilter} onValueChange={(v) => { setBusinessFilter(v); setCurrentPage(1); }}>
            <SelectTrigger className="w-full lg:w-[280px] bg-slate-50 shrink-0">
              <Building className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Negocio" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos los negocios</SelectItem>
              {businesses?.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* 🚀 RESPONSIVE PERFECTO PARA FECHAS Y SEVERIDAD */}
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-2 sm:gap-3 items-center w-full lg:w-auto">
            <div className="relative w-full lg:w-[160px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} className="pl-9 bg-slate-50 text-sm w-full" title="Desde"/>
            </div>
            <span className="hidden sm:block text-slate-400 text-sm font-medium">a</span>
            <div className="relative w-full lg:w-[160px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} className="pl-9 bg-slate-50 text-sm w-full" title="Hasta"/>
            </div>
          </div>

          <div className="w-full lg:w-auto overflow-x-auto hide-scrollbar flex gap-2 lg:ml-auto pb-1 lg:pb-0">
             <Button variant={severityFilter === 'ALL' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 text-xs shrink-0" onClick={() => {setSeverityFilter('ALL'); setCurrentPage(1)}}>Todas</Button>
             <Button variant={severityFilter === 'CRITICAL' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 text-xs shrink-0 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => {setSeverityFilter('CRITICAL'); setCurrentPage(1)}}>Críticos</Button>
             <Button variant={severityFilter === 'WARNING' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 text-xs shrink-0 border-orange-200 hover:bg-orange-50 hover:text-orange-700" onClick={() => {setSeverityFilter('WARNING'); setCurrentPage(1)}}>Advertencias</Button>
             <Button variant={severityFilter === 'INFO' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 text-xs shrink-0 border-blue-200 hover:bg-blue-50 hover:text-blue-700" onClick={() => {setSeverityFilter('INFO'); setCurrentPage(1)}}>Info</Button>
          </div>
        </div>
      </div>

      {/* LISTA DE REGISTROS */}
      <Card className="border shadow-sm overflow-hidden bg-white">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50/80 border-b text-xs font-bold text-slate-500 uppercase tracking-wider">
          <div className="col-span-3 lg:col-span-2">Fecha / Hora</div>
          <div className="col-span-3 lg:col-span-2">Evento</div>
          <div className="col-span-4 lg:col-span-5">Detalle</div>
          <div className="col-span-2 lg:col-span-3 text-right">Usuario / Origen</div>
        </div>

        <div className="divide-y divide-slate-100">
          {isLoading && !auditRes?.data ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="px-6 py-4 flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="space-y-2 w-full"><Skeleton className="h-4 w-1/4" /><Skeleton className="h-3 w-1/2" /></div>
              </div>
            ))
          ) : displayedLogs.length === 0 ? (
            <div className="text-center py-20 px-4">
              <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">No se encontraron eventos.</p>
              <Button variant="link" onClick={clearFilters} className="mt-2 text-primary">Limpiar todos los filtros</Button>
            </div>
          ) : (
            displayedLogs.map((log) => {
              const config = SEVERITY_CONFIG[log.action] || { color: 'text-slate-500', bg: 'bg-slate-100', badge: 'border-slate-200', icon: Info };
              const Icon = config.icon;
              const { date, time } = formatDate(log.createdAt);

              return (
                <div key={log.id} className="p-4 md:px-6 hover:bg-slate-50/50 transition-colors flex flex-col md:grid md:grid-cols-12 gap-3 md:gap-4 md:items-center">
                  
                  <div className="flex justify-between items-start md:hidden mb-2">
                    <Badge variant="outline" className={`text-[10px] uppercase font-bold border ${config.badge} ${config.color}`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                    <div className="text-right">
                      <p className="text-xs font-bold text-slate-700">{date}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{time}</p>
                    </div>
                  </div>

                  <div className="hidden md:block col-span-3 lg:col-span-2">
                    <p className="text-sm font-bold text-slate-700">{date}</p>
                    <p className="text-xs text-slate-400 font-mono">{time}</p>
                  </div>

                  <div className="hidden md:flex col-span-3 lg:col-span-2 items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <Badge variant="outline" className={`text-[10px] border ${config.badge} ${config.color} leading-tight`}>
                      {ACTION_LABELS[log.action] || log.action}
                    </Badge>
                  </div>

                  <div className="col-span-1 md:col-span-4 lg:col-span-5">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0 h-4 bg-slate-100 text-slate-500">
                        {log.business?.name || 'Sistema'}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-600 leading-snug">{log.details}</p>
                  </div>

                  <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-0 border-slate-100">
                    <div className="flex items-center gap-2 md:justify-end">
                      <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {log.user?.name ? log.user.name.charAt(0).toUpperCase() : 'S'}
                      </div>
                      <div className="text-left md:text-right">
                        <p className="text-xs font-bold text-slate-700 truncate max-w-[120px]">{log.user?.name || 'Automático'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{log.user?.role || 'SYSTEM'}</p>
                      </div>
                    </div>
                    {log.ipAddress && (
                      <p className="text-[10px] font-mono text-slate-400 mt-1">IP: {log.ipAddress}</p>
                    )}
                  </div>

                </div>
              );
            })
          )}
        </div>
      </Card>

      {auditRes?.pagination && auditRes.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border shadow-sm">
          <p className="text-sm text-slate-500">Página <span className="font-bold text-slate-900">{auditRes.pagination.page}</span> de <span className="font-bold text-slate-900">{auditRes.pagination.totalPages}</span></p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={auditRes.pagination.page === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(auditRes.pagination.totalPages, p + 1))} disabled={auditRes.pagination.page === auditRes.pagination.totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}
    </div>
  );
}