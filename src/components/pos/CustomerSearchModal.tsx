'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, User, Loader2, UserPlus, Tag, ShoppingBag, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  name: string;
  docType: string;
  docNumber: string;
  email?: string;
  phone?: string;
  pointsBalance: number;
  totalSpent: number;
  visits: number;
  lastPurchase?: string;
}

interface CustomerSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCustomer: (customer: Customer) => void;
  onCreateNew: () => void;
}

export function CustomerSearchModal({ isOpen, onClose, onSelectCustomer, onCreateNew }: CustomerSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const searchCustomers = useCallback(async (term: string) => {
    if (!term || term.trim().length < 3) {
      setCustomers([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(term.trim())}`);
      if (res.ok) {
        const data = await res.json();
        setCustomers(data || []);
      } else {
        setCustomers([]);
      }
    } catch (error) {
      console.error('Error buscando clientes:', error);
      setCustomers([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm, searchCustomers]);

  const handleSelectCustomer = (customer: Customer) => {
    onSelectCustomer(customer);
    onClose();
    setSearchTerm('');
    setCustomers([]);
    setHasSearched(false);
  };

  const handleClose = () => {
    onClose();
    setSearchTerm('');
    setCustomers([]);
    setHasSearched(false);
  };

  const handleCreateNew = () => {
    handleClose();
    onCreateNew();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar Cliente
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500">
            Busca por DNI, RUC, nombre, email o teléfono
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Buscador */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              autoFocus
              placeholder="Escribe para buscar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-11 text-sm"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
            )}
          </div>

          {/* Resultados */}
          <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded-lg">
            {!hasSearched && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                  <Search className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-sm font-semibold text-slate-600">Busca un cliente</p>
                <p className="text-xs text-slate-400 mt-1">Escribe al menos 3 caracteres</p>
              </div>
            )}

            {hasSearched && isSearching && (
              <div className="flex flex-col items-center justify-center h-full py-12">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                <p className="text-sm text-slate-500">Buscando...</p>
              </div>
            )}

            {hasSearched && !isSearching && customers.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center px-4">
                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-3">
                  <User className="w-8 h-8 text-amber-600" />
                </div>
                <p className="text-sm font-semibold text-slate-700">No se encontraron clientes</p>
                <p className="text-xs text-slate-500 mt-1 mb-4">
                  No hay clientes registrados con "{searchTerm}"
                </p>
                <Button
                  onClick={handleCreateNew}
                  size="sm"
                  className="bg-slate-900 hover:bg-slate-800"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Crear Nuevo Cliente
                </Button>
              </div>
            )}

            {hasSearched && !isSearching && customers.length > 0 && (
              <div className="divide-y divide-slate-100">
                {customers.map((customer) => (
                  <button
                    key={customer.id}
                    onClick={() => handleSelectCustomer(customer)}
                    className="w-full p-4 hover:bg-slate-50 transition-colors text-left flex items-start gap-3 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-full flex items-center justify-center shrink-0 group-hover:from-blue-200 group-hover:to-blue-100 transition-colors">
                      <User className="w-6 h-6 text-blue-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {customer.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {customer.docType}: {customer.docNumber}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="flex items-center gap-1 text-amber-600">
                            <Tag className="w-3.5 h-3.5" />
                            <span className="text-lg font-black">{customer.pointsBalance}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">puntos</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3" />
                          <span>{customer.visits} visita{customer.visits !== 1 ? 's' : ''}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span>S/ {Number(customer.totalSpent).toFixed(2)}</span>
                        </div>
                        {customer.lastPurchase && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{new Date(customer.lastPurchase).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}</span>
                          </div>
                        )}
                      </div>

                      {(customer.email || customer.phone) && (
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                          {customer.email && <span>{customer.email}</span>}
                          {customer.phone && <span>{customer.phone}</span>}
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón crear nuevo */}
          <div className="flex gap-2 pt-2 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateNew}
              className="flex-1 bg-slate-900 hover:bg-slate-800"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Nuevo Cliente
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
