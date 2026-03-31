'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { 
  Store, ArrowLeft, Clock, Wifi, LogOut, 
  Camera, UserCircle, Loader2, X 
} from 'lucide-react';
import { CashGuard } from '@/components/pos/CashGuard'; 
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import useSWR, { mutate } from 'swr';

const fetcher = (url: string) => fetch(url).then(r => r.json());

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
              <DialogDescription className="text-xs text-slate-500 mt-0.5">Actualiza tus datos desde la caja registradora.</DialogDescription>
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
// MAIN POS LAYOUT COMPONENT
// ------------------------------------------------------------
export default function PosLayout({ children }: { children: React.ReactNode }) {
  const { name, role, image, logout } = useAuth();
  const [time, setTime] = useState<Date | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => setTime(new Date()), 0);
    const timerId = setInterval(() => setTime(new Date()), 1000);
    return () => { clearTimeout(timeoutId); clearInterval(timerId); };
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 overflow-hidden font-sans">
      
      {/* NAVBAR SUPERIOR: Replicando la estructura geométrica del Dashboard */}
      <header className="h-16 bg-slate-950 text-white flex items-center justify-between px-4 sm:px-6 shrink-0 shadow-md z-30 border-b border-slate-900">
        
        {/* LADO IZQUIERDO: Logo y Navegación de Retorno */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-600/20">
              <Store className="h-5 w-5 text-white" />
            </div>
            <span className="font-black tracking-tight text-lg text-slate-100 hidden sm:block">
              F&F <span className="text-blue-500">POS</span>
            </span>
          </div>

          <nav className="hidden lg:flex items-center gap-1">
            <Link href="/dashboard">
              <span className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors text-slate-400 hover:text-slate-200 hover:bg-slate-900 font-medium">
                <ArrowLeft className="w-4 h-4" />
                Volver al Admin
              </span>
            </Link>
          </nav>
        </div>

        {/* LADO DERECHO: Herramientas Operativas y Autenticación */}
        <div className="flex items-center gap-3 md:gap-5">
          <div className="hidden md:flex items-center gap-2 text-slate-300 bg-slate-900 px-3 py-2 rounded-lg text-xs font-mono border border-slate-800 font-medium tracking-wider">
            <Clock className="w-4 h-4 text-blue-500" />
            {time ? time.toLocaleTimeString('es-PE', { hour: '2-digit', minute:'2-digit', second:'2-digit' }) : '--:--:--'}
          </div>
          
          {/* 🚀 FIX: Solo el ícono de Wifi y con un diseño minimalista */}
          <div className="hidden sm:flex items-center justify-center text-emerald-400 bg-emerald-400/10 p-2 rounded-lg border border-emerald-400/20" title="Sistema en línea">
            <Wifi className="w-4 h-4" />
          </div>
          
          <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-slate-800">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold leading-none text-slate-100">{name}</p>
              <p className="text-[10px] text-blue-400 uppercase mt-1 font-black tracking-widest">{role}</p>
            </div>
            
            {/* Foto de Perfil Sincronizada */}
            <button 
              onClick={() => setIsProfileModalOpen(true)}
              className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-md border-2 border-slate-800 overflow-hidden hover:scale-105 hover:border-blue-400 transition-all outline-none cursor-pointer"
              title="Editar Mi Perfil"
            >
              {image ? (
                <img src={image} alt={name || 'User'} className="w-full h-full object-cover" />
              ) : (
                name?.charAt(0).toUpperCase()
              )}
            </button>

            {/* Acción Rápida: Cerrar Sesión */}
            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-full bg-slate-900 text-red-400 hover:text-red-300 hover:bg-red-950/50 flex items-center justify-center transition-all outline-none border border-slate-800 ml-1 shadow-sm"
              title="Cerrar Sesión Segura"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ÁREA DE CONTENIDO POS CON PROTECCIÓN DE ESTADO (CAJA) */}
      <main className="flex-1 overflow-hidden relative bg-slate-50">
        <CashGuard>
          {children}
        </CashGuard>
      </main>

      <ProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />
    </div>
  );
}