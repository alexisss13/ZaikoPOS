'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface CashSession {
  id: string;
  openedAt: string;
  closedAt: string | null;
  initialCash: number;
  finalCash: number | null;
  income: number;
  expense: number;
  difference: number | null;
  status: string;
  user: {
    name: string;
  };
  branch: {
    name: string;
  };
  sales: Array<{
    id: string;
    total: number;
    subtotal: number;
    discount: number;
    status: string;
    createdAt: string;
    items: Array<{
      productName: string;
      quantity: number;
      price: number;
      subtotal: number;
    }>;
    payments: Array<{
      method: string;
      amount: number;
    }>;
  }>;
  transactions?: Array<{
    type: string;
    amount: number;
  }>;
}

export function useCashSessionsLogic() {
  const { data: sessions, isLoading, mutate } = useSWR<CashSession[]>('/api/cash-sessions', fetcher);
  const { data: branches } = useSWR('/api/branches', fetcher);

  const [selectedSession, setSelectedSession] = useState<CashSession | null>(null);
  const [declaredCash, setDeclaredCash] = useState('');
  const [isClosing, setIsClosing] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');
  
  // Filtro de fecha: por defecto solo hoy
  const today = new Date().toISOString().split('T')[0];
  const [dateFrom, setDateFrom] = useState(today);
  const [dateTo, setDateTo] = useState(today);
  const [showAllHistory, setShowAllHistory] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const ITEMS_PER_PAGE = 10;

  const filteredSessions = useMemo(() => {
    if (!sessions) return [];
    
    return sessions.filter(session => {
      const matchesBranch = branchFilter === 'ALL' || session.branch.name === branchFilter;
      const matchesStatus = statusFilter === 'ALL' || session.status === statusFilter;
      
      let matchesDateFrom = true;
      let matchesDateTo = true;
      
      // Si showAllHistory es true, no filtrar por fecha
      if (!showAllHistory && (dateFrom || dateTo)) {
        const sessionDateStr = session.openedAt.split('T')[0];
        if (dateFrom) matchesDateFrom = sessionDateStr >= dateFrom;
        if (dateTo) matchesDateTo = sessionDateStr <= dateTo;
      }

      return matchesBranch && matchesStatus && matchesDateFrom && matchesDateTo;
    });
  }, [sessions, branchFilter, statusFilter, dateFrom, dateTo, showAllHistory]);

  const totalPages = Math.ceil(filteredSessions.length / ITEMS_PER_PAGE) || 1;
  const paginatedSessions = filteredSessions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getSessionStats = (session: CashSession) => {
    const completedSales = session.sales.filter(s => s.status === 'COMPLETED');
    
    const totalSales = completedSales.reduce((sum, s) => sum + Number(s.total), 0);
    const totalSubtotal = completedSales.reduce((sum, s) => sum + Number(s.subtotal), 0);
    const totalDiscount = completedSales.reduce((sum, s) => sum + Number(s.discount), 0);
    
    const igv = totalSales - totalSubtotal;
    const profitWithTax = totalSubtotal - totalDiscount;
    const profitWithoutTax = profitWithTax - igv;
    
    const categoryMap = new Map<string, { profit: number; total: number }>();
    completedSales.forEach(sale => {
      sale.items.forEach(item => {
        const category = 'Categoria 1';
        const current = categoryMap.get(category) || { profit: 0, total: 0 };
        const itemSubtotal = Number(item.subtotal);
        categoryMap.set(category, {
          profit: current.profit + itemSubtotal,
          total: current.total + itemSubtotal
        });
      });
    });

    const paymentMap = new Map<string, number>();
    completedSales.forEach(sale => {
      sale.payments.forEach(payment => {
        const current = paymentMap.get(payment.method) || 0;
        paymentMap.set(payment.method, current + Number(payment.amount));
      });
    });

    const transactions = session.transactions || [];
    const totalIncome = transactions
      .filter((t: any) => t.type === 'INCOME')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const totalExpense = transactions
      .filter((t: any) => t.type === 'EXPENSE')
      .reduce((sum: number, t: any) => sum + Number(t.amount), 0);

    const cashInSales = paymentMap.get('CASH') || 0;
    const totalInCash = Number(session.initialCash) + cashInSales + totalIncome - totalExpense;
    const declaredCashValue = session.finalCash !== null ? Number(session.finalCash) : totalInCash;
    const cashDifference = declaredCashValue - totalInCash;

    return {
      totalSales,
      igv,
      profitWithTax,
      profitWithoutTax,
      cashInSales,
      totalIncome,
      totalExpense,
      totalInCash,
      declaredCash: declaredCashValue,
      cashDifference,
      transactions,
      categories: Array.from(categoryMap.entries()).map(([name, data]) => ({
        name,
        profit: data.profit,
        total: data.total
      })),
      paymentMethods: paymentMap
    };
  };

  const getSessionNumber = (index: number) => {
    return filteredSessions ? filteredSessions.length - index : 0;
  };

  const handleCloseSession = async () => {
    if (!selectedSession) return;
    
    const finalCash = parseFloat(declaredCash);
    if (isNaN(finalCash) || finalCash < 0) {
      toast.error('Ingresa un monto válido');
      return;
    }

    setIsClosing(true);
    try {
      const res = await fetch(`/api/cash-sessions/${selectedSession.id}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalCash })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al cerrar turno');
      }

      toast.success('Turno cerrado correctamente');
      setDeclaredCash('');
      mutate();
      
      const updatedSession = await res.json();
      setSelectedSession(updatedSession);
    } catch (error: any) {
      toast.error(error.message || 'Error al cerrar el turno');
    } finally {
      setIsClosing(false);
    }
  };

  const clearFilters = () => {
    setBranchFilter('ALL');
    const today = new Date().toISOString().split('T')[0];
    setDateFrom(today);
    setDateTo(today);
    setShowAllHistory(false);
    setStatusFilter('ALL');
    setCurrentPage(1);
  };

  const toggleHistoryMode = () => {
    setShowAllHistory(!showAllHistory);
    setCurrentPage(1);
  };

  return {
    sessions,
    branches,
    isLoading,
    mutate,
    selectedSession,
    setSelectedSession,
    declaredCash,
    setDeclaredCash,
    isClosing,
    isGeneratingPDF,
    setIsGeneratingPDF,
    branchFilter,
    setBranchFilter,
    statusFilter,
    setStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    showAllHistory,
    setShowAllHistory,
    toggleHistoryMode,
    currentPage,
    setCurrentPage,
    showFilters,
    setShowFilters,
    filteredSessions,
    paginatedSessions,
    totalPages,
    getSessionStats,
    getSessionNumber,
    handleCloseSession,
    clearFilters,
    ITEMS_PER_PAGE
  };
}
