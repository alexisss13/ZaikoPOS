'use client';

import { Account, JournalEntry } from '../useAccountingLogic';
import { Download02Icon, PrinterIcon, Calendar03Icon, ArrowLeft01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx-js-style';

interface CashFlowProps {
  accounts: Account[];
  journalEntries: JournalEntry[];
  isMobile?: boolean;
  onBack?: () => void;
}

export function CashFlow({ accounts, journalEntries, isMobile = false, onBack }: CashFlowProps) {
  const currentDate = new Date();
  const periodText = currentDate.toLocaleDateString('es-PE', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Cuentas de efectivo (Caja y Bancos - código 101)
  const cashAccounts = accounts.filter(a => a.code.startsWith('101') && a.isActive);
  const totalCash = cashAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  // Analizar movimientos de efectivo del período
  const cashMovements = journalEntries
    .filter(entry => !entry.isReversed)
    .flatMap(entry => 
      entry.lines
        .filter(line => line.account.code.startsWith('101'))
        .map(line => ({
          date: entry.entryDate,
          description: entry.description,
          account: line.account.name,
          debit: Number(line.debit),
          credit: Number(line.credit),
          amount: Number(line.debit) - Number(line.credit),
        }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Clasificar flujos
  const operatingInflows = cashMovements.filter(m => m.amount > 0 && m.debit > 0);
  const operatingOutflows = cashMovements.filter(m => m.amount < 0 && m.credit > 0);

  const totalOperatingInflows = operatingInflows.reduce((sum, m) => sum + m.amount, 0);
  const totalOperatingOutflows = Math.abs(operatingOutflows.reduce((sum, m) => sum + m.amount, 0));
  const netOperatingCashFlow = totalOperatingInflows - totalOperatingOutflows;

  // Saldo inicial (estimado como saldo actual menos movimientos del período)
  const totalPeriodMovement = cashMovements.reduce((sum, m) => sum + m.amount, 0);
  const initialBalance = totalCash - totalPeriodMovement;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    const primaryColor: [number, number, number] = [30, 41, 59];
    const emeraldColor: [number, number, number] = [16, 185, 129];
    const redColor: [number, number, number] = [239, 68, 68];
    const blueColor: [number, number, number] = [59, 130, 246];
    const amberColor: [number, number, number] = [251, 191, 36];
    const grayColor: [number, number, number] = [148, 163, 184];

    // Header con fondo
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('FLUJO DE EFECTIVO', 105, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Estado de Flujos de Efectivo', 105, 22, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Período: ${periodText}`, 105, 28, { align: 'center' });

    let yPos = 45;

    // Saldo Inicial
    doc.setFillColor(226, 232, 240); // slate-200
    doc.rect(14, yPos - 3, 182, 8, 'F');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Saldo Inicial de Efectivo', 20, yPos);
    doc.text(`S/ ${initialBalance.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 12;

    // ENTRADAS
    doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.rect(14, yPos - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ENTRADAS DE EFECTIVO', 16, yPos);
    yPos += 10;

    if (operatingInflows.length === 0) {
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin entradas de efectivo', 20, yPos);
      yPos += 5;
    } else {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      operatingInflows.slice(0, 15).forEach(m => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(m.description.substring(0, 55), 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
        doc.text(`+${m.amount.toFixed(2)}`, 190, yPos, { align: 'right' });
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'normal');
        yPos += 4;
      });
      if (operatingInflows.length > 15) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(`... y ${operatingInflows.length - 15} movimientos más`, 20, yPos);
        yPos += 5;
      }
    }

    doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.rect(14, yPos - 1, 182, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL ENTRADAS', 20, yPos + 3);
    doc.text(`S/ ${totalOperatingInflows.toFixed(2)}`, 190, yPos + 3, { align: 'right' });
    yPos += 15;

    // SALIDAS
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFillColor(redColor[0], redColor[1], redColor[2]);
    doc.rect(14, yPos - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('SALIDAS DE EFECTIVO', 16, yPos);
    yPos += 10;

    if (operatingOutflows.length === 0) {
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin salidas de efectivo', 20, yPos);
      yPos += 5;
    } else {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      operatingOutflows.slice(0, 15).forEach(m => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(m.description.substring(0, 55), 20, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(redColor[0], redColor[1], redColor[2]);
        doc.text(`-${Math.abs(m.amount).toFixed(2)}`, 190, yPos, { align: 'right' });
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.setFont('helvetica', 'normal');
        yPos += 4;
      });
      if (operatingOutflows.length > 15) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
        doc.text(`... y ${operatingOutflows.length - 15} movimientos más`, 20, yPos);
        yPos += 5;
      }
    }

    doc.setFillColor(redColor[0], redColor[1], redColor[2]);
    doc.rect(14, yPos - 1, 182, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL SALIDAS', 20, yPos + 3);
    doc.text(`S/ ${totalOperatingOutflows.toFixed(2)}`, 190, yPos + 3, { align: 'right' });
    yPos += 15;

    // FLUJO NETO
    const flowColor = netOperatingCashFlow >= 0 ? blueColor : amberColor;
    doc.setFillColor(...flowColor);
    doc.rect(14, yPos - 3, 182, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('FLUJO NETO DEL PERÍODO', 20, yPos + 2);
    doc.text(`${netOperatingCashFlow >= 0 ? '+' : ''}S/ ${netOperatingCashFlow.toFixed(2)}`, 190, yPos + 2, { align: 'right' });
    yPos += 15;

    // SALDO FINAL
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(14, yPos - 3, 182, 11, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('SALDO FINAL DE EFECTIVO', 20, yPos + 3);
    doc.text(`S/ ${totalCash.toFixed(2)}`, 190, yPos + 3, { align: 'right' });

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Generado el ${new Date().toLocaleString('es-PE')}`, 105, 294, { align: 'center' });
    }

    doc.save(`flujo-efectivo-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    const data: any[] = [];
    
    const headerStyle = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E293B" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    const emeraldHeaderStyle = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "10B981" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const redHeaderStyle = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "EF4444" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const flowStyle = netOperatingCashFlow >= 0 ? {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "3B82F6" } },
      alignment: { horizontal: "left", vertical: "center" }
    } : {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "FBBF24" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const totalStyle = {
      font: { bold: true, sz: 13, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E293B" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const numberStyle = {
      font: { sz: 9 },
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: "#,##0.00"
    };

    const textStyle = {
      font: { sz: 9 },
      alignment: { horizontal: "left", vertical: "center" }
    };

    // Título
    data.push([
      { v: 'FLUJO DE EFECTIVO', s: headerStyle },
      { v: '', s: headerStyle }
    ]);
    data.push([
      { v: 'Estado de Flujos de Efectivo', s: { font: { sz: 10 }, alignment: { horizontal: "center" } } },
      { v: '', s: {} }
    ]);
    data.push([
      { v: `Período: ${periodText}`, s: { font: { sz: 9, italic: true }, alignment: { horizontal: "center" } } },
      { v: '', s: {} }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // Saldo Inicial
    data.push([
      { v: 'Saldo Inicial de Efectivo', s: { font: { bold: true, sz: 10 }, fill: { fgColor: { rgb: "E2E8F0" } } } },
      { v: initialBalance, s: { ...numberStyle, font: { bold: true, sz: 10 }, fill: { fgColor: { rgb: "E2E8F0" } } } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // ENTRADAS
    data.push([
      { v: 'ENTRADAS DE EFECTIVO', s: emeraldHeaderStyle },
      { v: '', s: emeraldHeaderStyle }
    ]);
    
    if (operatingInflows.length === 0) {
      data.push([
        { v: 'Sin entradas de efectivo', s: { font: { italic: true, sz: 9 }, fill: { fgColor: { rgb: "F1F5F9" } } } },
        { v: '', s: {} }
      ]);
    } else {
      operatingInflows.forEach(m => {
        data.push([
          { v: m.description, s: textStyle },
          { v: m.amount, s: { ...numberStyle, font: { sz: 9, color: { rgb: "10B981" } } } }
        ]);
      });
    }
    
    data.push([
      { v: 'TOTAL ENTRADAS', s: { ...totalStyle, fill: { fgColor: { rgb: "10B981" } } } },
      { v: totalOperatingInflows, s: { ...numberStyle, font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "10B981" } } } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // SALIDAS
    data.push([
      { v: 'SALIDAS DE EFECTIVO', s: redHeaderStyle },
      { v: '', s: redHeaderStyle }
    ]);
    
    if (operatingOutflows.length === 0) {
      data.push([
        { v: 'Sin salidas de efectivo', s: { font: { italic: true, sz: 9 }, fill: { fgColor: { rgb: "F1F5F9" } } } },
        { v: '', s: {} }
      ]);
    } else {
      operatingOutflows.forEach(m => {
        data.push([
          { v: m.description, s: textStyle },
          { v: Math.abs(m.amount), s: { ...numberStyle, font: { sz: 9, color: { rgb: "EF4444" } } } }
        ]);
      });
    }
    
    data.push([
      { v: 'TOTAL SALIDAS', s: { ...totalStyle, fill: { fgColor: { rgb: "EF4444" } } } },
      { v: totalOperatingOutflows, s: { ...numberStyle, font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "EF4444" } } } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // FLUJO NETO
    data.push([
      { v: 'FLUJO NETO DEL PERÍODO', s: flowStyle },
      { v: netOperatingCashFlow, s: { ...numberStyle, ...flowStyle } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // SALDO FINAL
    data.push([
      { v: 'SALDO FINAL DE EFECTIVO', s: totalStyle },
      { v: totalCash, s: { ...numberStyle, ...totalStyle } }
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    
    ws['!cols'] = [
      { wch: 55 },
      { wch: 15 }
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Flujo de Efectivo');
    XLSX.writeFile(wb, `flujo-efectivo-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isMobile) {
    return (
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
            >
              <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
            </button>
          )}
          <div className="flex-1 text-center">
            <h2 className="text-lg font-black text-slate-900">Flujo de Efectivo</h2>
            <p className="text-xs text-slate-500">Estado de Flujos de Efectivo</p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-1">
              <Calendar03Icon className="w-3.5 h-3.5" />
              <span>Período: {periodText}</span>
            </div>
          </div>
          <div className="w-10" />
        </div>

        {/* Action Buttons */}
        <div className="bg-white border-b border-slate-200 px-4 py-2 flex gap-2">
          <Button
            onClick={handleExportPDF}
            variant="outline"
            className="flex-1 h-9 text-xs rounded-xl"
          >
            <Download02Icon className="w-4 h-4 mr-1.5" />
            PDF
          </Button>
          <Button
            onClick={handleExportExcel}
            variant="outline"
            className="flex-1 h-9 text-xs rounded-xl"
          >
            <Download02Icon className="w-4 h-4 mr-1.5" />
            Excel
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-slate-50">
          {/* Saldo Inicial */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-slate-700">Saldo Inicial de Efectivo</span>
              <span className="text-sm font-bold text-slate-900">S/ {initialBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* ENTRADAS DE EFECTIVO */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
              <h3 className="text-sm font-black text-emerald-900">ENTRADAS DE EFECTIVO</h3>
            </div>
            
            <div className="p-4 space-y-2">
              {operatingInflows.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Sin entradas de efectivo</p>
              ) : (
                operatingInflows.slice(0, 10).map((movement, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 truncate">{movement.description}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(movement.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-emerald-600 ml-2">
                      +S/ {movement.amount.toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-emerald-50 px-4 py-3 border-t border-emerald-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-emerald-900">TOTAL ENTRADAS</span>
                <span className="text-sm font-black text-emerald-900">S/ {totalOperatingInflows.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* SALIDAS DE EFECTIVO */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100">
              <h3 className="text-sm font-black text-red-900">SALIDAS DE EFECTIVO</h3>
            </div>
            
            <div className="p-4 space-y-2">
              {operatingOutflows.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Sin salidas de efectivo</p>
              ) : (
                operatingOutflows.slice(0, 10).map((movement, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 truncate">{movement.description}</p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(movement.date).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
                      </p>
                    </div>
                    <span className="text-xs font-bold text-red-600 ml-2">
                      -S/ {Math.abs(movement.amount).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-red-50 px-4 py-3 border-t border-red-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-red-900">TOTAL SALIDAS</span>
                <span className="text-sm font-black text-red-900">S/ {totalOperatingOutflows.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* FLUJO NETO */}
          <div className={`rounded-2xl px-4 py-3 ${netOperatingCashFlow >= 0 ? 'bg-blue-500' : 'bg-amber-500'}`}>
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-white">FLUJO NETO DEL PERÍODO</span>
              <span className="text-sm font-black text-white">
                {netOperatingCashFlow >= 0 ? '+' : ''}S/ {netOperatingCashFlow.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Saldo Final */}
          <div className="bg-slate-900 rounded-2xl px-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-white">SALDO FINAL DE EFECTIVO</span>
              <span className="text-sm font-black text-white">S/ {totalCash.toFixed(2)}</span>
            </div>
          </div>

          {/* Cuentas de Efectivo */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold text-slate-700 mb-3">DETALLE DE CUENTAS</p>
            <div className="space-y-2">
              {cashAccounts.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-1.5">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-600 truncate">{acc.name}</p>
                    <p className="text-[10px] text-slate-400">{acc.code}</p>
                  </div>
                  <span className="text-xs font-bold text-slate-900 ml-2">
                    S/ {Number(acc.balance).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop version
  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-slate-900">Flujo de Efectivo</h2>
            <p className="text-sm text-slate-500">Estado de Flujos de Efectivo</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Calendar03Icon className="w-3.5 h-3.5" />
              <span>Período: {periodText}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleExportPDF}
              variant="outline"
              className="h-9 text-xs"
            >
              <Download02Icon className="w-4 h-4 mr-1.5" />
              PDF
            </Button>
            <Button
              onClick={handleExportExcel}
              variant="outline"
              className="h-9 text-xs"
            >
              <Download02Icon className="w-4 h-4 mr-1.5" />
              Excel
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Saldo Inicial */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 px-5 py-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-slate-700">Saldo Inicial de Efectivo</span>
            <span className="text-lg font-bold text-slate-900 tabular-nums">S/ {initialBalance.toFixed(2)}</span>
          </div>
        </div>

        {/* ENTRADAS DE EFECTIVO */}
        <div>
          <div className="bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-100 mb-3">
            <h3 className="text-sm font-black text-emerald-900">ACTIVIDADES DE OPERACIÓN - ENTRADAS</h3>
          </div>
          
          <div className="space-y-1.5 mb-3 max-h-64 overflow-y-auto custom-scrollbar">
            {operatingInflows.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">Sin entradas de efectivo en el período</p>
            ) : (
              operatingInflows.map((movement, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 hover:bg-slate-50 rounded px-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{movement.description}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(movement.date).toLocaleDateString('es-PE')} · {movement.account}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-600 ml-4 tabular-nums">
                    +{movement.amount.toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-emerald-900">TOTAL ENTRADAS</span>
              <span className="text-base font-black text-emerald-900 tabular-nums">S/ {totalOperatingInflows.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* SALIDAS DE EFECTIVO */}
        <div>
          <div className="bg-red-50 rounded-xl px-4 py-2.5 border border-red-100 mb-3">
            <h3 className="text-sm font-black text-red-900">ACTIVIDADES DE OPERACIÓN - SALIDAS</h3>
          </div>
          
          <div className="space-y-1.5 mb-3 max-h-64 overflow-y-auto custom-scrollbar">
            {operatingOutflows.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">Sin salidas de efectivo en el período</p>
            ) : (
              operatingOutflows.map((movement, idx) => (
                <div key={idx} className="flex justify-between items-center py-1.5 hover:bg-slate-50 rounded px-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{movement.description}</p>
                    <p className="text-xs text-slate-400">
                      {new Date(movement.date).toLocaleDateString('es-PE')} · {movement.account}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-red-600 ml-4 tabular-nums">
                    ({Math.abs(movement.amount).toFixed(2)})
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="bg-red-50 rounded-xl px-4 py-3 border border-red-100">
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-red-900">TOTAL SALIDAS</span>
              <span className="text-base font-black text-red-900 tabular-nums">(S/ {totalOperatingOutflows.toFixed(2)})</span>
            </div>
          </div>
        </div>

        {/* FLUJO NETO */}
        <div className={`rounded-xl px-6 py-4 ${netOperatingCashFlow >= 0 ? 'bg-blue-500' : 'bg-amber-500'}`}>
          <div className="flex justify-between items-center">
            <span className="text-lg font-black text-white">FLUJO NETO DEL PERÍODO</span>
            <span className="text-lg font-black text-white tabular-nums">
              {netOperatingCashFlow >= 0 ? '+' : ''}S/ {netOperatingCashFlow.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Saldo Final */}
        <div className="bg-slate-900 rounded-xl px-6 py-4">
          <div className="flex justify-between items-center">
            <span className="text-lg font-black text-white">SALDO FINAL DE EFECTIVO</span>
            <span className="text-lg font-black text-white tabular-nums">S/ {totalCash.toFixed(2)}</span>
          </div>
        </div>

        {/* Detalle de Cuentas */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">DETALLE DE CUENTAS DE EFECTIVO</p>
          <div className="space-y-2">
            {cashAccounts.map(acc => (
              <div key={acc.id} className="flex justify-between items-center py-2 border-b border-slate-200 last:border-0">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-slate-700 truncate">{acc.name}</p>
                  <p className="text-xs text-slate-400">{acc.code}</p>
                </div>
                <span className="text-base font-bold text-slate-900 ml-4 tabular-nums">
                  S/ {Number(acc.balance).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-5">
          <p className="text-xs font-bold text-blue-900 uppercase tracking-wide mb-4">RESUMEN DEL FLUJO</p>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-blue-700 mb-1">Saldo Inicial</p>
              <p className="text-lg font-bold text-blue-900 tabular-nums">S/ {initialBalance.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 mb-1">Entradas</p>
              <p className="text-lg font-bold text-emerald-600 tabular-nums">+S/ {totalOperatingInflows.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 mb-1">Salidas</p>
              <p className="text-lg font-bold text-red-600 tabular-nums">-S/ {totalOperatingOutflows.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-blue-700 mb-1">Saldo Final</p>
              <p className="text-lg font-bold text-blue-900 tabular-nums">S/ {totalCash.toFixed(2)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
