// src/app/(dashboard)/dashboard/products/page.tsx
'use client';

import useSWR from 'swr';
import { useState, useMemo, useRef } from 'react';
import { 
  Plus, Search, Package, Image as ImageIcon, Barcode as BarcodeIcon, ChevronLeft, ChevronRight, Download, Filter, LayoutGrid, Store, Globe, PowerOff, Check, Banknote, Tags, FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductModal, ProductData } from '@/components/dashboard/ProductModal';
import { CategoryModal } from '@/components/dashboard/CategoryModal';
import { ImportProductsModal } from '@/components/dashboard/ImportProductsModal';
import { BarcodeGeneratorModal } from '@/components/dashboard/BarcodeGeneratorModal';
import Barcode from 'react-barcode';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Product {
  id: string;
  title: string;
  categoryId: string;
  supplierId?: string | null;
  basePrice: number;
  cost?: number;
  wholesalePrice?: number | null;
  wholesaleMinCount?: number | null;
  minStock?: number;
  barcode?: string | null;
  sku?: string | null;
  code?: string | null;
  active: boolean;
  images?: string[];
  branchOwnerId?: string | null;
  category?: { name: string; ecommerceCode: string | null };
  supplier?: { name: string };
  variants?: any[];
  branchStocks?: { branchId: string; quantity: number }[];
}

interface Branch { id: string; ecommerceCode: string | null; name: string; logoUrl?: string | null; }
interface Category { id: string; name: string; ecommerceCode?: string | null; }

const ITEMS_PER_PAGE = 8;

export default function ProductsPage() {
  const { user, role } = useAuth();
  const permissions = user?.permissions || {};
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  
  const canManageGlobal = isSuperOrOwner || !!permissions.canManageGlobalProducts;
  const canCreate = isSuperOrOwner || !!permissions.canCreateProducts || canManageGlobal;
  const canEdit = isSuperOrOwner || !!permissions.canEditProducts || canManageGlobal;
  const canViewOthers = isSuperOrOwner || !!permissions.canViewOtherBranches || canManageGlobal;

  const { data: products, isLoading, mutate } = useSWR<Product[]>('/api/products', fetcher);
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  const { data: categories, mutate: mutateCategories } = useSWR<Category[]>('/api/categories', fetcher);
  const { data: suppliers } = useSWR('/api/suppliers', fetcher);
  
  const myBranch = branches?.find(b => b.id === user?.branchId);
  const myCode = myBranch?.ecommerceCode; 

  const uniqueCodes = Array.from(new Set(branches?.map((b) => b.ecommerceCode).filter(Boolean))) as string[];
  const visibleCodes = canViewOthers ? uniqueCodes : uniqueCodes.filter(c => c === myCode);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  
  const [showCatFilter, setShowCatFilter] = useState(false);
  const [showStockFilter, setShowStockFilter] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [canEditSelected, setCanEditSelected] = useState(false);
  
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const getBranchByCode = (code: string) => branches?.find(b => b.ecommerceCode === code);

  const availableCategories = useMemo(() => {
    if (!categories || !products) return [];

    const baseProducts = products.filter(p => {
      // Determinar si es producto global o de una sucursal específica
      const isGlobalProduct = !p.branchOwnerId;
      const isMyBranchProduct = p.branchOwnerId === user?.branchId;
      const hasStockInMyBranch = p.branchStocks?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;

      // Filtrar por permisos
      if (!isSuperOrOwner && !canViewOthers && !canManageGlobal) {
        if (!isGlobalProduct && !isMyBranchProduct && !hasStockInMyBranch) return false;
      }

      // Filtrar por estado activo/inactivo
      if (codeFilter === 'INACTIVE') return !p.active;
      if (!p.active) return false;

      // Filtrar por código de sucursal
      let matchesCode = true;
      if (codeFilter === 'GENERAL') {
        // Productos compartidos: sin dueño O con stock en múltiples sucursales
        const branchesWithStock = p.branchStocks?.filter(bs => bs.quantity > 0) || [];
        matchesCode = isGlobalProduct || branchesWithStock.length > 1;
      } else if (codeFilter !== 'ALL') {
        // Filtrar por sucursal específica
        const branch = branches?.find(b => b.ecommerceCode === codeFilter);
        if (branch) {
          matchesCode = p.branchOwnerId === branch.id;
        }
      }

      return matchesCode;
    });

    const activeCategoryIds = new Set(baseProducts.map(p => p.categoryId));
    return categories.filter(c => activeCategoryIds.has(c.id));
  }, [products, categories, codeFilter, user?.branchId, branches, isSuperOrOwner, canViewOthers, canManageGlobal]);


  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      // Determinar si es producto global o de una sucursal específica
      const isGlobalProduct = !p.branchOwnerId;
      const isMyBranchProduct = p.branchOwnerId === user?.branchId;
      const hasStockInMyBranch = p.branchStocks?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;

      // Filtrar por permisos
      if (!isSuperOrOwner && !canViewOthers && !canManageGlobal) {
        if (!isGlobalProduct && !isMyBranchProduct && !hasStockInMyBranch) return false;
      }

      // Búsqueda por texto
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.barcode && p.barcode.includes(searchTerm)) ||
                            (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filtrar por estado activo/inactivo
      if (codeFilter === 'INACTIVE') return matchesSearch && !p.active;
      if (!p.active) return false;
      
      // Filtrar por código de sucursal
      let matchesCode = true;
      if (codeFilter === 'GENERAL') {
        // Productos compartidos: sin dueño O con stock en múltiples sucursales
        const branchesWithStock = p.branchStocks?.filter(bs => bs.quantity > 0) || [];
        matchesCode = isGlobalProduct || branchesWithStock.length > 1;
      } else if (codeFilter !== 'ALL') {
        // Filtrar por sucursal específica
        const branch = branches?.find(b => b.ecommerceCode === codeFilter);
        if (branch) {
          matchesCode = p.branchOwnerId === branch.id;
        }
      }

      // Filtrar por categoría
      const matchesCategory = categoryFilter === 'ALL' || p.categoryId === categoryFilter;

      // Filtrar por stock
      let matchesStock = true;
      if (stockFilter !== 'ALL') {
        // Calcular stock total visible para el usuario
        const visibleStocks = canViewOthers 
          ? (p.branchStocks || [])
          : (p.branchStocks?.filter(bs => bs.branchId === user?.branchId) || []);
        
        const totalStock = visibleStocks.reduce((sum, bs) => sum + bs.quantity, 0);
        const minStock = p.minStock || 5;
        
        if (stockFilter === 'LOW') {
          matchesStock = totalStock > 0 && totalStock <= minStock;
        } else if (stockFilter === 'OUT') {
          matchesStock = totalStock <= 0;
        }
      }

      return matchesSearch && matchesCode && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, codeFilter, categoryFilter, stockFilter, canViewOthers, canManageGlobal, isSuperOrOwner, user?.branchId, branches]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (!confirm('🛑 ¿Dar de baja este producto? No aparecerá en ventas, pero podrás reactivarlo desde el filtro "Inactivos".')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Producto dado de baja (Inactivo)');
      setIsModalOpen(false);
      mutate();
    } catch (e: unknown) { toast.error('Error inesperado'); }
  };

  const downloadBarcodePNG = async () => {
    if (!barcodeProduct || !ticketRef.current) return;
    try {
      toast.loading('Generando etiqueta en alta calidad...', { id: 'barcode-toast' });
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(ticketRef.current, { 
        pixelRatio: 5, backgroundColor: '#ffffff', style: { margin: '0', border: 'none', borderRadius: '0' }, skipFonts: true, 
      }); 
      const link = document.createElement('a');
      link.download = `etiqueta-${(barcodeProduct.barcode || barcodeProduct.code || 'producto')}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Etiqueta descargada correctamente', { id: 'barcode-toast' });
    } catch (error) { toast.error('Error al generar la imagen.', { id: 'barcode-toast' }); }
  };

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [kardexProduct, setKardexProduct] = useState<Product | null>(null);
  const [kardexMovements, setKardexMovements] = useState<any[]>([]);

  const openKardexModal = async (product: Product) => {
    setKardexProduct(product);
    setIsKardexModalOpen(true);
    
    // Obtener movimientos del producto
    try {
      const variantId = product.variants?.[0]?.id;
      if (!variantId) {
        setKardexMovements([]);
        return;
      }
      
      const res = await fetch(`/api/inventory/movements?variantId=${variantId}`);
      const data = await res.json();
      setKardexMovements(data || []);
    } catch (error) {
      console.error('Error al cargar kardex:', error);
      setKardexMovements([]);
    }
  };

  const exportKardexToExcel = async () => {
    if (!kardexProduct || !kardexMovements || kardexMovements.length === 0) {
      alert('No hay movimientos para exportar');
      return;
    }

    try {
      const XLSX = await import('xlsx-js-style');

      const headers = ['Fecha', 'Tipo', 'Motivo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Sucursal', 'Usuario'];
      
      const movementTypeConfig: any = {
        INPUT: { label: 'Entrada' },
        OUTPUT: { label: 'Salida' },
        ADJUSTMENT: { label: 'Ajuste' },
        SALE_POS: { label: 'Venta POS' },
        SALE_ECOMMERCE: { label: 'Venta Online' },
        PURCHASE: { label: 'Compra' },
        TRANSFER: { label: 'Traslado' },
      };

      const exportData = kardexMovements.map(movement => [
        new Date(movement.createdAt).toLocaleString('es-PE'),
        movementTypeConfig[movement.type]?.label || movement.type,
        movement.reason || '',
        movement.type === 'ADJUSTMENT' 
          ? (movement.currentStock - movement.previousStock)
          : (movement.type === 'INPUT' || movement.type === 'PURCHASE' || movement.type === 'TRANSFER' ? movement.quantity : -movement.quantity),
        movement.previousStock,
        movement.currentStock,
        movement.branch?.name || '',
        movement.user?.name || '',
      ]);

      const ws_data = [
        [`KARDEX - ${kardexProduct.title}`],
        [],
        headers,
        ...exportData
      ];
      
      const worksheet = XLSX.utils.aoa_to_sheet(ws_data);

      // Aplicar estilos al título
      const titleStyle = {
        fill: { fgColor: { rgb: "1E293B" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 14 },
        alignment: { horizontal: "center", vertical: "center" }
      };
      
      if (worksheet['A1']) {
        worksheet['A1'].s = titleStyle;
      }

      // Merge del título
      worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];

      // Aplicar estilos a los encabezados
      const headerStyle = {
        fill: { fgColor: { rgb: "1E293B" } },
        font: { bold: true, color: { rgb: "FFFFFF" }, sz: 11 },
        alignment: { horizontal: "center", vertical: "center" }
      };

      headers.forEach((_, colIndex) => {
        const cellAddress = XLSX.utils.encode_cell({ r: 2, c: colIndex });
        if (worksheet[cellAddress]) {
          worksheet[cellAddress].s = headerStyle;
        }
      });

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Kardex');

      worksheet['!cols'] = [
        { wch: 20 }, { wch: 18 }, { wch: 30 }, { wch: 12 },
        { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }
      ];

      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `kardex-${kardexProduct.title.replace(/[^a-z0-9]/gi, '-')}-${timestamp}.xlsx`);

      toast.success('Kardex exportado correctamente', { id: 'kardex-excel' });
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el archivo Excel', { id: 'kardex-excel' });
    }
  };

  const exportKardexToPDF = async () => {
    if (!kardexProduct || !kardexMovements || kardexMovements.length === 0) {
      alert('No hay movimientos para exportar');
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
      doc.text('KARDEX DE PRODUCTO', 148.5, 12, { align: 'center' });
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(kardexProduct.title, 148.5, 22, { align: 'center' });
      
      doc.setFontSize(9);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 148.5, 29, { align: 'center' });

      const movementTypeConfig: any = {
        INPUT: { label: 'Entrada' },
        OUTPUT: { label: 'Salida' },
        ADJUSTMENT: { label: 'Ajuste' },
        SALE_POS: { label: 'Venta POS' },
        SALE_ECOMMERCE: { label: 'Venta Online' },
        PURCHASE: { label: 'Compra' },
        TRANSFER: { label: 'Traslado' },
      };

      // Preparar datos de la tabla
      const tableData = kardexMovements.map(movement => [
        new Date(movement.createdAt).toLocaleDateString('es-PE'),
        movementTypeConfig[movement.type]?.label || movement.type,
        movement.reason || '-',
        movement.type === 'ADJUSTMENT' 
          ? (movement.currentStock - movement.previousStock).toString()
          : (movement.type === 'INPUT' || movement.type === 'PURCHASE' || movement.type === 'TRANSFER' ? `+${movement.quantity}` : `-${movement.quantity}`),
        movement.previousStock.toString(),
        movement.currentStock.toString(),
        movement.branch?.name || '-',
        movement.user?.name || '-'
      ]);

      autoTable(doc, {
        startY: 40,
        head: [['Fecha', 'Tipo', 'Motivo', 'Cant.', 'Había', 'Hay', 'Sucursal', 'Usuario']],
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
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 15, halign: 'center' },
          5: { cellWidth: 15, halign: 'center' },
          6: { cellWidth: 30 },
          7: { cellWidth: 30 }
        }
      });

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`kardex-${kardexProduct.title.replace(/[^a-z0-9]/gi, '-')}-${timestamp}.pdf`);
      
      toast.success('Kardex exportado correctamente', { id: 'kardex-pdf' });
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el archivo PDF', { id: 'kardex-pdf' });
    }
  };

  const exportToExcel = async () => {
    if (!products || products.length === 0) {
      toast.error('No hay productos para exportar');
      return;
    }

    try {
      toast.loading('Generando archivo Excel...', { id: 'export-excel' });
      const XLSX = await import('xlsx-js-style');

      const headers = ['ID', 'Nombre', 'SKU', 'Código de Barras', 'Categoría', 'Proveedor', 'Precio Base', 'Costo', 'Precio Mayorista', 'Cant. Mín. Mayorista', 'Stock Mínimo'];
      
      // Agregar headers de stock por sucursal
      branches?.forEach(branch => {
        headers.push(`Stock ${branch.name}`);
      });
      headers.push('Activo', 'Imágenes');

      // Preparar los datos
      const exportData = products.map(product => {
        const row = [
          product.id,
          product.title,
          product.sku || '',
          product.barcode || '',
          product.category?.name || '',
          product.supplier?.name || '',
          product.basePrice,
          product.cost || 0,
          product.wholesalePrice || '',
          product.wholesaleMinCount || '',
          product.minStock || 5,
        ];

        // Agregar stock por sucursal
        branches?.forEach(branch => {
          const stock = product.branchStocks?.find(bs => bs.branchId === branch.id);
          row.push(stock?.quantity || 0);
        });

        row.push(product.active ? 'Sí' : 'No', product.images?.join(', ') || '');
        return row;
      });

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
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Productos');

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 36 }, { wch: 40 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 20 },
        { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 12 }
      ];
      branches?.forEach(() => columnWidths.push({ wch: 15 }));
      columnWidths.push({ wch: 10 }, { wch: 50 });
      worksheet['!cols'] = columnWidths;

      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `productos-${timestamp}.xlsx`);

      toast.success('Archivo Excel generado correctamente', { id: 'export-excel' });
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el archivo Excel', { id: 'export-excel' });
    }
  };

  const exportToPDF = async () => {
    if (!products || products.length === 0) {
      toast.error('No hay productos para exportar');
      return;
    }

    try {
      toast.loading('Generando archivo PDF...', { id: 'export-pdf' });
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Encabezado corporativo
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 297, 35, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('CATÁLOGO DE PRODUCTOS', 148.5, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 148.5, 25, { align: 'center' });

      // Preparar datos de la tabla
      const tableData = products.map(product => {
        const totalStock = product.branchStocks?.reduce((sum, bs) => sum + bs.quantity, 0) || 0;
        return [
          product.title,
          product.sku || '-',
          product.barcode || '-',
          product.category?.name || '-',
          `S/ ${Number(product.basePrice).toFixed(2)}`,
          totalStock.toString(),
          product.active ? 'Sí' : 'No'
        ];
      });

      autoTable(doc, {
        startY: 40,
        head: [['Producto', 'SKU', 'Código', 'Categoría', 'Precio', 'Stock', 'Activo']],
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
          0: { cellWidth: 70 },
          1: { cellWidth: 30 },
          2: { cellWidth: 35 },
          3: { cellWidth: 40 },
          4: { cellWidth: 25, halign: 'right' },
          5: { cellWidth: 20, halign: 'center' },
          6: { cellWidth: 20, halign: 'center' }
        }
      });

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`productos-${timestamp}.pdf`);
      
      toast.success('Archivo PDF generado correctamente', { id: 'export-pdf' });
      setShowExportMenu(false);
    } catch (error) {
      console.error('Error al exportar:', error);
      toast.error('Error al generar el archivo PDF', { id: 'export-pdf' });
    }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Productos</h1>
          <Package className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              placeholder="Buscar producto, SKU..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>
          {canCreate && (
            <>
              <Button 
                onClick={() => setIsCategoryModalOpen(true)}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <Tags className="w-3.5 h-3.5 mr-1.5" /> <span className="font-bold">Categorías</span>
              </Button>
              <Button 
                onClick={() => setIsImportModalOpen(true)}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <FileText className="w-3.5 h-3.5 mr-1.5" /> <span className="font-bold">Importar</span>
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
                onClick={() => setIsBarcodeModalOpen(true)}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <BarcodeIcon className="w-3.5 h-3.5 mr-1.5" /> <span className="font-bold">Códigos</span>
              </Button>
              <Button onClick={() => { setSelectedProduct(null); setCanEditSelected(true); setIsModalOpen(true); }} className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0">
                <Plus className="w-4 h-4 mr-1.5" /> <span className="font-bold">Nuevo Producto</span>
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* SUBHEADER: TABS Y PAGINACIÓN INTEGRADA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5  w-full  shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button 
              onClick={() => {setCodeFilter('ALL'); setCurrentPage(1); setCategoryFilter('ALL');}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Todos
            </button>
            <button 
              onClick={() => {setCodeFilter('GENERAL'); setCurrentPage(1); setCategoryFilter('ALL');}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'GENERAL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <Globe className="w-3.5 h-3.5" /> Compartidos
            </button>
            
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

            {visibleCodes.map(code => {
              const b = getBranchByCode(code);
              const isActive = codeFilter === code;
              return (
                <button 
                  key={code} 
                  onClick={() => {setCodeFilter(code); setCurrentPage(1); setCategoryFilter('ALL');}} 
                  className={`group px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${isActive ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  {b?.logoUrl 
                    ? <img src={b.logoUrl} className={`w-4 h-4 rounded-[3px] object-cover transition-all ${isActive ? 'bg-white p-[1.5px]' : 'grayscale mix-blend-multiply group-hover:brightness-0'}`} alt=""/> 
                    : <Store className="w-3.5 h-3.5 text-current"/>
                  }
                  {b?.name || code}
                </button>
              )
            })}

            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

            <button 
              onClick={() => {setCodeFilter('INACTIVE'); setCurrentPage(1); setCategoryFilter('ALL');}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'INACTIVE' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-slate-500 hover:text-red-700 hover:bg-red-50'}`}
            >
              <PowerOff className="w-3.5 h-3.5" /> Inactivos
            </button>
          </div>

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

        {/* TABLA PRINCIPAL */}
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          
          {(showCatFilter || showStockFilter) && (
            <div className="fixed inset-0 z-20" onClick={() => {setShowCatFilter(false); setShowStockFilter(false);}} />
          )}

          <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30 overflow-hidden">
              <tr>
                <th className="px-5 py-3.5 font-semibold rounded-tl-xl">Producto</th>
                
                <th className="px-5 py-3.5 font-semibold relative select-none w-[200px]">
                  <div 
                    className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${categoryFilter !== 'ALL' || showCatFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                    onClick={() => {setShowCatFilter(!showCatFilter); setShowStockFilter(false);}}
                  >
                    Categoría y Catálogo <Filter className={`w-3.5 h-3.5 ${categoryFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                  </div>
                  
                  {showCatFilter && (
                    <div className="absolute top-10 left-3 w-[220px] bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar">
                      <button onClick={() => {setCategoryFilter('ALL'); setShowCatFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${categoryFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                        Todas las categorías {categoryFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="h-px bg-slate-100 my-1 mx-2" />
                      {availableCategories.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400 text-center italic">Sin categorías aquí</div>
                      )}
                      {availableCategories.map((cat) => (
                        <button key={cat.id} onClick={() => {setCategoryFilter(cat.id); setShowCatFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors flex items-center justify-between ${categoryFilter === cat.id ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <span className="truncate pr-2">{cat.name}</span>
                          {categoryFilter === cat.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                <th className="px-5 py-3.5 font-semibold w-[120px]">Precio (S/)</th>
                
                <th className="px-5 py-3.5 font-semibold relative select-none w-[150px]">
                  <div 
                    className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${stockFilter !== 'ALL' || showStockFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                    onClick={() => {setShowStockFilter(!showStockFilter); setShowCatFilter(false);}}
                  >
                    Inventario <Filter className={`w-3.5 h-3.5 ${stockFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                  </div>

                  {showStockFilter && (
                    <div className="absolute top-10 left-3 w-[160px] bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => {setStockFilter('ALL'); setShowStockFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${stockFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                        Todo el Stock {stockFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => {setStockFilter('LOW'); setShowStockFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${stockFilter === 'LOW' ? 'bg-amber-50 text-amber-700' : 'text-amber-600 hover:bg-amber-50/50'}`}>
                        Stock Bajo {stockFilter === 'LOW' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => {setStockFilter('OUT'); setShowStockFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${stockFilter === 'OUT' ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50/50'}`}>
                        Agotados {stockFilter === 'OUT' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </th>
                
                <th className="px-5 py-3.5 font-semibold w-[80px] rounded-tr-xl text-center">Kardex</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? ( Array(5).fill(0).map((_, i) => (<tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>)) ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Package className="w-10 h-10 text-slate-200" strokeWidth={1} />
                      <p className="font-medium text-sm text-slate-500">{codeFilter === 'INACTIVE' ? 'No hay productos inactivos.' : 'No se encontraron productos.'}</p>
                      <Button variant="link" className="text-xs h-6 text-slate-900 font-bold" onClick={() => { setSearchTerm(''); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); }}>Limpiar filtros</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product: Product) => {
                  
                  // Calcular stock total visible para el usuario
                  const visibleStocks = canViewOthers 
                    ? (product.branchStocks || [])
                    : (product.branchStocks?.filter(bs => bs.branchId === user?.branchId) || []);
                  
                  const totalPhysicalStock = visibleStocks.reduce((sum, bs) => sum + bs.quantity, 0);
                  const hasWholesale = Number(product.wholesalePrice) > 0;

                  // Determinar permisos de edición
                  const isGlobalProduct = !product.branchOwnerId;
                  const isMyBranchProduct = product.branchOwnerId === user?.branchId;
                  const hasStockInMyBranch = product.branchStocks?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;
                  
                  let canEditThisSpecificProduct = false;
                  if (canManageGlobal) {
                    canEditThisSpecificProduct = true; 
                  } else if (canEdit) {
                    if (isGlobalProduct || isMyBranchProduct || hasStockInMyBranch) {
                      canEditThisSpecificProduct = true; 
                    }
                  }

                  return (
                    <tr 
                      key={product.id} 
                      onClick={() => { setSelectedProduct(product); setCanEditSelected(canEditThisSpecificProduct); setIsModalOpen(true); }}
                      className={`hover:bg-slate-50 transition-colors group text-xs cursor-pointer ${!product.active ? 'opacity-60 bg-slate-50/50' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center ${!product.active ? 'grayscale' : ''}`}>
                            {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-slate-300" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-700 truncate leading-tight group-hover:text-slate-900 transition-colors text-sm">{product.title}</p>
                              {!product.active && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5 leading-none bg-red-100 text-red-700 border-none shadow-none">INACTIVO</Badge>}
                            </div>
                            {(product.barcode || product.code) && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1"><BarcodeIcon className="w-3 h-3" /> {product.barcode || product.code}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="font-medium text-slate-500 truncate max-w-[140px] leading-none group-hover:text-slate-700 transition-colors">{product.category?.name || 'Sin Categoría'}</span>
                          {(() => {
                            // Determinar si el producto tiene stock en múltiples sucursales
                            const branchesWithStock = product.branchStocks?.filter(bs => bs.quantity > 0) || [];
                            const hasMultipleBranches = branchesWithStock.length > 1;
                            
                            // Si tiene stock en múltiples sucursales, mostrar como "Compartido"
                            if (hasMultipleBranches) {
                              const ownerBranch = product.branchOwnerId ? branches?.find(b => b.id === product.branchOwnerId) : null;
                              return (
                                <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1.5 leading-none border border-slate-200 px-1.5 py-0.5 rounded-md bg-slate-50 w-max">
                                  {ownerBranch?.logoUrl ? (
                                    <img src={ownerBranch.logoUrl} className="w-3.5 h-3.5 rounded-[2px] object-cover transition-all grayscale mix-blend-multiply" alt=""/>
                                  ) : (
                                    <Store className="w-3 h-3 text-slate-400" />
                                  )}
                                  {ownerBranch?.name || 'Sucursal'}
                                  <Globe className="w-2.5 h-2.5 text-slate-400 ml-0.5" />
                                </span>
                              );
                            }
                            
                            // Si solo tiene una sucursal dueña, mostrar esa sucursal
                            if (product.branchOwnerId) {
                              const ownerBranch = branches?.find(b => b.id === product.branchOwnerId);
                              return (
                                <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 w-max leading-none">
                                  {ownerBranch?.logoUrl ? (
                                    <img src={ownerBranch.logoUrl} className="w-3.5 h-3.5 rounded-[2px] object-cover transition-all grayscale mix-blend-multiply" alt=""/>
                                  ) : (
                                    <Store className="w-3 h-3 text-current" />
                                  )}
                                  {ownerBranch?.name || 'Sucursal'}
                                </span>
                              );
                            }
                            
                            // Si no tiene branchOwnerId, es un producto compartido global
                            return (
                              <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1 leading-none border border-slate-200 px-1.5 py-0.5 rounded-md bg-slate-50 w-max">
                                <Globe className="w-2.5 h-2.5 text-slate-400" /> Compartido
                              </span>
                            );
                          })()}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col items-start gap-1">
                          {/* Diseño de billete para el precio principal */}
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm">
                            <Banknote className="w-3 h-3 text-emerald-600" />
                            <span className="font-mono text-[10px] text-emerald-600 font-bold">S/</span>
                            <span className="font-bold text-sm tracking-tight">{Number(product.basePrice).toFixed(2)}</span>
                          </div>
                          {hasWholesale && (
                            <p className="text-[9px] text-emerald-600/80 font-medium pl-1 leading-none">Mayor: S/ {Number(product.wholesalePrice).toFixed(2)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          // Obtener el minStock del producto (viene de la variante estándar)
                          const minStock = product.minStock || 5;
                          
                          // Determinar el color según el stock
                          let colorClasses = '';
                          if (totalPhysicalStock <= 0) {
                            colorClasses = 'bg-red-50 text-red-700 border-red-200';
                          } else if (totalPhysicalStock <= minStock) {
                            colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
                          } else {
                            colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          }
                          
                          return (
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${colorClasses}`}>
                              {totalPhysicalStock} <span className="text-[9px] opacity-70 ml-1 font-semibold uppercase">un.</span>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-5 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={() => openKardexModal(product)}
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                        >
                          <FileText className="w-4 h-4" />
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

      {/* SOLO DEJAMOS ESTE MODAL */}
      {isModalOpen && (
        <ProductModal 
          isOpen={isModalOpen} 
          onClose={() => {
            setIsModalOpen(false);
            setSelectedProduct(null);
          }} 
          onSuccess={() => mutate()} 
          productToEdit={selectedProduct} 
          canEdit={canEditSelected}
          onDelete={handleDelete}
          onPrintBarcode={(p) => setBarcodeProduct(p as unknown as Product)}
        />
      )}

      {/* MODAL DE IMPORTACIÓN */}
      <ImportProductsModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => mutate()}
        categories={categories || []}
        suppliers={suppliers || []}
        branches={branches || []}
      />

      {/* MODAL DE CÓDIGOS DE BARRAS */}
      <BarcodeGeneratorModal 
        isOpen={isBarcodeModalOpen}
        onClose={() => setIsBarcodeModalOpen(false)}
        products={products || []}
      />

      {/* MODAL DE CATEGORÍAS */}
      <CategoryModal 
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => { mutate(); mutateCategories(); }}
        categories={categories || []}
        branches={branches || []}
      />

      {/* ETIQUETA MODAL */}
      <Dialog open={!!barcodeProduct} onOpenChange={() => setBarcodeProduct(null)}>
        <DialogContent className="sm:max-w-sm text-center border-none shadow-2xl p-6 bg-slate-100 rounded-2xl">
          <DialogHeader className="mb-2"><DialogTitle className="text-center text-slate-500 text-xs uppercase tracking-widest font-bold">Vista Previa Etiqueta</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center justify-center overflow-hidden">
            <div ref={ticketRef} id="barcode-ticket" className="bg-white px-6 py-5 flex flex-col items-center justify-center w-full max-w-[320px] text-black shadow-sm rounded-xl">
              <h3 className="font-black text-black text-center text-[16px] leading-tight uppercase w-full mb-4 px-2 line-clamp-3">{barcodeProduct?.title}</h3>
              <div className="w-full flex justify-center bg-white overflow-hidden">
                {barcodeProduct && <Barcode value={barcodeProduct.barcode || barcodeProduct.code || '000000'} width={2} height={60} fontSize={16} textMargin={8} margin={10} format="CODE128" background="#ffffff" lineColor="#000000" renderer="canvas" />}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full mt-6">
            <Button onClick={() => setBarcodeProduct(null)} className="flex-1 h-10 text-xs rounded-xl border-slate-200 text-slate-600" variant="outline">Cerrar</Button>
            <Button onClick={downloadBarcodePNG} className="flex-1 h-10 text-xs gap-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-white shadow-md"><Download className="w-4 h-4"/> Descargar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE KARDEX INDIVIDUAL */}
      <Dialog open={isKardexModalOpen} onOpenChange={setIsKardexModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Kardex - {kardexProduct?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button onClick={exportKardexToExcel} variant="outline" size="sm" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={exportKardexToPDF} variant="outline" size="sm" className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Exportar PDF
            </Button>
          </div>

          <div className="flex-1 overflow-auto">
            {kardexMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <FileText className="w-12 h-12 mb-3 text-slate-300" />
                <p className="text-sm font-medium">No hay movimientos registrados</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Tipo</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Motivo</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Cantidad</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Había</th>
                    <th className="px-3 py-2 text-center text-xs font-semibold text-slate-600">Hay</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Sucursal</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-slate-600">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kardexMovements.map((movement: any) => {
                    const movementTypeConfig: any = {
                      INPUT: { label: 'Entrada', color: 'text-emerald-600' },
                      OUTPUT: { label: 'Salida', color: 'text-red-600' },
                      ADJUSTMENT: { label: 'Ajuste', color: 'text-amber-600' },
                      SALE_POS: { label: 'Venta POS', color: 'text-blue-600' },
                      SALE_ECOMMERCE: { label: 'Venta Online', color: 'text-indigo-600' },
                      PURCHASE: { label: 'Compra', color: 'text-purple-600' },
                      TRANSFER: { label: 'Traslado', color: 'text-cyan-600' },
                    };
                    
                    const typeInfo = movementTypeConfig[movement.type] || { label: movement.type, color: 'text-slate-600' };
                    
                    return (
                      <tr key={movement.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {new Date(movement.createdAt).toLocaleDateString('es-PE')}
                        </td>
                        <td className="px-3 py-2">
                          <span className={`text-xs font-semibold ${typeInfo.color}`}>
                            {typeInfo.label}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {movement.reason || '-'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs font-bold ${
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
                        <td className="px-3 py-2 text-center text-xs text-slate-600">
                          {movement.previousStock}
                        </td>
                        <td className="px-3 py-2 text-center text-xs font-bold text-slate-900">
                          {movement.currentStock}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {movement.branch?.name || '-'}
                        </td>
                        <td className="px-3 py-2 text-xs text-slate-600">
                          {movement.user?.name || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}