'use client';

import { useState, useEffect } from 'react';
import { 
  Clock01Icon, 
  Search01Icon,
  FilterIcon,
  PlusSignIcon,
  Calendar01Icon,
  UserIcon,
  CheckmarkCircle01Icon,
  Alert01Icon,
  CancelCircleIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Attendance {
  id: string;
  user: {
    id: string;
    name: string;
    position?: string;
  };
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';
  hoursWorked?: number;
  isLate: boolean;
  lateMinutes?: number;
  notes?: string;
}

export function AttendanceTab() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    fetchAttendances();
  }, [selectedDate, statusFilter]);

  const fetchAttendances = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        date: selectedDate,
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const res = await fetch(`/api/hr/attendance?${params}`);
      if (!res.ok) throw new Error('Error al cargar asistencias');
      
      const data = await res.json();
      setAttendances(data);
    } catch (error: any) {
      console.error('Error:', error);
      toast.error(error.message || 'Error al cargar asistencias');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'text-emerald-600 bg-emerald-50';
      case 'LATE': return 'text-orange-600 bg-orange-50';
      case 'ABSENT': return 'text-red-600 bg-red-50';
      case 'EXCUSED': return 'text-blue-600 bg-blue-50';
      default: return 'text-slate-600 bg-slate-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PRESENT': return 'Presente';
      case 'LATE': return 'Tardanza';
      case 'ABSENT': return 'Ausente';
      case 'EXCUSED': return 'Justificado';
      default: return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PRESENT': return CheckmarkCircle01Icon;
      case 'LATE': return Alert01Icon;
      case 'ABSENT': return CancelCircleIcon;
      case 'EXCUSED': return UserIcon;
      default: return Clock01Icon;
    }
  };

  const filteredAttendances = attendances.filter(attendance =>
    attendance.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (attendance.user.position && attendance.user.position.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 rounded-xl">
            <Clock01Icon className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Control de Asistencias</h2>
            <p className="text-slate-600">Gestiona las asistencias del personal</p>
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
          <div className="relative">
            <Calendar01Icon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="pl-10 h-11 rounded-xl w-48"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-11 px-4 rounded-xl border border-slate-200 bg-white text-sm font-medium"
          >
            <option value="all">Todos los estados</option>
            <option value="PRESENT">Presente</option>
            <option value="LATE">Tardanza</option>
            <option value="ABSENT">Ausente</option>
            <option value="EXCUSED">Justificado</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Presentes', value: attendances.filter(a => a.status === 'PRESENT').length, color: 'emerald' },
          { label: 'Tardanzas', value: attendances.filter(a => a.status === 'LATE').length, color: 'orange' },
          { label: 'Ausentes', value: attendances.filter(a => a.status === 'ABSENT').length, color: 'red' },
          { label: 'Justificados', value: attendances.filter(a => a.status === 'EXCUSED').length, color: 'blue' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-2xl p-4 border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">{stat.label}</p>
                <p className="text-2xl font-black text-slate-900">{stat.value}</p>
              </div>
              <div className={`p-2 rounded-xl bg-${stat.color}-100`}>
                <Clock01Icon className={`w-4 h-4 text-${stat.color}-600`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attendance List */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">
            Asistencias del {format(new Date(selectedDate), 'dd \'de\' MMMM \'de\' yyyy', { locale: es })}
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Cargando asistencias...</p>
          </div>
        ) : filteredAttendances.length === 0 ? (
          <div className="p-8 text-center">
            <Clock01Icon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay registros de asistencia para esta fecha</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4 font-bold text-slate-700">Empleado</th>
                  <th className="text-left p-4 font-bold text-slate-700">Estado</th>
                  <th className="text-left p-4 font-bold text-slate-700">Entrada</th>
                  <th className="text-left p-4 font-bold text-slate-700">Salida</th>
                  <th className="text-left p-4 font-bold text-slate-700">Horas</th>
                  <th className="text-left p-4 font-bold text-slate-700">Retraso</th>
                  <th className="text-left p-4 font-bold text-slate-700">Notas</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendances.map((attendance) => {
                  const StatusIcon = getStatusIcon(attendance.status);
                  return (
                    <tr key={attendance.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-100 rounded-lg">
                            <UserIcon className="w-4 h-4 text-slate-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{attendance.user.name}</p>
                            {attendance.user.position && (
                              <p className="text-sm text-slate-600">{attendance.user.position}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(attendance.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {getStatusText(attendance.status)}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-mono text-slate-900">
                          {attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString('es-PE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-mono text-slate-900">
                          {attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString('es-PE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          }) : '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-bold text-slate-900">
                          {attendance.hoursWorked ? `${attendance.hoursWorked}h` : '-'}
                        </span>
                      </td>
                      <td className="p-4">
                        {attendance.isLate && attendance.lateMinutes ? (
                          <span className="text-sm font-bold text-orange-600">
                            {attendance.lateMinutes} min
                          </span>
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="text-sm text-slate-600">
                          {attendance.notes || '-'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}