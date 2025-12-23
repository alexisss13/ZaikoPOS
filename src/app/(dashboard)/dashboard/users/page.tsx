'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, UserPlus } from 'lucide-react';
import { Role } from '@prisma/client'; // Importamos el Enum real de Prisma si queremos ser puristas

// Definimos el esquema
const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  // Limitamos los roles permitidos en la creación desde UI
  role: z.enum(['CASHIER', 'OWNER']), 
});

// Inferimos el tipo TypeScript desde Zod (Esto elimina la necesidad de 'any')
type UserFormData = z.infer<typeof userSchema>;

export default function UsersPage() {
  const [loading, setLoading] = useState(false);
  
  const { register, handleSubmit, setValue, reset, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      role: 'CASHIER' // Valor por defecto seguro
    }
  });

  // SOLUCIÓN 1: Usamos el tipo UserFormData en lugar de 'any'
  const onSubmit = async (data: UserFormData) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Error creando usuario');
      
      toast.success(`Usuario ${data.name} creado correctamente`);
      reset();
    } catch (e) {
      toast.error('No se pudo crear el usuario');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Gestión de Equipo</h2>
        <p className="text-muted-foreground">Crea cuentas para tus cajeros o encargados.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Nuevo Usuario
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input {...register('name')} placeholder="Juan Pérez" />
                    {errors.name && <p className="text-red-500 text-xs">Requerido</p>}
                </div>
                <div className="space-y-2">
                    <Label>Rol</Label>
                    {/* SOLUCIÓN 2: Forzamos el tipado del valor del Select */}
                    <Select 
                      onValueChange={(val) => setValue('role', val as "CASHIER" | "OWNER")} 
                      defaultValue="CASHIER"
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona rol" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="CASHIER">Cajero (Solo POS)</SelectItem>
                            <SelectItem value="OWNER">Administrador</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Correo Electrónico (Login)</Label>
                <Input {...register('email')} type="email" placeholder="cajero@zaiko.com" />
                {errors.email && <p className="text-red-500 text-xs">Email inválido</p>}
            </div>

            <div className="space-y-2">
                <Label>Contraseña Inicial</Label>
                <Input {...register('password')} type="password" placeholder="******" />
                {errors.password && <p className="text-red-500 text-xs">Min. 6 caracteres</p>}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : 'Crear Usuario'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}