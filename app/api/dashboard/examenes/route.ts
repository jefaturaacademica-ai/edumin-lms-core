import { NextRequest, NextResponse } from 'next/server';
import { 
  sortearPreguntasExamen, 
  calificarExamen, 
  obtenerEstadoIntentosExamen,
  obtenerIntentosPorPrograma,
  obtenerModulosConExamen
} from '@/lib/services/examenesService';
import {
  obtenerConfiguracionExamen,
  obtenerTodasConfiguraciones
} from '@/lib/services/examenesConfigService';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

async function resolverDniEstudiante(dniParam?: string | null): Promise<string> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminClient();
      const { data: p } = await admin
        .from('profiles')
        .select('dni_ce')
        .eq('id', user.id)
        .maybeSingle();
      if (p?.dni_ce) return String(p.dni_ce).trim();

      if (user.email) {
        const { data: pEmail } = await admin
          .from('profiles')
          .select('dni_ce')
          .eq('email', user.email)
          .maybeSingle();
        if (pEmail?.dni_ce) return String(pEmail.dni_ce).trim();
      }
    }
  } catch {
    // Fallback a parámetro explícito
  }
  return (dniParam || '71234567').trim();
}

/**
 * GET: Obtener preguntas sorteadas del banco, disponibilidad o intentos previos del estudiante
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoDiplomado = searchParams.get('codigoDiplomado');
    const modulo = searchParams.get('modulo');
    const accion = searchParams.get('accion');
    const dni = await resolverDniEstudiante(searchParams.get('dni'));

    if (!codigoDiplomado) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere codigoDiplomado'
      }, { status: 400 });
    }

    // Consultar qué módulos tienen preguntas disponibles y su configuración para este diplomado
    if (accion === 'disponibilidad') {
      const [modulos, configs] = await Promise.all([
        obtenerModulosConExamen(codigoDiplomado),
        obtenerTodasConfiguraciones({ codigo_programa: codigoDiplomado })
      ]);
      const configsPorModulo: Record<string, {
        aplica_examen: boolean;
        tiempo_minutos: number;
        cantidad_preguntas: number;
        nota_minima: number;
        intentos_permitidos: number;
      }> = {};
      configs.forEach(c => {
        configsPorModulo[c.modulo] = {
          aplica_examen: c.aplica_examen,
          tiempo_minutos: c.tiempo_minutos,
          cantidad_preguntas: c.cantidad_preguntas,
          nota_minima: c.nota_minima,
          intentos_permitidos: c.intentos_permitidos
        };
      });
      return NextResponse.json({
        success: true,
        codigoDiplomado,
        modulosConPreguntas: modulos,
        configsPorModulo
      });
    }

    // Consultar todos los intentos guardados en notas_modulos para este programa
    if (accion === 'mis_intentos') {
      const intentos = await obtenerIntentosPorPrograma({
        codigoDiplomado,
        dni
      });
      return NextResponse.json({
        success: true,
        codigoDiplomado,
        dni,
        intentos
      });
    }

    if (!modulo) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere modulo'
      }, { status: 400 });
    }

    const config = obtenerConfiguracionExamen(codigoDiplomado, modulo);
    const configPublica = {
      id: config.id,
      aplica_examen: config.aplica_examen,
      tiempo_minutos: config.tiempo_minutos,
      cantidad_preguntas: config.cantidad_preguntas,
      nota_minima: config.nota_minima,
      intentos_permitidos: config.intentos_permitidos
    };

    // Consultar el intento guardado y conteo de intentos en notas_modulos
    if (accion === 'ver_intento') {
      const { intentosRealizados, ultimoIntento } = await obtenerEstadoIntentosExamen({
        codigoDiplomado,
        modulo,
        dni
      });
      return NextResponse.json({
        success: true,
        intento: ultimoIntento,
        intentosRealizados,
        intentosPermitidos: config.intentos_permitidos ?? 1,
        config: configPublica
      });
    }

    // Si no aplica examen
    if (config.aplica_examen === false) {
      return NextResponse.json({
        success: true,
        aplica_examen: false,
        total: 0,
        codigoDiplomado,
        modulo,
        config: configPublica,
        preguntas: []
      });
    }

    // Verificar si el estudiante ya agotó sus intentos permitidos
    const intentosPermitidos = config.intentos_permitidos ?? 1;
    const { intentosRealizados, ultimoIntento } = await obtenerEstadoIntentosExamen({
      codigoDiplomado,
      modulo,
      dni
    });

    if (intentosRealizados >= intentosPermitidos && ultimoIntento) {
      return NextResponse.json({
        success: true,
        aplica_examen: true,
        intentoAgotado: true,
        intentosRealizados,
        intentosPermitidos,
        intento: ultimoIntento,
        codigoDiplomado,
        modulo,
        config: configPublica,
        preguntas: []
      });
    }

    const cantidadStr = searchParams.get('cantidad');
    const cantidad = cantidadStr ? parseInt(cantidadStr, 10) : config.cantidad_preguntas;

    const preguntas = await sortearPreguntasExamen({
      codigoDiplomado,
      modulo,
      cantidad
    });

    return NextResponse.json({
      success: true,
      aplica_examen: true,
      intentoAgotado: false,
      intentosRealizados,
      intentosPermitidos,
      total: preguntas.length,
      codigoDiplomado,
      modulo,
      config: configPublica,
      preguntas
    });
  } catch (error: any) {
    console.error('Error en GET /api/dashboard/examenes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Enviar respuestas del estudiante, validar intentos disponibles, calcular calificación y guardar en Supabase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigoDiplomado, modulo, dni: dniBody, respuestasUsuario, fechaInicio } = body;

    if (!codigoDiplomado || !modulo || !respuestasUsuario) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos: codigoDiplomado, modulo, respuestasUsuario'
      }, { status: 400 });
    }

    const dni = await resolverDniEstudiante(dniBody);
    const config = obtenerConfiguracionExamen(codigoDiplomado, modulo);
    const intentosPermitidos = config.intentos_permitidos ?? 1;

    const { intentosRealizados, ultimoIntento } = await obtenerEstadoIntentosExamen({
      codigoDiplomado,
      modulo,
      dni
    });

    if (intentosRealizados >= intentosPermitidos && ultimoIntento) {
      return NextResponse.json({
        success: false,
        intentoAgotado: true,
        intento: ultimoIntento,
        error: 'Ya agotaste el límite de intentos permitidos para este examen.'
      }, { status: 409 });
    }

    const fechaFin = new Date().toISOString();
    const resultado = await calificarExamen({
      codigoDiplomado,
      modulo,
      dni,
      respuestasUsuario,
      fechaInicio: typeof fechaInicio === 'string' && fechaInicio ? fechaInicio : null,
      fechaFin
    });

    return NextResponse.json({
      success: true,
      resultado
    });
  } catch (error: any) {
    console.error('Error en POST /api/dashboard/examenes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
