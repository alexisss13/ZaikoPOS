'use client';

import useSWR from 'swr';
import { useState, useMemo, Suspense, lazy } from 'react';
import React from 'react';
import { 
  PlusSignIcon, Search01Icon, ArrowLeft01Icon, ArrowRight01Icon, LayoutGridIcon, 
  PackageIcon, Calendar03Icon, UserIcon, CheckmarkCircle02Icon, Clock01Icon, CancelCircleIcon, UserMultiple02Icon, DownloadCircle02Icon, FilterIcon, ShoppingCart01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/context/auth-context';
import { useResponsive } from '@/hooks/useResponsive';
import { NewPurchaseStepForm } from '@/components/dashboard/NewPurchaseStepForm';
import { SupplierModal } from '@/components/dashboard/SupplierModal';
import { CostAdjustmentModal } from '@/components/dashboard/CostAdjustmentModal';

const PurchasesMobile = lazy(() => import('@/components/purchases/PurchasesMobile'));

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
    phone: string | null;
  } | null;
  createdBy: {
    name: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    cost: number;
    costModified?: boolean;
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
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: Clock01Icon },
  RECEIVED: { label: "Recibida", color: "bg-green-100 text-green-700 border-green-300", icon: CheckmarkCircle02Icon },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-700 border-red-300", icon: CancelCircleIcon },
};

export default function PurchasesPage() {
  const { role } = useAuth();
  const { isMobile } = useResponsive();
  const canManage = role === 'OWNER' || role === 'MANAGER';

  // IMPORTANTE: Declarar TODOS los hooks ANTES de cualquier early return
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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showCostAdjustment, setShowCostAdjustment] = useState(false);
  const [showDateFilter, setShowDateFilter] = useState(false);

  // useMemo debe estar ANTES del early return
  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    
    return purchases
      .filter(purchase => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          purchase.supplier?.name.toLowerCase().includes(searchLower) ||
          purchase.items.some(item => 
            item.variant.product.title.toLowerCase().includes(searchLower)
          );

        const matchesStatus = statusFilter === 'ALL' || purchase.status === statusFilter;
        
        const matchesSupplier = supplierFilter === 'ALL' || purchase.supplier?.name === supplierFilter;
        
        let matchesDateFrom = true;
        let matchesDateTo = true;
        
        if (dateFrom || dateTo) {
          const purchaseDateStr = purchase.createdAt.split('T')[0];
          
          if (dateFrom) {
            matchesDateFrom = purchaseDateStr >= dateFrom;
          }
          
          if (dateTo) {
            matchesDateTo = purchaseDateStr <= dateTo;
          }
        }

        return matchesSearch && matchesStatus && matchesSupplier && matchesDateFrom && matchesDateTo;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ordenar por fecha descendente
  }, [purchases, searchTerm, statusFilter, supplierFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredPurchases.length / ITEMS_PER_PAGE) || 1;
  const paginatedPurchases = filteredPurchases.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  // Render mobile version DESPUÉS de declarar todos los hooks
  if (isMobile) {
    return (
      <Suspense fallback={
        <div className="flex flex-col h-full w-full overflow-y-auto pb-24 px-4 pt-4 gap-4 bg-slate-50">
          <div className="flex flex-col gap-1.5">
            <div className="h-6 bg-slate-200 rounded-lg w-48 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
          </div>
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-32 animate-pulse" />
            ))}
          </div>
        </div>
      }>
        <PurchasesMobile />
      </Suspense>
    );
  }

  // Resto del código desktop continúa aquí...
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

  const generatePurchaseOrderMessage = (purchase: PurchaseOrder): string => {
    const supplierName = purchase.supplier?.name || 'Proveedor';
    const orderDate = new Date(purchase.orderDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' });
    const total = Number(purchase.totalAmount).toFixed(2);
    
    let message = `*SOLICITUD DE COMPRA*\n\n`;
    message += `*Fecha:* ${orderDate}\n`;
    message += `*Proveedor:* ${supplierName}\n\n`;
    message += `*PRODUCTOS SOLICITADOS:*\n`;
    
    purchase.items.forEach((item, index) => {
      message += `${index + 1}. ${item.variant.product.title}\n`;
      message += `   • Variante: ${item.variant.name}\n`;
      message += `   • Cantidad: ${item.quantity} ${item.uom?.abbreviation || 'und'}\n`;
      message += `   • Precio unitario: S/ ${Number(item.cost).toFixed(2)}\n`;
      message += `   • Subtotal: S/ ${(item.quantity * Number(item.cost)).toFixed(2)}\n\n`;
    });
    
    message += `*TOTAL: S/ ${total}*\n\n`;
    
    if (purchase.notes) {
      message += `*Notas:* ${purchase.notes}\n\n`;
    }
    
    message += `Por favor, confirme disponibilidad y tiempo de entrega.\n\n`;
    message += `¡Gracias por su atención!`;
    
    return message;
  };

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
        new Date(purchase.orderDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }),
        purchase.supplier?.name || 'Sin proveedor',
        statusConfig[purchase.status].label,
        purchase.items.length.toString(),
        `S/ ${Number(purchase.totalAmount).toFixed(2)}`,
        purchase.receivedDate ? new Date(purchase.receivedDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
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

  const exportSinglePurchaseToPDF = async (purchase: PurchaseOrder) => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Encabezado
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text('ORDEN DE COMPRA', 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(purchase.supplier?.name || 'Sin proveedor', 105, 25, { align: 'center' });
      doc.text(`Estado: ${statusConfig[purchase.status].label}`, 105, 32, { align: 'center' });

      // Información general
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMACIÓN GENERAL', 15, 50);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Fecha de Orden: ${new Date(purchase.orderDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, 15, 58);
      
      if (purchase.receivedDate) {
        doc.text(`Fecha de Recepción: ${new Date(purchase.receivedDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}`, 15, 64);
      }
      
      if (purchase.createdBy) {
        doc.text(`Creado por: ${purchase.createdBy.name}`, 15, purchase.receivedDate ? 70 : 64);
      }

      // Productos
      const startY = purchase.receivedDate ? 80 : 74;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('PRODUCTOS', 15, startY);

      const tableData = purchase.items.map(item => [
        item.variant.product.title,
        item.variant.name,
        `${item.quantity} ${item.uom?.abbreviation || 'und'}`,
        `S/ ${Number(item.cost).toFixed(2)}`,
        `S/ ${(item.quantity * Number(item.cost)).toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: startY + 5,
        head: [['Producto', 'Variante', 'Cantidad', 'Costo Unit.', 'Subtotal']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 9
        },
        styles: {
          fontSize: 8,
          cellPadding: 3
        },
        columnStyles: {
          0: { cellWidth: 60 },
          1: { cellWidth: 50 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 25, halign: 'right' },
          4: { cellWidth: 25, halign: 'right' }
        }
      });

      // Total
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFillColor(16, 185, 129);
      doc.rect(15, finalY, 180, 15, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL:', 20, finalY + 10);
      doc.text(`S/ ${Number(purchase.totalAmount).toFixed(2)}`, 190, finalY + 10, { align: 'right' });

      // Notas
      if (purchase.notes) {
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('NOTAS:', 15, finalY + 25);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        const splitNotes = doc.splitTextToSize(purchase.notes, 180);
        doc.text(splitNotes, 15, finalY + 32);
      }

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`orden-compra-${purchase.supplier?.name || 'sin-proveedor'}-${timestamp}.pdf`);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo PDF');
    }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Órdenes de Compra</h1>
          <ShoppingCart01Icon className="w-6 h-6 text-slate-500" strokeWidth={2} />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* BUSCADOR ANIMADO */}
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search01Icon className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={2} />
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
                <UserMultiple02Icon className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} /> <span className="font-bold">Proveedores</span>
              </Button>
              <div className="relative">
                <Button 
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  variant="ghost"
                  className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
                >
                  <DownloadCircle02Icon className="w-3.5 h-3.5 mr-1.5" strokeWidth={1.5} /> <span className="font-bold">Exportar</span>
                </Button>
                
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={exportToExcel}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2"
                      >
                        <DownloadCircle02Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                        Excel
                      </button>
                      <button
                        onClick={exportToPDF}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"
                      >
                        <DownloadCircle02Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
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
                <PlusSignIcon className="w-4 h-4 mr-1.5" strokeWidth={1.5} /> <span className="font-bold">Nueva Orden</span>
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
                {status === 'ALL' && <><LayoutGridIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Todas</>}
                {status === 'PENDING' && <><Clock01Icon className="w-3.5 h-3.5" strokeWidth={1.5} /> Pendientes</>}
                {status === 'RECEIVED' && <><CheckmarkCircle02Icon className="w-3.5 h-3.5" strokeWidth={1.5} /> Recibidas</>}
                {status === 'CANCELLED' && <><CancelCircleIcon className="w-3.5 h-3.5" strokeWidth={1.5} /> Canceladas</>}
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
                  <ArrowLeft01Icon className="w-4 h-4" strokeWidth={1.5} />
                </Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ArrowRight01Icon className="w-4 h-4" strokeWidth={1.5} />
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
                    Estado <FilterIcon className={`w-3.5 h-3.5 ${statusFilter !== "ALL" ? "text-slate-900" : ""}`} strokeWidth={1.5} />
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
                    Proveedor <FilterIcon className={`w-3.5 h-3.5 ${supplierFilter !== "ALL" ? "text-slate-900" : ""}`} strokeWidth={1.5} />
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
                <th className="px-5 py-3.5 font-semibold relative">
                  <div className="flex items-center gap-2">
                    <span>Fecha</span>
                    <button
                      onClick={() => setShowDateFilter(!showDateFilter)}
                      className="p-1 rounded hover:bg-slate-100 transition-colors"
                    >
                      <FilterIcon className="w-3.5 h-3.5 text-slate-400" />
                    </button>
                  </div>
                  {showDateFilter && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setShowDateFilter(false)} />
                      <div className="absolute top-full left-0 mt-1 bg-white border border-slate-200 shadow-xl rounded-xl p-4 z-40 min-w-[280px]">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-bold text-slate-700 mb-1 block">Desde</label>
                            <input
                              type="date"
                              value={dateFrom}
                              onChange={(e) => {setDateFrom(e.target.value); setCurrentPage(1);}}
                              className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-700 mb-1 block">Hasta</label>
                            <input
                              type="date"
                              value={dateTo}
                              onChange={(e) => {setDateTo(e.target.value); setCurrentPage(1);}}
                              className="w-full h-8 px-2 text-xs bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300"
                            />
                          </div>
                          {(dateFrom || dateTo) && (
                            <div className="pt-2 border-t border-slate-100">
                              <button
                                onClick={() => {setDateFrom(''); setDateTo(''); setCurrentPage(1);}}
                                className="text-xs text-red-600 hover:text-red-700 font-bold"
                              >
                                Limpiar fechas
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </th>
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
                      <ShoppingCart01Icon className="w-10 h-10 text-slate-200" strokeWidth={1} />
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
                          <Calendar03Icon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
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
                          <PackageIcon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                          <span className="text-slate-700 text-xs">{purchase.items.length} producto(s)</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-slate-700 text-sm">S/ {Number(purchase.totalAmount).toFixed(2)}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
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

      <NewPurchaseStepForm 
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
                        <div className="flex items-center gap-2 mb-1">
                          <div className="font-bold text-sm text-slate-900 truncate">
                            {item.variant.product.title}
                          </div>
                          {item.costModified && (
                            <span className="text-[8px] font-black px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                              COSTO MODIFICADO
                            </span>
                          )}
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
              <div className="flex items-center gap-4 shrink-0">
                <Button 
                  variant="outline" 
                  onClick={() => setIsDetailModalOpen(false)}
                  className="h-10 text-xs font-bold"
                >
                  Cerrar
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={() => exportSinglePurchaseToPDF(selectedPurchase)}
                  className="h-10 text-xs font-bold text-red-600 hover:bg-red-50 border-red-200"
                >
                  <DownloadCircle02Icon className="w-4 h-4 mr-1.5" />
                  Exportar PDF
                </Button>
                
                {selectedPurchase.supplier?.phone && (
                  <Button 
                    variant="outline"
                    onClick={() => {
                      const message = generatePurchaseOrderMessage(selectedPurchase);
                      const phone = selectedPurchase.supplier!.phone!.replace(/[^\d]/g, '');
                      const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
                      window.open(whatsappUrl, '_blank');
                    }}
                    className="h-10 text-xs font-bold text-green-600 hover:bg-green-50 border-green-200"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.309"/>
                    </svg>
                    WhatsApp
                  </Button>
                )}
              </div>
              
              {canManage && selectedPurchase.status === 'PENDING' && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={() => setShowCostAdjustment(true)}
                    className="h-10 text-xs font-bold text-orange-600 hover:bg-orange-50 border-orange-200"
                  >
                    <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    Ajustar Costos
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => handleCancel(selectedPurchase.id)}
                    className="h-10 text-xs font-bold text-red-600 hover:bg-red-50 border-red-200"
                  >
                    <CancelCircleIcon className="w-4 h-4 mr-1.5" />
                    Cancelar Orden
                  </Button>
                  <Button 
                    onClick={openBranchSelectModal}
                    className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckmarkCircle02Icon className="w-4 h-4 mr-1.5" />
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
                            <CheckmarkCircle02Icon className="w-2.5 h-2.5 mr-1" />
                            Completo
                          </Badge>
                        ) : (
                          <Badge className="text-[9px] font-black px-2 py-0.5 h-5 bg-red-100 text-red-700 border-red-300">
                            <CancelCircleIcon className="w-2.5 h-2.5 mr-1" />
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
                <CheckmarkCircle02Icon className="w-4 h-4 mr-1.5" />
                Confirmar Recepción
              </Button>
            </div>

          </DialogContent>
        </Dialog>
      )}

      {/* MODAL DE AJUSTE DE COSTOS */}
      {selectedPurchase && (
        <CostAdjustmentModal
          isOpen={showCostAdjustment}
          onClose={() => setShowCostAdjustment(false)}
          onSuccess={(updatedPurchase) => {
            mutate();
            setShowCostAdjustment(false);
            // Update the selected purchase with the new data
            setSelectedPurchase(updatedPurchase);
          }}
          purchase={selectedPurchase}
        />
      )}

    </div>
  );
}
