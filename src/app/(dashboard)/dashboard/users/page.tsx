'use client';

import useSWR from 'swr';
import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, MoreVertical, Search, ChevronLeft, ChevronRight, UserCog, PowerOff, Trash2, Building, Filter, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { UserModal, UserData } from '@/components/dashboard/UserModal';
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

const ITEMS_PER_PAGE = 8; 

const ROLE_LABELS: Record<string, string> = {
  SUPER_ADMIN: 'Ingeniero TI',
  OWNER: 'Dueño',
  MANAGER: 'Jefe Tienda',
  CASHIER: 'Cajero'
};

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-700 border-purple-200',
  OWNER: 'bg-blue-100 text-blue-700 border-blue-200',
  MANAGER: 'bg-amber-100 text-amber-700 border-amber-200',
  CASHIER: 'bg-slate-100 text-slate-700 border-slate-200'
};

const POS_ROLES = ['SUPER_ADMIN', 'OWNER', 'MANAGER', 'CASHIER'];

export default function UsersPage() {
  const { role: currentUserRole, userId: currentUserId } = useAuth();
  const { data: users, isLoading, mutate } = useSWR<SystemUser[]>('/api/users', fetcher);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // 1. Primero filtramos usuarios base (excluyendo a uno mismo)
  const baseUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => user.id !== currentUserId && POS_ROLES.includes(user.role));
  }, [users, currentUserId]);

  // 2. Extraemos qué roles realmente existen en la lista para mostrar u ocultar botones
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

  const handleOpenNew = () => { setSelectedUser(null); setIsModalOpen(true); };
  
  const handleOpenEdit = (user: SystemUser) => {
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

  const handleToggleStatus = async (user: SystemUser) => {
    try {
      await fetch(`/api/users/${user.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: !user.isActive }),
      });
      mutate();
      toast.success(`Acceso ${!user.isActive ? 'restaurado' : 'revocado'} para ${user.name}`);
    } catch (e) { toast.error('Error al cambiar estado'); }
    finally { setOpenDropdownId(null); }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm('¿Eliminar definitivamente a este usuario del sistema?')) return setOpenDropdownId(null);
    try {
      const res = await fetch(`/api/users/${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      toast.success('Usuario eliminado');
      mutate();
    } catch (e) { toast.error('Error. El dueño principal no se puede borrar por aquí.'); }
    finally { setOpenDropdownId(null); }
  };

  const baseTabClass = "px-4 py-1.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2 cursor-pointer";
  const activeTabClass = "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/50";
  const inactiveTabClass = "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50";

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando directorio de personal...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full pb-20">
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2"><UserCog className="w-6 h-6 text-primary" /> Personal del Sistema</h1>
          <p className="text-slate-500 text-sm mt-1">Gestiona los accesos y roles de tu equipo de trabajo.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 shadow-md w-full sm:w-auto shrink-0">
          <Plus className="w-4 h-4" /> Registrar Usuario
        </Button>
      </div>

      <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre o correo..." 
              className="pl-9 bg-slate-50/50 h-10 border-slate-200 focus-visible:bg-white transition-colors focus-visible:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px] shrink-0 bg-slate-50/50 h-10 focus-visible:ring-blue-500">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL" className="font-bold">Todos los estados</SelectItem>
              <SelectItem value="ACTIVE" className="text-emerald-600 font-bold">Activos</SelectItem>
              <SelectItem value="INACTIVE" className="text-red-600 font-bold">Suspendidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 🚀 FIX: Los botones solo se renderizan si existe personal con ese rol (Y siempre sale el "Todos") */}
        <div className="flex items-center overflow-x-auto hide-scrollbar pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1 bg-slate-100/70 p-1 rounded-lg border border-slate-200/60 w-max">
            <button onClick={() => setRoleFilter('ALL')} className={`${baseTabClass} ${roleFilter === 'ALL' ? activeTabClass : inactiveTabClass}`}>Todos</button>
            {availableRoles.includes('SUPER_ADMIN') && currentUserRole === 'SUPER_ADMIN' && <button onClick={() => setRoleFilter('SUPER_ADMIN')} className={`${baseTabClass} ${roleFilter === 'SUPER_ADMIN' ? activeTabClass : inactiveTabClass}`}>Ingenieros TI</button>}
            {availableRoles.includes('OWNER') && <button onClick={() => setRoleFilter('OWNER')} className={`${baseTabClass} ${roleFilter === 'OWNER' ? activeTabClass : inactiveTabClass}`}>Dueños</button>}
            {availableRoles.includes('MANAGER') && <button onClick={() => setRoleFilter('MANAGER')} className={`${baseTabClass} ${roleFilter === 'MANAGER' ? activeTabClass : inactiveTabClass}`}>Jefes Tienda</button>}
            {availableRoles.includes('CASHIER') && <button onClick={() => setRoleFilter('CASHIER')} className={`${baseTabClass} ${roleFilter === 'CASHIER' ? activeTabClass : inactiveTabClass}`}>Cajeros</button>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
        {paginatedUsers.length === 0 ? (
          <div className="col-span-full text-center py-16 bg-white border border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <UserCog className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">No se encontraron usuarios</h3>
            <p className="text-sm text-slate-500 mb-4">Intenta cambiando los filtros de búsqueda.</p>
            <Button variant="link" onClick={() => { setSearchTerm(''); setRoleFilter('ALL'); setStatusFilter('ALL'); }} className="text-blue-600">
              Limpiar filtros
            </Button>
          </div>
        ) : (
          paginatedUsers.map((user: SystemUser) => {
            const isDropdownOpen = openDropdownId === user.id;

            return (
              <Card key={user.id} className={`transition-all relative border-slate-200 ${!user.isActive ? 'opacity-70 bg-slate-50' : 'hover:shadow-md'} ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                <CardContent className="p-4 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  
                  <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                    <div className="relative shrink-0">
                      <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-black text-lg text-white shadow-inner ${user.isActive ? 'bg-blue-600' : 'bg-slate-400'}`}>
                        {user.image ? (
                          <img src={user.image} alt={user.name || 'Usuario'} className="w-full h-full object-cover" />
                        ) : (
                          user.name ? user.name.charAt(0).toUpperCase() : 'U'
                        )}
                      </div>
                      {!user.isActive && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full shadow-sm"></span>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="font-bold text-slate-900 truncate text-base leading-tight">{user.name}</p>
                        {!user.isActive && <Badge variant="destructive" className="text-[9px] py-0 h-4">SUSPENDIDO</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 truncate leading-snug">{user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0 pl-16 md:pl-0 border-t border-slate-100 md:border-t-0 pt-3 md:pt-0">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {currentUserRole === 'SUPER_ADMIN' && user.business && (
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 max-w-[120px]" title={user.business.name}>
                          <Building className="w-3 h-3 text-slate-400 shrink-0" /> 
                          <span className="truncate font-medium">{user.business.name}</span>
                        </div>
                      )}
                      
                      {user.branch && (
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 max-w-[120px]" title={user.branch.name}>
                          <Store className="w-3 h-3 text-slate-400 shrink-0" /> 
                          <span className="truncate font-medium">{user.branch.name}</span>
                        </div>
                      )}
                      
                      <Badge variant="outline" className={`${ROLE_COLORS[user.role] || ROLE_COLORS.CASHIER} shrink-0 text-[10px] sm:text-xs px-2.5 py-0.5 uppercase font-bold`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </div>

                    <div className="flex items-center ml-auto shrink-0 border-l border-slate-200 pl-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" onClick={() => handleOpenEdit(user)}>
                        <UserCog className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition-colors" onClick={() => setOpenDropdownId(isDropdownOpen ? null : user.id)}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {isDropdownOpen && (
                        <div className="absolute right-4 top-full mt-1 w-44 bg-white border border-slate-200 rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                          <button onClick={() => handleToggleStatus(user)} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2 font-medium transition-colors">
                            <PowerOff className={`w-4 h-4 shrink-0 ${user.isActive ? 'text-orange-500' : 'text-emerald-500'}`} /> {user.isActive ? 'Suspender Acceso' : 'Restaurar Acceso'}
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t border-slate-100 font-medium transition-colors">
                            <Trash2 className="w-4 h-4 shrink-0" /> Eliminar Usuario
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm mt-6">
          <p className="text-sm text-slate-500">Pág. <span className="font-bold text-slate-900">{currentPage}</span> de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="hover:bg-slate-50"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} userToEdit={selectedUser} />
      {openDropdownId && <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />}
    </div>
  );
}