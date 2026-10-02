import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request) {
  try {
    // 1. Validar Token de Seguridad (si está configurado N8N_API_SECRET_KEY)
    const authHeader = request.headers.get('authorization');
    const expectedSecret = process.env.N8N_API_SECRET_KEY;
    
    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Extraer datos enviados por n8n
    const body = await request.json();
    const { dni_ce, email, nombres, apellidos, telefono, paquete_adquirido, programa } = body;

    if (!dni_ce || !email || !nombres || !apellidos || !paquete_adquirido) {
      return NextResponse.json({ error: 'Faltan campos requeridos (dni_ce, email, nombres, apellidos, paquete_adquirido)' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 3. Crear el usuario en Auth de Supabase (Contraseña por defecto: El DNI)
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: dni_ce.trim(),
      email_confirm: true
    });

    if (authError) throw authError;

    const studentId = authData.user.id;
    const paqueteUpper = (paquete_adquirido || 'PRO').toUpperCase();

    // 4. Crear el perfil en la tabla profiles
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: studentId,
        role: 'ESTUDIANTE',
        dni_ce: dni_ce.trim(),
        email: email.trim().toLowerCase(),
        nombres: nombres.trim(),
        apellidos: apellidos.trim(),
        telefono: telefono ? telefono.trim() : '',
        paquete_adquirido: paqueteUpper,
        diplomado_1: programa || 'Diplomado en Seguridad y Salud Ocupacional en Minería',
        cuotas_pagadas: 1, // Entra con la 1ra cuota pagada
        cupos_diplomados: 0,
        debe_cambiar_password: true
      });

    if (profileError) {
      // Rollback Auth user if profile insertion fails
      await admin.auth.admin.deleteUser(studentId);
      throw profileError;
    }

    // 5. Crear el registro de crédito inicial en public.pagos
    const montoTotal = paqueteUpper === 'ILIMITADO' ? 1500 : (paqueteUpper === 'FULL' || paqueteUpper === 'PREMIUM' ? 900 : 540);
    const montoCuota1 = paqueteUpper === 'ILIMITADO' ? 300 : 180;
    
    const initialMetodo = `CREDITO_1|${JSON.stringify({
      num_credito: 1,
      cuotas: [String(montoCuota1), '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'],
      total_pagado: montoCuota1,
      total_deuda: Math.max(0, montoTotal - montoCuota1)
    })}`;

    try {
      await admin.from('pagos').insert({
        profile_id: studentId,
        dni_ce: dni_ce.trim(),
        monto: montoTotal,
        metodo: initialMetodo,
        estado: 'Pendiente'
      });
    } catch (pagErr) {
      console.error('Advertencia al insertar pago inicial:', pagErr);
    }

    // 6. Auditoría
    try {
      await admin.from('audit_logs').insert({
        usuario_email: 'sistema@n8n.io',
        accion: 'ALUMNO_MATRICULADO_N8N',
        detalles: {
          alumnoId: studentId,
          dni_ce: dni_ce.trim(),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          email: email.trim(),
          paquete: paqueteUpper
        }
      });
    } catch (e) {
      console.error(e);
    }

    return NextResponse.json({ 
      exito: true, 
      mensaje: `Alumno ${nombres} ${apellidos} matriculado exitosamente en Supabase.`,
      alumnoId: studentId 
    });

  } catch (error: any) {
    console.error('Error en creación automática de alumno:', error);
    return NextResponse.json({ error: error.message || 'Error interno en n8n webhook' }, { status: 500 });
  }
}