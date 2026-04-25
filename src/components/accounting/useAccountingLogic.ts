'use client';

import useSWR from 'swr';
import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/context/auth-context';

const fetcher = (url: string) => fetch(url).then(r => r.json());
export const haptic = (ms = 10) => { try { navigator.vibrate?.(ms); } catch {} };
export const MOBILE_PAGE_SIZE = 10;

export type TabType = 'dashboard' | 'journal' | 'accounts' | 'reports';

export interface Account {
  id: string;
  code: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  parentId?: string;
  balance: number;
  isActive: boolean;
  createdAt: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: number;
  entryDate: string;
  description: string;
  source: string;
  sourceId?: string;
  isReversed: boolean;
  reversalOfId?: string;
  createdById: string;
  lines: JournalLine[];
  createdAt: string;
  branch?: {
    id: string;
    name: string;
  };
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface JournalLine {
  id: string;
  accountId: string;
  account: Account;
  debit: number;
  credit: number;
  description?: string;
}

export function useAccountingLogic() {
  const { user, role } = useAuth();
  const permissions = user?.permissions || {};
  const isSuperOrOwner = role === 'SUPER_ADMIN' || role === 'OWNER';
  const canManage = isSuperOrOwner || role === 'MANAGER';

  // ── Data fetching ──
  const { data: accounts, isLoading: isLoadingAccounts, mutate: mutateAccounts } = useSWR<Account[]>(
    canManage ? '/api/accounting/accounts' : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const { data: journalResponse, isLoading: isLoadingJournal, mutate: mutateJournal } = useSWR<{ entries: JournalEntry[], pagination: any }>(
    canManage ? '/api/accounting/journal-entries' : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );

  const journalEntries = journalResponse?.entries;

  const isLoading = isLoadingAccounts || isLoadingJournal;

  // ── UI State ──
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<string>('THIS_MONTH');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(MOBILE_PAGE_SIZE);
  
  // ── Modals ──
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [selectedJournal, setSelectedJournal] = useState<JournalEntry | null>(null);

  // ── Pull-to-refresh ──
  const scrollRef = useRef<HTMLDivElement>(null);
  const pullStartY = useRef(0);
  const pullDistanceRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const updatePullIndicator = useCallback(() => {
    const indicator = document.getElementById('pull-indicator');
    if (indicator) {
      const distance = pullDistanceRef.current;
      indicator.style.height = `${Math.min(distance, 56)}px`;
      indicator.style.opacity = distance > 0 ? '1' : '0';
      const icon = indicator.querySelector('.refresh-icon');
      if (icon) {
        if (distance >= 60) {
          icon.classList.add('text-slate-900');
          icon.classList.remove('text-slate-400');
        } else {
          icon.classList.remove('text-slate-900');
          icon.classList.add('text-slate-400');
        }
      }
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (scrollRef.current?.scrollTop === 0) {
      pullStartY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!pullStartY.current) return;
    const dist = Math.max(0, Math.min(80, e.touches[0].clientY - pullStartY.current));
    if (dist > 0 && scrollRef.current?.scrollTop === 0) {
      pullDistanceRef.current = dist;
      if (!isPulling) setIsPulling(true);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(updatePullIndicator);
    }
  }, [isPulling, updatePullIndicator]);

  const handleTouchEnd = useCallback(async () => {
    const distance = pullDistanceRef.current;
    if (distance >= 60 && !isRefreshing) {
      setIsRefreshing(true);
      try { navigator.vibrate?.(20); } catch {}
      await Promise.all([mutateAccounts(), mutateJournal()]);
      setTimeout(() => {
        setIsRefreshing(false);
        setIsPulling(false);
        pullStartY.current = 0;
        pullDistanceRef.current = 0;
        updatePullIndicator();
      }, 600);
    } else {
      setIsPulling(false);
      pullStartY.current = 0;
      pullDistanceRef.current = 0;
      updatePullIndicator();
    }
  }, [isRefreshing, mutateAccounts, mutateJournal, updatePullIndicator]);

  // ── Computed Stats ──
  const stats = useMemo(() => {
    if (!accounts || !journalEntries) {
      return {
        totalIncome: 0,
        totalExpenses: 0,
        netProfit: 0,
        cashBalance: 0,
      };
    }

    const incomeAccounts = accounts.filter(a => a.type === 'REVENUE');
    const expenseAccounts = accounts.filter(a => a.type === 'EXPENSE');
    const cashAccounts = accounts.filter(a => a.code.startsWith('101')); // Caja y bancos

    const totalIncome = incomeAccounts.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
    const totalExpenses = expenseAccounts.reduce((sum, acc) => sum + Math.abs(Number(acc.balance)), 0);
    const netProfit = totalIncome - totalExpenses;
    const cashBalance = cashAccounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

    return { totalIncome, totalExpenses, netProfit, cashBalance };
  }, [accounts, journalEntries]);

  // ── Filtered Data ──
  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    
    return accounts.filter(acc => {
      // Search filter
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matchesCode = acc.code.toLowerCase().includes(q);
        const matchesName = acc.name.toLowerCase().includes(q);
        if (!matchesCode && !matchesName) return false;
      }

      // Type filter
      if (accountTypeFilter !== 'ALL' && acc.type !== accountTypeFilter) {
        return false;
      }

      return acc.isActive;
    });
  }, [accounts, debouncedSearch, accountTypeFilter]);

  const filteredJournalEntries = useMemo(() => {
    if (!journalEntries) return [];
    
    return journalEntries.filter(entry => {
      // Search filter
      if (debouncedSearch) {
        const q = debouncedSearch.toLowerCase();
        const matchesNumber = entry.entryNumber.toString().includes(q);
        const matchesDesc = entry.description.toLowerCase().includes(q);
        const matchesRef = entry.sourceId?.toLowerCase().includes(q) ?? false;
        if (!matchesNumber && !matchesDesc && !matchesRef) return false;
      }

      // Date filter
      if (dateFilter !== 'ALL') {
        const entryDate = new Date(entry.entryDate);
        const now = new Date();
        
        if (dateFilter === 'THIS_MONTH') {
          if (entryDate.getMonth() !== now.getMonth() || entryDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        } else if (dateFilter === 'THIS_YEAR') {
          if (entryDate.getFullYear() !== now.getFullYear()) {
            return false;
          }
        }
      }

      return !entry.isReversed;
    });
  }, [journalEntries, debouncedSearch, dateFilter]);

  // ── Pagination ──
  const mobileAccounts = useMemo(() => {
    return filteredAccounts.slice(0, visibleCount);
  }, [filteredAccounts, visibleCount]);

  const mobileJournalEntries = useMemo(() => {
    return filteredJournalEntries.slice(0, visibleCount);
  }, [filteredJournalEntries, visibleCount]);

  const hasMoreAccounts = visibleCount < filteredAccounts.length;
  const hasMoreJournal = visibleCount < filteredJournalEntries.length;

  // ── Handlers ──
  const handleSearchChange = useCallback((value: string) => {
    setDebouncedSearch(value);
    setVisibleCount(MOBILE_PAGE_SIZE);
  }, []);

  const handleDeleteAccount = useCallback(async (id: string) => {
    if (!confirm('¿Desactivar esta cuenta? No se eliminará, solo se ocultará.')) return;
    
    try {
      const res = await fetch(`/api/accounting/accounts/${id}`, {
        method: 'DELETE',
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      
      toast.success('Cuenta desactivada');
      mutateAccounts();
    } catch (error: any) {
      toast.error(error.message || 'Error al desactivar cuenta');
    }
  }, [mutateAccounts]);

  const handleReverseEntry = useCallback(async (id: string) => {
    if (!confirm('¿Revertir este asiento contable? Se creará un asiento inverso.')) return;
    
    try {
      const res = await fetch('/api/accounting/journal-entries/reverse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId: id }),
      });
      
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      
      toast.success('Asiento revertido');
      mutateJournal();
    } catch (error: any) {
      toast.error(error.message || 'Error al revertir asiento');
    }
  }, [mutateJournal]);

  useEffect(() => {
    setVisibleCount(MOBILE_PAGE_SIZE);
  }, [accountTypeFilter, dateFilter, debouncedSearch, activeTab]);

  return {
    // Auth
    user,
    canManage,
    // Data
    accounts,
    journalEntries,
    isLoading,
    mutateAccounts,
    mutateJournal,
    // Stats
    stats,
    // Filters
    debouncedSearch,
    setDebouncedSearch,
    accountTypeFilter,
    setAccountTypeFilter,
    dateFilter,
    setDateFilter,
    // UI State
    activeTab,
    setActiveTab,
    showMobileFilters,
    setShowMobileFilters,
    visibleCount,
    setVisibleCount,
    // Modals
    isAccountModalOpen,
    setIsAccountModalOpen,
    isJournalModalOpen,
    setIsJournalModalOpen,
    selectedAccount,
    setSelectedAccount,
    selectedJournal,
    setSelectedJournal,
    // Refs
    scrollRef,
    // Pull-to-refresh
    isPulling,
    isRefreshing,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    // Computed
    filteredAccounts,
    filteredJournalEntries,
    mobileAccounts,
    mobileJournalEntries,
    hasMoreAccounts,
    hasMoreJournal,
    // Handlers
    handleSearchChange,
    handleDeleteAccount,
    handleReverseEntry,
  };
}
