/**
 * Utilidades para manejo estandarizado de países, códigos telefónicos internacionales (E.164),
 * regiones/departamentos y lugar de residencia en EDUMIN LMS.
 */

export interface PaisInfo {
  codigo: string;     // ISO 2 letras (PE, CO, MX, etc.)
  nombre: string;
  dialCode: string;   // +51, +57, +52, etc.
}

export const LISTA_PAISES: PaisInfo[] = [
  { codigo: 'PE', nombre: 'Perú', dialCode: '+51' },
  { codigo: 'CO', nombre: 'Colombia', dialCode: '+57' },
  { codigo: 'MX', nombre: 'México', dialCode: '+52' },
  { codigo: 'CL', nombre: 'Chile', dialCode: '+56' },
  { codigo: 'BO', nombre: 'Bolivia', dialCode: '+591' },
  { codigo: 'EC', nombre: 'Ecuador', dialCode: '+593' },
  { codigo: 'AR', nombre: 'Argentina', dialCode: '+54' },
  { codigo: 'ES', nombre: 'España', dialCode: '+34' },
  { codigo: 'US', nombre: 'Estados Unidos', dialCode: '+1' },
  { codigo: 'BR', nombre: 'Brasil', dialCode: '+55' },
  { codigo: 'PA', nombre: 'Panamá', dialCode: '+507' },
  { codigo: 'CR', nombre: 'Costa Rica', dialCode: '+506' },
  { codigo: 'GT', nombre: 'Guatemala', dialCode: '+502' },
  { codigo: 'HN', nombre: 'Honduras', dialCode: '+504' },
  { codigo: 'SV', nombre: 'El Salvador', dialCode: '+503' },
  { codigo: 'NI', nombre: 'Nicaragua', dialCode: '+505' },
  { codigo: 'PY', nombre: 'Paraguay', dialCode: '+595' },
  { codigo: 'UY', nombre: 'Uruguay', dialCode: '+598' },
  { codigo: 'DO', nombre: 'Rep. Dominicana', dialCode: '+1' },
  { codigo: 'VE', nombre: 'Venezuela', dialCode: '+58' },
];

export const DEPARTAMENTOS_PERU: string[] = [
  'Amazonas', 'Áncash', 'Apurímac', 'Arequipa', 'Ayacucho',
  'Cajamarca', 'Callao', 'Cusco', 'Huancavelica', 'Huánuco',
  'Ica', 'Junín', 'La Libertad', 'Lambayeque', 'Lima',
  'Loreto', 'Madre de Dios', 'Moquegua', 'Pasco', 'Piura',
  'Puno', 'San Martín', 'Tacna', 'Tumbes', 'Ucayali'
];

/**
 * Desglosa un número telefónico almacenado en la BD en su prefijo de país y el número local.
 * Si no tiene prefijo, asigna +51 (Perú) por defecto.
 */
export function parsearCelular(rawCelular?: string | null): { dialCode: string; numero: string } {
  if (!rawCelular) return { dialCode: '+51', numero: '' };
  const str = String(rawCelular).trim();
  
  if (str.startsWith('+')) {
    // Ordenar de mayor a menor longitud para que +591 coincida antes que +5
    const paisesOrdenados = [...LISTA_PAISES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const p of paisesOrdenados) {
      if (str.startsWith(p.dialCode)) {
        const num = str.slice(p.dialCode.length).trim();
        return { dialCode: p.dialCode, numero: num };
      }
    }
    // Si tiene un + no reconocido
    const match = str.match(/^(\+\d{1,4})\s*(.*)$/);
    if (match) {
      return { dialCode: match[1], numero: match[2].trim() };
    }
  }

  return { dialCode: '+51', numero: str };
}

/**
 * Concatena el prefijo de país con el número de celular local (estándar E.164).
 */
export function formatearCelularGuardar(dialCode: string, numero: string): string {
  const numLimpio = numero.trim();
  if (!numLimpio) return '';
  const prefijo = dialCode.trim();
  return `${prefijo} ${numLimpio}`.trim();
}

/**
 * Formatea un número telefónico para visualización en la UI.
 * Si el número no tiene prefijo internacional, le antepone +51 (Perú) por defecto.
 */
export function formatearCelularVisual(rawCelular?: string | null): string {
  if (!rawCelular) return 'No registrado';
  const str = String(rawCelular).trim();
  if (!str) return 'No registrado';
  const { dialCode, numero } = parsearCelular(str);
  if (!numero) return str;
  return `${dialCode} ${numero}`;
}

/**
 * Desglosa la cadena de residencia en sus 3 niveles (País, Departamento/Región y Ciudad).
 * Maneja formatos como "Arequipa, Arequipa, Perú", "Lima, Perú" o texto libre.
 */
export function parsearResidencia(rawResidencia?: string | null): {
  pais: string;
  departamento: string;
  ciudad: string;
} {
  if (!rawResidencia) {
    return { pais: 'Perú', departamento: 'Lima', ciudad: '' };
  }

  const partes = String(rawResidencia)
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);

  if (partes.length >= 3) {
    // Ciudad, Departamento, País
    const pais = partes[partes.length - 1];
    const departamento = partes[partes.length - 2];
    const ciudad = partes.slice(0, partes.length - 2).join(', ');
    return { pais, departamento, ciudad };
  }

  if (partes.length === 2) {
    // Ciudad/Región, País
    const pais = partes[1];
    const depOCiudad = partes[0];
    const esDepPeru = DEPARTAMENTOS_PERU.some(d => d.toLowerCase() === depOCiudad.toLowerCase());
    if (esDepPeru) {
      return { pais, departamento: depOCiudad, ciudad: depOCiudad };
    }
    return { pais, departamento: 'Lima', ciudad: depOCiudad };
  }

  if (partes.length === 1) {
    const texto = partes[0];
    const esPais = LISTA_PAISES.some(p => p.nombre.toLowerCase() === texto.toLowerCase());
    if (esPais) {
      return { pais: texto, departamento: 'Lima', ciudad: '' };
    }
    const esDep = DEPARTAMENTOS_PERU.some(d => d.toLowerCase() === texto.toLowerCase());
    if (esDep) {
      return { pais: 'Perú', departamento: texto, ciudad: texto };
    }
    return { pais: 'Perú', departamento: 'Lima', ciudad: texto };
  }

  return { pais: 'Perú', departamento: 'Lima', ciudad: '' };
}

/**
 * Empaqueta Ciudad, Departamento y País en una sola cadena limpia para guardar en la BD.
 */
export function formatearResidenciaGuardar(pais: string, departamento: string, ciudad: string): string {
  const p = pais?.trim() || 'Perú';
  const d = departamento?.trim();
  const c = ciudad?.trim();

  const componentes = [c, d, p].filter(Boolean);
  return componentes.join(', ');
}

/**
 * Formatea estrictamente cualquier fecha a formato visual con slash DD/MM/YYYY.
 */
export function formatearFechaSlash(fecha?: string | Date | null): string {
  if (!fecha) return '-';
  if (fecha instanceof Date) {
    if (isNaN(fecha.getTime())) return '-';
    const d = String(fecha.getDate()).padStart(2, '0');
    const m = String(fecha.getMonth() + 1).padStart(2, '0');
    const y = fecha.getFullYear();
    return `${d}/${m}/${y}`;
  }

  const str = String(fecha).trim();
  if (!str || str === '-') return '-';

  // Si ya es DD/MM/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/');
    return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
  }

  // Si viene en formato ISO o con guiones YYYY-MM-DD
  const clean = str.split('T')[0];
  const partesGuion = clean.split('-');
  if (partesGuion.length === 3) {
    if (partesGuion[0].length === 4) {
      const [y, m, d] = partesGuion;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
    if (partesGuion[2].length === 4) {
      const [d, m, y] = partesGuion;
      return `${d.padStart(2, '0')}/${m.padStart(2, '0')}/${y}`;
    }
  }

  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const dia = String(d.getDate()).padStart(2, '0');
      const mes = String(d.getMonth() + 1).padStart(2, '0');
      const anio = d.getFullYear();
      return `${dia}/${mes}/${anio}`;
    }
  } catch {}

  return str;
}

/**
 * Normaliza cualquier formato de fecha a YYYY-MM-DD para inputs HTML de tipo date.
 */
export function formatearFechaInput(fecha?: string | Date | null): string {
  if (!fecha) return '';
  const slash = formatearFechaSlash(fecha);
  if (slash && slash !== '-') {
    const partes = slash.split('/');
    if (partes.length === 3) {
      const [d, m, y] = partes;
      if (d && m && y && y.length === 4) {
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
      }
    }
  }
  return '';
}

