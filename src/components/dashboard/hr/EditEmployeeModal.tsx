'use client';

import { useState } from 'react';
import { Cancel01Icon, UserIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface EditEmployeeModalProps {
  employee: any;
  onClose: () => void;
  onSuccess: () => void;
  branches: any[];
}

export function EditEmployeeModal({ employee, onClose, onSuccess, branches }: EditEmployeeModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: employee.name || '',
    email: employee.email || '',
    role: employee.role || 'SELLER',
    branchId: employee.branch?.id || '',
    position: employee.position || '',
    baseSalary: employee.baseSalary?.toString() || '',
    hourlyRate: employee.hourlyRate?.toString() || '',
    workingHours: employee.workingHours?.toString() || '8',
    hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    if (!formData.branchId) {
      toast.error('Selecciona una sucursal');
      return;
    }

    try {
      setLoading(true);
      
      const res = await fetch(`/api/hr/employees/${employee.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al actualizar empleado');
      }

      toast.success('Empleado actualizado correctamente');
      onSuccess();
    } catch (error: any) {
      console.error('Error al actualizar empleado:', error);
      toast.error(error.message || 'Error al actualizar empleado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-xl">
              <UserIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900">Editar Empleado</h2>
              <p className="text-sm text-slate-600">Actualiza la información del empleado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <Cancel01Icon className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Información Personal</h3>
              
              <div>
                <Label htmlFor="name">Nombre Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nombre del empleado"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="correo@ejemplo.com"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="position">Cargo/Posición</Label>
                <Input
                  id="position"
                  value={formData.position}
                  onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                  placeholder="Ej: Vendedor Senior"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="hireDate">Fecha de Contratación</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hireDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>

            {/* Información Laboral */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900">Información Laboral</h3>
              
              <div>
                <Label htmlFor="role">Rol *</Label>
                <select
                  id="role"
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full mt-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                  required
                >
                  <option value="SELLER">Vendedor</option>
                  <option value="CASHIER">Cajero</option>
                  <option value="MANAGER">Gerente</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>

              <div>
                <Label htmlFor="branchId">Sucursal *</Label>
                <select
                  id="branchId"
                  value={formData.branchId}
                  onChange={(e) => setFormData(prev => ({ ...prev, branchId: e.target.value }))}
                  className="w-full mt-1 h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
                  required
                >
                  <option value="">Seleccionar sucursal</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>{branch.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="workingHours">Horas de Trabajo por Día</Label>
                <Input
                  id="workingHours"
                  type="number"
                  min="1"
                  max="12"
                  value={formData.workingHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, workingHours: e.target.value }))}
                  placeholder="8"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="baseSalary">Salario Base (S/)</Label>
                <Input
                  id="baseSalary"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.baseSalary}
                  onChange={(e) => setFormData(prev => ({ ...prev, baseSalary: e.target.value }))}
                  placeholder="1500.00"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="hourlyRate">Tarifa por Hora (S/)</Label>
                <Input
                  id="hourlyRate"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData(prev => ({ ...prev, hourlyRate: e.target.value }))}
                  placeholder="15.00"
                  className="mt-1"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Opcional: Se usará para calcular pagos por horas trabajadas
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200">
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
              {loading ? 'Actualizando...' : 'Actualizar Empleado'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}