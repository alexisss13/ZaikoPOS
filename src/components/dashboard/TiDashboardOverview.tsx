'use client';

import useSWR from 'swr';
import { 
  Building02Icon, Store01Icon, UserMultiple02Icon, PackageIcon, Alert01Icon, CancelCircleIcon, SecurityCheckIcon, Activity01Icon
} from 'hugeicons-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const fetcher = (url: string) => fetch(url).then(r => r.json());

// 🚀 FIX: Declaramos las interfaces exactas de lo que trae nuestra API
interface RecentBusiness {
  id: string;
  name: string;
  ruc: string;
  _count: {
    branches: number;
    users: number;
  };
}

interface RecentLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  business?: { name: string } | null;
  user?: { name: string | null } | null;
}

interface TiDashboardData {
  metrics: {
    totalBusinesses: number;
    totalBranches: number;
    totalUsers: number;
    totalProducts: number;
  };
  recentBusinesses: RecentBusiness[];
  recentLogs: RecentLog[];
}

const SEVERITY_CONFIG: Record<string, { color: string; bg: string; icon: React.ElementType; label: string }> = {
  SYSTEM_ERROR: { color: 'text-red-600', bg: 'bg-red-50', icon: CancelCircleIcon, label: 'Error de Sistema' },
  DELETE_USER: { color: 'text-red-600', bg: 'bg-red-50', icon: CancelCircleIcon, label: 'Usuario Borrado' },
  VOID_SALE: { color: 'text-orange-600', bg: 'bg-orange-50', icon: Alert01Icon, label: 'Venta Anulada' },
};

export default function TiDashboardOverview() {
  // 🚀 Pasamos la interfaz TiDashboardData a useSWR
  const { data, isLoading } = useSWR<TiDashboardData>('/api/dashboard/ti', fetcher, { refreshInterval: 60000 }); // Autorefresh cada 60s

  if (isLoading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-slate-900">Resumen Global SaaS</h2>
        <p className="text-sm text-slate-500">Métricas en tiempo real de todos tus inquilinos.</p>
      </div>

      {/* 🚀 TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Empresas Activas</p>
                <h3 className="text-3xl font-bold text-slate-900">{data?.metrics.totalBusinesses || 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <Building02Icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Total Sucursales</p>
                <h3 className="text-3xl font-bold text-slate-900">{data?.metrics.totalBranches || 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Store01Icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Usuarios del Sistema</p>
                <h3 className="text-3xl font-bold text-slate-900">{data?.metrics.totalUsers || 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                <UserMultiple02Icon className="w-6 h-6" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">Volumen de Catálogo</p>
                <h3 className="text-3xl font-bold text-slate-900">{data?.metrics.totalProducts || 0}</h3>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                <PackageIcon className="w-6 h-6" strokeWidth={1.5} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 🚀 DOS COLUMNAS DE INFORMACIÓN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CLIENTES RECIENTES */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <Activity01Icon className="w-5 h-5 text-indigo-500" strokeWidth={1.5} /> Últimos Inquilinos (SaaS)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data?.recentBusinesses.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No hay empresas registradas aún.</div>
              ) : (
                data?.recentBusinesses.map((biz: RecentBusiness) => (
                  <div key={biz.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900 text-sm">{biz.name}</p>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">RUC: {biz.ruc}</p>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 text-[10px]">
                        {biz._count.branches} Sucursales
                      </Badge>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-600 text-[10px]">
                        {biz._count.users} Usuarios
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* RADAR DE ALERTAS */}
        <Card className="border-none shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
              <SecurityCheckIcon className="w-5 h-5 text-red-500" strokeWidth={1.5} /> Radar de Alertas (Últimas)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {data?.recentLogs.length === 0 ? (
                <div className="p-12 text-center flex flex-col items-center justify-center">
                  <SecurityCheckIcon className="w-10 h-10 text-emerald-400 mb-2" strokeWidth={1.5} />
                  <p className="text-slate-500 text-sm font-medium">El sistema está limpio.</p>
                  <p className="text-xs text-slate-400">No hay alertas críticas ni advertencias recientes.</p>
                </div>
              ) : (
                data?.recentLogs.map((log: RecentLog) => {
                  const config = SEVERITY_CONFIG[log.action] || { color: 'text-slate-500', bg: 'bg-slate-100', icon: SecurityCheckIcon, label: 'Alerta' };
                  const Icon = config.icon;
                  return (
                    <div key={log.id} className="p-4 flex gap-4 hover:bg-slate-50 transition-colors">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${config.bg} ${config.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <p className={`text-xs font-bold ${config.color}`}>{config.label}</p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {new Date(log.createdAt).toLocaleDateString('es-PE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <p className="text-sm text-slate-700 truncate mb-1">{log.details}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {log.business?.name || 'Sistema'} • {log.user?.name || 'Automático'}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}