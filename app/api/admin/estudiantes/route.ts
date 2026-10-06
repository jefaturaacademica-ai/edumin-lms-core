import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { parseDiplomadosFromProfile, parseCursosFromProfile, DiplomadoJSON } from '@/lib/utils/profileParser';

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
    
    // Consultar perfiles de tipo ESTUDIANTE
    const { data: profiles, error } = await admin
      .from('profiles')
      .select('*')
      .eq('role', 'ESTUDIANTE')
      .order('nombres', { ascending: true });

    if (error) {
      console.error('Error al consultar profiles:', error);
      return NextResponse.json({ estudiantes: [], error: error.message }, { status: 500 });
    }

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
      const parsedCursos = parseCursosFromProfile(p);
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
        role: p.role,
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

    if (action === 'update_diplomados') {
      let diplomadosListJson: DiplomadoJSON[] = [];

      if (Array.isArray(diplomados)) {
        diplomadosListJson = diplomados.map((titleStr: string) => {
          const title = String(titleStr).trim();
          return {
            id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            titulo: title,
            avance: 0,
            modulos: [
              { id: 'mod-01', codigo: 'Módulo 01', nombre: `Módulo 01 de ${title}`, nota: 0, completado: false },
              { id: 'mod-02', codigo: 'Módulo 02', nombre: `Módulo 02 de ${title}`, nota: 0, completado: false },
              { id: 'mod-03', codigo: 'Módulo 03', nombre: `Módulo 03 de ${title}`, nota: 0, completado: false }
            ]
          };
        });
      }

      const diplomadosSerialized = `DIPLOMADOS_LIST|${JSON.stringify(diplomadosListJson)}`;

      let query = admin.from('profiles').update({
        diplomados: diplomadosSerialized,
        avance_porcentaje: 0
      });

      if (studentId) {
        query = query.eq('id', studentId);
      } else if (dni_ce) {
        query = query.eq('dni_ce', dni_ce);
      } else {
        return NextResponse.json({ error: 'Se requiere studentId o dni_ce.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await query.select().single();

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
      let cursosListJson: any[] = [];

      if (Array.isArray(cursos)) {
        cursosListJson = cursos.map((titleStr: string, idx: number) => {
          const title = String(titleStr).trim();
          return {
            id: `cur-${(idx + 1).toString().padStart(2, '0')}`,
            codigo: `CUR-${(idx + 1).toString().padStart(2, '0')}`,
            titulo: title,
            nota: 0,
            completado: false
          };
        });
      }

      const cursosSerialized = `CURSOS_LIST|${JSON.stringify(cursosListJson)}`;

      let query = admin.from('profiles').update({
        cursos: cursosSerialized
      });

      if (studentId) {
        query = query.eq('id', studentId);
      } else if (dni_ce) {
        query = query.eq('dni_ce', dni_ce);
      } else {
        return NextResponse.json({ error: 'Se requiere studentId o dni_ce.' }, { status: 400 });
      }

      const { data: updated, error: updateErr } = await query.select().single();

      if (updateErr) {
        return NextResponse.json({ error: `Error al actualizar cursos: ${updateErr.message}` }, { status: 500 });
      }

      return NextResponse.json({ success: true, estudiante: updated });
    }

    return NextResponse.json({ error: 'Acción no soportada.' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error inesperado' }, { status: 500 });
  }
}
