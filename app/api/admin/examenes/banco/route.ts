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
    const codigoDiplomado = searchParams.get('codigoDiplomado') || undefined;
    const modulo = searchParams.get('modulo') || undefined;
    const dificultad = searchParams.get('dificultad') || undefined;
    const tipo = searchParams.get('tipo') || undefined;
    const busqueda = searchParams.get('busqueda') || undefined;

    const preguntas = await obtenerPreguntasBanco({
      codigoDiplomado,
      modulo,
      dificultad,
      tipo,
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
