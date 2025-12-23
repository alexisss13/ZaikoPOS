'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck } from 'lucide-react'; // 1. Quitamos 'Activity'
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// 2. Definimos el tipo de datos que viene de la API
interface AuditLogItem {
  id: string;
  createdAt: string;
  action: string;
  details: string | null;
  user: {
    name: string;
    role: string;
  } | null;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AuditPage() {
  // 3. Tipamos el retorno de SWR
  const { data: logs, isLoading } = useSWR<AuditLogItem[]>('/api/audit', fetcher);

  if (isLoading) {
    return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Auditoría</h2>
        <p className="text-muted-foreground">Registro de seguridad y acciones del sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Historial de Eventos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-slate-50">
                <tr>
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Acción</th>
                  <th className="px-4 py-3">Detalles</th>
                </tr>
              </thead>
              <tbody>
                {/* 4. Ahora 'log' tiene tipo AuditLogItem, adiós 'any' */}
                {logs?.map((log) => (
                  <tr key={log.id} className="bg-white border-b hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium whitespace-nowrap">
                      {format(new Date(log.createdAt), "d MMM yyyy, HH:mm", { locale: es })}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-semibold">{log.user?.name || 'Sistema'}</span>
                        <span className="text-[10px] text-muted-foreground">{log.user?.role}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate" title={log.details || ''}>
                      {log.details}
                    </td>
                  </tr>
                ))}
                {logs?.length === 0 && (
                    <tr>
                        <td colSpan={4} className="text-center py-8 text-muted-foreground">No hay registros aún</td>
                    </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    LOGIN: 'bg-blue-100 text-blue-700',
    CREATE_SALE: 'bg-green-100 text-green-700',
    CLOSE_CASH: 'bg-purple-100 text-purple-700',
    STOCK_CONFLICT: 'bg-red-100 text-red-700',
  };

  return (
    <Badge variant="outline" className={`border-0 ${styles[action] || 'bg-slate-100 text-slate-700'}`}>
      {action.replace('_', ' ')}
    </Badge>
  );
}