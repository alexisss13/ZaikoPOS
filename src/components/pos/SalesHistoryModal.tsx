// src/components/pos/SalesHistoryModal.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import useSWR from 'swr';
import { useAuth } from '@/context/auth-context';
import { format, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { 
  Receipt, X, Calendar as CalendarIcon, Clock, User, Banknote, CreditCard, Smartphone, Store
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TIMEZONE = 'America/Lima';

export function SalesHistoryModal({ isOpen, onClose }: SalesHistoryModalProps) {
  const { user } = useAuth();
  
  // Filtros
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeSale, setActiveSale] = useState<any>(null);

  // Inicializar fecha local (America/Lima) al abrir
  useEffect(() => {
    if (isOpen && !selectedDate) {
      const nowLima = toZonedTime(new Date(), TIMEZONE);
      setSelectedDate(format(nowLima, 'yyyy-MM-dd'));
    }
  }, [isOpen, selectedDate]);

  // Construir parámetros de consulta garantizando los límites del día en UTC
  const queryParams = useMemo(() => {
    if (!selectedDate) return null;
    
    // Parseamos la fecha string como si fuera medianoche en Lima, luego sacamos inicio y fin
    const [year, month, day] = selectedDate.split('-').map(Number);
    const limaDate = new Date(year, month - 1, day);
    
    const start = startOfDay(limaDate).toISOString();
    const end = endOfDay(limaDate).toISOString();

    return `?startDate=${start}&endDate=${end}&branchId=${selectedBranch}&userId=${selectedUser}`;
  }, [selectedDate, selectedBranch, selectedUser]);

  // Obtener datos
  const { data, isLoading } = useSWR(
    isOpen && queryParams ? `/api/sales/history${queryParams}` : null, 
    fetcher
  );

  // Obtener catálogos para filtros si es admin/owner
  const { data: branches } = useSWR(isOpen && (user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER') ? '/api/branches' : null, fetcher);
  const { data: users } = useSWR(isOpen && user?.role !== 'CASHIER' ? '/api/users' : null, fetcher);

  const sales = data?.sales || [];
  const summary = data?.summary || { CASH: 0, YAPE: 0, PLIN: 0, CARD: 0, TRANSFER: 0, TOTAL: 0 };

  const isGlobal = user?.role === 'SUPER_ADMIN' || user?.role === 'OWNER';
  const isManager = user?.role === 'MANAGER';

  // Autoseleccionar la primera venta al cargar
  useEffect(() => {
    if (sales.length > 0 && !activeSale) {
      setActiveSale(sales[0]);
    } else if (sales.length === 0) {
      setActiveSale(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales]);

  const formatTime = (isoString: string) => {
    return format(toZonedTime(new Date(isoString), TIMEZONE), 'hh:mm a');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[1100px] w-[95vw] h-[85vh] p-0 font-sans border-none shadow-2xl rounded-2xl overflow-hidden flex flex-col bg-slate-50">
        
        {/* HEADER */}
        <div className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-sm">
              <Receipt className="w-5 h-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-lg font-black text-slate-900 tracking-tight">Historial de Turno y Arqueo</DialogTitle>
              <p className="text-xs font-medium text-slate-500">Monitor en vivo de ventas</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full text-slate-400 hover:text-slate-900 hover:bg-slate-100">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* CONTENIDO SPLIT (Master-Detail) */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* PANEL IZQUIERDO: LISTA Y FILTROS */}
          <div className="w-[40%] bg-slate-50 border-r border-slate-200 flex flex-col z-10">
            
            {/* FILTROS */}
            <div className="p-4 bg-white border-b border-slate-200 flex flex-col gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="h-10 pl-10 text-sm font-semibold rounded-xl bg-slate-50 border-slate-200"
                  />
                  <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                </div>
                
                {isGlobal && (
                  <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                    <SelectTrigger className="h-10 flex-1 rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold">
                      <SelectValue placeholder="Sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Todas las Tiendas</SelectItem>
                      {branches?.map((b: { id: string, name: string }) => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {(isGlobal || isManager) && (
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger className="h-10 w-full rounded-xl bg-slate-50 border-slate-200 text-xs font-semibold">
                    <SelectValue placeholder="Usuario / Cajero" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Todos los Usuarios</SelectItem>
                    {users?.map((u: { id: string, name: string }) => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {/* MINI RESUMEN DEL DÍA */}
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl text-white mt-1 shadow-md">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Vendido</span>
                  <span className="text-xl font-black tabular-nums leading-none mt-1">S/ {summary.TOTAL.toFixed(2)}</span>
                </div>
                <div className="flex gap-3 text-right">
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-semibold">Efectivo</span>
                    <span className="text-xs font-bold text-emerald-400 tabular-nums">S/ {summary.CASH.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] text-slate-400 font-semibold">Digital</span>
                    <span className="text-xs font-bold text-blue-400 tabular-nums">S/ {(summary.YAPE + summary.PLIN + summary.CARD + summary.TRANSFER).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* LISTA DE VENTAS (TARJETAS) */}
            <ScrollArea className="flex-1 p-3">
              <div className="flex flex-col gap-2">
                {isLoading ? (
                  <p className="text-xs text-center text-slate-400 py-10 font-medium">Cargando ventas...</p>
                ) : sales.length === 0 ? (
                  <p className="text-xs text-center text-slate-400 py-10 font-medium">No se registraron ventas en esta fecha.</p>
                ) : (
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  sales.map((sale: any) => {
                    const isActive = activeSale?.id === sale.id;
                    const isVoided = sale.status !== 'COMPLETED';
                    
                    return (
                      <button
                        key={sale.id}
                        onClick={() => setActiveSale(sale)}
                        className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col gap-2 relative overflow-hidden group
                          ${isActive 
                            ? 'bg-white border-slate-300 shadow-md ring-1 ring-slate-300' 
                            : 'bg-white border-slate-100 shadow-sm hover:border-slate-300 hover:shadow-md'
                          }
                          ${isVoided ? 'opacity-60' : ''}
                        `}
                      >
                        <div className="flex justify-between items-start w-full">
                          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                            Orden: <span className="text-slate-900">{sale.code.slice(-6)}</span>
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatTime(sale.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-end w-full">
                          <div className="flex flex-col gap-1 text-[11px] font-medium text-slate-500">
                            <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {sale.items.length} productos</span>
                            {(isGlobal || isManager) && <span className="flex items-center gap-1"><User className="w-3 h-3" /> {sale.user?.name}</span>}
                          </div>
                          
                          <div className="flex flex-col items-end">
                            {isVoided && <span className="text-[9px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded uppercase mb-1">Anulada</span>}
                            <span className={`text-lg font-black tabular-nums tracking-tight ${isVoided ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
                              S/ {Number(sale.total).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-slate-900" />}
                      </button>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>

          {/* PANEL DERECHO: DETALLE DE BOLETA PREVIEW */}
          <div className="flex-1 bg-slate-100/50 p-6 flex items-start justify-center overflow-y-auto">
            {!activeSale ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3">
                <Receipt className="w-16 h-16 opacity-50" strokeWidth={1} />
                <p className="text-sm font-medium">Selecciona una venta para ver el detalle</p>
              </div>
            ) : (
              <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                
                {/* TICKET HEADER */}
                <div className="p-6 border-b border-dashed border-slate-300 text-center bg-slate-50/50">
                  <h3 className="font-black text-xl text-slate-900 tracking-tight">Detalle de Venta</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-widest">
                    #{activeSale.code}
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-[11px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {formatTime(activeSale.createdAt)}</span>
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" /> {activeSale.user?.name}</span>
                  </div>
                </div>

                {/* TICKET ITEMS */}
                <div className="p-6">
                  <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 pb-2 border-b border-slate-100">
                    <span>Cant / Producto</span>
                    <span>Total</span>
                  </div>
                  
                  <div className="space-y-4">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {activeSale.items.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-start gap-3">
                        <div className="flex gap-2">
                          <span className="text-xs font-bold text-slate-900 bg-slate-100 rounded px-1.5 py-0.5 h-max">{item.quantity}x</span>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800 leading-tight">{item.product.title}</span>
                            <span className="text-[10px] font-medium text-slate-400 mt-0.5">S/ {Number(item.price).toFixed(2)} c/u</span>
                          </div>
                        </div>
                        <span className="text-sm font-bold text-slate-900 tabular-nums shrink-0">
                          S/ {Number(item.subtotal).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="border-dashed bg-transparent border-t border-slate-300 mx-6 w-auto" />

                {/* TICKET TOTALS */}
                <div className="p-6 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-500">
                    <span>Subtotal</span>
                    <span className="tabular-nums">S/ {Number(activeSale.subtotal).toFixed(2)}</span>
                  </div>
                  {Number(activeSale.discount) > 0 && (
                    <div className="flex justify-between text-xs font-bold text-emerald-600">
                      <span>Descuento</span>
                      <span className="tabular-nums">- S/ {Number(activeSale.discount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-3 mt-1 border-t border-slate-100">
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-900">Total Pagado</span>
                    <span className="text-3xl font-black text-slate-900 tracking-tight tabular-nums leading-none">
                      S/ {Number(activeSale.total).toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* TICKET PAYMENTS */}
                <div className="px-6 pb-6">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">Métodos Utilizados</span>
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      {activeSale.payments.map((pay: any) => (
                        <div key={pay.id} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                          <div className="flex items-center gap-1.5">
                            {pay.method === 'CASH' ? <Banknote className="w-3.5 h-3.5 text-emerald-600" /> : 
                             pay.method === 'CARD' ? <CreditCard className="w-3.5 h-3.5 text-blue-600" /> : 
                             <Smartphone className="w-3.5 h-3.5 text-purple-600" />}
                            <span>{pay.method}</span>
                          </div>
                          <span className="tabular-nums">S/ {Number(pay.amount).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}