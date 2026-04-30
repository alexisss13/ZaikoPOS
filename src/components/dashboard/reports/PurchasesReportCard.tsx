'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingCart01Icon, 
  ArrowUp01Icon, 
  DollarCircleIcon,
  UserIcon,
  PackageIcon,
  Alert01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface PurchasesReportCardProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  supplierId: string;
}

interface PurchasesSummary {
  totalOrders: number;
  totalAmount: number;
  averageOrder: number;
  statusStats: Record<string, { count: number; amount: number }>;
}

interface ChartData {
  month: string;
  orders: number;
  amount: number;
}

export function PurchasesReportCard({ dateRange, supplierId }: PurchasesReportCardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<PurchasesSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [reportType, setReportType] = useState('summary');
  const [detailedData, setDetailedData] = useState<any>(null);

  useEffect(() => {
    fetchPurchasesReport();
  }, [dateRange, supplierId, reportType]);

  const fetchPurchasesReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        supplierId,
        type: reportType
      });

      const res = await fetch(`/api/reports/purchases?${params}`);
      if (!res.ok) throw new Error('Error al cargar reporte');

      const data = await res.json();
      
      if (reportType === 'summary') {
        setSummary(data.summary);
        setChartData(data.chartData || []);
      } else {
        setDetailedData(data);
      }
    } catch (error) {
      console.error('Error al cargar reporte de compras:', error);
      toast.error('Error al cargar reporte de compras');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'summary', label: 'Resumen' },
    { id: 'detailed', label: 'Detallado' },
    { id: 'by-supplier', label: 'Por Proveedor' },
    { id: 'by-product', label: 'Por Producto' },
    { id: 'pending', label: 'Pendientes' }
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'RECEIVED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'RECEIVED': return 'Recibido';
      case 'CANCELLED': return 'Cancelado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Cargando reporte de compras...</div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 rounded-xl">
                  <ShoppingCart01Icon className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Órdenes</p>
                  <p className="text-lg font-black text-slate-900">{formatNumber(summary.totalOrders)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <DollarCircleIcon className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Monto Total</p>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(summary.totalAmount)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <ArrowUp01Icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Orden Promedio</p>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(summary.averageOrder)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <Alert01Icon className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Pendientes</p>
                  <p className="text-lg font-black text-orange-600">
                    {formatNumber(summary.statusStats.PENDING?.count || 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-4">Estado de Órdenes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(summary.statusStats).map(([status, stats]) => (
                <div key={status} className="text-center p-4 bg-slate-50 rounded-xl">
                  <p className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${getStatusColor(status)}`}>
                    {getStatusLabel(status)}
                  </p>
                  <p className="text-lg font-black text-slate-900">{formatNumber(stats.count)}</p>
                  <p className="text-sm text-slate-600">{formatCurrency(stats.amount)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Tendencia de Compras</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {chartData.map((data, index) => {
                  const maxAmount = Math.max(...chartData.map(d => d.amount));
                  const height = (data.amount / maxAmount) * 100;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '200px' }}>
                        <div 
                          className="w-full bg-purple-500 rounded-t-lg absolute bottom-0 transition-all duration-500"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-bold text-slate-900">{data.orders}</p>
                        <p className="text-xs text-slate-500">{data.month}</p>
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
            {reportType === 'detailed' && detailedData.purchases && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Fecha</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Proveedor</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Estado</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Creado por</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Items</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.purchases.map((purchase: any) => (
                    <tr key={purchase.id} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">
                        {new Date(purchase.orderDate).toLocaleDateString('es-PE')}
                      </td>
                      <td className="p-4 text-sm text-slate-900">
                        {purchase.supplier?.name || 'Sin proveedor'}
                      </td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${getStatusColor(purchase.status)}`}>
                          {getStatusLabel(purchase.status)}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{purchase.createdBy}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{purchase.totalItems}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(purchase.totalAmount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'by-supplier' && detailedData.suppliers && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Proveedor</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">RUC</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Órdenes</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Monto Total</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.suppliers.map((supplier: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{supplier.supplier.name}</td>
                      <td className="p-4 text-sm text-slate-600">{supplier.supplier.ruc || 'N/A'}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(supplier.totalOrders)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(supplier.totalAmount)}
                      </td>
                      <td className="p-4 text-sm text-slate-600 text-right">
                        {formatCurrency(supplier.totalAmount / supplier.totalOrders)}
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
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Variante</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Cantidad</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Órdenes</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Costo Total</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Costo Promedio</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.products.map((product: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{product.productTitle}</td>
                      <td className="p-4 text-sm text-slate-600">{product.variantName}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(product.totalQuantity)}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(product.totalOrders)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(product.totalCost)}
                      </td>
                      <td className="p-4 text-sm text-slate-600 text-right">
                        {formatCurrency(product.averageCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'pending' && detailedData.pendingOrders && (
              <>
                <div className="p-6 bg-yellow-50 border-b border-yellow-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-yellow-600">Órdenes Pendientes</p>
                      <p className="text-2xl font-black text-yellow-700">{detailedData.summary.totalPendingOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-600">Monto Pendiente</p>
                      <p className="text-2xl font-black text-yellow-700">{formatCurrency(detailedData.summary.totalPendingAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-600">Más Antigua</p>
                      <p className="text-2xl font-black text-yellow-700">{detailedData.summary.oldestPendingDays} días</p>
                    </div>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-4 text-xs font-bold text-slate-700">Fecha</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-700">Proveedor</th>
                      <th className="text-right p-4 text-xs font-bold text-slate-700">Items</th>
                      <th className="text-right p-4 text-xs font-bold text-slate-700">Días Pendiente</th>
                      <th className="text-right p-4 text-xs font-bold text-slate-700">Monto</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-700">Contacto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedData.pendingOrders.map((order: any) => (
                      <tr key={order.id} className="border-b border-slate-100 bg-yellow-50">
                        <td className="p-4 text-sm text-slate-900">
                          {new Date(order.orderDate).toLocaleDateString('es-PE')}
                        </td>
                        <td className="p-4 text-sm text-slate-900">{order.supplier?.name || 'Sin proveedor'}</td>
                        <td className="p-4 text-sm text-slate-900 text-right">{order.itemsCount}</td>
                        <td className="p-4 text-sm text-yellow-700 font-bold text-right">{order.daysPending}</td>
                        <td className="p-4 text-sm font-bold text-slate-900 text-right">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          {order.supplier?.phone || order.supplier?.email || 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}