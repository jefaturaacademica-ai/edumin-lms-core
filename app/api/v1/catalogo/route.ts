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

    const catalogoNorm = (catalogo || []).map((c: any) => ({
      ...c,
      titulo: String(c.titulo || '').trim().toUpperCase(),
    }));

    const diplomados = catalogoNorm.filter((c: any) => {
      const t = String(c.tipo || '').toLowerCase();
      const code = String(c.codigo || '').toUpperCase();
      return t === 'diplomado' || code.startsWith('DIP-');
    });

    const cursos = catalogoNorm.filter((c: any) => {
      const t = String(c.tipo || '').toLowerCase();
      const code = String(c.codigo || '').toUpperCase();
      return (t === 'curso' || code.startsWith('CUR-')) && !code.startsWith('DIP-') && !code.startsWith('TAL-');
    });

    const talleres = catalogoNorm.filter((c: any) => {
      const t = String(c.tipo || '').toLowerCase();
      const code = String(c.codigo || '').toUpperCase();
      return t === 'taller' || code.startsWith('TAL-');
    });

    return NextResponse.json({
      success: true,
      total_programas: catalogoNorm.length,
      resumen: {
        total_diplomados: diplomados.length,
        total_cursos_libres: cursos.length,
        total_talleres: talleres.length
      },
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
