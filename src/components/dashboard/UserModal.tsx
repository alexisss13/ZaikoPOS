'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface UserData {
  id?: string;
  name: string;
  email: string;
  role: string;
  businessId?: string | null;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: UserData | null;
}

// 🚀 FIX: Definimos la forma del objeto negocio para que TypeScript no llore
interface SimpleBusiness {
  id: string;
  name: string;
}

export function UserModal({ isOpen, onClose, onSuccess, userToEdit }: UserModalProps) {
  const { role: currentUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // 🚀 SOLO EL TI NECESITA LA LISTA DE NEGOCIOS
  const { data: businesses } = useSWR(currentUserRole === 'SUPER_ADMIN' ? '/api/businesses' : null, fetcher);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER', 
    businessId: 'NONE', // Valor inicial para obligar a seleccionar
  });

  useEffect(() => {
    if (userToEdit && isOpen) {
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        password: '', 
        role: userToEdit.role,
        businessId: userToEdit.businessId || 'NONE',
      });
    } else if (isOpen) {
      setFormData({ name: '', email: '', password: '', role: 'CASHIER', businessId: 'NONE' });
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleChange = (val: string) => setFormData(prev => ({ ...prev, role: val }));
  const handleBusinessChange = (val: string) => setFormData(prev => ({ ...prev, businessId: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 🚀 VALIDACIÓN CRÍTICA: Si el TI crea un empleado, DEBE asignarle un negocio.
    if (currentUserRole === 'SUPER_ADMIN' && formData.role !== 'SUPER_ADMIN' && (!formData.businessId || formData.businessId === 'NONE')) {
      toast.error('Debes seleccionar a qué negocio pertenece este empleado.');
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        // Si el TI crea otro TI, no lleva businessId.
        businessId: formData.role === 'SUPER_ADMIN' ? null : (formData.businessId === 'NONE' ? undefined : formData.businessId)
      };

      if (userToEdit?.id) {
        const res = await fetch(`/api/users/${userToEdit.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success('Usuario actualizado correctamente');
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        toast.success('Usuario creado exitosamente');
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error inesperado';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-primary" />
            {userToEdit ? 'Editar Miembro' : 'Registrar Personal'}
          </DialogTitle>
          <DialogDescription>
            {userToEdit 
              ? 'Modifica los datos. Deja la contraseña en blanco para no cambiarla.' 
              : 'Asigna un rol y crea las credenciales para tu equipo.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Nombre Completo</Label>
            <Input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Ana Gómez" required />
          </div>

          <div className="space-y-2">
            <Label>Correo Electrónico (Acceso al sistema)</Label>
            <Input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!!userToEdit} placeholder="ana@empresa.com" required />
          </div>

          <div className="space-y-2">
            <Label>Contraseña {userToEdit && <span className="text-xs text-slate-400 font-normal">(Opcional)</span>}</Label>
            <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••" minLength={6} required={!userToEdit} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2 pt-2">
              <Label>Rol asignado</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASHIER">Cajero</SelectItem>
                  <SelectItem value="MANAGER">Jefe de Tienda</SelectItem>
                  {currentUserRole === 'SUPER_ADMIN' && (
                    <SelectItem value="SUPER_ADMIN">Ingeniero TI</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 🚀 SELECTOR DE NEGOCIO */}
            {currentUserRole === 'SUPER_ADMIN' && formData.role !== 'SUPER_ADMIN' && (
              <div className="space-y-2 pt-2">
                <Label>Negocio al que pertenece</Label>
                <Select value={formData.businessId} onValueChange={handleBusinessChange} disabled={!!userToEdit}>
                  <SelectTrigger className="border-blue-200 bg-blue-50">
                    <SelectValue placeholder="Seleccionar Negocio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE" disabled>Selecciona un cliente</SelectItem>
                    {/* 🚀 FIX: Usamos SimpleBusiness en lugar de any */}
                    {businesses?.map((biz: SimpleBusiness) => (
                      <SelectItem key={biz.id} value={biz.id}>
                        {biz.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {userToEdit ? 'Guardar Cambios' : 'Crear Usuario'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}