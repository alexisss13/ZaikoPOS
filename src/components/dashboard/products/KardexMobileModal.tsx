'use client';

import { ArrowLeft01Icon, PackageIcon, DownloadCircle02Icon, Calendar03Icon, UserIcon } from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from './types';

interface KardexMobileModalProps {
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

export function KardexMobileModal({ isOpen, onClose, product, movements, onExportExcel, onExportPDF }: KardexMobileModalProps) {
  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
        <button
          onClick={onClose}
          className="p-2 -ml-2 rounded-xl hover:bg-slate-100 active:scale-95 transition-all"
        >
          <ArrowLeft01Icon className="w-5 h-5 text-slate-700" />
        </button>
        <div className="flex-1">
          <h2 className="text-lg font-black text-slate-900">Kardex</h2>
          <p className="text-xs text-slate-500 truncate">{product.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={onExportExcel}
            variant="ghost"
            className="h-9 w-9 p-0 text-green-600 hover:bg-green-50 rounded-xl"
          >
            <DownloadCircle02Icon className="w-4 h-4" />
          </Button>
          <Button
            onClick={onExportPDF}
            variant="ghost"
            className="h-9 w-9 p-0 text-red-600 hover:bg-red-50 rounded-xl"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
        {movements.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <PackageIcon className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Sin movimientos</h3>
            <p className="text-sm text-slate-600">
              No hay movimientos registrados para este producto
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-4">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-1">Total de movimientos</p>
                <p className="text-2xl font-bold text-slate-900">{movements.length}</p>
              </div>
            </div>

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
                <div key={movement.id} className="bg-white rounded-2xl border border-slate-200 p-4">
                  {/* Header del movimiento */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className={`text-[9px] font-bold px-2 py-0.5 h-5 shadow-none border ${typeInfo.color}`}>
                          {typeInfo.label}
                        </Badge>
                        <span className={`text-sm font-bold ${
                          quantityChange > 0 ? 'text-green-600' : 
                          quantityChange < 0 ? 'text-red-600' : 'text-slate-600'
                        }`}>
                          {quantityChange > 0 ? '+' : ''}{quantityChange}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Calendar03Icon className="w-3 h-3" />
                        <span>
                          {new Date(movement.createdAt).toLocaleDateString('es-PE', { 
                            day: '2-digit', 
                            month: 'short',
                            year: 'numeric'
                          })} • {new Date(movement.createdAt).toLocaleTimeString('es-PE', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Detalles */}
                  <div className="space-y-2">
                    {movement.reason && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Motivo</p>
                        <p className="text-sm text-slate-900">{movement.reason}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Stock Anterior</p>
                        <p className="text-sm font-bold text-slate-900">{movement.previousStock}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">Stock Nuevo</p>
                        <p className="text-sm font-bold text-slate-900">{movement.currentStock}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Sucursal</p>
                        <p className="text-sm text-slate-900">{movement.branch?.name || '-'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Usuario</p>
                        <div className="flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          <p className="text-sm text-slate-900 truncate">{movement.user?.name || '-'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}