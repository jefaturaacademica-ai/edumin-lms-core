import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { 
  PreguntaBanco, 
  PreguntaExamenEstudiante, 
  ExamenModuloConfig, 
  ResultadoEvaluacionExamen,
  DetalleCalificacionPregunta
} from '@/lib/types/examenes';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Fallback local en disco
function getLocalFallbackFile(): string {
  return path.resolve(process.cwd(), 'lib/data/banco_preguntas_derecho_minero.json');
}

function leerBancoLocal(): PreguntaBanco[] {
  try {
    const file = getLocalFallbackFile();
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return data.map((item: any, idx: number) => ({
        ...item,
        id: item.id || `local-pregunta-${idx + 1}`
      }));
    }
  } catch (err) {
    console.error('Error al leer banco local de preguntas:', err);
  }
  return [];
}

function guardarBancoLocal(preguntas: PreguntaBanco[]) {
  try {
    const file = getLocalFallbackFile();
    fs.writeFileSync(file, JSON.stringify(preguntas, null, 2), 'utf8');
  } catch (err) {
    console.error('Error al guardar banco local:', err);
  }
}

/**
 * Obtener lista de preguntas del banco con filtros
 */
export async function obtenerPreguntasBanco(filtros?: {
  codigoDiplomado?: string;
  modulo?: string;
  dificultad?: string;
  tipo?: string;
  busqueda?: string;
  soloActivas?: boolean;
}): Promise<PreguntaBanco[]> {
  const sb = getSupabaseClient();
  
  try {
    let query = sb.from('banco_preguntas').select('*').order('created_at', { ascending: false });

    if (filtros?.codigoDiplomado && filtros.codigoDiplomado !== 'TODOS') {
      query = query.eq('codigo_diplomado', filtros.codigoDiplomado);
    }
    if (filtros?.modulo && filtros.modulo !== 'TODOS') {
      query = query.ilike('modulo', `%${filtros.modulo.replace('Modulo', 'Módulo')}%`);
    }
    if (filtros?.dificultad && filtros.dificultad !== 'TODOS') {
      query = query.eq('dificultad', filtros.dificultad);
    }
    if (filtros?.tipo && filtros.tipo !== 'TODOS') {
      query = query.eq('tipo', filtros.tipo);
    }
    if (filtros?.soloActivas) {
      query = query.eq('activo', true);
    }

    const { data, error } = await query;
    if (!error && data && data.length > 0) {
      if (filtros?.busqueda && filtros.busqueda.trim()) {
        const term = filtros.busqueda.toLowerCase();
        return data.filter(p => p.pregunta.toLowerCase().includes(term));
      }
      return data;
    }
  } catch (e) {
    console.warn('Fallo consulta a Supabase banco_preguntas, usando fallback local:', e);
  }

  // Fallback local
  let locales = leerBancoLocal();
  if (filtros?.codigoDiplomado && filtros.codigoDiplomado !== 'TODOS') {
    locales = locales.filter(p => p.codigo_diplomado === filtros.codigoDiplomado);
  }
  if (filtros?.modulo && filtros.modulo !== 'TODOS') {
    const modNorm = filtros.modulo.toLowerCase().replace('ó', 'o');
    locales = locales.filter(p => p.modulo.toLowerCase().replace('ó', 'o').includes(modNorm));
  }
  if (filtros?.dificultad && filtros.dificultad !== 'TODOS') {
    locales = locales.filter(p => p.dificultad === filtros.dificultad);
  }
  if (filtros?.tipo && filtros.tipo !== 'TODOS') {
    locales = locales.filter(p => p.tipo === filtros.tipo);
  }
  if (filtros?.soloActivas) {
    locales = locales.filter(p => p.activo);
  }
  if (filtros?.busqueda && filtros.busqueda.trim()) {
    const term = filtros.busqueda.toLowerCase();
    locales = locales.filter(p => p.pregunta.toLowerCase().includes(term));
  }

  return locales;
}

/**
 * Guardar o actualizar una pregunta individual
 */
export async function guardarPreguntaBanco(pregunta: Partial<PreguntaBanco>): Promise<PreguntaBanco> {
  const sb = getSupabaseClient();
  const id = pregunta.id;

  const payload = {
    codigo_diplomado: pregunta.codigo_diplomado || 'DIP-01',
    diplomado: pregunta.diplomado || 'DERECHO MINERO',
    modulo: pregunta.modulo || 'Módulo 01',
    dificultad: pregunta.dificultad || 'MEDIO',
    tipo: pregunta.tipo || 'multiple_choice',
    pregunta: pregunta.pregunta || '',
    opciones: pregunta.opciones || [],
    hint: pregunta.hint || null,
    activo: pregunta.activo !== undefined ? pregunta.activo : true,
    updated_at: new Date().toISOString()
  };

  try {
    if (id && !id.startsWith('local-')) {
      const { data, error } = await sb.from('banco_preguntas').update(payload).eq('id', id).select().single();
      if (!error && data) return data;
    } else {
      const { data, error } = await sb.from('banco_preguntas').insert([payload]).select().single();
      if (!error && data) return data;
    }
  } catch (err) {
    console.warn('Error en Supabase guardarPregunta, actualizando fallback local:', err);
  }

  // Actualizar fallback local
  const locales = leerBancoLocal();
  let resultado: PreguntaBanco;
  if (id) {
    const idx = locales.findIndex(p => p.id === id);
    if (idx >= 0) {
      locales[idx] = { ...locales[idx], ...payload, id };
      resultado = locales[idx];
    } else {
      resultado = { ...payload, id } as PreguntaBanco;
      locales.unshift(resultado);
    }
  } else {
    resultado = { ...payload, id: `local-pregunta-${Date.now()}` } as PreguntaBanco;
    locales.unshift(resultado);
  }
  guardarBancoLocal(locales);
  return resultado;
}

/**
 * Eliminar pregunta del banco
 */
export async function eliminarPreguntaBanco(id: string): Promise<boolean> {
  const sb = getSupabaseClient();
  try {
    if (!id.startsWith('local-')) {
      const { error } = await sb.from('banco_preguntas').delete().eq('id', id);
      if (!error) return true;
    }
  } catch (err) {
    console.warn('Error eliminando en Supabase:', err);
  }

  // Eliminar en fallback local
  const locales = leerBancoLocal();
  const filtradas = locales.filter(p => p.id !== id);
  guardarBancoLocal(filtradas);
  return true;
}

/**
 * Cambiar estado activo/inactivo de una pregunta
 */
export async function alternarEstadoPreguntaBanco(id: string, activo: boolean): Promise<boolean> {
  const sb = getSupabaseClient();
  try {
    if (!id.startsWith('local-')) {
      const { error } = await sb.from('banco_preguntas').update({ activo, updated_at: new Date().toISOString() }).eq('id', id);
      if (!error) return true;
    }
  } catch (err) {
    console.warn('Error al actualizar estado en Supabase:', err);
  }

  const locales = leerBancoLocal();
  const p = locales.find(x => x.id === id);
  if (p) {
    p.activo = activo;
    guardarBancoLocal(locales);
  }
  return true;
}

/**
 * Sortear N preguntas aleatorias (por defecto 10) para el examen de un estudiante.
 * Oculta isCorrect y rationale para garantizar máxima integridad.
 */
export async function sortearPreguntasExamen(params: {
  codigoDiplomado: string;
  modulo: string;
  cantidad?: number;
}): Promise<PreguntaExamenEstudiante[]> {
  const cantidad = params.cantidad || 10;
  const preguntasBanco = await obtenerPreguntasBanco({
    codigoDiplomado: params.codigoDiplomado,
    modulo: params.modulo,
    soloActivas: true
  });

  if (!preguntasBanco || preguntasBanco.length === 0) {
    return [];
  }

  // Algoritmo Fisher-Yates para mezcla aleatoria uniforme
  const mezcladas = [...preguntasBanco];
  for (let i = mezcladas.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [mezcladas[i], mezcladas[j]] = [mezcladas[j], mezcladas[i]];
  }

  // Tomar las primeras N
  const seleccionadas = mezcladas.slice(0, Math.min(cantidad, mezcladas.length));

  // Transformar para el estudiante: eliminar respuestas correctas y rationales
  return seleccionadas.map(p => ({
    id: p.id,
    codigo_diplomado: p.codigo_diplomado,
    modulo: p.modulo,
    tipo: p.tipo,
    dificultad: p.dificultad,
    pregunta: p.pregunta,
    opciones: (p.opciones || []).map((opt, idx) => ({
      indice: idx,
      text: opt.text
    })),
    hint: p.hint
  }));
}

/**
 * Calificar el examen entregado por el estudiante y generar retroalimentación detallada
 */
export async function calificarExamen(params: {
  codigoDiplomado: string;
  modulo: string;
  dni: string;
  respuestasUsuario: Record<string, number | number[]>; // preguntaId -> indice o indices marcados
}): Promise<ResultadoEvaluacionExamen> {
  const preguntasIds = Object.keys(params.respuestasUsuario);
  
  // Obtener las preguntas originales con sus respuestas correctas
  const todasDelModulo = await obtenerPreguntasBanco({
    codigoDiplomado: params.codigoDiplomado,
    modulo: params.modulo
  });

  const mapaBanco = new Map<string, PreguntaBanco>();
  todasDelModulo.forEach(p => mapaBanco.set(p.id, p));

  const totalPreguntas = preguntasIds.length;
  const puntosPorPregunta = totalPreguntas > 0 ? (20 / totalPreguntas) : 2;
  
  let aciertosTotales = 0;
  const detalles: DetalleCalificacionPregunta[] = [];

  for (const pId of preguntasIds) {
    const preguntaOriginal = mapaBanco.get(pId);
    if (!preguntaOriginal) continue;

    const respuestaDada = params.respuestasUsuario[pId];
    // Normalizar a array de números
    const marcadas: number[] = Array.isArray(respuestaDada)
      ? respuestaDada.map(Number)
      : respuestaDada !== undefined && respuestaDada !== null
        ? [Number(respuestaDada)]
        : [];

    const correctas: number[] = [];
    preguntaOriginal.opciones.forEach((opt, idx) => {
      if (opt.isCorrect) correctas.push(idx);
    });

    let esCorrecta = false;
    if (preguntaOriginal.tipo === 'multiple_select') {
      // En selección múltiple, deben coincidir exactamente todas las correctas
      const sonIguales = correctas.length === marcadas.length &&
        correctas.every(c => marcadas.includes(c));
      esCorrecta = sonIguales;
    } else {
      // En opción única, debe coincidir la única opción correcta
      esCorrecta = marcadas.length === 1 && correctas.includes(marcadas[0]);
    }

    if (esCorrecta) {
      aciertosTotales++;
    }

    const puntajeObtenido = esCorrecta ? Number(puntosPorPregunta.toFixed(2)) : 0;

    detalles.push({
      preguntaId: pId,
      pregunta: preguntaOriginal.pregunta,
      tipo: preguntaOriginal.tipo,
      opcionesMarcadas: marcadas,
      opcionesCorrectas: correctas,
      esCorrecta: esCorrecta,
      puntajeObtenido: puntajeObtenido,
      puntajeMaximoPregunta: Number(puntosPorPregunta.toFixed(2)),
      hint: preguntaOriginal.hint,
      desgloseOpciones: preguntaOriginal.opciones.map((opt, idx) => ({
        indice: idx,
        text: opt.text,
        isCorrect: Boolean(opt.isCorrect),
        marcadaPorAlumno: marcadas.includes(idx),
        rationale: opt.rationale
      }))
    });
  }

  // Nota final sobre 20 redondeada a 2 decimales o entero
  const notaFinal = Math.min(20, Math.round((aciertosTotales * puntosPorPregunta) * 10) / 10);
  const notaAprobatoria = 12.00;
  const aprobado = notaFinal >= notaAprobatoria;

  const resultado: ResultadoEvaluacionExamen = {
    nota: notaFinal,
    aprobado: aprobado,
    notaAprobatoria: notaAprobatoria,
    totalPreguntas: totalPreguntas,
    totalAciertos: aciertosTotales,
    detalles: detalles
  };

  // Guardar intento en Supabase si la tabla existe
  try {
    const sb = getSupabaseClient();
    await sb.from('examenes_intentos').insert([{
      dni: params.dni || '71234567',
      codigo_diplomado: params.codigoDiplomado,
      modulo: params.modulo,
      preguntas_ids: preguntasIds,
      respuestas: params.respuestasUsuario,
      detalles_calificacion: detalles,
      nota: notaFinal,
      aprobado: aprobado,
      fecha_envio: new Date().toISOString()
    }]);
  } catch (err) {
    console.warn('No se pudo registrar intento en Supabase:', err);
  }

  return resultado;
}
