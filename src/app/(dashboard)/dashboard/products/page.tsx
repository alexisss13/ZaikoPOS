// src/app/(dashboard)/dashboard/products/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useResponsive } from '@/hooks/useResponsive';
import { useProductsLogic, haptic, MOBILE_PAGE_SIZE } from '@/components/dashboard/products/useProductsLogic';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileProductList } from '@/components/dashboard/products/MobileProductList';
import { SearchBar } from '@/components/dashboard/products/SearchBar';
import { ProductsLoadingSkeleton } from '@/components/dashboard/products/ProductsLoadingSkeleton';
import { memo, useTransition } from 'react';
import {
  Cancel01Icon, DashboardSquare01Icon, ArrowDataTransferHorizontalIcon, Store01Icon,
  UnavailableIcon, FilterIcon, PackageIcon, ArrowDown01Icon, Tag01Icon, File01Icon,
  Download01Icon, BarCode01Icon, PlusSignIcon, SlidersHorizontalIcon, MoreHorizontalIcon,
} from 'hugeicons-react';

// Lazy-load desktop — no se descarga en móvil
const ProductsDesktop = dynamic(
  () => import('@/components/dashboard/products/ProductsDesktop').then(m => ({ default: m.ProductsDesktop })),
  { ssr: false, loading: () => <ProductsLoadingSkeleton /> }
);

// Lazy-load modales con loading states
const ProductModal = dynamic(() => import('@/components/dashboard/ProductModal').then(m => ({ default: m.ProductModal })), { ssr: false });
const CategoryModal = dynamic(() => import('@/components/dashboard/CategoryModal').then(m => ({ default: m.CategoryModal })), { ssr: false });
const ImportProductsModal = dynamic(() => import('@/components/dashboard/ImportProductsModal').then(m => ({ default: m.ImportProductsModal })), { ssr: false });
const BarcodeGeneratorModal = dynamic(() => import('@/components/dashboard/BarcodeGeneratorModal').then(m => ({ default: m.BarcodeGeneratorModal })), { ssr: false });

export default function ProductsPage() {
  const { isMobile } = useResponsive();
  const logic = useProductsLogic();
  const [isPending, startTransition] = useTransition();

  const {
    user, canCreate, branches, categories, suppliers, isLoading, mutate, mutateCategories,
    visibleCodes, getBranchByCode, availableCategories, filteredProducts,
    debouncedSearch, setDebouncedSearch, codeFilter, setCodeFilter, setCategoryFilter,
    categoryFilter, stockFilter, setStockFilter,
    isModalOpen, setIsModalOpen, isCategoryModalOpen, setIsCategoryModalOpen,
    isImportModalOpen, setIsImportModalOpen, isBarcodeModalOpen, setIsBarcodeModalOpen,
    selectedProduct, setSelectedProduct, canEditSelected, setCanEditSelected,
    showExportMenu, setShowExportMenu, showMobileFilters, setShowMobileFilters,
    visibleCount, setVisibleCount, mobileProducts, hasMore,
    handleSearchChange, handleOpenEdit, handleDelete, openKardexModal,
    scrollRef, isPulling, isRefreshing,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    exportToExcel, exportToPDF,
  } = logic;

  // Optimizar cambios de filtro con transiciones
  const handleFilterChange = (filterFn: () => void) => {
    startTransition(() => {
      filterFn();
    });
  };

  // ── Mobile loading state ──
  if (isMobile && isLoading) {
    return (
      <div className="flex flex-col h-full w-full gap-5">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-900 leading-tight">Productos</h1>
            <p className="text-xs text-slate-400 mt-0.5">Cargando...</p>
          </div>
        </div>
        <ProductsLoadingSkeleton />
      </div>
    );
  }

  // ── DESKTOP ──
  if (!isMobile) {
    return (
      <div className="flex flex-col h-full w-full gap-5">
        <ProductsDesktop logic={logic} />
      </div>
    );
  }

  // ── MOBILE ──
  return (
    <div className="flex flex-col h-full w-full gap-5">
      {/* Header móvil */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-900 leading-tight">Productos</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}
              {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && <span className="ml-1 text-slate-500">· filtrado</span>}
            </p>
          </div>
          <button onClick={() => setShowMobileFilters(true)} className="relative h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all">
            <SlidersHorizontalIcon className="w-4 h-4" />
            {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">•</span>
            )}
          </button>
          {canCreate && (
            <Button onClick={() => { setSelectedProduct(null); setCanEditSelected(true); setIsModalOpen(true); }} className="h-10 w-10 p-0 bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-xl shrink-0">
              <PlusSignIcon className="w-5 h-5" />
            </Button>
          )}
          {canCreate && (
            <div className="relative">
              <button onClick={() => setShowExportMenu(v => !v)} className="h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all">
                <MoreHorizontalIcon className="w-4 h-4" />
              </button>
              {showExportMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                  <div className="absolute right-0 top-12 w-44 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50">
                    <button onClick={() => { setShowExportMenu(false); setIsCategoryModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><Tag01Icon className="w-4 h-4 text-slate-400" /> Categorías</button>
                    <button onClick={() => { setShowExportMenu(false); setIsImportModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><File01Icon className="w-4 h-4 text-slate-400" /> Importar</button>
                    <button onClick={() => { setShowExportMenu(false); setIsBarcodeModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><BarCode01Icon className="w-4 h-4 text-slate-400" /> Códigos</button>
                    <div className="h-px bg-slate-100 mx-2 my-1" />
                    <button onClick={() => { setShowExportMenu(false); exportToExcel(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download01Icon className="w-4 h-4 text-slate-400" /> Excel</button>
                    <button onClick={() => { setShowExportMenu(false); exportToPDF(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download01Icon className="w-4 h-4 text-slate-400" /> PDF</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <SearchBar onSearchChange={handleSearchChange} placeholder="Nombre, SKU o código de barras..." debounceMs={200} />

        {/* Active filter chips */}
        {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
          <div className="flex gap-1.5 flex-wrap">
            {codeFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-full">
                {codeFilter === 'GENERAL' ? 'Compartidos' : codeFilter === 'INACTIVE' ? 'Inactivos' : getBranchByCode(codeFilter)?.name || codeFilter}
                <button onClick={() => { setCodeFilter('ALL'); setCategoryFilter('ALL'); logic.setCurrentPage(1); }}><Cancel01Icon className="w-3 h-3" /></button>
              </span>
            )}
            {categoryFilter !== 'ALL' && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700 text-white text-xs font-semibold rounded-full">
                {availableCategories.find(c => c.id === categoryFilter)?.name || 'Categoría'}
                <button onClick={() => { setCategoryFilter('ALL'); logic.setCurrentPage(1); }}><Cancel01Icon className="w-3 h-3" /></button>
              </span>
            )}
            {stockFilter !== 'ALL' && (
              <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${stockFilter === 'LOW' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                {stockFilter === 'LOW' ? 'Stock bajo' : 'Agotados'}
                <button onClick={() => { setStockFilter('ALL'); logic.setCurrentPage(1); }}><Cancel01Icon className="w-3 h-3" /></button>
              </span>
            )}
          </div>
        )}

        {/* Filter sheet */}
        <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
          <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-10 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-slate-200" /></div>
            <SheetHeader className="px-6 pt-3 pb-0"><SheetTitle className="text-xl font-black text-slate-900 text-left">Filtros</SheetTitle></SheetHeader>
            <div className="px-5 pt-4 space-y-4">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Catálogo</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { value: 'ALL', label: 'Todos', icon: <DashboardSquare01Icon className="w-3 h-3" /> },
                    { value: 'GENERAL', label: 'Compartidos', icon: <ArrowDataTransferHorizontalIcon className="w-3 h-3" /> },
                    ...visibleCodes.map(code => { const b = getBranchByCode(code); return { value: code, label: b?.name || code, icon: b?.logoUrl ? <img src={b.logoUrl} className="w-3 h-3 rounded-sm object-cover" alt="" /> : <Store01Icon className="w-3 h-3" /> }; }),
                    { value: 'INACTIVE', label: 'Inactivos', icon: <UnavailableIcon className="w-3 h-3" /> },
                  ].map(opt => (
                    <button key={opt.value} onClick={() => { haptic(8); handleFilterChange(() => { setCodeFilter(opt.value); setCategoryFilter('ALL'); logic.setCurrentPage(1); }); }}
                      className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform ${codeFilter === opt.value ? (opt.value === 'INACTIVE' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-slate-900 text-white border-slate-900 shadow-sm') : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {opt.icon}{opt.label}
                    </button>
                  ))}
                </div>
              </div>
              {availableCategories.length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Categoría</p>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button onClick={() => { haptic(8); handleFilterChange(() => { setCategoryFilter('ALL'); logic.setCurrentPage(1); }); }} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform ${categoryFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>Todas</button>
                    {availableCategories.map(cat => (
                      <button key={cat.id} onClick={() => { haptic(8); handleFilterChange(() => { setCategoryFilter(cat.id); logic.setCurrentPage(1); }); }} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform truncate ${categoryFilter === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{cat.name}</button>
                    ))}
                  </div>
                </div>
              )}
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Stock</p>
                <div className="grid grid-cols-3 gap-1.5">
                  <button onClick={() => { haptic(8); handleFilterChange(() => { setStockFilter('ALL'); logic.setCurrentPage(1); }); }} className={`py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform ${stockFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>Todos</button>
                  <button onClick={() => { haptic(8); handleFilterChange(() => { setStockFilter('LOW'); logic.setCurrentPage(1); }); }} className={`py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform ${stockFilter === 'LOW' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>Bajo</button>
                  <button onClick={() => { haptic(8); handleFilterChange(() => { setStockFilter('OUT'); logic.setCurrentPage(1); }); }} className={`py-1.5 rounded-lg text-[10px] font-bold border active:scale-95 transition-transform ${stockFilter === 'OUT' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-red-50 text-red-600 border-red-200'}`}>Agotado</button>
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
                  <button onClick={() => { haptic(15); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); setDebouncedSearch(''); logic.setCurrentPage(1); }} className="flex-1 py-2.5 rounded-lg border border-slate-200 bg-white text-[10px] font-bold text-slate-600 active:scale-95 transition-transform">Limpiar</button>
                )}
                <button onClick={() => { haptic(8); setShowMobileFilters(false); }} className="flex-1 py-2.5 rounded-lg bg-slate-900 text-white text-[10px] font-bold active:scale-95 transition-transform">Aplicar</button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Product list */}
      <div 
        ref={scrollRef} 
        className="flex flex-col flex-1 gap-2.5 overflow-y-auto pb-24" 
        onTouchStart={handleTouchStart} 
        onTouchMove={handleTouchMove} 
        onTouchEnd={handleTouchEnd} 
        style={{ 
          overscrollBehavior: 'contain', 
          WebkitOverflowScrolling: 'touch', 
          willChange: 'scroll-position',
          transform: 'translateZ(0)', // Forzar aceleración por hardware
          backfaceVisibility: 'hidden',
          perspective: 1000,
        }}
      >
        <div id="pull-indicator" className="flex items-center justify-center overflow-hidden transition-all duration-200" style={{ height: 0, opacity: 0, willChange: 'height, opacity' }}>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <div className={`refresh-icon w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin text-slate-700' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            </div>
            {isRefreshing ? 'Actualizando...' : isPulling ? 'Suelta para actualizar' : 'Desliza para actualizar'}
          </div>
        </div>

        {isLoading || isPending ? (
          <div className="space-y-2.5">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/3 rounded-lg" />
                    <div className="flex items-center gap-2 pt-1"><Skeleton className="h-5 w-20 rounded-lg" /><Skeleton className="h-5 w-14 rounded-full" /></div>
                  </div>
                  <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : mobileProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="relative mb-5">
              <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center">
                <PackageIcon className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
              </div>
              {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL' || debouncedSearch) && (
                <div className="absolute -top-1 -right-1 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center"><FilterIcon className="w-3.5 h-3.5 text-white" /></div>
              )}
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">{codeFilter === 'INACTIVE' ? 'Sin productos inactivos' : debouncedSearch ? `Sin resultados para "${debouncedSearch}"` : 'Sin productos aquí'}</h3>
            <p className="text-sm text-slate-400 mb-5 leading-relaxed">{codeFilter === 'INACTIVE' ? 'Todos los productos están activos.' : debouncedSearch ? 'Prueba con otro nombre, SKU o código.' : 'Ajusta los filtros o crea un nuevo producto.'}</p>
            <button onClick={() => { setDebouncedSearch(''); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); haptic(); }} className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-bold active:scale-95 transition-transform">Limpiar filtros</button>
          </div>
        ) : (
          <>
            <MobileProductList products={mobileProducts} branches={branches} canViewOthers={logic.canViewOthers} userBranchId={user?.branchId} onEdit={handleOpenEdit} onKardex={openKardexModal} />
            {hasMore && (
              <button onClick={() => { haptic(8); setVisibleCount(v => v + MOBILE_PAGE_SIZE); }} className="w-full py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                <ArrowDown01Icon className="w-4 h-4" /> Cargar más · {filteredProducts.length - visibleCount} restantes
              </button>
            )}
            {!hasMore && mobileProducts.length > MOBILE_PAGE_SIZE && (
              <p className="text-center text-xs text-slate-300 py-3 font-medium">· {filteredProducts.length} productos ·</p>
            )}
          </>
        )}
      </div>

      {/* Modales móvil */}
      {isModalOpen && <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} onSuccess={() => mutate()} productToEdit={selectedProduct} canEdit={canEditSelected} onDelete={handleDelete} onPrintBarcode={(p: any) => logic.setBarcodeProduct(p)} />}
      {isImportModalOpen && <ImportProductsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => mutate()} categories={categories || []} suppliers={suppliers || []} branches={branches || []} />}
      {isBarcodeModalOpen && <BarcodeGeneratorModal isOpen={isBarcodeModalOpen} onClose={() => setIsBarcodeModalOpen(false)} products={logic.products || []} />}
      {isCategoryModalOpen && <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSuccess={() => { mutate(); mutateCategories(); }} categories={categories || []} branches={branches || []} />}
    </div>
  );
}