'use client';

import useSWR from 'swr';
import { useState, useMemo, useRef } from 'react';
import { 
  Search, Trash2, Plus, Minus, CreditCard, Banknote, ShoppingBag, 
  Package, SplitSquareHorizontal, Tag, ChevronRight, ChevronLeft, CheckCircle2, 
  User, Receipt, Unlock, RotateCcw, UserPlus, X, Store, Globe, 
  ArrowRightLeft, Send, LayoutGrid
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface BranchBasic { id: string; name: string; ecommerceCode: string | null; logoUrl?: string | null; }
interface Category { id: string; name: string; ecommerceCode?: string | null; }
interface Product {
  id: string; title: string; price: number; wholesalePrice: number | null;
  wholesaleMinCount: number | null; discountPercentage: number;
  images: string[]; barcode: string | null; categoryId: string;
  code?: string | null;
  branchStock?: { branchId: string; quantity: number }[];
  category?: { name: string; ecommerceCode: string | null };
}
interface CartItem extends Product { cartQuantity: number; }

export default function PosPage() {
  const { user, userId } = useAuth();
  
  const { data: products, isLoading: loadingProducts } = useSWR<Product[]>('/api/products', fetcher);
  const { data: categories, isLoading: loadingCats } = useSWR<Category[]>('/api/categories', fetcher);
  const { data: branches } = useSWR<BranchBasic[]>('/api/branches', fetcher);
  
  const currentBranch = branches?.find(b => b.id === user?.branchId);

  const [searchTerm, setSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);

  const [saleState, setSaleState] = useState<'DRAFT' | 'PAID'>('DRAFT');
  const [customerDoc, setCustomerDoc] = useState('');
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [globalDiscountType, setGlobalDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [globalDiscountValue, setGlobalDiscountValue] = useState('');

  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'SPLIT'>('CASH');
  const [cashReceived, setCashReceived] = useState('');

  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferFromBranch, setTransferFromBranch] = useState<string>('');
  const [transferQty, setTransferQty] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // 🚀 REF PARA EL SCROLL DE CATEGORÍAS
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; 
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const getLocalStock = (product: Product) => {
    if (user?.branchId && user.branchId !== 'NONE') {
      return product.branchStock?.find(bs => bs.branchId === user.branchId)?.quantity || 0;
    }
    return product.branchStock?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
  };

  const isSuperOrOwner = user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';
  const permissions = user?.permissions || {};
  const canManageGlobal = isSuperOrOwner || !!permissions.canManageGlobalProducts;
  const canViewOthers = isSuperOrOwner || !!permissions.canViewOtherBranches || canManageGlobal;
  const myCode = currentBranch?.ecommerceCode;

  const uniqueCodes = Array.from(new Set(branches?.map((b) => b.ecommerceCode).filter(Boolean))) as string[];
  const visibleCodes = canViewOthers ? uniqueCodes : uniqueCodes.filter(c => c === myCode);

  const getBranchByCode = (code: string) => branches?.find(b => b.ecommerceCode === code);

  const allowedProducts = useMemo(() => {
    if (!products) return [];
    if (canViewOthers) return products;

    return products.filter(p => {
      const catEcommerceCode = p.category?.ecommerceCode ?? categories?.find(c => c.id === p.categoryId)?.ecommerceCode;
      const isGlobalProduct = !catEcommerceCode;
      const isMyCatalogProduct = catEcommerceCode === myCode;
      const hasStockInMyBranch = p.branchStock?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;

      return isGlobalProduct || isMyCatalogProduct || hasStockInMyBranch;
    });
  }, [products, categories, myCode, user?.branchId, canViewOthers]);

  const availableCategories = useMemo(() => {
    if (!categories || !allowedProducts) return [];
    
    const baseProducts = allowedProducts.filter(p => {
      let matchesCode = true;
      if (canViewOthers) {
        const catEcommerceCode = p.category?.ecommerceCode ?? categories?.find(c => c.id === p.categoryId)?.ecommerceCode;
        const isGlobalProduct = !catEcommerceCode;
        const isMyCatalogProduct = catEcommerceCode === myCode;
        const hasStockInMyBranch = p.branchStock?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;

        if (codeFilter === 'GENERAL') {
          const storesWithStock = p.branchStock?.filter(bs => bs.quantity > 0).length || 0;
          matchesCode = isGlobalProduct || storesWithStock > 1 || (!isMyCatalogProduct && hasStockInMyBranch);
        } else if (codeFilter !== 'ALL') {
          matchesCode = catEcommerceCode === codeFilter;
        }
      }
      return matchesCode;
    });

    const validCategoryIds = new Set(baseProducts.map(p => p.categoryId));
    return categories.filter(c => validCategoryIds.has(c.id));
  }, [categories, allowedProducts, codeFilter, canViewOthers, myCode, user?.branchId]);

  const filteredProducts = useMemo(() => {
    if (!allowedProducts) return [];
    return allowedProducts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm);
      const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      
      let matchesCode = true;
      if (canViewOthers) {
        const catEcommerceCode = p.category?.ecommerceCode ?? categories?.find(c => c.id === p.categoryId)?.ecommerceCode;
        const isGlobalProduct = !catEcommerceCode;
        const isMyCatalogProduct = catEcommerceCode === myCode;
        const hasStockInMyBranch = p.branchStock?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;

        if (codeFilter === 'GENERAL') {
          const storesWithStock = p.branchStock?.filter(bs => bs.quantity > 0).length || 0;
          matchesCode = isGlobalProduct || storesWithStock > 1 || (!isMyCatalogProduct && hasStockInMyBranch);
        } else if (codeFilter !== 'ALL') {
          matchesCode = catEcommerceCode === codeFilter;
        }
      }

      return matchesSearch && matchesCat && matchesCode;
    });
  }, [allowedProducts, searchTerm, selectedCategory, codeFilter, canViewOthers, categories, myCode, user?.branchId]);

  const addToCart = (product: Product) => {
    if (saleState === 'PAID') return toast.error('Venta bloqueada. Libere la caja primero.');
    const localStock = getLocalStock(product);
    
    if (localStock <= 0) {
      const globalStock = product.branchStock?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
      if (globalStock > 0) {
        setTransferProduct(product);
        setTransferQty('1');
        setTransferFromBranch('');
      } else {
        toast.error('Producto agotado totalmente en todas las sucursales.');
      }
      return; 
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= localStock) {
          toast.error(`Stock límite: ${localStock} un.`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, { ...product, cartQuantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    if (saleState === 'PAID') return;
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.cartQuantity + delta;
        if (newQty < 1) return item; 
        const localStock = getLocalStock(item);
        if (newQty > localStock) { toast.error('Stock físico insuficiente'); return item; }
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => {
    if (saleState === 'PAID') return;
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const calculateItemFinancials = (item: CartItem) => {
    let baseUnitPrice = Number(item.price);
    let isWholesaleApplied = false;
    if (item.wholesaleMinCount && item.wholesalePrice && item.cartQuantity >= item.wholesaleMinCount) {
      baseUnitPrice = Number(item.wholesalePrice);
      isWholesaleApplied = true;
    }
    const discountMultiplier = item.discountPercentage ? (100 - item.discountPercentage) / 100 : 1;
    const finalUnitPrice = baseUnitPrice * discountMultiplier;
    const originalTotal = Number(item.price) * item.cartQuantity; 
    const finalTotal = finalUnitPrice * item.cartQuantity; 
    const savings = originalTotal - finalTotal;
    return { finalUnitPrice, finalTotal, originalTotal, savings, isWholesaleApplied };
  };

  let globalSubtotalBase = 0, itemSavings = 0, itemsSubtotal = 0;    
  cart.forEach(item => {
    const { finalTotal, originalTotal, savings } = calculateItemFinancials(item);
    globalSubtotalBase += originalTotal; 
    itemSavings += savings; 
    itemsSubtotal += finalTotal;
  });

  const numericDiscountVal = parseFloat(globalDiscountValue) || 0;
  const globalDiscountAmount = globalDiscountType === 'FIXED' 
    ? numericDiscountVal 
    : itemsSubtotal * (numericDiscountVal / 100);

  const finalGlobalTotal = Math.max(0, itemsSubtotal - globalDiscountAmount);
  const totalSavings = itemSavings + globalDiscountAmount;

  const openPaymentModal = (method: 'CASH' | 'CARD' | 'SPLIT') => {
    setPayMethod(method); setCashReceived(''); setShowPayment(true);
  };

  const numericCash = parseFloat(cashReceived) || 0;
  const change = numericCash - finalGlobalTotal;
  const isValidCash = numericCash >= finalGlobalTotal;

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount.toFixed(2));
  };

  const handleAmortizar = () => {
    toast.success('Venta Amortizada con éxito.');
    setSaleState('PAID');
    setShowPayment(false);
  };

  const handleBoletear = () => {
    toast.success('Comprobante emitido (Simulación)');
  };

  const handleLiberar = () => {
    setCart([]);
    setCustomerDoc('');
    setShowCustomerInput(false);
    setGlobalDiscountValue('');
    setSaleState('DRAFT');
    toast.success('Caja liberada para nueva venta');
  };

  const handleAnular = () => {
    setSaleState('DRAFT');
    toast.error('Pago anulado. Venta devuelta a borrador.');
  };

  const handleSubmitTransfer = async () => {
    if (!transferFromBranch || !transferQty || Number(transferQty) < 1) {
      toast.error('Selecciona una sucursal y cantidad válida.');
      return;
    }
    
    setIsSubmittingTransfer(true);
    try {
      const payload = {
        productId: transferProduct?.id,
        fromBranchId: transferFromBranch,
        toBranchId: user?.branchId,
        requestedById: userId, 
        quantity: Number(transferQty)
      };

      const res = await fetch('/api/stock-transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al procesar solicitud');
      }
      
      toast.success('Solicitud enviada. Te notificaremos cuando la aprueben.');
      setTransferProduct(null);
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error al enviar la solicitud.');
      }
    } finally {
      setIsSubmittingTransfer(false);
    }
  };

  return (
    <div className="flex h-full w-full bg-white animate-in fade-in duration-300 font-sans text-sm">
      
      {/* 🚀 ÁREA IZQUIERDA: CATÁLOGO */}
      <main className={`flex-1 flex flex-col min-w-0 transition-colors ${saleState === 'PAID' ? 'bg-emerald-50/10 opacity-70 pointer-events-none' : 'bg-white'}`}>
        
        {/* TOOLBAR SUPERIOR CON BUSCADOR EXPANDIBLE */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-100 bg-white shrink-0">
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight hidden sm:block shrink-0">Terminal POS</h1>
          
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-full sm:w-10 hover:w-full sm:hover:w-[320px] focus-within:w-full sm:focus-within:w-[320px] h-11 overflow-hidden ml-auto">
            <div className="absolute right-0 w-10 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={2.5} />
            </div>
            <Input 
              autoFocus 
              placeholder="Buscar producto, SKU..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              disabled={saleState === 'PAID'}
              className="w-full h-full pr-10 pl-5 bg-white border border-slate-200 shadow-sm focus-visible:ring-2 rounded-full sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 sm:translate-x-4 sm:group-hover:translate-x-0 focus-within:translate-x-0 text-sm font-medium" 
            />
          </div>
        </div>

        {/* 🚀 SUBHEADER FIJO + SCROLL DE CATEGORÍAS */}
        <div className="flex items-center w-full border-b border-slate-100 bg-white shrink-0 h-[52px]">
          
          {/* 1. SUCURSALES FIJAS A LA IZQUIERDA (Solo si tiene permisos) */}
          {visibleCodes.length > 0 && canViewOthers && (
            <div className="flex items-center gap-1.5 px-4 h-full shrink-0 border-r border-slate-100">
              <button 
                title="Todas las tiendas"
                onClick={() => {setCodeFilter('ALL'); setSelectedCategory('ALL');}} 
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${codeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              
              <button 
                title="Global / Compartidos"
                onClick={() => {setCodeFilter('GENERAL'); setSelectedCategory('ALL');}} 
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${codeFilter === 'GENERAL' ? 'bg-slate-800 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'}`}
              >
                <Globe className="w-4 h-4" />
              </button>

              {visibleCodes.map(code => {
                const bInfo = getBranchByCode(code);
                return (
                  <button 
                    title={bInfo?.name || code}
                    key={code} 
                    onClick={() => {setCodeFilter(code); setSelectedCategory('ALL');}} 
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all overflow-hidden ${codeFilter === code ? 'ring-2 ring-slate-200 ring-offset-1 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    {bInfo?.logoUrl ? <img src={bInfo.logoUrl} className="w-full h-full object-cover bg-white" alt="" /> : <Store className="w-4 h-4 text-slate-500" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* 2. CATEGORÍAS EN SCROLL AL CENTRO */}
          <div className="flex-1 h-full overflow-hidden relative flex items-center">
            <div 
              ref={scrollContainerRef} 
              className="flex items-center gap-2 px-4 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth"
            >
              <button 
                onClick={() => setSelectedCategory('ALL')} 
                className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === 'ALL' ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}
              >
                Todas las categorías
              </button>
              
              {availableCategories.length === 0 && (
                <span className="text-xs font-medium text-slate-400 italic ml-1 shrink-0">No hay categorías.</span>
              )}

              {availableCategories.map(cat => (
                <button 
                  key={cat.id} onClick={() => setSelectedCategory(cat.id)} 
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedCategory === cat.id ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-900'}`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 3. FLECHAS FIJAS A LA DERECHA */}
          <div className="flex items-center gap-1.5 px-3 shrink-0 h-full border-l border-slate-100 bg-slate-50/50">
            <button onClick={() => scroll('left')} className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors active:scale-90">
              <ChevronLeft className="w-5 h-5" strokeWidth={3} />
            </button>
            <button onClick={() => scroll('right')} className="p-1.5 text-slate-300 hover:text-slate-900 transition-colors active:scale-90">
              <ChevronRight className="w-5 h-5" strokeWidth={3} />
            </button>
          </div>

        </div>

        {/* GRILLA DE PRODUCTOS */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 lg:gap-4">
            {loadingProducts || loadingCats ? (
              Array(12).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-2"><Skeleton className="aspect-square w-full rounded-xl" /><Skeleton className="h-3 w-full mt-2" /></div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full h-32 flex items-center justify-center text-slate-400 text-sm font-medium">
                No hay productos disponibles.
              </div>
            ) : filteredProducts.map(product => {
              const localStock = getLocalStock(product);
              const globalStock = product.branchStock?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
              const externalStock = globalStock - localStock;
              
              const isOutOfStock = localStock <= 0;
              const hasDiscount = product.discountPercentage > 0;
              const hasWholesale = product.wholesalePrice && product.wholesaleMinCount;

              return (
                <div key={product.id} onClick={() => addToCart(product)} className={`group relative flex flex-col gap-2 p-2 rounded-2xl transition-all select-none bg-white border ${isOutOfStock ? 'opacity-80 border-slate-200 border-dashed cursor-pointer hover:bg-slate-50' : 'cursor-pointer border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}>
                  <div className={`aspect-square bg-slate-50 rounded-xl relative overflow-hidden shrink-0 border border-slate-100 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}>
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover mix-blend-multiply" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-6 h-6" /></div>
                    )}
                    <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm leading-none backdrop-blur-md ${isOutOfStock ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-700'}`}>
                        {localStock} un.
                      </span>
                      {hasDiscount && !isOutOfStock && <span className="text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded-md shadow-sm leading-none">-{product.discountPercentage}%</span>}
                    </div>
                  </div>
                  <div className="px-1 pb-1 flex flex-col justify-between flex-1">
                    <p className="font-medium text-slate-700 text-xs leading-tight line-clamp-2" title={product.title}>{product.title}</p>
                    <div className="mt-1.5">
                      {isOutOfStock && externalStock > 0 ? (
                        <p className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-1 rounded-md border border-amber-200 flex items-center gap-1 mt-1 hover:bg-amber-100 transition-colors">
                          <ArrowRightLeft className="w-3 h-3" /> Pedir Traslado
                        </p>
                      ) : isOutOfStock ? (
                        <p className="text-[10px] font-semibold text-red-500 mt-1">Agotado Totalmente</p>
                      ) : (
                        <>
                          <div className="flex items-center gap-1.5">
                            <p className="text-slate-900 font-semibold text-sm">S/ {Number(product.price).toFixed(2)}</p>
                            {hasDiscount && <p className="text-[10px] text-slate-400 line-through">S/ {(Number(product.price) * (1 / (1 - product.discountPercentage / 100))).toFixed(2)}</p>}
                          </div>
                          {hasWholesale && (
                            <p className="text-[9px] font-medium text-slate-500 mt-1 leading-none flex items-center gap-1" title={`Precio por mayor a partir de ${product.wholesaleMinCount} unidades`}>
                              <Tag className="w-3 h-3 text-blue-500" /> 
                              Mayor S/{Number(product.wholesalePrice).toFixed(2)}
                              <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ml-auto">
                                ≥{product.wholesaleMinCount}u
                              </span>
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 🚀 ÁREA DERECHA: CARRITO DE COMPRAS */}
      <aside className={`w-[320px] xl:w-[360px] flex flex-col border-l shrink-0 overflow-hidden transition-colors duration-300 bg-white ${saleState === 'PAID' ? 'border-emerald-200 bg-emerald-50/30' : 'border-slate-100'}`}>
        <div className={`h-14 px-4 border-b flex items-center justify-between shrink-0 transition-colors ${saleState === 'PAID' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-white border-slate-100'}`}>
          <span className="font-semibold text-sm flex items-center gap-2">
            {saleState === 'PAID' ? <CheckCircle2 className="w-5 h-5" /> : <ShoppingBag className="w-5 h-5" />} 
            {saleState === 'PAID' ? 'VENTA PAGADA' : 'Resumen de Venta'}
          </span>
          {saleState === 'DRAFT' && <button onClick={() => setCart([])} disabled={cart.length === 0} className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 p-1"><Trash2 className="w-4 h-4" /></button>}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-80 gap-3">
              <ShoppingBag className="w-10 h-10" />
              <span className="text-sm font-medium">Bandeja vacía</span>
            </div>
          ) : (
            cart.map(item => {
              const { finalUnitPrice, finalTotal, isWholesaleApplied } = calculateItemFinancials(item);
              const hasDiscount = item.discountPercentage > 0;

              return (
                <div key={item.id} className={`p-3 rounded-xl transition-all flex flex-col gap-1.5 relative group border ${saleState === 'PAID' ? 'bg-white/80 border-emerald-100' : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-start gap-2 pr-6">
                    <span className={`font-medium text-xs leading-tight line-clamp-2 flex-1 ${saleState === 'PAID' ? 'text-slate-600' : 'text-slate-800'}`}>{item.title}</span>
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

                    {saleState === 'DRAFT' ? (
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm h-7">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 flex items-center justify-center text-slate-500 hover:text-slate-900"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-xs font-semibold text-slate-800 w-6 text-center tabular-nums">{item.cartQuantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 flex items-center justify-center text-slate-500 hover:text-slate-900"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 px-2.5 py-1 bg-emerald-100/50 rounded-lg tabular-nums">{item.cartQuantity} un.</span>
                    )}
                  </div>

                  {saleState === 'DRAFT' && (
                    <button onClick={() => removeFromCart(item.id)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className={`border-t shrink-0 flex flex-col p-4 gap-4 transition-colors ${saleState === 'PAID' ? 'border-emerald-200 bg-white/50' : 'border-slate-100 bg-white'}`}>
          {saleState === 'DRAFT' && cart.length > 0 && (
            <div className="flex flex-col gap-2 mb-2 animate-in fade-in duration-300">
              {!showCustomerInput ? (
                <div className="flex items-center">
                  <button onClick={() => setShowCustomerInput(true)} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors bg-slate-50 border border-slate-100 px-3 py-2 rounded-lg w-max">
                    <UserPlus className="w-4 h-4" /> Vincular Cliente (Opcional)
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 animate-in slide-in-from-left-2 duration-200">
                  <div className="relative flex-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500" />
                    <Input 
                      placeholder="DNI / RUC Cliente..." 
                      value={customerDoc} onChange={(e) => setCustomerDoc(e.target.value)} 
                      className="pl-9 h-9 text-xs placeholder:text-slate-400 bg-blue-50/50 border-blue-200 focus-visible:ring-blue-500 shadow-none rounded-lg" 
                    />
                  </div>
                  <button 
                    onClick={() => { setShowCustomerInput(false); setCustomerDoc(''); }} 
                    className="w-9 h-9 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    title="Remover cliente"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-2">
                <Select value={globalDiscountType} onValueChange={(val: 'FIXED' | 'PERCENT') => setGlobalDiscountType(val)}>
                  <SelectTrigger className="w-[70px] h-9 text-xs font-semibold bg-slate-50 border-slate-200 px-2 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">S/</SelectItem>
                    <SelectItem value="PERCENT">%</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Descuento extra..." value={globalDiscountValue} onChange={(e) => setGlobalDiscountValue(e.target.value)} className="flex-1 h-9 text-xs placeholder:text-slate-400 bg-slate-50 border-slate-200 focus-visible:ring-slate-400 rounded-lg shadow-none tabular-nums" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-500 text-xs font-medium">
              <span>Subtotal Base</span><span className="tabular-nums">S/ {globalSubtotalBase.toFixed(2)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-600 text-xs font-medium">
                <span>Descuento / Ahorro Total</span><span className="tabular-nums">- S/ {totalSavings.toFixed(2)}</span>
              </div>
            )}
            <div className={`flex justify-between items-end pt-3 mt-2 border-t border-dashed ${saleState === 'PAID' ? 'border-emerald-200' : 'border-slate-200'}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${saleState === 'PAID' ? 'text-emerald-700' : 'text-slate-500'}`}>
                {saleState === 'PAID' ? 'Pagado' : 'Total a Cobrar'}
              </span>
              <span className={`text-2xl font-bold tracking-tight tabular-nums leading-none ${saleState === 'PAID' ? 'text-emerald-600' : 'text-slate-900'}`}>
                S/ {finalGlobalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {saleState === 'DRAFT' ? (
            <Button onClick={() => openPaymentModal('CASH')} disabled={cart.length === 0} className="w-full h-12 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-[0.98]">
              Amortizar (Pagar) <ChevronRight className="w-4 h-4 ml-1.5" />
            </Button>
          ) : (
            <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-2">
                <Button onClick={handleBoletear} variant="outline" className="flex-1 h-10 text-xs font-semibold text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 rounded-xl">
                  <Receipt className="w-4 h-4 mr-1.5" /> Boletear
                </Button>
                <Button onClick={handleLiberar} className="flex-1 h-10 text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl shadow-sm">
                  <Unlock className="w-4 h-4 mr-1.5" /> Liberar
                </Button>
              </div>
              <Button onClick={handleAnular} variant="ghost" className="h-9 text-[11px] font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 w-full rounded-lg">
                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Anular Venta
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* MODAL DE PAGO */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-sm font-sans p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50 flex flex-row items-center justify-between m-0 space-y-0">
            <div className="flex flex-col text-left">
              <DialogTitle className="text-sm font-bold text-slate-800">Recibir Pago</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">Complete la transacción.</DialogDescription>
            </div>
            <div className="flex bg-slate-200/50 p-1.5 rounded-lg gap-1">
              <button onClick={() => setPayMethod('CASH')} className={`p-2 rounded-md transition-colors ${payMethod === 'CASH' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`} title="Efectivo"><Banknote className="w-4 h-4" /></button>
              <button onClick={() => setPayMethod('CARD')} className={`p-2 rounded-md transition-colors ${payMethod === 'CARD' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`} title="Tarjeta"><CreditCard className="w-4 h-4" /></button>
              <button onClick={() => setPayMethod('SPLIT')} className={`p-2 rounded-md transition-colors ${payMethod === 'SPLIT' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`} title="Mixto"><SplitSquareHorizontal className="w-4 h-4" /></button>
            </div>
          </DialogHeader>
          <div className="p-5 space-y-5 bg-white">
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-100">
              <span className="text-sm font-medium text-slate-600">Total a cobrar:</span>
              <span className="text-lg font-bold text-slate-900 tabular-nums">S/ {finalGlobalTotal.toFixed(2)}</span>
            </div>
            {payMethod === 'CASH' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monto Recibido</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">S/</span>
                    <Input 
                      type="number" autoFocus placeholder="0.00"
                      className="pl-8 h-12 text-base font-semibold placeholder:text-slate-300 text-slate-900 border-slate-200 focus-visible:ring-slate-300 rounded-xl tabular-nums shadow-sm" 
                      value={cashReceived} onChange={(e) => setCashReceived(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[finalGlobalTotal, 20, 50, 100].map((amt, i) => (
                    <Button key={i} variant="outline" onClick={() => handleQuickCash(amt)} className="h-10 text-xs font-medium border-slate-200 hover:bg-slate-50 text-slate-700 px-0 rounded-lg">
                      {i === 0 ? 'Exacto' : `S/ ${amt}`}
                    </Button>
                  ))}
                </div>
                <div className={`px-4 py-3 rounded-xl flex items-center justify-between border transition-colors ${numericCash > 0 && isValidCash ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-sm font-medium text-slate-600">Vuelto:</span>
                  <span className={`text-lg font-bold tabular-nums ${numericCash > 0 && isValidCash ? 'text-emerald-700' : 'text-slate-400'}`}>
                    S/ {numericCash > 0 && isValidCash ? change.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            )}
            {payMethod !== 'CASH' && (
              <div className="py-8 text-center animate-in fade-in duration-200 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                <p className="text-sm font-medium text-slate-600 mb-1">Esperando confirmación...</p>
                <p className="text-xs text-slate-400">Verifique el abono por POS o Transferencia.</p>
              </div>
            )}
          </div>
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button variant="outline" className="flex-1 h-10 text-xs font-medium text-slate-600 border-slate-200 bg-white rounded-xl" onClick={() => setShowPayment(false)}>Cancelar</Button>
            <Button 
              className="flex-1 h-10 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm rounded-xl" 
              disabled={payMethod === 'CASH' && !isValidCash || payMethod === 'SPLIT'}
              onClick={handleAmortizar}
            >
              Confirmar Operación
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE SOLICITUD DE TRASLADO */}
      <Dialog open={!!transferProduct} onOpenChange={() => setTransferProduct(null)}>
        <DialogContent className="sm:max-w-md font-sans p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader className="p-5 border-b border-slate-100 bg-slate-50 flex flex-col items-start justify-center m-0">
            <DialogTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-amber-600" /> Solicitar Traslado de Stock
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Este producto está agotado. Pide stock a otra tienda para poder venderlo.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-5 space-y-5 bg-white">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="w-12 h-12 rounded-lg bg-white border flex items-center justify-center shrink-0 overflow-hidden">
                {transferProduct?.images?.[0] ? (
                  <img src={transferProduct.images[0]} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                ) : (
                  <Package className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800 line-clamp-1">{transferProduct?.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{transferProduct?.barcode || transferProduct?.code}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Sucursal Origen (Con Stock)</Label>
                <Select value={transferFromBranch} onValueChange={setTransferFromBranch}>
                  <SelectTrigger className="w-full text-xs h-10 bg-white border-slate-200 rounded-xl">
                    <SelectValue placeholder="Selecciona la tienda..." />
                  </SelectTrigger>
                  <SelectContent>
                    {transferProduct?.branchStock
                      ?.filter(bs => bs.branchId !== user?.branchId && bs.quantity > 0)
                      .map(bs => {
                        const branchInfo = branches?.find(b => b.id === bs.branchId);
                        return (
                          <SelectItem key={bs.branchId} value={bs.branchId} className="text-xs">
                            {branchInfo?.name || 'Sucursal Desconocida'} <span className="text-amber-600 font-semibold ml-1">({bs.quantity} disp.)</span>
                          </SelectItem>
                        );
                      })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700">Cantidad a Solicitar</Label>
                <Input 
                  type="number" min="1" placeholder="Ej: 2"
                  value={transferQty} onChange={(e) => setTransferQty(e.target.value)}
                  className="h-10 text-sm font-semibold bg-white border-slate-200 focus-visible:ring-amber-500 rounded-xl" 
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3">
            <Button variant="outline" className="flex-1 h-10 text-xs font-medium text-slate-600 border-slate-200 bg-white rounded-xl" onClick={() => setTransferProduct(null)}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 h-10 text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white shadow-sm rounded-xl" 
              disabled={!transferFromBranch || !transferQty || isSubmittingTransfer}
              onClick={handleSubmitTransfer}
            >
              <Send className="w-4 h-4 mr-1.5" /> Enviar Solicitud
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}