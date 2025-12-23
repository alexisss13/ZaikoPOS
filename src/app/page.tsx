// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function RootPage() {
  // Redirigir al login por defecto
  redirect('/login');
}