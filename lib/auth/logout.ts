import { createClient } from '@/lib/supabase/client';
import { limpiarSesionLocal } from '@/context/profile-context';

export async function cerrarSesionUsuario(router?: { push: (url: string) => void; refresh?: () => void }) {
  limpiarSesionLocal();
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error al cerrar sesión en Supabase:', err);
  }

  if (router) {
    router.push('/login');
    if (router.refresh) {
      router.refresh();
    }
  } else if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
}
