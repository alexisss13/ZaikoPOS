'use client';

import { memo } from 'react';
import { Package, Image as ImageIcon, Banknote } from 'lucide-react';
import type { Product } from './types';

interface SimpleProductCardProps {
  product: Product;
}

// ⚡ Versión ultra-simplificada para el primer render
// Sin cálculos pesados, sin estados complejos, solo mostrar datos básicos
function SimpleProductCardComponent({ product }: SimpleProductCardProps) {
  return (
    <div 
      className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden"
      style={{ 
        contentVisibility: 'auto',
        containIntrinsicSize: '0 100px',
        willChange: 'auto'
      }}
    >
      <div className="p-4">
        <div className="flex items-center gap-3">
          {/* Imagen simplificada */}
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden shrink-0">
            {product.images?.[0] ? (
              <img 
                src={product.images[0]} 
                alt="" 
                className="w-full h-full object-cover" 
                loading="lazy" 
                decoding="async"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>

          {/* Info básica */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-slate-900 text-sm leading-tight mb-0.5 truncate">
              {product.title}
            </h3>
            <div className="flex items-center gap-1.5 mb-1.5 min-w-0">
              <span className="text-xs text-slate-400 truncate max-w-[110px]">
                {product.category?.name || 'Sin categoría'}
              </span>
              {(product.barcode || product.code || product.sku) && (
                <>
                  <span className="w-1 h-1 bg-slate-200 rounded-full shrink-0" />
                  <span className="text-[10px] font-mono text-slate-300 truncate max-w-[70px]">
                    {product.barcode || product.code || product.sku}
                  </span>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Banknote className="w-3 h-3 text-slate-400" />
                <span className="text-sm font-bold text-slate-900">
                  S/ {Number(product.basePrice).toFixed(2)}
                </span>
              </div>
              {/* Stock simplificado - sin cálculos complejos */}
              <div className="px-2 py-0.5 rounded-full text-xs font-bold border bg-slate-50 text-slate-600 border-slate-200">
                <Package className="w-3 h-3 inline mr-1" />
                Stock
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Comparación ultra-simple - solo ID del producto
const areEqual = (prevProps: SimpleProductCardProps, nextProps: SimpleProductCardProps) => {
  return prevProps.product.id === nextProps.product.id;
};

export const SimpleProductCard = memo(SimpleProductCardComponent, areEqual);