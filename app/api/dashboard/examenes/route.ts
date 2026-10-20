import { NextRequest, NextResponse } from 'next/server';
import { sortearPreguntasExamen, calificarExamen } from '@/lib/services/examenesService';

/**
 * GET: Obtener las 10 preguntas sorteadas del banco para este módulo
 * Oculta isCorrect y rationale
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const codigoDiplomado = searchParams.get('codigoDiplomado');
    const modulo = searchParams.get('modulo');
    const cantidadStr = searchParams.get('cantidad');
    const cantidad = cantidadStr ? parseInt(cantidadStr, 10) : 10;

    if (!codigoDiplomado || !modulo) {
      return NextResponse.json({
        success: false,
        error: 'Se requiere codigoDiplomado y modulo'
      }, { status: 400 });
    }

    const preguntas = await sortearPreguntasExamen({
      codigoDiplomado,
      modulo,
      cantidad
    });

    return NextResponse.json({
      success: true,
      total: preguntas.length,
      codigoDiplomado,
      modulo,
      preguntas
    });
  } catch (error: any) {
    console.error('Error en GET /api/dashboard/examenes:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST: Enviar respuestas del estudiante, calcular calificación y retornar desglose con rationale
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigoDiplomado, modulo, dni, respuestasUsuario } = body;

    if (!codigoDiplomado || !modulo || !respuestasUsuario) {
      return NextResponse.json({
        success: false,
        error: 'Faltan parámetros requeridos: codigoDiplomado, modulo, respuestasUsuario'
      }, { status: 400 });
    }

    const resultado = await calificarExamen({
      codigoDiplomado,
      modulo,
      dni: dni || '71234567',
      respuestasUsuario
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
