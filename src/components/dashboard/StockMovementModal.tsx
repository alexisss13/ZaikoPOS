'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Warehouse, Search, Plus, Trash2, Scan } from 'lucide-react';
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
  }>;
}

interface Branch {
  id: string;
  name: string;
}

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  branches: Branch[];
}

interface BulkItem {
  id: string;
  variantId: string;
  productTitle: string;
  variantName: string;
  quantity: number;
}

export function StockMovementModal({ isOpen, onClose, onSuccess, branches }: StockMovementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [bulkItems, setBulkItems] = useState<BulkItem[]>([]);
  const [bulkReason, setBulkReason] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  const { data: products } = useSWR<Product[]>(isOpen ? '/api/products' : null, fetcher);

  const [formData, setFormData] = useState({
    variantId: '',
    type: 'INPUT' as 'INPUT' | 'OUTPUT' | 'ADJUSTMENT',
    quantity: '',
    reason: '',
    targetBranchId: '',
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        variantId: '',
        type: 'INPUT',
        quantity: '',
        reason: '',
        targetBranchId: branches?.[0]?.id || '',
      });
      setSelectedProduct(null);
      setSearchTerm('');
      setBulkItems([]);
      setBulkReason('');
      setMode('single');
    }
  }, [isOpen, branches]);

  const filteredProducts = products?.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.variants.some(v => 
      v.barcode?.includes(searchTerm) || 
      v.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  ) || [];

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    if (product.variants.length === 1) {
      setFormData(prev => ({ ...prev, variantId: product.variants[0].id }));
    }
  };

  // Función para agregar producto al listado masivo
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

    // Verificar si ya existe
    const existingIndex = bulkItems.findIndex(item => item.variantId === formData.variantId);
    
    if (existingIndex >= 0) {
      // Actualizar cantidad
      const newItems = [...bulkItems];
      newItems[existingIndex].quantity += quantity;
      setBulkItems(newItems);
      toast.success('Cantidad actualizada');
    } else {
      // Agregar nuevo
      setBulkItems([...bulkItems, {
        id: Date.now().toString(),
        variantId: formData.variantId,
        productTitle: selectedProduct.title,
        variantName: variant.name,
        quantity
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

  const removeBulkItem = (id: string) => {
    setBulkItems(bulkItems.filter(item => item.id !== id));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.variantId || !formData.quantity || !formData.reason || !formData.targetBranchId) {
      toast.error('Completa todos los campos requeridos');
      return;
    }

    const quantity = parseInt(formData.quantity);
    if (isNaN(quantity) || quantity <= 0) {
      toast.error('La cantidad debe ser un número mayor a 0');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          quantity
        }),
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success('Movimiento registrado correctamente');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBulkSubmit = async () => {
    if (bulkItems.length === 0) {
      toast.error('Agrega al menos un producto');
      return;
    }

    if (!bulkReason.trim()) {
      toast.error('Ingresa el motivo del movimiento');
      return;
    }

    setIsLoading(true);

    try {
      // Enviar todos los movimientos
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

      toast.success(`${bulkItems.length} movimiento(s) registrados correctamente`);
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
            <Warehouse className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left flex-1">
            <DialogTitle className="text-xl font-black text-slate-900 leading-tight">
              Nuevo Movimiento de Inventario
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              {mode === 'single' ? 'Registra un movimiento individual' : 'Registra múltiples movimientos (pistoleo)'}
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Selector de Modo */}
        <div className="px-6 pt-4 pb-2 bg-white border-b border-slate-100">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`p-3 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'single'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Plus className="w-4 h-4" />
              Individual
            </button>
            <button
              type="button"
              onClick={() => setMode('bulk')}
              className={`p-3 rounded-lg border-2 text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                mode === 'bulk'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <Scan className="w-4 h-4" />
              Masivo (Pistoleo)
            </button>
          </div>
        </div>

        <form onSubmit={mode === 'single' ? handleSubmit : (e) => e.preventDefault()} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          
          {/* Tipo de Movimiento */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Tipo de Movimiento <span className="text-red-500">*</span></Label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'INPUT' }))}
                className={`p-3 rounded-lg border-2 text-xs font-bold transition-all ${
                  formData.type === 'INPUT'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Entrada
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'OUTPUT' }))}
                className={`p-3 rounded-lg border-2 text-xs font-bold transition-all ${
                  formData.type === 'OUTPUT'
                    ? 'border-red-500 bg-red-50 text-red-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Salida
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, type: 'ADJUSTMENT' }))}
                className={`p-3 rounded-lg border-2 text-xs font-bold transition-all ${
                  formData.type === 'ADJUSTMENT'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                Ajuste
              </button>
            </div>
          </div>

          {/* Sucursal */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Sucursal <span className="text-red-500">*</span></Label>
            <select
              value={formData.targetBranchId}
              onChange={(e) => setFormData(prev => ({ ...prev, targetBranchId: e.target.value }))}
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

          {/* Buscar Producto */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">Buscar Producto <span className="text-red-500">*</span></Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
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
                {selectedProduct.variants.map((variant) => (
                  <option key={variant.id} value={variant.id}>
                    {variant.name} {variant.sku ? `(${variant.sku})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Producto Seleccionado */}
          {selectedProduct && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs font-bold text-blue-900 mb-1">Producto seleccionado:</div>
              <div className="text-sm font-bold text-blue-700">{selectedProduct.title}</div>
              {formData.variantId && (
                <div className="text-xs text-blue-600 mt-1">
                  {selectedProduct.variants.find(v => v.id === formData.variantId)?.name}
                </div>
              )}
            </div>
          )}

          {/* Cantidad */}
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-700">
              Cantidad {formData.type === 'ADJUSTMENT' ? '(Stock Final)' : ''} <span className="text-red-500">*</span>
            </Label>
            <div className="flex gap-2">
              <input
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
                placeholder={formData.type === 'ADJUSTMENT' ? 'Ingresa el stock correcto' : 'Ingresa la cantidad'}
                className="flex-1 h-11 px-3 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                required
              />
              {mode === 'bulk' && (
                <Button
                  type="button"
                  onClick={addToBulkList}
                  disabled={!selectedProduct || !formData.variantId || !formData.quantity}
                  className="h-11 px-4 bg-slate-900 hover:bg-slate-800"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar
                </Button>
              )}
            </div>
            {formData.type === 'ADJUSTMENT' && (
              <p className="text-xs text-slate-500">
                Para ajustes, ingresa el stock final correcto (no la diferencia)
              </p>
            )}
          </div>

          {/* Lista de productos en modo masivo */}
          {mode === 'bulk' && bulkItems.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Productos agregados ({bulkItems.length})</Label>
              <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-60 overflow-y-auto">
                {bulkItems.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex-1">
                      <div className="font-bold text-sm text-slate-900">{item.productTitle}</div>
                      <div className="text-xs text-slate-500">{item.variantName}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-900">x{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => removeBulkItem(item.id)}
                        className="p-1 hover:bg-red-100 rounded text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivo */}
          {mode === 'single' ? (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Motivo <span className="text-red-500">*</span></Label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Describe el motivo del movimiento..."
                rows={3}
                className="w-full px-3 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300 resize-none"
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-700">Motivo General <span className="text-red-500">*</span></Label>
              <textarea
                value={bulkReason}
                onChange={(e) => setBulkReason(e.target.value)}
                placeholder="Describe el motivo de estos movimientos..."
                rows={3}
                className="w-full px-3 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300 resize-none"
                required
              />
            </div>
          )}

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
          {mode === 'single' ? (
            <Button 
              onClick={handleSubmit}
              disabled={isLoading || !formData.variantId}
              className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Movimiento
            </Button>
          ) : (
            <Button 
              onClick={handleBulkSubmit}
              disabled={isLoading || bulkItems.length === 0}
              className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800"
            >
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar {bulkItems.length} Movimiento(s)
            </Button>
          )}
        </div>

      </DialogContent>
    </Dialog>
  );
}
