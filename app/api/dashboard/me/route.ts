import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { calculateReleasedCredits } from '@/lib/utils/credits';

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

    // 2. Obtener Pagos del estudiante
    const { data: pagosData } = await admin
      .from('pagos')
      .select('*')
      .or(`profile_id.eq.${profile.id},dni_ce.eq.${profile.dni_ce}`)
      .order('created_at', { ascending: true });

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
      pagos: pagosData || [],
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
