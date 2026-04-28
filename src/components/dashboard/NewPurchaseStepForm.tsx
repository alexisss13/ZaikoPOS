'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Combobox, ComboboxOption } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { 
  Loading02Icon, 
  ShoppingCart01Icon, 
  PlusSignIcon, 
  Delete02Icon, 
  Search01Icon, 
  PackageIcon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  CheckmarkCircle02Icon
} from 'hugeicons-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface PurchaseItem {
  variantId: string;
  variantName: string;
  productName: string;
  uomId: string | null;
  uomName: string | null;
  quantity: number;
  cost: number;
}

interface NewPurchaseStepFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewPurchaseStepForm({ isOpen, onClose, onSuccess }: NewPurchaseStepFormProps) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: suppliers } = useSWR(isOpen ? '/api/suppliers' : null, fetcher);
  const { data: products } = useSWR(isOpen ? '/api/products?forPOS=true' : null, fetcher);
  const { data: uoms } = useSWR(isOpen ? '/api/uoms' : null, fetcher);

  const [formData, setFormData] = useState({
    supplierId: '',
    orderDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [selectedUomId, setSelectedUomId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [cost, setCost] = useState('0');
  const [showAllProducts, setShowAllProducts] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        supplierId: '',
        orderDate: new Date().toISOString().split('T')[0],
        notes: '',
      });
      setItems([]);
      setSearchTerm('');
      setSelectedVariantId('');
      setSelectedUomId('');
      setQuantity('1');
      setCost('0');
      setShowAllProducts(false);
    }
  }, [isOpen]);

  const filteredProducts = (Array.isArray(products) ? products : []).filter((product: any) => {
    // Si hay búsqueda, mostrar todos los que coincidan
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return product.title.toLowerCase().includes(searchLower) ||
             product.variants?.some((v: any) => v.name.toLowerCase().includes(searchLower));
    }
    
    // Si no hay búsqueda y no se activó "mostrar todos", filtrar por stock bajo
    if (!showAllProducts) {
      return product.variants?.some((v: any) => {
        const totalStock = v.stock?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
        return totalStock <= v.minStock;
      });
    }
    
    // Mostrar todos
    return true;
  });

  const addItem = () => {
    if (!selectedVariantId) {
      toast.error('Selecciona un producto');
      return;
    }

    const qty = parseFloat(quantity);
    const costValue = parseFloat(cost);

    if (isNaN(qty) || qty <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (isNaN(costValue) || costValue < 0) {
      toast.error('El costo debe ser mayor o igual a 0');
      return;
    }

    let variantName = '';
    let productName = '';
    let uomName = null;

    const productsArray = Array.isArray(products) ? products : [];
    for (const product of productsArray) {
      const variant = product.variants?.find((v: any) => v.id === selectedVariantId);
      if (variant) {
        variantName = variant.name;
        productName = product.title;
        
        if (!selectedUomId && variant.uomId) {
          setSelectedUomId(variant.uomId);
        }
        break;
      }
    }

    const finalUomId = (selectedUomId && selectedUomId !== 'NONE') ? selectedUomId : null;

    if (finalUomId) {
      const uom = uoms?.find((u: any) => u.id === finalUomId);
      uomName = uom ? uom.abbreviation : null;
    }

    const existingIndex = items.findIndex(item => item.variantId === selectedVariantId && item.uomId === finalUomId);
    
    if (existingIndex >= 0) {
      const newItems = [...items];
      newItems[existingIndex].quantity += qty;
      setItems(newItems);
      toast.success('Cantidad actualizada');
    } else {
      setItems([...items, {
        variantId: selectedVariantId,
        variantName,
        productName,
        uomId: finalUomId,
        uomName,
        quantity: qty,
        cost: costValue,
      }]);
      toast.success('Producto agregado');
    }

    setSelectedVariantId('');
    setSelectedUomId('');
    setQuantity('1');
    setCost('0');
    setSearchTerm('');
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
    toast.success('Producto eliminado');
  };

  const totalAmount = items.reduce((sum, item) => sum + (item.quantity * item.cost), 0);

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Debes agregar al menos un producto');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        supplierId: formData.supplierId || null,
        orderDate: new Date(formData.orderDate + 'T12:00:00').toISOString(),
        notes: formData.notes.trim() === '' ? null : formData.notes,
        items: items.map(item => ({
          variantId: item.variantId,
          uomId: item.uomId,
          quantity: item.quantity,
          cost: item.cost,
        })),
      };

      const res = await fetch('/api/purchases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Orden de compra creada exitosamente');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const canGoNext = () => {
    if (step === 1) return formData.supplierId;
    if (step === 2) return items.length > 0;
    return true;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        {/* Header con progreso */}
        <div className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm shrink-0">
          <DialogHeader className="p-0 space-y-0">
            <div className="flex items-center gap-4 mb-4">
              <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
                <ShoppingCart01Icon className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
              </div>
              <div className="flex-1">
                <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
                  Nueva Orden de Compra
                </DialogTitle>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Paso {step} de 3
                </p>
              </div>
            </div>
          </DialogHeader>

          {/* Progress bar */}
          <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-slate-900 transition-all duration-300 rounded-full"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
          
          {/* Paso 1: Información General */}
          {step === 1 && (
            <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShoppingCart01Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                Información de la Orden
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-2 block">Proveedor (Opcional)</Label>
                  <Combobox
                    options={[
                      { value: 'NONE', label: 'Sin proveedor' },
                      ...(suppliers?.filter((s: any) => s.isActive).map((supplier: any) => ({
                        value: supplier.id,
                        label: supplier.name
                      })) || [])
                    ]}
                    value={formData.supplierId}
                    onValueChange={(v) => setFormData(p => ({...p, supplierId: v}))}
                    placeholder="Seleccionar Proveedor"
                    searchPlaceholder="Buscar proveedor..."
                    emptyText="No se encontraron proveedores"
                    className="h-11 text-sm rounded-xl"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-2 block">Fecha de Orden</Label>
                  <input 
                    type="date"
                    value={formData.orderDate} 
                    onChange={(e) => setFormData(p => ({...p, orderDate: e.target.value}))}
                    className="w-full h-11 px-4 text-sm font-medium bg-white border border-slate-200 rounded-xl outline-none transition-all focus:ring-2 focus:ring-slate-300"
                  />
                </div>

                <div>
                  <Label className="text-xs font-bold text-slate-700 mb-2 block">Notas (Opcional)</Label>
                  <textarea 
                    value={formData.notes} 
                    onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))}
                    placeholder="Información adicional sobre la compra..." 
                    rows={4}
                    className="w-full px-4 py-3 text-sm font-medium bg-white border border-slate-200 rounded-xl outline-none transition-all focus:ring-2 focus:ring-slate-300 resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Agregar Productos */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <PackageIcon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  Agregar Productos
                </h3>

                {/* Buscador */}
                <div className="space-y-2">
                  <div className="relative">
                    <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                    <Input 
                      placeholder="Buscar producto..." 
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 h-11 rounded-xl"
                    />
                  </div>
                  
                  {!searchTerm && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">
                        {showAllProducts ? 'Mostrando todos los productos' : 'Mostrando productos con stock bajo'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAllProducts(!showAllProducts)}
                        className="text-slate-700 font-bold hover:text-slate-900 underline"
                      >
                        {showAllProducts ? 'Ver solo stock bajo' : 'Ver todos'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Resultados de búsqueda */}
                {searchTerm && filteredProducts.length > 0 && (
                  <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                    {filteredProducts.slice(0, 5).map((product: any) => (
                      <div key={product.id} className="border-b border-slate-100 last:border-0">
                        <div className="px-4 py-2 text-xs font-bold text-slate-700">
                          {product.title}
                        </div>
                        {product.variants?.map((variant: any) => {
                          const totalStock = variant.stock?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
                          const isLowStock = totalStock <= variant.minStock;
                          
                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => {
                                setSelectedVariantId(variant.id);
                                setCost(variant.cost?.toString() || '0');
                                setSelectedUomId(variant.uomId || '');
                                setSearchTerm('');
                              }}
                              className="w-full px-6 py-2.5 text-left text-xs hover:bg-white transition-colors flex justify-between items-center"
                            >
                              <div className="flex-1">
                                <span className="text-slate-600">{variant.name}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  {variant.cost > 0 && (
                                    <span className="text-emerald-600 font-bold text-xs">
                                      S/ {variant.cost}
                                    </span>
                                  )}
                                  <span className="text-slate-400 font-mono text-[10px]">
                                    {variant.sku || 'Sin SKU'}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right ml-2">
                                <span className={`text-xs font-bold ${isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>
                                  Stock: {totalStock}
                                </span>
                                <p className="text-[9px] text-slate-400">
                                  Mín: {variant.minStock}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}

                {/* Lista de productos con stock bajo (cuando no hay búsqueda) */}
                {!searchTerm && (
                  <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                    <div className="px-4 py-2 text-xs font-bold text-slate-700 border-b border-slate-200 bg-white sticky top-0">
                      {showAllProducts ? 'Todos los productos' : 'Productos con stock bajo'}
                    </div>
                    {filteredProducts.length === 0 ? (
                      <div className="px-4 py-8 text-center text-xs text-slate-500">
                        {showAllProducts ? 'No hay productos disponibles' : 'No hay productos con stock bajo'}
                      </div>
                    ) : (
                      filteredProducts.map((product: any) => (
                        <div key={product.id} className="border-b border-slate-100 last:border-0">
                          <div className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-50">
                            {product.title}
                          </div>
                          {product.variants?.map((variant: any) => {
                            const totalStock = variant.stock?.reduce((sum: number, s: any) => sum + s.quantity, 0) || 0;
                            const isLowStock = totalStock <= variant.minStock;
                            
                            return (
                              <button
                                key={variant.id}
                                type="button"
                                onClick={() => {
                                  setSelectedVariantId(variant.id);
                                  setCost(variant.cost?.toString() || '0');
                                  setSelectedUomId(variant.uomId || '');
                                }}
                                className="w-full px-6 py-2.5 text-left text-xs hover:bg-white transition-colors flex justify-between items-center"
                              >
                                <div className="flex-1">
                                  <span className="text-slate-600">{variant.name}</span>
                                  <div className="flex items-center gap-2 mt-1">
                                    {variant.cost > 0 && (
                                      <span className="text-emerald-600 font-bold text-xs">
                                        S/ {variant.cost}
                                      </span>
                                    )}
                                    <span className="text-slate-400 font-mono text-[10px]">
                                      {variant.sku || 'Sin SKU'}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right ml-2">
                                  <span className={`text-xs font-bold ${isLowStock ? 'text-red-600' : 'text-emerald-600'}`}>
                                    Stock: {totalStock}
                                  </span>
                                  <p className="text-[9px] text-slate-400">
                                    Mín: {variant.minStock}
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Producto seleccionado */}
                {selectedVariantId && (
                  <div className="grid grid-cols-12 gap-3 items-end p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                    <div className="col-span-12 sm:col-span-4">
                      <Label className="text-xs font-bold text-emerald-900 mb-2 block">Producto Seleccionado</Label>
                      <div className="text-xs font-bold text-emerald-700">
                        {(Array.isArray(products) ? products : []).find((p: any) => p.variants?.some((v: any) => v.id === selectedVariantId))?.title} - {(Array.isArray(products) ? products : []).flatMap((p: any) => p.variants || []).find((v: any) => v.id === selectedVariantId)?.name}
                      </div>
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-700 mb-2 block">Cantidad</Label>
                      <input 
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className="w-full h-10 px-3 text-sm font-medium bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-700 mb-2 block">Costo Unit.</Label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="w-full h-10 px-3 text-sm font-medium bg-white border border-slate-200 rounded-lg"
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <Label className="text-xs font-bold text-slate-700 mb-2 block">UOM</Label>
                      <Select value={selectedUomId || 'NONE'} onValueChange={(v) => setSelectedUomId(v === 'NONE' ? '' : v)}>
                        <SelectTrigger className="h-10 text-sm rounded-lg">
                          <SelectValue placeholder="UND" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="NONE">Unidad</SelectItem>
                          {uoms?.map((uom: any) => (
                            <SelectItem key={uom.id} value={uom.id}>{uom.abbreviation}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                      <Button 
                        type="button"
                        onClick={addItem}
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg"
                      >
                        <PlusSignIcon className="w-4 h-4 mr-1" strokeWidth={1.5} /> Agregar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lista de productos agregados */}
              {items.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="flex items-center gap-2">
                      <PackageIcon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                      Productos en la Orden ({items.length})
                    </span>
                  </h3>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-900 truncate">{item.productName}</div>
                          <div className="text-xs text-slate-500">{item.variantName} {item.uomName && `(${item.uomName})`}</div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs text-slate-500">Cant: {item.quantity}</div>
                            <div className="text-xs font-bold text-slate-900">S/ {item.cost.toFixed(2)} c/u</div>
                          </div>
                          <div className="text-sm font-black text-emerald-600 w-20 text-right">
                            S/ {(item.quantity * item.cost).toFixed(2)}
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Delete02Icon className="w-4 h-4" strokeWidth={1.5} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Paso 3: Resumen */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-3">
                  <CheckmarkCircle02Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  Resumen de la Orden
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Proveedor:</span>
                    <span className="text-sm font-bold text-slate-900">
                      {formData.supplierId ? suppliers?.find((s: any) => s.id === formData.supplierId)?.name : 'Sin proveedor'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Fecha:</span>
                    <span className="text-sm font-bold text-slate-900">
                      {new Date(formData.orderDate).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Productos:</span>
                    <span className="text-sm font-bold text-slate-900">
                      {items.length}
                    </span>
                  </div>
                </div>

                {formData.notes && (
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-xs text-slate-600 block mb-2">Notas:</span>
                    <p className="text-sm text-slate-700 bg-slate-50 p-3 rounded-lg">{formData.notes}</p>
                  </div>
                )}
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-700">Total de la Orden:</span>
                  <span className="text-2xl font-black text-emerald-700">
                    S/ {totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer con navegación */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
          <div className="flex gap-2">
            {step > 1 && (
              <Button 
                type="button"
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="h-10 text-xs font-bold"
              >
                <ArrowLeft01Icon className="w-4 h-4 mr-1.5" />
                Anterior
              </Button>
            )}
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading} 
              className="h-10 text-xs font-bold"
            >
              Cancelar
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-500">
              Total: <span className="text-lg text-slate-900">S/ {totalAmount.toFixed(2)}</span>
            </span>
            
            {step < 3 ? (
              <Button 
                type="button"
                onClick={() => setStep(step + 1)}
                disabled={!canGoNext()}
                className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6"
              >
                Siguiente
                <ArrowRight01Icon className="w-4 h-4 ml-1.5" />
              </Button>
            ) : (
              <Button 
                type="button"
                onClick={handleSubmit}
                disabled={isLoading || items.length === 0}
                className="h-10 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-6"
              >
                {isLoading && <Loading02Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Crear Orden de Compra
              </Button>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
