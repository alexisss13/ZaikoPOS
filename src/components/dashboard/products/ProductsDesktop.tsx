'use client';

import dynamic from 'next/dynamic';
import { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ImageWithSpinner } from '@/components/ui/ImageWithSpinner';
import Barcode from 'react-barcode';
import { SearchBar } from './SearchBar';
import { ProductTableRow } from './ProductTableRow';
import { FilterDropdown } from './FilterDropdown';
import {
  DashboardSquare01Icon, ArrowDataTransferHorizontalIcon, Store01Icon, UnavailableIcon,
  FilterIcon, PackageIcon, ArrowLeft01Icon, ArrowRight01Icon, Search01Icon, Tag01Icon,
  File01Icon, Download01Icon, BarCode01Icon, PlusSignIcon, Tick01Icon,
} from 'hugeicons-react';
import { toast } from 'sonner';
import type { useProductsLogic } from './useProductsLogic';
import type { Product } from './types';

const ProductModal = dynamic(() => import('@/components/dashboard/ProductModal').then(m => ({ default: m.ProductModal })), { ssr: false });
const CategoryModal = dynamic(() => import('@/components/dashboard/CategoryModal').then(m => ({ default: m.CategoryModal })), { ssr: false });
const ImportProductsModal = dynamic(() => import('@/components/dashboard/ImportProductsModal').then(m => ({ default: m.ImportProductsModal })), { ssr: false });
const BarcodeGeneratorModal = dynamic(() => import('@/components/dashboard/BarcodeGeneratorModal').then(m => ({ default: m.BarcodeGeneratorModal })), { ssr: false });

type Logic = ReturnType<typeof useProductsLogic>;

function ProductsDesktopComponent({ logic }: { logic: Logic }) {
  const {
    canCreate, branches, categories, isLoading,
    mutate, mutateCategories, visibleCodes, getBranchByCode,
    codeFilter, setCategoryFilter, setCodeFilter,
    categoryFilter, stockFilter, setStockFilter,
    currentPage, setCurrentPage,
    isModalOpen, setIsModalOpen, isCategoryModalOpen, setIsCategoryModalOpen,
    isImportModalOpen, setIsImportModalOpen, isBarcodeModalOpen, setIsBarcodeModalOpen,
    selectedProduct, setSelectedProduct, canEditSelected, setCanEditSelected,
    barcodeProduct, setBarcodeProduct, showExportMenu, setShowExportMenu,
    isKardexModalOpen, setIsKardexModalOpen, kardexProduct, kardexMovements,
    availableCategories, totalPages, paginatedProducts,
    handleSearchChange, openKardexModal, downloadBarcodePNG,
    exportToExcel, exportToPDF, exportKardexToExcel, exportKardexToPDF,
    ticketRef,
  } = logic;

  // ⚡ Memoizar handlers para evitar re-renders
  const handleCategorySelect = useCallback((categoryId: string) => {
    setCategoryFilter(categoryId);
    setCurrentPage(1);
  }, [setCategoryFilter, setCurrentPage]);

  const handleStockSelect = useCallback((stockValue: string) => {
    setStockFilter(stockValue);
    setCurrentPage(1);
  }, [setStockFilter, setCurrentPage]);

  // ⚡ Memoizar handlers para evitar re-renders
  const handleEdit = useCallback((product: Product) => {
    setSelectedProduct(product);
    setCanEditSelected(true);
    setIsModalOpen(true);
  }, [setSelectedProduct, setCanEditSelected, setIsModalOpen]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('🛑 ¿Dar de baja este producto? No aparecerá en ventas, pero podrás reactivarlo desde el filtro "Inactivos".')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al desactivar');
      mutate();
      toast.success('Producto dado de baja');
    } catch {
      toast.error('Error al desactivar producto');
    }
  }, [mutate]);

  const handleActivate = useCallback(async (id: string) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true })
      });
      if (!res.ok) throw new Error('Error al activar');
      mutate();
      toast.success('Producto activado');
    } catch {
      toast.error('Error al activar producto');
    }
  }, [mutate]);

  return (
    <>
      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Productos</h1>
          <PackageIcon className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search01Icon className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <div className="w-full">
              <SearchBar onSearchChange={handleSearchChange} placeholder="Buscar producto, SKU..." debounceMs={200} className="w-full" inputClassName="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" />
            </div>
          </div>
          {canCreate && (
            <>
              <Button onClick={() => setIsCategoryModalOpen(true)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"><Tag01Icon className="w-3.5 h-3.5 mr-1.5" /><span className="font-bold">Categorías</span></Button>
              <Button onClick={() => setIsImportModalOpen(true)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"><File01Icon className="w-3.5 h-3.5 mr-1.5" /><span className="font-bold">Importar</span></Button>
              <div className="relative">
                <Button onClick={() => setShowExportMenu(!showExportMenu)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"><Download01Icon className="w-3.5 h-3.5 mr-1.5" /><span className="font-bold">Exportar</span></Button>
                {showExportMenu && (<><div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} /><div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"><button onClick={() => exportToExcel(() => setShowExportMenu(false))} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2"><Download01Icon className="w-3.5 h-3.5" />Excel</button><button onClick={() => exportToPDF(() => setShowExportMenu(false))} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"><Download01Icon className="w-3.5 h-3.5" />PDF</button></div></>)}
              </div>
              <Button onClick={() => setIsBarcodeModalOpen(true)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"><BarCode01Icon className="w-3.5 h-3.5 mr-1.5" /><span className="font-bold">Códigos</span></Button>
              <Button onClick={() => { setSelectedProduct(null); setCanEditSelected(true); setIsModalOpen(true); }} className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0"><PlusSignIcon className="w-4 h-4 mr-1.5" /><span className="font-bold">Nuevo Producto</span></Button>
            </>
          )}
        </div>
      </div>
      {/* TABLE CONTAINER */}
      <div className="flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        {/* Tabs + Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 w-full shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button onClick={() => { setCodeFilter('ALL'); setCurrentPage(1); setCategoryFilter('ALL'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}><DashboardSquare01Icon className="w-3.5 h-3.5" /> Todos</button>
            <button onClick={() => { setCodeFilter('GENERAL'); setCurrentPage(1); setCategoryFilter('ALL'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'GENERAL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}><ArrowDataTransferHorizontalIcon className="w-3.5 h-3.5" /> Compartidos</button>
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />
            {visibleCodes.map(code => {
              const b = getBranchByCode(code); const isActive = codeFilter === code;
              return (
                <button key={code} onClick={() => { setCodeFilter(code); setCurrentPage(1); setCategoryFilter('ALL'); }} className={`group px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${isActive ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                  {b?.logoUrl ? <img src={b.logoUrl} className={`w-4 h-4 rounded-[3px] object-cover transition-all ${isActive ? 'bg-white p-[1.5px]' : 'grayscale mix-blend-multiply group-hover:brightness-0'}`} alt="" /> : <Store01Icon className="w-3.5 h-3.5 text-current" />}
                  {b?.name || code}
                </button>
              );
            })}
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />
            <button onClick={() => { setCodeFilter('INACTIVE'); setCurrentPage(1); setCategoryFilter('ALL'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'INACTIVE' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-slate-500 hover:text-red-700 hover:bg-red-50'}`}><UnavailableIcon className="w-3.5 h-3.5" /> Inactivos</button>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">Pág {currentPage} de {totalPages}</span>
              <div className="flex gap-1.5">
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ArrowLeft01Icon className="w-4 h-4" /></Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ArrowRight01Icon className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          <table className="w-full text-left border-separate border-spacing-0 min-w-[700px] products-table">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30 overflow-hidden">
              <tr>
                <th className="px-5 py-3.5 font-semibold rounded-tl-xl">Producto</th>
                <th className="px-5 py-3.5 font-semibold relative select-none w-[200px]">
                  <FilterDropdown
                    label="Categoría y Catálogo"
                    currentValue={categoryFilter}
                    options={availableCategories}
                    onSelect={handleCategorySelect}
                    allLabel="Todas las categorías"
                    width="w-[220px]"
                  />
                </th>
                <th className="px-5 py-3.5 font-semibold w-[120px]">Precio (S/)</th>
                <th className="px-5 py-3.5 font-semibold relative select-none w-[150px]">
                  <FilterDropdown
                    label="Inventario"
                    currentValue={stockFilter}
                    options={[
                      { id: 'LOW', name: 'Stock Bajo' },
                      { id: 'OUT', name: 'Agotados' },
                    ]}
                    onSelect={handleStockSelect}
                    allLabel="Todo el Stock"
                    width="w-[160px]"
                  />
                </th>
                <th className="px-5 py-3.5 font-semibold w-[80px] rounded-tr-xl text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (<tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>))
              ) : paginatedProducts.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center"><div className="flex flex-col items-center justify-center text-slate-400 space-y-2"><PackageIcon className="w-10 h-10 text-slate-200" strokeWidth={1} /><p className="font-medium text-sm text-slate-500">{codeFilter === 'INACTIVE' ? 'No hay productos inactivos.' : 'No se encontraron productos.'}</p><Button variant="link" className="text-xs h-6 text-slate-900 font-bold" onClick={() => { logic.setDebouncedSearch(''); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); }}>Limpiar filtros</Button></div></td></tr>
              ) : (
                paginatedProducts.map(product => (
                  <ProductTableRow
                    key={product.id}
                    product={product}
                    branches={branches}
                    onKardex={openKardexModal}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onActivate={handleActivate}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* MODALES */}
      {isModalOpen && <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} onSuccess={() => mutate()} productToEdit={selectedProduct} canEdit={canEditSelected} onDelete={handleDelete} onPrintBarcode={(p: any) => setBarcodeProduct(p)} />}
      {isImportModalOpen && <ImportProductsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => mutate()} categories={categories || []} suppliers={logic.suppliers || []} branches={branches || []} />}
      {isBarcodeModalOpen && <BarcodeGeneratorModal isOpen={isBarcodeModalOpen} onClose={() => setIsBarcodeModalOpen(false)} products={logic.products || []} />}
      {isCategoryModalOpen && <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSuccess={() => { mutate(); mutateCategories(); }} categories={categories || []} branches={branches || []} />}

      {/* Barcode preview */}
      <Dialog open={!!barcodeProduct} onOpenChange={() => setBarcodeProduct(null)}>
        <DialogContent className="sm:max-w-sm text-center border-none shadow-2xl p-6 bg-white rounded-2xl">
          <DialogHeader className="mb-2"><DialogTitle className="text-center text-slate-500 text-xs uppercase tracking-widest font-bold">Vista Previa Etiqueta</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center justify-center overflow-hidden">
            <div ref={ticketRef} className="bg-white px-6 py-5 flex flex-col items-center justify-center w-full max-w-[320px] text-black shadow-sm rounded-xl">
              <h3 className="font-black text-black text-center text-[16px] leading-tight uppercase w-full mb-4 px-2 line-clamp-3">{barcodeProduct?.title}</h3>
              <div className="w-full flex justify-center bg-white overflow-hidden">
                {barcodeProduct && <Barcode value={barcodeProduct.barcode || barcodeProduct.code || '000000'} width={2} height={60} fontSize={16} textMargin={8} margin={10} format="CODE128" background="#ffffff" lineColor="#000000" renderer="canvas" />}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full mt-6">
            <Button onClick={() => setBarcodeProduct(null)} className="flex-1 h-10 text-xs rounded-xl border-slate-200 text-slate-600" variant="outline">Cerrar</Button>
            <Button onClick={downloadBarcodePNG} className="flex-1 h-10 text-xs gap-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-white shadow-md"><Download01Icon className="w-4 h-4" /> Descargar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kardex */}
      <Dialog open={isKardexModalOpen} onOpenChange={setIsKardexModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-white">
          <DialogHeader><DialogTitle className="text-lg font-bold">Kardex - {kardexProduct?.title}</DialogTitle></DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button onClick={() => exportKardexToExcel(kardexProduct, kardexMovements)} variant="outline" size="sm" className="flex-1"><Download01Icon className="w-4 h-4 mr-2" />Exportar Excel</Button>
            <Button onClick={() => exportKardexToPDF(kardexProduct, kardexMovements)} variant="outline" size="sm" className="flex-1"><Download01Icon className="w-4 h-4 mr-2" />Exportar PDF</Button>
          </div>
          <div className="flex-1 overflow-auto">
            {kardexMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400"><File01Icon className="w-12 h-12 mb-3 text-slate-300" /><p className="text-sm font-medium">No hay movimientos registrados</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>{['Fecha', 'Tipo', 'Motivo', 'Cantidad', 'Había', 'Hay', 'Sucursal', 'Usuario'].map(h => <th key={h} className="px-4 py-2 text-left text-xs font-bold text-slate-500">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kardexMovements.map((m: any) => {
                    // Calcular la cantidad con el signo correcto
                    const quantityDisplay = m.type === 'ADJUSTMENT'
                      ? (m.currentStock - m.previousStock)
                      : m.type === 'TRANSFER'
                      ? (m.currentStock > m.previousStock ? m.quantity : -m.quantity)
                      : (m.type === 'INPUT' || m.type === 'PURCHASE' ? m.quantity : -Math.abs(m.quantity));
                    
                    const quantityFormatted = quantityDisplay > 0 ? `+${quantityDisplay}` : quantityDisplay;
                    
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-600">{new Date(m.createdAt).toLocaleDateString('es-PE')}</td>
                        <td className="px-4 py-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.type === 'INPUT' || m.type === 'PURCHASE' ? 'bg-emerald-100 text-emerald-700' : m.type === 'OUTPUT' || m.type === 'SALE_POS' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{m.type}</span></td>
                        <td className="px-4 py-2 text-xs text-slate-600 max-w-[200px] truncate">{m.reason || '-'}</td>
                        <td className="px-4 py-2 text-xs font-bold text-center">
                          <span className={quantityDisplay > 0 ? 'text-emerald-600' : 'text-red-600'}>
                            {quantityFormatted}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500 text-center">{m.previousStock}</td>
                        <td className="px-4 py-2 text-xs font-bold text-center">{m.currentStock}</td>
                        <td className="px-4 py-2 text-xs text-slate-600">{m.branch?.name || '-'}</td>
                        <td className="px-4 py-2 text-xs text-slate-600">{m.user?.name || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ⚡ Memoizar el componente completo con comparación personalizada
const arePropsEqual = (prevProps: { logic: Logic }, nextProps: { logic: Logic }) => {
  // Solo re-renderizar si cambian los productos paginados o estados críticos
  const prev = prevProps.logic;
  const next = nextProps.logic;
  
  // Comparar estados de modales (CRÍTICO para que los botones funcionen)
  if (prev.isModalOpen !== next.isModalOpen) return false;
  if (prev.isCategoryModalOpen !== next.isCategoryModalOpen) return false;
  if (prev.isImportModalOpen !== next.isImportModalOpen) return false;
  if (prev.isBarcodeModalOpen !== next.isBarcodeModalOpen) return false;
  if (prev.isKardexModalOpen !== next.isKardexModalOpen) return false;
  if (prev.showExportMenu !== next.showExportMenu) return false;
  
  // Comparar productos y filtros
  if (prev.paginatedProducts.length !== next.paginatedProducts.length) return false;
  if (prev.currentPage !== next.currentPage) return false;
  if (prev.isLoading !== next.isLoading) return false;
  if (prev.codeFilter !== next.codeFilter) return false;
  if (prev.categoryFilter !== next.categoryFilter) return false;
  if (prev.stockFilter !== next.stockFilter) return false;
  
  // Comparar IDs de productos (más rápido que comparar objetos completos)
  const prevIds = prev.paginatedProducts.map(p => p.id).join(',');
  const nextIds = next.paginatedProducts.map(p => p.id).join(',');
  if (prevIds !== nextIds) return false;
  
  return true;
};

export const ProductsDesktop = memo(ProductsDesktopComponent, arePropsEqual);