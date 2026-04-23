'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tag01Icon, PercentIcon, DollarCircleIcon, Cancel01Icon } from 'hugeicons-react';

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentType: 'FIXED' | 'PERCENT';
  currentValue: string;
  onApply: (type: 'FIXED' | 'PERCENT', value: string) => void;
  subtotal: number;
}

export function DiscountModal({ 
  isOpen, 
  onClose, 
  currentType, 
  currentValue, 
  onApply,
  subtotal 
}: DiscountModalProps) {
  const [type, setType] = useState<'FIXED' | 'PERCENT'>(currentType);
  const [value, setValue] = useState(currentValue);

  useEffect(() => {
    if (isOpen) {
      setType(currentType);
      setValue(currentValue);
    }
  }, [isOpen, currentType, currentValue]);

  const handleApply = () => {
    onApply(type, value);
    onClose();
  };

  const handleClear = () => {
    setValue('');
    onApply(type, '');
    onClose();
  };

  const numericValue = parseFloat(value) || 0;
  const discountAmount = type === 'FIXED' 
    ? numericValue 
    : subtotal * (numericValue / 100);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Tag01Icon className="w-5 h-5" />
            Aplicar Descuento
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Aplica un descuento fijo o porcentual a la venta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tipo de descuento */}
          <div>
            <Label className="text-xs font-semibold text-slate-700 mb-2 block">
              Tipo de descuento
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setType('FIXED')}
                className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-semibold text-sm ${
                  type === 'FIXED'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <DollarCircleIcon className="w-4 h-4" />
                Monto Fijo
              </button>
              <button
                onClick={() => setType('PERCENT')}
                className={`h-12 rounded-lg border-2 transition-all flex items-center justify-center gap-2 font-semibold text-sm ${
                  type === 'PERCENT'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                <PercentIcon className="w-4 h-4" />
                Porcentaje
              </button>
            </div>
          </div>

          {/* Valor del descuento */}
          <div>
            <Label htmlFor="discount-value" className="text-xs font-semibold text-slate-700 mb-2 block">
              {type === 'FIXED' ? 'Monto en soles' : 'Porcentaje'}
            </Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="text-slate-400 font-bold text-lg">
                  {type === 'FIXED' ? 'S/' : '%'}
                </span>
              </div>
              <Input
                id="discount-value"
                type="number"
                step={type === 'FIXED' ? '0.10' : '1'}
                min="0"
                max={type === 'PERCENT' ? '100' : undefined}
                placeholder="0.00"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="pl-12 h-14 text-2xl font-black text-slate-900 border-slate-200 focus-visible:ring-slate-400 rounded-xl bg-slate-50 tabular-nums"
                autoFocus
              />
            </div>
          </div>

          {/* Vista previa */}
          {numericValue > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">Subtotal:</span>
                <span className="font-semibold text-slate-900 tabular-nums">S/ {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-blue-600">Descuento:</span>
                <span className="font-semibold text-blue-600 tabular-nums">- S/ {discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm pt-1.5 border-t border-blue-200">
                <span className="font-bold text-slate-900">Total final:</span>
                <span className="font-black text-slate-900 tabular-nums">S/ {finalTotal.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Botones de acción rápida */}
          {type === 'PERCENT' && (
            <div className="grid grid-cols-4 gap-2">
              {[5, 10, 15, 20].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setValue(percent.toString())}
                  className="h-9 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors"
                >
                  {percent}%
                </button>
              ))}
            </div>
          )}

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            {numericValue > 0 && (
              <Button
                variant="outline"
                onClick={handleClear}
                className="flex-1 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <Cancel01Icon className="w-4 h-4 mr-2" />
                Quitar
              </Button>
            )}
            <Button
              variant="outline"
              onClick={onClose}
              className={numericValue > 0 ? '' : 'flex-1'}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApply}
              disabled={!value || numericValue <= 0}
              className={`bg-slate-900 hover:bg-slate-800 ${numericValue > 0 ? '' : 'flex-1'}`}
            >
              Aplicar Descuento
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
