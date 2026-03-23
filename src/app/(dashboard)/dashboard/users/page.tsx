'use client';

import useSWR from 'swr';
import { useState, useMemo, useEffect } from 'react';
import { 
  Plus, MoreVertical, 
  Search, ChevronLeft, ChevronRight, 
  UserCog, PowerOff, Trash2, Building, Filter
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
  business?: { name: string } | null;
}

const ITEMS_PER_PAGE = 2;

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
  const { role: currentUserRole } = useAuth();
  const { data: users, isLoading, mutate } = useSWR<SystemUser[]>('/api/users', fetcher);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(user => {
      if (!POS_ROLES.includes(user.role)) return false;
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (user.name?.toLowerCase().includes(searchLower) || user.email?.toLowerCase().includes(searchLower));
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || (statusFilter === 'ACTIVE' && user.isActive) || (statusFilter === 'INACTIVE' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

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
      businessId: user.businessId
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

  if (isLoading) return <div className="p-8 text-center text-slate-500">Cargando directorio de personal...</div>;

  return (
    <div className="space-y-6">
      
      {/* CABECERA */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personal del Sistema</h1>
          <p className="text-slate-500 text-sm">Gestiona los accesos y roles de tu equipo de trabajo.</p>
        </div>
        <Button onClick={handleOpenNew} className="gap-2 shadow-md w-full sm:w-auto shrink-0">
          <Plus className="w-4 h-4" /> Registrar Usuario
        </Button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Buscar por nombre o correo..." 
              className="pl-9 bg-slate-50 border-slate-200"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px] shrink-0 bg-slate-50">
              <Filter className="w-4 h-4 mr-2 text-slate-400" />
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Todos</SelectItem>
              <SelectItem value="ACTIVE">Activos</SelectItem>
              <SelectItem value="INACTIVE">Suspendidos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 hide-scrollbar">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-2 shrink-0">Filtro Rápido:</span>
          <Button variant={roleFilter === 'ALL' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 shrink-0 text-xs transition-colors" onClick={() => setRoleFilter('ALL')}>Todos</Button>
          {currentUserRole === 'SUPER_ADMIN' && (
            <Button variant={roleFilter === 'SUPER_ADMIN' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 shrink-0 text-xs transition-colors" onClick={() => setRoleFilter('SUPER_ADMIN')}>Ingenieros TI</Button>
          )}
          <Button variant={roleFilter === 'OWNER' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 shrink-0 text-xs transition-colors" onClick={() => setRoleFilter('OWNER')}>Dueños</Button>
          <Button variant={roleFilter === 'MANAGER' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 shrink-0 text-xs transition-colors" onClick={() => setRoleFilter('MANAGER')}>Jefes Tienda</Button>
          <Button variant={roleFilter === 'CASHIER' ? 'default' : 'outline'} size="sm" className="rounded-full h-8 shrink-0 text-xs transition-colors" onClick={() => setRoleFilter('CASHIER')}>Cajeros</Button>
        </div>
      </div>

      {/* LISTA DE USUARIOS */}
      <div className="grid grid-cols-1 gap-3">
        {paginatedUsers.length === 0 ? (
          <div className="text-center py-12 bg-white border border-dashed rounded-xl">
            <UserCog className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No se encontraron usuarios</p>
          </div>
        ) : (
          paginatedUsers.map((user: SystemUser) => {
            const isDropdownOpen = openDropdownId === user.id;

            return (
              <Card key={user.id} className={`transition-all relative ${!user.isActive ? 'opacity-70 bg-slate-50' : 'hover:shadow-sm'} ${isDropdownOpen ? 'z-50' : 'z-10'}`}>
                <CardContent className="p-3 sm:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 sm:gap-4">
                  
                  {/* Avatar y Datos Base */}
                  <div className="flex items-center gap-3 flex-1 min-w-0 w-full">
                    <div className="relative">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold text-lg text-white shadow-sm shrink-0 ${user.isActive ? 'bg-primary' : 'bg-slate-400'}`}>
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      {!user.isActive && (
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full"></span>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-slate-900 truncate text-sm sm:text-base leading-tight">
                        {user.name}
                      </p>
                      <p className="text-xs sm:text-sm text-slate-500 truncate leading-snug">{user.email}</p>
                    </div>
                  </div>

                  {/* Etiquetas (Rol y Negocio) + Botones */}
                  <div className="flex items-center justify-between md:justify-end gap-2 w-full md:w-auto mt-1 md:mt-0 pl-13 md:pl-0 border-t md:border-t-0 pt-3 md:pt-0">
                    
                    <div className="flex items-center gap-2 overflow-hidden">
                      {/* Ocultamos el negocio en celulares (solo se ve en sm o superior) */}
                      {currentUserRole === 'SUPER_ADMIN' && user.business && (
                        <div className="hidden sm:flex items-center gap-1 text-[10px] text-slate-600 bg-slate-100 px-2 py-1 rounded border max-w-[120px]">
                          <Building className="w-3 h-3 text-slate-400 shrink-0" /> 
                          <span className="truncate">{user.business.name}</span>
                        </div>
                      )}
                      
                      <Badge variant="outline" className={`${ROLE_COLORS[user.role] || ROLE_COLORS.CASHIER} shrink-0 text-[10px] sm:text-xs px-2 py-0.5`}>
                        {ROLE_LABELS[user.role] || user.role}
                      </Badge>
                    </div>

                    <div className="flex items-center ml-auto shrink-0 border-l border-slate-200 pl-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => handleOpenEdit(user)}>
                        <UserCog className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500" onClick={() => setOpenDropdownId(isDropdownOpen ? null : user.id)}>
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                      
                      {isDropdownOpen && (
                        <div className="absolute right-4 top-full mt-1 w-44 bg-white border rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                          <button onClick={() => handleToggleStatus(user)} className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-100 flex items-center gap-2 font-medium">
                            <PowerOff className={`w-4 h-4 shrink-0 ${user.isActive ? 'text-orange-500' : 'text-emerald-500'}`} /> {user.isActive ? 'Bloquear' : 'Permitir'}
                          </button>
                          <button onClick={() => handleDelete(user.id)} className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 border-t font-medium">
                            <Trash2 className="w-4 h-4 shrink-0" /> Eliminar
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
        <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl border shadow-sm">
          <p className="text-xs sm:text-sm text-slate-500">Pág. {currentPage} de {totalPages}</p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      <UserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSuccess={() => mutate()} userToEdit={selectedUser} />
      {openDropdownId && <div className="fixed inset-0 z-40" onClick={() => setOpenDropdownId(null)} />}
    </div>
  );
}