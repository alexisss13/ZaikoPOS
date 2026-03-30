'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Tags, Image as ImageIcon } from 'lucide-react';

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
  ecommerceCode: string | null;
}

export function CategoryModal({ isOpen, onClose, onSuccess, categoryToEdit }: CategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  const uniqueCodes = Array.from(new Set(branches?.map((b) => b.ecommerceCode).filter(Boolean))) as string[];

  const [formData, setFormData] = useState({
    name: '', slug: '', ecommerceCode: '', image: '',
  });

  useEffect(() => {
    if (categoryToEdit && isOpen) {
      setFormData({
        name: categoryToEdit.name,
        slug: categoryToEdit.slug,
        ecommerceCode: categoryToEdit.ecommerceCode || (uniqueCodes.length > 0 ? uniqueCodes[0] : ''),
        image: categoryToEdit.image || '',
      });
    } else if (isOpen) {
      setFormData({ name: '', slug: '', ecommerceCode: uniqueCodes.length > 0 ? uniqueCodes[0] : '', image: '' });
    }
  }, [categoryToEdit, isOpen, uniqueCodes.length]);

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
      if (data.secure_url) { setFormData(prev => ({ ...prev, image: data.secure_url })); toast.success('Imagen subida'); } 
      else { throw new Error(data.error?.message || 'Error al subir'); }
    } catch (error) { toast.error('Error con Cloudinary'); } 
    finally { setIsUploadingImage(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🚀 REGLA DE NEGOCIO: Obligamos a elegir un catálogo si el inquilino tiene E-commerce
    if (uniqueCodes.length > 0 && !formData.ecommerceCode) {
      return toast.error('Debes seleccionar a qué catálogo E-commerce pertenece.');
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
      
      toast.success(categoryToEdit?.id ? 'Categoría actualizada' : 'Categoría creada');
      onSuccess(); onClose();
    } catch (error: unknown) { 
      const err = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(err); 
    } 
    finally { setIsLoading(false); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl"><Tags className="w-5 h-5 text-primary" /> {categoryToEdit ? 'Editar Categoría' : 'Nueva Categoría'}</DialogTitle>
          <DialogDescription>Define cómo se agruparán tus productos en la tienda virtual.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-3 pb-2">
            <Label className="text-xs font-bold text-slate-700">Imagen de Categoría (Opcional)</Label>
            <div className="flex items-center gap-4">
              {formData.image ? (
                <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 shadow-sm"><img src={formData.image} alt="Preview" className="w-full h-full object-cover" /></div>
              ) : (
                <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center shrink-0"><ImageIcon className="w-6 h-6 text-slate-300" /></div>
              )}
              <div className="flex-1 relative">
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="file:bg-indigo-50 file:text-indigo-700 file:border-0 file:rounded-md file:px-3 file:py-1 file:cursor-pointer text-xs h-10" />
                {isUploadingImage && <div className="absolute inset-0 bg-white/90 flex items-center justify-center rounded-md border text-xs font-bold text-indigo-600 gap-2 z-10"><Loader2 className="w-4 h-4 animate-spin" /> Subiendo...</div>}
              </div>
            </div>
          </div>

          <div className="space-y-2"><Label>Nombre de la Categoría</Label><Input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Juguetes de Madera" required /></div>
          <div className="space-y-2"><Label className="flex justify-between items-center"><span>Ruta E-commerce (Slug)</span><span className="text-[10px] text-slate-400 font-normal">Se autogenera si se deja en blanco</span></Label><Input name="slug" value={formData.slug} onChange={handleChange} placeholder="ej-juguetes-de-madera" className="font-mono text-sm" /></div>

          {/* 🚀 SELECTOR DINÁMICO (Oculto si el inquilino no usa e-commerce) */}
          {uniqueCodes.length > 0 && (
            <div className="space-y-2 pt-2">
              <Label>Marca / Catálogo Web</Label>
              <Select value={formData.ecommerceCode} onValueChange={(v) => setFormData(p => ({...p, ecommerceCode: v}))}>
                <SelectTrigger className="bg-slate-50 border-indigo-200"><SelectValue placeholder="Selecciona el catálogo web" /></SelectTrigger>
                <SelectContent>
                  {uniqueCodes.map(code => (
                    <SelectItem key={code} value={code}>Catálogo Web: {code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-500 leading-tight">
                Establece en qué página web se mostrará esta categoría. El inventario físico es independiente y se gestiona en cada tienda.
              </p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isUploadingImage}>Cancelar</Button>
            <Button type="submit" disabled={isLoading || isUploadingImage}>{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Guardar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}