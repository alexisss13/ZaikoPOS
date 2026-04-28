'use client';

import useSWR from 'swr';
import { useState, useMemo } from 'react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then(r => r.json());

export interface PurchaseOrder {
  id: string;
  orderDate: string;
  receivedDate: string | null;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
  totalAmount: number;
  notes: string | null;
  supplier: {
    name: string;
    phone: string | null;
  } | null;
  createdBy: {
    name: string;
  } | null;
  items: Array<{
    id: string;
    quantity: number;
    cost: number;
    costModified?: boolean;
    variant: {
      name: string;
      product: {
        title: string;
      };
    };
    uom: {
      name: string;
      abbreviation: string;
    } | null;
  }>;
  createdAt: string;
  updatedAt: string;
}

export function usePurchasesLogic() {
  const { data: purchases, isLoading, mutate } = useSWR<PurchaseOrder[]>('/api/purchases', fetcher);
  const { data: branches } = useSWR('/api/branches', fetcher);
  const { data: suppliers } = useSWR('/api/suppliers', fetcher);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'RECEIVED' | 'CANCELLED'>('ALL');
  const [supplierFilter, setSupplierFilter] = useState('ALL');
  const [selectedPurchase, setSelectedPurchase] = useState<PurchaseOrder | null>(null);
  const [stockDistribution, setStockDistribution] = useState<Record<string, Record<string, number>>>({});

  const filteredPurchases = useMemo(() => {
    if (!purchases) return [];
    
    return purchases
      .filter(purchase => {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
          purchase.supplier?.name.toLowerCase().includes(searchLower) ||
          purchase.items.some(item => 
            item.variant.product.title.toLowerCase().includes(searchLower)
          );

        const matchesStatus = statusFilter === 'ALL' || purchase.status === statusFilter;
        const matchesSupplier = supplierFilter === 'ALL' || purchase.supplier?.name === supplierFilter;

        return matchesSearch && matchesStatus && matchesSupplier;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); // Ordenar por fecha descendente
  }, [purchases, searchTerm, statusFilter, supplierFilter]);

  const initializeStockDistribution = () => {
    if (!selectedPurchase || !branches || branches.length === 0) return;
    
    const distribution: Record<string, Record<string, number>> = {};
    
    selectedPurchase.items.forEach(item => {
      distribution[item.id] = {};
      branches.forEach((branch: any) => {
        distribution[item.id][branch.id] = 0;
      });
      distribution[item.id][branches[0].id] = item.quantity;
    });
    
    setStockDistribution(distribution);
  };

  const updateStockDistribution = (itemId: string, branchId: string, quantity: number) => {
    setStockDistribution(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [branchId]: quantity
      }
    }));
  };

  const validateDistribution = (): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!selectedPurchase) return { valid: false, errors: ['No hay orden seleccionada'] };
    
    selectedPurchase.items.forEach(item => {
      const totalDistributed = Object.values(stockDistribution[item.id] || {}).reduce((sum, qty) => sum + qty, 0);
      
      if (totalDistributed !== item.quantity) {
        errors.push(`${item.variant.product.title}: distribuido ${totalDistributed} de ${item.quantity}`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  };

  const handleReceive = async () => {
    if (!selectedPurchase) return;
    
    const validation = validateDistribution();
    
    if (!validation.valid) {
      toast.error('Error en la distribución:\n' + validation.errors.join('\n'));
      return;
    }

    try {
      const res = await fetch(`/api/purchases/${selectedPurchase.id}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockDistribution }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      mutate();
      toast.success('Orden recibida correctamente');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Error al recibir la orden');
      return false;
    }
  };

  const handleCancel = async (purchaseId: string) => {
    try {
      const res = await fetch(`/api/purchases/${purchaseId}/cancel`, {
        method: 'POST',
      });
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
      
      mutate();
      toast.success('Orden cancelada');
      return true;
    } catch (error: any) {
      toast.error(error.message || 'Error al cancelar la orden');
      return false;
    }
  };

  return {
    purchases,
    branches,
    suppliers,
    isLoading,
    mutate,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    supplierFilter,
    setSupplierFilter,
    selectedPurchase,
    setSelectedPurchase,
    filteredPurchases,
    stockDistribution,
    setStockDistribution,
    initializeStockDistribution,
    updateStockDistribution,
    validateDistribution,
    handleReceive,
    handleCancel,
  };
}
