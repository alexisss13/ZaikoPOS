'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Warehouse, Search } from 'lucide-react';
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

export function StockMovementModal({ isOpen, onClose, onSuccess, branches }: StockMovementModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-white border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        <DialogHeader className="px-6 py-4 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <Warehouse className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left flex-1">
            <DialogTitle className="text-xl font-black text-slate-900 leading-tight">
              Nuevo Movimiento de Inventario
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              Registra entradas, salidas o ajustes de stock
            </DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
          
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
            <input
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              placeholder={formData.type === 'ADJUSTMENT' ? 'Ingresa el stock correcto' : 'Ingresa la cantidad'}
              className="w-full h-11 px-3 text-sm font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
              required
            />
            {formData.type === 'ADJUSTMENT' && (
              <p className="text-xs text-slate-500">
                Para ajustes, ingresa el stock final correcto (no la diferencia)
              </p>
            )}
          </div>

          {/* Motivo */}
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
            disabled={isLoading || !formData.variantId}
            className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800"
          >
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Registrar Movimiento
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
