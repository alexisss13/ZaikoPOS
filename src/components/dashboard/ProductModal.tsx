'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Package, Image as ImageIcon, DollarSign, Barcode, Tags, Store, Globe, PowerOff, ScanBarcode } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context'; // 🚀 IMPORTAMOS CONTEXTO

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Category { id: string; name: string; }
interface Branch { id: string; name: string; ecommerceCode: string | null; }

export interface ProductData {
  id?: string;
  title: string;
  description: string;
  categoryId: string;
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
  tags: string;
  image: string; 
  images?: string[]; 
  branchStock?: { branchId: string; quantity: number }[]; 
  active: boolean;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: ProductData | null;
}

export function ProductModal({ isOpen, onClose, onSuccess, productToEdit }: ProductModalProps) {
  // 🚀 OBTENEMOS AL USUARIO Y SUS PERMISOS
  const { user, role } = useAuth();
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  const permissions = user?.permissions || {};
  
  const canViewCosts = isSuperOrOwner || permissions.canViewCosts;
  const canViewOtherBranches = isSuperOrOwner || permissions.canViewOtherBranches;

  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { data: categories } = useSWR<Category[]>('/api/categories', fetcher);
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);

  const [formData, setFormData] = useState<ProductData>({
    title: '', description: '', categoryId: '', price: '', cost: '', wholesalePrice: '', wholesaleMinCount: '', 
    discountPercentage: '0', stock: '0', minStock: '5', barcode: '', code: '', color: '', tags: '', image: '', active: true
  });

  const [branchStocks, setBranchStocks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (productToEdit && isOpen) {
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
        tags: Array.isArray(productToEdit.tags) ? productToEdit.tags.join(', ') : (productToEdit.tags || ''),
        image: productToEdit.images?.[0] || '',
        active: productToEdit.active ?? true,
      });

      const initialBranchStocks: Record<string, string> = {};
      productToEdit.branchStock?.forEach(bs => {
        initialBranchStocks[bs.branchId] = bs.quantity.toString();
      });
      setBranchStocks(initialBranchStocks);

    } else if (isOpen) {
      setFormData({
        title: '', description: '', categoryId: '', price: '', cost: '', wholesalePrice: '', wholesaleMinCount: '', 
        discountPercentage: '0', stock: '0', minStock: '5', barcode: '', code: '', color: '', tags: '', image: '', active: true
      });
      setBranchStocks({});
    }
  }, [productToEdit, isOpen]);

  const totalCalculatedStock = Object.values(branchStocks).reduce((acc, curr) => acc + (parseInt(curr) || 0), 0);
  
  // 🚀 Filtramos las tiendas que SÍ puede ver este usuario (pero el backend recibirá TODAS en el save)
  const visibleBranches = branches?.filter(b => canViewOtherBranches || b.id === user?.branchId) || [];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBranchStockChange = (branchId: string, value: string) => {
    if (value !== '' && parseInt(value) < 0) return;
    setBranchStocks(prev => ({ ...prev, [branchId]: value }));
  };

  const generateRandomBarcode = () => {
    const code = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setFormData(prev => ({ ...prev, barcode: code }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      if (data.secure_url) { setFormData(prev => ({ ...prev, image: data.secure_url })); toast.success('Imagen subida'); } 
      else throw new Error('Error al subir');
    } catch (error) { toast.error('Error con Cloudinary'); } 
    finally { setIsUploadingImage(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.categoryId) return toast.error('Debes seleccionar una categoría');
    
    setIsLoading(true);
    try {
      const finalBarcode = formData.barcode?.trim() || Math.floor(100000000000 + Math.random() * 900000000000).toString();

      const payload = { 
        ...formData, 
        barcode: finalBarcode, 
        branchStocks // Envía el objeto completo (los inputs que no vio no se sobrescriben)
      };

      const url = productToEdit?.id ? `/api/products/${productToEdit.id}` : '/api/products';
      const method = productToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      
      toast.success(productToEdit?.id ? 'Producto actualizado' : 'Producto creado');
      onSuccess(); onClose();
    } catch (error: unknown) { 
      const err = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(err); 
    } 
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="px-6 py-4 bg-white border-b">
          <DialogTitle className="flex items-center gap-2 text-xl"><Package className="w-5 h-5 text-primary" /> {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}</DialogTitle>
          <DialogDescription>Completa la información para el catálogo virtual y el POS.</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] px-6 py-4">
          <form id="product-form" onSubmit={handleSubmit} className="space-y-6">
            
            {productToEdit && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><PowerOff className="w-4 h-4 text-slate-400" /> Estado del Producto</h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Si está inactivo, desaparecerá de la web y de la caja.</p>
                </div>
                <Select value={formData.active ? 'true' : 'false'} onValueChange={(v) => setFormData(p => ({...p, active: v === 'true'}))}>
                  <SelectTrigger className="w-[140px] h-8 text-xs font-bold bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true" className="text-emerald-600 font-bold">Activo</SelectItem>
                    <SelectItem value="false" className="text-red-600 font-bold">Inactivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><Tags className="w-4 h-4 text-indigo-500" /> Info. General</h3>
              <div className="flex gap-4 items-center mb-2">
                <div className="w-20 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shrink-0 flex items-center justify-center">
                  {formData.image ? <img src={formData.image} alt="Preview" className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-slate-300" />}
                </div>
                <div className="flex-1 space-y-1">
                  <Label className="text-xs font-bold text-slate-600">Foto Principal</Label>
                  <div className="relative">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="text-xs h-9 cursor-pointer" />
                    {isUploadingImage && <div className="absolute inset-0 bg-white/90 flex items-center justify-center text-xs font-bold text-indigo-600 gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</div>}
                  </div>
                </div>
              </div>
              <div className="space-y-2"><Label>Nombre del Producto *</Label><Input name="title" value={formData.title} onChange={handleChange} required /></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Categoría *</Label>
                  <Select value={formData.categoryId} onValueChange={(v) => setFormData(p => ({...p, categoryId: v}))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                    <SelectContent>
                      {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Color / Variante</Label><Input name="color" value={formData.color} onChange={handleChange} placeholder="Ej: Rojo, Talla M..." /></div>
              </div>
            </div>

            {/* 🚀 PRIVACIDAD DE COSTOS: El grid se adapta si se oculta el campo costo */}
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><DollarSign className="w-4 h-4 text-emerald-500" /> Precios y Costos</h3>
              <div className={`grid grid-cols-1 ${canViewCosts ? 'md:grid-cols-2' : ''} gap-4`}>
                <div className="space-y-2"><Label>Precio Venta (S/) *</Label><Input type="number" min="0" step="0.01" name="price" value={formData.price} onChange={handleChange} required /></div>
                
                {canViewCosts && (
                  <div className="space-y-2"><Label>Costo Compra (S/)</Label><Input type="number" min="0" step="0.01" name="cost" value={formData.cost} onChange={handleChange} placeholder="Opcional" /></div>
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2"><Barcode className="w-4 h-4 text-orange-500" /> Códigos e Inventario</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2"><ScanBarcode className="w-4 h-4 text-slate-500"/> Código de Barras</Label>
                  <div className="flex gap-2">
                    <Input name="barcode" value={formData.barcode} onChange={handleChange} placeholder="Escanea o genera..." className="font-mono bg-white" />
                    <Button type="button" variant="outline" onClick={generateRandomBarcode} className="shrink-0" title="Generar código aleatorio">
                      Generar
                    </Button>
                  </div>
                  <p className="text-[10px] text-slate-400">Si lo dejas vacío, se autogenerará al guardar.</p>
                </div>
                <div className="space-y-2"><Label>Código Interno (SKU)</Label><Input name="code" value={formData.code} onChange={handleChange} /></div>
              </div>

              {/* 🚀 PROTECCIÓN: Solo muestra la sucursal a la que tiene permiso de ver */}
              <div className="pt-4 border-t">
                <Label className="text-slate-600 flex items-center gap-2 mb-3"><Store className="w-4 h-4" /> Stock Físico por Tienda</Label>
                {visibleBranches.length > 0 ? (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    {visibleBranches.map(branch => (
                      <div key={branch.id} className="flex items-center justify-between gap-4">
                        <span className="text-sm font-medium text-slate-700 truncate">{branch.name}</span>
                        <Input 
                          type="number" 
                          min="0"
                          placeholder="0" 
                          className="w-24 text-right bg-white" 
                          value={branchStocks[branch.id] || ''} 
                          onChange={(e) => handleBranchStockChange(branch.id, e.target.value)} 
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded border border-dashed">No tienes sucursales asignadas o no cuentas con permisos para editar stock.</p>
                )}
              </div>

              <div className="pt-4 mt-2 border-t flex items-center justify-between bg-indigo-50 p-4 rounded-lg border border-indigo-100">
                <div className="flex flex-col">
                  <span className="text-sm font-bold text-indigo-900 flex items-center gap-1"><Globe className="w-4 h-4" /> Stock Global (Web)</span>
                  <span className="text-[10px] text-indigo-600">Calculado automáticamente {!canViewOtherBranches ? '(Incluye stock de otras tiendas)' : ''}</span>
                </div>
                <div className="text-2xl font-black text-indigo-700">{totalCalculatedStock}</div>
              </div>
            </div>
            
          </form>
        </ScrollArea>

        <div className="px-6 py-4 bg-white border-t flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="product-form" disabled={isLoading || isUploadingImage}>
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar Producto
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}