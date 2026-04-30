'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft01Icon, 
  ClockIcon,
  Calendar01Icon,
  UserIcon,
  CheckmarkCircle01Icon,
  AlertTriangleIcon,
  XmarkIcon,
  FilterIcon
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

interface AttendanceMobileProps {
  onClose: () => void;
}

export function AttendanceMobile({ onClose }: AttendanceMobileProps) {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

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

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return { label: 'Presente', icon: CheckmarkCircle01Icon, color: 'emerald' };
      case 'LATE':
        return { label: 'Tardanza', icon: AlertTriangleIcon, color: 'orange' };
      case 'ABSENT':
        return { label: 'Ausente', icon: XmarkIcon, color: 'red' };
      case 'EXCUSED':
        return { label: 'Justificado', icon: UserIcon, color: 'blue' };
      default:
        return { label: status, icon: ClockIcon, color: 'slate' };
    }
  };

  const stats = {
    present: attendances.filter(a => a.status === 'PRESENT').length,
    late: attendances.filter(a => a.status === 'LATE').length,
    absent: attendances.filter(a => a.status === 'ABSENT').length,
    excused: attendances.filter(a => a.status === 'EXCUSED').length
  };

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
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <ClockIcon className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Asistencias</h2>
            <p className="text-xs text-slate-500">
              {format(new Date(selectedDate), 'dd MMM yyyy', { locale: es })}
            </p>
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
            <label className="block text-xs font-bold text-slate-700 mb-2">Fecha</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">Estado</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="all">Todos</option>
              <option value="PRESENT">Presente</option>
              <option value="LATE">Tardanza</option>
              <option value="ABSENT">Ausente</option>
              <option value="EXCUSED">Justificado</option>
            </select>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-white rounded-xl p-3 text-center">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <CheckmarkCircle01Icon className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-lg font-black text-slate-900">{stats.present}</p>
            <p className="text-xs text-slate-600">Presentes</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <AlertTriangleIcon className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-lg font-black text-slate-900">{stats.late}</p>
            <p className="text-xs text-slate-600">Tarde</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <XmarkIcon className="w-4 h-4 text-red-600" />
            </div>
            <p className="text-lg font-black text-slate-900">{stats.absent}</p>
            <p className="text-xs text-slate-600">Ausentes</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
              <UserIcon className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-lg font-black text-slate-900">{stats.excused}</p>
            <p className="text-xs text-slate-600">Justif.</p>
          </div>
        </div>
      </div>

      {/* Attendance List */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-6 h-6 border-2 border-slate-300 border-t-slate-600 rounded-full"></div>
          </div>
        ) : attendances.length === 0 ? (
          <div className="text-center py-12">
            <ClockIcon className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">No hay registros de asistencia</p>
          </div>
        ) : (
          <div className="space-y-3">
            {attendances.map((attendance) => {
              const statusInfo = getStatusInfo(attendance.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div
                  key={attendance.id}
                  className="bg-white rounded-2xl border border-slate-200 p-4"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-slate-100 rounded-lg">
                      <UserIcon className="w-4 h-4 text-slate-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-slate-900">{attendance.user.name}</h3>
                      {attendance.user.position && (
                        <p className="text-sm text-slate-600">{attendance.user.position}</p>
                      )}
                    </div>
                    <div className={`px-2 py-1 rounded-lg bg-${statusInfo.color}-100 flex items-center gap-1`}>
                      <StatusIcon className={`w-3 h-3 text-${statusInfo.color}-600`} />
                      <span className={`text-xs font-bold text-${statusInfo.color}-700`}>
                        {statusInfo.label}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-600 mb-1">Entrada</p>
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        {attendance.checkIn 
                          ? new Date(attendance.checkIn).toLocaleTimeString('es-PE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : '-'}
                      </p>
                    </div>
                    <div className="bg-slate-50 rounded-xl p-3">
                      <p className="text-xs text-slate-600 mb-1">Salida</p>
                      <p className="text-sm font-bold text-slate-900 font-mono">
                        {attendance.checkOut 
                          ? new Date(attendance.checkOut).toLocaleTimeString('es-PE', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })
                          : '-'}
                      </p>
                    </div>
                  </div>

                  {(attendance.hoursWorked || attendance.isLate) && (
                    <div className="flex gap-3 mt-3 pt-3 border-t border-slate-100">
                      {attendance.hoursWorked && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <ClockIcon className="w-3 h-3" />
                          <span className="text-xs font-bold">{attendance.hoursWorked}h trabajadas</span>
                        </div>
                      )}
                      {attendance.isLate && attendance.lateMinutes && (
                        <div className="flex items-center gap-1 text-orange-600">
                          <AlertTriangleIcon className="w-3 h-3" />
                          <span className="text-xs font-bold">{attendance.lateMinutes} min tarde</span>
                        </div>
                      )}
                    </div>
                  )}

                  {attendance.notes && (
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs text-slate-600">{attendance.notes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}