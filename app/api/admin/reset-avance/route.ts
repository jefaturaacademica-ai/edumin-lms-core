import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, parseCursosFromProfile } from '@/lib/utils/profileParser';

export async function POST() {
  try {
    const admin = createAdminClient();

    // 1. Borrar todas las certificaciones emitidas de Supabase
    let certsDeleted = 0;
    try {
      const { data: certs } = await admin.from('certificaciones').select('id');
      if (certs && certs.length > 0) {
        await admin.from('certificaciones').delete().in('id', certs.map(c => c.id));
        certsDeleted = certs.length;
      }
    } catch (e) {
      console.error('Error al limpiar tabla certificaciones:', e);
    }

    // 2. Borrar solicitudes de convenios/certificaciones si existen
    try {
      const { data: sols } = await admin.from('solicitudes_certificaciones').select('id');
      if (sols && sols.length > 0) {
        await admin.from('solicitudes_certificaciones').delete().in('id', sols.map(s => s.id));
      }
    } catch {
      // Ignorar si no existe tabla
    }

    // 3. Obtener todos los perfiles de Supabase y reiniciar avances, notas y códigos de certificados
    const { data: profiles, error: fetchErr } = await admin
      .from('profiles')
      .select('*');

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay perfiles para reiniciar.', count: 0, certsDeleted });
    }

    let updatedCount = 0;

    for (const prof of profiles) {
      // Resetear diplomados en JSON
      const diplomadosList = parseDiplomadosFromProfile(prof);
      diplomadosList.forEach((d: any) => {
        d.avance = 0;
        d.completado = false;
        d.completadosMap = {};
        delete d.promedio;
        delete d.codigo;
        delete d.fecha;
        delete (d as any).modelo_id;

        if (Array.isArray(d.modulos)) {
          d.modulos.forEach((m: any) => {
            m.completado = false;
            m.nota = 0;
            delete m.rendido;
            delete m.codigo_cert;
            delete m.fecha;
            delete (m as any).modelo_id;
          });
        }
      });

      // Resetear cursos en JSON
      const cursosList = parseCursosFromProfile(prof);
      cursosList.forEach((c: any) => {
        c.avance = 0;
        c.nota = 0;
        c.completado = false;
        c.completadosMap = {};
        delete c.codigo;
        delete c.fecha;
        delete (c as any).modelo_id;
      });

      const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosList)}`;
      const cursosSerialized = `CURSOS_LIST|${JSON.stringify(cursosList)}`;

      const { error: updateErr } = await admin
        .from('profiles')
        .update({
          diplomados: diplomadosSerialized,
          cursos: cursosSerialized
        })
        .eq('id', prof.id);

      if (!updateErr) {
        updatedCount++;
      }
    }

    // 4. Intentar actualizar tablas matriculas si existen
    try {
      await admin
        .from('matriculas')
        .update({ avance_porcentaje: 0 });
    } catch {
      // Ignorar si la tabla/columna no está disponible
    }

    try {
      await admin
        .from('matriculas_cursos')
        .update({ avance_porcentaje: 0 });
    } catch {
      // Ignorar si no está disponible
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      certsDeleted,
      message: `¡Se han reiniciado con éxito las notas, certificados y avances a 0% para ${updatedCount} estudiantes en Supabase! (${certsDeleted} certificados eliminados)`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
