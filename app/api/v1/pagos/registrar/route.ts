import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validarApiKey } from '@/lib/auth/apiKeyValidator';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  // Validación de API Key
  const auth = validarApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      numero_documento,
      monto,
      metodo_pago,
      nro_operacion,
      nro_recibo,
      comprobante_url
    } = body;

    const numDoc = String(numero_documento || '').trim();
    const montoAbono = Number(monto);

    if (!numDoc || isNaN(montoAbono) || montoAbono <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Campos requeridos: numero_documento (DNI válido) y monto (numérico > 0)'
      }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Obtener estudiante
    const { data: profile } = await admin
      .from('profiles')
      .select('id, numero_documento, nombres, apellidos')
      .eq('numero_documento', numDoc)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: `No existe estudiante con documento ${numDoc}`
      }, { status: 404 });
    }

    // 2. Obtener contrato principal en pagos
    const { data: pagosList } = await admin
      .from('pagos')
      .select('*')
      .or(`dni_ce.eq.${numDoc},profile_id.eq.${profile.id}`)
      .order('created_at', { ascending: false });

    const pagoRow = (pagosList || []).find((p: any) => !String(p.metodo || '').startsWith('CARGO_EXTRA'));

    if (!pagoRow) {
      return NextResponse.json({
        success: false,
        error: `El estudiante ${numDoc} no tiene un contrato de crédito activo registrado en pagos`
      }, { status: 404 });
    }

    // 3. Procesar cuotas en metodo JSON
    let parsedMetodo = {
      num_credito: 1,
      cuotas: ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: 0,
      total_deuda: Number(pagoRow.monto) || 0
    };

    if (typeof pagoRow.metodo === 'string' && pagoRow.metodo.includes('|{')) {
      try {
        const jsonStr = pagoRow.metodo.substring(pagoRow.metodo.indexOf('|{') + 1);
        parsedMetodo = JSON.parse(jsonStr);
      } catch {}
    }

    // Abonar en la primera cuota pendiente
    let aplicado = false;
    let cuotaIndexAplicada = 0;
    const cuotasActualizadas = [...parsedMetodo.cuotas];

    for (let i = 0; i < cuotasActualizadas.length; i++) {
      if (cuotasActualizadas[i] !== 'no corresponde' && Number(cuotasActualizadas[i]) === 0) {
        cuotasActualizadas[i] = String(montoAbono);
        cuotaIndexAplicada = i + 1;
        aplicado = true;
        break;
      }
    }

    if (!aplicado) {
      // Si todas ya tenían valor, sumar al total pagado
      parsedMetodo.total_pagado = (parsedMetodo.total_pagado || 0) + montoAbono;
      parsedMetodo.total_deuda = Math.max(0, (Number(pagoRow.monto) || 0) - parsedMetodo.total_pagado);
    } else {
      parsedMetodo.cuotas = cuotasActualizadas;
      parsedMetodo.total_pagado = (parsedMetodo.total_pagado || 0) + montoAbono;
      parsedMetodo.total_deuda = Math.max(0, (Number(pagoRow.monto) || 0) - parsedMetodo.total_pagado);
    }

    const nuevoMetodoStr = `CREDITO_${parsedMetodo.num_credito || 1}|${JSON.stringify(parsedMetodo)}`;
    const nuevoEstado = parsedMetodo.total_deuda === 0 ? 'Completado' : 'Pendiente';

    // 4. Actualizar tabla pagos
    await admin
      .from('pagos')
      .update({
        metodo: nuevoMetodoStr,
        estado: nuevoEstado
      })
      .eq('id', pagoRow.id);

    // 5. Auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'api_v1_payments',
        accion: 'PAGO_REGISTRADO_API',
        detalles: {
          numero_documento: numDoc,
          alumno: `${profile.nombres} ${profile.apellidos}`,
          monto: montoAbono,
          metodo_pago: metodo_pago || 'Pasarela API',
          nro_operacion,
          nro_recibo,
          comprobante_url
        }
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Abono de S/ ${montoAbono.toFixed(2)} registrado exitosamente`,
      transaccion: {
        estudiante: `${profile.nombres} ${profile.apellidos}`,
        numero_documento: numDoc,
        monto_abonado: montoAbono,
        cuota_afectada: aplicado ? `Cuota ${cuotaIndexAplicada.toString().padStart(2, '0')}` : 'Abono extraordinario',
        saldo_pendiente: parsedMetodo.total_deuda,
        estado_credito: nuevoEstado
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
