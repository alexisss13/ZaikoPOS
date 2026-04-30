'use client';

import { useState, useEffect } from 'react';
import { 
  GiftIcon, 
  Search01Icon,
  PlusSignIcon,
  UserIcon,
  CheckmarkCircle01Icon,
  ClockIcon,
  TrophyIcon,
  TargetIcon,
  Edit02Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Bonus {
  id: string;
  user: {
    id: string;
    name: string;
    position?: string;
  };
  type: 'PUNCTUALITY' | 'PERFORMANCE' | 'SALES_TARGET' | 'MANUAL';
  amount: number;
  description: string;
  isApplied: boolean;
  appliedAt?: string;
  createdAt: string;
}

interface NewBonusModalProps {
  onClose: () => void;
  onSuccess: () => void;
  employees: any[];
}

function NewBonusModal({ onClose, onSuccess, employees }: NewBonusModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    type: 'MANUAL' as const,
    amount: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.userId || !formData.amount || !formData.description) {
      toast.error('Todos los campos son requeridos');
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch('/api/hr/bonuses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear bono');
      }

      toast.success('Bono creado correctamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al crear bono');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-black text-slate-900">Nuevo Bono</h3>
          <p className="text-sm text-slate-600">Asigna un bono a un empleado</p>
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
            <label className="block text-sm font-bold text-slate-700 mb-2">Tipo de Bono</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
              className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white"
            >
              <option value="PUNCTUALITY">Puntualidad</option>
              <option value="PERFORMANCE">Rendimiento</option>
              <option value="SALES_TARGET">Meta de Ventas</option>
              <option value="MANUAL">Manual</option>
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
              placeholder="100.00"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Motivo del bono..."
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
              {loading ? 'Creando...' : 'Crear Bono'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function BonusesTab() {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showNewBonusModal, setShowNewBonusModal] = useState(false);

  useEffect(() => {
    fetchBonuses();
    fetchEmployees();
  }, [typeFilter, statusFilter]);

  const fetchBonuses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(typeFilter !== 'all' && { type: typeFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const res = await fetch(`/api/hr/bonuses?${params}`);
      if (!res.ok) throw new Error('Error al cargar bonos');
      
      const data = await res.json();
      setBonuses(data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al cargar bonos');
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

  const handleApplyBonus = async (bonusId: string) => {
    try {
      const res = await fetch(`/api/hr/bonuses/${bonusId}/apply`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Error al aplicar bono');

      toast.success('Bono aplicado correctamente');
      fetchBonuses();
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al aplicar bono');
    }
  };

  const getBonusTypeInfo = (type: string) => {
    switch (type) {
      case 'PUNCTUALITY':
        return { label: 'Puntualidad', icon: ClockIcon, color: 'emerald' };
      case 'PERFORMANCE':
        return { label: 'Rendimiento', icon: TrophyIcon, color: 'purple' };
      case 'SALES_TARGET':
        return { label: 'Meta de Ventas', icon: TargetIcon, color: 'blue' };
      case 'MANUAL':
        return { label: 'Manual', icon: Edit02Icon, color: 'orange' };
      default:
        return { label: type, icon: GiftIcon, color: 'slate' };
    }
  };

  const filteredBonuses = bonuses.filter(bonus =>
    bonus.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bonus.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPending = bonuses.filter(b => !b.isApplied).reduce((sum, b) => sum + b.amount, 0);
  const totalApplied = bonuses.filter(b => b.isApplied).reduce((sum, b) => sum + b.amount, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-100 rounded-xl">
            <GiftIcon className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Gestión de Bonos</h2>
            <p className="text-slate-600">Administra las bonificaciones del personal</p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewBonusModal(true)}
          className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-6"
        >
          <PlusSignIcon className="w-4 h-4 mr-2" />
          Nuevo Bono
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Bonos Pendientes</p>
              <p className="text-2xl font-black text-orange-600">S/ {totalPending.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-xl bg-orange-100">
              <ClockIcon className="w-4 h-4 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Bonos Aplicados</p>
              <p className="text-2xl font-black text-emerald-600">S/ {totalApplied.toFixed(2)}</p>
            </div>
            <div className="p-2 rounded-xl bg-emerald-100">
              <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Total Bonos</p>
              <p className="text-2xl font-black text-slate-900">{bonuses.length}</p>
            </div>
            <div className="p-2 rounded-xl bg-blue-100">
              <GiftIcon className="w-4 h-4 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-4 border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-600">Empleados con Bonos</p>
              <p className="text-2xl font-black text-slate-900">{new Set(bonuses.map(b => b.user.id)).size}</p>
            </div>
            <div className="p-2 rounded-xl bg-purple-100">
              <UserIcon className="w-4 h-4 text-purple-600" />
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
              placeholder="Buscar empleado o descripción..."
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
            <option value="PUNCTUALITY">Puntualidad</option>
            <option value="PERFORMANCE">Rendimiento</option>
            <option value="SALES_TARGET">Meta de Ventas</option>
            <option value="MANUAL">Manual</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendiente</option>
            <option value="applied">Aplicado</option>
          </select>
        </div>
      </div>

      {/* Bonuses List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Registro de Bonos</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando bonos...</p>
          </div>
        ) : filteredBonuses.length === 0 ? (
          <div className="p-8 text-center">
            <GiftIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay bonos registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-700">Empleado</th>
                  <th className="text-left p-4 font-bold text-slate-700">Tipo</th>
                  <th className="text-left p-4 font-bold text-slate-700">Descripción</th>
                  <th className="text-left p-4 font-bold text-slate-700">Monto</th>
                  <th className="text-left p-4 font-bold text-slate-700">Estado</th>
                  <th className="text-left p-4 font-bold text-slate-700">Fecha</th>
                  <th className="text-left p-4 font-bold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredBonuses.map((bonus) => {
                  const typeInfo = getBonusTypeInfo(bonus.type);
                  const TypeIcon = typeInfo.icon;
                  
                  return (
                    <tr key={bonus.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <UserIcon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{bonus.user.name}</p>
                            {bonus.user.position && (
                              <p className="text-sm text-slate-600">{bonus.user.position}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                          <TypeIcon className="w-3 h-3" />
                          {typeInfo.label}
                        </div>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-slate-900 max-w-xs truncate">
                          {bonus.description}
                        </p>
                      </td>
                      <td className="p-4">
                        <span className="text-lg font-black text-emerald-600">
                          S/ {bonus.amount.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
                          bonus.isApplied 
                            ? 'bg-emerald-100 text-emerald-700' 
                            : 'bg-orange-100 text-orange-700'
                        }`}>
                          {bonus.isApplied ? (
                            <>
                              <CheckmarkCircle01Icon className="w-3 h-3" />
                              Aplicado
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
                        <div className="text-sm">
                          <p className="font-bold text-slate-900">
                            {format(new Date(bonus.createdAt), 'dd/MM/yyyy', { locale: es })}
                          </p>
                          {bonus.appliedAt && (
                            <p className="text-emerald-600">
                              Aplicado: {format(new Date(bonus.appliedAt), 'dd/MM/yyyy', { locale: es })}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        {!bonus.isApplied && (
                          <Button
                            onClick={() => handleApplyBonus(bonus.id)}
                            size="sm"
                            className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3"
                          >
                            Aplicar
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Bonus Modal */}
      {showNewBonusModal && (
        <NewBonusModal
          onClose={() => setShowNewBonusModal(false)}
          onSuccess={() => {
            setShowNewBonusModal(false);
            fetchBonuses();
          }}
          employees={employees}
        />
      )}
    </div>
  );
}