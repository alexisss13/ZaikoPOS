'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import Image from 'next/image';
import useSWR from 'swr';
import {
  PackageIcon,
  ShoppingCart01Icon,
  Analytics01Icon,
  PackageDeliveredIcon,
  ChartUpIcon,
  ChartDownIcon,
  ArrowRight01Icon,
  DollarCircleIcon
} from 'hugeicons-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface DashboardStats {
  todaySales: number;
  todayProfit: number;
  profitMargin: number;
  salesChange: number;
  profitChange: number;
  cashSessionStatus: 'OPEN' | 'CLOSED' | null;
}

export default function StoreDashboardModern() {
  const router = useRouter();
  const { name, role } = useAuth();

  // Obtener datos del dashboard
  const { data: stats } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher, {
    refreshInterval: 30000,
  });

  // Valores por defecto para evitar errores
  const safeStats = {
    todaySales: stats?.todaySales ?? 0,
    todayProfit: stats?.todayProfit ?? 0,
    profitMargin: stats?.profitMargin ?? 0,
    salesChange: stats?.salesChange ?? 0,
    profitChange: stats?.profitChange ?? 0,
    cashSessionStatus: stats?.cashSessionStatus ?? null,
  };

  const getRoleName = (role: string) => {
    const roles: Record<string, string> = {
      SUPER_ADMIN: 'Administrador del Sistema',
      OWNER: 'Propietario',
      MANAGER: 'Gerente',
      CASHIER: 'Cajero',
      WAREHOUSE: 'Almacén'
    };
    return roles[role] || role;
  };

  // Acciones rápidas con imágenes - Solo lo esencial
  const quickActions = [
    { title: 'Productos', desc: 'Gestionar inventario', icon: PackageIcon, href: '/dashboard/products', color: 'bg-blue-500', img: '/vendedorapos.jpg' },
    { title: 'Compras', desc: 'Registrar compras', icon: ShoppingCart01Icon, href: '/dashboard/purchases', color: 'bg-purple-500', img: '/vendedoracompras.jpg' },
    { title: 'Reportes', desc: 'Ver estadísticas', icon: Analytics01Icon, href: '/dashboard/reports', color: 'bg-orange-500', img: '/vendedora.jpg' },
    { title: 'Inventario', desc: 'Control de stock', icon: PackageDeliveredIcon, href: '/dashboard/inventory', color: 'bg-cyan-500', img: '/vendedorainventario.png' },
  ];

  const getColorClasses = (color: string) => {
    return color; // Retornar directamente la clase de color
  };

  return (
    <div className="w-full h-full overflow-y-auto pb-6 px-1">
      <div className="max-w-[1400px] mx-auto space-y-6">
        
        {/* Tarjeta de Bienvenida Superior */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl border border-slate-700">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
          </div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-stretch min-h-[280px]">
            
            {/* Contenido Izquierdo - Texto y Botón */}
            <div className="flex-1 p-8 lg:p-10 flex flex-col justify-center space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 w-fit">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-bold text-white/90 tracking-wide">En línea</span>
              </div>
              
              <div className="space-y-3">
                <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white leading-tight tracking-tight">
                  Buenos días,{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
                    {name}
                  </span>
                </h1>
                <p className="text-base lg:text-lg text-slate-300 font-semibold italic">
                  {getRoleName(role)}
                </p>
              </div>
              

              {/* Botón de Acción Principal */}
              <button
                onClick={() => router.push('/dashboard/pos')}
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/50 hover:scale-[1.02] w-fit"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
                
                <div className="relative z-10 flex items-center gap-4 px-7 py-3">
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">
                      Acción Rápida
                    </p>
                    <p className="text-2xl lg:text-2xl font-black text-white tracking-tight">
                      Vender Ahora
                    </p>
                  </div>
                  <ArrowRight01Icon 
                    className="w-8 h-8 text-white group-hover:translate-x-2 transition-transform" 
                    strokeWidth={2.5} 
                  />
                </div>
              </button>
            </div>

            {/* Imagen Derecha - Sin padding, altura completa */}
            <div className="relative w-full lg:w-[320px] xl:w-[380px] shrink-0">
              <div className="absolute inset-0  from-transparent via-slate-900/20 to-slate-900/60 z-10" />
              <Image
                src="/vendedora.png"
                alt="Vender"
                fill
                className="object-cover object-center"
                priority
              />
            </div>
          </div>
        </div>

        {/* Barra Compacta de Ventas y Ganancia */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Ventas Hoy */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <DollarCircleIcon className="w-6 h-6 text-blue-600" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Ventas Hoy</p>
                <p className="text-2xl font-black text-blue-900 tabular-nums">
                  S/ {safeStats.todaySales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${
                safeStats.salesChange >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-100 text-red-700'
              }`}>
                {safeStats.salesChange >= 0 ? '+' : ''}{safeStats.salesChange.toFixed(1)}%
              </div>
              <button
                onClick={() => router.push('/dashboard/reports')}
                className="p-2 rounded-xl bg-white hover:bg-blue-600 text-blue-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
              >
                <ArrowRight01Icon className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>

          {/* Ganancia */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 hover:shadow-lg transition-all group">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-white shadow-sm">
                <ChartUpIcon className="w-6 h-6 text-emerald-600" strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Ganancia • {safeStats.profitMargin.toFixed(1)}% Margen
                </p>
                <p className="text-2xl font-black text-emerald-900 tabular-nums">
                  S/ {safeStats.todayProfit.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${
                safeStats.profitChange >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-100 text-red-700'
              }`}>
                {safeStats.profitChange >= 0 ? '+' : ''}{safeStats.profitChange.toFixed(1)}%
              </div>
              <button
                onClick={() => router.push('/dashboard/accounting')}
                className="p-2 rounded-xl bg-white hover:bg-emerald-600 text-emerald-600 hover:text-white transition-all shadow-sm group-hover:scale-110"
              >
                <ArrowRight01Icon className="w-4 h-4" strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-2">
            <div className="w-1 h-6 bg-slate-900 rounded-full" />
            Acciones Rápidas
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 hover:border-slate-300 p-5 shadow-sm hover:shadow-xl transition-all hover:scale-105"
                >
                  {/* Imagen de fondo con overlay */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 to-black/40 z-10" />
                    <Image
                      src={action.img}
                      alt={action.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  
                  {/* Contenido */}
                  <div className="relative z-20 flex flex-col h-full">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${getColorClasses(action.color)} w-fit mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" strokeWidth={2.5} />
                    </div>
                    
                    <div className="mt-auto">
                      <h3 className="text-lg font-black text-slate-900 group-hover:text-white transition-colors mb-1">
                        {action.title}
                      </h3>
                      <p className="text-xs font-semibold text-slate-500 group-hover:text-white/80 transition-colors">
                        {action.desc}
                      </p>
                    </div>
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
