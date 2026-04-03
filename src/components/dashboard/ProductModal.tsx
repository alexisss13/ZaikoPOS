'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Package, DollarSign, Tags, Store, Globe, PowerOff, ScanBarcode, Plus, X, Trash2, Barcode as BarcodeIcon, Camera } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context'; 

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Category { id: string; name: string; ecommerceCode: string | null; }
interface Branch { id: string; name: string; ecommerceCode: string | null; logoUrl?: string | null; }

export interface ProductData {
  id?: string;
  title: string;
  description: string;
  categoryId: string;
  category?: { ecommerceCode: string | null };
  price: string;
  cost: string;
  wholesalePrice: string;
  wholesaleMinCount: string;
  discountPercentage: string;
  stock: string;
  minStock: string;
  barcode: string;
  code: string;
  color: string;
  groupTag: string; 
  tags: string;
  images: string[]; 
  branchStock?: { branchId: string; quantity: number }[]; 
  active: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: ProductData | null;
  canEdit?: boolean;
  onDelete?: (id: string) => void;
  onPrintBarcode?: (product: ProductData) => void;
}

export function ProductModal({ isOpen, onClose, onSuccess, productToEdit, canEdit = true, onDelete, onPrintBarcode }: ProductModalProps) {
  const { user, role } = useAuth();
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  const permissions = user?.permissions || {};
  
  const canViewCosts = isSuperOrOwner || !!permissions.canViewCosts;
  const canManageGlobal = isSuperOrOwner || !!permissions.canManageGlobalProducts;
  const canViewOtherBranches = isSuperOrOwner || !!permissions.canViewOtherBranches || canManageGlobal;

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { data: categories } = useSWR<Category[]>('/api/categories', fetcher);
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  
  const validBranches = branches?.filter(b => b.ecommerceCode) || [];
  const [selectedCatalog, setSelectedCatalog] = useState<string>('');

  const [formData, setFormData] = useState<ProductData>({
    title: '', description: '', categoryId: '', price: '', cost: '', wholesalePrice: '', wholesaleMinCount: '', 
    discountPercentage: '0', stock: '0', minStock: '5', barcode: '', code: '', color: '', groupTag: '', tags: '', images: [], active: true
  });

  const [branchStocks, setBranchStocks] = useState<Record<string, string>>({});

  const filteredCategories = useMemo(() => {
    if (!categories || !selectedCatalog) return [];
    return categories.filter(c => c.ecommerceCode === selectedCatalog);
  }, [categories, selectedCatalog]);

  useEffect(() => {
    if (productToEdit && isOpen) {
      setSelectedCatalog(productToEdit.category?.ecommerceCode || (validBranches.length > 0 ? validBranches[0].ecommerceCode! : ''));
      
      setFormData({
        title: productToEdit.title || '',
        description: productToEdit.description || '',
        categoryId: productToEdit.categoryId || '',
        price: productToEdit.price?.toString() || '',
        cost: productToEdit.cost?.toString() || '',
        wholesalePrice: productToEdit.wholesalePrice?.toString() || '',
        wholesaleMinCount: productToEdit.wholesaleMinCount?.toString() || '',
        discountPercentage: productToEdit.discountPercentage?.toString() || '0',
        stock: productToEdit.stock?.toString() || '0',
        minStock: productToEdit.minStock?.toString() || '5',
        barcode: productToEdit.barcode || '',
        code: productToEdit.code || '',
        color: productToEdit.color || '',
        groupTag: productToEdit.groupTag || '',
        tags: Array.isArray(productToEdit.tags) ? productToEdit.tags.join(', ') : (productToEdit.tags || ''),
        images: productToEdit.images || [], 
        active: productToEdit.active ?? true,
      });

      const initialBranchStocks: Record<string, string> = {};
      productToEdit.branchStock?.forEach(bs => {
        initialBranchStocks[bs.branchId] = bs.quantity.toString();
      });
      setBranchStocks(initialBranchStocks);

    } else if (isOpen) {
      const defaultCatalog = validBranches.length > 0 ? validBranches[0].ecommerceCode! : '';
      setSelectedCatalog(defaultCatalog);
      setFormData({
        title: '', description: '', categoryId: '', price: '', cost: '', wholesalePrice: '', wholesaleMinCount: '', 
        discountPercentage: '0', stock: '0', minStock: '5', barcode: '', code: '', color: '', groupTag: '', tags: '', images: [], active: true
      });
      setBranchStocks({});
    }
  }, [productToEdit, isOpen, branches]);

  const totalCalculatedStock = Object.values(branchStocks).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
  const visibleBranches = branches?.filter(b => canViewOtherBranches || b.id === user?.branchId) || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!canEdit) return;
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBranchStockChange = (branchId: string, value: string) => {
    if (!canEdit) return;
    if (value !== '' && parseInt(value) < 0) return;
    setBranchStocks(prev => ({ ...prev, [branchId]: value }));
  };

  const generateRandomBarcode = () => {
    if (!canEdit) return;
    const code = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setFormData(prev => ({ ...prev, barcode: code }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canEdit) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'zaiko_pos'); 
    uploadData.append('cloud_name', 'dwunkgitl');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dwunkgitl/image/upload', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.secure_url) { 
        setFormData(prev => ({ ...prev, images: [...prev.images, data.secure_url].slice(0, 5) })); 
        toast.success('Imagen agregada'); 
      } 
      else throw new Error('Error al subir');
    } catch (error) { toast.error('Error con Cloudinary'); } 
    finally { setIsUploadingImage(false); e.target.value = ''; }
  };

  const removeImage = (indexToRemove: number) => {
    if (!canEdit) return;
    setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== indexToRemove) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;
    if (!formData.categoryId) return toast.error('Debes seleccionar una categoría obligatoria');
    if (!selectedCatalog) return toast.error('Debes seleccionar un catálogo.');
    
    setIsLoading(true);
    try {
      const finalBarcode = formData.barcode?.trim() || Math.floor(100000000000 + Math.random() * 900000000000).toString();
      const payload = { ...formData, barcode: finalBarcode, branchStocks };
      const url = productToEdit?.id ? `/api/products/${productToEdit.id}` : '/api/products';
      const method = productToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      
      toast.success(productToEdit?.id ? 'Producto actualizado' : 'Producto creado exitosamente');
      onSuccess(); onClose();
    } catch (error: unknown) { 
      toast.error('Error al guardar el producto'); 
    } 
    finally { setIsLoading(false); }
  };

  const getInputClass = (val: string | number | undefined, isTextarea = false) => {
    const base = "transition-all focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs sm:text-sm w-full rounded-lg border px-3 outline-none";
    const size = isTextarea ? "min-h-[60px] resize-y py-2" : "h-9";
    const state = val && String(val).trim() !== '' && String(val) !== '0'
      ? "bg-white border-slate-200 text-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]" 
      : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100";
    
    const readOnlyState = !canEdit ? "opacity-75 cursor-not-allowed bg-slate-100/50 shadow-none border-transparent text-slate-500" : "";
    return `${base} ${size} ${state} ${readOnlyState}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      {/* 🚀 FIX: El contenedor principal ahora tiene bg-white sólido y el ScrollArea bg-slate-50/50 */}
      <DialogContent className="w-[98vw] sm:max-w-6xl p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl flex flex-col max-h-[96vh]">
        
        {/* 🚀 HEADER PLANO Y COMPACTO */}
        <DialogHeader className="px-5 py-3 sm:px-6 sm:py-3.5 bg-white border-b border-slate-200/60 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between shrink-0 z-10 gap-3">
          
          <div className="flex items-center gap-3">
            <div className="bg-slate-50 p-2 rounded-xl border border-slate-100 shrink-0">
              <Package className="w-5 h-5 text-slate-700" /> 
            </div>
            <div className="flex flex-col items-start text-left">
              <DialogTitle className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                {!canEdit ? 'Vista Previa del Producto' : productToEdit ? 'Editar Producto' : 'Crear Producto'}
              </DialogTitle>
              <DialogDescription className="text-[10px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                {canEdit ? 'Añade detalles, precios y stock logístico.' : 'No tienes permisos para modificar este producto.'}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto mt-1 sm:mt-0">
            {/* ESTADO POS FLAT */}
            {productToEdit && canEdit && (
              <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-xl border border-slate-200/60 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]">
                <PowerOff className={`w-3.5 h-3.5 ${formData.active ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline">POS:</span>
                <Select disabled={!canEdit} value={formData.active ? 'true' : 'false'} onValueChange={(v) => setFormData(p => ({...p, active: v === 'true'}))}>
                  <SelectTrigger className={`w-[85px] h-7 text-[10px] font-bold border-none shadow-none focus:ring-0 px-2 rounded-lg transition-colors ${formData.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl min-w-[100px]">
                    <SelectItem value="true" className="text-emerald-600 font-bold text-xs py-2">ACTIVO</SelectItem>
                    <SelectItem value="false" className="text-slate-600 font-bold text-xs py-2">OCULTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* BOTONES SECUNDARIOS */}
            {productToEdit && (productToEdit.barcode || productToEdit.code) && (
              <Button type="button" variant="outline" size="sm" className="h-9 text-xs font-bold gap-1.5 hidden sm:flex border-slate-200 hover:bg-slate-50 rounded-xl" onClick={() => onPrintBarcode?.(productToEdit)}>
                <BarcodeIcon className="w-3.5 h-3.5 text-slate-500" /> Etiqueta
              </Button>
            )}
            {productToEdit && canEdit && productToEdit.active && (
              <Button type="button" variant="ghost" size="sm" className="h-9 text-xs font-bold gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 ml-auto sm:ml-0 rounded-xl" onClick={() => onDelete?.(productToEdit.id!)}>
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </Button>
            )}
          </div>
        </DialogHeader>

        {/* 🚀 SCROLL AREA AJUSTADO CON FONDO GRIS SUAVE */}
        <ScrollArea className="flex-1 px-3 py-3 sm:px-5 sm:py-4 overflow-x-hidden w-full bg-slate-50/50">
          <form id="product-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-4">
              
              {/* ==================================
                  COLUMNA 1: INFO GENERAL (4/12)
                  ================================== */}
              <div className="lg:col-span-4 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase tracking-wide">
                  <Tags className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} /> Detalles Base
                </h3>

                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Nombre del Producto <span className="text-red-500">*</span></Label>
                  <input disabled={!canEdit} name="title" value={formData.title} onChange={handleChange} className={getInputClass(formData.title)} required />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Catálogo (Sede) <span className="text-red-500">*</span></Label>
                    <Select disabled={!canEdit} value={selectedCatalog} onValueChange={(v) => { setSelectedCatalog(v); setFormData(p => ({...p, categoryId: ''})); }}>
                      <SelectTrigger className={`h-9 text-xs sm:text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-slate-300 transition-all ${selectedCatalog ? 'bg-white border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] font-bold text-slate-900' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'} ${!canEdit ? 'opacity-75 cursor-not-allowed bg-slate-100/50 border-transparent shadow-none font-medium text-slate-500' : ''}`}>
                        <SelectValue placeholder="Sede..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        {validBranches.map(b => (
                          <SelectItem key={b.id} value={b.ecommerceCode!} className="font-medium text-slate-700 py-2 text-xs">
                            <div className="flex items-center gap-2">
                              {b.logoUrl ? <img src={b.logoUrl} alt={b.name} className="w-3.5 h-3.5 rounded-sm object-cover bg-white border border-slate-200" /> : <Store className="w-3 h-3 text-slate-400" />}
                              <span>{b.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Categoría <span className="text-red-500">*</span></Label>
                    <Select disabled={!canEdit || !selectedCatalog} value={formData.categoryId} onValueChange={(v) => setFormData(p => ({...p, categoryId: v}))}>
                      <SelectTrigger className={`h-9 text-xs sm:text-sm rounded-lg focus-visible:ring-1 focus-visible:ring-slate-300 transition-all ${formData.categoryId ? 'bg-white border-slate-200 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] font-bold text-slate-900' : 'bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100'} ${!canEdit ? 'opacity-75 cursor-not-allowed bg-slate-100/50 border-transparent shadow-none font-medium text-slate-500' : ''}`}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        {filteredCategories.length === 0 && <SelectItem value="none" disabled className="text-xs">No hay categorías</SelectItem>}
                        {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs font-medium py-2">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Agrupador (Tag)</Label>
                    <input disabled={!canEdit} name="groupTag" value={formData.groupTag} onChange={handleChange} className={getInputClass(formData.groupTag)} placeholder="VERANO-25" />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Color / Variante</Label>
                    <div className="flex items-center gap-1.5 relative">
                      <input disabled={!canEdit} name="color" value={formData.color} onChange={handleChange} className={`${getInputClass(formData.color)} pl-8`} placeholder="Rojo, #c02a2a" />
                      <div className={`absolute left-2 top-2 w-5 h-5 rounded-md shadow-[0_2px_4px_rgba(0,0,0,0.1)] border border-slate-200 overflow-hidden ${canEdit ? 'cursor-pointer hover:scale-105 transition-transform' : 'opacity-75 cursor-not-allowed'}`}>
                        <input disabled={!canEdit} type="color" name="color" value={(formData.color?.startsWith('#') && formData.color.length === 7) ? formData.color : '#ffffff'} onChange={handleChange} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer opacity-0" />
                        <div className="w-full h-full" style={{ backgroundColor: (formData.color?.startsWith('#') && formData.color.length === 7) ? formData.color : '#ffffff' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Descripción Breve</Label>
                  <textarea disabled={!canEdit} name="description" value={formData.description} onChange={handleChange} className={getInputClass(formData.description, true)} placeholder="Material, uso, detalles..." />
                </div>
              </div>

              {/* ==================================
                  COLUMNA 2: PRECIOS Y CÓDIGOS (4/12)
                  ================================== */}
              <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4">
                
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase tracking-wide">
                    <DollarSign className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} /> Finanzas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5 col-span-2">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Precio Público (S/) <span className="text-red-500">*</span></Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">S/</span>
                        <input disabled={!canEdit} type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange} className={`${getInputClass(formData.price)} pl-8 font-black text-slate-900 text-lg h-10`} required placeholder="0.00" />
                      </div>
                    </div>
                    
                    {canViewCosts && (
                      <div className="space-y-1.5">
                        <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Costo Compra</Label>
                        <input disabled={!canEdit} type="number" min="0" step="0.01" name="cost" value={formData.cost} onChange={handleChange} className={getInputClass(formData.cost)} placeholder="0.00" />
                      </div>
                    )}
                    
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Desc. Web (%)</Label>
                      <input disabled={!canEdit} type="number" min="0" max="100" name="discountPercentage" value={formData.discountPercentage} onChange={handleChange} className={getInputClass(formData.discountPercentage)} placeholder="0" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Precio Mayorista</Label>
                      <input disabled={!canEdit} type="number" min="0" step="0.01" name="wholesalePrice" value={formData.wholesalePrice} onChange={handleChange} className={`${getInputClass(formData.wholesalePrice)} font-bold ${formData.wholesalePrice && formData.wholesalePrice !== '0' ? 'text-emerald-700' : ''}`} placeholder="0.00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Cant. Min. Mayor</Label>
                      <input disabled={!canEdit} type="number" min="0" name="wholesaleMinCount" value={formData.wholesaleMinCount} onChange={handleChange} className={getInputClass(formData.wholesaleMinCount)} placeholder="12" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-3 flex-1">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 uppercase tracking-wide">
                    <ScanBarcode className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} /> Identificación
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">Código de Barras</Label>
                        {canEdit && (
                          <button type="button" onClick={generateRandomBarcode} className="text-[9px] font-black text-slate-500 hover:text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded transition-colors uppercase tracking-wider">Auto</button>
                        )}
                      </div>
                      <input disabled={!canEdit} name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Escanear o tipear..." className={`${getInputClass(formData.barcode)} font-mono tracking-wider`} />
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider">SKU (Referencia)</Label>
                      <input disabled={!canEdit} name="code" value={formData.code} onChange={handleChange} className={`${getInputClass(formData.code)} font-mono tracking-wider uppercase`} placeholder="Ej: PROD-123" />
                    </div>
                  </div>
                </div>

              </div>

              {/* ==================================
                  COLUMNA 3: GALERÍA Y STOCK (4/12)
                  ================================== */}
              <div className="lg:col-span-4 flex flex-col gap-3 sm:gap-4">
                
                <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/60 shadow-sm space-y-2">
                  <Label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex justify-between">
                    <span>Imágenes <span className="font-medium text-slate-400">(Máx 5)</span></span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative w-12 h-12 rounded-xl border border-slate-200 overflow-hidden group shadow-sm bg-white p-0.5">
                        <img src={img} alt="Prod" className="w-full h-full object-cover rounded-lg" />
                        {canEdit && (
                          <button type="button" onClick={() => removeImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {canEdit && formData.images.length < 5 && (
                      <div className="relative w-12 h-12 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors flex items-center justify-center cursor-pointer group shadow-sm">
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" /> : <Camera className="w-4 h-4 text-slate-400 group-hover:scale-110 transition-transform" strokeWidth={1.5} />}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col flex-1">
                  <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 uppercase tracking-wide">
                      <Store className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.5} /> Stock Físico
                    </h3>
                    <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                      <Label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alerta Min:</Label>
                      <input disabled={!canEdit} type="number" min="0" name="minStock" value={formData.minStock} onChange={handleChange} className={`w-8 h-5 text-[10px] font-bold px-1 text-center rounded border-none focus:ring-0 p-0 text-slate-800 ${!canEdit ? 'bg-transparent cursor-not-allowed' : 'bg-transparent'}`} />
                    </div>
                  </div>
                  
                  {visibleBranches.length > 0 ? (
                    <div className="p-2 space-y-1 overflow-y-auto hide-scrollbar flex-1 bg-white">
                      {visibleBranches.map(branch => {
                        const stockVal = branchStocks[branch.id];
                        const hasStock = stockVal && stockVal !== '0';
                        return (
                          <div key={branch.id} className={`flex items-center justify-between px-3 py-2 rounded-xl transition-colors border border-transparent ${hasStock ? 'bg-slate-50 border-slate-200 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]' : 'bg-transparent hover:bg-slate-50'}`}>
                            <span className="text-[11px] font-bold text-slate-600 truncate mr-2">{branch.name}</span>
                            <input 
                              disabled={!canEdit}
                              type="number" 
                              min="0"
                              className={`w-14 h-7 rounded-md text-right font-black text-sm p-1.5 transition-all focus:ring-1 focus:ring-slate-300 ${hasStock ? 'bg-white border border-slate-200 text-slate-900 shadow-sm' : 'bg-slate-100 border-transparent text-slate-500'} ${!canEdit ? 'cursor-not-allowed opacity-75' : ''}`} 
                              value={stockVal || ''} 
                              placeholder="0"
                              onChange={(e) => handleBranchStockChange(branch.id, e.target.value)} 
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-6 text-center text-[10px] text-slate-400 bg-white italic flex-1 flex items-center justify-center">Sin acceso al stock.</div>
                  )}

                  {/* FOOTER DEL TOTAL */}
                  <div className="p-3 bg-slate-900 text-white flex items-center justify-between mt-auto shrink-0">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Globe className="w-3 h-3" /> E-commerce</span>
                    </div>
                    <div className="text-xl font-black text-white">{totalCalculatedStock} <span className="text-[10px] font-bold text-slate-400 uppercase">Unidades</span></div>
                  </div>
                </div>

              </div>
            </div>
          </form>
        </ScrollArea>

        {/* 🚀 FOOTER PLANO DEL MODAL */}
        <div className="px-5 py-3 sm:px-6 sm:py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <Button type="button" variant="outline" onClick={onClose} className="h-10 text-xs font-bold hover:bg-slate-50 text-slate-600 rounded-xl border-slate-200">
            {canEdit ? 'Cancelar' : 'Cerrar Vista Previa'}
          </Button>
          {canEdit && (
            <Button type="submit" form="product-form" className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-6 rounded-xl shadow-md transition-all" disabled={isLoading || isUploadingImage}>
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Guardar Producto
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}