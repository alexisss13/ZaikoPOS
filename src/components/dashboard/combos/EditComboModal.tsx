'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft01Icon, ArrowRight01Icon, PlusSignIcon, Cancel01Icon, Upload02Icon, Search01Icon, PackageIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface ComboItem {
  variantId: string;
  quantity: number;
  variant: {
    id: string;
    name: string;
    price: number;
    product: {
      id: string;
      title: string;
      images: string[];
    };
  };
}

interface EditComboModalProps {
  combo: any;
  onClose: () => void;
  onSuccess: () => void;
  categories: any[];
  branches: any[];
}

export function EditComboModal({ combo, onClose, onSuccess, categories, branches }: EditComboModalProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  
  // Información básica
  const [formData, setFormData] = useState({
    title: combo.title || '',
    description: combo.description || '',
    categoryId: combo.category?.id || '',
    basePrice: combo.basePrice?.toString() || '',
  });
  
  // Items del combo
  const [comboItems, setComboItems] = useState<ComboItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);
  
  // Imágenes
  const [imageUrls, setImageUrls] = useState<string[]>(combo.images || []);

  useEffect(() => {
    // Cargar items del combo existente
    if (combo.comboItems) {
      setComboItems(combo.comboItems.map((item: any) => ({
        variantId: item.variantId,
        quantity: item.quantity,
        variant: item.variant
      })));
    }
  }, [combo]);

  useEffect(() => {
    if (step === 2) {
      fetchProducts();
    }
  }, [step, productSearch]);

  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const params = new URLSearchParams({
        search: productSearch,
        limit: '20',
        active: 'true'
      });

      const res = await fetch(`/api/products?${params}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableProducts(data.products || []);
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
    } finally {
      setLoadingProducts(false);
    }
  };

  const addComboItem = (variant: any) => {
    const existingItem = comboItems.find(item => item.variantId === variant.id);
    
    if (existingItem) {
      setComboItems(comboItems.map(item =>
        item.variantId === variant.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setComboItems([...comboItems, {
        variantId: variant.id,
        quantity: 1,
        variant
      }]);
    }
  };

  const updateComboItemQuantity = (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      setComboItems(comboItems.filter(item => item.variantId !== variantId));
    } else {
      setComboItems(comboItems.map(item =>
        item.variantId === variantId
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const removeComboItem = (variantId: string) => {
    setComboItems(comboItems.filter(item => item.variantId !== variantId));
  };

  const calculateTotalCost = () => {
    return comboItems.reduce((total, item) => total + (item.variant.price * item.quantity), 0);
  };

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

    if (comboItems.length === 0) {
      toast.error('Agrega al menos un producto al combo');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        basePrice: parseFloat(formData.basePrice),
        images: imageUrls,
        comboItems: comboItems.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity
        }))
      };

      const res = await fetch(`/api/combos/${combo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Error al actualizar combo');
      }

      toast.success('Combo actualizado exitosamente');
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al actualizar combo');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = () => {
    switch (step) {
      case 1: return formData.title && formData.categoryId && formData.basePrice;
      case 2: return comboItems.length > 0;
      case 3: return true;
      default: return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
          <button
            onClick={step === 1 ? onClose : () => setStep(step - 1)}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100"
          >
            <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-xl font-black text-slate-900">Editar Combo</h2>
            <p className="text-sm text-slate-500">
              Paso {step} de 3 - {
                step === 1 ? 'Información básica' :
                step === 2 ? 'Productos del combo' :
                'Imágenes'
              }
            </p>
          </div>
          {step < 3 && (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canGoNext()}
              className="h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            >
              Continuar <ArrowRight01Icon className="w-4 h-4 ml-2" />
            </Button>
          )}
          {step === 3 && (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            >
              {isSubmitting ? 'Actualizando...' : 'Actualizar Combo'}
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
        <div className="flex-1 overflow-y-auto p-6">
          {/* Step 1: Información básica */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <Label htmlFor="title" className="text-sm font-bold text-slate-700 mb-2 block">
                  Nombre del combo *
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ej: Combo Desayuno Completo"
                  className="h-12 rounded-xl"
                />
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
                  {categories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="basePrice" className="text-sm font-bold text-slate-700 mb-2 block">
                  Precio del combo *
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">S/</span>
                  <Input
                    id="basePrice"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                    placeholder="0.00"
                    className="h-12 pl-10 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-sm font-bold text-slate-700 mb-2 block">
                  Descripción (opcional)
                </Label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe el combo..."
                  className="w-full h-24 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm resize-none"
                />
              </div>
            </div>
          )}

          {/* Step 2: Productos del combo */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Productos del Combo</h3>
                  <p className="text-slate-600">Modifica los productos que incluirá este combo</p>
                </div>
                {comboItems.length > 0 && (
                  <div className="text-right">
                    <p className="text-sm text-slate-600">Costo total de productos:</p>
                    <p className="text-lg font-bold text-slate-900">S/ {calculateTotalCost().toFixed(2)}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Productos disponibles */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Productos Disponibles</h4>
                  
                  <div className="relative mb-4">
                    <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      placeholder="Buscar productos..."
                      className="h-10 pl-10 rounded-xl"
                    />
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {loadingProducts ? (
                      <div className="text-center py-8 text-slate-500">Cargando productos...</div>
                    ) : availableProducts.length === 0 ? (
                      <div className="text-center py-8 text-slate-500">No se encontraron productos</div>
                    ) : (
                      availableProducts.map((product) => (
                        product.variants?.map((variant: any) => (
                          <div key={variant.id} className="flex items-center gap-3 p-3 border border-slate-200 rounded-xl hover:bg-slate-50">
                            <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden">
                              {variant.images?.[0] ? (
                                <img src={variant.images[0]} alt={variant.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <PackageIcon className="w-5 h-5 text-slate-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-slate-900">{product.title}</p>
                              <p className="text-sm text-slate-600">{variant.name}</p>
                              <p className="text-sm font-bold text-slate-900">S/ {variant.price.toFixed(2)}</p>
                            </div>
                            <Button
                              onClick={() => addComboItem(variant)}
                              size="sm"
                              className="h-8 bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
                            >
                              <PlusSignIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        ))
                      ))
                    )}
                  </div>
                </div>

                {/* Items del combo */}
                <div>
                  <h4 className="font-bold text-slate-900 mb-3">Items del Combo ({comboItems.length})</h4>
                  
                  {comboItems.length === 0 ? (
                    <div className="text-center py-8 text-slate-500">
                      <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                      <p>No hay productos en el combo</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {comboItems.map((item) => (
                        <div key={item.variantId} className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                          <div className="w-12 h-12 bg-white rounded-lg overflow-hidden">
                            {item.variant.product.images?.[0] ? (
                              <img src={item.variant.product.images[0]} alt={item.variant.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <PackageIcon className="w-5 h-5 text-slate-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-slate-900">{item.variant.product.title}</p>
                            <p className="text-sm text-slate-600">{item.variant.name}</p>
                            <p className="text-sm font-bold text-slate-900">S/ {item.variant.price.toFixed(2)} c/u</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => updateComboItemQuantity(item.variantId, parseInt(e.target.value) || 1)}
                              className="w-16 h-8 text-center rounded-lg"
                            />
                            <Button
                              onClick={() => removeComboItem(item.variantId)}
                              size="sm"
                              variant="outline"
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Cancel01Icon className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Imágenes */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Imágenes del Combo</h3>
                <p className="text-slate-600">Modifica las imágenes del combo</p>
              </div>

              {imageUrls.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {imageUrls.map((url, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                      <img src={url} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <Cancel01Icon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors bg-slate-50">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {isUploadingImage ? (
                    <div className="text-slate-400">Subiendo...</div>
                  ) : (
                    <>
                      <Upload02Icon className="w-10 h-10 text-slate-400 mb-3" />
                      <p className="text-sm text-slate-500 font-medium">Haz clic para subir imágenes</p>
                      <p className="text-xs text-slate-400">PNG, JPG hasta 10MB</p>
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
          )}
        </div>
      </div>
    </div>
  );
}