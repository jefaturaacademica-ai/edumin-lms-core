import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    
    const { data: usuarios, error } = await admin
      .from('profiles')
      .select('id, dni_ce, nombres, apellidos, email, role, paquete_adquirido')
      .order('nombres', { ascending: true });

    if (error) {
      return NextResponse.json({ usuarios: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ usuarios: usuarios || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener usuarios y roles' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { userId, role } = body;

    const rolesValidos = ['SUPERADMIN', 'ADMIN', 'DOCENTE', 'ESTUDIANTE'];

    if (!userId || !rolesValidos.includes(role)) {
      return NextResponse.json({ error: 'ID de usuario o rol no válido' }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: updatedUser, error } = await admin
      .from('profiles')
      .update({ role })
      .eq('id', userId)
      .select('id, dni_ce, nombres, apellidos, email, role')
      .single();

    if (error) {
      return NextResponse.json({ error: `Error al actualizar el rol: ${error.message}` }, { status: 500 });
    }

    // Auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'CAMBIO_ROL_RBAC',
        detalles: {
          userId,
          targetEmail: updatedUser.email,
          nuevoRol: updatedUser.role
        }
      });
    } catch (e: any) {
      console.error(e);
    }

    return NextResponse.json({ success: true, usuario: updatedUser });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
