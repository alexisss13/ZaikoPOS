'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { Store, ArrowLeft, Clock, Wifi } from 'lucide-react';
import { CashGuard } from '@/components/pos/CashGuard'; // 🚀 IMPORTAMOS EL GUARDIÁN DE CAJA

export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { name, role } = useAuth();
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    const timeoutId = setTimeout(() => setTime(new Date()), 0);
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => { clearTimeout(timeoutId); clearInterval(timerId); };
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-100 overflow-hidden font-sans">
      
      <header className="h-14 bg-slate-950 text-white flex items-center justify-between px-4 shrink-0 shadow-md z-20">
        <div className="flex items-center gap-3 md:gap-5">
          <Link href="/dashboard" className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border border-slate-700">
            <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">Volver</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 border-l border-slate-800 pl-5">
            <Store className="w-5 h-5 text-sky-400" />
            <span className="font-black tracking-tight text-lg">F&F <span className="text-sky-400">POS</span></span>
          </div>
        </div>

        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex items-center gap-2 text-slate-300 bg-slate-900 px-3 py-1.5 rounded-lg text-xs font-mono border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            {time ? time.toLocaleTimeString('es-PE', { hour: '2-digit', minute:'2-digit', second:'2-digit' }) : '--:--:--'}
          </div>
          
          <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2.5 py-1.5 rounded-lg">
            <Wifi className="w-3.5 h-3.5" /> En línea
          </div>
          
          <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold leading-none text-slate-100">{name}</p>
              <p className="text-[9px] text-slate-400 uppercase mt-0.5 font-bold tracking-wider">{role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-sm shadow-inner border border-blue-400">
              {name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* 🚀 EL GUARDIÁN DE CAJA: Protege el POS. Si no ha abierto caja, bloquea la vista. */}
      <main className="flex-1 overflow-hidden relative bg-slate-50">
        <CashGuard>
          {children}
        </CashGuard>
      </main>
    </div>
  );
}