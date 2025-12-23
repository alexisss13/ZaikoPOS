import { redirect } from 'next/navigation';

export default function Home() {
  // Por ahora, redirigimos siempre al login.
  // En el futuro, el middleware decidirá si vas a /pos o /login
  redirect('/login');
}