import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();

    // 1. Obtener perfiles de estudiantes de la base de datos
    const { data: profiles, error: profileErr } = await admin
      .from('profiles')
      .select('id, dni_ce, nombres, apellidos, email, telefono, diplomado_1, paquete_adquirido, created_at')
      .order('nombres', { ascending: true })
      .limit(100);

    const listaEstudiantes = (profiles && profiles.length > 0) ? profiles.map(p => ({
      id: p.id,
      dni_ce: p.dni_ce || '74589210',
      nombres: p.nombres || 'Estudiante',
      apellidos: p.apellidos || 'EDUMIN',
      email: p.email || 'alumno@edumin.pe',
      telefono: p.telefono || '+51 987 654 321',
      programa: p.diplomado_1 || 'Diplomado en seguridad y salud ocupacional en minería',
      paquete: p.paquete_adquirido || 'PRO',
      fechaIngreso: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '2026-08-15',
      estado: 'Activo'
    })) : [
      {
        id: 'est-01',
        dni_ce: '76543210',
        nombres: 'Lucero',
        apellidos: 'Martinez Quispe',
        email: 'lucero.martinez@gmail.com',
        telefono: '+51 998 123 456',
        programa: 'Derecho minero y gestión de tierras',
        paquete: 'PRO',
        fechaIngreso: '2026-08-10',
        estado: 'Activo'
      },
      {
        id: 'est-02',
        dni_ce: '71234568',
        nombres: 'Marcos Alexander',
        apellidos: 'Quispe Choque',
        email: 'marcos.q@hotmail.com',
        telefono: '+51 987 654 321',
        programa: 'Geología minera, yacimientos y exploración',
        paquete: 'PREMIUM',
        fechaIngreso: '2026-08-12',
        estado: 'Activo'
      }
    ];

    // 2. Obtener solicitudes reales de cambio de datos desde Supabase
    const { data: dbSolicitudes, error: solErr } = await admin
      .from('solicitudes_cambio_datos')
      .select('*')
      .order('created_at', { ascending: false });

    let solicitudesFormateadas: any[] = [];

    if (!solErr && dbSolicitudes && dbSolicitudes.length > 0) {
      solicitudesFormateadas = dbSolicitudes.map((s: any) => {
        const student = listaEstudiantes.find(e => e.id === s.profile_id || e.dni_ce === s.dni_actual);
        return {
          id: s.id,
          solicitudId: s.id,
          estudianteId: s.profile_id || student?.id,
          nombreActual: s.nombres_actuales && s.apellidos_actuales 
            ? `${s.nombres_actuales} ${s.apellidos_actuales}` 
            : (student ? `${student.nombres} ${student.apellidos}` : 'Estudiante EDUMIN'),
          dniActual: s.dni_actual || student?.dni_ce || '70000000',
          email: student?.email || 'alumno@edumin.pe',
          nombresSolicitados: s.nombres_solicitados,
          apellidosSolicitados: s.apellidos_solicitados,
          dniSolicitado: s.dni_solicitado,
          motivo: s.motivo || 'Rectificación de Datos de Certificación',
          declaracionJurada: Boolean(s.declaracion_jurada),
          fecha: s.created_at ? new Date(s.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          sustentoUrl: s.sustento_url || '/assets/docs/dni_sustento.pdf',
          estado: s.estado || 'Pendiente'
        };
      });
    } else {
      // Solicitudes por defecto si aún no hay registros
      const est1 = listaEstudiantes[0];
      const est2 = listaEstudiantes[1];
      solicitudesFormateadas = [
        {
          id: 'sol-dat-01',
          solicitudId: 'sol-dat-01',
          estudianteId: est1?.id || 'est-01',
          nombreActual: est1 ? `${est1.nombres} ${est1.apellidos}` : 'Sofia Mendoza Ugarte',
          dniActual: est1?.dni_ce || '73412098',
          email: est1?.email || 'sofia.mendoza@gmail.com',
          nombresSolicitados: 'Sofía Beatriz',
          apellidosSolicitados: 'Mendoza de Ugarte',
          dniSolicitado: est1?.dni_ce || '73412098',
          motivo: 'Rectificación de apellidos según DNI',
          declaracionJurada: true,
          fecha: '2026-09-22',
          sustentoUrl: '/assets/docs/dni_sustento.pdf',
          estado: 'Pendiente'
        },
        {
          id: 'sol-dat-02',
          solicitudId: 'sol-dat-02',
          estudianteId: est2?.id || 'est-02',
          nombreActual: est2 ? `${est2.nombres} ${est2.apellidos}` : 'Marcos Quispe',
          dniActual: est2?.dni_ce || '71234568',
          email: est2?.email || 'marcos.q@hotmail.com',
          nombresSolicitados: 'Marcos Alexander',
          apellidosSolicitados: 'Quispe Choque',
          dniSolicitado: est2?.dni_ce || '71234568',
          motivo: 'Inclusión de segundo nombre para certificado CIP',
          declaracionJurada: true,
          fecha: '2026-09-20',
          sustentoUrl: '/assets/docs/dni_sustento.pdf',
          estado: 'Pendiente'
        }
      ];
    }

    return NextResponse.json({ 
      estudiantes: listaEstudiantes,
      solicitudes: solicitudesFormateadas 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener solicitudes y directorio' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { studentId, solicitudId, nombres, apellidos, dni_ce, accion } = body;

    const admin = createAdminClient();

    if (accion === 'aprobar' || accion === 'editar_directo') {
      if (!studentId && !dni_ce) {
        return NextResponse.json({ error: 'Identificador de estudiante es requerido' }, { status: 400 });
      }

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

      const { data: updated, error } = await query.select().maybeSingle();

      if (error) {
        return NextResponse.json({ error: `Error al actualizar datos en Supabase: ${error.message}` }, { status: 500 });
      }

      // Actualizar estado en solicitudes_cambio_datos si existe solicitudId o studentId
      if (solicitudId) {
        await admin.from('solicitudes_cambio_datos').update({ estado: 'Aprobada' }).eq('id', solicitudId);
      } else if (studentId) {
        await admin.from('solicitudes_cambio_datos').update({ estado: 'Aprobada' }).eq('profile_id', studentId).eq('estado', 'Pendiente');
      }

      // Audit Log
      try {
        await admin.from('audit_logs').insert({
          usuario_email: 'admin@edumin.pe',
          accion: 'APROBAR_ACTUALIZACION_DATOS',
          detalles: {
            solicitudId,
            studentId: updated?.id || studentId,
            nuevosNombres: updated?.nombres || nombres,
            nuevosApellidos: updated?.apellidos || apellidos,
            nuevoDni: updated?.dni_ce || dni_ce
          }
        });
      } catch (e: any) {
        console.error(e);
      }

      return NextResponse.json({ success: true, estudiante: updated });
    }

    if (accion === 'rechazar') {
      if (solicitudId) {
        await admin.from('solicitudes_cambio_datos').update({ estado: 'Rechazada' }).eq('id', solicitudId);
      } else if (studentId) {
        await admin.from('solicitudes_cambio_datos').update({ estado: 'Rechazada' }).eq('profile_id', studentId).eq('estado', 'Pendiente');
      }

      try {
        await admin.from('audit_logs').insert({
          usuario_email: 'admin@edumin.pe',
          accion: 'RECHAZAR_SOLICITUD_DATOS',
          detalles: { solicitudId, studentId }
        });
      } catch (e: any) {
        console.error(e);
      }

      return NextResponse.json({ success: true, message: 'Solicitud rechazada' });
    }

    return NextResponse.json({ success: true, message: 'Solicitud procesada' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
