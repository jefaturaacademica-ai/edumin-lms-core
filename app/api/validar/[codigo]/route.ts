import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;

    if (!codigo) {
      return NextResponse.json({ error: 'Código de verificación no proporcionado' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Buscar en la tabla certificaciones en Supabase
    const { data: cert, error } = await admin
      .from('certificaciones')
      .select('*')
      .eq('codigo_verificacion', codigo)
      .maybeSingle();

    if (cert) {
      return NextResponse.json({
        valido: true,
        certificado: {
          id: cert.id,
          codigo: cert.codigo_verificacion,
          tipo: cert.tipo,
          estudiante: cert.estudiante_nombre,
          dni: cert.dni_ce,
          programa: cert.programa_titulo,
          modulo: cert.modulo_titulo,
          horas: cert.horas_lectivas || '120 horas cronológicas',
          nota: Number(cert.nota_final) || 18,
          fecha: cert.fecha_emision ? String(cert.fecha_emision) : '2026-03-15',
          habilitado: cert.estado_financiero_al_dia !== false,
          plantilla_snapshot: cert.plantilla_snapshot || {}
        }
      });
    }

    // 2. Si no lo encuentra por código exacto, probar búsqueda insensible a mayúsculas
    const { data: certList } = await admin
      .from('certificaciones')
      .select('*')
      .ilike('codigo_verificacion', `%${codigo}%`)
      .limit(1);

    if (certList && certList.length > 0) {
      const c = certList[0];
      return NextResponse.json({
        valido: true,
        certificado: {
          id: c.id,
          codigo: c.codigo_verificacion,
          tipo: c.tipo,
          estudiante: c.estudiante_nombre,
          dni: c.dni_ce,
          programa: c.programa_titulo,
          modulo: c.modulo_titulo,
          horas: c.horas_lectivas || '120 horas cronológicas',
          nota: Number(c.nota_final) || 18,
          fecha: c.fecha_emision ? String(c.fecha_emision) : '2026-03-15',
          habilitado: c.estado_financiero_al_dia !== false,
          plantilla_snapshot: c.plantilla_snapshot || {}
        }
      });
    }

    return NextResponse.json({ valido: false, error: 'Código de certificado no encontrado' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al validar certificado' }, { status: 500 });
  }
}
