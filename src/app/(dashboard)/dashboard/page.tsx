'use client';

import { useAuth } from '@/context/auth-context';
import { useResponsive } from '@/hooks/useResponsive';
import TiDashboardOverview from '@/components/dashboard/TiDashboardOverview';
import StoreDashboardModern from '@/components/dashboard/StoreDashboardModern';
import { MobileHomeScreen } from '@/components/dashboard/MobileHomeScreen';

export default function DashboardPage() {
  const { role } = useAuth();
  const { isMobile } = useResponsive();

  // Mientras lee la sesión, no mostramos nada para evitar destellos (flickering)
  if (!role) return null;

  // 📱 En móvil, mostrar Home Screen tipo app
  if (isMobile) {
    return <MobileHomeScreen />;
  }

  // 🚀 El Ingeniero TI ve el resumen del Software
  if (role === 'SUPER_ADMIN') {
    return <TiDashboardOverview />;
  }

  // 🏬 Los dueños, jefes y cajeros ven el resumen de la tienda física
  return <StoreDashboardModern />;
}