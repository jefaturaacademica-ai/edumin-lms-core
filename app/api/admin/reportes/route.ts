import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET() {
  try {
    const admin = createAdminClient();

    // 1. Perfiles
    const { data: profiles } = await admin.from('profiles').select('*');
    // 2. Pagos
    const { data: pagos } = await admin.from('pagos').select('*');
    // 3. Cursos
    const { data: cursos } = await admin.from('cursos').select('*');

    const listaProfiles = profiles || [];
    const listaPagos = pagos || [];
    const listaCursos = cursos || [];

    const totalRecaudado = listaPagos.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
    const totalAlumnos = listaProfiles.length;
    const alumnosEnRiesgo = listaProfiles.filter(p => p.bloqueado || p.cuotas_pagadas < 2).length;
    const tasaMorosidad = totalAlumnos > 0 ? ((alumnosEnRiesgo / totalAlumnos) * 100).toFixed(1) : '0';

    return NextResponse.json({
      kpis: {
        totalRecaudado,
        tasaMorosidad: `${tasaMorosidad}%`,
        alumnosEnRiesgo,
        totalAlumnos,
        totalCursos: listaCursos.length
      },
      pagos: listaPagos,
      alumnosRiesgo: listaProfiles,
      cursos: listaCursos
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener reportes' }, { status: 500 });
  }
}
