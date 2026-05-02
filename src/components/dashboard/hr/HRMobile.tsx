'use client';

import { useState } from 'react';
import { 
  UserGroupIcon, 
  Clock01Icon, 
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
      icon: Clock01Icon,
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
    <div className="flex flex-col h-full w-full">
      {/* Header con formato consistente */}
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-slate-100 rounded-xl">
              <UserGroupIcon className="w-5 h-5 text-slate-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">Recursos Humanos</h1>
              <p className="text-xs text-slate-500 font-semibold">Gestión de personal</p>
            </div>
          </div>
          <Button
            onClick={() => setActiveSection('scanner')}
            className="h-10 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-3"
          >
            <QrCode01Icon className="w-3.5 h-3.5 mr-1.5" strokeWidth={2} />
            Marcar
          </Button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30 pb-24">
        {/* Quick Actions */}
        <div className="p-4 border-b border-slate-200">
          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={() => setActiveSection('scanner')}
              className="h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl flex items-center justify-center gap-2"
            >
              <QrCode01Icon className="w-4 h-4" strokeWidth={2} />
              Marcar Asistencia
            </Button>
            <Button
              onClick={() => setActiveSection('attendance')}
              variant="outline"
              className="h-12 rounded-xl flex items-center justify-center gap-2"
            >
              <Clock01Icon className="w-4 h-4" strokeWidth={2} />
              Ver Asistencias
            </Button>
          </div>
        </div>

        {/* Sections Grid */}
        <div className="p-4">
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
    </div>
  );
}