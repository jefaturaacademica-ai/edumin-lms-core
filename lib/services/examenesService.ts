import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { 
  PreguntaBanco, 
  PreguntaExamenEstudiante, 
  ResultadoEvaluacionExamen,
  DetalleCalificacionPregunta
} from '@/lib/types/examenes';
import { obtenerConfiguracionExamen } from '@/lib/services/examenesConfigService';
import { formatearCodigoModulo } from '@/lib/utils/profileParser';

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

// Mapa de bancos locales en disco
const MAPA_BANCOS_LOCALES: Record<string, string> = {
  'DIP-01': 'banco_preguntas_derecho_minero.json',
  'DIP-02': 'banco_preguntas_comercio_internacional.json',
  'DIP-03': 'banco_preguntas_geologia_minera.json',
  'DIP-04': 'banco_preguntas_geomecanica.json',
  'DIP-05': 'banco_preguntas_geometalurgia.json',
  'DIP-06': 'banco_preguntas_geotecnia_minera.json',
  'DIP-07': 'banco_preguntas_sistemas_integrados_hseq.json',
  'DIP-08': 'banco_preguntas_gerencia_estrategica_liderazgo.json',
  'DIP-09': 'banco_preguntas_gestion_ambiental.json',
  'DIP-10': 'banco_preguntas_gestion_control_operativo_procesos_mineros.json',
  'DIP-11': 'banco_preguntas_gestion_operaciones_industriales.json',
  'DIP-12': 'banco_preguntas_gestion_estrategica_empresas.json',
  'DIP-13': 'banco_preguntas_gestion_logistica_compras_inventarios.json',
  'DIP-14': 'banco_preguntas_gestion_logistica_almacenes_mineria.json',
  'DIP-15': 'banco_preguntas_gestion_logistica_proveedores_industria_mineria.json',
  'DIP-16': 'banco_preguntas_gestion_minera.json',
  'DIP-17': 'banco_preguntas_legislacion_laboral_planillas.json',
  'DIP-18': 'banco_preguntas_mineria_4_0.json',
  'DIP-19': 'banco_preguntas_prevencion_conflictividad_social.json',
  'DIP-20': 'banco_preguntas_seguridad_industrial.json',
  'DIP-21': 'banco_preguntas_seguridad_salud_ocupacional.json',
  'DIP-22': 'banco_preguntas_supply_chain_management.json',
  'CUR-01': 'banco_preguntas_curso_01.json',
  'CUR-02': 'banco_preguntas_curso_02.json',
  'CUR-03': 'banco_preguntas_curso_03.json',
  'CUR-04': 'banco_preguntas_curso_04.json',
  'CUR-05': 'banco_preguntas_curso_05.json',
  'CUR-06': 'banco_preguntas_curso_06.json',
  'CUR-07': 'banco_preguntas_curso_07.json',
  'CUR-08': 'banco_preguntas_curso_08.json',
  'CUR-09': 'banco_preguntas_curso_09.json',
  'CUR-10': 'banco_preguntas_curso_10.json',
  'CUR-11': 'banco_preguntas_curso_11.json',
  'CUR-12': 'banco_preguntas_curso_12.json',
  'CUR-13': 'banco_preguntas_curso_13.json',
  'CUR-14': 'banco_preguntas_curso_14.json',
  'CUR-15': 'banco_preguntas_curso_15.json',
  'CUR-16': 'banco_preguntas_curso_16.json',
  'CUR-17': 'banco_preguntas_curso_17.json',
  'CUR-18': 'banco_preguntas_curso_18.json',
  'CUR-19': 'banco_preguntas_curso_19.json',
  'CUR-20': 'banco_preguntas_curso_20.json',
  'CUR-21': 'banco_preguntas_curso_21.json',
  'CUR-22': 'banco_preguntas_curso_22.json',
  'CUR-23': 'banco_preguntas_curso_23.json',
  'CUR-24': 'banco_preguntas_curso_24.json',
  'CUR-25': 'banco_preguntas_curso_25.json',
  'CUR-26': 'banco_preguntas_curso_26.json',
  'CUR-27': 'banco_preguntas_curso_27.json',
  'CUR-28': 'banco_preguntas_curso_28.json',
  'CUR-29': 'banco_preguntas_curso_29.json',
  'CUR-30': 'banco_preguntas_curso_30.json',
  'CUR-31': 'banco_preguntas_curso_31.json',
  'CUR-32': 'banco_preguntas_curso_32.json',
  'CUR-33': 'banco_preguntas_curso_33.json',
  'CUR-34': 'banco_preguntas_curso_34.json',
  'CUR-35': 'banco_preguntas_curso_35.json',
  'CUR-36': 'banco_preguntas_curso_36.json',
  'CUR-37': 'banco_preguntas_curso_37.json',
  'CUR-38': 'banco_preguntas_curso_38.json',
  'CUR-39': 'banco_preguntas_curso_39.json',
  'CUR-40': 'banco_preguntas_curso_40.json',
  'CUR-41': 'banco_preguntas_curso_41.json',
  'CUR-42': 'banco_preguntas_curso_42.json',
  'CUR-43': 'banco_preguntas_curso_43.json',
  'CUR-44': 'banco_preguntas_curso_44.json',
  'CUR-45': 'banco_preguntas_curso_45.json',
  'CUR-46': 'banco_preguntas_curso_46.json',
  'CUR-47': 'banco_preguntas_curso_47.json',
  'CUR-48': 'banco_preguntas_curso_48.json',
  'CUR-49': 'banco_preguntas_curso_49.json',
  'CUR-50': 'banco_preguntas_curso_50.json',
  'CUR-51': 'banco_preguntas_curso_51.json',
  'CUR-52': 'banco_preguntas_curso_52.json',
  'CUR-53': 'banco_preguntas_curso_53.json',
  'CUR-54': 'banco_preguntas_curso_54.json',
  'CUR-55': 'banco_preguntas_curso_55.json',
  'CUR-56': 'banco_preguntas_curso_56.json',
  'CUR-57': 'banco_preguntas_curso_57.json',
  'CUR-58': 'banco_preguntas_curso_58.json',
  'CUR-59': 'banco_preguntas_curso_59.json',
  'CUR-60': 'banco_preguntas_curso_60.json',
  'CUR-61': 'banco_preguntas_curso_61.json',
  'CUR-62': 'banco_preguntas_curso_62.json',
  'CUR-63': 'banco_preguntas_curso_63.json',
  'CUR-64': 'banco_preguntas_curso_64.json',
  'CUR-65': 'banco_preguntas_curso_65.json',
  'CUR-66': 'banco_preguntas_curso_66.json',
  'CUR-67': 'banco_preguntas_curso_67.json',
  'CUR-68': 'banco_preguntas_curso_68.json',
  'CUR-69': 'banco_preguntas_curso_69.json',
  'CUR-70': 'banco_preguntas_curso_70.json',
  'CUR-71': 'banco_preguntas_curso_71.json',
  'CUR-72': 'banco_preguntas_curso_72.json',
  'CUR-73': 'banco_preguntas_curso_73.json',
  'CUR-74': 'banco_preguntas_curso_74.json',
  'CUR-75': 'banco_preguntas_curso_75.json',
  'CUR-76': 'banco_preguntas_curso_76.json',
  'TAL-01': 'banco_preguntas_taller_soft_skills.json',
  'TAL-02': 'banco_preguntas_taller_seguridad_basada.json'
};

function getLocalFallbackFile(codigoDiplomado?: string): string {
  const fileName = (codigoDiplomado && MAPA_BANCOS_LOCALES[codigoDiplomado]) || MAPA_BANCOS_LOCALES['DIP-01'];
  return path.join(process.cwd(), 'lib', 'data', fileName);
}

function leerBancoLocal(codigoDiplomado?: string): PreguntaBanco[] {
  try {
    if (!codigoDiplomado || codigoDiplomado === 'TODOS') {
      const todas: PreguntaBanco[] = [];
      for (const [dipCod, archivo] of Object.entries(MAPA_BANCOS_LOCALES)) {
        const file = path.join(process.cwd(), 'lib', 'data', archivo);
        if (fs.existsSync(file)) {
          const data = JSON.parse(fs.readFileSync(file, 'utf8'));
          data.forEach((item: any, idx: number) => {
            todas.push({
              ...item,
              codigo_diplomado: item.codigo_diplomado || dipCod,
              id: item.id || `local-${dipCod}-${idx + 1}`
            });
          });
        }
      }
      return todas;
    }

    const file = getLocalFallbackFile(codigoDiplomado);
    if (fs.existsSync(file)) {
      const data = JSON.parse(fs.readFileSync(file, 'utf8'));
      return data.map((item: any, idx: number) => ({
        ...item,
        codigo_diplomado: item.codigo_diplomado || codigoDiplomado,
        id: item.id || `local-${codigoDiplomado}-${idx + 1}`
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
  tipoPrograma?: string; // 'DIPLOMADOS' | 'CURSOS' | 'TODOS'
}): Promise<PreguntaBanco[]> {
  try {
    const sb = getSupabaseClient();
    if (sb) {
      let query = sb.from('banco_preguntas').select('*').order('created_at', { ascending: false }).limit(5000);

      if (filtros?.codigoDiplomado && filtros.codigoDiplomado !== 'TODOS') {
        query = query.eq('codigo_diplomado', filtros.codigoDiplomado);
      } else if (filtros?.tipoPrograma === 'DIPLOMADOS') {
        query = query.ilike('codigo_diplomado', 'DIP-%');
      } else if (filtros?.tipoPrograma === 'CURSOS') {
        query = query.ilike('codigo_diplomado', 'CUR-%');
      } else if (filtros?.tipoPrograma === 'TALLERES') {
        query = query.ilike('codigo_diplomado', 'TAL-%');
      }

      if (filtros?.modulo && filtros.modulo !== 'TODOS') {
        const modBusqueda = /examen\s+del\s+(curso|taller)/i.test(filtros.modulo)
          ? filtros.modulo.trim()
          : formatearCodigoModulo(filtros.modulo);
        query = query.ilike('modulo', `%${modBusqueda}%`);
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
    }
  } catch (e) {
    console.warn('Fallo consulta a Supabase banco_preguntas, usando fallback local:', e);
  }

  // Fallback local
  let locales = leerBancoLocal(filtros?.codigoDiplomado);
  if (filtros?.codigoDiplomado && filtros.codigoDiplomado !== 'TODOS') {
    locales = locales.filter(p => p.codigo_diplomado === filtros.codigoDiplomado);
  } else if (filtros?.tipoPrograma === 'DIPLOMADOS') {
    locales = locales.filter(p => (p.codigo_diplomado || '').startsWith('DIP-'));
  } else if (filtros?.tipoPrograma === 'CURSOS') {
    locales = locales.filter(p => (p.codigo_diplomado || '').startsWith('CUR-'));
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

  const rawModulo = (pregunta.modulo || '').trim();
  const esCursoOTallerMod = /examen\s+del\s+(curso|taller)/i.test(rawModulo);
  const moduloNormalizado = !rawModulo
    ? 'MÓDULO 01'
    : esCursoOTallerMod
      ? rawModulo
      : formatearCodigoModulo(rawModulo);

  const payload = {
    codigo_diplomado: pregunta.codigo_diplomado || 'DIP-01',
    diplomado: pregunta.diplomado || 'DERECHO MINERO',
    modulo: moduloNormalizado,
    dificultad: pregunta.dificultad || 'MEDIO',
    tipo: pregunta.tipo || 'multiple_choice',
    pregunta: pregunta.pregunta || '',
    opciones: pregunta.opciones || [],
    hint: pregunta.hint || null,
    activo: pregunta.activo !== undefined ? pregunta.activo : true,
    updated_at: new Date().toISOString()
  };

  try {
    if (sb) {
      if (id && !id.startsWith('local-')) {
        const { data, error } = await sb.from('banco_preguntas').update(payload).eq('id', id).select().single();
        if (!error && data) return data;
      } else {
        const { data, error } = await sb.from('banco_preguntas').insert([payload]).select().single();
        if (!error && data) return data;
      }
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
    if (sb && !id.startsWith('local-')) {
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
    if (sb && !id.startsWith('local-')) {
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
  const config = obtenerConfiguracionExamen(params.codigoDiplomado, params.modulo);

  // Si esta evaluación está configurada para no aplicar examen
  if (config.aplica_examen === false) {
    return [];
  }

  const preguntasBanco = await obtenerPreguntasBanco({
    codigoDiplomado: params.codigoDiplomado,
    modulo: params.modulo,
    soloActivas: true
  });

  if (!preguntasBanco || preguntasBanco.length === 0) {
    return [];
  }

  const cantidadTotal = params.cantidad || config.cantidad_preguntas || CONFIGURACION_SORTEO_DIFICULTAD.totalPreguntas;
  const distribucion = params.distribucionDificultad || {
    FACIL: config.preguntas_facil,
    MEDIO: config.preguntas_medio,
    ALTO: config.preguntas_dificil
  };

  // Helper para mezcla aleatoria uniforme (Fisher-Yates)
  const mezclar = <T,>(arr: T[]): T[] => {
    const res = [...arr];
    for (let i = res.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [res[i], res[j]] = [res[j], res[i]];
    }
    return res;
  };

  // Cuotas de tipo de pregunta configuradas
  const cuantasUnicaDeseadas = typeof config.preguntas_opcion_unica === 'number' 
    ? config.preguntas_opcion_unica 
    : (cantidadTotal - (config.preguntas_opcion_multiple ?? 3));
  const cuantasMultipleDeseadas = typeof config.preguntas_opcion_multiple === 'number'
    ? config.preguntas_opcion_multiple
    : (cantidadTotal - cuantasUnicaDeseadas);

  // Separar banco activo por tipo de pregunta (opción única vs selección múltiple)
  const bancoUnica = preguntasBanco.filter(p => p.tipo !== 'multiple_select');
  const bancoMultiple = preguntasBanco.filter(p => p.tipo === 'multiple_select');

  // Helper para seleccionar respetando dificultad proporcional dentro de cada tipo
  const seleccionarConDificultad = (banco: PreguntaBanco[], cantidadDeseada: number) => {
    if (banco.length === 0 || cantidadDeseada <= 0) return [];
    if (banco.length <= cantidadDeseada) return mezclar(banco);

    const facil = banco.filter(p => (p.dificultad || '').toUpperCase() === 'FACIL');
    const medio = banco.filter(p => (p.dificultad || 'MEDIO').toUpperCase() === 'MEDIO');
    const alto = banco.filter(p => ['ALTO', 'AVANZADO', 'DIFICIL'].includes((p.dificultad || '').toUpperCase()));

    const propFacil = (distribucion.FACIL ?? 0) / cantidadTotal;
    const propAlto = (distribucion.ALTO ?? 3) / cantidadTotal;

    const nFacil = Math.round(cantidadDeseada * propFacil);
    const nAlto = Math.round(cantidadDeseada * propAlto);
    const nMedio = Math.max(0, cantidadDeseada - nFacil - nAlto);

    const sFacil = mezclar(facil).slice(0, nFacil);
    const sMedio = mezclar(medio).slice(0, nMedio);
    const sAlto = mezclar(alto).slice(0, nAlto);

    let res = [...sFacil, ...sMedio, ...sAlto];
    if (res.length < cantidadDeseada) {
      const ids = new Set(res.map(p => p.id));
      const rest = mezclar(banco.filter(p => !ids.has(p.id)));
      res = [...res, ...rest.slice(0, cantidadDeseada - res.length)];
    }
    return res.slice(0, cantidadDeseada);
  };

  const seleccionadasUnica = seleccionarConDificultad(bancoUnica, cuantasUnicaDeseadas);
  const seleccionadasMultiple = seleccionarConDificultad(bancoMultiple, cuantasMultipleDeseadas);

  let seleccionadas = [...seleccionadasUnica, ...seleccionadasMultiple];

  // Si faltaron preguntas para completar la cantidad requerida, rellenar con las restantes activas
  if (seleccionadas.length < cantidadTotal) {
    const yaElegidasIds = new Set(seleccionadas.map(p => p.id));
    const restantes = mezclar(preguntasBanco.filter(p => !yaElegidasIds.has(p.id)));
    const faltantes = cantidadTotal - seleccionadas.length;
    seleccionadas = [...seleccionadas, ...restantes.slice(0, faltantes)];
  }

  // Mezclar el examen final para intercalar tipos y niveles naturalmente
  const examenFinalMezclado = mezclar(seleccionadas.slice(0, cantidadTotal));

  // Transformar para el estudiante: eliminar respuestas correctas/rationales y mezclar alternativas al azar
  return examenFinalMezclado.map(p => ({
    id: p.id,
    codigo_diplomado: p.codigo_diplomado,
    modulo: p.modulo,
    tipo: p.tipo,
    dificultad: p.dificultad,
    pregunta: p.pregunta,
    opciones: mezclar(
      (p.opciones || []).map((opt, idx) => ({
        indice: idx,
        text: opt.text
      }))
    ),
    hint: p.hint
  }));
}

function extraerNumeroModuloExamen(modulo?: string | null): number | null {
  const txt = (modulo || '').trim();
  if (!txt) return null;
  const matchNum = txt.match(/\d+/);
  if (matchNum) return parseInt(matchNum[0], 10);
  const matchRom = txt.match(/\b(XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)\b/i);
  if (matchRom) {
    const mapa: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
    };
    return mapa[matchRom[1].toUpperCase()] ?? null;
  }
  return null;
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
  fechaInicio?: string | null;
  fechaFin?: string | null;
}): Promise<ResultadoEvaluacionExamen> {
  const fechaFinVal = params.fechaFin || new Date().toISOString();
  const fechaInicioVal = params.fechaInicio || fechaFinVal;
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
  
  // Consultar configuración personalizada para nota mínima
  const configExamen = obtenerConfiguracionExamen(params.codigoDiplomado, params.modulo);
  const notaAprobatoria = configExamen?.nota_minima ?? 12.00;
  const aprobado = notaFinal >= notaAprobatoria;

  const resultado: ResultadoEvaluacionExamen = {
    nota: notaFinal,
    aprobado: aprobado,
    notaAprobatoria: notaAprobatoria,
    totalPreguntas: totalPreguntas,
    totalAciertos: aciertosTotales,
    detalles: detalles,
    fechaInicio: fechaInicioVal,
    fechaFin: fechaFinVal
  };

  // Guardar en public.notas_modulos de Supabase (sin requerir tablas extras)
  try {
    const sb = getSupabaseClient();
    if (sb) {
      const dniLimpio = params.dni || '71234567';
      const modNorm = params.modulo;
      const nombreDip = todasDelModulo[0]?.diplomado || 'DIPLOMADO';

      const tipoPrograma = params.codigoDiplomado.toUpperCase().startsWith('CUR')
        ? 'curso'
        : params.codigoDiplomado.toUpperCase().startsWith('TAL')
        ? 'taller'
        : 'diplomado';
      const moduloNumExtraido = extraerNumeroModuloExamen(modNorm);
      const moduloNumero = moduloNumExtraido ?? (tipoPrograma === 'diplomado' ? 1 : 0);

      const respuestasConTiempo = {
        ...params.respuestasUsuario,
        __meta_tiempo: {
          fecha_inicio: fechaInicioVal,
          fecha_fin: fechaFinVal
        }
      };

      const payloadBaseNotas = {
        dni_ce: dniLimpio,
        diplomado_numero: params.codigoDiplomado,
        diplomado_nombre: nombreDip,
        tipo_programa: tipoPrograma,
        modulo_numero: moduloNumero,
        modulo_nombre: modNorm,
        nota: notaFinal,
        estado: aprobado ? 'APROBADO' : 'DESAPROBADO',
        respuestas: respuestasConTiempo,
        detalles_examen: detalles,
        updated_at: fechaFinVal
      };

      const payloadNotasConFechas = {
        ...payloadBaseNotas,
        fecha_inicio: fechaInicioVal,
        fecha_fin: fechaFinVal
      };

      let insertPayload: Record<string, unknown> = payloadNotasConFechas;
      let { error: insertErr } = await sb.from('notas_modulos').insert([insertPayload]);

      // Si las columnas fecha_inicio/fecha_fin aún no existen en la BD, reintentar sin ellas
      // manteniendo __meta_tiempo dentro de respuestas JSONB.
      if (
        insertErr &&
        (String(insertErr.message || '').includes('fecha_inicio') ||
          String(insertErr.message || '').includes('fecha_fin') ||
          insertErr.code === 'PGRST204')
      ) {
        insertPayload = payloadBaseNotas;
        const retryRes = await sb.from('notas_modulos').insert([insertPayload]);
        insertErr = retryRes.error;
      }

      if (insertErr) {
        let queryExistente = sb
          .from('notas_modulos')
          .select('id')
          .eq('dni_ce', dniLimpio)
          .eq('diplomado_numero', params.codigoDiplomado);

        if (tipoPrograma === 'diplomado' && moduloNumero > 0) {
          queryExistente = queryExistente.eq('modulo_numero', moduloNumero);
        } else {
          queryExistente = queryExistente.eq('modulo_nombre', modNorm);
        }

        const { data: existente } = await queryExistente.limit(1);
        if (existente && existente.length > 0) {
          await sb.from('notas_modulos').update(insertPayload).eq('id', existente[0].id);
        } else {
          console.warn('Error al insertar en notas_modulos:', insertErr);
        }
      }
    }
  } catch (err) {
    console.warn('No se pudo registrar intento en notas_modulos de Supabase:', err);
  }

  return resultado;
}

/**
 * Consultar todos los intentos guardados en notas_modulos para un programa/módulo específico.
 */
export async function obtenerEstadoIntentosExamen(params: {
  codigoDiplomado: string;
  modulo: string;
  dni: string;
}): Promise<{ intentosRealizados: number; ultimoIntento: any | null }> {
  try {
    const sb = getSupabaseClient();
    if (sb) {
      const moduloNumero = extraerNumeroModuloExamen(params.modulo);
      const esCursoOTaller = /^(CUR|TAL)/i.test(params.codigoDiplomado);

      let query = sb
        .from('notas_modulos')
        .select('*')
        .eq('dni_ce', params.dni)
        .eq('diplomado_numero', params.codigoDiplomado);

      if (esCursoOTaller) {
        query = query.or(`modulo_nombre.eq.${params.modulo},modulo_numero.eq.0`);
      } else if (moduloNumero !== null) {
        query = query.or(`modulo_numero.eq.${moduloNumero},modulo_nombre.eq.${params.modulo}`);
      } else {
        query = query.eq('modulo_nombre', params.modulo);
      }

      const { data } = await query.order('updated_at', { ascending: false });
      const rows = Array.isArray(data) ? data : [];
      const rawRow = rows[0] || null;
      const metaTiempo =
        rawRow?.respuestas && typeof rawRow.respuestas === 'object' && !Array.isArray(rawRow.respuestas)
          ? (rawRow.respuestas as Record<string, { fecha_inicio?: string; fecha_fin?: string } | undefined>).__meta_tiempo
          : null;
      const ultimoIntento = rawRow
        ? {
            ...rawRow,
            fecha_inicio: rawRow.fecha_inicio || metaTiempo?.fecha_inicio || null,
            fecha_fin: rawRow.fecha_fin || metaTiempo?.fecha_fin || rawRow.updated_at || null
          }
        : null;
      return {
        intentosRealizados: rows.length,
        ultimoIntento
      };
    }
  } catch (e) {
    console.warn('Error al consultar estado de intentos en notas_modulos:', e);
  }
  return { intentosRealizados: 0, ultimoIntento: null };
}

/**
 * Obtener el último intento y retroalimentación guardados en notas_modulos
 */
export async function obtenerIntentoNotasModulos(params: {
  codigoDiplomado: string;
  modulo: string;
  dni: string;
}): Promise<any | null> {
  const estado = await obtenerEstadoIntentosExamen(params);
  return estado.ultimoIntento;
}

/**
 * Obtener todos los intentos guardados de un estudiante para un programa (ej. DIP-01 o CUR-29)
 */
export async function obtenerIntentosPorPrograma(params: {
  codigoDiplomado: string;
  dni: string;
}): Promise<any[]> {
  try {
    const sb = getSupabaseClient();
    if (sb && params.codigoDiplomado && params.dni) {
      const { data } = await sb
        .from('notas_modulos')
        .select('id, diplomado_numero, modulo_numero, modulo_nombre, nota, estado, updated_at')
        .eq('dni_ce', params.dni)
        .eq('diplomado_numero', params.codigoDiplomado)
        .order('updated_at', { ascending: false });
      return Array.isArray(data) ? data : [];
    }
  } catch (e) {
    console.warn('Error al obtener intentos por programa:', e);
  }
  return [];
}


/**
 * Obtiene los módulos que tienen preguntas cargadas y activas en el banco para un diplomado
 */
export async function obtenerModulosConExamen(codigoDiplomado: string): Promise<string[]> {
  const sb = getSupabaseClient();
  try {
    if (sb) {
      const { data, error } = await sb
        .from('banco_preguntas')
        .select('modulo')
        .eq('codigo_diplomado', codigoDiplomado)
        .eq('activo', true);

      if (!error && data && data.length > 0) {
        const set = new Set<string>();
        data.forEach((r: any) => {
          if (r.modulo) {
            const conf = obtenerConfiguracionExamen(codigoDiplomado, r.modulo);
            if (conf.aplica_examen !== false) {
              set.add(r.modulo);
            }
          }
        });
        return Array.from(set);
      }
    }
  } catch (e) {
    console.warn('Error al consultar modulos con examen en Supabase:', e);
  }

  // Fallback local
  const locales = leerBancoLocal(codigoDiplomado);
  const set = new Set<string>();
  locales.filter(p => p.codigo_diplomado === codigoDiplomado && p.activo).forEach(p => {
    if (p.modulo) {
      const conf = obtenerConfiguracionExamen(codigoDiplomado, p.modulo);
      if (conf.aplica_examen !== false) {
        set.add(p.modulo);
      }
    }
  });
  return Array.from(set);
}

/**
 * Obtiene el conteo de preguntas disponibles por nivel de dificultad en el banco
 */
export async function obtenerConteoDificultadBanco(codigoDiplomado: string, modulo?: string): Promise<{
  facil: number;
  medio: number;
  dificil: number;
  opcion_unica: number;
  opcion_multiple: number;
  total: number;
}> {
  const preguntas = await obtenerPreguntasBanco({
    codigoDiplomado,
    modulo: modulo && modulo !== 'TODOS' ? modulo : undefined,
    soloActivas: true
  });
  let facil = 0;
  let medio = 0;
  let dificil = 0;
  let opcion_unica = 0;
  let opcion_multiple = 0;

  preguntas.forEach(p => {
    const d = (p.dificultad || 'MEDIO').toUpperCase();
    if (d === 'FACIL') facil++;
    else if (['ALTO', 'AVANZADO', 'DIFICIL'].includes(d)) dificil++;
    else medio++;

    if (p.tipo === 'multiple_select') {
      opcion_multiple++;
    } else {
      opcion_unica++;
    }
  });

  return { facil, medio, dificil, opcion_unica, opcion_multiple, total: preguntas.length };
}
