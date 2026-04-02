'use client';

import { useState, useEffect, useMemo } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Package, DollarSign, Tags, Store, Globe, PowerOff, ScanBarcode, Plus, X, Trash2, Barcode as BarcodeIcon } from 'lucide-react';
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

// 🚀 FIX: Añadimos nuevas props para modo Preview y Botones de cabecera
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
    if (!canEdit) return; // Protección adicional
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
    const base = "transition-all focus-visible:ring-blue-500 font-medium text-xs sm:text-sm w-full rounded-md border px-3 outline-none";
    const size = isTextarea ? "min-h-[70px] resize-y py-2" : "h-8 sm:h-9";
    const state = val && String(val).trim() !== '' && String(val) !== '0'
      ? "bg-blue-50/40 border-blue-200 text-blue-900 shadow-sm" 
      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white";
    
    // 🚀 FIX: Apariencia cuando no se puede editar (Read Only)
    const readOnlyState = !canEdit ? "opacity-75 cursor-not-allowed bg-slate-100" : "";
    return `${base} ${size} ${state} ${readOnlyState}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-6xl p-0 overflow-hidden bg-slate-50 font-sans">
        
        <DialogHeader className="px-4 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center shadow-sm relative gap-3 sm:gap-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-1.5 rounded-lg">
              <Package className="w-5 h-5 text-blue-600" /> 
            </div>
            <div className="flex flex-col items-start pr-4">
              <DialogTitle className="text-base sm:text-lg font-bold text-slate-800 leading-tight">
                {!canEdit ? 'Vista Previa del Producto' : productToEdit ? 'Editar Producto' : 'Crear Producto'}
              </DialogTitle>
              <DialogDescription className="text-[10px] sm:text-xs text-slate-500">
                {canEdit ? 'Añade detalles, precios y stock.' : 'No tienes permisos para modificar este producto.'}
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto sm:ml-auto mt-2 sm:mt-0">
            {/* ESTADO POS */}
            {productToEdit && canEdit && (
              <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                <PowerOff className={`w-3.5 h-3.5 ${formData.active ? 'text-emerald-500' : 'text-slate-400'}`} />
                <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide hidden sm:inline">POS:</span>
                <Select disabled={!canEdit} value={formData.active ? 'true' : 'false'} onValueChange={(v) => setFormData(p => ({...p, active: v === 'true'}))}>
                  <SelectTrigger className={`w-[85px] h-6 text-[10px] font-bold border-none shadow-none focus:ring-0 px-2 ${formData.active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="text-emerald-600 font-bold text-xs">ACTIVO</SelectItem>
                    <SelectItem value="false" className="text-slate-600 font-bold text-xs">OCULTO</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* BOTONES DE ACCIÓN (Imprimir y Eliminar) */}
            {productToEdit && (productToEdit.barcode || productToEdit.code) && (
              <Button type="button" variant="outline" size="sm" className="h-8 text-xs gap-1.5 hidden sm:flex border-slate-200" onClick={() => onPrintBarcode?.(productToEdit)}>
                <BarcodeIcon className="w-3.5 h-3.5" /> Etiqueta
              </Button>
            )}
            {productToEdit && canEdit && productToEdit.active && (
              <Button type="button" variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-red-600 hover:bg-red-50 hover:text-red-700 ml-auto sm:ml-0" onClick={() => onDelete?.(productToEdit.id!)}>
                <Trash2 className="w-3.5 h-3.5" /> Eliminar
              </Button>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[85vh] sm:max-h-[80vh] px-4 py-4 sm:px-5 sm:py-5 overflow-x-hidden">
          <form id="product-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              
              {/* ==================================
                  COLUMNA 1: INFO GENERAL (4/12)
                  ================================== */}
              <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <Tags className="w-3.5 h-3.5 text-blue-500" /> Detalles
                </h3>

                <div className="space-y-1">
                  <Label className="text-[11px] font-semibold text-slate-600">Nombre del Producto <span className="text-red-500">*</span></Label>
                  <input disabled={!canEdit} name="title" value={formData.title} onChange={handleChange} className={getInputClass(formData.title)} required />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  
                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">Catálogo Base <span className="text-red-500">*</span></Label>
                    <Select disabled={!canEdit} value={selectedCatalog} onValueChange={(v) => { setSelectedCatalog(v); setFormData(p => ({...p, categoryId: ''})); }}>
                      <SelectTrigger className={`h-8 sm:h-9 text-xs sm:text-sm focus-visible:ring-blue-500 ${selectedCatalog ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-50 border-slate-200'} ${!canEdit ? 'opacity-75 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder="Elegir sucursal..." />
                      </SelectTrigger>
                      <SelectContent>
                        {validBranches.map(b => (
                          <SelectItem key={b.id} value={b.ecommerceCode!} className="font-medium text-slate-700 py-2 text-xs">
                            <div className="flex items-center gap-2.5">
                              {b.logoUrl ? (
                                <img src={b.logoUrl} alt={b.name} className="w-4 h-4 rounded-sm object-cover border border-slate-200 bg-white" />
                              ) : (
                                <Store className="w-3 h-3 text-blue-500" />
                              )}
                              <span>{b.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">Categoría <span className="text-red-500">*</span></Label>
                    <Select disabled={!canEdit || !selectedCatalog} value={formData.categoryId} onValueChange={(v) => setFormData(p => ({...p, categoryId: v}))}>
                      <SelectTrigger className={`h-8 sm:h-9 text-xs sm:text-sm focus-visible:ring-blue-500 ${formData.categoryId ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-50 border-slate-200'} ${!canEdit ? 'opacity-75 cursor-not-allowed' : ''}`}>
                        <SelectValue placeholder="Seleccionar" />
                      </SelectTrigger>
                      <SelectContent>
                        {filteredCategories.length === 0 && <SelectItem value="none" disabled className="text-xs">No hay categorías</SelectItem>}
                        {filteredCategories.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">Agrupador (Tag)</Label>
                    <input disabled={!canEdit} name="groupTag" value={formData.groupTag} onChange={handleChange} className={getInputClass(formData.groupTag)} placeholder="VERANO-25" />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px] font-semibold text-slate-600">Color / Variante</Label>
                    <div className="flex items-center gap-1.5 relative">
                      <input disabled={!canEdit} name="color" value={formData.color} onChange={handleChange} className={`${getInputClass(formData.color)} pl-8`} placeholder="Rojo, #c02a2a" />
                      <div className={`absolute left-1.5 top-1.5 w-5 h-5 sm:w-6 sm:h-6 rounded shadow-sm border border-slate-300 overflow-hidden ${canEdit ? 'cursor-pointer hover:scale-105 transition-transform' : 'opacity-75 cursor-not-allowed'}`}>
                        <input disabled={!canEdit} type="color" name="color" value={(formData.color?.startsWith('#') && formData.color.length === 7) ? formData.color : '#ffffff'} onChange={handleChange} className="absolute -top-2 -left-2 w-10 h-10 cursor-pointer opacity-0" />
                        <div className="w-full h-full" style={{ backgroundColor: (formData.color?.startsWith('#') && formData.color.length === 7) ? formData.color : '#ffffff' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] font-semibold text-slate-600">Descripción Breve</Label>
                  <textarea disabled={!canEdit} name="description" value={formData.description} onChange={handleChange} className={getInputClass(formData.description, true)} placeholder="Material, uso, detalles..." />
                </div>
              </div>

              {/* ==================================
                  COLUMNA 2: PRECIOS Y CÓDIGOS (4/12)
                  ================================== */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Finanzas
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1 col-span-2">
                      <Label className="text-[11px] font-semibold text-slate-600">Precio Público (S/) <span className="text-red-500">*</span></Label>
                      <input disabled={!canEdit} type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange} className={getInputClass(formData.price)} required />
                    </div>
                    
                    {canViewCosts && (
                      <div className="space-y-1">
                        <Label className="text-[11px] font-semibold text-slate-600">Costo Compra</Label>
                        <input disabled={!canEdit} type="number" min="0" step="0.01" name="cost" value={formData.cost} onChange={handleChange} className={getInputClass(formData.cost)} placeholder="0.00" />
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600">Desc. Web (%)</Label>
                      <input disabled={!canEdit} type="number" min="0" max="100" name="discountPercentage" value={formData.discountPercentage} onChange={handleChange} className={getInputClass(formData.discountPercentage)} placeholder="0" />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600">Precio Mayorista</Label>
                      <input disabled={!canEdit} type="number" min="0" step="0.01" name="wholesalePrice" value={formData.wholesalePrice} onChange={handleChange} className={`${getInputClass(formData.wholesalePrice)} font-bold text-blue-700`} placeholder="0.00" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600">Cant. Min. Mayor</Label>
                      <input disabled={!canEdit} type="number" min="0" name="wholesaleMinCount" value={formData.wholesaleMinCount} onChange={handleChange} className={getInputClass(formData.wholesaleMinCount)} placeholder="12" />
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3 flex-1">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-1.5">
                    <ScanBarcode className="w-3.5 h-3.5 text-slate-500" /> Identificación
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-[11px] font-semibold text-slate-600">Código de Barras</Label>
                        {canEdit && (
                          <button type="button" onClick={generateRandomBarcode} className="text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">Auto</button>
                        )}
                      </div>
                      <input disabled={!canEdit} name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Escanear..." className={`${getInputClass(formData.barcode)} font-mono`} />
                    </div>
                    
                    <div className="space-y-1">
                      <Label className="text-[11px] font-semibold text-slate-600">SKU (Referencia)</Label>
                      <input disabled={!canEdit} name="code" value={formData.code} onChange={handleChange} className={`${getInputClass(formData.code)} font-mono`} />
                    </div>
                  </div>
                </div>

              </div>

              {/* ==================================
                  COLUMNA 3: GALERÍA Y STOCK (4/12)
                  ================================== */}
              <div className="lg:col-span-4 flex flex-col gap-4">
                
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-2">
                  <Label className="text-[11px] font-semibold text-slate-600 flex justify-between">
                    <span>Imágenes <span className="font-normal text-[9px]">(Hasta 5)</span></span>
                  </Label>
                  <div className="flex flex-wrap gap-1.5">
                    {formData.images.map((img, idx) => (
                      <div key={idx} className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg border border-slate-200 overflow-hidden group shadow-sm bg-slate-50">
                        <img src={img} alt="Prod" className="w-full h-full object-cover" />
                        {canEdit && (
                          <button type="button" onClick={() => removeImage(idx)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    
                    {canEdit && formData.images.length < 5 && (
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-300 transition-colors flex items-center justify-center cursor-pointer">
                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {isUploadingImage ? <Loader2 className="w-4 h-4 animate-spin text-blue-600" /> : <Plus className="w-4 h-4 text-slate-400" />}
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
                  <div className="p-3 sm:p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-blue-500" /> Stock Físico
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Label className="text-[9px] sm:text-[10px] text-slate-500">Alerta:</Label>
                      <input disabled={!canEdit} type="number" min="0" name="minStock" value={formData.minStock} onChange={handleChange} className={`w-10 sm:w-12 h-6 text-xs px-1 text-center rounded border focus:ring-blue-500 ${formData.minStock && formData.minStock !== '0' ? 'bg-blue-50/30 border-blue-200' : 'bg-white border-slate-200'} ${!canEdit ? 'opacity-75 cursor-not-allowed' : ''}`} />
                    </div>
                  </div>
                  
                  {visibleBranches.length > 0 ? (
                    <div className="p-2 space-y-1.5 overflow-y-auto hide-scrollbar flex-1 bg-white">
                      {visibleBranches.map(branch => {
                        const stockVal = branchStocks[branch.id];
                        const hasStock = stockVal && stockVal !== '0';
                        return (
                          <div key={branch.id} className={`flex items-center justify-between px-3 py-1.5 border rounded-lg transition-colors ${hasStock ? 'bg-blue-50/20 border-blue-200 shadow-sm' : 'bg-slate-50/50 border-slate-100'}`}>
                            <span className="text-[11px] sm:text-xs font-semibold text-slate-700 truncate mr-2">{branch.name}</span>
                            <input 
                              disabled={!canEdit}
                              type="number" 
                              min="0"
                              className={`w-14 sm:w-16 h-6 sm:h-7 text-right font-bold text-xs sm:text-sm bg-transparent border-none focus:ring-0 p-0 text-slate-900 ${!canEdit ? 'cursor-not-allowed' : ''}`} 
                              value={stockVal || ''} 
                              placeholder="0"
                              onChange={(e) => handleBranchStockChange(branch.id, e.target.value)} 
                            />
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-[10px] text-slate-400 bg-slate-50 border-t border-dashed">Sin permisos para stock.</div>
                  )}

                  <div className="p-3 sm:p-4 bg-slate-900 text-white flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] sm:text-xs font-bold text-blue-400 flex items-center gap-1.5"><Globe className="w-3 h-3" /> E-commerce</span>
                      <span className="text-[9px] text-slate-400">Total Global</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-black">{totalCalculatedStock} <span className="text-[10px] sm:text-xs font-medium text-slate-500">un.</span></div>
                  </div>
                </div>

              </div>
            </div>
          </form>
        </ScrollArea>

        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 sm:gap-3">
          <Button type="button" variant="outline" onClick={onClose} className="h-8 sm:h-9 text-[11px] sm:text-xs hover:bg-slate-200 bg-white">
            {canEdit ? 'Cancelar' : 'Cerrar Vista Previa'}
          </Button>
          {canEdit && (
            <Button type="submit" form="product-form" className="h-8 sm:h-9 text-[11px] sm:text-xs bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 shadow-sm font-semibold" disabled={isLoading || isUploadingImage}>
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Guardar Producto
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}