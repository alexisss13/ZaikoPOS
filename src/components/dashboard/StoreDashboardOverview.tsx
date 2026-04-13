'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { 
  Store, TrendingUp, TrendingDown, DollarSign, ShoppingCart, Package, 
  Users, AlertTriangle, Loader2, Calendar, ArrowUpRight, ArrowDownRight,
  Banknote, CreditCard, Wallet, BarChart3, Filter, ChevronDown
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
  }>;
  salesByBranch: Array<{
    branchId: string;
    branchName: string;
    sales: number;
    revenue: number;
    orders: number;
  }>;
  salesByPaymentMethod: Record<string, number>;
  lowStockProducts: Array<{
    id: string;
    name: string;
    stock: number;
    minStock: number;
    branchName: string;
  }>;
  recentSales: Array<{
    id: string;
    code: string;
    total: number;
    createdAt: string;
    branchName: string;
  }>;
  todayVsYesterday: {
    revenue: number;
    orders: number;
    revenueChange: number;
    ordersChange: number;
  };
}

export default function StoreDashboardOverview() {
  const { user, role } = useAuth();
  const isOwner = role === 'OWNER' || role === 'SUPER_ADMIN';
  
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [showBranchFilter, setShowBranchFilter] = useState(false);

  const { data: stats, isLoading } = useSWR<DashboardStats>(
    `/api/dashboard/stats?range=${dateRange}&branch=${selectedBranch}`,
    fetcher,
    { refreshInterval: 30000 }
  );

  const { data: branches } = useSWR('/api/branches', fetcher);

  const dateRangeLabel = useMemo(() => {
    switch (dateRange) {
      case 'today': return 'Hoy';
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      default: return 'Hoy';
    }
  }, [dateRange]);

  if (isLoading || !stats) {
    return (
      <div className="flex flex-col h-full w-full gap-5 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  const paymentMethodIcons: Record<string, any> = {
    CASH: Banknote,
    CARD: CreditCard,
    YAPE: Wallet,
    PLIN: Wallet,
    TRANSFER: ArrowUpRight,
  };

  return (
    <div className="flex flex-col h-full w-full gap-5 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Dashboard</h1>
          <BarChart3 className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>

        <div className="flex items-center gap-2">
          {/* Filtro de rango */}
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                dateRange === 'today'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                dateRange === 'week'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                dateRange === 'month'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Mes
            </button>
          </div>

          {/* Filtro de sucursal (solo para owner) */}
          {isOwner && branches && branches.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowBranchFilter(!showBranchFilter)}
                className="h-9 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-2"
              >
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-700">
                  {selectedBranch === 'ALL' ? 'Todas las sucursales' : branches.find((b: any) => b.id === selectedBranch)?.name}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
              
              {showBranchFilter && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBranchFilter(false)} />
                  <div className="absolute right-0 top-11 w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => { setSelectedBranch('ALL'); setShowBranchFilter(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        selectedBranch === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Todas las sucursales
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    {branches.map((branch: any) => (
                      <button
                        key={branch.id}
                        onClick={() => { setSelectedBranch(branch.id); setShowBranchFilter(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                          selectedBranch === branch.id ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {branch.name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Ingresos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            {stats.todayVsYesterday && (
              <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                stats.todayVsYesterday.revenueChange >= 0 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {stats.todayVsYesterday.revenueChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(stats.todayVsYesterday.revenueChange).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Ingresos</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums">S/ {stats.totalRevenue.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{dateRangeLabel}</p>
        </div>

        {/* Ventas */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
            {stats.todayVsYesterday && (
              <div className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
                stats.todayVsYesterday.ordersChange >= 0 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-red-50 text-red-700'
              }`}>
                {stats.todayVsYesterday.ordersChange >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(stats.todayVsYesterday.ordersChange).toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Ventas</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.totalOrders}</p>
          <p className="text-[10px] text-slate-500 mt-1">{dateRangeLabel}</p>
        </div>

        {/* Ticket Promedio */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Ticket Promedio</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums">S/ {stats.averageTicket.toFixed(2)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{dateRangeLabel}</p>
        </div>

        {/* Productos Vendidos */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
          </div>
          <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">Productos Vendidos</p>
          <p className="text-2xl font-black text-slate-900 tabular-nums">{stats.totalSales}</p>
          <p className="text-[10px] text-slate-500 mt-1">{dateRangeLabel}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        
        {/* Columna Izquierda */}
        <div className="lg:col-span-2 flex flex-col gap-4 min-h-0">
          
          {/* Ventas por Sucursal */}
          {isOwner && stats.salesByBranch && stats.salesByBranch.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Ventas por Sucursal</h3>
              <div className="space-y-2">
                {stats.salesByBranch.map((branch) => (
                  <div key={branch.branchId} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-white rounded-lg border border-slate-200 flex items-center justify-center">
                        <Store className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-900">{branch.branchName}</p>
                        <p className="text-[10px] text-slate-500">{branch.orders} ventas</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-900 tabular-nums">S/ {branch.revenue.toFixed(2)}</p>
                      <p className="text-[10px] text-slate-500">{((branch.revenue / stats.totalRevenue) * 100).toFixed(1)}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Top Productos */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex-1 min-h-0 flex flex-col">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Productos Más Vendidos</h3>
            <div className="space-y-1 overflow-y-auto flex-1">
              {stats.topProducts && stats.topProducts.length > 0 ? (
                stats.topProducts.map((product, index) => (
                  <div key={product.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-6 h-6 bg-slate-100 rounded-md flex items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold text-slate-600">#{index + 1}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-900 truncate">{product.name}</p>
                        <p className="text-[10px] text-slate-500">{product.quantity} unidades</p>
                      </div>
                    </div>
                    <p className="text-xs font-bold text-slate-900 tabular-nums ml-2">S/ {product.revenue.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <p className="text-xs">No hay datos disponibles</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Columna Derecha */}
        <div className="flex flex-col gap-4 min-h-0">
          
          {/* Métodos de Pago */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Métodos de Pago</h3>
            <div className="space-y-2">
              {stats.salesByPaymentMethod && Object.entries(stats.salesByPaymentMethod).map(([method, amount]) => {
                const Icon = paymentMethodIcons[method] || Wallet;
                const percentage = (amount / stats.totalRevenue) * 100;
                return (
                  <div key={method} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-slate-500" />
                        <span className="text-xs font-medium text-slate-700">{method}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-900 tabular-nums">S/ {amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-900 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stock Bajo */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex-1 min-h-0 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Alertas de Stock</h3>
              {stats.lowStockProducts && stats.lowStockProducts.length > 0 && (
                <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-[9px] font-bold text-red-700">{stats.lowStockProducts.length}</span>
                </div>
              )}
            </div>
            <div className="space-y-1 overflow-y-auto flex-1">
              {stats.lowStockProducts && stats.lowStockProducts.length > 0 ? (
                stats.lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-start gap-2 p-2 bg-red-50 border border-red-100 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900 truncate">{product.name}</p>
                      <p className="text-[10px] text-slate-600">
                        Stock: {product.stock} / Min: {product.minStock}
                      </p>
                      {product.branchName && (
                        <p className="text-[9px] text-slate-500">{product.branchName}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                  <Package className="w-8 h-8 mb-2 opacity-50" />
                  <p className="text-xs">Stock en buen estado</p>
                </div>
              )}
            </div>
          </div>

          {/* Ventas Recientes */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex-1 min-h-0 flex flex-col">
            <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-3">Ventas Recientes</h3>
            <div className="space-y-1 overflow-y-auto flex-1">
              {stats.recentSales && stats.recentSales.length > 0 ? (
                stats.recentSales.map((sale) => (
                  <div key={sale.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg transition-colors border-b border-slate-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-900">{sale.code}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(sale.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                        {sale.branchName && ` • ${sale.branchName}`}
                      </p>
                    </div>
                    <p className="text-xs font-bold text-slate-900 tabular-nums ml-2">S/ {sale.total.toFixed(2)}</p>
                  </div>
                ))
              ) : (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <p className="text-xs">No hay ventas recientes</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}