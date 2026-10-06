import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateReleasedCredits } from '@/lib/utils/credits';

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

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
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

    // 3. Obtener Matrículas si existe la tabla
    let matriculasData: any[] = [];
    try {
      const { data: mData } = await admin
        .from('matriculas_cursos')
        .select('*')
        .or(`profile_id.eq.${profile.id},dni_ce.eq.${profile.dni_ce}`);
      matriculasData = mData || [];
    } catch {
      // ignore table missing
    }

    // Cálculo de créditos liberados y disponibles
    const releasedCredits = calculateReleasedCredits(
      profile.paquete_adquirido || 'FULL',
      profile.cuotas_pagadas || 1
    );
    const availableCredits = Math.max(0, releasedCredits - (profile.cupos_diplomados || 0));

    return NextResponse.json({
      user,
      profile,
      pagos: parsedPagos,
      rawPagos,
      matriculas: matriculasData || [],
      solicitudes: [],
      releasedCredits,
      availableCredits
    });
  } catch (err: any) {
    console.error('Error en /api/dashboard/me:', err);
    return NextResponse.json({ error: err.message || 'Error interno del servidor' }, { status: 500 });
  }
}
