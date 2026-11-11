import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import type { ConfiguracionExamenItem } from '@/lib/types/examenes';
import { formatearCodigoModulo } from '@/lib/utils/profileParser';

const CONFIG_FILE_PATH = path.join(process.cwd(), 'lib', 'data', 'configuracion_examenes.json');

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!url || !key) return null;
  try {
    return createClient(url, key);
  } catch {
    return null;
  }
}

/**
 * Cargar el diccionario completo desde el archivo JSON local
 */
function leerConfigsLocales(): Record<string, ConfiguracionExamenItem> {
  try {
    if (fs.existsSync(CONFIG_FILE_PATH)) {
      const raw = fs.readFileSync(CONFIG_FILE_PATH, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error al leer configuracion_examenes.json:', err);
  }
  return {};
}

/**
 * Guardar el diccionario completo en el archivo JSON local
 */
function guardarConfigsLocales(dict: Record<string, ConfiguracionExamenItem>): boolean {
  try {
    const dir = path.dirname(CONFIG_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(dict, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error al guardar configuracion_examenes.json:', err);
    return false;
  }
}

/**
 * Obtener la lista completa de configuraciones con filtros opcionales
 */
export async function obtenerTodasConfiguraciones(filtros?: {
  tipo_programa?: string; // 'todos' | 'diplomado' | 'curso' | 'taller'
  codigo_programa?: string;
  aplica_examen?: boolean;
  busqueda?: string;
}): Promise<ConfiguracionExamenItem[]> {
  const dict = leerConfigsLocales();
  let items = Object.values(dict);

  if (filtros?.tipo_programa && filtros.tipo_programa !== 'todos') {
    items = items.filter(i => i.tipo_programa.toLowerCase() === filtros.tipo_programa?.toLowerCase());
  }

  if (filtros?.codigo_programa && filtros.codigo_programa !== 'TODOS') {
    items = items.filter(i => i.codigo_programa.toUpperCase() === filtros.codigo_programa?.toUpperCase());
  }

  if (filtros?.aplica_examen !== undefined) {
    items = items.filter(i => i.aplica_examen === filtros.aplica_examen);
  }

  if (filtros?.busqueda && filtros.busqueda.trim()) {
    const term = filtros.busqueda.toLowerCase().trim();
    items = items.filter(i => 
      i.codigo_programa.toLowerCase().includes(term) ||
      i.nombre_programa.toLowerCase().includes(term) ||
      i.modulo.toLowerCase().includes(term)
    );
  }

  // Ordenar por tipo (diplomado, curso, taller) y luego por código
  return items.sort((a, b) => {
    if (a.tipo_programa !== b.tipo_programa) {
      const peso = { diplomado: 1, curso: 2, taller: 3 };
      return (peso[a.tipo_programa] || 99) - (peso[b.tipo_programa] || 99);
    }
    return a.id.localeCompare(b.id, undefined, { numeric: true });
  });
}

/**
 * Obtener la configuración específica de un módulo o curso.
 * Si no está registrada, devuelve valores por defecto seguros.
 */
export function obtenerConfiguracionExamen(codigoPrograma: string, modulo?: string): ConfiguracionExamenItem {
  const codNorm = (codigoPrograma || '').trim().toUpperCase();
  const dict = leerConfigsLocales();

  // 1. Búsqueda exacta por ID (e.g. "DIP-01_MÓDULO 01")
  const modNorm = (modulo || '').trim();
  const keyExacta = `${codNorm}_${modNorm}`;
  if (dict[keyExacta]) {
    return dict[keyExacta];
  }

  // 2. Búsqueda flexible por código y coincidencia de módulo (arábigo 2 dígitos, sin tildes o texto exacto como MÓDULO ÚNICO)
  const items = Object.values(dict).filter(i => i.codigo_programa.toUpperCase() === codNorm);
  if (items.length > 0) {
    if (modNorm) {
      const modCanon = formatearCodigoModulo(modNorm);
      const limpiar = (s: string) =>
        s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
      const match = items.find(i => {
        const modItemCanon = formatearCodigoModulo(i.modulo);
        return limpiar(i.modulo) === limpiar(modNorm) || limpiar(modItemCanon) === limpiar(modCanon);
      });
      if (match) return match;
    }
    // Si solo hay una configuración para el curso/taller
    return items[0];
  }

  // 3. Fallback por defecto si es completamente nuevo
  const esTaller = codNorm.startsWith('TAL-');
  const esCurso = codNorm.startsWith('CUR-');

  return {
    id: `${codNorm}_${modNorm || 'Evaluación'}`,
    codigo_programa: codNorm,
    nombre_programa: codNorm,
    tipo_programa: esTaller ? 'taller' : esCurso ? 'curso' : 'diplomado',
    modulo: modNorm ? (esCurso || esTaller ? modNorm : formatearCodigoModulo(modNorm)) : (esCurso ? 'Examen del Curso' : esTaller ? 'Examen del Taller' : 'MÓDULO 01'),
    aplica_examen: !esTaller, // Los talleres por defecto NO aplican examen
    tiempo_minutos: 30,
    cantidad_preguntas: 10,
    preguntas_facil: esCurso ? 7 : 0,
    preguntas_medio: esCurso ? 3 : 7,
    preguntas_dificil: esCurso ? 0 : 3,
    preguntas_opcion_unica: 7,
    preguntas_opcion_multiple: 3,
    nota_minima: 12,
    intentos_permitidos: 1, // Global: 1 intento
    activo: true,
    updated_at: new Date().toISOString()
  };
}

/**
 * Guardar o actualizar la configuración de una evaluación
 */
export async function guardarConfiguracionExamen(config: ConfiguracionExamenItem): Promise<boolean> {
  const dict = leerConfigsLocales();
  const key = config.id || `${config.codigo_programa}_${config.modulo}`;
  
  dict[key] = {
    ...config,
    id: key,
    updated_at: new Date().toISOString()
  };

  const guardadoLocal = guardarConfigsLocales(dict);
  return guardadoLocal;
}

/**
 * Guardar lote de configuraciones
 */
export async function guardarConfiguracionesLote(configs: ConfiguracionExamenItem[]): Promise<boolean> {
  const dict = leerConfigsLocales();
  for (const c of configs) {
    const key = c.id || `${c.codigo_programa}_${c.modulo}`;
    dict[key] = {
      ...c,
      id: key,
      updated_at: new Date().toISOString()
    };
  }
  return guardarConfigsLocales(dict);
}
