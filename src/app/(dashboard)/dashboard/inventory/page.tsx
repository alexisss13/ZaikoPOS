'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { 
  Warehouse, Search, ChevronLeft, ChevronRight, Download, 
  ArrowUpCircle, ArrowDownCircle, Settings, Filter, Package, Store, User, Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/auth-context';
import { StockMovementModal } from '@/components/dashboard/StockMovementModal';

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

const ITEMS_PER_PAGE = 7;

const movementTypeConfig = {
  INPUT: { label: 'Entrada', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: ArrowUpCircle },
  OUTPUT: { label: 'Salida', color: 'bg-red-100 text-red-700 border-red-300', icon: ArrowDownCircle },
  ADJUSTMENT: { label: 'Ajuste', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Settings },
  SALE_POS: { label: 'Venta POS', color: 'bg-blue-100 text-blue-700 border-blue-300', icon: Package },
  SALE_ECOMMERCE: { label: 'Venta Online', color: 'bg-indigo-100 text-indigo-700 border-indigo-300', icon: Package },
  PURCHASE: { label: 'Compra', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Package },
  TRANSFER: { label: 'Traslado', color: 'bg-cyan-100 text-cyan-700 border-cyan-300', icon: ArrowUpCircle },
};

export default function InventoryPage() {
  const { user, role } = useAuth();
  const canManage = role === 'OWNER' || role === 'MANAGER';

  const { data: movements, isLoading, mutate } = useSWR<StockMovement[]>('/api/inventory/movements', fetcher);
  const { data: branches } = useSWR('/api/branches', fetcher);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | StockMovement['type']>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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

  const totalPages = Math.ceil(filteredMovements.length / ITEMS_PER_PAGE) || 1;
  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
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
          : (movement.type === 'INPUT' || movement.type === 'PURCHASE' || movement.type === 'TRANSFER' ? movement.quantity : -movement.quantity),
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
          : (movement.type === 'INPUT' || movement.type === 'PURCHASE' || movement.type === 'TRANSFER' ? `+${movement.quantity}` : `-${movement.quantity}`),
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
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
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
        
        {/* SUBHEADER: TABS Y PAGINACIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 w-full shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button 
              onClick={() => {setTypeFilter('ALL'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${typeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Todos
            </button>
            <button 
              onClick={() => {setTypeFilter('INPUT'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${typeFilter === 'INPUT' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Entradas
            </button>
            <button 
              onClick={() => {setTypeFilter('OUTPUT'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${typeFilter === 'OUTPUT' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Salidas
            </button>
            <button 
              onClick={() => {setTypeFilter('ADJUSTMENT'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${typeFilter === 'ADJUSTMENT' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Ajustes
            </button>
            <button 
              onClick={() => {setTypeFilter('SALE_POS'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${typeFilter === 'SALE_POS' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Ventas
            </button>
            <button 
              onClick={() => {setTypeFilter('PURCHASE'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${typeFilter === 'PURCHASE' ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Compras
            </button>
            <button 
              onClick={() => {setTypeFilter('TRANSFER'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${typeFilter === 'TRANSFER' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Traslados
            </button>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-200">
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

        {/* FILTROS ADICIONALES */}
        <div className="px-4 py-3 bg-white border-t border-slate-100 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">Filtros:</span>
          </div>
          
          <select
            value={branchFilter}
            onChange={(e) => { setBranchFilter(e.target.value); setCurrentPage(1); }}
            className="h-8 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
          >
            <option value="ALL">Todas las sucursales</option>
            {branches?.map((branch: any) => (
              <option key={branch.id} value={branch.name}>
                {branch.name}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Desde:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
              className="h-8 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Hasta:</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
              className="h-8 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
            />
          </div>

          {(branchFilter !== 'ALL' || dateFrom || dateTo) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBranchFilter('ALL');
                setDateFrom('');
                setDateTo('');
                setCurrentPage(1);
              }}
              className="h-8 text-xs font-bold text-slate-600 hover:text-slate-900 px-3"
            >
              Limpiar filtros
            </Button>
          )}
        </div>

        {/* TABLA */}
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[1000px]">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30">
              <tr>
                <th className="px-5 py-3.5 font-semibold rounded-tl-xl">Fecha</th>
                <th className="px-5 py-3.5 font-semibold">Tipo</th>
                <th className="px-5 py-3.5 font-semibold">Producto</th>
                <th className="px-5 py-3.5 font-semibold">Motivo</th>
                <th className="px-5 py-3.5 font-semibold text-center">Cantidad</th>
                <th className="px-5 py-3.5 font-semibold text-center">Había</th>
                <th className="px-5 py-3.5 font-semibold text-center">Hay</th>
                <th className="px-5 py-3.5 font-semibold">Sucursal</th>
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
                      <Button variant="link" className="text-xs h-6 text-slate-900 font-bold" onClick={() => { setSearchTerm(''); setTypeFilter('ALL'); setBranchFilter('ALL'); setDateFrom(''); setDateTo(''); }}>
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
                            <span className="font-bold text-slate-900 text-[11px]">
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
                          <span className="font-bold text-slate-900 text-sm truncate max-w-[200px]">
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
                          movement.type === 'INPUT' || movement.type === 'PURCHASE' || movement.type === 'TRANSFER' 
                            ? 'text-emerald-600' 
                            : movement.type === 'ADJUSTMENT'
                            ? (movement.currentStock > movement.previousStock ? 'text-emerald-600' : 'text-red-600')
                            : 'text-red-600'
                        }`}>
                          {movement.type === 'ADJUSTMENT' 
                            ? (movement.currentStock > movement.previousStock 
                                ? `+${movement.currentStock - movement.previousStock}` 
                                : `${movement.currentStock - movement.previousStock}`)
                            : (movement.type === 'INPUT' || movement.type === 'PURCHASE' || movement.type === 'TRANSFER' 
                                ? `+${movement.quantity}` 
                                : `-${movement.quantity}`)
                          }
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-slate-500 font-medium text-xs">{movement.previousStock}</span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className="text-slate-900 font-bold text-sm">{movement.currentStock}</span>
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
      </div>

      {/* MODAL DE NUEVO MOVIMIENTO */}
      <StockMovementModal 
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSuccess={() => mutate()}
        branches={branches || []}
      />

    </div>
  );
}
