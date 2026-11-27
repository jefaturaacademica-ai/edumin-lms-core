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
      tipo_documento,
      nombres,
      apellidos,
      email,
      telefono,
      paquete,
      diplomado_inicial,
      monto_total,
      cuota_inicial_pagada
    } = body;

    const numDoc = String(numero_documento || '').trim();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanNombres = String(nombres || '').trim();
    const cleanApellidos = String(apellidos || '').trim();
    const cleanPaquete = String(paquete || 'COMPLETO').trim().toUpperCase();

    if (!numDoc || !cleanEmail || !cleanNombres || !cleanApellidos) {
      return NextResponse.json({
        success: false,
        error: 'Campos requeridos faltantes: numero_documento, nombres, apellidos, email'
      }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Verificar si ya existe en profiles
    const { data: existente } = await admin
      .from('profiles')
      .select('id, numero_documento')
      .eq('numero_documento', numDoc)
      .maybeSingle();

    if (existente) {
      return NextResponse.json({
        success: false,
        error: `El estudiante con documento ${numDoc} ya se encuentra registrado con ID: ${existente.id}`
      }, { status: 409 });
    }

    // 2. Crear usuario en Supabase Auth (contraseña provisional = número de documento)
    let userId: string;
    const { data: authUser, error: authError } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password: numDoc,
      email_confirm: true
    });

    if (authError) {
      // Si el email ya existía en auth pero no en profiles, buscar el usuario
      if (authError.message.toLowerCase().includes('already')) {
        const { data: listUsers } = await admin.auth.admin.listUsers();
        const found = listUsers?.users?.find(u => u.email === cleanEmail);
        if (!found) throw authError;
        userId = found.id;
      } else {
        throw authError;
      }
    } else {
      userId = authUser.user.id;
    }

    const dipTitulo = diplomado_inicial ? String(diplomado_inicial).trim().toUpperCase() : 'DERECHO MINERO';
    const dipSlug = dipTitulo.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const diplomadosStr = `DIPLOMADOS_LIST|[{"id":"${dipSlug}","slug":"${dipSlug}","titulo":"${dipTitulo}","avance":0,"modulos":[]}]`;

    // 3. Crear el registro en profiles
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: userId,
        roles: { administrativo: null, academico: 'ESTUDIANTE' },
        numero_documento: numDoc,
        tipo_documento: tipo_documento || (numDoc.length === 8 ? 'DNI' : 'OTRO'),
        nombres: cleanNombres,
        apellidos: cleanApellidos,
        email: cleanEmail,
        telefono: telefono ? String(telefono).trim() : '',
        paquete_adquirido: cleanPaquete,
        diplomados: diplomadosStr,
        cuotas_pagadas: cuota_inicial_pagada ? 1 : 0,
        bloqueado: false,
        created_at: new Date().toISOString()
      });

    if (profileError) throw profileError;

    // 4. Crear contrato inicial de crédito en tabla pagos
    const totalContrato = Number(monto_total) || 540;
    const pagoInicial = Number(cuota_inicial_pagada) || 0;
    const saldoPendiente = Math.max(0, totalContrato - pagoInicial);

    const metodoJson = `CREDITO_1|{"num_credito":1,"cuotas":["${pagoInicial}","0","0","no corresponde","no corresponde","no corresponde"],"total_pagado":${pagoInicial},"total_deuda":${saldoPendiente}}`;

    await admin.from('pagos').insert({
      profile_id: userId,
      dni_ce: numDoc,
      monto: totalContrato,
      metodo: metodoJson,
      estado: saldoPendiente === 0 ? 'Completado' : 'Pendiente',
      created_at: new Date().toISOString()
    });

    // 5. Auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'api_v1_integration',
        accion: 'MATRICULA_EXTERNA_API',
        detalles: {
          numero_documento: numDoc,
          alumno: `${cleanNombres} ${cleanApellidos}`,
          paquete: cleanPaquete,
          monto_total: totalContrato
        }
      });
    } catch {}

    return NextResponse.json({
      success: true,
      message: 'Estudiante matriculado y activado exitosamente vía API',
      estudiante: {
        id: userId,
        numero_documento: numDoc,
        nombres: cleanNombres,
        apellidos: cleanApellidos,
        email: cleanEmail,
        paquete_adquirido: cleanPaquete,
        diplomado_inicial: dipTitulo,
        total_facturado: totalContrato,
        cuota_inicial_pagada: pagoInicial,
        saldo_pendiente: saldoPendiente
      }
    }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
