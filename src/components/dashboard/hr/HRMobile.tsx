'use client';

import { useState } from 'react';
import { 
  UserGroupIcon, 
  ClockIcon, 
  DollarCircleIcon, 
  GiftIcon,
  QrCode01Icon,
  BarCode01Icon,
  ArrowLeft01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { EmployeesMobile } from './EmployeesMobile';
import { AttendanceMobile } from './AttendanceMobile';
import { PayrollMobile } from './PayrollMobile';
import { BonusesMobile } from './BonusesMobile';
import { AdvancesMobile } from './AdvancesMobile';
import { AttendanceScanner } from './AttendanceScanner';

type HRSection = 'main' | 'employees' | 'attendance' | 'payroll' | 'bonuses' | 'advances' | 'scanner';

export function HRMobile() {
  const [activeSection, setActiveSection] = useState<HRSection>('main');

  const sections = [
    {
      id: 'employees' as HRSection,
      title: 'Personal',
      description: 'Gestión de empleados',
      icon: UserGroupIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'attendance' as HRSection,
      title: 'Asistencias',
      description: 'Control de asistencias',
      icon: ClockIcon,
      color: 'bg-emerald-500'
    },
    {
      id: 'payroll' as HRSection,
      title: 'Nóminas',
      description: 'Sueldos y pagos',
      icon: DollarCircleIcon,
      color: 'bg-purple-500'
    },
    {
      id: 'bonuses' as HRSection,
      title: 'Bonos',
      description: 'Bonificaciones',
      icon: GiftIcon,
      color: 'bg-orange-500'
    },
    {
      id: 'advances' as HRSection,
      title: 'Adelantos',
      description: 'Adelantos de sueldo',
      icon: DollarCircleIcon,
      color: 'bg-red-500'
    }
  ];

  if (activeSection === 'employees') {
    return <EmployeesMobile onClose={() => setActiveSection('main')} />;
  }

  if (activeSection === 'attendance') {
    return <AttendanceMobile onClose={() => setActiveSection('main')} />;
  }

  if (activeSection === 'payroll') {
    return <PayrollMobile onClose={() => setActiveSection('main')} />;
  }

  if (activeSection === 'bonuses') {
    return <BonusesMobile onClose={() => setActiveSection('main')} />;
  }

  if (activeSection === 'advances') {
    return <AdvancesMobile onClose={() => setActiveSection('main')} />;
  }

  if (activeSection === 'scanner') {
    return <AttendanceScanner onClose={() => setActiveSection('main')} />;
  }

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2 flex-1">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <UserGroupIcon className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Recursos Humanos</h2>
            <p className="text-xs text-slate-500">Gestión de personal</p>
          </div>
        </div>
        <Button
          onClick={() => setActiveSection('scanner')}
          className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-3"
        >
          <QrCode01Icon className="w-3 h-3 mr-1" />
          Marcar
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="p-4 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-2 gap-3">
          <Button
            onClick={() => setActiveSection('scanner')}
            className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
          >
            <QrCode01Icon className="w-4 h-4" />
            Marcar Asistencia
          </Button>
          <Button
            onClick={() => setActiveSection('attendance')}
            variant="outline"
            className="h-12 rounded-xl flex items-center justify-center gap-2"
          >
            <ClockIcon className="w-4 h-4" />
            Ver Asistencias
          </Button>
        </div>
      </div>

      {/* Sections Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-4">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-slate-200 active:scale-95 transition-all"
              >
                <div className={`p-3 rounded-xl ${section.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <h3 className="font-bold text-slate-900">{section.title}</h3>
                  <p className="text-sm text-slate-600">{section.description}</p>
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center">
                  <ArrowLeft01Icon className="w-3 h-3 text-slate-400 rotate-180" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}