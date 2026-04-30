'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft01Icon, 
  UserIcon,
  Search01Icon,
  PlusSignIcon,
  QrCode01Icon,
  BarCode01Icon,
  DollarCircleIcon,
  Clock01Icon,
  Edit02Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { NewEmployeeModal } from './NewEmployeeModal';

interface Employee {
  id: string;
  name: string;
  email?: string;
  role: string;
  position?: string;
  baseSalary?: number;
  hourlyRate?: number;
  workingHours?: number;
  qrCode?: string;
  barcode?: string;
  hireDate?: string;
  branch?: {
    name: string;
  };
}

interface EmployeesMobileProps {
  onClose: () => void;
}

export function EmployeesMobile({ onClose }: EmployeesMobileProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  useEffect(() => {
    fetchEmployees();
    fetchBranches();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/hr/employees');
      if (!res.ok) throw new Error('Error al cargar empleados');
      
      const data = await res.json();
      setEmployees(data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al cargar empleados');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (!res.ok) throw new Error('Error al cargar sucursales');
      
      const data = await res.json();
      setBranches(data);
    } catch (error: any) {
      console.error('Error:', error);
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (emp.position && emp.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleLabel = (role: string) => {
    const roles: Record<string, string> = {
      ADMIN: 'Administrador',
      SELLER: 'Vendedor',
      CASHIER: 'Cajero',
      MANAGER: 'Gerente',
      SUPER_ADMIN: 'Super Admin',
      OWNER: 'Propietario'
    };
    return roles[role] || role;
  };

  if (selectedEmployee) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setSelectedEmployee(null)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">{selectedEmployee.name}</h2>
            <p className="text-xs text-slate-500">{selectedEmployee.position || getRoleLabel(selectedEmployee.role)}</p>
          </div>
        </div>

        {/* Employee Details */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* QR & Barcode */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3">Códigos de Acceso</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <QrCode01Icon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600 mb-1">Código QR</p>
                <p className="text-sm font-mono font-bold text-slate-900">{selectedEmployee.qrCode || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center">
                <BarCode01Icon className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-600 mb-1">Código de Barras</p>
                <p className="text-sm font-mono font-bold text-slate-900">{selectedEmployee.barcode || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Salary Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3">Información Salarial</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Salario Base</span>
                <span className="text-sm font-bold text-slate-900">
                  S/ {selectedEmployee.baseSalary?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Tarifa por Hora</span>
                <span className="text-sm font-bold text-slate-900">
                  S/ {selectedEmployee.hourlyRate?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Horas de Trabajo</span>
                <span className="text-sm font-bold text-slate-900">
                  {selectedEmployee.workingHours || 8}h/día
                </span>
              </div>
            </div>
          </div>

          {/* Work Info */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900 mb-3">Información Laboral</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Rol</span>
                <span className="text-sm font-bold text-slate-900">{getRoleLabel(selectedEmployee.role)}</span>
              </div>
              {selectedEmployee.position && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Cargo</span>
                  <span className="text-sm font-bold text-slate-900">{selectedEmployee.position}</span>
                </div>
              )}
              {selectedEmployee.branch && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Sucursal</span>
                  <span className="text-sm font-bold text-slate-900">{selectedEmployee.branch.name}</span>
                </div>
              )}
              {selectedEmployee.hireDate && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Fecha de Contratación</span>
                  <span className="text-sm font-bold text-slate-900">
                    {new Date(selectedEmployee.hireDate).toLocaleDateString('es-PE')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Contact Info */}
          {selectedEmployee.email && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="font-bold text-slate-900 mb-3">Información de Contacto</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Email</span>
                  <span className="text-sm font-bold text-slate-900">{selectedEmployee.email}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <Button
            className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
          >
            <Edit02Icon className="w-4 h-4 mr-2" />
            Editar Empleado
          </Button>
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
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <UserIcon className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Personal</h2>
            <p className="text-xs text-slate-500">{employees.length} empleados</p>
          </div>
        </div>
        <Button
          onClick={() => setShowNewModal(true)}
          className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-3"
        >
          <PlusSignIcon className="w-3 h-3 mr-1" />
          Nuevo
        </Button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-slate-200 bg-white">
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

      {/* Employee List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-12">
            <UserIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay empleados registrados</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map((employee) => (
              <button
                key={employee.id}
                onClick={() => setSelectedEmployee(employee)}
                className="w-full bg-white rounded-2xl border border-slate-200 p-4 active:scale-95 transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <UserIcon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="font-bold text-slate-900">{employee.name}</h3>
                    <p className="text-sm text-slate-600">
                      {employee.position || getRoleLabel(employee.role)}
                    </p>
                    {employee.branch && (
                      <p className="text-xs text-slate-500 mt-1">{employee.branch.name}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {employee.baseSalary && (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <DollarCircleIcon className="w-4 h-4" />
                        <span className="text-sm font-bold">S/ {employee.baseSalary.toFixed(0)}</span>
                      </div>
                    )}
                    {employee.workingHours && (
                      <div className="flex items-center gap-1 text-slate-500 mt-1">
                        <Clock01Icon className="w-3 h-3" />
                        <span className="text-xs">{employee.workingHours}h/día</span>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* New Employee Modal */}
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
    </div>
  );
}