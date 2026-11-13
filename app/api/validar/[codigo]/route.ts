import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { evaluarReglasCertificados, parseFechaCertificadoMs } from '@/lib/utils/credits';

async function verificarHabilitacionCertificado(admin: ReturnType<typeof createAdminClient>, certData: any): Promise<boolean> {
  if (certData.habilitado === false || certData.estado === 'Retenido_Deuda' || certData.estado === 'Anulado' || certData.estado_financiero_al_dia === false) {
    return false;
  }

  const tipoUpper = String(certData.tipo || '').toUpperCase();
  if (tipoUpper !== 'MODULAR' && tipoUpper !== 'DIPLOMA') {
    return true;
  }

  if (!certData.dni_ce) return true;

  try {
    const { data: profile } = await admin
      .from('profiles')
      .select('id, dni_ce, bloqueado, cuotas_pagadas, cuotas_totales, tipo_pago')
      .eq('dni_ce', certData.dni_ce)
      .maybeSingle();

    if (!profile) return true;
    const reglas = evaluarReglasCertificados({
      cuotasPagadas: profile.cuotas_pagadas,
      cuotasTotales: profile.cuotas_totales,
      tipoPago: profile.tipo_pago,
    });
    if (reglas.sinRestriccionPago) return true;

    if (tipoUpper === 'DIPLOMA') {
      return reglas.cuotasPagadas >= reglas.cuotasTotales;
    }

    // MODULAR: verificar posición cronológica frente al límite habilitado por cuota
    const { data: modularesDni } = await admin
      .from('certificaciones')
      .select('codigo_verificacion, fecha_emision, created_at')
      .eq('dni_ce', certData.dni_ce)
      .eq('tipo', 'MODULAR');

    if (Array.isArray(modularesDni) && modularesDni.length > 0) {
      const ordenados = [...modularesDni].sort((a: any, b: any) => {
        const msA = parseFechaCertificadoMs(a.created_at || a.fecha_emision) ?? 0;
        const msB = parseFechaCertificadoMs(b.created_at || b.fecha_emision) ?? 0;
        return msA - msB;
      });
      const rank = ordenados.findIndex((m: any) => m.codigo_verificacion === certData.codigo_verificacion);
      if (rank >= 0) {
        return rank < reglas.limiteModularesPorCuota;
      }
    }
  } catch {
    // Si falla la consulta auxiliar, respetar estado_financiero_al_dia ya validado arriba
  }

  return true;
}

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

    const certEncontrado = cert || (await admin
      .from('certificaciones')
      .select('*')
      .ilike('codigo_verificacion', `%${codigoNormalizado}%`)
      .limit(1)).data?.[0] || null;

    if (certEncontrado) {
      const estaHabilitado = await verificarHabilitacionCertificado(admin, certEncontrado);
      if (!estaHabilitado) {
        return NextResponse.json(
          {
            valido: false,
            bloqueado: true,
            error: 'Este certificado aún se encuentra bloqueado por cuota pendiente y no ha sido habilitado oficialmente.'
          },
          { status: 403 }
        );
      }

      const certificadoCompleto = await enriquecerCertificado(certEncontrado);
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
