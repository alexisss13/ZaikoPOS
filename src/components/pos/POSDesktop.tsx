'use client';

import { useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loading02Icon, ShoppingBag01Icon, Search01Icon, UserAdd01Icon, Time02Icon,
  ArrowDataTransferHorizontalIcon, Logout01Icon, DashboardSquare01Icon, Home01Icon,
  ArrowLeft01Icon, ArrowRight01Icon, PackageIcon, ArrowDataTransferDiagonalIcon,
  Tag01Icon, CheckmarkCircle02Icon, User02Icon, Cancel01Icon, Delete02Icon,
  MinusSignIcon, PlusSignIcon, Rocket01Icon, RotateClockwiseIcon, PrinterIcon
} from 'hugeicons-react';
import { CashOpenModal } from './modals/CashOpenModal';
import { CashCloseModal } from './modals/CashCloseModal';
import { SalesHistoryModal } from './SalesHistoryModal';
import { CashTransactionModal } from './CashTransactionModal';
import { CustomerModal } from './CustomerModal';
import { CustomerSearchModal } from './CustomerSearchModal';
import { DiscountModal } from './DiscountModal';
import { TicketPrint } from './TicketPrint';
import type { usePOSLogic } from './hooks/usePOSLogic';
import { ImageWithSpinner } from '@/components/ui/ImageWithSpinner';

type POSLogic = ReturnType<typeof usePOSLogic>;

interface POSDesktopProps {
  logic: POSLogic;
}

export function POSDesktop({ logic }: POSDesktopProps) {
  const {
    cashSession, hasCashOpen, mutateCash, branches, cashHook, isGlobalUser,
    canViewOthers, visibleCodes, getBranchByCode,
    filteredProducts, availableCategories,
    visibleProducts, hasMoreProducts, loadMoreProducts, // ⚡ Paginación
    searchTerm, setSearchTerm, codeFilter, setCodeFilter, selectedCategory, setSelectedCategory,
    showSalesHistory, setShowSalesHistory, showCashTransaction, setShowCashTransaction,
    showCustomerModal, setShowCustomerModal, showCustomerSearch, setShowCustomerSearch,
    showDiscountModal, setShowDiscountModal, showTicketModal, setShowTicketModal,
    showPayment, setShowPayment, salesData,
    cart, setCart, foundCustomer, setFoundCustomer,
    globalDiscountType, setGlobalDiscountType, globalDiscountValue, setGlobalDiscountValue,
    saleState, ticketData,
    addToCart, updateQuantity, removeFromCart, calculateItemFinancials,
    globalSubtotalBase, itemsSubtotal, globalDiscountAmount, finalGlobalTotal, totalSavings,
    splitPayments, cashReceived, setCashReceived, isSubmitting,
    totalPaid, remaining, numericCash, isValidPayment,
    openPaymentModal, handleQuickCash, addPaymentMethod, removePaymentMethod, updatePaymentMethod,
    handleAmortizar, handleBoletear, handleLiberar, handleAnular,
    transferProduct, setTransferProduct, transferVariant, setTransferVariant,
    transferFromBranch, setTransferFromBranch, transferQty, setTransferQty,
    isSubmittingTransfer, handleSubmitTransfer,
    loadingProducts, loadingCats,
  } = logic;

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const scroll = (direction: 'left' | 'right') => {
    scrollContainerRef.current?.scrollBy({ left: direction === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <>
      {/* Overlay caja cerrada */}
      {!hasCashOpen && (
        <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[0.5px] z-10 pointer-events-none" />
      )}

      {/* TOOLBAR */}
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">POS</h1>
          <ShoppingBag01Icon className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search01Icon className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input
              autoFocus={hasCashOpen}
              placeholder="Buscar producto, SKU..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              disabled={saleState === 'PAID' || !hasCashOpen}
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm"
            />
          </div>
          {hasCashOpen && (
            <>
              <Button onClick={() => setShowCustomerModal(true)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200">
                <UserAdd01Icon size={16} /> <span className="font-bold ml-1.5">Nuevo Cliente</span>
              </Button>
              <Button onClick={() => setShowSalesHistory(true)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200">
                <Time02Icon size={16} /> <span className="font-bold ml-1.5">Historial</span>
              </Button>
              <Button onClick={() => setShowCashTransaction(true)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200">
                <ArrowDataTransferHorizontalIcon size={16} /> <span className="font-bold ml-1.5">Ingresos/Egresos</span>
              </Button>
              <Button onClick={() => cashHook.setShowCloseCash(true)} className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all shrink-0">
                <Logout01Icon size={16} /> <span className="ml-1.5">Cerrar Caja</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* MAIN LAYOUT */}
      <div className="flex flex-1 min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">

        {/* CATALOG */}
        <main className={`flex-1 flex flex-col min-w-0 transition-colors ${saleState === 'PAID' ? 'bg-emerald-50/10 opacity-70 pointer-events-none' : 'bg-white'}`}>
          <div className="flex items-center w-full border-b border-slate-100 bg-white shrink-0 h-[52px]">
            {visibleCodes.length > 0 && canViewOthers && (
              <div className="flex items-center gap-1.5 px-4 h-full shrink-0 border-r border-slate-100">
                <button title="Todas las tiendas" onClick={() => { setCodeFilter('ALL'); setSelectedCategory('ALL'); }} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${codeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'}`}>
                  <DashboardSquare01Icon size={18} />
                </button>
                <button title="Global / Compartidos" onClick={() => { setCodeFilter('GENERAL'); setSelectedCategory('ALL'); }} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${codeFilter === 'GENERAL' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'}`}>
                  <ArrowDataTransferHorizontalIcon size={18} />
                </button>
                {visibleCodes.map(code => {
                  const bInfo = getBranchByCode(code);
                  const logoUrl = (bInfo as any)?.logos?.isotipo || (bInfo as any)?.logos?.imagotipo || (bInfo as any)?.logos?.alternate;
                  return (
                    <button title={bInfo?.name || code} key={code} onClick={() => { setCodeFilter(code); setSelectedCategory('ALL'); }} className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all overflow-hidden ${codeFilter === code ? 'ring-2 ring-slate-200 ring-offset-1 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'}`}>
                      {logoUrl ? <img src={logoUrl} className="w-full h-full object-cover bg-white" alt="" /> : <Home01Icon className="text-slate-500" size={18} />}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="flex-1 h-full overflow-hidden relative flex items-center">
              <div ref={scrollContainerRef} className="flex items-center gap-2 px-4 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
                <button onClick={() => setSelectedCategory('ALL')} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                  Todas las categorías
                </button>
                {availableCategories.map(cat => (
                  <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat.id ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-3 shrink-0 h-full border-l border-slate-100 bg-slate-50/50">
              <button onClick={() => scroll('left')} className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors active:scale-90"><ArrowLeft01Icon size={20} /></button>
              <button onClick={() => scroll('right')} className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors active:scale-90"><ArrowRight01Icon size={20} /></button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 custom-scrollbar">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
              {loadingProducts || loadingCats ? (
                Array(12).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-100 p-2"><Skeleton className="aspect-square w-full rounded-xl" /><Skeleton className="h-3 w-full mt-2" /></div>
                ))
              ) : visibleProducts.length === 0 ? (
                <div className="col-span-full h-32 flex items-center justify-center text-slate-400 text-sm font-medium">No hay productos disponibles.</div>
              ) : visibleProducts.map(product => {
                const variant = product.variants.find((v: any) => v.name === 'Estándar') || product.variants[0];
                if (!variant) return null;
                const localStock = logic.getLocalStock(variant);
                const globalStock = logic.getGlobalStock(variant);
                const externalStock = globalStock - localStock;
                const isOutOfStock = localStock <= 0;
                const hasDiscount = product.discountPercentage > 0;
                const hasWholesale = product.wholesalePrice && product.wholesaleMinCount;
                const displayPrice = product.basePrice;
                const displayImages = (variant.images?.length ? variant.images : product.images);
                return (
                  <div key={`${product.id}-${variant.id}`} onClick={() => addToCart(product, variant)} className={`group relative flex flex-col gap-2 p-2 rounded-2xl transition-all select-none bg-white border ${isOutOfStock ? 'opacity-80 border-slate-200 border-dashed cursor-pointer hover:bg-slate-50' : 'cursor-pointer border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}>
                    <div className={`aspect-square bg-slate-50 rounded-xl relative overflow-hidden shrink-0 border border-slate-100 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}>
                      {displayImages?.[0] ? (
                        <ImageWithSpinner
                          src={displayImages[0]}
                          alt={product.title}
                          className="w-full h-full object-cover mix-blend-multiply"
                          containerClassName="w-full h-full"
                          spinnerSize={24}
                          fallback={<div className="w-full h-full flex items-center justify-center text-slate-300"><PackageIcon size={24} /></div>}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300"><PackageIcon size={24} /></div>
                      )}
                      <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm leading-none backdrop-blur-md ${isOutOfStock ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-700'}`}>{localStock} un.</span>
                        {hasDiscount && !isOutOfStock && <span className="text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded-md shadow-sm leading-none">-{product.discountPercentage}%</span>}
                      </div>
                    </div>
                    <div className="px-1 pb-1 flex flex-col justify-between flex-1">
                      <p className="font-medium text-slate-700 text-xs leading-tight line-clamp-2">{product.title}</p>
                      <div className="mt-1.5">
                        {isOutOfStock && externalStock > 0 ? (
                          <p className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-1 rounded-md border border-amber-200 flex items-center gap-1 mt-1 hover:bg-amber-100 transition-colors"><ArrowDataTransferDiagonalIcon size={12} /> Pedir Traslado</p>
                        ) : isOutOfStock ? (
                          <p className="text-[10px] font-semibold text-red-500 mt-1">Agotado Totalmente</p>
                        ) : (
                          <>
                            <div className="flex items-center gap-1.5">
                              <p className="text-slate-900 font-semibold text-sm">S/ {Number(displayPrice).toFixed(2)}</p>
                              {hasDiscount && <p className="text-[10px] text-slate-400 line-through">S/ {(Number(displayPrice) * (1 / (1 - product.discountPercentage / 100))).toFixed(2)}</p>}
                            </div>
                            {hasWholesale && <p className="text-[9px] font-medium text-slate-500 mt-1 leading-none flex items-center gap-1"><Tag01Icon size={12} /> Mayor S/{Number(product.wholesalePrice).toFixed(2)}<span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ml-auto">≥{product.wholesaleMinCount}u</span></p>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Botón Cargar Más */}
            {hasMoreProducts && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={loadMoreProducts}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm transition-colors"
                >
                  Cargar más productos ({filteredProducts.length - visibleProducts.length} restantes)
                </button>
              </div>
            )}
          </div>
        </main>
        {/* CART */}
        <aside className={`w-[320px] xl:w-[360px] flex flex-col border-l shrink-0 overflow-hidden transition-colors duration-300 bg-white ${saleState === 'PAID' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}>
          <div className={`h-14 px-4 border-b flex items-center justify-between shrink-0 transition-colors ${saleState === 'PAID' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white border-slate-100'}`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {saleState === 'PAID' ? (
                <><CheckmarkCircle02Icon size={20} /><span className="font-semibold text-sm">VENTA PAGADA</span></>
              ) : foundCustomer ? (
                <>
                  <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0"><User02Icon size={16} /></div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">{foundCustomer.name}</p>
                    <p className="text-[10px] text-slate-500">{foundCustomer.pointsBalance} pts{finalGlobalTotal > 0 && <span className="text-amber-600 font-bold ml-1">(+{Math.floor(finalGlobalTotal / 2)})</span>}</p>
                  </div>
                </>
              ) : (
                <><ShoppingBag01Icon size={20} /><span className="font-semibold text-sm">Resumen de Venta</span></>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {saleState === 'IDLE' && (
                <>
                  <button onClick={() => foundCustomer ? setFoundCustomer(null) : setShowCustomerSearch(true)} disabled={cart.length === 0} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${foundCustomer ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`} title={foundCustomer ? 'Desvincular cliente' : 'Vincular cliente'}>
                    {foundCustomer ? <Cancel01Icon size={16} /> : <UserAdd01Icon size={16} />}
                  </button>
                  <button onClick={() => setShowDiscountModal(true)} disabled={cart.length === 0} className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${globalDiscountValue && parseFloat(globalDiscountValue) > 0 ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`} title="Aplicar descuento">
                    <Tag01Icon size={16} />
                  </button>
                  <button onClick={() => setCart([])} disabled={cart.length === 0} className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 p-1.5 rounded-lg hover:bg-red-50" title="Vaciar carrito">
                    <Delete02Icon size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-80 gap-3"><ShoppingBag01Icon size={40} /><span className="text-sm font-medium">Bandeja vacía</span></div>
            ) : cart.map(item => {
              const { finalUnitPrice, finalTotal, isWholesaleApplied } = calculateItemFinancials(item);
              const hasDiscount = item.discountPercentage > 0;
              return (
                <div key={item.variantId} className={`p-3 rounded-xl transition-all flex flex-col gap-1.5 relative group border ${saleState === 'PAID' ? 'bg-white/80 border-emerald-100' : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-start gap-2 pr-6">
                    <span className={`font-medium text-xs leading-tight line-clamp-2 flex-1 ${saleState === 'PAID' ? 'text-slate-600' : 'text-slate-800'}`}>
                      {item.productName}{item.variantName && item.variantName !== 'Estándar' && <span className="text-slate-500"> ({item.variantName})</span>}
                    </span>
                    <span className="font-semibold text-slate-900 text-sm shrink-0 tabular-nums">S/ {finalTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-500">S/ {finalUnitPrice.toFixed(2)} x un</span>
                        {(isWholesaleApplied || hasDiscount) && <span className="text-[10px] text-slate-300 line-through">S/ {Number(item.price).toFixed(2)}</span>}
                      </div>
                      <div className="flex gap-1.5 mt-1">
                        {isWholesaleApplied && <span className="text-[9px] bg-emerald-100/50 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold leading-none">MAYORISTA</span>}
                        {hasDiscount && <span className="text-[9px] bg-red-100/50 text-red-700 px-1.5 py-0.5 rounded-md font-semibold leading-none">-{item.discountPercentage}%</span>}
                      </div>
                    </div>
                    {saleState === 'IDLE' ? (
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm h-7">
                        <button onClick={() => updateQuantity(item.variantId, -1)} className="w-7 flex items-center justify-center text-slate-500 hover:text-slate-900"><MinusSignIcon size={14} /></button>
                        <span className="text-xs font-semibold text-slate-800 w-6 text-center tabular-nums">{item.cartQuantity}</span>
                        <button onClick={() => updateQuantity(item.variantId, 1)} className="w-7 flex items-center justify-center text-slate-500 hover:text-slate-900"><PlusSignIcon size={14} /></button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 px-2.5 py-1 bg-emerald-100/50 rounded-lg tabular-nums">{item.cartQuantity} un.</span>
                    )}
                  </div>
                  {saleState === 'IDLE' && <button onClick={() => removeFromCart(item.variantId)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Delete02Icon size={16} /></button>}
                </div>
              );
            })}
          </div>

          <div className={`border-t shrink-0 flex flex-col p-4 gap-4 transition-colors ${saleState === 'PAID' ? 'border-emerald-200 bg-white/50' : 'border-slate-100 bg-white'}`}>
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-500 text-xs font-medium"><span>Subtotal Base</span><span className="tabular-nums">S/ {globalSubtotalBase.toFixed(2)}</span></div>
              {totalSavings > 0 && <div className="flex justify-between text-emerald-600 text-xs font-medium"><span>Descuento / Ahorro Total</span><span className="tabular-nums">- S/ {totalSavings.toFixed(2)}</span></div>}
              <div className={`flex justify-between items-end pt-3 mt-2 border-t border-dashed ${saleState === 'PAID' ? 'border-emerald-200' : 'border-slate-200'}`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${saleState === 'PAID' ? 'text-emerald-700' : 'text-slate-500'}`}>{saleState === 'PAID' ? 'Pagado' : 'Total a Cobrar'}</span>
                <span className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${saleState === 'PAID' ? 'text-emerald-600' : 'text-slate-900'}`}>S/ {finalGlobalTotal.toFixed(2)}</span>
              </div>
            </div>
            {saleState === 'IDLE' ? (
              <Button onClick={openPaymentModal} disabled={cart.length === 0} className="w-full h-12 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-[0.98]">
                Amortizar (Pagar) <ArrowRight01Icon className="ml-1.5" size={16} />
              </Button>
            ) : (
              <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-2">
                  <Button onClick={handleBoletear} variant="outline" className="flex-1 h-10 text-xs font-semibold text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 rounded-xl"><PrinterIcon size={16} /><span className="ml-1.5">Boletear</span></Button>
                  <Button onClick={handleLiberar} className="flex-1 h-10 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm"><Rocket01Icon size={16} /><span className="ml-1.5">Liberar</span></Button>
                </div>
                <Button onClick={handleAnular} variant="ghost" className="h-9 text-[11px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 w-full rounded-lg"><RotateClockwiseIcon size={14} /><span className="ml-1.5">Anular Venta</span></Button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Caja cerrada banner */}
      {!hasCashOpen && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-white border border-slate-200 shadow-xl rounded-2xl px-6 py-4 flex items-center gap-4 pointer-events-auto">
          <div>
            <p className="font-bold text-slate-900 text-sm">Caja cerrada</p>
            <p className="text-xs text-slate-500">Abre la caja para comenzar a vender</p>
          </div>
          <Button onClick={() => cashHook.setShowOpenCash(true)} className="h-11 px-5 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">
            Abrir Caja
          </Button>
        </div>
      )}
      {/* PAYMENT MODAL */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-lg font-sans p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white">
            <DialogTitle className="text-lg font-black text-slate-900">Recibir Pago</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">Configura los métodos de pago</DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
              <span className="text-sm font-semibold text-slate-600">Total a cobrar:</span>
              <span className="text-xl font-black text-slate-900 tabular-nums">S/ {finalGlobalTotal.toFixed(2)}</span>
            </div>
            <div className="space-y-3">
              {splitPayments.map((payment, index) => (
                <div key={index} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">Método {index + 1}</Label>
                    {splitPayments.length > 1 && <Button variant="ghost" size="sm" onClick={() => removePaymentMethod(index)} className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"><Cancel01Icon size={16} /></Button>}
                  </div>
                  <Select value={payment.method} onValueChange={value => updatePaymentMethod(index, 'method', value)}>
                    <SelectTrigger className="h-10 text-sm font-semibold"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="YAPE">Yape</SelectItem>
                      <SelectItem value="PLIN">Plin</SelectItem>
                      <SelectItem value="CARD">Tarjeta</SelectItem>
                      <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">Monto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">S/</span>
                      <input type="number" step="0.01" placeholder="0.00" value={payment.amount} onChange={e => updatePaymentMethod(index, 'amount', e.target.value)} className="pl-8 h-10 text-sm font-semibold tabular-nums w-full border border-slate-200 rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                    </div>
                  </div>
                  {['YAPE', 'PLIN', 'TRANSFER'].includes(payment.method) && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Nº Operación</Label>
                      <input type="text" placeholder="123456789" value={payment.reference} onChange={e => updatePaymentMethod(index, 'reference', e.target.value)} className="h-10 text-sm font-mono w-full border border-slate-200 rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                    </div>
                  )}
                  {payment.method === 'CASH' && index === 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Efectivo Recibido</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">S/</span>
                        <input type="number" step="0.01" placeholder="0.00" value={cashReceived} onChange={e => setCashReceived(e.target.value)} className="pl-8 h-10 text-sm font-semibold tabular-nums w-full border border-slate-200 rounded-md px-3 focus:outline-none focus:ring-1 focus:ring-slate-300" />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[parseFloat(payment.amount) || finalGlobalTotal, 20, 50, 100].map((amt, i) => (
                          <Button key={i} variant="outline" size="sm" onClick={() => handleQuickCash(amt)} className="h-8 text-[10px] font-semibold">{i === 0 ? 'Exacto' : `S/${amt}`}</Button>
                        ))}
                      </div>
                      {numericCash > 0 && (
                        <div className={`px-3 py-2 rounded-lg flex items-center justify-between text-xs ${numericCash >= parseFloat(payment.amount) ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                          <span className="font-semibold text-slate-600">Vuelto:</span>
                          <span className={`font-bold tabular-nums ${numericCash >= parseFloat(payment.amount) ? 'text-emerald-700' : 'text-red-700'}`}>S/ {(numericCash - parseFloat(payment.amount)).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {splitPayments.length < 3 && remaining > 0.01 && (
                <Button variant="outline" size="sm" onClick={addPaymentMethod} className="w-full h-9 text-xs font-bold border-dashed">
                  <PlusSignIcon size={16} /> <span className="ml-1.5">Agregar Método de Pago</span>
                </Button>
              )}
            </div>
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex justify-between text-xs font-medium text-slate-600"><span>Total pagado:</span><span className={`tabular-nums font-bold ${isValidPayment ? 'text-emerald-600' : 'text-red-600'}`}>S/ {totalPaid.toFixed(2)}</span></div>
              {remaining > 0.01 && <div className="flex justify-between text-xs font-medium text-red-600"><span>Falta:</span><span className="tabular-nums font-bold">S/ {remaining.toFixed(2)}</span></div>}
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
            <Button onClick={handleAmortizar} disabled={!isValidPayment || isSubmitting} className="w-full h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md">
              {isSubmitting ? <><Loading02Icon className="animate-spin mr-2" size={18} /> Procesando...</> : 'Confirmar Venta'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* TRANSFER MODAL */}
      {transferProduct && transferVariant && (
        <Dialog open={!!transferProduct} onOpenChange={() => { logic.setTransferProduct(null); logic.setTransferVariant(null); }}>
          <DialogContent className="sm:max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="font-black text-slate-900">Solicitar Traslado</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">Sin stock local. Solicita traslado desde otra sucursal.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Sucursal Origen</Label>
                <Select value={transferFromBranch} onValueChange={setTransferFromBranch}>
                  <SelectTrigger className="h-10"><SelectValue placeholder="Seleccionar sucursal..." /></SelectTrigger>
                  <SelectContent>
                    {logic.branches?.filter((b: any) => b.id !== logic.cashSession?.branchId).map((b: any) => {
                      const stock = transferVariant.stock?.find((s: any) => s.branchId === b.id)?.quantity || 0;
                      return stock > 0 ? <SelectItem key={b.id} value={b.id}>{b.name} ({stock} un.)</SelectItem> : null;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Cantidad</Label>
                <input type="number" min="1" value={transferQty} onChange={e => setTransferQty(e.target.value)} className="h-10 w-full border border-slate-200 rounded-md px-3 text-sm focus:outline-none focus:ring-1 focus:ring-slate-300" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => { logic.setTransferProduct(null); logic.setTransferVariant(null); }} className="flex-1">Cancelar</Button>
              <Button onClick={handleSubmitTransfer} disabled={isSubmittingTransfer} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
                {isSubmittingTransfer ? 'Enviando...' : 'Solicitar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* SHARED MODALS */}
      <CashOpenModal isOpen={cashHook.showOpenCash} onClose={() => cashHook.setShowOpenCash(false)} onSubmit={e => cashHook.handleOpenCash(e, mutateCash)} initialCash={cashHook.initialCash} setInitialCash={cashHook.setInitialCash} selectedBranch={cashHook.selectedBranch} setSelectedBranch={cashHook.setSelectedBranch} branches={branches} isGlobalUser={isGlobalUser} isOpening={cashHook.isOpeningCash} />
      <CashCloseModal isOpen={cashHook.showCloseCash} onClose={() => cashHook.setShowCloseCash(false)} onSubmit={() => cashSession && cashHook.handleCloseCash(cashSession.id, mutateCash)} onExit={cashHook.handleExitAfterClose} finalCash={cashHook.finalCash} setFinalCash={cashHook.setFinalCash} isClosing={cashHook.isClosingCash} closeResult={cashHook.closeResult} />
      <SalesHistoryModal isOpen={showSalesHistory} onClose={() => setShowSalesHistory(false)} salesData={salesData} />
      {cashSession && <CashTransactionModal isOpen={showCashTransaction} onClose={() => setShowCashTransaction(false)} onSuccess={() => { mutateCash(); }} cashSessionId={cashSession.id} />}
      <CustomerModal isOpen={showCustomerModal} onClose={() => setShowCustomerModal(false)} onSuccess={customer => { setFoundCustomer(customer); }} />
      <CustomerSearchModal isOpen={showCustomerSearch} onClose={() => setShowCustomerSearch(false)} onSelectCustomer={customer => { setFoundCustomer(customer); }} onCreateNew={() => setShowCustomerModal(true)} />
      <DiscountModal isOpen={showDiscountModal} onClose={() => setShowDiscountModal(false)} currentType={globalDiscountType} currentValue={globalDiscountValue} onApply={(type, value) => { setGlobalDiscountType(type); setGlobalDiscountValue(value); }} subtotal={itemsSubtotal} />
      {ticketData && showTicketModal && <TicketPrint saleData={ticketData} onComplete={() => setShowTicketModal(false)} />}
    </>
  );
}