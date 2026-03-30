'use client';

import useSWR from 'swr';
import { useState, useMemo, useRef } from 'react';
import { 
  Plus, Search, Package, Edit, Trash2, Image as ImageIcon, Barcode as BarcodeIcon, ChevronLeft, ChevronRight, Link as LinkIcon, PowerOff, Download, Filter, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ProductModal, ProductData } from '@/components/dashboard/ProductModal';
import Barcode from 'react-barcode';
import { useAuth } from '@/context/auth-context'; // 🚀 IMPORTAMOS CONTEXTO DE AUTENTICACIÓN

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Product extends ProductData {
  id: string;
  category?: { name: string; ecommerceCode: string | null };
  branchStock?: { branchId: string; quantity: number }[]; 
  active: boolean; 
}

interface Branch { id: string; ecommerceCode: string | null; name: string; }
interface Category { id: string; name: string; }

const ITEMS_PER_PAGE = 10;

export default function ProductsPage() {
  // 🚀 OBTENEMOS AL USUARIO Y SUS PERMISOS
  const { user, role } = useAuth();
  const permissions = user?.permissions || {};
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  
  const canCreate = isSuperOrOwner || permissions.canCreateProducts;
  const canEdit = isSuperOrOwner || permissions.canEditProducts;
  const canViewOthers = isSuperOrOwner || permissions.canViewOtherBranches;

  const { data: products, isLoading, mutate } = useSWR<Product[]>('/api/products', fetcher);
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  const { data: categories } = useSWR<Category[]>('/api/categories', fetcher);
  
  const uniqueCodes = Array.from(new Set(branches?.map((b) => b.ecommerceCode).filter(Boolean))) as string[];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [codeFilter, setCodeFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
  const [barcodeProduct, setBarcodeProduct] = useState<Product | null>(null);
  const ticketRef = useRef<HTMLDivElement>(null);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (p.barcode && p.barcode.includes(searchTerm)) || 
                            (p.code && p.code.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (codeFilter === 'INACTIVE') return matchesSearch && !p.active; 
      if (!p.active) return false;
      
      let matchesCode = true;
      if (codeFilter === 'GENERAL') {
        const storesWithStock = p.branchStock?.filter(bs => bs.quantity > 0).length || 0;
        matchesCode = !p.category?.ecommerceCode || storesWithStock > 1;
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
  }, [products, searchTerm, codeFilter, categoryFilter, stockFilter]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const handleDelete = async (id: string) => {
    if (!confirm('🛑 ¿Dar de baja este producto? No aparecerá en ventas, pero podrás reactivarlo desde el filtro "Inactivos".')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success('Producto dado de baja (Inactivo)');
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

  const baseTabClass = "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 cursor-pointer";
  const activeTabClass = "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50";
  const inactiveTabClass = "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50";

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><Package className="w-6 h-6 text-primary" /> Inventario</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona el stock de tus sucursales y tienda web.</p>
        </div>
        {/* 🚀 PROTECCIÓN: Botón Nuevo Producto */}
        {canCreate && (
          <Button onClick={() => { setSelectedProduct(null); setIsModalOpen(true); }} className="gap-2 shadow-md w-full sm:w-auto">
            <Plus className="w-4 h-4" /> Nuevo Producto
          </Button>
        )}
      </div>

      <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input placeholder="Buscar por nombre, código o SKU..." value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} className="pl-9 h-10 w-full bg-slate-50/50 focus-visible:bg-white transition-colors" />
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={categoryFilter} onValueChange={(v) => {setCategoryFilter(v); setCurrentPage(1);}}>
              <SelectTrigger className="w-full sm:w-[220px] h-10 bg-slate-50/50">
                <LayoutGrid className="w-3.5 h-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder="Todas las categorías" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold">Todas las categorías</SelectItem>
                {categories?.map((cat) => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={stockFilter} onValueChange={(v) => {setStockFilter(v); setCurrentPage(1);}}>
              <SelectTrigger className="w-full sm:w-[180px] h-10 bg-slate-50/50">
                <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder="Filtro Stock" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-bold">Filtrar Stock</SelectItem>
                <SelectItem value="LOW" className="text-amber-600 font-bold">Stock Bajo</SelectItem>
                <SelectItem value="OUT" className="text-red-600 font-bold">Agotados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center overflow-x-auto hide-scrollbar pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-lg border border-slate-200/60 w-max">
            <button onClick={() => {setCodeFilter('ALL'); setCurrentPage(1)}} className={`${baseTabClass} ${codeFilter === 'ALL' ? activeTabClass : inactiveTabClass}`}>Todos</button>
            <button onClick={() => {setCodeFilter('GENERAL'); setCurrentPage(1)}} className={`${baseTabClass} ${codeFilter === 'GENERAL' ? activeTabClass : inactiveTabClass}`}><LinkIcon className="w-3.5 h-3.5" /> Compartidos</button>
            {uniqueCodes.map(code => (<button key={code} onClick={() => {setCodeFilter(code); setCurrentPage(1)}} className={`${baseTabClass} ${codeFilter === code ? activeTabClass : inactiveTabClass}`}>{code}</button>))}
            <div className="w-px h-5 bg-slate-300 mx-1" />
            <button onClick={() => {setCodeFilter('INACTIVE'); setCurrentPage(1)}} className={`${baseTabClass} ${codeFilter === 'INACTIVE' ? 'bg-red-50 text-red-600 shadow-sm ring-1 ring-red-200/50' : 'text-slate-500 hover:text-red-600 hover:bg-red-50/50'}`}><PowerOff className="w-3.5 h-3.5" /> Ocultos</button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase">
              <tr><th className="px-6 py-4">Producto</th><th className="px-6 py-4">Categoría</th><th className="px-6 py-4">Precio (S/)</th><th className="px-6 py-4">Inventario</th><th className="px-6 py-4 text-right">Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? ( Array(5).fill(0).map((_, i) => (<tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-12 w-full" /></td></tr>)) ) : paginatedProducts.length === 0 ? (
                <tr><td colSpan={5} className="py-16 text-center"><div className="flex flex-col items-center justify-center text-slate-500 space-y-3"><Package className="w-10 h-10 text-slate-300" /><p className="font-medium text-slate-600">{codeFilter === 'INACTIVE' ? 'No hay productos inactivos.' : 'No se encontraron productos.'}</p><Button variant="link" onClick={() => { setSearchTerm(''); setCodeFilter('ALL'); setCategoryFilter('ALL'); setStockFilter('ALL'); }}>Limpiar filtros</Button></div></td></tr>
              ) : (
                paginatedProducts.map((product: Product) => {
                  
                  // 🚀 PROTECCIÓN: Sumar solo stock visible
                  const visibleStockList = product.branchStock?.filter(bs => canViewOthers || bs.branchId === user?.branchId) || [];
                  const totalPhysicalStock = visibleStockList.reduce((acc, curr) => acc + curr.quantity, 0);
                  const hasWholesale = Number(product.wholesalePrice) > 0;

                  return (
                    <tr key={product.id} className={`hover:bg-slate-50 transition-colors group ${!product.active ? 'opacity-75 bg-slate-50' : ''}`}>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded border overflow-hidden bg-white shrink-0 flex items-center justify-center ${!product.active ? 'grayscale' : ''}`}>
                            {product.images?.[0] ? <img src={product.images[0]} alt="" className="w-full h-full object-cover" /> : <ImageIcon className="w-4 h-4 text-slate-300" />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-slate-900 leading-tight">{product.title}</p>
                              {!product.active && <Badge variant="destructive" className="text-[9px] py-0 h-4">INACTIVO</Badge>}
                            </div>
                            {(product.barcode || product.code) && (
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-0.5"><BarcodeIcon className="w-3 h-3" /> {product.barcode || product.code}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col items-start gap-1">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal truncate max-w-[150px]">{product.category?.name || 'Sin Categoría'}</Badge>
                          {product.category?.ecommerceCode ? (
                            <span className="text-[9px] font-bold text-indigo-600 flex items-center gap-1 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100"><LinkIcon className="w-2.5 h-2.5" /> {product.category.ecommerceCode}</span>
                          ) : (<span className="text-[9px] font-bold text-slate-500 border px-1.5 py-0.5 rounded bg-white">Compartido</span>)}
                        </div>
                      </td>
                      <td className="px-6 py-3">
                        <p className="font-bold text-slate-900">S/ {Number(product.price).toFixed(2)}</p>
                        {hasWholesale && (
                          <div className="mt-1"><span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/80 px-1.5 py-0.5 rounded border border-emerald-200">Mayorista: S/ {Number(product.wholesalePrice).toFixed(2)}</span></div>
                        )}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-col gap-1">
                          <Badge variant="outline" className={Number(product.stock) <= 0 ? 'border-red-200 text-red-600 bg-red-50 text-[10px]' : Number(product.stock) <= Number(product.minStock) ? 'border-amber-200 text-amber-600 bg-amber-50 text-[10px]' : 'border-blue-200 text-blue-700 bg-blue-50 text-[10px]'}>Web: {product.stock}</Badge>
                          <Badge variant="outline" className="text-[10px] text-slate-600 border-slate-200 bg-white">
                            {!canViewOthers ? 'Tu Local:' : 'Físico:'} {totalPhysicalStock}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-right">
                        <div className="flex items-center justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {(product.barcode || product.code) && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-600 hover:bg-slate-200" onClick={() => setBarcodeProduct(product)}><BarcodeIcon className="w-4 h-4" /></Button>
                          )}
                          {/* 🚀 PROTECCIÓN: Oculta botón editar si no tiene permiso */}
                          {canEdit && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-100" onClick={() => { setSelectedProduct(product); setIsModalOpen(true); }}><Edit className="w-4 h-4" /></Button>
                          )}
                          {canEdit && product.active && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600 hover:bg-red-100" onClick={() => handleDelete(product.id as string)}><Trash2 className="w-4 h-4" /></Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t flex justify-between items-center bg-slate-50">
            <span className="text-sm text-slate-500">Pág. {currentPage} de {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {canCreate || canEdit ? (
        <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} productToEdit={selectedProduct} />
      ) : null}

      <Dialog open={!!barcodeProduct} onOpenChange={() => setBarcodeProduct(null)}>
        <DialogContent className="sm:max-w-sm text-center border-none shadow-2xl p-6 bg-slate-100">
          <DialogHeader className="mb-2"><DialogTitle className="text-center text-slate-500 text-xs uppercase tracking-widest font-bold">Vista Previa Etiqueta</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center justify-center overflow-hidden">
            <div ref={ticketRef} id="barcode-ticket" className="bg-white px-6 py-5 flex flex-col items-center justify-center w-full max-w-[320px] text-black border border-slate-300">
              <h3 className="font-black text-black text-center text-[16px] leading-tight uppercase w-full mb-4 px-2 line-clamp-3">{barcodeProduct?.title}</h3>
              <div className="w-full flex justify-center bg-white overflow-hidden">
                {barcodeProduct && <Barcode value={barcodeProduct.barcode || barcodeProduct.code || '000000'} width={2} height={60} fontSize={16} textMargin={8} margin={10} format="CODE128" background="#ffffff" lineColor="#000000" renderer="canvas" />}
              </div>
            </div>
          </div>
          <div className="flex gap-3 w-full mt-6">
            <Button onClick={() => setBarcodeProduct(null)} className="flex-1" variant="outline">Cerrar</Button>
            <Button onClick={downloadBarcodePNG} className="flex-1 gap-2 bg-slate-900 hover:bg-slate-800 text-white"><Download className="w-4 h-4"/> Descargar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}