'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowLeft01Icon, 
  BarChartIcon, 
  Calendar01Icon, 
  Download01Icon,
  FilterIcon,
  PackageIcon,
  ShoppingCart01Icon,
  UserAccountIcon,
  ShoppingBag01Icon,
  ArrowUp01Icon,
  ChartUpIcon,
  ArrowDown01Icon,
  DollarCircleIcon,
  PackageDeliveredIcon,
  ChartDownIcon,
  Alert01Icon,
  Clock01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

type ReportType = 'sales' | 'inventory' | 'purchases' | 'cash-sessions';

interface ReportsMobileProps {
  onClose: () => void;
}

interface DateRange {
  startDate: string;
  endDate: string;
}

export function ReportsMobile({ onClose }: ReportsMobileProps) {
  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 días atrás
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetchFilterData();
    fetchReportData();
  }, [activeReport, dateRange, selectedBranch, selectedUser]);

  const fetchFilterData = async () => {
    try {
      const [branchesRes, usersRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/users')
      ]);

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(branchesData.branches || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }
    } catch (error) {
      console.error('Error al cargar datos de filtros:', error);
    }
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        branchId: selectedBranch,
        userId: selectedUser,
        type: 'summary'
      });

      const res = await fetch(`/api/reports/${activeReport}?${params}`);
      if (!res.ok) throw new Error('Error al cargar reporte');

      const data = await res.json();
      setReportData(data);
    } catch (error) {
      console.error('Error al cargar reporte:', error);
      toast.error('Error al cargar reporte');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    {
      id: 'sales' as ReportType,
      title: 'Ventas',
      description: 'Ingresos y rendimiento',
      icon: ShoppingBag01Icon,
      color: 'bg-emerald-500'
    },
    {
      id: 'inventory' as ReportType,
      title: 'Inventario',
      description: 'Stock y productos',
      icon: PackageDeliveredIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'purchases' as ReportType,
      title: 'Compras',
      description: 'Órdenes y proveedores',
      icon: ShoppingCart01Icon,
      color: 'bg-purple-500'
    },
    {
      id: 'cash-sessions' as ReportType,
      title: 'Cortes',
      description: 'Sesiones de caja',
      icon: UserAccountIcon,
      color: 'bg-orange-500'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-PE').format(num);
  };

  const getQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  if (showFilters) {
    return (
      <div className="fixed inset-0 bg-white z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={() => setShowFilters(false)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Filtros</h2>
            <p className="text-xs text-slate-500">Personaliza tu reporte</p>
          </div>
          <Button
            onClick={() => setShowFilters(false)}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4"
          >
            Aplicar
          </Button>
        </div>

        {/* Filters Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Date Range */}
          <div>
            <Label className="text-sm font-bold text-slate-700 mb-3 block">
              <Calendar01Icon className="w-4 h-4 inline mr-2" />
              Rango de Fechas
            </Label>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => getQuickDateRange(7)}
                  variant="outline"
                  size="sm"
                  className="text-xs h-9"
                >
                  7 días
                </Button>
                <Button
                  onClick={() => getQuickDateRange(30)}
                  variant="outline"
                  size="sm"
                  className="text-xs h-9"
                >
                  30 días
                </Button>
              </div>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-slate-600 mb-1 block">Desde</Label>
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="h-10 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-600 mb-1 block">Hasta</Label>
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="h-10 text-sm"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Branch Filter */}
          <div>
            <Label className="text-sm font-bold text-slate-700 mb-2 block">Sucursal</Label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
            >
              <option value="all">Todas las sucursales</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>{branch.name}</option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          {(activeReport === 'sales' || activeReport === 'cash-sessions') && (
            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">Usuario</Label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="all">Todos los usuarios</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
    );
  }

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
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <BarChartIcon className="w-4 h-4 text-slate-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Reportes</h2>
            <p className="text-xs text-slate-500">Análisis del negocio</p>
          </div>
        </div>
        <Button
          onClick={() => setShowFilters(true)}
          variant="outline"
          className="h-9 rounded-xl text-xs px-3"
        >
          <FilterIcon className="w-3 h-3 mr-1" />
          Filtros
        </Button>
      </div>

      {/* Report Type Selector */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="grid grid-cols-2 gap-3">
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setActiveReport(report.id)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  activeReport === report.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 active:scale-95'
                }`}
              >
                <div className={`p-2 rounded-lg ${
                  activeReport === report.id ? 'bg-white/20' : report.color
                }`}>
                  <Icon className={`w-4 h-4 ${
                    activeReport === report.id ? 'text-white' : 'text-white'
                  }`} />
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm">{report.title}</p>
                  <p className={`text-xs ${
                    activeReport === report.id ? 'text-slate-300' : 'text-slate-500'
                  }`}>
                    {report.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-slate-500">Cargando reporte...</div>
          </div>
        ) : (
          <>
            {/* Sales Report */}
            {activeReport === 'sales' && reportData?.summary && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <ShoppingBag01Icon className="w-3 h-3 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500">Ventas</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatNumber(reportData.summary.totalSales)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <DollarCircleIcon className="w-3 h-3 text-blue-600" />
                      </div>
                      <p className="text-xs text-slate-500">Ingresos</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(reportData.summary.totalRevenue)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <PackageIcon className="w-3 h-3 text-purple-600" />
                      </div>
                      <p className="text-xs text-slate-500">Items</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatNumber(reportData.summary.totalItems)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <ChartUpIcon className="w-3 h-3 text-orange-600" />
                      </div>
                      <p className="text-xs text-slate-500">Promedio</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(reportData.summary.averageTicket)}</p>
                  </div>
                </div>

                {/* Chart */}
                {reportData.chartData && reportData.chartData.length > 0 && (
                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-3">Tendencia</h3>
                    <div className="h-32 flex items-end justify-between gap-1">
                      {reportData.chartData.slice(-7).map((data: any, index: number) => {
                        const maxRevenue = Math.max(...reportData.chartData.slice(-7).map((d: any) => d.revenue));
                        const height = (data.revenue / maxRevenue) * 100;
                        
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-slate-100 rounded-t relative" style={{ height: '100px' }}>
                              <div 
                                className="w-full bg-emerald-500 rounded-t absolute bottom-0 transition-all duration-500"
                                style={{ height: `${height}%` }}
                              />
                            </div>
                            <div className="mt-1 text-center">
                              <p className="text-xs font-bold text-slate-900">{data.sales}</p>
                              <p className="text-xs text-slate-500">{new Date(data.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inventory Report */}
            {activeReport === 'inventory' && reportData?.summary && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <PackageDeliveredIcon className="w-3 h-3 text-blue-600" />
                      </div>
                      <p className="text-xs text-slate-500">Productos</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatNumber(reportData.summary.totalProducts)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-red-100 rounded-lg">
                        <Alert01Icon className="w-3 h-3 text-red-600" />
                      </div>
                      <p className="text-xs text-slate-500">Stock Bajo</p>
                    </div>
                    <p className="text-lg font-black text-red-600">{formatNumber(reportData.summary.lowStockItems)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <DollarCircleIcon className="w-3 h-3 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500">Valor Total</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(reportData.summary.totalSaleValue)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <ChartUpIcon className="w-3 h-3 text-purple-600" />
                      </div>
                      <p className="text-xs text-slate-500">Ganancia</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(reportData.summary.potentialProfit)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Purchases Report */}
            {activeReport === 'purchases' && reportData?.summary && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-purple-100 rounded-lg">
                        <ShoppingCart01Icon className="w-3 h-3 text-purple-600" />
                      </div>
                      <p className="text-xs text-slate-500">Órdenes</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatNumber(reportData.summary.totalOrders)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-blue-100 rounded-lg">
                        <DollarCircleIcon className="w-3 h-3 text-blue-600" />
                      </div>
                      <p className="text-xs text-slate-500">Monto</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(reportData.summary.totalAmount)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <ChartUpIcon className="w-3 h-3 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500">Promedio</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(reportData.summary.averageOrder)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <Alert01Icon className="w-3 h-3 text-orange-600" />
                      </div>
                      <p className="text-xs text-slate-500">Pendientes</p>
                    </div>
                    <p className="text-lg font-black text-orange-600">
                      {formatNumber(reportData.summary.statusStats?.PENDING?.count || 0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Cash Sessions Report */}
            {activeReport === 'cash-sessions' && reportData?.summary && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-orange-100 rounded-lg">
                        <UserAccountIcon className="w-3 h-3 text-orange-600" />
                      </div>
                      <p className="text-xs text-slate-500">Sesiones</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatNumber(reportData.summary.totalSessions)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-emerald-100 rounded-lg">
                        <ChartUpIcon className="w-3 h-3 text-emerald-600" />
                      </div>
                      <p className="text-xs text-slate-500">Ingresos</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(reportData.summary.totalIncome)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-red-100 rounded-lg">
                        <ChartDownIcon className="w-3 h-3 text-red-600" />
                      </div>
                      <p className="text-xs text-slate-500">Gastos</p>
                    </div>
                    <p className="text-lg font-black text-slate-900">{formatCurrency(reportData.summary.totalExpense)}</p>
                  </div>

                  <div className="bg-white rounded-2xl p-4 border border-slate-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-yellow-100 rounded-lg">
                        <Alert01Icon className="w-3 h-3 text-yellow-600" />
                      </div>
                      <p className="text-xs text-slate-500">Discrepancias</p>
                    </div>
                    <p className="text-lg font-black text-yellow-600">{formatNumber(reportData.summary.sessionsWithDiscrepancies)}</p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-slate-200">
                  <h3 className="font-bold text-slate-900 mb-3">Resumen</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Diferencia Total:</span>
                      <span className={`text-sm font-bold ${
                        reportData.summary.totalDifference >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(reportData.summary.totalDifference)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Tasa de Discrepancia:</span>
                      <span className="text-sm font-bold text-red-600">{reportData.summary.discrepancyRate.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}