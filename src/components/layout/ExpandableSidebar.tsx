'use client';

import { useState, useEffect, useRef } from 'react';
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
  ShoppingBag01Icon,
  CalculatorIcon,
  Analytics01Icon,
  ArrowRight01Icon,
  ArrowLeft01Icon,
  Logout01Icon,
  UserCircleIcon,
  Notification01Icon,
  Loading02Icon
} from 'hugeicons-react';

interface SidebarProps {
  role: string;
  currentBranch?: { name: string; logoUrl?: string | null } | null;
  onProfileClick: () => void;
  onLogout: () => void;
  notifications?: any[];
  unreadCount: number;
  loadingNotifs: boolean;
  showNotifs: boolean;
  setShowNotifs: (show: boolean) => void;
  onNotificationClick: (notif: any) => void;
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  category?: string;
}

export function ExpandableSidebar({ 
  role, 
  currentBranch, 
  onProfileClick, 
  onLogout,
  notifications,
  unreadCount,
  loadingNotifs,
  showNotifs,
  setShowNotifs,
  onNotificationClick
}: SidebarProps) {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);
  const [tooltipsDisabled, setTooltipsDisabled] = useState(false);

  // Cargar estado guardado
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-expanded');
    if (saved === 'true') {
      setIsExpanded(true);
    }
  }, []);

  // Guardar estado y deshabilitar tooltips temporalmente
  const toggleExpand = () => {
    const newExpanded = !isExpanded;
    
    // Deshabilitar tooltips durante la transición
    setTooltipsDisabled(true);
    
    setIsExpanded(newExpanded);
    localStorage.setItem('sidebar-expanded', String(newExpanded));
    
    // Rehabilitar tooltips después de la animación
    setTimeout(() => {
      setTooltipsDisabled(false);
    }, 500);
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
    { href: '/dashboard/products', label: 'Productos', icon: PackageIcon, category: 'Inventario' },
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
    <>
      <TooltipProvider delayDuration={300} skipDelayDuration={0}>
        <aside 
          className={`h-full flex flex-col py-4 shrink-0 hidden lg:flex relative z-40 bg-transparent border-none transition-all duration-300 ease-in-out ${
            isExpanded ? 'w-56' : 'w-[64px]'
          }`}
        >
        
        {/* Top Logo */}
        <div className="px-2 mb-6">
          <Tooltip open={tooltipsDisabled || isExpanded ? false : undefined}>
            <TooltipTrigger asChild>
              <div className={`flex items-center gap-3 ${isExpanded ? 'px-3' : 'justify-center'}`}>
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-200 shadow-sm overflow-hidden">
                  {TopLogo}
                </div>
                {isExpanded && (
                  <div className="flex-1 min-w-0 opacity-100 transition-opacity duration-300">
                    <p className="text-sm font-black text-slate-900 truncate">{tooltipLabelLogo}</p>
                    <p className="text-xs text-slate-500 truncate">{role === 'SUPER_ADMIN' ? 'Admin' : role}</p>
                  </div>
                )}
              </div>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" sideOffset={8} className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl">
                {tooltipLabelLogo}
              </TooltipContent>
            )}
          </Tooltip>
        </div>

        {/* Navigation Links por Categoría */}
        <nav className="flex flex-col gap-6 w-full px-2 flex-1 overflow-y-auto scrollbar-hide">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              {isExpanded && (
                <div className="px-3 mb-2 opacity-100 transition-opacity duration-300">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{category}</p>
                </div>
              )}
              <div className="flex flex-col gap-1">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <Tooltip key={item.href} open={tooltipsDisabled || isExpanded ? false : undefined}>
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
                            <span className="text-sm font-semibold truncate opacity-100 transition-opacity duration-300">
                              {item.label}
                            </span>
                          )}
                        </Link>
                      </TooltipTrigger>
                      {!isExpanded && (
                        <TooltipContent side="right" sideOffset={8} className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl">
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
            <Tooltip open={tooltipsDisabled || isExpanded ? false : undefined}>
              <TooltipTrigger asChild>
                <Link 
                  href="/dashboard/pos" 
                  className={`flex items-center gap-3 rounded-xl transition-colors shadow-sm ${
                    isExpanded ? 'w-full px-3 py-2.5' : 'w-10 h-10 justify-center'
                  } ${
                    pathname === '/dashboard/pos' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                  }`}
                >
                  <ShoppingBag01Icon size={16} strokeWidth={2} className="shrink-0" />
                  {isExpanded && (
                    <span className="text-sm font-bold opacity-100 transition-opacity duration-300">
                      Ir al POS
                    </span>
                  )}
                </Link>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right" sideOffset={8} className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl">
                  Ir al POS
                </TooltipContent>
              )}
            </Tooltip>
          )}

          {/* Notifications */}
          <div className="relative flex w-full justify-center">
            <Tooltip open={tooltipsDisabled || isExpanded ? false : undefined}>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowNotifs(!showNotifs)} 
                  className={`relative flex items-center gap-3 rounded-xl text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all outline-none ${
                    isExpanded ? 'w-full px-3 py-2.5' : 'w-10 h-10 justify-center'
                  }`}
                >
                  <Notification01Icon size={20} strokeWidth={2} className="shrink-0" />
                  {unreadCount > 0 && (
                    <span className={`absolute bg-red-500 rounded-full shadow-sm ring-2 ring-slate-100 ${
                      isExpanded ? 'top-2 left-8 w-2 h-2' : 'top-2 right-2 w-2 h-2'
                    }`} />
                  )}
                  {isExpanded && (
                    <span className="text-sm font-semibold opacity-100 transition-opacity duration-300">
                      Notificaciones
                    </span>
                  )}
                  {isExpanded && unreadCount > 0 && (
                    <span className="ml-auto text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                      {unreadCount}
                    </span>
                  )}
                </button>
              </TooltipTrigger>
              {!isExpanded && (
                <TooltipContent side="right" sideOffset={8} className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl">
                  Notificaciones
                </TooltipContent>
              )}
            </Tooltip>

            {/* Panel de Notificaciones */}
            {showNotifs && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                <div className={`absolute ${isExpanded ? 'left-0 right-0' : 'left-[4.5rem]'} bottom-0 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-left-4`}>
                  <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
                    {unreadCount > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">{unreadCount} Nuevas</span>}
                  </div>
                  <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1.5 bg-slate-50/50">
                    {loadingNotifs ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        <Loading02Icon className="animate-spin mx-auto mb-2" size={20} strokeWidth={2} /> Cargando...
                      </div>
                    ) : notifications?.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        <Notification01Icon className="text-slate-300 mx-auto mb-2" size={24} strokeWidth={2} /> Sin notificaciones
                      </div>
                    ) : (
                      notifications?.map(n => (
                        <button key={n.id} onClick={() => onNotificationClick(n)} className={`w-full p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-colors cursor-pointer ${!n.read ? 'bg-white border-slate-300 shadow-sm hover:border-slate-400' : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-slate-100'}`}>
                          <div className="flex justify-between items-start gap-2 w-full">
                            <span className={`text-xs leading-tight ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>{n.title}</span>
                            <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap shrink-0">{new Date(n.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 leading-snug">{n.message}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="w-6 h-px bg-slate-300 my-1" />

          {/* Profile */}
          <Tooltip open={tooltipsDisabled || isExpanded ? false : undefined}>
            <TooltipTrigger asChild>
              <button 
                onClick={onProfileClick} 
                className={`flex items-center gap-3 rounded-xl text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all ${
                  isExpanded ? 'w-full px-3 py-2.5' : 'w-10 h-10 justify-center'
                }`}
              >
                <UserCircleIcon size={20} strokeWidth={2} className="shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-semibold opacity-100 transition-opacity duration-300">
                    Mi Perfil
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" sideOffset={8} className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl">
                Mi Perfil
              </TooltipContent>
            )}
          </Tooltip>

          {/* Logout */}
          <Tooltip open={tooltipsDisabled || isExpanded ? false : undefined}>
            <TooltipTrigger asChild>
              <button 
                onClick={onLogout} 
                className={`flex items-center gap-3 rounded-xl text-slate-400 hover:bg-white hover:shadow-sm hover:text-red-500 transition-colors ${
                  isExpanded ? 'w-full px-3 py-2.5' : 'w-10 h-10 justify-center'
                }`}
              >
                <Logout01Icon size={20} strokeWidth={2} className="shrink-0" />
                {isExpanded && (
                  <span className="text-sm font-semibold opacity-100 transition-opacity duration-300">
                    Cerrar Sesión
                  </span>
                )}
              </button>
            </TooltipTrigger>
            {!isExpanded && (
              <TooltipContent side="right" sideOffset={8} className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl">
                Cerrar Sesión
              </TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>

    {/* Botón Flotante de Toggle - Sale del borde del sidebar */}
    <button
      onClick={toggleExpand}
      className={`hidden lg:flex items-center justify-center w-6 h-6 rounded-full  bg-slate-100 text-slate-500 hover:bg-slate-300 transition-all hover:shadow-xl fixed top-20 z-50 ${
        isExpanded ? 'left-[13.5rem]' : 'left-[3.75rem]'
      } transition-all duration-300 ease-in-out`}
      title={isExpanded ? 'Colapsar sidebar' : 'Expandir sidebar'}
    >
      {isExpanded ? (
        <ArrowLeft01Icon className="w-3.5 h-3.5" strokeWidth={3} />
      ) : (
        <ArrowRight01Icon className="w-3.5 h-3.5" strokeWidth={3} />
      )}
    </button>
  </>
  );
}
