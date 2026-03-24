'use client';

import { useAuth } from '@/context/auth-context';
import TiDashboardOverview from '@/components/dashboard/TiDashboardOverview';
import StoreDashboardOverview from '@/components/dashboard/StoreDashboardOverview';

export default function DashboardPage() {
  const { role } = useAuth();

  // Mientras lee la sesión, no mostramos nada para evitar destellos (flickering)
  if (!role) return null;

  // 🚀 El Ingeniero TI ve el resumen del Software
  if (role === 'SUPER_ADMIN') {
    return <TiDashboardOverview />;
  }

  // 🏬 Los dueños, jefes y cajeros ven el resumen de la tienda física
  return <StoreDashboardOverview />;
}