'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Account } from './useAccountingLogic';
import { Loading03Icon } from 'hugeicons-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account?: Account | null;
  accounts: Account[];
}

export default function AccountModal({ isOpen, onClose, onSuccess, account, accounts }: AccountModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    type: 'ASSET' as 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE',
    parentId: '',
  });

  useEffect(() => {
    if (account) {
      setFormData({
        code: account.code,
        name: account.name,
        type: account.type,
        parentId: account.parentId || '',
      });
    } else {
      setFormData({
        code: '',
        name: '',
        type: 'ASSET',
        parentId: '',
      });
    }
  }, [account, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || !formData.name) {
      toast.error('Código y nombre son requeridos');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = account 
        ? `/api/accounting/accounts/${account.id}`
        : '/api/accounting/accounts';
      
      const method = account ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          parentId: formData.parentId && formData.parentId !== 'none' ? formData.parentId : null,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar cuenta');
      }

      toast.success(account ? 'Cuenta actualizada' : 'Cuenta creada');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter parent accounts by type (same type only)
  const parentAccounts = accounts.filter(
    acc => acc.type === formData.type && acc.id !== account?.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {account ? 'Editar Cuenta' : 'Nueva Cuenta'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Code */}
          <div className="space-y-2">
            <Label htmlFor="code" className="text-sm font-semibold text-slate-700">
              Código <span className="text-red-500">*</span>
            </Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="Ej: 1010, 4010"
              disabled={!!account}
              className="h-10"
            />
            <p className="text-xs text-slate-500">
              Código único de la cuenta (no se puede cambiar después)
            </p>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-semibold text-slate-700">
              Nombre <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Caja General, Ventas"
              className="h-10"
            />
          </div>

          {/* Type */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-semibold text-slate-700">
              Tipo <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value: any) => setFormData({ ...formData, type: value, parentId: '' })}
              disabled={!!account}
            >
              <SelectTrigger className="h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="ASSET">Activo</SelectItem>
                <SelectItem value="LIABILITY">Pasivo</SelectItem>
                <SelectItem value="EQUITY">Patrimonio</SelectItem>
                <SelectItem value="REVENUE">Ingreso</SelectItem>
                <SelectItem value="EXPENSE">Gasto</SelectItem>
              </SelectContent>
            </Select>
            {account && (
              <p className="text-xs text-slate-500">
                El tipo no se puede cambiar después de crear la cuenta
              </p>
            )}
          </div>

          {/* Parent Account */}
          <div className="space-y-2">
            <Label htmlFor="parent" className="text-sm font-semibold text-slate-700">
              Cuenta Padre (Opcional)
            </Label>
            <Select
              value={formData.parentId || 'none'}
              onValueChange={(value) => setFormData({ ...formData, parentId: value === 'none' ? '' : value })}
            >
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Sin cuenta padre" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="none">Sin cuenta padre</SelectItem>
                {parentAccounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.code} - {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500">
              Para crear una subcuenta, selecciona la cuenta padre
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 h-10"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white"
            >
              {isSubmitting ? (
                <>
                  <Loading03Icon className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                account ? 'Actualizar' : 'Crear Cuenta'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
