'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Tags, Image as ImageIcon, Store, X } from 'lucide-react';

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
  logoUrl?: string | null;
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
  }, [categoryToEdit, isOpen, branches]);

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

  // 🚀 MEJORA UI: Inputs con diseño plano "Flat"
  const getInputClass = (val: string | undefined) => {
    const base = "transition-all focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-sm w-full rounded-xl border px-3 h-10 outline-none";
    const state = val && val.trim() !== ''
      ? "bg-white border-slate-200 text-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]" 
      : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100";
    return `${base} ${state}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl">
        
        {/* 🚀 HEADER PLANO */}
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <Tags className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
              {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Define los pasillos virtuales de tu tienda.
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Subida de Imagen Flat Design */}
          <div className="space-y-2 pb-2">
            <Label className="text-xs font-bold text-slate-700">Imagen Representativa (Opcional)</Label>
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
              {formData.image ? (
                <div className="w-14 h-14 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 shadow-sm relative group">
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData(p => ({...p, image: ''}))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative w-14 h-14 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition-colors flex items-center justify-center shrink-0 shadow-sm overflow-hidden cursor-pointer group">
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {isUploadingImage ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <ImageIcon className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform" strokeWidth={1.5} />}
                </div>
              )}
              <div className="flex-1 relative flex flex-col justify-center">
                <span className="text-xs text-slate-500 font-medium px-2">Haz clic en el cuadro o sube un archivo (JPG, PNG).</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Nombre de la Categoría <span className="text-red-500">*</span></Label>
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
              <Label className="text-xs font-bold text-slate-700">Ruta E-commerce (Slug)</Label>
              <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">Opcional</span>
            </div>
            <input 
              name="slug" 
              value={formData.slug} 
              onChange={handleChange} 
              placeholder="ej-juguetes-de-madera" 
              className={`${getInputClass(formData.slug)} font-mono tracking-wide text-sm`} 
            />
          </div>

          {/* SELECTOR DE SUCURSAL */}
          {validBranches.length > 0 && (
            <div className="space-y-1.5 pt-2">
              <Label className="text-xs font-bold text-slate-700">Catálogo / Sucursal <span className="text-red-500">*</span></Label>
              <Select value={formData.ecommerceCode} onValueChange={(v) => setFormData(p => ({...p, ecommerceCode: v}))}>
                <SelectTrigger className={`h-10 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 transition-all ${formData.ecommerceCode ? 'bg-white border-slate-200 shadow-sm font-bold text-slate-900' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                  <SelectValue placeholder="Elige una sucursal..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-xl">
                  {validBranches.map(b => (
                    <SelectItem key={b.ecommerceCode} value={b.ecommerceCode!} className="font-medium text-slate-700 py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        {b.logoUrl ? (
                          <img src={b.logoUrl} alt={b.name} className="w-4 h-4 rounded-sm object-cover border border-slate-200 bg-white" />
                        ) : (
                          <Store className="w-4 h-4 text-slate-400" />
                        )}
                        <span>{b.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* 🚀 FOOTER DEL MODAL */}
          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isUploadingImage} className="h-10 text-xs font-bold text-slate-600 bg-white border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isUploadingImage} className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl shadow-md transition-all">
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} 
              Guardar Categoría
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}