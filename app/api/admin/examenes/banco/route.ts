import { NextRequest, NextResponse } from 'next/server';
import { 
  obtenerPreguntasBanco, 
  guardarPreguntaBanco, 
  eliminarPreguntaBanco, 
  alternarEstadoPreguntaBanco 
} from '@/lib/services/examenesService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawDip = searchParams.get('codigoDiplomado');
    const rawMod = searchParams.get('modulo');
    const rawDif = searchParams.get('dificultad');
    const rawTipo = searchParams.get('tipo');
    const rawTipoProg = searchParams.get('tipoPrograma');
    const busqueda = searchParams.get('busqueda') || undefined;

    const codigoDiplomado = (rawDip && rawDip !== 'TODOS' && rawDip !== 'TODOS_DIP' && rawDip !== 'TODOS_CUR') ? rawDip : undefined;
    const modulo = (rawMod && rawMod !== 'TODOS') ? rawMod : undefined;
    const dificultad = (rawDif && rawDif !== 'TODOS') ? rawDif : undefined;
    const tipo = (rawTipo && rawTipo !== 'TODOS') ? rawTipo : undefined;
    const tipoPrograma = (rawTipoProg && rawTipoProg !== 'TODOS') ? rawTipoProg : undefined;

    const preguntas = await obtenerPreguntasBanco({
      codigoDiplomado,
      modulo,
      dificultad,
      tipo,
      tipoPrograma,
      busqueda
    });

    return NextResponse.json({
      success: true,
      total: preguntas.length,
      preguntas
    });
  } catch (error: any) {
    console.error('Error en GET /api/admin/examenes/banco:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Soporte para importación en lote de preguntas
    if (Array.isArray(body)) {
      if (body.length === 0) {
        return NextResponse.json({ success: false, error: 'El lote de preguntas está vacío' }, { status: 400 });
      }

      // Validación estricta: cada pregunta debe tener exactamente 5 alternativas
      for (let i = 0; i < body.length; i++) {
        const p = body[i];
        const opciones = p.opciones || p.answerOptions;
        if (!Array.isArray(opciones) || opciones.length !== 5) {
          const numOpts = Array.isArray(opciones) ? opciones.length : 0;
          const previewPregunta = (p.pregunta || p.question || '').substring(0, 50);
          return NextResponse.json({
            success: false,
            error: `Error de validación en pregunta #${i + 1} ("${previewPregunta}..."): tiene ${numOpts} alternativas. Todas las preguntas deben tener exactamente 5 alternativas.`
          }, { status: 400 });
        }
      }

      const resultados = [];
      for (const p of body) {
        const guardada = await guardarPreguntaBanco(p);
        resultados.push(guardada);
      }
      return NextResponse.json({
        success: true,
        mensaje: `${resultados.length} preguntas guardadas correctamente`,
        total: resultados.length
      });
    }

    // Validación para guardado de pregunta individual
    const opcionesIndiv = body.opciones || body.answerOptions;
    if (opcionesIndiv && (!Array.isArray(opcionesIndiv) || opcionesIndiv.length !== 5)) {
      return NextResponse.json({
        success: false,
        error: `La pregunta debe tener exactamente 5 alternativas (tiene ${Array.isArray(opcionesIndiv) ? opcionesIndiv.length : 0}).`
      }, { status: 400 });
    }

    // Guardado de pregunta individual
    const nuevaPregunta = await guardarPreguntaBanco(body);
    return NextResponse.json({
      success: true,
      mensaje: 'Pregunta guardada exitosamente',
      pregunta: nuevaPregunta
    });
  } catch (error: any) {
    console.error('Error en POST /api/admin/examenes/banco:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ success: false, error: 'Se requiere el ID de la pregunta' }, { status: 400 });
    }

    // Si viene solo para cambiar estado activo/inactivo
    if (body.soloCambioEstado && body.activo !== undefined) {
      await alternarEstadoPreguntaBanco(body.id, Boolean(body.activo));
      return NextResponse.json({
        success: true,
        mensaje: `Pregunta ${body.activo ? 'activada' : 'pausada'} con éxito`
      });
    }

    const actualizada = await guardarPreguntaBanco(body);
    return NextResponse.json({
      success: true,
      mensaje: 'Pregunta actualizada exitosamente',
      pregunta: actualizada
    });
  } catch (error: any) {
    console.error('Error en PUT /api/admin/examenes/banco:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Parámetro id es obligatorio' }, { status: 400 });
    }

    await eliminarPreguntaBanco(id);
    return NextResponse.json({
      success: true,
      mensaje: 'Pregunta eliminada exitosamente del banco'
    });
  } catch (error: any) {
    console.error('Error en DELETE /api/admin/examenes/banco:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
