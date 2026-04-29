'use client';

import useSWR from 'swr';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';
import { useProductExports } from './useProductExports';
import type { Product, Branch, Category } from './types';

const fetcher = (url: string) => fetch(url).then(r => r.json());
export const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };
export const MOBILE_PAGE_SIZE = 8;
export const ITEMS_PER_PAGE = 7;

export function useProductsLogic() {
  const { user, role } = useAuth();
  const permissions = user?.permissions || {};
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  const canManageGlobal = isSuperOrOwner || !!permissions.canManageGlobalProducts;
  const canCreate = isSuperOrOwner || !!permissions.canCreateProducts || canManageGlobal;
  const canEdit = isSuperOrOwner || !!permissions.canEditProducts || canManageGlobal;
  const canViewOthers = isSuperOrOwner || !!permissions.canViewOtherBranches || canManageGlobal;

  // ⚡ PAGINACIÓN EN EL SERVIDOR - cargar solo 50 productos a la vez
  const [apiPage, setApiPage] = useState(1);
  const apiLimit = 50;
  
  const { data: apiResponse, isLoading: isLoadingProducts, mutate } = useSWR<{ products: Product[], pagination: { page: number, limit: number, total: number, totalPages: number } }>(
    `/api/products?page=${apiPage}&limit=${apiLimit}`, 
    fetcher, 
    { 
      revalidateOnFocus: false, 
      revalidateOnReconnect: false, 
      revalidateOnMount: true, // ⚡ CAMBIAR A TRUE para que cargue al montar
      revalidateIfStale: false,
      dedupingInterval: 30000,
    }
  );
  
  const products = apiResponse?.products;
  const apiPagination = apiResponse?.pagination;
  
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher, { 
    revalidateOnFocus: false, 
    revalidateOnReconnect: false, 
    revalidateOnMount: true, // ⚡ Cargar al montar
    revalidateIfStale: false,
    dedupingInterval: 60000,
  });
  const { data: categories, mutate: mutateCategories } = useSWR<Category[]>('/api/categories', fetcher, { 
    revalidateOnFocus: false, 
    revalidateOnReconnect: false, 
    revalidateOnMount: true, // ⚡ Cargar al montar
    revalidateIfStale: false,
    dedupingInterval: 60000,
  });
  const { data: suppliers } = useSWR('/api/suppliers', fetcher, { 
    revalidateOnFocus: false, 
    revalidateOnReconnect: false, 
    revalidateOnMount: true, // ⚡ Cargar al montar
    revalidateIfStale: false,
    dedupingInterval: 60000,
  });

  const isLoading = isLoadingProducts || !branches || !categories;

  const { myBranch, myCode, uniqueCodes, visibleCodes } = useMemo(() => {
    const myBranch = branches?.find(b => b.id === user?.branchId);
    const myCode = myBranch?.ecommerceCode;
    const uniqueCodes = Array.from(new Set(branches?.map(b => b.ecommerceCode).filter(Boolean))) as string[];
    const visibleCodes = canViewOthers ? uniqueCodes : uniqueCodes.filter(c => c === myCode);
    return { myBranch, myCode, uniqueCodes, visibleCodes };
  }, [branches, user?.branchId, canViewOthers]);

  // ── Filters ──
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');

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
  
  // ⚡ Memoizar handlers de export para evitar re-renders
  const { exportToExcel, exportToPDF, exportKardexToExcel, exportKardexToPDF } = useMemo(() => {
    const handlers = useProductExports({ products, branches });
    return handlers;
  }, [products, branches]);

  const handleSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value);
    setCurrentPage(1);
  }, []);

  useEffect(() => { setVisibleCount(MOBILE_PAGE_SIZE); }, [codeFilter, categoryFilter, stockFilter, debouncedSearch]);

  // ── Pull-to-refresh ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef(0);
  const pullDistanceRef = useRef(0);
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
        if (distance >= 60) { icon.classList.add('text-slate-900'); icon.classList.remove('text-slate-400'); }
        else { icon.classList.remove('text-slate-900'); icon.classList.add('text-slate-400'); }
      }
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) pullStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullStartY.current) return;
    const dist = Math.max(0, Math.min(80, e.touches[0].clientY - pullStartY.current));
    if (dist > 0 && scrollRef.current?.scrollTop === 0) {
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
      setTimeout(() => { setIsRefreshing(false); setIsPulling(false); pullStartY.current = 0; pullDistanceRef.current = 0; updatePullIndicator(); }, 600);
    } else {
      setIsPulling(false); pullStartY.current = 0; pullDistanceRef.current = 0; updatePullIndicator();
    }
  }, [isRefreshing, mutate, updatePullIndicator]);

  const getBranchByCode = useCallback((code: string) => branches?.find(b => b.ecommerceCode === code), [branches]);

  const openKardexModal = useCallback(async (product: Product) => {
    setKardexProduct(product); setIsKardexModalOpen(true);
    try {
      // Obtener el producto completo con variantes si no las tiene
      let productWithVariants = product;
      if (!product.variants || product.variants.length === 0) {
        const response = await fetch(`/api/products/${product.id}`);
        if (response.ok) {
          productWithVariants = await response.json();
        }
      }
      
      const variantId = productWithVariants.variants?.[0]?.id;
      if (!variantId) { 
        console.log('[KARDEX] No variant found for product:', product.id);
        setKardexMovements([]); 
        return; 
      }
      
      console.log('[KARDEX] Fetching movements for variant:', variantId);
      const data = await fetch(`/api/inventory/movements?variantId=${variantId}`).then(r => r.json());
      console.log('[KARDEX] Movements received:', data.length);
      setKardexMovements(data || []);
    } catch (error) { 
      console.error('[KARDEX] Error fetching movements:', error);
      setKardexMovements([]); 
    }
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

  // ⚡ SIMPLIFICACIÓN RADICAL: Eliminar filtrado en cliente, hacerlo en servidor
  const productsWithMetadata = useMemo(() => {
    if (!products) return [];
    const userBranchId = user?.branchId;
    
    return products.map(p => {
      const isGlobal = !p.branchOwnerId;
      const isMine = p.branchOwnerId === userBranchId;
      const hasMyStock = p.branchStocks?.some(bs => bs.branchId === userBranchId && bs.quantity > 0) ?? false;
      
      let canEditThis = false;
      if (canManageGlobal) canEditThis = true;
      else if (canEdit && (isGlobal || isMine || hasMyStock)) canEditThis = true;
      
      const visibleStocks = canViewOthers 
        ? (p.branchStocks || []) 
        : (p.branchStocks?.filter(bs => bs.branchId === userBranchId) || []);
      
      const totalStock = visibleStocks.reduce((s, bs) => s + bs.quantity, 0);
      
      return { ...p, _meta: { isGlobal, isMine, hasMyStock, canEditThis, totalStock, visibleStocks } };
    });
  }, [products, user?.branchId, canManageGlobal, canEdit, canViewOthers]);

  // ⚡ FILTRADO SIMPLIFICADO - Solo 1 paso
  const filteredProducts = useMemo(() => {
    if (!productsWithMetadata.length) return [];
    
    return productsWithMetadata.filter(p => {
      const { isGlobal, isMine, hasMyStock, totalStock } = p._meta;
      
      // Filtro de permisos
      if (!isSuperOrOwner && !canViewOthers && !canManageGlobal && !isGlobal && !isMine && !hasMyStock) {
        return false;
      }
      
      // Filtro de inactivos
      if (codeFilter === 'INACTIVE') return !p.active;
      if (!p.active) return false;
      
      // Filtro de código/sucursal
      if (codeFilter === 'GENERAL') {
        const bws = p.branchStocks?.filter(bs => bs.quantity > 0) || [];
        if (!isGlobal && bws.length <= 1) return false;
      } else if (codeFilter !== 'ALL') {
        const targetBranch = branches?.find(b => b.ecommerceCode === codeFilter);
        if (targetBranch && p.branchOwnerId !== targetBranch.id) return false;
      }
      
      // Búsqueda de texto
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesBarcode = p.barcode?.includes(debouncedSearch) ?? false;
        const matchesSku = p.sku?.toLowerCase().includes(q) ?? false;
        if (!matchesTitle && !matchesBarcode && !matchesSku) return false;
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
  }, [productsWithMetadata, codeFilter, categoryFilter, stockFilter, debouncedSearch, isSuperOrOwner, canViewOthers, canManageGlobal, branches]);

  const availableCategories = useMemo(() => {
    if (!categories || !filteredProducts.length) return [];
    const ids = new Set(filteredProducts.map(p => p.categoryId));
    return categories.filter(c => ids.has(c.id));
  }, [filteredProducts, categories]);

  // ⚡ PAGINACIÓN OPTIMIZADA
  const { totalPages, paginatedProducts, mobileProducts, hasMore } = useMemo(() => {
    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
    const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    const mobileProducts = filteredProducts.slice(0, visibleCount);
    const hasMore = visibleCount < filteredProducts.length;
    return { totalPages, paginatedProducts, mobileProducts, hasMore };
  }, [filteredProducts, currentPage, visibleCount]);

  const handleOpenEdit = useCallback((product: Product | (Product & { _meta?: any })) => {
    let canEditThis = false;
    if ('_meta' in product && product._meta) { canEditThis = product._meta.canEditThis; }
    else {
      const isGlobal = !product.branchOwnerId;
      const isMine = product.branchOwnerId === user?.branchId;
      const hasMyStock = product.branchStocks?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;
      if (canManageGlobal) canEditThis = true;
      else if (canEdit && (isGlobal || isMine || hasMyStock)) canEditThis = true;
    }
    haptic(8); setSelectedProduct(product as Product); setCanEditSelected(canEditThis); setIsModalOpen(true);
  }, [canManageGlobal, canEdit, user?.branchId]);

  return {
    // Auth
    user, isSuperOrOwner, canCreate, canEdit, canViewOthers,
    // Data
    products, branches, categories, suppliers,
    isLoading, mutate, mutateCategories,
    // Branch helpers
    myBranch, myCode, visibleCodes, getBranchByCode,
    // Filters
    debouncedSearch, setDebouncedSearch,
    codeFilter, setCategoryFilter, setCodeFilter,
    categoryFilter, stockFilter, setStockFilter,
    // UI state
    currentPage, setCurrentPage,
    isModalOpen, setIsModalOpen,
    isCategoryModalOpen, setIsCategoryModalOpen,
    isImportModalOpen, setIsImportModalOpen,
    isBarcodeModalOpen, setIsBarcodeModalOpen,
    selectedProduct, setSelectedProduct,
    canEditSelected, setCanEditSelected,
    barcodeProduct, setBarcodeProduct,
    showExportMenu, setShowExportMenu,
    isKardexModalOpen, setIsKardexModalOpen,
    kardexProduct, kardexMovements,
    showMobileFilters, setShowMobileFilters,
    visibleCount, setVisibleCount,
    // Refs
    ticketRef, scrollRef,
    // Pull-to-refresh
    isPulling, isRefreshing,
    handleTouchStart, handleTouchMove, handleTouchEnd,
    // Computed
    availableCategories, filteredProducts,
    totalPages, paginatedProducts, mobileProducts, hasMore,
    // Handlers
    handleSearchChange, handleOpenEdit, handleDelete,
    openKardexModal, downloadBarcodePNG,
    // Exports
    exportToExcel, exportToPDF, exportKardexToExcel, exportKardexToPDF,
  };
}