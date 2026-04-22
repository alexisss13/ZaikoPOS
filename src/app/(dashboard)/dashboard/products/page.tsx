// src/app/(dashboard)/dashboard/products/page.tsx
'use client';

/**
 * OPTIMIZACIONES DE RENDIMIENTO MÓVIL:
 * 
 * 1. Peticiones en PARALELO (no en cascada):
 *    - Todas las APIs (products, branches, categories, suppliers) se cargan simultáneamente
 *    - Antes: products → branches → categories (3 pasos secuenciales)
 *    - Ahora: products + branches + categories (1 paso paralelo)
 * 
 * 2. Pre-cálculo de metadata (useMemo):
 *    - Permisos (canEditThis, isGlobal, isMine, hasMyStock) se calculan UNA VEZ
 *    - Stock total y visible se pre-calcula
 *    - Evita recalcular en cada render/filtro
 * 
 * 3. Filtrado optimizado:
 *    - Usa Map() para búsquedas O(1) en lugar de .find() O(n)
 *    - Filtros de búsqueda solo se aplican si hay texto
 *    - Usa metadata pre-calculada en lugar de recalcular
 * 
 * 4. Render sin cálculos:
 *    - Vista móvil y desktop usan metadata pre-calculada
 *    - No hay cálculos de permisos en el .map()
 *    - Reduce carga del hilo principal durante el render
 */

import useSWR from 'swr';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  Plus, Search, Package, Image as ImageIcon, Barcode as BarcodeIcon,
  ChevronLeft, ChevronRight, Download, Filter, LayoutGrid, Store, Globe,
  PowerOff, Check, Banknote, Tags, FileText, ChevronDown, X,
  SlidersHorizontal, MoreHorizontal, RefreshCw
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Barcode from 'react-barcode';
import { useAuth } from '@/context/auth-context';
import { useResponsive } from '@/hooks/useResponsive';
import { ProductCard } from '@/components/dashboard/products/ProductCard';
import { SearchBar } from '@/components/dashboard/products/SearchBar';
import { MobileProductList } from '@/components/dashboard/products/MobileProductList';
import { useProductExports } from '@/components/dashboard/products/useProductExports';
import { ProductsLoadingSkeleton } from '@/components/dashboard/products/ProductsLoadingSkeleton';
import type { Product, Branch, Category } from '@/components/dashboard/products/types';

// ── Lazy-load modales pesados (no se descargan hasta que se abren) ──
const ProductModal = dynamic(() => import('@/components/dashboard/ProductModal').then(m => ({ default: m.ProductModal })), { ssr: false });
const CategoryModal = dynamic(() => import('@/components/dashboard/CategoryModal').then(m => ({ default: m.CategoryModal })), { ssr: false });
const ImportProductsModal = dynamic(() => import('@/components/dashboard/ImportProductsModal').then(m => ({ default: m.ImportProductsModal })), { ssr: false });
const BarcodeGeneratorModal = dynamic(() => import('@/components/dashboard/BarcodeGeneratorModal').then(m => ({ default: m.BarcodeGeneratorModal })), { ssr: false });

const fetcher = (url: string) => fetch(url).then(r => r.json());
const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };
const MOBILE_PAGE_SIZE = 8;
const ITEMS_PER_PAGE = 8;

export default function ProductsPage() {
  const { user, role } = useAuth();
  const { isMobile } = useResponsive();
  const permissions = user?.permissions || {};
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  const canManageGlobal = isSuperOrOwner || !!permissions.canManageGlobalProducts;
  const canCreate = isSuperOrOwner || !!permissions.canCreateProducts || canManageGlobal;
  const canEdit = isSuperOrOwner || !!permissions.canEditProducts || canManageGlobal;
  const canViewOthers = isSuperOrOwner || !!permissions.canViewOtherBranches || canManageGlobal;

  // ⚡ OPTIMIZACIÓN 1: Cargar TODAS las peticiones en PARALELO (no en cascada)
  const { data: products, isLoading: isLoadingProducts, mutate } = useSWR<Product[]>('/api/products', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  });
  
  // Cargar branches, categories y suppliers EN PARALELO (sin esperar a products)
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
  });
  
  const { data: categories, mutate: mutateCategories } = useSWR<Category[]>('/api/categories', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
  });
  
  const { data: suppliers } = useSWR('/api/suppliers', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
  });

  // Mostrar loading solo si productos están cargando
  const isLoading = isLoadingProducts;

  // ⚡ OPTIMIZACIÓN CARGA INICIAL: Mostrar productos básicos INMEDIATAMENTE
  // Diferir cálculos pesados hasta después del primer render
  const [isInitialRender, setIsInitialRender] = useState(true);
  
  useEffect(() => {
    if (products && isInitialRender) {
      // Diferir cálculos pesados al siguiente tick para no bloquear el primer render
      const timer = setTimeout(() => {
        setIsInitialRender(false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [products, isInitialRender]);

  // Memoizar cálculos de branches
  const { myBranch, myCode, uniqueCodes, visibleCodes } = useMemo(() => {
    const myBranch = branches?.find(b => b.id === user?.branchId);
    const myCode = myBranch?.ecommerceCode;
    const uniqueCodes = Array.from(new Set(branches?.map(b => b.ecommerceCode).filter(Boolean))) as string[];
    const visibleCodes = canViewOthers ? uniqueCodes : uniqueCodes.filter(c => c === myCode);
    return { myBranch, myCode, uniqueCodes, visibleCodes };
  }, [branches, user?.branchId, canViewOthers]);

  // ── Filtros ──
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  const [showCatFilter, setShowCatFilter] = useState(false);
  const [showStockFilter, setShowStockFilter] = useState(false);

  // ── UI state ──
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isBarcodeModalOpen, setIsBarcodeModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [canEditSelected, setCanEditSelected] = useState(false);
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [kardexProduct, setKardexProduct] = useState<Product | null>(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);
  const [kardexMovements, setKardexMovements] = useState<any[]>([]);

  const ticketRef = useRef<HTMLDivElement>(null);

  // ── Exports hook ──
  const { exportToExcel, exportToPDF, exportKardexToExcel, exportKardexToPDF } = useProductExports({ products, branches });

  // ⚡ OPTIMIZACIÓN: Callback para SearchBar (evita re-renders del padre al escribir)
  const handleSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value);
    setCurrentPage(1);
  }, []);

  useEffect(() => { setVisibleCount(MOBILE_PAGE_SIZE); }, [codeFilter, categoryFilter, stockFilter, debouncedSearch]);

  // ── Pull-to-refresh OPTIMIZADO (sin causar re-renders masivos) ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef(0);
  const pullDistanceRef = useRef(0); // Usar ref en lugar de state para evitar re-renders
  const rafIdRef = useRef<number | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updatePullIndicator = useCallback(() => {
    const indicator = document.getElementById('pull-indicator');
    if (indicator) {
      const distance = pullDistanceRef.current;
      indicator.style.height = `${Math.min(distance, 56)}px`;
      indicator.style.opacity = distance > 0 ? '1' : '0';
      
      const icon = indicator.querySelector('.refresh-icon');
      if (icon) {
        if (distance >= 60) {
          icon.classList.add('text-slate-900');
          icon.classList.remove('text-slate-400');
        } else {
          icon.classList.remove('text-slate-900');
          icon.classList.add('text-slate-400');
        }
      }
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullStartY.current) return;
    
    const dist = Math.max(0, Math.min(80, e.touches[0].clientY - pullStartY.current));
    
    if (dist > 0 && scrollRef.current?.scrollTop === 0) {
      // Usar requestAnimationFrame para actualizar la UI sin causar re-renders
      pullDistanceRef.current = dist;
      
      if (!isPulling) setIsPulling(true);
      
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(updatePullIndicator);
    }
  }, [isPulling, updatePullIndicator]);

  const handleTouchEnd = useCallback(async () => {
    const distance = pullDistanceRef.current;
    
    if (distance >= 60 && !isRefreshing) {
      setIsRefreshing(true);
      try { navigator.vibrate?.(20); } catch {}
      await mutate();
      setTimeout(() => {
        setIsRefreshing(false);
        setIsPulling(false);
        pullStartY.current = 0;
        pullDistanceRef.current = 0;
        updatePullIndicator();
      }, 600);
    } else {
      setIsPulling(false);
      pullStartY.current = 0;
      pullDistanceRef.current = 0;
      updatePullIndicator();
    }
  }, [isRefreshing, mutate, updatePullIndicator]);

  // ── Helpers ──
  const getBranchByCode = useCallback((code: string) => branches?.find(b => b.ecommerceCode === code), [branches]);

  // ⚡ OPTIMIZACIÓN: toggleCard removido - cada ProductCard maneja su propio estado de expansión

  const openKardexModal = useCallback(async (product: Product) => {
    setKardexProduct(product); setIsKardexModalOpen(true);
    try {
      const variantId = product.variants?.[0]?.id;
      if (!variantId) { setKardexMovements([]); return; }
      const data = await fetch(`/api/inventory/movements?variantId=${variantId}`).then(r => r.json());
      setKardexMovements(data || []);
    } catch { setKardexMovements([]); }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('🛑 ¿Dar de baja este producto? No aparecerá en ventas, pero podrás reactivarlo desde el filtro "Inactivos".')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Producto dado de baja (Inactivo)'); setIsModalOpen(false); mutate();
    } catch { toast.error('Error inesperado'); }
  }, [mutate]);

  const downloadBarcodePNG = useCallback(async () => {
    if (!barcodeProduct || !ticketRef.current) return;
    try {
      toast.loading('Generando etiqueta...', { id: 'barcode-toast' });
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(ticketRef.current, { pixelRatio: 5, backgroundColor: '#ffffff', skipFonts: true });
      const link = document.createElement('a');
      link.download = `etiqueta-${barcodeProduct.barcode || barcodeProduct.code || 'producto'}.png`;
      link.href = dataUrl; link.click();
      toast.success('Etiqueta descargada', { id: 'barcode-toast' });
    } catch { toast.error('Error al generar la imagen.', { id: 'barcode-toast' }); }
  }, [barcodeProduct]);

  // ── Filtrado ──
  // ⚡ OPTIMIZACIÓN 2: Pre-calcular permisos y datos de productos UNA SOLA VEZ
  const productsWithMetadata = useMemo(() => {
    if (!products) return [];
    
    // Si es el primer render, usar cálculos mínimos para mostrar rápido
    if (isInitialRender) {
      return products.slice(0, MOBILE_PAGE_SIZE).map(p => ({
        ...p,
        _meta: {
          isGlobal: !p.branchOwnerId,
          isMine: p.branchOwnerId === user?.branchId,
          hasMyStock: false, // Simplificado para primer render
          canEditThis: canEdit, // Simplificado para primer render
          totalStock: 0, // Simplificado para primer render
          visibleStocks: [],
        }
      }));
    }
    
    // Cálculos completos solo después del primer render
    const branchByCode = new Map(branches?.map(b => [b.ecommerceCode, b]) || []);
    
    return products.map(p => {
      const isGlobal = !p.branchOwnerId;
      const isMine = p.branchOwnerId === user?.branchId;
      const hasMyStock = p.branchStocks?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;
      
      // Calcular permisos UNA VEZ
      let canEditThis = false;
      if (canManageGlobal) canEditThis = true;
      else if (canEdit && (isGlobal || isMine || hasMyStock)) canEditThis = true;
      
      // Pre-calcular stocks visibles
      const visibleStocks = canViewOthers ? (p.branchStocks || []) : (p.branchStocks?.filter(bs => bs.branchId === user?.branchId) || []);
      const totalStock = visibleStocks.reduce((s, bs) => s + bs.quantity, 0);
      
      return {
        ...p,
        _meta: {
          isGlobal,
          isMine,
          hasMyStock,
          canEditThis,
          totalStock,
          visibleStocks,
        }
      };
    });
  }, [products, branches, user?.branchId, canManageGlobal, canEdit, canViewOthers, isInitialRender]);

  // ⚡ OPTIMIZACIÓN: Filtrado base UNA SOLA VEZ (evitar doble iteración)
  const baseFilteredProducts = useMemo(() => {
    if (!productsWithMetadata.length) return [];
    
    // En el primer render, mostrar productos básicos sin filtros complejos
    if (isInitialRender) {
      return productsWithMetadata.filter(p => p.active); // Solo filtro básico
    }
    
    // Filtros completos solo después del primer render
    const branchByCode = new Map(branches?.map(b => [b.ecommerceCode, b]) || []);
    
    return productsWithMetadata.filter(p => {
      const { isGlobal, isMine, hasMyStock } = p._meta;
      
      // Filtro de permisos (común para categorías y productos)
      if (!isSuperOrOwner && !canViewOthers && !canManageGlobal && !isGlobal && !isMine && !hasMyStock) {
        return false;
      }
      
      // Filtro de activos/inactivos
      if (codeFilter === 'INACTIVE') return !p.active;
      if (!p.active) return false;
      
      // Filtro de código/sucursal
      if (codeFilter === 'GENERAL') {
        const bws = p.branchStocks?.filter(bs => bs.quantity > 0) || [];
        return isGlobal || bws.length > 1;
      } else if (codeFilter !== 'ALL') {
        const b = branchByCode.get(codeFilter);
        return b ? p.branchOwnerId === b.id : true;
      }
      
      return true;
    });
  }, [productsWithMetadata, codeFilter, branches, isSuperOrOwner, canViewOthers, canManageGlobal, isInitialRender]);

  // Calcular categorías disponibles usando la lista base (sin re-filtrar)
  const availableCategories = useMemo(() => {
    if (!categories || !baseFilteredProducts.length) return [];
    
    const ids = new Set(baseFilteredProducts.map(p => p.categoryId));
    return categories.filter(c => ids.has(c.id));
  }, [baseFilteredProducts, categories]);

  // ⚡ OPTIMIZACIÓN 3: Filtrado final usando la lista base (sin re-calcular permisos)
  const filteredProducts = useMemo(() => {
    if (!baseFilteredProducts.length) return [];
    
    const q = debouncedSearch.toLowerCase();
    
    return baseFilteredProducts.filter(p => {
      const { totalStock } = p._meta;
      
      // Filtro de búsqueda (solo si hay texto)
      if (q) {
        const matchesSearch = p.title.toLowerCase().includes(q) || 
                            (p.barcode?.includes(debouncedSearch) ?? false) || 
                            (p.sku?.toLowerCase().includes(q) ?? false);
        if (!matchesSearch) return false;
      }
      
      // Filtro de categoría
      if (categoryFilter !== 'ALL' && p.categoryId !== categoryFilter) return false;
      
      // Filtro de stock
      if (stockFilter !== 'ALL') {
        const min = p.minStock || 5;
        if (stockFilter === 'LOW' && (totalStock <= 0 || totalStock > min)) return false;
        if (stockFilter === 'OUT' && totalStock > 0) return false;
      }
      
      return true;
    });
  }, [baseFilteredProducts, debouncedSearch, categoryFilter, stockFilter]);

  // Memoizar cálculos de paginación
  const { totalPages, paginatedProducts, mobileProducts, hasMore } = useMemo(() => {
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const mobileProducts = filteredProducts.slice(0, visibleCount);
    const hasMore = visibleCount < filteredProducts.length;
    return { totalPages, paginatedProducts, mobileProducts, hasMore };
  }, [filteredProducts, currentPage, visibleCount]);

  const handleOpenEdit = useCallback((product: Product | (Product & { _meta?: any })) => {
    // Si el producto ya tiene metadata, usarla; si no, calcular
    let canEditThis = false;
    
    if ('_meta' in product && product._meta) {
      canEditThis = product._meta.canEditThis;
    } else {
      const isGlobal = !product.branchOwnerId;
      const isMine = product.branchOwnerId === user?.branchId;
      const hasMyStock = product.branchStocks?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;
      
      if (canManageGlobal) canEditThis = true;
      else if (canEdit && (isGlobal || isMine || hasMyStock)) canEditThis = true;
    }
    
    haptic(8); 
    setSelectedProduct(product); 
    setCanEditSelected(canEditThis); 
    setIsModalOpen(true);
  }, [canManageGlobal, canEdit, user?.branchId]);

  // ── Pantalla de carga inicial en móvil ──
  if (isMobile && isLoading) {
    return (
      <div className="flex flex-col h-full w-full gap-5" style={{ willChange: 'auto' }}>
        {/* Header simplificado durante carga */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">Productos</h1>
              <p className="text-xs text-slate-400 mt-0.5">Cargando...</p>
            </div>
          </div>
        </div>
        <ProductsLoadingSkeleton />
      </div>
    );
  }

  // Si no hay productos pero ya terminó de cargar, mostrar mensaje
  if (isMobile && !isLoading && !products) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 p-6">
        <Package className="w-16 h-16 text-slate-300" />
        <p className="text-sm text-slate-500 text-center">No se pudieron cargar los productos</p>
        <Button onClick={() => mutate()} className="mt-2">Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full gap-5" style={{ willChange: 'auto' }}>

      {/* ── HEADER MÓVIL ── */}
      {isMobile ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">Productos</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                {filteredProducts.length} resultado{filteredProducts.length !== 1 ? 's' : ''}
                {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && <span className="ml-1 text-slate-500">· filtrado</span>}
              </p>
            </div>

            <button
              onClick={() => setShowMobileFilters(true)}
              className={`relative flex items-center gap-1.5 h-10 px-3 rounded-xl border font-semibold text-sm ${codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white text-slate-600 border-slate-200'}`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-xs">Filtros</span>
              {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {[codeFilter !== 'ALL', categoryFilter !== 'ALL', stockFilter !== 'ALL'].filter(Boolean).length}
                </span>
              )}
            </button>

            {canCreate && (
              <Button onClick={() => { setSelectedProduct(null); setCanEditSelected(true); setIsModalOpen(true); }} className="h-10 w-10 p-0 bg-slate-900 hover:bg-slate-800 text-white shadow-md rounded-xl shrink-0">
                <Plus className="w-5 h-5" />
              </Button>
            )}

            {canCreate && (
              <div className="relative">
                <button onClick={() => setShowExportMenu(v => !v)} className="h-10 w-10 p-0 flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shrink-0">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                {showExportMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} />
                    <div className="absolute right-0 top-12 w-44 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50">
                      <button onClick={() => { setShowExportMenu(false); setIsCategoryModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><Tags className="w-4 h-4 text-slate-400" /> Categorías</button>
                      <button onClick={() => { setShowExportMenu(false); setIsImportModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><FileText className="w-4 h-4 text-slate-400" /> Importar</button>
                      <button onClick={() => { setShowExportMenu(false); setIsBarcodeModalOpen(true); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><BarcodeIcon className="w-4 h-4 text-slate-400" /> Códigos</button>
                      <div className="h-px bg-slate-100 mx-2 my-1" />
                      <button onClick={() => { setShowExportMenu(false); exportToExcel(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4 text-slate-400" /> Excel</button>
                      <button onClick={() => { setShowExportMenu(false); exportToPDF(); }} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"><Download className="w-4 h-4 text-slate-400" /> PDF</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Buscador - Componente aislado para evitar re-renders */}
          <SearchBar 
            onSearchChange={handleSearchChange}
            placeholder="Nombre, SKU o código de barras..."
            debounceMs={200}
          />

          {/* Chips activos */}
          {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
            <div className="flex gap-1.5 flex-wrap">
              {codeFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900 text-white text-xs font-semibold rounded-full">
                  {codeFilter === 'GENERAL' ? 'Compartidos' : codeFilter === 'INACTIVE' ? 'Inactivos' : getBranchByCode(codeFilter)?.name || codeFilter}
                  <button onClick={() => { setCodeFilter('ALL'); setCategoryFilter('ALL'); setCurrentPage(1); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              {categoryFilter !== 'ALL' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-700 text-white text-xs font-semibold rounded-full">
                  {availableCategories.find(c => c.id === categoryFilter)?.name || 'Categoría'}
                  <button onClick={() => { setCategoryFilter('ALL'); setCurrentPage(1); }}><X className="w-3 h-3" /></button>
                </span>
              )}
              {stockFilter !== 'ALL' && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${stockFilter === 'LOW' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'}`}>
                  {stockFilter === 'LOW' ? 'Stock bajo' : 'Agotados'}
                  <button onClick={() => { setStockFilter('ALL'); setCurrentPage(1); }}><X className="w-3 h-3" /></button>
                </span>
              )}
            </div>
          )}

          {/* Sheet filtros */}
          <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
            <SheetContent side="bottom" className="rounded-t-3xl px-0 pb-10 max-h-[85vh] overflow-y-auto">
              <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-slate-200" /></div>
              <SheetHeader className="px-6 pt-3 pb-0">
                <SheetTitle className="text-xl font-black text-slate-900 text-left">Filtros</SheetTitle>
              </SheetHeader>
              <div className="px-6 pt-5 space-y-7">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Catálogo</p>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { value: 'ALL', label: 'Todos', icon: <LayoutGrid className="w-4 h-4" /> },
                      { value: 'GENERAL', label: 'Compartidos', icon: <Globe className="w-4 h-4" /> },
                      ...visibleCodes.map(code => { const b = getBranchByCode(code); return { value: code, label: b?.name || code, icon: b?.logoUrl ? <img src={b.logoUrl} className="w-4 h-4 rounded-sm object-cover" alt="" /> : <Store className="w-4 h-4" /> }; }),
                      { value: 'INACTIVE', label: 'Inactivos', icon: <PowerOff className="w-4 h-4" /> },
                    ].map(opt => (
                      <button key={opt.value} onClick={() => { haptic(8); setCodeFilter(opt.value); setCategoryFilter('ALL'); setCurrentPage(1); }}
                        className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-transform ${codeFilter === opt.value ? (opt.value === 'INACTIVE' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-slate-900 text-white border-slate-900 shadow-sm') : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {opt.icon}{opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                {availableCategories.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Categoría</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button onClick={() => { haptic(8); setCategoryFilter('ALL'); setCurrentPage(1); }} className={`px-4 py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-transform ${categoryFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>Todas</button>
                      {availableCategories.map(cat => (
                        <button key={cat.id} onClick={() => { haptic(8); setCategoryFilter(cat.id); setCurrentPage(1); }} className={`px-4 py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-transform truncate ${categoryFilter === cat.id ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>{cat.name}</button>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Estado de stock</p>
                  <div className="grid grid-cols-3 gap-2.5">
                    <button onClick={() => { haptic(8); setStockFilter('ALL'); setCurrentPage(1); }} className={`py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-transform ${stockFilter === 'ALL' ? 'bg-slate-900 text-white border-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>Todos</button>
                    <button onClick={() => { haptic(8); setStockFilter('LOW'); setCurrentPage(1); }} className={`py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-transform ${stockFilter === 'LOW' ? 'bg-amber-500 text-white border-amber-500 shadow-sm' : 'bg-amber-50 text-amber-600 border-amber-200'}`}>Stock bajo</button>
                    <button onClick={() => { haptic(8); setStockFilter('OUT'); setCurrentPage(1); }} className={`py-3.5 rounded-2xl text-sm font-semibold border active:scale-95 transition-transform ${stockFilter === 'OUT' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-red-50 text-red-600 border-red-200'}`}>Agotados</button>
                  </div>
                </div>
                <div className="flex gap-3 pt-1">
                  {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL') && (
                    <button onClick={() => { haptic(15); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); setDebouncedSearch(''); setCurrentPage(1); }} className="flex-1 py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-bold text-slate-600 active:scale-95 transition-transform">Limpiar filtros</button>
                  )}
                  <button onClick={() => { haptic(8); setShowMobileFilters(false); }} className="flex-1 py-3.5 rounded-2xl bg-slate-900 text-white text-sm font-bold active:scale-95 transition-transform">Aplicar</button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      ) : (
        /* ── TOOLBAR DESKTOP ── */
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
          <div className="flex items-center gap-2.5 shrink-0">
            <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Productos</h1>
            <Package className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
              <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
                <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
              </div>
              <div className="w-full">
                <SearchBar 
                  onSearchChange={handleSearchChange}
                  placeholder="Buscar producto, SKU..."
                  debounceMs={200}
                  className="w-full"
                  inputClassName="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm"
                />
              </div>
            </div>
            {canCreate && (
              <>
                <Button onClick={() => setIsCategoryModalOpen(true)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"><Tags className="w-3.5 h-3.5 mr-1.5" /><span className="font-bold">Categorías</span></Button>
                <Button onClick={() => setIsImportModalOpen(true)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"><FileText className="w-3.5 h-3.5 mr-1.5" /><span className="font-bold">Importar</span></Button>
                <div className="relative">
                  <Button onClick={() => setShowExportMenu(!showExportMenu)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"><Download className="w-3.5 h-3.5 mr-1.5" /><span className="font-bold">Exportar</span></Button>
                  {showExportMenu && (<><div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)} /><div className="absolute right-0 top-12 w-40 bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"><button onClick={() => exportToExcel(() => setShowExportMenu(false))} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors flex items-center gap-2"><Download className="w-3.5 h-3.5" />Excel</button><button onClick={() => exportToPDF(() => setShowExportMenu(false))} className="w-full text-left px-3 py-2 rounded-lg text-xs font-bold text-slate-700 hover:bg-red-50 hover:text-red-700 transition-colors flex items-center gap-2"><Download className="w-3.5 h-3.5" />PDF</button></div></>)}
                </div>
                <Button onClick={() => setIsBarcodeModalOpen(true)} variant="ghost" className="h-9 text-xs bg-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900 px-4 rounded-lg transition-all shrink-0 border border-transparent hover:border-slate-200"><BarcodeIcon className="w-3.5 h-3.5 mr-1.5" /><span className="font-bold">Códigos</span></Button>
                <Button onClick={() => { setSelectedProduct(null); setCanEditSelected(true); setIsModalOpen(true); }} className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0"><Plus className="w-4 h-4 mr-1.5" /><span className="font-bold">Nuevo Producto</span></Button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── VISTA MÓVIL ── */}
      {isMobile ? (
        <div ref={scrollRef} className="flex flex-col flex-1 gap-2.5 overflow-y-auto pb-24" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd} style={{ overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch', willChange: 'scroll-position' }}>
          {/* Pull-to-refresh - Optimizado con CSS y refs */}
          <div 
            id="pull-indicator"
            className="flex items-center justify-center overflow-hidden transition-all duration-200" 
            style={{ 
              height: 0,
              opacity: 0,
              willChange: 'height, opacity'
            }}
          >
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
              <div className={`refresh-icon w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin text-slate-700' : ''}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/>
                </svg>
              </div>
              {isRefreshing ? 'Actualizando...' : isPulling ? 'Suelta para actualizar' : 'Desliza para actualizar'}
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2.5">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-3xl border border-slate-100 p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-14 h-14 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <Skeleton className="h-4 w-3/4 rounded-lg" />
                      <Skeleton className="h-3 w-1/3 rounded-lg" />
                      <div className="flex items-center gap-2 pt-1"><Skeleton className="h-5 w-20 rounded-lg" /><Skeleton className="h-5 w-14 rounded-full" /></div>
                    </div>
                    <Skeleton className="w-4 h-4 rounded-full shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          ) : mobileProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <div className="relative mb-5">
                <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center">
                  <Package className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
                </div>
                {(codeFilter !== 'ALL' || categoryFilter !== 'ALL' || stockFilter !== 'ALL' || debouncedSearch) && (
                  <div className="absolute -top-1 -right-1 w-7 h-7 bg-slate-900 rounded-full flex items-center justify-center">
                    <Filter className="w-3.5 h-3.5 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1">{codeFilter === 'INACTIVE' ? 'Sin productos inactivos' : debouncedSearch ? `Sin resultados para "${debouncedSearch}"` : 'Sin productos aquí'}</h3>
              <p className="text-sm text-slate-400 mb-5 leading-relaxed">{codeFilter === 'INACTIVE' ? 'Todos los productos están activos.' : debouncedSearch ? 'Prueba con otro nombre, SKU o código.' : 'Ajusta los filtros o crea un nuevo producto.'}</p>
              <button onClick={() => { setDebouncedSearch(''); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); haptic(); }} className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-sm font-bold active:scale-95 transition-transform">Limpiar filtros</button>
            </div>
          ) : (
            <>
              {/* ⚡ OPTIMIZACIÓN: Lista memoizada - no re-renderiza al abrir filtros */}
              <MobileProductList
                products={mobileProducts}
                branches={branches}
                canViewOthers={canViewOthers}
                userBranchId={user?.branchId}
                onEdit={handleOpenEdit}
                onKardex={openKardexModal}
                isInitialRender={isInitialRender}
              />
              {hasMore && (
                <button onClick={() => { haptic(8); setVisibleCount(v => v + MOBILE_PAGE_SIZE); }} className="w-full py-3.5 rounded-2xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 active:scale-[0.98] transition-transform flex items-center justify-center gap-2">
                  <ChevronDown className="w-4 h-4" /> Cargar más · {filteredProducts.length - visibleCount} restantes
                </button>
              )}
              {!hasMore && mobileProducts.length > MOBILE_PAGE_SIZE && (
                <p className="text-center text-xs text-slate-300 py-3 font-medium">· {filteredProducts.length} productos ·</p>
              )}
            </>
          )}
        </div>
      ) : (

      /* ── VISTA DESKTOP ── */
      <div className="flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 w-full shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button onClick={() => { setCodeFilter('ALL'); setCurrentPage(1); setCategoryFilter('ALL'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}><LayoutGrid className="w-3.5 h-3.5" /> Todos</button>
            <button onClick={() => { setCodeFilter('GENERAL'); setCurrentPage(1); setCategoryFilter('ALL'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'GENERAL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}><Globe className="w-3.5 h-3.5" /> Compartidos</button>
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />
            {visibleCodes.map(code => {
              const b = getBranchByCode(code); const isActive = codeFilter === code;
              return (
                <button key={code} onClick={() => { setCodeFilter(code); setCurrentPage(1); setCategoryFilter('ALL'); }} className={`group px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${isActive ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                  {b?.logoUrl ? <img src={b.logoUrl} className={`w-4 h-4 rounded-[3px] object-cover transition-all ${isActive ? 'bg-white p-[1.5px]' : 'grayscale mix-blend-multiply group-hover:brightness-0'}`} alt="" /> : <Store className="w-3.5 h-3.5 text-current" />}
                  {b?.name || code}
                </button>
              );
            })}
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />
            <button onClick={() => { setCodeFilter('INACTIVE'); setCurrentPage(1); setCategoryFilter('ALL'); }} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'INACTIVE' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-slate-500 hover:text-red-700 hover:bg-red-50'}`}><PowerOff className="w-3.5 h-3.5" /> Inactivos</button>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">Pág {currentPage} de {totalPages}</span>
              <div className="flex gap-1.5">
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
              </div>
            </div>
          )}
        </div>

        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          {(showCatFilter || showStockFilter) && <div className="fixed inset-0 z-20" onClick={() => { setShowCatFilter(false); setShowStockFilter(false); }} />}
          <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30 overflow-hidden">
              <tr>
                <th className="px-5 py-3.5 font-semibold rounded-tl-xl">Producto</th>
                <th className="px-5 py-3.5 font-semibold relative select-none w-[200px]">
                  <div className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${categoryFilter !== 'ALL' || showCatFilter ? 'text-slate-900 bg-slate-100' : ''}`} onClick={() => { setShowCatFilter(!showCatFilter); setShowStockFilter(false); }}>
                    Categoría y Catálogo <Filter className={`w-3.5 h-3.5 ${categoryFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                  </div>
                  {showCatFilter && (
                    <div className="absolute top-10 left-3 w-[220px] bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar">
                      <button onClick={() => { setCategoryFilter('ALL'); setShowCatFilter(false); setCurrentPage(1); }} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${categoryFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>Todas las categorías {categoryFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}</button>
                      <div className="h-px bg-slate-100 my-1 mx-2" />
                      {availableCategories.length === 0 && <div className="px-3 py-2 text-xs text-slate-400 text-center italic">Sin categorías aquí</div>}
                      {availableCategories.map(cat => (
                        <button key={cat.id} onClick={() => { setCategoryFilter(cat.id); setShowCatFilter(false); setCurrentPage(1); }} className={`text-left px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors flex items-center justify-between ${categoryFilter === cat.id ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <span className="truncate pr-2">{cat.name}</span>{categoryFilter === cat.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </th>
                <th className="px-5 py-3.5 font-semibold w-[120px]">Precio (S/)</th>
                <th className="px-5 py-3.5 font-semibold relative select-none w-[150px]">
                  <div className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${stockFilter !== 'ALL' || showStockFilter ? 'text-slate-900 bg-slate-100' : ''}`} onClick={() => { setShowStockFilter(!showStockFilter); setShowCatFilter(false); }}>
                    Inventario <Filter className={`w-3.5 h-3.5 ${stockFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                  </div>
                  {showStockFilter && (
                    <div className="absolute top-10 left-3 w-[160px] bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => { setStockFilter('ALL'); setShowStockFilter(false); setCurrentPage(1); }} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${stockFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>Todo el Stock {stockFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => { setStockFilter('LOW'); setShowStockFilter(false); setCurrentPage(1); }} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${stockFilter === 'LOW' ? 'bg-amber-50 text-amber-700' : 'text-amber-600 hover:bg-amber-50/50'}`}>Stock Bajo {stockFilter === 'LOW' && <Check className="w-3.5 h-3.5" />}</button>
                      <button onClick={() => { setStockFilter('OUT'); setShowStockFilter(false); setCurrentPage(1); }} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${stockFilter === 'OUT' ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50/50'}`}>Agotados {stockFilter === 'OUT' && <Check className="w-3.5 h-3.5" />}</button>
                    </div>
                  )}
                </th>
                <th className="px-5 py-3.5 font-semibold w-[80px] rounded-tr-xl text-center">Kardex</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => (<tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>))
              ) : paginatedProducts.length === 0 ? (
                <tr><td colSpan={5} className="py-20 text-center"><div className="flex flex-col items-center justify-center text-slate-400 space-y-2"><Package className="w-10 h-10 text-slate-200" strokeWidth={1} /><p className="font-medium text-sm text-slate-500">{codeFilter === 'INACTIVE' ? 'No hay productos inactivos.' : 'No se encontraron productos.'}</p><Button variant="link" className="text-xs h-6 text-slate-900 font-bold" onClick={() => { setDebouncedSearch(''); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); }}>Limpiar filtros</Button></div></td></tr>
              ) : (
                paginatedProducts.map(product => {
                  // ⚡ OPTIMIZACIÓN 5: Usar metadata pre-calculada en desktop
                  const { canEditThis, visibleStocks, totalStock } = product._meta;
                  const totalPhysicalStock = totalStock;
                  const hasWholesale = Number(product.wholesalePrice) > 0;
                  const isGlobal = product._meta.isGlobal;
                  
                  return (
                    <tr key={product.id} onClick={() => { setSelectedProduct(product); setCanEditSelected(canEditThis); setIsModalOpen(true); }} className={`hover:bg-slate-50 transition-colors group text-xs cursor-pointer ${!product.active ? 'opacity-60 bg-slate-50/50' : ''}`}>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center ${!product.active ? 'grayscale' : ''}`}>
                            {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" /> : <ImageIcon className="w-4 h-4 text-slate-300" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-700 truncate leading-tight group-hover:text-slate-900 transition-colors text-sm">{product.title}</p>
                              {!product.active && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5 leading-none bg-red-100 text-red-700 border-none shadow-none">INACTIVO</Badge>}
                            </div>
                            {(product.barcode || product.code) && <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1"><BarcodeIcon className="w-3 h-3" /> {product.barcode || product.code}</div>}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="font-medium text-slate-500 truncate max-w-[140px] leading-none group-hover:text-slate-700 transition-colors">{product.category?.name || 'Sin Categoría'}</span>
                          {(() => {
                            const bws = product.branchStocks?.filter(bs => bs.quantity > 0) || [];
                            const ob = product.branchOwnerId ? branches?.find(b => b.id === product.branchOwnerId) : null;
                            if (bws.length > 1) return <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1.5 leading-none border border-slate-200 px-1.5 py-0.5 rounded-md bg-slate-50 w-max">{ob?.logoUrl ? <img src={ob.logoUrl} className="w-3.5 h-3.5 rounded-[2px] object-cover grayscale mix-blend-multiply" alt="" /> : <Store className="w-3 h-3 text-slate-400" />}{ob?.name || 'Sucursal'}<Globe className="w-2.5 h-2.5 text-slate-400 ml-0.5" /></span>;
                            if (product.branchOwnerId) return <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 w-max leading-none">{ob?.logoUrl ? <img src={ob.logoUrl} className="w-3.5 h-3.5 rounded-[2px] object-cover grayscale mix-blend-multiply" alt="" /> : <Store className="w-3 h-3 text-current" />}{ob?.name || 'Sucursal'}</span>;
                            return <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1 leading-none border border-slate-200 px-1.5 py-0.5 rounded-md bg-slate-50 w-max"><Globe className="w-2.5 h-2.5 text-slate-400" /> Compartido</span>;
                          })()}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm"><Banknote className="w-3 h-3 text-emerald-600" /><span className="font-mono text-[10px] text-emerald-600 font-bold">S/</span><span className="font-bold text-sm tracking-tight">{Number(product.basePrice).toFixed(2)}</span></div>
                          {hasWholesale && <p className="text-[9px] text-emerald-600/80 font-medium pl-1 leading-none">Mayor: S/ {Number(product.wholesalePrice).toFixed(2)}</p>}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {(() => {
                          const min = product.minStock || 5;
                          const c = totalPhysicalStock <= 0 ? 'bg-red-50 text-red-700 border-red-200' : totalPhysicalStock <= min ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
                          return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${c}`}>{totalPhysicalStock} <span className="text-[9px] opacity-70 ml-1 font-semibold uppercase">un.</span></span>;
                        })()}
                      </td>
                      <td className="px-5 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <Button onClick={() => openKardexModal(product)} variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-slate-200 text-slate-600 hover:text-slate-900"><FileText className="w-4 h-4" /></Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}{/* end desktop */}

      {/* ── MODALES (lazy) ── */}
      {isModalOpen && (
        <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} onSuccess={() => mutate()} productToEdit={selectedProduct} canEdit={canEditSelected} onDelete={handleDelete} onPrintBarcode={p => setBarcodeProduct(p as unknown as Product)} />
      )}
      {isImportModalOpen && (
        <ImportProductsModal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} onSuccess={() => mutate()} categories={categories || []} suppliers={suppliers || []} branches={branches || []} />
      )}
      {isBarcodeModalOpen && (
        <BarcodeGeneratorModal isOpen={isBarcodeModalOpen} onClose={() => setIsBarcodeModalOpen(false)} products={products || []} />
      )}
      {isCategoryModalOpen && (
        <CategoryModal isOpen={isCategoryModalOpen} onClose={() => setIsCategoryModalOpen(false)} onSuccess={() => { mutate(); mutateCategories(); }} categories={categories || []} branches={branches || []} />
      )}

      {/* Etiqueta barcode */}
      <Dialog open={!!barcodeProduct} onOpenChange={() => setBarcodeProduct(null)}>
        <DialogContent className="sm:max-w-sm text-center border-none shadow-2xl p-6 bg-slate-100 rounded-2xl">
          <DialogHeader className="mb-2"><DialogTitle className="text-center text-slate-500 text-xs uppercase tracking-widest font-bold">Vista Previa Etiqueta</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center justify-center overflow-hidden">
            <div ref={ticketRef} className="bg-white px-6 py-5 flex flex-col items-center justify-center w-full max-w-[320px] text-black shadow-sm rounded-xl">
              <h3 className="font-black text-black text-center text-[16px] leading-tight uppercase w-full mb-4 px-2 line-clamp-3">{barcodeProduct?.title}</h3>
              <div className="w-full flex justify-center bg-white overflow-hidden">
                {barcodeProduct && <Barcode value={barcodeProduct.barcode || barcodeProduct.code || '000000'} width={2} height={60} fontSize={16} textMargin={8} margin={10} format="CODE128" background="#ffffff" lineColor="#000000" renderer="canvas" />}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full mt-6">
            <Button onClick={() => setBarcodeProduct(null)} className="flex-1 h-10 text-xs rounded-xl border-slate-200 text-slate-600" variant="outline">Cerrar</Button>
            <Button onClick={downloadBarcodePNG} className="flex-1 h-10 text-xs gap-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-white shadow-md"><Download className="w-4 h-4" /> Descargar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kardex */}
      <Dialog open={isKardexModalOpen} onOpenChange={setIsKardexModalOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle className="text-lg font-bold">Kardex - {kardexProduct?.title}</DialogTitle></DialogHeader>
          <div className="flex gap-2 mb-4">
            <Button onClick={() => exportKardexToExcel(kardexProduct, kardexMovements)} variant="outline" size="sm" className="flex-1"><Download className="w-4 h-4 mr-2" />Exportar Excel</Button>
            <Button onClick={() => exportKardexToPDF(kardexProduct, kardexMovements)} variant="outline" size="sm" className="flex-1"><Download className="w-4 h-4 mr-2" />Exportar PDF</Button>
          </div>
          <div className="flex-1 overflow-auto">
            {kardexMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400"><FileText className="w-12 h-12 mb-3 text-slate-300" /><p className="text-sm font-medium">No hay movimientos registrados</p></div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    {['Fecha', 'Tipo', 'Motivo', 'Cantidad', 'Había', 'Hay', 'Sucursal', 'Usuario'].map(h => <th key={h} className="px-3 py-2 text-left text-xs font-semibold text-slate-600">{h}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {kardexMovements.map((m: any) => {
                    const typeMap: any = { INPUT: { label: 'Entrada', color: 'text-emerald-600' }, OUTPUT: { label: 'Salida', color: 'text-red-600' }, ADJUSTMENT: { label: 'Ajuste', color: 'text-amber-600' }, SALE_POS: { label: 'Venta POS', color: 'text-blue-600' }, SALE_ECOMMERCE: { label: 'Venta Online', color: 'text-indigo-600' }, PURCHASE: { label: 'Compra', color: 'text-purple-600' }, TRANSFER: { label: 'Traslado', color: 'text-cyan-600' } };
                    const ti = typeMap[m.type] || { label: m.type, color: 'text-slate-600' };
                    const qty = m.type === 'ADJUSTMENT' ? (m.currentStock > m.previousStock ? `+${m.currentStock - m.previousStock}` : `${m.currentStock - m.previousStock}`) : (['INPUT', 'PURCHASE', 'TRANSFER'].includes(m.type) ? `+${m.quantity}` : `-${m.quantity}`);
                    const qColor = m.type === 'ADJUSTMENT' ? (m.currentStock > m.previousStock ? 'text-emerald-600' : 'text-red-600') : (['INPUT', 'PURCHASE', 'TRANSFER'].includes(m.type) ? 'text-emerald-600' : 'text-red-600');
                    return (
                      <tr key={m.id} className="hover:bg-slate-50">
                        <td className="px-3 py-2 text-xs text-slate-600">{new Date(m.createdAt).toLocaleDateString('es-PE')}</td>
                        <td className="px-3 py-2"><span className={`text-xs font-semibold ${ti.color}`}>{ti.label}</span></td>
                        <td className="px-3 py-2 text-xs text-slate-600">{m.reason || '-'}</td>
                        <td className="px-3 py-2 text-center"><span className={`text-xs font-bold ${qColor}`}>{qty}</span></td>
                        <td className="px-3 py-2 text-center text-xs text-slate-600">{m.previousStock}</td>
                        <td className="px-3 py-2 text-center text-xs font-bold text-slate-900">{m.currentStock}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{m.branch?.name || '-'}</td>
                        <td className="px-3 py-2 text-xs text-slate-600">{m.user?.name || '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
