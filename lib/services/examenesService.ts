import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { 
  PreguntaBanco, 
  PreguntaExamenEstudiante, 
  ResultadoEvaluacionExamen,
  DetalleCalificacionPregunta
} from '@/lib/types/examenes';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  return createClient(url, key);
}

// Fallback local en disco
function getLocalFallbackFile(codigoDiplomado?: string): string {
  const mapaArchivos: Record<string, string> = {
    'DIP-01': 'banco_preguntas_derecho_minero.json',
    'DIP-02': 'banco_preguntas_comercio_internacional.json',
    'DIP-03': 'banco_preguntas_geologia_minera.json',
    'DIP-04': 'banco_preguntas_geomecanica.json',
    'DIP-05': 'banco_preguntas_geometalurgia.json',
    'DIP-06': 'banco_preguntas_geotecnia_minera.json',
    'DIP-07': 'banco_preguntas_sistemas_integrados_hseq.json',
    'DIP-08': 'banco_preguntas_gerencia_estrategica_liderazgo.json',
    'DIP-09': 'banco_preguntas_gestion_ambiental.json'
  };
  const fileName = (codigoDiplomado && mapaArchivos[codigoDiplomado]) || mapaArchivos['DIP-01'];
  return path.join(process.cwd(), 'lib', 'data', fileName);
}

function leerBancoLocal(codigoDiplomado?: string): PreguntaBanco[] {
  try {
    const file = getLocalFallbackFile(codigoDiplomado);
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
    let query = sb.from('banco_preguntas').select('*').order('created_at', { ascending: false }).limit(5000);

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
  let locales = leerBancoLocal(filtros?.codigoDiplomado);
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
 * Configuración de sorteo por nivel de dificultad para cada examen modular.
 * Por defecto: 7 preguntas de nivel MEDIO y 3 preguntas de nivel ALTO (total = 10 preguntas).
 * Si en el banco hay menos de las requeridas en un nivel, se completa automáticamente con el otro nivel.
 */
export const CONFIGURACION_SORTEO_DIFICULTAD = {
  totalPreguntas: 10,
  distribucion: {
    MEDIO: 7, // 7 preguntas nivel medio
    ALTO: 3   // 3 preguntas nivel alto / avanzado
  }
};

/**
 * Sortear N preguntas aleatorias para el examen de un estudiante con balance de dificultad.
 * Oculta isCorrect y rationale para garantizar máxima integridad pedagógica.
 */
export async function sortearPreguntasExamen(params: {
  codigoDiplomado: string;
  modulo: string;
  cantidad?: number;
  distribucionDificultad?: { MEDIO?: number; ALTO?: number; FACIL?: number };
}): Promise<PreguntaExamenEstudiante[]> {
  const preguntasBanco = await obtenerPreguntasBanco({
    codigoDiplomado: params.codigoDiplomado,
    modulo: params.modulo,
    soloActivas: true
  });

  if (!preguntasBanco || preguntasBanco.length === 0) {
    return [];
  }

  const cantidadTotal = params.cantidad || CONFIGURACION_SORTEO_DIFICULTAD.totalPreguntas;
  const distribucion = params.distribucionDificultad || CONFIGURACION_SORTEO_DIFICULTAD.distribucion;

  // Helper para mezcla aleatoria uniforme (Fisher-Yates)
  const mezclar = (arr: PreguntaBanco[]) => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  };

  // Separar banco activo por dificultad
  const bancoMedio = preguntasBanco.filter(p => (p.dificultad || 'MEDIO').toUpperCase() === 'MEDIO');
  const bancoAlto = preguntasBanco.filter(p => ['ALTO', 'AVANZADO'].includes((p.dificultad || '').toUpperCase()));

  const cuantasMedioDeseadas = distribucion.MEDIO ?? 7;
  const cuantasAltoDeseadas = distribucion.ALTO ?? 3;

  const medioMezcladas = mezclar(bancoMedio);
  const altoMezcladas = mezclar(bancoAlto);

  const seleccionadasMedio = medioMezcladas.slice(0, cuantasMedioDeseadas);
  const seleccionadasAlto = altoMezcladas.slice(0, cuantasAltoDeseadas);

  let seleccionadas = [...seleccionadasMedio, ...seleccionadasAlto];

  // Si faltaron preguntas para completar la cantidad requerida (ej: si hay pocas de nivel alto),
  // se completan automáticamente con las restantes preguntas activas disponibles
  if (seleccionadas.length < cantidadTotal) {
    const yaElegidasIds = new Set(seleccionadas.map(p => p.id));
    const restantes = mezclar(preguntasBanco.filter(p => !yaElegidasIds.has(p.id)));
    const faltantes = cantidadTotal - seleccionadas.length;
    seleccionadas = [...seleccionadas, ...restantes.slice(0, faltantes)];
  }

  // Mezclar el examen final para intercalar niveles naturalmente
  const examenFinalMezclado = mezclar(seleccionadas.slice(0, cantidadTotal));

  // Transformar para el estudiante: eliminar respuestas correctas y rationales
  return examenFinalMezclado.map(p => ({
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
 * Calificar el examen entregado por el estudiante, generar retroalimentación formativa y
 * almacenar el registro detallado en public.notas_modulos de Supabase.
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
    let puntajeObtenido = 0;

    if (preguntaOriginal.tipo === 'multiple_select') {
      // Criterio proporcional para selección múltiple:
      // Cada acierto correcto suma proporcionalmente según el total de opciones correctas.
      // Las alternativas incorrectas marcadas descuentan proporcionalmente para evitar adivinanza aleatoria.
      const correctasMarcadas = marcadas.filter(c => correctas.includes(c)).length;
      const incorrectasMarcadas = marcadas.filter(c => !correctas.includes(c)).length;
      const totalIncorrectas = Math.max(1, preguntaOriginal.opciones.length - correctas.length);

      if (correctas.length > 0) {
        const fraccionAciertos = correctasMarcadas / correctas.length;
        const fraccionErrores = incorrectasMarcadas / totalIncorrectas;
        const fraccionNeta = Math.max(0, fraccionAciertos - fraccionErrores);
        puntajeObtenido = Number((fraccionNeta * puntosPorPregunta).toFixed(2));
      } else {
        puntajeObtenido = 0;
      }
      esCorrecta = puntajeObtenido > 0;
    } else {
      esCorrecta = marcadas.length === 1 && correctas.includes(marcadas[0]);
      puntajeObtenido = esCorrecta ? Number(puntosPorPregunta.toFixed(2)) : 0;
    }

    if (puntajeObtenido >= puntosPorPregunta) {
      aciertosTotales += 1;
    } else if (puntajeObtenido > 0) {
      aciertosTotales += Number((puntajeObtenido / puntosPorPregunta).toFixed(2));
    }

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

  // Nota final sobre 20 calculada a partir de la suma de puntajes obtenidos
  const sumaPuntajes = detalles.reduce((acc, d) => acc + d.puntajeObtenido, 0);
  const notaFinal = Math.min(20, Math.round(sumaPuntajes * 10) / 10);
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

  // Guardar en public.notas_modulos de Supabase (sin requerir tablas extras)
  try {
    const sb = getSupabaseClient();
    const dniLimpio = params.dni || '71234567';
    const modNorm = params.modulo;
    const nombreDip = todasDelModulo[0]?.diplomado || 'DIPLOMADO';

    const { data: existente } = await sb
      .from('notas_modulos')
      .select('id')
      .eq('dni_ce', dniLimpio)
      .eq('diplomado_numero', params.codigoDiplomado)
      .eq('modulo_nombre', modNorm)
      .limit(1);

    const payloadNotas = {
      dni_ce: dniLimpio,
      diplomado_numero: params.codigoDiplomado,
      diplomado_nombre: nombreDip,
      modulo_nombre: modNorm,
      nota: notaFinal,
      estado: aprobado ? 'APROBADO' : 'DESAPROBADO',
      respuestas: params.respuestasUsuario,
      detalles_examen: detalles,
      updated_at: new Date().toISOString()
    };

    if (existente && existente.length > 0) {
      await sb.from('notas_modulos').update(payloadNotas).eq('id', existente[0].id);
    } else {
      await sb.from('notas_modulos').insert([payloadNotas]);
    }
  } catch (err) {
    console.warn('No se pudo registrar intento en notas_modulos de Supabase:', err);
  }

  return resultado;
}

/**
 * Obtener el último intento y retroalimentación guardados en notas_modulos
 */
export async function obtenerIntentoNotasModulos(params: {
  codigoDiplomado: string;
  modulo: string;
  dni: string;
}): Promise<any | null> {
  try {
    const sb = getSupabaseClient();
    const { data } = await sb
      .from('notas_modulos')
      .select('*')
      .eq('dni_ce', params.dni)
      .eq('diplomado_numero', params.codigoDiplomado)
      .eq('modulo_nombre', params.modulo)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      return data[0];
    }
  } catch (e) {
    console.warn('Error al obtener intento de notas_modulos:', e);
  }
  return null;
}


/**
 * Obtiene los módulos que tienen preguntas cargadas y activas en el banco para un diplomado
 */
export async function obtenerModulosConExamen(codigoDiplomado: string): Promise<string[]> {
  const sb = getSupabaseClient();
  try {
    const { data, error } = await sb
      .from('banco_preguntas')
      .select('modulo')
      .eq('codigo_diplomado', codigoDiplomado)
      .eq('activo', true);

    if (!error && data && data.length > 0) {
      const set = new Set<string>();
      data.forEach((r: any) => {
        if (r.modulo) set.add(r.modulo);
      });
      return Array.from(set);
    }
  } catch (e) {
    console.warn('Error al consultar modulos con examen en Supabase:', e);
  }

  // Fallback local
  const locales = leerBancoLocal(codigoDiplomado);
  const set = new Set<string>();
  locales.filter(p => p.codigo_diplomado === codigoDiplomado && p.activo).forEach(p => {
    if (p.modulo) set.add(p.modulo);
  });
  return Array.from(set);
}
