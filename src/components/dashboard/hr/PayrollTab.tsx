'use client';

import { useState, useEffect } from 'react';
import { 
  DollarCircleIcon, 
  Search01Icon,
  FilterIcon,
  PlusSignIcon,
  Calendar01Icon,
  UserIcon,
  Download01Icon,
  CheckmarkCircle01Icon,
  ClockIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Payroll {
  id: string;
  user: {
    id: string;
    name: string;
    position?: string;
    baseSalary?: number;
    hourlyRate?: number;
  };
  periodStart: string;
  periodEnd: string;
  type: 'WEEKLY' | 'MONTHLY';
  baseAmount: number;
  hoursWorked: number;
  overtimeHours: number;
  bonusAmount: number;
  deductions: number;
  advanceAmount: number;
  totalPaid: number;
  isPaid: boolean;
  paidAt?: string;
  notes?: string;
}

export function PayrollTab() {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewPayrollModal, setShowNewPayrollModal] = useState(false);

  useEffect(() => {
    fetchPayrolls();
  }, [typeFilter, statusFilter]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const res = await fetch(`/api/hr/payroll?${params}`);
      if (!res.ok) throw new Error('Error al cargar nóminas');
      
      const data = await res.json();
      setPayrolls(data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al cargar nóminas');
    } finally {
      setLoading(false);
    }
  };

  const handlePayPayroll = async (payrollId: string) => {
    try {
      const res = await fetch(`/api/hr/payroll/${payrollId}/pay`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Error al marcar como pagado');

      toast.success('Nómina marcada como pagada');
      fetchPayrolls();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al marcar como pagado');
    }
  };

  const filteredPayrolls = payrolls.filter(payroll =>
    payroll.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (payroll.user.position && payroll.user.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const totalPending = payrolls.filter(p => !p.isPaid).reduce((sum, p) => sum + p.totalPaid, 0);
  const totalPaid = payrolls.filter(p => p.isPaid).reduce((sum, p) => sum + p.totalPaid, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-xl">
            <DollarCircleIcon className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Gestión de Nóminas</h2>
            <p className="text-slate-600">Administra los pagos del personal</p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewPayrollModal(true)}
          className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-6"
        >
          <PlusSignIcon className="w-4 h-4 mr-2" />
          Generar Nómina
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Pendiente</p>
              <p className="text-2xl font-black text-red-600">S/ {totalPending.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-xl bg-red-100">
              <ClockIcon className="w-4 h-4 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Pagado</p>
              <p className="text-2xl font-black text-emerald-600">S/ {totalPaid.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-100">
              <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Nóminas Pendientes</p>
              <p className="text-2xl font-black text-slate-900">{payrolls.filter(p => !p.isPaid).length}</p>
            </div>
            <div className="p-2 rounded-xl bg-orange-100">
              <DollarCircleIcon className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Empleados</p>
              <p className="text-2xl font-black text-slate-900">{new Set(payrolls.map(p => p.user.id)).size}</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-100">
              <UserIcon className="w-4 h-4 text-blue-600" />
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
              placeholder="Buscar empleado..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 rounded-xl"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium"
          >
            <option value="all">Todos los tipos</option>
            <option value="WEEKLY">Semanal</option>
            <option value="MONTHLY">Mensual</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="paid">Pagado</option>
          </select>
          <Button
            variant="outline"
            className="h-11 rounded-xl px-4"
          >
            <Download01Icon className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Payroll List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Registro de Nóminas</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando nóminas...</p>
          </div>
        ) : filteredPayrolls.length === 0 ? (
          <div className="p-8 text-center">
            <DollarCircleIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay registros de nómina</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-700">Empleado</th>
                  <th className="text-left p-4 font-bold text-slate-700">Período</th>
                  <th className="text-left p-4 font-bold text-slate-700">Tipo</th>
                  <th className="text-left p-4 font-bold text-slate-700">Horas</th>
                  <th className="text-left p-4 font-bold text-slate-700">Base</th>
                  <th className="text-left p-4 font-bold text-slate-700">Bonos</th>
                  <th className="text-left p-4 font-bold text-slate-700">Descuentos</th>
                  <th className="text-left p-4 font-bold text-slate-700">Total</th>
                  <th className="text-left p-4 font-bold text-slate-700">Estado</th>
                  <th className="text-left p-4 font-bold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayrolls.map((payroll) => (
                  <tr key={payroll.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg">
                          <UserIcon className="w-4 h-4 text-slate-600" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{payroll.user.name}</p>
                          {payroll.user.position && (
                            <p className="text-sm text-slate-600">{payroll.user.position}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">
                          {format(new Date(payroll.periodStart), 'dd/MM', { locale: es })} - {format(new Date(payroll.periodEnd), 'dd/MM/yyyy', { locale: es })}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-bold ${
                        payroll.type === 'WEEKLY' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {payroll.type === 'WEEKLY' ? 'Semanal' : 'Mensual'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">{payroll.hoursWorked}h</p>
                        {payroll.overtimeHours > 0 && (
                          <p className="text-orange-600">+{payroll.overtimeHours}h extra</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-slate-900">
                        S/ {payroll.baseAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-emerald-600">
                        S/ {payroll.bonusAmount.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-bold text-red-600">
                        S/ {(payroll.deductions + payroll.advanceAmount).toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-lg font-black text-slate-900">
                        S/ {payroll.totalPaid.toFixed(2)}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                        payroll.isPaid 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-orange-100 text-orange-700'
                      }`}>
                        {payroll.isPaid ? (
                          <>
                            <CheckmarkCircle01Icon className="w-3 h-3" />
                            Pagado
                          </>
                        ) : (
                          <>
                            <ClockIcon className="w-3 h-3" />
                            Pendiente
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        {!payroll.isPaid && (
                          <Button
                            onClick={() => handlePayPayroll(payroll.id)}
                            size="sm"
                            className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3"
                          >
                            Marcar Pagado
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-lg px-3"
                        >
                          Ver Detalle
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}