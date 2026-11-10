import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateEduminCredits, derivePaymentStateForCredits } from '@/lib/utils/credits';
import {
  parseDiplomadosFromProfile,
  parseCursosFromProfile,
  parseCuposCreditosFromProfile,
  getPrimaryRoleFromProfile,
  filtrarCursosReales
} from '@/lib/utils/profileParser';
import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';
import { obtenerTallerParaDiplomado } from '@/lib/utils/tallerAsignado';

function parseCreditoRow(pag: any) {
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

  if (typeof pag.metodo === 'string' && pag.metodo.startsWith('CREDITO_')) {
    try {
      const jsonStr = pag.metodo.substring(pag.metodo.indexOf('|') + 1).trim();
      const parsed = JSON.parse(jsonStr);
      num_credito = parsed.num_credito || num_credito;
      if (Array.isArray(parsed.cuotas)) {
        cuotas = parsed.cuotas;
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
    total_pagado,
    total_deuda
  };
}

async function enriquecerCursosConTipoCatalogo(admin: any, cursos: any[]) {
  if (!Array.isArray(cursos) || cursos.length === 0) return cursos;
  const { data: catRows } = await admin
    .from('diplomados_y_cursos')
    .select('id, codigo, titulo, tipo');

  if (!Array.isArray(catRows) || catRows.length === 0) return cursos;

  const porClave = new Map<string, any>();
  catRows.forEach((r: any) => {
    if (r.id) porClave.set(String(r.id).trim().toLowerCase(), r);
    if (r.codigo) porClave.set(String(r.codigo).trim().toLowerCase(), r);
    if (r.titulo) porClave.set(String(r.titulo).trim().toLowerCase(), r);
  });

  return cursos.map((c: any) => {
    if (!c) return c;
    const match =
      porClave.get(String(c.id || '').trim().toLowerCase()) ||
      porClave.get(String(c.codigo || '').trim().toLowerCase()) ||
      porClave.get(String(c.titulo || '').trim().toLowerCase());

    if (!match?.tipo) return c;
    const tipoNorm = String(match.tipo).toUpperCase();
    const esTallerDb = tipoNorm === 'TALLER';
    return {
      ...c,
      tipo: esTallerDb ? 'TALLER' : tipoNorm,
      ...(esTallerDb ? { esRegalo: true } : {}),
    };
  });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      // Fallback para sesión demo estudiante 71234567 (Juan Carlos Quispe Ramos)
      const admin = createAdminClient();
      const { data: pByDni } = await admin
        .from('profiles')
        .select('*')
        .eq('dni_ce', '71234567')
        .maybeSingle();

      if (pByDni) {
        const { data: rawPagos } = await admin
          .from('pagos')
          .select('*')
          .or(`profile_id.eq.${pByDni.id},dni_ce.eq.71234567,metodo.ilike.%71234567%`)
          .order('created_at', { ascending: true });
        
        const parsedPagos = (rawPagos || []).map(p => parseCreditoRow(p));
        const diplomados_json = parseDiplomadosFromProfile(pByDni);
        let cursos_json = parseCursosFromProfile(pByDni);

        const dipTitulosDemo: string[] = [];
        if (pByDni.diplomado_1) dipTitulosDemo.push(pByDni.diplomado_1);
        if (pByDni.diplomado_2) dipTitulosDemo.push(pByDni.diplomado_2);
        diplomados_json.forEach((d: any) => {
          const t = d.titulo || d.slug;
          if (t && !dipTitulosDemo.includes(t)) dipTitulosDemo.push(t);
        });
// Inyectar el taller que viene incluido en cada diplomado matriculado
        dipTitulosDemo.forEach(dipTitulo => {
          const taller = obtenerTallerParaDiplomado(dipTitulo);
          if (taller && !cursos_json.some((c: any) => c.id === taller.id || c.codigo === taller.codigo)) {
            cursos_json.push({
              id: taller.id,
              codigo: taller.codigo,
              titulo: taller.titulo,
              tipo: 'TALLER',
              categoria: 'Taller',
              esRegalo: true,
              duracion: taller.duracion,
              imagen: taller.imagen,
              color: 'slate',
              nota: 0,
              completado: false,
              avance: 0,
              leccionesTotal: 1,
              leccionesCompletadas: 0,
              activo: true
            });
          }
        });

        cursos_json = await enriquecerCursosConTipoCatalogo(admin, cursos_json);

        const paymentStateDemo = derivePaymentStateForCredits({
          pagos: rawPagos || [],
          profile: pByDni,
        });
        const cuposDemo = parseCuposCreditosFromProfile(pByDni);

        const eduminCredits = calculateEduminCredits({
          paqueteAdquirido: pByDni.paquete_adquirido || 'COMPLETO',
          cuotasPagadas: paymentStateDemo.cuotasPagadas,
          cuotasTotales: paymentStateDemo.cuotasTotales,
          tipoPago: paymentStateDemo.tipoPago,
          diplomadosConsumidos: cuposDemo.diplomados.canjeados,
          cursosConsumidos: filtrarCursosReales(cursos_json).length,
          creditosExtraDiplomados: cuposDemo.diplomados.adicionales,
          creditosExtraCursos: cuposDemo.cursos.adicionales,
        });

        return NextResponse.json({
          user: { id: pByDni.id, email: pByDni.email },
          profile: {
            ...pByDni,
            role: getPrimaryRoleFromProfile(pByDni),
            cuotas_pagadas: paymentStateDemo.cuotasPagadas,
            cuotas_totales: paymentStateDemo.cuotasTotales,
            tipo_pago: paymentStateDemo.tipoPago,
            diplomados_json,
            cursos_json
          },
          pagos: parsedPagos,
          rawPagos: rawPagos || [],
          matriculas: [],
          solicitudes: [],
          releasedCredits: eduminCredits.diplomados.liberados,
          availableCredits: eduminCredits.diplomados.disponibles,
          eduminCredits
        });
      }

      return NextResponse.json({ error: 'No autorizado. Inicie sesión.' }, { status: 401 });
    }

    const admin = createAdminClient();

    // 1. Obtener Perfil del estudiante (por ID o por Email)
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
      return NextResponse.json({ error: 'Perfil de estudiante no encontrado en Supabase.' }, { status: 404 });
    }

    // 2. Obtener Pagos del estudiante buscando coincidencia por profile_id, dni_ce o coincidencia de DNI en metodo
    let rawPagos: any[] = [];
    if (profile.dni_ce) {
      const { data: pData } = await admin
        .from('pagos')
        .select('*')
        .or(`profile_id.eq.${profile.id},dni_ce.eq.${profile.dni_ce},metodo.ilike.%${profile.dni_ce}%`)
        .order('created_at', { ascending: true });
      rawPagos = pData || [];
    } else {
      const { data: pData } = await admin
        .from('pagos')
        .select('*')
        .eq('profile_id', profile.id)
        .order('created_at', { ascending: true });
      rawPagos = pData || [];
    }

    const parsedPagos = rawPagos.map(p => parseCreditoRow(p));

    // 3. Las matrículas viven centralizadas en `profiles.diplomados` y `profiles.cursos`
    const matriculasData: any[] = [];

    const esAdmin = Boolean(profile.roles?.administrativo);
    if (esAdmin) {
      profile.paquete_adquirido = profile.paquete_adquirido || 'FULL';
      profile.cuotas_pagadas = profile.cuotas_pagadas || 6;
      profile.bloqueado = false;
    }

    let diplomados_json = parseDiplomadosFromProfile(profile);
    if (esAdmin && diplomados_json.length === 0) {
      const defaultDip = getDiplomadoByTitleOrSlug(profile.diplomado_1 || 'derecho-minero');
      diplomados_json = [{
        id: defaultDip.slug,
        slug: defaultDip.slug,
        titulo: defaultDip.titulo,
        avance: 0,
        modulos: defaultDip.modulos.map((m: any, mIdx: number) => ({
          id: m.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
          codigo: m.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
          nombre: m.nombre || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
          nota: 0,
          completado: false
        }))
      }];
    }
    let cursos_json = parseCursosFromProfile(profile);

    const dipTitulosProfile: string[] = [];
    if (profile.diplomado_1) dipTitulosProfile.push(profile.diplomado_1);
    if (profile.diplomado_2) dipTitulosProfile.push(profile.diplomado_2);
    diplomados_json.forEach((d: any) => {
      const t = d.titulo || d.slug;
      if (t && !dipTitulosProfile.includes(t)) dipTitulosProfile.push(t);
    });

    // Inyectar el taller que viene incluido en cada diplomado matriculado
    dipTitulosProfile.forEach(dipTitulo => {
      const taller = obtenerTallerParaDiplomado(dipTitulo);
      if (taller && !cursos_json.some((c: any) => c.id === taller.id || c.codigo === taller.codigo)) {
        cursos_json.push({
          id: taller.id,
          codigo: taller.codigo,
          titulo: taller.titulo,
          tipo: 'TALLER',
          categoria: 'Taller',
          esRegalo: true,
          duracion: taller.duracion,
          imagen: taller.imagen,
          color: 'slate',
          nota: 0,
          completado: false,
          avance: 0,
          leccionesTotal: 1,
          leccionesCompletadas: 0,
          activo: true
        });
      }
    });

    cursos_json = await enriquecerCursosConTipoCatalogo(admin, cursos_json);

    // Cálculo centralizado de Créditos EDUMIN desde `profiles.cupos_creditos`
    const cupos = parseCuposCreditosFromProfile(profile);
    const tieneDatosEstudiante = Boolean(
      profile.paquete_adquirido || 
      (profile.diplomados && profile.diplomados !== '[]' && profile.diplomados !== '') ||
      cupos.diplomados.adicionales > 0 ||
      cupos.cursos.adicionales > 0
    );

    const paymentState = derivePaymentStateForCredits({
      pagos: rawPagos,
      profile,
      esAdminSinDatos: esAdmin && !tieneDatosEstudiante,
    });

    const eduminCredits = calculateEduminCredits({
      paqueteAdquirido: profile.paquete_adquirido || (esAdmin && !tieneDatosEstudiante ? 'ILIMITADO' : 'COMPLETO'),
      cuotasPagadas: paymentState.cuotasPagadas,
      cuotasTotales: paymentState.cuotasTotales,
      tipoPago: paymentState.tipoPago,
      diplomadosConsumidos: cupos.diplomados.canjeados,
      cursosConsumidos: filtrarCursosReales(cursos_json).length,
      creditosExtraDiplomados: cupos.diplomados.adicionales,
      creditosExtraCursos: cupos.cursos.adicionales
    });

    return NextResponse.json({
      user,
      profile: {
        ...profile,
        role: getPrimaryRoleFromProfile(profile),
        cuotas_pagadas: paymentState.cuotasPagadas,
        cuotas_totales: paymentState.cuotasTotales,
        tipo_pago: paymentState.tipoPago,
        diplomados_json,
        cursos_json
      },
      pagos: parsedPagos,
      rawPagos,
      matriculas: matriculasData || [],
      solicitudes: [],
      releasedCredits: eduminCredits.diplomados.liberados,
      availableCredits: eduminCredits.diplomados.disponibles,
      eduminCredits
    });
  } catch (err: any) {
    console.error('Error en /api/dashboard/me:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
