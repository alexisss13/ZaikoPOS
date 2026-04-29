'use client';

import { useState } from 'react';
import { ArrowLeft01Icon, ArrowRight01Icon, PlusSignIcon, Cancel01Icon, Upload02Icon, Delete02Icon, RefreshIcon, CheckmarkCircle02Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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

interface VariantManagerProps {
  variants: Variant[];
  variantTypes: string[];
  onVariantsChange: (variants: Variant[]) => void;
  onVariantTypesChange: (types: string[]) => void;
  onComplete: () => void;
  isEditing?: boolean;
}

export function VariantManager({ 
  variants, 
  variantTypes, 
  onVariantsChange, 
  onVariantTypesChange,
  onComplete,
  isEditing = false
}: VariantManagerProps) {
  const [step, setStep] = useState<'types' | 'generate' | 'pricing'>(isEditing && variants.length > 0 ? 'pricing' : 'types');
  const [newVariantType, setNewVariantType] = useState('');
  const [bulkPricing, setBulkPricing] = useState({ 
    price: '', 
    cost: '', 
    wholesalePrice: '', 
    wholesaleMinCount: '' 
  });
  const [isUploadingImages, setIsUploadingImages] = useState<Record<string, boolean>>({});
  const [deletedVariants, setDeletedVariants] = useState<Variant[]>([]);

  const addVariantType = () => {
    if (newVariantType.trim() && !variantTypes.includes(newVariantType.trim())) {
      onVariantTypesChange([...variantTypes, newVariantType.trim()]);
      setNewVariantType('');
    }
  };

  const removeVariantType = (type: string) => {
    onVariantTypesChange(variantTypes.filter(t => t !== type));
    // Actualizar variantes existentes removiendo este atributo
    onVariantsChange(variants.map(v => ({
      ...v,
      attributes: Object.fromEntries(
        Object.entries(v.attributes).filter(([key]) => key !== type)
      )
    })));
  };

  const generateVariantCombinations = () => {
    if (variantTypes.length === 0) {
      toast.error('Agrega al menos un tipo de variante');
      return;
    }

    // Solicitar valores para cada tipo
    const typeValues: Record<string, string[]> = {};
    
    for (const type of variantTypes) {
      const input = prompt(`Ingresa los valores para "${type}" separados por comas:\nEjemplo: S, M, L, XL`);
      if (!input) {
        toast.error('Operación cancelada');
        return;
      }
      typeValues[type] = input.split(',').map(v => v.trim()).filter(Boolean);
    }

    // Generar todas las combinaciones posibles
    const combinations: Array<Record<string, string>> = [];
    const typeNames = Object.keys(typeValues);
    
    function generateCombos(index: number, current: Record<string, string>) {
      if (index === typeNames.length) {
        combinations.push({ ...current });
        return;
      }
      
      const typeName = typeNames[index];
      const values = typeValues[typeName];
      
      values.forEach(value => {
        current[typeName] = value;
        generateCombos(index + 1, current);
      });
    }
    
    generateCombos(0, {});
    
    // Crear variantes basadas en las combinaciones
    const newVariants: Variant[] = combinations.map((combo, index) => {
      const name = Object.values(combo).filter(v => v.trim()).join(' - ') || `Variante ${index + 1}`;
      
      return {
        id: `generated-${Date.now()}-${index}`,
        name,
        attributes: combo,
        sku: '',
        barcode: '',
        price: '',
        cost: '',
        minStock: '5',
        images: [],
        wholesalePrice: '',
        wholesaleMinCount: ''
      };
    });
    
    onVariantsChange(newVariants);
    setDeletedVariants([]); // Limpiar variantes eliminadas
    toast.success(`${combinations.length} variantes generadas automáticamente`);
    setStep('pricing');
  };

  const removeVariant = (id: string) => {
    const variantToDelete = variants.find(v => v.id === id);
    if (variantToDelete) {
      setDeletedVariants(prev => [...prev, variantToDelete]);
      onVariantsChange(variants.filter(v => v.id !== id));
    }
  };

  const restoreVariant = (variant: Variant) => {
    onVariantsChange([...variants, variant]);
    setDeletedVariants(prev => prev.filter(v => v.id !== variant.id));
  };

  const handleImageUpload = async (variantId: string, files: FileList) => {
    if (!files || files.length === 0) return;

    const currentImages = variants.find(v => v.id === variantId)?.images || [];
    if (currentImages.length + files.length > 4) {
      toast.error('Máximo 4 imágenes por variante');
      return;
    }

    setIsUploadingImages(prev => ({ ...prev, [variantId]: true }));
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
      setIsUploadingImages(prev => ({ ...prev, [variantId]: false }));
    }
  };

  const removeVariantImage = (variantId: string, imageIndex: number) => {
    const variant = variants.find(v => v.id === variantId);
    if (variant) {
      const newImages = variant.images.filter((_, i) => i !== imageIndex);
      updateVariant(variantId, 'images', newImages);
    }
  };

  const updateVariant = (id: string, field: keyof Variant, value: any) => {
    onVariantsChange(variants.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const applyBulkPricing = () => {
    if (!bulkPricing.price && !bulkPricing.cost && !bulkPricing.wholesalePrice && !bulkPricing.wholesaleMinCount) {
      toast.error('Ingresa al menos un valor para aplicar a todas las variantes');
      return;
    }

    onVariantsChange(variants.map(v => ({
      ...v,
      price: bulkPricing.price || v.price,
      cost: bulkPricing.cost || v.cost,
      wholesalePrice: bulkPricing.wholesalePrice || v.wholesalePrice,
      wholesaleMinCount: bulkPricing.wholesaleMinCount || v.wholesaleMinCount
    })));

    setBulkPricing({ price: '', cost: '', wholesalePrice: '', wholesaleMinCount: '' });
    toast.success('Valores aplicados a todas las variantes');
  };

  const validatePricing = (): boolean => {
    for (const variant of variants) {
      const cost = parseFloat(variant.cost) || 0;
      const price = parseFloat(variant.price) || 0;
      const wholesalePrice = parseFloat(variant.wholesalePrice) || 0;

      if (cost > price && price > 0) {
        toast.error(`${variant.name}: El costo no puede ser mayor al precio de venta`);
        return false;
      }

      if (wholesalePrice > 0) {
        if (wholesalePrice > price) {
          toast.error(`${variant.name}: El precio mayorista no puede ser mayor al precio de venta`);
          return false;
        }
        if (wholesalePrice <= cost && cost > 0) {
          toast.error(`${variant.name}: El precio mayorista debe ser mayor al costo`);
          return false;
        }
      }
    }
    
    return true;
  };



  return (
    <div className="space-y-6">
      {/* Indicador de pasos - Mobile responsive */}
      <div className="flex items-center justify-center px-4">
        <div className="flex items-center space-x-2 md:space-x-4 overflow-x-auto">
          {['types', 'generate', 'pricing'].map((stepKey, index) => (
            <div key={stepKey} className="flex items-center shrink-0">
              <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold ${
                step === stepKey 
                  ? 'bg-slate-900 text-white' 
                  : index < ['types', 'generate', 'pricing'].indexOf(step)
                  ? 'bg-green-500 text-white'
                  : 'bg-slate-200 text-slate-600'
              }`}>
                {index + 1}
              </div>
              <span className={`ml-1 md:ml-2 text-xs md:text-sm font-medium hidden sm:block ${
                step === stepKey ? 'text-slate-900' : 'text-slate-500'
              }`}>
                {stepKey === 'types' && 'Tipos'}
                {stepKey === 'generate' && 'Generar'}
                {stepKey === 'pricing' && 'Precios'}
              </span>
              {index < 2 && <div className="w-4 md:w-8 h-0.5 bg-slate-200 ml-2 md:ml-4 hidden sm:block" />}
            </div>
          ))}
        </div>
      </div>

      {/* Paso 1: Tipos de variante */}
      {step === 'types' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Paso 1: Define los tipos de variante</h3>
          <p className="text-slate-600 mb-6">Agrega los tipos de variante que tendrá tu producto (ej: Talla, Color, Material)</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {variantTypes.map((type) => (
              <span key={type} className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-lg">
                {type}
                <button onClick={() => removeVariantType(type)}>
                  <Cancel01Icon className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
          
          <div className="flex gap-2 mb-6">
            <Input
              value={newVariantType}
              onChange={(e) => setNewVariantType(e.target.value)}
              placeholder="Ej: Talla, Color, Material..."
              className="h-10 rounded-xl"
              onKeyDown={(e) => e.key === 'Enter' && addVariantType()}
            />
            <Button onClick={addVariantType} className="h-10 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">
              <PlusSignIcon className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex justify-end">
            <Button 
              onClick={() => setStep('generate')}
              disabled={variantTypes.length === 0}
              className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
            >
              Continuar <ArrowRight01Icon className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* Paso 2: Generar variantes */}
      {step === 'generate' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="text-lg font-bold text-slate-900 mb-4">Paso 2: Genera las variantes</h3>
          <p className="text-slate-600 mb-6">
            El sistema generará automáticamente todas las combinaciones posibles de tus tipos de variante.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h4 className="font-bold text-slate-900 mb-2">Tipos configurados:</h4>
            <div className="flex flex-wrap gap-2">
              {variantTypes.map((type) => (
                <span key={type} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded">
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button 
              onClick={() => setStep('types')}
              variant="outline"
              className="h-10 px-6 rounded-xl"
            >
              <ArrowLeft01Icon className="w-4 h-4 mr-2" /> Atrás
            </Button>
            
            <div className="flex gap-3">
              {isEditing && (
                <Button 
                  onClick={() => setStep('pricing')}
                  className="h-10 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl"
                >
                  Continuar <ArrowRight01Icon className="w-4 h-4 ml-2" />
                </Button>
              )}
              <Button 
                onClick={generateVariantCombinations}
                className="h-10 px-6 bg-green-600 hover:bg-green-700 text-white rounded-xl"
              >
                <RefreshIcon className="w-4 h-4 mr-2" />
                {isEditing ? 'Rehacer Variantes' : 'Generar variantes'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Paso 3: Vista tabular para precios */}
      {step === 'pricing' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Paso 3: Configura precios y costos</h3>
              <p className="text-slate-600">Vista tabular para configurar rápidamente todas las variantes</p>
            </div>
            <div className="text-sm text-slate-500">
              {variants.length} variantes
            </div>
          </div>

          {/* Establecer precios en lote */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <h4 className="text-md font-bold text-slate-900 mb-3">
              <PlusSignIcon className="w-4 h-4 inline mr-2" />
              Aplicar a todas las variantes
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">Precio venta</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">S/</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkPricing.price}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setBulkPricing(prev => ({ ...prev, price: value }));
                      }
                    }}
                    placeholder="0.00"
                    className="h-9 pl-8 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">Costo</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">S/</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkPricing.cost}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setBulkPricing(prev => ({ ...prev, cost: value }));
                      }
                    }}
                    placeholder="0.00"
                    className="h-9 pl-8 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">Precio mayorista</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">S/</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bulkPricing.wholesalePrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || parseFloat(value) >= 0) {
                        setBulkPricing(prev => ({ ...prev, wholesalePrice: value }));
                      }
                    }}
                    placeholder="0.00"
                    className="h-9 pl-8 rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-700 mb-1 block">Cant. mín.</Label>
                <Input
                  type="number"
                  min="1"
                  value={bulkPricing.wholesaleMinCount}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || parseInt(value) >= 1) {
                      setBulkPricing(prev => ({ ...prev, wholesaleMinCount: value }));
                    }
                  }}
                  placeholder="10"
                  className="h-9 rounded-lg text-sm"
                />
              </div>
            </div>
            <Button onClick={applyBulkPricing} className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm">
              Aplicar a todas
            </Button>
          </div>

          {/* Tabla de variantes - Mobile responsive */}
          <div className="overflow-x-auto">
            {/* Mobile cards view */}
            <div className="block md:hidden space-y-4">
              {variants.map((variant) => (
                <div key={variant.id} className="bg-white border border-slate-200 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h5 className="font-bold text-slate-900 text-sm">{variant.name}</h5>
                      <p className="text-xs text-slate-500">
                        {Object.entries(variant.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </p>
                    </div>
                    <Button
                      onClick={() => removeVariant(variant.id)}
                      variant="outline"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Delete02Icon className="w-3 h-3" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-1 block">Precio *</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">S/</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || parseFloat(value) >= 0) {
                              updateVariant(variant.id, 'price', value);
                            }
                          }}
                          placeholder="0.00"
                          className="h-8 pl-6 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-1 block">Costo</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">S/</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.cost}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || parseFloat(value) >= 0) {
                              updateVariant(variant.id, 'cost', value);
                            }
                          }}
                          placeholder="0.00"
                          className="h-8 pl-6 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-1 block">SKU</Label>
                      <Input
                        value={variant.sku}
                        onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                        placeholder="SKU"
                        className="h-8 rounded-lg text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-1 block">Stock mín.</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.minStock}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || parseInt(value) >= 0) {
                            updateVariant(variant.id, 'minStock', value);
                          }
                        }}
                        placeholder="5"
                        className="h-8 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-1 block">Precio mayorista</Label>
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">S/</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.wholesalePrice}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || parseFloat(value) >= 0) {
                              updateVariant(variant.id, 'wholesalePrice', value);
                            }
                          }}
                          placeholder="0.00"
                          className="h-8 pl-6 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-1 block">Cant. mín.</Label>
                      <Input
                        type="number"
                        min="1"
                        value={variant.wholesaleMinCount}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || parseInt(value) >= 1) {
                            updateVariant(variant.id, 'wholesaleMinCount', value);
                          }
                        }}
                        placeholder="10"
                        className="h-8 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-xs font-bold text-slate-700 mb-1 block">Imágenes</Label>
                    <div className="flex items-center gap-1">
                      {variant.images.length > 0 && (
                        <div className="flex gap-1">
                          {variant.images.slice(0, 4).map((url, imgIndex) => (
                            <div key={imgIndex} className="relative">
                              <img
                                src={url}
                                alt={`${variant.name} ${imgIndex + 1}`}
                                className="w-6 h-6 rounded border border-white object-cover"
                              />
                              <button
                                onClick={() => removeVariantImage(variant.id, imgIndex)}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                          {variant.images.length > 4 && (
                            <div className="w-6 h-6 rounded border border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                              +{variant.images.length - 4}
                            </div>
                          )}
                        </div>
                      )}
                      {variant.images.length < 4 && (
                        <label className="w-6 h-6 border border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-400 ml-1">
                          <Upload02Icon className="w-3 h-3 text-slate-400" />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={(e) => e.target.files && handleImageUpload(variant.id, e.target.files)}
                            className="hidden"
                            disabled={isUploadingImages[variant.id]}
                          />
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop table view */}
            <table className="hidden md:table w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-2 font-bold text-slate-700">Variante</th>
                  <th className="text-left py-3 px-2 font-bold text-slate-700">Precio *</th>
                  <th className="text-left py-3 px-2 font-bold text-slate-700">Costo</th>
                  <th className="text-left py-3 px-2 font-bold text-slate-700">SKU</th>
                  <th className="text-left py-3 px-2 font-bold text-slate-700">Stock mín.</th>
                  <th className="text-left py-3 px-2 font-bold text-slate-700">Mayorista</th>
                  <th className="text-left py-3 px-2 font-bold text-slate-700 min-w-[80px]">Imágenes</th>
                  <th className="text-center py-3 px-2 font-bold text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={variant.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-2">
                      <div className="font-medium text-slate-900">{variant.name}</div>
                      <div className="text-xs text-slate-500">
                        {Object.entries(variant.attributes).map(([key, value]) => `${key}: ${value}`).join(', ')}
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">S/</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.price}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || parseFloat(value) >= 0) {
                              updateVariant(variant.id, 'price', value);
                            }
                          }}
                          placeholder="0.00"
                          className="h-8 pl-6 rounded-lg text-sm"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <div className="relative">
                        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">S/</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={variant.cost}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || parseFloat(value) >= 0) {
                              updateVariant(variant.id, 'cost', value);
                            }
                          }}
                          placeholder="0.00"
                          className="h-8 pl-6 rounded-lg text-sm"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        value={variant.sku}
                        onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                        placeholder="SKU"
                        className="h-8 rounded-lg text-sm"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <Input
                        type="number"
                        min="0"
                        value={variant.minStock}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '' || parseInt(value) >= 0) {
                            updateVariant(variant.id, 'minStock', value);
                          }
                        }}
                        placeholder="5"
                        className="h-8 rounded-lg text-sm"
                      />
                    </td>
                    <td className="py-3 px-2">
                      <div className="flex gap-1">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-xs">S/</span>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={variant.wholesalePrice}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value === '' || parseFloat(value) >= 0) {
                                updateVariant(variant.id, 'wholesalePrice', value);
                              }
                            }}
                            placeholder="0.00"
                            className="h-8 pl-6 rounded-lg text-sm w-20"
                          />
                        </div>
                        <Input
                          type="number"
                          min="1"
                          value={variant.wholesaleMinCount}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === '' || parseInt(value) >= 1) {
                              updateVariant(variant.id, 'wholesaleMinCount', value);
                            }
                          }}
                          placeholder="10"
                          className="h-8 rounded-lg text-sm w-16"
                        />
                      </div>
                    </td>
                    <td className="py-3 px-2 min-w-[80px]">
                      <div className="flex items-center gap-1">
                        {variant.images.length > 0 && (
                          <div className="flex gap-1">
                            {variant.images.slice(0, 4).map((url, imgIndex) => (
                              <div key={imgIndex} className="relative">
                                <img
                                  src={url}
                                  alt={`${variant.name} ${imgIndex + 1}`}
                                  className="w-5 h-5 rounded border border-white object-cover"
                                />
                                <button
                                  onClick={() => removeVariantImage(variant.id, imgIndex)}
                                  className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 text-xs leading-none"
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                            {variant.images.length > 4 && (
                              <div className="w-5 h-5 rounded border border-white bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                                +{variant.images.length - 4}
                              </div>
                            )}
                          </div>
                        )}
                        {variant.images.length < 4 && (
                          <label className="w-5 h-5 border border-dashed border-slate-300 rounded flex items-center justify-center cursor-pointer hover:border-slate-400 ml-1">
                            <Upload02Icon className="w-2.5 h-2.5 text-slate-400" />
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) => e.target.files && handleImageUpload(variant.id, e.target.files)}
                              className="hidden"
                              disabled={isUploadingImages[variant.id]}
                            />
                          </label>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center">
                      <Button
                        onClick={() => removeVariant(variant.id)}
                        variant="outline"
                        size="sm"
                        className="h-7 w-7 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Delete02Icon className="w-3 h-3" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Variantes eliminadas */}
          {deletedVariants.length > 0 && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <h5 className="text-sm font-bold text-red-900 mb-2">Variantes eliminadas</h5>
              <div className="flex flex-wrap gap-2">
                {deletedVariants.map((variant) => (
                  <div key={variant.id} className="flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 text-sm rounded-lg">
                    <span>{variant.name}</span>
                    <Button
                      onClick={() => restoreVariant(variant)}
                      size="sm"
                      className="h-5 w-5 p-0 bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      <PlusSignIcon className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between mt-6">
            <Button 
              onClick={() => setStep('generate')}
              variant="outline"
              className="h-10 px-6 rounded-xl"
            >
              <ArrowLeft01Icon className="w-4 h-4 mr-2" /> Atrás
            </Button>
            
          </div>
        </div>
      )}
    </div>
  );
}