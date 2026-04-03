'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { 
  Store, LayoutDashboard, LogOut, Camera, UserCircle, Loader2, X, Bell, Check, ShieldCheck, Globe
} from 'lucide-react';
import { CashGuard } from '@/components/pos/CashGuard'; 
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Notification {
  id: string; title: string; message: string; read: boolean; createdAt: string;
}

interface Branch { id: string; name: string; logoUrl?: string | null; }

// ------------------------------------------------------------
// COMPONENTE: MODAL DE EDICIÓN DE PERFIL (Rediseño Flat)
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

  const getInputClass = (val: string | undefined) => {
    const base = "transition-all focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-sm w-full rounded-xl border px-3 h-10 outline-none";
    const state = val && val.trim() !== ''
      ? "bg-white border-slate-200 text-slate-900 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]" 
      : "bg-slate-50 border-transparent text-slate-700 hover:bg-slate-100";
    return `${base} ${state}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl">
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <UserCircle className="w-5 h-5 text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">Configuración de Perfil</DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">Actualiza tus datos desde la caja registradora.</DialogDescription>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2 pb-2">
            <Label className="text-xs font-bold text-slate-700">Foto de Perfil</Label>
            <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-dashed border-slate-200">
              {formData.image ? (
                <div className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden shadow-sm group shrink-0">
                  <img src={formData.image} alt="Perfil" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setFormData(p => ({...p, image: ''}))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="relative w-14 h-14 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 transition-colors flex items-center justify-center shrink-0 shadow-sm overflow-hidden cursor-pointer group">
                  <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" /> : <Camera className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform" strokeWidth={1.5} />}
                </div>
              )}
              <div className="flex-1 relative flex flex-col justify-center">
                <span className="text-xs text-slate-500 font-medium px-2">Formato 1:1 recomendado.</span>
              </div>
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
            <Label className="text-xs font-bold text-slate-700">Nueva Contraseña <span className="text-slate-400 font-medium">(Opcional)</span></Label>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••" minLength={6} className={getInputClass(formData.password)} />
          </div>

          <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-10 text-xs font-bold text-slate-600 bg-white border-slate-200 hover:bg-slate-50 rounded-xl shadow-sm">
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || isUploading} className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6 rounded-xl shadow-md transition-all">
              {isLoading && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ------------------------------------------------------------
// MAIN POS LAYOUT COMPONENT (App Shell "Floating Canvas")
// ------------------------------------------------------------
export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { role, image, logout, userId, branchId } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const { data: currentBranch } = useSWR<Branch>(branchId && branchId !== 'NONE' ? `/api/branches/${branchId}` : null, fetcher);

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

  const handleMarkAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true })
      });
      mutateNotifs();
    } catch (error) {
      toast.error('Error al marcar notificación');
    }
  };

  // Lógica Dinámica de Icono/Logo superior
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
    // 🚀 FONDO DEL APP SHELL GRIS CLARO
    <div className="flex h-screen w-full bg-slate-100 sm:py-2 sm:pl-1 sm:pr-2 lg:py-3 lg:pl-1 lg:pr-3 gap-2 lg:gap-3 font-sans overflow-hidden">
      
      {/* 🚀 SIDEBAR ESCRITORIO CLARO (Invisible, integrado al fondo) */}
      <TooltipProvider delayDuration={0}>
        <aside className="w-[64px] h-full flex flex-col items-center py-4 shrink-0 hidden lg:flex relative z-40 bg-transparent border-none">
          
          {/* Top Logo Dinámico */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0 border border-slate-200/60 mb-6 cursor-default shadow-sm overflow-hidden">
                {TopLogo}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
              {tooltipLabelLogo}
            </TooltipContent>
          </Tooltip>

          {/* En el POS no necesitamos menú de navegación central */}
          <nav className="flex flex-col gap-2 w-full px-2 flex-1 items-center" />

          {/* 🚀 BOTTOM ACTION AREA (Reflejado 1:1 con el Administrador) */}
          <div className="flex flex-col gap-3 w-full px-2 items-center mt-auto">
            
            {/* Volver al Admin */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/dashboard" className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 transition-colors shadow-sm ring-1 ring-blue-100">
                  <LayoutDashboard className="w-5 h-5" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="font-bold text-xs bg-slate-800 text-white border-none shadow-xl ml-2">
                Volver al Administrador
              </TooltipContent>
            </Tooltip>

            {/* Notificaciones */}
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
                  <div className="absolute left-[4.5rem] bottom-0 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-slate-200 z-50 overflow-hidden flex flex-col animate-in fade-in slide-in-from-left-4 ml-2">
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
                          <div key={n.id} className={`w-full p-3 rounded-xl border text-left flex flex-col gap-1.5 transition-colors cursor-pointer ${!n.read ? 'bg-white border-slate-300 shadow-sm' : 'bg-transparent border-transparent opacity-60 hover:opacity-100 hover:bg-slate-100'}`}>
                            <div className="flex justify-between items-start gap-2 w-full">
                              <span className={`text-xs leading-tight ${!n.read ? 'font-bold text-slate-900' : 'font-semibold text-slate-600'}`}>{n.title}</span>
                              <span className="text-[9px] text-slate-400 font-medium whitespace-nowrap shrink-0">{new Date(n.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 leading-snug">{n.message}</p>
                            {!n.read && (
                              <button onClick={() => handleMarkAsRead(n.id)} className="mt-1 text-[9px] font-bold text-blue-600 hover:text-blue-800 self-end flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md transition-colors">
                                <Check className="w-3 h-3" /> Marcar leída
                              </button>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="w-6 h-px bg-slate-200 my-1" />

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
          🚀 LIENZO FLOTANTE (CANVAS POS)
          ======================================================== */}
      <div className="flex flex-col flex-1 min-w-0 bg-white lg:rounded-2xl overflow-hidden relative shadow-2xl lg:shadow-[0_0_20px_rgba(0,0,0,0.05)] border-l border-t border-b border-slate-200/60 my-2 lg:my-0 mr-2 lg:mr-0">
        
        {/* HEADER SOLO PARA MÓVILES (Ultra Limpio y Fusionado al lienzo) */}
        <header className="lg:hidden h-14 bg-white text-slate-900 flex items-center justify-between px-4 shrink-0 shadow-sm border-b border-slate-200 z-30">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded shadow-sm"><Store className="h-4 w-4 text-white" /></div>
            <span className="font-bold text-sm text-slate-900">
              F&F <span className="text-blue-600">POS</span>
            </span>
          </div>

          {/* 🚀 Controles directos en el header (Sin menú hamburguesa porque es POS) */}
          <div className="flex items-center gap-1">
            <Link href="/dashboard" className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <LayoutDashboard className="w-5 h-5" />
            </Link>
            
            <button onClick={() => setShowNotifs(!showNotifs)} className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />}
            </button>

            <button onClick={() => setIsProfileModalOpen(true)} className="ml-1 rounded-full overflow-hidden border border-slate-200 shadow-sm w-8 h-8 focus:ring-2 focus:ring-slate-300">
              {image ? <img src={image} alt="User" className="w-full h-full object-cover" /> : <UserCircle className="w-full h-full text-slate-400 bg-white" />}
            </button>
          </div>
        </header>

        {/* 🚀 ÁREA DE CONTENIDO POS */}
        <main className="flex-1 overflow-hidden relative bg-slate-50/50">
          
          {/* Notificaciones Móvil (Desplegable) */}
          {showNotifs && (
            <div className="lg:hidden absolute top-2 right-2 w-[calc(100%-1rem)] sm:w-80 p-2 z-50 animate-in fade-in slide-in-from-top-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
                  <button onClick={() => setShowNotifs(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full"><X className="w-4 h-4" /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1.5">
                  {loadingNotifs ? <div className="p-6 text-center text-xs text-slate-400">Cargando...</div> : notifications?.length === 0 ? <div className="p-6 text-center text-xs text-slate-400">Sin notificaciones</div> : notifications?.map(n => (
                    <div key={n.id} className={`w-full p-3 rounded-xl border text-left flex flex-col gap-1 transition-colors ${!n.read ? 'bg-white border-slate-300 shadow-sm' : 'bg-transparent border-transparent opacity-60'}`}>
                      <div className="flex justify-between w-full"><span className="text-xs font-bold text-slate-900">{n.title}</span><span className="text-[9px] text-slate-400">{new Date(n.createdAt).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}</span></div>
                      <p className="text-[11px] text-slate-500">{n.message}</p>
                      {!n.read && (
                        <button onClick={() => handleMarkAsRead(n.id)} className="mt-1 text-[9px] font-bold text-blue-600 hover:text-blue-800 self-end flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md transition-colors">
                          <Check className="w-3 h-3" /> Marcar leída
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Carga el flujo de Caja y Componentes de Ventas */}
          <CashGuard>
            {children}
          </CashGuard>

        </main>
      </div>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}