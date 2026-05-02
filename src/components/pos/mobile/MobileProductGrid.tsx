'use client';

import { memo } from 'react';
import { PackageIcon, ArrowDataTransferDiagonalIcon, Tag01Icon } from 'hugeicons-react';

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  barcode: string | null;
  price: number | null;
  cost: number;
  minStock: number;
  active: boolean;
  attributes: unknown;
  images: string[];
  stock: { branchId: string; quantity: number }[];
}

interface Product {
  id: string;
  title: string;
  basePrice: number;
  wholesalePrice: number | null;
  wholesaleMinCount: number | null;
  discountPercentage: number;
  images: string[];
  categoryId: string;
  category?: { name: string; ecommerceCode: string | null };
  variants: ProductVariant[];
}

interface MobileProductGridProps {
  products: Product[];
  onProductClick: (product: Product, variant: ProductVariant) => void;
  getLocalStock: (variant: ProductVariant) => number;
  getGlobalStock: (variant: ProductVariant) => number;
  disabled?: boolean;
}

// ⚡ Componente individual de producto memoizado
interface ProductCardProps {
  product: Product;
  variant: ProductVariant;
  localStock: number;
  globalStock: number;
  disabled: boolean;
  onProductClick: (product: Product, variant: ProductVariant) => void;
}

const ProductCard = memo(function ProductCard({
  product,
  variant,
  localStock,
  globalStock,
  disabled,
  onProductClick,
}: ProductCardProps) {
  const externalStock = globalStock - localStock;
  const isOutOfStock = localStock <= 0;
  const hasDiscount = product.discountPercentage > 0;
  const hasWholesale = product.wholesalePrice && product.wholesaleMinCount;
  const displayPrice = product.basePrice;
  const displayImages = (variant.images && variant.images.length > 0) ? variant.images : product.images;

  return (
    <div
      onClick={() => !disabled && onProductClick(product, variant)}
      className={`group relative flex flex-col gap-2 p-2.5 rounded-2xl select-none bg-white border ${
        isOutOfStock
          ? 'opacity-80 border-slate-200 border-dashed cursor-pointer'
          : 'cursor-pointer border-slate-100'
      } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
      style={{ 
        WebkitTapHighlightColor: 'transparent',
        transform: 'translateZ(0)',
        contain: 'layout style paint',
        contentVisibility: 'auto',
        containIntrinsicSize: '0 200px'
      }}
    >
      {/* Imagen */}
      <div
        className={`aspect-square bg-slate-50 rounded-xl relative overflow-hidden shrink-0 border border-slate-100 ${
          isOutOfStock ? 'grayscale opacity-70' : ''
        }`}
        style={{ transform: 'translateZ(0)' }}
      >
        {displayImages?.[0] ? (
          <img
            src={displayImages[0]}
            alt={product.title}
            className="w-full h-full object-cover mix-blend-multiply"
            draggable={false}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <PackageIcon className="w-8 h-8" />
          </div>
        )}

        {/* Badge de stock */}
        <div className="absolute top-1.5 right-1.5 flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shadow-sm leading-none backdrop-blur-md ${
              isOutOfStock ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-700'
            }`}
          >
            {localStock} un.
          </span>
          {hasDiscount && !isOutOfStock && (
            <span className="text-[9px] font-bold bg-slate-800 text-white px-1.5 py-0.5 rounded-md shadow-sm leading-none">
              -{product.discountPercentage}%
            </span>
          )}
        </div>
      </div>

      {/* Info del producto */}
      <div className="px-1 pb-1 flex flex-col justify-between flex-1 gap-1.5">
        <p className="font-medium text-slate-700 text-sm leading-tight line-clamp-2" title={product.title}>
          {product.title}
        </p>

        <div className="mt-auto">
          {isOutOfStock && externalStock > 0 ? (
            <p className="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-1.5 rounded-lg border border-amber-200 flex items-center gap-1">
              <ArrowDataTransferDiagonalIcon className="w-3 h-3" /> Pedir Traslado
            </p>
          ) : isOutOfStock ? (
            <p className="text-[10px] font-semibold text-red-500">Agotado Totalmente</p>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <p className="text-slate-900 font-semibold text-base">
                  S/ {Number(displayPrice).toFixed(2)}
                </p>
                {hasDiscount && (
                  <p className="text-[10px] text-slate-400 line-through">
                    S/ {(Number(displayPrice) * (1 / (1 - product.discountPercentage / 100))).toFixed(2)}
                  </p>
                )}
              </div>
              {hasWholesale && (
                <p
                  className="text-[9px] font-medium text-slate-500 mt-1 leading-none flex items-center gap-1"
                  title={`Precio por mayor a partir de ${product.wholesaleMinCount} unidades`}
                >
                  <Tag01Icon className="w-3 h-3 text-blue-500" />
                  Mayor S/{Number(product.wholesalePrice).toFixed(2)}
                  <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-md text-[9px] font-semibold ml-auto">
                    ≥{product.wholesaleMinCount}u
                  </span>
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian datos críticos
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.localStock === nextProps.localStock &&
    prevProps.disabled === nextProps.disabled
  );
});

function MobileProductGridComponent({
  products,
  onProductClick,
  getLocalStock,
  getGlobalStock,
  disabled = false,
}: MobileProductGridProps) {
  
  if (products.length === 0) {
    return (
      <div className="col-span-2 h-64 flex items-center justify-center text-slate-400 text-sm font-medium">
        No hay productos disponibles
      </div>
    );
  }

  return (
    <>
      {products.map(product => {
        // Use the standard variant or first active variant
        const variant = product.variants.find(v => v.name === 'Estándar') || product.variants[0];
        if (!variant) return null;

        const localStock = getLocalStock(variant);
        const globalStock = getGlobalStock(variant);

        return (
          <ProductCard
            key={`${product.id}-${variant.id}`}
            product={product}
            variant={variant}
            localStock={localStock}
            globalStock={globalStock}
            disabled={disabled}
            onProductClick={onProductClick}
          />
        );
      })}
    </>
  );
}

export const MobileProductGrid = memo(MobileProductGridComponent);
