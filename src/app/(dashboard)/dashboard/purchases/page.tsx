'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import React from 'react';
import { 
  Plus, Search, ChevronLeft, ChevronRight, LayoutGrid, 
  Package, Calendar, User, CheckCircle, Clock, XCircle, Users, Download, Filter, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { PurchaseModal } from '@/components/dashboard/PurchaseModal';
import { SupplierModal } from '@/components/dashboard/SupplierModal';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PurchaseOrder {
  id: string;
  orderDate: string;
  receivedDate: string | null;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  notes: string | null;
  supplier: {
    name: string;
  } | null;
  createdBy: {
    name: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    cost: number;
    variant: {
      name: string;
      product: {
        title: string;
      };
    };
    uom: {
      name: string;
      abbreviation: string;
    } | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

const ITEMS_PER_PAGE = 6;

const statusConfig = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300', icon: Clock },
  RECEIVED: { label: 'Recibida', color: 'bg-green-100 text-green-700 border-green-300', icon: CheckCircle },
  CANCELLED: { label: 'Cancelada', color: 'bg-red-100 text-red-700 border-red-300', icon: XCircle },
};

export default function PurchasesPage() {
  const { role } = useAuth();
  const canManage = role === 'OWNER' || role === 'MANAGER';

  const { data: purchases, isLoading, mutate } = useSWR<PurchaseOrder[]>('/api/purchases', fetcher);
  const { data: branches } = useSWR('/api/branches', fetcher);
  const { data: suppliers, mutate: mutateSuppliers } = useSWR('/api/suppliers', fetcher);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RECEIVED' | 'CANCELLED'>('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isBranchSelectModalOpen, setIsBranchSelectModalOpen] = useState(false);
  const [stockDistribution, setStockDistribution] = useState<Record<string, Record<string, number>>>({});
  const [showSupplierFilter, setShowSupplierFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  const initializeStockDistribution = () => {
    if (!selectedPurchase || !branches || branches.length === 0) return;
    
    const distribution: Record<string, Record<string, number>> = {};
    
    selectedPurchase.items.forEach(item => {
      distribution[item.id] = {};
      branches.forEach((branch: any) => {
        distribution[item.id][branch.id] = 0;
      });
      // Asignar toda la cantidad a la primera sucursal por defecto
      distribution[item.id][branches[0].id] = item.quantity;
    });
    
    setStockDistribution(distribution);
  };

  const updateStockDistribution = (itemId: string, branchId: string, quantity: number) => {
    setStockDistribution(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [branchId]: quantity
      }
    }));
  };

  const assignAllToBranch = (branchId: string) => {
    if (!selectedPurchase) return;
    
    const distribution: Record<string, Record<string, number>> = {};
    
    selectedPurchase.items.forEach(item => {
      distribution[item.id] = {};
      branches?.forEach((branch: any) => {
        distribution[item.id][branch.id] = branch.id === branchId ? item.quantity : 0;
      });
    });
    
    setStockDistribution(distribution);
  };

  const validateDistribution = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!selectedPurchase) return { valid: false, errors: ['No hay orden seleccionada'] };
    
    selectedPurchase.items.forEach(item => {
      const totalDistributed = Object.values(stockDistribution[item.id] || {}).reduce((sum, qty) => sum + qty, 0);
      
      if (totalDistributed !== item.quantity) {
        errors.push(`${item.variant.product.title}: distribuido ${totalDistributed} de ${item.quantity}`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  const handleReceive = async () => {
    if (!selectedPurchase) return;
    
    const validation = validateDistribution();
    
    if (!validation.valid) {
      alert('Error en la distribución:\n' + validation.errors.join('\n'));
      return;
    }

    try {
      const res = await fetch(`/api/purchases/${selectedPurchase.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockDistribution }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      mutate();
      setIsDetailModalOpen(false);
      setIsBranchSelectModalOpen(false);
      alert('Orden recibida correctamente. El stock ha sido actualizado.');
    } catch (error: any) {
      alert(error.message || 'Error al recibir la orden');
    }
  };

  const openBranchSelectModal = () => {
    if (!branches || branches.length === 0) {
      alert('No hay sucursales disponibles');
      return;
    }
    initializeStockDistribution();
    setIsBranchSelectModalOpen(true);
  };

  const handleCancel = async (purchaseId: string) => {
    if (!confirm('¿Cancelar esta orden de compra? Esta acción no se puede deshacer.')) return;
    
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/cancel`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      mutate();
      setIsDetailModalOpen(false);
      // toast.success('Orden cancelada');
    } catch (error: any) {
      // toast.error(error.message || 'Error al cancelar la orden');
      alert(error.message || 'Error al cancelar la orden');
    }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);

  const exportToExcel = async () => {
    if (!filteredPurchases || filteredPurchases.length === 0) {
      alert('No hay órdenes para exportar');
      return;
    }

    try {
      const XLSX = await import('xlsx-js-style');

      const headers = ['ID', 'Proveedor', 'Estado', 'Fecha de Orden', 'Fecha de Recepción', 'Cant. Productos', 'Total', 'Creado por', 'Notas', 'Fecha de Creación'];
      
      const exportData = filteredPurchases.map(purchase => [
        purchase.id,
        purchase.supplier?.name || 'Sin proveedor',
        statusConfig[purchase.status].label,
        new Date(purchase.orderDate).toLocaleDateString('es-PE'),
        purchase.receivedDate ? new Date(purchase.receivedDate).toLocaleDateString('es-PE') : '',
        purchase.items.length,
        Number(purchase.totalAmount).toFixed(2),
        purchase.createdBy?.name || '',
        purchase.notes || '',
        new Date(purchase.createdAt).toLocaleDateString('es-PE'),
      ]);

      const ws_data = [headers, ...exportData];
      const worksheet = XLSX.utils.aoa_to_sheet(ws_data);

      // Aplicar estilos a los encabezados
      const headerStyle = {
        fill: { fgColor: { rgb: "1E293B" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" }
      };

      headers.forEach((_, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: colIndex });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = headerStyle;
        }
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Órdenes de Compra');

      worksheet['!cols'] = [
        { wch: 36 }, { wch: 25 }, { wch: 12 }, { wch: 15 }, { wch: 18 },
        { wch: 20 }, { wch: 12 }, { wch: 20 }, { wch: 30 }, { wch: 18 }
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `ordenes-compra-${timestamp}.xlsx`);

      alert('Archivo Excel generado correctamente');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo Excel');
    }
  };

  const exportToPDF = async () => {
    if (!filteredPurchases || filteredPurchases.length === 0) {
      alert('No hay órdenes para exportar');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Encabezado corporativo
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 297, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ÓRDENES DE COMPRA', 148.5, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 148.5, 25, { align: 'center' });

      // Preparar datos de la tabla
      const tableData = filteredPurchases.map(purchase => [
        new Date(purchase.orderDate).toLocaleDateString('es-PE'),
        purchase.supplier?.name || 'Sin proveedor',
        statusConfig[purchase.status].label,
        purchase.items.length.toString(),
        `S/ ${Number(purchase.totalAmount).toFixed(2)}`,
        purchase.receivedDate ? new Date(purchase.receivedDate).toLocaleDateString('es-PE') : '-',
        purchase.createdBy?.name || '-'
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Proveedor', 'Estado', 'Productos', 'Total', 'Recibida', 'Creado por']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 9
        },
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 50 },
          2: { cellWidth: 30 },
          3: { cellWidth: 25, halign: 'center' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 25 },
          6: { cellWidth: 35 }
        }
      });

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`ordenes-compra-${timestamp}.pdf`);
      
      alert('Archivo PDF generado correctamente');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo PDF');
    }
  };

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    
    return purchases.filter(purchase => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        purchase.supplier?.name.toLowerCase().includes(searchLower) ||
        purchase.items.some(item => 
          item.variant.product.title.toLowerCase().includes(searchLower)
        );

      const matchesStatus = statusFilter === 'ALL' || purchase.status === statusFilter;
      
      const matchesSupplier = supplierFilter === 'ALL' || purchase.supplier?.name === supplierFilter;
      
      // Filtro de fechas - comparar solo las fechas sin horas
      let matchesDateFrom = true;
      let matchesDateTo = true;
      
      if (dateFrom || dateTo) {
        // Obtener solo la fecha (YYYY-MM-DD) de la compra
        const purchaseDateStr = purchase.createdAt.split('T')[0];
        
        if (dateFrom) {
          matchesDateFrom = purchaseDateStr >= dateFrom;
        }
        
        if (dateTo) {
          matchesDateTo = purchaseDateStr <= dateTo;
        }
      }

      return matchesSearch && matchesStatus && matchesSupplier && matchesDateFrom && matchesDateTo;
    });
  }, [purchases, searchTerm, statusFilter, supplierFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE) || 1;
  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Órdenes de Compra</h1>
          <ShoppingCart className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* BUSCADOR ANIMADO */}
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              placeholder="Buscar proveedor, producto..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>

          {canManage && (
            <>
              <Button 
                onClick={() => setIsSupplierModalOpen(true)}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <Users className="w-3.5 h-3.5 mr-1.5" /> <span className="font-bold">Proveedores</span>
              </Button>
              <div className="relative">
                <Button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  variant="ghost"
                  className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" /> <span className="font-bold">Exportar</span>
                </Button>
                
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={exportToExcel}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Excel
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </button>
                    </div>
                  </>
                )}
              </div>
              <Button 
                onClick={() => setIsModalOpen(true)}
                className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0"
              >
                <Plus className="w-4 h-4 mr-1.5" /> <span className="font-bold">Nueva Orden</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* SUBHEADER: TABS Y PAGINACIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 w-full shrink-0">
          
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            {(['ALL', 'PENDING', 'RECEIVED', 'CANCELLED'] as const).map((status) => (
              <button 
                key={status} 
                onClick={() => {setStatusFilter(status); setCurrentPage(1); setShowStatusFilter(false);}}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  statusFilter === status 
                    ? 'bg-slate-900 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {status === 'ALL' && <><LayoutGrid className="w-3.5 h-3.5" /> Todas</>}
                {status === 'PENDING' && <><Clock className="w-3.5 h-3.5" /> Pendientes</>}
                {status === 'RECEIVED' && <><CheckCircle className="w-3.5 h-3.5" /> Recibidas</>}
                {status === 'CANCELLED' && <><XCircle className="w-3.5 h-3.5" /> Canceladas</>}
              </button>
            ))}
          </div>

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                Pág {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* TABLA */}
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30">
              <tr>
                <th className="px-5 py-3.5 font-semibold rounded-tl-xl relative select-none">
                  <div 
                    className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${statusFilter !== 'ALL' || showStatusFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                    onClick={() => setShowStatusFilter(!showStatusFilter)}
                  >
                    Estado <Filter className={`w-3.5 h-3.5 ${statusFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                  </div>
                  
                  {showStatusFilter && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowStatusFilter(false)} />
                      <div className="absolute top-10 left-3 w-[140px] bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                        <button onClick={() => {setStatusFilter('ALL'); setShowStatusFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${statusFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                          Todas
                        </button>
                        <button onClick={() => {setStatusFilter('PENDING'); setShowStatusFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${statusFilter === 'PENDING' ? 'bg-yellow-50 text-yellow-700' : 'text-yellow-600 hover:bg-yellow-50/50'}`}>
                          Pendientes
                        </button>
                        <button onClick={() => {setStatusFilter('RECEIVED'); setShowStatusFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${statusFilter === 'RECEIVED' ? 'bg-green-50 text-green-700' : 'text-green-600 hover:bg-green-50/50'}`}>
                          Recibidas
                        </button>
                        <button onClick={() => {setStatusFilter('CANCELLED'); setShowStatusFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${statusFilter === 'CANCELLED' ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50/50'}`}>
                          Canceladas
                        </button>
                      </div>
                    </>
                  )}
                </th>
                <th className="px-5 py-3.5 font-semibold relative select-none">
                  <div 
                    className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${supplierFilter !== 'ALL' || showSupplierFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                    onClick={() => setShowSupplierFilter(!showSupplierFilter)}
                  >
                    Proveedor <Filter className={`w-3.5 h-3.5 ${supplierFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                  </div>
                  
                  {showSupplierFilter && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSupplierFilter(false)} />
                      <div className="absolute top-10 left-3 w-[200px] bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar">
                        <button onClick={() => {setSupplierFilter('ALL'); setShowSupplierFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${supplierFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                          Todos los proveedores
                        </button>
                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        {suppliers?.filter((s: any) => s.isActive).map((supplier: any) => (
                          <button key={supplier.id} onClick={() => {setSupplierFilter(supplier.name); setShowSupplierFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors ${supplierFilter === supplier.name ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                            {supplier.name}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </th>
                <th className="px-5 py-3.5 font-semibold">Fecha</th>
                <th className="px-5 py-3.5 font-semibold">Productos</th>
                <th className="px-5 py-3.5 font-semibold">Total</th>
                <th className="px-5 py-3.5 font-semibold">Creado por</th>
                <th className="px-5 py-3.5 font-semibold rounded-tr-xl text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? (
                Array(6).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={7} className="p-4">
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : paginatedPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <ShoppingCart className="w-10 h-10 text-slate-200" strokeWidth={1} />
                      <p className="font-medium text-sm text-slate-500">No se encontraron órdenes de compra</p>
                      <Button variant="link" className="text-xs h-6 text-slate-900 font-bold" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); setSupplierFilter('ALL'); setDateFrom(''); setDateTo(''); setCurrentPage(1); }}>
                        Limpiar filtros
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedPurchases.map((purchase: PurchaseOrder) => {
                  const statusInfo = statusConfig[purchase.status];
                  const StatusIcon = statusInfo.icon;

                  return (
                    <tr key={purchase.id} className="hover:bg-slate-50 transition-colors group text-xs">
                      <td className="px-5 py-3">
                        <Badge className={`text-[9px] font-black px-2 py-0.5 h-5 shadow-none border ${statusInfo.color}`}>
                          <StatusIcon className="w-2.5 h-2.5 mr-1" />
                          {statusInfo.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-slate-700 text-sm truncate max-w-[200px] block">
                          {purchase.supplier?.name || 'Sin proveedor'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 text-[11px]">
                              {new Date(purchase.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(purchase.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-700 text-xs">{purchase.items.length} producto(s)</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-slate-700 text-sm">S/ {Number(purchase.totalAmount).toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-slate-700 text-xs truncate max-w-[120px]">{purchase.createdBy?.name || '-'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 text-xs font-bold hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                          onClick={() => {
                            setSelectedPurchase(purchase);
                            setIsDetailModalOpen(true);
                          }}
                        >
                          Ver Detalle
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      <PurchaseModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => mutate()}
      />

      {/* MODAL DE PROVEEDORES */}
      <SupplierModal 
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        onSuccess={() => { mutate(); mutateSuppliers(); }}
        suppliers={suppliers || []}
      />

      {/* MODAL DE DETALLE */}
      {selectedPurchase && (
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
            
            <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-lg font-black text-slate-900">
                    Orden de Compra
                  </DialogTitle>
                  <p className="text-xs text-slate-700 mt-1">
                    {selectedPurchase.supplier?.name || 'Sin proveedor'}
                  </p>
                </div>
                <Badge className={`text-xs font-bold px-3 py-1 shadow-none border ${statusConfig[selectedPurchase.status].color}`}>
                  {React.createElement(statusConfig[selectedPurchase.status].icon, { className: "w-3 h-3 mr-1 inline" })}
                  {statusConfig[selectedPurchase.status].label}
                </Badge>
              </div>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              
              {/* Información General */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                  Información General
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-500 text-xs">Fecha de Orden:</span>
                    <p className="font-bold text-slate-900">{new Date(selectedPurchase.orderDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
                  {selectedPurchase.receivedDate && (
                    <div>
                      <span className="text-slate-500 text-xs">Fecha de Recepción:</span>
                      <p className="font-bold text-green-700">{new Date(selectedPurchase.receivedDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    </div>
                  )}
                  {selectedPurchase.createdBy && (
                    <div>
                      <span className="text-slate-500 text-xs">Creado por:</span>
                      <p className="font-bold text-slate-900">{selectedPurchase.createdBy.name}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 text-xs">Total de Productos:</span>
                    <p className="font-bold text-slate-900">{selectedPurchase.items.length}</p>
                  </div>
                </div>
                {selectedPurchase.notes && (
                  <div>
                    <span className="text-slate-500 text-xs">Notas:</span>
                    <p className="text-sm text-slate-700 mt-1 bg-slate-50 p-2 rounded">{selectedPurchase.notes}</p>
                  </div>
                )}
              </div>

              {/* Productos */}
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide border-b border-slate-100 pb-2">
                  Productos ({selectedPurchase.items.length})
                </h3>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedPurchase.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {item.variant.product.title}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.variant.name} {item.uom && `(${item.uom.abbreviation})`}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Cantidad</div>
                          <div className="text-sm font-bold text-slate-900">{item.quantity}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-slate-500">Costo Unit.</div>
                          <div className="text-sm font-bold text-slate-900">S/ {Number(item.cost).toFixed(2)}</div>
                        </div>
                        <div className="text-right min-w-[80px]">
                          <div className="text-xs text-slate-500">Subtotal</div>
                          <div className="text-sm font-black text-emerald-600">
                            S/ {(item.quantity * Number(item.cost)).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total */}
              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Total de la Orden:</span>
                  <span className="text-2xl font-black text-emerald-700">
                    S/ {Number(selectedPurchase.totalAmount).toFixed(2)}
                  </span>
                </div>
              </div>

            </div>

            {/* Footer con acciones */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <Button 
                variant="outline" 
                onClick={() => setIsDetailModalOpen(false)}
                className="h-10 text-xs font-bold"
              >
                Cerrar
              </Button>
              
              {canManage && selectedPurchase.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => handleCancel(selectedPurchase.id)}
                    className="h-10 text-xs font-bold text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <XCircle className="w-4 h-4 mr-1.5" />
                    Cancelar Orden
                  </Button>
                  <Button 
                    onClick={openBranchSelectModal}
                    className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Marcar como Recibida
                  </Button>
                </div>
              )}
            </div>

          </DialogContent>
        </Dialog>
      )}

      {/* MODAL DE DISTRIBUCIÓN DE STOCK */}
      {selectedPurchase && (
        <Dialog open={isBranchSelectModalOpen} onOpenChange={setIsBranchSelectModalOpen}>
          <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
            
            <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm shrink-0">
              <DialogTitle className="text-lg font-black text-slate-900">
                Distribuir Stock por Sucursal
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-1">
                Asigna las cantidades de cada producto a las sucursales correspondientes
              </p>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              
              {/* Información de la orden */}
              <div className="bg-white p-4 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-500 mb-1">Orden de compra</div>
                <div className="font-bold text-slate-900">{selectedPurchase.supplier?.name || 'Sin proveedor'}</div>
                <div className="text-xs text-slate-500 mt-2">
                  {selectedPurchase.items.length} producto(s) • S/ {Number(selectedPurchase.totalAmount).toFixed(2)}
                </div>
              </div>

              {/* Acciones rápidas */}
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                <div className="text-xs font-bold text-blue-900 mb-2">Asignación Rápida</div>
                <div className="flex flex-wrap gap-2">
                  {branches?.map((branch: any) => (
                    <Button
                      key={branch.id}
                      variant="outline"
                      size="sm"
                      onClick={() => assignAllToBranch(branch.id)}
                      className="h-8 text-xs font-bold bg-white hover:bg-blue-50 border-blue-300 text-blue-700"
                    >
                      Todo a {branch.name}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Distribución por producto */}
              <div className="space-y-3">
                {selectedPurchase.items.map((item) => {
                  const totalDistributed = Object.values(stockDistribution[item.id] || {}).reduce((sum, qty) => sum + qty, 0);
                  const isValid = totalDistributed === item.quantity;
                  
                  return (
                    <div key={item.id} className={`bg-white p-4 rounded-xl border-2 transition-all ${isValid ? 'border-slate-200' : 'border-red-300 bg-red-50/30'}`}>
                      
                      {/* Header del producto */}
                      <div className="flex items-start justify-between mb-3 pb-3 border-b border-slate-100">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">
                            {item.variant.product.title}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {item.variant.name} {item.uom && `(${item.uom.abbreviation})`}
                          </div>
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <div className="text-xs text-slate-500">Total a distribuir</div>
                          <div className="text-lg font-black text-slate-900">{item.quantity}</div>
                        </div>
                      </div>

                      {/* Inputs por sucursal */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {branches?.map((branch: any) => (
                          <div key={branch.id} className="relative">
                            <label className="text-xs font-bold text-slate-700 mb-1 block">
                              {branch.name}
                            </label>
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={stockDistribution[item.id]?.[branch.id] || 0}
                              onChange={(e) => updateStockDistribution(item.id, branch.id, parseInt(e.target.value) || 0)}
                              className="w-full h-10 px-3 text-sm font-bold bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Validación */}
                      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-xs text-slate-500">
                          Distribuido: <span className={`font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>{totalDistributed}</span> de {item.quantity}
                        </div>
                        {isValid ? (
                          <Badge className="text-[9px] font-black px-2 py-0.5 h-5 bg-green-100 text-green-700 border-green-300">
                            <CheckCircle className="w-2.5 h-2.5 mr-1" />
                            Completo
                          </Badge>
                        ) : (
                          <Badge className="text-[9px] font-black px-2 py-0.5 h-5 bg-red-100 text-red-700 border-red-300">
                            <XCircle className="w-2.5 h-2.5 mr-1" />
                            Incompleto
                          </Badge>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
              <Button 
                variant="outline" 
                onClick={() => setIsBranchSelectModalOpen(false)}
                className="h-10 text-xs font-bold"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleReceive}
                className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <CheckCircle className="w-4 h-4 mr-1.5" />
                Confirmar Recepción
              </Button>
            </div>

          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
