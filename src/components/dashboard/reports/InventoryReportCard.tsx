'use client';

import { useState, useEffect } from 'react';
import { 
  PackageDeliveredIcon, 
  ArrowDown01Icon, 
  DollarCircleIcon,
  Alert01Icon,
  BarChartIcon,
  PackageIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

interface InventoryReportCardProps {
  branchId: string;
  categoryId: string;
}

interface InventorySummary {
  totalProducts: number;
  totalStock: number;
  lowStockItems: number;
  totalCostValue: number;
  totalSaleValue: number;
  potentialProfit: number;
}

export function InventoryReportCard({ branchId, categoryId }: InventoryReportCardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [reportType, setReportType] = useState('summary');
  const [detailedData, setDetailedData] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  useEffect(() => {
    fetchInventoryReport();
  }, [branchId, categoryId, reportType, lowStockOnly]);

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        branchId,
        categoryId,
        type: reportType,
        lowStockOnly: lowStockOnly.toString(),
        ...(searchTerm && { search: searchTerm })
      });

      const res = await fetch(`/api/reports/inventory?${params}`);
      if (!res.ok) throw new Error('Error al cargar reporte');

      const data = await res.json();
      
      if (reportType === 'summary') {
        setSummary(data.summary);
      } else {
        setDetailedData(data);
      }
    } catch (error) {
      console.error('Error al cargar reporte de inventario:', error);
      toast.error('Error al cargar reporte de inventario');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'summary', label: 'Resumen' },
    { id: 'detailed', label: 'Detallado' },
    { id: 'movements', label: 'Movimientos' },
    { id: 'low-stock', label: 'Stock Bajo' },
    { id: 'by-category', label: 'Por Categoría' },
    { id: 'valuation', label: 'Valorización' }
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
          <div className="text-slate-500">Cargando reporte de inventario...</div>
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

      {/* Additional Filters */}
      {reportType === 'detailed' && (
        <div className="flex gap-4 items-center">
          <Input
            placeholder="Buscar productos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs h-9 text-xs"
          />
          <Button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            variant={lowStockOnly ? "default" : "outline"}
            size="sm"
            className="h-9 text-xs"
          >
            Solo stock bajo
          </Button>
          <Button
            onClick={fetchInventoryReport}
            size="sm"
            className="h-9 text-xs"
          >
            Buscar
          </Button>
        </div>
      )}

      {/* Summary View */}
      {reportType === 'summary' && summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl">
                <PackageDeliveredIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total Productos</p>
                <p className="text-2xl font-black text-slate-900">{formatNumber(summary.totalProducts)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Stock Total:</span>
                <span className="text-xs font-bold text-slate-900">{formatNumber(summary.totalStock)} unidades</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-xl">
                <Alert01Icon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Stock Bajo</p>
                <p className="text-2xl font-black text-red-600">{formatNumber(summary.lowStockItems)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">% del total:</span>
                <span className="text-xs font-bold text-red-600">
                  {summary.totalProducts > 0 ? ((summary.lowStockItems / summary.totalProducts) * 100).toFixed(1) : 0}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <DollarCircleIcon className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Valor Total</p>
                <p className="text-2xl font-black text-slate-900">{formatCurrency(summary.totalSaleValue)}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Costo:</span>
                <span className="text-xs text-slate-600">{formatCurrency(summary.totalCostValue)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-slate-500">Ganancia potencial:</span>
                <span className="text-xs font-bold text-emerald-600">{formatCurrency(summary.potentialProfit)}</span>
              </div>
            </div>
          </div>
        </div>
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
            {reportType === 'detailed' && detailedData.inventory && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Producto</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Variante</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">SKU</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Categoría</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Stock</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Min.</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Costo</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Precio</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Valor Total</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.inventory.map((item: any) => (
                    <tr key={item.id} className={`border-b border-slate-100 ${item.isLowStock ? 'bg-red-50' : ''}`}>
                      <td className="p-4 text-sm text-slate-900">{item.productTitle}</td>
                      <td className="p-4 text-sm text-slate-600">{item.variantName}</td>
                      <td className="p-4 text-sm text-slate-600">{item.sku || 'N/A'}</td>
                      <td className="p-4 text-sm text-slate-600">{item.category}</td>
                      <td className={`p-4 text-sm text-right ${item.isLowStock ? 'text-red-600 font-bold' : 'text-slate-900'}`}>
                        {formatNumber(item.quantity)}
                      </td>
                      <td className="p-4 text-sm text-slate-600 text-right">{formatNumber(item.minStock)}</td>
                      <td className="p-4 text-sm text-slate-600 text-right">{formatCurrency(item.cost)}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatCurrency(item.price)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(item.totalSaleValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'movements' && detailedData.movements && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Fecha</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Producto</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Tipo</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Usuario</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Cantidad</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Stock Anterior</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Stock Actual</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.movements.map((movement: any) => (
                    <tr key={movement.id} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">
                        {new Date(movement.createdAt).toLocaleString('es-PE')}
                      </td>
                      <td className="p-4 text-sm text-slate-900">{movement.productTitle}</td>
                      <td className="p-4 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                          movement.type === 'INPUT' ? 'bg-green-100 text-green-700' :
                          movement.type === 'OUTPUT' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {movement.type}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-600">{movement.user}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(movement.quantity)}</td>
                      <td className="p-4 text-sm text-slate-600 text-right">{formatNumber(movement.previousStock)}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(movement.currentStock)}</td>
                      <td className="p-4 text-sm text-slate-600">{movement.reason || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'low-stock' && detailedData.lowStockItems && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Producto</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Categoría</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Sucursal</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Stock Actual</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Stock Mínimo</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Déficit</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Costo Unit.</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.lowStockItems.map((item: any) => (
                    <tr key={item.id} className="border-b border-slate-100 bg-red-50">
                      <td className="p-4 text-sm text-slate-900">{item.productTitle}</td>
                      <td className="p-4 text-sm text-slate-600">{item.category}</td>
                      <td className="p-4 text-sm text-slate-600">{item.branch}</td>
                      <td className="p-4 text-sm text-red-600 font-bold text-right">{formatNumber(item.currentStock)}</td>
                      <td className="p-4 text-sm text-slate-600 text-right">{formatNumber(item.minStock)}</td>
                      <td className="p-4 text-sm text-red-600 font-bold text-right">{formatNumber(item.deficit)}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatCurrency(item.cost)}</td>
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
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Productos</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Stock Total</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Stock Bajo</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Valor Costo</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Valor Venta</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.categories.map((category: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{category.categoryName}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(category.totalProducts)}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(category.totalStock)}</td>
                      <td className="p-4 text-sm text-red-600 text-right">{formatNumber(category.lowStockItems)}</td>
                      <td className="p-4 text-sm text-slate-600 text-right">{formatCurrency(category.totalCostValue)}</td>
                      <td className="p-4 text-sm font-bold text-slate-900 text-right">
                        {formatCurrency(category.totalSaleValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'valuation' && detailedData.valuation && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-2">Valor Total de Costo</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(detailedData.valuation.totalCostValue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-2">Valor Total de Venta</p>
                    <p className="text-2xl font-black text-emerald-600">{formatCurrency(detailedData.valuation.totalSaleValue)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-2">Ganancia Potencial</p>
                    <p className="text-2xl font-black text-blue-600">{formatCurrency(detailedData.valuation.potentialProfit)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-2">Margen de Ganancia</p>
                    <p className="text-2xl font-black text-purple-600">{detailedData.valuation.profitMargin.toFixed(1)}%</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-2">Total de Items</p>
                    <p className="text-2xl font-black text-slate-900">{formatNumber(detailedData.valuation.totalItems)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-2">Costo Promedio por Item</p>
                    <p className="text-2xl font-black text-slate-900">{formatCurrency(detailedData.valuation.averageCostPerItem)}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}