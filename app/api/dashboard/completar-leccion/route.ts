import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, parseCursosFromProfile, DiplomadoJSON, CursoJSON } from '@/lib/utils/profileParser';
import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';
import { obtenerConfiguracionExamen } from '@/lib/services/examenesConfigService';
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
            { id: 'MÓDULO 01', codigo: 'MÓDULO 01', nombre: 'MÓDULO 01', nota: 0, completado: false },
            { id: 'MÓDULO 02', codigo: 'MÓDULO 02', nombre: 'MÓDULO 02', nota: 0, completado: false },
            { id: 'MÓDULO 03', codigo: 'MÓDULO 03', nombre: 'MÓDULO 03', nota: 0, completado: false }
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
          const modKey = m.codigo || m.id || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`;
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
      } else if (typeof body.nota !== 'number' || completado) {
        const isCompleted = completado !== undefined ? Boolean(completado) : !targetCurso.completado;
        targetCurso.avance = isCompleted ? 100 : 0;
      }

      if (typeof body.nota === 'number') {
        targetCurso.nota = body.nota;
        (targetCurso as any).rendido = true;
      } else if (body.rendido !== undefined) {
        (targetCurso as any).rendido = Boolean(body.rendido);
      }
      const codProg = targetCurso.codigo || targetCurso.id || targetSlug;
      const modNombre = (codProg.toUpperCase().startsWith('TAL-') || targetSlug.includes('taller')) 
        ? 'Examen del taller' 
        : 'Examen del curso';
      const confEx = obtenerConfiguracionExamen(codProg, modNombre);
      const noAplicaExamen = confEx?.aplica_examen === false;

      const tieneNotaAprobada = typeof targetCurso.nota === 'number' && targetCurso.nota >= 12;
      targetCurso.completado = ((targetCurso.avance || 0) === 100) && (noAplicaExamen || tieneNotaAprobada);

      if (targetCurso.completado && !targetCurso.fecha) {
        targetCurso.fecha = new Date().toISOString().split('T')[0];
        targetCurso.codigo = targetCurso.codigo || `EDUMIN-CUR-${profile.dni_ce || '71234567'}-${targetSlug}`;
      }
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

    // 5. REGISTRAR DIRECTAMENTE EN LA TABLA certificaciones DE SUPABASE (Certificado Modular, Diploma y Cursos)
    let modelosConfig: any[] = [];
    try {
      const { data: logData } = await admin
        .from('audit_logs')
        .select('detalles')
        .eq('accion', 'CONFIG_MODELOS_CERTIFICADOS')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (logData?.detalles?.modelos && Array.isArray(logData.detalles.modelos)) {
        modelosConfig = logData.detalles.modelos;
      }
    } catch {
      // Ignorar fallback
    }

    function resolverModeloCertificado(modelos: any[], tipo: string, productoTitulo?: string, productoId?: string) {
      if (!modelos || modelos.length === 0) return null;
      const tipoUpper = tipo.toUpperCase();

      // 1. Asignación específica por producto
      if (productoTitulo || productoId) {
        const porProducto = modelos.find((m: any) => 
          String(m.tipo).toUpperCase() === tipoUpper &&
          m.asignacionAlcance === 'PRODUCTO_ESPECIFICO' &&
          ((productoTitulo && m.recursoAsignadoNombre?.toLowerCase().includes(productoTitulo.toLowerCase())) ||
           (productoId && m.recursoAsignadoId === productoId))
        );
        if (porProducto) return porProducto;
      }

      // 2. Superplantilla global del tipo correspondiente
      const superplantilla = modelos.find((m: any) => 
        String(m.tipo).toUpperCase() === tipoUpper && 
        (m.asignacionAlcance === 'SUPERPLANTILLA_GLOBAL' || m.esPredeterminado)
      );
      if (superplantilla) return superplantilla;

      // 3. Fallback a cualquier modelo del tipo
      return modelos.find((m: any) => String(m.tipo).toUpperCase() === tipoUpper) || null;
    }

    const fechaEmisionHoy = new Date().toISOString().split('T')[0];
    const nombreEstudianteOficial = formatearNombreCertificado(profile.nombres, profile.apellidos);

    if (esDiplomado && targetDip && Array.isArray(targetDip.modulos)) {
      try {
        const codDip = targetDip.codigo || targetDip.slug || targetDip.id || '';
        const modeloMod = resolverModeloCertificado(modelosConfig, 'MODULAR', targetDip.titulo, codDip);
        const modeloDip = resolverModeloCertificado(modelosConfig, 'DIPLOMA', targetDip.titulo, codDip);

        // A. Revisar cada módulo completado (por examen aprobado o por clases 100% si no aplica examen)
        for (let mIdx = 0; mIdx < targetDip.modulos.length; mIdx++) {
          const modItem = targetDip.modulos[mIdx];
          const modCodCfg = modItem.codigo || modItem.id || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`;
          const moduloNombreFinal = modItem.nombre || modCodCfg;
          const confMod = obtenerConfiguracionExamen(codDip, modCodCfg);
          const noAplicaExamen = confMod?.aplica_examen === false;
          const tieneNotaAprobada = typeof modItem.nota === 'number' && modItem.nota >= 12;
          const esModuloAprobado = tieneNotaAprobada || (noAplicaExamen && modItem.completado);

          if (esModuloAprobado) {
            const codVerifModular = normalizarCodigoCertificado(modItem.codigo_cert || generarCodigoUnicoCertificado());
            modItem.codigo_cert = codVerifModular;
            modItem.fecha = modItem.fecha || fechaEmisionHoy;
            modItem.completado = true;

            const { data: certModExistente } = await admin
              .from('certificaciones')
              .select('id, plantilla_snapshot')
              .eq('dni_ce', profile.dni_ce)
              .eq('tipo', 'MODULAR')
              .eq('programa_titulo', targetDip.titulo)
              .eq('modulo_titulo', moduloNombreFinal)
              .maybeSingle();

            const snapshotModular = {
              modelo_id: modeloMod?.id || 'mod-avanza-mod',
              nombrePlantilla: modeloMod?.nombre || 'Superplantilla Oficial Avanza & EDUMIN - Certificado Modular',
              horas: modItem.horas || modeloMod?.horas || '108 horas académicas',
              ciudad: 'Arequipa',
              orientacion: modeloMod?.orientacion || 'horizontal',
              imagenFondoUrl: modeloMod?.imagenFondoUrl || '/assets/certificates/plantilla_avanza_modular_bg.png',
              disenoCoordenadas: modeloMod?.disenoCoordenadas || null,
              incluyeQr: modeloMod?.incluyeQr !== false,
              fechaEmision: fechaEmisionHoy
            };

            if (certModExistente) {
              const tieneSnapshotCompleto = certModExistente.plantilla_snapshot?.imagenFondoUrl && certModExistente.plantilla_snapshot?.disenoCoordenadas;
              await admin
                .from('certificaciones')
                .update({
                  nota_final: typeof modItem.nota === 'number' && modItem.nota > 0 ? modItem.nota : null,
                  fecha_emision: fechaEmisionHoy,
                  estado_financiero_al_dia: !profile.bloqueado,
                  ...(!tieneSnapshotCompleto ? { plantilla_snapshot: snapshotModular } : {})
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
                  horas_lectivas: modItem.horas || modeloMod?.horas || '108 horas académicas',
                  nota_final: typeof modItem.nota === 'number' && modItem.nota > 0 ? modItem.nota : null,
                  fecha_emision: fechaEmisionHoy,
                  estado_financiero_al_dia: !profile.bloqueado,
                  plantilla_snapshot: snapshotModular
                });
            }
          }
        }

        // B. Verificar si todos los módulos están completados para emitir Diploma General
        const modulosValidos = targetDip.modulos.filter((m: any, mIdx: number) => {
          if (!m.completado) return false;
          const cMod = obtenerConfiguracionExamen(codDip, m.codigo || m.id || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`);
          if (cMod?.aplica_examen === false) return true;
          return typeof m.nota === 'number' && m.nota >= 12;
        });

        if (modulosValidos.length >= targetDip.modulos.length && targetDip.modulos.length > 0) {
          const codVerifDip = normalizarCodigoCertificado(targetDip.codigo || generarCodigoUnicoCertificado());
          targetDip.codigo = codVerifDip;
          targetDip.fecha = targetDip.fecha || fechaEmisionHoy;
          targetDip.completado = true;
          targetDip.avance = 100;

          const notasConExamen = modulosValidos.filter((m: any) => typeof m.nota === 'number' && m.nota > 0);
          const promedio = notasConExamen.length > 0 
            ? Math.round(notasConExamen.reduce((sum: number, m: any) => sum + m.nota, 0) / notasConExamen.length) 
            : null;

          const { data: certDipExistente } = await admin
            .from('certificaciones')
            .select('id, plantilla_snapshot')
            .eq('dni_ce', profile.dni_ce)
            .eq('tipo', 'DIPLOMA')
            .eq('programa_titulo', targetDip.titulo)
            .maybeSingle();

          const snapshotDiploma = {
            modelo_id: modeloDip?.id || 'mod-avanza-dip',
            nombrePlantilla: modeloDip?.nombre || 'Superplantilla Oficial Avanza & EDUMIN - Diploma de Alta Especialización',
            horas: modeloDip?.horas || '325 horas académicas y 13 créditos académicos',
            ciudad: 'Arequipa',
            orientacion: modeloDip?.orientacion || 'horizontal',
            imagenFondoUrl: modeloDip?.imagenFondoUrl || '/assets/certificates/plantilla_avanza_diploma_bg.png',
            disenoCoordenadas: modeloDip?.disenoCoordenadas || null,
            incluyeQr: modeloDip?.incluyeQr !== false,
            fechaEmision: fechaEmisionHoy
          };

          if (certDipExistente) {
            const tieneSnapshotCompleto = certDipExistente.plantilla_snapshot?.imagenFondoUrl && certDipExistente.plantilla_snapshot?.disenoCoordenadas;
            await admin
              .from('certificaciones')
              .update({
                nota_final: promedio,
                fecha_emision: fechaEmisionHoy,
                estado_financiero_al_dia: !profile.bloqueado,
                ...(!tieneSnapshotCompleto ? { plantilla_snapshot: snapshotDiploma } : {})
              })
              .eq('id', certDipExistente.id);
          } else {
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
                horas_lectivas: modeloDip?.horas || '325 horas académicas y 13 créditos académicos',
                nota_final: promedio,
                fecha_emision: fechaEmisionHoy,
                estado_financiero_al_dia: !profile.bloqueado,
                plantilla_snapshot: snapshotDiploma
              });
          }
        }
      } catch (certErr) {
        console.error('Error procesando certificaciones de diplomado:', certErr);
      }
    }

    if (targetCurso && targetCurso.completado) {
      try {
        const codVerifCurso = normalizarCodigoCertificado((targetCurso as any).codigo_cert || generarCodigoUnicoCertificado());
        (targetCurso as any).codigo_cert = codVerifCurso;
        const codCurso = targetCurso.codigo || targetCurso.id || '';
        const modeloCurso = resolverModeloCertificado(modelosConfig, 'CURSO', targetCurso.titulo, codCurso);

        const { data: certCursoExistente } = await admin
          .from('certificaciones')
          .select('id, plantilla_snapshot')
          .eq('dni_ce', profile.dni_ce)
          .eq('tipo', 'CURSO')
          .eq('programa_titulo', targetCurso.titulo)
          .maybeSingle();

        const snapshotCurso = {
          modelo_id: modeloCurso?.id || 'mod-226455',
          nombrePlantilla: modeloCurso?.nombre || 'Certificado global para cursos cortos',
          horas: targetCurso.horas || modeloCurso?.horas || '24 horas académicas',
          ciudad: 'Arequipa',
          orientacion: modeloCurso?.orientacion || 'vertical',
          imagenFondoUrl: modeloCurso?.imagenFondoUrl || 'https://wluuomwkxywpfotbngwf.supabase.co/storage/v1/object/public/certificados/fondos/plantilla_1792606225470_g6hsm1j.webp',
          disenoCoordenadas: modeloCurso?.disenoCoordenadas || null,
          incluyeQr: modeloCurso?.incluyeQr !== false,
          fechaEmision: fechaEmisionHoy
        };

        if (certCursoExistente) {
          const tieneSnapshotCompleto = certCursoExistente.plantilla_snapshot?.imagenFondoUrl && certCursoExistente.plantilla_snapshot?.disenoCoordenadas;
          await admin
            .from('certificaciones')
            .update({
              nota_final: typeof targetCurso.nota === 'number' && targetCurso.nota > 0 ? targetCurso.nota : null,
              fecha_emision: fechaEmisionHoy,
              estado_financiero_al_dia: !profile.bloqueado,
              ...(!tieneSnapshotCompleto ? { plantilla_snapshot: snapshotCurso } : {})
            })
            .eq('id', certCursoExistente.id);
        } else {
          await admin
            .from('certificaciones')
            .insert({
              codigo_verificacion: codVerifCurso,
              profile_id: profile.id,
              dni_ce: profile.dni_ce,
              estudiante_nombre: nombreEstudianteOficial,
              tipo: 'CURSO',
              programa_titulo: targetCurso.titulo,
              modulo_titulo: null,
              horas_lectivas: targetCurso.horas || modeloCurso?.horas || '24 horas académicas',
              nota_final: typeof targetCurso.nota === 'number' && targetCurso.nota > 0 ? targetCurso.nota : null,
              fecha_emision: fechaEmisionHoy,
              estado_financiero_al_dia: !profile.bloqueado,
              plantilla_snapshot: snapshotCurso
            });
        }
      } catch (certCursoErr) {
        console.error('Error insertando certificado de curso en certificaciones:', certCursoErr);
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
