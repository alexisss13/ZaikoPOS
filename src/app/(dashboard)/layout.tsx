'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { 
  Menu, X, LayoutDashboard, ShoppingBag, 
  Package, Users, Store, LogOut, ShieldCheck, 
  Tags, Building2, LifeBuoy
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { role, name, logout } = useAuth();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    window.location.href = '/login';
  };

  const tiMenuItems = [
    { href: '/dashboard', label: 'Resumen Global', icon: LayoutDashboard },
    { href: '/dashboard/businesses', label: 'Clientes (SaaS)', icon: Building2 },
    { href: '/dashboard/branches', label: 'Red de Sucursales', icon: Store },
    { href: '/dashboard/users', label: 'Usuarios Sistema', icon: Users },
    { href: '/dashboard/audit', label: 'Logs del Sistema', icon: ShieldCheck },
  ];

  const shopMenuItems = [
    { href: '/dashboard', label: 'Resumen Tienda', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Inventario', icon: Package },
    { href: '/dashboard/categories', label: 'Categorías', icon: Tags },
    { href: '/dashboard/users', label: 'Mi Personal', icon: Users },
    { href: '/dashboard/branches', label: 'Mis Sucursales', icon: Store },
    { href: '/dashboard/audit', label: 'Auditoría Caja', icon: ShieldCheck },
    { href: '/pos', label: 'Ir al POS', icon: ShoppingBag },
  ];

  const menuItems = role === 'SUPER_ADMIN' ? tiMenuItems : shopMenuItems;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      
      {/* SIDEBAR DESKTOP */}
      <aside className={`hidden md:flex flex-col bg-slate-950 text-slate-400 transition-all duration-300 shadow-xl border-r border-slate-800 ${isCollapsed ? 'w-20' : 'w-64'}`}>
        <div className="h-16 flex items-center justify-center border-b border-slate-800 bg-slate-950">
          {!isCollapsed ? (
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-600/20">
                <Store className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black text-white tracking-wide truncate">
                {role === 'SUPER_ADMIN' ? 'F&F TI' : 'F&F ADMIN'}
              </span>
            </div>
          ) : (
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-600/20">
              <Store className="h-5 w-5 text-white" />
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto py-6 space-y-1.5 px-3">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <span className={`flex items-center px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600 text-white font-semibold shadow-md' 
                    : 'hover:bg-slate-900 hover:text-slate-200'
                } ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
                  <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!isCollapsed && <span className="ml-3 truncate">{item.label}</span>}
                </span>
              </Link>
            );
          })}
        </nav>

        {role === 'SUPER_ADMIN' && !isCollapsed && (
          <div className="mx-4 mb-4 p-3 bg-slate-900 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">
              <LifeBuoy className="w-3 h-3 text-blue-500" /> Soporte TI
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              Monitorizando ecosistema F&F. Sistema estable.
            </p>
          </div>
        )}

        <div className="p-4 border-t border-slate-800 bg-slate-950">
          <Button variant="ghost" className={`w-full text-red-400 hover:text-red-300 hover:bg-red-950/50 ${isCollapsed ? 'px-0 justify-center' : 'justify-start'}`} onClick={handleLogout}>
            <LogOut className="w-5 h-5" />
            {!isCollapsed && <span className="ml-3 font-medium">Cerrar Sistema</span>}
          </Button>
        </div>
      </aside>

      {/* ÁREA DE CONTENIDO */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b flex items-center justify-between px-4 sm:px-6 shadow-sm z-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setIsCollapsed(!isCollapsed)} className="hidden md:flex text-slate-500 hover:bg-slate-100">
              <Menu className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(true)} className="md:hidden text-slate-500">
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="font-bold text-slate-800 hidden md:block">
              {role === 'SUPER_ADMIN' ? 'Infraestructura SaaS' : 'Control Administrativo F&F'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-900 leading-none">{name}</p>
              <p className="text-[10px] uppercase font-black tracking-widest text-blue-600 mt-1">
                {role === 'SUPER_ADMIN' ? 'Ingeniero de Sistemas' : role}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-white ring-2 ring-blue-100">
              {name?.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
          {children}
        </main>
      </div>

      {/* SIDEBAR MOBILE */}
      <aside className={`fixed inset-y-0 left-0 bg-slate-950 text-slate-300 w-64 transform transition-transform duration-300 z-40 md:hidden border-r border-slate-800 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
          <span className="text-lg font-black text-white tracking-wider flex items-center gap-2">
            <Store className="w-5 h-5 text-blue-500" /> F&F SAAS
          </span>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileOpen(false)} className="text-slate-400">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <nav className="py-4 px-2 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileOpen(false)}>
                <span className={`flex items-center px-4 py-3 rounded-lg ${isActive ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-400 hover:bg-slate-900'}`}>
                  <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span className="ml-3 font-medium">{item.label}</span>
                </span>
              </Link>
            )
          })}
        </nav>
      </aside>
    </div>
  );
}