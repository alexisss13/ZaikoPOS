'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { 
  Loader2, UserPlus, ShieldAlert, Store, PackageOpen, LayoutDashboard, Ban, Tag, Percent,
  Wallet, PieChart, Users, EyeOff, ArrowRightLeft, FileWarning, DollarSign
} from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { ScrollArea } from '@/components/ui/scroll-area';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface UserData {
  id?: string;
  name: string;
  email: string;
  role: string;
  businessId?: string | null;
  branchId?: string | null;
  permissions?: Record<string, boolean>;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: UserData | null;
}

interface SimpleBusiness { id: string; name: string; }
interface Branch { id: string; name: string; }

export function UserModal({ isOpen, onClose, onSuccess, userToEdit }: UserModalProps) {
  const { role: currentUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  const { data: businesses } = useSWR(currentUserRole === 'SUPER_ADMIN' ? '/api/businesses' : null, fetcher);
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'CASHIER', 
    businessId: 'NONE',
    branchId: 'NONE',
  });

  // 🚀 PERMISOS GRANULARES ENTERPRISE (EL TOP 7 + LOS ANTERIORES)
  const [permissions, setPermissions] = useState({
    // 1. INVENTARIO BÁSICO
    canCreateProducts: false,
    canEditProducts: false,
    // 2. INVENTARIO AVANZADO
    canManageGlobalProducts: false, 
    canViewOtherBranches: false,    
    canAdjustStock: false,          // Mermas/Pérdidas
    canTransferStock: false,        // Traslados entre tiendas
    // 3. CAJA Y VENTAS
    canApplyDiscounts: false,       
    canVoidSales: false,            
    // 4. ADMINISTRACIÓN DE CAJA
    canOpenCloseCash: false,        // Abrir/Cerrar Turnos
    canViewDailySummary: false,     // Ver el "Corte Ciego" o total de caja
    // 5. REPORTES Y PRIVACIDAD
    canViewCosts: false,            // Ver costo de compra del proveedor
    canViewReports: false,          // Ver gráficos y estadísticas
    canManageCustomers: false,      // Ver/Exportar base de clientes
    canAccessSettings: false,       
  });

  useEffect(() => {
    if (userToEdit && isOpen) {
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        password: '', 
        role: userToEdit.role,
        businessId: userToEdit.businessId || 'NONE',
        branchId: userToEdit.branchId || 'NONE',
      });
      if (userToEdit.permissions) {
        setPermissions({
          canCreateProducts: !!userToEdit.permissions.canCreateProducts,
          canEditProducts: !!userToEdit.permissions.canEditProducts,
          canManageGlobalProducts: !!userToEdit.permissions.canManageGlobalProducts,
          canViewOtherBranches: !!userToEdit.permissions.canViewOtherBranches,
          canAdjustStock: !!userToEdit.permissions.canAdjustStock,
          canTransferStock: !!userToEdit.permissions.canTransferStock,
          canApplyDiscounts: !!userToEdit.permissions.canApplyDiscounts,
          canVoidSales: !!userToEdit.permissions.canVoidSales,
          canOpenCloseCash: !!userToEdit.permissions.canOpenCloseCash,
          canViewDailySummary: !!userToEdit.permissions.canViewDailySummary,
          canViewCosts: !!userToEdit.permissions.canViewCosts,
          canViewReports: !!userToEdit.permissions.canViewReports,
          canManageCustomers: !!userToEdit.permissions.canManageCustomers,
          canAccessSettings: !!userToEdit.permissions.canAccessSettings,
        });
      }
    } else if (isOpen) {
      setFormData({ name: '', email: '', password: '', role: 'CASHIER', businessId: 'NONE', branchId: 'NONE' });
      setPermissions({ 
        canCreateProducts: false, canEditProducts: false, canManageGlobalProducts: false, 
        canViewOtherBranches: false, canAdjustStock: false, canTransferStock: false,
        canApplyDiscounts: false, canVoidSales: false, canOpenCloseCash: true, canViewDailySummary: false,
        canViewCosts: false, canViewReports: false, canManageCustomers: false, canAccessSettings: false 
      });
    }
  }, [userToEdit, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // 🚀 AUTO-PRESETS INTELIGENTES
  const handleRoleChange = (val: string) => {
    setFormData(prev => ({ ...prev, role: val }));
    
    if (val === 'MANAGER') {
      setPermissions({
        canCreateProducts: true,
        canEditProducts: true,
        canManageGlobalProducts: false, 
        canViewOtherBranches: true,     
        canAdjustStock: true,
        canTransferStock: true,
        canApplyDiscounts: true,
        canVoidSales: true,
        canOpenCloseCash: true,
        canViewDailySummary: true,
        canViewCosts: true,
        canViewReports: true,
        canManageCustomers: true,
        canAccessSettings: true,
      });
    } else if (val === 'CASHIER') {
      // CAJERO ULTRA RESTRINGIDO (Solo vende y abre su propia caja)
      setPermissions({
        canCreateProducts: false,
        canEditProducts: false,
        canManageGlobalProducts: false,
        canViewOtherBranches: false,
        canAdjustStock: false,
        canTransferStock: false,
        canApplyDiscounts: false, 
        canVoidSales: false,
        canOpenCloseCash: true, // Cajero normal sí puede abrir/cerrar su turno
        canViewDailySummary: false, // Cajero normal NO ve cuánto dinero debería haber (Corte Ciego)
        canViewCosts: false, // Cajero NO ve el costo de proveedor
        canViewReports: false,
        canManageCustomers: false,
        canAccessSettings: false,
      });
    }
  };

  const handlePermissionToggle = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (currentUserRole === 'SUPER_ADMIN' && formData.role !== 'SUPER_ADMIN' && (!formData.businessId || formData.businessId === 'NONE')) {
      toast.error('Debes seleccionar a qué negocio pertenece este empleado.');
      return;
    }

    if (permissions.canManageGlobalProducts && formData.branchId !== 'NONE') {
      const confirmGlobal = confirm('Le estás dando acceso al catálogo global, pero lo tienes anclado a una sola sucursal. ¿Estás seguro?');
      if (!confirmGlobal) return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        businessId: formData.role === 'SUPER_ADMIN' ? null : (formData.businessId === 'NONE' ? undefined : formData.businessId),
        branchId: formData.branchId === 'NONE' ? null : formData.branchId,
        permissions
      };

      const url = userToEdit?.id ? `/api/users/${userToEdit.id}` : '/api/users';
      const method = userToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(userToEdit?.id ? 'Usuario actualizado correctamente' : 'Usuario creado exitosamente');
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
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden bg-slate-50">
        <DialogHeader className="px-6 py-4 bg-white border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <UserPlus className="w-5 h-5 text-primary" />
            {userToEdit ? 'Editar Miembro' : 'Registrar Personal'}
          </DialogTitle>
          <DialogDescription>
            {userToEdit 
              ? 'Modifica los datos y ajusta los permisos individualmente.' 
              : 'Asigna un rol, una sucursal y configura permisos granulares para tu equipo.'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[75vh] px-6 py-4">
          <form id="user-form" onSubmit={handleSubmit} className="space-y-6">
            
            {/* SECCIÓN 1: DATOS PERSONALES */}
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2 border-b pb-2"><LayoutDashboard className="w-4 h-4 text-indigo-500" /> Credenciales de Acceso</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre Completo *</Label>
                  <Input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Ana Gómez" required />
                </div>
                <div className="space-y-2">
                  <Label>Correo Electrónico *</Label>
                  <Input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!!userToEdit} placeholder="ana@empresa.com" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Contraseña {userToEdit && <span className="text-xs text-slate-400 font-normal">(Dejar en blanco para no cambiar)</span>}</Label>
                <Input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••" minLength={6} required={!userToEdit} />
              </div>
            </div>

            {/* SECCIÓN 2: ROL Y SUCURSAL */}
            <div className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-2 border-b pb-2"><Store className="w-4 h-4 text-emerald-500" /> Puesto de Trabajo</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Rol en el Sistema *</Label>
                  <Select value={formData.role} onValueChange={handleRoleChange}>
                    <SelectTrigger className="border-emerald-200 bg-emerald-50 text-emerald-800 font-bold">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASHIER">Cajero (Ventas)</SelectItem>
                      <SelectItem value="MANAGER">Jefe de Tienda</SelectItem>
                      {currentUserRole === 'SUPER_ADMIN' && <SelectItem value="SUPER_ADMIN">Ingeniero TI</SelectItem>}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Sucursal Asignada *</Label>
                  <Select value={formData.branchId} onValueChange={(v) => setFormData(p => ({...p, branchId: v}))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige la tienda base" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Sin Sucursal (Global / Todo)</SelectItem>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* 🚀 SECCIÓN 3: PERMISOS GRANULARES (RBAC) */}
            {formData.role !== 'SUPER_ADMIN' && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-amber-500" /> Control de Permisos Especiales</h3>
                
                {/* 📦 BLOQUE 1: INVENTARIO BÁSICO Y AVANZADO */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2 border-b font-semibold text-xs text-slate-500 flex items-center gap-2">
                    <PackageOpen className="w-3.5 h-3.5" /> GESTIÓN DE PRODUCTOS E INVENTARIO
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold cursor-pointer" onClick={() => handlePermissionToggle('canCreateProducts')}>Crear Productos</Label>
                        <p className="text-xs text-slate-500 leading-tight">Permite agregar nuevos productos al sistema, vinculados a su sucursal.</p>
                      </div>
                      <Switch checked={permissions.canCreateProducts} onCheckedChange={() => handlePermissionToggle('canCreateProducts')} />
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold cursor-pointer" onClick={() => handlePermissionToggle('canEditProducts')}>Editar Precios y Stock</Label>
                        <p className="text-xs text-slate-500 leading-tight">Permite modificar información de los productos existentes de su sucursal.</p>
                      </div>
                      <Switch checked={permissions.canEditProducts} onCheckedChange={() => handlePermissionToggle('canEditProducts')} />
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold cursor-pointer" onClick={() => handlePermissionToggle('canViewOtherBranches')}>Ver Stock Externo (Solo lectura)</Label>
                        <p className="text-xs text-slate-500 leading-tight">Permite ver si hay stock en otras sucursales para derivar clientes.</p>
                      </div>
                      <Switch checked={permissions.canViewOtherBranches} onCheckedChange={() => handlePermissionToggle('canViewOtherBranches')} />
                    </div>
                    {/* AVANZADOS INVENTARIO */}
                    <div className="flex items-center justify-between p-4 hover:bg-orange-50 transition-colors bg-orange-50/20">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold text-orange-700 cursor-pointer flex items-center gap-1" onClick={() => handlePermissionToggle('canAdjustStock')}><FileWarning className="w-3.5 h-3.5"/> Ajuste de Mermas / Pérdidas</Label>
                        <p className="text-xs text-orange-600/80 leading-tight">Permite reducir stock manualmente sin registrar una venta (Pérdidas/Robos).</p>
                      </div>
                      <Switch checked={permissions.canAdjustStock} onCheckedChange={() => handlePermissionToggle('canAdjustStock')} />
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-orange-50 transition-colors bg-orange-50/20">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold text-orange-700 cursor-pointer flex items-center gap-1" onClick={() => handlePermissionToggle('canTransferStock')}><ArrowRightLeft className="w-3.5 h-3.5"/> Traslados entre Sucursales</Label>
                        <p className="text-xs text-orange-600/80 leading-tight">Permite enviar productos físicos hacia otra tienda/sucursal.</p>
                      </div>
                      <Switch checked={permissions.canTransferStock} onCheckedChange={() => handlePermissionToggle('canTransferStock')} />
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-red-50 transition-colors bg-red-50/20">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold text-red-700 cursor-pointer" onClick={() => handlePermissionToggle('canManageGlobalProducts')}>Acceso al Catálogo Global</Label>
                        <p className="text-xs text-red-600/80 leading-tight">Crítico: Permite editar productos compartidos y asignar stock a TODAS las tiendas ajenas.</p>
                      </div>
                      <Switch checked={permissions.canManageGlobalProducts} onCheckedChange={() => handlePermissionToggle('canManageGlobalProducts')} />
                    </div>
                  </div>
                </div>

                {/* 💰 BLOQUE 2: CAJA Y VENTAS */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-emerald-50/50 px-4 py-2 border-b border-emerald-100 font-semibold text-xs text-emerald-700 flex items-center gap-2">
                    <Tag className="w-3.5 h-3.5" /> OPERACIONES DE CAJA (POS)
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold cursor-pointer flex items-center gap-1" onClick={() => handlePermissionToggle('canOpenCloseCash')}><Wallet className="w-3.5 h-3.5 text-emerald-500"/> Abrir / Cerrar Turnos</Label>
                        <p className="text-xs text-slate-500 leading-tight">Permite al empleado abrir la caja e iniciar ventas, y cerrarla al final del día.</p>
                      </div>
                      <Switch checked={permissions.canOpenCloseCash} onCheckedChange={() => handlePermissionToggle('canOpenCloseCash')} />
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold cursor-pointer flex items-center gap-1" onClick={() => handlePermissionToggle('canApplyDiscounts')}><Percent className="w-3.5 h-3.5 text-blue-500"/> Aplicar Descuentos Manuales</Label>
                        <p className="text-xs text-slate-500 leading-tight">Permite modificar el precio final de los productos durante una venta.</p>
                      </div>
                      <Switch checked={permissions.canApplyDiscounts} onCheckedChange={() => handlePermissionToggle('canApplyDiscounts')} />
                    </div>
                    {/* AVANZADOS DE CAJA */}
                    <div className="flex items-center justify-between p-4 hover:bg-orange-50 transition-colors bg-orange-50/20">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold text-orange-700 cursor-pointer flex items-center gap-1" onClick={() => handlePermissionToggle('canViewDailySummary')}><EyeOff className="w-3.5 h-3.5"/> Ver Total de Caja (Anti-Corte Ciego)</Label>
                        <p className="text-xs text-orange-600/80 leading-tight">Si está inactivo, el empleado no sabrá cuánto dinero hay en el sistema al cerrar turno, evitando robos de sobrantes.</p>
                      </div>
                      <Switch checked={permissions.canViewDailySummary} onCheckedChange={() => handlePermissionToggle('canViewDailySummary')} />
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-red-50 transition-colors bg-red-50/30">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold text-red-700 cursor-pointer flex items-center gap-1" onClick={() => handlePermissionToggle('canVoidSales')}><Ban className="w-3.5 h-3.5"/> Anular Ventas / Devoluciones</Label>
                        <p className="text-xs text-red-600 leading-tight">Crítico: Permite anular boletas emitidas, reversando dinero y regresando stock al inventario.</p>
                      </div>
                      <Switch checked={permissions.canVoidSales} onCheckedChange={() => handlePermissionToggle('canVoidSales')} />
                    </div>
                  </div>
                </div>

                {/* 🔒 BLOQUE 3: PRIVACIDAD Y REPORTES */}
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  <div className="bg-slate-800 px-4 py-2 border-b border-slate-900 font-semibold text-xs text-slate-200 flex items-center gap-2">
                    <ShieldAlert className="w-3.5 h-3.5" /> PRIVACIDAD Y ADMINISTRACIÓN
                  </div>
                  <div className="divide-y divide-slate-100">
                    <div className="flex items-center justify-between p-4 hover:bg-red-50 transition-colors bg-red-50/10">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold text-slate-800 cursor-pointer flex items-center gap-1" onClick={() => handlePermissionToggle('canViewCosts')}><DollarSign className="w-3.5 h-3.5 text-slate-400"/> Ver Costo Original de Proveedor</Label>
                        <p className="text-xs text-slate-500 leading-tight">Si está inactivo, el empleado solo verá el precio de venta al público.</p>
                      </div>
                      <Switch checked={permissions.canViewCosts} onCheckedChange={() => handlePermissionToggle('canViewCosts')} />
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold cursor-pointer flex items-center gap-1" onClick={() => handlePermissionToggle('canManageCustomers')}><Users className="w-3.5 h-3.5 text-blue-500"/> Gestionar/Exportar Clientes</Label>
                        <p className="text-xs text-slate-500 leading-tight">Permite acceder al listado de correos y teléfonos de todos los clientes.</p>
                      </div>
                      <Switch checked={permissions.canManageCustomers} onCheckedChange={() => handlePermissionToggle('canManageCustomers')} />
                    </div>
                    <div className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors">
                      <div className="space-y-0.5 pr-4">
                        <Label className="text-sm font-bold cursor-pointer flex items-center gap-1" onClick={() => handlePermissionToggle('canViewReports')}><PieChart className="w-3.5 h-3.5 text-indigo-500"/> Ver Estadísticas y Gráficos</Label>
                        <p className="text-xs text-slate-500 leading-tight">Permite acceder al Dashboard principal con el resumen de ganancias y ventas.</p>
                      </div>
                      <Switch checked={permissions.canViewReports} onCheckedChange={() => handlePermissionToggle('canViewReports')} />
                    </div>
                  </div>
                </div>

              </div>
            )}
            
          </form>
        </ScrollArea>

        <div className="px-6 py-4 bg-white border-t flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>Cancelar</Button>
          <Button type="submit" form="user-form" disabled={isLoading} className="shadow-md">
            {isLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {userToEdit ? 'Guardar Cambios' : 'Registrar Empleado'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}