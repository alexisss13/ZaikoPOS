'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CircleArrowUp02Icon, CircleArrowDown02Icon, Loading02Icon, Delete02Icon, ArrowLeft01Icon, ArrowRight01Icon } from 'hugeicons-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface CashTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  cashSessionId: string;
}

interface CashTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  description: string;
  createdAt: string;
}

const ITEMS_PER_PAGE = 4;

export function CashTransactionModal({ isOpen, onClose, onSuccess, cashSessionId }: CashTransactionModalProps) {
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const { data: transactions, mutate } = useSWR<CashTransaction[]>(
    isOpen ? `/api/cash-transactions?cashSessionId=${cashSessionId}` : null,
    fetcher
  );

  const totalPages = Math.ceil((transactions?.length || 0) / ITEMS_PER_PAGE);
  const paginatedTransactions = useMemo(() => {
    if (!transactions) return [];
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return transactions.slice(start, start + ITEMS_PER_PAGE);
  }, [transactions, currentPage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    if (!description.trim()) {
      toast.error('Ingresa una descripción');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/cash-transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cashSessionId,
          type,
          amount: amountNum,
          description: description.trim()
        })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al registrar transacción');
      }

      toast.success(`${type === 'INCOME' ? 'Ingreso' : 'Egreso'} registrado correctamente`);
      setAmount('');
      setDescription('');
      setCurrentPage(1);
      mutate();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Error al registrar transacción');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta transacción?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/cash-transactions/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al eliminar transacción');
      }

      toast.success('Transacción eliminada');
      mutate();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar transacción');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setAmount('');
      setDescription('');
      setType('INCOME');
      setCurrentPage(1);
      onClose();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const totalIncome = transactions?.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
  const totalExpense = transactions?.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + Number(t.amount), 0) || 0;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-6xl h-[85vh] p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-xl flex flex-col">
        <DialogHeader className="px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          <DialogTitle className="text-sm font-bold text-slate-900">Movimientos de Caja</DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500 mt-0.5">
            {transactions?.length || 0} {(transactions?.length || 0) === 1 ? 'movimiento registrado' : 'movimientos registrados'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {/* Lista de transacciones - Izquierda */}
          <div className="w-80 border-r border-slate-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {!transactions ? (
                <div className="flex items-center justify-center py-16">
                  <Loading02Icon className="w-6 h-6 animate-spin text-slate-300" />
                </div>
              ) : transactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <CircleArrowUp02Icon className="w-10 h-10 mb-2 opacity-50" />
                  <p className="text-xs font-medium">Sin movimientos</p>
                </div>
              ) : (
                paginatedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      transaction.type === 'INCOME'
                        ? 'bg-emerald-50 border-emerald-200 hover:border-emerald-300'
                        : 'bg-red-50 border-red-200 hover:border-red-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {transaction.type === 'INCOME' ? (
                          <CircleArrowUp02Icon className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <CircleArrowDown02Icon className="w-3.5 h-3.5 text-red-600" />
                        )}
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                          transaction.type === 'INCOME'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {transaction.type === 'INCOME' ? 'INGRESO' : 'EGRESO'}
                        </span>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${
                        transaction.type === 'INCOME' ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        S/ {Number(transaction.amount).toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 mb-1 line-clamp-2">{transaction.description}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>
                        {new Date(transaction.createdAt).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        disabled={deletingId === transaction.id}
                        className="ml-auto text-slate-400 hover:text-red-600 transition-colors"
                      >
                        {deletingId === transaction.id ? (
                          <Loading02Icon className="w-3 h-3 animate-spin" />
                        ) : (
                          <Delete02Icon className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-8 px-2"
                  >
                    <ArrowLeft01Icon className="w-4 h-4" />
                  </Button>
                  <span className="text-xs font-medium text-slate-600">
                    {currentPage} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="h-8 px-2"
                  >
                    <ArrowRight01Icon className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Formulario y resumen - Derecha */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-6">
            <div className="space-y-4 max-w-2xl mx-auto w-full">
              {/* Resumen */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                  <p className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider mb-1">
                    Total Ingresos
                  </p>
                  <p className="text-xl font-black text-emerald-700 tabular-nums">
                    S/ {totalIncome.toFixed(2)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                  <p className="text-[10px] font-semibold text-red-700 uppercase tracking-wider mb-1">
                    Total Egresos
                  </p>
                  <p className="text-xl font-black text-red-700 tabular-nums">
                    S/ {totalExpense.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200">
                <h3 className="text-sm font-bold text-slate-900">Registrar Nuevo Movimiento</h3>
                
                {/* Tipo de transacción */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-2 block">
                    Tipo de movimiento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('INCOME')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        type === 'INCOME'
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <CircleArrowUp02Icon className="w-5 h-5" />
                      <span className="text-sm font-bold">Ingreso</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('EXPENSE')}
                      className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition-all ${
                        type === 'EXPENSE'
                          ? 'border-red-500 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <CircleArrowDown02Icon className="w-5 h-5" />
                      <span className="text-sm font-bold">Egreso</span>
                    </button>
                  </div>
                </div>

                {/* Monto */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Monto (S/)
                  </label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="text-lg font-bold"
                    required
                  />
                </div>

                {/* Descripción */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                    Descripción
                  </label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ej: Pago de servicios, Compra de insumos, etc."
                    className="text-sm resize-none"
                    rows={3}
                    required
                  />
                </div>

                {/* Botón */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full ${
                    type === 'INCOME'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isSubmitting && <Loading02Icon className="w-4 h-4 mr-2 animate-spin" />}
                  Registrar {type === 'INCOME' ? 'Ingreso' : 'Egreso'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
