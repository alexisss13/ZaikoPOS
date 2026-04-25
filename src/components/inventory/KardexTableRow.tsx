'use client';

import { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  CircleArrowUp02Icon, CircleArrowDown02Icon, Settings01Icon, PackageIcon,
  Store01Icon, UserIcon, Calendar03Icon
} from 'hugeicons-react';

const movementTypeConfig = {
  INPUT: { label: "Entrada", color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: CircleArrowUp02Icon },
  OUTPUT: { label: "Salida", color: "bg-red-100 text-red-700 border-red-300", icon: CircleArrowDown02Icon },
  ADJUSTMENT: { label: "Ajuste", color: "bg-amber-100 text-amber-700 border-amber-300", icon: Settings01Icon },
  SALE_POS: { label: "Venta POS", color: "bg-blue-100 text-blue-700 border-blue-300", icon: PackageIcon },
  SALE_ECOMMERCE: { label: "Venta Online", color: "bg-indigo-100 text-indigo-700 border-indigo-300", icon: PackageIcon },
  PURCHASE: { label: "Compra", color: "bg-purple-100 text-purple-700 border-purple-300", icon: PackageIcon },
  TRANSFER: { label: "Traslado", color: "bg-cyan-100 text-cyan-700 border-cyan-300", icon: CircleArrowUp02Icon },
};

interface KardexTableRowProps {
  movement: any;
}

function KardexTableRowComponent({ movement }: KardexTableRowProps) {
  const typeInfo = movementTypeConfig[movement.type as keyof typeof movementTypeConfig];
  const TypeIcon = typeInfo.icon;
  
  const isPositive = movement.type === 'ADJUSTMENT'
    ? movement.currentStock > movement.previousStock
    : movement.type === 'TRANSFER'
    ? movement.currentStock > movement.previousStock
    : movement.type === 'INPUT' || movement.type === 'PURCHASE';
  
  const quantityValue = movement.type === 'ADJUSTMENT'
    ? movement.currentStock - movement.previousStock
    : movement.type === 'TRANSFER'
    ? (movement.currentStock > movement.previousStock ? movement.quantity : -movement.quantity)
    : (movement.type === 'INPUT' || movement.type === 'PURCHASE' ? movement.quantity : -Math.abs(movement.quantity));

  return (
    <tr className="text-xs table-row-optimized">
      <td className="px-5 py-3">
        <div className="flex items-center gap-2 text-slate-600">
          <Calendar03Icon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
          <div className="flex flex-col">
            <span className="font-bold text-slate-700 text-xs">
              {new Date(movement.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}
            </span>
            <span className="text-[10px] text-slate-400">
              {new Date(movement.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <Badge className={`text-[9px] font-black px-2 py-0.5 h-5 shadow-none border ${typeInfo.color}`}>
          <TypeIcon className="w-2.5 h-2.5 mr-1" />
          {typeInfo.label}
        </Badge>
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 text-sm truncate max-w-[200px]">
            {movement.variant.product.title}
          </span>
          <span className="text-[10px] text-slate-500">{movement.variant.name}</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <span className="text-slate-600 text-xs truncate max-w-[180px] block">
          {movement.reason || '-'}
        </span>
      </td>
      <td className="px-5 py-3 text-center">
        <span className={`font-bold text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {quantityValue > 0 ? `+${quantityValue}` : quantityValue}
        </span>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="text-slate-500 font-medium text-xs">{movement.previousStock}</span>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="text-slate-700 font-bold text-sm">{movement.currentStock}</span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5 text-slate-600">
          <Store01Icon className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
          <span className="text-xs font-medium">{movement.branch.name}</span>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center gap-1.5 text-slate-600">
          <UserIcon className="w-3 h-3 text-slate-400" strokeWidth={1.5} />
          <span className="text-xs font-medium truncate max-w-[120px]">{movement.user.name}</span>
        </div>
      </td>
    </tr>
  );
}

const areEqual = (prevProps: KardexTableRowProps, nextProps: KardexTableRowProps) => {
  return prevProps.movement.id === nextProps.movement.id;
};

export const KardexTableRow = memo(KardexTableRowComponent, areEqual);
