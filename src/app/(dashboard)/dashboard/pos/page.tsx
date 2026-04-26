// src/app/(dashboard)/dashboard/pos/page.tsx
'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useResponsive } from '@/hooks/useResponsive';
import { usePOSLogic } from '@/components/pos/hooks/usePOSLogic';
import { Loading02Icon, PackageIcon } from 'hugeicons-react';

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
      <div className="flex flex-col h-full w-full gap-3">
        <MobilePOSHeader
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onNewCustomer={() => setShowCustomerModal(true)}
          onHistory={() => setShowSalesHistory(true)}
          onCashTransaction={() => setShowCashTransaction(true)}
          onCloseCash={() => cashHook.setShowCloseCash(true)}
          onOpenFilters={() => setShowMobileFilters(true)}
          hasActiveFilters={hasActiveFilters}
          disabled={saleState === 'PAID'}
          cartItemCount={cart.length}
          cartTotal={finalGlobalTotal}
        />

        <MobilePOSActiveFilters
          codeFilter={codeFilter}
          selectedCategory={selectedCategory}
          getBranchByCode={getBranchByCode}
          categories={availableCategories}
          onClearCodeFilter={() => { setCodeFilter('ALL'); setSelectedCategory('ALL'); }}
          onClearCategoryFilter={() => setSelectedCategory('ALL')}
        />

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 pb-36"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ 
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          <div id="pull-indicator-pos" className="flex items-center justify-center overflow-hidden transition-all duration-200" style={{ height: 0, opacity: 0 }}>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <div className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
              </div>
              {isRefreshing ? 'Actualizando...' : isPulling ? 'Suelta para actualizar' : 'Desliza para actualizar'}
            </div>
          </div>
          {loadingProducts || loadingCats ? (
            <div className="grid grid-cols-2 gap-2.5">
              {Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-2">
                  <div className="aspect-square bg-slate-100 rounded-xl mb-2" />
                  <div className="h-3 bg-slate-100 rounded mb-1" />
                  <div className="h-4 bg-slate-100 rounded w-2/3" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <PackageIcon className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-600 mb-1">No hay productos</p>
              <p className="text-xs text-slate-400">Ajusta los filtros para ver más productos</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2.5">
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
                  className="w-full mt-4 py-3 bg-slate-900 text-white rounded-2xl font-semibold text-sm"
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Cargar más productos ({filteredProducts.length - logic.visibleProducts.length} restantes)
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