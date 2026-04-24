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
} from 'hugeicons-react';

interface DashboardStats {
  todaySales: number;
  todayTransactions: number;
  lowStockCount: number;
  currentCash: number;
  hasCashOpen: boolean;
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
      const response = await fetch('/api/dashboard/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Nueva Venta',
      description: 'Abrir punto de venta',
      icon: ShoppingCart01Icon,
      href: '/dashboard/pos',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Productos',
      description: 'Ver catálogo',
      icon: PackageIcon,
      href: '/dashboard/products',
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Inventario',
      description: 'Gestionar stock',
      icon: Store01Icon,
      href: '/dashboard/inventory',
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Corte de Caja',
      description: 'Ver turnos',
      icon: Money01Icon,
      href: '/dashboard/cash-sessions',
      color: 'bg-amber-500',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días';
    if (hour < 18) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  return (
    <div 
      className="flex flex-col h-full w-full overflow-y-auto pb-24 px-4 pt-4 gap-4"
      style={{
        WebkitTapHighlightColor: 'transparent',
        transform: 'translateZ(0)',
        contain: 'layout style paint',
      }}
    >
      {/* Header */}
      <div className="flex flex-col gap-1.5">
        <h1 className="text-xl font-bold text-slate-900">
          {getGreeting()}, {user?.name?.split(' ')[0]}! 👋
        </h1>
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <Calendar03Icon className="w-3.5 h-3.5" />
          <span>{new Date().toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3.5 h-24 animate-pulse">
              <div className="h-2.5 bg-slate-100 rounded w-2/3 mb-2" />
              <div className="h-5 bg-slate-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {/* Ventas de Hoy */}
          <div 
            className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-3.5 text-white shadow-sm"
            style={{ transform: 'translateZ(0)', contain: 'layout style paint' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <ChartUpIcon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold opacity-90 uppercase tracking-wide">Ventas Hoy</span>
            </div>
            <p className="text-xl font-bold">S/ {(stats?.todaySales ?? 0).toFixed(2)}</p>
            <p className="text-[10px] opacity-75 mt-1">{stats?.todayTransactions ?? 0} transacciones</p>
          </div>

          {/* Caja Actual */}
          <div 
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3.5 text-white shadow-sm"
            style={{ transform: 'translateZ(0)', contain: 'layout style paint' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <Money01Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold opacity-90 uppercase tracking-wide">Caja</span>
            </div>
            <p className="text-xl font-bold">S/ {(stats?.currentCash ?? 0).toFixed(2)}</p>
            <p className="text-[10px] opacity-75 mt-1">
              {stats?.hasCashOpen ? '✓ Abierta' : '✗ Cerrada'}
            </p>
          </div>

          {/* Stock Bajo */}
          <div 
            className="bg-white rounded-2xl border border-amber-200 p-3.5"
            style={{ transform: 'translateZ(0)', contain: 'layout style paint' }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <AlertCircleIcon className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Stock Bajo</span>
            </div>
            <p className="text-xl font-bold text-slate-900">{stats?.lowStockCount ?? 0}</p>
            <p className="text-[10px] text-slate-500 mt-1">productos</p>
          </div>

          {/* Reportes */}
          <Link 
            href="/dashboard" 
            className="bg-white rounded-2xl border border-slate-200 p-3.5"
            style={{ 
              WebkitTapHighlightColor: 'transparent',
              transform: 'translateZ(0)',
              contain: 'layout style paint',
            }}
          >
            <div className="flex items-center gap-1.5 mb-2">
              <ChartLineData01Icon className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Reportes</span>
            </div>
            <p className="text-sm font-bold text-slate-900">Ver Dashboard</p>
            <ArrowRight01Icon className="w-3.5 h-3.5 text-slate-400 mt-1" />
          </Link>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-col gap-2.5">
        <h2 className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">Acciones Rápidas</h2>
        <div className="grid grid-cols-2 gap-2.5">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className="bg-white rounded-2xl border border-slate-100 p-3.5 flex flex-col gap-2.5 shadow-sm"
                style={{ 
                  WebkitTapHighlightColor: 'transparent',
                  transform: 'translateZ(0)',
                  contain: 'layout style paint',
                }}
              >
                <div className={`w-11 h-11 ${action.bgColor} rounded-xl flex items-center justify-center shrink-0`}>
                  <Icon className={`w-5 h-5 ${action.textColor}`} />
                </div>
                <div>
                  <p className="font-bold text-sm text-slate-900 mb-0.5 leading-tight">{action.title}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{action.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tips o Notificaciones */}
      {stats && stats.lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-start gap-2.5">
          <AlertCircleIcon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-xs text-amber-900 mb-1">Atención requerida</p>
            <p className="text-[10px] text-amber-700 leading-relaxed">
              Tienes {stats.lowStockCount} producto{stats.lowStockCount !== 1 ? 's' : ''} con stock bajo. 
              <Link href="/dashboard/inventory" className="font-bold underline ml-1">
                Ver ahora
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
