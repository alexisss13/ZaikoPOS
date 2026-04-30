'use client';

import { useState, useEffect } from 'react';
import { 
  Search01Icon, 
  FilterIcon, 
  PlusSignIcon,
  Edit02Icon,
  Delete02Icon,
  QrCode01Icon,
  BarCode01Icon,
  UserIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { NewEmployeeModal } from './NewEmployeeModal';
import { EditEmployeeModal } from './EditEmployeeModal';

interface Employee {
  id: string;
  name: string;
  email: string;
  role: string;
  position: string;
  baseSalary: number;
  hourlyRate: number;
  workingHours: number;
  hireDate: string;
  qrCode: string;
  barcode: string;
  isActive: boolean;
  branch: {
    id: string;
    name: string;
  };
  shifts: any[];
  attendances: any[];
}

export function EmployeesTab() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, [pagination.page, searchTerm, roleFilter, branchFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        role: roleFilter,
        branchId: branchFilter
      });

      const res = await fetch(`/api/hr/employees?${params}`);
      if (!res.ok) throw new Error('Error al cargar empleados');
      
      const data = await res.json();
      setEmployees(data.employees);
      setPagination(prev => ({ ...prev, ...data.pagination }));
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        setBranches(data.branches || []);
      }
    } catch (error) {
      console.error('Error al cargar sucursales:', error);
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas desactivar este empleado?')) return;

    try {
      const res = await fetch(`/api/hr/employees/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Error al desactivar empleado');

      toast.success('Empleado desactivado correctamente');
      fetchEmployees();
    } catch (error) {
      console.error(error);
      toast.error('Error al desactivar empleado');
    }
  };

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      MANAGER: 'Gerente',
      SELLER: 'Vendedor',
      CASHIER: 'Cajero',
      OWNER: 'Propietario'
    };
    return roles[role] || role;
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      ADMIN: 'bg-red-100 text-red-700',
      MANAGER: 'bg-purple-100 text-purple-700',
      SELLER: 'bg-blue-100 text-blue-700',
      CASHIER: 'bg-emerald-100 text-emerald-700',
      OWNER: 'bg-orange-100 text-orange-700'
    };
    return colors[role] || 'bg-slate-100 text-slate-700';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar empleados..."
            className="h-10 pl-10 rounded-xl"
          />
        </div>
        
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
        >
          <option value="all">Todos los roles</option>
          <option value="ADMIN">Administrador</option>
          <option value="MANAGER">Gerente</option>
          <option value="SELLER">Vendedor</option>
          <option value="CASHIER">Cajero</option>
        </select>

        <select
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          className="h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
        >
          <option value="all">Todas las sucursales</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.name}</option>
          ))}
        </select>

        <Button
          onClick={() => setShowNewModal(true)}
          className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
        >
          <PlusSignIcon className="w-4 h-4 mr-2" />
          Nuevo Empleado
        </Button>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Cargando empleados...</div>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <UserIcon className="w-16 h-16 text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No hay empleados</h3>
            <p className="text-slate-600 mb-4">Agrega tu primer empleado para empezar</p>
            <Button
              onClick={() => setShowNewModal(true)}
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            >
              <PlusSignIcon className="w-4 h-4 mr-2" />
              Agregar Empleado
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 text-xs font-bold text-slate-700">Empleado</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-700">Rol</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-700">Sucursal</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-700">Salario</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-700">Códigos</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-700">Estado</th>
                  <th className="text-right p-4 text-xs font-bold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((employee) => (
                  <tr key={employee.id} className="border-b border-slate-100">
                    <td className="p-4">
                      <div>
                        <p className="font-bold text-slate-900">{employee.name}</p>
                        <p className="text-sm text-slate-600">{employee.email}</p>
                        <p className="text-xs text-slate-500">{employee.position}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${getRoleColor(employee.role)}`}>
                        {getRoleLabel(employee.role)}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-900">{employee.branch?.name || 'Sin asignar'}</p>
                    </td>
                    <td className="p-4">
                      <div>
                        {employee.baseSalary && (
                          <p className="text-sm font-bold text-slate-900">
                            S/ {employee.baseSalary.toFixed(2)}
                          </p>
                        )}
                        {employee.hourlyRate && (
                          <p className="text-xs text-slate-600">
                            S/ {employee.hourlyRate.toFixed(2)}/hora
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 rounded-lg">
                          <QrCode01Icon className="w-3 h-3 text-blue-600" />
                          <span className="text-xs font-mono text-blue-700">{employee.qrCode}</span>
                        </div>
                        <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 rounded-lg">
                          <BarCode01Icon className="w-3 h-3 text-emerald-600" />
                          <span className="text-xs font-mono text-emerald-700">{employee.barcode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                        employee.isActive 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {employee.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2 justify-end">
                        <Button
                          onClick={() => setEditingEmployee(employee)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg"
                        >
                          <Edit02Icon className="w-3 h-3" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteEmployee(employee.id)}
                          variant="outline"
                          size="sm"
                          className="h-8 w-8 p-0 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Delete02Icon className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-slate-200">
            <Button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page === 1}
              variant="outline"
              className="h-10 rounded-xl"
            >
              Anterior
            </Button>
            <span className="text-sm text-slate-600">
              Página {pagination.page} de {pagination.pages}
            </span>
            <Button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page === pagination.pages}
              variant="outline"
              className="h-10 rounded-xl"
            >
              Siguiente
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewEmployeeModal
          onClose={() => setShowNewModal(false)}
          onSuccess={() => {
            setShowNewModal(false);
            fetchEmployees();
          }}
          branches={branches}
        />
      )}

      {editingEmployee && (
        <EditEmployeeModal
          employee={editingEmployee}
          onClose={() => setEditingEmployee(null)}
          onSuccess={() => {
            setEditingEmployee(null);
            fetchEmployees();
          }}
          branches={branches}
        />
      )}
    </div>
  );
}