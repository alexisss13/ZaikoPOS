'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Account, JournalEntry } from './useAccountingLogic';
import { Loading03Icon, PlusSignIcon, Delete02Icon } from 'hugeicons-react';
import { useAuth } from '@/context/auth-context';

interface JournalEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  entry?: JournalEntry | null;
  accounts: Account[];
}

interface JournalLine {
  accountId: string;
  debit: string;
  credit: string;
  description: string;
}

export default function JournalEntryModal({ isOpen, onClose, onSuccess, entry, accounts }: JournalEntryModalProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    entryDate: new Date().toISOString().split('T')[0],
    description: '',
  });
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: '', debit: '', credit: '', description: '' },
    { accountId: '', debit: '', credit: '', description: '' },
  ]);

  useEffect(() => {
    if (entry) {
      setFormData({
        entryDate: new Date(entry.entryDate).toISOString().split('T')[0],
        description: entry.description,
      });
      setLines(
        entry.lines.map((line) => ({
          accountId: line.accountId,
          debit: line.debit > 0 ? line.debit.toString() : '',
          credit: line.credit > 0 ? line.credit.toString() : '',
          description: line.description || '',
        }))
      );
    } else {
      setFormData({
        entryDate: new Date().toISOString().split('T')[0],
        description: '',
      });
      setLines([
        { accountId: 'placeholder', debit: '', credit: '', description: '' },
        { accountId: 'placeholder', debit: '', credit: '', description: '' },
      ]);
    }
  }, [entry, isOpen]);

  const addLine = () => {
    setLines([...lines, { accountId: 'placeholder', debit: '', credit: '', description: '' }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error('Debe haber al menos 2 líneas');
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof JournalLine, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // If entering debit, clear credit and vice versa
    if (field === 'debit' && value) {
      newLines[index].credit = '';
    } else if (field === 'credit' && value) {
      newLines[index].debit = '';
    }
    
    setLines(newLines);
  };

  const calculateTotals = () => {
    let totalDebit = 0;
    let totalCredit = 0;
    
    lines.forEach((line) => {
      totalDebit += parseFloat(line.debit || '0');
      totalCredit += parseFloat(line.credit || '0');
    });
    
    return { totalDebit, totalCredit, difference: totalDebit - totalCredit };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.entryDate || !formData.description) {
      toast.error('Fecha y descripción son requeridos');
      return;
    }

    // Validate lines
    const validLines = lines.filter(line => line.accountId && line.accountId !== 'placeholder' && (line.debit || line.credit));
    
    if (validLines.length < 2) {
      toast.error('Debe haber al menos 2 líneas con cuenta y monto');
      return;
    }

    // Validate double-entry balance
    const { totalDebit, totalCredit, difference } = calculateTotals();
    
    if (Math.abs(difference) > 0.01) {
      toast.error(`El asiento no está balanceado. Diferencia: S/ ${difference.toFixed(2)}`);
      return;
    }

    if (!user?.branchId) {
      toast.error('No se pudo determinar la sucursal');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/accounting/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: user.branchId,
          entryDate: formData.entryDate,
          description: formData.description,
          source: 'MANUAL',
          lines: validLines.map(line => ({
            accountId: line.accountId,
            debit: parseFloat(line.debit || '0'),
            credit: parseFloat(line.credit || '0'),
            description: line.description || null,
          })),
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar asiento');
      }

      toast.success('Asiento contable creado');
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const { totalDebit, totalCredit, difference } = calculateTotals();
  const isBalanced = Math.abs(difference) < 0.01;

  // Group accounts by type for easier selection
  const accountsByType = {
    ASSET: accounts.filter(a => a.type === 'ASSET' && a.isActive),
    LIABILITY: accounts.filter(a => a.type === 'LIABILITY' && a.isActive),
    EQUITY: accounts.filter(a => a.type === 'EQUITY' && a.isActive),
    REVENUE: accounts.filter(a => a.type === 'REVENUE' && a.isActive),
    EXPENSE: accounts.filter(a => a.type === 'EXPENSE' && a.isActive),
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {entry ? 'Ver Asiento Contable' : 'Nuevo Asiento Contable'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Header Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-semibold text-slate-700">
                Fecha <span className="text-red-500">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.entryDate}
                onChange={(e) => setFormData({ ...formData, entryDate: e.target.value })}
                disabled={!!entry}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-semibold text-slate-700">
                Descripción <span className="text-red-500">*</span>
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Ej: Registro de venta del día"
                disabled={!!entry}
                className="h-10"
              />
            </div>
          </div>

          {/* Journal Lines */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-700">
                Líneas del Asiento <span className="text-red-500">*</span>
              </Label>
              {!entry && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLine}
                  className="h-8 text-xs"
                >
                  <PlusSignIcon className="w-3.5 h-3.5 mr-1" />
                  Agregar Línea
                </Button>
              )}
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-50 px-4 py-2 grid grid-cols-12 gap-2 text-xs font-bold text-slate-600 uppercase">
                <div className="col-span-4">Cuenta</div>
                <div className="col-span-2 text-right">Débito</div>
                <div className="col-span-2 text-right">Crédito</div>
                <div className="col-span-3">Descripción</div>
                <div className="col-span-1"></div>
              </div>

              <div className="divide-y divide-slate-100">
                {lines.map((line, index) => (
                  <div key={index} className="px-4 py-3 grid grid-cols-12 gap-2 items-center">
                    {/* Account */}
                    <div className="col-span-4">
                      <Select
                        value={line.accountId || 'placeholder'}
                        onValueChange={(value) => value !== 'placeholder' && updateLine(index, 'accountId', value)}
                        disabled={!!entry}
                      >
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Seleccionar cuenta" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="placeholder" disabled>Seleccionar cuenta</SelectItem>
                          {Object.entries(accountsByType).map(([type, accs]) => (
                            accs.length > 0 && (
                              <div key={type}>
                                <div className="px-2 py-1.5 text-xs font-bold text-slate-500 uppercase">
                                  {type === 'ASSET' && 'Activos'}
                                  {type === 'LIABILITY' && 'Pasivos'}
                                  {type === 'EQUITY' && 'Patrimonio'}
                                  {type === 'REVENUE' && 'Ingresos'}
                                  {type === 'EXPENSE' && 'Gastos'}
                                </div>
                                {accs.map((acc) => (
                                  <SelectItem key={acc.id} value={acc.id} className="text-xs">
                                    {acc.code} - {acc.name}
                                  </SelectItem>
                                ))}
                              </div>
                            )
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Debit */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.debit}
                        onChange={(e) => updateLine(index, 'debit', e.target.value)}
                        placeholder="0.00"
                        disabled={!!entry}
                        className="h-9 text-xs text-right"
                      />
                    </div>

                    {/* Credit */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={line.credit}
                        onChange={(e) => updateLine(index, 'credit', e.target.value)}
                        placeholder="0.00"
                        disabled={!!entry}
                        className="h-9 text-xs text-right"
                      />
                    </div>

                    {/* Description */}
                    <div className="col-span-3">
                      <Input
                        value={line.description}
                        onChange={(e) => updateLine(index, 'description', e.target.value)}
                        placeholder="Detalle (opcional)"
                        disabled={!!entry}
                        className="h-9 text-xs"
                      />
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 flex justify-end">
                      {!entry && lines.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeLine(index)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Delete02Icon className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="bg-slate-50 px-4 py-3 grid grid-cols-12 gap-2 border-t-2 border-slate-200">
                <div className="col-span-4 text-sm font-bold text-slate-900">TOTALES</div>
                <div className="col-span-2 text-right">
                  <span className={`text-sm font-bold ${totalDebit > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                    S/ {totalDebit.toFixed(2)}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <span className={`text-sm font-bold ${totalCredit > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                    S/ {totalCredit.toFixed(2)}
                  </span>
                </div>
                <div className="col-span-4 text-right">
                  {isBalanced ? (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                      ✓ Balanceado
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded">
                      ⚠ Diferencia: S/ {Math.abs(difference).toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              <strong>Regla de partida doble:</strong> El total de débitos debe ser igual al total de créditos.
              Cada línea debe tener débito O crédito, no ambos.
            </p>
          </div>

          {/* Actions */}
          {!entry && (
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
                disabled={isSubmitting || !isBalanced}
                className="flex-1 h-10 bg-slate-900 hover:bg-slate-800 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loading03Icon className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Crear Asiento'
                )}
              </Button>
            </div>
          )}

          {entry && (
            <div className="flex justify-end pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-10"
              >
                Cerrar
              </Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
