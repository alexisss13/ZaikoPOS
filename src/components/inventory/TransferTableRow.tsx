'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Store01Icon, UserIcon, Calendar03Icon, ArrowDataTransferHorizontalIcon,
  PackageIcon, CheckmarkCircle02Icon, CancelCircleIcon
} from 'hugeicons-react';

interface TransferTableRowProps {
  transfer: any;
  canManage: boolean;
  processingTransferId: string | null;
  onAction: (transferId: string, action: 'APPROVED' | 'REJECTED') => void;
}

function TransferTableRowComponent({ transfer, canManage, processingTransferId, onAction }: TransferTableRowProps) {
  const statusConfig: Record<'PENDING' | 'APPROVED' | 'REJECTED', { label: string; color: string }> = {
    PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-300' },
    APPROVED: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
    REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-300' }
  };
  
  const status = statusConfig[transfer.status as keyof typeof statusConfig];
  const isProcessing = processingTransferId === transfer.id;

  return (
    <tr className="text-xs table-row-optimized">
      <td className="px-5 py-3">
        <Badge className={`text-[9px] font-black px-2 py-0.5 h-5 shadow-none border ${status.color}`}>
          {status.label}
        </Badge>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <Store01Icon className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-700 text-xs">{transfer.fromBranch.name}</span>
          <ArrowDataTransferHorizontalIcon className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
          <span className="text-slate-700 text-xs">{transfer.toBranch.name}</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div>
          <div className="flex items-center gap-2">
            <PackageIcon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
            <span className="text-slate-700 text-xs">{transfer.items.length} producto(s)</span>
          </div>
          <details className="mt-1">
            <summary className="text-[10px] text-slate-500 cursor-pointer hover:text-slate-700">
              Ver detalle
            </summary>
            <div className="mt-2 space-y-1 pl-2 border-l-2 border-slate-200">
              {transfer.items.map((item: any) => (
                <div key={item.id} className="text-[10px] text-slate-600">
                  • {item.variant.product.title} ({item.variant.name}) x{item.quantity}
                </div>
              ))}
            </div>
          </details>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2">
          <UserIcon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
          <span className="text-slate-700 text-xs">{transfer.requestedBy.name}</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar03Icon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
          <div className="flex flex-col">
            <span className="text-slate-700 text-[11px]">
              {new Date(transfer.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
            </span>
            <span className="text-[9px] text-slate-500">
              {new Date(transfer.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        {transfer.status === 'PENDING' && canManage && (
          <div className="flex items-center justify-center gap-1">
            <Button
              onClick={() => onAction(transfer.id, 'APPROVED')}
              disabled={isProcessing}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 btn-optimized transition-none"
              title="Aprobar"
            >
              <CheckmarkCircle02Icon className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onAction(transfer.id, 'REJECTED')}
              disabled={isProcessing}
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 hover:bg-red-100 text-slate-600 hover:text-red-700 btn-optimized transition-none"
              title="Rechazar"
            >
              <CancelCircleIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      </td>
    </tr>
  );
}

const areEqual = (prevProps: TransferTableRowProps, nextProps: TransferTableRowProps) => {
  return prevProps.transfer.id === nextProps.transfer.id && 
         prevProps.processingTransferId === nextProps.processingTransferId;
};

export const TransferTableRow = memo(TransferTableRowComponent, areEqual);
