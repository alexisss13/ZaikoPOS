'use client';

import { useState, useEffect } from 'react';
import { 
  BarChartIcon, 
  Analytics01Icon, 
  Calendar01Icon, 
  Download01Icon,
  FilterIcon,
  PackageIcon,
  ShoppingCart01Icon,
  UserAccountIcon,
  ShoppingBag01Icon,
  ArrowUp01Icon,
  ArrowDown01Icon,
  DollarCircleIcon,
  PackageDeliveredIcon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { SalesReportCard } from '@/components/dashboard/reports/SalesReportCard';
import { InventoryReportCard } from '@/components/dashboard/reports/InventoryReportCard';
import { PurchasesReportCard } from '@/components/dashboard/reports/PurchasesReportCard';
import { CashSessionsReportCard } from '@/components/dashboard/reports/CashSessionsReportCard';

type ReportType = 'sales' | 'inventory' | 'purchases' | 'cash-sessions';

interface DateRange {
  startDate: string;
  endDate: string;
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('sales');
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 días atrás
    endDate: new Date().toISOString().split('T')[0]
  });
  const [branches, setBranches] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSupplier, setSelectedSupplier] = useState('all');

  useEffect(() => {
    fetchFilterData();
  }, []);

  const fetchFilterData = async () => {
    try {
      const [branchesRes, usersRes, categoriesRes, suppliersRes] = await Promise.all([
        fetch('/api/branches'),
        fetch('/api/users'),
        fetch('/api/categories'),
        fetch('/api/suppliers')
      ]);

      if (branchesRes.ok) {
        const branchesData = await branchesRes.json();
        setBranches(branchesData.branches || []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData.users || []);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.categories || []);
      }

      if (suppliersRes.ok) {
        const suppliersData = await suppliersRes.json();
        setSuppliers(suppliersData.suppliers || []);
      }
    } catch (error) {
      console.error('Error al cargar datos de filtros:', error);
    }
  };

  const reportTypes = [
    {
      id: 'sales' as ReportType,
      title: 'Ventas',
      description: 'Análisis de ventas y rendimiento',
      icon: ShoppingBag01Icon,
      color: 'bg-emerald-500'
    },
    {
      id: 'inventory' as ReportType,
      title: 'Inventario',
      description: 'Stock y movimientos de productos',
      icon: PackageDeliveredIcon,
      color: 'bg-blue-500'
    },
    {
      id: 'purchases' as ReportType,
      title: 'Compras',
      description: 'Órdenes de compra y proveedores',
      icon: ShoppingCart01Icon,
      color: 'bg-purple-500'
    },
    {
      id: 'cash-sessions' as ReportType,
      title: 'Cortes de Turno',
      description: 'Sesiones de caja y discrepancias',
      icon: UserAccountIcon,
      color: 'bg-orange-500'
    }
  ];

  const handleExportReport = async () => {
    try {
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        branchId: selectedBranch,
        userId: selectedUser,
        categoryId: selectedCategory,
        supplierId: selectedSupplier,
        format: 'excel'
      });

      const response = await fetch(`/api/reports/${activeReport}/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Error al exportar reporte');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${activeReport}-${dateRange.startDate}-${dateRange.endDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success('Reporte exportado correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al exportar reporte');
    }
  };

  const getQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    setDateRange({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-100 rounded-xl">
            <BarChartIcon className="w-5 h-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-900">Reportes</h1>
            <p className="text-slate-600">Análisis y estadísticas del negocio</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleExportReport}
            variant="outline"
            className="h-10 rounded-xl"
          >
            <Download01Icon className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
          {/* Report Types */}
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-sm font-bold text-slate-700 mb-4">Tipos de Reporte</h3>
            <div className="space-y-2">
              {reportTypes.map((report) => {
                const Icon = report.icon;
                return (
                  <button
                    key={report.id}
                    onClick={() => setActiveReport(report.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                      activeReport === report.id
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-50'
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

          {/* Filters */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
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
                    className="text-xs"
                  >
                    7 días
                  </Button>
                  <Button
                    onClick={() => getQuickDateRange(30)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    30 días
                  </Button>
                  <Button
                    onClick={() => getQuickDateRange(90)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    3 meses
                  </Button>
                  <Button
                    onClick={() => getQuickDateRange(365)}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                  >
                    1 año
                  </Button>
                </div>
                <div className="space-y-2">
                  <Input
                    type="date"
                    value={dateRange.startDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="h-9 text-xs"
                  />
                  <Input
                    type="date"
                    value={dateRange.endDate}
                    onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Branch Filter */}
            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">Sucursal</Label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
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
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  <option value="all">Todos los usuarios</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Category Filter */}
            {(activeReport === 'sales' || activeReport === 'inventory') && (
              <div>
                <Label className="text-sm font-bold text-slate-700 mb-2 block">Categoría</Label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  <option value="all">Todas las categorías</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Supplier Filter */}
            {activeReport === 'purchases' && (
              <div>
                <Label className="text-sm font-bold text-slate-700 mb-2 block">Proveedor</Label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs"
                >
                  <option value="all">Todos los proveedores</option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-slate-50/30">
          {activeReport === 'sales' && (
            <SalesReportCard
              dateRange={dateRange}
              branchId={selectedBranch}
              userId={selectedUser}
              categoryId={selectedCategory}
            />
          )}
          
          {activeReport === 'inventory' && (
            <InventoryReportCard
              branchId={selectedBranch}
              categoryId={selectedCategory}
            />
          )}
          
          {activeReport === 'purchases' && (
            <PurchasesReportCard
              dateRange={dateRange}
              supplierId={selectedSupplier}
            />
          )}
          
          {activeReport === 'cash-sessions' && (
            <CashSessionsReportCard
              dateRange={dateRange}
              branchId={selectedBranch}
              userId={selectedUser}
            />
          )}
        </div>
      </div>
    </div>
  );
}