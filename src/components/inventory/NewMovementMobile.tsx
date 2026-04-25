'use client';

import { useState, useRef } from 'react';
import { 
  ArrowLeft01Icon,
  CircleArrowUp02Icon,
  CircleArrowDown02Icon,
  Settings01Icon,
  Search01Icon,
  PackageIcon,
  PlusSignIcon,
  Delete02Icon,
  ScanIcon,
  CheckmarkCircle02Icon,
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
  }>;
}

interface Branch {
  id: string;
  name: string;
}

interface BulkItem {
  id: string;
  variantId: string;
  productTitle: string;
  variantName: string;
  quantity: number;
}

interface NewMovementMobileProps {
  onClose: () => void;
  onSuccess: () => void;
  branches: Branch[];
  products: Product[];
}

export function NewMovementMobile({ onClose, onSuccess, branches, products }: NewMovementMobileProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkReason, setBulkReason] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Pull-to-refresh
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    variantId: '',
    type: 'INPUT' as 'INPUT' | 'OUTPUT' | 'ADJUSTMENT',
    quantity: '',
    reason: '',
    targetBranchId: branches?.[0]?.id || '',
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

  const filteredProducts = (products && Array.isArray(products)) ? products.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.variants.some(v => 
      v.barcode?.includes(searchTerm) || 
      v.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) : [];

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchTerm('');
    if (product.variants.length === 1) {
      setFormData(prev => ({ ...prev, variantId: product.variants[0].id }));
    }
  };

  const addToBulkList = () => {
    if (!selectedProduct || !formData.variantId || !formData.quantity) {
      toast.error('Selecciona un producto y cantidad');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('La cantidad debe ser mayor a 0');
      return;
    }

    const variant = selectedProduct.variants.find(v => v.id === formData.variantId);
    if (!variant) return;

    const existingIndex = bulkItems.findIndex(item => item.variantId === formData.variantId);
    
    if (existingIndex >= 0) {
      const newItems = [...bulkItems];
      newItems[existingIndex].quantity += quantity;
      setBulkItems(newItems);
      toast.success('Cantidad actualizada');
    } else {
      setBulkItems([...bulkItems, {
        id: Date.now().toString(),
        variantId: formData.variantId,
        productTitle: selectedProduct.title,
        variantName: variant.name,
        quantity
      }]);
      toast.success('Producto agregado');
    }

    setSelectedProduct(null);
    setFormData(prev => ({ ...prev, variantId: '', quantity: '' }));
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const removeBulkItem = (id: string) => {
    setBulkItems(bulkItems.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (mode === 'single') {
      if (!formData.variantId || !formData.quantity || !formData.reason || !formData.targetBranchId) {
        toast.error('Completa todos los campos');
        return;
      }

      const quantity = parseInt(formData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        toast.error('La cantidad debe ser mayor a 0');
        return;
      }

      setIsLoading(true);

      try {
        const res = await fetch('/api/inventory/movements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, quantity }),
        });
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        
        toast.success('Movimiento registrado');
        onSuccess();
        onClose();
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Error inesperado');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (bulkItems.length === 0) {
        toast.error('Agrega al menos un producto');
        return;
      }

      if (!bulkReason.trim()) {
        toast.error('Ingresa el motivo');
        return;
      }

      setIsLoading(true);

      try {
        const promises = bulkItems.map(item => 
          fetch('/api/inventory/movements', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              variantId: item.variantId,
              type: formData.type,
              quantity: item.quantity,
              reason: bulkReason,
              targetBranchId: formData.targetBranchId,
            }),
          })
        );

        const results = await Promise.all(promises);
        const failed = results.filter(r => !r.ok);

        if (failed.length > 0) {
          throw new Error(`${failed.length} movimiento(s) fallaron`);
        }

        toast.success(`${bulkItems.length} movimiento(s) registrados`);
        onSuccess();
        onClose();
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'Error inesperado');
      } finally {
        setIsLoading(false);
      }
    }
  };

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
          <h1 className="text-lg font-black text-slate-900">Nuevo Movimiento</h1>
          <p className="text-xs text-slate-500">
            {mode === 'single' ? 'Registra un movimiento' : 'Pistoleo masivo'}
          </p>
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
        {/* Modo */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setMode('single')}
            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'single'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <PlusSignIcon className="w-4 h-4" />
            Individual
          </button>
          <button
            onClick={() => setMode('bulk')}
            className={`p-3 rounded-xl border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'bulk'
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-600'
            }`}
          >
            <ScanIcon className="w-4 h-4" />
            Masivo
          </button>
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Tipo de Movimiento</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'INPUT' }))}
              className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                formData.type === 'INPUT'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <CircleArrowUp02Icon className="w-5 h-5 mx-auto mb-1" />
              Entrada
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'OUTPUT' }))}
              className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                formData.type === 'OUTPUT'
                  ? 'border-red-500 bg-red-50 text-red-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <CircleArrowDown02Icon className="w-5 h-5 mx-auto mb-1" />
              Salida
            </button>
            <button
              type="button"
              onClick={() => setFormData(prev => ({ ...prev, type: 'ADJUSTMENT' }))}
              className={`p-3 rounded-xl border-2 text-xs font-bold transition-all ${
                formData.type === 'ADJUSTMENT'
                  ? 'border-amber-500 bg-amber-50 text-amber-700'
                  : 'border-slate-200 bg-white text-slate-600'
              }`}
            >
              <Settings01Icon className="w-5 h-5 mx-auto mb-1" />
              Ajuste
            </button>
          </div>
        </div>

        {/* Sucursal */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700">Sucursal</label>
          <select
            value={formData.targetBranchId}
            onChange={(e) => setFormData(prev => ({ ...prev, targetBranchId: e.target.value }))}
            className="w-full h-12 px-4 text-sm font-medium bg-white border-2 border-slate-200 rounded-xl outline-none focus:border-slate-900"
          >
            {branches?.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
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
                  No se encontraron productos
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
                  {selectedProduct.variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.name} {variant.sku ? `(${variant.sku})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Cantidad */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">
                Cantidad {formData.type === 'ADJUSTMENT' && '(Stock Final)'}
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && mode === 'bulk') {
                      e.preventDefault();
                      addToBulkList();
                    }
                  }}
                  placeholder="0"
                  className="flex-1 h-12 text-sm border-2 border-slate-200 rounded-xl focus:border-slate-900"
                />
                {mode === 'bulk' && (
                  <Button
                    type="button"
                    onClick={addToBulkList}
                    disabled={!selectedProduct || !formData.variantId || !formData.quantity}
                    className="h-12 px-4 bg-slate-900 hover:bg-slate-800 text-white"
                  >
                    <PlusSignIcon className="w-5 h-5 text-white" />
                  </Button>
                )}
              </div>
            </div>
          </>
        )}

        {/* Lista masiva */}
        {mode === 'bulk' && bulkItems.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700">
              Productos agregados ({bulkItems.length})
            </label>
            <div className="bg-white border-2 border-slate-200 rounded-xl divide-y divide-slate-100">
              {bulkItems.map((item) => (
                <div key={item.id} className="p-3 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-slate-900 truncate">{item.productTitle}</div>
                    <div className="text-xs text-slate-500">{item.variantName}</div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge className="bg-slate-900 text-white">x{item.quantity}</Badge>
                    <button
                      type="button"
                      onClick={() => removeBulkItem(item.id)}
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
          <label className="text-xs font-bold text-slate-700">Motivo</label>
          <textarea
            value={mode === 'single' ? formData.reason : bulkReason}
            onChange={(e) => mode === 'single' 
              ? setFormData(prev => ({ ...prev, reason: e.target.value }))
              : setBulkReason(e.target.value)
            }
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
          disabled={isLoading || (mode === 'bulk' ? bulkItems.length === 0 : !selectedProduct || !formData.variantId || !formData.quantity || !formData.reason)}
          className="flex-1 h-12 text-sm font-bold bg-slate-900 hover:bg-slate-800 text-white"
        >
          {isLoading ? (
            'Guardando...'
          ) : (
            <>
              <CheckmarkCircle02Icon className="w-5 h-5 mr-2" />
              {mode === 'bulk' ? `Registrar ${bulkItems.length}` : 'Registrar'}
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
