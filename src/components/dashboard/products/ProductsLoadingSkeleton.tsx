'use client';

import { memo } from 'react';
import { Package, SlidersHorizontal, MoreHorizontal, Search } from 'lucide-react';

// Shimmer base reutilizable
const Shimmer = memo(({ className }: { className?: string }) => {
  return (
    <div className={`relative overflow-hidden bg-slate-100 rounded-xl ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
    </div>
  );
});
Shimmer.displayName = 'Shimmer';

// Tarjeta skeleton individual
const CardSkeleton = memo(({ delay = 0 }: { delay?: number }) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 p-4 shadow-sm" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3">
        {/* Imagen */}
        <Shimmer className="w-14 h-14 rounded-2xl shrink-0" />
        {/* Info */}
        <div className="flex-1 min-w-0 space-y-2">
          <Shimmer className="h-4 w-3/4" />
          <Shimmer className="h-3 w-2/5" />
          <div className="flex items-center gap-2 pt-0.5">
            <Shimmer className="h-5 w-20" />
            <Shimmer className="h-5 w-14 rounded-full" />
          </div>
        </div>
        {/* Chevron */}
        <Shimmer className="w-4 h-4 rounded-full shrink-0" />
      </div>
    </div>
  );
});
CardSkeleton.displayName = 'CardSkeleton';

export const ProductsLoadingSkeleton = memo(() => {
  return (
    <div className="flex flex-col h-full w-full gap-5">
      {/* Header skeleton */}
      <div className="flex flex-col gap-3">
        {/* Top bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Package className="w-5 h-5 text-slate-300" />
              <Shimmer className="h-6 w-28" />
            </div>
            <Shimmer className="h-3 w-20" />
          </div>
          {/* Botones top bar */}
          <div className="h-10 px-3 rounded-xl border border-slate-200 bg-white flex items-center gap-1.5 opacity-50">
            <SlidersHorizontal className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400 font-semibold">Filtros</span>
          </div>
          <div className="h-10 w-10 rounded-xl bg-slate-200 opacity-50 shrink-0" />
          <div className="h-10 w-10 rounded-xl border border-slate-200 bg-white opacity-50 shrink-0 flex items-center justify-center">
            <MoreHorizontal className="w-4 h-4 text-slate-300" />
          </div>
        </div>

        {/* Buscador */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 pointer-events-none" />
          <div className="h-10 bg-white border border-slate-200 rounded-xl w-full opacity-60" />
        </div>
      </div>

      {/* Lista de tarjetas skeleton */}
      <div className="flex flex-col flex-1 gap-2.5 overflow-hidden">
        {[0, 80, 160, 240, 320].map((delay, i) => (
          <CardSkeleton key={i} delay={delay} />
        ))}
      </div>
    </div>
  );
});
ProductsLoadingSkeleton.displayName = 'ProductsLoadingSkeleton';
