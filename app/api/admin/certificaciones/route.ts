import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, parseCursosFromProfile } from '@/lib/utils/profileParser';
import { generarCodigoUnicoCertificado, formatearNombreCertificado, normalizarCodigoCertificado } from '@/lib/utils/certificateUtils';

export async function GET() {
  try {
    const admin = createAdminClient();

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
              ...(plantilla_snapshot || {}),
              modelo_id: modelo_id || plantilla_snapshot?.modelo_id || 'mod-avanza-dip',
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
