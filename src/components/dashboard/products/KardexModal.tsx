'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DownloadCircle02Icon, PackageIcon, Calendar03Icon, UserIcon } from 'hugeicons-react';
import type { Product } from './types';

interface KardexModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  movements: any[];
  onExportExcel: () => void;
  onExportPDF: () => void;
}

const movementTypeConfig = {
  INPUT: { label: 'Entrada', color: 'bg-green-100 text-green-700' },
  OUTPUT: { label: 'Salida', color: 'bg-red-100 text-red-700' },
  ADJUSTMENT: { label: 'Ajuste', color: 'bg-blue-100 text-blue-700' },
  SALE_POS: { label: 'Venta POS', color: 'bg-purple-100 text-purple-700' },
  SALE_ECOMMERCE: { label: 'Venta Online', color: 'bg-indigo-100 text-indigo-700' },
  PURCHASE: { label: 'Compra', color: 'bg-emerald-100 text-emerald-700' },
  TRANSFER: { label: 'Traslado', color: 'bg-orange-100 text-orange-700' },
};

export function KardexModal({ isOpen, onClose, product, movements, onExportExcel, onExportPDF }: KardexModalProps) {
  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <PackageIcon className="w-5 h-5 text-slate-600" />
            Kardex - {product.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between py-2 border-b border-slate-200">
          <div className="text-sm text-slate-600">
            {movements.length} movimiento{movements.length !== 1 ? 's' : ''} registrado{movements.length !== 1 ? 's' : ''}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onExportExcel}
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold text-green-600 hover:bg-green-50 border-green-200"
            >
              <DownloadCircle02Icon className="w-3.5 h-3.5 mr-1" />
              Excel
            </Button>
            <Button
              onClick={onExportPDF}
              variant="outline"
              size="sm"
              className="h-8 text-xs font-bold text-red-600 hover:bg-red-50 border-red-200"
            >
              <DownloadCircle02Icon className="w-3.5 h-3.5 mr-1" />
              PDF
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {movements.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                <PackageIcon className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Sin movimientos</h3>
              <p className="text-sm text-slate-600">
                No hay movimientos registrados para este producto
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-separate border-spacing-0 min-w-[800px]">
                <thead className="bg-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-4 py-3 font-semibold rounded-tl-xl">Fecha</th>
                    <th className="px-4 py-3 font-semibold">Tipo</th>
                    <th className="px-4 py-3 font-semibold">Motivo</th>
                    <th className="px-4 py-3 font-semibold text-center">Cantidad</th>
                    <th className="px-4 py-3 font-semibold text-center">Stock Anterior</th>
                    <th className="px-4 py-3 font-semibold text-center">Stock Nuevo</th>
                    <th className="px-4 py-3 font-semibold">Sucursal</th>
                    <th className="px-4 py-3 font-semibold rounded-tr-xl">Usuario</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50/80">
                  {movements.map((movement: any) => {
                    const typeInfo = movementTypeConfig[movement.type as keyof typeof movementTypeConfig] || 
                      { label: movement.type, color: 'bg-gray-100 text-gray-700' };
                    
                    let quantityChange = 0;
                    if (movement.type === 'ADJUSTMENT') {
                      quantityChange = movement.currentStock - movement.previousStock;
                    } else if (['INPUT', 'PURCHASE', 'TRANSFER'].includes(movement.type)) {
                      quantityChange = movement.quantity;
                    } else {
                      quantityChange = -movement.quantity;
                    }

                    return (
                      <tr key={movement.id} className="hover:bg-slate-50 transition-colors text-xs">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Calendar03Icon className="w-3.5 h-3.5 text-slate-400" />
                            <div>
                              <div className="font-bold text-slate-700 text-[11px]">
                                {new Date(movement.createdAt).toLocaleDateString('es-PE', { 
                                  day: '2-digit', 
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </div>
                              <div className="text-[9px] text-slate-400">
                                {new Date(movement.createdAt).toLocaleTimeString('es-PE', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[9px] font-bold px-2 py-0.5 h-5 shadow-none border ${typeInfo.color}`}>
                            {typeInfo.label}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700 text-xs truncate max-w-[200px] block">
                            {movement.reason || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-bold text-xs ${
                            quantityChange > 0 ? 'text-green-600' : 
                            quantityChange < 0 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            {quantityChange > 0 ? '+' : ''}{quantityChange}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-700 text-xs font-medium">
                            {movement.previousStock}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-900 text-xs font-bold">
                            {movement.currentStock}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-slate-700 text-xs truncate max-w-[120px] block">
                            {movement.branch?.name || '-'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-slate-700 text-xs truncate max-w-[120px]">
                              {movement.user?.name || '-'}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}