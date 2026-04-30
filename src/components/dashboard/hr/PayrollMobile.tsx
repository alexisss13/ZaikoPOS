'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft01Icon, 
  DollarCircleIcon,
  UserIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  FilterIcon,
  Calendar01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Payroll {
  id: string;
  user: {
    id: string;
    name: string;
    position?: string;
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
}

interface PayrollMobileProps {
  onClose: () => void;
}

export function PayrollMobile({ onClose }: PayrollMobileProps) {
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);

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
      setSelectedPayroll(null);
      fetchPayrolls();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al marcar como pagado');
    }
  };

  const totalPending = payrolls.filter(p => !p.isPaid).reduce((sum, p) => sum + p.totalPaid, 0);
  const totalPaid = payrolls.filter(p => p.isPaid).reduce((sum, p) => sum + p.totalPaid, 0);

  if (selectedPayroll) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setSelectedPayroll(null)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Detalle de Nómina</h2>
            <p className="text-xs text-slate-500">{selectedPayroll.user.name}</p>
          </div>
        </div>

        {/* Payroll Details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Period */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar01Icon className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-900">Período</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Tipo</span>
                <span className={`text-sm font-bold px-2 py-1 rounded-lg ${
                  selectedPayroll.type === 'WEEKLY' 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {selectedPayroll.type === 'WEEKLY' ? 'Semanal' : 'Mensual'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Desde</span>
                <span className="text-sm font-bold text-slate-900">
                  {format(new Date(selectedPayroll.periodStart), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Hasta</span>
                <span className="text-sm font-bold text-slate-900">
                  {format(new Date(selectedPayroll.periodEnd), 'dd/MM/yyyy', { locale: es })}
                </span>
              </div>
            </div>
          </div>

          {/* Hours */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock01Icon className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-900">Horas Trabajadas</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Horas Regulares</span>
                <span className="text-sm font-bold text-slate-900">{selectedPayroll.hoursWorked}h</span>
              </div>
              {selectedPayroll.overtimeHours > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Horas Extra</span>
                  <span className="text-sm font-bold text-orange-600">+{selectedPayroll.overtimeHours}h</span>
                </div>
              )}
            </div>
          </div>

          {/* Amounts */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarCircleIcon className="w-4 h-4 text-slate-600" />
              <h3 className="font-bold text-slate-900">Montos</h3>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Salario Base</span>
                <span className="text-sm font-bold text-slate-900">S/ {selectedPayroll.baseAmount.toFixed(2)}</span>
              </div>
              {selectedPayroll.bonusAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Bonos</span>
                  <span className="text-sm font-bold text-emerald-600">+S/ {selectedPayroll.bonusAmount.toFixed(2)}</span>
                </div>
              )}
              {selectedPayroll.deductions > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Descuentos</span>
                  <span className="text-sm font-bold text-red-600">-S/ {selectedPayroll.deductions.toFixed(2)}</span>
                </div>
              )}
              {selectedPayroll.advanceAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Adelantos</span>
                  <span className="text-sm font-bold text-red-600">-S/ {selectedPayroll.advanceAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between">
                <span className="text-base font-bold text-slate-900">Total a Pagar</span>
                <span className="text-xl font-black text-slate-900">S/ {selectedPayroll.totalPaid.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3">Estado</h3>
            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${
              selectedPayroll.isPaid 
                ? 'bg-emerald-100 text-emerald-700' 
                : 'bg-orange-100 text-orange-700'
            }`}>
              {selectedPayroll.isPaid ? (
                <>
                  <CheckmarkCircle01Icon className="w-4 h-4" />
                  <span className="text-sm font-bold">Pagado</span>
                  {selectedPayroll.paidAt && (
                    <span className="text-xs ml-auto">
                      {format(new Date(selectedPayroll.paidAt), 'dd/MM/yyyy', { locale: es })}
                    </span>
                  )}
                </>
              ) : (
                <>
                  <Clock01Icon className="w-4 h-4" />
                  <span className="text-sm font-bold">Pendiente de Pago</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        {!selectedPayroll.isPaid && (
          <div className="p-4 border-t border-slate-200 bg-white">
            <Button
              onClick={() => handlePayPayroll(selectedPayroll.id)}
              className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
            >
              <CheckmarkCircle01Icon className="w-4 h-4 mr-2" />
              Marcar como Pagado
            </Button>
          </div>
        )}
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
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <DollarCircleIcon className="w-4 h-4 text-purple-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Nóminas</h2>
            <p className="text-xs text-slate-500">{payrolls.length} registros</p>
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
            <label className="block text-xs font-bold text-slate-700 mb-2">Tipo</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="all">Todos</option>
              <option value="WEEKLY">Semanal</option>
              <option value="MONTHLY">Mensual</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="all">Todos</option>
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3">
            <p className="text-xs text-slate-600 mb-1">Pendiente</p>
            <p className="text-lg font-black text-red-600">S/ {totalPending.toFixed(2)}</p>
          </div>
          <div className="bg-white rounded-xl p-3">
            <p className="text-xs text-slate-600 mb-1">Pagado</p>
            <p className="text-lg font-black text-emerald-600">S/ {totalPaid.toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Payroll List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
          </div>
        ) : payrolls.length === 0 ? (
          <div className="text-center py-12">
            <DollarCircleIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay nóminas registradas</p>
          </div>
        ) : (
          <div className="space-y-3">
            {payrolls.map((payroll) => (
              <button
                key={payroll.id}
                onClick={() => setSelectedPayroll(payroll)}
                className="w-full bg-white rounded-2xl border border-slate-200 p-4 active:scale-95 transition-all"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    <UserIcon className="w-4 h-4 text-slate-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-slate-900">{payroll.user.name}</h3>
                    <p className="text-xs text-slate-600">
                      {format(new Date(payroll.periodStart), 'dd/MM', { locale: es })} - {format(new Date(payroll.periodEnd), 'dd/MM/yyyy', { locale: es })}
                    </p>
                  </div>
                  <div className={`px-2 py-1 rounded-lg ${
                    payroll.isPaid 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-orange-100 text-orange-700'
                  }`}>
                    <span className="text-xs font-bold">
                      {payroll.isPaid ? 'Pagado' : 'Pendiente'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <div className="text-left">
                    <p className="text-xs text-slate-600">Total</p>
                    <p className="text-lg font-black text-slate-900">S/ {payroll.totalPaid.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-600">{payroll.hoursWorked}h trabajadas</p>
                    {payroll.overtimeHours > 0 && (
                      <p className="text-xs text-orange-600">+{payroll.overtimeHours}h extra</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}