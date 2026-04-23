'use client';

import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  Loading02Icon, UserAdd01Icon, Shield01Icon, Store01Icon, PackageIcon, DashboardSquare01Icon, Tag01Icon, 
  Globe02Icon, ArrowDown01Icon, InformationCircleIcon, PlusSignIcon, Cancel01Icon, Camera01Icon
} from 'hugeicons-react';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface UserData {
  id?: string;
  name: string;
  email: string;
  role: string;
  businessId?: string | null;
  branchId?: string | null;
  image?: string | null; 
  permissions?: Record<string, boolean>;
}

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userToEdit?: UserData | null;
}

interface SimpleBusiness { id: string; name: string; }
interface Branch { id: string; name: string; logoUrl?: string | null; }

type AccordionSection = 'inventory' | 'pos' | 'privacy' | null;

export function UserModal({ isOpen, onClose, onSuccess, userToEdit }: UserModalProps) {
  const { role: currentUserRole } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false); 
  
  const [openSection, setOpenSection] = useState<AccordionSection>('inventory');
  const [expandedInfo, setExpandedInfo] = useState<Record<string, boolean>>({});
  
  const { data: businesses } = useSWR<SimpleBusiness[]>(currentUserRole === 'SUPER_ADMIN' ? '/api/businesses' : null, fetcher);
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'CASHIER', businessId: 'NONE', branchId: '', image: '' 
  });

  const [permissions, setPermissions] = useState({
    canCreateProducts: false, canEditProducts: false, canManageGlobalProducts: false, 
    canViewOtherBranches: false, canAdjustStock: false, canTransferStock: false,
    canApplyDiscounts: false, canVoidSales: false, canOpenCloseCash: false, 
    canViewDailySummary: false, canViewCosts: false, canViewReports: false, 
    canManageCustomers: false, canAccessSettings: false 
  });

  useEffect(() => {
    if (userToEdit && isOpen) {
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        password: '', 
        role: userToEdit.role,
        businessId: userToEdit.businessId || 'NONE',
        branchId: userToEdit.branchId || (branches && branches.length > 0 ? branches[0].id : ''),
        image: userToEdit.image || '', 
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
      setFormData({ 
        name: '', email: '', password: '', role: 'CASHIER', businessId: 'NONE', 
        branchId: branches && branches.length > 0 ? branches[0].id : '', 
        image: '' 
      });
      setPermissions({ 
        canCreateProducts: false, canEditProducts: false, canManageGlobalProducts: false, 
        canViewOtherBranches: false, canAdjustStock: false, canTransferStock: false,
        canApplyDiscounts: false, canVoidSales: false, canOpenCloseCash: true, canViewDailySummary: false,
        canViewCosts: false, canViewReports: false, canManageCustomers: false, canAccessSettings: false 
      });
      setExpandedInfo({});
    }
  }, [userToEdit, isOpen, branches]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRoleChange = (val: string) => {
    setFormData(prev => ({ ...prev, role: val }));
    
    if (val === 'SUPER_ADMIN') {
      setFormData(prev => ({ ...prev, branchId: 'NONE' }));
    }

    if (val === 'MANAGER') {
      setPermissions({
        canCreateProducts: true, canEditProducts: true, canManageGlobalProducts: false, 
        canViewOtherBranches: true, canAdjustStock: true, canTransferStock: true,
        canApplyDiscounts: true, canVoidSales: true, canOpenCloseCash: true,
        canViewDailySummary: true, canViewCosts: true, canViewReports: true,
        canManageCustomers: true, canAccessSettings: true,
      });
    } else if (val === 'CASHIER') {
      setPermissions({
        canCreateProducts: false, canEditProducts: false, canManageGlobalProducts: false,
        canViewOtherBranches: false, canAdjustStock: false, canTransferStock: false,
        canApplyDiscounts: false, canVoidSales: false, canOpenCloseCash: true, 
        canViewDailySummary: false, canViewCosts: false, canViewReports: false,
        canManageCustomers: false, canAccessSettings: false,
      });
    }
  };

  const handlePermissionToggle = (key: keyof typeof permissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('upload_preset', 'zaiko_pos'); 
    uploadData.append('cloud_name', 'dwunkgitl');

    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dwunkgitl/image/upload', { method: 'POST', body: uploadData });
      const data = await res.json();
      if (data.secure_url) { 
        setFormData(prev => ({ ...prev, image: data.secure_url })); 
        toast.success('Foto de perfil subida'); 
      } 
      else throw new Error('Error al subir');
    } catch (error) { toast.error('Error con Cloudinary'); } 
    finally { setIsUploadingImage(false); e.target.value = ''; }
  };

  const removeImage = () => {
    setFormData(prev => ({ ...prev, image: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserRole === 'SUPER_ADMIN' && formData.role !== 'SUPER_ADMIN' && (!formData.businessId || formData.businessId === 'NONE')) {
      return toast.error('Debes seleccionar a qué negocio pertenece este empleado.');
    }
    if (formData.role !== 'SUPER_ADMIN' && (!formData.branchId || formData.branchId === 'NONE')) {
       return toast.error('El empleado debe estar asignado a una sucursal.');
    }

    if (permissions.canManageGlobalProducts && (!formData.branchId || formData.branchId === 'NONE')) {
      const confirmGlobal = confirm('Le estás dando acceso al catálogo global. ¿Estás seguro?');
      if (!confirmGlobal) return;
    }

    setIsLoading(true);
    try {
      const payload = {
        ...formData,
        image: formData.image.trim() === '' ? null : formData.image,
        businessId: formData.role === 'SUPER_ADMIN' ? null : (formData.businessId === 'NONE' ? undefined : formData.businessId),
        branchId: formData.role === 'SUPER_ADMIN' || formData.branchId === 'NONE' ? null : formData.branchId,
        permissions
      };
      const url = userToEdit?.id ? `/api/users/${userToEdit.id}` : '/api/users';
      const method = userToEdit?.id ? 'PUT' : 'POST';

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(userToEdit?.id ? 'Usuario actualizado' : 'Usuario creado');
      onSuccess(); onClose();
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

  // 🚀 MEJORA: Permisos estilo iPhone Settings (Flat Design)
  const PermissionRow = ({ label, desc, stateKey, type = 'default' }: { label: string, desc: string, stateKey: keyof typeof permissions, type?: 'default'|'warning'|'critical' }) => {
    const textColors = { default: 'text-slate-800', warning: 'text-amber-600', critical: 'text-red-600' };
    const isExpanded = expandedInfo[stateKey];

    const toggleInfo = (e: React.MouseEvent) => {
      e.stopPropagation();
      setExpandedInfo(prev => ({ ...prev, [stateKey]: !prev[stateKey] }));
    };

    return (
      <div className="flex flex-col border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
        <div className="flex items-center justify-between p-3 sm:px-4 sm:py-3.5">
          <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={toggleInfo} title="Ver más información">
            <div className={`p-1.5 rounded-md transition-colors ${isExpanded ? 'bg-slate-200 text-slate-800' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
              <InformationCircleIcon size={14} strokeWidth={2} />
            </div>
            <Label className={`text-xs sm:text-sm font-semibold cursor-pointer ${textColors[type]} flex-1 leading-tight`}>
              {label}
            </Label>
          </div>
          <Switch checked={permissions[stateKey]} onCheckedChange={() => handlePermissionToggle(stateKey)} />
        </div>
        <div className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isExpanded ? 'grid-rows-[1fr] opacity-100 pb-3' : 'grid-rows-[0fr] opacity-0 pb-0'}`}>
          <div className="overflow-hidden px-4 sm:px-12">
            <p className="text-[10px] sm:text-xs text-slate-500 leading-snug">{desc}</p>
          </div>
        </div>
      </div>
    );
  };

  const toggleSection = (section: AccordionSection) => {
    setOpenSection(openSection === section ? null : section);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[95vw] sm:max-w-5xl p-0 overflow-hidden bg-white font-sans border-none shadow-2xl rounded-2xl flex flex-col max-h-[90vh]">
        
        {/* 🚀 HEADER PLANO */}
        <DialogHeader className="px-6 py-5 bg-slate-50 border-b border-slate-100 shadow-sm flex flex-row items-center gap-4 shrink-0 z-10">
          <div className="bg-white p-2.5 rounded-xl shadow-sm border border-slate-200 shrink-0">
            <UserAdd01Icon size={20} strokeWidth={2} className="text-slate-700" />
          </div>
          <div className="flex flex-col items-start text-left">
            <DialogTitle className="text-lg font-black text-slate-900 leading-tight">
              {userToEdit ? 'Editar Miembro del Equipo' : 'Registrar Personal'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-0.5 font-medium">
              {userToEdit ? 'Modifica los datos y ajusta los permisos.' : 'Asigna un rol, sucursal y configura accesos.'}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 overflow-x-hidden relative custom-scrollbar bg-slate-50/30">
          <form id="user-form" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6">
              
              {/* ==============================
                  COLUMNA 1: INFO DEL USUARIO
                  ============================== */}
              <div className="lg:col-span-5 space-y-5">
                
                {/* TARJETA CREDENCIALES */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                    <DashboardSquare01Icon size={16} strokeWidth={2} className="text-slate-400" /> Credenciales
                  </h3>

                  {/* Foto Flat Design */}
                  <div className="flex items-center gap-4 mb-2 pt-2">
                    {formData.image ? (
                      <div className="relative w-16 h-16 rounded-2xl border border-slate-200 overflow-hidden shadow-sm group">
                        <img src={formData.image} alt="Perfil" className="w-full h-full object-cover" />
                        <button type="button" onClick={removeImage} className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Cancel01Icon size={20} strokeWidth={2} />
                        </button>
                      </div>
                    ) : (
                      <div className="relative w-16 h-16 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300 transition-colors flex items-center justify-center overflow-hidden cursor-pointer group shadow-sm">
                        <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={isUploadingImage} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                        {isUploadingImage ? <Loading02Icon size={20} className="animate-spin text-slate-400" /> : <Camera01Icon size={20} strokeWidth={1.5} className="text-slate-400 group-hover:scale-110 transition-transform" />}
                      </div>
                    )}
                    <div className="flex-1">
                      <Label className="text-xs font-bold text-slate-700 block">Foto de Perfil</Label>
                      <span className="text-[10px] text-slate-500 font-medium">JPG, PNG (Máx 5MB)</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Nombre Completo <span className="text-red-500">*</span></Label>
                    <input name="name" value={formData.name} onChange={handleChange} placeholder="Ej: Ana Gómez" className={getInputClass(formData.name)} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Correo Electrónico <span className="text-red-500">*</span></Label>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} disabled={!!userToEdit} placeholder="ana@empresa.com" className={`${getInputClass(formData.email)} ${userToEdit ? 'opacity-75 cursor-not-allowed bg-slate-100' : ''}`} required />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-bold text-slate-700">Contraseña {userToEdit && <span className="text-slate-400 font-medium">(Opcional)</span>}</Label>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••" minLength={6} className={getInputClass(formData.password)} required={!userToEdit} />
                  </div>
                </div>

                {/* TARJETA PUESTO */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2.5 uppercase tracking-wide">
                    <Store01Icon size={16} strokeWidth={2} className="text-slate-400" /> Puesto de Trabajo
                  </h3>
                  
                  {currentUserRole === 'SUPER_ADMIN' && formData.role !== 'SUPER_ADMIN' && (
                    <div className="space-y-1.5 pt-2">
                      <Label className="text-xs font-bold text-slate-700">Negocio (SaaS) <span className="text-red-500">*</span></Label>
                      <Select value={formData.businessId} onValueChange={(v) => setFormData(p => ({...p, businessId: v}))}>
                        <SelectTrigger className={`h-10 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 transition-all ${formData.businessId !== 'NONE' ? 'bg-white border-slate-200 shadow-sm font-bold text-slate-900' : 'bg-slate-50 border-transparent text-slate-500'}`}><SelectValue placeholder="Asignar negocio" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="NONE" disabled>Seleccionar negocio...</SelectItem>
                          {businesses?.map((b) => <SelectItem key={b.id} value={b.id} className="py-2.5 px-3 font-medium text-slate-700">{b.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Rol <span className="text-red-500">*</span></Label>
                      <Select value={formData.role} onValueChange={handleRoleChange}>
                        <SelectTrigger className="h-10 text-sm rounded-xl bg-slate-900 text-white font-bold border-none shadow-md focus-visible:ring-1 focus-visible:ring-slate-500"><SelectValue placeholder="Selecciona" /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          <SelectItem value="CASHIER" className="py-2.5 px-3 font-medium text-slate-700">Cajero (Ventas)</SelectItem>
                          <SelectItem value="MANAGER" className="py-2.5 px-3 font-medium text-slate-700">Jefe de Tienda</SelectItem>
                          {currentUserRole === 'SUPER_ADMIN' && <SelectItem value="SUPER_ADMIN" className="py-2.5 px-3 font-medium text-slate-700">Ingeniero TI</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold text-slate-700">Sucursal <span className="text-red-500">*</span></Label>
                      <Select value={formData.branchId} onValueChange={(v) => setFormData(p => ({...p, branchId: v}))} disabled={formData.role === 'SUPER_ADMIN'}>
                        <SelectTrigger className={`h-10 text-sm rounded-xl focus-visible:ring-1 focus-visible:ring-slate-300 transition-all ${formData.branchId && formData.branchId !== 'NONE' ? 'bg-white border-slate-200 shadow-sm font-bold text-slate-900' : 'bg-slate-50 border-transparent text-slate-500'} ${formData.role === 'SUPER_ADMIN' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <SelectValue placeholder="Elige base..." />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-xl">
                          {formData.role === 'SUPER_ADMIN' && (
                            <SelectItem value="NONE" className="py-2.5 px-3">
                              <div className="flex items-center gap-2"><Globe02Icon size={16} strokeWidth={2} className="text-slate-500" /><span className="font-bold text-slate-700">Red Global</span></div>
                            </SelectItem>
                          )}
                          {branches?.map((branch) => (
                            <SelectItem key={branch.id} value={branch.id} className="py-2.5 px-3 font-medium text-slate-700">
                              <div className="flex items-center gap-2.5">
                                {branch.logoUrl ? <img src={branch.logoUrl} alt={branch.name} className="w-4 h-4 rounded-sm object-cover border border-slate-200 bg-white" /> : <Store01Icon size={14} strokeWidth={2} className="text-slate-400" />}
                                <span>{branch.name}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* ==============================
                  COLUMNA 2: PERMISOS (ACORDEÓN PLANO)
                  ============================== */}
              <div className="lg:col-span-7 h-fit pb-10">
                {formData.role !== 'SUPER_ADMIN' ? (
                  <div className="space-y-4">
                    
                    {/* INVENTARIO */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                      <button type="button" onClick={() => toggleSection('inventory')} className={`w-full px-5 py-4 flex items-center justify-between transition-colors outline-none z-10 ${openSection === 'inventory' ? 'bg-slate-50/80 border-b border-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                        <div className="font-black text-xs text-slate-800 flex items-center gap-2.5 uppercase tracking-wide"><PackageIcon size={16} strokeWidth={2.5} className={`${openSection === 'inventory' ? 'text-slate-900' : 'text-slate-400'}`} /> Inventario y Logística</div>
                        <ArrowDown01Icon size={16} strokeWidth={2} className={`text-slate-400 transition-transform duration-300 ${openSection === 'inventory' ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`grid transition-all duration-300 ease-in-out ${openSection === 'inventory' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <PermissionRow label="Crear Productos" desc="Registrar nueva mercadería en el catálogo de su sucursal." stateKey="canCreateProducts" />
                          <PermissionRow label="Editar Precios y Stock" desc="Modificar el precio de venta público y mantener el stock al día." stateKey="canEditProducts" />
                          <PermissionRow label="Ver Stock Externo" desc="Saber si otra tienda tiene el producto que busca el cliente (Solo lectura)." stateKey="canViewOtherBranches" />
                          <PermissionRow label="Ajuste de Mermas" desc="Reducir el stock manualmente sin registrar una venta (Por robos, daños o caducidad)." stateKey="canAdjustStock" type="warning" />
                          <PermissionRow label="Traslados" desc="Enviar cajas o productos desde su almacén hacia el almacén de otra sucursal." stateKey="canTransferStock" type="warning" />
                          <PermissionRow label="Catálogo Global (Peligroso)" desc="Acceso total para editar cualquier producto sin importar a qué tienda pertenezca." stateKey="canManageGlobalProducts" type="critical" />
                        </div>
                      </div>
                    </div>

                    {/* CAJA Y VENTAS */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                      <button type="button" onClick={() => toggleSection('pos')} className={`w-full px-5 py-4 flex items-center justify-between transition-colors outline-none z-10 ${openSection === 'pos' ? 'bg-slate-50/80 border-b border-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                        <div className="font-black text-xs text-slate-800 flex items-center gap-2.5 uppercase tracking-wide"><Tag01Icon size={16} strokeWidth={2.5} className={`${openSection === 'pos' ? 'text-slate-900' : 'text-slate-400'}`} /> Operaciones de Caja</div>
                        <ArrowDown01Icon size={16} strokeWidth={2} className={`text-slate-400 transition-transform duration-300 ${openSection === 'pos' ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`grid transition-all duration-300 ease-in-out ${openSection === 'pos' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <PermissionRow label="Abrir / Cerrar Turnos" desc="Permite ingresar la base de efectivo en la mañana y generar el ticket Z en la noche." stateKey="canOpenCloseCash" />
                          <PermissionRow label="Aplicar Descuentos" desc="Autorización para rebajar manualmente el precio final al momento de cobrar al cliente." stateKey="canApplyDiscounts" />
                          <PermissionRow label="Ver Total de Caja" desc="Si se desactiva, obliga al cajero a contar y declarar el dinero a ciegas (Evita robos)." stateKey="canViewDailySummary" type="warning" />
                          <PermissionRow label="Anular Ventas" desc="Poder borrar un ticket emitido, regresar el stock al sistema y restar el dinero." stateKey="canVoidSales" type="critical" />
                        </div>
                      </div>
                    </div>

                    {/* PRIVACIDAD Y REPORTES */}
                    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                      <button type="button" onClick={() => toggleSection('privacy')} className={`w-full px-5 py-4 flex items-center justify-between transition-colors outline-none z-10 ${openSection === 'privacy' ? 'bg-slate-50/80 border-b border-slate-100' : 'bg-white hover:bg-slate-50'}`}>
                        <div className="font-black text-xs text-slate-800 flex items-center gap-2.5 uppercase tracking-wide"><Shield01Icon size={16} strokeWidth={2.5} className={`${openSection === 'privacy' ? 'text-slate-900' : 'text-slate-400'}`} /> Privacidad y Reportes</div>
                        <ArrowDown01Icon size={16} strokeWidth={2} className={`text-slate-400 transition-transform duration-300 ${openSection === 'privacy' ? 'rotate-180' : ''}`} />
                      </button>
                      <div className={`grid transition-all duration-300 ease-in-out ${openSection === 'privacy' ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                          <PermissionRow label="Ver Costos de Proveedor" desc="Oculta el precio al que compraste la mercadería. Solo verá el precio de venta final." stateKey="canViewCosts" />
                          <PermissionRow label="Gestionar Clientes" desc="Tener acceso a la base de datos completa de nombres, correos y teléfonos." stateKey="canManageCustomers" />
                          <PermissionRow label="Ver Estadísticas" desc="Acceso a la pantalla principal (Dashboard) para ver las ganancias y ventas totales de la tienda." stateKey="canViewReports" />
                        </div>
                      </div>
                    </div>

                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-dashed border-slate-200 shadow-sm mt-2">
                    <Shield01Icon size={48} strokeWidth={1.5} className="text-slate-300 mb-4" />
                    <h4 className="text-lg font-black text-slate-900">Privilegios Absolutos</h4>
                    <p className="text-sm text-slate-500 text-center max-w-sm mt-2 font-medium">
                      El rol <span className="font-bold text-slate-700">Ingeniero TI</span> tiene acceso irrestricto a la infraestructura. No aplican restricciones granulares.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </form>
        </div>

        {/* 🚀 FOOTER PLANO */}
        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0 z-20 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading || isUploadingImage} className="h-10 text-xs font-bold hover:bg-slate-50 text-slate-600 rounded-xl border-slate-200">
            Cancelar
          </Button>
          <Button type="submit" form="user-form" disabled={isLoading || isUploadingImage} className="h-10 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-6 shadow-md rounded-xl transition-all">
            {isLoading && <Loading02Icon size={14} strokeWidth={2} className="mr-1.5 animate-spin" />}
            {userToEdit ? 'Guardar Cambios' : 'Registrar Empleado'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}