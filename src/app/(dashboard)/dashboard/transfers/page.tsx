'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { 
  ArrowRightLeft, Check, X, Clock, Package, Search, ChevronLeft, ChevronRight, LayoutGrid, CheckCircle2, XCircle, Store
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Transfer {
  id: string;
  quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  fromBranchId: string;
  toBranchId: string;
  product: { title: string; images: string[] };
  fromBranch: { name: string };
  toBranch: { name: string };
  requestedBy: { name: string };
}

const ITEMS_PER_PAGE = 10;

export default function TransfersPage() {
  const { user, role } = useAuth();
  
  const { data: transfers, isLoading, mutate } = useSWR<Transfer[]>(
    user ? `/api/stock-transfers?branchId=${user.branchId}&role=${role}` : null, 
    fetcher
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredTransfers = useMemo(() => {
    if (!transfers) return [];
    return transfers.filter(t => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        t.product.title.toLowerCase().includes(searchLower) || 
        t.fromBranch.name.toLowerCase().includes(searchLower) || 
        t.toBranch.name.toLowerCase().includes(searchLower) ||
        t.requestedBy.name.toLowerCase().includes(searchLower);

      const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [transfers, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredTransfers.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransfers = filteredTransfers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleProcess = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`¿Estás seguro de ${status === 'APPROVED' ? 'APROBAR' : 'RECHAZAR'} este traslado?`)) return;

    try {
      const res = await fetch(`/api/stock-transfers/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      if (!res.ok) throw new Error();
      
      toast.success(status === 'APPROVED' ? 'Traslado Aprobado y Stock actualizado' : 'Traslado Rechazado');
      mutate();
    } catch {
      toast.error('Error al procesar el traslado');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': 
        return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-none shadow-none text-[9px] px-2 py-0.5"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      case 'APPROVED': 
        return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-none shadow-none text-[9px] px-2 py-0.5"><CheckCircle2 className="w-3 h-3 mr-1" /> Aprobado</Badge>;
      case 'REJECTED': 
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-none shadow-none text-[9px] px-2 py-0.5"><XCircle className="w-3 h-3 mr-1" /> Rechazado</Badge>;
      default: 
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* 🚀 TOOLBAR SUPERIOR ULTRA-LIMPIA Y ELEGANTE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        
        <h1 className="text-[26px] font-black text-slate-900 tracking-tight shrink-0">Traslados</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* BUSCADOR ANIMADO EXPANDIBLE */}
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              placeholder="Buscar producto, sucursal..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>
        </div>
      </div>

      {/* 🚀 CONTENEDOR DE LA TABLA */}
      <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* 🚀 SUBHEADER: TABS (Filtro por Estados) Y PAGINACIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 w-full bg-white shrink-0">
          
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button 
              onClick={() => {setStatusFilter('ALL'); setCurrentPage(1);}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${statusFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Todos
            </button>
            
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

            <button 
              onClick={() => {setStatusFilter('PENDING'); setCurrentPage(1);}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${statusFilter === 'PENDING' ? 'bg-amber-100 text-amber-800 shadow-sm' : 'text-slate-500 hover:text-amber-700 hover:bg-amber-50'}`}
            >
              <Clock className="w-3.5 h-3.5" /> Pendientes
            </button>
            <button 
              onClick={() => {setStatusFilter('APPROVED'); setCurrentPage(1);}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${statusFilter === 'APPROVED' ? 'bg-emerald-100 text-emerald-800 shadow-sm' : 'text-slate-500 hover:text-emerald-700 hover:bg-emerald-50'}`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Aprobados
            </button>
            <button 
              onClick={() => {setStatusFilter('REJECTED'); setCurrentPage(1);}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${statusFilter === 'REJECTED' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-slate-500 hover:text-red-700 hover:bg-red-50'}`}
            >
              <XCircle className="w-3.5 h-3.5" /> Rechazados
            </button>
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                Pág {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 🚀 TABLA PRINCIPAL (FLAT DESIGN) */}
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Producto y Cantidad</th>
                <th className="px-5 py-3.5 font-semibold">Ruta de Traslado</th>
                <th className="px-5 py-3.5 font-semibold">Solicitante</th>
                <th className="px-5 py-3.5 font-semibold">Estado</th>
                <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>
                ))
              ) : paginatedTransfers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <ArrowRightLeft className="w-10 h-10 text-slate-200" strokeWidth={1} />
                      <p className="font-medium text-sm text-slate-500">No se encontraron solicitudes de traslado.</p>
                      <Button variant="link" className="text-xs h-6 text-slate-500 hover:text-slate-900" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }}>Limpiar filtros</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransfers.map((t) => {
                  const canApprove = t.status === 'PENDING' && (t.fromBranchId === user?.branchId || role === 'SUPER_ADMIN' || role === 'OWNER');

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors group text-xs">
                      
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                            {t.product.images?.[0] ? <img src={t.product.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300" />}
                          </div>
                          <div className="min-w-0 flex flex-col justify-center">
                            <p className="font-bold text-slate-800 truncate leading-tight text-sm group-hover:text-slate-900 transition-colors">{t.product.title}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-600 border border-slate-200 px-1.5 py-0 h-4 shadow-none">
                                {t.quantity} UNIDADES
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-end">
                            <span className="text-[10px] font-medium text-slate-400 leading-none">Origen</span>
                            <span className="font-bold text-slate-700 leading-tight">{t.fromBranch.name}</span>
                          </div>
                          <ArrowRightLeft className="w-4 h-4 text-slate-300 shrink-0" />
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] font-medium text-slate-400 leading-none">Destino</span>
                            <span className="font-bold text-slate-900 leading-tight">{t.toBranch.name}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-0.5">
                          <p className="text-slate-800 font-bold leading-tight">{t.requestedBy.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium leading-none">{new Date(t.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </td>

                      <td className="px-5 py-3">
                        {getStatusBadge(t.status)}
                      </td>

                      <td className="px-5 py-3 text-right">
                        {canApprove ? (
                          <div className="flex items-center justify-end gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 text-xs text-red-600 border-red-200 bg-red-50 hover:bg-red-100 hover:text-red-700 shadow-none font-bold" 
                              onClick={() => handleProcess(t.id, 'REJECTED')}
                            >
                              <X className="w-3.5 h-3.5 mr-1" /> Rechazar
                            </Button>
                            <Button 
                              size="sm" 
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm font-bold" 
                              onClick={() => handleProcess(t.id, 'APPROVED')}
                            >
                              <Check className="w-3.5 h-3.5 mr-1" /> Aprobar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic block text-right pr-2">
                            {t.status === 'PENDING' ? 'Esperando...' : 'Completado'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
}