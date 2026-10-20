import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, parseCursosFromProfile, DiplomadoJSON, CursoJSON } from '@/lib/utils/profileParser';
import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';
import { generarCodigoUnicoCertificado, formatearNombreCertificado, normalizarCodigoCertificado } from '@/lib/utils/certificateUtils';

export async function POST(request: Request) {
  try {
    const admin = createAdminClient();
    const body = await request.json();
    const { 
      diplomadoSlug, 
      diplomadoTitulo, 
      moduloIndex, 
      moduloId, 
      moduloNombre,
      claseId,
      sesionId,
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

    const isExplicitCurso = Boolean(cursoId || cursoSlug);
    const targetSlug = (cursoId || cursoSlug || diplomadoSlug || diplomadoTitulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-');

    let targetDip: DiplomadoJSON | undefined = undefined;
    let targetCurso: CursoJSON | undefined = undefined;

    if (isExplicitCurso) {
      targetCurso = cursosList.find(c => 
        (c.id && c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
        (c.codigo && c.codigo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
        (c.titulo && c.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug)
      );

      if (!targetCurso && targetSlug) {
        targetCurso = {
          id: cursoId || cursoSlug || targetSlug,
          codigo: cursoId || cursoSlug || targetSlug,
          titulo: body.cursoTitulo || (cursoId || cursoSlug || targetSlug).replace(/-/g, ' ').toUpperCase(),
          nota: 0,
          completado: avancePorcentaje === 100,
          avance: avancePorcentaje ?? 0,
          completadosMap: {}
        };
        cursosList.push(targetCurso);
      }
    } else {
      targetDip = diplomadosList.find(d => 
        (d.slug && d.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
        (d.id && d.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
        (d.titulo && d.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug)
      );

      if (!targetDip) {
        targetCurso = cursosList.find(c => 
          (c.id && c.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
          (c.codigo && c.codigo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug) ||
          (c.titulo && c.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlug)
        );
      }

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
      }
    }

    const esDiplomado = Boolean(targetDip);

    // 3. Actualización Granular por Clase / Módulo para Diplomado
    let idxToUpdate = -1;
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
              const fechaHoy = new Date().toISOString().split('T')[0];
              const codUnico = normalizarCodigoCertificado(targetDip.modulos[idxToUpdate].codigo_cert || generarCodigoUnicoCertificado());
              targetDip.modulos[idxToUpdate].codigo_cert = codUnico;
              targetDip.modulos[idxToUpdate].fecha = fechaHoy;
              targetDip.modulos[idxToUpdate].horas = targetDip.modulos[idxToUpdate].horas || '108 horas académicas';
              if (moduloNombre) targetDip.modulos[idxToUpdate].nombre = moduloNombre;
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
      const keyTarget = claseId || moduloId || sesionId;
      if (keyTarget) {
        (targetCurso as any).completadosMap[keyTarget] = Boolean(completado);
      }
      if (inputMap && typeof inputMap === 'object') {
        Object.assign((targetCurso as any).completadosMap, inputMap);
      }

      if (typeof avancePorcentaje === 'number') {
        targetCurso.avance = Math.max(0, Math.min(100, avancePorcentaje));
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

    // 5. REGISTRAR DIRECTAMENTE EN LA TABLA certificaciones DE SUPABASE (Certificado Modular y Diploma)
    if (esDiplomado && targetDip && typeof body.nota === 'number' && body.nota >= 12 && idxToUpdate !== -1) {
      try {
        const modActual = targetDip.modulos[idxToUpdate];
        const moduloNombreFinal = moduloNombre || modActual.nombre || modActual.codigo || `Módulo ${(idxToUpdate + 1).toString().padStart(2, '0')}`;
        const fechaEmisionHoy = new Date().toISOString().split('T')[0];
        const codVerifModular = normalizarCodigoCertificado(modActual.codigo_cert || generarCodigoUnicoCertificado());
        const nombreEstudianteOficial = formatearNombreCertificado(profile.nombres, profile.apellidos);

        // A. Certificado Modular
        const { data: certModExistente } = await admin
          .from('certificaciones')
          .select('id, codigo_verificacion')
          .eq('dni_ce', profile.dni_ce)
          .eq('tipo', 'MODULAR')
          .eq('programa_titulo', targetDip.titulo)
          .eq('modulo_titulo', moduloNombreFinal)
          .maybeSingle();

        if (certModExistente) {
          await admin
            .from('certificaciones')
            .update({
              nota_final: body.nota,
              fecha_emision: fechaEmisionHoy,
              estado_financiero_al_dia: !profile.bloqueado
            })
            .eq('id', certModExistente.id);
        } else {
          await admin
            .from('certificaciones')
            .insert({
              codigo_verificacion: codVerifModular,
              profile_id: profile.id,
              dni_ce: profile.dni_ce,
              estudiante_nombre: nombreEstudianteOficial,
              tipo: 'MODULAR',
              programa_titulo: targetDip.titulo,
              modulo_titulo: moduloNombreFinal,
              horas_lectivas: '108 horas académicas',
              nota_final: body.nota,
              fecha_emision: fechaEmisionHoy,
              estado_financiero_al_dia: !profile.bloqueado,
              plantilla_snapshot: {
                modelo_id: 'mod-avanza-mod',
                nombrePlantilla: 'Modelo Oficial Avanza & EDUMIN - Certificado Modular',
                horas: '108 horas académicas',
                ciudad: 'Arequipa'
              }
            });
        }

        // B. Verificar si completó y aprobó los 3 módulos para emitir Diploma General
        const modulosAprobados = targetDip.modulos.filter((m: any) => m.completado && Number(m.nota) >= 12);
        if (modulosAprobados.length >= 3) {
          const { data: certDipExistente } = await admin
            .from('certificaciones')
            .select('id')
            .eq('dni_ce', profile.dni_ce)
            .eq('tipo', 'DIPLOMA')
            .eq('programa_titulo', targetDip.titulo)
            .maybeSingle();

          const codVerifDip = normalizarCodigoCertificado(targetDip.codigo || generarCodigoUnicoCertificado());
          targetDip.codigo = codVerifDip;
          targetDip.fecha = fechaEmisionHoy;
          targetDip.completado = true;
          targetDip.avance = 100;

          const sumaNotas = modulosAprobados.reduce((sum: number, m: any) => sum + (Number(m.nota) || 12), 0);
          const promedio = Math.round(sumaNotas / modulosAprobados.length);

          if (!certDipExistente) {
            await admin
              .from('certificaciones')
              .insert({
                codigo_verificacion: codVerifDip,
                profile_id: profile.id,
                dni_ce: profile.dni_ce,
                estudiante_nombre: nombreEstudianteOficial,
                tipo: 'DIPLOMA',
                programa_titulo: targetDip.titulo,
                modulo_titulo: null,
                horas_lectivas: '325 horas académicas y 13 créditos académicos',
                nota_final: promedio,
                fecha_emision: fechaEmisionHoy,
                estado_financiero_al_dia: !profile.bloqueado,
                plantilla_snapshot: {
                  modelo_id: 'mod-avanza-dip',
                  nombrePlantilla: 'Modelo Oficial Avanza & EDUMIN - Diploma de Alta Especialización',
                  horas: '325 horas académicas y 13 créditos académicos',
                  ciudad: 'Arequipa'
                }
              });
          }
        }
      } catch (certErr) {
        console.error('Error insertando en tabla certificaciones:', certErr);
      }
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
