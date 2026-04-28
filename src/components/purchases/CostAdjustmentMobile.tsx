'use client';

import { useState } from 'react';
import { 
  ArrowLeft01Icon, 
  CheckmarkCircle02Icon, 
  PackageIcon,
  Loading02Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PurchaseOrder } from './usePurchasesLogic';

interface CostAdjustmentMobileProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedPurchase: PurchaseOrder) => void;
  purchase: PurchaseOrder;
}

export function CostAdjustmentMobile({ isOpen, onClose, onSuccess, purchase }: CostAdjustmentMobileProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjustedCosts, setAdjustedCosts] = useState<Record<string, number>>(() => {
    const costs: Record<string, number> = {};
    purchase.items.forEach(item => {
      costs[item.id] = Number(item.cost);
    });
    return costs;
  });

  const updateCost = (itemId: string, cost: number) => {
    setAdjustedCosts(prev => ({
      ...prev,
      [itemId]: Math.max(0, cost)
    }));
  };

  const hasChanges = () => {
    return purchase.items.some(item => 
      adjustedCosts[item.id] !== Number(item.cost)
    );
  };

  const getNewTotal = () => {
    return purchase.items.reduce((sum, item) => {
      return sum + (item.quantity * adjustedCosts[item.id]);
    }, 0);
  };

  const handleSubmit = async () => {
    if (!hasChanges()) {
      toast.error('No hay cambios en los costos');
      return;
    }

    // Validar que todos los costos sean mayores a 0
    const invalidItems = purchase.items.filter(item => adjustedCosts[item.id] <= 0);
    if (invalidItems.length > 0) {
      toast.error('Todos los costos deben ser mayores a 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/purchases/${purchase.id}/adjust-costs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustedCosts }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      const updatedPurchase = await res.json();
      
      toast.success('Costos ajustados correctamente');
      onSuccess(updatedPurchase);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al ajustar costos');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-[60] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">Ajustar Costos</h2>
          <p className="text-xs text-slate-500">
            Modifica los precios de los productos
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !hasChanges()}
          className="h-9 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
        >
          {isSubmitting ? (
            <Loading02Icon className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckmarkCircle02Icon className="w-4 h-4 mr-1" />
              Guardar
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        
        {/* Info de la orden */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <PackageIcon className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">
                {purchase.supplier?.name || 'Sin proveedor'}
              </h3>
              <p className="text-xs text-slate-500">
                {purchase.items.length} producto(s)
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Total Original</p>
              <p className="text-lg font-bold text-slate-900">S/ {Number(purchase.totalAmount).toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Nuevo Total</p>
              <p className={`text-lg font-bold ${hasChanges() ? 'text-blue-600' : 'text-slate-900'}`}>
                S/ {getNewTotal().toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Productos */}
        <div className="space-y-3">
          {purchase.items.map((item) => {
            const originalCost = Number(item.cost);
            const newCost = adjustedCosts[item.id];
            const hasChanged = newCost !== originalCost;
            const isInvalid = newCost <= 0;
            
            return (
              <div key={item.id} className={`bg-white rounded-2xl border-2 p-4 transition-all ${
                hasChanged ? 'border-blue-300 bg-blue-50/30' : 'border-slate-200'
              } ${isInvalid ? 'border-red-300 bg-red-50/30' : ''}`}>
                
                {/* Header del producto */}
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {item.variant.product.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.variant.name} {item.uom && `(${item.uom.abbreviation})`}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Cantidad: {item.quantity}
                    </p>
                  </div>
                  {hasChanged && (
                    <Badge className="text-[9px] font-black px-2 py-0.5 h-5 bg-blue-100 text-blue-700 border-blue-300">
                      Modificado
                    </Badge>
                  )}
                </div>

                {/* Costos */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-1 block">
                        Costo Original
                      </Label>
                      <div className="h-10 px-3 bg-slate-100 rounded-lg flex items-center">
                        <span className="text-sm font-bold text-slate-600">
                          S/ {originalCost.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs font-bold text-slate-700 mb-1 block">
                        Nuevo Costo
                      </Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newCost || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === '') {
                            updateCost(item.id, 0);
                          } else {
                            updateCost(item.id, parseFloat(value) || 0);
                          }
                        }}
                        onFocus={(e) => {
                          if (e.target.value === '0') {
                            e.target.select();
                          }
                        }}
                        className={`h-10 text-sm font-bold text-center ${
                          isInvalid ? 'border-red-300 bg-red-50' : 
                          hasChanged ? 'border-blue-300 bg-blue-50' : ''
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  {/* Subtotales */}
                  <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500">Subtotal Original</p>
                      <p className="text-sm font-bold text-slate-700">
                        S/ {(item.quantity * originalCost).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Nuevo Subtotal</p>
                      <p className={`text-sm font-bold ${
                        hasChanged ? 'text-blue-600' : 'text-slate-700'
                      }`}>
                        S/ {(item.quantity * newCost).toFixed(2)}
                      </p>
                    </div>
                  </div>

                  {isInvalid && (
                    <p className="text-xs text-red-600 mt-2">
                      El costo debe ser mayor a 0
                    </p>
                  )}
                </div>

              </div>
            );
          })}
        </div>

        {/* Resumen de cambios */}
        {hasChanges() && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
            <h4 className="text-sm font-bold text-blue-800 mb-2">Resumen de Cambios</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-xs text-blue-700">Diferencia en total:</span>
                <span className={`text-xs font-bold ${
                  getNewTotal() > Number(purchase.totalAmount) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {getNewTotal() > Number(purchase.totalAmount) ? '+' : ''}
                  S/ {(getNewTotal() - Number(purchase.totalAmount)).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-blue-600">
                Los cambios se registrarán con un indicador de "costo modificado"
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}