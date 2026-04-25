'use client';

import { useState } from 'react';
import { useCashSessionsLogic, CashSession } from './useCashSessionsLogic';
import {
  ContactIcon,
  ArrowLeft01Icon,
  Download01Icon,
  Loading03Icon,
  Calendar03Icon,
  Money01Icon,
  Invoice01Icon,
  ChartUpIcon,
  Wallet01Icon,
  FilterIcon,
  Calendar01Icon,
  TimeScheduleIcon,
  Cancel01Icon,
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };

type MobileView = 'list' | 'detail';

export default function CashSessionsMobile() {
  const logic = useCashSessionsLogic();
  const {
    isLoading,
    filteredSessions,
    selectedSession,
    setSelectedSession,
    declaredCash,
    setDeclaredCash,
    isClosing,
    isGeneratingPDF,
    setIsGeneratingPDF,
    statusFilter,
    setStatusFilter,
    showAllHistory,
    setShowAllHistory,
    toggleHistoryMode,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    getSessionStats,
    getSessionNumber,
    handleCloseSession,
  } = logic;

  const [currentView, setCurrentView] = useState<MobileView>('list');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleSelectSession = (session: CashSession) => {
    haptic(8);
    setSelectedSession(session);
    setCurrentView('detail');
  };

  const handleBack = () => {
    haptic(8);
    setCurrentView('list');
    setSelectedSession(null);
  };

  const generatePDF = async () => {
    if (!selectedSession) return;

    setIsGeneratingPDF(true);
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF('p', 'mm', 'a4');
      const stats = getSessionStats(selectedSession);
      const sessionIndex = filteredSessions.findIndex(s => s.id === selectedSession.id);
      const sessionNumber = getSessionNumber(sessionIndex);

      // Header
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

      // Info del turno
      doc.setTextColor(51, 65, 85);
      doc.setFontSize(10);
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
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
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
      doc.text('[+] Dinero Inicial', 20, yPos);
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

      // Resumen de ventas
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.text('RESUMEN DE VENTAS', 15, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      const paymentMethods = [
        { label: 'Efectivo', key: 'CASH' },
        { label: 'Tarjeta', key: 'CARD' },
        { label: 'Transferencia', key: 'TRANSFER' },
        { label: 'Yape', key: 'YAPE' },
        { label: 'Plin', key: 'PLIN' },
        { label: 'Puntos', key: 'POINTS' },
      ];

      paymentMethods.forEach(pm => {
        doc.text(`[+] Ventas con ${pm.label}`, 20, yPos);
        doc.text(`S/ ${(stats.paymentMethods.get(pm.key) || 0).toFixed(2)}`, 195, yPos, { align: 'right' });
        yPos += 5;
      });

      doc.setFont('helvetica', 'bold');
      doc.text('[=] Total Ventas', 20, yPos);
      doc.text(`S/ ${stats.totalSales.toFixed(2)}`, 195, yPos, { align: 'right' });

      doc.save(`corte-turno-${sessionNumber}-${new Date().toISOString().split('T')[0]}.pdf`);
      
      haptic(20);
    } catch (error) {
      console.error('Error al generar PDF:', error);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  function renderListView() {
    const openSessions = filteredSessions.filter(s => s.status === 'OPEN').length;
    const closedSessions = filteredSessions.filter(s => s.status === 'CLOSED').length;

    return (
      <div 
        className="flex flex-col h-full w-full gap-3"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
          contain: 'layout style paint',
        }}
      >
        {/* Header compacto */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-slate-900 leading-tight">Corte de Turnos</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] font-bold text-emerald-600">
                {openSessions} abiertos
              </span>
              <span className="text-[11px] text-slate-300">•</span>
              <span className="text-[11px] font-bold text-slate-600">
                {closedSessions} cerrados
              </span>
            </div>
          </div>
          
          <button
            onClick={() => { haptic(8); setShowDatePicker(true); }}
            className="h-10 w-10 p-0 flex items-center justify-center rounded-xl text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
          >
            <FilterIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Filtros */}
        <div className="flex gap-2 overflow-x-auto pb-2 hide-scrollbar">
          <button
            onClick={() => { haptic(8); setStatusFilter('ALL'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => { haptic(8); setStatusFilter('OPEN'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'OPEN'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Abiertos
          </button>
          <button
            onClick={() => { haptic(8); setStatusFilter('CLOSED'); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
              statusFilter === 'CLOSED'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            Cerrados
          </button>
        </div>

        {/* Lista de turnos */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pb-20">
          {filteredSessions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-3">
                <ContactIcon className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-sm font-bold text-slate-900 mb-1">Sin turnos</p>
              <p className="text-xs text-slate-500">No hay turnos registrados</p>
            </div>
          ) : (
            filteredSessions.map((session, index) => {
              const sessionNumber = getSessionNumber(index);
              const stats = getSessionStats(session);
              const hasNegativeDifference = session.status === 'CLOSED' && stats.cashDifference < 0;
              
              return (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session)}
                  className={`w-full rounded-2xl border p-4 shadow-sm active:scale-[0.98] transition-transform text-left ${
                    hasNegativeDifference 
                      ? 'bg-red-50 border-red-200' 
                      : 'bg-white border-slate-200'
                  }`}
                  style={{ 
                    WebkitTapHighlightColor: 'transparent',
                    transform: 'translateZ(0)',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-bold text-slate-900">Corte N°{sessionNumber}</span>
                        <Badge className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                          session.status === 'OPEN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {session.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
                        </Badge>
                        {hasNegativeDifference && (
                          <Badge className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-red-600 text-white">
                            FALTA DINERO
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500">{session.user.name} · {session.branch.name}</p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {new Date(session.openedAt).toLocaleString('es-PE', { 
                          day: '2-digit', 
                          month: 'short',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100">
                    <div className="bg-blue-50 rounded-lg p-2">
                      <p className="text-[10px] font-bold text-blue-700 mb-0.5">VENTAS</p>
                      <p className="text-sm font-bold text-blue-900">S/ {stats.totalSales.toFixed(2)}</p>
                    </div>
                    <div className={`rounded-lg p-2 ${
                      hasNegativeDifference ? 'bg-red-100' : 'bg-emerald-50'
                    }`}>
                      <p className={`text-[10px] font-bold mb-0.5 ${
                        hasNegativeDifference ? 'text-red-700' : 'text-emerald-700'
                      }`}>
                        {hasNegativeDifference ? 'DIFERENCIA' : 'EN CAJA'}
                      </p>
                      <p className={`text-sm font-bold ${
                        hasNegativeDifference ? 'text-red-900' : 'text-emerald-900'
                      }`}>
                        S/ {hasNegativeDifference ? stats.cashDifference.toFixed(2) : stats.totalInCash.toFixed(2)}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    );
  }

  function renderDetailView() {
    if (!selectedSession) return null;

    const stats = getSessionStats(selectedSession);
    const sessionIndex = filteredSessions.findIndex(s => s.id === selectedSession.id);
    const sessionNumber = getSessionNumber(sessionIndex);

    return (
      <div 
        className="fixed inset-0 bg-white z-50 flex flex-col"
        style={{
          WebkitTapHighlightColor: 'transparent',
          transform: 'translateZ(0)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          <button
            onClick={handleBack}
            className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
          >
            <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex-1">
            <h2 className="text-lg font-black text-slate-900">Corte N°{sessionNumber}</h2>
            <p className="text-xs text-slate-500">
              {selectedSession.status === 'OPEN' ? 'Turno abierto' : 'Turno cerrado'}
            </p>
          </div>
          <Badge className={`text-[9px] font-semibold px-2 py-1 rounded-full ${
            selectedSession.status === 'OPEN'
              ? 'bg-emerald-100 text-emerald-700'
              : 'bg-slate-100 text-slate-700'
          }`}>
            {selectedSession.status === 'OPEN' ? 'ABIERTO' : 'CERRADO'}
          </Badge>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50">
          {/* Alerta de diferencia negativa */}
          {selectedSession.status === 'CLOSED' && stats.cashDifference < 0 && (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-red-900 mb-1">Falta Dinero en Caja</h3>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Hay una diferencia negativa de <span className="font-bold">S/ {Math.abs(stats.cashDifference).toFixed(2)}</span>. 
                    El efectivo declarado es menor al esperado.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info del turno */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-600 leading-relaxed">
              Abierto por <span className="font-bold text-slate-900">{selectedSession.user.name}</span> en{' '}
              <span className="font-semibold text-slate-700">{selectedSession.branch.name}</span>
              <br />
              <span className="text-slate-400">
                {new Date(selectedSession.openedAt).toLocaleString('es-PE')}
              </span>
              {selectedSession.closedAt && (
                <>
                  <br />
                  Cerrado el{' '}
                  <span className="text-slate-400">
                    {new Date(selectedSession.closedAt).toLocaleString('es-PE')}
                  </span>
                </>
              )}
            </p>
          </div>

          {/* Ventas */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Invoice01Icon className="w-5 h-5 text-white" />
              </div>
              <span className="text-sm font-bold text-white/90">Ventas Totales</span>
            </div>
            <p className="text-3xl font-bold text-white">S/ {stats.totalSales.toFixed(2)}</p>
          </div>

          {/* Dinero en caja */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Wallet01Icon className="w-4 h-4" />
              Dinero en Caja
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">[+] Dinero Inicial</span>
                <span className="text-xs font-bold text-slate-900">S/ {Number(selectedSession.initialCash).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">[+] Ventas en efectivo</span>
                <span className="text-xs font-bold text-slate-900">S/ {stats.cashInSales.toFixed(2)}</span>
              </div>
              {stats.totalIncome > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-emerald-600">[+] Ingresos</span>
                  <span className="text-xs font-bold text-emerald-700">S/ {stats.totalIncome.toFixed(2)}</span>
                </div>
              )}
              {stats.totalExpense > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs text-red-600">[-] Egresos</span>
                  <span className="text-xs font-bold text-red-700">S/ {stats.totalExpense.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-xs font-bold text-slate-700">[=] Total en Caja</span>
                <span className="text-sm font-bold text-slate-900">S/ {stats.totalInCash.toFixed(2)}</span>
              </div>

              {selectedSession.status === 'OPEN' ? (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Efectivo declarado (para cerrar turno)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={declaredCash}
                    onChange={(e) => setDeclaredCash(e.target.value)}
                    placeholder="Ingresa el efectivo en caja"
                    className="w-full h-11 px-4 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300"
                  />
                  {declaredCash && !isNaN(parseFloat(declaredCash)) && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700">Diferencia</span>
                      <span className={`text-sm font-bold ${
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
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                  >
                    {isClosing && <Loading03Icon className="w-4 h-4 mr-2 animate-spin" />}
                    Cerrar Turno
                  </Button>
                </div>
              ) : (
                <div className="pt-3 border-t border-slate-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">Efectivo declarado</span>
                    <span className="text-xs font-bold text-slate-900">S/ {stats.declaredCash.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-700">Diferencia</span>
                    <span className={`text-sm font-bold ${
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
                    className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl"
                  >
                    {isGeneratingPDF ? (
                      <Loading03Icon className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download01Icon className="w-4 h-4 mr-2" />
                    )}
                    Generar PDF del Corte
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <Money01Icon className="w-4 h-4" />
              Métodos de Pago
            </h3>
            <div className="space-y-2">
              {[
                { label: 'Efectivo', key: 'CASH', color: 'emerald' },
                { label: 'Tarjeta', key: 'CARD', color: 'blue' },
                { label: 'Transferencia', key: 'TRANSFER', color: 'purple' },
                { label: 'Yape', key: 'YAPE', color: 'violet' },
                { label: 'Plin', key: 'PLIN', color: 'pink' },
                { label: 'Puntos', key: 'POINTS', color: 'amber' },
              ].map(pm => {
                const amount = stats.paymentMethods.get(pm.key) || 0;
                if (amount === 0) return null;
                
                return (
                  <div key={pm.key} className="flex justify-between items-center">
                    <span className="text-xs text-slate-600">{pm.label}</span>
                    <span className="text-xs font-bold text-slate-900">S/ {amount.toFixed(2)}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Impuestos y Ganancia */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-30">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-2">
              <ChartUpIcon className="w-4 h-4 " />
              Impuestos y Ganancia
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">IGV Cobrado</span>
                <span className="text-xs font-bold text-slate-900">S/ {stats.igv.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs text-slate-600">Ganancia con impuesto</span>
                <span className="text-xs font-bold text-slate-900">S/ {stats.profitWithTax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Ganancia sin impuesto</span>
                <span className="text-xs font-bold text-slate-900">S/ {stats.profitWithoutTax.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Modal de filtros de fecha */}
      {showDatePicker && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-50 flex items-end"
          onClick={() => { haptic(8); setShowDatePicker(false); }}
        >
          <div 
            className="bg-white w-full rounded-t-3xl p-6 space-y-4 animate-in slide-in-from-bottom duration-300"
            onClick={(e) => e.stopPropagation()}
            style={{
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-900">Filtrar por Fecha</h3>
              <button
                onClick={() => { haptic(8); setShowDatePicker(false); }}
                className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center active:scale-95 transition-transform"
              >
                <Cancel01Icon className="w-5 h-5 text-slate-600"/>
              </button>
            </div>

            {/* Botones rápidos */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Accesos Rápidos</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    haptic(8);
                    const today = new Date().toISOString().split('T')[0];
                    setDateFrom(today);
                    setDateTo(today);
                    setShowAllHistory(false);
                    setShowDatePicker(false);
                  }}
                  className="px-4 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Calendar01Icon className="w-4 h-4" />
                  <span>Hoy</span>
                </button>
                <button
                  onClick={() => {
                    haptic(8);
                    setShowAllHistory(true);
                    setShowDatePicker(false);
                  }}
                  className="px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <TimeScheduleIcon className="w-4 h-4" />
                  <span>Todo</span>
                </button>
              </div>
            </div>

            {/* Selectores de fecha */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Rango Personalizado</p>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Desde</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => {
                    setDateFrom(e.target.value);
                    setShowAllHistory(false);
                  }}
                  className="w-full h-12 px-4 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Hasta</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => {
                    setDateTo(e.target.value);
                    setShowAllHistory(false);
                  }}
                  className="w-full h-12 px-4 text-sm font-medium bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-slate-300"
                />
              </div>
            </div>

            {/* Botón aplicar */}
            <button
              onClick={() => { haptic(8); setShowDatePicker(false); }}
              className="w-full h-12 bg-slate-900 text-white mb-25 font-bold rounded-xl active:scale-95 transition-transform"
            >
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      {isLoading ? (
        <div className="flex flex-col h-full w-full overflow-y-auto pb-24 px-4 pt-4 gap-4 bg-slate-50">
          <div className="flex flex-col gap-1.5">
            <div className="h-6 bg-slate-200 rounded-lg w-48 animate-pulse" />
            <div className="h-4 bg-slate-200 rounded w-32 animate-pulse" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-slate-200 p-4 h-24 animate-pulse" />
            ))}
          </div>
        </div>
      ) : currentView === 'list' ? (
        renderListView()
      ) : currentView === 'detail' ? (
        renderDetailView()
      ) : null}
    </>
  );


}
