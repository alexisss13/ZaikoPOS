'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loading02Icon, Camera01Icon, UserAdd01Icon, Store01Icon, LayoutGridIcon, GlobalIcon, Cancel01Icon } from 'hugeicons-react';
import { useAuth } from '@/context/auth-context';
import { useBasicUserForm } from './hooks/useBasicUserForm';
import { BasicUserData, SimpleBusiness, Branch, UserModalProps } from './types/user-management.types';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export function BasicUserModal({ isOpen, onClose, onSuccess, userToEdit }: UserModalProps) {
  const { role: currentUserRole } = useAuth();
  
  const { data: businesses } = useSWR<SimpleBusiness[]>(
    currentUserRole === 'SUPER_ADMIN' ? '/api/businesses' : null, 
    fetcher
  );
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  
  const {
    formData,
    isLoading,
    setIsLoading,
    isUploadingImage,
    setIsUploadingImage,
    handleChange,
    handleRoleChange,
    handleBusinessChange,
    handleBranchChange,
    setImage,
    removeImage,
    validateForm,
    preparePayload
  } = useBasicUserForm({ userToEdit, isOpen, branches });

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'zaiko_pos');
    uploadData.append('cloud_name', 'dwunkgitl');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dwunkgitl/image/upload', {
        method: 'POST',
        body: uploadData
      });
      const data = await res.json();
      
      if (data.secure_url) {
        setImage(data.secure_url);
        toast.success('Foto de perfil subida');
      } else {
        throw new Error('Error al subir');
      }
    } catch (error) {
      toast.error('Error con Cloudinary');
    } finally {
      setIsUploadingImage(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    const validationError = validateForm(currentUserRole);
    if (validationError) {
      return toast.error(validationError);
    }

    setIsLoading(true);
    try {
      const payload = preparePayload();
      
      const url = userToEdit?.id ? `/api/users/${userToEdit.id}` : '/api/users';
      const method = userToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(userToEdit?.id ? 'Usuario actualizado' : 'Usuario creado');
      onSuccess();
      onClose();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Error inesperado');
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
      <DialogContent className="w-[95vw] sm:max-w-2xl p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0 z-10">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <UserAdd01Icon className="w-5 h-5 text-slate-700" strokeWidth={1.5} />
          </div>
          <div className="flex flex-col items-start text-left">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
              {userToEdit ? 'Editar Datos Básicos' : 'Registrar Personal'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              {userToEdit ? 'Modifica los datos esenciales del empleado.' : 'Datos básicos para crear un nuevo empleado.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 overflow-x-hidden relative custom-scrollbar bg-slate-50/30">
          <form id="basic-user-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* Profile Photo */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 mb-4 uppercase tracking-wide">
                <LayoutGridIcon className="w-4 h-4 text-slate-400" strokeWidth={1.5} /> Foto de Perfil
              </h3>
              
              <div className="flex items-center gap-4">
                {formData.image ? (
                  <div className="relative w-16 h-16 rounded-2xl border border-slate-200 overflow-hidden shadow-sm group">
                    <img src={formData.image} alt="Perfil" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={removeImage} 
                      className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Cancel01Icon className="w-5 h-5" strokeWidth={1.5} />
                    </button>
                  </div>
                ) : (
                  <div className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors flex items-center justify-center overflow-hidden cursor-pointer group shadow-sm">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      disabled={isUploadingImage} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    />
                    {isUploadingImage ? (
                      <Loading02Icon className="w-5 h-5 animate-spin text-slate-400" />
                    ) : (
                      <Camera01Icon className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform" strokeWidth={1.5} />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <Label className="text-xs font-bold text-slate-700 block">Foto de Perfil</Label>
                  <span className="text-[10px] text-slate-500 font-medium">JPG, PNG (Máx 5MB)</span>
                </div>
              </div>
            </div>

            {/* Basic Information */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <LayoutGridIcon className="w-4 h-4 text-slate-400" strokeWidth={1.5} /> Información Personal
              </h3>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-bold text-slate-700">
                    Nombre Completo <span className="text-red-500">*</span>
                  </Label>
                  <input 
                    id="name"
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    placeholder="Ej: Ana Gómez" 
                    className={getInputClass(formData.name)} 
                    required 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-bold text-slate-700">
                    Correo Electrónico <span className="text-red-500">*</span>
                  </Label>
                  <input 
                    id="email"
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    disabled={!!userToEdit} 
                    placeholder="ana@empresa.com" 
                    className={`${getInputClass(formData.email)} ${userToEdit ? 'opacity-75 cursor-not-allowed bg-slate-100' : ''}`} 
                    required 
                  />
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-bold text-slate-700">
                    Contraseña {userToEdit && <span className="text-slate-400 font-medium">(Opcional)</span>}
                  </Label>
                  <input 
                    id="password"
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    placeholder="••••••" 
                    minLength={6} 
                    className={getInputClass(formData.password)} 
                    required={!userToEdit} 
                  />
                </div>
              </div>
            </div>

            {/* Work Assignment */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                <Store01Icon className="w-4 h-4 text-slate-400" strokeWidth={1.5} /> Asignación de Trabajo
              </h3>
              
              {currentUserRole === 'SUPER_ADMIN' && formData.role !== 'SUPER_ADMIN' && (
                <div className="space-y-1.5">
                  <Label htmlFor="businessId" className="text-xs font-bold text-slate-700">
                    Negocio (SaaS) <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.businessId} 
                    onValueChange={handleBusinessChange}
                  >
                    <SelectTrigger id="businessId" className={`h-10 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 transition-all ${formData.businessId !== 'NONE' ? 'bg-white border-slate-200 shadow-sm font-bold text-slate-900' : 'bg-slate-50 border-transparent text-slate-500'}`}>
                      <SelectValue placeholder="Asignar negocio" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="NONE" disabled>Seleccionar negocio...</SelectItem>
                      {businesses?.map((b) => (
                        <SelectItem key={b.id} value={b.id} className="py-2.5 px-3 font-medium text-slate-700">
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="role" className="text-xs font-bold text-slate-700">
                    Rol <span className="text-red-500">*</span>
                  </Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger id="role" className="h-10 text-sm rounded-xl bg-slate-900 text-white font-bold border-none shadow-md focus-visible:ring-1 focus-visible:ring-slate-500">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="CASHIER" className="py-2.5 px-3 font-medium text-slate-700">
                        Cajero (Ventas)
                      </SelectItem>
                      <SelectItem value="MANAGER" className="py-2.5 px-3 font-medium text-slate-700">
                        Jefe de Tienda
                      </SelectItem>
                      {currentUserRole === 'SUPER_ADMIN' && (
                        <SelectItem value="SUPER_ADMIN" className="py-2.5 px-3 font-medium text-slate-700">
                          Ingeniero TI
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <Label htmlFor="branchId" className="text-xs font-bold text-slate-700">
                    Sucursal <span className="text-red-500">*</span>
                  </Label>
                  <Select 
                    value={formData.branchId} 
                    onValueChange={handleBranchChange} 
                    disabled={formData.role === 'SUPER_ADMIN'}
                  >
                    <SelectTrigger id="branchId" className={`h-10 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 transition-all ${formData.branchId && formData.branchId !== 'NONE' ? 'bg-white border-slate-200 shadow-sm font-bold text-slate-900' : 'bg-slate-50 border-transparent text-slate-500'} ${formData.role === 'SUPER_ADMIN' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <SelectValue placeholder="Elige base..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      {formData.role === 'SUPER_ADMIN' && (
                        <SelectItem value="NONE" className="py-2.5 px-3">
                          <div className="flex items-center gap-2">
                            <GlobalIcon className="w-4 h-4 text-slate-500" strokeWidth={1.5} />
                            <span className="font-bold text-slate-700">Red Global</span>
                          </div>
                        </SelectItem>
                      )}
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id} className="py-2.5 px-3 font-medium text-slate-700">
                          <div className="flex items-center gap-2.5">
                            {branch.logoUrl ? (
                              <img 
                                src={branch.logoUrl} 
                                alt={branch.name} 
                                className="w-4 h-4 rounded-sm object-cover border border-slate-200 bg-white" 
                              />
                            ) : (
                              <Store01Icon className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                            )}
                            <span>{branch.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Permissions Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="bg-blue-100 p-2 rounded-lg shrink-0">
                  <LayoutGridIcon className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-900 mb-1">Permisos Automáticos</h4>
                  <p className="text-xs text-blue-700 leading-relaxed">
                    Los permisos se aplicarán automáticamente según el rol seleccionado. 
                    Para gestión granular de permisos, usa la opción "Gestionar Permisos" desde la tabla de usuarios.
                  </p>
                </div>
              </div>
            </div>

          </form>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            disabled={isLoading || isUploadingImage} 
            className="h-10 text-xs font-bold hover:bg-slate-50 text-slate-600 rounded-xl border-slate-200"
          >
            Cancelar
          </Button>
          <Button 
            type="submit" 
            form="basic-user-form" 
            disabled={isLoading || isUploadingImage} 
            className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6 shadow-md rounded-xl transition-all"
          >
            {isLoading && <Loading02Icon className="w-4 h-4 animate-spin mr-2" />}
            {userToEdit ? 'Guardar Cambios' : 'Registrar Empleado'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export the component and types for easy importing
export { BasicUserModal as default };
export type { BasicUserData, UserModalProps } from './types/user-management.types';