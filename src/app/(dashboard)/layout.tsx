'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { 
  Menu, X, LayoutDashboard, ShoppingBag, 
  Package, Users, Store, LogOut, ShieldCheck, 
  Tags, Building2, Camera, UserCircle, Loader2, Bell, Check, ArrowRightLeft, Globe, ShoppingCart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Notification {
  id: string; title: string; message: string; read: boolean; createdAt: string; type: string;
}
interface Branch { id: string; name: string; logoUrl?: string | null; }

function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { userId } = useAuth();
  const { data: userData, mutate: mutateMe } = useSWR(isOpen && userId ? '/api/auth/me' : null, fetcher);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', image: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '', email: userData.email || '', password: '', image: userData.image || ''
      });
    }
  }, [userData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file); uploadData.append('upload_preset', 'zaiko_pos'); uploadData.append('cloud_name', 'dwunkgitl');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dwunkgitl/image/upload', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.secure_url) { setFormData(p => ({ ...p, image: data.secure_url })); toast.success('Foto actualizada'); } 
      else throw new Error();
    } catch { toast.error('Error al subir imagen'); } 
    finally { setIsUploading(false); e.target.value = ''; }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setIsLoading(true);
    try {
      const payload = { name: formData.name, email: formData.email, image: formData.image.trim() === '' ? null : formData.image, ...(formData.password ? { password: formData.password } : {}) };
      const res = await fetch(`/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success('Perfil actualizado correctamente');
      await mutateMe(); mutate('/api/auth/me'); mutate('/api/users'); onClose();
    } catch { toast.error('Error al actualizar perfil'); } 
    finally { setIsLoading(false); }
  };

  const getInputClass = (val: string) => `transition-all focus-visible:ring-slate-400 font-medium text-sm w-full rounded-md border px-3 h-10 outline-none ${val.trim() !== '' ? "bg-slate-100 border-slate-300 text-slate-900" : "bg-white border-slate-200 text-slate-700"}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-slate-50 font-sans">
        <DialogHeader className="px-6 py-5 bg-white border-b border-slate-200 shadow-sm flex-row items-center gap-3">
          <div className="bg-slate-100 p-2.5 rounded-xl"><UserCircle className="w-5 h-5 text-slate-600" /></div>
          <div className="flex flex-col items-start">
            <DialogTitle className="text-lg font-bold text-slate-800">Configuración de Perfil</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5">Actualiza tus datos y credenciales de acceso.</DialogDescription>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="flex items-center gap-5 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            {formData.image ? (
              <div className="relative w-16 h-16 rounded-full border-2 border-slate-200 overflow-hidden shadow-sm group">
                <img src={formData.image} alt="Perfil" className="w-full h-full object-cover" />
                <button type="button" onClick={() => setFormData(p => ({...p, image: ''}))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="w-5 h-5" /></button>
              </div>
            ) : (
              <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center overflow-hidden cursor-pointer shadow-sm">
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-slate-600" /> : <Camera className="w-6 h-6 text-slate-400" />}
              </div>
            )}
            <div className="flex flex-col"><Label className="text-sm font-bold text-slate-700 mb-1">Foto de Perfil</Label><span className="text-xs text-slate-500 leading-tight">Haz clic en el icono para subir tu fotografía. Formato 1:1 recomendado.</span></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-700">Nombre Completo <span className="text-red-500">*</span></Label><input name="name" value={formData.name} onChange={handleChange} className={getInputClass(formData.name)} required /></div>
          <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-700">Correo Electrónico <span className="text-red-500">*</span></Label><input type="email" name="email" value={formData.email} onChange={handleChange} className={getInputClass(formData.email)} required /></div>
          <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-700">Nueva Contraseña <span className="text-slate-400 font-normal">(Opcional)</span></Label><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••" minLength={6} className={getInputClass(formData.password)} /></div>
          <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-10 text-xs font-bold text-slate-600">Cancelar</Button>
            <Button type="submit" disabled={isLoading || isUploading} className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-8 shadow-sm">{isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Guardar Cambios</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// MAIN LAYOUT COMPONENT
// ------------------------------------------------------------
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); 
  const [showNotifs, setShowNotifs] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter(); 
  const { role, name, image, logout, userId, branchId } = useAuth();

  const { data: currentBranch } = useSWR<Branch>(branchId && branchId !== 'NONE' ? `/api/branches/${branchId}` : null, fetcher);

  const { data: notifications, mutate: mutateNotifs, isLoading: loadingNotifs } = useSWR<Notification[]>(
    userId ? `/api/notifications?userId=${userId}` : null, fetcher, { refreshInterval: 15000 }
  );

  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout(); window.location.href = '/login';
  };

  const handleNotificationClick = async (notif: Notification) => {
    setShowNotifs(false);
    if (!notif.read) {
      try {
        await fetch(`/api/notifications/${notif.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ read: true }) });
        mutateNotifs();
      } catch (e) { console.error(e); }
    }
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
    { href: '/dashboard/products', label: 'Productos', icon: Package },
    { href: '/dashboard/purchases', label: 'Compras', icon: ShoppingCart },
    { href: '/dashboard/users', label: 'Personal', icon: Users },
    { href: '/dashboard/branches', label: 'Sucursales', icon: Store },
    { href: '/dashboard/transfers', label: 'Traslados', icon: ArrowRightLeft }, 
    { href: '/dashboard/audit', label: 'Auditoría', icon: ShieldCheck },
  ];

  const menuItems = role === 'SUPER_ADMIN' ? tiMenuItems : shopMenuItems;

  // Lógica de Iconos Condicionales para la parte superior
  let TopLogo;
  if (role === 'SUPER_ADMIN') {
    TopLogo = <ShieldCheck className="w-5 h-5 text-slate-800" />;
  } else if (role === 'OWNER') {
    TopLogo = <Globe className="w-5 h-5 text-slate-800" />;
  } else {
    if (currentBranch?.logoUrl) {
      TopLogo = <img src={currentBranch.logoUrl} alt="Logo" className="w-full h-full object-cover" />;
    } else {
      TopLogo = <Store className="w-5 h-5 text-slate-800" />;
    }
  }

  const tooltipLabelLogo = role === 'SUPER_ADMIN' ? 'Sistemas TI' : role === 'OWNER' ? 'Gerencia Global' : currentBranch?.name || 'Mi Sucursal';

  return (
    // 🚀 FONDO DEL "APP SHELL" GRIS CLARO
    <div className="flex h-screen w-full bg-slate-100 sm:py-2 sm:pl-1 sm:pr-2 lg:py-3 lg:pl-1 lg:pr-3 gap-2 lg:gap-3 font-sans overflow-hidden">
      
      {/* 🚀 SIDEBAR INVISIBLE (Integrado al fondo bg-slate-100) */}
      <TooltipProvider delayDuration={0}>
        <aside className="w-[64px] h-full flex flex-col items-center py-4 shrink-0 hidden lg:flex relative z-40 bg-transparent border-none">
          
          {/* Top Logo Dinámico */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-200 mb-6 cursor-default shadow-sm overflow-hidden">
                {TopLogo}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
              {tooltipLabelLogo}
            </TooltipContent>
          </Tooltip>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-2 w-full px-2 flex-1 items-center">
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Tooltip key={item.href}>
                  <TooltipTrigger asChild>
                    <Link href={item.href} className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900'}`}>
                      <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>

          {/* Bottom Action Area */}
          <div className="flex flex-col gap-3 w-full px-2 items-center mt-auto">
            
            {role !== 'SUPER_ADMIN' && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link href="/pos" className="flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white transition-colors shadow-sm">
                    <ShoppingBag className="w-4 h-4" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                  Ir al POS
                </TooltipContent>
              </Tooltip>
            )}

            <div className="relative flex w-full justify-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={() => setShowNotifs(!showNotifs)} className="relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:bg-white hover:shadow-sm hover:text-slate-900 transition-all outline-none">
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full shadow-sm ring-2 ring-slate-100" />}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                  Notificaciones
                </TooltipContent>
              </Tooltip>

              {/* Panel de Notificaciones Flotante */}
              {showNotifs && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowNotifs(false)} />
                  <div className="absolute left-[4.5rem] bottom-0 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-left-4">
                    <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
                      {unreadCount > 0 && <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">{unreadCount} Nuevas</span>}
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1.5 bg-slate-50/50">
                      {loadingNotifs ? (
                        <div className="p-6 text-center text-xs text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" /> Cargando...</div>
                      ) : notifications?.length === 0 ? (
                        <div className="p-6 text-center text-xs text-slate-400"><Bell className="w-6 h-6 text-slate-300 mx-auto mb-2" /> Sin notificaciones</div>
                      ) : (
                        notifications?.map(n => (
                          <button key={n.id} onClick={() => handleNotificationClick(n)} className={`w-full p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-colors cursor-pointer ${!n.read ? 'bg-white border-slate-300 shadow-sm hover:border-slate-400' : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-slate-100'}`}>
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

            {/* Perfil */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={() => setIsProfileModalOpen(true)} className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-transparent hover:ring-slate-300 transition-all shadow-sm">
                  {image ? <img src={image} className="w-full h-full object-cover" alt="User" /> : <UserCircle className="w-full h-full text-slate-400 bg-white" />}
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                Mi Perfil
              </TooltipContent>
            </Tooltip>

            {/* Logout */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button onClick={handleLogout} className="flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:bg-white hover:shadow-sm hover:text-red-500 transition-colors">
                  <LogOut className="w-5 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                Cerrar Sesión
              </TooltipContent>
            </Tooltip>
          </div>
        </aside>
      </TooltipProvider>

      {/* ========================================================
          🚀 TARJETA PRINCIPAL DE CONTENIDO (APP CANVAS)
          ======================================================== */}
      <div className="flex flex-col flex-1 min-w-0 bg-white lg:rounded-[1.5rem] overflow-hidden relative shadow-[0_0_15px_rgba(0,0,0,0.03)] border lg:border-slate-200">
        
        {/* HEADER SOLO PARA MÓVILES */}
        <header className="lg:hidden h-14 bg-white text-slate-900 flex items-center justify-between px-4 shrink-0 shadow-sm border-b border-slate-200 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded shadow-sm"><Store className="h-4 w-4 text-white" /></div>
            <span className="font-bold text-sm text-slate-900">F&F ADMIN</span>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />}
            </button>
            <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:bg-slate-100 h-9 w-9 rounded-full">
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </header>

        {/* MENU MÓVIL DESPLEGABLE */}
        <div className={`lg:hidden absolute top-14 left-0 w-full bg-white border-b border-slate-200 transition-all duration-300 overflow-hidden z-40 ${isMobileMenuOpen ? 'max-h-[85vh] border-b shadow-2xl' : 'max-h-0 border-transparent'}`}>
          <nav className="p-4 space-y-1.5 flex flex-col overflow-y-auto max-h-[75vh]">
            <div className="flex items-center gap-3 p-3 mb-2 bg-slate-50 border border-slate-100 rounded-xl">
              {image ? <img src={image} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="" /> : <UserCircle className="w-10 h-10 text-slate-400" />}
              <div>
                <p className="text-sm font-bold text-slate-900">{name}</p>
                <p className="text-[10px] text-slate-500 font-bold tracking-wider">{role}</p>
              </div>
            </div>
            {menuItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} onClick={() => setIsMobileMenuOpen(false)}>
                  <span className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors ${isActive ? 'bg-slate-900 text-white font-bold shadow-md' : 'text-slate-600 hover:bg-slate-50 font-medium'}`}>
                    <item.icon className="w-[18px] h-[18px]" /> {item.label}
                  </span>
                </Link>
              )
            })}
            {role !== 'SUPER_ADMIN' && (
              <Link href="/pos" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 mt-2 rounded-xl text-sm bg-emerald-50 text-emerald-600 font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors">
                <ShoppingBag className="w-[18px] h-[18px]" /> IR AL POS
              </Link>
            )}
            <div className="h-px bg-slate-100 my-2 w-full" />
            <button onClick={() => { setIsMobileMenuOpen(false); setIsProfileModalOpen(true); }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-slate-600 hover:bg-slate-50 font-bold w-full text-left transition-colors">
              <UserCircle className="w-[18px] h-[18px]" /> Mi Perfil
            </button>
            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 hover:text-red-600 font-bold w-full text-left transition-colors">
              <LogOut className="w-[18px] h-[18px]" /> Cerrar Sesión
            </button>
          </nav>
        </div>

        {/* 🚀 CONTENIDO DE LAS PÁGINAS */}
        {/* El fondo del canvas ahora es blanco para todas las páginas que se renderizan dentro */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 md:px-8 relative z-10 custom-scrollbar bg-slate-50/30">
          
          {/* Notificaciones Móvil */}
          {showNotifs && (
            <div className="lg:hidden absolute top-2 right-2 w-[calc(100%-1rem)] sm:w-80 p-2 z-50 animate-in fade-in slide-in-from-top-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
                  <button onClick={() => setShowNotifs(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1.5">
                  {loadingNotifs ? <div className="p-6 text-center text-xs text-slate-400">Cargando...</div> : notifications?.length === 0 ? <div className="p-6 text-center text-xs text-slate-400">Sin notificaciones</div> : notifications?.map(n => (
                    <button key={n.id} onClick={() => handleNotificationClick(n)} className={`w-full p-3 rounded-xl border text-left flex flex-col gap-1 transition-colors ${!n.read ? 'bg-white border-slate-300 shadow-sm' : 'bg-transparent border-transparent opacity-60'}`}>
                      <div className="flex justify-between w-full"><span className="text-xs font-bold text-slate-900">{n.title}</span><span className="text-[9px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span></div>
                      <p className="text-[11px] text-slate-500">{n.message}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {children}

        </main>
      </div>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}