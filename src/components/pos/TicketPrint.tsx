'use client';

import { useEffect, useState } from 'react';
import { jsPDF } from 'jspdf';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface TicketPrintProps {
  saleData: {
    code: string;
    createdAt: string;
    subtotal: number;
    discount: number;
    total: number;
    tenderedAmount: number;
    changeAmount: number;
    pointsEarned?: number;
    items: Array<{
      productName: string;
      variantName?: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    payments: Array<{
      method: string;
      amount: number;
    }>;
    customer?: {
      name: string;
      docNumber: string;
    } | null;
    cashier: {
      name: string;
    };
    branch: {
      name: string;
      address?: string;
      phone?: string;
      logos?: any;
    };
    business: {
      name: string;
      ruc: string;
    };
  };
  onComplete: () => void;
}

export function TicketPrint({ saleData, onComplete }: TicketPrintProps) {
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(true);

  useEffect(() => {
    generatePDF();
    
    // Cleanup: revocar URL cuando se desmonte el componente
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, []);

  const generatePDF = async () => {
    try {
      // Calcular altura aproximada del contenido
      const baseHeight = 120; // Altura base para encabezado y pie
      const itemHeight = saleData.items.length * 12; // Aproximadamente 12mm por item
      const customerHeight = saleData.customer ? 10 : 0;
      const pointsHeight = (saleData.pointsEarned && saleData.pointsEarned > 0) ? 15 : 0;
      const logoHeight = saleData.branch.logos?.isotipo ? 30 : 0;
      const estimatedHeight = baseHeight + itemHeight + customerHeight + pointsHeight + logoHeight;

      // Crear PDF con ancho de 80mm y altura calculada
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, estimatedHeight]
      });

      const igv = saleData.total * 0.18;
      const baseImponible = saleData.total - igv;

      let y = 5; // Posición Y inicial
      const leftMargin = 5;
      const rightMargin = 75;
      const centerX = 40;

      // Configurar fuente
      doc.setFont('courier', 'normal');

      // Logo (si existe)
      if (saleData.branch.logos?.isotipo) {
        try {
          doc.addImage(saleData.branch.logos.isotipo, 'PNG', 27.5, y, 25, 25);
          y += 28;
        } catch (e) {
          // Si falla la imagen, continuar sin ella
        }
      }

      // Encabezado
      doc.setFontSize(12);
      doc.setFont('courier', 'bold');
      doc.text(saleData.business.name, centerX, y, { align: 'center' });
      y += 5;

      doc.setFontSize(9);
      doc.setFont('courier', 'normal');
      doc.text(saleData.branch.name, centerX, y, { align: 'center' });
      y += 4;

      doc.setFontSize(7);
      if (saleData.branch.address) {
        doc.text(saleData.branch.address, centerX, y, { align: 'center' });
        y += 3;
      }
      if (saleData.branch.phone) {
        doc.text(`Tel: ${saleData.branch.phone}`, centerX, y, { align: 'center' });
        y += 3;
      }
      doc.text(`RUC: ${saleData.business.ruc}`, centerX, y, { align: 'center' });
      y += 5;

      // Línea separadora
      doc.setLineWidth(0.5);
      doc.line(leftMargin, y, rightMargin, y);
      y += 4;

      // Título del ticket
      doc.setFontSize(9);
      doc.setFont('courier', 'bold');
      doc.text('TICKET DE VENTA', centerX, y, { align: 'center' });
      y += 5;

      doc.setFontSize(14);
      doc.text(saleData.code, centerX, y, { align: 'center' });
      y += 6;

      // Línea separadora
      doc.setLineWidth(0.2);
      doc.line(leftMargin, y, rightMargin, y);
      y += 4;

      // Fecha y cajero
      doc.setFontSize(7);
      doc.setFont('courier', 'normal');
      const fecha = new Date(saleData.createdAt).toLocaleString('es-PE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      doc.text('Fecha:', leftMargin, y);
      doc.setFont('courier', 'bold');
      doc.text(fecha, rightMargin, y, { align: 'right' });
      y += 3;

      doc.setFont('courier', 'normal');
      doc.text('Cajero:', leftMargin, y);
      doc.setFont('courier', 'bold');
      doc.text(saleData.cashier.name, rightMargin, y, { align: 'right' });
      y += 3;

      if (saleData.customer) {
        doc.setFont('courier', 'normal');
        doc.text('Cliente:', leftMargin, y);
        doc.setFont('courier', 'bold');
        doc.text(saleData.customer.name, rightMargin, y, { align: 'right' });
        y += 3;

        doc.setFont('courier', 'normal');
        doc.text('Doc:', leftMargin, y);
        doc.setFont('courier', 'bold');
        doc.text(saleData.customer.docNumber, rightMargin, y, { align: 'right' });
        y += 3;
      }
      y += 2;

      // Línea separadora
      doc.setLineWidth(0.2);
      doc.line(leftMargin, y, rightMargin, y);
      y += 4;

      // Items
      doc.setFontSize(8);
      saleData.items.forEach((item) => {
        doc.setFont('courier', 'bold');
        const itemName = item.productName + (item.variantName && item.variantName !== 'Estándar' ? ` (${item.variantName})` : '');
        const lines = doc.splitTextToSize(itemName, 70);
        doc.text(lines, leftMargin, y);
        y += lines.length * 3.5;

        doc.setFontSize(7);
        doc.setFont('courier', 'normal');
        doc.text(`${item.quantity} x S/ ${item.price.toFixed(2)}`, leftMargin, y);
        doc.setFont('courier', 'bold');
        doc.setFontSize(9);
        doc.text(`S/ ${item.subtotal.toFixed(2)}`, rightMargin, y, { align: 'right' });
        y += 5;
        doc.setFontSize(8);
      });

      // Línea separadora
      doc.setFontSize(7);
      doc.setLineWidth(0.2);
      doc.line(leftMargin, y, rightMargin, y);
      y += 4;

      // Totales
      doc.setFont('courier', 'normal');
      doc.text('Subtotal:', leftMargin, y);
      doc.setFont('courier', 'bold');
      doc.text(`S/ ${saleData.subtotal.toFixed(2)}`, rightMargin, y, { align: 'right' });
      y += 3;

      if (saleData.discount > 0) {
        doc.setFont('courier', 'normal');
        doc.text('Descuento:', leftMargin, y);
        doc.setFont('courier', 'bold');
        doc.text(`- S/ ${saleData.discount.toFixed(2)}`, rightMargin, y, { align: 'right' });
        y += 3;
      }

      doc.setFontSize(6);
      doc.setFont('courier', 'normal');
      doc.text('Base Imponible:', leftMargin, y);
      doc.text(`S/ ${baseImponible.toFixed(2)}`, rightMargin, y, { align: 'right' });
      y += 3;

      doc.text('IGV (18%):', leftMargin, y);
      doc.text(`S/ ${igv.toFixed(2)}`, rightMargin, y, { align: 'right' });
      y += 4;

      // Línea doble
      doc.setLineWidth(0.5);
      doc.line(leftMargin, y, rightMargin, y);
      y += 4;

      // Total
      doc.setFontSize(12);
      doc.setFont('courier', 'bold');
      doc.text('TOTAL:', leftMargin, y);
      doc.text(`S/ ${saleData.total.toFixed(2)}`, rightMargin, y, { align: 'right' });
      y += 6;

      // Línea separadora
      doc.setFontSize(7);
      doc.setLineWidth(0.2);
      doc.line(leftMargin, y, rightMargin, y);
      y += 4;

      // Métodos de pago
      doc.setFontSize(9);
      doc.setFont('courier', 'bold');
      doc.text('FORMA DE PAGO', centerX, y, { align: 'center' });
      y += 4;

      doc.setFontSize(8);
      saleData.payments.forEach((payment) => {
        doc.setFont('courier', 'normal');
        doc.text(`${payment.method}:`, leftMargin, y);
        doc.setFont('courier', 'bold');
        doc.text(`S/ ${payment.amount.toFixed(2)}`, rightMargin, y, { align: 'right' });
        y += 3;
      });

      if (saleData.payments.some(p => p.method === 'CASH')) {
        y += 2;
        doc.setLineWidth(0.2);
        doc.line(leftMargin, y, rightMargin, y);
        y += 3;

        doc.setFont('courier', 'normal');
        doc.text('Efectivo recibido:', leftMargin, y);
        doc.setFont('courier', 'bold');
        doc.text(`S/ ${saleData.tenderedAmount.toFixed(2)}`, rightMargin, y, { align: 'right' });
        y += 3;

        doc.setFont('courier', 'normal');
        doc.text('Vuelto:', leftMargin, y);
        doc.setFont('courier', 'bold');
        doc.text(`S/ ${saleData.changeAmount.toFixed(2)}`, rightMargin, y, { align: 'right' });
        y += 3;
      }
      y += 2;

      // Puntos ganados
      if (saleData.pointsEarned && saleData.pointsEarned > 0) {
        doc.setLineWidth(0.2);
        doc.line(leftMargin, y, rightMargin, y);
        y += 4;

        doc.setFontSize(9);
        doc.setFont('courier', 'bold');
        doc.text('PUNTOS GANADOS', centerX, y, { align: 'center' });
        y += 4;

        doc.setFontSize(12);
        doc.text(`+${saleData.pointsEarned} punto${saleData.pointsEarned > 1 ? 's' : ''}`, centerX, y, { align: 'center' });
        y += 4;

        doc.setFontSize(7);
        doc.setFont('courier', 'normal');
        doc.text('¡Sigue acumulando para obtener descuentos!', centerX, y, { align: 'center' });
        y += 4;
      }

      // Línea doble
      doc.setLineWidth(0.5);
      doc.line(leftMargin, y, rightMargin, y);
      y += 4;

      // Mensaje de agradecimiento
      doc.setFontSize(10);
      doc.setFont('courier', 'bold');
      doc.text('¡GRACIAS POR SU COMPRA!', centerX, y, { align: 'center' });
      y += 4;

      doc.setFontSize(9);
      doc.setFont('courier', 'normal');
      doc.text('Vuelva pronto', centerX, y, { align: 'center' });
      y += 5;

      doc.setFontSize(7);
      doc.text('Este documento no tiene validez tributaria', centerX, y, { align: 'center' });
      y += 3;
      doc.text('Para facturación, solicítela en caja', centerX, y, { align: 'center' });
      y += 5;

      doc.setFontSize(6);
      doc.text(`Sistema POS - ${new Date().getFullYear()}`, centerX, y, { align: 'center' });
      
      // Generar blob y URL directamente
      const pdfBlob = doc.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      setIsGenerating(false);
    } catch (error) {
      console.error('Error generando PDF:', error);
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    if (pdfUrl) {
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    }
  };

  const handleClose = () => {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }
    onComplete();
  };

  return (
    <Dialog open={true} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl h-[90vh] p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white shrink-0">
          <DialogTitle className="text-lg font-bold text-slate-900">
            Ticket de Venta - {saleData.code}
          </DialogTitle>
        </div>

        <div className="flex-1 overflow-hidden bg-slate-50 p-4">
          {isGenerating ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
                <p className="text-sm text-slate-600">Generando ticket...</p>
              </div>
            </div>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              className="w-full h-full border-0 rounded-lg shadow-sm"
              title="Vista previa del ticket"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-sm text-red-600">Error al generar el ticket</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 px-6 py-4 bg-white border-t border-slate-200 shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cerrar
          </Button>
          <Button
            onClick={handlePrint}
            disabled={!pdfUrl || isGenerating}
            className="flex-1 bg-slate-900 hover:bg-slate-800"
          >
            <Printer className="w-4 h-4 mr-2" />
            Imprimir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
