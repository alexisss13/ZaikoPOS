import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { PackageIcon, Calendar03Icon, Store01Icon, CircleArrowUp02Icon, CircleArrowDown02Icon, Settings01Icon } from 'hugeicons-react';
import type { StockMovement } from '../useInventoryLogic';

interface MobileKardexListProps {
  movements: StockMovement[];
  isLoading: boolean;
  logic: any;
}

const movementTypeConfig = {
  INPUT: { label: "Entrada", color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: CircleArrowUp02Icon },
  OUTPUT: { label: "Salida", color: "bg-red-100 text-red-700 border-red-300", icon: CircleArrowDown02Icon },
  ADJUSTMENT: { label: "Ajuste", color: "bg-amber-100 text-amber-700 border-amber-300", icon: Settings01Icon },
  SALE_POS: { label: "Venta POS", color: "bg-blue-100 text-blue-700 border-blue-300", icon: PackageIcon },
  SALE_ECOMMERCE: { label: "Venta Online", color: "bg-indigo-100 text-indigo-700 border-indigo-300", icon: PackageIcon },
  PURCHASE: { label: "Compra", color: "bg-purple-100 text-purple-700 border-purple-300", icon: PackageIcon },
  TRANSFER: { label: "Traslado", color: "bg-cyan-100 text-cyan-700 border-cyan-300", icon: CircleArrowUp02Icon },
};

export function MobileKardexList({ movements, isLoading, logic }: MobileKardexListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2.5 px-4">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4">
            <div className="flex items-start gap-3">
              <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2 min-w-0">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/2 rounded-lg" />
                <div className="flex items-center gap-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-lg" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (movements.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-6">
        <div className="w-24 h-24 rounded-3xl bg-slate-100 flex items-center justify-center mb-5">
          <PackageIcon className="w-12 h-12 text-slate-300" strokeWidth={1.5} />
        </div>
        <h3 className="text-base font-bold text-slate-900 mb-1">Sin movimientos</h3>
        <p className="text-sm text-slate-400 leading-relaxed">
          No hay movimientos de inventario registrados
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 px-4">
      {movements.map((movement) => {
        const typeInfo = movementTypeConfig[movement.type];
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
          <div key={movement.id} className="bg-white rounded-2xl border border-slate-100 p-4 active:scale-[0.98] transition-transform">
            <div className="flex items-start gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${typeInfo.color.split(' ')[0]}`}>
                <TypeIcon className="w-6 h-6" strokeWidth={1.5} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">
                      {movement.variant.product.title}
                    </h3>
                    <p className="text-xs text-slate-500 truncate">{movement.variant.name}</p>
                  </div>
                  <Badge className={`text-[9px] font-black px-2 py-0.5 h-5 shadow-none border ${typeInfo.color} shrink-0`}>
                    {typeInfo.label}
                  </Badge>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold text-sm ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                      {quantityValue > 0 ? `+${quantityValue}` : quantityValue}
                    </span>
                    <span className="text-xs text-slate-400">→</span>
                    <span className="text-sm font-bold text-slate-700">{movement.currentStock}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <Store01Icon className="w-3 h-3" strokeWidth={1.5} />
                    <span className="truncate max-w-[100px]">{movement.branch.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                  <Calendar03Icon className="w-3 h-3" strokeWidth={1.5} />
                  <span>
                    {new Date(movement.createdAt).toLocaleDateString('es-PE', { 
                      day: '2-digit', 
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>

                {movement.reason && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-1">
                    {movement.reason}
                  </p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
