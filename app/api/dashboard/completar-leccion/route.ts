import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, parseCursosFromProfile, DiplomadoJSON, CursoJSON } from '@/lib/utils/profileParser';
import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';

export async function POST(request: Request) {
  try {
    const admin = createAdminClient();
    const body = await request.json();
    const { 
      diplomadoSlug, 
      diplomadoTitulo, 
      moduloIndex, 
      moduloId, 
      claseId,
      completado, 
      completadosMap: inputMap,
      avancePorcentaje,
      cursoId, 
      cursoSlug, 
      dni 
    } = body;

    // 1. Obtener usuario autenticado o buscar por DNI/email si está en sesión demo
    let profile: any = null;
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: p } = await admin
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();
        profile = p;

        if (!profile && user.email) {
          const { data: pByEmail } = await admin
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .maybeSingle();
          profile = pByEmail;
        }
      }
    } catch {
      // Demo session fallback
    }

    if (!profile) {
      const targetDni = dni || '71234567';
      const { data: pByDni } = await admin
        .from('profiles')
        .select('*')
        .eq('dni_ce', targetDni)
        .maybeSingle();
      profile = pByDni;
    }

    if (!profile) {
      const { data: pFirst } = await admin
        .from('profiles')
        .select('*')
        .limit(1)
        .maybeSingle();
      profile = pFirst;
    }

    if (!profile) {
      return NextResponse.json({ error: 'Perfil no encontrado en Supabase.' }, { status: 404 });
    }

    // 2. Parsear diplomados y cursos del perfil
    let diplomadosList: DiplomadoJSON[] = parseDiplomadosFromProfile(profile);
    let cursosList: CursoJSON[] = parseCursosFromProfile(profile);

    const targetSlug = (diplomadoSlug || cursoId || cursoSlug || diplomadoTitulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    // Búsqueda en diplomados
    let targetDip = diplomadosList.find(d => 
      (d.slug && d.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
      (d.id && d.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
      (d.titulo && d.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug)
    );

    // Búsqueda en cursos
    let targetCurso = cursosList.find(c => 
      (c.id && c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
      (c.codigo && c.codigo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
      (c.titulo && c.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug)
    );

    let esDiplomado = Boolean(targetDip);

    // Si el diplomado no existía en el perfil del alumno, crearlo de forma aislada
    if (!targetDip && !targetCurso && targetSlug) {
      const matchedData = getDiplomadoByTitleOrSlug(diplomadoSlug || targetSlug);
      const newSlug = matchedData?.slug || targetSlug;
      const newTitle = matchedData?.titulo || (diplomadoTitulo || targetSlug.replace(/-/g, ' ').toUpperCase());

      targetDip = {
        id: newSlug,
        slug: newSlug,
        titulo: newTitle,
        avance: 0,
        completadosMap: {},
        modulos: [
          { id: 'Módulo 01', codigo: 'Módulo 01', nombre: 'Módulo 01', nota: 0, completado: false },
          { id: 'Módulo 02', codigo: 'Módulo 02', nombre: 'Módulo 02', nota: 0, completado: false },
          { id: 'Módulo 03', codigo: 'Módulo 03', nombre: 'Módulo 03', nota: 0, completado: false }
        ]
      };
      diplomadosList.push(targetDip);
      esDiplomado = true;
    }

    // 3. Actualización Granular por Clase / Módulo para Diplomado
    if (esDiplomado && targetDip) {
      (targetDip as any).completadosMap = (targetDip as any).completadosMap || {};

      const keyTarget = claseId || moduloId;
      if (keyTarget) {
        (targetDip as any).completadosMap[keyTarget] = Boolean(completado);
      }
      if (inputMap && typeof inputMap === 'object') {
        Object.assign((targetDip as any).completadosMap, inputMap);
      }

      // Actualización de notas y estado por módulo en Supabase
      if (Array.isArray(targetDip.modulos)) {
        let idxToUpdate = -1;
        if (typeof moduloIndex === 'number' && moduloIndex >= 0 && moduloIndex < targetDip.modulos.length) {
          idxToUpdate = moduloIndex;
        } else if (moduloId) {
          idxToUpdate = targetDip.modulos.findIndex(m => m.id === moduloId || m.codigo === moduloId);
        }

        if (idxToUpdate !== -1) {
          if (typeof body.nota === 'number') {
            targetDip.modulos[idxToUpdate].nota = body.nota;
            (targetDip.modulos[idxToUpdate] as any).rendido = true;
            if (body.nota >= 12) {
              targetDip.modulos[idxToUpdate].completado = true;
            }
          } else if (completado !== undefined) {
            targetDip.modulos[idxToUpdate].completado = Boolean(completado);
          }
        }

        // Sincronizar estado de cada módulo desde completadosMap
        targetDip.modulos.forEach((m: any, mIdx: number) => {
          const modKey = m.codigo || m.id || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`;
          if ((targetDip as any).completadosMap[modKey] !== undefined) {
            m.completado = Boolean((targetDip as any).completadosMap[modKey]);
          }
        });
      }

      // Definir porcentaje de avance
      if (typeof avancePorcentaje === 'number' && avancePorcentaje >= 0 && avancePorcentaje <= 100) {
        targetDip.avance = avancePorcentaje;
      } else if (Array.isArray(targetDip.modulos) && targetDip.modulos.length > 0) {
        const completadosCount = targetDip.modulos.filter(m => m.completado).length;
        targetDip.avance = Math.round((completadosCount / targetDip.modulos.length) * 100);
      }

      // Si el avance es menor al 100%, la propiedad completado pasa a FALSE (estado "en_curso")
      (targetDip as any).completado = (targetDip.avance === 100);

    } else if (targetCurso) {
      // Actualizar Curso
      (targetCurso as any).completadosMap = (targetCurso as any).completadosMap || {};
      const keyTarget = claseId || moduloId;
      if (keyTarget) {
        (targetCurso as any).completadosMap[keyTarget] = Boolean(completado);
      }
      if (inputMap && typeof inputMap === 'object') {
        Object.assign((targetCurso as any).completadosMap, inputMap);
      }

      if (typeof avancePorcentaje === 'number') {
        targetCurso.avance = avancePorcentaje;
      } else {
        const isCompleted = completado !== undefined ? Boolean(completado) : !targetCurso.completado;
        targetCurso.avance = isCompleted ? 100 : 0;
      }

      targetCurso.completado = ((targetCurso.avance || 0) === 100);
    }

    // 4. Serializar y guardar en la tabla profiles de Supabase
    const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosList)}`;
    const cursosSerialized = `CURSOS_LIST|${JSON.stringify(cursosList)}`;

    const { data: updatedProfile, error: updateErr } = await admin
      .from('profiles')
      .update({
        diplomados: diplomadosSerialized,
        cursos: cursosSerialized
      })
      .eq('id', profile.id)
      .select()
      .maybeSingle();

    if (updateErr) {
      console.error('Error guardando en Supabase:', updateErr);
      return NextResponse.json({ error: `Error en Supabase: ${updateErr.message}` }, { status: 500 });
    }

    // Registrar en auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: profile.email || 'estudiante@edumin.pe',
        accion: 'CAMBIAR_ESTADO_LECCION_GRANULAR',
        detalles: {
          programa: targetDip?.titulo || targetCurso?.titulo,
          claseId,
          completado,
          avance: targetDip?.avance || targetCurso?.avance
        }
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      success: true,
      message: 'Progreso por clase y porcentaje de avance actualizados en Supabase.',
      diplomado: targetDip,
      curso: targetCurso,
      avance: targetDip ? targetDip.avance : (targetCurso ? targetCurso.avance : 0),
      profile: updatedProfile || profile
    });

  } catch (err: any) {
    console.error('Error en completar-leccion API:', err);
    return NextResponse.json({ error: err.message || 'Error del servidor' }, { status: 500 });
  }
}
