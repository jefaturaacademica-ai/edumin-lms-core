import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, parseCursosFromProfile } from '@/lib/utils/profileParser';

export async function POST() {
  try {
    const admin = createAdminClient();

    // 1. Obtener todos los perfiles de Supabase
    const { data: profiles, error: fetchErr } = await admin
      .from('profiles')
      .select('*');

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ success: true, message: 'No hay perfiles para reiniciar.', count: 0 });
    }

    let updatedCount = 0;

    for (const prof of profiles) {
      // Resetear diplomados en JSON
      const diplomadosList = parseDiplomadosFromProfile(prof);
      diplomadosList.forEach((d: any) => {
        d.avance = 0;
        d.completado = false;
        d.completadosMap = {};
        if (Array.isArray(d.modulos)) {
          d.modulos.forEach((m: any) => {
            m.completado = false;
            m.nota = 0;
          });
        }
      });

      // Resetear cursos en JSON
      const cursosList = parseCursosFromProfile(prof);
      cursosList.forEach((c: any) => {
        c.avance = 0;
        c.completado = false;
        c.completadosMap = {};
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

    // 2. Intentar actualizar tabla matriculas si existe
    try {
      await admin
        .from('matriculas')
        .update({ avance_porcentaje: 0 });
    } catch {
      // Ignorar si la tabla/columna no está disponible
    }

    return NextResponse.json({
      success: true,
      updatedCount,
      message: `¡Se ha reiniciado con éxito el avance a 0% para los ${updatedCount} estudiantes en Supabase!`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
