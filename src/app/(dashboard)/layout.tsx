'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { 
  Menu, X, LayoutDashboard, ShoppingBag, 
  Package, Users, Store, LogOut, ShieldCheck, 
  Tags, Building2, HardDrive, LifeBuoy
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { role, name, logout } = useAuth();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    window.location.href = '/login';
  };

  // ==========================================
  // 🔐 MENÚS SEGREGADOS POR RESPONSABILIDAD
  // ==========================================
  
  // 1. Menú para Software TI (Visión Infraestructura/SaaS)
  const tiMenuItems = [
    { href: '/dashboard', label: 'Resumen Global', icon: LayoutDashboard },
    { href: '/dashboard/businesses', label: 'Clientes (SaaS)', icon: Building2 },
    { href: '/dashboard/branches', label: 'Red de Sucursales', icon: Store },
    { href: '/dashboard/users', label: 'Usuarios Sistema', icon: Users },
    { href: '/dashboard/audit', label: 'Logs del Sistema', icon: ShieldCheck },
    { href: '/dashboard/health', label: 'Estado Servidores', icon: HardDrive },
  ];

  // 2. Menú para Dueños/Managers (Visión Operativa de Tienda)
  const shopMenuItems = [
    { href: '/dashboard', label: 'Resumen Tienda', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Inventario', icon: Package },
    { href: '/dashboard/categories', label: 'Categorías', icon: Tags },
    { href: '/dashboard/users', label: 'Mi Personal', icon: Users },
    { href: '/dashboard/branches', label: 'Mis Sucursales', icon: Store },
    { href: '/dashboard/audit', label: 'Auditoría Caja', icon: ShieldCheck },
    { href: '/pos', label: 'Ir al POS', icon: ShoppingBag },
  ];

  // Seleccionamos el menú basado en el rol
  const menuItems = role === 'SUPER_ADMIN' ? tiMenuItems : shopMenuItems;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      
      {/* SIDEBAR DESKTOP */}
      <aside className={`hidden md:flex flex-col bg-slate-900 text-slate-300 transition-all duration-300 shadow-xl ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-16 flex items-center justify-center border-b border-slate-800 bg-slate-950/50">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-wider truncate">
                {role === 'SUPER_ADMIN' ? 'ZAIKO TI' : 'ZAIKO ADMIN'}
              </span>
            </div>
          ) : (
            <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
              <Store className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-4 space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center px-3 py-3 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive ? 'bg-primary text-white font-medium shadow-md translate-x-1' : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* SOPORTE (Solo para TI) */}
        {role === 'SUPER_ADMIN' && !isCollapsed && (
          <div className="mx-4 mb-4 p-3 bg-slate-800/50 rounded-xl border border-slate-700/50">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase">
              <LifeBuoy className="w-3 h-3" /> Soporte TI
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Monitorizando 2 negocios activos. Sistema estable.
            </p>
          </div>
        )}

        <div className="p-4 border-t border-slate-800">
          <Button variant="ghost" className={`w-full text-red-400 hover:text-red-300 hover:bg-red-400/10 ${isCollapsed ? 'px-0 justify-center' : 'justify-start'}`} onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3 font-medium">Cerrar Sistema</span>}
          </Button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex">
              <Menu className="w-5 h-5 text-slate-600" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="md:hidden">
              <Menu className="w-5 h-5 text-slate-600" />
            </Button>
            <h2 className="font-semibold text-slate-800 hidden md:block">
              {role === 'SUPER_ADMIN' ? 'Infraestructura SaaS' : 'Control Administrativo'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none">{name}</p>
              <p className="text-[10px] uppercase font-bold text-primary mt-1">
                {role === 'SUPER_ADMIN' ? 'Ingeniero de Sistemas' : role}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold border-2 border-white shadow-sm ring-2 ring-primary/20">
              {name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* SIDEBAR MOBILE */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-900 text-slate-300 w-64 transform transition-transform duration-300 z-40 md:hidden ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <span className="text-lg font-bold text-white uppercase tracking-tighter">Zaiko SaaS</span>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="py-4 px-2 space-y-1">
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
              <span className={`flex items-center px-4 py-3 rounded-lg ${pathname === item.href ? 'bg-primary text-white font-bold' : 'text-slate-400'}`}>
                <item.icon className="w-5 h-5" />
                <span className="ml-3 font-medium">{item.label}</span>
              </span>
            </Link>
          ))}
        </nav>
      </aside>
    </div>
  );
}