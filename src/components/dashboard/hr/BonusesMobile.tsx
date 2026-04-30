'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft01Icon, 
  GiftIcon,
  UserIcon,
  CheckmarkCircle01Icon,
  ClockIcon,
  FilterIcon,
  PlusSignIcon,
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

interface BonusesMobileProps {
  onClose: () => void;
}

export function BonusesMobile({ onClose }: BonusesMobileProps) {
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchBonuses();
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

  const totalPending = bonuses.filter(b => !b.isApplied).reduce((sum, b) => sum + b.amount, 0);
  const totalApplied = bonuses.filter(b => b.isApplied).reduce((sum, b) => sum + b.amount, 0);

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
          <div className="p-1.5 bg-orange-100 rounded-lg">
            <GiftIcon className="w-4 h-4 text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Bonos</h2>
            <p className="text-xs text-slate-500">{bonuses.length} bonos</p>
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
              <option value="PUNCTUALITY">Puntualidad</option>
              <option value="PERFORMANCE">Rendimiento</option>
              <option value="SALES_TARGET">Meta de Ventas</option>
              <option value="MANUAL">Manual</option>
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
              <option value="applied">Aplicado</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-3">
            <p className="text-xs text-slate-600 mb-1">Pendientes</p>
            <p className="text-lg font-black text-orange-600">S/ {totalPending.toFixed(2)}</p>
            <p className="text-xs text-slate-500">{bonuses.filter(b => !b.isApplied).length} bonos</p>
          </div>
          <div className="bg-white rounded-xl p-3">
            <p className="text-xs text-slate-600 mb-1">Aplicados</p>
            <p className="text-lg font-black text-emerald-600">S/ {totalApplied.toFixed(2)}</p>
            <p className="text-xs text-slate-500">{bonuses.filter(b => b.isApplied).length} bonos</p>
          </div>
        </div>
      </div>

      {/* Bonuses List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
          </div>
        ) : bonuses.length === 0 ? (
          <div className="text-center py-12">
            <GiftIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay bonos registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bonuses.map((bonus) => {
              const typeInfo = getBonusTypeInfo(bonus.type);
              const TypeIcon = typeInfo.icon;
              
              return (
                <div
                  key={bonus.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`p-2 bg-${typeInfo.color}-100 rounded-lg`}>
                      <TypeIcon className={`w-4 h-4 text-${typeInfo.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900">{bonus.user.name}</h3>
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-bold bg-${typeInfo.color}-100 text-${typeInfo.color}-700`}>
                          {typeInfo.label}
                        </span>
                      </div>
                      {bonus.user.position && (
                        <p className="text-sm text-slate-600">{bonus.user.position}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-emerald-600">S/ {bonus.amount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-xl p-3 mb-3">
                    <p className="text-sm text-slate-700">{bonus.description}</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-slate-600">
                      {format(new Date(bonus.createdAt), 'dd MMM yyyy', { locale: es })}
                    </div>
                    {bonus.isApplied ? (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700">
                        <CheckmarkCircle01Icon className="w-3 h-3" />
                        <span className="text-xs font-bold">Aplicado</span>
                      </div>
                    ) : (
                      <Button
                        onClick={() => handleApplyBonus(bonus.id)}
                        size="sm"
                        className="h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg px-3 text-xs"
                      >
                        Aplicar
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}