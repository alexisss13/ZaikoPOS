'use client';

import { Account } from '../useAccountingLogic';
import { Download02Icon, PrinterIcon, Calendar03Icon, ArrowLeft01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx-js-style';

interface IncomeStatementProps {
  accounts: Account[];
  isMobile?: boolean;
  onBack?: () => void;
}

export function IncomeStatement({ accounts, isMobile = false, onBack }: IncomeStatementProps) {
  const currentDate = new Date();
  const periodText = currentDate.toLocaleDateString('es-PE', { 
    month: 'long', 
    year: 'numeric' 
  });

  // Clasificar cuentas
  const revenues = accounts.filter(a => a.type === 'REVENUE' && a.isActive);
  const expenses = accounts.filter(a => a.type === 'EXPENSE' && a.isActive);

  // Calcular totales (los ingresos y gastos tienen saldo negativo en contabilidad)
  const totalRevenues = revenues.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
  const totalExpenses = expenses.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
  const netIncome = totalRevenues - totalExpenses;
  const profitMargin = totalRevenues > 0 ? (netIncome / totalRevenues) * 100 : 0;

  // Clasificar gastos
  const operatingExpenses = expenses.filter(a => a.code.startsWith('6'));
  const financialExpenses = expenses.filter(a => a.code.startsWith('67'));
  const otherExpenses = expenses.filter(a => !a.code.startsWith('6') && !a.code.startsWith('67'));

  const totalOperatingExpenses = operatingExpenses.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
  const totalFinancialExpenses = financialExpenses.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
  const totalOtherExpenses = otherExpenses.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);

  const operatingIncome = totalRevenues - totalOperatingExpenses;

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    const primaryColor: [number, number, number] = [30, 41, 59];
    const emeraldColor: [number, number, number] = [16, 185, 129];
    const orangeColor: [number, number, number] = [249, 115, 22];
    const redColor: [number, number, number] = [239, 68, 68];
    const grayColor: [number, number, number] = [148, 163, 184];

    // Header con fondo
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('ESTADO DE RESULTADOS', 105, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Estado de Ganancias y Pérdidas', 105, 22, { align: 'center' });
    doc.setFontSize(9);
    doc.text(`Período: ${periodText}`, 105, 28, { align: 'center' });

    let yPos = 45;

    // INGRESOS
    doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.rect(14, yPos - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('INGRESOS', 16, yPos);
    yPos += 10;

    if (revenues.length === 0) {
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin ingresos registrados', 20, yPos);
      yPos += 5;
    } else {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      revenues.forEach(acc => {
        doc.text(`${acc.code}`, 20, yPos);
        doc.text(acc.name.substring(0, 45), 35, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`${Math.abs(Number(acc.balance)).toFixed(2)}`, 190, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });
    }

    doc.setFillColor(emeraldColor[0], emeraldColor[1], emeraldColor[2]);
    doc.rect(14, yPos - 1, 182, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL INGRESOS', 20, yPos + 3);
    doc.text(`S/ ${totalRevenues.toFixed(2)}`, 190, yPos + 3, { align: 'right' });
    yPos += 15;

    // GASTOS OPERATIVOS
    doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.rect(14, yPos - 5, 182, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('GASTOS OPERATIVOS', 16, yPos);
    yPos += 10;

    if (operatingExpenses.length === 0) {
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin gastos operativos', 20, yPos);
      yPos += 5;
    } else {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      operatingExpenses.forEach(acc => {
        doc.text(`${acc.code}`, 20, yPos);
        doc.text(acc.name.substring(0, 45), 35, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`(${Math.abs(Number(acc.balance)).toFixed(2)})`, 190, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });
    }

    doc.setFillColor(orangeColor[0], orangeColor[1], orangeColor[2]);
    doc.rect(14, yPos - 1, 182, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL GASTOS OPERATIVOS', 20, yPos + 3);
    doc.text(`(S/ ${totalOperatingExpenses.toFixed(2)})`, 190, yPos + 3, { align: 'right' });
    yPos += 15;

    // UTILIDAD OPERATIVA
    doc.setFillColor(59, 130, 246); // blue-500
    doc.rect(14, yPos - 3, 182, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('UTILIDAD OPERATIVA', 20, yPos + 2);
    doc.text(`S/ ${operatingIncome.toFixed(2)}`, 190, yPos + 2, { align: 'right' });
    yPos += 15;

    // GASTOS FINANCIEROS
    if (financialExpenses.length > 0) {
      doc.setFillColor(redColor[0], redColor[1], redColor[2]);
      doc.rect(14, yPos - 5, 182, 8, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.text('GASTOS FINANCIEROS', 16, yPos);
      yPos += 10;

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      financialExpenses.forEach(acc => {
        doc.text(`${acc.code}`, 20, yPos);
        doc.text(acc.name.substring(0, 45), 35, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`(${Math.abs(Number(acc.balance)).toFixed(2)})`, 190, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });

      doc.setFillColor(redColor[0], redColor[1], redColor[2]);
      doc.rect(14, yPos - 1, 182, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTAL GASTOS FINANCIEROS', 20, yPos + 3);
      doc.text(`(S/ ${totalFinancialExpenses.toFixed(2)})`, 190, yPos + 3, { align: 'right' });
      yPos += 15;
    }

    // UTILIDAD NETA
    const netColor = netIncome >= 0 ? emeraldColor : redColor;
    doc.setFillColor(...netColor);
    doc.rect(14, yPos - 3, 182, 12, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('UTILIDAD NETA', 20, yPos + 3);
    doc.text(`S/ ${netIncome.toFixed(2)}`, 190, yPos + 3, { align: 'right' });
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Margen de Utilidad: ${profitMargin.toFixed(2)}%`, 20, yPos + 8);

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Generado el ${new Date().toLocaleString('es-PE')}`, 105, 294, { align: 'center' });
    }

    doc.save(`estado-resultados-${new Date().toISOString().split('T')[0]}.pdf`);
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

    const orangeHeaderStyle = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "F97316" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const totalStyle = {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E293B" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const netIncomeStyle = netIncome >= 0 ? {
      font: { bold: true, sz: 13, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "10B981" } },
      alignment: { horizontal: "left", vertical: "center" }
    } : {
      font: { bold: true, sz: 13, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "EF4444" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const numberStyle = {
      font: { sz: 10 },
      alignment: { horizontal: "right", vertical: "center" },
      numFmt: "#,##0.00"
    };

    const textStyle = {
      font: { sz: 10 },
      alignment: { horizontal: "left", vertical: "center" }
    };

    // Título
    data.push([
      { v: 'ESTADO DE RESULTADOS', s: headerStyle },
      { v: '', s: headerStyle }
    ]);
    data.push([
      { v: 'Estado de Ganancias y Pérdidas', s: { font: { sz: 10 }, alignment: { horizontal: "center" } } },
      { v: '', s: {} }
    ]);
    data.push([
      { v: `Período: ${periodText}`, s: { font: { sz: 9, italic: true }, alignment: { horizontal: "center" } } },
      { v: '', s: {} }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // INGRESOS
    data.push([
      { v: 'INGRESOS', s: emeraldHeaderStyle },
      { v: '', s: emeraldHeaderStyle }
    ]);
    
    if (revenues.length === 0) {
      data.push([
        { v: 'Sin ingresos registrados', s: { font: { italic: true, sz: 9 }, fill: { fgColor: { rgb: "F1F5F9" } } } },
        { v: '', s: {} }
      ]);
    } else {
      revenues.forEach(acc => {
        data.push([
          { v: `${acc.code} - ${acc.name}`, s: textStyle },
          { v: Math.abs(Number(acc.balance)), s: numberStyle }
        ]);
      });
    }
    
    data.push([
      { v: 'TOTAL INGRESOS', s: { ...totalStyle, fill: { fgColor: { rgb: "10B981" } } } },
      { v: totalRevenues, s: { ...numberStyle, font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "10B981" } } } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // GASTOS OPERATIVOS
    data.push([
      { v: 'GASTOS OPERATIVOS', s: orangeHeaderStyle },
      { v: '', s: orangeHeaderStyle }
    ]);
    
    if (operatingExpenses.length === 0) {
      data.push([
        { v: 'Sin gastos operativos', s: { font: { italic: true, sz: 9 }, fill: { fgColor: { rgb: "F1F5F9" } } } },
        { v: '', s: {} }
      ]);
    } else {
      operatingExpenses.forEach(acc => {
        data.push([
          { v: `${acc.code} - ${acc.name}`, s: textStyle },
          { v: Math.abs(Number(acc.balance)), s: numberStyle }
        ]);
      });
    }
    
    data.push([
      { v: 'TOTAL GASTOS OPERATIVOS', s: { ...totalStyle, fill: { fgColor: { rgb: "F97316" } } } },
      { v: totalOperatingExpenses, s: { ...numberStyle, font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "F97316" } } } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // UTILIDAD OPERATIVA
    data.push([
      { v: 'UTILIDAD OPERATIVA', s: { ...totalStyle, fill: { fgColor: { rgb: "3B82F6" } } } },
      { v: operatingIncome, s: { ...numberStyle, font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "3B82F6" } } } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // UTILIDAD NETA
    data.push([
      { v: 'UTILIDAD NETA', s: netIncomeStyle },
      { v: netIncome, s: { ...numberStyle, ...netIncomeStyle } }
    ]);
    data.push([
      { v: `Margen de Utilidad: ${profitMargin.toFixed(2)}%`, s: { font: { sz: 9, italic: true } } },
      { v: '', s: {} }
    ]);

    const ws = XLSX.utils.aoa_to_sheet(data);
    
    ws['!cols'] = [
      { wch: 50 },
      { wch: 15 }
    ];

    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } },
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Estado de Resultados');
    XLSX.writeFile(wb, `estado-resultados-${new Date().toISOString().split('T')[0]}.xlsx`);
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
            <h2 className="text-lg font-black text-slate-900">Estado de Resultados</h2>
            <p className="text-xs text-slate-500">Estado de Ganancias y Pérdidas</p>
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
          {/* INGRESOS */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-emerald-50 px-4 py-3 border-b border-emerald-100">
              <h3 className="text-sm font-black text-emerald-900">INGRESOS</h3>
            </div>
            
            <div className="p-4 space-y-2">
              {revenues.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Sin ingresos registrados</p>
              ) : (
                revenues.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.code}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 ml-2">
                      S/ {Math.abs(Number(acc.balance)).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-emerald-50 px-4 py-3 border-t border-emerald-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-emerald-900">TOTAL INGRESOS</span>
                <span className="text-sm font-black text-emerald-900">S/ {totalRevenues.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* GASTOS OPERATIVOS */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-orange-50 px-4 py-3 border-b border-orange-100">
              <h3 className="text-sm font-black text-orange-900">GASTOS OPERATIVOS</h3>
            </div>
            
            <div className="p-4 space-y-2">
              {operatingExpenses.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Sin gastos operativos</p>
              ) : (
                operatingExpenses.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.code}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 ml-2">
                      S/ {Math.abs(Number(acc.balance)).toFixed(2)}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="bg-orange-50 px-4 py-3 border-t border-orange-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-orange-900">TOTAL GASTOS OPERATIVOS</span>
                <span className="text-sm font-black text-orange-900">S/ {totalOperatingExpenses.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* UTILIDAD OPERATIVA */}
          <div className="bg-blue-50 rounded-2xl px-4 py-3 border border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-blue-900">UTILIDAD OPERATIVA</span>
              <span className="text-sm font-black text-blue-900">S/ {operatingIncome.toFixed(2)}</span>
            </div>
          </div>

          {/* GASTOS FINANCIEROS */}
          {financialExpenses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-red-50 px-4 py-3 border-b border-red-100">
                <h3 className="text-sm font-black text-red-900">GASTOS FINANCIEROS</h3>
              </div>
              
              <div className="p-4 space-y-2">
                {financialExpenses.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.code}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 ml-2">
                      S/ {Math.abs(Number(acc.balance)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-red-50 px-4 py-3 border-t border-red-100">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-red-900">TOTAL GASTOS FINANCIEROS</span>
                  <span className="text-sm font-black text-red-900">S/ {totalFinancialExpenses.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* OTROS GASTOS */}
          {otherExpenses.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                <h3 className="text-sm font-black text-slate-700">OTROS GASTOS</h3>
              </div>
              
              <div className="p-4 space-y-2">
                {otherExpenses.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center py-1.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-slate-600 truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.code}</p>
                    </div>
                    <span className="text-xs font-bold text-slate-900 ml-2">
                      S/ {Math.abs(Number(acc.balance)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-slate-100 px-4 py-3 border-t border-slate-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-black text-slate-700">TOTAL OTROS GASTOS</span>
                  <span className="text-sm font-black text-slate-700">S/ {totalOtherExpenses.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* UTILIDAD NETA */}
          <div className={`rounded-2xl px-4 py-4 ${netIncome >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-black text-white">UTILIDAD NETA</span>
              <span className="text-sm font-black text-white">S/ {netIncome.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-white/80">
              <span>Margen de Utilidad</span>
              <span className="font-bold">{profitMargin.toFixed(2)}%</span>
            </div>
          </div>

          {/* Resumen */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-2">
            <p className="text-xs font-bold text-slate-700 mb-3">RESUMEN</p>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-600">Total Ingresos</span>
              <span className="text-xs font-bold text-emerald-600">S/ {totalRevenues.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-xs text-slate-600">Total Gastos</span>
              <span className="text-xs font-bold text-red-600">S/ {totalExpenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center py-1 pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-900">Resultado</span>
              <span className={`text-xs font-bold ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                S/ {netIncome.toFixed(2)}
              </span>
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
            <h2 className="text-xl font-black text-slate-900">Estado de Resultados</h2>
            <p className="text-sm text-slate-500">Estado de Ganancias y Pérdidas</p>
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
        {/* INGRESOS */}
        <div>
          <div className="bg-emerald-50 rounded-xl px-4 py-2.5 border border-emerald-100 mb-3">
            <h3 className="text-sm font-black text-emerald-900">INGRESOS</h3>
          </div>
          
          <div className="space-y-1.5 mb-3">
            {revenues.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">Sin ingresos registrados</p>
            ) : (
              revenues.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{acc.name}</p>
                    <p className="text-[10px] text-slate-400">{acc.code}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 ml-4 tabular-nums">
                    {Math.abs(Number(acc.balance)).toFixed(2)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-emerald-900">TOTAL INGRESOS</span>
              <span className="text-base font-black text-emerald-900 tabular-nums">S/ {totalRevenues.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* GASTOS OPERATIVOS */}
        <div>
          <div className="bg-orange-50 rounded-xl px-4 py-2.5 border border-orange-100 mb-3">
            <h3 className="text-sm font-black text-orange-900">GASTOS OPERATIVOS</h3>
          </div>
          
          <div className="space-y-1.5 mb-3">
            {operatingExpenses.length === 0 ? (
              <p className="text-sm text-slate-400 py-2">Sin gastos operativos</p>
            ) : (
              operatingExpenses.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{acc.name}</p>
                    <p className="text-[10px] text-slate-400">{acc.code}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 ml-4 tabular-nums">
                    ({Math.abs(Number(acc.balance)).toFixed(2)})
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="bg-orange-50 rounded-xl px-4 py-3 border border-orange-100">
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-orange-900">TOTAL GASTOS OPERATIVOS</span>
              <span className="text-base font-black text-orange-900 tabular-nums">(S/ {totalOperatingExpenses.toFixed(2)})</span>
            </div>
          </div>
        </div>

        {/* UTILIDAD OPERATIVA */}
        <div className="bg-blue-50 rounded-xl px-4 py-3 border-2 border-blue-200">
          <div className="flex justify-between items-center">
            <span className="text-base font-black text-blue-900">UTILIDAD OPERATIVA</span>
            <span className="text-base font-black text-blue-900 tabular-nums">S/ {operatingIncome.toFixed(2)}</span>
          </div>
        </div>

        {/* GASTOS FINANCIEROS */}
        {financialExpenses.length > 0 && (
          <div>
            <div className="bg-red-50 rounded-xl px-4 py-2.5 border border-red-100 mb-3">
              <h3 className="text-sm font-black text-red-900">GASTOS FINANCIEROS</h3>
            </div>
            
            <div className="space-y-1.5 mb-3">
              {financialExpenses.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{acc.name}</p>
                    <p className="text-[10px] text-slate-400">{acc.code}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 ml-4 tabular-nums">
                    ({Math.abs(Number(acc.balance)).toFixed(2)})
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-red-50 rounded-xl px-4 py-3 border border-red-100">
              <div className="flex justify-between items-center">
                <span className="text-base font-black text-red-900">TOTAL GASTOS FINANCIEROS</span>
                <span className="text-base font-black text-red-900 tabular-nums">(S/ {totalFinancialExpenses.toFixed(2)})</span>
              </div>
            </div>
          </div>
        )}

        {/* OTROS GASTOS */}
        {otherExpenses.length > 0 && (
          <div>
            <div className="bg-slate-100 rounded-xl px-4 py-2.5 border border-slate-200 mb-3">
              <h3 className="text-sm font-black text-slate-700">OTROS GASTOS</h3>
            </div>
            
            <div className="space-y-1.5 mb-3">
              {otherExpenses.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{acc.name}</p>
                    <p className="text-[10px] text-slate-400">{acc.code}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 ml-4 tabular-nums">
                    ({Math.abs(Number(acc.balance)).toFixed(2)})
                  </span>
                </div>
              ))}
            </div>

            <div className="bg-slate-100 rounded-xl px-4 py-3 border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-base font-black text-slate-700">TOTAL OTROS GASTOS</span>
                <span className="text-base font-black text-slate-700 tabular-nums">(S/ {totalOtherExpenses.toFixed(2)})</span>
              </div>
            </div>
          </div>
        )}

        {/* UTILIDAD NETA */}
        <div className={`rounded-xl px-6 py-4 ${netIncome >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-black text-white">UTILIDAD NETA</span>
            <span className="text-lg font-black text-white tabular-nums">S/ {netIncome.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-sm text-white/90">
            <span>Margen de Utilidad</span>
            <span className="font-bold">{profitMargin.toFixed(2)}%</span>
          </div>
        </div>

        {/* Resumen */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-5">
          <p className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-4">RESUMEN DEL PERÍODO</p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Ingresos</p>
              <p className="text-xl font-bold text-emerald-600 tabular-nums">S/ {totalRevenues.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Total Gastos</p>
              <p className="text-xl font-bold text-red-600 tabular-nums">S/ {totalExpenses.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-1">Resultado Neto</p>
              <p className={`text-xl font-bold tabular-nums ${netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                S/ {netIncome.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
