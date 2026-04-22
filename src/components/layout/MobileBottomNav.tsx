'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Menu,
  Store,
  Warehouse,
  ShoppingCart,
  ContactRound,
  Building2,
  Users,
  ShieldCheck,
  X,
  Settings,
  FileText,
  Calculator
} from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
}

interface MobileBottomNavProps {
  role: string;
}

interface DrawerItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  isActive: boolean;
  category?: string;
}

export function MobileBottomNav({ role }: MobileBottomNavProps) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Definir las 4 tabs principales del bottom nav
  const getBottomNavItems = (): BottomNavItem[] => {
    if (role === 'SUPER_ADMIN') {
      return [
        { 
          href: '/dashboard', 
          label: 'Inicio', 
          icon: LayoutDashboard, 
          isActive: pathname === '/dashboard' 
        },
        { 
          href: '/dashboard/businesses', 
          label: 'Clientes', 
          icon: Building2, 
          isActive: pathname === '/dashboard/businesses' 
        },
        { 
          href: '/dashboard/branches', 
          label: 'Sucursales', 
          icon: Store, 
          isActive: pathname === '/dashboard/branches' 
        },
        { 
          href: '#', 
          label: 'Más', 
          icon: Menu, 
          isActive: false 
        }
      ];
    } else {
      return [
        { 
          href: '/dashboard', 
          label: 'Inicio', 
          icon: LayoutDashboard, 
          isActive: pathname === '/dashboard' 
        },
        { 
          href: '/dashboard/products', 
          label: 'Catálogo', 
          icon: Package, 
          isActive: pathname === '/dashboard/products' || pathname === '/dashboard/inventory' 
        },
        { 
          href: '/dashboard/pos', 
          label: 'Ventas', 
          icon: ShoppingBag, 
          isActive: pathname === '/dashboard/pos' || pathname === '/dashboard/cash-sessions' 
        },
        { 
          href: '#', 
          label: 'Más', 
          icon: Menu, 
          isActive: false 
        }
      ];
    }
  };

  // Definir items del drawer "Más" organizados por categorías
  const getDrawerItems = (): DrawerItem[] => {
    if (role === 'SUPER_ADMIN') {
      return [
        { 
          href: '/dashboard/users', 
          label: 'Usuarios', 
          icon: Users, 
          isActive: pathname === '/dashboard/users',
          category: 'Gestión'
        },
        { 
          href: '/dashboard/audit', 
          label: 'Auditoría', 
          icon: ShieldCheck, 
          isActive: pathname === '/dashboard/audit',
          category: 'Gestión'
        }
      ];
    } else {
      return [
        // Categoría: Inventario
        { 
          href: '/dashboard/inventory', 
          label: 'Inventario', 
          icon: Warehouse, 
          isActive: pathname === '/dashboard/inventory',
          category: 'Inventario'
        },
        // Categoría: Ventas
        { 
          href: '/dashboard/cash-sessions', 
          label: 'Corte de Turnos', 
          icon: ContactRound, 
          isActive: pathname === '/dashboard/cash-sessions',
          category: 'Ventas'
        },
        // Categoría: Compras
        { 
          href: '/dashboard/purchases', 
          label: 'Compras', 
          icon: ShoppingCart, 
          isActive: pathname === '/dashboard/purchases',
          category: 'Compras'
        },
        // Categoría: Futuro (placeholder para módulos futuros)
        { 
          href: '#', 
          label: 'Contabilidad', 
          icon: Calculator, 
          isActive: false,
          category: 'Próximamente'
        },
        { 
          href: '#', 
          label: 'Reportes', 
          icon: FileText, 
          isActive: false,
          category: 'Próximamente'
        },
        { 
          href: '#', 
          label: 'Configuración', 
          icon: Settings, 
          isActive: false,
          category: 'Próximamente'
        }
      ];
    }
  };

  const bottomNavItems = getBottomNavItems();
  const drawerItems = getDrawerItems();

  // Agrupar items por categoría
  const groupedItems = drawerItems.reduce((acc, item) => {
    const category = item.category || 'Otros';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, DrawerItem[]>);

  const handleMoreClick = () => {
    setIsDrawerOpen(true);
  };

  const handleItemClick = (item: DrawerItem) => {
    if (item.href === '#') {
      // Para items futuros, mostrar mensaje
      return;
    }
    setIsDrawerOpen(false);
  };

  return (
    <>
      {/* Bottom Navigation Bar - Solo visible en móvil */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg" style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
        <div className="flex items-center justify-around px-2 py-2 safe-area-pb">
          {bottomNavItems.map((item, index) => {
            if (item.label === 'Más') {
              return (
                <button
                  key={index}
                  onClick={handleMoreClick}
                  className="flex flex-col items-center justify-center p-2 min-w-0 flex-1"
                >
                  <div className={`p-2 rounded-xl transition-all duration-150 ${
                    item.isActive 
                      ? 'bg-slate-900 text-white scale-105' 
                      : 'text-slate-500'
                  }`} style={{ willChange: 'transform, background-color' }}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <span className={`text-xs font-medium mt-1 transition-colors duration-150 ${
                    item.isActive ? 'text-slate-900' : 'text-slate-500'
                  }`}>
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center p-2 min-w-0 flex-1"
              >
                <div className={`p-2 rounded-xl transition-all duration-150 ${
                  item.isActive 
                    ? 'bg-slate-900 text-white scale-105' 
                    : 'text-slate-500'
                }`} style={{ willChange: 'transform, background-color' }}>
                  <item.icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium mt-1 transition-colors duration-150 ${
                  item.isActive ? 'text-slate-900' : 'text-slate-500'
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Drawer "Más" */}
      {isDrawerOpen && (
        <>
          {/* Overlay */}
          <div 
            className="lg:hidden fixed inset-0 bg-black/50 z-50 transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />
          
          {/* Drawer Content */}
          <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-hidden animate-in slide-in-from-bottom duration-300" style={{ WebkitBackfaceVisibility: 'hidden', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }}>
            <div className="p-6 pb-0">
              {/* Header del Drawer */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Más opciones</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 h-auto"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Contenido scrolleable */}
            <div className="overflow-y-auto max-h-[calc(80vh-120px)] px-6 pb-6 safe-area-pb">
              {/* Renderizar por categorías */}
              {Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="mb-6 last:mb-0">
                  <h4 className="text-sm font-semibold text-slate-600 mb-3 uppercase tracking-wide">
                    {category}
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {items.map((item) => {
                      const isDisabled = item.href === '#';
                      
                      if (isDisabled) {
                        return (
                          <div
                            key={item.label}
                            className="flex flex-col items-center p-4 rounded-2xl border-2 border-slate-200 bg-slate-50 opacity-60"
                          >
                            <div className="p-3 rounded-xl mb-3 bg-slate-200 text-slate-400">
                              <item.icon className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-medium text-center text-slate-400">
                              {item.label}
                            </span>
                            <span className="text-xs text-slate-400 mt-1">
                              Próximamente
                            </span>
                          </div>
                        );
                      }

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => handleItemClick(item)}
                          className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${
                            item.isActive
                              ? 'border-slate-900 bg-slate-50'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`p-3 rounded-xl mb-3 ${
                            item.isActive
                              ? 'bg-slate-900 text-white'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <item.icon className="w-6 h-6" />
                          </div>
                          <span className={`text-sm font-medium text-center ${
                            item.isActive ? 'text-slate-900' : 'text-slate-600'
                          }`}>
                            {item.label}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}