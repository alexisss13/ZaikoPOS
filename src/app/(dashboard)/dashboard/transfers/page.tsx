'use client';

import useSWR from 'swr';
import { useAuth } from '@/context/auth-context';
import { ArrowRightLeft, Check, X, Clock, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

export default function TransfersPage() {
  const { user, role } = useAuth();
  
  // Solicitamos los traslados filtrados por la sucursal actual y el rol
  const { data: transfers, isLoading, mutate } = useSWR<Transfer[]>(
    user ? `/api/stock-transfers?branchId=${user.branchId}&role=${role}` : null, 
    fetcher
  );

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
      mutate(); // Recargar la tabla
    } catch {
      toast.error('Error al procesar el traslado');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Pendiente</Badge>;
      case 'APPROVED': return <Badge variant="outline" className="bg-emerald-50 text-emerald-600 border-emerald-200"><Check className="w-3 h-3 mr-1" /> Aprobado</Badge>;
      case 'REJECTED': return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-200"><X className="w-3 h-3 mr-1" /> Rechazado</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ArrowRightLeft className="w-6 h-6 text-blue-600" /> Solicitudes de Traslado
        </h1>
        <p className="text-slate-500 text-sm mt-1">Administra los movimientos de inventario entre sucursales.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-6 py-4">Producto</th>
                <th className="px-6 py-4">Origen</th>
                <th className="px-6 py-4">Destino</th>
                <th className="px-6 py-4">Solicitante</th>
                <th className="px-6 py-4">Estado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (
                  <tr key={i}><td colSpan={6} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>
                ))
              ) : !transfers || transfers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-500">
                    <ArrowRightLeft className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    No hay solicitudes de traslado registradas.
                  </td>
                </tr>
              ) : (
                transfers.map((t) => {
                  // ¿El usuario actual tiene permiso para aprobar? (Debe ser el dueño de la tienda de origen, o SuperAdmin)
                  const canApprove = t.status === 'PENDING' && (t.fromBranchId === user?.branchId || role === 'SUPER_ADMIN' || role === 'OWNER');

                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded border overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                            {t.product.images?.[0] ? <img src={t.product.images[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-4 h-4 text-slate-300" />}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 leading-tight">{t.product.title}</p>
                            <p className="text-xs text-slate-500">{t.quantity} Unidades</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 font-medium text-slate-700">{t.fromBranch.name}</td>
                      <td className="px-6 py-3 font-medium text-blue-600">{t.toBranch.name}</td>
                      <td className="px-6 py-3">
                        <p className="text-slate-800 font-medium">{t.requestedBy.name}</p>
                        <p className="text-[10px] text-slate-400">{new Date(t.createdAt).toLocaleDateString('es-PE')}</p>
                      </td>
                      <td className="px-6 py-3">{getStatusBadge(t.status)}</td>
                      <td className="px-6 py-3 text-right">
                        {canApprove ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleProcess(t.id, 'REJECTED')}>
                              <X className="w-4 h-4" />
                            </Button>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm" onClick={() => handleProcess(t.id, 'APPROVED')}>
                              Aprobar
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium italic">Sin acción</span>
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