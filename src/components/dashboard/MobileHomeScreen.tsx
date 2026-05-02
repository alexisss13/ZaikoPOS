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
  ArrowRight01Icon,
  DollarCircleIcon,
  ChartUpIcon,
  ShoppingBag01Icon,
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

export function MobileHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();

  // Obtener datos del dashboard
  const { data: stats, isLoading } = useSWR<DashboardStats>('/api/dashboard/stats', fetcher, {
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
    { title: 'Productos', desc: 'Gestionar inventario', icon: PackageIcon, href: '/dashboard/products', color: 'from-blue-500 to-blue-600', img: '/vendedorapos.png' },
    { title: 'Compras', desc: 'Registrar compras', icon: ShoppingCart01Icon, href: '/dashboard/purchases', color: 'from-purple-500 to-purple-600', img: '/vendedoracompras.jpg' },
    { title: 'Reportes', desc: 'Ver estadísticas', icon: Analytics01Icon, href: '/dashboard/reports', color: 'from-orange-500 to-orange-600', img: '/vendedora.jpg' },
    { title: 'Inventario', desc: 'Control de stock', icon: PackageDeliveredIcon, href: '/dashboard/inventory', color: 'from-cyan-500 to-cyan-600', img: '/vendedorainventario.png' },
  ];

  if (isLoading) {
    return (
      <div className="w-full space-y-4">
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-lg p-6 animate-pulse">
          <div className="h-6 bg-white/10 rounded-lg w-48 mb-2" />
          <div className="h-4 bg-white/10 rounded w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 pb-4">
      
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl">
      {/* Patrón de puntos de fondo */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="absolute inset-0" 
          style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} 
        />
      </div>

      {/* ARREGLO: Aumentamos el alto a 120% y el ancho a 55% para forzar que la imagen crezca.
          Se ancla abajo y a la derecha. */}
      <div className="absolute bottom-0 right-0 w-[55%] sm:w-[50%] h-[120%] z-0 pointer-events-none">
        <Image
          src="/vendedora.png"
          alt="Vender"
          fill
          className="object-contain object-bottom sm:object-right-bottom drop-shadow-xl"
          priority
        />
      </div>
            
      {/* Contenido Izquierdo - Ancho ajustado para que no choque con la imagen más grande */}
      <div className="relative z-10 flex flex-col justify-center p-5 min-h-[220px] w-[60%] sm:w-[55%] space-y-4">
        
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 w-fit">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] font-bold text-white/90 tracking-wide">En línea</span>
        </div>
        
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-white leading-tight tracking-tight">
            Bienvenido,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
              {user?.name?.split(' ')[0]}
            </span>
          </h1>
          <p className="text-xs text-slate-300 font-semibold italic">
            {getRoleName(user?.role || '')}
          </p>
        </div>

        {/* Botón de Acción Principal */}
        <button
          onClick={() => router.push('/dashboard/pos')}
          className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 active:from-emerald-600 active:to-emerald-700 transition-all duration-200 shadow-lg active:scale-[0.97] w-[full] max-w-[220px] mr-8"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-active:translate-x-[200%] transition-transform duration-700" />
          
          <div className="relative z-10 flex items-center justify-between px-4 py-2.5">
            <div className="text-left">
              <p className="text-base font-black text-white tracking-tight">
                Vender
              </p>
            </div>
            <ArrowRight01Icon 
              className="w-5 h-5 text-white" 
              strokeWidth={2.5} 
            />
          </div>
        </button>
      </div>
    </div>

      {/* Barra Compacta de Ventas y Ganancia */}
      <div className="space-y-3">
        
        {/* Ventas Hoy */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-sm active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm">
              <DollarCircleIcon className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Ventas Hoy</p>
              <p className="text-xl font-black text-blue-900 tabular-nums">
                S/ {safeStats.todaySales.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
              safeStats.salesChange >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-100 text-red-700'
            }`}>
              {safeStats.salesChange >= 0 ? '+' : ''}{safeStats.salesChange.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Ganancia */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-200 shadow-sm active:scale-[0.98] transition-transform">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white shadow-sm">
              <ChartUpIcon className="w-5 h-5 text-emerald-600" strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
                Ganancia • {safeStats.profitMargin.toFixed(1)}% Margen
              </p>
              <p className="text-xl font-black text-emerald-900 tabular-nums">
                S/ {safeStats.todayProfit.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${
              safeStats.profitChange >= 0 ? 'bg-emerald-200 text-emerald-800' : 'bg-red-100 text-red-700'
            }`}>
              {safeStats.profitChange >= 0 ? '+' : ''}{safeStats.profitChange.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div>
        <h2 className="text-base font-black text-slate-900 mb-3 flex items-center gap-2">
          <div className="w-1 h-5 bg-slate-900 rounded-full" />
          Acciones Rápidas
        </h2>
        
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.href}
                onClick={() => router.push(action.href)}
                className="group relative overflow-hidden rounded-2xl bg-white border-2 border-slate-200 active:border-slate-300 p-4 shadow-sm active:scale-[0.97] transition-all"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  transform: 'translateZ(0)',
                }}
              >
                {/* Imagen de fondo con overlay - Solo visible en hover/active */}
                <div className="absolute inset-0 opacity-0 group-active:opacity-100 transition-opacity duration-300">
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
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${action.color} w-fit mb-3 shadow-lg`}>
                    <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  </div>
                  
                  <div className="mt-auto">
                    <h3 className="text-sm font-black text-slate-900 group-active:text-white transition-colors mb-0.5">
                      {action.title}
                    </h3>
                    <p className="text-xs font-semibold text-slate-500 group-active:text-white/80 transition-colors">
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
  );
}
