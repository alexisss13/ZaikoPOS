import { useState, useMemo, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface StockMovement {
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

export interface StockTransfer {
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

function useSearchParamsSafe() {
  try {
    return useSearchParams();
  } catch {
    return null;
  }
}

export function useInventoryLogic() {
  const { user, role } = useAuth();
  const canManage = role === 'OWNER' || role === 'MANAGER';
  const searchParams = useSearchParamsSafe();

  const { data: movements, isLoading, mutate, error: movementsError } = useSWR<StockMovement[]>('/api/inventory/movements', fetcher);
  const { data: transfers, mutate: mutateTransfers, error: transfersError } = useSWR<StockTransfer[]>('/api/stock-transfers', fetcher);
  const { data: branches } = useSWR('/api/branches', fetcher);
  const { data: products } = useSWR('/api/products?forPOS=true', fetcher);

  const [activeTab, setActiveTab] = useState<'kardex' | 'transfers'>('kardex');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | StockMovement['type']>('ALL');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [kardexPage, setKardexPage] = useState(1);
  const [transfersPage, setTransfersPage] = useState(1);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [transferStatusFilter, setTransferStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [processingTransferId, setProcessingTransferId] = useState<string | null>(null);
  const [showNewMovement, setShowNewMovement] = useState(false);
  const [showNewTransfer, setShowNewTransfer] = useState(false);

  // Log errors
  useEffect(() => {
    if (movementsError) {
      console.error('Error loading movements:', movementsError);
      toast.error('Error al cargar movimientos de inventario');
    }
    if (transfersError) {
      console.error('Error loading transfers:', transfersError);
      toast.error('Error al cargar traslados');
    }
  }, [movementsError, transfersError]);

  // Check URL params to switch to transfers tab
  useEffect(() => {
    if (searchParams) {
      const tab = searchParams.get('tab');
      if (tab === 'transfers') {
        setActiveTab('transfers');
      }
    }
  }, [searchParams]);

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

  const handleTransferAction = async (transferId: string, action: 'APPROVED' | 'REJECTED') => {
    setProcessingTransferId(transferId);
    try {
      const res = await fetch(`/api/stock-transfers/${transferId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });
      
      if (!res.ok) throw new Error('Error al procesar traslado');
      
      mutateTransfers();
      toast.success(`Traslado ${action === 'APPROVED' ? 'aprobado' : 'rechazado'} correctamente`);
    } catch (error) {
      toast.error('Error al procesar el traslado');
    } finally {
      setProcessingTransferId(null);
    }
  };

  const handleRefresh = async () => {
    await Promise.all([mutate(), mutateTransfers()]);
  };

  const exportToExcel = async () => {
    if (!filteredMovements || filteredMovements.length === 0) {
      toast.error('No hay movimientos para exportar');
      return;
    }

    try {
      const XLSX = await import('xlsx-js-style');

      const headers = ['Fecha', 'Tipo', 'Producto', 'Variante', 'Motivo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Sucursal', 'Usuario'];
      
      const movementTypeConfig = {
        INPUT: 'Entrada',
        OUTPUT: 'Salida',
        ADJUSTMENT: 'Ajuste',
        SALE_POS: 'Venta POS',
        SALE_ECOMMERCE: 'Venta Online',
        PURCHASE: 'Compra',
        TRANSFER: 'Traslado',
      };

      const exportData = filteredMovements.map(movement => [
        new Date(movement.createdAt).toLocaleString('es-PE'),
        movementTypeConfig[movement.type],
        movement.variant.product.title,
        movement.variant.name,
        movement.reason || '',
        movement.type === 'ADJUSTMENT' 
          ? (movement.currentStock - movement.previousStock)
          : movement.type === 'TRANSFER'
          ? (movement.currentStock > movement.previousStock ? movement.quantity : -movement.quantity)
          : (movement.type === 'INPUT' || movement.type === 'PURCHASE' ? movement.quantity : -Math.abs(movement.quantity)),
        movement.previousStock,
        movement.currentStock,
        movement.branch.name,
        movement.user.name,
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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kardex');

      worksheet['!cols'] = [
        { wch: 20 }, { wch: 18 }, { wch: 35 }, { wch: 20 }, { wch: 30 },
        { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `kardex-inventario-${timestamp}.xlsx`);

      toast.success('Archivo Excel generado correctamente');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el archivo Excel');
    }
  };

  const exportToPDF = async () => {
    if (!filteredMovements || filteredMovements.length === 0) {
      toast.error('No hay movimientos para exportar');
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
      doc.text('KARDEX DE INVENTARIO', 148.5, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 148.5, 25, { align: 'center' });

      const movementTypeConfig = {
        INPUT: 'Entrada',
        OUTPUT: 'Salida',
        ADJUSTMENT: 'Ajuste',
        SALE_POS: 'Venta POS',
        SALE_ECOMMERCE: 'Venta Online',
        PURCHASE: 'Compra',
        TRANSFER: 'Traslado',
      };

      const tableData = filteredMovements.map(movement => [
        new Date(movement.createdAt).toLocaleDateString('es-PE'),
        movementTypeConfig[movement.type],
        movement.variant.product.title,
        movement.reason || '-',
        movement.type === 'ADJUSTMENT' 
          ? (movement.currentStock - movement.previousStock).toString()
          : movement.type === 'TRANSFER'
          ? (movement.currentStock > movement.previousStock ? `+${movement.quantity}` : `-${movement.quantity}`)
          : (movement.type === 'INPUT' || movement.type === 'PURCHASE' ? `+${movement.quantity}` : `-${Math.abs(movement.quantity)}`),
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
      
      toast.success('Archivo PDF generado correctamente');
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el archivo PDF');
    }
  };

  return {
    user,
    canManage,
    branches,
    products,
    movements,
    transfers,
    isLoading,
    mutate,
    mutateTransfers,
    activeTab,
    setActiveTab,
    searchTerm,
    setSearchTerm,
    typeFilter,
    setTypeFilter,
    branchFilter,
    setBranchFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    kardexPage,
    setKardexPage,
    transfersPage,
    setTransfersPage,
    isMovementModalOpen,
    setIsMovementModalOpen,
    isTransferModalOpen,
    setIsTransferModalOpen,
    showExportMenu,
    setShowExportMenu,
    transferStatusFilter,
    setTransferStatusFilter,
    processingTransferId,
    showNewMovement,
    setShowNewMovement,
    showNewTransfer,
    setShowNewTransfer,
    filteredMovements,
    filteredTransfers,
    paginatedMovements,
    paginatedTransfers,
    kardexTotalPages,
    transfersTotalPages,
    handleTransferAction,
    handleRefresh,
    exportToExcel,
    exportToPDF,
  };
}
