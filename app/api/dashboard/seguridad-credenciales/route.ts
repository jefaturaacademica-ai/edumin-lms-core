import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { accion, password } = body;

    const admin = createAdminClient();

    // Opción 1: El estudiante decide mantener su contraseña actual (DNI)
    if (accion === 'mantener_actual') {
      const { error: updErr } = await admin
        .from('profiles')
        .update({ debe_cambiar_password: false })
        .eq('id', user.id);

      if (updErr) {
        return NextResponse.json({ success: false, error: updErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: 'Se mantuvo tu contraseña actual.' });
    }

    // Opción 2: El estudiante establece una nueva contraseña
    if (accion === 'cambiar_password') {
      if (!password || password.length < 6) {
        return NextResponse.json({ success: false, error: 'La nueva contraseña debe tener al menos 6 caracteres.' }, { status: 400 });
      }

      // Actualizar en auth de Supabase
      const { error: passErr } = await supabase.auth.updateUser({ password });
      if (passErr) {
        return NextResponse.json({ success: false, error: `Error en autenticación: ${passErr.message}` }, { status: 400 });
      }

      // Actualizar en profiles
      const { error: profErr } = await admin
        .from('profiles')
        .update({
          debe_cambiar_password: false,
          contrasena: password
        })
        .eq('id', user.id);

      if (profErr) {
        return NextResponse.json({ success: false, error: profErr.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: '¡Contraseña actualizada con éxito!' });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });
  } catch (err: any) {
    console.error('Error en /api/dashboard/seguridad-credenciales:', err);
    return NextResponse.json({ success: false, error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
