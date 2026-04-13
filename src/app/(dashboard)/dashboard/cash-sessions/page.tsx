'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { ContactRound, Download, Loader2, Filter, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface CashSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  initialCash: number;
  finalCash: number | null;
  income: number;
  expense: number;
  difference: number | null;
  status: string;
  user: {
    name: string;
  };
  branch: {
    name: string;
  };
  sales: Array<{
    id: string;
    total: number;
    subtotal: number;
    discount: number;
    status: string;
    createdAt: string;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    payments: Array<{
      method: string;
      amount: number;
    }>;
  }>;
}

export default function CashSessionsPage() {
  const { role } = useAuth();
  const canView = role === 'OWNER' || role === 'MANAGER' || role === 'SUPER_ADMIN';

  const { data: sessions, isLoading, mutate } = useSWR<CashSession[]>(
    canView ? '/api/cash-sessions' : null,
    fetcher
  );

  const [selectedSession, setSelectedSession] = useState<CashSession | null>(null);
  const [declaredCash, setDeclaredCash] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilterSession, setStatusFilterSession] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showBranchFilter, setShowBranchFilter] = useState(false);

  const ITEMS_PER_PAGE = 6  ;

  const { data: branches } = useSWR('/api/branches', fetcher);

  // Filtrar sesiones
  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    return sessions.filter(session => {
      const matchesBranch = branchFilter === 'ALL' || session.branch.name === branchFilter;
      const matchesStatus = statusFilterSession === 'ALL' || session.status === statusFilterSession;
      
      let matchesDateFrom = true;
      let matchesDateTo = true;
      
      if (dateFrom || dateTo) {
        const sessionDateStr = session.openedAt.split('T')[0];
        if (dateFrom) matchesDateFrom = sessionDateStr >= dateFrom;
        if (dateTo) matchesDateTo = sessionDateStr <= dateTo;
      }

      return matchesBranch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [sessions, branchFilter, statusFilterSession, dateFrom, dateTo]);

  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE) || 1;
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  if (!canView) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-slate-600">No tienes permisos para ver esta página</p>
        </div>
      </div>
    );
  }

  // Calcular estadísticas de la sesión seleccionada
  const getSessionStats = (session: CashSession) => {
    const completedSales = session.sales.filter(s => s.status === 'COMPLETED');
    const voidedSales = session.sales.filter(s => s.status === 'VOIDED');
    
    const totalSales = completedSales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalSubtotal = completedSales.reduce((sum, s) => sum + Number(s.subtotal), 0);
    const totalDiscount = completedSales.reduce((sum, s) => sum + Number(s.discount), 0);
    
    // IGV (18%)
    const igv = totalSales - totalSubtotal;
    const profitWithTax = totalSubtotal - totalDiscount;
    const profitWithoutTax = profitWithTax - igv;
    
    // Agrupar por categoría
    const categoryMap = new Map<string, { profit: number; total: number }>();
    completedSales.forEach(sale => {
      sale.items.forEach(item => {
        const category = 'Categoria 1';
        const current = categoryMap.get(category) || { profit: 0, total: 0 };
        const itemSubtotal = Number(item.subtotal);
        categoryMap.set(category, {
          profit: current.profit + itemSubtotal,
          total: current.total + itemSubtotal
        });
      });
    });

    // Agrupar por método de pago
    const paymentMap = new Map<string, number>();
    completedSales.forEach(sale => {
      sale.payments.forEach(payment => {
        const current = paymentMap.get(payment.method) || 0;
        paymentMap.set(payment.method, current + Number(payment.amount));
      });
    });

    // Calcular transacciones de caja (ingresos y egresos)
    const transactions = (session as any).transactions || [];
    const totalIncome = transactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    // Calcular efectivo en ventas
    const cashInSales = paymentMap.get('CASH') || 0;
    const totalInCash = Number(session.initialCash) + cashInSales + totalIncome - totalExpense;
    const declaredCash = session.finalCash !== null ? Number(session.finalCash) : totalInCash;
    const cashDifference = declaredCash - totalInCash;

    return {
      totalSales,
      igv,
      profitWithTax,
      profitWithoutTax,
      cashInSales,
      totalIncome,
      totalExpense,
      totalInCash,
      declaredCash,
      cashDifference,
      transactions,
      categories: Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        profit: data.profit,
        total: data.total
      })),
      paymentMethods: paymentMap
    };
  };

  const getSessionNumber = (index: number) => {
    return filteredSessions ? filteredSessions.length - index : 0;
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;
    
    const finalCash = parseFloat(declaredCash);
    if (isNaN(finalCash) || finalCash < 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setIsClosing(true);
    try {
      const res = await fetch(`/api/cash-sessions/${selectedSession.id}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalCash })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al cerrar turno');
      }

      toast.success('Turno cerrado correctamente');
      setDeclaredCash('');
      mutate();
      
      // Actualizar sesión seleccionada
      const updatedSession = await res.json();
      setSelectedSession(updatedSession);
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar el turno');
    } finally {
      setIsClosing(false);
    }
  };

  const generatePDF = async () => {
    if (!selectedSession) return;

    setIsGeneratingPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF('p', 'mm', 'a4');
      const stats = getSessionStats(selectedSession);
      const sessionIndex = sessions?.findIndex(s => s.id === selectedSession.id) ?? 0;
      const sessionNumber = getSessionNumber(sessionIndex);

      // Encabezado
      doc.setFillColor(30, 41, 59);
      doc.rect(0, 0, 210, 40, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont('helvetica', 'bold');
      doc.text(`CORTE DE TURNO N°${sessionNumber}`, 105, 15, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(selectedSession.branch.name, 105, 25, { align: 'center' });
      doc.text(`Generado: ${new Date().toLocaleString('es-PE')}`, 105, 32, { align: 'center' });

      let yPos = 50;

      // Información del turno
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(
        `Abierto por ${selectedSession.user.name} desde ${new Date(selectedSession.openedAt).toLocaleString('es-PE')}${
          selectedSession.closedAt ? ` hasta ${new Date(selectedSession.closedAt).toLocaleString('es-PE')}` : ''
        }`,
        15,
        yPos,
        { maxWidth: 180 }
      );
      yPos += 15;

      // Ventas
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('VENTAS', 15, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Ventas Totales', 20, yPos);
      doc.text(`S/ ${stats.totalSales.toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 10;

      // Dinero en caja
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('DINERO EN CAJA', 15, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('[+] Dinero Inicial en caja', 20, yPos);
      doc.text(`S/ ${Number(selectedSession.initialCash).toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.text('[+] Ventas en efectivo', 20, yPos);
      doc.text(`S/ ${stats.cashInSales.toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.text('[=] Total en Caja', 20, yPos);
      doc.text(`S/ ${stats.totalInCash.toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.text('Efectivo declarado', 20, yPos);
      doc.text(`S/ ${stats.declaredCash.toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('Diferencia', 20, yPos);
      doc.text(`S/ ${stats.cashDifference.toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 10;

      // Categorías
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('CATEGORÍA | GANANCIAS | VENTA TOTAL', 15, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      stats.categories.forEach(cat => {
        doc.text(cat.name, 20, yPos);
        doc.text(`S/ ${cat.profit.toFixed(2)}`, 120, yPos);
        doc.text(`S/ ${cat.total.toFixed(2)}`, 195, yPos, { align: 'right' });
        yPos += 5;
      });
      yPos += 5;

      // Impuestos
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('IMPUESTOS COBRADOS', 15, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Impuestos cobrados', 20, yPos);
      doc.text(`S/ ${stats.igv.toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 10;

      // Ganancia
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('GANANCIA', 15, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('Ganancia con impuesto', 20, yPos);
      doc.text(`S/ ${stats.profitWithTax.toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.text('Ganancia sin impuesto', 20, yPos);
      doc.text(`S/ ${stats.profitWithoutTax.toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 10;

      // Resumen de ventas
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RESUMEN DE VENTAS', 15, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text('[+] Ventas en efectivo', 20, yPos);
      doc.text(`S/ ${(stats.paymentMethods.get('CASH') || 0).toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.text('[+] Ventas con Tarjeta', 20, yPos);
      doc.text(`S/ ${(stats.paymentMethods.get('CARD') || 0).toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.text('[+] Ventas con Transferencia', 20, yPos);
      doc.text(`S/ ${(stats.paymentMethods.get('TRANSFER') || 0).toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.text('[+] Ventas con Yape', 20, yPos);
      doc.text(`S/ ${(stats.paymentMethods.get('YAPE') || 0).toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.text('[+] Ventas con Plin', 20, yPos);
      doc.text(`S/ ${(stats.paymentMethods.get('PLIN') || 0).toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.text('[+] Ventas con Puntos', 20, yPos);
      doc.text(`S/ ${(stats.paymentMethods.get('POINTS') || 0).toFixed(2)}`, 195, yPos, { align: 'right' });
      yPos += 5;
      doc.setFont('helvetica', 'bold');
      doc.text('[=] Total Ventas', 20, yPos);
      doc.text(`S/ ${stats.totalSales.toFixed(2)}`, 195, yPos, { align: 'right' });

      const timestamp = new Date().toISOString().split('T')[0];
      doc.save(`corte-turno-${sessionNumber}-${timestamp}.pdf`);
      
      toast.success('PDF generado correctamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full gap-5 animate-in fade-in duration-300">
      
      {/* TOOLBAR SUPERIOR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex items-center gap-2.5 shrink-0">
          <h1 className="text-[26px] font-black text-slate-900 tracking-tight">Corte de Turnos</h1>
          <ContactRound className="w-6 h-6 text-slate-500" strokeWidth={2.5} />
        </div>

        {/* Filtros y paginación */}
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          {/* Filtro por estado */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => {setStatusFilterSession('ALL'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                statusFilterSession === 'ALL'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => {setStatusFilterSession('OPEN'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                statusFilterSession === 'OPEN'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Abiertos
            </button>
            <button
              onClick={() => {setStatusFilterSession('CLOSED'); setCurrentPage(1);}}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                statusFilterSession === 'CLOSED'
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Cerrados
            </button>
          </div>

          {/* Filtro por sucursal */}
          <div className="relative">
            <button
              onClick={() => setShowBranchFilter(!showBranchFilter)}
              className={`h-8 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all hover:bg-slate-50 flex items-center gap-2 ${branchFilter !== 'ALL' ? 'border-slate-900 bg-slate-50' : ''}`}
            >
              <ContactRound className={`w-3.5 h-3.5 ${branchFilter !== 'ALL' ? 'text-slate-900' : 'text-slate-400'}`} />
              <span className={branchFilter !== 'ALL' ? 'text-slate-900 font-bold' : 'text-slate-600'}>
                {branchFilter === 'ALL' ? 'Sucursal' : branches?.find((b: any) => b.name === branchFilter)?.name || 'Sucursal'}
              </span>
              <Filter className={`w-3 h-3 ${branchFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : 'text-slate-400'}`} />
            </button>
            
            {showBranchFilter && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowBranchFilter(false)} />
                <div className="absolute right-0 top-10 w-[180px] bg-white border border-slate-200 shadow-xl rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100 max-h-60 overflow-y-auto custom-scrollbar">
                  <button onClick={() => {setBranchFilter('ALL'); setShowBranchFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors ${branchFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                    Todas las sucursales
                  </button>
                  <div className="h-px bg-slate-100 my-1 mx-2" />
                  {branches?.map((branch: any) => (
                    <button key={branch.id} onClick={() => {setBranchFilter(branch.name); setShowBranchFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-medium w-full transition-colors ${branchFilter === branch.name ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {branch.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Filtros de fecha */}
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
            className="h-8 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
            placeholder="Desde"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
            className="h-8 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
            placeholder="Hasta"
          />

          {/* Limpiar filtros */}
          {(branchFilter !== 'ALL' || dateFrom || dateTo || statusFilterSession !== 'ALL') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setBranchFilter('ALL');
                setDateFrom('');
                setDateTo('');
                setStatusFilterSession('ALL');
                setCurrentPage(1);
              }}
              className="h-8 text-xs font-bold text-slate-600 hover:text-slate-900 px-2"
            >
              <XCircle className="w-3.5 h-3.5" />
            </Button>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                Pág {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex h-full w-full gap-5">
        {/* LISTA DE TURNOS */}
        <div className="w-80 flex flex-col gap-4">
          <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar">
            {isLoading ? (
              Array(5).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-lg" />
              ))
            ) : paginatedSessions?.length === 0 ? (
              <div className="text-center py-12">
                <ContactRound className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">No hay turnos registrados</p>
              </div>
            ) : (
              paginatedSessions?.map((session, index) => {
                const sessionIndex = filteredSessions.findIndex(s => s.id === session.id);
                return (
                <button
                  key={session.id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full p-3 rounded-lg border text-left transition-all ${
                    selectedSession?.id === session.id
                      ? 'border-slate-900 bg-slate-900 text-white shadow-md'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-semibold ${selectedSession?.id === session.id ? 'text-white' : 'text-slate-900'}`}>
                      Corte N°{getSessionNumber(sessionIndex)}
                    </span>
                    <Badge className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      session.status === 'OPEN'
                        ? selectedSession?.id === session.id 
                          ? 'bg-emerald-500 text-white'
                          : 'bg-emerald-100 text-emerald-700'
                        : selectedSession?.id === session.id
                          ? 'bg-slate-700 text-slate-200'
                          : 'bg-slate-100 text-slate-700'
                    }`}>
                      {session.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
                    </Badge>
                  </div>
                  
                  <div className={`flex items-center gap-2 text-[10px] ${selectedSession?.id === session.id ? 'text-slate-300' : 'text-slate-500'}`}>
                    <span>
                      {new Date(session.openedAt).toLocaleString('es-PE', { 
                        day: '2-digit', 
                        month: '2-digit',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <span>•</span>
                    <span>{session.user.name}</span>
                  </div>
                </button>
              );
              })
            )}
          </div>
          </div>

        {/* DETALLES DEL TURNO */}
        <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scrollbar pb-4">
        {!selectedSession ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <ContactRound className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-sm text-slate-500">Selecciona un turno para ver los detalles</p>
            </div>
          </div>
        ) : (
          <>
            {(() => {
              const stats = getSessionStats(selectedSession);
              const sessionIndex = filteredSessions?.findIndex(s => s.id === selectedSession.id) ?? 0;
              const sessionNumber = getSessionNumber(sessionIndex);

              return (
                <div className="space-y-3">
                  {/* HEADER */}
                  <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-bold text-slate-900">Corte N°{sessionNumber}</span> abierto por{' '}
                      <span className="font-semibold text-slate-900">{selectedSession.user.name}</span> desde{' '}
                      <span className="font-medium text-slate-700">
                        {new Date(selectedSession.openedAt).toLocaleString('es-PE', { 
                          day: '2-digit', 
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit'
                        })}
                      </span>
                      {selectedSession.closedAt && (
                        <>
                          {' '}hasta{' '}
                          <span className="font-medium text-slate-700">
                            {new Date(selectedSession.closedAt).toLocaleString('es-PE', { 
                              day: '2-digit', 
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit', 
                              minute: '2-digit'
                            })}
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* VENTAS */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Ventas</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Ventas Totales</span>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">S/ {stats.totalSales.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* DINERO EN CAJA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Dinero en caja</h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">[+] Dinero Inicial</span>
                        <span className="text-xs font-medium text-slate-900 tabular-nums">S/ {Number(selectedSession.initialCash).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-600">[+] Ventas en efectivo</span>
                        <span className="text-xs font-medium text-slate-900 tabular-nums">S/ {stats.cashInSales.toFixed(2)}</span>
                      </div>
                      {stats.totalIncome > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-emerald-600">[+] Ingresos adicionales</span>
                          <span className="text-xs font-medium text-emerald-700 tabular-nums">S/ {stats.totalIncome.toFixed(2)}</span>
                        </div>
                      )}
                      {stats.totalExpense > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-red-600">[-] Egresos</span>
                          <span className="text-xs font-medium text-red-700 tabular-nums">S/ {stats.totalExpense.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                        <span className="text-xs font-semibold text-slate-700">[=] Total en Caja</span>
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">S/ {stats.totalInCash.toFixed(2)}</span>
                      </div>
                      
                      {selectedSession.status === 'OPEN' ? (
                        <>
                          <div className="pt-2 border-t border-slate-200 mt-2">
                            <label className="text-xs font-semibold text-slate-700 mb-1.5 block">
                              Efectivo declarado (para cerrar turno)
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={declaredCash}
                              onChange={(e) => setDeclaredCash(e.target.value)}
                              placeholder="Ingresa el efectivo en caja"
                              className="w-full h-9 px-3 text-xs font-medium bg-white border border-slate-200 rounded-lg outline-none transition-all focus:ring-2 focus:ring-slate-300 focus:border-slate-300"
                            />
                          </div>
                          {declaredCash && !isNaN(parseFloat(declaredCash)) && (
                            <div className="flex justify-between items-center pt-1.5">
                              <span className="text-xs font-semibold text-slate-700">Diferencia</span>
                              <span className={`text-sm font-bold tabular-nums ${
                                parseFloat(declaredCash) - stats.totalInCash === 0 
                                  ? 'text-slate-900' 
                                  : parseFloat(declaredCash) - stats.totalInCash > 0 
                                  ? 'text-emerald-600' 
                                  : 'text-red-600'
                              }`}>
                                S/ {(parseFloat(declaredCash) - stats.totalInCash).toFixed(2)}
                              </span>
                            </div>
                          )}
                          <Button
                            onClick={handleCloseSession}
                            disabled={!declaredCash || isNaN(parseFloat(declaredCash)) || isClosing}
                            className="w-full h-9 mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                          >
                            {isClosing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                            Cerrar Turno
                          </Button>
                        </>
                      ) : (
                        <>
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-600">Efectivo declarado</span>
                            <span className="text-xs font-medium text-slate-900 tabular-nums">S/ {stats.declaredCash.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between items-center pt-1.5 border-t border-slate-200">
                            <span className="text-xs font-semibold text-slate-700">Diferencia</span>
                            <span className={`text-sm font-bold tabular-nums ${
                              stats.cashDifference === 0 
                                ? 'text-slate-900' 
                                : stats.cashDifference > 0 
                                ? 'text-emerald-600' 
                                : 'text-red-600'
                            }`}>
                              S/ {stats.cashDifference.toFixed(2)}
                            </span>
                          </div>
                          <Button
                            onClick={generatePDF}
                            disabled={isGeneratingPDF}
                            className="w-full h-9 mt-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold"
                          >
                            {isGeneratingPDF ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                            ) : (
                              <Download className="w-3.5 h-3.5 mr-1.5" />
                            )}
                            Generar PDF del Corte
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* CATEGORÍA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Categoría | Ganancias | Venta Total</h3>
                    <div className="space-y-1.5">
                      {stats.categories.map((cat) => (
                        <div key={cat.name} className="flex justify-between items-center gap-2">
                          <span className="text-xs text-slate-700 flex-1 min-w-0 truncate">{cat.name}</span>
                          <span className="text-xs font-medium text-slate-900 w-20 text-right tabular-nums">S/ {cat.profit.toFixed(2)}</span>
                          <span className="text-xs font-medium text-slate-900 w-20 text-right tabular-nums">S/ {cat.total.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* IMPUESTOS */}
                  <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-sm">
                    <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Impuestos cobrados</h3>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-slate-600">Impuestos cobrados (IGV)</span>
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">S/ {stats.igv.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* GANANCIA */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 mb-3">Ganancia</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Ganancia con impuesto</span>
                        <span className="text-sm text-slate-700">{stats.profitWithTax.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">Ganancia sin impuesto</span>
                        <span className="text-sm text-slate-700">{stats.profitWithoutTax.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* RESUMEN DE VENTAS */}
                  <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                    <h3 className="text-sm font-black text-slate-900 mb-3">Resumen de ventas</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">[+] Ventas en efectivo</span>
                        <span className="text-sm text-slate-700">{(stats.paymentMethods.get('CASH') || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">[+] Ventas con Tarjeta</span>
                        <span className="text-sm text-slate-700">{(stats.paymentMethods.get('CARD') || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">[+] Ventas con Transferencia</span>
                        <span className="text-sm text-slate-700">{(stats.paymentMethods.get('TRANSFER') || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">[+] Ventas con Yape</span>
                        <span className="text-sm text-slate-700">{(stats.paymentMethods.get('YAPE') || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">[+] Ventas con Plin</span>
                        <span className="text-sm text-slate-700">{(stats.paymentMethods.get('PLIN') || 0).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">[+] Ventas con Puntos</span>
                        <span className="text-sm text-slate-700">{(stats.paymentMethods.get('POINTS') || 0).toFixed(2)}</span>
                      </div>
                      <div className="h-px bg-slate-200 my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-700">[=] Total Ventas</span>
                        <span className="text-sm text-slate-700">{stats.totalSales.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </>
        )}
        </div>
      </div>
    </div>
  );
}
