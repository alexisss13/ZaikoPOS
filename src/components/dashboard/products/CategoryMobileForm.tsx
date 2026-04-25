'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft01Icon, Tag01Icon, Upload02Icon, Cancel01Icon, Delete02Icon, Edit02Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CategoryMobileFormProps {
  onClose: () => void;
  onSuccess: () => void;
  categories?: any[];
  branches?: any[];
}

export function CategoryMobileForm({ 
  onClose, 
  onSuccess,
  categories = [],
  branches = []
}: CategoryMobileFormProps) {
  const [view, setView] = useState<'list' | 'create' | 'edit'>('list');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
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
      const firstBranchCode = branches?.find((b: any) => b.ecommerceCode)?.ecommerceCode || '';
      setFormData({ name: '', ecommerceCode: firstBranchCode });
      setImageUrl('');
    }
  }, [editingCategory, branches]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();
      setImageUrl(data.url);
      toast.success('Imagen subida correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al subir imagen');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.error('El nombre es requerido');
      return;
    }

    setIsSubmitting(true);
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

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al guardar categoría');
      }

      toast.success(editingCategory ? 'Categoría actualizada' : 'Categoría creada');
      setView('list');
      setEditingCategory(null);
      const firstBranchCode = branches?.find((b: any) => b.ecommerceCode)?.ecommerceCode || '';
      setFormData({ name: '', ecommerceCode: firstBranchCode });
      setImageUrl('');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al guardar categoría');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: any) => {
    const productCount = category._count?.products || 0;
    
    if (productCount > 0) {
      if (!confirm(`Esta categoría tiene ${productCount} producto(s). ¿Desactivar todos los productos?`)) {
        return;
      }
      
      try {
        const res = await fetch(`/api/categories/${category.id}/deactivate-products`, {
          method: 'POST',
        });
        if (!res.ok) throw new Error('Error al desactivar productos');
        toast.success('Productos desactivados y categoría eliminada');
        onSuccess();
      } catch (error) {
        toast.error('Error al eliminar categoría');
      }
    } else {
      if (!confirm('¿Eliminar esta categoría?')) return;
      
      try {
        const res = await fetch(`/api/categories/${category.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Error al eliminar');
        toast.success('Categoría eliminada');
        onSuccess();
      } catch (error) {
        toast.error('Error al eliminar categoría');
      }
    }
  };

  const filteredCategories = categories.filter((cat: any) => {
    if (branchFilter === 'ALL') return true;
    return cat.ecommerceCode === branchFilter;
  });

  const getBranchName = (code: string | null) => {
    if (!code) return 'Compartido';
    const branch = branches.find((b: any) => b.ecommerceCode === code);
    return branch?.name || 'Compartido';
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={() => {
            if (view === 'list') {
              onClose();
            } else {
              setView('list');
              setEditingCategory(null);
            }
          }}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">
            {view === 'list' ? 'Categorías' : view === 'create' ? 'Nueva Categoría' : 'Editar Categoría'}
          </h2>
          {view === 'list' && <p className="text-xs text-slate-500">{filteredCategories.length} categorías</p>}
        </div>
        {view === 'list' && (
          <Button
            onClick={() => setView('create')}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs px-4"
          >
            Nueva
          </Button>
        )}
        {view !== 'list' && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {view === 'list' ? (
          <div className="p-4 space-y-3">
            {/* Filtros */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              <button
                onClick={() => setBranchFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                  branchFilter === 'ALL'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                Todas
              </button>
              {branches.map((branch: any) => (
                <button
                  key={branch.id}
                  onClick={() => setBranchFilter(branch.ecommerceCode || branch.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${
                    branchFilter === (branch.ecommerceCode || branch.id)
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {branch.name}
                </button>
              ))}
            </div>

            {/* Lista de categorías */}
            {filteredCategories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Tag01Icon className="w-16 h-16 text-slate-200 mb-3" />
                <p className="text-sm text-slate-500">No hay categorías</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredCategories.map((category: any) => (
                  <div
                    key={category.id}
                    className="flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-2xl"
                  >
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden">
                      {category.image ? (
                        <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                      ) : (
                        <Tag01Icon className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-900 text-sm truncate">{category.name}</p>
                      <p className="text-xs text-slate-500">
                        {getBranchName(category.ecommerceCode)} · {category._count?.products || 0} productos
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingCategory(category);
                        setView('edit');
                      }}
                      className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center hover:bg-slate-200"
                    >
                      <Edit02Icon className="w-4 h-4 text-slate-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(category)}
                      className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center hover:bg-red-100"
                    >
                      <Delete02Icon className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-bold text-slate-700 mb-2 block">
                Nombre de la categoría *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Laptops"
                className="h-12 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">
                Sucursal
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {branches.map((branch: any) => (
                  <button
                    key={branch.id}
                    onClick={() => setFormData({ ...formData, ecommerceCode: branch.ecommerceCode || branch.id })}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      formData.ecommerceCode === (branch.ecommerceCode || branch.id)
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {branch.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">
                Imagen (opcional)
              </Label>
              
              {imageUrl && (
                <div className="relative w-32 h-32 rounded-xl overflow-hidden bg-slate-100 mb-3">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setImageUrl('')}
                    className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                  >
                    <Cancel01Icon className="w-3 h-3" />
                  </button>
                </div>
              )}

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors bg-slate-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploadingImage ? (
                    <div className="text-slate-400 text-sm">Subiendo...</div>
                  ) : (
                    <>
                      <Upload02Icon className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Toca para subir imagen</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={isUploadingImage}
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
