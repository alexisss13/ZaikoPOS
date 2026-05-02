// src/app/(dashboard)/dashboard/pos/page.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useResponsive } from '@/hooks/useResponsive';
import { usePOSLogic } from '@/components/pos/hooks/usePOSLogic';
import { 
  Loading02Icon, PackageIcon, Search01Icon, SlidersHorizontalIcon, 
  UserAdd01Icon, Clock01Icon, Wallet01Icon, MoreHorizontalIcon, Store01Icon 
} from 'hugeicons-react';

// Lazy-load vistas por plataforma — el bundle del otro no se descarga
const POSDesktop = dynamic(
  () => import('@/components/pos/POSDesktop').then(m => ({ default: m.POSDesktop })),
  { ssr: false }
);

// Componentes móviles (ya existentes)
import { MobilePOSHeader } from '@/components/pos/mobile/MobilePOSHeader';
import { MobilePOSFilters } from '@/components/pos/mobile/MobilePOSFilters';
import { MobilePOSActiveFilters } from '@/components/pos/mobile/MobilePOSActiveFilters';
import { MobileProductGrid } from '@/components/pos/mobile/MobileProductGrid';
import { MobileCartFAB } from '@/components/pos/mobile/MobileCartFAB';
import { MobileCartSheet } from '@/components/pos/mobile/MobileCartSheet';
import { MobileCashClosed } from '@/components/pos/mobile/MobileCashClosed';
import { CashCloseModal } from '@/components/pos/modals/CashCloseModal';
import { SalesHistoryModal } from '@/components/pos/SalesHistoryModal';
import { CashTransactionModal } from '@/components/pos/CashTransactionModal';
import { CustomerModal } from '@/components/pos/CustomerModal';
import { CustomerSearchModal } from '@/components/pos/CustomerSearchModal';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { TicketPrint } from '@/components/pos/TicketPrint';
import { Skeleton } from '@/components/ui/skeleton';

export default function PosPage() {
  const { isMobile } = useResponsive();
  const logic = usePOSLogic();

  // Pull-to-refresh state (DEBE estar antes de cualquier return condicional)
  const [isPulling, setIsPulling] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [pullDistance, setPullDistance] = React.useState(0);
  const touchStartY = React.useRef(0);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [showExportMenu, setShowExportMenu] = React.useState(false);

  const {
    cashSession, hasCashOpen, mutateCash, branches, cashHook, isGlobalUser,
    visibleCodes, getBranchByCode, availableCategories, filteredProducts,
    searchTerm, setSearchTerm, codeFilter, setCodeFilter, selectedCategory, setSelectedCategory,
    hasActiveFilters, showSalesHistory, setShowSalesHistory,
    showCashTransaction, setShowCashTransaction, showCustomerModal, setShowCustomerModal,
    showCustomerSearch, setShowCustomerSearch, showDiscountModal, setShowDiscountModal,
    showMobileCart, setShowMobileCart, showMobileFilters, setShowMobileFilters,
    showTicketModal, setShowTicketModal, salesData,
    cart, setCart, foundCustomer, setFoundCustomer,
    globalDiscountType, setGlobalDiscountType, globalDiscountValue, setGlobalDiscountValue,
    saleState, ticketData,
    addToCart, updateQuantity, removeFromCart, calculateItemFinancials,
    globalSubtotalBase, itemsSubtotal, finalGlobalTotal, totalSavings, pointsToEarn,
    openPaymentModal, handleBoletear, handleLiberar, handleAnular,
    handleMobileCustomerAction, handleMobileDiscountAction,
    loadingCash, loadingProducts, loadingCats,
  } = logic;

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;
      
      if (distance > 0 && distance < 100) {
        setPullDistance(distance);
        setIsPulling(distance > 60);
        
        const indicator = document.getElementById('pull-indicator-pos');
        if (indicator) {
          indicator.style.height = `${Math.min(distance, 60)}px`;
          indicator.style.opacity = `${Math.min(distance / 60, 1)}`;
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling && !isRefreshing) {
      setIsRefreshing(true);
      setIsPulling(false);
      
      try {
        await logic.mutateProducts();
        await mutateCash();
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          setPullDistance(0);
          const indicator = document.getElementById('pull-indicator-pos');
          if (indicator) {
            indicator.style.height = '0';
            indicator.style.opacity = '0';
          }
        }, 500);
      }
    } else {
      setPullDistance(0);
      setIsPulling(false);
      const indicator = document.getElementById('pull-indicator-pos');
      if (indicator) {
        indicator.style.height = '0';
        indicator.style.opacity = '0';
      }
    }
  };

  if (loadingCash) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center gap-3">
        <Loading02Icon className="animate-spin text-slate-300" size={32} />
        <p className="font-semibold text-sm text-slate-400">Validando sesión...</p>
      </div>
    );
  }

  // ── MOBILE ──
  if (isMobile) {
    if (!hasCashOpen) {
      return (
        <MobileCashClosed
          onOpenCash={e => cashHook.handleOpenCash(e, mutateCash)}
          initialCash={cashHook.initialCash}
          setInitialCash={cashHook.setInitialCash}
          selectedBranch={cashHook.selectedBranch}
          setSelectedBranch={cashHook.setSelectedBranch}
          branches={branches}
          isGlobalUser={isGlobalUser}
          isOpening={cashHook.isOpeningCash}
        />
      );
    }

    return (
      <div className="flex flex-col h-full w-full bg-slate-50/30">
        
        {/* Header móvil estilo HR - separado del contenido */}
        <div className="bg-white border-b border-slate-200 p-4 space-y-4">
          {/* Título y botones */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-emerald-100 rounded-xl">
                <Store01Icon className="w-5 h-5 text-emerald-600" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-black text-slate-900 leading-tight">Punto de Venta</h1>
                <p className="text-xs text-slate-500 font-semibold truncate">
                  {cashSession?.branchName || 'Caja Activa'}
                </p>
              </div>
            </div>
            
            {/* Botones de acción principales */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowMobileFilters(true)} 
                disabled={saleState === 'PAID'}
                className="relative h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                <SlidersHorizontalIcon className="w-4 h-4" strokeWidth={2} />
                {hasActiveFilters && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="w-2 h-2 bg-white rounded-full" />
                  </span>
                )}
              </button>
              
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
                    <div className="absolute right-0 top-12 w-48 bg-white border border-slate-200 shadow-2xl rounded-2xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button onClick={() => { setShowExportMenu(false); setShowCustomerModal(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                        <div className="p-1.5 rounded-lg bg-blue-100"><UserAdd01Icon className="w-3.5 h-3.5 text-blue-600" strokeWidth={2} /></div>
                        Nuevo Cliente
                      </button>
                      <button onClick={() => { setShowExportMenu(false); setShowSalesHistory(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                        <div className="p-1.5 rounded-lg bg-purple-100"><Clock01Icon className="w-3.5 h-3.5 text-purple-600" strokeWidth={2} /></div>
                        Historial
                      </button>
                      <button onClick={() => { setShowExportMenu(false); setShowCashTransaction(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 active:bg-slate-100 transition-colors">
                        <div className="p-1.5 rounded-lg bg-emerald-100"><Wallet01Icon className="w-3.5 h-3.5 text-emerald-600" strokeWidth={2} /></div>
                        Movimiento
                      </button>
                      <div className="h-px bg-slate-100 my-1" />
                      <button onClick={() => { setShowExportMenu(false); cashHook.setShowCloseCash(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-700 hover:bg-red-50 active:bg-red-100 transition-colors">
                        <div className="p-1.5 rounded-lg bg-red-100"><Store01Icon className="w-3.5 h-3.5 text-red-600" strokeWidth={2} /></div>
                        Cerrar Caja
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Barra de Búsqueda Mejorada */}
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search01Icon className="h-5 w-5 text-slate-400" strokeWidth={2.5} />
            </div>
            <input
              type="text"
              className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block pl-10 p-3 outline-none transition-shadow disabled:opacity-50 font-semibold"
              placeholder="Buscar producto o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={saleState === 'PAID'}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 font-bold text-xs active:scale-95 transition-transform"
              >
                LIMPIAR
              </button>
            )}
          </div>
        </div>

        {/* Zona de Filtros Activos - Fuera del header blanco para que se asiente sobre el fondo gris */}
        {(codeFilter !== 'ALL' || selectedCategory !== 'ALL') && (
           <div className="px-4 pt-3 pb-1">
             <MobilePOSActiveFilters
               codeFilter={codeFilter}
               selectedCategory={selectedCategory}
               getBranchByCode={getBranchByCode}
               categories={availableCategories}
               onClearCodeFilter={() => { setCodeFilter('ALL'); setSelectedCategory('ALL'); }}
               onClearCategoryFilter={() => setSelectedCategory('ALL')}
             />
           </div>
        )}

        {/* Contenido Principal */}
        <div 
          ref={scrollRef}
          className={`flex-1 overflow-y-auto px-4 pb-24 ${hasActiveFilters ? 'pt-2' : 'pt-4'}`}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div id="pull-indicator-pos" className="flex items-center justify-center overflow-hidden transition-all duration-200 mb-2" style={{ height: 0, opacity: 0 }}>
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-lg border border-slate-200">
              <div className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-emerald-600' : 'text-slate-400'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              </div>
              <span className={`text-xs font-bold ${isRefreshing ? 'text-emerald-600' : 'text-slate-500'}`}>
                {isRefreshing ? 'Actualizando...' : isPulling ? 'Suelta para actualizar' : 'Desliza para actualizar'}
              </span>
            </div>
          </div>

          {loadingProducts || loadingCats ? (
            <div className="grid grid-cols-2 gap-3">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-3 shadow-sm">
                  <div className="aspect-square bg-slate-100/50 rounded-xl mb-3 animate-pulse" />
                  <div className="h-3 bg-slate-100 rounded mb-2 animate-pulse" />
                  <div className="h-4 bg-slate-100 rounded w-2/3 animate-pulse" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-inner mb-5">
                <PackageIcon className="w-12 h-12 text-slate-400" strokeWidth={2} />
              </div>
              <p className="text-lg font-black text-slate-900 mb-1">Sin resultados</p>
              <p className="text-sm text-slate-500 max-w-[200px] mb-6">Ajusta los filtros o cambia el término de búsqueda</p>
              <button 
                onClick={() => { setSearchTerm(''); setCodeFilter('ALL'); setSelectedCategory('ALL'); }}
                className="px-6 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-lg active:scale-95 transition-all"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <MobileProductGrid
                  products={logic.visibleProducts}
                  onProductClick={addToCart}
                  getLocalStock={logic.getLocalStock}
                  getGlobalStock={logic.getGlobalStock}
                  disabled={saleState === 'PAID' || !hasCashOpen}
                />
              </div>
              {logic.hasMoreProducts && (
                <button
                  onClick={logic.loadMoreProducts}
                  className="w-full mt-6 py-3.5 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Cargar más productos · {filteredProducts.length - logic.visibleProducts.length} restantes
                </button>
              )}
            </>
          )}
        </div>

        <MobileCartFAB itemCount={cart.length} total={finalGlobalTotal} onClick={() => setShowMobileCart(true)} disabled={!hasCashOpen} />

        <MobilePOSFilters
          isOpen={showMobileFilters}
          onClose={() => setShowMobileFilters(false)}
          codeFilter={codeFilter}
          onCodeFilterChange={setCodeFilter}
          visibleCodes={visibleCodes}
          getBranchByCode={getBranchByCode}
          categories={availableCategories}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          disabled={saleState === 'PAID' || !hasCashOpen}
        />

        <MobileCartSheet
          isOpen={showMobileCart}
          onClose={() => setShowMobileCart(false)}
          cart={cart}
          onUpdateQuantity={updateQuantity}
          onRemoveItem={removeFromCart}
          onClearCart={() => setCart([])}
          onCheckout={openPaymentModal}
          calculateItemFinancials={calculateItemFinancials}
          subtotal={globalSubtotalBase}
          totalSavings={totalSavings}
          finalTotal={finalGlobalTotal}
          saleState={saleState}
          foundCustomer={foundCustomer}
          onCustomerAction={handleMobileCustomerAction}
          onDiscountAction={handleMobileDiscountAction}
          globalDiscountValue={globalDiscountValue}
          pointsToEarn={pointsToEarn}
        />

        {/* Modales compartidos móvil */}
        <CashCloseModal isOpen={cashHook.showCloseCash} onClose={() => cashHook.setShowCloseCash(false)} onSubmit={() => cashSession && cashHook.handleCloseCash(cashSession.id, mutateCash)} onExit={cashHook.handleExitAfterClose} finalCash={cashHook.finalCash} setFinalCash={cashHook.setFinalCash} isClosing={cashHook.isClosingCash} closeResult={cashHook.closeResult} />
        <SalesHistoryModal isOpen={showSalesHistory} onClose={() => setShowSalesHistory(false)} salesData={salesData} />
        {cashSession && <CashTransactionModal isOpen={showCashTransaction} onClose={() => setShowCashTransaction(false)} onSuccess={() => mutateCash()} cashSessionId={cashSession.id} />}
        <CustomerModal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} onSuccess={customer => setFoundCustomer(customer)} />
        <CustomerSearchModal isOpen={showCustomerSearch} onClose={() => setShowCustomerSearch(false)} onSelectCustomer={customer => setFoundCustomer(customer)} onCreateNew={() => setShowCustomerModal(true)} />
        <DiscountModal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} currentType={globalDiscountType} currentValue={globalDiscountValue} onApply={(type, value) => { setGlobalDiscountType(type); setGlobalDiscountValue(value); }} subtotal={itemsSubtotal} />
        {ticketData && showTicketModal && <TicketPrint saleData={ticketData} onComplete={() => setShowTicketModal(false)} />}
      </div>
    );
  }

  // ── DESKTOP (lazy-loaded) ──
  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5 relative">
      <POSDesktop logic={logic} />
    </div>
  );
}