'use client';

import { Account } from '../useAccountingLogic';
import { Download02Icon, PrinterIcon, Calendar03Icon, ArrowLeft01Icon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx-js-style';

interface BalanceSheetProps {
  accounts: Account[];
  isMobile?: boolean;
  onBack?: () => void;
}

export function BalanceSheet({ accounts, isMobile = false, onBack }: BalanceSheetProps) {
  const currentDate = new Date().toLocaleDateString('es-PE', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric' 
  });

  // Clasificar cuentas
  const assets = accounts.filter(a => a.type === 'ASSET' && a.isActive);
  const liabilities = accounts.filter(a => a.type === 'LIABILITY' && a.isActive);
  const equity = accounts.filter(a => a.type === 'EQUITY' && a.isActive);

  // Calcular totales
  const totalAssets = assets.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const totalLiabilities = liabilities.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
  const totalEquity = equity.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);

  // Clasificar activos
  const currentAssets = assets.filter(a => a.code.startsWith('1'));
  const nonCurrentAssets = assets.filter(a => !a.code.startsWith('1'));
  
  const totalCurrentAssets = currentAssets.reduce((sum, acc) => sum + Number(acc.balance), 0);
  const totalNonCurrentAssets = nonCurrentAssets.reduce((sum, acc) => sum + Number(acc.balance), 0);

  // Clasificar pasivos
  const currentLiabilities = liabilities.filter(a => a.code.startsWith('4'));
  const nonCurrentLiabilities = liabilities.filter(a => !a.code.startsWith('4'));
  
  const totalCurrentLiabilities = currentLiabilities.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
  const totalNonCurrentLiabilities = nonCurrentLiabilities.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Configurar colores
    const primaryColor: [number, number, number] = [30, 41, 59];
    const blueColor: [number, number, number] = [59, 130, 246];
    const redColor: [number, number, number] = [239, 68, 68];
    const purpleColor: [number, number, number] = [168, 85, 247];
    const grayColor: [number, number, number] = [148, 163, 184];

    // Header con fondo
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 35, 'F');
    
    // Título principal
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('BALANCE GENERAL', 105, 15, { align: 'center' });
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text('Estado de Situación Financiera', 105, 22, { align: 'center' });
    
    doc.setFontSize(9);
    doc.text(`Al ${currentDate}`, 105, 28, { align: 'center' });

    let yPos = 45;

    // ACTIVOS
    doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Activo Corriente', 16, yPos);
    yPos += 5;

    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    currentAssets.forEach(acc => {
      doc.text(`${acc.code}`, 20, yPos);
      doc.text(acc.name.substring(0, 45), 35, yPos);
      doc.setFont('helvetica', 'bold');
      doc.text(`${Number(acc.balance).toFixed(2)}`, 190, yPos, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      yPos += 5;
    });

    // Subtotal con fondo
    doc.setFillColor(219, 234, 254); // blue-100
    doc.rect(14, yPos - 3, 182, 7, 'F');
    doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Subtotal Corriente', 20, yPos);
    doc.text(`S/ ${totalCurrentAssets.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 10;

    // Activo No Corriente
    if (nonCurrentAssets.length > 0) {
      doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
      doc.setFontSize(10);
      doc.text('Activo No Corriente', 16, yPos);
      yPos += 5;

      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      nonCurrentAssets.forEach(acc => {
        doc.text(`${acc.code}`, 20, yPos);
        doc.text(acc.name.substring(0, 45), 35, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`${Number(acc.balance).toFixed(2)}`, 190, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });

      doc.setFillColor(219, 234, 254);
      doc.rect(14, yPos - 3, 182, 7, 'F');
      doc.setTextColor(blueColor[0], blueColor[1], blueColor[2]);
      doc.setFont('helvetica', 'bold');
      doc.text('Subtotal No Corriente', 20, yPos);
      doc.text(`S/ ${totalNonCurrentAssets.toFixed(2)}`, 190, yPos, { align: 'right' });
      yPos += 10;
    }

    // Total Activos con fondo azul
    doc.setFillColor(blueColor[0], blueColor[1], blueColor[2]);
    doc.rect(14, yPos - 4, 182, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL ACTIVOS', 20, yPos);
    doc.text(`S/ ${totalAssets.toFixed(2)}`, 190, yPos, { align: 'right' });
    yPos += 15;

    // Nueva página si es necesario
    if (yPos > 240) {
      doc.addPage();
      yPos = 20;
    }

    // PASIVOS
    doc.setTextColor(redColor[0], redColor[1], redColor[2]);
    doc.setFontSize(10);
    doc.text('Pasivo Corriente', 16, yPos);
    yPos += 5;

    if (currentLiabilities.length === 0) {
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin pasivos corrientes', 20, yPos);
      yPos += 5;
    } else {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      currentLiabilities.forEach(acc => {
        doc.text(`${acc.code}`, 20, yPos);
        doc.text(acc.name.substring(0, 45), 35, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`${Math.abs(Number(acc.balance)).toFixed(2)}`, 190, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });
    }

    // Total Pasivos con fondo rojo
    doc.setFillColor(redColor[0], redColor[1], redColor[2]);
    doc.rect(14, yPos - 1, 182, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PASIVOS', 20, yPos + 3);
    doc.text(`S/ ${totalLiabilities.toFixed(2)}`, 190, yPos + 3, { align: 'right' });
    yPos += 15;

    // PATRIMONIO
    doc.setTextColor(purpleColor[0], purpleColor[1], purpleColor[2]);
    doc.setFontSize(10);
    doc.text('Patrimonio', 16, yPos);
    yPos += 5;

    if (equity.length === 0) {
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.text('Sin cuentas patrimoniales', 20, yPos);
      yPos += 5;
    } else {
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      equity.forEach(acc => {
        doc.text(`${acc.code}`, 20, yPos);
        doc.text(acc.name.substring(0, 45), 35, yPos);
        doc.setFont('helvetica', 'bold');
        doc.text(`${Math.abs(Number(acc.balance)).toFixed(2)}`, 190, yPos, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        yPos += 5;
      });
    }

    // Total Patrimonio con fondo púrpura
    doc.setFillColor(purpleColor[0], purpleColor[1], purpleColor[2]);
    doc.rect(14, yPos - 1, 182, 9, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL PATRIMONIO', 20, yPos + 3);
    doc.text(`S/ ${totalEquity.toFixed(2)}`, 190, yPos + 3, { align: 'right' });
    yPos += 15;

    // TOTAL FINAL con fondo oscuro
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(14, yPos - 2, 182, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('TOTAL PASIVO + PATRIMONIO', 20, yPos + 3);
    doc.text(`S/ ${(totalLiabilities + totalEquity).toFixed(2)}`, 190, yPos + 3, { align: 'right' });

    // Verificación si no cuadra
    if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.01) {
      yPos += 12;
      doc.setFillColor(251, 191, 36); // amber-400
      doc.rect(14, yPos - 3, 182, 8, 'F');
      doc.setTextColor(120, 53, 15); // amber-900
      doc.setFontSize(9);
      doc.text('⚠ Advertencia: El balance no cuadra', 20, yPos);
      doc.text(`Diferencia: S/ ${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toFixed(2)}`, 20, yPos + 4);
    }

    // Footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
      doc.text(`Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Generado el ${new Date().toLocaleString('es-PE')}`, 105, 294, { align: 'center' });
    }

    doc.save(`balance-general-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleExportExcel = () => {
    const data: any[] = [];
    
    // Estilos
    const headerStyle = {
      font: { bold: true, sz: 16, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E293B" } },
      alignment: { horizontal: "center", vertical: "center" }
    };

    const subHeaderStyle = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "3B82F6" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const subHeaderRedStyle = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "EF4444" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const subHeaderPurpleStyle = {
      font: { bold: true, sz: 11, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "A855F7" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const totalStyle = {
      font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } },
      fill: { fgColor: { rgb: "1E293B" } },
      alignment: { horizontal: "left", vertical: "center" }
    };

    const subtotalStyle = {
      font: { bold: true, sz: 10 },
      fill: { fgColor: { rgb: "DBEAFE" } },
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
      { v: 'BALANCE GENERAL', s: headerStyle },
      { v: '', s: headerStyle }
    ]);
    data.push([
      { v: 'Estado de Situación Financiera', s: { font: { sz: 10 }, alignment: { horizontal: "center" } } },
      { v: '', s: {} }
    ]);
    data.push([
      { v: `Al ${currentDate}`, s: { font: { sz: 9, italic: true }, alignment: { horizontal: "center" } } },
      { v: '', s: {} }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // ACTIVOS
    data.push([
      { v: 'ACTIVOS', s: subHeaderStyle },
      { v: '', s: subHeaderStyle }
    ]);
    
    data.push([
      { v: 'Activo Corriente', s: { font: { bold: true, sz: 10 } } },
      { v: '', s: {} }
    ]);
    
    currentAssets.forEach(acc => {
      data.push([
        { v: `${acc.code} - ${acc.name}`, s: textStyle },
        { v: Number(acc.balance), s: numberStyle }
      ]);
    });
    
    data.push([
      { v: 'Subtotal Corriente', s: subtotalStyle },
      { v: totalCurrentAssets, s: { ...numberStyle, ...subtotalStyle } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    if (nonCurrentAssets.length > 0) {
      data.push([
        { v: 'Activo No Corriente', s: { font: { bold: true, sz: 10 } } },
        { v: '', s: {} }
      ]);
      
      nonCurrentAssets.forEach(acc => {
        data.push([
          { v: `${acc.code} - ${acc.name}`, s: textStyle },
          { v: Number(acc.balance), s: numberStyle }
        ]);
      });
      
      data.push([
        { v: 'Subtotal No Corriente', s: subtotalStyle },
        { v: totalNonCurrentAssets, s: { ...numberStyle, ...subtotalStyle } }
      ]);
      data.push([{ v: '', s: {} }, { v: '', s: {} }]);
    }

    data.push([
      { v: 'TOTAL ACTIVOS', s: totalStyle },
      { v: totalAssets, s: { ...numberStyle, ...totalStyle } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // PASIVOS
    data.push([
      { v: 'PASIVOS', s: subHeaderRedStyle },
      { v: '', s: subHeaderRedStyle }
    ]);
    
    data.push([
      { v: 'Pasivo Corriente', s: { font: { bold: true, sz: 10 } } },
      { v: '', s: {} }
    ]);
    
    if (currentLiabilities.length === 0) {
      data.push([
        { v: 'Sin pasivos corrientes', s: { font: { italic: true, sz: 9 }, fill: { fgColor: { rgb: "F1F5F9" } } } },
        { v: '', s: {} }
      ]);
    } else {
      currentLiabilities.forEach(acc => {
        data.push([
          { v: `${acc.code} - ${acc.name}`, s: textStyle },
          { v: Math.abs(Number(acc.balance)), s: numberStyle }
        ]);
      });
    }
    
    data.push([
      { v: 'TOTAL PASIVOS', s: { ...totalStyle, fill: { fgColor: { rgb: "EF4444" } } } },
      { v: totalLiabilities, s: { ...numberStyle, font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "EF4444" } } } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    // PATRIMONIO
    data.push([
      { v: 'PATRIMONIO', s: subHeaderPurpleStyle },
      { v: '', s: subHeaderPurpleStyle }
    ]);
    
    if (equity.length === 0) {
      data.push([
        { v: 'Sin cuentas patrimoniales', s: { font: { italic: true, sz: 9 }, fill: { fgColor: { rgb: "F1F5F9" } } } },
        { v: '', s: {} }
      ]);
    } else {
      equity.forEach(acc => {
        data.push([
          { v: `${acc.code} - ${acc.name}`, s: textStyle },
          { v: Math.abs(Number(acc.balance)), s: numberStyle }
        ]);
      });
    }
    
    data.push([
      { v: 'TOTAL PATRIMONIO', s: { ...totalStyle, fill: { fgColor: { rgb: "A855F7" } } } },
      { v: totalEquity, s: { ...numberStyle, font: { bold: true, sz: 12, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "A855F7" } } } }
    ]);
    data.push([{ v: '', s: {} }, { v: '', s: {} }]);

    data.push([
      { v: 'TOTAL PASIVO + PATRIMONIO', s: totalStyle },
      { v: (totalLiabilities + totalEquity), s: { ...numberStyle, ...totalStyle } }
    ]);

    // Verificación
    if (Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.01) {
      data.push([{ v: '', s: {} }, { v: '', s: {} }]);
      data.push([
        { v: '⚠ Advertencia: El balance no cuadra', s: { font: { bold: true, color: { rgb: "92400E" } }, fill: { fgColor: { rgb: "FEF3C7" } } } },
        { v: `Diferencia: ${Math.abs(totalAssets - (totalLiabilities + totalEquity)).toFixed(2)}`, s: { font: { bold: true, color: { rgb: "92400E" } }, fill: { fgColor: { rgb: "FEF3C7" } } } }
      ]);
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    
    // Ajustar anchos de columna
    ws['!cols'] = [
      { wch: 50 }, // Columna de nombres
      { wch: 15 }  // Columna de valores
    ];

    // Merge cells para títulos
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // Título principal
      { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } }, // Subtítulo
      { s: { r: 2, c: 0 }, e: { r: 2, c: 1 } }  // Fecha
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Balance General');
    XLSX.writeFile(wb, `balance-general-${new Date().toISOString().split('T')[0]}.xlsx`);
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
            <h2 className="text-lg font-black text-slate-900">Balance General</h2>
            <p className="text-xs text-slate-500">Estado de Situación Financiera</p>
            <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400 mt-1">
              <Calendar03Icon className="w-3.5 h-3.5" />
              <span>Al {currentDate}</span>
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
          {/* ACTIVOS */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-blue-50 px-4 py-3 border-b border-blue-100">
              <h3 className="text-sm font-black text-blue-900">ACTIVOS</h3>
            </div>
            
            {/* Activo Corriente */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-bold text-slate-700 mb-2">Activo Corriente</p>
              {currentAssets.map(acc => (
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
              <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                <span className="text-xs font-bold text-slate-700">Subtotal Corriente</span>
                <span className="text-xs font-bold text-blue-600">S/ {totalCurrentAssets.toFixed(2)}</span>
              </div>
            </div>

            {/* Activo No Corriente */}
            {nonCurrentAssets.length > 0 && (
              <div className="p-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-700 mb-2">Activo No Corriente</p>
                {nonCurrentAssets.map(acc => (
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
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Subtotal No Corriente</span>
                  <span className="text-xs font-bold text-blue-600">S/ {totalNonCurrentAssets.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Total Activos */}
            <div className="bg-blue-50 px-4 py-3 border-t border-blue-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-blue-900">TOTAL ACTIVOS</span>
                <span className="text-sm font-black text-blue-900">S/ {totalAssets.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* PASIVOS */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-red-50 px-4 py-3 border-b border-red-100">
              <h3 className="text-sm font-black text-red-900">PASIVOS</h3>
            </div>
            
            {/* Pasivo Corriente */}
            <div className="p-4 space-y-2">
              <p className="text-xs font-bold text-slate-700 mb-2">Pasivo Corriente</p>
              {currentLiabilities.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Sin pasivos corrientes</p>
              ) : (
                <>
                  {currentLiabilities.map(acc => (
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
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-xs font-bold text-slate-700">Subtotal Corriente</span>
                    <span className="text-xs font-bold text-red-600">S/ {totalCurrentLiabilities.toFixed(2)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Pasivo No Corriente */}
            {nonCurrentLiabilities.length > 0 && (
              <div className="p-4 border-t border-slate-100 space-y-2">
                <p className="text-xs font-bold text-slate-700 mb-2">Pasivo No Corriente</p>
                {nonCurrentLiabilities.map(acc => (
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
                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                  <span className="text-xs font-bold text-slate-700">Subtotal No Corriente</span>
                  <span className="text-xs font-bold text-red-600">S/ {totalNonCurrentLiabilities.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Total Pasivos */}
            <div className="bg-red-50 px-4 py-3 border-t border-red-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-red-900">TOTAL PASIVOS</span>
                <span className="text-sm font-black text-red-900">S/ {totalLiabilities.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* PATRIMONIO */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="bg-purple-50 px-4 py-3 border-b border-purple-100">
              <h3 className="text-sm font-black text-purple-900">PATRIMONIO</h3>
            </div>
            
            <div className="p-4 space-y-2">
              {equity.length === 0 ? (
                <p className="text-xs text-slate-400 py-2">Sin cuentas patrimoniales</p>
              ) : (
                equity.map(acc => (
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

            {/* Total Patrimonio */}
            <div className="bg-purple-50 px-4 py-3 border-t border-purple-100">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-purple-900">TOTAL PATRIMONIO</span>
                <span className="text-sm font-black text-purple-900">S/ {totalEquity.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* TOTAL PASIVO + PATRIMONIO */}
          <div className="bg-slate-900 rounded-2xl px-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-black text-white">TOTAL PASIVO + PATRIMONIO</span>
              <span className="text-sm font-black text-white">S/ {(totalLiabilities + totalEquity).toFixed(2)}</span>
            </div>
          </div>

          {/* Verificación */}
          {Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.01 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-amber-900">⚠️ Advertencia</p>
              <p className="text-xs text-amber-700 mt-1">
                El balance no cuadra. Diferencia: S/ {Math.abs(totalAssets - (totalLiabilities + totalEquity)).toFixed(2)}
              </p>
            </div>
          )}
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
            <h2 className="text-xl font-black text-slate-900">Balance General</h2>
            <p className="text-sm text-slate-500">Estado de Situación Financiera</p>
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
              <Calendar03Icon className="w-3.5 h-3.5" />
              <span>Al {currentDate}</span>
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

      {/* Content - Two columns */}
      <div className="grid grid-cols-2 divide-x divide-slate-200">
        {/* Left: ACTIVOS */}
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 rounded-xl px-4 py-2.5 border border-blue-100">
            <h3 className="text-sm font-black text-blue-900">ACTIVOS</h3>
          </div>

          {/* Activo Corriente */}
          <div>
            <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Activo Corriente</p>
            <div className="space-y-1.5">
              {currentAssets.map(acc => (
                <div key={acc.id} className="flex justify-between items-center py-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 truncate">{acc.name}</p>
                    <p className="text-[10px] text-slate-400">{acc.code}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 ml-4 tabular-nums">
                    {Number(acc.balance).toFixed(2)}
                  </span>
                </div>
              ))}
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                <span className="text-sm font-bold text-slate-700">Subtotal Corriente</span>
                <span className="text-sm font-bold text-blue-600 tabular-nums">{totalCurrentAssets.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Activo No Corriente */}
          {nonCurrentAssets.length > 0 && (
            <div>
              <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Activo No Corriente</p>
              <div className="space-y-1.5">
                {nonCurrentAssets.map(acc => (
                  <div key={acc.id} className="flex justify-between items-center py-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 truncate">{acc.name}</p>
                      <p className="text-[10px] text-slate-400">{acc.code}</p>
                    </div>
                    <span className="text-sm font-semibold text-slate-900 ml-4 tabular-nums">
                      {Number(acc.balance).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                  <span className="text-sm font-bold text-slate-700">Subtotal No Corriente</span>
                  <span className="text-sm font-bold text-blue-600 tabular-nums">{totalNonCurrentAssets.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Total Activos */}
          <div className="bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-blue-900">TOTAL ACTIVOS</span>
              <span className="text-base font-black text-blue-900 tabular-nums">S/ {totalAssets.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Right: PASIVOS + PATRIMONIO */}
        <div className="p-6 space-y-4">
          {/* PASIVOS */}
          <div>
            <div className="bg-red-50 rounded-xl px-4 py-2.5 border border-red-100 mb-4">
              <h3 className="text-sm font-black text-red-900">PASIVOS</h3>
            </div>

            {/* Pasivo Corriente */}
            <div className="mb-4">
              <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Pasivo Corriente</p>
              {currentLiabilities.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">Sin pasivos corrientes</p>
              ) : (
                <div className="space-y-1.5">
                  {currentLiabilities.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center py-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{acc.name}</p>
                        <p className="text-[10px] text-slate-400">{acc.code}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 ml-4 tabular-nums">
                        {Math.abs(Number(acc.balance)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Subtotal Corriente</span>
                    <span className="text-sm font-bold text-red-600 tabular-nums">{totalCurrentLiabilities.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Pasivo No Corriente */}
            {nonCurrentLiabilities.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">Pasivo No Corriente</p>
                <div className="space-y-1.5">
                  {nonCurrentLiabilities.map(acc => (
                    <div key={acc.id} className="flex justify-between items-center py-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-700 truncate">{acc.name}</p>
                        <p className="text-[10px] text-slate-400">{acc.code}</p>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 ml-4 tabular-nums">
                        {Math.abs(Number(acc.balance)).toFixed(2)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                    <span className="text-sm font-bold text-slate-700">Subtotal No Corriente</span>
                    <span className="text-sm font-bold text-red-600 tabular-nums">{totalNonCurrentLiabilities.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Total Pasivos */}
            <div className="bg-red-50 rounded-xl px-4 py-3 border border-red-100 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-red-900">TOTAL PASIVOS</span>
                <span className="text-sm font-black text-red-900 tabular-nums">S/ {totalLiabilities.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* PATRIMONIO */}
          <div>
            <div className="bg-purple-50 rounded-xl px-4 py-2.5 border border-purple-100 mb-4">
              <h3 className="text-sm font-black text-purple-900">PATRIMONIO</h3>
            </div>

            <div className="space-y-1.5 mb-4">
              {equity.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">Sin cuentas patrimoniales</p>
              ) : (
                equity.map(acc => (
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

            {/* Total Patrimonio */}
            <div className="bg-purple-50 rounded-xl px-4 py-3 border border-purple-100 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-black text-purple-900">TOTAL PATRIMONIO</span>
                <span className="text-sm font-black text-purple-900 tabular-nums">S/ {totalEquity.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* TOTAL PASIVO + PATRIMONIO */}
          <div className="bg-slate-900 rounded-xl px-4 py-3">
            <div className="flex justify-between items-center">
              <span className="text-base font-black text-white">TOTAL PASIVO + PATRIMONIO</span>
              <span className="text-base font-black text-white tabular-nums">S/ {(totalLiabilities + totalEquity).toFixed(2)}</span>
            </div>
          </div>

          {/* Verificación */}
          {Math.abs(totalAssets - (totalLiabilities + totalEquity)) > 0.01 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <p className="text-sm font-bold text-amber-900">⚠️ Advertencia</p>
              <p className="text-sm text-amber-700 mt-1">
                El balance no cuadra. Diferencia: S/ {Math.abs(totalAssets - (totalLiabilities + totalEquity)).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
