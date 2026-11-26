import { createClient } from '@/lib/supabase/client';
import { limpiarSesionLocal } from '@/context/profile-context';

export async function cerrarSesionUsuario(router?: { push: (url: string) => void; refresh?: () => void }) {
  try {
    const supabase = createClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error al cerrar sesión en Supabase:', err);
  } finally {
    limpiarSesionLocal();
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    } else if (router) {
      router.push('/login');
    }
  }
}
