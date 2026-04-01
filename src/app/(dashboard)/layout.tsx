'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { 
  Menu, X, LayoutDashboard, ShoppingBag, 
  Package, Users, Store, LogOut, ShieldCheck, 
  Tags, Building2, Camera, UserCircle, Loader2, Bell, Check, ArrowRightLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  type: string;
}

// ------------------------------------------------------------
// COMPONENTE: MODAL DE EDICIÓN DE PERFIL (Sincronizado)
// ------------------------------------------------------------
function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { userId } = useAuth();
  const { data: userData, mutate: mutateMe } = useSWR(isOpen && userId ? '/api/auth/me' : null, fetcher);
  
  const [formData, setFormData] = useState({ name: '', email: '', password: '', image: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        email: userData.email || '',
        password: '',
        image: userData.image || ''
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'zaiko_pos'); 
    uploadData.append('cloud_name', 'dwunkgitl');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dwunkgitl/image/upload', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.secure_url) { 
        setFormData(prev => ({ ...prev, image: data.secure_url })); 
        toast.success('Foto actualizada exitosamente'); 
      } else throw new Error();
    } catch (error) { 
      toast.error('Error al subir imagen'); 
    } finally { 
      setIsUploading(false); 
      e.target.value = ''; 
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        image: formData.image.trim() === '' ? null : formData.image,
        ...(formData.password ? { password: formData.password } : {})
      };
      
      const res = await fetch(`/api/users/${userId}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(payload) 
      });
      if (!res.ok) throw new Error();
      
      toast.success('Perfil actualizado correctamente');
      
      await mutateMe(); 
      mutate('/api/auth/me'); 
      mutate('/api/users'); 
      
      onClose();
    } catch {
      toast.error('Error al actualizar perfil');
    } finally {
      setIsLoading(false);
    }
  };

  const getInputClass = (val: string) => {
    const base = "transition-all focus-visible:ring-blue-500 font-medium text-sm w-full rounded-md border px-3 h-10 outline-none";
    return `${base} ${val.trim() !== '' ? "bg-blue-50/40 border-blue-200 text-blue-900 shadow-sm" : "bg-white border-slate-200 text-slate-700 hover:border-blue-300"}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-slate-50 font-sans">
        <DialogHeader className="px-6 py-5 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2.5 rounded-xl"><UserCircle className="w-5 h-5 text-blue-600" /></div>
            <div className="flex flex-col items-start">
              <DialogTitle className="text-lg font-bold text-slate-800 leading-tight">Configuración de Perfil</DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-0.5">Actualiza tus datos y credenciales de acceso.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center gap-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {formData.image ? (
              <div className="relative w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden shadow-sm group shrink-0">
                <img src={formData.image} alt="Perfil" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setFormData(p => ({...p, image: ''}))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center overflow-hidden cursor-pointer shadow-sm shrink-0">
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> : <Camera className="w-6 h-6 text-slate-400" />}
              </div>
            )}
            <div className="flex flex-col">
              <Label className="text-sm font-bold text-slate-700 block mb-1">Foto de Perfil</Label>
              <span className="text-xs text-slate-500 leading-tight">Haz clic en el icono para subir tu fotografía. Formato 1:1 recomendado.</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Nombre Completo <span className="text-red-500">*</span></Label>
            <input name="name" value={formData.name} onChange={handleChange} className={getInputClass(formData.name)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Correo Electrónico <span className="text-red-500">*</span></Label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={getInputClass(formData.email)} required />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Nueva Contraseña <span className="text-slate-400 font-normal">(Opcional)</span></Label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••" minLength={6} className={getInputClass(formData.password)} />
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-10 text-xs font-bold text-slate-600 hover:bg-slate-200 border-slate-300">Cancelar</Button>
            <Button type="submit" disabled={isLoading || isUploading} className="h-10 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-8 shadow-md">
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// MAIN LAYOUT COMPONENT (Rediseñado a Top Navbar)
// ------------------------------------------------------------
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); 
  const [showNotifs, setShowNotifs] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter(); // 🚀 Para redirecciones dinámicas
  const { role, name, image, logout, userId } = useAuth();

  // 🚀 Obtenemos notificaciones del usuario activo
  const { data: notifications, mutate: mutateNotifs, isLoading: loadingNotifs } = useSWR<Notification[]>(
    userId ? `/api/notifications?userId=${userId}` : null, 
    fetcher, 
    { refreshInterval: 15000 }
  );

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    window.location.href = '/login';
  };

  // 🚀 Función para manejar el clic en una notificación
  const handleNotificationClick = async (notif: Notification) => {
    setShowNotifs(false); // Cierra el modal de notificaciones

    // 1. Marcar como leída si no lo está
    if (!notif.read) {
      try {
        await fetch(`/api/notifications/${notif.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ read: true })
        });
        mutateNotifs();
      } catch (error) {
        console.error("Error al marcar como leída:", error);
      }
    }

    // 2. Redirección basada en el tipo
    if (notif.type === 'TRANSFER_REQUEST' || notif.type === 'TRANSFER_UPDATE') {
      router.push('/dashboard/transfers');
    }
  };

  const tiMenuItems = [
    { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
    { href: '/dashboard/businesses', label: 'Clientes', icon: Building2 },
    { href: '/dashboard/branches', label: 'Sucursales', icon: Store },
    { href: '/dashboard/users', label: 'Usuarios', icon: Users },
    { href: '/dashboard/audit', label: 'Auditoría', icon: ShieldCheck },
  ];

  const shopMenuItems = [
    { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
    { href: '/dashboard/products', label: 'Inventario', icon: Package },
    { href: '/dashboard/categories', label: 'Categorías', icon: Tags },
    { href: '/dashboard/users', label: 'Personal', icon: Users },
    { href: '/dashboard/branches', label: 'Sucursales', icon: Store },
    { href: '/dashboard/transfers', label: 'Traslados', icon: ArrowRightLeft }, // 🚀 Añadido el acceso directo
    { href: '/dashboard/audit', label: 'Auditoría', icon: ShieldCheck },
  ];

  const menuItems = role === 'SUPER_ADMIN' ? tiMenuItems : shopMenuItems;

  return (
    <div className="flex flex-col h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* 🚀 NAVBAR SUPERIOR */}
      <header className="h-16 bg-slate-950 text-white flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-md z-30 border-b border-slate-900">
        
        {/* LADO IZQUIERDO: Logo y Menú Desktop */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-600/20">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="font-black tracking-tight text-lg text-slate-100 hidden sm:block">
              F&F <span className="text-blue-500">ADMIN</span>
            </span>
          </div>

          {/* Menú Horizontal (Solo Desktop) */}
          <nav className="hidden lg:flex items-center gap-1">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <span className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive 
                      ? 'bg-slate-800 text-white font-bold' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium'
                  }`}>
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* LADO DERECHO: Botón POS, Perfil y Menú Móvil */}
        <div className="flex items-center gap-3 md:gap-5">
          
          {/* Botón Ir al POS (Destacado) */}
          {role !== 'SUPER_ADMIN' && (
            <Link href="/pos" className="hidden sm:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md shadow-emerald-500/20">
              <ShoppingBag className="w-4 h-4" /> IR AL POS
            </Link>
          )}

          {/* Info y Foto de Perfil */}
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-800">
            
            {/* 🚀 CAMPANA DE NOTIFICACIONES */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifs(!showNotifs)}
                className="relative p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors outline-none"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-sm ring-2 ring-slate-950">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 🚀 PANEL DESPLEGABLE DE NOTIFICACIONES */}
              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-4">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                          {unreadCount} Nuevas
                        </span>
                      )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto p-2 space-y-1.5 bg-slate-50/50">
                      {loadingNotifs ? (
                        <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" /> Cargando...
                        </div>
                      ) : notifications?.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400 flex flex-col items-center gap-2">
                          <Bell className="w-6 h-6 text-slate-300" />
                          No tienes notificaciones
                        </div>
                      ) : (
                        notifications?.map(n => (
                          <button 
                            key={n.id} 
                            onClick={() => handleNotificationClick(n)}
                            className={`w-full p-3 rounded-lg border text-left flex flex-col gap-1.5 transition-colors cursor-pointer ${!n.read ? 'bg-white border-blue-200 shadow-sm hover:border-blue-400' : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-slate-100'}`}
                          >
                            <div className="flex justify-between items-start gap-2 w-full">
                              <span className={`text-xs leading-tight ${!n.read ? 'font-bold text-blue-900' : 'font-semibold text-slate-800'}`}>
                                {n.title}
                              </span>
                              <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                                {new Date(n.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">{n.message}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="text-right hidden sm:block ml-2">
              <p className="text-sm font-bold leading-none text-slate-100">{name}</p>
              <p className="text-[10px] text-blue-400 uppercase mt-1 font-black tracking-widest">
                {role === 'SUPER_ADMIN' ? 'Ingeniero TI' : role}
              </p>
            </div>
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-slate-800 overflow-hidden hover:scale-105 hover:border-blue-400 transition-all outline-none"
              title="Editar Mi Perfil"
            >
              {image ? (
                <img src={image} alt={name || 'User'} className="w-full h-full object-cover" />
              ) : (
                name?.charAt(0).toUpperCase()
              )}
            </button>

            {/* 🚀 NUEVO: Botón de Cerrar Sesión en Desktop */}
            <button 
              onClick={handleLogout}
              className="hidden sm:flex w-10 h-10 rounded-full bg-slate-900 text-red-400 hover:text-red-300 hover:bg-red-950/50 items-center justify-center transition-all outline-none border border-slate-800 ml-1 shadow-sm"
              title="Cerrar Sesión Segura"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Menú Hamburguesa Móvil */}
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="lg:hidden text-slate-300 hover:text-white hover:bg-slate-800 ml-1">
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      {/* MENÚ MÓVIL DESPLEGABLE (Debajo del Navbar) */}
      <div className={`lg:hidden bg-slate-950 border-b border-slate-800 transition-all duration-300 overflow-hidden z-20 ${isMobileMenuOpen ? 'max-h-96 border-b' : 'max-h-0 border-transparent'}`}>
        <nav className="p-4 space-y-2 flex flex-col">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                <span className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm ${isActive ? 'bg-blue-600 text-white font-bold shadow-md' : 'text-slate-400 hover:text-white hover:bg-slate-900 font-medium'}`}>
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </span>
              </Link>
            )
          })}
          {role !== 'SUPER_ADMIN' && (
            <Link href="/pos" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 mt-2 rounded-lg text-sm bg-emerald-500 text-white font-bold shadow-md">
              <ShoppingBag className="w-5 h-5" /> IR AL POS
            </Link>
          )}
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 mt-2 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-950/50 font-bold text-left w-full">
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </button>
        </nav>
      </div>

      {/* ÁREA DE CONTENIDO */}
      <main className="flex-1 overflow-y-auto bg-slate-50/50 p-4 md:p-8">
        {children}
      </main>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}