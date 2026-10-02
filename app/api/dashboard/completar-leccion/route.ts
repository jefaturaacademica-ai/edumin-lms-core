import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, DiplomadoJSON } from '@/lib/utils/profileParser';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const body = await request.json();
    const { diplomadoSlug, diplomadoTitulo, moduloIndex, moduloId, completado } = body;

    const admin = createAdminClient();

    // 1. Obtener Perfil del estudiante
    let { data: profile } = await admin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile && user.email) {
      const { data: pByEmail } = await admin
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();
      profile = pByEmail;
    }

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado en Supabase.' }, { status: 404 });
    }

    // 2. Parsear diplomados del perfil
    let diplomadosList: DiplomadoJSON[] = parseDiplomadosFromProfile(profile);

    if (diplomadosList.length === 0) {
      // Fallback si no tiene diplomados creados en JSON
      const title = (diplomadoTitulo || diplomadoSlug || 'DERECHO MINERO').toUpperCase();
      diplomadosList = [{
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        titulo: title,
        avance: 0,
        modulos: [
          { id: 'mod-01', codigo: 'Módulo 01', nombre: 'Módulo 01', nota: 17, completado: false },
          { id: 'mod-02', codigo: 'Módulo 02', nombre: 'Módulo 02', nota: 18, completado: false },
          { id: 'mod-03', codigo: 'Módulo 03', nombre: 'Módulo 03', nota: 0, completado: false }
        ]
      }];
    }

    // Buscar el diplomado objetivo por slug, titulo o ID
    const targetSlugNorm = (diplomadoSlug || diplomadoTitulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
    let targetDip = diplomadosList.find(d => 
      (d.slug && d.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm) ||
      (d.id && d.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm) ||
      (d.titulo && d.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm)
    );

    if (!targetDip) {
      targetDip = diplomadosList[0];
    }

    // 3. Actualizar el módulo especificado
    if (targetDip && Array.isArray(targetDip.modulos) && targetDip.modulos.length > 0) {
      let idxToUpdate = -1;
      if (typeof moduloIndex === 'number' && moduloIndex >= 0 && moduloIndex < targetDip.modulos.length) {
        idxToUpdate = moduloIndex;
      } else if (moduloId) {
        idxToUpdate = targetDip.modulos.findIndex(m => m.id === moduloId || m.codigo === moduloId);
      }

      if (idxToUpdate === -1) idxToUpdate = 0;

      const isCompleted = completado !== undefined ? Boolean(completado) : !targetDip.modulos[idxToUpdate].completado;
      targetDip.modulos[idxToUpdate].completado = isCompleted;

      // Recalcular el porcentaje de avance del diplomado
      const completadosCount = targetDip.modulos.filter(m => m.completado).length;
      const nuevoAvance = Math.round((completadosCount / targetDip.modulos.length) * 100);
      targetDip.avance = nuevoAvance;
    }

    // 4. Guardar diplomados y cursos actualizados en Supabase profiles
    const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosList)}`;

    const updatePayload: any = {
      diplomados: diplomadosSerialized,
      diplomado_1: diplomadosSerialized,
      avance_porcentaje: targetDip ? targetDip.avance : profile.avance_porcentaje
    };

    const { data: updatedProfile, error: updateErr } = await admin
      .from('profiles')
      .update(updatePayload)
      .eq('id', profile.id)
      .select()
      .single();

    if (updateErr) {
      // Fallback try without diplomado_1 if column doesn't exist
      const { data: retryProfile, error: retryErr } = await admin
        .from('profiles')
        .update({
          diplomados: diplomadosSerialized,
          avance_porcentaje: targetDip ? targetDip.avance : profile.avance_porcentaje
        })
        .eq('id', profile.id)
        .select()
        .single();

      if (retryErr) {
        return NextResponse.json({ error: `Error al guardar avance en Supabase: ${retryErr.message}` }, { status: 500 });
      }
    }

    // Audit Log
    try {
      await admin.from('audit_logs').insert({
        usuario_email: profile.email || user.email,
        accion: 'MARCAR_LECCION_COMPLETADA',
        detalles: { diplomado: targetDip?.titulo, avance: targetDip?.avance, modulos: targetDip?.modulos }
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      success: true,
      message: 'Avance registrado y sincronizado en Supabase.',
      diplomado: targetDip,
      avance_porcentaje: targetDip ? targetDip.avance : 0,
      profile: updatedProfile
    });

  } catch (err: any) {
    console.error('Error al completar lección:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
