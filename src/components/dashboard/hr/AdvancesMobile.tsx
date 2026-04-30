'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft01Icon, 
  DollarCircleIcon,
  UserIcon,
  CheckmarkCircle01Icon,
  ClockIcon,
  XmarkIcon,
  FilterIcon,
  PlusSignIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Advance {
  id: string;
  user: {
    id: string;
    name: string;
    position?: string;
  };
  amount: number;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  requestedAt: string;
  approvedAt?: string;
  paidAt?: string;
  notes?: string;
}

interface AdvancesMobileProps {
  onClose: () => void;
}

export function AdvancesMobile({ onClose }: AdvancesMobileProps) {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAdvance, setSelectedAdvance] = useState<Advance | null>(null);

  useEffect(() => {
    fetchAdvances();
  }, [statusFilter]);

  const fetchAdvances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const res = await fetch(`/api/hr/advances?${params}`);
      if (!res.ok) throw new Error('Error al cargar adelantos');
      
      const data = await res.json();
      setAdvances(data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al cargar adelantos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAdvanceStatus = async (advanceId: string, status: 'APPROVED' | 'REJECTED' | 'PAID', notes?: string) => {
    try {
      const res = await fetch(`/api/hr/advances/${advanceId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, notes }),
      });

      if (!res.ok) throw new Error('Error al actualizar adelanto');

      const statusText = {
        APPROVED: 'aprobado',
        REJECTED: 'rechazado',
        PAID: 'marcado como pagado'
      }[status];

      toast.success(`Adelanto ${statusText} correctamente`);
      setSelectedAdvance(null);
      fetchAdvances();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al actualizar adelanto');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pendiente', icon: ClockIcon, color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' };
      case 'APPROVED':
        return { label: 'Aprobado', icon: CheckmarkCircle01Icon, color: 'emerald', bgColor: 'bg-emerald-100', textColor: 'text-emerald-700' };
      case 'REJECTED':
        return { label: 'Rechazado', icon: XmarkIcon, color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' };
      case 'PAID':
        return { label: 'Pagado', icon: CheckmarkCircle01Icon, color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-700' };
      default:
        return { label: status, icon: ClockIcon, color: 'slate', bgColor: 'bg-slate-100', textColor: 'text-slate-700' };
    }
  };

  const totalPending = advances.filter(a => a.status === 'PENDING').reduce((sum, a) => sum + a.amount, 0);
  const totalApproved = advances.filter(a => a.status === 'APPROVED').reduce((sum, a) => sum + a.amount, 0);
  const totalPaid = advances.filter(a => a.status === 'PAID').reduce((sum, a) => sum + a.amount, 0);

  if (selectedAdvance) {
    const statusInfo = getStatusInfo(selectedAdvance.status);
    const StatusIcon = statusInfo.icon;

    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setSelectedAdvance(null)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Detalle de Adelanto</h2>
            <p className="text-xs text-slate-500">{selectedAdvance.user.name}</p>
          </div>
        </div>

        {/* Advance Details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Amount */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-700 rounded-2xl p-6 text-white text-center">
            <p className="text-sm opacity-80 mb-2">Monto Solicitado</p>
            <p className="text-4xl font-black">S/ {selectedAdvance.amount.toFixed(2)}</p>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3">Estado</h3>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${statusInfo.bgColor}`}>
              <StatusIcon className={`w-4 h-4 ${statusInfo.textColor}`} />
              <span className={`text-sm font-bold ${statusInfo.textColor}`}>{statusInfo.label}</span>
            </div>
          </div>

          {/* Reason */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3">Motivo</h3>
            <p className="text-sm text-slate-700">{selectedAdvance.reason}</p>
          </div>

          {/* Dates */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3">Fechas</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Solicitado</span>
                <span className="text-sm font-bold text-slate-900">
                  {format(new Date(selectedAdvance.requestedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                </span>
              </div>
              {selectedAdvance.approvedAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Aprobado</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {format(new Date(selectedAdvance.approvedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
              )}
              {selectedAdvance.paidAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Pagado</span>
                  <span className="text-sm font-bold text-blue-600">
                    {format(new Date(selectedAdvance.paidAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {selectedAdvance.notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 mb-3">Notas</h3>
              <p className="text-sm text-slate-700">{selectedAdvance.notes}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-2">
          {selectedAdvance.status === 'PENDING' && (
            <>
              <Button
                onClick={() => handleUpdateAdvanceStatus(selectedAdvance.id, 'APPROVED')}
                className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
              >
                <CheckmarkCircle01Icon className="w-4 h-4 mr-2" />
                Aprobar Adelanto
              </Button>
              <Button
                onClick={() => handleUpdateAdvanceStatus(selectedAdvance.id, 'REJECTED')}
                variant="outline"
                className="w-full h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
              >
                <XmarkIcon className="w-4 h-4 mr-2" />
                Rechazar Adelanto
              </Button>
            </>
          )}
          {selectedAdvance.status === 'APPROVED' && (
            <Button
              onClick={() => handleUpdateAdvanceStatus(selectedAdvance.id, 'PAID')}
              className="w-full h-12 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl"
            >
              <CheckmarkCircle01Icon className="w-4 h-4 mr-2" />
              Marcar como Pagado
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <div className="p-1.5 bg-red-100 rounded-lg">
            <DollarCircleIcon className="w-4 h-4 text-red-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Adelantos</h2>
            <p className="text-xs text-slate-500">{advances.length} solicitudes</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="p-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <FilterIcon className="w-5 h-5 text-slate-700" />
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="p-4 border-b border-slate-200 bg-slate-50 space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="all">Todos</option>
              <option value="PENDING">Pendiente</option>
              <option value="APPROVED">Aprobado</option>
              <option value="REJECTED">Rechazado</option>
              <option value="PAID">Pagado</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-xs text-slate-600 mb-1">Pendiente</p>
            <p className="text-sm font-black text-orange-600">S/ {totalPending.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-xs text-slate-600 mb-1">Aprobado</p>
            <p className="text-sm font-black text-emerald-600">S/ {totalApproved.toFixed(0)}</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <p className="text-xs text-slate-600 mb-1">Pagado</p>
            <p className="text-sm font-black text-blue-600">S/ {totalPaid.toFixed(0)}</p>
          </div>
        </div>
      </div>

      {/* Advances List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
          </div>
        ) : advances.length === 0 ? (
          <div className="text-center py-12">
            <DollarCircleIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay adelantos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {advances.map((advance) => {
              const statusInfo = getStatusInfo(advance.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <button
                  key={advance.id}
                  onClick={() => setSelectedAdvance(advance)}
                  className="w-full bg-white rounded-2xl border border-slate-200 p-4 active:scale-95 transition-all"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <UserIcon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1 text-left">
                      <h3 className="font-bold text-slate-900">{advance.user.name}</h3>
                      {advance.user.position && (
                        <p className="text-sm text-slate-600">{advance.user.position}</p>
                      )}
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(advance.requestedAt), 'dd MMM yyyy', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-slate-900">S/ {advance.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <p className="text-sm text-slate-700 line-clamp-2">{advance.reason}</p>
                  </div>

                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl ${statusInfo.bgColor}`}>
                    <StatusIcon className={`w-3 h-3 ${statusInfo.textColor}`} />
                    <span className={`text-xs font-bold ${statusInfo.textColor}`}>{statusInfo.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}