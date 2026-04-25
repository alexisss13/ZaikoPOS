'use client';

import { useState, useRef } from 'react';
import { 
  ArrowLeft01Icon,
  ArrowDataTransferHorizontalIcon,
  Search01Icon,
  PackageIcon,
  PlusSignIcon,
  Delete02Icon,
  CheckmarkCircle02Icon,
  Store01Icon,
} from 'hugeicons-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

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

interface TransferItem {
  id: string;
  variantId: string;
  productTitle: string;
  variantName: string;
  quantity: number;
  availableStock: number;
}

interface NewTransferMobileProps {
  onClose: () => void;
  onSuccess: () => void;
  branches: Branch[];
  products: Product[];
}

export function NewTransferMobile({ onClose, onSuccess, branches, products }: NewTransferMobileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [reason, setReason] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Pull-to-refresh
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    variantId: '',
    quantity: '',
    fromBranchId: branches?.[0]?.id || '',
    toBranchId: branches?.[1]?.id || branches?.[0]?.id || '',
  });

  // Pull-to-refresh handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;
      
      if (distance > 0 && distance < 100) {
        setIsPulling(distance > 60);
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling && !isRefreshing) {
      setIsRefreshing(true);
      setIsPulling(false);
      
      // Llamar a onSuccess para refrescar datos sin recargar página
      try {
        await onSuccess();
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500);
      }
    } else {
      setIsPulling(false);
    }
  };

  const filteredProducts = (products && Array.isArray(products)) ? products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.variants.some(v => 
        v.barcode?.includes(searchTerm) || 
        v.sku?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    if (!matchesSearch) return false;
    
    const hasStockInOrigin = p.variants.some(v => {
      const stockInBranch = v.stock?.find(s => s.branchId === formData.fromBranchId);
      return stockInBranch && stockInBranch.quantity > 0;
    });
    
    return hasStockInOrigin;
  }) : [];

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
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
      toast.error('Las sucursales deben ser diferentes');
      return;
    }

    const variant = selectedProduct.variants.find(v => v.id === formData.variantId);
    if (!variant) return;

    const stockInBranch = variant.stock?.find(s => s.branchId === formData.fromBranchId);
    const availableStock = stockInBranch?.quantity || 0;

    if (availableStock === 0) {
      toast.error('No hay stock disponible');
      return;
    }

    const existingItem = transferItems.find(item => item.variantId === formData.variantId);
    const alreadyAdded = existingItem?.quantity || 0;

    if (alreadyAdded + quantity > availableStock) {
      toast.error(`Stock insuficiente. Disponible: ${availableStock}, Ya agregado: ${alreadyAdded}`);
      return;
    }

    const existingIndex = transferItems.findIndex(item => item.variantId === formData.variantId);
    
    if (existingIndex >= 0) {
      const newItems = [...transferItems];
      newItems[existingIndex].quantity += quantity;
      setTransferItems(newItems);
      toast.success('Cantidad actualizada');
    } else {
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

    setSelectedProduct(null);
    setFormData(prev => ({ ...prev, variantId: '', quantity: '' }));
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
      toast.error('Las sucursales deben ser diferentes');
      return;
    }

    setIsLoading(true);

    try {
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

      toast.success('Traslado creado. Pendiente de aprobación.');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setIsLoading(false);
    }
  };

  const fromBranch = branches?.find(b => b.id === formData.fromBranchId);
  const toBranch = branches?.find(b => b.id === formData.toBranchId);

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={onClose}
          className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-900" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-black text-slate-900">Nuevo Traslado</h1>
          <p className="text-xs text-slate-500">Transfiere entre sucursales</p>
        </div>
      </div>

      {/* Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Pull-to-refresh indicator */}
        <div className={`flex items-center justify-center py-2 transition-all duration-200 ${isPulling || isRefreshing ? 'opacity-100' : 'opacity-0'}`}>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <div className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            </div>
            {isRefreshing ? 'Actualizando...' : isPulling ? 'Suelta para actualizar' : 'Desliza para actualizar'}
          </div>
        </div>
        {/* Sucursales */}
        <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDataTransferHorizontalIcon className="w-5 h-5 text-slate-600" />
            <span className="text-xs font-bold text-slate-700">Ruta del Traslado</span>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Desde (Origen)</label>
              <select
                value={formData.fromBranchId}
                onChange={(e) => {
                  const newFrom = e.target.value;
                  setFormData(prev => ({ 
                    ...prev, 
                    fromBranchId: newFrom,
                    toBranchId: prev.toBranchId === newFrom 
                      ? (branches?.find(b => b.id !== newFrom)?.id || prev.toBranchId)
                      : prev.toBranchId
                  }));
                  setTransferItems([]);
                  setSelectedProduct(null);
                  setSearchTerm('');
                }}
                className="w-full h-12 px-4 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-slate-900"
              >
                {branches?.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <ArrowDataTransferHorizontalIcon className="w-4 h-4 text-slate-600" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">Hacia (Destino)</label>
              <select
                value={formData.toBranchId}
                onChange={(e) => setFormData(prev => ({ ...prev, toBranchId: e.target.value }))}
                className="w-full h-12 px-4 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-slate-900"
              >
                {branches?.filter(b => b.id !== formData.fromBranchId).map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {fromBranch && toBranch && (
            <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-xs text-blue-700">
                <Store01Icon className="w-4 h-4" />
                <span className="font-bold">{fromBranch.name}</span>
                <span>→</span>
                <span className="font-bold">{toBranch.name}</span>
              </div>
            </div>
          )}
        </div>

        {/* Buscar Producto */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Buscar Producto</label>
          <div className="relative">
            <Search01Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              ref={searchInputRef}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nombre, SKU o código..."
              className="pl-12 h-12 text-sm border-2 border-slate-200 rounded-xl focus:border-slate-900"
            />
          </div>
          
          {searchTerm && (
            <div className="bg-white border-2 border-slate-200 rounded-xl divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No hay productos con stock en {fromBranch?.name}
                </div>
              ) : (
                filteredProducts.slice(0, 5).map((product) => (
                  <button
                    key={product.id}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    className="w-full p-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
                  >
                    <div className="font-bold text-sm text-slate-900">{product.title}</div>
                    <div className="text-xs text-slate-500">{product.variants.length} variante(s)</div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Producto Seleccionado */}
        {selectedProduct && (
          <>
            <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <PackageIcon className="w-5 h-5 text-blue-600" />
                <span className="text-xs font-bold text-blue-900">Producto seleccionado</span>
              </div>
              <div className="font-bold text-sm text-blue-700">{selectedProduct.title}</div>
            </div>

            {/* Variante */}
            {selectedProduct.variants.length > 1 && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Variante</label>
                <select
                  value={formData.variantId}
                  onChange={(e) => setFormData(prev => ({ ...prev, variantId: e.target.value }))}
                  className="w-full h-12 px-4 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-slate-900"
                >
                  <option value="">Selecciona una variante</option>
                  {selectedProduct.variants
                    .filter(variant => {
                      const stockInBranch = variant.stock?.find(s => s.branchId === formData.fromBranchId);
                      return stockInBranch && stockInBranch.quantity > 0;
                    })
                    .map((variant) => {
                      const stockInBranch = variant.stock?.find(s => s.branchId === formData.fromBranchId);
                      const availableStock = stockInBranch?.quantity || 0;
                      return (
                        <option key={variant.id} value={variant.id}>
                          {variant.name} - Stock: {availableStock}
                        </option>
                      );
                    })}
                </select>
              </div>
            )}

            {/* Cantidad */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Cantidad
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
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToTransferList();
                    }
                  }}
                  placeholder="0"
                  className="flex-1 h-12 text-sm border-2 border-slate-200 rounded-xl focus:border-slate-900"
                />
                <Button
                  type="button"
                  onClick={addToTransferList}
                  disabled={!selectedProduct || !formData.variantId || !formData.quantity}
                  className="h-12 px-4 bg-slate-900 hover:bg-slate-800 text-white"
                >
                  <PlusSignIcon className="w-5 h-5 text-white" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Lista de productos */}
        {transferItems.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Productos a trasladar ({transferItems.length})
            </label>
            <div className="bg-white border-2 border-slate-200 rounded-xl divide-y divide-slate-100">
              {transferItems.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">{item.productTitle}</div>
                    <div className="text-xs text-slate-500">
                      {item.variantName} • Stock: {item.availableStock}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className="bg-slate-900 text-white">x{item.quantity}</Badge>
                    <button
                      type="button"
                      onClick={() => removeTransferItem(item.id)}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-red-600 active:scale-95 transition-all"
                    >
                      <Delete02Icon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Motivo */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Motivo del Traslado</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Describe el motivo..."
            rows={3}
            className="w-full px-4 py-3 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-slate-900 resize-none"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t border-slate-200 p-4 flex gap-3 shrink-0">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={isLoading}
          className="flex-1 h-12 text-sm font-bold border-2"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || transferItems.length === 0}
          className="flex-1 h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800"
        >
          {isLoading ? (
            'Guardando...'
          ) : (
            <>
              <CheckmarkCircle02Icon className="w-5 h-5 mr-2" />
              Crear Traslado
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
