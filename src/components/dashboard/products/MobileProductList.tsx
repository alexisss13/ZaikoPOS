// src/components/dashboard/products/MobileProductList.tsx
'use client';

import { memo } from 'react';
import { ProductCard } from './ProductCard';
import type { Product, Branch } from './types';

interface MobileProductListProps {
  products: Product[];
  branches?: Branch[];
  canViewOthers: boolean;
  userBranchId?: string;
  onEdit: (product: Product) => void;
  onKardex: (product: Product) => void;
}

// Memoizar la lista completa para evitar re-renders innecesarios
export const MobileProductList = memo(function MobileProductList({
  products,
  branches,
  canViewOthers,
  userBranchId,
  onEdit,
  onKardex,
}: MobileProductListProps) {
  return (
    <div 
      className="space-y-2.5" 
      style={{ 
        contentVisibility: 'auto',
        containIntrinsicSize: '0 500px'
      }}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          branches={branches}
          canEdit={true}
          canViewOthers={canViewOthers}
          userBranchId={userBranchId}
          onEdit={onEdit}
          onKardex={onKardex}
        />
      ))}
    </div>
  );
});
