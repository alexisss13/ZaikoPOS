'use client';

import { NewProductStepForm } from '@/components/dashboard/products/NewProductStepForm';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

function NewProductPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const productId = searchParams.get('edit');

  const { data: categories } = useSWR('/api/categories', fetcher);
  const { data: suppliers } = useSWR('/api/suppliers', fetcher);
  const { data: branches } = useSWR('/api/branches', fetcher);
  const { data: productToEdit } = useSWR(
    productId ? `/api/products/${productId}` : null, 
    fetcher
  );

  const handleClose = () => {
    router.push('/dashboard/products');
  };

  const handleSuccess = () => {
    router.push('/dashboard/products');
  };

  return (
    <NewProductStepForm
      onClose={handleClose}
      onSuccess={handleSuccess}
      productToEdit={productToEdit}
      categories={categories}
      suppliers={suppliers}
      branches={branches}
    />
  );
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full"><div className="text-slate-500">Cargando...</div></div>}>
      <NewProductPageContent />
    </Suspense>
  );
}