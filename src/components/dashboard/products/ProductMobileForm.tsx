'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft01Icon, PackageIcon, Image01Icon, Upload02Icon, Cancel01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

interface ProductMobileFormProps {
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: any;
  categories?: any[];
  suppliers?: any[];
  branches?: any[];
}

export function ProductMobileForm({ 
  onClose, 
  onSuccess, 
  productToEdit,
  categories = [],
  suppliers = [],
  branches = []
}: ProductMobileFormProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    supplierId: '',
    basePrice: '',
    cost: '',
    wholesalePrice: '',
    wholesaleMinCount: '',
    minStock: '5',
    sku: '',
    barcode: '',
  });
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('');

  useEffect(() => {
    // Seleccionar la primera sucursal por defecto
    if (branches.length > 0 && !selectedBranchCode) {
      setSelectedBranchCode(branches[0].ecommerceCode || branches[0].id);
    }
  }, [branches, selectedBranchCode]);

  useEffect(() => {
    if (productToEdit) {
      console.log('[PRODUCT_MOBILE_FORM] Product to edit:', productToEdit);
      setFormData({
        title: productToEdit.title || '',
        categoryId: productToEdit.categoryId || '',
        supplierId: productToEdit.supplierId || '',
        basePrice: productToEdit.basePrice != null ? productToEdit.basePrice.toString() : '',
        cost: productToEdit.cost != null ? productToEdit.cost.toString() : '',
        wholesalePrice: productToEdit.wholesalePrice != null ? productToEdit.wholesalePrice.toString() : '',
        wholesaleMinCount: productToEdit.wholesaleMinCount != null ? productToEdit.wholesaleMinCount.toString() : '',
        minStock: productToEdit.minStock != null ? productToEdit.minStock.toString() : '5',
        sku: productToEdit.sku || '',
        barcode: productToEdit.barcode || '',
      });
      setImageUrls(productToEdit.images || []);
      
      // Si el producto tiene una sucursal específica, seleccionarla
      if (productToEdit.branchOwnerId) {
        const ownerBranch = branches.find((b: any) => b.id === productToEdit.branchOwnerId);
        if (ownerBranch) {
          setSelectedBranchCode(ownerBranch.ecommerceCode || ownerBranch.id);
        }
      }
    }
  }, [productToEdit, branches]);

  const filteredCategories = categories.filter((cat: any) => {
    if (!selectedBranchCode) return false;
    return cat.ecommerceCode === selectedBranchCode;
  });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) throw new Error('Error al subir imagen');
        const data = await res.json();
        return data.url;
      });

      const urls = await Promise.all(uploadPromises);
      setImageUrls(prev => [...prev, ...urls]);
      toast.success('Imágenes subidas correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al subir imágenes');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const removeImage = (index: number) => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.categoryId || !formData.basePrice) {
      toast.error('Completa los campos requeridos');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        categoryId: formData.categoryId,
        supplierId: formData.supplierId || null,
        basePrice: parseFloat(formData.basePrice),
        cost: formData.cost && formData.cost.trim() !== '' ? parseFloat(formData.cost) : null,
        wholesalePrice: formData.wholesalePrice && formData.wholesalePrice.trim() !== '' ? parseFloat(formData.wholesalePrice) : null,
        wholesaleMinCount: formData.wholesaleMinCount && formData.wholesaleMinCount.trim() !== '' ? parseInt(formData.wholesaleMinCount) : null,
        minStock: formData.minStock && formData.minStock.trim() !== '' ? parseInt(formData.minStock) : 5,
        sku: formData.sku && formData.sku.trim() !== '' ? formData.sku : null,
        barcode: formData.barcode && formData.barcode.trim() !== '' ? formData.barcode : null,
        images: imageUrls,
        active: true,
      };

      const url = productToEdit ? `/api/products/${productToEdit.id}` : '/api/products';
      const method = productToEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        console.error('Response status:', res.status);
        console.error('Response text:', text);
        
        let errorData;
        try {
          errorData = JSON.parse(text);
        } catch {
          errorData = { error: text || 'Error desconocido' };
        }
        
        throw new Error(errorData.error || 'Error al guardar producto');
      }

      toast.success(productToEdit ? 'Producto actualizado' : 'Producto creado');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al guardar producto');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return formData.title && formData.categoryId;
    if (step === 2) return formData.basePrice;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={step === 1 ? onClose : () => setStep(step - 1)}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">
            {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <p className="text-xs text-slate-500">Paso {step} de 3</p>
        </div>
        {step < 3 && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canGoNext()}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
          >
            Continuar
          </Button>
        )}
        {step === 3 && (
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
          >
            {isSubmitting ? 'Guardando...' : 'Guardar'}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100">
        <div 
          className="h-full bg-slate-900 transition-all duration-300"
          style={{ width: `${(step / 3) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Información básica */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-sm font-bold text-slate-700 mb-2 block">
                Nombre del producto *
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: Laptop HP 15-dy2021la"
                className="h-12 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">
                Sucursal
              </Label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {branches.map((branch: any) => (
                  <button
                    key={branch.id}
                    onClick={() => setSelectedBranchCode(branch.ecommerceCode || branch.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedBranchCode === (branch.ecommerceCode || branch.id)
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
              <Label htmlFor="categoryId" className="text-sm font-bold text-slate-700 mb-2 block">
                Categoría *
              </Label>
              <select
                id="categoryId"
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="">Selecciona una categoría</option>
                {filteredCategories.map((cat: any) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="supplierId" className="text-sm font-bold text-slate-700 mb-2 block">
                Proveedor (opcional)
              </Label>
              <select
                id="supplierId"
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-white text-sm"
              >
                <option value="">Sin proveedor</option>
                {suppliers.map((sup: any) => (
                  <option key={sup.id} value={sup.id}>{sup.name}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Precios */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="basePrice" className="text-sm font-bold text-slate-700 mb-2 block">
                Precio de venta *
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">S/</span>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                  placeholder="0.00"
                  className="h-14 pl-10 text-lg font-bold rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="cost" className="text-sm font-bold text-slate-700 mb-2 block">
                Costo (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">S/</span>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  placeholder="0.00"
                  className="h-12 pl-10 rounded-xl"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="wholesalePrice" className="text-sm font-bold text-slate-700 mb-2 block">
                Precio por mayor (opcional)
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">S/</span>
                <Input
                  id="wholesalePrice"
                  type="number"
                  step="0.01"
                  value={formData.wholesalePrice}
                  onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                  placeholder="0.00"
                  className="h-12 pl-10 rounded-xl"
                />
              </div>
            </div>

            {formData.wholesalePrice && (
              <div>
                <Label htmlFor="wholesaleMinCount" className="text-sm font-bold text-slate-700 mb-2 block">
                  Cantidad mínima para precio por mayor
                </Label>
                <Input
                  id="wholesaleMinCount"
                  type="number"
                  value={formData.wholesaleMinCount}
                  onChange={(e) => setFormData({ ...formData, wholesaleMinCount: e.target.value })}
                  placeholder="10"
                  className="h-12 rounded-xl"
                />
              </div>
            )}

            <div>
              <Label htmlFor="minStock" className="text-sm font-bold text-slate-700 mb-2 block">
                Stock mínimo
              </Label>
              <Input
                id="minStock"
                type="number"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                placeholder="5"
                className="h-12 rounded-xl"
              />
            </div>
          </div>
        )}

        {/* Step 3: Códigos e imágenes */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="sku" className="text-sm font-bold text-slate-700 mb-2 block">
                SKU (opcional)
              </Label>
              <Input
                id="sku"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                placeholder="Ej: LAP-HP-001"
                className="h-12 rounded-xl"
              />
            </div>

            <div>
              <Label htmlFor="barcode" className="text-sm font-bold text-slate-700 mb-2 block">
                Código de barras (opcional)
              </Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="Ej: 7501234567890"
                className="h-12 rounded-xl"
              />
            </div>

            <div>
              <Label className="text-sm font-bold text-slate-700 mb-2 block">
                Imágenes (opcional)
              </Label>
              
              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                      <img src={url} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <Cancel01Icon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors bg-slate-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploadingImage ? (
                    <div className="text-slate-400 text-sm">Subiendo...</div>
                  ) : (
                    <>
                      <Upload02Icon className="w-8 h-8 text-slate-400 mb-2" />
                      <p className="text-xs text-slate-500 font-medium">Toca para subir imágenes</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
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
