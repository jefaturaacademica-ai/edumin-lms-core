import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validarApiKey } from '@/lib/auth/apiKeyValidator';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ dni: string }> }
) {
  // Validación de API Key
  const auth = validarApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const { dni } = await context.params;
    const cleanDni = String(dni || '').trim();

    if (!cleanDni) {
      return NextResponse.json({ success: false, error: 'DNI / número de documento no proporcionado' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Consultar perfil en profiles
    const esUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanDni);
    let profileQuery = admin.from('profiles').select('*');
    if (esUuid) {
      profileQuery = profileQuery.or(`numero_documento.eq.${cleanDni},id.eq.${cleanDni}`);
    } else {
      profileQuery = profileQuery.eq('numero_documento', cleanDni);
    }
    const { data: profile, error } = await profileQuery.maybeSingle();

    if (error) throw error;

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: `No se encontró ningún estudiante con el documento ${cleanDni}`
      }, { status: 404 });
    }

    // 2. Consultar pagos asociados
    const { data: pagos } = await admin
      .from('pagos')
      .select('id, monto, metodo, estado, created_at, is_cargo_extra')
      .or(`dni_ce.eq.${cleanDni},profile_id.eq.${profile.id}`);

    const listaPagos = pagos || [];
    let totalFacturado = 0;
    let totalPagado = 0;
    let totalDeuda = 0;
    let cuotasPagadas = 0;

    listaPagos.forEach((p: any) => {
      if (p.is_cargo_extra) return;
      const m = Number(p.monto) || 0;
      totalFacturado += m;

      if (typeof p.metodo === 'string' && p.metodo.includes('|{')) {
        try {
          const jsonStr = p.metodo.substring(p.metodo.indexOf('|{') + 1);
          const parsed = JSON.parse(jsonStr);
          const pag = Number(parsed.total_pagado) || 0;
          totalPagado += pag;
          totalDeuda += Number(parsed.total_deuda ?? (m - pag));
          const cuotas = Array.isArray(parsed.cuotas) ? parsed.cuotas : [];
          cuotasPagadas += cuotas.filter((c: any) => c !== 'no corresponde' && Number(c) > 0).length;
        } catch {
          if (p.estado === 'Completado') {
            totalPagado += m;
            cuotasPagadas += 1;
          } else {
            totalDeuda += m;
          }
        }
      } else if (p.estado === 'Completado') {
        totalPagado += m;
        cuotasPagadas += 1;
      } else {
        totalDeuda += m;
      }
    });

    const alDia = totalDeuda === 0 && !profile.bloqueado;

    // 3. Extraer diplomado actual
    let diplomadoActual = profile.diplomado_1 || 'DIPLOMADO GENERAL';
    if (typeof profile.diplomados === 'string' && profile.diplomados.includes('[')) {
      try {
        const raw = profile.diplomados.replace('DIPLOMADOS_LIST|', '');
        const arr = JSON.parse(raw);
        if (arr[0]?.titulo) diplomadoActual = arr[0].titulo;
      } catch {}
    }

    return NextResponse.json({
      success: true,
      estudiante: {
        id: profile.id,
        numero_documento: profile.numero_documento,
        tipo_documento: profile.tipo_documento || 'DNI',
        nombres: profile.nombres,
        apellidos: profile.apellidos,
        nombre_completo: `${profile.nombres} ${profile.apellidos}`.trim(),
        email: profile.email,
        telefono: profile.telefono,
        paquete_adquirido: profile.paquete_adquirido,
        diplomado_actual: diplomadoActual,
        bloqueado: Boolean(profile.bloqueado),
        prorroga_hasta: profile.prorroga_hasta || null,
        estado_cuenta: profile.bloqueado ? 'BLOQUEADO' : (alDia ? 'AL_DIA' : 'CON_DEUDA'),
        fecha_registro: profile.created_at,
        financiero: {
          total_facturado: totalFacturado,
          total_pagado: totalPagado,
          total_deuda_pendiente: totalDeuda,
          cuotas_pagadas: cuotasPagadas,
          al_dia: alDia
        }
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
