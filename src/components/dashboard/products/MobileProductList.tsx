'use client';

import { memo } from 'react';
import { ProductCard } from './ProductCard';
import type { Product, Branch } from './types';

interface MobileProductListProps {
  products: (Product & { _meta?: any })[];
  branches?: Branch[];
  canViewOthers: boolean;
  userBranchId?: string;
  onEdit: (product: Product) => void;
  onKardex: (product: Product) => void;
}

function MobileProductListComponent({
  products,
  branches,
  canViewOthers,
  userBranchId,
  onEdit,
  onKardex,
}: MobileProductListProps) {
  return (
    <div className="space-y-2.5">
      {products.map(product => {
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
  // Si la longitud cambió, definitivamente re-renderizar
  if (prevProps.products.length !== nextProps.products.length) return false;
  
  // Comparar IDs de productos (más rápido que comparar objetos completos)
  const prevIds = prevProps.products.map(p => p.id).join(',');
  const nextIds = nextProps.products.map(p => p.id).join(',');
  if (prevIds !== nextIds) return false;
  
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
