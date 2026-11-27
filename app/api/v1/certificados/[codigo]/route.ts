import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await context.params;
    const cleanCode = String(codigo || '').trim().toUpperCase();

    if (!cleanCode) {
      return NextResponse.json({ success: false, error: 'Código de certificado o documento no proporcionado' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Buscar en tabla certificaciones por código exacto
    const { data: certPorCodigo } = await admin
      .from('certificaciones')
      .select('*')
      .eq('codigo_verificacion', cleanCode)
      .maybeSingle();

    if (certPorCodigo) {
      return NextResponse.json({
        success: true,
        valido: true,
        tipo_busqueda: 'CODIGO_VERIFICACION',
        certificado: {
          codigo_verificacion: certPorCodigo.codigo_verificacion,
          estudiante: certPorCodigo.estudiante_nombre,
          documento_identidad: certPorCodigo.numero_documento,
          programa: certPorCodigo.programa_titulo,
          modulo: certPorCodigo.modulo_titulo || null,
          tipo_certificado: certPorCodigo.tipo || 'DIPLOMA',
          horas_academicas: certPorCodigo.horas_lectivas || 420,
          nota_final: certPorCodigo.nota_final || null,
          fecha_emision: certPorCodigo.fecha_emision || certPorCodigo.created_at,
          estado: 'AUTENTICADO_OFICIAL',
          institucion: 'ESCUELA DE MINERÍA DEL PERÚ (EDUMIN)'
        }
      });
    }

    // 2. Si no se encontró por código, intentar buscar si es un DNI/documento
    const { data: certsPorDni } = await admin
      .from('certificaciones')
      .select('*')
      .eq('numero_documento', cleanCode);

    if (certsPorDni && certsPorDni.length > 0) {
      return NextResponse.json({
        success: true,
        valido: true,
        tipo_busqueda: 'DOCUMENTO_IDENTIDAD',
        total_certificados: certsPorDni.length,
        estudiante: certsPorDni[0].estudiante_nombre,
        documento_identidad: cleanCode,
        certificados: certsPorDni.map((c: any) => ({
          codigo_verificacion: c.codigo_verificacion,
          programa: c.programa_titulo,
          modulo: c.modulo_titulo || null,
          tipo: c.tipo,
          horas_academicas: c.horas_lectivas || 420,
          fecha_emision: c.fecha_emision || c.created_at
        }))
      });
    }

    return NextResponse.json({
      success: false,
      valido: false,
      error: `No se encontró ningún certificado o diploma con el código o documento: ${cleanCode}`
    }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
