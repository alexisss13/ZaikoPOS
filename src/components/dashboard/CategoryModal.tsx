'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Tags, Upload, X, Trash2, PowerOff } from 'lucide-react';

interface CategoryData {
  id: string;
  name: string;
  slug?: string;
  image?: string | null;
  ecommerceCode?: string | null;
  _count?: { products: number };
}

interface Branch {
  id: string;
  name: string;
  ecommerceCode: string | null;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: CategoryData[];
  branches: Branch[];
}

export function CategoryModal({ isOpen, onClose, onSuccess, categories, branches }: CategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryData | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  
  const [formData, setFormData] = useState({
    name: '',
    ecommerceCode: '',
  });

  useEffect(() => {
    if (editingCategory) {
      setFormData({
        name: editingCategory.name,
        ecommerceCode: editingCategory.ecommerceCode || '',
      });
      setImageUrl(editingCategory.image || '');
    } else {
      // Al crear nueva categoría, seleccionar la primera sucursal por defecto
      const firstBranchCode = branches?.find(b => b.ecommerceCode)?.ecommerceCode || '';
      setFormData({ name: '', ecommerceCode: firstBranchCode });
      setImageUrl('');
    }
  }, [editingCategory, branches]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        setImageUrl(data.secure_url);
        toast.success('Imagen subida correctamente');
      } else {
        throw new Error(data.error?.message || 'Error al subir imagen');
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
    
    if (!formData.name.trim()) {
      toast.error('El nombre de la categoría es requerido');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: formData.name,
        ecommerceCode: formData.ecommerceCode || null,
        image: imageUrl || null,
      };

      const url = editingCategory ? `/api/categories/${editingCategory.id}` : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(editingCategory ? 'Categoría actualizada' : 'Categoría creada');
      setEditingCategory(null);
      // Resetear con la primera sucursal por defecto
      const firstBranchCode = branches?.find(b => b.ecommerceCode)?.ecommerceCode || '';
      setFormData({ name: '', ecommerceCode: firstBranchCode });
      setImageUrl('');
      onSuccess();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrDeactivate = async (category: CategoryData) => {
    const productCount = category._count?.products || 0;
    
    if (productCount > 0) {
      // Si tiene productos, ofrecer desactivarlos
      if (!confirm(`Esta categoría tiene ${productCount} producto(s). ¿Deseas desactivar todos los productos de esta categoría? Esto también "desactivará" la categoría.`)) {
        return;
      }
      
      try {
        // Llamar a un endpoint que desactive todos los productos de la categoría
        const res = await fetch(`/api/categories/${category.id}/deactivate-products`, { 
          method: 'POST' 
        });
        
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        
        toast.success(`${productCount} producto(s) desactivado(s)`);
        onSuccess();
      } catch (error: any) {
        toast.error(error.message || 'Error al desactivar productos');
      }
    } else {
      // Si no tiene productos, eliminar directamente
      if (!confirm('¿Eliminar esta categoría vacía?')) return;
      
      try {
        const res = await fetch(`/api/categories/${category.id}`, { method: 'DELETE' });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error);
        }
        toast.success('Categoría eliminada');
        onSuccess();
      } catch (error: any) {
        toast.error(error.message || 'Error al eliminar');
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) { onClose(); setEditingCategory(null); } }}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        <DialogHeader className="px-6 py-4 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <Tags className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left flex-1">
            <DialogTitle className="text-xl font-black text-slate-900 leading-tight">
              Gestionar Categorías
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Crea, edita o elimina categorías de productos
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* FORMULARIO */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 h-fit">
            <h3 className="text-sm font-black text-slate-900 mb-4">
              {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nombre */}
              <div className="relative">
                <input 
                  name="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder=" " 
                  className="peer w-full h-11 px-3 pt-5 pb-1 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-1 focus:ring-slate-300"
                  required 
                />
                <label className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500 transition-all pointer-events-none peer-focus:top-2 peer-focus:text-[10px] peer-focus:font-bold peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:font-bold">
                  Nombre <span className="text-red-500">*</span>
                </label>
              </div>

              {/* Sucursal */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Sucursal</Label>
                <select
                  value={formData.ecommerceCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, ecommerceCode: e.target.value }))}
                  className="w-full h-11 px-3 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                >
                  {branches?.filter(b => b.ecommerceCode).map((branch) => (
                    <option key={branch.id} value={branch.ecommerceCode!}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Asigna esta categoría a una sucursal específica o déjala como general
                </p>
              </div>

              {/* Imagen */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-700">Imagen</Label>
                {imageUrl ? (
                  <div className="relative w-full h-32 bg-slate-100 rounded-lg overflow-hidden group">
                    <img src={imageUrl} alt="Categoría" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImageUrl('')}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage}
                      className="hidden"
                      id="category-image-upload"
                    />
                    <label 
                      htmlFor="category-image-upload"
                      className={`w-full h-32 flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-all cursor-pointer ${
                        isUploadingImage
                          ? 'border-slate-200 bg-slate-50'
                          : 'border-slate-300 bg-slate-50 hover:border-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      {isUploadingImage ? (
                        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                      ) : (
                        <>
                          <Upload className="w-6 h-6 text-slate-400" />
                          <span className="text-xs font-bold text-slate-400">Subir imagen</span>
                        </>
                      )}
                    </label>
                  </div>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-2 pt-2">
                {editingCategory && (
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setEditingCategory(null);
                      const firstBranchCode = branches?.find(b => b.ecommerceCode)?.ecommerceCode || '';
                      setFormData({ name: '', ecommerceCode: firstBranchCode });
                      setImageUrl('');
                    }}
                    className="flex-1 h-10 text-xs font-bold"
                  >
                    Cancelar
                  </Button>
                )}
                <Button 
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800"
                >
                  {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingCategory ? 'Actualizar' : 'Crear'}
                </Button>
              </div>

            </form>
          </div>

          {/* LISTA DE CATEGORÍAS */}
          <div className="bg-white p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-slate-900">
                Categorías Existentes ({categories.filter(c => branchFilter === 'ALL' || c.ecommerceCode === branchFilter || (!c.ecommerceCode && branchFilter === 'GENERAL')).length})
              </h3>
              
              {/* Filtro por sucursal */}
              <select
                value={branchFilter}
                onChange={(e) => setBranchFilter(e.target.value)}
                className="h-8 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300"
              >
                <option value="ALL">Todas</option>
                {branches?.filter(b => b.ecommerceCode).map((branch) => (
                  <option key={branch.id} value={branch.ecommerceCode!}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2 max-h-[500px] overflow-y-auto">
              {categories.filter(c => 
                branchFilter === 'ALL' || 
                c.ecommerceCode === branchFilter || 
                (!c.ecommerceCode && branchFilter === 'GENERAL')
              ).length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No hay categorías en este filtro
                </div>
              ) : (
                categories.filter(c => 
                  branchFilter === 'ALL' || 
                  c.ecommerceCode === branchFilter || 
                  (!c.ecommerceCode && branchFilter === 'GENERAL')
                ).map((category) => {
                  const branch = branches?.find(b => b.ecommerceCode === category.ecommerceCode);
                  const hasProducts = (category._count?.products || 0) > 0;
                  
                  return (
                    <div 
                      key={category.id}
                      className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-slate-300 transition-all group"
                    >
                      {category.image ? (
                        <img 
                          src={category.image} 
                          alt={category.name}
                          className="w-12 h-12 object-cover rounded-lg shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-slate-200 rounded-lg flex items-center justify-center shrink-0">
                          <Tags className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-900 truncate">
                          {category.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {category._count?.products || 0} producto(s)
                          {branch ? ` • ${branch.name}` : ' • General'}
                        </div>
                      </div>

                      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCategory(category)}
                          className="h-8 w-8 p-0 hover:bg-slate-200"
                        >
                          <Tags className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteOrDeactivate(category)}
                          className={`h-8 w-8 p-0 ${hasProducts ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-red-100 text-red-600'}`}
                          title={hasProducts ? 'Desactivar productos' : 'Eliminar categoría'}
                        >
                          {hasProducts ? <PowerOff className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end shrink-0">
          <Button 
            variant="outline" 
            onClick={() => { onClose(); setEditingCategory(null); }}
            className="h-10 text-xs font-bold"
          >
            Cerrar
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
