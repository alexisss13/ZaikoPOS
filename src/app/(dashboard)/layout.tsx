'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingBag, 
  LogOut, 
  Store, 
  ShieldCheck // <--- Importamos el ícono para Auditoría
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { name, role } = useAuth(); 
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
    { href: '/dashboard/users', label: 'Usuarios', icon: Users },
    { href: '/dashboard/products', label: 'Inventario', icon: Package }, // Futuro (CRUD Productos)
    { href: '/dashboard/audit', label: 'Auditoría', icon: ShieldCheck }, // <--- NUEVA RUTA
    { href: '/pos', label: 'Ir al POS', icon: ShoppingBag }, 
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col fixed h-full z-10 shadow-xl">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
           <div className="bg-primary p-2 rounded-lg">
             <Store className="h-6 w-6 text-white" />
           </div>
           <div>
             <h1 className="font-bold text-lg tracking-tight">Zaiko Admin</h1>
             <p className="text-xs text-slate-400">Modo SaaS</p>
           </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary text-white font-medium shadow-md translate-x-1' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                }`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="mb-4 px-2">
            <p className="text-sm font-medium text-white truncate">{name}</p>
            <p className="text-xs text-slate-500 capitalize">{role}</p>
          </div>
          <Button 
            variant="destructive" 
            className="w-full justify-start pl-4" 
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Cerrar Sesión
          </Button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}