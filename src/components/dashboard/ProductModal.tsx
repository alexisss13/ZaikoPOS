'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Package, ExternalLink, DollarSign, Users, Upload, X, Image as ImageIcon } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface ProductData {
  id?: string;
  title: string;
  categoryId: string;
  supplierId?: string | null;
  basePrice: number;
  cost?: number;
  wholesalePrice?: number | null;
  wholesaleMinCount?: number | null;
  minStock?: number;
  barcode?: string | null;
  sku?: string | null;
  code?: string | null;
  active?: boolean;
  images?: string[];
}

interface ProductModalSimpleProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: ProductData | null;
  canEdit?: boolean;
  onDelete?: (id: string) => Promise<void>;
  onPrintBarcode?: (p: ProductData) => void;
}

export function ProductModal({ isOpen, onClose, onSuccess, productToEdit }: ProductModalSimpleProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { data: categories } = useSWR(isOpen ? '/api/categories' : null, fetcher);
  const { data: suppliers } = useSWR(isOpen ? '/api/suppliers' : null, fetcher);
  const { data: branches } = useSWR(isOpen ? '/api/branches' : null, fetcher);

  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('ALL');
  const [branchStocks, setBranchStocks] = useState<Record<string, string>>({});
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    supplierId: '',
    basePrice: '',
    cost: '',
    wholesalePrice: '',
    wholesaleMinCount: '',
    minStock: '',
    sku: '',
    active: true,
  });

  const filteredCategories = categories?.filter((cat: any) => {
    if (selectedBranchCode === 'ALL') return true;
    return cat.ecommerceCode === selectedBranchCode;
  }) || [];

  useEffect(() => {
    if (productToEdit && isOpen) {
      const category = categories?.find((c: any) => c.id === productToEdit.categoryId);
      if (category) {
        setSelectedBranchCode(category.ecommerceCode || 'ALL');
      }
      
      setFormData({
        title: productToEdit.title,
        categoryId: productToEdit.categoryId,
        supplierId: productToEdit.supplierId || '',
        basePrice: productToEdit.basePrice?.toString() || '',
        cost: productToEdit.cost?.toString() || '',
        wholesalePrice: productToEdit.wholesalePrice?.toString() || '',
        wholesaleMinCount: productToEdit.wholesaleMinCount?.toString() || '',
        minStock: productToEdit.minStock?.toString() || '',
        sku: productToEdit.sku || '',
        active: productToEdit.active ?? true,
      });
      setImageUrls((productToEdit as any).images || []);
      setBranchStocks({});
    } else if (isOpen) {
      setSelectedBranchCode('ALL');
      setFormData({
        title: '',
        categoryId: '',
        supplierId: '',
        basePrice: '',
        cost: '',
        wholesalePrice: '',
        wholesaleMinCount: '',
        minStock: '',
        sku: '',
        active: true,
      });
      setImageUrls([]);
      const initialStocks: Record<string, string> = {};
      branches?.forEach((branch: any) => {
        initialStocks[branch.id] = '0';
      });
      setBranchStocks(initialStocks);
    }
  }, [productToEdit, isOpen, categories, branches]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imageUrls.length >= 5) {
      toast.error('Máximo 5 imágenes permitidas');
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen');
      e.target.value = '';
      return;
    }

    setIsUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'zaiko_pos');
    uploadData.append('cloud_name', 'dwunkgitl');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dwunkgitl/image/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await res.json();
      
      if (res.ok && data.secure_url) {
        setImageUrls(prev => [...prev, data.secure_url]);
        toast.success('Imagen subida correctamente');
      } else {
        throw new Error(data.error?.message || 'Error desconocido al subir a Cloudinary');
      }
    } catch (error: any) {
      console.error("Error subiendo imagen:", error);
      toast.error(`Error: ${error.message || 'Fallo de conexión'}`);
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast.error('El nombre del producto es requerido');
      return;
    }

    if (!formData.categoryId) {
      toast.error('Debes seleccionar una categoría');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        title: formData.title,
        categoryId: formData.categoryId,
        supplierId: formData.supplierId || null,
        basePrice: parseFloat(formData.basePrice) || 0,
        cost: parseFloat(formData.cost) || 0,
        wholesalePrice: formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null,
        wholesaleMinCount: formData.wholesaleMinCount ? parseInt(formData.wholesaleMinCount) : null,
        minStock: parseInt(formData.minStock) || 5,
        sku: formData.sku.trim() === '' ? null : formData.sku,
        active: formData.active,
        images: imageUrls.filter(url => url.trim() !== ''),
        branchStocks: productToEdit ? undefined : branchStocks,
      };

      const url = productToEdit?.id ? `/api/products/${productToEdit.id}` : '/api/products';
      const method = productToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(productToEdit?.id ? 'Producto actualizado correctamente' : 'Producto creado exitosamente');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        <DialogHeader className="px-6 py-4 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0 z-10">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <Package className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left flex-1">
            <DialogTitle className="text-xl font-black text-slate-900 leading-tight">
              {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Información básica para el monitoreo de POS e inventario
            </DialogDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => window.open('https://festamas.vercel.app/admin/products', '_blank')}
            className="h-8 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-lg shrink-0 px-3"
          >
            <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
            E-commerce
          </Button>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 overflow-x-hidden custom-scrollbar bg-slate-50/30">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nombre del Producto */}
            <div className="relative">
              <input 
                name="title" 
                value={formData.title} 
                onChange={handleChange} 
                placeholder=" " 
                className="peer w-full h-11 px-3 pt-5 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                required 
              />
              <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-slate-700 peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-slate-700 peer-[:not(:placeholder-shown)]:font-bold">
                Nombre del Producto <span className="text-red-500">*</span>
              </label>
            </div>

            {/* Sucursal, Categoría, Proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Sucursal</Label>
                <Select value={selectedBranchCode} onValueChange={(v) => {
                  setSelectedBranchCode(v);
                  setFormData(p => ({...p, categoryId: ''}));
                }}>
                  <SelectTrigger className={`h-9 text-xs rounded-lg ${selectedBranchCode !== 'ALL' ? 'bg-white border-slate-200 shadow-sm font-bold' : 'bg-slate-50 border-transparent'}`}>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-none shadow-xl">
                    <SelectItem value="ALL" className="py-2 px-3 text-xs">Todas</SelectItem>
                    {branches?.filter((b: any) => b.ecommerceCode).map((branch: any) => (
                      <SelectItem key={branch.id} value={branch.ecommerceCode} className="py-2 px-3 text-xs">
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Categoría <span className="text-red-500">*</span></Label>
                <Select value={formData.categoryId} onValueChange={(v) => setFormData(p => ({...p, categoryId: v}))}>
                  <SelectTrigger className={`h-9 text-xs rounded-lg ${formData.categoryId ? 'bg-white border-slate-200 shadow-sm font-bold' : 'bg-slate-50 border-transparent'}`}>
                    <SelectValue placeholder="Seleccionar" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-none shadow-xl max-h-60">
                    {filteredCategories.length === 0 ? (
                      <div className="py-4 text-center text-xs text-slate-500">Sin categorías</div>
                    ) : (
                      filteredCategories.map((cat: any) => (
                        <SelectItem key={cat.id} value={cat.id} className="py-2 px-3 text-xs">
                          {cat.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3 h-3" /> Proveedor
                </Label>
                <Select value={formData.supplierId || 'NONE'} onValueChange={(v) => setFormData(p => ({...p, supplierId: v === 'NONE' ? '' : v}))}>
                  <SelectTrigger className={`h-9 text-xs rounded-lg ${formData.supplierId ? 'bg-white border-slate-200 shadow-sm font-bold' : 'bg-slate-50 border-transparent'}`}>
                    <SelectValue placeholder="Sin proveedor" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg border-none shadow-xl">
                    <SelectItem value="NONE" className="py-2 px-3 text-xs">Sin proveedor</SelectItem>
                    {suppliers?.filter((s: any) => s.isActive).map((supplier: any) => (
                      <SelectItem key={supplier.id} value={supplier.id} className="py-2 px-3 text-xs">
                        {supplier.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* SKU y Estado */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="relative">
                <input 
                  name="sku" 
                  value={formData.sku} 
                  onChange={handleChange} 
                  placeholder=" " 
                  className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-mono bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                />
                <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-slate-700 peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-slate-700 peer-[:not(:placeholder-shown)]:font-bold">
                  SKU (Código Interno)
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <input 
                  type="checkbox" 
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-300"
                />
                <Label htmlFor="active" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Producto Activo
                </Label>
              </div>
            </div>

            {/* Precios y Costos */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" /> Precios y Costos
              </Label>

              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="relative">
                  <input 
                    name="basePrice" 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice} 
                    onChange={handleChange} 
                    placeholder=" " 
                    className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                    required 
                  />
                  <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-slate-700 peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-slate-700 peer-[:not(:placeholder-shown)]:font-bold">
                    P. Base <span className="text-red-500">*</span>
                  </label>
                </div>

                <div className="relative">
                  <input 
                    name="cost" 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost} 
                    onChange={handleChange} 
                    placeholder=" " 
                    className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                  />
                  <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-slate-700 peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-slate-700 peer-[:not(:placeholder-shown)]:font-bold">
                    Costo
                  </label>
                </div>

                <div className="relative">
                  <input 
                    name="wholesalePrice" 
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.wholesalePrice} 
                    onChange={handleChange} 
                    placeholder=" " 
                    className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                  />
                  <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-slate-700 peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-slate-700 peer-[:not(:placeholder-shown)]:font-bold">
                    P. Mayorista
                  </label>
                </div>

                <div className="relative">
                  <input 
                    name="wholesaleMinCount" 
                    type="number"
                    min="1"
                    value={formData.wholesaleMinCount} 
                    onChange={handleChange} 
                    placeholder=" " 
                    className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                  />
                  <label className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-slate-700 peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[9px] peer-[:not(:placeholder-shown)]:text-slate-700 peer-[:not(:placeholder-shown)]:font-bold truncate w-[calc(100%-20px)]">
                    Min. Mayorista
                  </label>
                </div>

                <div className="relative">
                  <input 
                    name="minStock" 
                    type="number"
                    min="0"
                    value={formData.minStock} 
                    onChange={handleChange} 
                    placeholder=" " 
                    className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                  />
                  <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[10px] peer-focus:text-slate-700 peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-slate-700 peer-[:not(:placeholder-shown)]:font-bold">
                    Stock Mín.
                  </label>
                </div>
              </div>
            </div>

            {/* Imágenes y Stock Inicial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Imágenes */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-400" /> Imágenes del Producto
                </Label>

                <div className="flex flex-wrap gap-2 p-3 bg-white rounded-lg border border-slate-200 min-h-[100px]">
                  {imageUrls.map((url, index) => (
                    <div 
                      key={index} 
                      className="relative w-20 h-20 group bg-slate-100 border-2 border-slate-300 rounded-lg flex-shrink-0"
                    >
                      <img 
                        src={url} 
                        alt={`Producto ${index + 1}`}
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          console.error('Error cargando imagen:', url);
                          e.currentTarget.src = 'https://placehold.co/100x100?text=Error';
                        }}
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeImage(index);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md z-10"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  
                  {imageUrls.length < 5 && (
                    <div className="relative w-20 h-20 flex-shrink-0">
                      <input 
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isUploadingImage}
                        className="hidden"
                        id="image-upload-new"
                      />
                      <label 
                        htmlFor="image-upload-new"
                        className={`w-full h-full flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed transition-all ${
                          isUploadingImage
                            ? 'border-slate-200 bg-slate-50 cursor-not-allowed'
                            : 'border-slate-300 bg-slate-50 hover:border-slate-900 hover:bg-slate-100 cursor-pointer'
                        }`}
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
                        ) : (
                          <>
                            <Upload className="w-5 h-5 text-slate-400" />
                            <span className="text-[10px] font-bold text-slate-400">{imageUrls.length + 1}/5</span>
                          </>
                        )}
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Inicial */}
              {!productToEdit && branches && branches.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 text-slate-400" /> Stock Inicial
                  </Label>

                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-white rounded-lg border border-slate-200">
                    {branches.map((branch: any) => (
                      <div key={branch.id} className="relative">
                        <input 
                          type="number"
                          min="0"
                          value={branchStocks[branch.id] || '0'}
                          onChange={(e) => setBranchStocks(prev => ({...prev, [branch.id]: e.target.value}))}
                          placeholder=" "
                          className="peer w-full h-10 px-3 pt-4 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300 focus:border-slate-300"
                        />
                        <label className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-500 transition-all pointer-events-none peer-focus:top-1.5 peer-focus:text-[9px] peer-focus:text-slate-700 peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-1.5 peer-[:not(:placeholder-shown)]:text-[9px] peer-[:not(:placeholder-shown)]:text-slate-700 peer-[:not(:placeholder-shown)]:font-bold truncate max-w-[calc(100%-24px)]">
                          {branch.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </form>
        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading} 
            className="h-10 text-sm font-bold hover:bg-slate-50 text-slate-600 rounded-lg border-slate-200 px-6"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="product-form" 
            disabled={isLoading} 
            className="h-10 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white px-8 rounded-lg shadow-md transition-all"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}