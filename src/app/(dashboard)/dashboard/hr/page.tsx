'use client';

import { useState, useEffect } from 'react';
import { 
  UserGroupIcon, 
  Clock01Icon, 
  DollarCircleIcon, 
  GiftIcon,
  Search01Icon,
  FilterIcon,
  PlusSignIcon,
  MoreHorizontalIcon,
  Download01Icon,
  QrCode01Icon,
  BarCode01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useResponsive } from '@/hooks/useResponsive';
import { HRMobile } from '@/components/dashboard/hr/HRMobile';
import { EmployeesTab } from '@/components/dashboard/hr/EmployeesTab';
import { AttendanceTab } from '@/components/dashboard/hr/AttendanceTab';
import { PayrollTab } from '@/components/dashboard/hr/PayrollTab';
import { BonusesTab } from '@/components/dashboard/hr/BonusesTab';
import { AdvancesTab } from '@/components/dashboard/hr/AdvancesTab';

type HRTab = 'employees' | 'attendance' | 'payroll' | 'bonuses' | 'advances';

export default function HRPage() {
  const { isMobile } = useResponsive();
  const [activeTab, setActiveTab] = useState<HRTab>('employees');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const tabs = [
    {
      id: 'employees' as HRTab,
      title: 'Personal',
      description: 'Gestión de empleados',
      icon: UserGroupIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'attendance' as HRTab,
      title: 'Asistencias',
      description: 'Control de asistencias',
      icon: Clock01Icon,
      color: 'bg-emerald-500'
    },
    {
      id: 'payroll' as HRTab,
      title: 'Nóminas',
      description: 'Sueldos y pagos',
      icon: DollarCircleIcon,
      color: 'bg-purple-500'
    },
    {
      id: 'bonuses' as HRTab,
      title: 'Bonos',
      description: 'Bonificaciones',
      icon: GiftIcon,
      color: 'bg-orange-500'
    },
    {
      id: 'advances' as HRTab,
      title: 'Adelantos',
      description: 'Adelantos de sueldo',
      icon: DollarCircleIcon,
      color: 'bg-red-500'
    }
  ];

  if (isMobile) {
    return <HRMobile />;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-xl">
            <UserGroupIcon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Recursos Humanos</h1>
            <p className="text-slate-600">Gestión de personal y nóminas</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="h-10 px-4 flex items-center gap-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <MoreHorizontalIcon className="w-4 h-4" />
              Más opciones
            </button>
            {showExportMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50">
                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <Download01Icon className="w-4 h-4 text-slate-400" />
                    Exportar Excel
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <QrCode01Icon className="w-4 h-4 text-slate-400" />
                    Generar QR
                  </button>
                  <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    <BarCode01Icon className="w-4 h-4 text-slate-400" />
                    Generar Códigos
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="grid grid-cols-5 gap-3">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 p-4 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  activeTab === tab.id ? 'bg-white/20' : tab.color
                }`}>
                  <Icon className={`w-4 h-4 ${
                    activeTab === tab.id ? 'text-white' : 'text-white'
                  }`} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{tab.title}</p>
                  <p className={`text-xs ${
                    activeTab === tab.id ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {tab.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-slate-50/30">
        {activeTab === 'employees' && <EmployeesTab />}
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'payroll' && <PayrollTab />}
        {activeTab === 'bonuses' && <BonusesTab />}
        {activeTab === 'advances' && <AdvancesTab />}
      </div>
    </div>
  );
}