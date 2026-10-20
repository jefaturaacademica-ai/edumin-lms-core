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

    // 2. Incorporar dinámicamente certificaciones de TODOS los estudiantes en Supabase (evitando duplicados)
    if (profiles && profiles.length > 0) {
      let counter = 100;
      for (const p of profiles) {
        const estudiante = formatearNombreCertificado(p.nombres, p.apellidos);
        const dni = p.dni_ce || '00000000';
        const email = p.email || `${dni}@edumin.pe`;
        const habilitado = !p.bloqueado;

        // Parse Diplomados
        const dList = parseDiplomadosFromProfile(p);
        for (const d of dList) {
          // Solo consideramos módulos aprobados con nota >= 12
          const modulosAprobados = (d.modulos || []).filter((m: any) => {
            const nota = m.nota !== undefined ? Number(m.nota) : (m.completado ? 18 : 0);
            return Boolean(m.completado) && nota >= 12;
          });
          const modularesAprobadosCount = modulosAprobados.length;
          const esDiplomaGeneral = modularesAprobadosCount >= 3;

          // Diploma general SOLO si aprueba los 3 módulos con nota >= 12
          if (esDiplomaGeneral) {
            counter++;
            const codDiploma = normalizarCodigoCertificado(d.codigo || generarCodigoUnicoCertificado());
            const keyUnica = `${dni}-DIPLOMA-${d.titulo || d.slug || 'DIP'}-GENERAL`;

            if (!codigosExistentes.has(codDiploma) && !codigosExistentes.has(keyUnica)) {
              codigosExistentes.add(codDiploma);
              codigosExistentes.add(keyUnica);

              const sumaNotas = modulosAprobados.reduce((sum: number, m: any) => sum + (Number(m.nota) || 18), 0);
              const promedio = modularesAprobadosCount > 0 ? Number((sumaNotas / modularesAprobadosCount).toFixed(1)) : 18;
              const fechaEmision = d.fecha || new Date().toISOString().split('T')[0];
              const horasDiploma = d.horas || '325 horas académicas y 13 créditos académicos';

              realEmitidos.push({
                id: `cert-dip-${dni}-${d.id || counter}`,
                codigo: codDiploma,
                tipo: 'DIPLOMA',
                estudiante,
                dni,
                email,
                programa: d.titulo || 'DIPLOMADO OFICIAL',
                modulo: null,
                nota: d.promedio || promedio,
                horas: horasDiploma,
                fecha: fechaEmision,
                estadoFinanciero: habilitado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
                habilitado,
                modelo_id: (d as any).modelo_id || 'mod-avanza-dip',
                categoria: 'Diplomados Oficiales'
              });

              // Sincronizar en DB si no existía
              try {
                await admin.from('certificaciones').insert({
                  codigo_verificacion: codDiploma,
                  profile_id: p.id,
                  dni_ce: dni,
                  estudiante_nombre: estudiante,
                  tipo: 'DIPLOMA',
                  programa_titulo: d.titulo || 'DIPLOMADO OFICIAL',
                  modulo_titulo: null,
                  horas_lectivas: horasDiploma,
                  nota_final: promedio,
                  fecha_emision: fechaEmision,
                  estado_financiero_al_dia: habilitado,
                  plantilla_snapshot: {
                    modelo_id: (d as any).modelo_id || 'mod-avanza-dip',
                    nombrePlantilla: 'Modelo Oficial Avanza & EDUMIN - Diploma de Alta Especialización',
                    horas: horasDiploma,
                    ciudad: 'Arequipa'
                  }
                });
              } catch (e) {
                // Ignore sync insert error
              }
            }
          }

          // Modulares completados y aprobados (nota >= 12)
          for (let mIdx = 0; mIdx < (d.modulos || []).length; mIdx++) {
            const m = d.modulos[mIdx];
            const nota = m.nota !== undefined ? Number(m.nota) : (m.completado ? 18 : 0);
            if (Boolean(m.completado) && nota >= 12) {
              counter++;
              const moduloNombreStr = m.nombre && m.nombre !== m.codigo 
                ? `${m.codigo || `Módulo 0${mIdx + 1}`}: ${m.nombre}` 
                : (m.nombre || m.codigo || `Módulo 0${mIdx + 1}`);
              const codModular = normalizarCodigoCertificado(m.codigo_cert || generarCodigoUnicoCertificado());
              const keyModular = `${dni}-MODULAR-${d.titulo || d.slug}-${m.codigo || moduloNombreStr}`;

              if (!codigosExistentes.has(codModular) && !codigosExistentes.has(keyModular)) {
                codigosExistentes.add(codModular);
                codigosExistentes.add(keyModular);

                const fechaModular = m.fecha || new Date().toISOString().split('T')[0];
                const horasModular = m.horas || '108 horas académicas';

                realEmitidos.push({
                  id: `cert-mod-${dni}-${mIdx + 1}-${counter}`,
                  codigo: codModular,
                  tipo: 'MODULAR',
                  estudiante,
                  dni,
                  email,
                  programa: d.titulo,
                  modulo: moduloNombreStr,
                  nota: nota,
                  horas: horasModular,
                  fecha: fechaModular,
                  estadoFinanciero: habilitado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
                  habilitado,
                  modelo_id: (m as any).modelo_id || 'mod-avanza-mod',
                  categoria: 'Diplomados Oficiales'
                });

                // Sincronizar en DB si no existía
                try {
                  await admin.from('certificaciones').insert({
                    codigo_verificacion: codModular,
                    profile_id: p.id,
                    dni_ce: dni,
                    estudiante_nombre: estudiante,
                    tipo: 'MODULAR',
                    programa_titulo: d.titulo,
                    modulo_titulo: moduloNombreStr,
                    horas_lectivas: horasModular,
                    nota_final: nota,
                    fecha_emision: fechaModular,
                    estado_financiero_al_dia: habilitado,
                    plantilla_snapshot: {
                      modelo_id: (m as any).modelo_id || 'mod-avanza-mod',
                      nombrePlantilla: 'Modelo Oficial Avanza & EDUMIN - Certificado Modular',
                      horas: horasModular,
                      ciudad: 'Arequipa'
                    }
                  });
                } catch (e) {
                  // Ignore sync insert error
                }
              }
            }
          }
        }

        // Parse Cursos
        const cList = parseCursosFromProfile(p);
        cList.forEach((c: any, cIdx: number) => {
          if (c.completado) {
            counter++;
            const esTaller = (c.categoria || '').toLowerCase().includes('taller') || (c.id || '').includes('taller');
            const codCurso = normalizarCodigoCertificado(c.codigo || generarCodigoUnicoCertificado());
            const keyCurso = `${dni}-${esTaller ? 'TALLER' : 'CURSO'}-${c.titulo}`;

            if (!codigosExistentes.has(codCurso) && !codigosExistentes.has(keyCurso)) {
              codigosExistentes.add(codCurso);
              codigosExistentes.add(keyCurso);

              realEmitidos.push({
                id: `cert-cur-${dni}-${cIdx + 1}-${counter}`,
                codigo: codCurso,
                tipo: esTaller ? 'TALLER' : 'CURSO',
                estudiante,
                dni,
                email,
                programa: c.titulo,
                modulo: null,
                nota: Number(c.nota) || 18,
                horas: c.horas || '24 horas cronológicas',
                fecha: c.fecha || '2026-02-18',
                estadoFinanciero: habilitado ? 'AL_DIA' : 'DEUDA_PENDIENTE',
                habilitado,
                modelo_id: (c as any).modelo_id || 'mod-03',
                categoria: esTaller ? 'Talleres' : 'Cursos de Alta Especialización'
              });
            }
          }
        });
      }
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
    const { id, dni, codigoQr } = body;

    const admin = createAdminClient();

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
    } catch (e: any) {
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
