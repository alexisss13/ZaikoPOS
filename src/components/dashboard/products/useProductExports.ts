'use client';

import { toast } from 'sonner';
import type { Product, Branch } from './types';

interface UseProductExportsProps {
  products?: Product[];
  branches?: Branch[];
}

export function useProductExports({ products, branches }: UseProductExportsProps) {
  const exportToExcel = async (onDone?: () => void) => {
    if (!products?.length) { toast.error('No hay productos para exportar'); return; }
    try {
      toast.loading('Generando archivo Excel...', { id: 'export-excel' });
      const XLSX = await import('xlsx-js-style');
      const headers = ['ID', 'Nombre', 'SKU', 'Código de Barras', 'Categoría', 'Proveedor', 'Precio Base', 'Costo', 'Precio Mayorista', 'Cant. Mín. Mayorista', 'Stock Mínimo'];
      branches?.forEach(b => headers.push(`Stock ${b.name}`));
      headers.push('Activo', 'Imágenes');
      const exportData = products.map(p => {
        const row: any[] = [p.id, p.title, p.sku || '', p.barcode || '', p.category?.name || '', p.supplier?.name || '', p.basePrice, p.cost || 0, p.wholesalePrice || '', p.wholesaleMinCount || '', p.minStock || 5];
        branches?.forEach(b => { const s = p.branchStocks?.find(bs => bs.branchId === b.id); row.push(s?.quantity || 0); });
        row.push(p.active ? 'Sí' : 'No', p.images?.join(', ') || '');
        return row;
      });
      const ws = XLSX.utils.aoa_to_sheet([headers, ...exportData]);
      const hStyle = { fill: { fgColor: { rgb: '1E293B' } }, font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 }, alignment: { horizontal: 'center', vertical: 'center' } };
      headers.forEach((_, i) => { const c = XLSX.utils.encode_cell({ r: 0, c: i }); if (ws[c]) ws[c].s = hStyle; });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Productos');
      const colW = [{ wch: 36 }, { wch: 40 }, { wch: 15 }, { wch: 18 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 20 }, { wch: 12 }];
      branches?.forEach(() => colW.push({ wch: 15 }));
      colW.push({ wch: 10 }, { wch: 50 });
      ws['!cols'] = colW;
      XLSX.writeFile(wb, `productos-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Archivo Excel generado correctamente', { id: 'export-excel' });
      onDone?.();
    } catch { toast.error('Error al generar el archivo Excel', { id: 'export-excel' }); }
  };

  const exportToPDF = async (onDone?: () => void) => {
    if (!products?.length) { toast.error('No hay productos para exportar'); return; }
    try {
      toast.loading('Generando archivo PDF...', { id: 'export-pdf' });
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFillColor(30, 41, 59); doc.rect(0, 0, 297, 35, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('CATÁLOGO DE PRODUCTOS', 148.5, 15, { align: 'center' });
      doc.setFontSize(10); doc.setFont('helvetica', 'normal');
      doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 148.5, 25, { align: 'center' });
      const tableData = products.map(p => {
        const totalStock = p.branchStocks?.reduce((s, bs) => s + bs.quantity, 0) || 0;
        return [p.title, p.sku || '-', p.barcode || '-', p.category?.name || '-', `S/ ${Number(p.basePrice).toFixed(2)}`, totalStock.toString(), p.active ? 'Sí' : 'No'];
      });
      autoTable(doc, { startY: 40, head: [['Producto', 'SKU', 'Código', 'Categoría', 'Precio', 'Stock', 'Activo']], body: tableData, theme: 'grid', headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 9 }, styles: { fontSize: 8, cellPadding: 2 }, columnStyles: { 0: { cellWidth: 70 }, 1: { cellWidth: 30 }, 2: { cellWidth: 35 }, 3: { cellWidth: 40 }, 4: { cellWidth: 25, halign: 'right' }, 5: { cellWidth: 20, halign: 'center' }, 6: { cellWidth: 20, halign: 'center' } } });
      doc.save(`productos-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Archivo PDF generado correctamente', { id: 'export-pdf' });
      onDone?.();
    } catch { toast.error('Error al generar el archivo PDF', { id: 'export-pdf' }); }
  };

  const exportKardexToExcel = async (kardexProduct: Product | null, kardexMovements: any[]) => {
    if (!kardexProduct || !kardexMovements.length) { alert('No hay movimientos para exportar'); return; }
    try {
      const XLSX = await import('xlsx-js-style');
      const headers = ['Fecha', 'Tipo', 'Motivo', 'Cantidad', 'Stock Anterior', 'Stock Nuevo', 'Sucursal', 'Usuario'];
      const typeMap: any = { INPUT: 'Entrada', OUTPUT: 'Salida', ADJUSTMENT: 'Ajuste', SALE_POS: 'Venta POS', SALE_ECOMMERCE: 'Venta Online', PURCHASE: 'Compra', TRANSFER: 'Traslado' };
      const data = kardexMovements.map(m => [new Date(m.createdAt).toLocaleString('es-PE'), typeMap[m.type] || m.type, m.reason || '', m.type === 'ADJUSTMENT' ? (m.currentStock - m.previousStock) : (['INPUT', 'PURCHASE', 'TRANSFER'].includes(m.type) ? m.quantity : -m.quantity), m.previousStock, m.currentStock, m.branch?.name || '', m.user?.name || '']);
      const ws = XLSX.utils.aoa_to_sheet([[`KARDEX - ${kardexProduct.title}`], [], headers, ...data]);
      const tStyle = { fill: { fgColor: { rgb: '1E293B' } }, font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 }, alignment: { horizontal: 'center', vertical: 'center' } };
      if (ws['A1']) ws['A1'].s = tStyle;
      ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }];
      const hStyle = { fill: { fgColor: { rgb: '1E293B' } }, font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 }, alignment: { horizontal: 'center', vertical: 'center' } };
      headers.forEach((_, i) => { const c = XLSX.utils.encode_cell({ r: 2, c: i }); if (ws[c]) ws[c].s = hStyle; });
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kardex');
      ws['!cols'] = [{ wch: 20 }, { wch: 18 }, { wch: 30 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 20 }, { wch: 20 }];
      XLSX.writeFile(wb, `kardex-${kardexProduct.title.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success('Kardex exportado correctamente', { id: 'kardex-excel' });
    } catch { toast.error('Error al generar el archivo Excel', { id: 'kardex-excel' }); }
  };

  const exportKardexToPDF = async (kardexProduct: Product | null, kardexMovements: any[]) => {
    if (!kardexProduct || !kardexMovements.length) { alert('No hay movimientos para exportar'); return; }
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;
      const doc = new jsPDF('l', 'mm', 'a4');
      doc.setFillColor(30, 41, 59); doc.rect(0, 0, 297, 35, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(20); doc.setFont('helvetica', 'bold');
      doc.text('KARDEX DE PRODUCTO', 148.5, 12, { align: 'center' });
      doc.setFontSize(12); doc.setFont('helvetica', 'normal');
      doc.text(kardexProduct.title, 148.5, 22, { align: 'center' });
      doc.setFontSize(9); doc.text(`Generado: ${new Date().toLocaleDateString('es-PE')}`, 148.5, 29, { align: 'center' });
      const typeMap: any = { INPUT: 'Entrada', OUTPUT: 'Salida', ADJUSTMENT: 'Ajuste', SALE_POS: 'Venta POS', SALE_ECOMMERCE: 'Venta Online', PURCHASE: 'Compra', TRANSFER: 'Traslado' };
      const tableData = kardexMovements.map(m => [new Date(m.createdAt).toLocaleDateString('es-PE'), typeMap[m.type] || m.type, m.reason || '-', m.type === 'ADJUSTMENT' ? (m.currentStock - m.previousStock).toString() : (['INPUT', 'PURCHASE', 'TRANSFER'].includes(m.type) ? `+${m.quantity}` : `-${m.quantity}`), m.previousStock.toString(), m.currentStock.toString(), m.branch?.name || '-', m.user?.name || '-']);
      autoTable(doc, { startY: 40, head: [['Fecha', 'Tipo', 'Motivo', 'Cant.', 'Había', 'Hay', 'Sucursal', 'Usuario']], body: tableData, theme: 'grid', headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', halign: 'center', fontSize: 9 }, styles: { fontSize: 8, cellPadding: 2 }, columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 25 }, 2: { cellWidth: 50 }, 3: { cellWidth: 15, halign: 'center' }, 4: { cellWidth: 15, halign: 'center' }, 5: { cellWidth: 15, halign: 'center' }, 6: { cellWidth: 30 }, 7: { cellWidth: 30 } } });
      doc.save(`kardex-${kardexProduct.title.replace(/[^a-z0-9]/gi, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Kardex exportado correctamente', { id: 'kardex-pdf' });
    } catch { toast.error('Error al generar el archivo PDF', { id: 'kardex-pdf' }); }
  };

  return { exportToExcel, exportToPDF, exportKardexToExcel, exportKardexToPDF };
}
