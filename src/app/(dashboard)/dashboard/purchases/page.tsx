'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { 
  Plus, Search, ChevronLeft, ChevronRight, LayoutGrid, 
  Package, Calendar, DollarSign, User, CheckCircle, Clock, XCircle, Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { PurchaseModal } from '@/components/dashboard/PurchaseModal';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PurchaseOrder {
  id: string;
  orderDate: string;
  receivedDate: string | null;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  notes: string | null;
  supplier: {
    name: string;
  } | null;
  createdBy: {
    name: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    cost: number;
    variant: {
      name: string;
      product: {
        title: string;
      };
    };
    uom: {
      name: string;
      abbreviation: string;
    } | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

const ITEMS_PER_PAGE = 12;

const statusConfig = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
  RECEIVED: { label: 'Recibida', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
};

export default function PurchasesPage() {
  const { role } = useAuth();
  const canManage = role === 'OWNER' || role === 'MANAGER';

  const { data: purchases, isLoading, mutate } = useSWR<PurchaseOrder[]>('/api/purchases', fetcher);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RECEIVED' | 'CANCELLED'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    
    return purchases.filter(purchase => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        purchase.supplier?.name.toLowerCase().includes(searchLower) ||
        purchase.items.some(item => 
          item.variant.product.title.toLowerCase().includes(searchLower)
        );

      const matchesStatus = statusFilter === 'ALL' || purchase.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [purchases, searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE) || 1;
  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <h1 className="text-[26px] font-black text-slate-900 tracking-tight shrink-0">Órdenes de Compra</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* BUSCADOR ANIMADO */}
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              placeholder="Buscar por proveedor o producto..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>

          {canManage && (
            <>
              <Button 
                onClick={() => window.location.href = '/dashboard/suppliers'}
                variant="outline"
                className="h-10 text-sm bg-white hover:bg-slate-50 text-slate-700 px-5 shadow-sm rounded-full transition-all shrink-0 border-slate-200"
              >
                <Users className="w-4 h-4 mr-1.5" /> <span className="font-bold">Proveedores</span>
              </Button>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" /> <span className="font-bold">Nueva Orden</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* SUBHEADER: TABS Y PAGINACIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 w-full bg-white shrink-0">
          
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            {(['ALL', 'PENDING', 'RECEIVED', 'CANCELLED'] as const).map((status) => (
              <button 
                key={status} 
                onClick={() => {setStatusFilter(status); setCurrentPage(1)}}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  statusFilter === status 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL' && <><LayoutGrid className="w-3.5 h-3.5" /> Todas</>}
                {status === 'PENDING' && <><Clock className="w-3.5 h-3.5" /> Pendientes</>}
                {status === 'RECEIVED' && <><CheckCircle className="w-3.5 h-3.5" /> Recibidas</>}
                {status === 'CANCELLED' && <><XCircle className="w-3.5 h-3.5" /> Canceladas</>}
              </button>
            ))}
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

        {/* GRID DE TARJETAS */}
        <div className="flex-1 p-4 bg-slate-50/50 overflow-y-auto custom-scrollbar">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-52 w-full rounded-2xl bg-white border border-slate-200 shadow-sm" />)}
            </div>
          ) : paginatedPurchases.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm py-20 mt-4">
              <Package className="w-12 h-12 text-slate-300 mb-3" />
              <p className="font-medium text-sm text-slate-500">No se encontraron órdenes de compra.</p>
              <Button variant="link" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }} className="text-blue-600 font-bold">Limpiar filtros</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedPurchases.map((purchase: PurchaseOrder) => {
                const statusInfo = statusConfig[purchase.status];
                const StatusIcon = statusInfo.icon;

                return (
                  <div 
                    key={purchase.id} 
                    className="group relative bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex flex-col overflow-hidden animate-in fade-in zoom-in-95"
                  >
                    
                    <div className="p-4 flex flex-col flex-1">
                      
                      {/* HEADER */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-slate-900 leading-tight truncate group-hover:text-emerald-600 transition-colors">
                            {purchase.supplier?.name || 'Sin proveedor'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className={`text-[9px] font-bold px-2 py-0 h-4 shadow-none border ${statusInfo.color}`}>
                              <StatusIcon className="w-2.5 h-2.5 mr-1" />
                              {statusInfo.label}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* INFO */}
                      <div className="space-y-2 text-slate-500 flex-1 mt-2">
                        <div className="flex items-center gap-2 text-xs">
                          <Calendar className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <div className="flex flex-col">
                            <span className="font-medium">{new Date(purchase.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                            <span className="text-[10px] text-slate-400">Creada</span>
                          </div>
                        </div>
                        {purchase.receivedDate && (
                          <div className="flex items-center gap-2 text-xs">
                            <CheckCircle className="w-3.5 h-3.5 shrink-0 opacity-70 text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-medium">{new Date(purchase.receivedDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                              <span className="text-[10px] text-slate-400">Recibida</span>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs">
                          <Package className="w-3.5 h-3.5 shrink-0 opacity-70" />
                          <span className="font-medium">{purchase.items.length} producto(s)</span>
                        </div>
                        {purchase.createdBy && (
                          <div className="flex items-center gap-2 text-xs">
                            <User className="w-3.5 h-3.5 shrink-0 opacity-70" />
                            <span className="font-medium truncate">{purchase.createdBy.name}</span>
                          </div>
                        )}
                      </div>

                      {/* FOOTER */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-4 h-4 text-slate-400" />
                          <span className="font-bold text-slate-900 text-lg">S/ {purchase.totalAmount.toFixed(2)}</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-xs font-bold">
                          Ver Detalle
                        </Button>
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      <PurchaseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => mutate()}
      />

    </div>
  );
}
