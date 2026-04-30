'use client';

import { useState, useEffect } from 'react';
import { 
  DollarCircleIcon, 
  Search01Icon,
  PlusSignIcon,
  UserIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  CancelCircleIcon,
  Alert02Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

interface NewAdvanceModalProps {
  onClose: () => void;
  onSuccess: () => void;
  employees: any[];
}

function NewAdvanceModal({ onClose, onSuccess, employees }: NewAdvanceModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    amount: '',
    reason: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.amount || !formData.reason) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch('/api/hr/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear adelanto');
      }

      toast.success('Adelanto solicitado correctamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al crear adelanto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-black text-slate-900">Nuevo Adelanto</h3>
          <p className="text-sm text-slate-600">Solicita un adelanto de sueldo</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Empleado</label>
            <select
              value={formData.userId}
              onChange={(e) => setFormData(prev => ({ ...prev, userId: e.target.value }))}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white"
              required
            >
              <option value="">Seleccionar empleado</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Monto (S/)</label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="500.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Motivo</label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Motivo del adelanto..."
              className="w-full h-20 px-3 py-2 rounded-xl border border-slate-200 resize-none"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 h-11 rounded-xl"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
              disabled={loading}
            >
              {loading ? 'Solicitando...' : 'Solicitar Adelanto'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdvancesTab() {
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewAdvanceModal, setShowNewAdvanceModal] = useState(false);

  useEffect(() => {
    fetchAdvances();
    fetchEmployees();
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

  const fetchEmployees = async () => {
    try {
      const res = await fetch('/api/hr/employees');
      if (!res.ok) throw new Error('Error al cargar empleados');
      
      const data = await res.json();
      setEmployees(data);
    } catch (error: any) {
      console.error('Error:', error);
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
      fetchAdvances();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al actualizar adelanto');
    }
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { label: 'Pendiente', icon: Clock01Icon, color: 'orange' };
      case 'APPROVED':
        return { label: 'Aprobado', icon: CheckmarkCircle01Icon, color: 'emerald' };
      case 'REJECTED':
        return { label: 'Rechazado', icon: CancelCircleIcon, color: 'red' };
      case 'PAID':
        return { label: 'Pagado', icon: CheckmarkCircle01Icon, color: 'blue' };
      default:
        return { label: status, icon: Alert02Icon, color: 'slate' };
    }
  };

  const filteredAdvances = advances.filter(advance =>
    advance.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    advance.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = advances.filter(a => a.status === 'PENDING').reduce((sum, a) => sum + a.amount, 0);
  const totalApproved = advances.filter(a => a.status === 'APPROVED').reduce((sum, a) => sum + a.amount, 0);
  const totalPaid = advances.filter(a => a.status === 'PAID').reduce((sum, a) => sum + a.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-100 rounded-xl">
            <DollarCircleIcon className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Gestión de Adelantos</h2>
            <p className="text-slate-600">Administra los adelantos de sueldo</p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewAdvanceModal(true)}
          className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-6"
        >
          <PlusSignIcon className="w-4 h-4 mr-2" />
          Nuevo Adelanto
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pendientes</p>
              <p className="text-2xl font-black text-orange-600">S/ {totalPending.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-xl bg-orange-100">
              <Clock01Icon className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Aprobados</p>
              <p className="text-2xl font-black text-emerald-600">S/ {totalApproved.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-100">
              <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Pagados</p>
              <p className="text-2xl font-black text-blue-600">S/ {totalPaid.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-100">
              <DollarCircleIcon className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Adelantos</p>
              <p className="text-2xl font-black text-slate-900">{advances.length}</p>
            </div>
            <div className="p-2 rounded-xl bg-slate-100">
              <UserIcon className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search01Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar empleado o motivo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium"
          >
            <option value="all">Todos los estados</option>
            <option value="PENDING">Pendiente</option>
            <option value="APPROVED">Aprobado</option>
            <option value="REJECTED">Rechazado</option>
            <option value="PAID">Pagado</option>
          </select>
        </div>
      </div>

      {/* Advances List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Registro de Adelantos</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando adelantos...</p>
          </div>
        ) : filteredAdvances.length === 0 ? (
          <div className="p-8 text-center">
            <DollarCircleIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay adelantos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-700">Empleado</th>
                  <th className="text-left p-4 font-bold text-slate-700">Monto</th>
                  <th className="text-left p-4 font-bold text-slate-700">Motivo</th>
                  <th className="text-left p-4 font-bold text-slate-700">Estado</th>
                  <th className="text-left p-4 font-bold text-slate-700">Fecha Solicitud</th>
                  <th className="text-left p-4 font-bold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAdvances.map((advance) => {
                  const statusInfo = getStatusInfo(advance.status);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <tr key={advance.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <UserIcon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{advance.user.name}</p>
                            {advance.user.position && (
                              <p className="text-sm text-slate-600">{advance.user.position}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-lg font-black text-slate-900">
                          S/ {advance.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900 max-w-xs">
                          {advance.reason}
                        </p>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-${statusInfo.color}-100 text-${statusInfo.color}-700`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="font-bold text-slate-900">
                            {format(new Date(advance.requestedAt), 'dd/MM/yyyy', { locale: es })}
                          </p>
                          <p className="text-slate-600">
                            {format(new Date(advance.requestedAt), 'HH:mm', { locale: es })}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          {advance.status === 'PENDING' && (
                            <>
                              <Button
                                onClick={() => handleUpdateAdvanceStatus(advance.id, 'APPROVED')}
                                size="sm"
                                className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3"
                              >
                                Aprobar
                              </Button>
                              <Button
                                onClick={() => handleUpdateAdvanceStatus(advance.id, 'REJECTED')}
                                size="sm"
                                variant="outline"
                                className="h-8 rounded-lg px-3 border-red-200 text-red-600 hover:bg-red-50"
                              >
                                Rechazar
                              </Button>
                            </>
                          )}
                          {advance.status === 'APPROVED' && (
                            <Button
                              onClick={() => handleUpdateAdvanceStatus(advance.id, 'PAID')}
                              size="sm"
                              className="h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3"
                            >
                              Marcar Pagado
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Advance Modal */}
      {showNewAdvanceModal && (
        <NewAdvanceModal
          onClose={() => setShowNewAdvanceModal(false)}
          onSuccess={() => {
            setShowNewAdvanceModal(false);
            fetchAdvances();
          }}
          employees={employees}
        />
      )}
    </div>
  );
}