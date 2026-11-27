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
    const { data: cursos } = await admin.from('diplomados_y_cursos').select('*');

    const listaProfiles = profiles || [];
    const listaPagos = pagos || [];
    const listaCursos = cursos || [];

    const totalRecaudado = listaPagos.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
    const totalAlumnos = listaProfiles.length;

    const hoy = new Date();
    // Identificar perfiles con cuotas vencidas e impagas en contratos reales de pagos
    const idsConMora = new Set<string>();
    for (const pag of listaPagos) {
      if (pag.is_cargo_extra) continue;
      const cuotas = Array.isArray(pag.cuotas) ? pag.cuotas : [];
      const fVenc = Array.isArray(pag.fechas_vencimiento) ? pag.fechas_vencimiento : [];
      for (let i = 0; i < cuotas.length; i++) {
        const val = cuotas[i];
        if (val !== 'no corresponde' && Number(val) === 0) {
          const fechaStr = fVenc[i];
          if (fechaStr && new Date(fechaStr) < hoy) {
            if (pag.profile_id) idsConMora.add(String(pag.profile_id));
            if (pag.dni_ce) idsConMora.add(String(pag.dni_ce));
            break;
          }
        }
      }
    }

    const perfilesEnRiesgo = listaProfiles.filter(p => {
      if (p.bloqueado) return true;
      if (p.prorroga_hasta && new Date(p.prorroga_hasta) < hoy) return true;
      if (idsConMora.has(String(p.id)) || idsConMora.has(String(p.dni_ce))) return true;
      return false;
    });

    const alumnosEnRiesgo = perfilesEnRiesgo.length;
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
      alumnosRiesgo: perfilesEnRiesgo,
      cursos: listaCursos
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al obtener reportes' }, { status: 500 });
  }
}
