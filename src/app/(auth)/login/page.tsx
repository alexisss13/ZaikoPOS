'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2, Store, ArrowRight, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/context/auth-context';

// Esquema de validación
const formSchema = z.object({
  email: z.string().email('Ingresa un correo válido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { setSession } = useAuth();

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Error al iniciar sesión');
      }

      setSession({
        userId: result.user.id,
        businessId: result.user.businessId || '',
        branchId: result.user.branchId || '',
        role: result.user.role,
        name: result.user.name,
        permissions: result.user.permissions || {} 
      });

      toast.success(`Bienvenido, ${result.user.name}`);

      // Redirección inteligente
      if (result.user.role === 'CASHIER') {
        window.location.href = '/pos'; 
      } else {
        window.location.href = '/dashboard'; 
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
        toast.error('Error de acceso', { description: err.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white font-sans">
      
      {/* 🚀 PANEL IZQUIERDO: Branding Corporativo (Oculto en celulares) */}
      <div className="hidden lg:flex w-[45%] xl:w-1/2 relative bg-slate-950 flex-col justify-between p-12 text-white overflow-hidden">
        
        {/* Efectos de luces (Glow) */}
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-pink-600/20 rounded-full blur-[120px] pointer-events-none" />

        {/* Logo / Marca */}
        <div className="relative z-10 flex items-center gap-3 text-xl font-black tracking-tight">
          <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/10 shadow-xl">
            <Store className="w-6 h-6 text-white" />
          </div>
          Festamas & FiestasYa
        </div>

        {/* Mensaje Inspirador */}
        <div className="relative z-10 mb-16">
          <blockquote className="space-y-6">
            <p className="text-4xl xl:text-5xl leading-[1.15] font-bold text-white tracking-tight">
              Plataforma unificada para gestión de inventarios y punto de venta.
            </p>
            <div className="flex items-center gap-3 text-slate-400 font-semibold tracking-wide text-sm">
              <span className="w-10 h-[2px] bg-indigo-500 rounded-full" />
              ECOSISTEMA OMNICANAL
            </div>
          </blockquote>
        </div>

        {/* Footer del panel izquierdo */}
        <div className="relative z-10 flex items-center justify-between text-xs font-medium text-slate-500 uppercase tracking-widest">
          <span>© {new Date().getFullYear()} FiestasYa Group.</span>
          <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4"/> Entorno Seguro</span>
        </div>
      </div>

      {/* 🚀 PANEL DERECHO: Formulario de Login Minimalista */}
      <div className="w-full lg:w-[55%] xl:w-1/2 flex items-center justify-center p-8 sm:p-12 relative bg-white">
        <div className="w-full max-w-[380px] space-y-8">
          
          {/* Cabecera del formulario */}
          <div className="space-y-2 text-center lg:text-left">
            <div className="lg:hidden flex justify-center mb-6">
              <div className="bg-slate-900 p-3.5 rounded-2xl shadow-lg">
                <Store className="w-8 h-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">Iniciar Sesión</h1>
            <p className="text-sm text-slate-500 font-medium">
              Ingresa tus credenciales corporativas para acceder.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            
            {error && (
              <Alert variant="destructive" className="bg-red-50 text-red-700 border-red-200 p-3 rounded-lg">
                <AlertDescription className="font-bold text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 font-bold text-sm">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@festamas.com"
                  className="h-12 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 focus-visible:bg-white transition-all rounded-lg text-base"
                  disabled={isLoading}
                  {...register('email')}
                />
                {errors.email && (
                  <p className="text-xs text-red-500 font-bold mt-1">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 font-bold text-sm">Contraseña</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-12 bg-slate-50/50 border-slate-200 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 focus-visible:bg-white transition-all rounded-lg text-base tracking-widest"
                  disabled={isLoading}
                  {...register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-red-500 font-bold mt-1">{errors.password.message}</p>
                )}
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-lg shadow-slate-900/20 rounded-lg group mt-2" 
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <div className="flex items-center justify-center gap-2">
                  Ingresar al Sistema
                  <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center lg:text-left pt-6 border-t border-slate-100">
            <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider">
              Soporte: sistemas@festamas.com
            </p>
          </div>

        </div>
      </div>
      
    </div>
  );
}