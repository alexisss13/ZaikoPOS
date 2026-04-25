'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserAdd01Icon, Loading02Icon, Mail01Icon, SmartPhone01Icon, Note01Icon, User02Icon } from 'hugeicons-react';
import { toast } from 'sonner';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (customer: any) => void;
}

export function CustomerModal({ isOpen, onClose, onSuccess }: CustomerModalProps) {
  const [name, setName] = useState('');
  const [docType, setDocType] = useState('DNI');
  const [docNumber, setDocNumber] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Ingresa el nombre del cliente');
      return;
    }

    if (!docNumber.trim()) {
      toast.error('Ingresa el número de documento');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          docType,
          docNumber: docNumber.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al registrar cliente');
      }

      const customer = await res.json();
      toast.success('Cliente registrado correctamente');
      
      // Limpiar formulario
      setName('');
      setDocType('DNI');
      setDocNumber('');
      setEmail('');
      setPhone('');
      
      onSuccess(customer);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar cliente');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setDocType('DNI');
      setDocNumber('');
      setEmail('');
      setPhone('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <UserAdd01Icon size={20} strokeWidth={2} />
            Registrar Cliente
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Registra un nuevo cliente para acumular puntos y beneficios
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <Label htmlFor="name" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <User02Icon size={12} strokeWidth={2} />
              Nombre completo
            </Label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="text-sm"
              required
            />
          </div>

          {/* Documento */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="docType" className="text-xs font-semibold text-slate-700 mb-1.5 block">
                Tipo
              </Label>
              <Select value={docType} onValueChange={setDocType}>
                <SelectTrigger className="text-sm h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DNI">DNI</SelectItem>
                  <SelectItem value="RUC">RUC</SelectItem>
                  <SelectItem value="CE">CE</SelectItem>
                  <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label htmlFor="docNumber" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                <Note01Icon size={12} strokeWidth={2} />
                Número
              </Label>
              <Input
                id="docNumber"
                type="text"
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder={docType === 'DNI' ? '12345678' : docType === 'RUC' ? '12345678901' : 'Número'}
                className="text-sm"
                maxLength={docType === 'DNI' ? 8 : docType === 'RUC' ? 11 : 20}
                required
              />
            </div>
          </div>

          {/* Email (opcional) */}
          <div>
            <Label htmlFor="email" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <Mail01Icon size={12} strokeWidth={2} />
              Email <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="cliente@ejemplo.com"
              className="text-sm"
            />
            <p className="text-[10px] text-slate-500 mt-1">
              Si proporciona email, podrá crear una cuenta en el e-commerce
            </p>
          </div>

          {/* Teléfono (opcional) */}
          <div>
            <Label htmlFor="phone" className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
              <SmartPhone01Icon size={12} strokeWidth={2} />
              Teléfono <span className="text-slate-400 font-normal">(opcional)</span>
            </Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="999 999 999"
              className="text-sm"
            />
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              {isSubmitting && <Loading02Icon size={16} className="mr-2 animate-spin" />}
              Registrar Cliente
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
