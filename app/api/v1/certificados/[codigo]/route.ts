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
      return NextResponse.json({ success: false, error: 'Código de certificado no proporcionado' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Buscar en tabla de certificados
    const { data: cert, error } = await admin
      .from('certificados')
      .select('*')
      .eq('codigo_verificacion', cleanCode)
      .maybeSingle();

    if (error) throw error;

    if (!cert) {
      return NextResponse.json({
        success: false,
        valido: false,
        error: `No existe ningún certificado o diploma con el código ${cleanCode}`
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      valido: true,
      certificado: {
        codigo_verificacion: cert.codigo_verificacion,
        estudiante: cert.nombre_estudiante || cert.estudiante_nombre,
        documento_identidad: cert.numero_documento || cert.dni_ce,
        programa: cert.programa_titulo || cert.titulo,
        tipo_programa: cert.tipo || 'DIPLOMADO',
        horas_academicas: cert.horas_academicas || 420,
        fecha_emision: cert.fecha_emision || cert.created_at,
        estado: 'AUTENTICADO_OFICIAL',
        institucion: 'ESCUELA DE MINERÍA DEL PERÚ (EDUMIN)'
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
