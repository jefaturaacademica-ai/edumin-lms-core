import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ codigo: string }> }
) {
  try {
    const { codigo } = await params;
    const codigoNormalizado = (codigo || '').trim().toUpperCase();

    if (!codigoNormalizado) {
      return NextResponse.json({ error: 'Código de verificación no proporcionado' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 1. Buscar en la tabla certificaciones en Supabase por código exacto normalizado
    const { data: cert, error } = await admin
      .from('certificaciones')
      .select('*')
      .eq('codigo_verificacion', codigoNormalizado)
      .maybeSingle();

    const enriquecerCertificado = async (certData: any) => {
      let snap = certData.plantilla_snapshot || {};

      if (!snap.imagenFondoUrl || !snap.disenoCoordenadas) {
        try {
          const { data: logData } = await admin
            .from('audit_logs')
            .select('detalles')
            .eq('accion', 'CONFIG_MODELOS_CERTIFICADOS')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const modelos = logData?.detalles?.modelos || [];
          const tipoNorm = String(certData.tipo || '').toUpperCase();
          const tipoBusqueda = tipoNorm === 'DIPLOMADO' ? 'DIPLOMA' : (tipoNorm === 'TALLER' ? 'CURSO' : tipoNorm);

          const modeloMatch = modelos.find((m: any) => 
            String(m.tipo).toUpperCase() === tipoBusqueda && (m.asignacionAlcance === 'SUPERPLANTILLA_GLOBAL' || m.esPredeterminado)
          ) || modelos.find((m: any) => String(m.tipo).toUpperCase() === tipoBusqueda);

          if (modeloMatch) {
            snap = {
              modelo_id: snap.modelo_id || modeloMatch.id,
              nombrePlantilla: snap.nombrePlantilla || modeloMatch.nombre,
              horas: snap.horas || certData.horas_lectivas || modeloMatch.horas,
              ciudad: snap.ciudad || 'Arequipa',
              orientacion: snap.orientacion || modeloMatch.orientacion || (tipoBusqueda === 'CURSO' ? 'vertical' : 'horizontal'),
              imagenFondoUrl: snap.imagenFondoUrl || modeloMatch.imagenFondoUrl,
              disenoCoordenadas: snap.disenoCoordenadas || modeloMatch.disenoCoordenadas,
              incluyeQr: snap.incluyeQr !== undefined ? snap.incluyeQr : (modeloMatch.incluyeQr !== false),
              fechaEmision: snap.fechaEmision || certData.fecha_emision
            };
          }
        } catch {
          // Ignorar fallback
        }
      }

      return {
        id: certData.id,
        codigo: certData.codigo_verificacion,
        tipo: certData.tipo,
        estudiante: certData.estudiante_nombre,
        dni: certData.dni_ce,
        programa: certData.programa_titulo,
        modulo: certData.modulo_titulo,
        horas: certData.horas_lectivas || snap.horas || '24 horas académicas',
        nota: Number(certData.nota_final) || 18,
        fecha: certData.fecha_emision ? String(certData.fecha_emision) : '2026-03-15',
        habilitado: certData.estado_financiero_al_dia !== false,
        plantilla_snapshot: snap
      };
    };

    if (cert) {
      const certificadoCompleto = await enriquecerCertificado(cert);
      return NextResponse.json({
        valido: true,
        certificado: certificadoCompleto
      });
    }

    // 2. Si no lo encuentra por código exacto, probar búsqueda insensible a mayúsculas
    const { data: certList } = await admin
      .from('certificaciones')
      .select('*')
      .ilike('codigo_verificacion', `%${codigoNormalizado}%`)
      .limit(1);

    if (certList && certList.length > 0) {
      const certificadoCompleto = await enriquecerCertificado(certList[0]);
      return NextResponse.json({
        valido: true,
        certificado: certificadoCompleto
      });
    }

    return NextResponse.json({ valido: false, error: 'Código de certificado no encontrado' }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Error al validar certificado' }, { status: 500 });
  }
}
