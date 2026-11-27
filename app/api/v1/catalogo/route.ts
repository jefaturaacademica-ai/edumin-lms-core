import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { validarApiKey } from '@/lib/auth/apiKeyValidator';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Validación de API Key
  const auth = validarApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ success: false, error: auth.error }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const { data: catalogo, error } = await admin
      .from('diplomados_y_cursos')
      .select('id, codigo, titulo, categoria, tipo, nivel, horas, creditos, docente, precio')
      .order('titulo', { ascending: true });

    if (error) throw error;

    const diplomados = (catalogo || []).filter((c: any) => c.categoria === 'DIPLOMADO' || !c.categoria);
    const cursos = (catalogo || []).filter((c: any) => c.categoria === 'CURSO_LIBRE' || c.categoria === 'CURSO');
    const talleres = (catalogo || []).filter((c: any) => c.categoria === 'TALLER');

    return NextResponse.json({
      success: true,
      total_programas: (catalogo || []).length,
      data: {
        diplomados,
        cursos,
        talleres
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
