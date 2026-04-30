'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';

interface OnboardingStatus {
  needsOnboarding: boolean;
  isLoading: boolean;
  reason?: 'no-branches' | 'no-products' | null;
}

export function useOnboarding(): OnboardingStatus {
  const { user, role } = useAuth();
  
  const [status, setStatus] = useState<OnboardingStatus>({
    needsOnboarding: false,
    isLoading: true,
    reason: null
  });

  useEffect(() => {
    const checkOnboarding = async () => {
      // SUPER_ADMIN (Software TI) nunca necesita onboarding de sucursales
      // Solo verificar para OWNER
      if (role !== 'OWNER') {
        setStatus({ needsOnboarding: false, isLoading: false, reason: null });
        return;
      }

      try {
        // Verificar si hay sucursales
        const branchesRes = await fetch('/api/branches');
        if (!branchesRes.ok) {
          setStatus({ needsOnboarding: false, isLoading: false, reason: null });
          return;
        }

        const branches = await branchesRes.json();
        
        // Si no hay sucursales, necesita onboarding
        if (!branches || branches.length === 0) {
          setStatus({ 
            needsOnboarding: true, 
            isLoading: false, 
            reason: 'no-branches' 
          });
          return;
        }

        // Si hay sucursales, no necesita onboarding
        setStatus({ needsOnboarding: false, isLoading: false, reason: null });
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setStatus({ needsOnboarding: false, isLoading: false, reason: null });
      }
    };

    if (user) {
      checkOnboarding();
    }
  }, [user, role]);

  return status;
}
