'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  ShoppingCart01Icon,
  PackageIcon,
  Money01Icon,
  ChartLineData01Icon,
  Store01Icon,
  AlertCircleIcon,
  ChartUpIcon,
  Calendar03Icon,
  ArrowRight01Icon,
  ShoppingBag01Icon,
  PackageDeliveredIcon,
  UserAccountIcon,
  ShoppingCart02Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  FilterIcon,
} from 'hugeicons-react';

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  lowStockCount: number;
  currentCash: number;
  hasCashOpen: boolean;
  totalRevenue?: number;
  totalProfit?: number;
  profitMargin?: number;
}

export function MobileHomeScreen() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/dashboard/stats?range=today');
      const data = await response.json();
      setStats({
        todaySales: data.totalRevenue || 0,
        todayTransactions: data.totalOrders || 0,
        lowStockCount: 0, // TODO: Implementar
        currentCash: 0, // TODO: Implementar
        hasCashOpen: false, // TODO: Implementar
        totalRevenue: data.totalRevenue || 0,
        totalProfit: data.totalProfit || 0,
        profitMargin: data.profitMargin || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  if (loading) {
    return (
      <div 
        className="flex flex-col h-full w-full overflow-y-auto pb-24 bg-slate-50"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
          contain: 'layout style paint',
        }}
      >
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 pt-6 pb-8 rounded-b-[2rem] shadow-lg">
          <div className="flex flex-col gap-1.5 mb-6">
            <div className="h-6 bg-white/10 rounded-lg w-48 animate-pulse" />
            <div className="h-4 bg-white/10 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 h-28 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="flex flex-col h-full w-full overflow-y-auto pb-24 bg-slate-50"
      style={{
        WebkitTapHighlightColor: 'transparent',
        transform: 'translateZ(0)',
        contain: 'layout style paint',
      }}
    >
      {/* Header con gradiente */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4 pt-6 pb-8 rounded-b-[2rem] shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              {getGreeting()}
            </h1>
            <p className="text-sm text-slate-300">{user?.name?.split(' ')[0]} 👋</p>
          </div>
          <button
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <FilterIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Stats Cards - Dentro del header */}
        <div className="grid grid-cols-2 gap-3">
          {/* Ventas de Hoy */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <ArrowUp01Icon className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide">Ventas Hoy</span>
            </div>
            <p className="text-2xl font-bold text-white">S/ {(stats?.todaySales ?? 0).toFixed(2)}</p>
            <p className="text-[10px] text-white/60 mt-1">{stats?.todayTransactions ?? 0} transacciones</p>
          </div>

          {/* Ganancia */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <ChartUpIcon className="w-4 h-4 text-blue-400" />
              </div>
              <span className="text-[10px] font-bold text-white/70 uppercase tracking-wide">Ganancia</span>
            </div>
            <p className="text-2xl font-bold text-white">S/ {(stats?.totalProfit ?? 0).toFixed(2)}</p>
            <p className="text-[10px] text-white/60 mt-1">{(stats?.profitMargin ?? 0).toFixed(1)}% margen</p>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="px-4 py-6 space-y-6">
        {/* Estado de Caja */}
        <div className={`rounded-2xl p-5 shadow-lg ${
          stats?.hasCashOpen 
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600' 
            : 'bg-gradient-to-br from-amber-500 to-amber-600'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Money01Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-white/90">Estado de Caja</span>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
              stats?.hasCashOpen 
                ? 'bg-white/20 text-white/90' 
                : 'bg-white/20 text-white/90'
            }`}>
              {stats?.hasCashOpen ? '✓ Abierta' : '✗ Cerrada'}
            </span>
          </div>
          <p className="text-3xl font-bold text-white mb-1">S/ {(stats?.currentCash ?? 0).toFixed(2)}</p>
          <p className="text-xs text-white/70">
            {stats?.hasCashOpen ? 'Efectivo disponible' : 'Abre caja para vender'}
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 px-1">Acciones Rápidas</h2>
          <div className="grid grid-cols-2 gap-3">
            {/* Nueva Venta */}
            <Link
              href="/dashboard/pos"
              className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-4 shadow-lg active:scale-[0.97] transition-transform"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)',
              }}
            >
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-3">
                <ShoppingBag01Icon className="w-6 h-6 text-white" />
              </div>
              <p className="font-bold text-sm text-white mb-0.5">Nueva Venta</p>
              <p className="text-xs text-white/80">Abrir POS</p>
            </Link>

            {/* Productos */}
            <Link
              href="/dashboard/products"
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-[0.97] transition-transform"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)',
              }}
            >
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-3">
                <PackageIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="font-bold text-sm text-slate-900 mb-0.5">Productos</p>
              <p className="text-xs text-slate-500">Ver catálogo</p>
            </Link>

            {/* Inventario */}
            <Link
              href="/dashboard/inventory"
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-[0.97] transition-transform"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)',
              }}
            >
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-3">
                <PackageDeliveredIcon className="w-6 h-6 text-purple-600" />
              </div>
              <p className="font-bold text-sm text-slate-900 mb-0.5">Inventario</p>
              <p className="text-xs text-slate-500">Gestionar stock</p>
            </Link>

            {/* Corte de Caja */}
            <Link
              href="/dashboard/cash-sessions"
              className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 active:scale-[0.97] transition-transform"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)',
              }}
            >
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center mb-3">
                <UserAccountIcon className="w-6 h-6 text-amber-600" />
              </div>
              <p className="font-bold text-sm text-slate-900 mb-0.5">Corte de Caja</p>
              <p className="text-xs text-slate-500">Ver turnos</p>
            </Link>
          </div>
        </div>

        {/* Más Opciones */}
        <div>
          <h2 className="text-sm font-bold text-slate-900 mb-3 px-1">Más Opciones</h2>
          <div className="space-y-2.5">
            {/* Compras */}
            <Link
              href="/dashboard/purchases"
              className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)',
              }}
            >
              <div className="w-11 h-11 rounded-xl bg-orange-50 flex items-center justify-center shrink-0">
                <ShoppingCart02Icon className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 mb-0.5">Compras</p>
                <p className="text-xs text-slate-500">Gestionar órdenes</p>
              </div>
              <ArrowRight01Icon className="w-5 h-5 text-slate-400 shrink-0" />
            </Link>

            {/* Dashboard Completo */}
            <Link
              href="/dashboard"
              className="w-full bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm active:scale-[0.98] transition-transform"
              style={{ 
                WebkitTapHighlightColor: 'transparent',
                transform: 'translateZ(0)',
              }}
            >
              <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <ChartLineData01Icon className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-900 mb-0.5">Dashboard Completo</p>
                <p className="text-xs text-slate-500">Ver reportes detallados</p>
              </div>
              <ArrowRight01Icon className="w-5 h-5 text-slate-400 shrink-0" />
            </Link>
          </div>
        </div>

        {/* Alertas */}
        {stats && stats.lowStockCount > 0 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
              <AlertCircleIcon className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm text-amber-900 mb-1">Atención requerida</p>
              <p className="text-xs text-amber-700 leading-relaxed mb-2">
                Tienes {stats.lowStockCount} producto{stats.lowStockCount !== 1 ? 's' : ''} con stock bajo.
              </p>
              <Link 
                href="/dashboard/inventory" 
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 hover:text-amber-700"
              >
                Ver ahora
                <ArrowRight01Icon className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
