'use client';

import useSWR from 'swr';
import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Warehouse, Search, ChevronLeft, ChevronRight, Download, 
  ArrowUpCircle, ArrowDownCircle, Settings, Filter, Package, Store, User, Calendar, ArrowRightLeft, Check, X, XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { StockMovementModal } from '@/components/dashboard/StockMovementModal';
import { TransferModal } from '@/components/dashboard/TransferModal';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface StockMovement {
  id: string;
  type: 'INPUT' | 'OUTPUT' | 'ADJUSTMENT' | 'SALE_POS' | 'SALE_ECOMMERCE' | 'PURCHASE' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason: string | null;
  createdAt: string;
  variant: {
    name: string;
    product: {
      title: string;
    };
  };
  branch: {
    name: string;
  };
  user: {
    name: string;
  };
}

interface StockTransfer {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  fromBranch: { name: string };
  toBranch: { name: string };
  requestedBy: { name: string };
  items: {
    id: string;
    quantity: number;
    variant: {
      name: string;
      product: {
        title: string;
        images: string[];
      };
    };
  }[];
}

const ITEMS_PER_PAGE = 8;

const movementTypeConfig = {
  INPUT: { label: 'Entrada', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: ArrowUpCircle },
  OUTPUT: { label: 'Salida', color: 'bg-red-100 text-red-700 border-red-300', icon: ArrowDownCircle },
  ADJUSTMENT: { label: 'Ajuste', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Settings },
  SALE_POS: { label: 'Venta POS', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Package },
  SALE_ECOMMERCE: { label: 'Venta Online', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: Package },
  PURCHASE: { label: 'Compra', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Package },
  TRANSFER: { label: 'Traslado', color: 'bg-cyan-100 text-cyan-700 border-cyan-300', icon: ArrowUpCircle },
};

function InventoryPageContent() {
  const { role } = useAuth();
  const canManage = role === 'OWNER' || role === 'MANAGER';
  const searchParams = useSearchParams();

  const { data: movements, isLoading, mutate } = useSWR<StockMovement[]>('/api/inventory/movements', fetcher);
  const { data: transfers, mutate: mutateTransfers } = useSWR<StockTransfer[]>('/api/stock-transfers', fetcher);
  const { data: branches } = useSWR('/api/branches', fetcher);

  const [activeTab, setActiveTab] = useState<'kardex' | 'transfers'>('kardex');

  // Check URL params to switch to transfers tab if coming from notification
  useEffect(() => {
    if (searchParams) {
      const tab = searchParams.get('tab');
      if (tab === 'transfers') {
        setActiveTab('transfers');
      }
    }
  }, [searchParams]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | StockMovement['type']>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [kardexPage, setKardexPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferStatusFilter, setTransferStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [processingTransferId, setProcessingTransferId] = useState<string | null>(null);
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showBranchFilter, setShowBranchFilter] = useState(false);
  const [showTransferStatusFilter, setShowTransferStatusFilter] = useState(false);

  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    
    return movements.filter(movement => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        movement.variant.product.title.toLowerCase().includes(searchLower) ||
        (movement.reason && movement.reason.toLowerCase().includes(searchLower)) ||
        movement.user.name.toLowerCase().includes(searchLower);

      const matchesType = typeFilter === 'ALL' || movement.type === typeFilter;
      const matchesBranch = branchFilter === 'ALL' || movement.branch.name === branchFilter;

      let matchesDateFrom = true;
      let matchesDateTo = true;
      
      if (dateFrom || dateTo) {
        const movementDateStr = movement.createdAt.split('T')[0];
        if (dateFrom) matchesDateFrom = movementDateStr >= dateFrom;
        if (dateTo) matchesDateTo = movementDateStr <= dateTo;
      }

      return matchesSearch && matchesType && matchesBranch && matchesDateFrom && matchesDateTo;
    });
  }, [movements, searchTerm, typeFilter, branchFilter, dateFrom, dateTo]);

  const filteredTransfers = useMemo(() => {
    if (!transfers) return [];
    
    return transfers.filter(transfer => {
      const matchesStatus = transferStatusFilter === 'ALL' || transfer.status === transferStatusFilter;
      
      let matchesDateFrom = true;
      let matchesDateTo = true;
      
      if (dateFrom || dateTo) {
        const transferDateStr = transfer.createdAt.split('T')[0];
        if (dateFrom) matchesDateFrom = transferDateStr >= dateFrom;
        if (dateTo) matchesDateTo = transferDateStr <= dateTo;
      }

      return matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [transfers, transferStatusFilter, dateFrom, dateTo]);

  const kardexTotalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE) || 1;
  const paginatedMovements = filteredMovements.slice(
    (kardexPage - 1) * ITEMS_PER_PAGE, 
    kardexPage * ITEMS_PER_PAGE
  );

  const transfersTotalPages = Math.ceil(filteredTransfers.length / ITEMS_PER_PAGE) || 1;
  const paginatedTransfers = filteredTransfers.slice(
    (transfersPage - 1) * ITEMS_PER_PAGE,
    transfersPage * ITEMS_PER_PAGE
  );

  const exportToExcel = async () => {
    if (!filteredMovements || filteredMovements.length === 0) {
      alert('No hay movimientos para exportar');
      return;
    }

    try {
      const XLSX = await import('xlsx-js-style');

      const headers = ['Fecha', 'Tipo', 'Producto', 'Variante', 'Motivo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Sucursal', 'Usuario'];
      
      const exportData = filteredMovements.map(movement => [
        new Date(movement.createdAt).toLocaleString('es-PE'),
        movementTypeConfig[movement.type].label,
        movement.variant.product.title,
        movement.variant.name,
        movement.reason || '',
        movement.type === 'ADJUSTMENT' 
          ? (movement.currentStock - movement.previousStock)
          : movement.type === 'TRANSFER'
          ? (movement.currentStock > movement.previousStock ? movement.quantity : -movement.quantity)
          : (movement.type === 'INPUT' || movement.type === 'PURCHASE' ? movement.quantity : -movement.quantity),
        movement.previousStock,
        movement.currentStock,
        movement.branch.name,
        movement.user.name,
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kardex');

      worksheet['!cols'] = [
        { wch: 20 }, { wch: 18 }, { wch: 35 }, { wch: 20 }, { wch: 30 },
        { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `kardex-inventario-${timestamp}.xlsx`);

      alert('Archivo Excel generado correctamente');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      alert('Error al generar el archivo Excel');
    }
  };

  const exportToPDF = async () => {
    if (!filteredMovements || filteredMovements.length === 0) {
      alert('No hay movimientos para exportar');
      return;
    }

    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Encabezado corporativo con color sólido RGB
      doc.setFillColor(30, 41, 59); // slate-800
      doc.rect(0, 0, 297, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('KARDEX DE INVENTARIO', 148.5, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 148.5, 25, { align: 'center' });

      // Preparar datos de la tabla
      const tableData = filteredMovements.map(movement => [
        new Date(movement.createdAt).toLocaleDateString('es-PE'),
        movementTypeConfig[movement.type].label,
        movement.variant.product.title,
        movement.reason || '-',
        movement.type === 'ADJUSTMENT' 
          ? (movement.currentStock - movement.previousStock).toString()
          : movement.type === 'TRANSFER'
          ? (movement.currentStock > movement.previousStock ? `+${movement.quantity}` : `-${movement.quantity}`)
          : (movement.type === 'INPUT' || movement.type === 'PURCHASE' ? `+${movement.quantity}` : `-${movement.quantity}`),
        movement.previousStock.toString(),
        movement.currentStock.toString(),
        movement.branch.name,
        movement.user.name
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Tipo', 'Producto', 'Motivo', 'Cant.', 'Había', 'Hay', 'Sucursal', 'Usuario']],
        body: tableData,
        theme: 'grid',
        headStyles: {
          fillColor: [30, 41, 59], // RGB sólido
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
          1: { cellWidth: 25 },
          2: { cellWidth: 50 },
          3: { cellWidth: 40 },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 15, halign: 'center' },
          7: { cellWidth: 30 },
          8: { cellWidth: 30 }
        }
      });

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`kardex-inventario-${timestamp}.pdf`);
      
      alert('Archivo PDF generado correctamente');
      setShowExportMenu(false);
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
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Kardex de Inventario</h1>
          <Warehouse className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              placeholder="Buscar producto, motivo..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setKardexPage(1); }} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>

          {canManage && (
            <>
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
                onClick={() => {
                  setActiveTab('transfers');
                  setIsTransferModalOpen(true);
                }}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" /> <span className="font-bold">Nuevo traslado</span>
              </Button>
              <Button 
                onClick={() => setIsMovementModalOpen(true)}
                className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0"
              >
                <ArrowUpCircle className="w-4 h-4 mr-1.5" /> <span className="font-bold">Nuevo Movimiento</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* TABS: KARDEX Y TRASLADOS */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 bg-white">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button
              onClick={() => setActiveTab('kardex')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'kardex'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Warehouse className="w-3.5 h-3.5 inline-block mr-2" />
              Kardex
            </button>
            <button
              onClick={() => setActiveTab('transfers')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === 'transfers'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 inline-block mr-2" />
              Traslados
              {transfers && transfers.filter(t => t.status === 'PENDING').length > 0 && (
                <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                  {transfers.filter(t => t.status === 'PENDING').length}
                </span>
              )}
            </button>
          </div>

          {/* Filtros de fecha y paginación para traslados */}
          {activeTab === 'transfers' ? (
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); }}
                  className="h-8 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  placeholder="Desde"
                />
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => { setDateTo(e.target.value); }}
                  className="h-8 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                  placeholder="Hasta"
                />
                {(dateFrom || dateTo) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDateFrom('');
                      setDateTo('');
                    }}
                    className="h-8 text-xs font-bold text-slate-600 hover:text-slate-900 px-2"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
              
              {transfersTotalPages > 1 && (
                <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                    Pág {transfersPage} de {transfersTotalPages}
                  </span>
                  <div className="flex gap-1.5">
                    <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setTransfersPage(p => Math.max(1, p - 1))} disabled={transfersPage === 1}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setTransfersPage(p => Math.min(transfersTotalPages, p + 1))} disabled={transfersPage === transfersTotalPages}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            kardexTotalPages > 1 && (
              <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                  Pág {kardexPage} de {kardexTotalPages}
                </span>
                <div className="flex gap-1.5">
                  <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setKardexPage(p => Math.max(1, p - 1))} disabled={kardexPage === 1}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setKardexPage(p => Math.min(kardexTotalPages, p + 1))} disabled={kardexPage === kardexTotalPages}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )
          )}
        </div>

        {activeTab === 'kardex' ? (
          <>
            {/* TABLA */}
            <div className="overflow-x-auto flex-1 relative custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
                <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold rounded-tl-xl">Fecha</th>
                    <th className="px-5 py-3.5 font-semibold relative select-none">
                      <div 
                        className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${typeFilter !== 'ALL' || showTypeFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                        onClick={() => setShowTypeFilter(!showTypeFilter)}
                      >
                        Tipo <Filter className={`w-3.5 h-3.5 ${typeFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                      </div>
                      
                      {showTypeFilter && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowTypeFilter(false)} />
                          <div className="absolute top-10 left-3 w-[160px] bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => {setTypeFilter('ALL'); setShowTypeFilter(false); setKardexPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${typeFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                              Todos
                            </button>
                            <button onClick={() => {setTypeFilter('INPUT'); setShowTypeFilter(false); setKardexPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${typeFilter === 'INPUT' ? 'bg-emerald-50 text-emerald-700' : 'text-emerald-600 hover:bg-emerald-50/50'}`}>
                              Entradas
                            </button>
                            <button onClick={() => {setTypeFilter('OUTPUT'); setShowTypeFilter(false); setKardexPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${typeFilter === 'OUTPUT' ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50/50'}`}>
                              Salidas
                            </button>
                            <button onClick={() => {setTypeFilter('ADJUSTMENT'); setShowTypeFilter(false); setKardexPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${typeFilter === 'ADJUSTMENT' ? 'bg-amber-50 text-amber-700' : 'text-amber-600 hover:bg-amber-50/50'}`}>
                              Ajustes
                            </button>
                            <button onClick={() => {setTypeFilter('SALE_POS'); setShowTypeFilter(false); setKardexPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${typeFilter === 'SALE_POS' ? 'bg-blue-50 text-blue-700' : 'text-blue-600 hover:bg-blue-50/50'}`}>
                              Ventas
                            </button>
                            <button onClick={() => {setTypeFilter('PURCHASE'); setShowTypeFilter(false); setKardexPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${typeFilter === 'PURCHASE' ? 'bg-purple-50 text-purple-700' : 'text-purple-600 hover:bg-purple-50/50'}`}>
                              Compras
                            </button>
                            <button onClick={() => {setTypeFilter('TRANSFER'); setShowTypeFilter(false); setKardexPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${typeFilter === 'TRANSFER' ? 'bg-cyan-50 text-cyan-700' : 'text-cyan-600 hover:bg-cyan-50/50'}`}>
                              Traslados
                            </button>
                          </div>
                        </>
                      )}
                    </th>
                    <th className="px-5 py-3.5 font-semibold">Producto</th>
                    <th className="px-5 py-3.5 font-semibold">Motivo</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Cantidad</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Había</th>
                    <th className="px-5 py-3.5 font-semibold text-center">Hay</th>
                    <th className="px-5 py-3.5 font-semibold relative select-none">
                      <div 
                        className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${branchFilter !== 'ALL' || showBranchFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                        onClick={() => setShowBranchFilter(!showBranchFilter)}
                      >
                        Sucursal <Filter className={`w-3.5 h-3.5 ${branchFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                      </div>
                      
                      {showBranchFilter && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowBranchFilter(false)} />
                          <div className="absolute top-10 left-3 w-[180px] bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar">
                            <button onClick={() => {setBranchFilter('ALL'); setShowBranchFilter(false); setKardexPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${branchFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                              Todas las sucursales
                            </button>
                            <div className="h-px bg-slate-100 my-1 mx-2" />
                            {branches?.map((branch: any) => (
                              <button key={branch.id} onClick={() => {setBranchFilter(branch.name); setShowBranchFilter(false); setKardexPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors ${branchFilter === branch.name ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                                {branch.name}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </th>
                    <th className="px-5 py-3.5 font-semibold rounded-tr-xl">Usuario</th>
                  </tr>
                </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? (
                Array(8).fill(0).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={9} className="p-4">
                      <Skeleton className="h-10 w-full rounded-xl" />
                    </td>
                  </tr>
                ))
              ) : paginatedMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Warehouse className="w-10 h-10 text-slate-200" strokeWidth={1} />
                      <p className="font-medium text-sm text-slate-500">No se encontraron movimientos</p>
                      <Button variant="link" className="text-xs h-6 text-slate-900 font-bold" onClick={() => { setSearchTerm(''); setTypeFilter('ALL'); setBranchFilter('ALL'); setDateFrom(''); setDateTo(''); setKardexPage(1); }}>
                        Limpiar filtros
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedMovements.map((movement) => {
                  const typeInfo = movementTypeConfig[movement.type];
                  const TypeIcon = typeInfo.icon;

                  return (
                    <tr key={movement.id} className="hover:bg-slate-50 transition-colors group text-xs">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-700 text-[11px]">
                              {new Date(movement.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {new Date(movement.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <Badge className={`text-[9px] font-black px-2 py-0.5 h-5 shadow-none border ${typeInfo.color}`}>
                          <TypeIcon className="w-2.5 h-2.5 mr-1" />
                          {typeInfo.label}
                        </Badge>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 text-sm truncate max-w-[200px]">
                            {movement.variant.product.title}
                          </span>
                          <span className="text-[10px] text-slate-500">{movement.variant.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-slate-600 text-xs truncate max-w-[180px] block">
                          {movement.reason || '-'}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`font-bold text-sm ${
                          movement.type === 'ADJUSTMENT'
                            ? (movement.currentStock > movement.previousStock ? 'text-emerald-600' : 'text-red-600')
                            : movement.type === 'TRANSFER'
                            ? (movement.currentStock > movement.previousStock ? 'text-emerald-600' : 'text-red-600')
                            : (movement.type === 'INPUT' || movement.type === 'PURCHASE')
                            ? 'text-emerald-600' 
                            : 'text-red-600'
                        }`}>
                          {movement.type === 'ADJUSTMENT' 
                            ? (movement.currentStock > movement.previousStock 
                                ? `+${movement.currentStock - movement.previousStock}` 
                                : `${movement.currentStock - movement.previousStock}`)
                            : movement.type === 'TRANSFER'
                            ? (movement.currentStock > movement.previousStock 
                                ? `+${movement.quantity}` 
                                : `-${movement.quantity}`)
                            : (movement.type === 'INPUT' || movement.type === 'PURCHASE'
                                ? `+${movement.quantity}` 
                                : `-${movement.quantity}`)
                          }
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-slate-500 font-medium text-xs">{movement.previousStock}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-slate-700 font-bold text-sm">{movement.currentStock}</span>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <Store className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-medium">{movement.branch.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1.5 text-slate-600">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-xs font-medium truncate max-w-[120px]">{movement.user.name}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
          </>
        ) : (
          <>
            {/* TABLA DE TRASLADOS */}
            <div className="overflow-x-auto flex-1 relative custom-scrollbar">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[900px]">
                <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30">
                  <tr>
                    <th className="px-5 py-3.5 font-semibold rounded-tl-xl relative select-none">
                      <div 
                        className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${transferStatusFilter !== 'ALL' || showTransferStatusFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                        onClick={() => setShowTransferStatusFilter(!showTransferStatusFilter)}
                      >
                        Estado <Filter className={`w-3.5 h-3.5 ${transferStatusFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                      </div>
                      
                      {showTransferStatusFilter && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setShowTransferStatusFilter(false)} />
                          <div className="absolute top-10 left-3 w-[140px] bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                            <button onClick={() => {setTransferStatusFilter('ALL'); setShowTransferStatusFilter(false);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${transferStatusFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                              Todos
                            </button>
                            <button onClick={() => {setTransferStatusFilter('PENDING'); setShowTransferStatusFilter(false);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${transferStatusFilter === 'PENDING' ? 'bg-amber-50 text-amber-700' : 'text-amber-600 hover:bg-amber-50/50'}`}>
                              Pendientes
                            </button>
                            <button onClick={() => {setTransferStatusFilter('APPROVED'); setShowTransferStatusFilter(false);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${transferStatusFilter === 'APPROVED' ? 'bg-emerald-50 text-emerald-700' : 'text-emerald-600 hover:bg-emerald-50/50'}`}>
                              Aprobados
                            </button>
                            <button onClick={() => {setTransferStatusFilter('REJECTED'); setShowTransferStatusFilter(false);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${transferStatusFilter === 'REJECTED' ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50/50'}`}>
                              Rechazados
                            </button>
                          </div>
                        </>
                      )}
                    </th>
                    <th className="px-5 py-3.5 font-semibold">Origen → Destino</th>
                    <th className="px-5 py-3.5 font-semibold">Productos</th>
                    <th className="px-5 py-3.5 font-semibold">Solicitante</th>
                    <th className="px-5 py-3.5 font-semibold">Fecha</th>
                    {canManage && <th className="px-5 py-3.5 font-semibold rounded-tr-xl text-center">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/80">
                  {!transfers ? (
                    Array(5).fill(0).map((_, i) => (
                      <tr key={i}>
                        <td colSpan={canManage ? 6 : 5} className="p-4">
                          <Skeleton className="h-16 w-full rounded-xl" />
                        </td>
                      </tr>
                    ))
                  ) : filteredTransfers.length === 0 ? (
                    <tr>
                      <td colSpan={canManage ? 6 : 5} className="py-20 text-center">
                        <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                          <ArrowRightLeft className="w-10 h-10 text-slate-200" strokeWidth={1} />
                          <p className="font-medium text-sm text-slate-500">No hay traslados</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTransfers.map((transfer) => {
                        const statusConfig: Record<'PENDING' | 'APPROVED' | 'REJECTED', { label: string; color: string }> = {
                          PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-300' },
                          APPROVED: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
                          REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-300' }
                        };

                        return (
                          <tr key={transfer.id} className="hover:bg-slate-50 transition-colors group text-xs">
                            <td className="px-5 py-3">
                              <Badge className={`text-[9px] font-black px-2 py-0.5 h-5 shadow-none border ${statusConfig[transfer.status].color}`}>
                                {statusConfig[transfer.status].label}
                              </Badge>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <Store className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-700 text-xs">{transfer.fromBranch.name}</span>
                                <ArrowRightLeft className="w-3 h-3 text-slate-400" />
                                <span className="text-slate-700 text-xs">{transfer.toBranch.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <Package className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-700 text-xs">{transfer.items.length} producto(s)</span>
                              </div>
                              <details className="mt-1">
                                <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-700">
                                  Ver detalle
                                </summary>
                                <div className="mt-2 space-y-1 pl-2 border-l-2 border-slate-200">
                                  {transfer.items.map((item) => (
                                    <div key={item.id} className="text-[10px] text-slate-600">
                                      • {item.variant.product.title} ({item.variant.name}) x{item.quantity}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                <span className="text-slate-700 text-xs">{transfer.requestedBy.name}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                <div className="flex flex-col">
                                  <span className="text-slate-700 text-[11px]">
                                    {new Date(transfer.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                                  </span>
                                  <span className="text-[9px] text-slate-500">
                                    {new Date(transfer.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                              </div>
                            </td>
                            {canManage && (
                              <td className="px-5 py-3">
                                {transfer.status === 'PENDING' ? (
                                  <div className="flex gap-1.5 justify-center">
                                    <Button
                                      size="sm"
                                      onClick={async () => {
                                        if (processingTransferId) return;
                                        if (!confirm('¿Aprobar este traslado? El stock se moverá automáticamente.')) return;
                                        
                                        setProcessingTransferId(transfer.id);
                                        try {
                                          const res = await fetch(`/api/stock-transfers/${transfer.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'APPROVED' })
                                          });

                                          if (!res.ok) {
                                            const error = await res.json();
                                            throw new Error(error.error || 'Error al aprobar');
                                          }

                                          await mutateTransfers();
                                          await mutate();
                                          alert('Traslado aprobado correctamente');
                                        } catch (error: any) {
                                          alert(error.message || 'Error al aprobar el traslado');
                                        } finally {
                                          setProcessingTransferId(null);
                                        }
                                      }}
                                      disabled={processingTransferId === transfer.id}
                                      className="h-7 px-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs"
                                    >
                                      <Check className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={async () => {
                                        if (processingTransferId) return;
                                        if (!confirm('¿Rechazar este traslado?')) return;
                                        
                                        setProcessingTransferId(transfer.id);
                                        try {
                                          const res = await fetch(`/api/stock-transfers/${transfer.id}`, {
                                            method: 'PATCH',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ status: 'REJECTED' })
                                          });

                                          if (!res.ok) {
                                            const error = await res.json();
                                            throw new Error(error.error || 'Error al rechazar');
                                          }

                                          await mutateTransfers();
                                          alert('Traslado rechazado');
                                        } catch (error: any) {
                                          alert(error.message || 'Error al rechazar el traslado');
                                        } finally {
                                          setProcessingTransferId(null);
                                        }
                                      }}
                                      disabled={processingTransferId === transfer.id}
                                      className="h-7 px-2 border-red-300 text-red-600 hover:bg-red-50 text-xs"
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <span className="text-[10px] text-slate-500 text-center block">-</span>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* MODAL DE NUEVO MOVIMIENTO */}
      <StockMovementModal 
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={() => mutate()}
        branches={branches || []}
      />

      {/* MODAL DE TRASLADOS */}
      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        onSuccess={() => {
          mutate();
          mutateTransfers();
        }}
        branches={branches || []}
      />

    </div>
  );
}

export default function InventoryPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-full w-full gap-5 animate-in fade-in duration-300">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1">
          <Skeleton className="h-full w-full rounded-xl" />
        </div>
      </div>
    }>
      <InventoryPageContent />
    </Suspense>
  );
}
