'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Home01Icon,
  Building01Icon,
  Store01Icon,
  UserMultipleIcon,
  SecurityCheckIcon,
  PackageIcon,
  PackageDeliveredIcon,
  UserAccountIcon,
  ShoppingCart01Icon,
  Globe02Icon,
  ShoppingCart02Icon,
  CalculatorIcon,
  Analytics01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Logout01Icon,
  UserCircleIcon,
  Menu01Icon,
  ShoppingBag02Icon
} from 'hugeicons-react';

interface SidebarProps {
  role: string;
  currentBranch?: { name: string; logoUrl?: string | null } | null;
  onProfileClick: () => void;
  onLogout: () => void;
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  category?: string;
}

export function ExpandableSidebar({ role, currentBranch, onProfileClick, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  // Cargar estado guardado
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-pinned');
    if (saved === 'true') {
      setIsPinned(true);
      setIsExpanded(true);
    }
  }, []);

  // Guardar estado
  const togglePin = () => {
    const newPinned = !isPinned;
    setIsPinned(newPinned);
    localStorage.setItem('sidebar-pinned', String(newPinned));
    if (!newPinned) {
      setIsExpanded(false);
    }
  };

  const handleMouseEnter = () => {
    if (!isPinned) {
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isPinned) {
      setIsExpanded(false);
    }
  };

  // Menús por rol
  const tiMenuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Resumen', icon: Home01Icon, category: 'Principal' },
    { href: '/dashboard/businesses', label: 'Clientes', icon: Building01Icon, category: 'Principal' },
    { href: '/dashboard/branches', label: 'Sucursales', icon: Store01Icon, category: 'Principal' },
    { href: '/dashboard/users', label: 'Usuarios', icon: UserMultipleIcon, category: 'Gestión' },
    { href: '/dashboard/audit', label: 'Auditoría', icon: SecurityCheckIcon, category: 'Gestión' },
  ];

  const shopMenuItems: MenuItem[] = [
    { href: '/dashboard', label: 'Resumen', icon: Home01Icon, category: 'Principal' },
    { href: '/dashboard/products', label: 'Productos', icon: ShoppingBag02Icon, category: 'Inventario' },
    { href: '/dashboard/combos', label: 'Combos', icon: PackageIcon, category: 'Inventario' },
    { href: '/dashboard/inventory', label: 'Inventario', icon: PackageDeliveredIcon, category: 'Inventario' },
    { href: '/dashboard/cash-sessions', label: 'Corte de Turnos', icon: UserAccountIcon, category: 'Ventas' },
    { href: '/dashboard/purchases', label: 'Compras', icon: ShoppingCart01Icon, category: 'Compras' },
    { href: '/dashboard/accounting', label: 'Contabilidad', icon: CalculatorIcon, category: 'Finanzas' },
    { href: '/dashboard/reports', label: 'Reportes', icon: Analytics01Icon, category: 'Finanzas' },
    { href: '/dashboard/users', label: 'Personal', icon: UserMultipleIcon, category: 'Administración' },
    { href: '/dashboard/branches', label: 'Sucursales', icon: Store01Icon, category: 'Administración' },
    { href: '/dashboard/hr', label: 'Recursos Humanos', icon: UserAccountIcon, category: 'Administración' },
  ];

  const menuItems = role === 'SUPER_ADMIN' ? tiMenuItems : shopMenuItems;

  // Agrupar por categoría
  const groupedItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'Otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  // Logo superior
  let TopLogo;
  if (role === 'SUPER_ADMIN') {
    TopLogo = <SecurityCheckIcon className="text-slate-800" size={20} strokeWidth={2} />;
  } else if (role === 'OWNER') {
    TopLogo = <Globe02Icon className="text-slate-800" size={20} strokeWidth={2} />;
  } else {
    if (currentBranch?.logoUrl) {
      TopLogo = <img src={currentBranch.logoUrl} alt="Logo" className="w-full h-full object-cover" />;
    } else {
      TopLogo = <Store01Icon className="text-slate-800" size={20} strokeWidth={2} />;
    }
  }

  const tooltipLabelLogo = role === 'SUPER_ADMIN' ? 'Sistemas TI' : role === 'OWNER' ? 'Gerencia Global' : currentBranch?.name || 'Mi Sucursal';

  return (
    <TooltipProvider delayDuration={0}>
      <aside 
        className={`h-full flex flex-col py-4 shrink-0 hidden lg:flex relative z-40 bg-transparent border-none transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-64' : 'w-[64px]'
        }`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        
        {/* Top Logo */}
        <div className="px-2 mb-6">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-3 ${isExpanded ? 'px-3' : 'justify-center'}`}>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-sm overflow-hidden">
                  {TopLogo}
                </div>
                {isExpanded && (
                  <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-200">
                    <p className="text-sm font-black text-slate-900 truncate">{tooltipLabelLogo}</p>
                    <p className="text-xs text-slate-500 truncate">{role === 'SUPER_ADMIN' ? 'Admin' : role}</p>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                {tooltipLabelLogo}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Toggle Pin Button */}
        {isExpanded && (
          <div className="px-2 mb-4 animate-in fade-in slide-in-from-left-2 duration-200">
            <button
              onClick={togglePin}
              className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-white hover:text-slate-900 transition-colors"
            >
              <span>{isPinned ? 'Desfijar sidebar' : 'Fijar sidebar'}</span>
              {isPinned ? (
                <ArrowLeft01Icon className="w-3.5 h-3.5" strokeWidth={2} />
              ) : (
                <ArrowRight01Icon className="w-3.5 h-3.5" strokeWidth={2} />
              )}
            </button>
          </div>
        )}

        {/* Navigation Links por Categoría */}
        <nav className="flex flex-col gap-6 w-full px-2 flex-1 overflow-y-auto custom-scrollbar">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              {isExpanded && (
                <div className="px-3 mb-2 animate-in fade-in slide-in-from-left-2 duration-200">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{category}</p>
                </div>
              )}
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>
                        <Link 
                          href={item.href} 
                          className={`relative flex items-center gap-3 rounded-xl transition-all duration-200 ${
                            isExpanded ? 'px-3 py-2.5' : 'justify-center w-10 h-10 mx-auto'
                          } ${
                            isActive 
                              ? 'bg-slate-900 text-white shadow-md' 
                              : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900'
                          }`}
                        >
                          <Icon size={isActive ? 20 : 18} strokeWidth={2} className="shrink-0" />
                          {isExpanded && (
                            <span className="text-sm font-semibold truncate animate-in fade-in slide-in-from-left-2 duration-200">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      </TooltipTrigger>
                      {!isExpanded && (
                        <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                          {item.label}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="flex flex-col gap-3 w-full px-2 items-center mt-auto pt-4 border-t border-slate-200">
          
          {/* POS Button */}
          {role !== 'SUPER_ADMIN' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link 
                  href="/dashboard/pos" 
                  className={`flex items-center gap-3 rounded-xl transition-colors shadow-sm ${
                    isExpanded ? 'w-full px-3 py-2.5' : 'w-10 h-10 justify-center'
                  } ${
                    pathname === '/dashboard/pos' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-emerald-500 text-white hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  <ShoppingCart02Icon size={16} strokeWidth={2} className="shrink-0" />
                  {isExpanded && (
                    <span className="text-sm font-bold animate-in fade-in slide-in-from-left-2 duration-200">
                      Ir al POS
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                  Ir al POS
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Profile */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onProfileClick} 
                className={`flex items-center gap-3 rounded-xl text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all ${
                  isExpanded ? 'w-full px-3 py-2.5' : 'w-10 h-10 justify-center'
                }`}
              >
                <UserCircleIcon size={20} strokeWidth={2} className="shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-semibold animate-in fade-in slide-in-from-left-2 duration-200">
                    Mi Perfil
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                Mi Perfil
              </TooltipContent>
            )}
          </Tooltip>

          {/* Logout */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button 
                onClick={onLogout} 
                className={`flex items-center gap-3 rounded-xl text-slate-400 hover:bg-white hover:shadow-sm hover:text-red-500 transition-colors ${
                  isExpanded ? 'w-full px-3 py-2.5' : 'w-10 h-10 justify-center'
                }`}
              >
                <Logout01Icon size={20} strokeWidth={2} className="shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-semibold animate-in fade-in slide-in-from-left-2 duration-200">
                    Cerrar Sesión
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                Cerrar Sesión
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
