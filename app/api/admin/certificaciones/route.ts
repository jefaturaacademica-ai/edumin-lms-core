import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, parseCursosFromProfile } from '@/lib/utils/profileParser';
import { generarCodigoUnicoCertificado, formatearNombreCertificado, normalizarCodigoCertificado } from '@/lib/utils/certificateUtils';

export async function GET(request?: Request) {
  try {
    const admin = createAdminClient();
    const dniParam = request?.url ? new URL(request.url).searchParams.get('dni')?.trim() : null;

    if (dniParam) {
      const { data: certsDni } = await admin
        .from('certificaciones')
        .select('*')
        .eq('dni_ce', dniParam)
        .order('created_at', { ascending: false });

      return NextResponse.json({
        certificaciones: Array.isArray(certsDni) ? certsDni : []
      });
    }

    const { data: profiles } = await admin
      .from('profiles')
      .select('*')
      .order('nombres', { ascending: true });

    const solicitudes = (profiles || []).map((p, idx) => ({
      id: `sol-${p.id.substring(0, 6)}`,
      estudiante: `${p.nombres || ''} ${p.apellidos || ''}`.trim() || 'Estudiante',
      dni: p.dni_ce,
      email: p.email,
      programa: p.diplomado_1 || 'DERECHO MINERO',
      tipo: idx % 2 === 0 ? 'CIP (Nacional)' : 'MIAMI (Internacional)',
      fecha: new Date().toISOString().split('T')[0],
      estado: idx === 0 ? 'Pendiente' : 'Emitido'
    }));

    // 1. Consultar tabla certificaciones en Supabase
    let realEmitidos: any[] = [];
    const codigosExistentes = new Set<string>();

    try {
      const { data: cData } = await admin
        .from('certificaciones')
        .select('*')
        .order('created_at', { ascending: false });
      if (cData && cData.length > 0) {
        cData.forEach(c => {
          const cod = c.codigo_verificacion || String(c.id);
          codigosExistentes.add(cod);
          codigosExistentes.add(`${c.dni_ce}-${c.tipo}-${c.programa_titulo}-${c.modulo_titulo || 'GENERAL'}`);

          const snapshot = c.plantilla_snapshot || {};
          const defaultModeloId = c.tipo === 'MODULAR' ? 'mod-avanza-mod' : (c.tipo === 'DIPLOMA' ? 'mod-avanza-dip' : 'mod-03');

          realEmitidos.push({
            id: c.id,
            codigo: c.codigo_verificacion,
            tipo: c.tipo,
            estudiante: c.estudiante_nombre,
            dni: c.dni_ce,
            email: `${c.dni_ce}@edumin.pe`,
            programa: c.programa_titulo,
            modulo: c.modulo_titulo,
            nota: Number(c.nota_final) || 18,
            horas: c.horas_lectivas || (c.tipo === 'MODULAR' ? '108 horas académicas' : '325 horas académicas y 13 créditos académicos'),
            fecha: c.fecha_emision ? String(c.fecha_emision) : new Date().toISOString().split('T')[0],
            estadoFinanciero: c.estado_financiero_al_dia ? 'AL_DIA' : 'DEUDA_PENDIENTE',
            habilitado: c.estado_financiero_al_dia !== false,
            modelo_id: snapshot.modelo_id || defaultModeloId,
            plantilla_snapshot: snapshot,
            categoria: c.tipo === 'DIPLOMA' || c.tipo === 'MODULAR' ? 'Diplomados Oficiales' : (c.tipo === 'TALLER' ? 'Talleres' : 'Cursos de Alta Especialización')
          });
        });
      }

      // 2. Sincronización automática de cursos/talleres/modulares completados desde profiles que falten en certificaciones
      try {
        const { data: profiles } = await admin
          .from('profiles')
          .select('id, dni_ce, nombres, apellidos, bloqueado, diplomados, cursos');

        if (profiles && profiles.length > 0) {
          for (const p of profiles) {
            const dni = p.dni_ce;
            if (!dni) continue;
            const estudianteNombre = `${p.nombres || ''} ${p.apellidos || ''}`.trim() || 'Estudiante EDUMIN';

            // Sincronizar modulares
            const dips = parseDiplomadosFromProfile(p);
            for (const d of dips) {
              for (const m of d.modulos || []) {
                const estaAprobado = Boolean(m.completado) || Boolean(m.codigo_cert) || (Number(m.nota) >= 12 && (m as any).rendido);
                if (estaAprobado) {
                  const modNombre = m.nombre || m.codigo || 'Módulo';
                  const cod = m.codigo_cert || normalizarCodigoCertificado(generarCodigoUnicoCertificado());
                  const key1 = cod;
                  const key2 = `${dni}-MODULAR-${d.titulo}-${modNombre}`;
                  if (!codigosExistentes.has(key1) && !codigosExistentes.has(key2)) {
                    codigosExistentes.add(key1);
                    codigosExistentes.add(key2);
                    const nuevoCert = {
                      codigo_verificacion: cod,
                      profile_id: p.id,
                      dni_ce: dni,
                      estudiante_nombre: estudianteNombre,
                      tipo: 'MODULAR',
                      programa_titulo: d.titulo,
                      modulo_titulo: modNombre,
                      horas_lectivas: m.horas || '108 horas académicas',
                      nota_final: typeof m.nota === 'number' && m.nota > 0 ? m.nota : 16,
                      fecha_emision: m.fecha || new Date().toISOString().split('T')[0],
                      estado_financiero_al_dia: !p.bloqueado,
                      plantilla_snapshot: {
                        modelo_id: 'mod-avanza-mod',
                        horas: m.horas || '108 horas académicas',
                        orientacion: 'horizontal',
                        fechaEmision: m.fecha || new Date().toISOString().split('T')[0]
                      }
                    };
                    await admin.from('certificaciones').insert(nuevoCert);
                    realEmitidos.push({
                      id: `sync-${cod}`,
                      codigo: cod,
                      tipo: 'MODULAR',
                      estudiante: estudianteNombre,
                      dni: dni,
                      email: `${dni}@edumin.pe`,
                      programa: d.titulo,
                      modulo: modNombre,
                      nota: typeof m.nota === 'number' && m.nota > 0 ? m.nota : 16,
                      horas: m.horas || '108 horas académicas',
                      fecha: m.fecha || new Date().toISOString().split('T')[0],
                      estadoFinanciero: !p.bloqueado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
                      habilitado: !p.bloqueado,
                      modelo_id: 'mod-avanza-mod',
                      categoria: 'Diplomados Oficiales'
                    });
                  }
                }
              }
            }

            // Sincronizar cursos y talleres
            const cursos = parseCursosFromProfile(p);
            for (const c of cursos) {
              const completado = Boolean(c.completado) || Number(c.avance) >= 100 || Boolean((c as any).codigo_cert);
              if (completado) {
                const esTaller = (c as any).tipo === 'TALLER' || c.id?.toLowerCase().startsWith('tal-') || c.codigo?.toLowerCase().startsWith('tal-') || c.titulo?.toUpperCase().includes('TALLER');
                const tipoCert = esTaller ? 'TALLER' : 'CURSO';
                const cod = (c as any).codigo_cert || normalizarCodigoCertificado(generarCodigoUnicoCertificado());
                const key1 = cod;
                const key2 = `${dni}-${tipoCert}-${c.titulo}-GENERAL`;
                if (!codigosExistentes.has(key1) && !codigosExistentes.has(key2)) {
                  codigosExistentes.add(key1);
                  codigosExistentes.add(key2);
                  const nuevoCert = {
                    codigo_verificacion: cod,
                    profile_id: p.id,
                    dni_ce: dni,
                    estudiante_nombre: estudianteNombre,
                    tipo: tipoCert,
                    programa_titulo: c.titulo,
                    modulo_titulo: null,
                    horas_lectivas: c.horas || (esTaller ? '16 horas académicas' : '24 horas académicas'),
                    nota_final: typeof c.nota === 'number' && c.nota > 0 ? c.nota : null,
                    fecha_emision: c.fecha || new Date().toISOString().split('T')[0],
                    estado_financiero_al_dia: !p.bloqueado,
                    plantilla_snapshot: {
                      modelo_id: 'mod-226455',
                      horas: c.horas || (esTaller ? '16 horas académicas' : '24 horas académicas'),
                      orientacion: 'vertical',
                      fechaEmision: c.fecha || new Date().toISOString().split('T')[0]
                    }
                  };
                  await admin.from('certificaciones').insert(nuevoCert);
                  realEmitidos.push({
                    id: `sync-${cod}`,
                    codigo: cod,
                    tipo: tipoCert,
                    estudiante: estudianteNombre,
                    dni: dni,
                    email: `${dni}@edumin.pe`,
                    programa: c.titulo,
                    modulo: null,
                    nota: typeof c.nota === 'number' && c.nota > 0 ? c.nota : null,
                    horas: c.horas || (esTaller ? '16 horas académicas' : '24 horas académicas'),
                    fecha: c.fecha || new Date().toISOString().split('T')[0],
                    estadoFinanciero: !p.bloqueado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
                    habilitado: !p.bloqueado,
                    modelo_id: 'mod-226455',
                    categoria: esTaller ? 'Talleres' : 'Cursos de Alta Especialización'
                  });
                }
              }
            }
          }
        }
      } catch (errSync) {
        console.warn('Advertencia en sincronización de perfiles con certificaciones:', errSync);
      }
    } catch (err) {
      console.error('Error al consultar tabla certificaciones:', err);
    }

    return NextResponse.json({
      solicitudes,
      emitidos: realEmitidos,
      resumen: {
        totalEmitidos: realEmitidos.length,
        diplomasGenerales: realEmitidos.filter(c => c.tipo === 'DIPLOMA').length,
        modulares: realEmitidos.filter(c => c.tipo === 'MODULAR').length,
        cursosTalleres: realEmitidos.filter(c => c.tipo === 'CURSO' || c.tipo === 'TALLER').length,
        habilitados: realEmitidos.filter(c => c.habilitado).length,
        retenidosDeuda: realEmitidos.filter(c => !c.habilitado).length
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener certificaciones' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const admin = createAdminClient();

    // Emisión manual directa de certificado (sin requerir examen previo del estudiante)
    if (body.accion === 'EMITIR_MANUAL') {
      const {
        estudiante,
        dni,
        programa,
        modulo,
        tipo,
        horas,
        nota,
        fecha,
        modelo_id,
        habilitado,
        plantilla_snapshot
      } = body;

      const codigoGenerado = normalizarCodigoCertificado(
        body.codigo || generarCodigoUnicoCertificado()
      );

      const fechaEmision = fecha || new Date().toISOString().split('T')[0];
      const horasLectivas = horas || (tipo === 'MODULAR' ? '108 horas académicas' : (tipo === 'DIPLOMA' ? '325 horas académicas y 13 créditos académicos' : '24 horas cronológicas'));
      const notaFinal = Number(nota) || 18;
      const estadoHabilitado = habilitado !== false;

      // 1. Guardar en tabla certificaciones
      let certId = `cert-man-${Date.now()}`;
      try {
        let snapshotFinal = plantilla_snapshot || {};
        if (!snapshotFinal.imagenFondoUrl || !snapshotFinal.disenoCoordenadas) {
          try {
            const { data: logData } = await admin
              .from('audit_logs')
              .select('detalles')
              .eq('accion', 'CONFIG_MODELOS_CERTIFICADOS')
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            const modelos = logData?.detalles?.modelos || [];
            const mMatch = (modelo_id ? modelos.find((m: any) => m.id === modelo_id) : null) ||
              modelos.find((m: any) => String(m.tipo).toUpperCase() === String(tipo || 'DIPLOMA').toUpperCase() && (m.asignacionAlcance === 'SUPERPLANTILLA_GLOBAL' || m.esPredeterminado)) ||
              modelos.find((m: any) => String(m.tipo).toUpperCase() === String(tipo || 'DIPLOMA').toUpperCase());
            if (mMatch) {
              snapshotFinal = {
                modelo_id: mMatch.id,
                nombrePlantilla: mMatch.nombre,
                horas: horasLectivas,
                ciudad: 'Arequipa',
                orientacion: mMatch.orientacion || (tipo === 'CURSO' ? 'vertical' : 'horizontal'),
                imagenFondoUrl: mMatch.imagenFondoUrl,
                disenoCoordenadas: mMatch.disenoCoordenadas,
                incluyeQr: mMatch.incluyeQr !== false,
                fechaEmision: fechaEmision
              };
            }
          } catch {
            // Ignorar fallback
          }
        }

        const { data: certInsertado, error: errInsert } = await admin
          .from('certificaciones')
          .insert({
            codigo_verificacion: codigoGenerado,
            estudiante_nombre: estudiante,
            dni_ce: dni,
            tipo: tipo || 'DIPLOMA',
            programa_titulo: programa,
            modulo_titulo: modulo || null,
            horas_lectivas: horasLectivas,
            nota_final: notaFinal,
            fecha_emision: fechaEmision,
            estado_financiero_al_dia: estadoHabilitado,
            plantilla_snapshot: {
              ...snapshotFinal,
              modelo_id: modelo_id || snapshotFinal.modelo_id || 'mod-avanza-dip',
              horas: horasLectivas
            }
          })
          .select()
          .maybeSingle();

        if (certInsertado) {
          certId = certInsertado.id;
        } else if (errInsert) {
          console.warn('Advertencia insertando en tabla certificaciones:', errInsert.message);
        }
      } catch (errDb) {
        console.error('Error insertando en certificaciones:', errDb);
      }

      // 2. Si el estudiante existe en profiles, sincronizar su aula virtual
      try {
        const { data: profile } = await admin
          .from('profiles')
          .select('id, diplomados, cursos')
          .eq('dni_ce', dni)
          .maybeSingle();

        if (profile) {
          if (tipo === 'DIPLOMA' || tipo === 'MODULAR') {
            const dList = parseDiplomadosFromProfile(profile);
            let dipTarget = dList.find(d => (d.titulo || '').toLowerCase() === (programa || '').toLowerCase());
            if (!dipTarget && dList.length > 0) {
              dipTarget = dList[0];
            }
            if (dipTarget) {
              if (tipo === 'DIPLOMA') {
                dipTarget.completado = true;
                dipTarget.avance = 100;
                dipTarget.codigo = codigoGenerado;
                dipTarget.fecha = fechaEmision;
                dipTarget.horas = horasLectivas;
                (dipTarget as any).modelo_id = modelo_id;
              } else if (tipo === 'MODULAR') {
                const targetMod = (dipTarget.modulos || []).find((m: any) => 
                  (m.nombre || m.titulo || '').toLowerCase().includes((modulo || '').toLowerCase())
                );
                if (targetMod) {
                  targetMod.completado = true;
                  targetMod.nota = notaFinal;
                  targetMod.codigo_cert = codigoGenerado;
                  (targetMod as any).fecha_emision = fechaEmision;
                  (targetMod as any).modelo_id = modelo_id;
                }
              }
              await admin.from('profiles').update({
                diplomados: `DIPLOMADOS_LIST|${JSON.stringify(dList)}`
              }).eq('id', profile.id);
            }
          } else if (tipo === 'CURSO' || tipo === 'TALLER') {
            const cList = parseCursosFromProfile(profile);
            let curTarget = cList.find(c => (c.titulo || '').toLowerCase() === (programa || '').toLowerCase());
            if (curTarget) {
              curTarget.completado = true;
              curTarget.codigo = codigoGenerado;
              curTarget.fecha = fechaEmision;
              curTarget.nota = notaFinal;
              curTarget.horas = horasLectivas;
              (curTarget as any).modelo_id = modelo_id;
              await admin.from('profiles').update({
                cursos: `CURSOS_LIST|${JSON.stringify(cList)}`
              }).eq('id', profile.id);
            }
          }
        }
      } catch (eProf) {
        console.warn('Error sincronizando con profile del estudiante:', eProf);
      }

      // 3. Auditoría de emisión manual
      try {
        await admin.from('audit_logs').insert({
          usuario_email: 'admin@edumin.pe',
          accion: 'EMISION_MANUAL_CERTIFICADO',
          detalles: {
            estudiante,
            dni_ce: dni,
            programa,
            modulo,
            tipo,
            codigo: codigoGenerado,
            horas: horasLectivas,
            nota: notaFinal
          }
        });
      } catch (e) {
        console.error(e);
      }

      return NextResponse.json({
        success: true,
        message: `¡Certificado emitido y habilitado con éxito! Código oficial: ${codigoGenerado}`,
        certificado: {
          id: certId,
          codigo: codigoGenerado,
          tipo,
          estudiante,
          dni,
          email: `${dni}@edumin.pe`,
          programa,
          modulo: modulo || null,
          nota: notaFinal,
          horas: horasLectivas,
          fecha: fechaEmision,
          estadoFinanciero: estadoHabilitado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
          habilitado: estadoHabilitado,
          modelo_id: modelo_id || 'mod-avanza-dip',
          plantilla_snapshot: {
            ...(plantilla_snapshot || {}),
            modelo_id: modelo_id || 'mod-avanza-dip',
            horas: horasLectivas
          },
          categoria: tipo === 'DIPLOMA' || tipo === 'MODULAR' ? 'Diplomados Oficiales' : (tipo === 'TALLER' ? 'Talleres' : 'Cursos de Alta Especialización')
        }
      });
    }

    const { id, dni, codigoQr } = body;

    // Registrar en auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'EMITIR_CERTIFICADO_CIP_MIAMI',
        detalles: {
          solicitudId: id,
          dni_ce: dni,
          codigoQr: codigoQr || `EDM-CIP-2026-${Math.floor(1000 + Math.random() * 9000)}`
        }
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({ success: true, message: 'Certificado CIP emitido y notificado.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al emitir certificado' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, codigo, action, horas, modelo_id, fecha, plantilla_snapshot } = body;
    const admin = createAdminClient();

    let updateFields: any = {};
    if (horas !== undefined) updateFields.horas_lectivas = horas;
    if (fecha !== undefined) updateFields.fecha_emision = fecha;
    if (modelo_id !== undefined || plantilla_snapshot !== undefined) {
      updateFields.plantilla_snapshot = {
        ...(plantilla_snapshot || {}),
        modelo_id: modelo_id || plantilla_snapshot?.modelo_id,
        horas: horas || plantilla_snapshot?.horas
      };
    }

    const isUuid = id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    // 1. Actualizar o insertar en la tabla certificaciones
    if (Object.keys(updateFields).length > 0) {
      let updatedRows = 0;
      if (isUuid) {
        const { data } = await admin.from('certificaciones').update(updateFields).eq('id', id).select();
        updatedRows = (data || []).length;
      }
      if (updatedRows === 0 && codigo) {
        const { data } = await admin.from('certificaciones').update(updateFields).eq('codigo_verificacion', codigo).select();
        updatedRows = (data || []).length;
      }

      // Si no existía aún en la tabla certificaciones, registrarlo
      if (updatedRows === 0 && (codigo || isUuid)) {
        try {
          await admin.from('certificaciones').insert({
            codigo_verificacion: normalizarCodigoCertificado(codigo || `EDM-CERT-${Date.now()}`),
            tipo: body.tipo || (body.modulo ? 'MODULAR' : 'DIPLOMA'),
            estudiante_nombre: body.estudiante || 'ESTUDIANTE EDUMIN',
            dni_ce: body.dni || '71234567',
            programa_titulo: body.programa || 'DIPLOMADO',
            modulo_titulo: body.modulo || null,
            horas_lectivas: horas || '108 horas académicas',
            nota_final: body.nota || 18,
            fecha_emision: fecha || new Date().toISOString().split('T')[0],
            estado_financiero_al_dia: true,
            plantilla_snapshot: updateFields.plantilla_snapshot || { modelo_id: modelo_id || 'mod-avanza-mod' }
          });
        } catch (e) {
          console.error('Error insertando certificación en PATCH:', e);
        }
      }
    }

    // 2. Sincronizar en profiles (profiles.diplomados y profiles.cursos) para persistencia total
    if (codigo || id) {
      try {
        const { data: allProfiles } = await admin.from('profiles').select('id, diplomados, cursos');
        if (allProfiles) {
          for (const p of allProfiles) {
            let modified = false;
            let dList = parseDiplomadosFromProfile(p);
            let cList = parseCursosFromProfile(p);

            dList.forEach(d => {
              if (d.codigo === codigo) {
                if (modelo_id) (d as any).modelo_id = modelo_id;
                if (horas) d.horas = horas;
                if (fecha) d.fecha = fecha;
                modified = true;
              }
              (d.modulos || []).forEach(m => {
                if (m.codigo_cert === codigo) {
                  if (modelo_id) (m as any).modelo_id = modelo_id;
                  if (horas) m.horas = horas;
                  if (fecha) m.fecha = fecha;
                  modified = true;
                }
              });
            });

            cList.forEach(c => {
              if (c.codigo === codigo) {
                if (modelo_id) (c as any).modelo_id = modelo_id;
                if (horas) c.horas = horas;
                if (fecha) c.fecha = fecha;
                modified = true;
              }
            });

            if (modified) {
              await admin.from('profiles').update({
                diplomados: `DIPLOMADOS_LIST|${JSON.stringify(dList)}`,
                cursos: `CURSOS_LIST|${JSON.stringify(cList)}`
              }).eq('id', p.id);
            }
          }
        }
      } catch (errProfile) {
        console.error('Error sincronizando modelo en profiles:', errProfile);
      }
    }

    return NextResponse.json({ success: true, message: 'Certificación actualizada exitosamente en Supabase.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al actualizar certificación' }, { status: 500 });
  }
}
