// src/app/(dashboard)/dashboard/products/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useResponsive } from '@/hooks/useResponsive';
import { useProductsLogic, haptic, MOBILE_PAGE_SIZE } from '@/components/dashboard/products/useProductsLogic';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { MobileProductList } from '@/components/dashboard/products/MobileProductList';
// IMPORTANTE: Ya no necesitamos importar SearchBar porque lo haremos directamente aquí
import { ProductsLoadingSkeleton } from '@/components/dashboard/products/ProductsLoadingSkeleton';
import { KardexModal } from '@/components/dashboard/products/KardexModal';
import { KardexMobileModal } from '@/components/dashboard/products/KardexMobileModal';
import { memo, useTransition, useState, useEffect } from 'react';
import {
  Cancel01Icon, DashboardSquare01Icon, ArrowDataTransferHorizontalIcon, Store01Icon,
  UnavailableIcon, FilterIcon, Search01Icon, PackageIcon, ArrowDown01Icon, Tag01Icon, File01Icon,
  Download01Icon, BarCode01Icon, PlusSignIcon, SlidersHorizontalIcon, MoreHorizontalIcon,
} from 'hugeicons-react';

// Lazy-load desktop — no se descarga en móvil
const ProductsDesktop = dynamic(
  () => import('@/components/dashboard/products/ProductsDesktop').then(m => ({ default: m.ProductsDesktop })),
  { ssr: false, loading: () => <ProductsLoadingSkeleton /> }
);

// Lazy-load formulario paso a paso para PC
const NewProductStepForm = dynamic(() => import('@/components/dashboard/products/NewProductStepForm').then(m => ({ default: m.NewProductStepForm })), { ssr: false });
const CategoryModal = dynamic(() => import('@/components/dashboard/CategoryModal').then(m => ({ default: m.CategoryModal })), { ssr: false });
const ImportProductsModal = dynamic(() => import('@/components/dashboard/ImportProductsModal').then(m => ({ default: m.ImportProductsModal })), { ssr: false });
const BarcodeGeneratorModal = dynamic(() => import('@/components/dashboard/BarcodeGeneratorModal').then(m => ({ default: m.BarcodeGeneratorModal })), { ssr: false });

// Lazy-load formulario móvil nativo
const ProductMobileForm = dynamic(() => import('@/components/dashboard/products/ProductMobileForm').then(m => ({ default: m.ProductMobileForm })), { ssr: false });
const CategoryMobileForm = dynamic(() => import('@/components/dashboard/products/CategoryMobileForm').then(m => ({ default: m.CategoryMobileForm })), { ssr: false });
const ImportMobileForm = dynamic(() => import('@/components/dashboard/products/ImportMobileForm').then(m => ({ default: m.ImportMobileForm })), { ssr: false });
const BarcodeMobileForm = dynamic(() => import('@/components/dashboard/products/BarcodeMobileForm').then(m => ({ default: m.BarcodeMobileForm })), { ssr: false });
const FiltersMobileForm = dynamic(() => import('@/components/dashboard/products/FiltersMobileForm').then(m => ({ default: m.FiltersMobileForm })), { ssr: false });

export default function ProductsPage() {
  const { isMobile } = useResponsive();
  const logic = useProductsLogic();
  const [isPending, startTransition] = useTransition();

  // Estado local para la búsqueda visual (antes del debounce)
  const [localSearchTerm, setLocalSearchTerm] = useState('');

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
    isKardexModalOpen, setIsKardexModalOpen, kardexProduct, kardexMovements,
    exportKardexToExcel, exportKardexToPDF,
    exportToExcel, exportToPDF,
  } = logic;

  // Lógica de debounce para la búsqueda local
  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearchChange(localSearchTerm);
    }, 200); // 200ms debounce
    return () => clearTimeout(timer);
  }, [localSearchTerm, handleSearchChange]);

  // Sincronizar el estado local si la búsqueda se limpia desde otro lado (ej. limpiar filtros)
  useEffect(() => {
    if (!debouncedSearch && localSearchTerm) {
      setLocalSearchTerm('');
    }
  }, [debouncedSearch]);


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
    <div className="flex flex-col h-full w-full">
      
      {/* Header móvil estilo HR - separado del contenido */}
      <div className="bg-white border-b border-slate-200 p-4 space-y-4">
        {/* Título y botones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-slate-100 rounded-xl">
              <PackageIcon className="w-5 h-5 text-slate-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">Productos</h1>
              <p className="text-xs text-slate-500 font-semibold">
                {filteredProducts.length} producto{filteredProducts.length !== 1 ? 's' : ''}
                {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && ' · filtrado'}
              </p>
            </div>
          </div>
          
          {/* Botones de acción */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowMobileFilters(true)} 
              className="relative h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
            >
              <SlidersHorizontalIcon className="w-4 h-4" strokeWidth={2} />
              {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="w-2 h-2 bg-white rounded-full" />
                </span>
              )}
            </button>
            
            {canCreate && (
              <button 
                onClick={() => { setSelectedProduct(null); setCanEditSelected(true); setIsModalOpen(true); }} 
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 text-white shadow-md active:scale-95 transition-all"
              >
                <PlusSignIcon className="w-5 h-5" strokeWidth={2} />
              </button>
            )}
            
            {canCreate && (
              <div className="relative">
                <button 
                  onClick={() => setShowExportMenu(v => !v)} 
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <MoreHorizontalIcon className="w-4 h-4" strokeWidth={2} />
                </button>
                {showExportMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                      <div className="absolute right-0 top-12 w-44 bg-white border border-slate-200 shadow-2xl rounded-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <button onClick={() => { setShowExportMenu(false); setIsCategoryModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                          <div className="p-1.5 rounded-lg bg-purple-100"><Tag01Icon className="w-3.5 h-3.5 text-purple-600" strokeWidth={2.5} /></div>
                          Categorías
                        </button>
                        <button onClick={() => { setShowExportMenu(false); setIsImportModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                          <div className="p-1.5 rounded-lg bg-blue-100"><File01Icon className="w-3.5 h-3.5 text-blue-600" strokeWidth={2.5} /></div>
                          Importar
                        </button>
                        <button onClick={() => { setShowExportMenu(false); setIsBarcodeModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                          <div className="p-1.5 rounded-lg bg-slate-100"><BarCode01Icon className="w-3.5 h-3.5 text-slate-600" strokeWidth={2.5} /></div>
                          Códigos
                        </button>
                        <div className="h-px bg-slate-100 my-1" />
                        <button onClick={() => { setShowExportMenu(false); exportToExcel(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                          <div className="p-1.5 rounded-lg bg-emerald-100"><Download01Icon className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2.5} /></div>
                          Excel
                        </button>
                        <button onClick={() => { setShowExportMenu(false); exportToPDF(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                          <div className="p-1.5 rounded-lg bg-red-100"><Download01Icon className="w-3.5 h-3.5 text-red-600" strokeWidth={2.5} /></div>
                          PDF
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

        {/* Barra de Búsqueda Mejorada Directamente Incorporada */}
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search01Icon className="h-5 w-5 text-slate-400" strokeWidth={2.5} />
          </div>
          <input
            type="text"
            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-blue-500 focus:border-blue-500 block pl-10 p-3 outline-none transition-shadow disabled:opacity-50 font-semibold"
            placeholder="Buscar producto o código..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
          />
          {localSearchTerm && (
            <button
              onClick={() => {
                setLocalSearchTerm('');
                handleSearchChange('');
              }}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-bold text-xs active:scale-95 transition-transform"
            >
              LIMPIAR
            </button>
          )}
        </div>
      </div>

      {/* Contenido con fondo gris claro - SCROLL AQUÍ */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto bg-slate-50/30 p-4 scrollbar-hide"
        onTouchStart={handleTouchStart} 
        onTouchMove={handleTouchMove} 
        onTouchEnd={handleTouchEnd}
        style={{ 
          overscrollBehavior: 'contain', 
          WebkitOverflowScrolling: 'touch', 
          willChange: 'scroll-position',
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
          perspective: 1000,
        }}
      >
        {/* Pull to refresh indicator */}
        <div id="pull-indicator" className="flex items-center justify-center overflow-hidden transition-all duration-200 -mt-4 mb-2" style={{ height: 0, opacity: 0, willChange: 'height, opacity' }}>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-slate-200">
            <div className={`refresh-icon w-4 h-4 ${isRefreshing ? 'animate-spin text-slate-600' : 'text-slate-400'}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            </div>
            <span className={`text-xs font-bold ${isRefreshing ? 'text-slate-600' : 'text-slate-500'}`}>
              {isRefreshing ? 'Actualizando...' : isPulling ? 'Suelta para actualizar' : 'Desliza para actualizar'}
            </span>
          </div>
        </div>

        {/* Chips de filtros activos */}
        {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
          <div className="flex gap-2 flex-wrap mb-4">
            {codeFilter !== 'ALL' && (
              <button 
                onClick={() => { setCodeFilter('ALL'); setCategoryFilter('ALL'); logic.setCurrentPage(1); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white text-xs font-bold rounded-full shadow-md active:scale-95 transition-all"
              >
                <Store01Icon className="w-3 h-3" strokeWidth={2.5} />
                {codeFilter === 'GENERAL' ? 'Compartidos' : codeFilter === 'INACTIVE' ? 'Inactivos' : getBranchByCode(codeFilter)?.name || codeFilter}
                <Cancel01Icon className="w-3 h-3" strokeWidth={2.5} />
              </button>
            )}
            {categoryFilter !== 'ALL' && (
              <button 
                onClick={() => { setCategoryFilter('ALL'); logic.setCurrentPage(1); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-md active:scale-95 transition-all"
              >
                <Tag01Icon className="w-3 h-3" strokeWidth={2.5} />
                {availableCategories.find(c => c.id === categoryFilter)?.name || 'Categoría'}
                <Cancel01Icon className="w-3 h-3" strokeWidth={2.5} />
              </button>
            )}
            {stockFilter !== 'ALL' && (
              <button 
                onClick={() => { setStockFilter('ALL'); logic.setCurrentPage(1); }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-white text-xs font-bold rounded-full shadow-md active:scale-95 transition-all ${
                  stockFilter === 'LOW' ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gradient-to-r from-red-500 to-red-600'
                }`}
              >
                <UnavailableIcon className="w-3 h-3" strokeWidth={2.5} />
                {stockFilter === 'LOW' ? 'Stock bajo' : 'Agotados'}
                <Cancel01Icon className="w-3 h-3" strokeWidth={2.5} />
              </button>
            )}
          </div>
        )}

        {/* Native filter page */}
        {showMobileFilters && (
        <FiltersMobileForm
          onClose={() => setShowMobileFilters(false)}
          onApply={(filters) => {
            setCodeFilter(filters.codeFilter);
            setCategoryFilter(filters.categoryFilter);
            setStockFilter(filters.stockFilter);
            logic.setCurrentPage(1);
          }}
          currentFilters={{
            codeFilter,
            categoryFilter,
            stockFilter
          }}
          visibleCodes={visibleCodes}
          getBranchByCode={getBranchByCode}
          availableCategories={availableCategories}
        />
      )}

      {/* Product list - SIN overflow-y-auto aquí */}
      <div className="flex flex-col gap-3">
        {isLoading || isPending ? (
          <div className="space-y-3">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                  <div className="flex-1 space-y-2 min-w-0">
                    <Skeleton className="h-4 w-3/4 rounded-lg" />
                    <Skeleton className="h-3 w-1/3 rounded-lg" />
                    <div className="flex items-center gap-2 pt-1">
                      <Skeleton className="h-6 w-20 rounded-full" />
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </div>
                  </div>
                  <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                </div>
              </div>
            ))}
          </div>
        ) : mobileProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-6">
            <div className="relative mb-5">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-inner">
                <PackageIcon className="w-12 h-12 text-slate-400" strokeWidth={2} />
              </div>
              {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL' || debouncedSearch) && (
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <FilterIcon className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              )}
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-2">
              {codeFilter === 'INACTIVE' ? 'Sin productos inactivos' : debouncedSearch ? 'Sin resultados' : 'Sin productos'}
            </h3>
            <p className="text-sm text-slate-500 mb-6 leading-relaxed max-w-xs">
              {codeFilter === 'INACTIVE' 
                ? 'Todos los productos están activos.' 
                : debouncedSearch 
                  ? `No encontramos "${debouncedSearch}". Prueba con otro término.`
                  : 'Ajusta los filtros o crea un nuevo producto para comenzar.'}
            </p>
            <button 
              onClick={() => { setLocalSearchTerm(''); handleSearchChange(''); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); haptic(); }} 
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-bold shadow-lg active:scale-95 transition-all"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <MobileProductList 
              products={mobileProducts} 
              branches={branches} 
              canViewOthers={logic.canViewOthers} 
              userBranchId={user?.branchId} 
              onEdit={handleOpenEdit} 
              onKardex={openKardexModal} 
            />
            {hasMore && (
              <button 
                onClick={() => { haptic(8); setVisibleCount(v => v + MOBILE_PAGE_SIZE); }} 
                className="w-full py-3.5 rounded-2xl bg-white border-2 border-slate-200 text-sm font-bold text-slate-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <ArrowDown01Icon className="w-4 h-4" strokeWidth={2.5} /> 
                Cargar más · {filteredProducts.length - visibleCount} restantes
              </button>
            )}
            {!hasMore && mobileProducts.length > MOBILE_PAGE_SIZE && (
              <div className="flex items-center justify-center gap-2 py-4">
                <div className="h-px w-12 bg-slate-200" />
                <p className="text-xs text-slate-400 font-bold">{filteredProducts.length} productos</p>
                <div className="h-px w-12 bg-slate-200" />
              </div>
            )}
          </>
        )}
      </div>
      </div>

      {/* Modales móvil */}
      {isModalOpen && isMobile && (
        <ProductMobileForm
          onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }}
          onSuccess={() => { mutate(); setIsModalOpen(false); setSelectedProduct(null); }}
          productToEdit={selectedProduct}
          categories={categories}
          suppliers={suppliers}
          branches={branches}
        />
      )}
      {isModalOpen && !isMobile && <NewProductStepForm onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} onSuccess={() => mutate()} categories={categories} suppliers={suppliers} branches={branches} />}
      
      {isCategoryModalOpen && isMobile && (
        <CategoryMobileForm
          onClose={() => setIsCategoryModalOpen(false)}
          onSuccess={() => { mutate(); mutateCategories(); setIsCategoryModalOpen(false); }}
          categories={categories}
          branches={branches}
        />
      )}
      {isCategoryModalOpen && !isMobile && <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSuccess={() => { mutate(); mutateCategories(); }} categories={categories || []} branches={branches || []} />}
      
      {isImportModalOpen && isMobile && (
        <ImportMobileForm
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => { mutate(); setIsImportModalOpen(false); }}
          categories={categories}
          suppliers={suppliers}
          branches={branches}
        />
      )}
      {isImportModalOpen && !isMobile && <ImportProductsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => mutate()} categories={categories || []} suppliers={suppliers || []} branches={branches || []} />}
      
      {isBarcodeModalOpen && isMobile && (
        <BarcodeMobileForm
          onClose={() => setIsBarcodeModalOpen(false)}
          products={logic.products}
        />
      )}
      {isBarcodeModalOpen && !isMobile && <BarcodeGeneratorModal isOpen={isBarcodeModalOpen} onClose={() => setIsBarcodeModalOpen(false)} products={logic.products || []} />}

      {/* Kardex Modal */}
      {isMobile ? (
        <KardexMobileModal
          isOpen={isKardexModalOpen}
          onClose={() => setIsKardexModalOpen(false)}
          product={kardexProduct}
          movements={kardexMovements}
          onExportExcel={() => exportKardexToExcel(kardexProduct, kardexMovements)}
          onExportPDF={() => exportKardexToPDF(kardexProduct, kardexMovements)}
        />
      ) : (
        <KardexModal
          isOpen={isKardexModalOpen}
          onClose={() => setIsKardexModalOpen(false)}
          product={kardexProduct}
          movements={kardexMovements}
          onExportExcel={() => exportKardexToExcel(kardexProduct, kardexMovements)}
          onExportPDF={() => exportKardexToPDF(kardexProduct, kardexMovements)}
        />
      )}
    </div>
  );
}