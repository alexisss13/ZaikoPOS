'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowUp01Icon, 
  ArrowDown01Icon, 
  DollarCircleIcon,
  ShoppingBag01Icon,
  PackageIcon,
  Calendar01Icon,
  Clock01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface SalesReportCardProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  branchId: string;
  userId: string;
  categoryId: string;
}

interface SalesSummary {
  totalSales: number;
  totalRevenue: number;
  totalDiscount: number;
  totalItems: number;
  averageTicket: number;
}

interface ChartData {
  date: string;
  sales: number;
  revenue: number;
  items: number;
}

export function SalesReportCard({ dateRange, branchId, userId, categoryId }: SalesReportCardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [reportType, setReportType] = useState('summary');
  const [detailedData, setDetailedData] = useState<any>(null);

  useEffect(() => {
    fetchSalesReport();
  }, [dateRange, branchId, userId, categoryId, reportType]);

  const fetchSalesReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        branchId,
        userId,
        categoryId,
        type: reportType
      });

      const res = await fetch(`/api/reports/sales?${params}`);
      if (!res.ok) throw new Error('Error al cargar reporte');

      const data = await res.json();
      
      if (reportType === 'summary') {
        setSummary(data.summary);
        setChartData(data.chartData || []);
      } else {
        setDetailedData(data);
      }
    } catch (error) {
      console.error('Error al cargar reporte de ventas:', error);
      toast.error('Error al cargar reporte de ventas');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'summary', label: 'Resumen' },
    { id: 'detailed', label: 'Detallado' },
    { id: 'by-product', label: 'Por Producto' },
    { id: 'by-category', label: 'Por Categoría' },
    { id: 'by-payment', label: 'Por Método de Pago' },
    { id: 'by-user', label: 'Por Usuario' },
    { id: 'by-hour', label: 'Por Hora' }
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Cargando reporte de ventas...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2">
        {reportTypes.map((type) => (
          <Button
            key={type.id}
            onClick={() => setReportType(type.id)}
            variant={reportType === type.id ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* Summary View */}
      {reportType === 'summary' && summary && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <ShoppingBag01Icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Ventas</p>
                  <p className="text-lg font-black text-slate-900">{formatNumber(summary.totalSales)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <DollarCircleIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ingresos</p>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(summary.totalRevenue)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <PackageIcon className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Items Vendidos</p>
                  <p className="text-lg font-black text-slate-900">{formatNumber(summary.totalItems)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <ArrowUp01Icon className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ticket Promedio</p>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(summary.averageTicket)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-xl">
                  <ArrowDown01Icon className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Descuentos</p>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(summary.totalDiscount)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Tendencia de Ventas</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {chartData.map((data, index) => {
                  const maxRevenue = Math.max(...chartData.map(d => d.revenue));
                  const height = (data.revenue / maxRevenue) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '200px' }}>
                        <div 
                          className="w-full bg-emerald-500 rounded-t-lg absolute bottom-0 transition-all duration-500"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-bold text-slate-900">{data.sales}</p>
                        <p className="text-xs text-slate-500">{new Date(data.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detailed Views */}
      {reportType !== 'summary' && detailedData && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              {reportTypes.find(t => t.id === reportType)?.label}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            {reportType === 'detailed' && detailedData.sales && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Fecha</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Usuario</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Cliente</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Items</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.sales.map((sale: any) => (
                    <tr key={sale.id} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">
                        {new Date(sale.createdAt).toLocaleString('es-PE')}
                      </td>
                      <td className="p-4 text-sm text-slate-900">{sale.user?.name || 'N/A'}</td>
                      <td className="p-4 text-sm text-slate-900">{sale.customer?.name || 'Cliente general'}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{sale.items.length}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(sale.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'by-product' && detailedData.products && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Producto</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Cantidad</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ventas</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.products.map((product: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{product.productName}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(product.totalQuantity)}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(product.totalSales)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(product.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'by-category' && detailedData.categories && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Categoría</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Cantidad</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ventas</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.categories.map((category: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{category.categoryName}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(category.totalQuantity)}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(category.totalSales)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(category.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'by-payment' && detailedData.paymentMethods && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Método de Pago</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Transacciones</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Monto Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.paymentMethods.map((method: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{method.method}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(method.totalTransactions)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(method.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'by-user' && detailedData.users && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Usuario</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ventas</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.users.map((user: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{user.userName}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(user.totalSales)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(user.totalRevenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'by-hour' && detailedData.hourlyData && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Hora</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ventas</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.hourlyData.map((hour: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{hour.hour}:00</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(hour.sales)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(hour.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}