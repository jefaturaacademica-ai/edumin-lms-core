import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();

    // Obtener audit logs de tipo SOLICITUD_DATOS o perfiles recientes
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('id, dni_ce, nombres, apellidos, email')
      .order('nombres', { ascending: true })
      .limit(20);

    if (error) {
      return NextResponse.json({ solicitudes: [], error: error.message }, { status: 500 });
    }

    const solicitudes = (profiles || []).slice(0, 2).map((p, idx) => ({
      id: `sol-dat-0${idx + 1}`,
      estudianteId: p.id,
      nombreActual: `${p.nombres} ${p.apellidos}`,
      dniActual: p.dni_ce,
      email: p.email,
      nombresSolicitados: p.nombres,
      apellidosSolicitados: p.apellidos,
      dniSolicitado: p.dni_ce,
      fecha: new Date().toISOString().split('T')[0],
      sustentoUrl: '/assets/docs/dni_sustento.pdf',
      estado: 'Pendiente'
    }));

    return NextResponse.json({ solicitudes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener solicitudes' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { studentId, nombres, apellidos, dni_ce, accion } = body;

    if (!studentId && !dni_ce) {
      return NextResponse.json({ error: 'Identificador de estudiante es requerido' }, { status: 400 });
    }

    const admin = createAdminClient();

    if (accion === 'aprobar' || accion === 'editar_directo') {
      let query = admin.from('profiles').update({
        nombres: nombres ? nombres.trim() : undefined,
        apellidos: apellidos ? apellidos.trim() : undefined,
        dni_ce: dni_ce ? dni_ce.trim() : undefined
      });

      if (studentId) {
        query = query.eq('id', studentId);
      } else {
        query = query.eq('dni_ce', dni_ce);
      }

      const { data: updated, error } = await query.select().single();

      if (error) {
        return NextResponse.json({ error: `Error al actualizar datos en Supabase: ${error.message}` }, { status: 500 });
      }

      // Audit Log
      try {
        await admin.from('audit_logs').insert({
          usuario_email: 'admin@edumin.pe',
          accion: 'APROBAR_ACTUALIZACION_DATOS',
          detalles: {
            studentId: updated.id,
            nuevosNombres: updated.nombres,
            nuevosApellidos: updated.apellidos,
            nuevoDni: updated.dni_ce
          }
        });
      } catch (e: any) {
        console.error(e);
      }

      return NextResponse.json({ success: true, estudiante: updated });
    }

    return NextResponse.json({ success: true, message: 'Solicitud actualizada' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
