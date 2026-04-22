'use client';

import { memo } from 'react';
import { ProductCard } from './ProductCard';
import { SimpleProductCard } from './SimpleProductCard';
import type { Product, Branch } from './types';

interface MobileProductListProps {
  products: (Product & { _meta?: any })[];
  branches?: Branch[];
  canViewOthers: boolean;
  userBranchId?: string;
  onEdit: (product: Product) => void;
  onKardex: (product: Product) => void;
  isInitialRender?: boolean; // ⚡ Nueva prop para primer render
}

function MobileProductListComponent({
  products,
  branches,
  canViewOthers,
  userBranchId,
  onEdit,
  onKardex,
  isInitialRender = false,
}: MobileProductListProps) {
  return (
    <div className="space-y-2.5">
      {products.map(product => {
        // ⚡ OPTIMIZACIÓN CARGA INICIAL: Usar tarjetas simples en el primer render
        if (isInitialRender) {
          return (
            <SimpleProductCard
              key={product.id}
              product={product}
            />
          );
        }
        
        // Tarjetas completas después del primer render
        const { canEditThis } = product._meta || {};
        
        return (
          <ProductCard
            key={product.id}
            product={product}
            branches={branches}
            canEdit={canEditThis}
            canViewOthers={canViewOthers}
            userBranchId={userBranchId}
            onEdit={onEdit}
            onKardex={onKardex}
          />
        );
      })}
    </div>
  );
}

// Comparación personalizada - solo re-renderizar si los productos cambian
const areEqual = (prevProps: MobileProductListProps, nextProps: MobileProductListProps) => {
  // Si cambió el modo de render, re-renderizar
  if (prevProps.isInitialRender !== nextProps.isInitialRender) return false;
  
  // Si la longitud cambió, definitivamente re-renderizar
  if (prevProps.products.length !== nextProps.products.length) return false;
  
  // Comparar IDs de productos (más rápido que comparar objetos completos)
  const prevIds = prevProps.products.map(p => p.id).join(',');
  const nextIds = nextProps.products.map(p => p.id).join(',');
  if (prevIds !== nextIds) return false;
  
  // En el primer render, no necesitamos comparar stocks (no se muestran)
  if (prevProps.isInitialRender || nextProps.isInitialRender) return true;
  
  // Comparar primera y última cantidad de stock (detectar cambios sin iterar todo)
  if (prevProps.products.length > 0) {
    const firstPrev = prevProps.products[0]._meta?.totalStock;
    const firstNext = nextProps.products[0]._meta?.totalStock;
    if (firstPrev !== firstNext) return false;
    
    const lastPrev = prevProps.products[prevProps.products.length - 1]._meta?.totalStock;
    const lastNext = nextProps.products[nextProps.products.length - 1]._meta?.totalStock;
    if (lastPrev !== lastNext) return false;
  }
  
  // Si llegamos aquí, probablemente no hay cambios relevantes
  return true;
};

export const MobileProductList = memo(MobileProductListComponent, areEqual);
