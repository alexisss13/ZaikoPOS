'use client';

import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, ShoppingCart, AlertTriangle, TrendingUp, Loader2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function DashboardPage() {
  const { data, isLoading, error } = useSWR('/api/reports/stats', fetcher);

  if (isLoading) {
    return (
        <div className="h-full flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
    );
  }

  // 1. EXTRAER DATOS DE FORMA EXTREMADAMENTE SEGURA
  // Si algo viene undefined o falla la API, cae en el fallback (0 o [])
  const amount = data?.today?.amount ?? 0;
  const count = data?.today?.count ?? 0;
  const lowStock = data?.lowStock ?? 0;
  const chartData = Array.isArray(data?.chart) ? data.chart : [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h2>
        <p className="text-muted-foreground">Resumen de operaciones de tu negocio.</p>
        
        {/* Opcional: Mostrar si la API falló para que sepas por qué está todo en cero */}
        {error && <p className="text-red-500 text-sm mt-2">Error cargando datos. Mostrando valores por defecto.</p>}
      </div>

      {/* CARDS KPI */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ventas Hoy</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">S/ {amount.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              +10% vs ayer (Mock)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Transacciones</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{count}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tickets emitidos hoy
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stock Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{lowStock}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Productos con stock &lt; 5
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Ticket Promedio</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
                S/ {count > 0 ? (amount / count).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Promedio por venta
            </p>
          </CardContent>
        </Card>
      </div>

      {/* CHART */}
      <Card className="col-span-4">
        <CardHeader>
          <CardTitle>Resumen Semanal</CardTitle>
        </CardHeader>
        <CardContent className="pl-2">
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            stroke="#888888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                        />
                        <YAxis 
                            stroke="#888888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false}
                            tickFormatter={(value) => `S/ ${value}`}
                        />
                        <Tooltip 
                            cursor={{ fill: '#f4f4f5' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar 
                            dataKey="total" 
                            fill="#0f172a" 
                            radius={[4, 4, 0, 0]} 
                            barSize={40}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}