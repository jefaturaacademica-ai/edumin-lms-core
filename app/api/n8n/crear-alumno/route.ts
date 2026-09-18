import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Usamos el cliente Service Role (Bypass RLS) porque no hay sesión de navegador aquí
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    // 1. Validar Token de Seguridad (Para que nadie externo use esta API)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.N8N_API_SECRET_KEY}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Extraer datos enviados por n8n
    const body = await request.json();
    const { dni_ce, email, nombres, apellidos, telefono, paquete_adquirido } = body;

    if (!dni_ce || !email || !nombres || !apellidos || !paquete_adquirido) {
      return NextResponse.json({ error: 'Faltan campos requeridos' }, { status: 400 });
    }

    // 3. Crear el usuario en Auth de Supabase (Contraseña por defecto: El DNI)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: dni_ce,
      email_confirm: true // Saltamos la confirmación de correo
    });

    if (authError) throw authError;

    // 4. Crear el perfil en la tabla profiles
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: authData.user.id,
        role: 'ESTUDIANTE',
        dni_ce,
        email,
        nombres,
        apellidos,
        telefono: telefono || '',
        paquete_adquirido,
        cuotas_pagadas: 1, // Por defecto entra con la 1ra cuota pagada
        cupos_diplomados: 0,
        debe_cambiar_password: true // Le obligamos a cambiar su clave al entrar por 1ra vez
      });

    if (profileError) {
      // Rollback: Si falla el perfil, borramos el Auth para mantener consistencia
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw profileError;
    }

    return NextResponse.json({ 
      exito: true, 
      mensaje: `Alumno ${nombres} matriculado exitosamente.`,
      alumnoId: authData.user.id 
    });

  } catch (error: any) {
    console.error('Error en creación automática:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}