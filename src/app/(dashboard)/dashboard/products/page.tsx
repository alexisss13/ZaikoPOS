// src/app/(dashboard)/dashboard/products/page.tsx
'use client';

import useSWR from 'swr';
import { useState, useMemo, useRef } from 'react';
import { 
  Plus, Search, Package, Image as ImageIcon, Barcode as BarcodeIcon, ChevronLeft, ChevronRight, Download, Filter, LayoutGrid, Store, Globe, PowerOff, Check, Banknote
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ProductModal, ProductData } from '@/components/dashboard/ProductModal';
import Barcode from 'react-barcode';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Product extends ProductData {
  id: string;
  category?: { name: string; ecommerceCode: string | null };
  branchStock?: { branchId: string; quantity: number }[]; 
  active: boolean; 
}

interface Branch { id: string; ecommerceCode: string | null; name: string; logoUrl?: string | null; }
interface Category { id: string; name: string; ecommerceCode?: string | null; }

const ITEMS_PER_PAGE = 7;

export default function ProductsPage() {
  const { user, role } = useAuth();
  const permissions = user?.permissions || {};
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  
  const canManageGlobal = isSuperOrOwner || !!permissions.canManageGlobalProducts;
  const canCreate = isSuperOrOwner || !!permissions.canCreateProducts || canManageGlobal;
  const canEdit = isSuperOrOwner || !!permissions.canEditProducts || canManageGlobal;
  const canViewOthers = isSuperOrOwner || !!permissions.canViewOtherBranches || canManageGlobal;

  const { data: products, isLoading, mutate } = useSWR<Product[]>('/api/products', fetcher);
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  const { data: categories } = useSWR<Category[]>('/api/categories', fetcher);
  
  const myBranch = branches?.find(b => b.id === user?.branchId);
  const myCode = myBranch?.ecommerceCode; 

  const uniqueCodes = Array.from(new Set(branches?.map((b) => b.ecommerceCode).filter(Boolean))) as string[];
  const visibleCodes = canViewOthers ? uniqueCodes : uniqueCodes.filter(c => c === myCode);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  
  const [showCatFilter, setShowCatFilter] = useState(false);
  const [showStockFilter, setShowStockFilter] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [canEditSelected, setCanEditSelected] = useState(false);
  
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const getBranchByCode = (code: string) => branches?.find(b => b.ecommerceCode === code);

  const availableCategories = useMemo(() => {
    if (!categories || !products) return [];

    const baseProducts = products.filter(p => {
      const catEcommerceCode = p.category?.ecommerceCode ?? categories?.find(c => c.id === p.categoryId)?.ecommerceCode;
      const isGlobalProduct = !catEcommerceCode;
      const isMyCatalogProduct = catEcommerceCode === myCode;
      const hasStockInMyBranch = p.branchStock?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;

      if (!isSuperOrOwner && !canViewOthers && !canManageGlobal) {
         if (!isGlobalProduct && !isMyCatalogProduct && !hasStockInMyBranch) return false;
      }
      if (codeFilter === 'INACTIVE') return !p.active; 
      if (!p.active) return false;

      let matchesCode = true;
      if (codeFilter === 'GENERAL') {
        const storesWithStock = p.branchStock?.filter(bs => bs.quantity > 0).length || 0;
        matchesCode = isGlobalProduct || storesWithStock > 1 || (!isMyCatalogProduct && hasStockInMyBranch);
      }
      else if (codeFilter !== 'ALL') matchesCode = catEcommerceCode === codeFilter;

      return matchesCode;
    });

    const activeCategoryIds = new Set(baseProducts.map(p => p.categoryId));
    return categories.filter(c => activeCategoryIds.has(c.id));
  }, [products, categories, codeFilter, myCode, user?.branchId, isSuperOrOwner, canViewOthers, canManageGlobal]);


  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const isGlobalProduct = !p.category?.ecommerceCode;
      const isMyCatalogProduct = p.category?.ecommerceCode === myCode;
      const hasStockInMyBranch = p.branchStock?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;

      if (!isSuperOrOwner && !canViewOthers && !canManageGlobal) {
         if (!isGlobalProduct && !isMyCatalogProduct && !hasStockInMyBranch) return false;
      }

      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.barcode && p.barcode.includes(searchTerm)) || 
                            (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (codeFilter === 'INACTIVE') return matchesSearch && !p.active; 
      if (!p.active) return false;
      
      let matchesCode = true;
      if (codeFilter === 'GENERAL') {
        const storesWithStock = p.branchStock?.filter(bs => bs.quantity > 0).length || 0;
        matchesCode = isGlobalProduct || storesWithStock > 1 || (!isMyCatalogProduct && hasStockInMyBranch);
      }
      else if (codeFilter !== 'ALL') matchesCode = p.category?.ecommerceCode === codeFilter;

      const matchesCategory = categoryFilter === 'ALL' || p.categoryId === categoryFilter;

      let matchesStock = true;
      const currentStock = Number(p.stock);
      const minStock = Number(p.minStock);
      
      if (stockFilter === 'LOW') matchesStock = currentStock <= minStock && currentStock > 0; 
      else if (stockFilter === 'OUT') matchesStock = currentStock <= 0; 

      return matchesSearch && matchesCode && matchesCategory && matchesStock;
    });
  }, [products, searchTerm, codeFilter, categoryFilter, stockFilter, canViewOthers, canManageGlobal, isSuperOrOwner, myCode, user?.branchId]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (!confirm('🛑 ¿Dar de baja este producto? No aparecerá en ventas, pero podrás reactivarlo desde el filtro "Inactivos".')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Producto dado de baja (Inactivo)');
      setIsModalOpen(false);
      mutate();
    } catch (e: unknown) { toast.error('Error inesperado'); }
  };

  const downloadBarcodePNG = async () => {
    if (!barcodeProduct || !ticketRef.current) return;
    try {
      toast.loading('Generando etiqueta en alta calidad...', { id: 'barcode-toast' });
      const htmlToImage = await import('html-to-image');
      const dataUrl = await htmlToImage.toPng(ticketRef.current, { 
        pixelRatio: 5, backgroundColor: '#ffffff', style: { margin: '0', border: 'none', borderRadius: '0' }, skipFonts: true, 
      }); 
      const link = document.createElement('a');
      link.download = `etiqueta-${(barcodeProduct.barcode || barcodeProduct.code || 'producto')}.png`;
      link.href = dataUrl;
      link.click();
      toast.success('Etiqueta descargada correctamente', { id: 'barcode-toast' });
    } catch (error) { toast.error('Error al generar la imagen.', { id: 'barcode-toast' }); }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* TOOLBAR SUPERIOR */}
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
            <Input 
              placeholder="Buscar producto, SKU..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>
          {canCreate && (
            <Button onClick={() => { setSelectedProduct(null); setCanEditSelected(true); setIsModalOpen(true); }} className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0">
              <Plus className="w-4 h-4 mr-1.5" /> <span className="font-bold">Nuevo Producto</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* SUBHEADER: TABS Y PAGINACIÓN INTEGRADA */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5  w-full  shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button 
              onClick={() => {setCodeFilter('ALL'); setCurrentPage(1); setCategoryFilter('ALL');}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Todos
            </button>
            <button 
              onClick={() => {setCodeFilter('GENERAL'); setCurrentPage(1); setCategoryFilter('ALL');}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'GENERAL' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <Globe className="w-3.5 h-3.5" /> Compartidos
            </button>
            
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

            {visibleCodes.map(code => {
              const b = getBranchByCode(code);
              const isActive = codeFilter === code;
              return (
                <button 
                  key={code} 
                  onClick={() => {setCodeFilter(code); setCurrentPage(1); setCategoryFilter('ALL');}} 
                  className={`group px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${isActive ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
                >
                  {b?.logoUrl 
                    ? <img src={b.logoUrl} className={`w-4 h-4 rounded-[3px] object-cover transition-all ${isActive ? 'bg-white p-[1.5px]' : 'grayscale mix-blend-multiply group-hover:brightness-0'}`} alt=""/> 
                    : <Store className="w-3.5 h-3.5 text-current"/>
                  }
                  {b?.name || code}
                </button>
              )
            })}

            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

            <button 
              onClick={() => {setCodeFilter('INACTIVE'); setCurrentPage(1); setCategoryFilter('ALL');}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${codeFilter === 'INACTIVE' ? 'bg-red-100 text-red-800 shadow-sm' : 'text-slate-500 hover:text-red-700 hover:bg-red-50'}`}
            >
              <PowerOff className="w-3.5 h-3.5" /> Inactivos
            </button>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                Pág {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          
          {(showCatFilter || showStockFilter) && (
            <div className="fixed inset-0 z-20" onClick={() => {setShowCatFilter(false); setShowStockFilter(false);}} />
          )}

          <table className="w-full text-left border-separate border-spacing-0 min-w-[700px]">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30 overflow-hidden">
              <tr>
                <th className="px-5 py-3.5 font-semibold rounded-tl-xl">Producto</th>
                
                <th className="px-5 py-3.5 font-semibold relative select-none w-[200px]">
                  <div 
                    className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${categoryFilter !== 'ALL' || showCatFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                    onClick={() => {setShowCatFilter(!showCatFilter); setShowStockFilter(false);}}
                  >
                    Categoría y Catálogo <Filter className={`w-3.5 h-3.5 ${categoryFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                  </div>
                  
                  {showCatFilter && (
                    <div className="absolute top-10 left-3 w-[220px] bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar">
                      <button onClick={() => {setCategoryFilter('ALL'); setShowCatFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${categoryFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                        Todas las categorías {categoryFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <div className="h-px bg-slate-100 my-1 mx-2" />
                      {availableCategories.length === 0 && (
                        <div className="px-3 py-2 text-xs text-slate-400 text-center italic">Sin categorías aquí</div>
                      )}
                      {availableCategories.map((cat) => (
                        <button key={cat.id} onClick={() => {setCategoryFilter(cat.id); setShowCatFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors flex items-center justify-between ${categoryFilter === cat.id ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                          <span className="truncate pr-2">{cat.name}</span>
                          {categoryFilter === cat.id && <Check className="w-3.5 h-3.5 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </th>

                <th className="px-5 py-3.5 font-semibold w-[120px]">Precio (S/)</th>
                
                <th className="px-5 py-3.5 font-semibold relative select-none w-[150px] rounded-tr-xl">
                  <div 
                    className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${stockFilter !== 'ALL' || showStockFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                    onClick={() => {setShowStockFilter(!showStockFilter); setShowCatFilter(false);}}
                  >
                    Inventario <Filter className={`w-3.5 h-3.5 ${stockFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                  </div>

                  {showStockFilter && (
                    <div className="absolute top-10 left-3 w-[160px] bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => {setStockFilter('ALL'); setShowStockFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${stockFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                        Todo el Stock {stockFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => {setStockFilter('LOW'); setShowStockFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${stockFilter === 'LOW' ? 'bg-amber-50 text-amber-700' : 'text-amber-600 hover:bg-amber-50/50'}`}>
                        Stock Bajo {stockFilter === 'LOW' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => {setStockFilter('OUT'); setShowStockFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${stockFilter === 'OUT' ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50/50'}`}>
                        Agotados {stockFilter === 'OUT' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? ( Array(5).fill(0).map((_, i) => (<tr key={i}><td colSpan={4} className="p-4"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>)) ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <Package className="w-10 h-10 text-slate-200" strokeWidth={1} />
                      <p className="font-medium text-sm text-slate-500">{codeFilter === 'INACTIVE' ? 'No hay productos inactivos.' : 'No se encontraron productos.'}</p>
                      <Button variant="link" className="text-xs h-6 text-slate-900 font-bold" onClick={() => { setSearchTerm(''); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); }}>Limpiar filtros</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((product: Product) => {
                  
                  const visibleStockList = product.branchStock?.filter(bs => canViewOthers || bs.branchId === user?.branchId) || [];
                  const totalPhysicalStock = visibleStockList.reduce((acc, curr) => acc + curr.quantity, 0);
                  const hasWholesale = Number(product.wholesalePrice) > 0;

                  const isGlobalProduct = !product.category?.ecommerceCode;
                  const isMyCatalogProduct = product.category?.ecommerceCode === myCode;
                  const hasStockInMyBranch = product.branchStock?.some(bs => bs.branchId === user?.branchId && bs.quantity > 0) ?? false;
                  
                  let canEditThisSpecificProduct = false;
                  if (canManageGlobal) {
                    canEditThisSpecificProduct = true; 
                  } else if (canEdit) {
                    if (isGlobalProduct || isMyCatalogProduct) {
                      canEditThisSpecificProduct = true; 
                    } else if (hasStockInMyBranch) {
                      canEditThisSpecificProduct = true; 
                    }
                  }

                  const bCode = product.category?.ecommerceCode;
                  const productBranch = bCode ? getBranchByCode(bCode) : null;

                  return (
                    <tr 
                      key={product.id} 
                      onClick={() => { setSelectedProduct(product); setCanEditSelected(canEditThisSpecificProduct); setIsModalOpen(true); }}
                      className={`hover:bg-slate-50 transition-colors group text-xs cursor-pointer ${!product.active ? 'opacity-60 bg-slate-50/50' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center ${!product.active ? 'grayscale' : ''}`}>
                            {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-slate-300" />}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-700 truncate leading-tight group-hover:text-slate-900 transition-colors text-sm">{product.title}</p>
                              {!product.active && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5 leading-none bg-red-100 text-red-700 border-none shadow-none">INACTIVO</Badge>}
                            </div>
                            {(product.barcode || product.code) && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1"><BarcodeIcon className="w-3 h-3" /> {product.barcode || product.code}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="font-medium text-slate-500 truncate max-w-[140px] leading-none group-hover:text-slate-700 transition-colors">{product.category?.name || 'Sin Categoría'}</span>
                          {bCode ? (
                            <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 w-max leading-none">
                              {productBranch?.logoUrl 
                                ? <img src={productBranch.logoUrl} className="w-3.5 h-3.5 rounded-[2px] object-cover transition-all grayscale mix-blend-multiply " alt=""/> 
                                : <Store className="w-3 h-3 text-current" />
                              } 
                              {productBranch?.name || bCode}
                            </span>
                          ) : (
                            <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1 leading-none border border-slate-200 px-1.5 py-0.5 rounded-md bg-slate-50 w-max"><Globe className="w-2.5 h-2.5 text-slate-400" /> Compartido</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col items-start gap-1">
                          {/* Diseño de billete para el precio principal */}
                          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm">
                            <Banknote className="w-3 h-3 text-emerald-600" />
                            <span className="font-mono text-[10px] text-emerald-600 font-bold">S/</span>
                            <span className="font-bold text-sm tracking-tight">{Number(product.price).toFixed(2)}</span>
                          </div>
                          {hasWholesale && (
                            <p className="text-[9px] text-emerald-600/80 font-medium pl-1 leading-none">Mayor: S/ {Number(product.wholesalePrice).toFixed(2)}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {/* Diseño de píldora para el stock */}
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border 
                          ${totalPhysicalStock <= 0 ? 'bg-red-50 text-red-700 border-red-200' 
                          : totalPhysicalStock <= Number(product.minStock) ? 'bg-amber-50 text-amber-700 border-amber-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'}
                        `}>
                          {totalPhysicalStock} <span className="text-[9px] opacity-70 ml-1 font-semibold uppercase">un.</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <ProductModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSuccess={() => mutate()} 
          productToEdit={selectedProduct} 
          canEdit={canEditSelected}
          onDelete={handleDelete}
          onPrintBarcode={(p) => setBarcodeProduct(p as unknown as Product)}
        />
      )}

      {/* ETIQUETA MODAL */}
      <Dialog open={!!barcodeProduct} onOpenChange={() => setBarcodeProduct(null)}>
        <DialogContent className="sm:max-w-sm text-center border-none shadow-2xl p-6 bg-slate-100 rounded-2xl">
          <DialogHeader className="mb-2"><DialogTitle className="text-center text-slate-500 text-xs uppercase tracking-widest font-bold">Vista Previa Etiqueta</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center justify-center overflow-hidden">
            <div ref={ticketRef} id="barcode-ticket" className="bg-white px-6 py-5 flex flex-col items-center justify-center w-full max-w-[320px] text-black shadow-sm rounded-xl">
              <h3 className="font-black text-black text-center text-[16px] leading-tight uppercase w-full mb-4 px-2 line-clamp-3">{barcodeProduct?.title}</h3>
              <div className="w-full flex justify-center bg-white overflow-hidden">
                {barcodeProduct && <Barcode value={barcodeProduct.barcode || barcodeProduct.code || '000000'} width={2} height={60} fontSize={16} textMargin={8} margin={10} format="CODE128" background="#ffffff" lineColor="#000000" renderer="canvas" />}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full mt-6">
            <Button onClick={() => setBarcodeProduct(null)} className="flex-1 h-10 text-xs rounded-xl border-slate-200 text-slate-600" variant="outline">Cerrar</Button>
            <Button onClick={downloadBarcodePNG} className="flex-1 h-10 text-xs gap-2 bg-slate-900 hover:bg-slate-800 rounded-xl text-white shadow-md"><Download className="w-4 h-4"/> Descargar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}