'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loading02Icon, ArrowDataTransferHorizontalIcon, Search01Icon, PlusSignIcon, Delete02Icon } from 'hugeicons-react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Product {
  id: string;
  title: string;
  variants: Array<{
    id: string;
    name: string;
    barcode?: string | null;
    sku?: string | null;
    stock?: Array<{
      branchId: string;
      quantity: number;
    }>;
  }>;
}

interface Branch {
  id: string;
  name: string;
}

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branches: Branch[];
}

interface TransferItem {
  id: string;
  variantId: string;
  productTitle: string;
  variantName: string;
  quantity: number;
  availableStock: number;
}

export function TransferModal({ isOpen, onClose, onSuccess, branches }: TransferModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [reason, setReason] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { data: products } = useSWR<Product[]>(isOpen ? '/api/products' : null, fetcher);

  const [formData, setFormData] = useState({
    variantId: '',
    quantity: '',
    fromBranchId: '',
    toBranchId: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        variantId: '',
        quantity: '',
        fromBranchId: branches?.[0]?.id || '',
        toBranchId: branches?.[1]?.id || branches?.[0]?.id || '',
      });
      setSelectedProduct(null);
      setSearchTerm('');
      setTransferItems([]);
      setReason('');
    }
  }, [isOpen, branches]);

  const filteredProducts = (products && Array.isArray(products)) ? products.filter(p => {
    // Filtrar por búsqueda
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants.some(v => 
        v.barcode?.includes(searchTerm) || 
        v.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    if (!matchesSearch) return false;
    
    // Solo mostrar productos que tengan al menos una variante con stock en la sucursal de origen
    const hasStockInOrigin = p.variants.some(v => {
      const stockInBranch = v.stock?.find(s => s.branchId === formData.fromBranchId);
      return stockInBranch && stockInBranch.quantity > 0;
    });
    
    return hasStockInOrigin;
  }) : [];

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    if (product.variants.length === 1) {
      setFormData(prev => ({ ...prev, variantId: product.variants[0].id }));
    }
  };

  const addToTransferList = () => {
    if (!selectedProduct || !formData.variantId || !formData.quantity) {
      toast.error('Selecciona un producto y cantidad');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    if (formData.fromBranchId === formData.toBranchId) {
      toast.error('Las sucursales de origen y destino deben ser diferentes');
      return;
    }

    const variant = selectedProduct.variants.find(v => v.id === formData.variantId);
    if (!variant) return;

    // Obtener stock disponible en la sucursal de origen
    const stockInBranch = variant.stock?.find(s => s.branchId === formData.fromBranchId);
    const availableStock = stockInBranch?.quantity || 0;

    if (availableStock === 0) {
      toast.error('No hay stock disponible en la sucursal de origen');
      return;
    }

    // Calcular cuánto ya se ha agregado de esta variante
    const existingItem = transferItems.find(item => item.variantId === formData.variantId);
    const alreadyAdded = existingItem?.quantity || 0;

    // Validar que no exceda el stock disponible
    if (alreadyAdded + quantity > availableStock) {
      toast.error(`Stock insuficiente. Disponible: ${availableStock}, Ya agregado: ${alreadyAdded}`);
      return;
    }

    // Verificar si ya existe
    const existingIndex = transferItems.findIndex(item => item.variantId === formData.variantId);
    
    if (existingIndex >= 0) {
      // Actualizar cantidad
      const newItems = [...transferItems];
      newItems[existingIndex].quantity += quantity;
      setTransferItems(newItems);
      toast.success('Cantidad actualizada');
    } else {
      // Agregar nuevo
      setTransferItems([...transferItems, {
        id: Date.now().toString(),
        variantId: formData.variantId,
        productTitle: selectedProduct.title,
        variantName: variant.name,
        quantity,
        availableStock
      }]);
      toast.success('Producto agregado');
    }

    // Limpiar formulario para siguiente producto
    setSearchTerm('');
    setSelectedProduct(null);
    setFormData(prev => ({ ...prev, variantId: '', quantity: '' }));
    
    // Enfocar el input de búsqueda
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const removeTransferItem = (id: string) => {
    setTransferItems(transferItems.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (transferItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    if (!reason.trim()) {
      toast.error('Ingresa el motivo del traslado');
      return;
    }

    if (formData.fromBranchId === formData.toBranchId) {
      toast.error('Las sucursales de origen y destino deben ser diferentes');
      return;
    }

    setIsLoading(true);

    try {
      // Crear el traslado con estado PENDING
      const res = await fetch('/api/stock-transfers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromBranchId: formData.fromBranchId,
          toBranchId: formData.toBranchId,
          reason,
          items: transferItems.map(item => ({
            variantId: item.variantId,
            quantity: item.quantity
          }))
        }),
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Error al crear el traslado');
      }

      toast.success('Traslado creado correctamente. Pendiente de aprobación.');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        <DialogHeader className="px-6 py-4 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <ArrowDataTransferHorizontalIcon className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col items-start text-left flex-1">
            <DialogTitle className="text-xl font-black text-slate-900 leading-tight">
              Nuevo Traslado de Inventario
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Transfiere productos entre sucursales
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={(e) => e.preventDefault()} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          
          {/* Sucursales */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Desde (Origen) <span className="text-red-500">*</span></Label>
              <select
                value={formData.fromBranchId}
                onChange={(e) => {
                  const newFrom = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    fromBranchId: newFrom,
                    // Si el destino es igual al nuevo origen, cambiar destino
                    toBranchId: prev.toBranchId === newFrom 
                      ? (branches?.find(b => b.id !== newFrom)?.id || prev.toBranchId)
                      : prev.toBranchId
                  }));
                  // Limpiar productos seleccionados al cambiar sucursal de origen
                  setTransferItems([]);
                  setSelectedProduct(null);
                  setSearchTerm('');
                }}
                className="w-full h-11 px-3 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                required
              >
                {branches?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Hacia (Destino) <span className="text-red-500">*</span></Label>
              <select
                value={formData.toBranchId}
                onChange={(e) => setFormData(prev => ({ ...prev, toBranchId: e.target.value }))}
                className="w-full h-11 px-3 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                required
              >
                {branches?.filter(b => b.id !== formData.fromBranchId).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              {formData.fromBranchId === formData.toBranchId && (
                <p className="text-xs text-red-600">Las sucursales deben ser diferentes</p>
              )}
            </div>
          </div>

          {/* Buscar Producto */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Buscar Producto <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Search01Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={1.5} />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, SKU o código de barras..."
                className="w-full h-11 pl-10 pr-3 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
              />
            </div>
            
            {searchTerm && (
              <div className="max-h-48 overflow-y-auto bg-white border border-slate-200 rounded-lg divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No se encontraron productos
                  </div>
                ) : (
                  filteredProducts.slice(0, 5).map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => handleProductSelect(product)}
                      className="w-full p-3 text-left hover:bg-slate-50 transition-colors"
                    >
                      <div className="font-bold text-sm text-slate-900">{product.title}</div>
                      <div className="text-xs text-slate-500">{product.variants.length} variante(s)</div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Seleccionar Variante */}
          {selectedProduct && selectedProduct.variants.length > 1 && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Variante <span className="text-red-500">*</span></Label>
              <select
                value={formData.variantId}
                onChange={(e) => setFormData(prev => ({ ...prev, variantId: e.target.value }))}
                className="w-full h-11 px-3 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                required
              >
                <option value="">Selecciona una variante</option>
                {selectedProduct.variants
                  .filter(variant => {
                    // Solo mostrar variantes con stock en la sucursal de origen
                    const stockInBranch = variant.stock?.find(s => s.branchId === formData.fromBranchId);
                    return stockInBranch && stockInBranch.quantity > 0;
                  })
                  .map((variant) => {
                    const stockInBranch = variant.stock?.find(s => s.branchId === formData.fromBranchId);
                    const availableStock = stockInBranch?.quantity || 0;
                    return (
                      <option key={variant.id} value={variant.id}>
                        {variant.name} {variant.sku ? `(${variant.sku})` : ''} - Stock: {availableStock}
                      </option>
                    );
                  })}
              </select>
            </div>
          )}

          {/* Producto Seleccionado */}
          {selectedProduct && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs font-bold text-blue-900 mb-1">Producto seleccionado:</div>
              <div className="text-sm font-bold text-blue-700">{selectedProduct.title}</div>
              {formData.variantId && (() => {
                const variant = selectedProduct.variants.find(v => v.id === formData.variantId);
                const stockInBranch = variant?.stock?.find(s => s.branchId === formData.fromBranchId);
                const availableStock = stockInBranch?.quantity || 0;
                return (
                  <div className="text-xs text-blue-600 mt-1">
                    {variant?.name} - <span className="font-bold">Stock disponible: {availableStock}</span>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Cantidad */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">
              Cantidad <span className="text-red-500">*</span>
              {formData.variantId && selectedProduct && (() => {
                const variant = selectedProduct.variants.find(v => v.id === formData.variantId);
                const stockInBranch = variant?.stock?.find(s => s.branchId === formData.fromBranchId);
                const availableStock = stockInBranch?.quantity || 0;
                const alreadyAdded = transferItems.find(item => item.variantId === formData.variantId)?.quantity || 0;
                const remaining = availableStock - alreadyAdded;
                return (
                  <span className="text-slate-500 font-normal ml-2">
                    (Máximo: {remaining})
                  </span>
                );
              })()}
            </Label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max={(() => {
                  if (!formData.variantId || !selectedProduct) return undefined;
                  const variant = selectedProduct.variants.find(v => v.id === formData.variantId);
                  const stockInBranch = variant?.stock?.find(s => s.branchId === formData.fromBranchId);
                  const availableStock = stockInBranch?.quantity || 0;
                  const alreadyAdded = transferItems.find(item => item.variantId === formData.variantId)?.quantity || 0;
                  return availableStock - alreadyAdded;
                })()}
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addToTransferList();
                  }
                }}
                placeholder="Ingresa la cantidad"
                className="flex-1 h-11 px-3 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                required
              />
              <Button
                type="button"
                onClick={addToTransferList}
                disabled={!selectedProduct || !formData.variantId || !formData.quantity}
                className="h-11 px-4 bg-slate-900 hover:bg-slate-800"
              >
                <PlusSignIcon className="w-4 h-4 mr-2" strokeWidth={1.5} />
                Agregar
              </Button>
            </div>
          </div>

          {/* Lista de productos */}
          {transferItems.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Productos a trasladar ({transferItems.length})</Label>
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {transferItems.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-900">{item.productTitle}</div>
                      <div className="text-xs text-slate-500">
                        {item.variantName} - Stock disponible: {item.availableStock}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">x{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => removeTransferItem(item.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Delete02Icon className="w-4 h-4" strokeWidth={1.5} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivo */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Motivo del Traslado <span className="text-red-500">*</span></Label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe el motivo del traslado..."
              rows={3}
              className="w-full px-3 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300 resize-none"
              required
            />
          </div>

        </form>

        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
          <Button 
            type="button"
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
            className="h-10 text-xs font-bold"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isLoading || transferItems.length === 0}
            className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800"
          >
            {isLoading && <Loading02Icon className="w-4 h-4 mr-2 animate-spin" />}
            Registrar Traslado de {transferItems.length} Producto(s)
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
