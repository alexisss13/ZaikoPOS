'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loading02Icon, ShoppingCart01Icon, PlusSignIcon, Delete02Icon, Search01Icon, PackageIcon, DollarCircleIcon } from 'hugeicons-react';
import { Input } from '@/components/ui/input';

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

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PurchaseModal({ isOpen, onClose, onSuccess }: PurchaseModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: suppliers } = useSWR(isOpen ? '/api/suppliers' : null, fetcher);
  const { data: products } = useSWR(isOpen ? '/api/products' : null, fetcher);
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

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  const filteredProducts = (Array.isArray(products) ? products : []).filter((product: any) => {
    const searchLower = searchTerm.toLowerCase();
    return product.title.toLowerCase().includes(searchLower) ||
           product.variants?.some((v: any) => v.name.toLowerCase().includes(searchLower));
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

    // Buscar el producto y variante
    let variantName = '';
    let productName = '';
    let uomName = null;

    const productsArray = Array.isArray(products) ? products : [];
    for (const product of productsArray) {
      const variant = product.variants?.find((v: any) => v.id === selectedVariantId);
      if (variant) {
        variantName = variant.name;
        productName = product.title;
        
        // Si no se seleccionó UOM manualmente, usar el del producto
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

    // Verificar si ya existe
    const existingIndex = items.findIndex(item => item.variantId === selectedVariantId && item.uomId === finalUomId);
    
    if (existingIndex >= 0) {
      // Actualizar cantidad
      const newItems = [...items];
      newItems[existingIndex].quantity += qty;
      setItems(newItems);
      toast.success('Cantidad actualizada');
    } else {
      // Agregar nuevo
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

    // Limpiar
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error('Debes agregar al menos un producto');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        supplierId: formData.supplierId || null,
        orderDate: formData.orderDate,
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

  const getInputClass = (val: string | undefined) => {
    const base = "transition-all focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-sm w-full rounded-xl border px-3 h-10 outline-none";
    const state = val && val.trim() !== ''
      ? "bg-white border-slate-200 text-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]" 
      : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100";
    return `${base} ${state}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0 z-10">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <ShoppingCart01Icon className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col items-start text-left">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
              Nueva Orden de Compra
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Registra los productos que estás comprando al proveedor.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 sm:p-6 overflow-x-hidden relative custom-scrollbar bg-slate-50/30">
          <form id="purchase-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* DATOS GENERALES */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <ShoppingCart01Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} /> Información de la Orden
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Proveedor</Label>
                  <Select value={formData.supplierId} onValueChange={(v) => setFormData(p => ({...p, supplierId: v}))}>
                    <SelectTrigger className={`h-10 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 transition-all ${formData.supplierId ? 'bg-white border-slate-200 shadow-sm font-bold text-slate-900' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                      <SelectValue placeholder="Seleccionar Proveedor (Opcional)" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="NONE">Sin proveedor</SelectItem>
                      {suppliers?.filter((s: any) => s.isActive).map((supplier: any) => (
                        <SelectItem key={supplier.id} value={supplier.id} className="py-2.5 px-3 font-medium text-slate-700">
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-700">Fecha de Orden</Label>
                  <input 
                    type="date"
                    value={formData.orderDate} 
                    onChange={(e) => setFormData(p => ({...p, orderDate: e.target.value}))}
                    className={getInputClass(formData.orderDate)} 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Notas</Label>
                <textarea 
                  value={formData.notes} 
                  onChange={(e) => setFormData(p => ({...p, notes: e.target.value}))}
                  placeholder="Información adicional sobre la compra..." 
                  rows={2}
                  className={`${getInputClass(formData.notes)} h-auto resize-none`}
                />
              </div>
            </div>

            {/* AGREGAR PRODUCTOS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <PackageIcon className="w-4 h-4 text-slate-400" strokeWidth={1.5} /> Agregar Productos
              </h3>

              {/* Buscador de productos */}
              <div className="space-y-3">
                <div className="relative">
                  <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
                  <Input 
                    placeholder="Buscar producto..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 h-10 rounded-xl border-slate-200"
                  />
                </div>

                {searchTerm && filteredProducts.length > 0 && (
                  <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl bg-slate-50">
                    {filteredProducts.slice(0, 5).map((product: any) => (
                      <div key={product.id} className="border-b border-slate-100 last:border-0">
                        <div className="px-3 py-2 text-xs font-bold text-slate-700 flex items-center justify-between">
                          <span>{product.title}</span>
                          {product.supplier && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              Proveedor: {product.supplier.name}
                            </span>
                          )}
                        </div>
                        {product.variants?.map((variant: any) => (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() => {
                              setSelectedVariantId(variant.id);
                              setCost(variant.cost?.toString() || '0');
                              setSelectedUomId(variant.uomId || '');
                              setSearchTerm('');
                            }}
                            className="w-full px-5 py-2 text-left text-xs hover:bg-white transition-colors flex justify-between items-center"
                          >
                            <span className="text-slate-600">{variant.name}</span>
                            <div className="flex items-center gap-2">
                              {variant.cost > 0 && (
                                <span className="text-emerald-600 font-bold text-[10px]">
                                  S/ {variant.cost}
                                </span>
                              )}
                              <span className="text-slate-400 font-mono text-[10px]">
                                {variant.sku || 'Sin SKU'}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
                )}

                {selectedVariantId && (
                  <div className="grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-12 sm:col-span-4 space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Producto Seleccionado</Label>
                      <div className="h-10 px-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center text-xs font-bold text-emerald-700">
                        {(Array.isArray(products) ? products : []).find((p: any) => p.variants?.some((v: any) => v.id === selectedVariantId))?.title} - {(Array.isArray(products) ? products : []).flatMap((p: any) => p.variants || []).find((v: any) => v.id === selectedVariantId)?.name}
                      </div>
                    </div>

                    <div className="col-span-6 sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Cantidad</Label>
                      <input 
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={getInputClass(quantity)}
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Costo Unit.</Label>
                      <input 
                        type="number"
                        min="0"
                        step="0.01"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className={getInputClass(cost)}
                      />
                    </div>

                    <div className="col-span-6 sm:col-span-2 space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">UOM</Label>
                      <Select value={selectedUomId || 'NONE'} onValueChange={(v) => setSelectedUomId(v === 'NONE' ? '' : v)}>
                        <SelectTrigger className="h-10 text-sm rounded-xl">
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
                        className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                      >
                        <PlusSignIcon className="w-4 h-4 mr-1" strokeWidth={1.5} /> Agregar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LISTA DE PRODUCTOS */}
            {items.length > 0 && (
              <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                  <span className="flex items-center gap-2">
                    <PackageIcon className="w-4 h-4 text-slate-400" strokeWidth={1.5} /> Productos en la Orden ({items.length})
                  </span>
                  
                </h3>

                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {items.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
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

          </form>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-between items-center shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase">Total:</span>
            <span className="text-xl font-black text-slate-900">S/ {totalAmount.toFixed(2)}</span>
          </div>
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading} 
              className="h-10 text-xs font-bold hover:bg-slate-50 text-slate-600 rounded-xl border-slate-200"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              form="purchase-form" 
              disabled={isLoading || items.length === 0} 
              className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl shadow-md transition-all"
            >
              {isLoading && <Loading02Icon className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Crear Orden de Compra
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
