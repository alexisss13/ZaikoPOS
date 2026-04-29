'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft01Icon, PackageIcon, Image01Icon, Upload02Icon, Cancel01Icon, PlusSignIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { VariantManager } from './VariantManager';

interface Variant {
  id: string;
  name: string;
  attributes: Record<string, string>;
  sku: string;
  barcode: string;
  price: string;
  cost: string;
  minStock: string;
  images: string[];
  wholesalePrice: string;
  wholesaleMinCount: string;
}

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
  
  // Tipo de producto
  const [productType, setProductType] = useState<'simple' | 'variants'>('simple');
  
  // Información básica
  const [formData, setFormData] = useState({
    title: '',
    categoryId: '',
    supplierId: '',
    description: '',
  });
  
  // Variantes
  const [variants, setVariants] = useState<Variant[]>([]);
  const [variantTypes, setVariantTypes] = useState<string[]>([]);
  
  // Stock inicial
  const [branchStocks, setBranchStocks] = useState<Record<string, Record<string, string>>>({});
  
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [selectedBranchCode, setSelectedBranchCode] = useState<string>('');
  
  // Estados para funcionalidades adicionales
  const [showWholesale, setShowWholesale] = useState<Record<string, boolean>>({});
  const [isUploadingVariantImages, setIsUploadingVariantImages] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (productType === 'simple') {
      // Crear variante estándar para producto simple
      setVariants([{
        id: 'standard',
        name: 'Estándar',
        attributes: {},
        sku: '',
        barcode: '',
        price: '',
        cost: '',
        minStock: '5',
        images: [],
        wholesalePrice: '',
        wholesaleMinCount: ''
      }]);
    } else {
      setVariants([]);
    }
  }, [productType]);

  useEffect(() => {
    // Seleccionar la primera sucursal por defecto
    if (branches.length > 0 && !selectedBranchCode) {
      setSelectedBranchCode(branches[0].ecommerceCode || branches[0].id);
    }
  }, [branches, selectedBranchCode]);

  const filteredCategories = categories.filter((cat: any) => {
    if (!selectedBranchCode) return false;
    return cat.ecommerceCode === selectedBranchCode;
  });

  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    setVariants(variants.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  useEffect(() => {
    if (productToEdit) {
      console.log('[PRODUCT_MOBILE_FORM] Product to edit:', productToEdit);
      setFormData({
        title: productToEdit.title || '',
        categoryId: productToEdit.categoryId || '',
        supplierId: productToEdit.supplierId || '',
        description: productToEdit.description || '',
      });
      setImageUrls(productToEdit.images || []);
      
      // Cargar variantes existentes
      if (productToEdit.variants && productToEdit.variants.length > 0) {
        const loadedVariants = productToEdit.variants.map((v: any) => ({
          id: v.id,
          name: v.name,
          attributes: v.attributes || {},
          sku: v.sku || '',
          barcode: v.barcode || '',
          price: v.price?.toString() || '',
          cost: v.cost?.toString() || '',
          minStock: v.minStock?.toString() || '5',
          images: v.images || [],
          wholesalePrice: v.wholesalePrice?.toString() || '',
          wholesaleMinCount: v.wholesaleMinCount?.toString() || ''
        }));
        setVariants(loadedVariants);
        
        // Determinar tipo de producto
        if (loadedVariants.length === 1 && loadedVariants[0].name === 'Estándar') {
          setProductType('simple');
        } else {
          setProductType('variants');
          // Extraer tipos de variante de los atributos
          const types = new Set<string>();
          loadedVariants.forEach((v: Variant) => {
            Object.keys(v.attributes).forEach(key => types.add(key));
          });
          setVariantTypes(Array.from(types));
        }
      } else {
        // Si no hay variantes, crear una estándar con los datos del producto
        setVariants([{
          id: 'standard',
          name: 'Estándar',
          attributes: {},
          sku: productToEdit.sku || '',
          barcode: productToEdit.barcode || '',
          price: productToEdit.basePrice?.toString() || '',
          cost: productToEdit.cost?.toString() || '',
          minStock: productToEdit.minStock?.toString() || '5',
          images: productToEdit.images || [],
          wholesalePrice: productToEdit.wholesalePrice?.toString() || '',
          wholesaleMinCount: productToEdit.wholesaleMinCount?.toString() || ''
        }]);
        setProductType('simple');
      }
      
      // Si el producto tiene una sucursal específica, seleccionarla
      if (productToEdit.branchOwnerId) {
        const ownerBranch = branches.find((b: any) => b.id === productToEdit.branchOwnerId);
        if (ownerBranch) {
          setSelectedBranchCode(ownerBranch.ecommerceCode || ownerBranch.id);
        }
      }
    }
  }, [productToEdit, branches]);



  const handleVariantImageUpload = async (variantId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    const currentImages = variants.find(v => v.id === variantId)?.images || [];
    if (currentImages.length + files.length > 4) {
      toast.error('Máximo 4 imágenes por variante');
      return;
    }

    setIsUploadingVariantImages(prev => ({ ...prev, [variantId]: true }));
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
      updateVariant(variantId, 'images', [...currentImages, ...urls]);
      toast.success('Imágenes subidas correctamente');
    } catch (error) {
      console.error(error);
      toast.error('Error al subir imágenes');
    } finally {
      setIsUploadingVariantImages(prev => ({ ...prev, [variantId]: false }));
    }
  };

  const removeVariantImage = (variantId: string, imageIndex: number) => {
    const variant = variants.find(v => v.id === variantId);
    if (variant) {
      const newImages = variant.images.filter((_, i) => i !== imageIndex);
      updateVariant(variantId, 'images', newImages);
    }
  };

  const validatePricing = (variant: Variant): string | null => {
    const cost = parseFloat(variant.cost) || 0;
    const price = parseFloat(variant.price) || 0;
    const wholesalePrice = parseFloat(variant.wholesalePrice) || 0;

    if (cost > price && price > 0) {
      return `El costo (S/${cost}) no puede ser mayor al precio de venta (S/${price})`;
    }

    if (wholesalePrice > 0) {
      if (wholesalePrice > price) {
        return `El precio mayorista (S/${wholesalePrice}) no puede ser mayor al precio de venta (S/${price})`;
      }
      if (wholesalePrice <= cost && cost > 0) {
        return `El precio mayorista (S/${wholesalePrice}) debe ser mayor al costo (S/${cost})`;
      }
    }

    return null;
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
    if (!formData.title || !formData.categoryId) {
      toast.error('Completa los campos requeridos');
      return;
    }

    if (variants.length === 0 || variants.some(v => !v.name || !v.price)) {
      toast.error('Completa la información de las variantes');
      return;
    }

    // Validar precios antes de enviar
    const pricingErrors = variants.map(validatePricing).filter(Boolean);
    if (pricingErrors.length > 0) {
      toast.error(pricingErrors[0]);
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        ...formData,
        productType,
        variants: variants.map(v => ({
          name: v.name,
          attributes: v.attributes,
          sku: v.sku || null,
          barcode: v.barcode || null,
          price: parseFloat(v.price) || 0,
          cost: parseFloat(v.cost) || 0,
          minStock: parseInt(v.minStock) || 5,
          images: v.images.length > 0 ? v.images : imageUrls,
          wholesalePrice: parseFloat(v.wholesalePrice) || null,
          wholesaleMinCount: parseInt(v.wholesaleMinCount) || null
        })),
        branchStocks,
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
    if (step === 1) return productType !== null;
    if (step === 2) return formData.title && formData.categoryId;
    if (step === 3) {
      if (variants.length === 0) return false;
      
      // Validar que todas las variantes tengan nombre y precio
      const hasValidVariants = variants.every(v => v.name && v.price);
      if (!hasValidVariants) return false;

      // Validar precios
      const pricingErrors = variants.map(validatePricing).filter(Boolean);
      if (pricingErrors.length > 0) {
        toast.error(pricingErrors[0]);
        return false;
      }

      return true;
    }
    if (step === 4) return true;
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
          <p className="text-xs text-slate-500">
            Paso {step} de {productToEdit ? 3 : 4} - {
              step === 1 && !productToEdit ? 'Tipo de producto' :
              step === 1 && productToEdit ? 'Información básica' :
              step === 2 && !productToEdit ? 'Información básica' :
              step === 2 && productToEdit ? 'Variantes' :
              step === 3 && !productToEdit ? 'Variantes' :
              step === 3 && productToEdit ? 'Imágenes' :
              'Stock inicial'
            }
          </p>
        </div>
        {((step < 4 && !productToEdit) || (step < 3 && productToEdit)) && (
          <Button
            onClick={() => setStep(step + 1)}
            disabled={!canGoNext()}
            className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
          >
            Continuar
          </Button>
        )}
        {((step === 4 && !productToEdit) || (step === 3 && productToEdit)) && (
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
          style={{ width: `${(step / (productToEdit ? 3 : 4)) * 100}%` }}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Step 1: Tipo de producto (solo para productos nuevos) */}
        {step === 1 && !productToEdit && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <PackageIcon className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">¿Qué tipo de producto vas a crear?</h3>
              <p className="text-slate-600 text-sm">Selecciona el tipo que mejor describa tu producto</p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => setProductType('simple')}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  productType === 'simple'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <PackageIcon className="w-5 h-5 text-slate-600" />
                  </div>
                  <div>
                    <h4 className="text-md font-bold text-slate-900">Producto Simple</h4>
                    <p className="text-xs text-slate-600">Sin variaciones. Ej: Laptop, Mesa</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setProductType('variants')}
                className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                  productType === 'variants'
                    ? 'border-slate-900 bg-slate-50'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5 w-5 h-5">
                      <div className="bg-slate-600 rounded-sm"></div>
                      <div className="bg-slate-400 rounded-sm"></div>
                      <div className="bg-slate-400 rounded-sm"></div>
                      <div className="bg-slate-600 rounded-sm"></div>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-md font-bold text-slate-900">Con Variantes</h4>
                    <p className="text-xs text-slate-600">Con opciones. Ej: Camiseta (tallas, colores)</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Step 1/2: Información básica */}
        {((step === 1 && productToEdit) || (step === 2 && !productToEdit)) && (
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
            <div>
              <Label htmlFor="description" className="text-sm font-bold text-slate-700 mb-2 block">
                Descripción (opcional)
              </Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe las características principales..."
                className="w-full h-20 px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 2/3: Variantes */}
        {((step === 2 && productToEdit) || (step === 3 && !productToEdit)) && (
          <div className="space-y-4">
            {productType === 'simple' ? (
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-900">Variante Estándar</h3>
                {variants.map((variant) => (
                  <div key={variant.id} className="bg-white border border-slate-200 rounded-2xl p-4 space-y-4">
                    <div>
                      <Label className="text-sm font-bold text-slate-700 mb-2 block">
                        Precio de venta *
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">S/</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price}
                          onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                          placeholder="0.00"
                          className="h-12 pl-10 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <Label className="text-sm font-bold text-slate-700 mb-2 block">
                        Costo (opcional)
                      </Label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">S/</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.cost}
                          onChange={(e) => updateVariant(variant.id, 'cost', e.target.value)}
                          placeholder="0.00"
                          className="h-12 pl-10 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm font-bold text-slate-700 mb-2 block">
                          SKU (opcional)
                        </Label>
                        <Input
                          value={variant.sku}
                          onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                          placeholder="LAP-HP-001"
                          className="h-12 rounded-xl"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-bold text-slate-700 mb-2 block">
                          Stock mínimo
                        </Label>
                        <Input
                          type="number"
                          min="1"
                          value={variant.minStock}
                          onChange={(e) => updateVariant(variant.id, 'minStock', e.target.value)}
                          placeholder="5"
                          className="h-12 rounded-xl"
                        />
                      </div>
                    </div>

                    {/* Sección mayorista colapsable */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowWholesale(prev => ({ ...prev, [variant.id]: !prev[variant.id] }))}
                        className="flex items-center gap-2 text-sm font-bold text-slate-700 hover:text-slate-900 transition-colors"
                      >
                        <div className={`w-4 h-4 border-2 border-slate-300 rounded flex items-center justify-center transition-colors ${
                          showWholesale[variant.id] ? 'bg-slate-900 border-slate-900' : ''
                        }`}>
                          {showWholesale[variant.id] && <div className="w-2 h-2 bg-white rounded-sm" />}
                        </div>
                        ¿Es mayorista?
                      </button>
                      
                      {showWholesale[variant.id] && (
                        <div className="mt-3 space-y-3 p-3 bg-slate-50 rounded-xl">
                          <div>
                            <Label className="text-sm font-bold text-slate-700 mb-2 block">
                              Precio mayorista
                            </Label>
                            <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">S/</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={variant.wholesalePrice}
                                onChange={(e) => updateVariant(variant.id, 'wholesalePrice', e.target.value)}
                                placeholder="0.00"
                                className="h-12 pl-10 rounded-xl"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm font-bold text-slate-700 mb-2 block">
                              Cantidad mínima
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              value={variant.wholesaleMinCount}
                              onChange={(e) => updateVariant(variant.id, 'wholesaleMinCount', e.target.value)}
                              placeholder="10"
                              className="h-12 rounded-xl"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Sección de imágenes */}
                    <div>
                      <Label className="text-sm font-bold text-slate-700 mb-2 block">
                        Imágenes (máximo 4)
                      </Label>
                      
                      {variant.images.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mb-3">
                          {variant.images.map((url, index) => (
                            <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100">
                              <img src={url} alt={`Imagen ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                onClick={() => removeVariantImage(variant.id, index)}
                                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center"
                              >
                                <Cancel01Icon className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {variant.images.length < 4 && (
                        <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-slate-300 transition-colors">
                          <div className="flex flex-col items-center justify-center pt-2 pb-2">
                            {isUploadingVariantImages[variant.id] ? (
                              <div className="text-slate-400 text-xs">Subiendo...</div>
                            ) : (
                              <>
                                <Upload02Icon className="w-5 h-5 text-slate-400 mb-1" />
                                <p className="text-xs text-slate-500 font-medium">Subir imágenes</p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => e.target.files && handleVariantImageUpload(variant.id, e.target.files)}
                            className="hidden"
                            disabled={isUploadingVariantImages[variant.id]}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <VariantManager
                variants={variants}
                variantTypes={variantTypes}
                onVariantsChange={setVariants}
                onVariantTypesChange={setVariantTypes}
                onComplete={() => setStep(productToEdit ? 3 : 4)}
                isEditing={!!productToEdit}
              />
            )}
          </div>
        )}

        {/* Step 3: Imágenes (solo para editar) o Step 4: Stock inicial */}
        {((step === 3 && productToEdit) || (step === 4 && !productToEdit)) && (
          <div className="space-y-4">
            {(step === 3 && productToEdit) && (
              <>
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
              </>
            )}

            {(step === 4 && !productToEdit) && (
              <>
                <h3 className="text-lg font-bold text-slate-900">Stock Inicial por Sucursal</h3>
                
                {variants.map((variant) => (
                  <div key={variant.id} className="bg-white border border-slate-200 rounded-2xl p-4">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">{variant.name}</h4>
                    
                    <div className="space-y-3">
                      {branches.map((branch: any) => (
                        <div key={branch.id}>
                          <Label className="text-sm font-bold text-slate-700 mb-2 block">
                            {branch.name}
                          </Label>
                          <Input
                            type="number"
                            min="0"
                            value={branchStocks[variant.id]?.[branch.id] || '0'}
                            onChange={(e) => setBranchStocks(prev => ({
                              ...prev,
                              [variant.id]: {
                                ...prev[variant.id],
                                [branch.id]: e.target.value
                              }
                            }))}
                            placeholder="0"
                            className="h-10 rounded-xl"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
