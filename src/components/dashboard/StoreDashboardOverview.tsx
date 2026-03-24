'use client';

import { Store } from 'lucide-react';

export default function StoreDashboardOverview() {
  return (
    <div className="flex flex-col items-center justify-center h-[70vh] text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
        <Store className="w-10 h-10 text-indigo-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Bienvenido a tu Tienda!</h2>
      <p className="text-slate-500 max-w-md">
        Estamos preparando el panel de resumen operativo para ti. Muy pronto verás aquí tus ventas del día, productos más vendidos y métricas de caja.
      </p>
    </div>
  );
}