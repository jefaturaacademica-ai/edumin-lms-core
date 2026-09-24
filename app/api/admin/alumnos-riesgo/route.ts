import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();
    
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('*')
      .eq('role', 'ESTUDIANTE')
      .order('nombres', { ascending: true });

    if (error) {
      return NextResponse.json({ estudiantes: [], error: error.message }, { status: 500 });
    }

    return NextResponse.json({ estudiantes: profiles || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener alumnos en riesgo' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { studentId, action, bloqueado, prorroga_hasta } = body;

    if (!studentId) {
      return NextResponse.json({ error: 'ID de estudiante es requerido' }, { status: 400 });
    }

    const admin = createAdminClient();

    let updateData: any = {};
    let auditAction = 'ACTUALIZAR_ALUMNO_RIESGO';

    if (action === 'bloqueo') {
      updateData.bloqueado = Boolean(bloqueado);
      if (bloqueado) {
        updateData.prorroga_hasta = null;
      }
      auditAction = bloqueado ? 'BLOQUEAR_ALUMNO_SISTEMA' : 'DESBLOQUEAR_ALUMNO_SISTEMA';
    } else if (action === 'prorroga') {
      updateData.prorroga_hasta = prorroga_hasta || null;
      updateData.bloqueado = false;
      auditAction = 'OTORGAR_PRORROGA_TEMPORAL';
    }

    const { data: updated, error } = await admin
      .from('profiles')
      .update(updateData)
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: `Error al actualizar perfil: ${error.message}` }, { status: 500 });
    }

    // Registrar auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: auditAction,
        detalles: {
          studentId,
          dni_ce: updated.dni_ce,
          estudiante: `${updated.nombres} ${updated.apellidos}`,
          bloqueado: updated.bloqueado,
          prorroga_hasta: updated.prorroga_hasta
        }
      });
    } catch (e: any) {
      console.error(e);
    }

    return NextResponse.json({ success: true, estudiante: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
