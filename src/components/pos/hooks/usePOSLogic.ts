'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { usePOSData, type Product, type ProductVariant, type CartItem } from './usePOSData';
import { useCashSession } from './useCashSession';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export type SaleState = 'IDLE' | 'PAID' | 'PROCESSING';
export type PaymentMethod = 'CASH' | 'YAPE' | 'PLIN' | 'CARD' | 'TRANSFER';

export interface SplitPayment {
  method: PaymentMethod;
  amount: string;
  reference?: string;
}

export function usePOSLogic() {
  const { user, userId } = useAuth();

  const {
    cashSession, hasCashOpen, mutateCash,
    products, categories, branches, mutateProducts,
    loadingCash, loadingProducts, loadingCats,
  } = usePOSData();

  const cashHook = useCashSession();

  // ── Derived auth ──
  const isGlobalUser = user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';
  const isSuperOrOwner = isGlobalUser;
  const permissions = user?.permissions || {};
  const canManageGlobal = isSuperOrOwner || !!permissions.canManageGlobalProducts;
  const canViewOthers = isSuperOrOwner || !!permissions.canViewOtherBranches || canManageGlobal;
  const currentBranch = branches?.find(b => b.id === user?.branchId);
  const myCode = currentBranch?.ecommerceCode;

  const uniqueCodes = Array.from(new Set(branches?.map(b => b.ecommerceCode).filter(Boolean))) as string[];
  const visibleCodes = canViewOthers ? uniqueCodes : uniqueCodes.filter(c => c === myCode);

  const getBranchByCode = useCallback(
    (code: string) => branches?.find(b => b.ecommerceCode === code),
    [branches],
  );

  // ── Modal visibility ──
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showCashTransaction, setShowCashTransaction] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [showMobileCart, setShowMobileCart] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);

  // ── Sales history (lazy) ──
  const { data: salesData } = useSWR(showSalesHistory ? '/api/sales/current-session' : null, fetcher);

  // ── Filters ──
  const [searchTerm, setSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  // ── Cart ──
  const [cart, setCart] = useState<CartItem[]>([]);
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [globalDiscountType, setGlobalDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [globalDiscountValue, setGlobalDiscountValue] = useState('');
  const [saleState, setSaleState] = useState<SaleState>('IDLE');
  const [ticketData, setTicketData] = useState<any>(null);

  // ── Payment ──
  const [splitPayments, setSplitPayments] = useState<SplitPayment[]>([{ method: 'CASH', amount: '', reference: '' }]);
  const [cashReceived, setCashReceived] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Transfer ──
  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferVariant, setTransferVariant] = useState<ProductVariant | null>(null);
  const [transferFromBranch, setTransferFromBranch] = useState('');
  const [transferQty, setTransferQty] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  // ── Stock helpers ──
  const getLocalStock = useCallback((variant: ProductVariant) => {
    if (user?.branchId && user.branchId !== 'NONE') {
      return variant.stock?.find(bs => bs.branchId === user.branchId)?.quantity || 0;
    }
    return variant.stock?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
  }, [user?.branchId]);

  const getGlobalStock = useCallback((variant: ProductVariant) =>
    variant.stock?.reduce((acc, curr) => acc + curr.quantity, 0) || 0,
  []);

  // ── Product filtering (OPTIMIZADO) ──
  // Crear mapa de categorías UNA VEZ
  const categoryMap = useMemo(() => {
    return new Map(categories?.map(c => [c.id, c]) || []);
  }, [categories]);

  const allowedProducts = useMemo(() => {
    if (!products) return [];
    if (canViewOthers) return products;
    
    const userBranchId = user?.branchId;
    
    return products.filter(p => {
      const catCode = p.category?.ecommerceCode ?? categoryMap.get(p.categoryId)?.ecommerceCode;
      const hasStockHere = p.variants.some(v => 
        v.stock?.some(bs => bs.branchId === userBranchId && bs.quantity > 0)
      );
      return !catCode || catCode === myCode || hasStockHere;
    });
  }, [products, categoryMap, myCode, user?.branchId, canViewOthers]);

  const availableCategories = useMemo(() => {
    if (!categories || !allowedProducts) return [];
    
    const userBranchId = user?.branchId;
    
    const baseProducts = allowedProducts.filter(p => {
      if (!canViewOthers) return true;
      
      const catCode = p.category?.ecommerceCode ?? categoryMap.get(p.categoryId)?.ecommerceCode;
      const isGlobal = !catCode;
      const isMine = catCode === myCode;
      const hasStockHere = p.variants.some(v => 
        v.stock?.some(bs => bs.branchId === userBranchId && bs.quantity > 0)
      );
      
      if (codeFilter === 'GENERAL') {
        const storesWithStock = new Set(
          p.variants.flatMap(v => 
            v.stock?.filter(bs => bs.quantity > 0).map(bs => bs.branchId) || []
          )
        ).size;
        return isGlobal || storesWithStock > 1 || (!isMine && hasStockHere);
      }
      
      if (codeFilter !== 'ALL') return catCode === codeFilter;
      return true;
    });
    
    const validIds = new Set(baseProducts.map(p => p.categoryId));
    return categories.filter(c => validIds.has(c.id));
  }, [categories, allowedProducts, codeFilter, canViewOthers, myCode, user?.branchId, categoryMap]);

  const filteredProducts = useMemo(() => {
    if (!allowedProducts) return [];
    
    const searchLower = searchTerm.toLowerCase();
    const hasSearch = searchTerm.length > 0;
    const hasCategoryFilter = selectedCategory !== 'ALL';
    const hasCodeFilter = codeFilter !== 'ALL' && codeFilter !== 'GENERAL';
    const userBranchId = user?.branchId;
    
    return allowedProducts.filter(p => {
      // Búsqueda de texto
      if (hasSearch) {
        const matchesTitle = p.title.toLowerCase().includes(searchLower);
        const matchesVariant = p.variants.some(v => 
          v.barcode?.includes(searchTerm) || v.sku?.includes(searchTerm)
        );
        if (!matchesTitle && !matchesVariant) return false;
      }
      
      // Filtro de categoría
      if (hasCategoryFilter && p.categoryId !== selectedCategory) return false;
      
      // Filtro de código (solo si canViewOthers)
      if (canViewOthers) {
        const catCode = p.category?.ecommerceCode ?? categoryMap.get(p.categoryId)?.ecommerceCode;
        const isGlobal = !catCode;
        const isMine = catCode === myCode;
        const hasStockHere = p.variants.some(v => 
          v.stock?.some(bs => bs.branchId === userBranchId && bs.quantity > 0)
        );
        
        if (codeFilter === 'GENERAL') {
          const storesWithStock = new Set(
            p.variants.flatMap(v => 
              v.stock?.filter(bs => bs.quantity > 0).map(bs => bs.branchId) || []
            )
          ).size;
          if (!isGlobal && storesWithStock <= 1 && (isMine || !hasStockHere)) return false;
        } else if (hasCodeFilter) {
          if (catCode !== codeFilter) return false;
        }
      }
      
      return true;
    });
  }, [allowedProducts, searchTerm, selectedCategory, codeFilter, canViewOthers, categoryMap, myCode, user?.branchId]);

  // ── Cart handlers ──
  const addToCart = useCallback((product: Product, variant: ProductVariant) => {
    if (saleState === 'PAID') return toast.error('Venta bloqueada. Libere la caja primero.');
    // Usar getLocalStock para manejar correctamente todos los roles (SUPER_ADMIN, OWNER, CASHIER)
    const localStock = getLocalStock(variant);

    if (localStock <= 0) {
      const globalStock = variant.stock?.reduce((a, c) => a + c.quantity, 0) || 0;
      if (globalStock > 0) {
        setTransferProduct(product);
        setTransferVariant(variant);
        setTransferQty('1');
        setTransferFromBranch('');
      } else {
        toast.error('Producto agotado totalmente en todas las sucursales.');
      }
      return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.variantId === variant.id);
      if (existing) {
        if (existing.cartQuantity >= localStock) { toast.error(`Stock límite: ${localStock} un.`); return prev; }
        return prev.map(item => item.variantId === variant.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      return [...prev, {
        variantId: variant.id, productId: product.id,
        productName: product.title, variantName: variant.name,
        price: variant.price || product.basePrice,
        wholesalePrice: product.wholesalePrice, wholesaleMinCount: product.wholesaleMinCount,
        discountPercentage: product.discountPercentage,
        images: (variant.images?.length ? variant.images : product.images),
        cartQuantity: 1, localStock,
      }];
    });
  }, [saleState, getLocalStock]);

  const updateQuantity = useCallback((variantId: string, delta: number) => {
    if (saleState === 'PAID') return;
    setCart(prev => prev.map(item => {
      if (item.variantId !== variantId) return item;
      const newQty = item.cartQuantity + delta;
      if (newQty < 1) return item;
      if (newQty > item.localStock) { toast.error('Stock físico insuficiente'); return item; }
      return { ...item, cartQuantity: newQty };
    }));
  }, [saleState]);

  const removeFromCart = useCallback((variantId: string) => {
    if (saleState === 'PAID') return;
    setCart(prev => prev.filter(item => item.variantId !== variantId));
  }, [saleState]);

  const calculateItemFinancials = useCallback((item: CartItem) => {
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
  }, []);

  // ── Totals ──
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
  const pointsToEarn = foundCustomer ? Math.floor(finalGlobalTotal / 2) : 0;

  // ── Payment helpers ──
  const totalPaid = splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remaining = Math.max(0, finalGlobalTotal - totalPaid);
  const numericCash = parseFloat(cashReceived) || 0;
  const isValidPayment = totalPaid >= finalGlobalTotal;

  const openPaymentModal = useCallback(() => {
    setSplitPayments([{ method: 'CASH', amount: finalGlobalTotal.toFixed(2), reference: '' }]);
    setCashReceived(finalGlobalTotal.toFixed(2));
    setShowPayment(true);
  }, [finalGlobalTotal]);

  const handleQuickCash = useCallback((amount: number) => {
    setCashReceived(amount.toFixed(2));
    setSplitPayments(prev => prev.map((p, i) => i === 0 && p.method === 'CASH' ? { ...p, amount: amount.toFixed(2) } : p));
  }, []);

  const addPaymentMethod = useCallback(() => {
    if (splitPayments.length >= 3) return toast.error('Máximo 3 métodos de pago');
    setSplitPayments(prev => [...prev, { method: 'YAPE', amount: remaining.toFixed(2), reference: '' }]);
  }, [splitPayments.length, remaining]);

  const removePaymentMethod = useCallback((index: number) => {
    if (splitPayments.length === 1) return;
    setSplitPayments(prev => prev.filter((_, i) => i !== index));
  }, [splitPayments.length]);

  const updatePaymentMethod = useCallback((index: number, field: string, value: any) => {
    setSplitPayments(prev => prev.map((p, i) => i === index ? { ...p, [field]: value } : p));
  }, []);

  // ── Sale submission ──
  const handleAmortizar = useCallback(async () => {
    if (cart.length === 0) return toast.error('El carrito está vacío');
    if (!cashSession?.branchId) return toast.error('No se puede determinar la sucursal de la caja');
    if (!isValidPayment) return toast.error('El monto total de los pagos debe cubrir el total de la venta');

    for (const payment of splitPayments) {
      if (['YAPE', 'PLIN', 'TRANSFER'].includes(payment.method) && !payment.reference?.trim()) {
        return toast.error(`Ingresa el número de operación para ${payment.method}`);
      }
    }

    const cashPayment = splitPayments.find(p => p.method === 'CASH');
    const tendered = cashPayment ? numericCash : finalGlobalTotal;

    setIsSubmitting(true);
    try {
      const itemsPayload = cart.map(item => {
        const { finalUnitPrice } = calculateItemFinancials(item);
        return { variantId: item.variantId, productName: item.productName, variantName: item.variantName, quantity: item.cartQuantity, price: finalUnitPrice };
      });

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: cashSession.branchId,
          customerId: foundCustomer?.id || null,
          items: itemsPayload,
          payments: splitPayments.map(p => ({
            method: p.method,
            amount: parseFloat(p.amount) || 0,
            reference: ['YAPE', 'PLIN', 'TRANSFER'].includes(p.method) ? p.reference : null,
          })),
          tenderedAmount: tendered,
          discount: Number(globalDiscountAmount.toFixed(2)) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || data?.message || 'Error procesando la venta');

      if (foundCustomer && data.pointsEarned > 0) {
        toast.success(`¡Venta registrada! ${foundCustomer.name} ganó ${data.pointsEarned} punto${data.pointsEarned > 1 ? 's' : ''}`, { duration: 5000 });
      } else {
        toast.success('¡Venta registrada con éxito!');
      }

      setTicketData({
        code: data.code, createdAt: data.createdAt,
        subtotal: Number(data.subtotal), discount: Number(data.discount),
        total: Number(data.total), tenderedAmount: Number(data.tenderedAmount),
        changeAmount: Number(data.changeAmount), pointsEarned: data.pointsEarned || 0,
        items: data.items.map((item: any) => ({ productName: item.productName, variantName: item.variantName, quantity: item.quantity, price: Number(item.price), subtotal: Number(item.subtotal) })),
        payments: data.payments.map((p: any) => ({ method: p.method, amount: Number(p.amount) })),
        customer: data.customer, cashier: data.user, branch: data.branch, business: data.business,
      });

      setSaleState('PAID');
      setShowPayment(false);
      mutateProducts();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error interno al registrar la venta');
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, cashSession, isValidPayment, splitPayments, numericCash, finalGlobalTotal, foundCustomer, globalDiscountAmount, calculateItemFinancials, mutateProducts]);

  const handleBoletear = useCallback(() => {
    if (!ticketData) return toast.error('No hay datos de venta para imprimir');
    setShowTicketModal(true);
  }, [ticketData]);

  const handleLiberar = useCallback(() => {
    setCart([]); setFoundCustomer(null); setGlobalDiscountValue('');
    setTicketData(null); setSaleState('IDLE');
    toast.success('Caja liberada para nueva venta');
  }, []);

  const handleAnular = useCallback(() => {
    setTicketData(null); setSaleState('IDLE');
    toast.error('Pago anulado. Venta devuelta a borrador.');
  }, []);

  // ── Transfer ──
  const handleSubmitTransfer = useCallback(async () => {
    if (!transferFromBranch || !transferQty || Number(transferQty) < 1 || !transferVariant) {
      return toast.error('Selecciona una sucursal y cantidad válida.');
    }
    setIsSubmittingTransfer(true);
    try {
      const res = await fetch('/api/stock-transfers', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId: transferVariant.id, fromBranchId: transferFromBranch, toBranchId: user?.branchId, requestedById: userId, quantity: Number(transferQty) }),
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Error al procesar solicitud'); }
      toast.success('Solicitud enviada. Te notificaremos cuando la aprueben.');
      setTransferProduct(null); setTransferVariant(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error al enviar la solicitud.');
    } finally {
      setIsSubmittingTransfer(false);
    }
  }, [transferFromBranch, transferQty, transferVariant, user?.branchId, userId]);

  // ── Mobile helpers ──
  const handleMobileCustomerAction = useCallback(() => {
    if (foundCustomer) setFoundCustomer(null);
    else setShowCustomerSearch(true);
  }, [foundCustomer]);

  const hasActiveFilters = codeFilter !== 'ALL' || selectedCategory !== 'ALL';

  return {
    // Data
    cashSession, hasCashOpen, mutateCash, branches, categories,
    loadingCash, loadingProducts, loadingCats,
    cashHook, isGlobalUser, currentBranch,
    // Permissions
    canViewOthers, visibleCodes, myCode,
    // Helpers
    getBranchByCode, getLocalStock, getGlobalStock,
    // Products
    filteredProducts, availableCategories,
    // Filters
    searchTerm, setSearchTerm,
    codeFilter, setCodeFilter,
    selectedCategory, setSelectedCategory,
    hasActiveFilters,
    // Modals
    showSalesHistory, setShowSalesHistory,
    showCashTransaction, setShowCashTransaction,
    showCustomerModal, setShowCustomerModal,
    showCustomerSearch, setShowCustomerSearch,
    showDiscountModal, setShowDiscountModal,
    showMobileCart, setShowMobileCart,
    showMobileFilters, setShowMobileFilters,
    showTicketModal, setShowTicketModal,
    showPayment, setShowPayment,
    salesData,
    // Cart
    cart, setCart,
    foundCustomer, setFoundCustomer,
    globalDiscountType, setGlobalDiscountType,
    globalDiscountValue, setGlobalDiscountValue,
    saleState,
    ticketData, setTicketData,
    // Cart handlers
    addToCart, updateQuantity, removeFromCart, calculateItemFinancials,
    // Totals
    globalSubtotalBase, itemSavings, itemsSubtotal,
    globalDiscountAmount, finalGlobalTotal, totalSavings, pointsToEarn,
    // Payment
    splitPayments, setSplitPayments,
    cashReceived, setCashReceived,
    isSubmitting, totalPaid, remaining, numericCash, isValidPayment,
    openPaymentModal, handleQuickCash,
    addPaymentMethod, removePaymentMethod, updatePaymentMethod,
    handleAmortizar, handleBoletear, handleLiberar, handleAnular,
    // Transfer
    transferProduct, setTransferProduct,
    transferVariant, setTransferVariant,
    transferFromBranch, setTransferFromBranch,
    transferQty, setTransferQty,
    isSubmittingTransfer, handleSubmitTransfer,
    // Mobile
    handleMobileCustomerAction,
    handleMobileDiscountAction: () => setShowDiscountModal(true),
  };
}
