// src/app/(pos)/pos/page.tsx
'use client';

import useSWR from 'swr';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { 
  Search, Trash2, Plus, Minus, CreditCard, Banknote, ShoppingBag, 
  Package, Tag, ChevronRight, ChevronLeft, CheckCircle2, 
  User, Receipt, Unlock, RotateCcw, UserPlus, X, Store, Globe, 
  ArrowRightLeft, Send, LayoutGrid, Loader2, Wallet, LogOut, Calculator, MapPin, History as HistoryIcon, Printer, XCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';
import { SalesHistoryModal } from '@/components/pos/SalesHistoryModal';
import { CashTransactionModal } from '@/components/pos/CashTransactionModal';
import { CustomerModal } from '@/components/pos/CustomerModal';
import { CustomerSearchModal } from '@/components/pos/CustomerSearchModal';
import { DiscountModal } from '@/components/pos/DiscountModal';
import { TicketPrint } from '@/components/pos/TicketPrint';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface BranchBasic { id: string; name: string; ecommerceCode: string | null; logoUrl?: string | null; }
interface Category { id: string; name: string; ecommerceCode?: string | null; }
interface Product {
  id: string; title: string; basePrice: number; wholesalePrice: number | null;
  wholesaleMinCount: number | null; discountPercentage: number;
  images: string[]; categoryId: string;
  category?: { name: string; ecommerceCode: string | null };
  variants: ProductVariant[];
}

interface ProductVariant {
  id: string; name: string; sku: string | null; barcode: string | null;
  price: number | null; cost: number; minStock: number; active: boolean;
  attributes: unknown; images: string[];
  stock: { branchId: string; quantity: number }[];
}

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

export default function PosPage() {
  const { user, userId } = useAuth();
  
  // 🚀 Cash session management
  const { data: cashData, isLoading: loadingCash, mutate: mutateCash } = useSWR('/api/cash/current', fetcher);
  const cashSession = cashData?.session;
  const hasCashOpen = cashSession?.status === 'OPEN';
  
  const isGlobalUser = user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';
  
  // 🚀 EXTRAEMOS EL MUTATE DE LOS PRODUCTOS PARA ACTUALIZAR STOCK EN VIVO
  const { data: products, isLoading: loadingProducts, mutate: mutateProducts } = useSWR<Product[]>('/api/products', fetcher);
  const { data: categories, isLoading: loadingCats } = useSWR<Category[]>('/api/categories', fetcher);
  const { data: branches } = useSWR<BranchBasic[]>('/api/branches', fetcher);
  
  const currentBranch = branches?.find(b => b.id === user?.branchId);

  // Cash modals
  const [showOpenCash, setShowOpenCash] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [showSalesHistory, setShowSalesHistory] = useState(false);
  const [showCashTransaction, setShowCashTransaction] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [ticketData, setTicketData] = useState<any>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [initialCash, setInitialCash] = useState('');
  const [finalCash, setFinalCash] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isOpeningCash, setIsOpeningCash] = useState(false);
  const [isClosingCash, setIsClosingCash] = useState(false);
  const [closeResult, setCloseResult] = useState<{ difference: number } | null>(null);

  // Sales history
  const { data: salesData } = useSWR(showSalesHistory ? '/api/sales/current-session' : null, fetcher);

  const [searchTerm, setSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [cart, setCart] = useState<CartItem[]>([]);

  const [saleState, setSaleState] = useState<'DRAFT' | 'PAID'>('DRAFT');
  const [foundCustomer, setFoundCustomer] = useState<any>(null);
  const [globalDiscountType, setGlobalDiscountType] = useState<'FIXED' | 'PERCENT'>('FIXED');
  const [globalDiscountValue, setGlobalDiscountValue] = useState('');

  const [showPayment, setShowPayment] = useState(false);
  const [splitPayments, setSplitPayments] = useState<Array<{
    method: 'CASH' | 'YAPE' | 'PLIN' | 'CARD' | 'TRANSFER';
    amount: string;
    reference?: string;
  }>>([{ method: 'CASH', amount: '', reference: '' }]);
  const [cashReceived, setCashReceived] = useState('');
  
  // 🚀 NUEVO ESTADO: BLOQUEAR BOTÓN MIENTRAS SE GUARDA EN BD
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [transferProduct, setTransferProduct] = useState<Product | null>(null);
  const [transferVariant, setTransferVariant] = useState<ProductVariant | null>(null);
  const [transferFromBranch, setTransferFromBranch] = useState<string>('');
  const [transferQty, setTransferQty] = useState('');
  const [isSubmittingTransfer, setIsSubmittingTransfer] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; 
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  const getLocalStock = (variant: ProductVariant) => {
    if (user?.branchId && user.branchId !== 'NONE') {
      return variant.stock?.find(bs => bs.branchId === user.branchId)?.quantity || 0;
    }
    return variant.stock?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
  };

  const getGlobalStock = (variant: ProductVariant) => {
    return variant.stock?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;
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
      
      // Check if any variant has stock in my branch
      const hasStockInMyBranch = p.variants.some(v => 
        v.stock?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0)
      );

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
        const hasStockInMyBranch = p.variants.some(v => 
          v.stock?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0)
        );

        if (codeFilter === 'GENERAL') {
          // Count stores with stock across all variants
          const storesWithStock = new Set(
            p.variants.flatMap(v => v.stock?.filter(bs => bs.quantity > 0).map(bs => bs.branchId) || [])
          ).size;
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
      // Search in product title or any variant barcode/sku
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.variants.some(v => v.barcode?.includes(searchTerm) || v.sku?.includes(searchTerm));
      
      const matchesCat = selectedCategory === 'ALL' || p.categoryId === selectedCategory;
      
      let matchesCode = true;
      if (canViewOthers) {
        const catEcommerceCode = p.category?.ecommerceCode ?? categories?.find(c => c.id === p.categoryId)?.ecommerceCode;
        const isGlobalProduct = !catEcommerceCode;
        const isMyCatalogProduct = catEcommerceCode === myCode;
        const hasStockInMyBranch = p.variants.some(v => 
          v.stock?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0)
        );

        if (codeFilter === 'GENERAL') {
          const storesWithStock = new Set(
            p.variants.flatMap(v => v.stock?.filter(bs => bs.quantity > 0).map(bs => bs.branchId) || [])
          ).size;
          matchesCode = isGlobalProduct || storesWithStock > 1 || (!isMyCatalogProduct && hasStockInMyBranch);
        } else if (codeFilter !== 'ALL') {
          matchesCode = catEcommerceCode === codeFilter;
        }
      }

      return matchesSearch && matchesCat && matchesCode;
    });
  }, [allowedProducts, searchTerm, selectedCategory, codeFilter, canViewOthers, categories, myCode, user?.branchId]);

  const addToCart = (product: Product, variant: ProductVariant) => {
    if (saleState === 'PAID') return toast.error('Venta bloqueada. Libere la caja primero.');
    const localStock = getLocalStock(variant);
    
    if (localStock <= 0) {
      const globalStock = getGlobalStock(variant);
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
        if (existing.cartQuantity >= localStock) {
          toast.error(`Stock límite: ${localStock} un.`);
          return prev;
        }
        return prev.map(item => item.variantId === variant.id ? { ...item, cartQuantity: item.cartQuantity + 1 } : item);
      }
      
      // Create cart item from variant
      const cartItem: CartItem = {
        variantId: variant.id,
        productId: product.id,
        productName: product.title,
        variantName: variant.name,
        price: variant.price || product.basePrice,
        wholesalePrice: product.wholesalePrice,
        wholesaleMinCount: product.wholesaleMinCount,
        discountPercentage: product.discountPercentage,
        images: (variant.images && variant.images.length > 0) ? variant.images : product.images,
        cartQuantity: 1,
        localStock
      };
      
      return [...prev, cartItem];
    });
  };

  const updateQuantity = (variantId: string, delta: number) => {
    if (saleState === 'PAID') return;
    setCart(prev => prev.map(item => {
      if (item.variantId === variantId) {
        const newQty = item.cartQuantity + delta;
        if (newQty < 1) return item; 
        if (newQty > item.localStock) { 
          toast.error('Stock físico insuficiente'); 
          return item; 
        }
        return { ...item, cartQuantity: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (variantId: string) => {
    if (saleState === 'PAID') return;
    setCart(prev => prev.filter(item => item.variantId !== variantId));
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

  const openPaymentModal = () => {
    setSplitPayments([{ method: 'CASH', amount: finalGlobalTotal.toFixed(2), reference: '' }]);
    setCashReceived(finalGlobalTotal.toFixed(2));
    setShowPayment(true);
  };

  // Calcular totales de pagos mixtos
  const totalPaid = splitPayments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
  const remaining = Math.max(0, finalGlobalTotal - totalPaid);
  const numericCash = parseFloat(cashReceived) || 0;
  const change = numericCash - finalGlobalTotal;
  const isValidPayment = totalPaid >= finalGlobalTotal;

  const handleQuickCash = (amount: number) => {
    setCashReceived(amount.toFixed(2));
    // Actualizar el primer pago en efectivo
    setSplitPayments(prev => prev.map((p, i) => 
      i === 0 && p.method === 'CASH' ? { ...p, amount: amount.toFixed(2) } : p
    ));
  };

  const addPaymentMethod = () => {
    if (splitPayments.length >= 3) {
      return toast.error('Máximo 3 métodos de pago');
    }
    setSplitPayments(prev => [...prev, { method: 'YAPE', amount: remaining.toFixed(2), reference: '' }]);
  };

  const removePaymentMethod = (index: number) => {
    if (splitPayments.length === 1) return;
    setSplitPayments(prev => prev.filter((_, i) => i !== index));
  };

  const updatePaymentMethod = (index: number, field: string, value: any) => {
    setSplitPayments(prev => prev.map((p, i) => 
      i === index ? { ...p, [field]: value } : p
    ));
  };

  // 🚀 LÓGICA DE VENTA REAL CONECTADA AL BACKEND
  const handleAmortizar = async () => {
    if (cart.length === 0) return toast.error('El carrito está vacío');
    
    if (!cashSession?.branchId) {
      return toast.error('No se puede determinar la sucursal de la caja');
    }
    
    // Validar que el total pagado sea suficiente
    if (!isValidPayment) {
      return toast.error('El monto total de los pagos debe cubrir el total de la venta');
    }

    // Validar referencias para métodos digitales
    for (const payment of splitPayments) {
      if (['YAPE', 'PLIN', 'TRANSFER'].includes(payment.method)) {
        if (!payment.reference || payment.reference.trim() === '') {
          return toast.error(`Ingresa el número de operación para ${payment.method}`);
        }
      }
    }

    // Calcular tendered amount (solo para efectivo)
    const cashPayment = splitPayments.find(p => p.method === 'CASH');
    const tendered = cashPayment ? numericCash : finalGlobalTotal;

    setIsSubmitting(true);
    try {
      // Enviar items con precios SIN descuento global (solo con descuentos por item)
      const itemsWithoutGlobalDiscount = cart.map(item => {
        const { finalUnitPrice } = calculateItemFinancials(item);
        
        return {
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.cartQuantity,
          price: finalUnitPrice // Precio con descuentos por item, pero SIN descuento global
        };
      });

      const payload = {
        branchId: cashSession.branchId,
        customerId: foundCustomer?.id || null,
        items: itemsWithoutGlobalDiscount,
        payments: splitPayments.map(p => ({
          method: p.method,
          amount: parseFloat(p.amount) || 0,
          reference: ['YAPE', 'PLIN', 'TRANSFER'].includes(p.method) ? p.reference : null
        })),
        tenderedAmount: tendered,
        discount: Number(globalDiscountAmount.toFixed(2)) || 0, // Siempre enviar, incluso si es 0
      };

      console.log('Enviando venta:', {
        itemsSubtotal,
        globalDiscountAmount,
        finalGlobalTotal,
        discount: payload.discount
      });

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      let data;
      try {
        data = await res.json();
      } catch (jsonError) {
        console.error('Error parseando respuesta JSON:', jsonError);
        throw new Error('Error en la respuesta del servidor');
      }

      if (!res.ok) {
        console.error('Error en venta:', {
          status: res.status,
          statusText: res.statusText,
          data
        });
        throw new Error(data?.error || data?.message || 'Error procesando la venta');
      }

      // 🎉 Mostrar mensaje de éxito con puntos ganados si hay cliente vinculado
      if (foundCustomer && data.pointsEarned > 0) {
        toast.success(
          `¡Venta registrada! ${foundCustomer.name} ganó ${data.pointsEarned} punto${data.pointsEarned > 1 ? 's' : ''}`,
          { duration: 5000 }
        );
      } else {
        toast.success('¡Venta registrada con éxito!');
      }
      
      // 🎫 Guardar datos de la venta para el ticket
      setTicketData({
        code: data.code,
        createdAt: data.createdAt,
        subtotal: Number(data.subtotal),
        discount: Number(data.discount),
        total: Number(data.total),
        tenderedAmount: Number(data.tenderedAmount),
        changeAmount: Number(data.changeAmount),
        pointsEarned: data.pointsEarned || 0,
        items: data.items.map((item: any) => ({
          productName: item.productName,
          variantName: item.variantName,
          quantity: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.subtotal)
        })),
        payments: data.payments.map((p: any) => ({
          method: p.method,
          amount: Number(p.amount)
        })),
        customer: data.customer,
        cashier: data.user,
        branch: data.branch,
        business: data.business
      });
      
      setSaleState('PAID');
      setShowPayment(false);
      mutateProducts();

    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Error interno al registrar la venta');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBoletear = () => {
    if (!ticketData) {
      toast.error('No hay datos de venta para imprimir');
      return;
    }
    // Mostrar modal con el ticket
    setShowTicketModal(true);
  };

  const handleLiberar = () => {
    setCart([]);
    setFoundCustomer(null);
    setGlobalDiscountValue('');
    setTicketData(null);
    setSaleState('DRAFT');
    toast.success('Caja liberada para nueva venta');
  };

  const handleAnular = () => {
    setTicketData(null);
    setSaleState('DRAFT');
    toast.error('Pago anulado. Venta devuelta a borrador.');
  };

  const handleSubmitTransfer = async () => {
    if (!transferFromBranch || !transferQty || Number(transferQty) < 1 || !transferVariant) {
      toast.error('Selecciona una sucursal y cantidad válida.');
      return;
    }
    
    setIsSubmittingTransfer(true);
    try {
      const payload = {
        variantId: transferVariant.id,
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
      setTransferVariant(null);
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

  // Cash session handlers
  const handleOpenCash = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isGlobalUser && !selectedBranch) {
      return toast.error('Debes seleccionar una sucursal.');
    }

    if (!initialCash || isNaN(Number(initialCash)) || Number(initialCash) < 0) {
      return toast.error('Ingresa un monto inicial válido.');
    }

    setIsOpeningCash(true);
    try {
      const payload: { initialCash: number; branchId?: string } = { 
        initialCash: Number(initialCash) 
      };

      if (isGlobalUser && selectedBranch) {
        payload.branchId = selectedBranch;
      }

      const res = await fetch('/api/cash/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al abrir caja');

      toast.success('¡Caja abierta! Buen turno.');
      setShowOpenCash(false);
      setInitialCash('');
      setSelectedBranch('');
      mutateCash();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al abrir caja';
      toast.error(errorMessage);
    } finally {
      setIsOpeningCash(false);
    }
  };

  const handleCloseCash = async () => {
    if (!finalCash || isNaN(Number(finalCash)) || Number(finalCash) < 0) {
      return toast.error('Ingresa el efectivo contado.');
    }

    setIsClosingCash(true);
    try {
      const res = await fetch('/api/cash/close', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalCash: Number(finalCash) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cerrar caja');

      setCloseResult({ difference: Number(data.difference) });
      setFinalCash('');
      mutateCash();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cerrar caja';
      toast.error(errorMessage);
    } finally {
      setIsClosingCash(false);
    }
  };

  const handleExitAfterClose = () => {
    setCloseResult(null);
    setShowCloseCash(false);
    window.location.reload();
  };

  // Loading state
  if (loadingCash) {
    return (
      <div className="flex flex-col h-full w-full items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-slate-300" />
        <p className="font-semibold text-sm text-slate-400">Validando sesión...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5 relative">
      
      {/* Overlay cuando no hay caja abierta - cubre toda la página */}
      {!hasCashOpen && (
        <div className="absolute inset-0 bg-slate-50/60 backdrop-blur-[0.5px] z-10 pointer-events-none"></div>
      )}
      
      {/* TOOLBAR SUPERIOR */}
      <div className="flex items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">POS</h1>
          <ShoppingBag className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              autoFocus={hasCashOpen}
              placeholder="Buscar producto, SKU..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              disabled={saleState === 'PAID' || !hasCashOpen}
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>
          {hasCashOpen && (
            <>
              <Button 
                onClick={() => setShowCustomerModal(true)}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1.5" /> <span className="font-bold">Nuevo Cliente</span>
              </Button>
              <Button 
                onClick={() => setShowSalesHistory(true)}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <HistoryIcon className="w-3.5 h-3.5 mr-1.5" /> <span className="font-bold">Historial</span>
              </Button>
              <Button 
                onClick={() => setShowCashTransaction(true)}
                variant="ghost"
                className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 mr-1.5" /> <span className="font-bold">Ingresos/Egresos</span>
              </Button>
              <Button 
                onClick={() => setShowCloseCash(true)} 
                className="h-9 px-4 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-lg shadow-sm transition-all shrink-0"
              >
                <LogOut className="w-3.5 h-3.5 mr-1.5" /> Cerrar Caja
              </Button>
            </>
          )}
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL CON DOS COLUMNAS */}
      <div className="flex flex-1 min-h-0 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      
      {/* 🚀 ÁREA IZQUIERDA: CATÁLOGO */}
      <main className={`flex-1 flex flex-col min-w-0 transition-colors ${saleState === 'PAID' ? 'bg-emerald-50/10 opacity-70 pointer-events-none' : 'bg-white'}`}>

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
              // Use the standard variant or first active variant
              const variant = product.variants.find(v => v.name === 'Estándar') || product.variants[0];
              if (!variant) return null;
              
              const localStock = getLocalStock(variant);
              const globalStock = getGlobalStock(variant);
              const externalStock = globalStock - localStock;
              
              const isOutOfStock = localStock <= 0;
              const hasDiscount = product.discountPercentage > 0;
              const hasWholesale = product.wholesalePrice && product.wholesaleMinCount;
              
              const displayPrice = variant.price || product.basePrice;
              const displayImages = (variant.images && variant.images.length > 0) ? variant.images : product.images;

              return (
                <div key={`${product.id}-${variant.id}`} onClick={() => addToCart(product, variant)} className={`group relative flex flex-col gap-2 p-2 rounded-2xl transition-all select-none bg-white border ${isOutOfStock ? 'opacity-80 border-slate-200 border-dashed cursor-pointer hover:bg-slate-50' : 'cursor-pointer border-slate-100 hover:border-slate-200 hover:shadow-sm'}`}>
                  <div className={`aspect-square bg-slate-50 rounded-xl relative overflow-hidden shrink-0 border border-slate-100 ${isOutOfStock ? 'grayscale opacity-70' : ''}`}>
                    {displayImages?.[0] ? (
                      <img src={displayImages[0]} alt={product.title} className="w-full h-full object-cover mix-blend-multiply" draggable={false} />
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
                            <p className="text-slate-900 font-semibold text-sm">S/ {Number(displayPrice).toFixed(2)}</p>
                            {hasDiscount && <p className="text-[10px] text-slate-400 line-through">S/ {(Number(displayPrice) * (1 / (1 - product.discountPercentage / 100))).toFixed(2)}</p>}
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
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {saleState === 'PAID' ? (
              <>
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span className="font-semibold text-sm">VENTA PAGADA</span>
              </>
            ) : (
              <>
                {foundCustomer ? (
                  <>
                    <div className="w-7 h-7 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{foundCustomer.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {foundCustomer.pointsBalance} pts
                        {finalGlobalTotal > 0 && (
                          <span className="text-amber-600 font-bold ml-1">(+{Math.floor(finalGlobalTotal / 2)})</span>
                        )}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5 shrink-0" />
                    <span className="font-semibold text-sm">Resumen de Venta</span>
                  </>
                )}
              </>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {saleState === 'DRAFT' && (
              <>
                <button 
                  onClick={() => foundCustomer ? setFoundCustomer(null) : setShowCustomerSearch(true)} 
                  disabled={cart.length === 0}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${foundCustomer ? 'text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                  title={foundCustomer ? 'Desvincular cliente' : 'Vincular cliente'}
                >
                  {foundCustomer ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setShowDiscountModal(true)} 
                  disabled={cart.length === 0}
                  className={`p-1.5 rounded-lg transition-colors disabled:opacity-30 ${globalDiscountValue && parseFloat(globalDiscountValue) > 0 ? 'text-amber-600 hover:text-amber-700 hover:bg-amber-50' : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'}`}
                  title="Aplicar descuento"
                >
                  <Tag className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setCart([])} 
                  disabled={cart.length === 0} 
                  className="text-slate-400 hover:text-red-500 transition-colors disabled:opacity-30 p-1.5 rounded-lg hover:bg-red-50"
                  title="Vaciar carrito"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
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
                <div key={item.variantId} className={`p-3 rounded-xl transition-all flex flex-col gap-1.5 relative group border ${saleState === 'PAID' ? 'bg-white/80 border-emerald-100' : 'bg-slate-50/50 hover:bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-start gap-2 pr-6">
                    <span className={`font-medium text-xs leading-tight line-clamp-2 flex-1 ${saleState === 'PAID' ? 'text-slate-600' : 'text-slate-800'}`}>
                      {item.productName}
                      {item.variantName && item.variantName !== 'Estándar' && <span className="text-slate-500"> ({item.variantName})</span>}
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

                    {saleState === 'DRAFT' ? (
                      <div className="flex items-center bg-white border border-slate-200 rounded-lg shadow-sm h-7">
                        <button onClick={() => updateQuantity(item.variantId, -1)} className="w-7 flex items-center justify-center text-slate-500 hover:text-slate-900"><Minus className="w-3.5 h-3.5" /></button>
                        <span className="text-xs font-semibold text-slate-800 w-6 text-center tabular-nums">{item.cartQuantity}</span>
                        <button onClick={() => updateQuantity(item.variantId, 1)} className="w-7 flex items-center justify-center text-slate-500 hover:text-slate-900"><Plus className="w-3.5 h-3.5" /></button>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-emerald-700 px-2.5 py-1 bg-emerald-100/50 rounded-lg tabular-nums">{item.cartQuantity} un.</span>
                    )}
                  </div>

                  {saleState === 'DRAFT' && (
                    <button onClick={() => removeFromCart(item.variantId)} className="absolute top-2 right-2 p-1 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className={`border-t shrink-0 flex flex-col p-4 gap-4 transition-colors ${saleState === 'PAID' ? 'border-emerald-200 bg-white/50' : 'border-slate-100 bg-white'}`}>
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
            <Button onClick={openPaymentModal} disabled={cart.length === 0} className="w-full h-12 text-sm font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-md transition-all active:scale-[0.98]">
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
        <DialogContent className="sm:max-w-lg font-sans p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-xl">
          <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white">
            <DialogTitle className="text-lg font-black text-slate-900">Recibir Pago</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Configura los métodos de pago
            </DialogDescription>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Total a cobrar */}
            <div className="flex items-center justify-between bg-slate-50 px-4 py-3 rounded-lg border border-slate-200">
              <span className="text-sm font-semibold text-slate-600">Total a cobrar:</span>
              <span className="text-xl font-black text-slate-900 tabular-nums">S/ {finalGlobalTotal.toFixed(2)}</span>
            </div>

            {/* Métodos de pago */}
            <div className="space-y-3">
              {splitPayments.map((payment, index) => (
                <div key={index} className="p-4 bg-white border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-slate-700">Método {index + 1}</Label>
                    {splitPayments.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removePaymentMethod(index)}
                        className="h-6 w-6 p-0 text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  {/* Selector de método */}
                  <Select
                    value={payment.method}
                    onValueChange={(value) => updatePaymentMethod(index, 'method', value)}
                  >
                    <SelectTrigger className="h-10 text-sm font-semibold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Efectivo</SelectItem>
                      <SelectItem value="YAPE">Yape</SelectItem>
                      <SelectItem value="PLIN">Plin</SelectItem>
                      <SelectItem value="CARD">Tarjeta</SelectItem>
                      <SelectItem value="TRANSFER">Transferencia</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Monto */}
                  <div className="space-y-1">
                    <Label className="text-xs font-semibold text-slate-600">Monto</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">S/</span>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={payment.amount}
                        onChange={(e) => updatePaymentMethod(index, 'amount', e.target.value)}
                        className="pl-8 h-10 text-sm font-semibold tabular-nums"
                      />
                    </div>
                  </div>

                  {/* Referencia para métodos digitales */}
                  {['YAPE', 'PLIN', 'TRANSFER'].includes(payment.method) && (
                    <div className="space-y-1">
                      <Label className="text-xs font-semibold text-slate-600">Nº Operación</Label>
                      <Input
                        type="text"
                        placeholder="123456789"
                        value={payment.reference}
                        onChange={(e) => updatePaymentMethod(index, 'reference', e.target.value)}
                        className="h-10 text-sm font-mono"
                      />
                    </div>
                  )}

                  {/* Efectivo recibido */}
                  {payment.method === 'CASH' && index === 0 && (
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-600">Efectivo Recibido</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">S/</span>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value)}
                          className="pl-8 h-10 text-sm font-semibold tabular-nums"
                        />
                      </div>
                      <div className="grid grid-cols-4 gap-1.5">
                        {[parseFloat(payment.amount) || finalGlobalTotal, 20, 50, 100].map((amt, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickCash(amt)}
                            className="h-8 text-[10px] font-semibold"
                          >
                            {i === 0 ? 'Exacto' : `S/${amt}`}
                          </Button>
                        ))}
                      </div>
                      {numericCash > 0 && (
                        <div className={`px-3 py-2 rounded-lg flex items-center justify-between text-xs ${numericCash >= parseFloat(payment.amount) ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                          <span className="font-semibold text-slate-600">Vuelto:</span>
                          <span className={`font-bold tabular-nums ${numericCash >= parseFloat(payment.amount) ? 'text-emerald-700' : 'text-red-700'}`}>
                            S/ {(numericCash - parseFloat(payment.amount)).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Botón agregar método */}
              {splitPayments.length < 3 && remaining > 0.01 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addPaymentMethod}
                  className="w-full h-9 text-xs font-bold border-dashed"
                >
                  <Plus className="w-4 h-4 mr-1.5" /> Agregar Método de Pago
                </Button>
              )}
            </div>

            {/* Resumen */}
            <div className="pt-3 border-t border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">Total pagado:</span>
                <span className={`font-bold tabular-nums ${isValidPayment ? 'text-emerald-700' : 'text-red-600'}`}>
                  S/ {totalPaid.toFixed(2)}
                </span>
              </div>
              {remaining > 0.01 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-600">Falta:</span>
                  <span className="font-bold text-amber-600 tabular-nums">S/ {remaining.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex gap-3">
            <Button
              variant="outline"
              onClick={() => setShowPayment(false)}
              disabled={isSubmitting}
              className="flex-1 h-10 text-sm font-bold"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAmortizar}
              disabled={!isValidPayment || isSubmitting}
              className="flex-1 h-10 text-sm font-bold bg-slate-900 hover:bg-slate-800"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirmar Pago'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE SOLICITUD DE TRASLADO */}
      <Dialog open={!!transferProduct} onOpenChange={() => { setTransferProduct(null); setTransferVariant(null); }}>
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
                {transferVariant?.images?.[0] || transferProduct?.images?.[0] ? (
                  <img src={transferVariant?.images?.[0] || transferProduct?.images?.[0]} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                ) : (
                  <Package className="w-5 h-5 text-slate-300" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-800 line-clamp-1">
                  {transferProduct?.title}
                  {transferVariant?.name && transferVariant.name !== 'Estándar' && <span className="text-slate-500"> ({transferVariant.name})</span>}
                </p>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">{transferVariant?.barcode || transferVariant?.sku}</p>
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
                    {transferVariant?.stock
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
            <Button variant="outline" className="flex-1 h-10 text-xs font-medium text-slate-600 border-slate-200 bg-white rounded-xl" onClick={() => { setTransferProduct(null); setTransferVariant(null); }}>
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

      {/* BANNER FLOTANTE DE CAJA CERRADA */}
      {!hasCashOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-500">
          <div className="bg-white border-2 border-slate-200 rounded-2xl shadow-xl p-5 flex items-center gap-4 min-w-[500px]">
            <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm shrink-0">
              <Wallet className="w-6 h-6 text-slate-700" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <p className="text-base font-black text-slate-900 tracking-tight">Caja Cerrada</p>
              <p className="text-xs text-slate-500 font-medium mt-0.5">Apertura tu caja para comenzar a vender</p>
            </div>
            <Button onClick={() => setShowOpenCash(true)} className="h-11 px-5 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm hover:shadow-md transition-all active:scale-95">
              <Wallet className="w-4 h-4 mr-2" /> Abrir Caja
            </Button>
          </div>
        </div>
      )}

      {/* MODAL DE APERTURA DE CAJA */}
      <Dialog open={showOpenCash} onOpenChange={setShowOpenCash}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Apertura de Caja</DialogTitle>
            <DialogDescription>Configura el monto inicial para comenzar tu turno</DialogDescription>
          </DialogHeader>
          
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                <Wallet className="w-6 h-6 text-slate-700" />
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Apertura de Caja</h2>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {isGlobalUser ? "Selecciona sucursal y monto inicial" : "Configura el monto inicial de efectivo"}
                </p>
              </div>
            </div>
          </div>

          {/* Form Content */}
          <div className="p-6 bg-white">
            <form onSubmit={handleOpenCash} className="space-y-5">
              
              {isGlobalUser && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-500" /> Sucursal
                  </Label>
                  <Select value={selectedBranch} onValueChange={setSelectedBranch} disabled={isOpeningCash}>
                    <SelectTrigger className="w-full h-11 text-sm font-semibold bg-slate-50 border-slate-200 rounded-xl focus:ring-slate-400 transition-all">
                      <SelectValue placeholder="Seleccionar sucursal..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {branches?.map(b => (
                        <SelectItem key={b.id} value={b.id} className="font-medium text-slate-700">
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-slate-500" /> Monto Inicial
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-slate-400 font-bold text-lg">S/</span>
                  </div>
                  <Input
                    type="number"
                    step="0.10"
                    min="0"
                    autoFocus={!isGlobalUser}
                    placeholder="0.00"
                    value={initialCash}
                    onChange={(e) => setInitialCash(e.target.value)}
                    className="pl-11 h-14 text-2xl font-black text-slate-900 bg-slate-50 border-slate-200 focus-visible:ring-slate-400 transition-all rounded-xl tabular-nums"
                    disabled={isOpeningCash}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setShowOpenCash(false)}
                  disabled={isOpeningCash}
                  className="flex-1 h-11 text-xs font-bold text-slate-600 border-slate-200 hover:bg-slate-50 rounded-xl transition-all"
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 h-11 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                  disabled={isOpeningCash || (isGlobalUser && !selectedBranch)}
                >
                  {isOpeningCash ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Abriendo...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar Turno</span>
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CIERRE DE CAJA */}
      <Dialog open={showCloseCash} onOpenChange={(open) => !closeResult && setShowCloseCash(open)}>
        <DialogContent className="sm:max-w-md font-sans p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Cierre de Caja</DialogTitle>
            <DialogDescription>Declara el efectivo final para cerrar tu turno</DialogDescription>
          </DialogHeader>
          
          {closeResult ? (
            // Vista de resultado - simplificada y consistente
            <>
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 border rounded-xl flex items-center justify-center shadow-sm ${Math.abs(closeResult.difference) < 0.5 ? 'bg-white border-slate-200 text-slate-700' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Turno Cerrado</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      La auditoría de caja ha concluido
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-white">
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                    <p className="text-xs font-semibold text-slate-500 mb-2">Diferencia Detectada</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 tabular-nums">
                        {closeResult.difference > 0 ? '+' : ''}{closeResult.difference < 0 ? '-' : ''}S/ {Math.abs(closeResult.difference).toFixed(2)}
                      </span>
                      <span className={`text-xs font-bold px-2 py-1 rounded-md ${Math.abs(closeResult.difference) < 0.5 ? 'bg-emerald-100 text-emerald-700' : closeResult.difference < 0 ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {Math.abs(closeResult.difference) < 0.5 ? 'Cuadrada' : closeResult.difference < 0 ? 'Faltante' : 'Sobrante'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 text-center">
                    El turno ha sido registrado correctamente en el sistema
                  </p>
                </div>

                <Button onClick={handleExitAfterClose} className="w-full h-11 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition-all active:scale-[0.98] mt-5">
                  Entendido
                </Button>
              </div>
            </>
          ) : (
            // Vista del formulario - similar al modal de apertura
            <>
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex items-center justify-center shadow-sm">
                    <LogOut className="w-6 h-6 text-slate-700" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-black text-slate-900 tracking-tight">Cerrar Turno</h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Declara el efectivo total contabilizado
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-white">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-slate-500" /> Efectivo Físico Total
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-slate-400 font-bold text-lg">S/</span>
                    </div>
                    <Input
                      type="number"
                      step="0.10"
                      placeholder="0.00"
                      className="pl-11 h-14 text-2xl font-black text-slate-900 border-slate-200 focus-visible:ring-slate-400 rounded-xl bg-slate-50 tabular-nums transition-all"
                      value={finalCash}
                      onChange={(e) => setFinalCash(e.target.value)}
                      autoFocus
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-5">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCloseCash(false)} 
                    disabled={isClosingCash} 
                    className="flex-1 h-11 text-xs font-bold text-slate-600 border-slate-200 bg-white hover:bg-slate-50 rounded-xl transition-all"
                  >
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCloseCash} 
                    disabled={!finalCash || isClosingCash} 
                    className="flex-1 h-11 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-sm rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    {isClosingCash ? (
                      <>
                        <Loader2 className="animate-spin w-4 h-4" />
                        <span>Cerrando...</span>
                      </>
                    ) : (
                      <>
                        <span>Cerrar Turno</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE HISTORIAL DE VENTAS DEL TURNO */}
      <SalesHistoryModal 
        isOpen={showSalesHistory}
        onClose={() => setShowSalesHistory(false)}
        salesData={salesData}
      />

      {/* MODAL DE TRANSACCIONES DE CAJA */}
      {cashSession && (
        <CashTransactionModal
          isOpen={showCashTransaction}
          onClose={() => setShowCashTransaction(false)}
          onSuccess={() => {
            mutateCash();
            toast.success('Transacción registrada');
          }}
          cashSessionId={cashSession.id}
        />
      )}

      {/* MODAL DE REGISTRO DE CLIENTES */}
      <CustomerModal
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        onSuccess={(customer) => {
          setFoundCustomer(customer);
          toast.success(`Cliente ${customer.name} registrado y vinculado`);
        }}
      />

      {/* MODAL DE BÚSQUEDA DE CLIENTES */}
      <CustomerSearchModal
        isOpen={showCustomerSearch}
        onClose={() => setShowCustomerSearch(false)}
        onSelectCustomer={(customer) => {
          setFoundCustomer(customer);
          toast.success(`Cliente ${customer.name} vinculado a la venta`);
        }}
        onCreateNew={() => {
          setShowCustomerModal(true);
        }}
      />

      {/* MODAL DE DESCUENTO */}
      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        currentType={globalDiscountType}
        currentValue={globalDiscountValue}
        onApply={(type, value) => {
          setGlobalDiscountType(type);
          setGlobalDiscountValue(value);
          if (value && parseFloat(value) > 0) {
            toast.success('Descuento aplicado');
          }
        }}
        subtotal={itemsSubtotal}
      />

      {/* MODAL DE TICKET DE VENTA */}
      {ticketData && showTicketModal && (
        <TicketPrint
          saleData={ticketData}
          onComplete={() => {
            setShowTicketModal(false);
            toast.success('Ticket generado');
          }}
        />
      )}
      </div>
    </div>
  );
}