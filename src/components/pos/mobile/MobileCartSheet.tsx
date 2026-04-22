'use client';

import { memo, useCallback } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { 
  User02Icon, 
  ShoppingBag01Icon, 
  Cancel01Icon, 
  UserAdd01Icon, 
  Tag01Icon, 
  Delete02Icon, 
  MinusSignIcon, 
  Add01Icon, 
  ArrowRight01Icon 
} from 'hugeicons-react';

interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  price: number;
  wholesalePrice: number | null;
  wholesaleMinCount: number | null;
  discountPercentage: number;
  images: string[];
  cartQuantity: number;
  localStock: number;
}

interface MobileCartSheetProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (variantId: string, delta: number) => void;
  onRemoveItem: (variantId: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  calculateItemFinancials: (item: CartItem) => {
    finalUnitPrice: number;
    finalTotal: number;
    originalTotal: number;
    savings: number;
    isWholesaleApplied: boolean;
  };
  subtotal: number;
  totalSavings: number;
  finalTotal: number;
  saleState: 'IDLE' | 'PAID' | 'PROCESSING';
  foundCustomer: any;
  onCustomerAction: () => void;
  onDiscountAction: () => void;
  globalDiscountValue: string;
  pointsToEarn: number;
}

function MobileCartSheetComponent({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  calculateItemFinancials,
  subtotal,
  totalSavings,
  finalTotal,
  saleState,
  foundCustomer,
  onCustomerAction,
  onDiscountAction,
  globalDiscountValue,
  pointsToEarn,
}: MobileCartSheetProps) {
  
  const haptic = useCallback((ms = 10) => {
    try { navigator.vibrate?.(ms); } catch {}
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        side="bottom" 
        className="rounded-t-3xl px-0 pb-6 max-h-[85vh] overflow-hidden flex flex-col"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Carrito de Compras</SheetTitle>
        </SheetHeader>
        
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-slate-200" />
        </div>

        {/* Header */}
        <div className={`px-5 py-3 border-b flex items-center justify-between ${saleState === 'PAID' ? 'bg-emerald-50 border-emerald-200' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {foundCustomer ? (
              <>
                <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                  <User02Icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 truncate">{foundCustomer.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {foundCustomer.pointsBalance} pts
                    {pointsToEarn > 0 && (
                      <span className="text-amber-600 font-bold ml-1">(+{pointsToEarn})</span>
                    )}
                  </p>
                </div>
              </>
            ) : (
              <>
                <ShoppingBag01Icon className="w-5 h-5 text-slate-600 shrink-0" />
                <span className="font-bold text-sm text-slate-900">Carrito ({cart.length})</span>
              </>
            )}
          </div>

          {saleState === 'IDLE' && (
            <div className="flex items-center gap-1 shrink-0">
              <button 
                onClick={() => { haptic(8); foundCustomer ? onCustomerAction() : onCustomerAction(); }} 
                disabled={cart.length === 0}
                className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${foundCustomer ? 'text-emerald-600 hover:bg-emerald-50' : 'text-slate-400 hover:bg-blue-50 hover:text-blue-600'}`}
                title={foundCustomer ? 'Desvincular cliente' : 'Vincular cliente'}
              >
                {foundCustomer ? <Cancel01Icon className="w-4 h-4" /> : <UserAdd01Icon className="w-4 h-4" />}
              </button>
              <button 
                onClick={() => { haptic(8); onDiscountAction(); }} 
                disabled={cart.length === 0}
                className={`p-2 rounded-lg transition-colors disabled:opacity-30 ${globalDiscountValue && parseFloat(globalDiscountValue) > 0 ? 'text-amber-600 hover:bg-amber-50' : 'text-slate-400 hover:bg-amber-50 hover:text-amber-600'}`}
                title="Aplicar descuento"
              >
                <Tag01Icon className="w-4 h-4" />
              </button>
              <button 
                onClick={() => { haptic(15); onClearCart(); }} 
                disabled={cart.length === 0} 
                className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 p-2 rounded-lg hover:bg-red-50"
                title="Vaciar carrito"
              >
                <Delete02Icon className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Items list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-80 gap-3 py-12">
              <ShoppingBag01Icon className="w-12 h-12" />
              <span className="text-sm font-medium">Carrito vacío</span>
            </div>
          ) : (
            cart.map(item => {
              const { finalUnitPrice, finalTotal, isWholesaleApplied } = calculateItemFinancials(item);
              const hasDiscount = item.discountPercentage > 0;

              return (
                <div 
                  key={item.variantId} 
                  className={`p-3 rounded-2xl transition-all flex flex-col gap-2 relative group border ${saleState === 'PAID' ? 'bg-white/80 border-emerald-100' : 'bg-slate-50/50 border-slate-100'}`}
                >
                  <div className="flex justify-between items-start gap-2 pr-6">
                    <span className={`font-medium text-sm leading-tight line-clamp-2 flex-1 ${saleState === 'PAID' ? 'text-slate-600' : 'text-slate-800'}`}>
                      {item.productName}
                      {item.variantName && item.variantName !== 'Estándar' && (
                        <span className="text-slate-500"> ({item.variantName})</span>
                      )}
                    </span>
                    <span className="font-bold text-slate-900 text-sm shrink-0 tabular-nums">
                      S/ {finalTotal.toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-slate-500">
                          S/ {finalUnitPrice.toFixed(2)} x un
                        </span>
                        {(isWholesaleApplied || hasDiscount) && (
                          <span className="text-[10px] text-slate-300 line-through">
                            S/ {Number(item.price).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {isWholesaleApplied && (
                          <span className="text-[9px] bg-emerald-100/50 text-emerald-700 px-1.5 py-0.5 rounded-md font-semibold leading-none">
                            MAYORISTA
                          </span>
                        )}
                        {hasDiscount && (
                          <span className="text-[9px] bg-red-100/50 text-red-700 px-1.5 py-0.5 rounded-md font-semibold leading-none">
                            -{item.discountPercentage}%
                          </span>
                        )}
                      </div>
                    </div>

                    {saleState === 'IDLE' ? (
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm h-8">
                        <button 
                          onClick={() => { haptic(5); onUpdateQuantity(item.variantId, -1); }} 
                          className="w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 active:scale-90 transition-transform"
                        >
                          <MinusSignIcon className="w-4 h-4" />
                        </button>
                        <span className="text-sm font-semibold text-slate-800 w-8 text-center tabular-nums">
                          {item.cartQuantity}
                        </span>
                        <button 
                          onClick={() => { haptic(5); onUpdateQuantity(item.variantId, 1); }} 
                          className="w-8 flex items-center justify-center text-slate-500 hover:text-slate-900 active:scale-90 transition-transform"
                        >
                          <Add01Icon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm font-semibold text-emerald-700 px-3 py-1 bg-emerald-100/50 rounded-lg tabular-nums">
                        {item.cartQuantity} un.
                      </span>
                    )}
                  </div>

                  {saleState === 'IDLE' && (
                    <button 
                      onClick={() => { haptic(10); onRemoveItem(item.variantId); }} 
                      className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity active:scale-90"
                    >
                      <Delete02Icon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer con totales y botón de pago */}
        {cart.length > 0 && (
          <div className={`border-t px-5 py-4 space-y-3 ${saleState === 'PAID' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100 bg-white'}`}>
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-500 text-xs font-medium">
                <span>Subtotal</span>
                <span className="tabular-nums">S/ {subtotal.toFixed(2)}</span>
              </div>
              {totalSavings > 0 && (
                <div className="flex justify-between text-emerald-600 text-xs font-medium">
                  <span>Descuento / Ahorro</span>
                  <span className="tabular-nums">- S/ {totalSavings.toFixed(2)}</span>
                </div>
              )}
              <div className={`flex justify-between items-end pt-2 mt-2 border-t border-dashed ${saleState === 'PAID' ? 'border-emerald-200' : 'border-slate-200'}`}>
                <span className={`text-xs font-semibold uppercase tracking-wider ${saleState === 'PAID' ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {saleState === 'PAID' ? 'Pagado' : 'Total'}
                </span>
                <span className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${saleState === 'PAID' ? 'text-emerald-600' : 'text-slate-900'}`}>
                  S/ {finalTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {saleState === 'IDLE' && (
              <Button 
                onClick={() => { haptic(15); onCheckout(); }} 
                disabled={cart.length === 0} 
                className="w-full h-12 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-[0.98]"
              >
                Amortizar (Pagar) <ArrowRight01Icon className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export const MobileCartSheet = memo(MobileCartSheetComponent);
