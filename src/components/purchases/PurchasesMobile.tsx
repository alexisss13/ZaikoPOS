'use client';

import { useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { usePurchasesLogic, PurchaseOrder } from './usePurchasesLogic';
import { StockDistributionMobile } from './StockDistributionMobile';
import { CostAdjustmentMobile } from './CostAdjustmentMobile';
import {
  ShoppingCart01Icon,
  ArrowLeft01Icon,
  PlusSignIcon,
  Clock01Icon,
  CheckmarkCircle02Icon,
  CancelCircleIcon,
  PackageIcon,
  UserMultiple02Icon,
  DownloadCircle02Icon,
  MoreHorizontalIcon,
  Search01Icon,
  Cancel01Icon,
  SlidersHorizontalIcon,
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

// Dynamic imports para formularios móviles - evita problemas de hooks
const NewOrderMobileForm = dynamic(() => import('./NewOrderMobileForm').then(m => ({ default: m.NewOrderMobileForm })), { 
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Cargando formulario...</p>
      </div>
    </div>
  )
});
const SuppliersMobileForm = dynamic(() => import('./SuppliersMobileForm').then(m => ({ default: m.SuppliersMobileForm })), { 
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Cargando formulario...</p>
      </div>
    </div>
  )
});
const ExportMobileForm = dynamic(() => import('./ExportMobileForm').then(m => ({ default: m.ExportMobileForm })), { 
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Cargando formulario...</p>
      </div>
    </div>
  )
});
const FiltersMobileForm = dynamic(() => import('./FiltersMobileForm').then(m => ({ default: m.FiltersMobileForm })), { 
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-slate-500">Cargando formulario...</p>
      </div>
    </div>
  )
});

const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };

type MobileView = 'list' | 'detail';

const statusConfig = {
  PENDING: { label: "Pendiente", color: "bg-yellow-100 text-yellow-700", icon: Clock01Icon },
  RECEIVED: { label: "Recibida", color: "bg-green-100 text-green-700", icon: CheckmarkCircle02Icon },
  CANCELLED: { label: "Cancelada", color: "bg-red-100 text-red-700", icon: CancelCircleIcon },
};

export default function PurchasesMobile() {
  // All hooks must be declared at the top level before any conditional logic
  const { role } = useAuth();
  const logic = usePurchasesLogic();
  const [currentView, setCurrentView] = useState<MobileView>('list');
  const [showMenu, setShowMenu] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showNewOrderForm, setShowNewOrderForm] = useState(false);
  const [showSuppliersForm, setShowSuppliersForm] = useState(false);
  const [showExportForm, setShowExportForm] = useState(false);
  const [showStockDistribution, setShowStockDistribution] = useState(false);
  const [showCostAdjustment, setShowCostAdjustment] = useState(false);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const ITEMS_PER_PAGE = 5;

  // Extract logic properties after all hooks are declared
  const {
    isLoading,
    filteredPurchases,
    selectedPurchase,
    setSelectedPurchase,
    statusFilter,
    setStatusFilter,
    searchTerm,
    setSearchTerm,
    handleCancel,
    mutate,
  } = logic;

  // Derived values
  const canManage = role === 'OWNER' || role === 'MANAGER';

  // Filtrado con fechas
  const filteredPurchasesWithDates = useMemo(() => {
    if (!filteredPurchases) return [];
    
    return filteredPurchases.filter(purchase => {
      // Filtro por fecha
      if (dateFrom || dateTo) {
        const orderDate = new Date(purchase.orderDate);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo + 'T23:59:59') : null;
        
        if (fromDate && orderDate < fromDate) return false;
        if (toDate && orderDate > toDate) return false;
      }
      
      return true;
    });
  }, [filteredPurchases, dateFrom, dateTo]);

  // Paginación
  const paginatedPurchases = useMemo(() => {
    return filteredPurchasesWithDates.slice(0, currentPage * ITEMS_PER_PAGE);
  }, [filteredPurchasesWithDates, currentPage]);

  const hasMoreItems = filteredPurchasesWithDates.length > currentPage * ITEMS_PER_PAGE;
  const remainingItems = filteredPurchasesWithDates.length - (currentPage * ITEMS_PER_PAGE);

  const loadMore = () => {
    setCurrentPage(prev => prev + 1);
  };

  const handleSelectPurchase = (purchase: PurchaseOrder) => {
    haptic(8);
    setSelectedPurchase(purchase);
    setCurrentView('detail');
  };

  const handleBack = () => {
    haptic(8);
    setCurrentView('list');
    setSelectedPurchase(null);
  };

  const handleCancelPurchase = async () => {
    if (!selectedPurchase) return;
    
    if (!confirm('¿Cancelar esta orden de compra?')) return;
    
    haptic(20);
    const success = await handleCancel(selectedPurchase.id);
    if (success) {
      handleBack();
    }
  };

  const exportToExcel = async () => {
    if (!filteredPurchases || filteredPurchases.length === 0) {
      alert('No hay órdenes para exportar');
      return;
    }

    try {
      const XLSX = await import('xlsx-js-style');

      const headers = ['ID', 'Proveedor', 'Estado', 'Fecha de Orden', 'Cant. Productos', 'Total', 'Creado por'];
      
      const exportData = filteredPurchases.map(purchase => [
        purchase.id,
        purchase.supplier?.name || 'Sin proveedor',
        statusConfig[purchase.status].label,
        new Date(purchase.orderDate).toLocaleDateString('es-PE'),
        purchase.items.length,
        Number(purchase.totalAmount).toFixed(2),
        purchase.createdBy?.name || '',
      ]);

      const ws_data = [headers, ...exportData];
      const worksheet = XLSX.utils.aoa_to_sheet(ws_data);

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

      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `ordenes-compra-${timestamp}.xlsx`);

      haptic(20);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo Excel');
    }
  };

  const shareViaWhatsApp = (purchase: PurchaseOrder) => {
    if (!purchase.supplier?.phone) return;
    
    const message = generatePurchaseOrderMessage(purchase);
    const phone = purchase.supplier.phone.replace(/[^\d]/g, ''); // Remove non-digits
    const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
    haptic(20);
  };

  const generatePurchaseOrderMessage = (purchase: PurchaseOrder): string => {
    const supplierName = purchase.supplier?.name || 'Proveedor';
    const orderDate = new Date(purchase.orderDate).toLocaleDateString('es-PE', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric'
    });
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
      doc.text(`Fecha de Orden: ${new Date(purchase.orderDate).toLocaleDateString('es-PE', { 
        day: '2-digit', 
        month: 'long', 
        year: 'numeric'
      })}`, 15, 58);
      
      if (purchase.receivedDate) {
        doc.text(`Fecha de Recepción: ${new Date(purchase.receivedDate).toLocaleDateString('es-PE', { 
          day: '2-digit', 
          month: 'long', 
          year: 'numeric'
        })}`, 15, 64);
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
      
      haptic(20);
      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo PDF');
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
      
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 297, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('ÓRDENES DE COMPRA', 148.5, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 148.5, 25, { align: 'center' });

      const tableData = filteredPurchases.map(purchase => [
        new Date(purchase.orderDate).toLocaleDateString('es-PE'),
        purchase.supplier?.name || 'Sin proveedor',
        statusConfig[purchase.status].label,
        purchase.items.length.toString(),
        `S/ ${Number(purchase.totalAmount).toFixed(2)}`,
        purchase.createdBy?.name || '-'
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Proveedor', 'Estado', 'Productos', 'Total', 'Creado por']],
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
        }
      });

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`ordenes-compra-${timestamp}.pdf`);
      
      haptic(20);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo PDF');
    }
  };

  // Define renderDetailView function before the main return
  function renderDetailView() {
    if (!selectedPurchase) return null;

    const statusInfo = statusConfig[selectedPurchase.status];
    const StatusIcon = statusInfo.icon;

    return (
      <div 
        className="fixed inset-0 bg-white z-50 flex flex-col"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Orden de Compra</h2>
            <p className="text-xs text-slate-500">
              {selectedPurchase.supplier?.name || 'Sin proveedor'}
            </p>
          </div>
          <Badge className={`text-[9px] font-semibold px-2 py-1 rounded-full ${statusInfo.color}`}>
            <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
            {statusInfo.label}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {/* Info general */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Fecha de orden</span>
                <span className="text-xs font-bold text-slate-900">
                  {new Date(selectedPurchase.orderDate).toLocaleDateString('es-PE', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric'
                  })}
                </span>
              </div>
              {selectedPurchase.receivedDate && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-600">Fecha de recepción</span>
                  <span className="text-xs font-bold text-slate-900">
                    {new Date(selectedPurchase.receivedDate).toLocaleDateString('es-PE', { 
                      day: '2-digit', 
                      month: 'long', 
                      year: 'numeric'
                    })}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Creado por</span>
                <span className="text-xs font-bold text-slate-900">
                  {selectedPurchase.createdBy?.name || '-'}
                </span>
              </div>
            </div>
          </div>

          {/* Productos */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <PackageIcon className="w-4 h-4" />
              Productos ({selectedPurchase.items.length})
            </h3>
            <div className="space-y-2">
              {selectedPurchase.items.map((item) => (
                <div key={item.id} className="flex justify-between items-start p-2 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-slate-900">{item.variant.product.title}</p>
                      {item.costModified && (
                        <span className="text-[8px] font-black px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
                          COSTO MODIFICADO
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500">{item.variant.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {item.quantity} {item.uom?.abbreviation || 'und'} × S/ {Number(item.cost).toFixed(2)}
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-900">
                    S/ {(item.quantity * Number(item.cost)).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center pt-3 mt-3 border-t border-slate-200">
              <span className="text-sm font-bold text-slate-700">Total</span>
              <span className="text-lg font-bold text-slate-900">
                S/ {Number(selectedPurchase.totalAmount).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notas */}
          {selectedPurchase.notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">Notas</h3>
              <p className="text-xs text-slate-600">{selectedPurchase.notes}</p>
            </div>
          )}

          {/* Acciones */}
          {selectedPurchase.status === 'PENDING' && canManage && (
            <div className="space-y-3">
              {/* Botones principales en grid */}
              <div className="grid grid-cols-2 gap-2">
                {selectedPurchase.supplier?.phone && (
                  <Button
                    onClick={() => shareViaWhatsApp(selectedPurchase)}
                    className="h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.309"/>
                    </svg>
                    <span className="text-xs">WhatsApp</span>
                  </Button>
                )}
                <Button
                  onClick={() => exportSinglePurchaseToPDF(selectedPurchase)}
                  className="h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <DownloadCircle02Icon className="w-4 h-4" />
                  <span className="text-xs">PDF</span>
                </Button>
              </div>
              
              {/* Botones de acción secundarios */}
              <div className="grid grid-cols-1 gap-2">
                <Button
                  onClick={() => setShowCostAdjustment(true)}
                  variant="outline"
                  className="w-full h-11 border-2 border-blue-200 text-blue-600 hover:bg-blue-50 font-bold rounded-xl"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                  Ajustar Costos
                </Button>
                <Button
                  onClick={() => setShowStockDistribution(true)}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl"
                >
                  <CheckmarkCircle02Icon className="w-4 h-4 mr-2" />
                  Marcar como Recibida
                </Button>
                <Button
                  onClick={handleCancelPurchase}
                  variant="outline"
                  className="w-full h-11 border-2 border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl"
                >
                  <CancelCircleIcon className="w-4 h-4 mr-2" />
                  Cancelar Orden
                </Button>
              </div>
            </div>
          )}
          
          {selectedPurchase.status !== 'PENDING' && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => exportSinglePurchaseToPDF(selectedPurchase)}
                className="h-11 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
              >
                <DownloadCircle02Icon className="w-4 h-4" />
                <span className="text-xs">Exportar PDF</span>
              </Button>
              {selectedPurchase.supplier?.phone && (
                <Button
                  onClick={() => shareViaWhatsApp(selectedPurchase)}
                  className="h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.309"/>
                  </svg>
                  <span className="text-xs">WhatsApp</span>
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full gap-5">
      {/* Native forms */}
      {showNewOrderForm && (
        <NewOrderMobileForm
          onClose={() => setShowNewOrderForm(false)}
          onSuccess={() => {
            setShowNewOrderForm(false);
            mutate();
          }}
        />
      )}

      {showSuppliersForm && (
        <SuppliersMobileForm
          onClose={() => setShowSuppliersForm(false)}
          onSuccess={() => {
            setShowSuppliersForm(false);
            mutate();
          }}
        />
      )}

      {showExportForm && (
        <ExportMobileForm
          onClose={() => setShowExportForm(false)}
          onSuccess={() => setShowExportForm(false)}
          onExportExcel={exportToExcel}
          onExportPDF={exportToPDF}
        />
      )}

      {showFilters && (
        <FiltersMobileForm
          onClose={() => setShowFilters(false)}
          onApply={(filters) => {
            setStatusFilter(filters.status as any);
            setDateFrom(filters.dateFrom);
            setDateTo(filters.dateTo);
            setCurrentPage(1); // Reset pagination when filters change
          }}
          currentStatus={statusFilter}
          currentDateFrom={dateFrom}
          currentDateTo={dateTo}
        />
      )}

      {/* Stock Distribution Modal */}
      {selectedPurchase && showStockDistribution && (
        <StockDistributionMobile
          isOpen={showStockDistribution}
          onClose={() => setShowStockDistribution(false)}
          onSuccess={() => {
            setShowStockDistribution(false);
            mutate();
            handleBack();
          }}
          purchase={selectedPurchase}
        />
      )}

      {/* Cost Adjustment Modal */}
      {selectedPurchase && showCostAdjustment && (
        <CostAdjustmentMobile
          isOpen={showCostAdjustment}
          onClose={() => setShowCostAdjustment(false)}
          onSuccess={(updatedPurchase: PurchaseOrder) => {
            setShowCostAdjustment(false);
            // Actualizar el selectedPurchase con los nuevos datos
            setSelectedPurchase(updatedPurchase);
            // También refrescar la lista completa
            mutate();
          }}
          purchase={selectedPurchase}
        />
      )}

      {/* Contenido principal - maneja loading internamente sin early returns */}
      <div className="flex-1 overflow-y-auto space-y-2.5">
        {isLoading ? (
          // Loading state
          <>
            <div className="flex items-center gap-2 mb-5">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-slate-900 leading-tight">Órdenes de Compra</h1>
                <p className="text-xs text-slate-400 mt-0.5">Cargando...</p>
              </div>
            </div>
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-32 animate-pulse" />
              ))}
            </div>
          </>
        ) : currentView === 'list' ? (
          <>
            {/* Header móvil */}
            <div className="flex flex-col gap-3 mb-5">
              <div className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl font-black text-slate-900 leading-tight">Órdenes de Compra</h1>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {filteredPurchasesWithDates.length} resultado{filteredPurchasesWithDates.length !== 1 ? 's' : ''}
                    {(statusFilter !== 'ALL' || dateFrom || dateTo) && <span className="ml-1 text-slate-500">· filtrado</span>}
                  </p>
                </div>
                
                <button 
                  onClick={() => setShowFilters(true)} 
                  className="relative h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                >
                  <SlidersHorizontalIcon className="w-4 h-4" />
                  {statusFilter !== 'ALL' && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">•</span>
                  )}
                </button>
                
                {canManage && (
                  <Button 
                    onClick={() => setShowNewOrderForm(true)} 
                    className="h-10 w-10 p-0 bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-xl shrink-0"
                  >
                    <PlusSignIcon className="w-5 h-5" />
                  </Button>
                )}
                
                <div className="relative">
                  <button 
                    onClick={() => setShowMenu(v => !v)} 
                    className="h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
                  >
                    <MoreHorizontalIcon className="w-4 h-4" />
                  </button>
                  {showMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                      <div className="absolute right-0 top-12 w-44 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50">
                        {canManage && (
                          <button 
                            onClick={() => { setShowMenu(false); setShowSuppliersForm(true); }} 
                            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            <UserMultiple02Icon className="w-4 h-4 text-slate-400" /> 
                            Proveedores
                          </button>
                        )}
                        <div className="h-px bg-slate-100 mx-2 my-1" />
                        <button 
                          onClick={() => { setShowMenu(false); setShowExportForm(true); }} 
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <DownloadCircle02Icon className="w-4 h-4 text-slate-400" /> 
                          Exportar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Search bar */}
              <div className="relative">
                <Search01Icon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Buscar proveedor, producto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 h-9 bg-white border-slate-200 rounded-xl text-sm shadow-sm"
                />
                {searchTerm && (
                  <button
                    onClick={() => { haptic(8); setSearchTerm(''); }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 active:scale-95 transition-all"
                  >
                    <Cancel01Icon className="w-4 h-4 text-slate-400" />
                  </button>
                )}
              </div>

              {/* Active filter chips */}
              {statusFilter !== 'ALL' && (
                <div className="flex gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-full">
                    {statusConfig[statusFilter].label}
                    <button onClick={() => setStatusFilter('ALL')}>
                      <Cancel01Icon className="w-3 h-3" />
                    </button>
                  </span>
                </div>
              )}
            </div>

            {/* Lista de órdenes */}
            {filteredPurchasesWithDates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart01Icon className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1">Sin órdenes</p>
                <p className="text-xs text-slate-500">No hay órdenes de compra</p>
              </div>
            ) : (
              <>
                {paginatedPurchases.map((purchase) => {
                const statusInfo = statusConfig[purchase.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <button
                    key={purchase.id}
                    onClick={() => handleSelectPurchase(purchase)}
                    className="w-full bg-white rounded-2xl border border-slate-200 p-4 shadow-sm active:scale-[0.98] transition-transform text-left"
                    style={{ 
                      WebkitTapHighlightColor: 'transparent',
                      transform: 'translateZ(0)',
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-slate-900">
                            {purchase.supplier?.name || 'Sin proveedor'}
                          </span>
                          <Badge className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusInfo.color}`}>
                            <StatusIcon className="w-2.5 h-2.5 mr-0.5" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-slate-400">
                          {new Date(purchase.createdAt).toLocaleString('es-PE', { 
                            day: '2-digit', 
                            month: 'short',
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <p className="text-[10px] font-bold text-blue-700 mb-0.5">PRODUCTOS</p>
                        <p className="text-sm font-bold text-blue-900">{purchase.items.length}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg p-2">
                        <p className="text-[10px] font-bold text-emerald-700 mb-0.5">TOTAL</p>
                        <p className="text-sm font-bold text-emerald-900">S/ {Number(purchase.totalAmount).toFixed(2)}</p>
                      </div>
                    </div>
                  </button>
                );
                })}
                
                {/* Botón Cargar Más */}
                {hasMoreItems && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={loadMore}
                      variant="outline"
                      className="h-11 px-6 bg-white border-2 border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl"
                    >
                      Cargar más ({remainingItems} restantes)
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          renderDetailView()
        )}
      </div>
    </div>
  );
}
