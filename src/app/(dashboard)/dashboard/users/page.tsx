'use client';

import useSWR from 'swr';
import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, MoreVertical, Search, ChevronLeft, ChevronRight, UserCog, PowerOff, Trash2, Building, Store, Filter, Check, Edit, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { UserModal, UserData } from '@/components/dashboard/UserModal';
import { BasicUserModal } from '@/components/dashboard/BasicUserModal';
import { PermissionsManager } from '@/components/dashboard/PermissionsManager';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());

interface SystemUser {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  isActive: boolean;
  businessId: string | null;
  branchId: string | null; 
  permissions: Record<string, boolean> | null; 
  image?: string | null; 
  business?: { name: string } | null;
  branch?: { name: string } | null;
}

// 🚀 FIX: Añadimos la interfaz de Branch para obtener los logos
interface Branch {
  id: string;
  name: string;
  logoUrl?: string | null;
}

const ITEMS_PER_PAGE = 10; 

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Ingeniero TI',
  OWNER: 'Dueño',
  MANAGER: 'Jefe Tienda',
  CASHIER: 'Cajero'
};

const POS_ROLES = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER'];

export default function UsersPage() {
  const { role: currentUserRole, userId: currentUserId } = useAuth();
  const { data: users, isLoading, mutate } = useSWR<SystemUser[]>('/api/users', fetcher);
  
  // 🚀 FIX: Obtenemos las sucursales para cruzar el logo
  const { data: branches } = useSWR<Branch[]>('/api/branches', fetcher);
  const getBranchById = (id: string | null) => branches?.find(b => b.id === id);

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // 1. Primero filtramos usuarios base (excluyendo a uno mismo)
  const baseUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => user.id !== currentUserId && POS_ROLES.includes(user.role));
  }, [users, currentUserId]);

  // 2. Extraemos qué roles realmente existen
  const availableRoles = useMemo(() => {
    const roles = new Set<string>();
    baseUsers.forEach(u => roles.add(u.role));
    return Array.from(roles);
  }, [baseUsers]);

  // 3. Aplicamos filtros de búsqueda, estado y rol
  const filteredUsers = useMemo(() => {
    return baseUsers.filter(user => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (user.name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower));
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' && user.isActive) || (statusFilter === 'INACTIVE' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [baseUsers, searchTerm, roleFilter, statusFilter]);

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, roleFilter, statusFilter]);

  const handleOpenNew = () => { setSelectedUser(null); setIsBasicModalOpen(true); };
  
  const handleOpenEdit = (user: SystemUser, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setSelectedUser({ 
      id: user.id, 
      name: user.name || '', 
      email: user.email || '', 
      role: user.role, 
      businessId: user.businessId,
      branchId: user.branchId, 
      permissions: user.permissions || {}, 
      image: user.image || '', 
    });
    setIsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleOpenBasicEdit = (user: SystemUser, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setSelectedUser({ 
      id: user.id, 
      name: user.name || '', 
      email: user.email || '', 
      role: user.role, 
      businessId: user.businessId,
      branchId: user.branchId, 
      permissions: user.permissions || {}, 
      image: user.image || '', 
    });
    setIsBasicModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleOpenPermissions = (user: SystemUser, e?: React.MouseEvent) => {
    if(e) e.stopPropagation();
    setSelectedUser({ 
      id: user.id, 
      name: user.name || '', 
      email: user.email || '', 
      role: user.role, 
      businessId: user.businessId,
      branchId: user.branchId, 
      permissions: user.permissions || {}, 
      image: user.image || '', 
    });
    setIsPermissionsModalOpen(true);
    setOpenDropdownId(null);
  };

  const handleToggleStatus = async (user: SystemUser, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }),
      });
      mutate();
      toast.success(`Acceso ${!user.isActive ? 'restaurado' : 'revocado'} para ${user.name}`);
    } catch (e) { toast.error('Error al cambiar estado'); }
    finally { setOpenDropdownId(null); }
  };

  const handleDelete = async (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('¿Eliminar definitivamente a este usuario del sistema?')) return setOpenDropdownId(null);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Usuario eliminado');
      mutate();
    } catch (e) { toast.error('Error. El dueño principal no se puede borrar por aquí.'); }
    finally { setOpenDropdownId(null); }
  };

  return (
    <div className="flex flex-col h-full w-full animate-in fade-in duration-300 gap-5">
      
      {/* 🚀 TOOLBAR SUPERIOR ULTRA-LIMPIA Y ELEGANTE */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        
        <h1 className="text-[26px] font-black text-slate-900 tracking-tight shrink-0">Personal</h1>
        
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          
          {/* BUSCADOR ANIMADO EXPANDIBLE */}
          <div className="relative flex items-center justify-end group transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] w-8 hover:w-[260px] focus-within:w-[260px] h-10 overflow-hidden">
            <div className="absolute right-0 w-8 h-full flex items-center justify-center pointer-events-none z-10">
              <Search className="w-5 h-5 text-slate-900 group-hover:text-slate-400 focus-within:text-slate-400 transition-colors" strokeWidth={3} />
            </div>
            <Input 
              placeholder="Buscar por nombre o correo..." 
              value={searchTerm} 
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }} 
              className="w-full h-full pr-10 pl-4 bg-white border border-slate-200 shadow-sm focus-visible:ring-1 focus-visible:ring-slate-300 rounded-full opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0 focus-within:translate-x-0 text-sm" 
            />
          </div>

          <Button onClick={handleOpenNew} className="h-10 text-sm bg-slate-900 hover:bg-slate-800 text-white px-5 shadow-md rounded-full transition-all shrink-0">
            <Plus className="w-4 h-4 mr-1.5" /> <span className="font-bold">Nuevo Usuario</span>
          </Button>
        </div>
      </div>

      {/* 🚀 CONTENEDOR DE LA TABLA */}
      <div className="bg-white rounded-2xl shadow-sm flex flex-col flex-1 min-h-[400px] border-none overflow-hidden relative">
        
        {/* 🚀 SUBHEADER: TABS DE ROLES Y PAGINACIÓN */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-2.5 border-b border-slate-100 w-full bg-white shrink-0">
          
          <div className="flex items-center gap-1 overflow-x-auto hide-scrollbar w-full sm:w-auto flex-1">
            <button 
              onClick={() => {setRoleFilter('ALL'); setCurrentPage(1)}} 
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${roleFilter === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              Todos
            </button>
            
            <div className="w-px h-5 bg-slate-200 mx-2 shrink-0" />

            {availableRoles.includes('SUPER_ADMIN') && currentUserRole === 'SUPER_ADMIN' && (
              <button onClick={() => {setRoleFilter('SUPER_ADMIN'); setCurrentPage(1)}} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${roleFilter === 'SUPER_ADMIN' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                Ingenieros TI
              </button>
            )}
            {availableRoles.includes('OWNER') && (
              <button onClick={() => {setRoleFilter('OWNER'); setCurrentPage(1)}} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${roleFilter === 'OWNER' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                Dueños
              </button>
            )}
            {availableRoles.includes('MANAGER') && (
              <button onClick={() => {setRoleFilter('MANAGER'); setCurrentPage(1)}} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${roleFilter === 'MANAGER' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                Jefes de Tienda
              </button>
            )}
            {availableRoles.includes('CASHIER') && (
              <button onClick={() => {setRoleFilter('CASHIER'); setCurrentPage(1)}} className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${roleFilter === 'CASHIER' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}>
                Cajeros
              </button>
            )}
          </div>

          {/* Paginación a la derecha */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 shrink-0 py-1 pl-2 sm:border-l sm:border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider hidden sm:inline-block">
                Pág {currentPage} de {totalPages}
              </span>
              <div className="flex gap-1.5">
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" className="h-7 w-7 p-0 bg-white border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg shadow-sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* 🚀 TABLA PRINCIPAL */}
        <div className="overflow-x-auto flex-1 relative custom-scrollbar">
          
          {showStatusFilter && (
            <div className="fixed inset-0 z-20" onClick={() => setShowStatusFilter(false)} />
          )}

          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead className="bg-white border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-30 shadow-sm">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Usuario y Contacto</th>
                <th className="px-5 py-3.5 font-semibold">Rol Asignado</th>
                <th className="px-5 py-3.5 font-semibold">Sucursal / Empresa</th>
                
                {/* ESTADO CON FILTRO INCORPORADO */}
                <th className="px-5 py-3.5 font-semibold relative select-none w-[160px]">
                  <div 
                    className={`inline-flex items-center gap-1.5 cursor-pointer hover:text-slate-700 px-2 py-1 -ml-2 rounded-md transition-colors ${statusFilter !== 'ALL' || showStatusFilter ? 'text-slate-900 bg-slate-100' : ''}`}
                    onClick={() => setShowStatusFilter(!showStatusFilter)}
                  >
                    Estado <Filter className={`w-3.5 h-3.5 ${statusFilter !== 'ALL' ? 'text-slate-900 fill-slate-900' : ''}`} />
                  </div>

                  {showStatusFilter && (
                    <div className="absolute top-10 left-3 w-[160px] bg-white border border-slate-200 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] rounded-xl p-1.5 z-50 flex flex-col gap-0.5 animate-in fade-in zoom-in-95 duration-100">
                      <button onClick={() => {setStatusFilter('ALL'); setShowStatusFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${statusFilter === 'ALL' ? 'bg-slate-100 text-slate-900' : 'text-slate-600 hover:bg-slate-50'}`}>
                        Todos {statusFilter === 'ALL' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => {setStatusFilter('ACTIVE'); setShowStatusFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${statusFilter === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'text-emerald-600 hover:bg-emerald-50/50'}`}>
                        Activos {statusFilter === 'ACTIVE' && <Check className="w-3.5 h-3.5" />}
                      </button>
                      <button onClick={() => {setStatusFilter('INACTIVE'); setShowStatusFilter(false); setCurrentPage(1);}} className={`text-left px-3 py-2 rounded-lg text-xs font-bold w-full transition-colors flex items-center justify-between ${statusFilter === 'INACTIVE' ? 'bg-red-50 text-red-700' : 'text-red-600 hover:bg-red-50/50'}`}>
                        Suspendidos {statusFilter === 'INACTIVE' && <Check className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </th>
                <th className="px-5 py-3.5 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50/80">
              {isLoading ? ( Array(5).fill(0).map((_, i) => (<tr key={i}><td colSpan={5} className="p-4"><Skeleton className="h-10 w-full rounded-xl" /></td></tr>)) ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400 space-y-2">
                      <UserCog className="w-10 h-10 text-slate-200" strokeWidth={1} />
                      <p className="font-medium text-sm text-slate-500">No se encontraron usuarios.</p>
                      <Button variant="link" className="text-xs h-6 text-slate-900 font-bold" onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }}>Limpiar filtros</Button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u: SystemUser) => {
                  const isDropdownOpen = openDropdownId === u.id;
                  
                  // 🚀 Buscamos la data completa de la sucursal para este usuario
                  const userBranchData = getBranchById(u.branchId);

                  return (
                    <tr 
                      key={u.id} 
                      onClick={() => handleOpenBasicEdit(u)}
                      className={`hover:bg-slate-50 transition-colors group text-xs cursor-pointer ${!u.isActive ? 'opacity-60 bg-slate-50/50' : ''}`}
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full overflow-hidden flex items-center justify-center font-black text-lg text-white shadow-inner shrink-0 ${u.isActive ? 'bg-slate-800' : 'bg-slate-400 grayscale'}`}>
                            {u.image ? (
                              <img src={u.image} alt={u.name || 'User'} className="w-full h-full object-cover" />
                            ) : (
                              u.name ? u.name.charAt(0).toUpperCase() : 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-700 truncate leading-tight group-hover:text-slate-900 transition-colors text-sm">{u.name}</p>
                            <p className="text-[11px] text-slate-500 truncate leading-tight mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded-md border border-slate-200 uppercase tracking-wide">
                          {ROLE_LABELS[u.role] || u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {/* 🚀 FIX: Logo visual para sucursales (Idéntico a Productos) */}
                        {userBranchData ? (
                          <span className="text-[10px] font-bold text-slate-700 flex items-center gap-1.5 bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200 w-max leading-none">
                            {userBranchData.logoUrl ? (
                              <img src={userBranchData.logoUrl} className="w-3.5 h-3.5 rounded-[2px] object-cover bg-white" alt=""/>
                            ) : (
                              <Store className="w-3 h-3 text-slate-500" />
                            )}
                            {userBranchData.name}
                          </span>
                        ) : u.business ? (
                          <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 bg-slate-50 px-1.5 py-0.5 rounded-md border border-slate-200 w-max leading-none">
                            <Building className="w-3 h-3 text-slate-400" /> {u.business.name}
                          </span>
                        ) : (
                          <span className="text-[10px] italic text-slate-400">Sin Asignar</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {u.isActive ? (
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[9px] px-1.5 py-0 h-4 font-bold shadow-none">ACTIVO</Badge>
                        ) : (
                          <Badge variant="destructive" className="bg-red-50 text-red-700 border-none hover:bg-red-100 text-[9px] px-1.5 py-0 h-4 shadow-none font-bold">SUSPENDIDO</Badge>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          {/* New differentiated action buttons */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:bg-blue-100 hover:text-blue-700 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100" 
                            onClick={(e) => handleOpenBasicEdit(u, e)}
                            title="Editar Datos Básicos"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:bg-purple-100 hover:text-purple-700 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100" 
                            onClick={(e) => handleOpenPermissions(u, e)}
                            title="Gestionar Permisos"
                          >
                            <Shield className="w-4 h-4" />
                          </Button>

                          {/* Legacy edit button for compatibility */}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors opacity-100 lg:opacity-0 lg:group-hover:opacity-100" 
                            onClick={(e) => handleOpenEdit(u, e)}
                            title="Editar (Completo)"
                          >
                            <UserCog className="w-4 h-4" />
                          </Button>
                          
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(isDropdownOpen ? null : u.id); }}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>

                          {/* Menú de Opciones Flotante */}
                          {isDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setOpenDropdownId(null); }} />
                              <div className="absolute right-8 top-10 mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-in fade-in zoom-in-95">
                                <button onClick={(e) => handleToggleStatus(u, e)} className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 font-bold transition-colors">
                                  <PowerOff className={`w-4 h-4 shrink-0 ${u.isActive ? 'text-amber-500' : 'text-emerald-500'}`} /> {u.isActive ? 'Suspender Acceso' : 'Restaurar Acceso'}
                                </button>
                                <div className="h-px bg-slate-100 my-1 mx-2" />
                                <button onClick={(e) => handleDelete(u.id, e)} className="w-full text-left px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 font-bold transition-colors">
                                  <Trash2 className="w-4 h-4 shrink-0" /> Eliminar Usuario
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} userToEdit={selectedUser} />
      <BasicUserModal isOpen={isBasicModalOpen} onClose={() => setIsBasicModalOpen(false)} onSuccess={() => mutate()} userToEdit={selectedUser} />
      {selectedUser && (
        <PermissionsManager 
          isOpen={isPermissionsModalOpen} 
          onClose={() => setIsPermissionsModalOpen(false)} 
          onSuccess={() => mutate()} 
          userToEdit={selectedUser} 
        />
      )}
    </div>
  );
}