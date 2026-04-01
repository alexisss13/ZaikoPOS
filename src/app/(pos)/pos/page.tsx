'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { Search, LayoutGrid, Trash2, Plus, Minus, CreditCard, Banknote, ShoppingBag, Package, SplitSquareHorizontal, Tag, ChevronRight, CheckCircle2, User, Receipt, Unlock, RotateCcw, UserPlus, X, Store, Globe } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Category { id: string; name: string; ecommerceCode?: string | null; }
interface Product {
  id: string; title: string; price: number; wholesalePrice: number | null;
  wholesaleMinCount: number | null; discountPercentage: number;
  images: string[]; barcode: string | null; categoryId: string;
  branchStock?: { branchId: string; quantity: number }[];
  category?: { name: string; ecommerceCode: string | null };
}
interface CartItem extends Product { cartQuantity: number; }

export default function PosPage() {
  const { user } = useAuth();
  
  const { data: products, isLoading: loadingProducts } = useSWR<Product[]>('/api/products', fetcher);
  const { data: categories, isLoading: loadingCats } = useSWR<Category[]>('/api/categories', fetcher);
  const { data: currentBranch } = useSWR(user?.branchId && user.branchId !== 'NONE' ? `/api/branches/${user.branchId}` : null, fetcher);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);

  // 🚀 ESTADOS DEL CARRITO Y CLIENTE
  const [saleState, setSaleState] = useState<'DRAFT' | 'PAID'>('DRAFT');
  const [customerDoc, setCustomerDoc] = useState('');
  const [showCustomerInput, setShowCustomerInput] = useState(false);
  const [globalDiscountType, setGlobalDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [globalDiscountValue, setGlobalDiscountValue] = useState('');

  // 🚀 ESTADOS DEL MODAL DE COBRO
  const [showPayment, setShowPayment] = useState(false);
  const [payMethod, setPayMethod] = useState<'CASH' | 'CARD' | 'SPLIT'>('CASH');
  const [cashReceived, setCashReceived] = useState('');

  const getLocalStock = (product: Product) => {
    if (user?.branchId && user.branchId !== 'NONE') {
      return product.branchStock?.find(bs => bs.branchId === user.branchId)?.quantity || 0;
    }
    return product.branchStock?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
  };

  // ========================================================
  // 🔐 LÓGICA DE PERMISOS ESTRICTA
  // ========================================================
  const isSuperOrOwner = user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';
  const permissions = user?.permissions || {};
  const canManageGlobal = isSuperOrOwner || !!permissions.canManageGlobalProducts;
  const canViewOthers = isSuperOrOwner || !!permissions.canViewOtherBranches || canManageGlobal;
  const myCode = currentBranch?.ecommerceCode;

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

  // 🚀 AGRUPACIÓN DE CATEGORÍAS PARA EL SIDEBAR
  const groupedCategories = useMemo(() => {
    if (!categories || !allowedProducts) return { myStore: [], others: {} as Record<string, Category[]>, shared: [] };
    
    const validCategoryIds = new Set(allowedProducts.map(p => p.categoryId));
    const validCats = categories.filter(c => validCategoryIds.has(c.id));

    const myStore: Category[] = [];
    const others: Record<string, Category[]> = {};
    const shared: Category[] = [];

    validCats.forEach(cat => {
      if (!cat.ecommerceCode) {
        shared.push(cat);
      } else if (myCode && cat.ecommerceCode === myCode) {
        myStore.push(cat);
      } else {
        if (!others[cat.ecommerceCode]) others[cat.ecommerceCode] = [];
        others[cat.ecommerceCode].push(cat);
      }
    });

    return { myStore, others, shared };
  }, [categories, allowedProducts, myCode]);

  const filteredProducts = useMemo(() => {
    if (!allowedProducts) return [];
    return allowedProducts.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.barcode?.includes(searchTerm);
      const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [allowedProducts, searchTerm, selectedCategory]);

  const addToCart = (product: Product) => {
    if (saleState === 'PAID') return toast.error('Venta bloqueada. Libere la caja primero.');
    const localStock = getLocalStock(product);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQuantity >= localStock) {
          toast.error(`Stock límite: ${localStock} un.`);
          return prev;
        }
        return prev.map(item => item.id === product.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      if (localStock <= 0) { toast.error('Agotado'); return prev; }
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

  // 🚀 CÁLCULOS FINANCIEROS
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

  // 🚀 LÓGICA DE COBRO
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

  return (
    <div className="flex h-full w-full bg-slate-200/50 p-2 gap-2 animate-in fade-in duration-300 font-sans text-sm">
      
      {/* 📁 COLUMNA 1: MENÚ DE CATEGORÍAS CON AGRUPACIÓN VISUAL */}
      <aside className="w-48 bg-white rounded-xl shadow-sm border border-slate-200 hidden lg:flex flex-col overflow-hidden">
        <div className="px-3 py-2.5 border-b border-slate-100 shrink-0">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Catálogo
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <button onClick={() => setSelectedCategory('ALL')} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all mb-2 ${selectedCategory === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            <LayoutGrid className="w-3.5 h-3.5" /> Todo el inventario
          </button>
          
          {loadingCats || loadingProducts ? (
            <div className="p-2 space-y-2">
              <Skeleton className="h-6 w-full rounded-md" /><Skeleton className="h-6 w-[80%] rounded-md" />
            </div>
          ) : (
            <>
              {/* BLOQUE: MI SUCURSAL */}
              {groupedCategories.myStore.length > 0 && (
                <div className="space-y-0.5 pt-1">
                  <div className="px-2.5 py-1 mb-0.5">
                    <span className="text-[9px] font-bold text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Store className="w-3 h-3" /> {currentBranch?.name || 'Mi Tienda'}
                    </span>
                  </div>
                  {groupedCategories.myStore.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${selectedCategory === cat.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === cat.id ? 'bg-blue-500' : 'bg-slate-300'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* BLOQUE: OTRAS SUCURSALES */}
              {Object.entries(groupedCategories.others).map(([code, cats]) => (
                <div key={code} className="space-y-0.5 pt-2">
                  <div className="px-2.5 py-1 mb-0.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Store className="w-3 h-3" /> Tienda: {code}
                    </span>
                  </div>
                  {cats.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${selectedCategory === cat.id ? 'bg-slate-100 text-slate-800 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === cat.id ? 'bg-slate-400' : 'bg-slate-200'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              ))}

              {/* BLOQUE: COMPARTIDOS / GLOBALES */}
              {groupedCategories.shared.length > 0 && (
                <div className="space-y-0.5 pt-2 pb-2">
                  <div className="px-2.5 py-1 mb-0.5">
                    <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest flex items-center gap-1.5">
                      <Globe className="w-3 h-3" /> Catálogo General
                    </span>
                  </div>
                  {groupedCategories.shared.map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id)} className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${selectedCategory === cat.id ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedCategory === cat.id ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                      <span className="truncate">{cat.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* 📦 COLUMNA 2: ÁREA PRINCIPAL DE PRODUCTOS */}
      <main className={`flex-1 bg-white rounded-xl shadow-sm border flex flex-col overflow-hidden min-w-0 transition-colors ${saleState === 'PAID' ? 'border-emerald-200 bg-emerald-50/10 opacity-70 pointer-events-none' : 'border-slate-200'}`}>
        <div className="p-2 border-b border-slate-100 shrink-0 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <Input 
              autoFocus placeholder="Buscar producto o código de barras..." 
              className="pl-8 h-8 text-xs placeholder:text-[11px] placeholder:text-slate-400 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 rounded-md shadow-none"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} disabled={saleState === 'PAID'}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 bg-slate-50/30">
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
            {loadingProducts || loadingCats ? (
              Array(12).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-100 p-2"><Skeleton className="aspect-square w-full rounded-md" /><Skeleton className="h-3 w-full mt-2" /></div>
              ))
            ) : filteredProducts.length === 0 ? (
              <div className="col-span-full h-32 flex items-center justify-center text-slate-400 text-xs font-medium">
                No hay productos disponibles en esta categoría o sucursal.
              </div>
            ) : filteredProducts.map(product => {
              const localStock = getLocalStock(product);
              const isOutOfStock = localStock <= 0;
              const hasDiscount = product.discountPercentage > 0;
              const hasWholesale = product.wholesalePrice && product.wholesaleMinCount;

              return (
                <div key={product.id} onClick={() => !isOutOfStock && addToCart(product)} className={`group relative flex flex-col gap-1.5 p-1.5 rounded-xl transition-all select-none ${isOutOfStock ? 'opacity-40 grayscale cursor-not-allowed' : 'cursor-pointer bg-white hover:bg-slate-50 border border-transparent hover:border-slate-200 hover:shadow-sm'}`}>
                  <div className="aspect-square bg-slate-100 rounded-lg relative overflow-hidden shrink-0 border border-slate-100">
                    {product.images?.[0] ? (
                      <img src={product.images[0]} alt={product.title} className="w-full h-full object-cover mix-blend-multiply" draggable={false} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300"><Package className="w-5 h-5" /></div>
                    )}
                    <div className="absolute top-1 right-1 flex flex-col items-end gap-0.5">
                      <span className="text-[9px] font-bold bg-white/90 text-slate-700 px-1 py-0.5 rounded shadow-sm leading-none backdrop-blur-md">{localStock}</span>
                      {hasDiscount && <span className="text-[9px] font-bold bg-slate-900 text-white px-1 py-0.5 rounded shadow-sm leading-none">-{product.discountPercentage}%</span>}
                    </div>
                  </div>
                  <div className="px-0.5 pb-0.5 flex flex-col justify-between flex-1">
                    <p className="font-medium text-slate-700 text-[11px] leading-tight line-clamp-2" title={product.title}>{product.title}</p>
                    <div className="mt-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-slate-900 font-bold text-xs">S/ {Number(product.price).toFixed(2)}</p>
                        {hasDiscount && <p className="text-[9px] text-slate-400 line-through">S/ {(Number(product.price) * (1 / (1 - product.discountPercentage / 100))).toFixed(2)}</p>}
                      </div>
                      {hasWholesale && (
                        <p className="text-[9px] font-medium text-slate-500 mt-0.5 leading-none flex items-center gap-0.5" title={`Precio por mayor a partir de ${product.wholesaleMinCount} unidades`}>
                          <Tag className="w-2.5 h-2.5 text-blue-500" /> 
                          Mayor S/{Number(product.wholesalePrice).toFixed(2)}
                          <span className="bg-blue-50 text-blue-600 px-1 py-0.5 rounded text-[8px] font-bold ml-auto">
                            ≥{product.wholesaleMinCount}u
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* 🛒 COLUMNA 3: TICKET DE VENTA Y COBRO */}
      <aside className={`w-[300px] xl:w-[340px] flex flex-col rounded-xl border shadow-sm shrink-0 overflow-hidden transition-colors duration-300 ${saleState === 'PAID' ? 'border-emerald-300 bg-emerald-50/30 shadow-emerald-500/10' : 'border-slate-200 bg-white'}`}>
        
        <div className={`h-10 px-3 border-b flex items-center justify-between shrink-0 transition-colors ${saleState === 'PAID' ? 'bg-emerald-500 text-white border-emerald-600' : 'bg-slate-50 border-slate-100'}`}>
          <span className="font-semibold text-xs flex items-center gap-1.5">
            {saleState === 'PAID' ? <CheckCircle2 className="w-4 h-4" /> : <ShoppingBag className="w-3.5 h-3.5" />} 
            {saleState === 'PAID' ? 'VENTA PAGADA' : 'Resumen de Venta'}
          </span>
          {saleState === 'DRAFT' && <button onClick={() => setCart([])} disabled={cart.length === 0} className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 p-1"><Trash2 className="w-3.5 h-3.5" /></button>}
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-70 gap-2">
              <ShoppingBag className="w-8 h-8" />
              <span className="text-xs font-medium">Bandeja vacía</span>
            </div>
          ) : (
            cart.map(item => {
              const { finalUnitPrice, finalTotal, isWholesaleApplied } = calculateItemFinancials(item);
              const hasDiscount = item.discountPercentage > 0;

              return (
                <div key={item.id} className={`p-2 rounded-lg transition-all flex flex-col gap-1 relative group border ${saleState === 'PAID' ? 'bg-white/60 border-emerald-100' : 'bg-white hover:bg-slate-50 border-transparent hover:border-slate-100'}`}>
                  <div className="flex justify-between items-start gap-2 pr-5">
                    <span className={`font-medium text-xs leading-tight line-clamp-2 flex-1 ${saleState === 'PAID' ? 'text-slate-600' : 'text-slate-700'}`}>{item.title}</span>
                    <span className="font-bold text-slate-900 text-xs shrink-0 tabular-nums">S/ {finalTotal.toFixed(2)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-1">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-slate-500">S/ {finalUnitPrice.toFixed(2)} x un</span>
                        {(isWholesaleApplied || hasDiscount) && <span className="text-[9px] text-slate-300 line-through">S/ {Number(item.price).toFixed(2)}</span>}
                      </div>
                      <div className="flex gap-1 mt-0.5">
                        {isWholesaleApplied && <span className="text-[8px] bg-emerald-100/50 text-emerald-700 px-1 py-0.5 rounded font-semibold leading-none">MAYORISTA</span>}
                        {hasDiscount && <span className="text-[8px] bg-red-100/50 text-red-700 px-1 py-0.5 rounded font-semibold leading-none">-{item.discountPercentage}%</span>}
                      </div>
                    </div>

                    {saleState === 'DRAFT' ? (
                      <div className="flex items-center bg-white border border-slate-200 rounded-md shadow-sm h-6">
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-6 flex items-center justify-center text-slate-500 hover:text-slate-900"><Minus className="w-3 h-3" /></button>
                        <span className="text-xs font-bold text-slate-800 w-5 text-center tabular-nums">{item.cartQuantity}</span>
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-6 flex items-center justify-center text-slate-500 hover:text-slate-900"><Plus className="w-3 h-3" /></button>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 px-2 py-0.5 bg-emerald-100/50 rounded-md tabular-nums">{item.cartQuantity} un.</span>
                    )}
                  </div>

                  {saleState === 'DRAFT' && (
                    <button onClick={() => removeFromCart(item.id)} className="absolute top-1 right-1 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 🚀 PANEL FINANCIERO INFERIOR */}
        <div className={`border-t shrink-0 flex flex-col p-3 gap-3 transition-colors ${saleState === 'PAID' ? 'border-emerald-200 bg-white/50' : 'border-slate-200 bg-slate-50'}`}>
          
          {/* Entradas de Cliente y Descuento Global (Solo en DRAFT) */}
          {saleState === 'DRAFT' && cart.length > 0 && (
            <div className="flex flex-col gap-2 mb-1 animate-in fade-in duration-300">
              
              {/* Toggle de Cliente Opcional */}
              {!showCustomerInput ? (
                <div className="flex items-center">
                  <button onClick={() => setShowCustomerInput(true)} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors bg-white border border-slate-200 px-2 py-1.5 rounded-md shadow-sm w-max">
                    <UserPlus className="w-3.5 h-3.5" /> Vincular Cliente (Opcional)
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 animate-in slide-in-from-left-2 duration-200">
                  <div className="relative flex-1">
                    <User className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-blue-500" />
                    <Input 
                      autoFocus placeholder="DNI / RUC Cliente..." 
                      value={customerDoc} onChange={(e) => setCustomerDoc(e.target.value)} 
                      className="pl-8 h-8 text-xs placeholder:text-[11px] placeholder:text-slate-400 bg-blue-50/30 border-blue-200 focus-visible:ring-blue-500 shadow-sm" 
                    />
                  </div>
                  <button 
                    onClick={() => { setShowCustomerInput(false); setCustomerDoc(''); }} 
                    className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                    title="Remover cliente"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div className="flex gap-1.5">
                <Select value={globalDiscountType} onValueChange={(val: 'FIXED' | 'PERCENT') => setGlobalDiscountType(val)}>
                  <SelectTrigger className="w-[60px] h-8 text-xs font-bold bg-white border-slate-200 shadow-sm px-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXED">S/</SelectItem>
                    <SelectItem value="PERCENT">%</SelectItem>
                  </SelectContent>
                </Select>
                <Input type="number" placeholder="Descuento extra..." value={globalDiscountValue} onChange={(e) => setGlobalDiscountValue(e.target.value)} className="flex-1 h-8 text-xs placeholder:text-[11px] placeholder:text-slate-400 bg-white border-slate-200 focus-visible:ring-blue-500 shadow-sm tabular-nums" />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Subtotal Base</span><span className="tabular-nums">S/ {globalSubtotalBase.toFixed(2)}</span>
            </div>
            {totalSavings > 0 && (
              <div className="flex justify-between text-emerald-600 text-[11px] font-medium">
                <span>Descuento / Ahorro Total</span><span className="tabular-nums">- S/ {totalSavings.toFixed(2)}</span>
              </div>
            )}
            <div className={`flex justify-between items-end pt-1.5 mt-1 border-t border-dashed ${saleState === 'PAID' ? 'border-emerald-200' : 'border-slate-200'}`}>
              <span className={`text-xs font-bold uppercase tracking-widest ${saleState === 'PAID' ? 'text-emerald-700' : 'text-slate-800'}`}>
                {saleState === 'PAID' ? 'Pagado' : 'Total a Cobrar'}
              </span>
              <span className={`text-xl font-black tracking-tight tabular-nums leading-none ${saleState === 'PAID' ? 'text-emerald-600' : 'text-slate-900'}`}>
                S/ {finalGlobalTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* 🚀 BOTONERA DINÁMICA POR ESTADO DE VENTA */}
          {saleState === 'DRAFT' ? (
            <Button onClick={() => openPaymentModal('CASH')} disabled={cart.length === 0} className="w-full h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-all active:scale-[0.98]">
              Amortizar (Pagar) <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          ) : (
            <div className="flex flex-col gap-2 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex gap-2">
                <Button onClick={handleBoletear} variant="outline" className="flex-1 h-9 text-xs font-bold text-blue-700 border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-blue-800 shadow-sm">
                  <Receipt className="w-3.5 h-3.5 mr-1.5" /> Boletear
                </Button>
                <Button onClick={handleLiberar} className="flex-1 h-9 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm">
                  <Unlock className="w-3.5 h-3.5 mr-1.5" /> Liberar
                </Button>
              </div>
              <Button onClick={handleAnular} variant="ghost" className="h-8 text-[10px] font-bold text-red-500 hover:bg-red-50 hover:text-red-600 w-full">
                <RotateCcw className="w-3 h-3 mr-1.5" /> Anular Venta
              </Button>
            </div>
          )}
        </div>
      </aside>

      {/* 🚀 MODAL CLÍNICO DE COBRO */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-sm font-sans p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-xl">
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800">Recibir Pago</h3>
              <p className="text-[10px] text-slate-500 leading-tight mt-0.5">Complete la transacción para continuar.</p>
            </div>
            <div className="flex bg-slate-200/50 p-1 rounded-md gap-1">
              <button onClick={() => setPayMethod('CASH')} className={`p-1.5 rounded transition-colors ${payMethod === 'CASH' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`} title="Efectivo"><Banknote className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPayMethod('CARD')} className={`p-1.5 rounded transition-colors ${payMethod === 'CARD' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`} title="Tarjeta"><CreditCard className="w-3.5 h-3.5" /></button>
              <button onClick={() => setPayMethod('SPLIT')} className={`p-1.5 rounded transition-colors ${payMethod === 'SPLIT' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`} title="Mixto"><SplitSquareHorizontal className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          
          <div className="p-4 space-y-4 bg-white">
            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-100">
              <span className="text-xs font-semibold text-slate-600">Total a cobrar:</span>
              <span className="text-base font-black text-slate-900 tabular-nums">S/ {finalGlobalTotal.toFixed(2)}</span>
            </div>

            {payMethod === 'CASH' && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Monto Recibido</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">S/</span>
                    <Input 
                      type="number" autoFocus placeholder="0.00"
                      className="pl-8 h-10 text-sm font-bold placeholder:text-slate-300 placeholder:text-sm text-slate-900 border-slate-200 focus-visible:ring-slate-800 rounded-lg tabular-nums shadow-sm" 
                      value={cashReceived} onChange={(e) => setCashReceived(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[finalGlobalTotal, 20, 50, 100].map((amt, i) => (
                    <Button key={i} variant="outline" onClick={() => handleQuickCash(amt)} className="h-8 text-[10px] font-semibold border-slate-200 hover:bg-slate-100 text-slate-700 px-0">
                      {i === 0 ? 'Exacto' : `S/ ${amt}`}
                    </Button>
                  ))}
                </div>

                <div className={`px-3 py-2 rounded-lg flex items-center justify-between border transition-colors ${numericCash > 0 && isValidCash ? 'bg-emerald-50 border-emerald-200' : 'bg-slate-50 border-slate-100'}`}>
                  <span className="text-xs font-semibold text-slate-600">Vuelto:</span>
                  <span className={`text-base font-black tabular-nums ${numericCash > 0 && isValidCash ? 'text-emerald-700' : 'text-slate-400'}`}>
                    S/ {numericCash > 0 && isValidCash ? change.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            )}

            {payMethod !== 'CASH' && (
              <div className="py-6 text-center animate-in fade-in duration-200 bg-slate-50 rounded-lg border border-slate-100 border-dashed">
                <p className="text-xs font-medium text-slate-600 mb-1">Esperando confirmación...</p>
                <p className="text-[10px] text-slate-400">Verifique el abono por POS o Transferencia.</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-slate-50 border-t border-slate-100 flex gap-2">
            <Button variant="outline" className="flex-1 h-9 text-xs font-semibold text-slate-600 border-slate-200 bg-white" onClick={() => setShowPayment(false)}>Cancelar</Button>
            <Button 
              className="flex-1 h-9 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm" 
              disabled={payMethod === 'CASH' && !isValidCash || payMethod === 'SPLIT'}
              onClick={handleAmortizar}
            >
              Confirmar Operación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}