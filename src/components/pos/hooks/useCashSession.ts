import { useState } from 'react';
import { toast } from 'sonner';

export function useCashSession() {
  const [showOpenCash, setShowOpenCash] = useState(false);
  const [showCloseCash, setShowCloseCash] = useState(false);
  const [initialCash, setInitialCash] = useState('');
  const [finalCash, setFinalCash] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [isOpeningCash, setIsOpeningCash] = useState(false);
  const [isClosingCash, setIsClosingCash] = useState(false);
  const [closeResult, setCloseResult] = useState<{ difference: number } | null>(null);

  const handleOpenCash = async (e: React.FormEvent, mutateCash: () => void) => {
    e.preventDefault();
    if (!initialCash || isNaN(Number(initialCash)) || Number(initialCash) < 0) {
      return toast.error('Ingresa un monto inicial válido.');
    }

    setIsOpeningCash(true);
    try {
      const res = await fetch('/api/cash/open', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId: selectedBranch || undefined,
          initialCash: Number(initialCash),
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al abrir caja');

      toast.success('¡Caja abierta! Buen turno.');
      setShowOpenCash(false);
      setInitialCash('');
      setSelectedBranch('');
      mutateCash();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al abrir caja';
      toast.error(errorMessage);
    } finally {
      setIsOpeningCash(false);
    }
  };

  const handleCloseCash = async (cashSessionId: string, mutateCash: () => void) => {
    if (!finalCash || isNaN(Number(finalCash)) || Number(finalCash) < 0) {
      return toast.error('Ingresa el efectivo contado.');
    }

    setIsClosingCash(true);
    try {
      const res = await fetch(`/api/cash-sessions/${cashSessionId}/close`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalCash: Number(finalCash) }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al cerrar caja');

      setCloseResult({ difference: Number(data.difference) });
      setFinalCash('');
      mutateCash();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error al cerrar caja';
      toast.error(errorMessage);
    } finally {
      setIsClosingCash(false);
    }
  };

  const handleExitAfterClose = () => {
    setCloseResult(null);
    setShowCloseCash(false);
    window.location.reload();
  };

  return {
    // State
    showOpenCash,
    setShowOpenCash,
    showCloseCash,
    setShowCloseCash,
    initialCash,
    setInitialCash,
    finalCash,
    setFinalCash,
    selectedBranch,
    setSelectedBranch,
    isOpeningCash,
    isClosingCash,
    closeResult,
    
    // Actions
    handleOpenCash,
    handleCloseCash,
    handleExitAfterClose,
  };
}