'use client';

import React, { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { 
  PackageIcon, 
  ArrowDataTransferHorizontalIcon,
  CircleArrowUp02Icon,
  CircleArrowDown02Icon,
  Settings01Icon,
  PlusSignIcon,
  MoreHorizontalIcon,
  Search01Icon,
  Cancel01Icon,
  CheckmarkCircle02Icon,
  Clock01Icon,
  CancelCircleIcon,
  Store01Icon,
  Calendar03Icon,
} from 'hugeicons-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

// Dynamic imports para páginas nativas
const NewMovementMobile = dynamic(() => import('./NewMovementMobile').then(m => ({ default: m.NewMovementMobile })), { 
  ssr: false,
  loading: () => null // Evitar parpadeo durante carga
});
const NewTransferMobile = dynamic(() => import('./NewTransferMobile').then(m => ({ default: m.NewTransferMobile })), { 
  ssr: false,
  loading: () => null // Evitar parpadeo durante carga
});

interface StockMovement {
  id: string;
  type: 'INPUT' | 'OUTPUT' | 'ADJUSTMENT' | 'SALE_POS' | 'SALE_ECOMMERCE' | 'PURCHASE' | 'TRANSFER';
  quantity: number;
  previousStock: number;
  currentStock: number;
  reason: string | null;
  createdAt: string;
  variant: {
    name: string;
    product: {
      title: string;
    };
  };
  branch: {
    name: string;
  };
  user: {
    name: string;
  };
}

interface StockTransfer {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  fromBranch: { name: string };
  toBranch: { name: string };
  requestedBy: { name: string };
  items: {
    id: string;
    quantity: number;
    variant: {
      name: string;
      product: {
        title: string;
        images: string[];
      };
    };
  }[];
}

interface Branch {
  id: string;
  name: string;
}

interface InventoryMobileProps {
  movements: StockMovement[];
  transfers: StockTransfer[];
  isLoading: boolean;
  onRefresh: () => Promise<void>;
  onTransferAction: (transferId: string, action: 'APPROVED' | 'REJECTED') => Promise<void>;
  canManage: boolean;
  branches: Branch[];
  products: any[]; // Productos para las páginas nativas
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

export const InventoryMobile = React.memo(function InventoryMobile({
  movements,
  transfers,
  isLoading,
  onRefresh,
  onTransferAction,
  canManage,
  branches,
  products,
}: InventoryMobileProps) {
  const [activeTab, setActiveTab] = useState<'movements' | 'transfers'>('movements');
  const [searchTerm, setSearchTerm] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [expandedTransfer, setExpandedTransfer] = useState<string | null>(null);
  
  // Páginas nativas
  const [showNewMovement, setShowNewMovement] = useState(false);
  const [showNewTransfer, setShowNewTransfer] = useState(false);

  // Pull-to-refresh
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartY = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0) {
      touchStartY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (scrollRef.current && scrollRef.current.scrollTop === 0 && !isRefreshing) {
      const currentY = e.touches[0].clientY;
      const distance = currentY - touchStartY.current;
      
      if (distance > 0 && distance < 100) {
        setIsPulling(distance > 60);
        const indicator = document.getElementById('pull-indicator-inventory');
        if (indicator) {
          indicator.style.height = `${Math.min(distance, 60)}px`;
          indicator.style.opacity = `${Math.min(distance / 60, 1)}`;
        }
      }
    }
  };

  const handleTouchEnd = async () => {
    if (isPulling && !isRefreshing) {
      setIsRefreshing(true);
      setIsPulling(false);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Error refreshing:', error);
      } finally {
        setTimeout(() => {
          setIsRefreshing(false);
          const indicator = document.getElementById('pull-indicator-inventory');
          if (indicator) {
            indicator.style.height = '0';
            indicator.style.opacity = '0';
          }
        }, 500);
      }
    } else {
      setIsPulling(false);
      const indicator = document.getElementById('pull-indicator-inventory');
      if (indicator) {
        indicator.style.height = '0';
        indicator.style.opacity = '0';
      }
    }
  };

  // Filtrar movimientos
  const filteredMovements = movements.filter(m => 
    m.variant.product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (m.reason && m.reason.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filtrar traslados
  const filteredTransfers = transfers.filter(t =>
    t.fromBranch.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.toBranch.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const pendingTransfers = transfers.filter(t => t.status === 'PENDING').length;

  return (
    <div className="flex flex-col h-full w-full bg-slate-50/30">
      {/* Header móvil estilo HR - separado del contenido */}
      <div className="bg-white border-b border-slate-200 p-4 space-y-4">
        {/* Título y botones */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-slate-100 rounded-xl">
              <PackageIcon className="w-5 h-5 text-slate-600" strokeWidth={2} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black text-slate-900 leading-tight">Inventario</h1>
              <p className="text-xs text-slate-500 font-semibold">
                {filteredMovements.length} movimientos · {pendingTransfers} pendientes
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-1.5">
            {canManage && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="h-10 w-10 flex items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-95 transition-all"
                >
                  <MoreHorizontalIcon className="w-4 h-4" strokeWidth={2} />
                </button>
                
                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-12 w-44 bg-white border border-slate-200 shadow-xl rounded-2xl p-1.5 z-50">
                      <button
                        onClick={() => { setShowNewMovement(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <CircleArrowUp02Icon className="w-4 h-4 text-slate-400" />
                        Movimiento
                      </button>
                      <button
                        onClick={() => { setShowNewTransfer(true); setShowMenu(false); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <ArrowDataTransferHorizontalIcon className="w-4 h-4 text-slate-400" />
                        Traslado
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Barra de búsqueda */}
        <div className="relative">
          <Search01Icon className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" strokeWidth={2.5} />
          <Input
            placeholder="Buscar producto, motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 h-11 bg-slate-50 border-slate-200 rounded-xl font-semibold"
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('movements')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'movements'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <PackageIcon className="w-4 h-4" />
            Movimientos
          </button>
          <button
            onClick={() => setActiveTab('transfers')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'transfers'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            <ArrowDataTransferHorizontalIcon className="w-4 h-4" />
            Traslados
            {pendingTransfers > 0 && (
              <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {pendingTransfers}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Content con fondo gris */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto pb-20"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          overscrollBehavior: 'contain',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <div id="pull-indicator-inventory" className="flex items-center justify-center overflow-hidden transition-all duration-200" style={{ height: 0, opacity: 0 }}>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <div className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`}>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
            </div>
            {isRefreshing ? 'Actualizando...' : isPulling ? 'Suelta para actualizar' : 'Desliza para actualizar'}
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2.5 p-4">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : activeTab === 'movements' ? (
          <div className="space-y-2.5 p-4">
            {filteredMovements.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <PackageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-900 mb-1">Sin movimientos</p>
                <p className="text-xs text-slate-500">Los movimientos de inventario aparecerán aquí</p>
              </div>
            ) : (
              filteredMovements.map((movement) => {
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
                  <div
                    key={movement.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <TypeIcon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[9px] font-black px-2 py-0.5 h-5 shadow-none border ${typeInfo.color}`}>
                            {typeInfo.label}
                          </Badge>
                        </div>
                        <p className="font-bold text-sm text-slate-900 truncate">{movement.variant.product.title}</p>
                        <p className="text-xs text-slate-500 truncate">{movement.variant.name}</p>
                        {movement.reason && (
                          <p className="text-[10px] text-slate-400 mt-1 truncate">{movement.reason}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-lg font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
                          {quantityValue > 0 ? `+${quantityValue}` : quantityValue}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-500">
                      <div className="flex items-center gap-1">
                        <Store01Icon className="w-3 h-3" />
                        <span>{movement.branch.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar03Icon className="w-3 h-3" />
                        <span>{new Date(movement.createdAt).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          <div className="space-y-2.5 p-4">
            {filteredTransfers.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
                <ArrowDataTransferHorizontalIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-slate-900 mb-1">Sin traslados</p>
                <p className="text-xs text-slate-500">Los traslados de stock aparecerán aquí</p>
              </div>
            ) : (
              filteredTransfers.map((transfer) => {
                const statusConfig = {
                  PENDING: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700 border-amber-300', icon: Clock01Icon },
                  APPROVED: { label: 'Aprobado', color: 'bg-emerald-100 text-emerald-700 border-emerald-300', icon: CheckmarkCircle02Icon },
                  REJECTED: { label: 'Rechazado', color: 'bg-red-100 text-red-700 border-red-300', icon: CancelCircleIcon },
                };
                const statusInfo = statusConfig[transfer.status];
                const StatusIcon = statusInfo.icon;
                const isExpanded = expandedTransfer === transfer.id;

                return (
                  <div
                    key={transfer.id}
                    className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                        <ArrowDataTransferHorizontalIcon className="w-5 h-5 text-slate-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={`text-[9px] font-black px-2 py-0.5 h-5 shadow-none border ${statusInfo.color}`}>
                            <StatusIcon className="w-2.5 h-2.5 mr-1" />
                            {statusInfo.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-slate-600 mb-1">
                          <span className="font-bold">{transfer.fromBranch.name}</span>
                          <span className="mx-1">→</span>
                          <span className="font-bold">{transfer.toBranch.name}</span>
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {transfer.items.length} producto{transfer.items.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    {/* Botón expandir */}
                    <button
                      onClick={() => setExpandedTransfer(isExpanded ? null : transfer.id)}
                      className="w-full text-xs font-semibold text-slate-600 hover:text-slate-900 py-2 border-t border-slate-100"
                    >
                      {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                    </button>

                    {/* Detalles expandidos */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                        {transfer.items.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 text-xs">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                              <PackageIcon className="w-4 h-4 text-slate-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-slate-900 truncate">{item.variant.product.title}</p>
                              <p className="text-[10px] text-slate-500">{item.variant.name}</p>
                            </div>
                            <span className="font-bold text-slate-900">x{item.quantity}</span>
                          </div>
                        ))}

                        {/* Acciones para traslados pendientes */}
                        {transfer.status === 'PENDING' && canManage && (
                          <div className="flex gap-2 pt-2">
                            <button
                              onClick={() => onTransferAction(transfer.id, 'APPROVED')}
                              className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-xs font-bold active:scale-95 transition-transform"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => onTransferAction(transfer.id, 'REJECTED')}
                              className="flex-1 py-2 rounded-xl bg-red-500 text-white text-xs font-bold active:scale-95 transition-transform"
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Páginas nativas en móvil */}
      {showNewMovement && (
        <NewMovementMobile
          onClose={() => setShowNewMovement(false)}
          onSuccess={() => {
            setShowNewMovement(false);
            onRefresh();
          }}
          branches={branches}
          products={products}
        />
      )}

      {showNewTransfer && (
        <NewTransferMobile
          onClose={() => setShowNewTransfer(false)}
          onSuccess={() => {
            setShowNewTransfer(false);
            onRefresh();
          }}
          branches={branches}
          products={products}
        />
      )}
    </div>
  );
});
