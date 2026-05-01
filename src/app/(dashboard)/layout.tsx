'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useOnboarding } from '@/hooks/useOnboarding';
import { FirstBranchOnboarding } from '@/components/onboarding/FirstBranchOnboarding';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { ExpandableSidebar } from '@/components/layout/ExpandableSidebar';

import {
  UserCircleIcon,
  Cancel01Icon,
  Loading02Icon,
  Camera01Icon,
  UserMultipleIcon,
  Store01Icon,
  Home01Icon,
  Building01Icon,
  SecurityCheckIcon,
  PackageIcon,
  PackageDeliveredIcon,
  UserAccountIcon,
  ShoppingCart01Icon,
  Globe02Icon,
  ShoppingBag01Icon,
  Notification01Icon,
  Logout01Icon,
  Calculator01Icon,
  Analytics01Icon,
  CheckListIcon
} from 'hugeicons-react';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface Notification {
  id: string; title: string; message: string; read: boolean; createdAt: string; type: string;
}
interface Branch { id: string; name: string; logoUrl?: string | null; }

function ProfileModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { userId, role } = useAuth();
  const router = useRouter();
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
      const payload = { name: formData.name, image: formData.image.trim() === '' ? null : formData.image, ...(formData.password ? { password: formData.password } : {}) };
      const res = await fetch(`/api/users/${userId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      if (!res.ok) throw new Error();
      toast.success('Perfil actualizado correctamente');
      await mutateMe(); mutate('/api/auth/me'); mutate('/api/users'); onClose();
    } catch { toast.error('Error al actualizar perfil'); } 
    finally { setIsLoading(false); }
  };

  const getInputClass = (val: string, disabled = false) => `transition-all focus-visible:ring-slate-400 font-medium text-sm w-full rounded-md border px-3 h-10 outline-none ${disabled ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : val.trim() !== '' ? "bg-slate-100 border-slate-300 text-slate-900" : "bg-white border-slate-200 text-slate-700"}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-slate-50 font-sans">
        <DialogHeader className="px-6 py-5 bg-white border-b border-slate-200 shadow-sm flex-row items-center gap-3">
          <div className="bg-slate-100 p-2.5 rounded-xl"><UserCircleIcon className="text-slate-600" size={20} strokeWidth={2} /></div>
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
                <button type="button" onClick={() => setFormData(p => ({...p, image: ''}))} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Cancel01Icon size={20} strokeWidth={2} />
                </button>
              </div>
            ) : (
              <div className="relative w-16 h-16 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 transition-colors flex items-center justify-center overflow-hidden cursor-pointer shadow-sm">
                <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                {isUploading ? <Loading02Icon className="animate-spin text-slate-600" size={20} strokeWidth={2} /> : <Camera01Icon className="text-slate-400" size={24} strokeWidth={2} />}
              </div>
            )}
            <div className="flex flex-col"><Label className="text-sm font-bold text-slate-700 mb-1">Foto de Perfil</Label><span className="text-xs text-slate-500 leading-tight">Haz clic en el icono para subir tu fotografía. Formato 1:1 recomendado.</span></div>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-700">Nombre Completo <span className="text-red-500">*</span></Label><input name="name" value={formData.name} onChange={handleChange} className={getInputClass(formData.name)} required /></div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-700">Correo Electrónico</Label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} className={getInputClass(formData.email, true)} disabled title="El correo no se puede modificar" />
            <p className="text-[10px] text-slate-400 mt-1">El correo electrónico no se puede modificar por seguridad</p>
          </div>
          <div className="space-y-1.5"><Label className="text-xs font-bold text-slate-700">Nueva Contraseña <span className="text-slate-400 font-normal">(Opcional)</span></Label><input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••" minLength={6} className={getInputClass(formData.password)} /></div>
          
          

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-200 mt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading} className="h-10 text-xs font-bold text-slate-600">Cancelar</Button>
            <Button type="submit" disabled={isLoading || isUploading} className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-8 shadow-sm">
              {isLoading && <Loading02Icon className="animate-spin mr-2" size={16} strokeWidth={2} />}
              Guardar Cambios
            </Button>
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
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); 
  const [showNotifs, setShowNotifs] = useState(false);
  
  const pathname = usePathname();
  const router = useRouter(); 
  const { role, name, image, logout, userId, branchId } = useAuth();
  const { needsOnboarding, isLoading: onboardingLoading, reason } = useOnboarding();

  const { data: currentBranch } = useSWR<Branch>(branchId && branchId !== 'NONE' ? `/api/branches/${branchId}` : null, fetcher);

  const { data: notifications, mutate: mutateNotifs, isLoading: loadingNotifs } = useSWR<Notification[]>(
    userId ? `/api/notifications?userId=${userId}` : null, fetcher, { refreshInterval: 15000 }
  );

  const { data: businesses } = useSWR(role === 'OWNER' || role === 'SUPER_ADMIN' ? '/api/businesses' : null, fetcher);
  const currentBusiness = businesses?.[0];

  // ⚡ PREFETCH: Cargar datos críticos en background para páginas comunes (solo si NO necesita onboarding)
  useSWR(!needsOnboarding ? '/api/products' : null, fetcher, { 
    revalidateOnFocus: false, 
    revalidateOnReconnect: false,
    dedupingInterval: 5000,
  });
  useSWR(!needsOnboarding ? '/api/branches' : null, fetcher, { 
    revalidateOnFocus: false, 
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
  });
  useSWR(!needsOnboarding ? '/api/categories' : null, fetcher, { 
    revalidateOnFocus: false, 
    revalidateOnReconnect: false,
    dedupingInterval: 10000,
  });

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
    // Redirigir a inventario para notificaciones de traslados
    if (notif.type === 'TRANSFER_REQUEST' || notif.type === 'TRANSFER_UPDATE') {
      router.push('/dashboard/inventory?tab=transfers');
    }
  };

  // ⚡ CRITICAL: Mostrar loading mientras se verifica onboarding
  // Esto previene que el dashboard intente cargar datos antes de saber si necesita onboarding
  if (onboardingLoading) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white font-semibold">Cargando...</p>
        </div>
      </div>
    );
  }

  // ⚡ CRITICAL: Mostrar onboarding ANTES de renderizar el dashboard
  // Esto previene errores 500 cuando no hay sucursales
  if (needsOnboarding && reason === 'no-branches') {
    return (
      <FirstBranchOnboarding 
        userName={name || 'Usuario'} 
        businessName={currentBusiness?.tradeName}
        onBranchCreated={() => {
          // Revalidar datos para salir del onboarding
          mutate('/api/branches');
          window.location.reload();
        }}
      />
    );
  }

  const tiMenuItems = [
    { href: '/dashboard', label: 'Resumen', icon: Home01Icon },
    { href: '/dashboard/businesses', label: 'Clientes', icon: Building01Icon },
    { href: '/dashboard/branches', label: 'Sucursales', icon: Store01Icon },
    { href: '/dashboard/users', label: 'Usuarios', icon: UserMultipleIcon },
    { href: '/dashboard/audit', label: 'Auditoría', icon: SecurityCheckIcon },
  ];

  const shopMenuItems = [
    { href: '/dashboard', label: 'Resumen', icon: Home01Icon },
    { href: '/dashboard/products', label: 'Productos', icon: PackageIcon },
    { href: '/dashboard/combos', label: 'Combos', icon: CheckListIcon },
    { href: '/dashboard/inventory', label: 'Inventario', icon: PackageDeliveredIcon },
    { href: '/dashboard/cash-sessions', label: 'Corte de Turnos', icon: UserAccountIcon },
    { href: '/dashboard/purchases', label: 'Compras', icon: ShoppingCart01Icon },
    { href: '/dashboard/accounting', label: 'Contabilidad', icon: Calculator01Icon },
    { href: '/dashboard/reports', label: 'Reportes', icon: Analytics01Icon },
  ];

  const menuItems = role === 'SUPER_ADMIN' ? tiMenuItems : shopMenuItems;

  // Lógica de Iconos Condicionales para la parte superior
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
    // 🚀 FONDO DEL "APP SHELL" GRIS CLARO
    <div className="flex h-screen w-full bg-slate-100 sm:py-2 sm:pl-1 sm:pr-2 lg:py-3 lg:pl-1 lg:pr-3 gap-2 lg:gap-3 font-sans overflow-hidden">
      
      {/* 🚀 SIDEBAR EXPANDIBLE */}
      <ExpandableSidebar
        role={role}
        currentBranch={currentBranch}
        onProfileClick={() => setIsProfileModalOpen(true)}
        onLogout={handleLogout}
        notifications={notifications}
        unreadCount={unreadCount}
        loadingNotifs={loadingNotifs}
        showNotifs={showNotifs}
        setShowNotifs={setShowNotifs}
        onNotificationClick={handleNotificationClick}
      />

      {/* ========================================================
          🚀 TARJETA PRINCIPAL DE CONTENIDO (APP CANVAS)
          ======================================================== */}
      <div className="flex flex-col flex-1 min-w-0 bg-white lg:rounded-[1.5rem] lg:overflow-hidden relative shadow-[0_0_15px_rgba(0,0,0,0.03)] border lg:border-slate-200">
        
        {/* 🚀 CONTENIDO DE LAS PÁGINAS */}
        {/* El fondo del canvas ahora es blanco para todas las páginas que se renderizan dentro */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 md:px-8 relative z-10 custom-scrollbar bg-slate-50/30 pb-[5.5rem] lg:pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* Notificaciones Móvil */}
          {showNotifs && (
            <div className="lg:hidden absolute top-2 right-2 w-[calc(100%-1rem)] sm:w-80 p-2 z-50 animate-in fade-in slide-in-from-top-4">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
                <div className="p-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Notificaciones</h3>
                  <button onClick={() => setShowNotifs(false)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-full">
                    <Cancel01Icon size={16} strokeWidth={2} />
                  </button>
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

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav role={role} />

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}