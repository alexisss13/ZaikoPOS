import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PackageIcon, Store01Icon, ArrowDataTransferHorizontalIcon, Calendar03Icon, UserIcon, CheckmarkCircle02Icon, CancelCircleIcon } from 'hugeicons-react';
import type { StockTransfer } from '../useInventoryLogic';

interface MobileTransfersListProps {
  transfers: StockTransfer[];
  isLoading: boolean;
  logic: any;
}

const statusConfig: Record<'PENDING' | 'APPROVED' | 'REJECTED', { label: string; color: string }> = {
  PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  APPROVED: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-300' }
};

export function MobileTransfersList({ transfers, isLoading, logic }: MobileTransfersListProps) {
  const { handleTransferAction, processingTransferId, canManage } = logic;

  if (isLoading) {
    return (
      <div className="space-y-2.5 px-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-4 w-full rounded-lg" />
              <Skeleton className="h-3 w-2/3 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (transfers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
          <ArrowDataTransferHorizontalIcon className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Sin traslados</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          No hay traslados de inventario registrados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-4">
      {transfers.map((transfer) => {
        const status = statusConfig[transfer.status];
        const isProcessing = processingTransferId === transfer.id;

        return (
          <div key={transfer.id} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <Badge className={`text-[9px] font-black px-2 py-0.5 h-5 shadow-none border ${status.color}`}>
                {status.label}
              </Badge>
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <Calendar03Icon className="w-3 h-3" strokeWidth={1.5} />
                <span>
                  {new Date(transfer.createdAt).toLocaleDateString('es-PE', { 
                    day: '2-digit', 
                    month: 'short' 
                  })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Store01Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} />
                <span className="text-xs text-slate-700 truncate">{transfer.fromBranch.name}</span>
              </div>
              <ArrowDataTransferHorizontalIcon className="w-3 h-3 text-slate-400 shrink-0" strokeWidth={1.5} />
              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                <Store01Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" strokeWidth={1.5} />
                <span className="text-xs text-slate-700 truncate">{transfer.toBranch.name}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <PackageIcon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
              <span className="text-xs text-slate-600 font-medium">
                {transfer.items.length} producto{transfer.items.length !== 1 ? 's' : ''}
              </span>
            </div>

            <details className="mb-3">
              <summary className="text-xs text-slate-500 cursor-pointer hover:text-slate-700 font-medium">
                Ver productos
              </summary>
              <div className="mt-2 space-y-1.5 pl-2 border-l-2 border-slate-200">
                {transfer.items.map((item) => (
                  <div key={item.id} className="text-xs text-slate-600">
                    • {item.variant.product.title} ({item.variant.name}) <span className="font-bold">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </details>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
              <UserIcon className="w-3 h-3" strokeWidth={1.5} />
              <span>Solicitado por {transfer.requestedBy.name}</span>
            </div>

            {canManage && transfer.status === 'PENDING' && (
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => handleTransferAction(transfer.id, 'APPROVED')}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  <CheckmarkCircle02Icon className="w-3.5 h-3.5" />
                  Aprobar
                </button>
                <button
                  onClick={() => handleTransferAction(transfer.id, 'REJECTED')}
                  disabled={isProcessing}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-500 text-white text-xs font-bold hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50"
                >
                  <CancelCircleIcon className="w-3.5 h-3.5" />
                  Rechazar
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
