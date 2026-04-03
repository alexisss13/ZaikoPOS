// src/app/(pos)/history/page.tsx
'use client';

import useSWR from 'swr';
import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Receipt, Calendar as CalendarIcon, Clock, User, Banknote, CreditCard, Smartphone, Store, LayoutGrid, Check, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { format, startOfDay, endOfDay } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Branch { id: string; ecommerceCode: string | null; name: string; logoUrl?: string | null; }
interface UserData { id: string; name: string; }

const TIMEZONE = 'America/Lima';

export default function SalesHistoryPage() {
  const { user, role } = useAuth();
  const permissions = user?.permissions || {};
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  const isManager = role === 'MANAGER';
  
  const canViewOthers = isSuperOrOwner || !!permissions.canViewOtherBranches;

  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  const { data: users } = useSWR<UserData[]>(isSuperOrOwner || isManager ? '/api/users' : null, fetcher);
  
  const myBranch = branches?.find(b => b.id === user?.branchId);
  const myCode = myBranch?.ecommerceCode; 

  const uniqueCodes = Array.from(new Set(branches?.map((b) => b.ecommerceCode).filter(Boolean))) as string[];
  const visibleCodes = canViewOthers ? uniqueCodes : uniqueCodes.filter(c => c === myCode);

  const [selectedDate, setSelectedDate] = useState<string>('');
  const [codeFilter, setCodeFilter] = useState('ALL'); // Alineado a la lógica de sucursales
  const [selectedUser, setSelectedUser] = useState<string>('ALL');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeSale, setActiveSale] = useState<any>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 300; 
      scrollContainerRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!selectedDate) {
      const nowLima = toZonedTime(new Date(), TIMEZONE);
      setSelectedDate(format(nowLima, 'yyyy-MM-dd'));
    }
  }, [selectedDate]);

  const queryParams = useMemo(() => {
    if (!selectedDate) return null;
    const [year, month, day] = selectedDate.split('-').map(Number);
    const limaDate = new Date(year, month - 1, day);
    const start = startOfDay(limaDate).toISOString();
    const end = endOfDay(limaDate).toISOString();

    const actualBranchId = codeFilter === 'ALL' ? 'ALL' : branches?.find(b => b.ecommerceCode === codeFilter)?.id || 'ALL';

    return `?startDate=${start}&endDate=${end}&branchId=${actualBranchId}&userId=${selectedUser}`;
  }, [selectedDate, codeFilter, selectedUser, branches]);

  const { data, isLoading } = useSWR(queryParams ? `/api/sales/history${queryParams}` : null, fetcher);

  const sales = data?.sales || [];
  const summary = data?.summary || { CASH: 0, YAPE: 0, PLIN: 0, CARD: 0, TRANSFER: 0, TOTAL: 0 };

  useEffect(() => {
    if (sales.length > 0 && !activeSale) setActiveSale(sales[0]);
    else if (sales.length === 0) setActiveSale(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales]);

  const getBranchByCode = (code: string) => branches?.find(b => b.ecommerceCode === code);
  const formatTime = (isoString: string) => format(toZonedTime(new Date(isoString), TIMEZONE), 'hh:mm a');

  return (
    <div className="flex h-full w-full bg-white animate-in fade-in duration-300 font-sans text-sm">
      
      {/* ÁREA IZQUIERDA: MASTER (Filtros y Lista) */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        
        {/* TOOLBAR SUPERIOR */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-slate-100 bg-white shrink-0">
          <h1 className="text-[22px] font-black text-slate-900 tracking-tight hidden sm:block shrink-0">Historial y Arqueo</h1>
          
          <div className="flex items-center gap-3 ml-auto w-full sm:w-auto">
            {(isSuperOrOwner || isManager) && (
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger className="h-11 w-full sm:w-[220px] text-sm font-semibold bg-white border border-slate-200 shadow-sm rounded-xl focus:ring-slate-300">
                  <SelectValue placeholder="Filtrar por Cajero..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Todos los usuarios</SelectItem>
                  {users?.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <div className="relative group w-full sm:w-auto">
              <Input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-11 pl-10 pr-4 text-sm font-bold bg-white border border-slate-200 shadow-sm rounded-xl focus-visible:ring-slate-300 transition-all cursor-pointer w-full"
              />
              <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none group-hover:text-slate-600 transition-colors" />
            </div>
          </div>
        </div>

        {/* SUBHEADER FIJO: TABS DE SUCURSAL */}
        <div className="flex items-center w-full border-b border-slate-100 bg-white shrink-0 h-[52px]">
          {visibleCodes.length > 0 && canViewOthers && (
            <div className="flex items-center gap-1.5 px-4 h-full shrink-0 border-r border-slate-100">
              <button 
                title="Todas las tiendas"
                onClick={() => setCodeFilter('ALL')} 
                className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${codeFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-50 text-slate-500 hover:text-slate-900 hover:bg-slate-100 border border-slate-200'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              {visibleCodes.map(code => {
                const bInfo = getBranchByCode(code);
                return (
                  <button 
                    title={bInfo?.name || code}
                    key={code} 
                    onClick={() => setCodeFilter(code)} 
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all overflow-hidden ${codeFilter === code ? 'ring-2 ring-slate-200 ring-offset-1 shadow-sm' : 'bg-slate-50 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    {bInfo?.logoUrl ? <img src={bInfo.logoUrl} className="w-full h-full object-cover bg-white" alt="" /> : <Store className="w-4 h-4 text-slate-500" />}
                  </button>
                )
              })}
            </div>
          )}

          {/* ESPACIO CENTRAL SCROLLABLE PARA FUTUROS FILTROS SI SE REQUIEREN */}
          <div className="flex-1 h-full overflow-hidden relative flex items-center">
            <div ref={scrollContainerRef} className="flex items-center gap-2 px-4 w-full overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] scroll-smooth">
              <span className="text-xs font-bold text-slate-400">Detalle Operativo del Turno Seleccionado</span>
            </div>
          </div>
        </div>

        {/* LISTADO DE VENTAS Y ARQUEO */}
        <div className="flex-1 overflow-y-auto p-4 bg-slate-50/50 custom-scrollbar flex flex-col gap-4">
          
          {/* TARJETA DE ARQUEO EN LA CABECERA DE LA LISTA */}
          <div className="flex items-center justify-between p-4 sm:p-6 bg-slate-900 rounded-2xl text-white shadow-xl relative overflow-hidden shrink-0 border border-slate-800">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex flex-col relative z-10">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recaudación Total</span>
              <span className="text-3xl font-black tabular-nums tracking-tight mt-1 leading-none">S/ {summary.TOTAL.toFixed(2)}</span>
            </div>
            <div className="flex gap-4 sm:gap-6 text-right relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Efectivo Físico</span>
                <span className="text-sm font-black text-emerald-400 tabular-nums leading-none mt-1.5">S/ {summary.CASH.toFixed(2)}</span>
              </div>
              <div className="w-px h-8 bg-white/20 self-center hidden sm:block" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider leading-none">Pagos Digitales</span>
                <span className="text-sm font-black text-blue-400 tabular-nums leading-none mt-1.5">S/ {(summary.YAPE + summary.PLIN + summary.CARD + summary.TRANSFER).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* GRID DE TARJETAS DE VENTAS */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 lg:gap-4">
            {isLoading ? (
              Array(8).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4"><Skeleton className="h-4 w-1/2 mb-2" /><Skeleton className="h-6 w-full" /></div>
              ))
            ) : sales.length === 0 ? (
              <div className="col-span-full h-32 flex flex-col items-center justify-center text-slate-400 text-sm font-medium gap-2">
                <Receipt className="w-8 h-8 opacity-50" /> No hay ventas registradas en esta fecha.
              </div>
            ) : (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              sales.map((sale: any) => {
                const isActive = activeSale?.id === sale.id;
                const isVoided = sale.status !== 'COMPLETED';
                
                return (
                  <div
                    key={sale.id}
                    onClick={() => setActiveSale(sale)}
                    className={`group relative flex flex-col p-4 rounded-2xl transition-all select-none border cursor-pointer
                      ${isActive ? 'bg-slate-900 border-slate-900 shadow-md text-white' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm text-slate-900'}
                      ${isVoided ? 'opacity-60 grayscale' : ''}
                    `}
                  >
                    <div className="flex justify-between items-start w-full mb-3">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>
                        Orden: <span className={isActive ? 'text-white' : 'text-slate-900'}>#{sale.code.slice(-6)}</span>
                      </span>
                      <span className={`text-[10px] font-bold flex items-center gap-1 ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                        <Clock className="w-3 h-3" /> {formatTime(sale.createdAt)}
                      </span>
                    </div>
                    
                    <div className="mt-auto flex justify-between items-end w-full">
                      <div className={`flex flex-col gap-1 text-[10px] font-semibold ${isActive ? 'text-slate-300' : 'text-slate-500'}`}>
                        <span className="flex items-center gap-1"><Store className="w-3 h-3" /> {sale.items.length} productos</span>
                        {(isSuperOrOwner || isManager) && <span className="flex items-center gap-1 truncate max-w-[100px]"><User className="w-3 h-3" /> {sale.user?.name}</span>}
                      </div>
                      
                      <div className="flex flex-col items-end">
                        {isVoided && <span className="text-[9px] font-bold text-red-500 bg-red-50/10 px-1.5 py-0.5 rounded uppercase mb-1 border border-red-500/20">Anulada</span>}
                        <span className={`text-xl font-black tabular-nums tracking-tight leading-none ${isVoided ? 'line-through opacity-50' : ''}`}>
                          S/ {Number(sale.total).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

        </div>
      </main>

      {/* 🚀 ÁREA DERECHA: DETALLE (Aside) */}
      <aside className="w-[320px] xl:w-[380px] flex flex-col border-l shrink-0 overflow-hidden transition-colors duration-300 bg-white border-slate-100">
        
        <div className="h-14 px-4 border-b flex items-center justify-between shrink-0 bg-white border-slate-100">
          <span className="font-semibold text-sm flex items-center gap-2 text-slate-800">
            <Receipt className="w-5 h-5" /> Detalle del Ticket
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 custom-scrollbar relative">
          {!activeSale ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-300 gap-3 opacity-80">
              <Receipt className="w-12 h-12" strokeWidth={1} />
              <p className="text-sm font-medium">Selecciona una venta</p>
            </div>
          ) : (
            <div className="w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 relative z-10">
              
              <div className="p-6 border-b border-dashed border-slate-200 text-center bg-white relative">
                <div className="absolute -left-3 -bottom-3 w-6 h-6 bg-slate-50/50 rounded-full border-r border-t border-slate-200 rotate-45" />
                <div className="absolute -right-3 -bottom-3 w-6 h-6 bg-slate-50/50 rounded-full border-l border-t border-slate-200 -rotate-45" />
                
                <h3 className="font-black text-xl text-slate-900 tracking-tight">Comprobante</h3>
                <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-widest">#{activeSale.code}</p>
                <div className="flex items-center justify-center gap-2 mt-4 text-[11px] font-semibold text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100"><Clock className="w-3.5 h-3.5 text-slate-400" /> {formatTime(activeSale.createdAt)}</span>
                  <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-md border border-slate-100 truncate max-w-[120px]"><User className="w-3.5 h-3.5 text-slate-400" /> {activeSale.user?.name}</span>
                </div>
              </div>

              <div className="p-5 bg-white">
                <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-4 pb-2 border-b border-slate-100">
                  <span>Cant / Prod</span>
                  <span>Total</span>
                </div>
                
                <div className="space-y-4">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {activeSale.items.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-start gap-3">
                      <div className="flex gap-2">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 rounded border border-slate-200 px-1.5 py-0.5 h-max leading-none mt-0.5">{item.quantity}x</span>
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800 leading-tight">{item.product.title}</span>
                          <span className="text-[10px] font-medium text-slate-400 mt-0.5">S/ {Number(item.price).toFixed(2)} c/u</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-slate-900 tabular-nums shrink-0 mt-0.5">S/ {Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="border-dashed bg-transparent border-t border-slate-200 mx-5 w-auto" />

              <div className="p-5 space-y-2 bg-white">
                <div className="flex justify-between text-xs font-medium text-slate-500">
                  <span>Subtotal</span>
                  <span className="tabular-nums">S/ {Number(activeSale.subtotal).toFixed(2)}</span>
                </div>
                {Number(activeSale.discount) > 0 && (
                  <div className="flex justify-between text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md -mx-2">
                    <span>Descuento</span>
                    <span className="tabular-nums">- S/ {Number(activeSale.discount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-end pt-3 mt-1 border-t border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Total Pagado</span>
                  <span className="text-2xl font-black text-slate-900 tracking-tighter tabular-nums leading-none">S/ {Number(activeSale.total).toFixed(2)}</span>
                </div>
              </div>

              <div className="px-5 pb-5 bg-white">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 block text-center">Métodos de Pago</span>
                  <div className="space-y-2">
                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {activeSale.payments.map((pay: any) => (
                      <div key={pay.id} className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                        <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-md shadow-sm border border-slate-100">
                          {pay.method === 'CASH' ? <Banknote className="w-3.5 h-3.5 text-emerald-600" /> : 
                           pay.method === 'CARD' ? <CreditCard className="w-3.5 h-3.5 text-blue-600" /> : 
                           <Smartphone className="w-3.5 h-3.5 text-purple-600" />}
                          <span>{pay.method}</span>
                        </div>
                        <span className="tabular-nums text-sm">S/ {Number(pay.amount).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </aside>

    </div>
  );
}