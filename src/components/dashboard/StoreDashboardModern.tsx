'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { 
  Store01Icon, ChartUpIcon, ChartDownIcon, DollarCircleIcon, 
  ShoppingCart01Icon, PackageIcon, BarChartIcon,
  ArrowDown01Icon, ShoppingBasket01Icon, MoneyBag02Icon,
  Calculator01Icon, ChartLineData03Icon
} from 'hugeicons-react';
import { useAuth } from '@/context/auth-context';
import { Skeleton } from '@/components/ui/skeleton';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface DashboardStats {
  totalSales: number;
  totalRevenue: number;
  totalCost: number;
  totalProfit: number;
  profitMargin: number;
  totalOrders: number;
  averageTicket: number;
  topProducts: Array<{
    id: string;
    name: string;
    quantity: number;
    revenue: number;
    cost: number;
    profit: number;
  }>;
  salesByBranch: Array<{
    branchId: string;
    branchName: string;
    sales: number;
    revenue: number;
    cost: number;
    profit: number;
    orders: number;
  }>;
  todayVsYesterday: {
    revenue: number;
    orders: number;
    profit: number;
    revenueChange: number;
    ordersChange: number;
    profitChange: number;
  };
  dailyTrend: Array<{
    date: string;
    revenue: number;
    cost: number;
    profit: number;
  }>;
}

export default function StoreDashboardModern() {
  const { user, role } = useAuth();
  const isOwner = role === 'OWNER' || role === 'SUPER_ADMIN';
  
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [showBranchFilter, setShowBranchFilter] = useState(false);

  const { data: stats, isLoading, error } = useSWR<DashboardStats>(
    `/api/dashboard/stats?range=${dateRange}&branch=${selectedBranch}`,
    fetcher,
    { 
      refreshInterval: 30000,
      shouldRetryOnError: false,
      revalidateOnFocus: false
    }
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

  if (isLoading) {
    return (
      <div className="flex flex-col h-full w-full gap-5 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-9 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array(4).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // Si hay error o no hay stats, mostrar mensaje
  if (error || !stats) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
          <Store01Icon className="w-8 h-8 text-amber-600" />
        </div>
        <div className="text-center max-w-md">
          <h2 className="text-xl font-black text-slate-900 mb-2">No se pudieron cargar las estadísticas</h2>
          <p className="text-slate-600 mb-4">
            {error ? 'Puede que no tengas una sucursal asignada o haya un problema de conexión.' : 'Verifica tu conexión o contacta al administrador.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  // Valores por defecto para evitar errores de undefined
  const safeStats = {
    totalSales: stats?.totalSales ?? 0,
    totalRevenue: stats?.totalRevenue ?? 0,
    totalCost: stats?.totalCost ?? 0,
    totalProfit: stats?.totalProfit ?? 0,
    profitMargin: stats?.profitMargin ?? 0,
    totalOrders: stats?.totalOrders ?? 0,
    averageTicket: stats?.averageTicket ?? 0,
    topProducts: stats?.topProducts ?? [],
    salesByBranch: stats?.salesByBranch ?? [],
    todayVsYesterday: stats?.todayVsYesterday ?? {
      revenue: 0,
      orders: 0,
      profit: 0,
      revenueChange: 0,
      ordersChange: 0,
      profitChange: 0
    }
  };

  return (
    <div className="flex flex-col h-full w-full gap-5 animate-in fade-in duration-200">
      
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Dashboard</h1>
          <BarChartIcon className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de rango */}
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar shrink-0">
            <button
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                dateRange === 'today'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => setDateRange('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                dateRange === 'week'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setDateRange('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                dateRange === 'month'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Mes
            </button>
          </div>

          {/* Filtro de sucursal */}
          {isOwner && branches && branches.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowBranchFilter(!showBranchFilter)}
                className="h-9 px-3 text-xs font-bold bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition-all flex items-center gap-2 border border-transparent hover:border-slate-200"
              >
                <Store01Icon className="w-3.5 h-3.5" strokeWidth={2} />
                <span>
                  {selectedBranch === 'ALL' ? 'Todas' : branches.find((b: any) => b.id === selectedBranch)?.name}
                </span>
                <ArrowDown01Icon className="w-3 h-3" strokeWidth={2} />
              </button>
              
              {showBranchFilter && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowBranchFilter(false)} />
                  <div className="absolute right-0 top-12 w-56 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <button
                      onClick={() => { setSelectedBranch('ALL'); setShowBranchFilter(false); }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                        selectedBranch === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      Todas las sucursales
                    </button>
                    <div className="h-px bg-slate-100 my-1" />
                    {branches.map((branch: any) => (
                      <button
                        key={branch.id}
                        onClick={() => { setSelectedBranch(branch.id); setShowBranchFilter(false); }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                          selectedBranch === branch.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
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

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0 overflow-hidden">
        
        {/* COLUMNA IZQUIERDA - Métricas Financieras */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar">
          
          {/* Ingresos Totales */}
          <div className="bg-white rounded-xl border-2 border-slate-200 p-4 shadow-sm hover:shadow-md transition-all shrink-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                  <DollarCircleIcon className="w-5 h-5 text-blue-600" strokeWidth={2} />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Ingresos</p>
                  <p className="text-[10px] text-slate-400">{dateRangeLabel}</p>
                </div>
              </div>
              {safeStats.todayVsYesterday && (
                <div className={`flex items-center gap-1 px-2 py-1 rounded-lg ${
                  safeStats.todayVsYesterday.revenueChange >= 0 
                    ? 'bg-emerald-50' 
                    : 'bg-red-50'
                }`}>
                  {safeStats.todayVsYesterday.revenueChange >= 0 ? (
                    <ChartUpIcon className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                  ) : (
                    <ChartDownIcon className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                  )}
                  <span className={`text-[10px] font-black ${
                    safeStats.todayVsYesterday.revenueChange >= 0 ? 'text-emerald-700' : 'text-red-700'
                  }`}>
                    {Math.abs(safeStats.todayVsYesterday.revenueChange).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
            <p className="text-3xl font-black text-slate-900 tabular-nums mb-2">
              S/ {safeStats.totalRevenue.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>
          </div>

          {/* Costos y Ganancias - Grid 2 columnas */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {/* Costos */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center mb-2">
                <MoneyBag02Icon className="w-4 h-4 text-red-600" strokeWidth={2} />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Costos</p>
              <p className="text-lg font-black text-slate-900 tabular-nums">S/ {safeStats.totalCost.toFixed(2)}</p>
              <div className="flex items-center gap-1 mt-1.5">
                <div className="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${(safeStats.totalCost / safeStats.totalRevenue) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Ganancias */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center mb-2">
                <ChartLineData03Icon className="w-4 h-4 text-emerald-600" strokeWidth={2} />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ganancias</p>
              <p className="text-lg font-black text-emerald-600 tabular-nums">S/ {safeStats.totalProfit.toFixed(2)}</p>
              {safeStats.todayVsYesterday && (
                <div className="flex items-center gap-1 mt-1.5">
                  {safeStats.todayVsYesterday.profitChange >= 0 ? (
                    <ChartUpIcon className="w-3 h-3 text-emerald-600" strokeWidth={2} />
                  ) : (
                    <ChartDownIcon className="w-3 h-3 text-red-600" strokeWidth={2} />
                  )}
                  <span className={`text-[10px] font-bold ${
                    safeStats.todayVsYesterday.profitChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {Math.abs(safeStats.todayVsYesterday.profitChange).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Margen y Ventas */}
          <div className="grid grid-cols-2 gap-3 shrink-0">
            {/* Margen de Ganancia */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mb-2">
                <Calculator01Icon className="w-4 h-4 text-purple-600" strokeWidth={2} />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Margen</p>
              <p className="text-xl font-black text-slate-900 tabular-nums">{safeStats.profitMargin.toFixed(1)}%</p>
              <p className="text-[9px] text-slate-400 mt-1">de ganancia</p>
            </div>

            {/* Órdenes */}
            <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm hover:shadow-md transition-all">
              <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center mb-2">
                <ShoppingCart01Icon className="w-4 h-4 text-amber-600" strokeWidth={2} />
              </div>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Ventas</p>
              <p className="text-xl font-black text-slate-900 tabular-nums">{safeStats.totalOrders}</p>
              {safeStats.todayVsYesterday && (
                <div className="flex items-center gap-1 mt-1">
                  {safeStats.todayVsYesterday.ordersChange >= 0 ? (
                    <ChartUpIcon className="w-3 h-3 text-emerald-600" strokeWidth={2} />
                  ) : (
                    <ChartDownIcon className="w-3 h-3 text-red-600" strokeWidth={2} />
                  )}
                  <span className={`text-[9px] font-bold ${
                    safeStats.todayVsYesterday.ordersChange >= 0 ? 'text-emerald-600' : 'text-red-600'
                  }`}>
                    {Math.abs(safeStats.todayVsYesterday.ordersChange).toFixed(1)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Balance Financiero */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 p-4 shadow-sm shrink-0">
            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BarChartIcon className="w-3.5 h-3.5" strokeWidth={2} />
              Balance Financiero
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Ingresos</span>
                <span className="text-sm font-black text-blue-600">S/ {safeStats.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-600">Costos</span>
                <span className="text-sm font-black text-red-600">- S/ {safeStats.totalCost.toFixed(2)}</span>
              </div>
              <div className="h-px bg-slate-300" />
              <div className="flex items-center justify-between">
                <span className="text-sm font-black text-slate-900">Ganancia Neta</span>
                <span className="text-base font-black text-emerald-600">S/ {safeStats.totalProfit.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA CENTRAL - Top Productos */}
        <div className="bg-white rounded-xl border-2 border-slate-200 p-4 shadow-sm hover:shadow-md transition-all flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center">
                <ShoppingBasket01Icon className="w-4 h-4 text-slate-700" strokeWidth={2} />
              </div>
              <div>
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Top Productos</h3>
                <p className="text-[9px] text-slate-500">Por rentabilidad</p>
              </div>
            </div>
            <div className="px-2 py-0.5 bg-slate-100 rounded-lg">
              <span className="text-[9px] font-black text-slate-700">{safeStats.topProducts?.length || 0}</span>
            </div>
          </div>
          
          <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
            {safeStats.topProducts && safeStats.topProducts.length > 0 ? (
              safeStats.topProducts.map((product, index) => {
                const profitMargin = product.revenue > 0 ? ((product.profit / product.revenue) * 100) : 0;
                return (
                  <div key={product.id} className="group relative">
                    {/* Barra de fondo basada en ganancia */}
                    <div 
                      className="absolute inset-0 bg-emerald-50 rounded-lg transition-all"
                      style={{ width: `${(product.profit / safeStats.totalProfit) * 100}%` }}
                    />
                    
                    {/* Contenido */}
                    <div className="relative flex items-center gap-2 p-2 rounded-lg hover:bg-slate-50/50 transition-all">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                        index === 0 ? 'bg-amber-100 text-amber-700' :
                        index === 1 ? 'bg-slate-200 text-slate-700' :
                        index === 2 ? 'bg-orange-100 text-orange-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        #{index + 1}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-900 truncate leading-tight">{product.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] text-slate-500 font-semibold">{product.quantity} uds</span>
                          <span className="text-[9px] text-slate-400">·</span>
                          <span className="text-[9px] text-emerald-600 font-bold">{profitMargin.toFixed(0)}%</span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-emerald-600 tabular-nums">+S/ {product.profit.toFixed(2)}</p>
                        <p className="text-[9px] text-slate-400">S/ {product.revenue.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400">
                <PackageIcon className="w-10 h-10 mb-2 opacity-20" strokeWidth={1.5} />
                <p className="text-xs font-medium">Sin datos disponibles</p>
              </div>
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA - Adaptativa según Rol */}
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto custom-scrollbar">
          
          {/* Ventas por Sucursal - Solo para Owners con múltiples sucursales */}
          {isOwner && safeStats.salesByBranch && safeStats.salesByBranch.length > 1 ? (
            safeStats.salesByBranch.map((branch) => {
              const profitMargin = branch.revenue > 0 ? ((branch.profit / branch.revenue) * 100) : 0;
              return (
                <div key={branch.branchId} className="bg-white rounded-xl border-2 border-slate-200 p-3 shadow-sm hover:shadow-md transition-all shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Store01Icon className="w-3.5 h-3.5 text-slate-600" strokeWidth={2} />
                      <span className="text-xs font-black text-slate-900">{branch.branchName}</span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500">{branch.orders} ventas</span>
                  </div>
                  
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-slate-500">Ingresos</span>
                      <span className="text-xs font-bold text-blue-600">S/ {branch.revenue.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-semibold text-slate-500">Costos</span>
                      <span className="text-xs font-bold text-red-600">S/ {branch.cost.toFixed(2)}</span>
                    </div>
                    <div className="h-px bg-slate-200" />
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700">Ganancia</span>
                      <span className="text-sm font-black text-emerald-600">S/ {branch.profit.toFixed(2)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${profitMargin}%` }}
                      />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-600">{profitMargin.toFixed(0)}%</span>
                  </div>
                </div>
              );
            })
          ) : (
            /* Vista para Managers/Jefes de Tienda - Desglose Detallado */
            <>
              {/* Desglose de Costos */}
              <div className="bg-white rounded-xl border-2 border-slate-200 p-3 shadow-sm hover:shadow-md transition-all shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <MoneyBag02Icon className="w-3.5 h-3.5 text-red-600" strokeWidth={2} />
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Desglose de Costos</h3>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-[10px] font-bold text-slate-900">Costo de Productos</p>
                      <p className="text-[9px] text-slate-500">Vendidos</p>
                    </div>
                    <p className="text-sm font-black text-red-600">S/ {safeStats.totalCost.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-[10px] font-bold text-slate-900">Costo/Venta</p>
                      <p className="text-[9px] text-slate-500">Promedio</p>
                    </div>
                    <p className="text-sm font-black text-slate-700">
                      S/ {safeStats.totalOrders > 0 ? (safeStats.totalCost / safeStats.totalOrders).toFixed(2) : '0.00'}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <div>
                      <p className="text-[10px] font-bold text-slate-900">Ratio C/I</p>
                      <p className="text-[9px] text-slate-500">% ingresos</p>
                    </div>
                    <p className="text-sm font-black text-blue-600">
                      {safeStats.totalRevenue > 0 ? ((safeStats.totalCost / safeStats.totalRevenue) * 100).toFixed(1) : '0'}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Análisis de Rentabilidad */}
              <div className="bg-white rounded-xl border-2 border-slate-200 p-3 shadow-sm hover:shadow-md transition-all shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <ChartLineData03Icon className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} />
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Rentabilidad</h3>
                </div>
                <div className="space-y-2">
                  <div className="p-2 bg-emerald-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-900">Ganancia/Venta</p>
                      <p className="text-sm font-black text-emerald-600">
                        S/ {safeStats.totalOrders > 0 ? (safeStats.totalProfit / safeStats.totalOrders).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5">Promedio por orden</p>
                  </div>
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-900">Ganancia/Producto</p>
                      <p className="text-sm font-black text-purple-600">
                        S/ {safeStats.totalSales > 0 ? (safeStats.totalProfit / safeStats.totalSales).toFixed(2) : '0.00'}
                      </p>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5">Por unidad vendida</p>
                  </div>
                  <div className="p-2 bg-amber-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold text-slate-900">Productos Vendidos</p>
                      <p className="text-sm font-black text-amber-600">{safeStats.totalSales}</p>
                    </div>
                    <p className="text-[9px] text-slate-500 mt-0.5">Unidades totales</p>
                  </div>
                </div>
              </div>

              {/* Resumen del Período */}
              <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl border-2 border-slate-200 p-3 shadow-sm shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <BarChartIcon className="w-3.5 h-3.5 text-slate-600" strokeWidth={2} />
                  <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-wider">Resumen</h3>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-600">Total Órdenes</span>
                    <span className="text-xs font-black text-slate-900">{safeStats.totalOrders}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-600">Ticket Promedio</span>
                    <span className="text-xs font-black text-slate-900">S/ {safeStats.averageTicket.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-600">Items/Venta</span>
                    <span className="text-xs font-black text-slate-900">
                      {safeStats.totalOrders > 0 ? (safeStats.totalSales / safeStats.totalOrders).toFixed(1) : '0'}
                    </span>
                  </div>
                  <div className="h-px bg-slate-300" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-900">Eficiencia</span>
                    <span className="text-sm font-black text-emerald-600">{safeStats.profitMargin.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

