'use client';

import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  Invoice01Icon, User02Icon, Loading02Icon, Money01Icon, Wallet03Icon, CreditCardIcon, 
  ArrowDataTransferHorizontalIcon, PrinterIcon, Cancel01Icon, ArrowLeft01Icon, ArrowRight01Icon 
} from 'hugeicons-react';
import { TicketPrint } from './TicketPrint';

interface SalesHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  salesData: any;
}

const ITEMS_PER_PAGE = 6;

export function SalesHistoryModal({ isOpen, onClose, salesData }: SalesHistoryModalProps) {
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [printingSale, setPrintingSale] = useState<any>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const sales = salesData?.sales || [];
  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);
  const paginatedSales = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sales.slice(start, start + ITEMS_PER_PAGE);
  }, [sales, currentPage]);

  const handleClose = () => {
    setSelectedSale(null);
    setCurrentPage(1);
    onClose();
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedSale(null);
  };

  const handlePrintTicket = (sale: any) => {
    // Transformar los datos de la venta al formato esperado por TicketPrint
    const ticketData = {
      code: sale.code,
      createdAt: sale.createdAt,
      subtotal: Number(sale.subtotal || sale.total),
      discount: Number(sale.discount || 0),
      total: Number(sale.total),
      tenderedAmount: Number(sale.tenderedAmount),
      changeAmount: Number(sale.changeAmount),
      pointsEarned: sale.pointsEarned || 0,
      items: sale.items.map((item: any) => ({
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal)
      })),
      payments: sale.payments.map((p: any) => ({
        method: p.method,
        amount: Number(p.amount)
      })),
      customer: sale.customer,
      cashier: sale.cashier || { name: 'Sin cajero' },
      branch: sale.branch || salesData.branch || { name: 'Sucursal', address: '', phone: '', logos: null },
      business: sale.business || salesData.business || { name: 'Negocio', ruc: '' }
    };
    
    setPrintingSale(ticketData);
    setShowTicketModal(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-6xl h-[85vh] p-0 overflow-hidden bg-white border border-slate-200 shadow-xl rounded-xl flex flex-col">
        <DialogHeader className="px-6 py-3 border-b border-slate-200 bg-white shrink-0">
          <DialogTitle className="text-sm font-bold text-slate-900">Historial de Ventas</DialogTitle>
          <DialogDescription className="text-[11px] text-slate-500 mt-0.5">
            {sales.length} {sales.length === 1 ? 'venta registrada' : 'ventas registradas'} en este turno
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex min-h-0">
          {/* Lista de ventas - Izquierda */}
          <div className="w-80 border-r border-slate-200 flex flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-1">
              {!salesData ? (
                <div className="flex items-center justify-center py-16">
                  <Loading02Icon size={24} className="animate-spin text-slate-300" />
                </div>
              ) : sales.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                  <Invoice01Icon size={40} strokeWidth={1.5} className="mb-2 opacity-50" />
                  <p className="text-xs font-medium">Sin ventas</p>
                </div>
              ) : (
                paginatedSales.map((sale: any) => (
                  <button
                    key={sale.id}
                    onClick={() => setSelectedSale(sale)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedSale?.id === sale.id
                        ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${selectedSale?.id === sale.id ? 'text-white' : 'text-slate-900'}`}>
                          {sale.code}
                        </span>
                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                          sale.status === 'COMPLETED'
                            ? selectedSale?.id === sale.id ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700'
                            : selectedSale?.id === sale.id ? 'bg-red-500 text-white' : 'bg-red-100 text-red-700'
                        }`}>
                          {sale.status === 'COMPLETED' ? 'OK' : 'ANULADA'}
                        </span>
                      </div>
                      <span className={`text-sm font-bold tabular-nums ${selectedSale?.id === sale.id ? 'text-white' : 'text-slate-900'}`}>
                        S/ {Number(sale.total).toFixed(2)}
                      </span>
                    </div>
                    <div className={`flex items-center gap-2 text-[10px] ${selectedSale?.id === sale.id ? 'text-slate-300' : 'text-slate-500'}`}>
                      <span>
                        {new Date(sale.createdAt).toLocaleString('es-PE', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                      <span>•</span>
                      <span>{sale.cashier?.name || 'Sin cajero'}</span>
                    </div>
                  </button>
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
                    <ArrowLeft01Icon size={16} strokeWidth={2} />
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
                    <ArrowRight01Icon size={16} strokeWidth={2} />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Detalle de venta - Derecha */}
          <div className="flex-1 flex flex-col min-w-0">
            {!selectedSale ? (
              <div className="flex-1 flex items-center justify-center text-slate-400">
                <div className="text-center">
                  <Invoice01Icon size={48} strokeWidth={1.5} className="mx-auto mb-3 opacity-50" />
                  <p className="text-sm font-medium">Selecciona una venta para ver el detalle</p>
                </div>
              </div>
            ) : (
              <>
                {/* Header del detalle */}
                <div className="px-6 py-3 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h3 className="text-base font-bold text-slate-900">{selectedSale.code}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          selectedSale.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {selectedSale.status === 'COMPLETED' ? 'COMPLETADA' : 'ANULADA'}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1">
                          <Invoice01Icon size={12} strokeWidth={2} />
                          {selectedSale.cashier?.name || 'Sin cajero'}
                        </span>
                        <span>
                          {new Date(selectedSale.createdAt).toLocaleString('es-PE', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Acciones */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handlePrintTicket(selectedSale)}
                        variant="outline" 
                        className="h-8 px-3 text-xs font-semibold text-slate-600 border-slate-200 hover:bg-slate-50"
                      >
                        <PrinterIcon size={14} strokeWidth={2} className="mr-1.5" /> Imprimir
                      </Button>
                      <Button variant="outline" className="h-8 px-3 text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50">
                        <Cancel01Icon size={14} strokeWidth={2} className="mr-1.5" /> Anular
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Contenido del detalle */}
                <div className="flex-1 overflow-y-auto p-6">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Columna Izquierda - Productos */}
                    <div className="space-y-4">
                      <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Productos</h4>
                      <div className="space-y-1">
                        {selectedSale.items.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-slate-100 last:border-0">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-xs text-slate-700 line-clamp-1">
                                {item.productName}
                                {item.variantName && item.variantName !== 'Estándar' && (
                                  <span className="text-slate-500 font-normal"> ({item.variantName})</span>
                                )}
                              </p>
                              {(item.sku || item.barcode) && (
                                <p className="text-slate-400 font-mono text-[9px]">
                                  {item.sku || item.barcode}
                                </p>
                              )}
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-[10px] text-slate-500">
                                {item.quantity} x S/ {Number(item.price).toFixed(2)}
                              </p>
                              <p className="font-semibold text-xs text-slate-900 tabular-nums">
                                S/ {Number(item.subtotal).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Columna Derecha - Información de Pago */}
                    <div className="space-y-4">
                      {/* Cliente */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Cliente</h4>
                        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                          <p className="text-xs font-medium text-slate-700">
                            {selectedSale.customer?.name || 'Cliente General'}
                          </p>
                          {selectedSale.customer?.docNumber && (
                            <p className="text-[10px] text-slate-500 mt-0.5">
                              {selectedSale.customer.docNumber}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Métodos de Pago */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Métodos de Pago</h4>
                        <div className="grid grid-cols-2 gap-2">
                          {selectedSale.payments.map((payment: any) => (
                            <div key={payment.id} className="p-2 bg-white rounded-lg border border-slate-200">
                              <div className="flex items-center gap-1.5 mb-1">
                                {payment.method === 'CASH' && <Money01Icon size={12} strokeWidth={2} className="text-slate-600" />}
                                {payment.method === 'YAPE' && <Wallet03Icon size={12} strokeWidth={2} className="text-purple-600" />}
                                {payment.method === 'PLIN' && <Wallet03Icon size={12} strokeWidth={2} className="text-cyan-600" />}
                                {payment.method === 'CARD' && <CreditCardIcon size={12} strokeWidth={2} className="text-blue-600" />}
                                {payment.method === 'TRANSFER' && <ArrowDataTransferHorizontalIcon size={12} strokeWidth={2} className="text-emerald-600" />}
                                <p className="text-[10px] font-semibold text-slate-700">{payment.method}</p>
                              </div>
                              {payment.reference && (
                                <p className="text-[9px] text-slate-500 font-mono mb-1">Ref: {payment.reference}</p>
                              )}
                              <p className="text-xs font-bold text-slate-900 tabular-nums">
                                S/ {Number(payment.amount).toFixed(2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Resumen Financiero */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Resumen</h4>
                        <div className="space-y-1.5 p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">Subtotal:</span>
                            <span className="font-medium text-slate-900 tabular-nums">
                              S/ {Number(selectedSale.subtotal || selectedSale.total).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-600">Descuento:</span>
                            <span className="font-medium text-slate-900 tabular-nums">
                              S/ {Number(selectedSale.discount || 0).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                            <span className="font-semibold text-slate-700">Total:</span>
                            <span className="font-bold text-sm text-slate-900 tabular-nums">
                              S/ {Number(selectedSale.total).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1.5 border-t border-slate-200">
                            <span className="text-slate-600">Entregado:</span>
                            <span className="font-medium text-slate-900 tabular-nums">
                              S/ {Number(selectedSale.tenderedAmount).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-emerald-700 font-medium">Vuelto:</span>
                            <span className="font-semibold text-emerald-700 tabular-nums">
                              S/ {Number(selectedSale.changeAmount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Componente de impresión de ticket */}
        {printingSale && showTicketModal && (
          <TicketPrint
            saleData={printingSale}
            onComplete={() => {
              setPrintingSale(null);
              setShowTicketModal(false);
            }}
          />
        )}

      </DialogContent>
    </Dialog>
  );
}
