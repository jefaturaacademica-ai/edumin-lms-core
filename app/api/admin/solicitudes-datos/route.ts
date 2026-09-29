import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();

    // Obtener perfiles de estudiantes de la base de datos
    const { data: profiles, error } = await admin
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
      },
      {
        id: 'est-03',
        dni_ce: '78912345',
        nombres: 'Ana',
        apellidos: 'Torres Valenzuela',
        email: 'ana.torres@gmail.com',
        telefono: '+51 976 543 210',
        programa: 'Sistemas integrados de gestión HSEQ',
        paquete: 'PRO',
        fechaIngreso: '2026-07-20',
        estado: 'Activo'
      },
      {
        id: 'est-04',
        dni_ce: '73412098',
        nombres: 'Sofia Beatriz',
        apellidos: 'Mendoza Ugarte',
        email: 'sofia.mendoza@gmail.com',
        telefono: '+51 965 432 109',
        programa: 'Ventilación de minas y control de gases tóxicos',
        paquete: 'PREMIUM',
        fechaIngreso: '2026-08-01',
        estado: 'Activo'
      },
      {
        id: 'est-05',
        dni_ce: '43210987',
        nombres: 'Carlos Eduardo',
        apellidos: 'Benavides Prado',
        email: 'carlos.benavides@outlook.com',
        telefono: '+51 954 321 098',
        programa: 'Minería 4.0, automatización y digitalización',
        paquete: 'PRO',
        fechaIngreso: '2026-08-15',
        estado: 'Activo'
      }
    ];

    const solicitudes = [
      {
        id: 'sol-dat-01',
        estudianteId: 'est-04',
        nombreActual: 'Sofia Mendoza Ugarte',
        dniActual: '73412098',
        email: 'sofia.mendoza@gmail.com',
        nombresSolicitados: 'Sofía Beatriz',
        apellidosSolicitados: 'Mendoza de Ugarte',
        dniSolicitado: '73412098',
        fecha: '2026-09-22',
        sustentoUrl: '/assets/docs/dni_sustento.pdf',
        estado: 'Pendiente'
      },
      {
        id: 'sol-dat-02',
        estudianteId: 'est-02',
        nombreActual: 'Marcos Quispe',
        dniActual: '71234568',
        email: 'marcos.q@hotmail.com',
        nombresSolicitados: 'Marcos Alexander',
        apellidosSolicitados: 'Quispe Choque',
        dniSolicitado: '71234568',
        fecha: '2026-09-20',
        sustentoUrl: '/assets/docs/dni_sustento.pdf',
        estado: 'Pendiente'
      }
    ];

    return NextResponse.json({ 
      estudiantes: listaEstudiantes,
      solicitudes 
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener solicitudes y directorio' }, { status: 500 });
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
