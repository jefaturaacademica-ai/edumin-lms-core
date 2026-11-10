import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  parseDiplomadosFromProfile,
  parseCursosFromProfile,
  parseCreditosExtraFromProfile,
  parseCuposCreditosFromProfile,
  buildUpdatedCuposCreditos,
  getPrimaryRoleFromProfile,
  filtrarCursosReales,
  DiplomadoJSON
} from '@/lib/utils/profileParser';
import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';
import { obtenerTallerParaDiplomado, TALLER_SOFT_SKILLS, TALLER_SEGURIDAD_BASADA } from '@/lib/utils/tallerAsignado';
import fs from 'fs';
import path from 'path';

function normKey(s?: string | null): string {
  if (!s) return '';
  return String(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function stripDipPrefixNorm(s?: string | null): string {
  return normKey(s).replace(/^(diplomado-en-|especialista-en-)/, '');
}

function parseCreditoRow(pag: any, auditLogs: any[]) {
  if (typeof pag.metodo === 'string' && pag.metodo.startsWith('CARGO_EXTRA|')) {
    const concepto = pag.metodo.replace('CARGO_EXTRA|', '');
    return {
      id: pag.id,
      profile_id: pag.profile_id,
      dni_ce: pag.dni_ce,
      is_cargo_extra: true,
      concepto,
      nro_cuota: `Cargo Extra (${concepto})`,
      num_credito: 99,
      monto: Number(pag.monto || 0),
      metodo: 'Yape / Plin',
      estado: pag.estado || 'APROBADO',
      created_at: pag.created_at,
      cuotas: [],
      total_pagado: Number(pag.monto || 0),
      total_deuda: 0
    };
  }

  let num_credito = pag.num_credito || 1;
  let cuotas = [
    pag.cuota_01 || pag['cuota 01'] || '0',
    pag.cuota_02 || pag['cuota 02'] || 'no corresponde',
    pag.cuota_03 || pag['cuota 03'] || 'no corresponde',
    pag.cuota_04 || pag['cuota 04'] || 'no corresponde',
    pag.cuota_05 || pag['cuota 05'] || 'no corresponde',
    pag.cuota_06 || pag['cuota 06'] || 'no corresponde'
  ];
  let total_pagado = Number(pag.total_pagado || pag['total pagado'] || 0);
  let explicitDeuda: number | undefined = undefined;
  let parsedFromMetodo = false;

  if (typeof pag.metodo === 'string' && pag.metodo.startsWith('CREDITO_')) {
    try {
      const jsonStr = pag.metodo.substring(pag.metodo.indexOf('|') + 1).trim();
      const parsed = JSON.parse(jsonStr);
      num_credito = parsed.num_credito || num_credito;
      if (Array.isArray(parsed.cuotas)) {
        cuotas = parsed.cuotas;
        parsedFromMetodo = true;
      }
      if (parsed.total_pagado !== undefined) {
        total_pagado = Number(parsed.total_pagado);
      }
      if (parsed.total_deuda !== undefined) {
        explicitDeuda = Number(parsed.total_deuda);
      }
    } catch {
      // ignore
    }
  }

  if (!parsedFromMetodo) {
    const auditEntry = (auditLogs || []).find((a: any) => a.detalles?.pago_id === pag.id);
    if (auditEntry?.detalles) {
      num_credito = auditEntry.detalles.num_credito || num_credito;
      cuotas = auditEntry.detalles.cuotas || cuotas;
      if (auditEntry.detalles.total_pagado !== undefined) total_pagado = Number(auditEntry.detalles.total_pagado);
      if (auditEntry.detalles.total_deuda !== undefined) explicitDeuda = Number(auditEntry.detalles.total_deuda);
    }
  }

  if (Array.isArray(cuotas)) {
    const sumCuotasPagadas = cuotas.reduce((sum: number, val: string) => {
      return val !== 'no corresponde' ? sum + (Number(val) || 0) : sum;
    }, 0);
    if (sumCuotasPagadas > 0 || total_pagado === 0) {
      total_pagado = sumCuotasPagadas;
    }
  }

  let total_deuda = explicitDeuda !== undefined
    ? explicitDeuda
    : Math.max(0, Number(pag.monto || 0) - total_pagado);

  const montoTotal = Math.max(Number(pag.monto || 0), total_pagado + total_deuda);

  return {
    id: pag.id,
    profile_id: pag.profile_id,
    dni_ce: pag.dni_ce,
    num_credito,
    monto: montoTotal,
    metodo: pag.metodo && !pag.metodo.startsWith('CREDITO_') ? pag.metodo : 'Por Pagar',
    estado: total_deuda === 0 ? 'Completado' : (pag.estado || 'Pendiente'),
    created_at: pag.created_at,
    cuotas,
    'cuota 01': cuotas[0],
    'cuota 02': cuotas[1],
    'cuota 03': cuotas[2],
    'cuota 04': cuotas[3],
    'cuota 05': cuotas[4],
    'cuota 06': cuotas[5],
    cuota_01: cuotas[0],
    cuota_02: cuotas[1],
    cuota_03: cuotas[2],
    cuota_04: cuotas[3],
    cuota_05: cuotas[4],
    cuota_06: cuotas[5],
    total_pagado,
    total_deuda,
    'total pagado': total_pagado,
    'total deuda': total_deuda
  };
}

export async function GET() {
  try {
    const admin = createAdminClient();
    
    // Consultar perfiles activos (estudiantes o cuentas administrativas con acceso dual)
    const { data: rawProfiles, error } = await admin
      .from('profiles')
      .select('*')
      .order('nombres', { ascending: true });

    if (error) {
      console.error('Error al consultar profiles:', error);
      return NextResponse.json({ estudiantes: [], error: error.message }, { status: 500 });
    }

    const profiles = (rawProfiles || []).filter((p: any) => {
      const rolesObj = p.roles && typeof p.roles === 'object' ? p.roles : null;
      if (rolesObj) {
        return rolesObj.academico === 'ESTUDIANTE' || Boolean(rolesObj.administrativo);
      }
      return Boolean(p.paquete_adquirido);
    });

    // Consultar filas de créditos y cargos en public.pagos
    const { data: pagos } = await admin
      .from('pagos')
      .select('*')
      .order('created_at', { ascending: true });

    // Consultar logs de audit para metadata de créditos
    const { data: auditLogs } = await admin
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false });

    // Consultar notas_modulos y catálogo oficial para enriquecer notas e intentos de examen (diplomados, cursos y talleres)
    const [{ data: notasModulosRows }, { data: catalogoRows }] = await Promise.all([
      admin
        .from('notas_modulos')
        .select('id, dni_ce, diplomado_numero, diplomado_nombre, tipo_programa, modulo_numero, modulo_nombre, nota, estado, updated_at')
        .order('updated_at', { ascending: false }),
      admin
        .from('diplomados_y_cursos')
        .select('id, codigo, titulo, tipo')
    ]);

    const notasPorDni = new Map<string, any[]>();
    (notasModulosRows || []).forEach((n: any) => {
      const k = String(n.dni_ce || '').trim();
      if (!k) return;
      if (!notasPorDni.has(k)) notasPorDni.set(k, []);
      notasPorDni.get(k)!.push(n);
    });

    const catalogoByTitulo = new Map<string, any>();
    (catalogoRows || []).forEach((c: any) => {
      if (c.titulo) {
        catalogoByTitulo.set(normKey(c.titulo), c);
        catalogoByTitulo.set(stripDipPrefixNorm(c.titulo), c);
      }
    });

    // Mapear estudiantes con soporte de múltiples créditos
    const estudiantes = (profiles || []).map((p: any) => {
      const esContado = String(p.paquete_adquirido || '').includes('CONTADO') || p.tipo_pago === 'CONTADO';

      const rawPagosAlumno = (pagos || []).filter((pag: any) => pag.profile_id === p.id || pag.dni_ce === p.dni_ce);

      const parsedRows = rawPagosAlumno.map((pag: any) => parseCreditoRow(pag, auditLogs || []));
      
      const creditosAlumno = parsedRows.filter((r: any) => !r.is_cargo_extra);
      creditosAlumno.sort((a, b) => a.num_credito - b.num_credito);

      const cargosExtras = parsedRows.filter((r: any) => r.is_cargo_extra);

      if (creditosAlumno.length === 0) {
        const montoBase = esContado ? (p.paquete_adquirido === 'ILIMITADO' ? 1500 : 900) : (p.paquete_adquirido === 'ILIMITADO' ? 1500 : p.paquete_adquirido === 'FULL' ? 900 : 540);
        const cuotasDefault = esContado ? ['0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'] : ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'];
        creditosAlumno.push({
          id: `sim-credito-${p.dni_ce}-1`,
          profile_id: p.id,
          dni_ce: p.dni_ce,
          num_credito: 1,
          monto: montoBase,
          metodo: 'Por Pagar',
          estado: 'Pendiente',
          created_at: new Date().toISOString(),
          cuotas: cuotasDefault,
          'cuota 01': cuotasDefault[0],
          'cuota 02': cuotasDefault[1],
          'cuota 03': cuotasDefault[2],
          'cuota 04': cuotasDefault[3],
          'cuota 05': cuotasDefault[4],
          'cuota 06': cuotasDefault[5],
          cuota_01: cuotasDefault[0],
          cuota_02: cuotasDefault[1],
          cuota_03: cuotasDefault[2],
          cuota_04: cuotasDefault[3],
          cuota_05: cuotasDefault[4],
          cuota_06: cuotasDefault[5],
          total_pagado: 0,
          total_deuda: montoBase,
          'total pagado': 0,
          'total deuda': montoBase
        });
      }

      const montoTotalPrograma = creditosAlumno.reduce((acc, c) => acc + c.monto, 0);
      const montoTotalPagado = creditosAlumno.reduce((acc, c) => acc + c.total_pagado, 0);
      const deudaTotalPendiente = creditosAlumno.reduce((acc, c) => acc + c.total_deuda, 0);

      const totalCuotasAplicables = creditosAlumno.reduce((acc, c) => acc + c.cuotas.filter(val => val !== 'no corresponde').length, 0);
      const cuotasPagadas = creditosAlumno.reduce((acc, c) => acc + c.cuotas.filter(val => val !== 'no corresponde' && Number(val) > 0).length, 0);
      const cuotasPendientes = Math.max(0, totalCuotasAplicables - cuotasPagadas);

      // Mapeo detallado de historial de transacciones individuales
      const historialTransacciones: any[] = [];
      creditosAlumno.forEach((cred: any) => {
        (cred.cuotas || []).forEach((cVal: string, cIdx: number) => {
          if (cVal !== 'no corresponde' && Number(cVal) > 0) {
            historialTransacciones.push({
              id: cred.id,
              dni_ce: p.dni_ce,
              estudiante_nombre: `${p.nombres} ${p.apellidos}`,
              num_credito: cred.num_credito,
              cuota_index: cIdx,
              nro_cuota: `Cuota 0${cIdx + 1} de 0${cred.cuotas.filter((x: string) => x !== 'no corresponde').length}`,
              concepto: `Cuota 0${cIdx + 1} - ${p.diplomado_1 || 'Programa'}`,
              monto: Number(cVal),
              metodo: 'Yape / Plin',
              comprobante: `OP-CUOTA-0${cIdx + 1}`,
              fecha: cred.created_at,
              estado: 'APROBADO'
            });
          }
        });
      });

      cargosExtras.forEach((cg: any) => {
        historialTransacciones.push({
          id: cg.id,
          dni_ce: p.dni_ce,
          estudiante_nombre: `${p.nombres} ${p.apellidos}`,
          is_cargo_extra: true,
          nro_cuota: `Cargo Extra (${cg.concepto})`,
          concepto: cg.concepto || 'Examen Sustitutorio',
          monto: Number(cg.monto || 0),
          metodo: 'Yape / Plin',
          comprobante: `OP-CARGO-${cg.id.substring(0, 6)}`,
          fecha: cg.created_at,
          estado: cg.estado || 'APROBADO'
        });
      });

      let estado = 'Al Día';
      if (deudaTotalPendiente === 0 || (esContado && cuotasPagadas >= 1)) {
        estado = 'Constancia de no adeudo';
      } else if (p.bloqueado) {
        estado = 'Bloqueado por Sistema';
      } else if (p.prorroga_hasta) {
        const fechaProrroga = new Date(p.prorroga_hasta);
        const hoy = new Date();
        estado = fechaProrroga >= hoy ? 'Prórroga Activa' : 'Prórroga Vencida';
      } else if (cuotasPendientes > 0) {
        estado = 'Deuda Activa';
      }

      let nivelRiesgoChurn = 'BAJO';
      if (p.bloqueado || estado === 'Prórroga Vencida') {
        nivelRiesgoChurn = 'CRÍTICO';
      } else if (cuotasPendientes >= 2) {
        nivelRiesgoChurn = 'ALTO';
      } else if (cuotasPendientes === 1) {
        nivelRiesgoChurn = 'MEDIO';
      }

      // Parser JSON de Diplomados y Cursos
      const parsedDiplomados = parseDiplomadosFromProfile(p);
      const cupos = parseCuposCreditosFromProfile(p);
      const parsedCursos = parseCursosFromProfile(p);
      const notasAlumno = notasPorDni.get(String(p.dni_ce || '').trim()) || [];

      // Enriquecer módulos de diplomados con intentos reales guardados en notas_modulos
      parsedDiplomados.forEach((d: any) => {
        const catDip = catalogoByTitulo.get(normKey(d.titulo)) || catalogoByTitulo.get(stripDipPrefixNorm(d.titulo));
        if (catDip?.titulo) d.titulo = catDip.titulo;
        if (!d.codigo && catDip?.codigo) d.codigo = catDip.codigo;
        const dipCodeNorm = normKey(d.codigo || catDip?.codigo);
        const dipTitleNorm = stripDipPrefixNorm(d.titulo);

        if (Array.isArray(d.modulos)) {
          d.modulos.forEach((m: any, mIdx: number) => {
            const modNum = mIdx + 1;
            const modCodeNorm = normKey(m.codigo || m.id);
            const notaMatch = notasAlumno.find((n: any) => {
              const tipo = String(n.tipo_programa || '').toLowerCase();
              const numUpper = String(n.diplomado_numero || '').toUpperCase();
              if (tipo && tipo !== 'diplomado' && !numUpper.startsWith('DIP')) return false;
              const matchesDip =
                (dipCodeNorm && normKey(n.diplomado_numero) === dipCodeNorm) ||
                (dipTitleNorm && stripDipPrefixNorm(n.diplomado_nombre) === dipTitleNorm);
              if (!matchesDip) return false;
              return (
                Number(n.modulo_numero) === modNum ||
                (modCodeNorm && normKey(n.modulo_nombre) === modCodeNorm)
              );
            });

            if (notaMatch) {
              m.nota = Number(notaMatch.nota ?? m.nota ?? 0);
              (m as any).rendido = true;
              m.completado = Boolean(m.completado || notaMatch.estado === 'APROBADO' || Number(notaMatch.nota) >= 12);
              (m as any).fecha_examen = notaMatch.updated_at;
            }
          });
        }
      });

      // Enriquecer cursos y talleres con código oficial del catálogo y sus intentos en notas_modulos
      parsedCursos.forEach((c: any) => {
        const prevCodeNorm = normKey(c.codigo);
        const catItem = catalogoByTitulo.get(normKey(c.titulo)) || catalogoByTitulo.get(stripDipPrefixNorm(c.titulo));
        if (catItem) {
          if (catItem.codigo) c.codigo = catItem.codigo;
          if (!c.id && catItem.id) c.id = catItem.id;
          if (!c.tipo && catItem.tipo) c.tipo = catItem.tipo.toUpperCase();
        }
        const cCodeNorm = normKey(c.codigo);
        const cIdNorm = normKey(c.id);
        const cTitleNorm = normKey(c.titulo);

        const notaMatch = notasAlumno.find((n: any) => {
          const nNumNorm = normKey(n.diplomado_numero);
          const nTitleNorm = normKey(n.diplomado_nombre);
          return (
            (cCodeNorm && nNumNorm === cCodeNorm) ||
            (prevCodeNorm && nNumNorm === prevCodeNorm) ||
            (cIdNorm && nNumNorm === cIdNorm) ||
            (cTitleNorm && nTitleNorm === cTitleNorm)
          );
        });

        if (notaMatch) {
          c.nota = Number(notaMatch.nota ?? c.nota ?? 0);
          (c as any).rendido = true;
          c.completado = Boolean(c.completado || notaMatch.estado === 'APROBADO' || Number(notaMatch.nota) >= 12);
          (c as any).fecha_examen = notaMatch.updated_at;
        }
      });

      const diplomadosLista = parsedDiplomados.map(d => d.titulo);

      // Avance real calculado desde módulos completados del diplomado principal
      const dipPrincipal = parsedDiplomados[0];
      let avanceCalculado = 0;
      if (dipPrincipal && Array.isArray(dipPrincipal.modulos) && dipPrincipal.modulos.length > 0) {
        const completados = dipPrincipal.modulos.filter(m => m.completado).length;
        avanceCalculado = Math.round((completados / dipPrincipal.modulos.length) * 100);
      } else {
        avanceCalculado = p.avance_porcentaje ?? 0;
      }

      return {
        id: p.id,
        dni_ce: p.dni_ce,
        nombres: p.nombres,
        apellidos: p.apellidos,
        email: p.email,
        telefono: p.telefono || 'Sin teléfono',
        role: getPrimaryRoleFromProfile(p),
        roles: p.roles || null,
        paquete_adquirido: p.paquete_adquirido || 'FULL',
        cuotas_pagadas: cuotasPagadas,
        cuotas_totales: totalCuotasAplicables,
        monto_cuota: creditosAlumno[0] ? (creditosAlumno[0].monto / Math.max(1, creditosAlumno[0].cuotas.filter(x => x !== 'no corresponde').length)) : 180,
        monto_total_programa: montoTotalPrograma,
        monto_total_pagado: montoTotalPagado,
        deuda_total_pendiente: deudaTotalPendiente,
        cuotas_pendientes: cuotasPendientes,
        estado,
        bloqueado: Boolean(p.bloqueado),
        prorroga_hasta: p.prorroga_hasta || null,
        nivel_riesgo_churn: nivelRiesgoChurn,
        diplomado_actual: parsedDiplomados[0]?.titulo || 'DERECHO MINERO',
        diplomados_json: parsedDiplomados,
        cursos_json: parsedCursos,
        diplomados_lista: diplomadosLista,
        cupos_creditos: cupos,
        creditos_extra_diplomados: cupos.diplomados.adicionales,
        creditos_extra_cursos: cupos.cursos.adicionales,
        fecha_nacimiento: p.fecha_nacimiento || null,
        avance_porcentaje: avanceCalculado,
        nota_promedio: p.nota_promedio ?? 0,
        ultima_conexion: p.ultima_conexion || 'Hace 1 hora',
        dias_inactivo: p.dias_inactivo ?? (p.bloqueado ? 14 : 1),
        mes_inscripcion: p.mes_inscripcion || 'septiembre',
        canal_adquisicion: p.canal_adquisicion || 'Facebook Ads',
        creditos: creditosAlumno,
        cargos_extras: cargosExtras,
        historial_pagos: historialTransacciones
      };
    });

    return NextResponse.json({ estudiantes });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener estudiantes' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { studentId, dni_ce, action, diplomados, cursos } = body;

    const admin = createAdminClient();

    if (action === 'update_perfil') {
      const { nombres, apellidos, new_dni_ce, email, telefono, fecha_nacimiento, paquete_adquirido, bloqueado, prorroga_hasta, role } = body;

      let profileQuery = admin.from('profiles').select('*');
      if (studentId) profileQuery = profileQuery.eq('id', studentId);
      else if (dni_ce) profileQuery = profileQuery.eq('dni_ce', dni_ce);
      else return NextResponse.json({ error: 'Se requiere studentId o dni_ce.' }, { status: 400 });

      const { data: currentProfile, error: pErr } = await profileQuery.maybeSingle();
      if (pErr || !currentProfile) {
        return NextResponse.json({ error: 'Perfil de estudiante no encontrado.' }, { status: 404 });
      }

      const updateData: any = {};
      if (nombres !== undefined) updateData.nombres = String(nombres).trim();
      if (apellidos !== undefined) updateData.apellidos = String(apellidos).trim();
      if (new_dni_ce !== undefined) updateData.dni_ce = String(new_dni_ce).trim();
      if (email !== undefined) updateData.email = String(email).trim().toLowerCase();
      if (telefono !== undefined) updateData.telefono = String(telefono).trim();
      if (fecha_nacimiento !== undefined) updateData.fecha_nacimiento = fecha_nacimiento ? String(fecha_nacimiento).trim() : null;
      if (paquete_adquirido !== undefined) updateData.paquete_adquirido = String(paquete_adquirido).trim().toUpperCase();
      if (bloqueado !== undefined) updateData.bloqueado = Boolean(bloqueado);
      if (prorroga_hasta !== undefined) updateData.prorroga_hasta = prorroga_hasta || null;
      if (role !== undefined && ['ESTUDIANTE', 'ADMIN', 'DOCENTE', 'SUPERADMIN'].includes(String(role).trim().toUpperCase())) {
        const upperRole = String(role).trim().toUpperCase();
        const curRoles = (currentProfile.roles && typeof currentProfile.roles === 'object') ? currentProfile.roles : {};
        updateData.roles = {
          administrativo: (upperRole === 'ADMIN' || upperRole === 'SUPERADMIN') ? upperRole : null,
          academico: upperRole === 'DOCENTE' ? 'DOCENTE' : (curRoles.academico || 'ESTUDIANTE'),
        };
      }

      const { data: updated, error: updateErr } = await admin
        .from('profiles')
        .update(updateData)
        .eq('id', currentProfile.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: `Error al actualizar perfil: ${updateErr.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, estudiante: updated });
    }

    if (action === 'update_creditos_extra') {
      const { creditos_extra_diplomados, creditos_extra_cursos } = body;

      let profileQuery = admin.from('profiles').select('*');
      if (studentId) profileQuery = profileQuery.eq('id', studentId);
      else if (dni_ce) profileQuery = profileQuery.eq('dni_ce', dni_ce);
      else return NextResponse.json({ error: 'Se requiere studentId o dni_ce.' }, { status: 400 });

      const { data: currentProfile, error: pErr } = await profileQuery.maybeSingle();
      if (pErr || !currentProfile) {
        return NextResponse.json({ error: 'Perfil de estudiante no encontrado.' }, { status: 404 });
      }

      const diplomadosListJson = parseDiplomadosFromProfile(currentProfile);
      const extraDip = Math.max(0, Number(creditos_extra_diplomados) || 0);
      const extraCur = Math.max(0, Number(creditos_extra_cursos) || 0);

      const nuevosCuposCreditos = buildUpdatedCuposCreditos(currentProfile, {
        diplomadosAdicionales: extraDip,
        cursosAdicionales: extraCur,
      });

      const { data: updated, error: updateErr } = await admin
        .from('profiles')
        .update({
          cupos_creditos: nuevosCuposCreditos,
          diplomados: `DIPLOMADOS_LIST|${JSON.stringify(diplomadosListJson)}`
        })
        .eq('id', currentProfile.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: `Error al actualizar créditos adicionales: ${updateErr.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, estudiante: updated });
    }

    if (action === 'update_diplomados') {
      let profileQuery = admin.from('profiles').select('*');
      if (studentId) profileQuery = profileQuery.eq('id', studentId);
      else if (dni_ce) profileQuery = profileQuery.eq('dni_ce', dni_ce);
      else return NextResponse.json({ error: 'Se requiere studentId o dni_ce.' }, { status: 400 });

      const { data: currentProfile, error: pErr } = await profileQuery.maybeSingle();
      if (pErr || !currentProfile) {
        return NextResponse.json({ error: 'Perfil de estudiante no encontrado.' }, { status: 404 });
      }

      const existingDiplomados = parseDiplomadosFromProfile(currentProfile);
      const existingMap = new Map<string, DiplomadoJSON>();
      existingDiplomados.forEach(d => {
        if (d.titulo) {
          existingMap.set(normKey(d.titulo), d);
          existingMap.set(stripDipPrefixNorm(d.titulo), d);
        }
        if (d.slug) existingMap.set(stripDipPrefixNorm(d.slug), d);
        if (d.id) existingMap.set(stripDipPrefixNorm(d.id), d);
      });

      let diplomadosListJson: DiplomadoJSON[] = [];

      if (Array.isArray(diplomados)) {
        diplomadosListJson = diplomados.map((titleStr: string) => {
          const title = String(titleStr).trim();
          const key = normKey(title);
          const strippedKey = stripDipPrefixNorm(title);
          const matchedExisting = existingMap.get(key) || existingMap.get(strippedKey);
          if (matchedExisting) {
            return {
              ...matchedExisting,
              titulo: title.replace(/^DIPLOMADO EN\s+/i, '').trim().toUpperCase()
            };
          }
          const matchedData = getDiplomadoByTitleOrSlug(title);
          const matchedTitle = matchedData?.titulo || title;
          const matchedSlug = matchedData?.slug || key;
          const modulosList = matchedData?.modulos && matchedData.modulos.length > 0
            ? matchedData.modulos.map((m: any, mIdx: number) => ({
                id: m.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
                codigo: m.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
                nombre: m.nombre || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
                nota: 0,
                completado: false
              }))
            : [
                { id: 'mod-01', codigo: 'Módulo 01', nombre: `Módulo 01 de ${matchedTitle}`, nota: 0, completado: false },
                { id: 'mod-02', codigo: 'Módulo 02', nombre: `Módulo 02 de ${matchedTitle}`, nota: 0, completado: false },
                { id: 'mod-03', codigo: 'Módulo 03', nombre: `Módulo 03 de ${matchedTitle}`, nota: 0, completado: false }
              ];

          return {
            id: matchedSlug,
            slug: matchedSlug,
            titulo: matchedTitle,
            avance: 0,
            modulos: modulosList
          };
        });
      }

      const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosListJson)}`;
      const nuevosCuposCreditos = buildUpdatedCuposCreditos(currentProfile, {
        diplomadosCanjeados: diplomadosListJson.length
      });

      const { data: updated, error: updateErr } = await admin
        .from('profiles')
        .update({
          diplomados: diplomadosSerialized,
          cupos_creditos: nuevosCuposCreditos
        })
        .eq('id', currentProfile.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: `Error al actualizar diplomados: ${updateErr.message}` }, { status: 500 });
      }

      // Auditoría
      try {
        await admin.from('audit_logs').insert({
          usuario_email: 'admin@edumin.pe',
          accion: 'ACTUALIZAR_DIPLOMADOS_ESTUDIANTE',
          detalles: { studentId: updated.id, dni_ce: updated.dni_ce, diplomados: diplomadosListJson }
        });
      } catch (e) {
        console.error(e);
      }

      return NextResponse.json({ success: true, estudiante: updated });
    }

    if (action === 'update_cursos') {
      let profileQuery = admin.from('profiles').select('*');
      if (studentId) profileQuery = profileQuery.eq('id', studentId);
      else if (dni_ce) profileQuery = profileQuery.eq('dni_ce', dni_ce);
      else return NextResponse.json({ error: 'Se requiere studentId o dni_ce.' }, { status: 400 });

      const { data: currentProfile, error: pErr } = await profileQuery.maybeSingle();
      if (pErr || !currentProfile) {
        return NextResponse.json({ error: 'Perfil de estudiante no encontrado.' }, { status: 404 });
      }

      // Cargar catálogo oficial desde Supabase + fallback local para asignar códigos reales (CUR-XX / TAL-XX)
      const { data: catDb } = await admin.from('diplomados_y_cursos').select('id, codigo, titulo, tipo, categoria, duracion, horas, imagen');
      const catalogoMap = new Map<string, any>();
      (catDb || []).forEach((item: any) => {
        if (item.titulo) catalogoMap.set(normKey(item.titulo), item);
        if (item.codigo) catalogoMap.set(normKey(item.codigo), item);
        if (item.id) catalogoMap.set(normKey(item.id), item);
      });

      try {
        const cursosPath = path.join(process.cwd(), 'lib/data/cursos.json');
        if (fs.existsSync(cursosPath)) {
          const rawCursos = JSON.parse(fs.readFileSync(cursosPath, 'utf-8'));
          (Array.isArray(rawCursos) ? rawCursos : []).forEach((c: any, idx: number) => {
            const numStr = (idx + 1).toString().padStart(2, '0');
            const tituloUp = String(c.curso || '').trim().toUpperCase();
            if (tituloUp && !catalogoMap.has(normKey(tituloUp))) {
              catalogoMap.set(normKey(tituloUp), {
                id: `cur-${numStr}`,
                codigo: `CUR-${numStr}`,
                titulo: tituloUp,
                tipo: 'curso',
                categoria: c.categoria || 'Cursos de Alta Especialización',
                duracion: '40 horas',
                horas: '40 horas académicas'
              });
            }
          });
        }
      } catch {
        // ignore fallback read error
      }

      [TALLER_SOFT_SKILLS, TALLER_SEGURIDAD_BASADA].forEach(t => {
        if (!catalogoMap.has(normKey(t.titulo))) catalogoMap.set(normKey(t.titulo), t);
        if (!catalogoMap.has(normKey(t.codigo))) catalogoMap.set(normKey(t.codigo), t);
      });

      const existingCursos = parseCursosFromProfile(currentProfile);
      const existingCursosMap = new Map<string, any>();
      existingCursos.forEach(c => {
        if (c.titulo) existingCursosMap.set(normKey(c.titulo), c);
        if (c.codigo) existingCursosMap.set(normKey(c.codigo), c);
        if (c.id) existingCursosMap.set(normKey(c.id), c);
      });

      let cursosListJson: any[] = [];

      if (Array.isArray(cursos)) {
        cursosListJson = cursos.map((item: any, idx: number) => {
          const isObj = typeof item === 'object' && item !== null;
          const title = String(isObj ? (item.titulo || item.codigo || '') : item).trim();
          const key = normKey(title);
          const existing = existingCursosMap.get(key) || (isObj && item.codigo ? existingCursosMap.get(normKey(item.codigo)) : undefined);
          const catMatch = catalogoMap.get(key) || (isObj && item.codigo ? catalogoMap.get(normKey(item.codigo)) : undefined);

          if (existing) {
            return {
              ...existing,
              id: catMatch?.id || existing.id,
              codigo: catMatch?.codigo || existing.codigo,
              tipo: existing.tipo || (catMatch?.tipo ? String(catMatch.tipo).toUpperCase() : undefined)
            };
          }

          const esTallerItem =
            (isObj && String(item.tipo || '').toUpperCase() === 'TALLER') ||
            String(catMatch?.tipo || '').toUpperCase() === 'TALLER' ||
            String(catMatch?.codigo || '').toUpperCase().startsWith('TAL-') ||
            title.toUpperCase().startsWith('TALLER DE');

          return {
            id: catMatch?.id || (isObj && item.id) || `cur-${(idx + 1).toString().padStart(2, '0')}`,
            codigo: catMatch?.codigo || (isObj && item.codigo) || `CUR-${(idx + 1).toString().padStart(2, '0')}`,
            titulo: catMatch?.titulo || title,
            categoria: catMatch?.categoria || (esTallerItem ? 'Taller' : 'Cursos de Alta Especialización'),
            duracion: catMatch?.duracion || (esTallerItem ? '20 horas' : '40 horas'),
            tipo: esTallerItem ? 'TALLER' : 'CURSO',
            nota: 0,
            completado: false,
            avance: 0
          };
        });
      }

      const cursosSerialized = `CURSOS_LIST|${JSON.stringify(cursosListJson)}`;
      const nuevosCuposCreditos = buildUpdatedCuposCreditos(currentProfile, {
        cursosCanjeados: filtrarCursosReales(cursosListJson).length
      });

      const { data: updated, error: updateErr } = await admin
        .from('profiles')
        .update({
          cursos: cursosSerialized,
          cupos_creditos: nuevosCuposCreditos
        })
        .eq('id', currentProfile.id)
        .select()
        .single();

      if (updateErr) {
        return NextResponse.json({ error: `Error al actualizar cursos: ${updateErr.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, estudiante: updated });
    }

    if (action === 'reset_examen_modulo') {
      const {
        tipoPrograma = 'diplomado',
        diplomadoTitulo,
        diplomadoSlug,
        diplomadoCodigo,
        moduloCodigo,
        cursoTitulo,
        cursoCodigo,
        cursoId
      } = body;

      if (!studentId && !dni_ce) {
        return NextResponse.json({ error: 'Se requiere studentId o dni_ce.' }, { status: 400 });
      }

      let profileQuery = admin.from('profiles').select('*');
      if (studentId) profileQuery = profileQuery.eq('id', studentId);
      else profileQuery = profileQuery.eq('dni_ce', dni_ce);

      const { data: profile, error: pErr } = await profileQuery.maybeSingle();
      if (pErr || !profile) {
        return NextResponse.json({ error: 'Perfil de estudiante no encontrado.' }, { status: 404 });
      }

      const tipoNorm = String(tipoPrograma || 'diplomado').toLowerCase();

      if (tipoNorm === 'curso' || tipoNorm === 'taller') {
        const cursosListJson = parseCursosFromProfile(profile);
        const targetKey = normKey(cursoTitulo || cursoCodigo || cursoId);
        const targetCodeKey = normKey(cursoCodigo);
        const targetIdKey = normKey(cursoId);

        const targetCurso = cursosListJson.find((c: any) =>
          (targetCodeKey && normKey(c.codigo) === targetCodeKey) ||
          (targetIdKey && normKey(c.id) === targetIdKey) ||
          (targetKey && normKey(c.titulo) === targetKey)
        );

        if (targetCurso) {
          delete (targetCurso as any).nota;
          (targetCurso as any).rendido = false;
          targetCurso.completado = false;
        }

        const cursosSerialized = `CURSOS_LIST|${JSON.stringify(cursosListJson)}`;
        const { data: updated, error: updErr } = await admin
          .from('profiles')
          .update({ cursos: cursosSerialized })
          .eq('id', profile.id)
          .select()
          .single();

        if (updErr) {
          return NextResponse.json({ error: `Error al reiniciar examen: ${updErr.message}` }, { status: 500 });
        }

        // Eliminar intento guardado en notas_modulos para que el alumno pueda volver a rendirlo
        try {
          const dniTarget = String(profile.dni_ce || dni_ce || '').trim();
          const { data: notasExistentes } = await admin
            .from('notas_modulos')
            .select('id, diplomado_numero, diplomado_nombre')
            .eq('dni_ce', dniTarget);

          const idsBorrar = (notasExistentes || [])
            .filter((n: any) => {
              const nNum = normKey(n.diplomado_numero);
              const nNom = normKey(n.diplomado_nombre);
              return (
                (targetCodeKey && nNum === targetCodeKey) ||
                (targetIdKey && nNum === targetIdKey) ||
                (targetKey && (nNom === targetKey || nNum === targetKey)) ||
                (targetCurso?.codigo && nNum === normKey(targetCurso.codigo))
              );
            })
            .map((n: any) => n.id);

          if (idsBorrar.length > 0) {
            await admin.from('notas_modulos').delete().in('id', idsBorrar);
          }
        } catch (e) {
          console.warn('No se pudo limpiar notas_modulos de curso/taller:', e);
        }

        try {
          await admin.from('audit_logs').insert({
            usuario_email: 'admin@edumin.pe',
            accion: 'REINICIAR_INTENTO_EXAMEN_SUSTITUTORIO',
            detalles: {
              studentId: profile.id,
              dni_ce: profile.dni_ce,
              tipoPrograma: tipoNorm,
              programa: cursoTitulo || cursoCodigo || cursoId,
              tarifa_sustitutorio: 'S/ 25.00'
            }
          });
        } catch (e) {
          console.error('Error registrando auditoría:', e);
        }

        return NextResponse.json({
          success: true,
          estudiante: updated,
          message: 'Intento de examen reiniciado correctamente.'
        });
      }

      let diplomadosListJson: DiplomadoJSON[] = parseDiplomadosFromProfile(profile);
      const targetSlug = stripDipPrefixNorm(diplomadoSlug || diplomadoTitulo || '');
      const targetDipCodeNorm = normKey(diplomadoCodigo);

      const targetDip = diplomadosListJson.find(d =>
        (targetDipCodeNorm && normKey(d.codigo) === targetDipCodeNorm) ||
        (d.slug && stripDipPrefixNorm(d.slug) === targetSlug) ||
        (d.id && stripDipPrefixNorm(d.id) === targetSlug) ||
        (d.titulo && stripDipPrefixNorm(d.titulo) === targetSlug)
      );

      let modIndexMatched = -1;
      if (targetDip && Array.isArray(targetDip.modulos)) {
        // Encontrar módulo objetivo
        const modIdx = targetDip.modulos.findIndex((m: any) =>
          m.codigo === moduloCodigo ||
          m.id === moduloCodigo ||
          normKey(m.codigo) === normKey(moduloCodigo) ||
          (moduloCodigo && m.nombre && m.nombre.toLowerCase().includes(moduloCodigo.toLowerCase())) ||
          (moduloCodigo && m.titulo && m.titulo.toLowerCase().includes(moduloCodigo.toLowerCase()))
        );
        modIndexMatched = modIdx;
        const mod = modIdx >= 0 ? targetDip.modulos[modIdx] : undefined;

        if (mod) {
          delete (mod as any).nota;
          (mod as any).rendido = false;
          mod.completado = false;
        }

        // Limpiar de completadosMap si existe
        if ((targetDip as any).completadosMap && moduloCodigo) {
          delete (targetDip as any).completadosMap[moduloCodigo];
          if (mod?.id) delete (targetDip as any).completadosMap[mod.id];
          if (mod?.codigo) delete (targetDip as any).completadosMap[mod.codigo];
        }

        // Recalcular avance
        const completados = targetDip.modulos.filter(m => m.completado).length;
        targetDip.avance = Math.round((completados / targetDip.modulos.length) * 100);
        (targetDip as any).completado = targetDip.avance === 100;
      }

      const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosListJson)}`;

      let updateQuery = admin.from('profiles').update({
        diplomados: diplomadosSerialized
      });

      if (studentId) updateQuery = updateQuery.eq('id', studentId);
      else updateQuery = updateQuery.eq('dni_ce', dni_ce);

      const { data: updated, error: updErr } = await updateQuery.select().single();
      if (updErr) {
        return NextResponse.json({ error: `Error al reiniciar examen: ${updErr.message}` }, { status: 500 });
      }

      // Eliminar intento correspondiente en notas_modulos de Supabase
      try {
        const dniTarget = String(profile.dni_ce || dni_ce || '').trim();
        const modMatch = String(moduloCodigo || '').match(/\d+/);
        const modNumTarget = modMatch ? parseInt(modMatch[0], 10) : (modIndexMatched >= 0 ? modIndexMatched + 1 : null);

        const { data: notasExistentes } = await admin
          .from('notas_modulos')
          .select('id, diplomado_numero, diplomado_nombre, modulo_numero, modulo_nombre')
          .eq('dni_ce', dniTarget);

        const idsBorrar = (notasExistentes || [])
          .filter((n: any) => {
            const matchesDip =
              (targetDipCodeNorm && normKey(n.diplomado_numero) === targetDipCodeNorm) ||
              (targetSlug && stripDipPrefixNorm(n.diplomado_nombre) === targetSlug) ||
              (targetDip?.codigo && normKey(n.diplomado_numero) === normKey(targetDip.codigo));
            if (!matchesDip) return false;
            return (
              (modNumTarget !== null && Number(n.modulo_numero) === modNumTarget) ||
              (moduloCodigo && normKey(n.modulo_nombre) === normKey(moduloCodigo))
            );
          })
          .map((n: any) => n.id);

        if (idsBorrar.length > 0) {
          await admin.from('notas_modulos').delete().in('id', idsBorrar);
        }
      } catch (e) {
        console.warn('No se pudo limpiar notas_modulos de diplomado:', e);
      }

      // Registrar auditoría de reseteo para examen sustitutorio
      try {
        await admin.from('audit_logs').insert({
          usuario_email: 'admin@edumin.pe',
          accion: 'REINICIAR_INTENTO_EXAMEN_SUSTITUTORIO',
          detalles: {
            studentId: profile.id,
            dni_ce: profile.dni_ce,
            diplomado: diplomadoTitulo || diplomadoSlug,
            modulo: moduloCodigo,
            tarifa_sustitutorio: 'S/ 25.00'
          }
        });
      } catch (e) {
        console.error('Error registrando auditoría:', e);
      }

      return NextResponse.json({
        success: true,
        estudiante: updated,
        message: 'Intento de examen reiniciado correctamente. El estudiante ya puede rendir su examen sustitutorio.'
      });
    }

    return NextResponse.json({ error: 'Acción no soportada.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}


export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      dni_ce, 
      nombres, 
      apellidos, 
      email, 
      telefono, 
      fecha_nacimiento,
      paquete_adquirido, 
      tipo_pago, 
      cuotas_totales, 
      monto_total, 
      monto_cuota, 
      diplomado_1,
      cupos_diplomados_personalizados,
      cupos_cursos_personalizados
    } = body;

    if (!dni_ce || !nombres || !apellidos || !email) {
      return NextResponse.json(
        { error: 'DNI/CE, nombres, apellidos y correo electrónico son obligatorios.' }, 
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // 1. Verificar si ya existe en profiles por dni_ce o email
    const { data: existente } = await admin
      .from('profiles')
      .select('id, dni_ce, email')
      .or(`dni_ce.eq.${dni_ce.trim()},email.eq.${email.trim().toLowerCase()}`)
      .maybeSingle();

    if (existente) {
      return NextResponse.json(
        { error: `Ya existe un usuario registrado con ese DNI (${existente.dni_ce}) o correo (${existente.email}).` }, 
        { status: 400 }
      );
    }

    // 2. Crear usuario en Auth de Supabase (contraseña inicial: su DNI)
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedDni = dni_ce.trim();
    let studentId: string;

    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password: normalizedDni,
      email_confirm: true,
      user_metadata: { dni_ce: normalizedDni }
    });

    if (authError) {
      const { data: userList } = await admin.auth.admin.listUsers();
      const existingAuth = userList?.users?.find(u => u.email?.toLowerCase() === normalizedEmail);
      if (existingAuth) {
        studentId = existingAuth.id;
      } else {
        return NextResponse.json({ error: `Error en autenticación: ${authError.message}` }, { status: 400 });
      }
    } else {
      studentId = authUser.user.id;
    }

    // 3. Preparar diplomado inicial usando el título oficial sin prefijo redundante
    const rawDipTitulo = String(diplomado_1 || 'DERECHO MINERO').trim();
    const dipData = getDiplomadoByTitleOrSlug(rawDipTitulo);
    const dipTitulo = dipData?.titulo || rawDipTitulo.replace(/^DIPLOMADO EN\s+/i, '').trim().toUpperCase();
    const modulosList = dipData?.modulos && dipData.modulos.length > 0
      ? dipData.modulos.map((m: any, mIdx: number) => ({
          id: m.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
          codigo: m.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
          nombre: m.nombre || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
          nota: 0,
          completado: false
        }))
      : [
          { id: 'mod-01', codigo: 'Módulo 01', nombre: `Módulo 01 de ${dipTitulo}`, nota: 0, completado: false },
          { id: 'mod-02', codigo: 'Módulo 02', nombre: `Módulo 02 de ${dipTitulo}`, nota: 0, completado: false },
          { id: 'mod-03', codigo: 'Módulo 03', nombre: `Módulo 03 de ${dipTitulo}`, nota: 0, completado: false }
        ];

    const diplomadosJson = [
      {
        id: dipData?.slug || dipTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        slug: dipData?.slug || dipTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        titulo: dipTitulo,
        avance: 0,
        modulos: modulosList
      }
    ];

    const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosJson)}`;

    // Taller de regalo asignado según el diplomado matriculado
    const tallerRegalo = obtenerTallerParaDiplomado(dipTitulo);
    const cursosJson = [
      {
        id: tallerRegalo.id,
        codigo: tallerRegalo.codigo,
        titulo: tallerRegalo.titulo,
        avance: 0,
        nota: 0,
        completado: false,
        categoria: tallerRegalo.categoria,
        duracion: tallerRegalo.duracion,
        horas: tallerRegalo.horas,
        tipo: 'TALLER',
        esRegalo: true
      }
    ];
    const cursosSerialized = `CURSOS_LIST|${JSON.stringify(cursosJson)}`;

    const paqueteInput = (paquete_adquirido || 'COMPLETO').toUpperCase().trim();
    // Validar si el paquete es uno de los valores enum de postgres en profiles ('COMPLETO', 'FULL', 'ILIMITADO')
    const esPaqueteEnumEstandar = ['COMPLETO', 'FULL', 'ILIMITADO'].includes(paqueteInput);
    // Para la columna enum en profiles usamos el enum mapeado si es estándar o fallback a FULL/COMPLETO
    const paqueteEnumDb = esPaqueteEnumEstandar ? paqueteInput : (paqueteInput.includes('ILIMITADO') ? 'ILIMITADO' : 'FULL');

    const esContado = tipo_pago === 'CONTADO';
    const numCuotasTotales = esContado ? 1 : Number(cuotas_totales || (paqueteInput === 'ILIMITADO' ? 5 : 3));
    const montoTotalNum = Number(monto_total || (paqueteInput === 'ILIMITADO' ? 1500 : (paqueteInput === 'FULL' ? 900 : 540)));
    const montoCuotaNum = esContado 
      ? montoTotalNum 
      : Number(monto_cuota || (paqueteInput === 'ILIMITADO' ? 300 : 180));

    // Determinar cupos según el paquete elegido
    const cuposDiplomadosFinal = Number(cupos_diplomados_personalizados ?? (paqueteInput === 'ILIMITADO' ? 3 : 1));
    const cuposCursosFinal = Number(cupos_cursos_personalizados ?? (paqueteInput === 'ILIMITADO' ? 15 : (paqueteInput === 'FULL' ? 5 : 3)));

    // 4. Insertar en profiles usando `roles` y `cupos_creditos` JSONB
    const insertPayload: Record<string, any> = {
      id: studentId,
      dni_ce: normalizedDni,
      nombres: nombres.trim(),
      apellidos: apellidos.trim(),
      email: normalizedEmail,
      telefono: telefono ? telefono.trim() : '',
      roles: { administrativo: null, academico: 'ESTUDIANTE' },
      paquete_adquirido: paqueteEnumDb,
      cuotas_pagadas: 1,
      cupos_creditos: {
        diplomados: { asignados: cuposDiplomadosFinal, adicionales: 0, canjeados: diplomadosJson.length },
        cursos: { asignados: cuposCursosFinal, adicionales: 0, canjeados: 0 },
        compras_directas: []
      },
      diplomados: diplomadosSerialized,
      cursos: cursosSerialized,
      debe_cambiar_password: true,
      fecha_nacimiento: fecha_nacimiento ? fecha_nacimiento.trim() : null
    };

    const { data: newProfile, error: profileErr } = await admin
      .from('profiles')
      .insert(insertPayload)
      .select()
      .single();

    if (profileErr) {
      console.error('Error insertando profile:', profileErr);
      return NextResponse.json({ error: `Error creando perfil: ${profileErr.message}` }, { status: 500 });
    }

    // 5. Crear cronograma inicial en public.pagos
    const cuotasArray = Array(6).fill('no corresponde');
    for (let i = 0; i < numCuotasTotales && i < 6; i++) {
      cuotasArray[i] = i === 0 ? String(montoCuotaNum) : '0';
    }

    const initialTotalPagado = montoCuotaNum;
    const initialDeuda = esContado ? 0 : Math.max(0, montoTotalNum - initialTotalPagado);

    const initialMetodo = `CREDITO_1|${JSON.stringify({
      num_credito: 1,
      cuotas: cuotasArray,
      total_pagado: initialTotalPagado,
      total_deuda: initialDeuda
    })}`;

    try {
      await admin.from('pagos').insert({
        profile_id: studentId,
        dni_ce: normalizedDni,
        monto: montoTotalNum,
        metodo: initialMetodo,
        estado: initialDeuda === 0 ? 'Completado' : 'Pendiente'
      });
    } catch (pagErr) {
      console.error('Advertencia insertando pago:', pagErr);
    }

    // 5.1. Registrar matrículas iniciales de Diplomado y Taller de Regalo
    try {
      await admin.from('matriculas').insert([
        {
          profile_id: studentId,
          dni_ce: normalizedDni,
          item_id: dipData?.slug || dipTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          tipo: 'DIPLOMADO',
          titulo: dipTitulo,
          avance_porcentaje: 0,
          estado: 'EN_CURSO'
        },
        {
          profile_id: studentId,
          dni_ce: normalizedDni,
          item_id: tallerRegalo.id,
          tipo: 'TALLER',
          titulo: tallerRegalo.titulo,
          avance_porcentaje: 0,
          estado: 'EN_CURSO'
        }
      ]);
    } catch (matErr) {
      console.warn('Advertencia insertando en matriculas:', matErr);
    }

    // 6. Auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'admin@edumin.pe',
        accion: 'CREAR_ESTUDIANTE_MANUAL',
        detalles: {
          studentId,
          dni_ce: normalizedDni,
          estudiante: `${nombres} ${apellidos}`,
          email: normalizedEmail,
          paquete: paqueteInput,
          tipo_pago: esContado ? 'CONTADO' : 'CUOTAS',
          diplomado_1: dipTitulo,
          fecha_nacimiento: fecha_nacimiento || null
        }
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({
      success: true,
      message: `¡Estudiante ${nombres} ${apellidos} registrado exitosamente!`,
      estudiante: newProfile
    });

  } catch (err: any) {
    console.error('Error en POST /api/admin/estudiantes:', err);
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
