// src/components/dashboard/products/ProductTableRow.tsx
'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ImageWithSpinner } from '@/components/ui/ImageWithSpinner';
import {
  ArrowDataTransferHorizontalIcon, Store01Icon, Image01Icon,
  File01Icon, Edit02Icon, UnavailableIcon, Tick01Icon,
  BarCode01Icon, Note01Icon,
} from 'hugeicons-react';
import { toast } from 'sonner';
import type { Product, Branch } from './types';

interface ProductTableRowProps {
  product: Product & { _meta: any };
  branches?: Branch[];
  onKardex: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onActivate: (id: string) => void;
}

function ProductTableRowComponent({
  product,
  branches,
  onKardex,
  onEdit,
  onDelete,
  onActivate,
}: ProductTableRowProps) {
  const { canEditThis, totalStock } = product._meta;
  const hasWholesale = Number(product.wholesalePrice) > 0;

  // ⚡ NO usar useCallback - crear handlers inline es más rápido
  // useCallback tiene overhead y las funciones inline son optimizadas por el motor JS

  return (
    <tr className={`text-xs table-row-optimized ${!product.active ? 'opacity-60 bg-slate-50/50' : ''}`}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center ${!product.active ? 'grayscale' : ''}`}>
            {product.images?.[0] ? (
              <ImageWithSpinner
                src={product.images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
                containerClassName="w-full h-full"
                spinnerSize={14}
                fallback={<Image01Icon className="w-4 h-4 text-slate-300" />}
              />
            ) : (
              <Image01Icon className="w-4 h-4 text-slate-300" />
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-bold text-slate-700 truncate leading-tight text-sm">{product.title}</p>
              {!product.active && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5 leading-none bg-red-100 text-red-700 border-none shadow-none">INACTIVO</Badge>}
            </div>
            {(product.barcode || product.code) && <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono mt-1"><BarCode01Icon className="w-3 h-3" /> {product.barcode || product.code}</div>}
          </div>
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-col items-start gap-1.5">
          <span className="font-medium text-slate-500 truncate max-w-[140px] leading-none">{product.category?.name || 'Sin Categoría'}</span>
          {(() => {
            const bws = product.branchStocks?.filter((bs: any) => bs.quantity > 0) || [];
            const ob = product.branchOwnerId ? branches?.find(b => b.id === product.branchOwnerId) : null;
            if (bws.length > 1) return <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1.5 leading-none border border-slate-200 px-1.5 py-0.5 rounded-md bg-slate-50 w-max">{ob?.logoUrl ? <img src={ob.logoUrl} className="w-3.5 h-3.5 rounded-[2px] object-cover grayscale mix-blend-multiply" alt="" /> : <Store01Icon className="w-3 h-3 text-slate-400" />}{ob?.name || 'Sucursal'}<ArrowDataTransferHorizontalIcon className="w-2.5 h-2.5 text-slate-400 ml-0.5" /></span>;
            if (product.branchOwnerId) return <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 w-max leading-none">{ob?.logoUrl ? <img src={ob.logoUrl} className="w-3.5 h-3.5 rounded-[2px] object-cover grayscale mix-blend-multiply" alt="" /> : <Store01Icon className="w-3 h-3 text-current" />}{ob?.name || 'Sucursal'}</span>;
            return <span className="text-[9px] font-bold text-slate-600 flex items-center gap-1 leading-none border border-slate-200 px-1.5 py-0.5 rounded-md bg-slate-50 w-max"><ArrowDataTransferHorizontalIcon className="w-2.5 h-2.5 text-slate-400" /> Compartido</span>;
          })()}
        </div>
      </td>
      <td className="px-5 py-3">
        <div className="flex flex-col items-start gap-1">
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-dashed border-emerald-400 bg-emerald-50 text-emerald-800 shadow-sm"><Note01Icon className="w-3 h-3 text-emerald-600" /><span className="font-mono text-[10px] text-emerald-600 font-bold">S/</span><span className="font-bold text-sm tracking-tight">{Number(product.basePrice).toFixed(2)}</span></div>
          {hasWholesale && <p className="text-[9px] text-emerald-600/80 font-medium pl-1 leading-none">Mayor: S/ {Number(product.wholesalePrice).toFixed(2)}</p>}
        </div>
      </td>
      <td className="px-5 py-3">
        {(() => {
          const min = product.minStock || 5;
          const c = totalStock <= 0 ? 'bg-red-50 text-red-700 border-red-200' : totalStock <= min ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
          return <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${c}`}>{totalStock} <span className="text-[9px] opacity-70 ml-1 font-semibold uppercase">un.</span></span>;
        })()}
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-center gap-1">
          <Button 
            onClick={() => onKardex(product)} 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 hover:bg-slate-200 text-slate-600 hover:text-slate-900 btn-optimized transition-none"
            title="Ver Kardex"
          >
            <File01Icon className="w-4 h-4" />
          </Button>
          {canEditThis && (
            <>
              <Button 
                onClick={() => onEdit(product)} 
                variant="ghost" 
                size="sm" 
                className="h-7 w-7 p-0 hover:bg-blue-100 text-slate-600 hover:text-blue-700 btn-optimized transition-none"
                title="Editar producto"
              >
                <Edit02Icon className="w-4 h-4" />
              </Button>
              {product.active ? (
                <Button 
                  onClick={() => onDelete(product.id)} 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 hover:bg-red-100 text-slate-600 hover:text-red-700 btn-optimized transition-none"
                  title="Desactivar producto"
                >
                  <UnavailableIcon className="w-4 h-4" />
                </Button>
              ) : (
                <Button 
                  onClick={() => onActivate(product.id)} 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 w-7 p-0 hover:bg-emerald-100 text-slate-600 hover:text-emerald-700 btn-optimized transition-none"
                  title="Activar producto"
                >
                  <Tick01Icon className="w-4 h-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ⚡ Comparación ULTRA AGRESIVA - solo re-renderizar si cambia el ID del producto
// Esto evita re-renders durante hover porque los handlers inline no afectan la comparación
const areEqual = (prevProps: ProductTableRowProps, nextProps: ProductTableRowProps) => {
  // Si es el mismo producto (mismo ID), NO re-renderizar
  // Esto es seguro porque los datos del producto no cambian durante hover
  return prevProps.product.id === nextProps.product.id;
};

export const ProductTableRow = memo(ProductTableRowComponent, areEqual);
