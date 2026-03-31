'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Tags, Image as ImageIcon, Store } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface CategoryData {
  id?: string;
  name: string;
  slug: string;
  ecommerceCode?: string | null;
  image: string | null;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: CategoryData | null;
}

interface Branch {
  id: string;
  name: string;
  ecommerceCode: string | null;
  logoUrl?: string | null; // 🚀 Listo para recibir el logo de la BD
}

export function CategoryModal({ isOpen, onClose, onSuccess, categoryToEdit }: CategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  
  // 🚀 Filtramos para tener solo las que tienen e-commerce
  const validBranches = branches?.filter(b => b.ecommerceCode) || [];

  const [formData, setFormData] = useState({
    name: '', slug: '', ecommerceCode: '', image: '',
  });

  useEffect(() => {
    if (categoryToEdit && isOpen) {
      setFormData({
        name: categoryToEdit.name,
        slug: categoryToEdit.slug,
        ecommerceCode: categoryToEdit.ecommerceCode || (validBranches[0]?.ecommerceCode || ''),
        image: categoryToEdit.image || '',
      });
    } else if (isOpen) {
      // 🚀 Auto-selecciona la primera sucursal válida por defecto
      const defaultBranch = validBranches.length > 0 ? validBranches[0].ecommerceCode! : '';
      setFormData({ name: '', slug: '', ecommerceCode: defaultBranch, image: '' });
    }
  }, [categoryToEdit, isOpen, branches]); // Se re-ejecuta cuando cargan las sucursales

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
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
      if (data.secure_url) { 
        setFormData(prev => ({ ...prev, image: data.secure_url })); 
        toast.success('Imagen subida correctamente'); 
      } 
      else { throw new Error(data.error?.message || 'Error al subir la imagen'); }
    } catch (error) { 
      toast.error('Error de conexión con Cloudinary'); 
    } 
    finally { setIsUploadingImage(false); e.target.value = ''; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validBranches.length > 0 && !formData.ecommerceCode) {
      return toast.error('Debes elegir a qué sucursal pertenece esta categoría.');
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        ecommerceCode: formData.ecommerceCode || null,
        image: formData.image.trim() === '' ? null : formData.image
      };

      const url = categoryToEdit?.id ? `/api/categories/${categoryToEdit.id}` : '/api/categories';
      const method = categoryToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      
      toast.success(categoryToEdit?.id ? 'Categoría actualizada exitosamente' : 'Categoría creada con éxito');
      onSuccess(); onClose();
    } catch (error: unknown) { 
      const err = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(err); 
    } 
    finally { setIsLoading(false); }
  };

  const getInputClass = (val: string | undefined) => {
    const base = "transition-all focus-visible:ring-blue-500 font-medium text-sm w-full rounded-md border px-3 h-10 outline-none";
    const state = val && val.trim() !== ''
      ? "bg-blue-50/40 border-blue-200 text-blue-900 shadow-sm" 
      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white";
    return `${base} ${state}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-slate-50 font-sans">
        
        <DialogHeader className="px-5 py-4 sm:px-6 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Tags className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex flex-col items-start">
              <DialogTitle className="text-lg sm:text-xl font-bold text-slate-800 leading-tight">
                {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}
              </DialogTitle>
              <DialogDescription className="text-[11px] sm:text-xs text-slate-500 mt-0.5">
                Define los pasillos virtuales de tu tienda.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          
          {/* Subida de Imagen */}
          <div className="space-y-2 pb-2">
            <Label className="text-xs font-semibold text-slate-700">Imagen Representativa (Opcional)</Label>
            <div className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              {formData.image ? (
                <div className="w-14 h-14 rounded-lg border border-slate-200 overflow-hidden bg-slate-50 shrink-0 shadow-sm">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center shrink-0">
                  <ImageIcon className="w-5 h-5 text-slate-400" />
                </div>
              )}
              <div className="flex-1 relative flex flex-col justify-center">
                <Input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={isUploadingImage} 
                  className="file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-3 file:py-1 file:cursor-pointer text-xs h-9 cursor-pointer hover:file:bg-blue-100 transition-all border-slate-200 focus-visible:ring-blue-500" 
                />
                {isUploadingImage && (
                  <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-md border border-blue-100 text-xs font-bold text-blue-600 gap-2 z-10 shadow-sm">
                    <Loader2 className="w-4 h-4 animate-spin" /> Subiendo archivo...
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700">Nombre de la Categoría <span className="text-red-500">*</span></Label>
            <input 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              placeholder="Ej: Juguetes de Madera" 
              className={getInputClass(formData.name)}
              required 
            />
          </div>
          
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold text-slate-700">Ruta E-commerce (Slug)</Label>
              <span className="text-[10px] text-slate-400 font-medium">Auto-generado si se omite</span>
            </div>
            {/* 🚀 FIX: Tamaño de letra igualado, solo mantenemos la fuente mono */}
            <input 
              name="slug" 
              value={formData.slug} 
              onChange={handleChange} 
              placeholder="ej-juguetes-de-madera" 
              className={`${getInputClass(formData.slug)} font-mono tracking-wider`} 
            />
          </div>

          {/* 🚀 SELECTOR DE SUCURSAL CON LOGOS (Sin opción Global) */}
          {validBranches.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-semibold text-slate-700">Catálogo / Sucursal <span className="text-red-500">*</span></Label>
              <Select value={formData.ecommerceCode} onValueChange={(v) => setFormData(p => ({...p, ecommerceCode: v}))}>
                <SelectTrigger className={`h-10 text-sm focus-visible:ring-blue-500 ${formData.ecommerceCode ? 'bg-blue-50/40 border-blue-200' : 'bg-slate-50 border-slate-200'}`}>
                  <SelectValue placeholder="Elige una sucursal..." />
                </SelectTrigger>
                <SelectContent>
                  {validBranches.map(b => (
                    <SelectItem key={b.ecommerceCode} value={b.ecommerceCode!} className="font-medium text-slate-700 py-2">
                      <div className="flex items-center gap-2.5">
                        {b.logoUrl ? (
                          <img src={b.logoUrl} alt={b.name} className="w-5 h-5 rounded-md object-cover border border-slate-200 bg-white" />
                        ) : (
                          <Store className="w-4 h-4 text-blue-500" />
                        )}
                        <span>{b.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isUploadingImage} className="h-9 text-xs font-bold text-slate-600 hover:bg-slate-200">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingImage} className="h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-6 shadow-sm">
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} 
              Guardar Categoría
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}