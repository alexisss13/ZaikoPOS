'use client';

import { memo, useCallback, useMemo } from 'react';
import { Package, Image as ImageIcon, Store, Globe, Banknote, FileText, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Product, Branch } from './types';

interface ProductCardProps {
  product: Product;
  branches?: Branch[];
  isExpanded: boolean;
  canEdit: boolean;
  canViewOthers: boolean;
  userBranchId?: string;
  onToggle: (id: string) => void;
  onEdit: (product: Product) => void;
  onKardex: (product: Product) => void;
}

function ProductCardComponent({
  product,
  branches,
  isExpanded,
  canEdit,
  canViewOthers,
  userBranchId,
  onToggle,
  onEdit,
  onKardex,
}: ProductCardProps) {
  // Memoizar cálculos pesados
  const { visibleStocks, totalPhysicalStock, stockStatus, ownerBranch, branchesWithStock, hasWholesale } = useMemo(() => {
    const visibleStocks = canViewOthers
      ? (product.branchStocks || [])
      : (product.branchStocks?.filter(bs => bs.branchId === userBranchId) || []);
    
    const totalPhysicalStock = visibleStocks.reduce((sum, bs) => sum + bs.quantity, 0);
    const minStock = product.minStock || 5;
    const hasWholesale = Number(product.wholesalePrice) > 0;

    let stockStatus = { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' };
    if (totalPhysicalStock <= 0) stockStatus = { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    else if (totalPhysicalStock <= minStock) stockStatus = { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' };

    const ownerBranch = product.branchOwnerId ? branches?.find(b => b.id === product.branchOwnerId) : null;
    const branchesWithStock = product.branchStocks?.filter(bs => bs.quantity > 0) || [];

    return { visibleStocks, totalPhysicalStock, stockStatus, ownerBranch, branchesWithStock, hasWholesale };
  }, [product, branches, canViewOthers, userBranchId]);

  const handleToggle = useCallback(() => {
    onToggle(product.id);
  }, [onToggle, product.id]);

  const handleEdit = useCallback(() => {
    onEdit(product);
  }, [onEdit, product]);

  const handleKardex = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onKardex(product);
  }, [onKardex, product]);

  return (
    <div className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden active:scale-[0.985] ${!product.active ? 'opacity-60' : ''}`} style={{ transition: 'transform 0.1s ease-out' }}>
      {/* Header */}
      <div className="p-4 cursor-pointer select-none" onClick={handleToggle}>
        <div className="flex items-center gap-3">
          {/* Imagen */}
          <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0 ${!product.active ? 'grayscale' : ''}`} style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden' }}>
            {product.images?.[0] ? (
              <img src={product.images[0]} alt="" className="w-full h-full object-cover" loading="lazy" decoding="async" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-slate-400" />
              </div>
            )}
            {!product.active && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-[9px] font-black text-white bg-red-500 px-1.5 py-0.5 rounded-full leading-none">INACTIVO</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight mb-0.5 truncate">{product.title}</h3>
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <span className="text-xs text-slate-400 truncate max-w-[110px]">{product.category?.name || 'Sin categoría'}</span>
              {(product.barcode || product.code || product.sku) && (
                <>
                  <span className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                  <span className="text-[10px] font-mono text-slate-300 truncate max-w-[70px]">{product.barcode || product.code || product.sku}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-slate-900">S/ {Number(product.basePrice).toFixed(2)}</span>
                {hasWholesale && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" title="Tiene precio mayorista" />}
              </div>
              <div className={`px-2 py-0.5 rounded-full text-xs font-bold border ${stockStatus.bg} ${stockStatus.text} ${stockStatus.border}`}>
                {totalPhysicalStock} un.
              </div>
            </div>
          </div>

          <ChevronDown className={`w-4 h-4 text-slate-300 shrink-0 ${isExpanded ? 'rotate-180' : ''}`} style={{ transition: 'transform 0.12s ease-out', willChange: 'transform' }} />
        </div>
      </div>

      {/* Expandible - Solo renderizar cuando está expandido */}
      {isExpanded && (
        <div className="border-t border-slate-100 p-4 bg-slate-50/50" style={{ animation: 'slideDown 0.12s ease-out' }}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {/* Catálogo */}
            <div className="bg-white rounded-2xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Store className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Catálogo</span>
              </div>
              {branchesWithStock.length > 1 ? (
                <div className="flex items-center gap-1.5">
                  {ownerBranch?.logoUrl ? <img src={ownerBranch.logoUrl} className="w-4 h-4 rounded object-cover shrink-0" alt="" loading="lazy" /> : <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  <span className="text-xs font-semibold text-slate-700 truncate">{ownerBranch?.name || 'Sucursal'}</span>
                  <Globe className="w-3 h-3 text-emerald-500 shrink-0" />
                </div>
              ) : product.branchOwnerId ? (
                <div className="flex items-center gap-1.5">
                  {ownerBranch?.logoUrl ? <img src={ownerBranch.logoUrl} className="w-4 h-4 rounded object-cover shrink-0" alt="" loading="lazy" /> : <Store className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                  <span className="text-xs font-semibold text-slate-700 truncate">{ownerBranch?.name || 'Sucursal'}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="text-xs font-semibold text-emerald-600">Compartido</span>
                </div>
              )}
            </div>

            {/* Inventario */}
            <div className="bg-white rounded-2xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Inventario</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-base font-bold text-slate-900">{totalPhysicalStock}</span>
                <span className="text-xs text-slate-400">un.</span>
                {totalPhysicalStock <= 0 && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">Agotado</span>}
                {totalPhysicalStock > 0 && totalPhysicalStock <= (product.minStock || 5) && <span className="text-[10px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-bold">Bajo</span>}
              </div>
            </div>

            {/* Precio */}
            <div className="bg-white rounded-2xl p-3 border border-slate-100">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Banknote className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Precio</span>
              </div>
              <span className="text-base font-bold text-slate-900">S/ {Number(product.basePrice).toFixed(2)}</span>
            </div>

            {/* Mayorista */}
            {hasWholesale && (
              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-100">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">Mayorista</span>
                </div>
                <span className="text-base font-bold text-emerald-700">S/ {Number(product.wholesalePrice).toFixed(2)}</span>
                {product.wholesaleMinCount && <p className="text-[10px] text-emerald-500 mt-0.5">Mín. {product.wholesaleMinCount} un.</p>}
              </div>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-2">
            <Button
              onClick={handleEdit}
              className="flex-1 h-11 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold text-sm transition-transform duration-100 active:scale-95"
              style={{ willChange: 'transform' }}
            >
              {canEdit ? 'Editar' : 'Ver detalles'}
            </Button>
            <Button
              onClick={handleKardex}
              variant="outline"
              className="h-11 px-3.5 rounded-2xl border-slate-200 shrink-0 text-xs font-semibold text-slate-600 gap-1.5 transition-transform duration-100 active:scale-95"
              style={{ willChange: 'transform' }}
            >
              <FileText className="w-4 h-4" /> Kardex
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Comparación personalizada para memo
const areEqual = (prevProps: ProductCardProps, nextProps: ProductCardProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.isExpanded === nextProps.isExpanded &&
    prevProps.canEdit === nextProps.canEdit &&
    prevProps.product.basePrice === nextProps.product.basePrice &&
    prevProps.product.active === nextProps.product.active &&
    JSON.stringify(prevProps.product.branchStocks) === JSON.stringify(nextProps.product.branchStocks)
  );
};

export const ProductCard = memo(ProductCardComponent, areEqual);
