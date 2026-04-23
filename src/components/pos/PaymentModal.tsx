'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PaymentMethod } from '@/types/payment-method';
import { Money01Icon, CreditCardIcon, SmartPhone01Icon, Wallet03Icon } from 'hugeicons-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
  onConfirm: (payments: { method: PaymentMethod; amount: number }[], tenderedAmount: number) => void;
}

export function PaymentModal({ isOpen, onClose, total, onConfirm }: PaymentModalProps) {
  const [method, setMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [receivedStr, setReceivedStr] = useState<string>('');
  
  // PATRÓN REACT MODERNO: Rastrear el prop anterior para resetear el estado
  // sin usar useEffect (evita doble renderizado y warnings del linter)
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setMethod(PaymentMethod.CASH);
      setReceivedStr(total.toString());
    }
  }

  // Si cambia a método digital, el monto recibido es obligatoriamente el exacto
  const handleMethodChange = (newMethod: PaymentMethod) => {
    setMethod(newMethod);
    if (newMethod !== PaymentMethod.CASH) {
      setReceivedStr(total.toString());
    }
  };

  const receivedNum = parseFloat(receivedStr) || 0;
  const change = Math.max(0, receivedNum - total);
  const isSufficient = receivedNum >= total - 0.01; // Margen flotante

  const handleConfirm = () => {
    if (!isSufficient) return;

    // MVP: Enviamos 1 solo método de pago por el total exacto.
    // El backend requiere que los pagos sumen EXACTAMENTE el total.
    const payments = [{
      method: method,
      amount: total 
    }];

    onConfirm(payments, receivedNum);
  };

  const quickBills = [10, 20, 50, 100];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="p-6 pb-4 bg-white border-b">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Wallet03Icon className="w-6 h-6 text-primary" /> Procesar Pago
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* COLUMNA IZQUIERDA: MÉTODOS Y BILLETES */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Método de Pago</label>
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  type="button"
                  variant={method === PaymentMethod.CASH ? "default" : "outline"}
                  className="h-12"
                  onClick={() => handleMethodChange(PaymentMethod.CASH)}
                >
                  <Money01Icon className="w-4 h-4 mr-2" /> Efectivo
                </Button>
                <Button 
                  type="button"
                  variant={method === PaymentMethod.YAPE ? "default" : "outline"}
                  className="h-12 bg-[#74085A] hover:bg-[#5a0646] text-white border-none"
                  onClick={() => handleMethodChange(PaymentMethod.YAPE)}
                >
                  <SmartPhone01Icon className="w-4 h-4 mr-2" /> Yape
                </Button>
                <Button 
                  type="button"
                  variant={method === PaymentMethod.PLIN ? "default" : "outline"}
                  className="h-12 bg-[#00E0FF] hover:bg-[#00c5e0] text-slate-900 border-none"
                  onClick={() => handleMethodChange(PaymentMethod.PLIN)}
                >
                  <SmartPhone01Icon className="w-4 h-4 mr-2" /> Plin
                </Button>
                <Button 
                  type="button"
                  variant={method === PaymentMethod.CARD ? "default" : "outline"}
                  className="h-12"
                  onClick={() => handleMethodChange(PaymentMethod.CARD)}
                >
                  <CreditCardIcon className="w-4 h-4 mr-2" /> Tarjeta
                </Button>
              </div>
            </div>

            {method === PaymentMethod.CASH && (
              <div className="space-y-2 animate-in fade-in slide-in-from-left-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Billetes Rápidos</label>
                <div className="grid grid-cols-4 gap-2">
                  {quickBills.map(bill => (
                    <Button 
                      key={bill} 
                      type="button" 
                      variant="outline" 
                      className="font-bold text-lg"
                      disabled={bill < total}
                      onClick={() => setReceivedStr(bill.toString())}
                    >
                      {bill}
                    </Button>
                  ))}
                  <Button 
                    type="button" 
                    variant="secondary" 
                    className="col-span-4 font-bold"
                    onClick={() => setReceivedStr(total.toString())}
                  >
                    Exacto (S/ {total.toFixed(2)})
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: RESUMEN Y CALCULADORA */}
          <div className="space-y-4 bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-center">
            
            <div className="flex justify-between items-center text-slate-500">
              <span>Total a Cobrar</span>
              <span className="text-2xl font-bold text-slate-900">S/ {total.toFixed(2)}</span>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium text-slate-700">Monto Recibido (S/)</label>
              <Input 
                type="number" 
                value={receivedStr}
                onChange={(e) => setReceivedStr(e.target.value)}
                className="text-right text-2xl font-bold h-14"
                disabled={method !== PaymentMethod.CASH}
                autoFocus
              />
            </div>

            <div className="pt-4 border-t mt-4 flex justify-between items-center">
              <span className="font-bold text-slate-500">Vuelto</span>
              <span className={`text-4xl font-extrabold tracking-tight ${change > 0 ? 'text-green-600' : 'text-slate-300'}`}>
                S/ {change.toFixed(2)}
              </span>
            </div>

          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 bg-white border-t flex justify-end gap-3">
          <Button variant="outline" size="lg" onClick={onClose}>Cancelar</Button>
          <Button 
            size="lg" 
            className="w-40 font-bold text-lg" 
            disabled={!isSufficient}
            onClick={handleConfirm}
          >
            CONFIRMAR
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}