'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { 
  ArrowLeft01Icon, 
  CheckmarkCircle02Icon, 
  PackageIcon,
  Building02Icon,
  Loading02Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PurchaseOrder } from './usePurchasesLogic';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface StockDistributionMobileProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchase: PurchaseOrder;
}

export function StockDistributionMobile({ isOpen, onClose, onSuccess, purchase }: StockDistributionMobileProps) {
  const { data: branches } = useSWR(isOpen ? '/api/branches' : null, fetcher);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stockDistribution, setStockDistribution] = useState<Record<string, Record<string, number>>>({});

  useEffect(() => {
    if (isOpen && branches && branches.length > 0) {
      // Inicializar distribución de stock
      const distribution: Record<string, Record<string, number>> = {};
      
      purchase.items.forEach(item => {
        distribution[item.id] = {};
        branches.forEach((branch: any) => {
          distribution[item.id][branch.id] = 0;
        });
        // Asignar toda la cantidad a la primera sucursal por defecto
        distribution[item.id][branches[0].id] = item.quantity;
      });
      
      setStockDistribution(distribution);
    }
  }, [isOpen, branches, purchase.items]);

  const updateStockDistribution = (itemId: string, branchId: string, quantity: number) => {
    setStockDistribution(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [branchId]: quantity
      }
    }));
  };

  const assignAllToBranch = (branchId: string) => {
    const distribution: Record<string, Record<string, number>> = {};
    
    purchase.items.forEach(item => {
      distribution[item.id] = {};
      branches?.forEach((branch: any) => {
        distribution[item.id][branch.id] = branch.id === branchId ? item.quantity : 0;
      });
    });
    
    setStockDistribution(distribution);
  };

  const validateDistribution = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    purchase.items.forEach(item => {
      const totalDistributed = Object.values(stockDistribution[item.id] || {}).reduce((sum, qty) => sum + qty, 0);
      
      if (totalDistributed !== item.quantity) {
        errors.push(`${item.variant.product.title}: distribuido ${totalDistributed} de ${item.quantity}`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  const handleSubmit = async () => {
    const validation = validateDistribution();
    
    if (!validation.valid) {
      toast.error('Error en la distribución:\n' + validation.errors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/purchases/${purchase.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockDistribution }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      toast.success('Orden recibida correctamente');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al recibir la orden');
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
          <h2 className="text-lg font-black text-slate-900">Distribuir Stock</h2>
          <p className="text-xs text-slate-500">
            Asigna las cantidades por sucursal
          </p>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || !validateDistribution().valid}
          className="h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl disabled:opacity-50 text-xs px-4"
        >
          {isSubmitting ? (
            <Loading02Icon className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <CheckmarkCircle02Icon className="w-4 h-4 mr-1" />
              Confirmar
            </>
          )}
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 pb-30">
        
        {/* Info de la orden */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <PackageIcon className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900">
                {purchase.supplier?.name || 'Sin proveedor'}
              </h3>
              <p className="text-xs text-slate-500">
                {purchase.items.length} producto(s) • S/ {Number(purchase.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Asignación rápida */}
        <div className="bg-blue-50 rounded-2xl border border-blue-200 p-4">
          <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
            <Building02Icon className="w-4 h-4" />
            Asignación Rápida
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {branches?.map((branch: any) => (
              <Button
                key={branch.id}
                variant="outline"
                onClick={() => assignAllToBranch(branch.id)}
                className="h-10 text-xs font-bold bg-white hover:bg-blue-50 border-blue-300 text-blue-700 justify-start"
              >
                Todo a {branch.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Distribución por producto */}
        <div className="space-y-3">
          {purchase.items.map((item) => {
            const totalDistributed = Object.values(stockDistribution[item.id] || {}).reduce((sum, qty) => sum + qty, 0);
            const isValid = totalDistributed === item.quantity;
            
            return (
              <div key={item.id} className={`bg-white rounded-2xl border-2 p-4 transition-all ${isValid ? 'border-slate-200' : 'border-red-300 bg-red-50/30'}`}>
                
                {/* Header del producto */}
                <div className="flex items-start justify-between mb-4 pb-3 border-b border-slate-100">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {item.variant.product.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.variant.name} {item.uom && `(${item.uom.abbreviation})`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <div className="text-xs text-slate-500">Total</div>
                    <div className="text-lg font-black text-slate-900">{item.quantity}</div>
                  </div>
                </div>

                {/* Inputs por sucursal */}
                <div className="space-y-3">
                  {branches?.map((branch: any) => (
                    <div key={branch.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <Label className="text-xs font-bold text-slate-700 mb-1 block">
                          {branch.name}
                        </Label>
                        <Input
                          type="number"
                          min="0"
                          max={item.quantity}
                          value={stockDistribution[item.id]?.[branch.id] || 0}
                          onChange={(e) => updateStockDistribution(item.id, branch.id, parseInt(e.target.value) || 0)}
                          className="h-10 text-sm font-bold text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Validación */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Distribuido: <span className={`font-bold ${isValid ? 'text-green-600' : 'text-red-600'}`}>{totalDistributed}</span> de {item.quantity}
                  </div>
                  {isValid ? (
                    <Badge className="text-[9px] font-black px-2 py-0.5 h-5 bg-green-100 text-green-700 border-green-300">
                      <CheckmarkCircle02Icon className="w-2.5 h-2.5 mr-1" />
                      Completo
                    </Badge>
                  ) : (
                    <Badge className="text-[9px] font-black px-2 py-0.5 h-5 bg-red-100 text-red-700 border-red-300">
                      Incompleto
                    </Badge>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}