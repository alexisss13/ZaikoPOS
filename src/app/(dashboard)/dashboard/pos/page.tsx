// src/app/(dashboard)/dashboard/pos/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useResponsive } from '@/hooks/useResponsive';
import { usePOSLogic } from '@/components/pos/hooks/usePOSLogic';
import { Loading02Icon } from 'hugeicons-react';

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
        />

        <MobilePOSActiveFilters
          codeFilter={codeFilter}
          selectedCategory={selectedCategory}
          getBranchByCode={getBranchByCode}
          categories={availableCategories}
          onClearCodeFilter={() => { setCodeFilter('ALL'); setSelectedCategory('ALL'); }}
          onClearCategoryFilter={() => setSelectedCategory('ALL')}
        />

        <div className="flex-1 overflow-y-auto px-4 pb-20">
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
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              <MobileProductGrid
                products={filteredProducts}
                onProductClick={addToCart}
                getLocalStock={logic.getLocalStock}
                getGlobalStock={logic.getGlobalStock}
                disabled={saleState === 'PAID' || !hasCashOpen}
              />
            </div>
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