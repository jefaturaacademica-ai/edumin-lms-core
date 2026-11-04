import { NextRequest, NextResponse } from 'next/server';
import { 
  obtenerTodasConfiguraciones, 
  obtenerConfiguracionExamen,
  guardarConfiguracionExamen,
  guardarConfiguracionesLote
} from '@/lib/services/examenesConfigService';
import { obtenerConteoDificultadBanco } from '@/lib/services/examenesService';
import type { ConfiguracionExamenItem } from '@/lib/types/examenes';

/**
 * GET: Obtener lista de configuraciones de exámenes
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accion = searchParams.get('accion');
    const tipo_programa = searchParams.get('tipo_programa') || 'todos';
    const codigo_programa = searchParams.get('codigo_programa') || undefined;
    const modulo = searchParams.get('modulo') || undefined;
    const busqueda = searchParams.get('busqueda') || undefined;
    const aplicaExamenParam = searchParams.get('aplica_examen');
    const aplica_examen = aplicaExamenParam !== null ? aplicaExamenParam === 'true' : undefined;

    // Si pide disponibilidad de preguntas en el banco para validación de niveles
    if (accion === 'disponibilidad_banco' && codigo_programa) {
      const conteo = await obtenerConteoDificultadBanco(codigo_programa, modulo);
      return NextResponse.json({
        success: true,
        codigo_programa,
        modulo,
        disponibilidad: conteo
      });
    }

    // Si pide un módulo específico directamente
    if (codigo_programa && modulo) {
      const config = obtenerConfiguracionExamen(codigo_programa, modulo);
      return NextResponse.json({
        success: true,
        data: config
      });
    }

    const configs = await obtenerTodasConfiguraciones({
      tipo_programa,
      codigo_programa,
      aplica_examen,
      busqueda
    });

    return NextResponse.json({
      success: true,
      total: configs.length,
      data: configs
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/examenes/configuracion:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST / PUT: Actualizar configuración de examen
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Si es un array de configuraciones en lote
    if (Array.isArray(body)) {
      const ok = await guardarConfiguracionesLote(body);
      return NextResponse.json({
        success: ok,
        total: body.length,
        mensaje: 'Configuraciones actualizadas exitosamente'
      });
    }

    const config: ConfiguracionExamenItem = body;

    if (!config.codigo_programa || !config.modulo) {
      return NextResponse.json({
        success: false,
        error: 'Se requieren codigo_programa y modulo'
      }, { status: 400 });
    }

    // Normalizaciones y validaciones
    const tiempo_minutos = Math.max(1, Math.min(180, Number(config.tiempo_minutos) || 30));
    const cantidad_preguntas = Math.max(1, Math.min(50, Number(config.cantidad_preguntas) || 10));
    const nota_minima = Math.max(0, Math.min(20, Number(config.nota_minima) ?? 12));
    const preguntas_facil = Math.max(0, Number(config.preguntas_facil) || 0);
    const preguntas_medio = Math.max(0, Number(config.preguntas_medio) || 0);
    const preguntas_dificil = Math.max(0, Number(config.preguntas_dificil) || 0);
    const preguntas_opcion_unica = Math.max(0, Number(config.preguntas_opcion_unica) ?? (cantidad_preguntas - 3));
    const preguntas_opcion_multiple = Math.max(0, Number(config.preguntas_opcion_multiple) ?? (cantidad_preguntas - preguntas_opcion_unica));
    const intentos_permitidos = Math.max(1, Number(config.intentos_permitidos) || 3);

    const configLimpia: ConfiguracionExamenItem = {
      id: config.id || `${config.codigo_programa}_${config.modulo}`,
      codigo_programa: config.codigo_programa.trim().toUpperCase(),
      nombre_programa: (config.nombre_programa || config.codigo_programa).trim(),
      tipo_programa: config.tipo_programa || (config.codigo_programa.startsWith('TAL-') ? 'taller' : config.codigo_programa.startsWith('CUR-') ? 'curso' : 'diplomado'),
      modulo: config.modulo.trim(),
      aplica_examen: Boolean(config.aplica_examen),
      tiempo_minutos,
      cantidad_preguntas,
      preguntas_facil,
      preguntas_medio,
      preguntas_dificil,
      preguntas_opcion_unica,
      preguntas_opcion_multiple,
      nota_minima,
      intentos_permitidos,
      activo: config.activo !== undefined ? Boolean(config.activo) : true,
      updated_at: new Date().toISOString()
    };

    // Validaciones cuando aplica examen está activo
    if (configLimpia.aplica_examen) {
      const conteoBanco = await obtenerConteoDificultadBanco(configLimpia.codigo_programa, configLimpia.modulo);
      
      // 1. Debe tener preguntas en el banco para habilitar examen
      if (conteoBanco.total === 0) {
        return NextResponse.json({
          success: false,
          error: `No se puede activar el examen para ${configLimpia.codigo_programa} (${configLimpia.modulo}) porque no tiene preguntas registradas en el banco de preguntas.`
        }, { status: 400 });
      }

      // 2. La suma de preguntas por nivel debe ser exactamente igual al total configurado
      const sumaNiveles = configLimpia.preguntas_facil + configLimpia.preguntas_medio + configLimpia.preguntas_dificil;
      if (sumaNiveles !== configLimpia.cantidad_preguntas) {
        return NextResponse.json({
          success: false,
          error: `La suma de preguntas por nivel (${sumaNiveles}) debe ser exactamente igual a la cantidad total de preguntas (${configLimpia.cantidad_preguntas}).`
        }, { status: 400 });
      }

      // 3. No permitir asignar preguntas a niveles que no tienen banco disponible
      if (configLimpia.preguntas_dificil > 0 && conteoBanco.dificil === 0) {
        return NextResponse.json({
          success: false,
          error: `No puedes asignar preguntas difíciles a ${configLimpia.codigo_programa} porque no hay preguntas difíciles registradas en el banco.`
        }, { status: 400 });
      }
      if (configLimpia.preguntas_facil > 0 && conteoBanco.facil === 0) {
        return NextResponse.json({
          success: false,
          error: `No puedes asignar preguntas fáciles a ${configLimpia.codigo_programa} porque no hay preguntas fáciles registradas en el banco.`
        }, { status: 400 });
      }
      if (configLimpia.preguntas_medio > 0 && conteoBanco.medio === 0) {
        return NextResponse.json({
          success: false,
          error: `No puedes asignar preguntas medias a ${configLimpia.codigo_programa} porque no hay preguntas medias registradas en el banco.`
        }, { status: 400 });
      }

      // 4. La suma de preguntas por tipo debe ser exactamente igual al total configurado
      const sumaTipos = (configLimpia.preguntas_opcion_unica ?? 0) + (configLimpia.preguntas_opcion_multiple ?? 0);
      if (sumaTipos !== configLimpia.cantidad_preguntas) {
        return NextResponse.json({
          success: false,
          error: `La suma de preguntas por tipo (${sumaTipos}) debe ser exactamente igual a la cantidad total de preguntas (${configLimpia.cantidad_preguntas}).`
        }, { status: 400 });
      }

      // 5. Validar disponibilidad por tipo en el banco
      if ((configLimpia.preguntas_opcion_unica ?? 0) > conteoBanco.opcion_unica) {
        return NextResponse.json({
          success: false,
          error: `No puedes asignar ${configLimpia.preguntas_opcion_unica} preguntas de opción única porque solo hay ${conteoBanco.opcion_unica} disponibles en el banco.`
        }, { status: 400 });
      }
      if ((configLimpia.preguntas_opcion_multiple ?? 0) > conteoBanco.opcion_multiple) {
        return NextResponse.json({
          success: false,
          error: `No puedes asignar ${configLimpia.preguntas_opcion_multiple} preguntas de selección múltiple porque solo hay ${conteoBanco.opcion_multiple} disponibles en el banco.`
        }, { status: 400 });
      }
    }

    const exito = await guardarConfiguracionExamen(configLimpia);

    return NextResponse.json({
      success: exito,
      data: configLimpia,
      mensaje: 'Configuración guardada exitosamente'
    });
  } catch (error: any) {
    console.error('Error en POST /api/admin/examenes/configuracion:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
