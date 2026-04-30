'use client';

import { useState, useEffect } from 'react';
import { 
  UserAccountIcon, 
  ArrowUp01Icon, 
  ArrowDown01Icon,
  DollarCircleIcon,
  Alert01Icon,
  Clock01Icon
} from 'hugeicons-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface CashSessionsReportCardProps {
  dateRange: {
    startDate: string;
    endDate: string;
  };
  branchId: string;
  userId: string;
}

interface CashSessionsSummary {
  totalSessions: number;
  totalInitialCash: number;
  totalFinalCash: number;
  totalIncome: number;
  totalExpense: number;
  totalDifference: number;
  averageDifference: number;
  averageHours: number;
  sessionsWithDiscrepancies: number;
  discrepancyRate: number;
}

interface ChartData {
  date: string;
  sessions: number;
  income: number;
  expense: number;
  difference: number;
}

export function CashSessionsReportCard({ dateRange, branchId, userId }: CashSessionsReportCardProps) {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<CashSessionsSummary | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [reportType, setReportType] = useState('summary');
  const [detailedData, setDetailedData] = useState<any>(null);

  useEffect(() => {
    fetchCashSessionsReport();
  }, [dateRange, branchId, userId, reportType]);

  const fetchCashSessionsReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        branchId,
        userId,
        type: reportType
      });

      const res = await fetch(`/api/reports/cash-sessions?${params}`);
      if (!res.ok) throw new Error('Error al cargar reporte');

      const data = await res.json();
      
      if (reportType === 'summary') {
        setSummary(data.summary);
        setChartData(data.chartData || []);
      } else {
        setDetailedData(data);
      }
    } catch (error) {
      console.error('Error al cargar reporte de cortes de turno:', error);
      toast.error('Error al cargar reporte de cortes de turno');
    } finally {
      setLoading(false);
    }
  };

  const reportTypes = [
    { id: 'summary', label: 'Resumen' },
    { id: 'detailed', label: 'Detallado' },
    { id: 'by-user', label: 'Por Usuario' },
    { id: 'by-branch', label: 'Por Sucursal' },
    { id: 'discrepancies', label: 'Discrepancias' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: 'PEN'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-PE').format(num);
  };

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-500">Cargando reporte de cortes de turno...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Report Type Selector */}
      <div className="flex flex-wrap gap-2">
        {reportTypes.map((type) => (
          <Button
            key={type.id}
            onClick={() => setReportType(type.id)}
            variant={reportType === type.id ? "default" : "outline"}
            size="sm"
            className="h-8 text-xs"
          >
            {type.label}
          </Button>
        ))}
      </div>

      {/* Summary View */}
      {reportType === 'summary' && summary && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 rounded-xl">
                  <UserAccountIcon className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Total Sesiones</p>
                  <p className="text-lg font-black text-slate-900">{formatNumber(summary.totalSessions)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 rounded-xl">
                  <ArrowUp01Icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Ingresos Totales</p>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(summary.totalIncome)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 rounded-xl">
                  <ArrowDown01Icon className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Gastos Totales</p>
                  <p className="text-lg font-black text-slate-900">{formatCurrency(summary.totalExpense)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-4 border border-slate-200">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-yellow-100 rounded-xl">
                  <Alert01Icon className="w-4 h-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Con Discrepancias</p>
                  <p className="text-lg font-black text-yellow-600">{formatNumber(summary.sessionsWithDiscrepancies)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
              <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-3">
                <DollarCircleIcon className="w-6 h-6 text-blue-600" />
              </div>
              <p className="text-sm text-slate-500 mb-1">Diferencia Total</p>
              <p className={`text-2xl font-black ${summary.totalDifference >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatCurrency(summary.totalDifference)}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Promedio: {formatCurrency(summary.averageDifference)}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
              <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-3">
                <Clock01Icon className="w-6 h-6 text-purple-600" />
              </div>
              <p className="text-sm text-slate-500 mb-1">Duración Promedio</p>
              <p className="text-2xl font-black text-slate-900">{formatHours(summary.averageHours)}</p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-slate-200 text-center">
              <div className="p-3 bg-red-100 rounded-xl w-fit mx-auto mb-3">
                <Alert01Icon className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-sm text-slate-500 mb-1">Tasa de Discrepancia</p>
              <p className="text-2xl font-black text-red-600">{summary.discrepancyRate.toFixed(1)}%</p>
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Tendencia de Sesiones</h3>
              <div className="h-64 flex items-end justify-between gap-2">
                {chartData.map((data, index) => {
                  const maxIncome = Math.max(...chartData.map(d => d.income));
                  const height = maxIncome > 0 ? (data.income / maxIncome) * 100 : 0;
                  
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div className="w-full bg-slate-100 rounded-t-lg relative" style={{ height: '200px' }}>
                        <div 
                          className="w-full bg-orange-500 rounded-t-lg absolute bottom-0 transition-all duration-500"
                          style={{ height: `${height}%` }}
                        />
                      </div>
                      <div className="mt-2 text-center">
                        <p className="text-xs font-bold text-slate-900">{data.sessions}</p>
                        <p className="text-xs text-slate-500">{new Date(data.date).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}

      {/* Detailed Views */}
      {reportType !== 'summary' && detailedData && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">
              {reportTypes.find(t => t.id === reportType)?.label}
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            {reportType === 'detailed' && detailedData.sessions && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Usuario</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Sucursal</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Apertura</th>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Cierre</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Inicial</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Final</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ingresos</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Gastos</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Diferencia</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ventas</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.sessions.map((session: any) => (
                    <tr key={session.id} className={`border-b border-slate-100 ${session.hasDiscrepancy ? 'bg-yellow-50' : ''}`}>
                      <td className="p-4 text-sm text-slate-900">{session.user}</td>
                      <td className="p-4 text-sm text-slate-600">{session.branch}</td>
                      <td className="p-4 text-sm text-slate-600">
                        {new Date(session.openedAt).toLocaleString('es-PE')}
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {session.closedAt ? new Date(session.closedAt).toLocaleString('es-PE') : 'Abierta'}
                      </td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatCurrency(session.initialCash)}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatCurrency(session.finalCash)}</td>
                      <td className="p-4 text-sm text-emerald-600 text-right">{formatCurrency(session.income)}</td>
                      <td className="p-4 text-sm text-red-600 text-right">{formatCurrency(session.expense)}</td>
                      <td className={`p-4 text-sm text-right font-bold ${
                        session.difference >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(session.difference)}
                      </td>
                      <td className="p-4 text-sm text-slate-900 text-right">
                        {session.salesCount} ({formatCurrency(session.totalSales)})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'by-user' && detailedData.users && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Usuario</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Sesiones</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ingresos</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Gastos</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Diferencia</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Promedio</th>
                    <th className="text-center p-4 text-xs font-bold text-slate-700">Discrepancias</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.users.map((user: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{user.userName}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(user.totalSessions)}</td>
                      <td className="p-4 text-sm text-emerald-600 text-right">{formatCurrency(user.totalIncome)}</td>
                      <td className="p-4 text-sm text-red-600 text-right">{formatCurrency(user.totalExpense)}</td>
                      <td className={`p-4 text-sm text-right font-bold ${
                        user.totalDifference >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(user.totalDifference)}
                      </td>
                      <td className={`p-4 text-sm text-right ${
                        user.averageDifference >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(user.averageDifference)}
                      </td>
                      <td className="p-4 text-center">
                        {user.hasDiscrepancies && (
                          <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'by-branch' && detailedData.branches && (
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 text-xs font-bold text-slate-700">Sucursal</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Sesiones</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Ingresos</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Gastos</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Diferencia</th>
                    <th className="text-right p-4 text-xs font-bold text-slate-700">Promedio</th>
                    <th className="text-center p-4 text-xs font-bold text-slate-700">Discrepancias</th>
                  </tr>
                </thead>
                <tbody>
                  {detailedData.branches.map((branch: any, index: number) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-4 text-sm text-slate-900">{branch.branch.name}</td>
                      <td className="p-4 text-sm text-slate-900 text-right">{formatNumber(branch.totalSessions)}</td>
                      <td className="p-4 text-sm text-emerald-600 text-right">{formatCurrency(branch.totalIncome)}</td>
                      <td className="p-4 text-sm text-red-600 text-right">{formatCurrency(branch.totalExpense)}</td>
                      <td className={`p-4 text-sm text-right font-bold ${
                        branch.totalDifference >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(branch.totalDifference)}
                      </td>
                      <td className={`p-4 text-sm text-right ${
                        branch.averageDifference >= 0 ? 'text-emerald-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(branch.averageDifference)}
                      </td>
                      <td className="p-4 text-center">
                        {branch.hasDiscrepancies && (
                          <span className="inline-block w-3 h-3 bg-yellow-500 rounded-full"></span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {reportType === 'discrepancies' && detailedData.discrepancies && (
              <>
                <div className="p-6 bg-yellow-50 border-b border-yellow-200">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <p className="text-sm text-yellow-600">Total Discrepancias</p>
                      <p className="text-2xl font-black text-yellow-700">{detailedData.summary.totalDiscrepancies}</p>
                    </div>
                    <div>
                      <p className="text-sm text-yellow-600">Monto Total</p>
                      <p className="text-2xl font-black text-yellow-700">{formatCurrency(detailedData.summary.totalDiscrepancyAmount)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-emerald-600">Sobrantes</p>
                      <p className="text-2xl font-black text-emerald-700">{detailedData.summary.positiveDiscrepancies}</p>
                    </div>
                    <div>
                      <p className="text-sm text-red-600">Faltantes</p>
                      <p className="text-2xl font-black text-red-700">{detailedData.summary.negativeDiscrepancies}</p>
                    </div>
                  </div>
                </div>
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left p-4 text-xs font-bold text-slate-700">Usuario</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-700">Sucursal</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-700">Fecha</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-700">Tipo</th>
                      <th className="text-right p-4 text-xs font-bold text-slate-700">Esperado</th>
                      <th className="text-right p-4 text-xs font-bold text-slate-700">Real</th>
                      <th className="text-right p-4 text-xs font-bold text-slate-700">Diferencia</th>
                      <th className="text-left p-4 text-xs font-bold text-slate-700">Incidencias</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedData.discrepancies.map((discrepancy: any) => (
                      <tr key={discrepancy.id} className="border-b border-slate-100 bg-yellow-50">
                        <td className="p-4 text-sm text-slate-900">{discrepancy.user}</td>
                        <td className="p-4 text-sm text-slate-600">{discrepancy.branch}</td>
                        <td className="p-4 text-sm text-slate-600">
                          {new Date(discrepancy.openedAt).toLocaleDateString('es-PE')}
                        </td>
                        <td className="p-4 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            discrepancy.discrepancyType === 'SURPLUS' 
                              ? 'bg-emerald-100 text-emerald-700' 
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {discrepancy.discrepancyType === 'SURPLUS' ? 'Sobrante' : 'Faltante'}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-slate-900 text-right">{formatCurrency(discrepancy.expectedCash)}</td>
                        <td className="p-4 text-sm text-slate-900 text-right">{formatCurrency(discrepancy.actualCash)}</td>
                        <td className={`p-4 text-sm text-right font-bold ${
                          discrepancy.difference >= 0 ? 'text-emerald-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(Math.abs(discrepancy.difference))}
                        </td>
                        <td className="p-4 text-sm text-slate-600">{discrepancy.incidents || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}