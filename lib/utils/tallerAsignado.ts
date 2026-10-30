export interface TallerInfo {
  id: string; // 'tal-01' | 'tal-02'
  codigo: string; // 'TAL-01' | 'TAL-02'
  titulo: string;
  categoria: string;
  duracion: string;
  horas: string;
  tipo: 'TALLER';
  imagen: string;
  precio: number;
}

export const TALLER_SOFT_SKILLS: TallerInfo = {
  id: 'tal-01',
  codigo: 'TAL-01',
  titulo: 'TALLER DE SOFT SKILLS EN LA INDUSTRIA Y MINERÍA',
  categoria: 'Talleres',
  duracion: '20 Horas Académicas',
  horas: '20 horas académicas',
  tipo: 'TALLER',
  imagen: '/assets/images/cursos/tal-01-taller-de-soft-skills-en-la-industria-y-mineria.jpg',
  precio: 0
};

export const TALLER_SEGURIDAD_BASADA: TallerInfo = {
  id: 'tal-02',
  codigo: 'TAL-02',
  titulo: 'TALLER DE SEGURIDAD BASADA EN EL COMPORTAMIENTO',
  categoria: 'Talleres',
  duracion: '20 Horas Académicas',
  horas: '20 horas académicas',
  tipo: 'TALLER',
  imagen: '/assets/images/cursos/tal-02-taller-de-seguridad-basada-en-el-comportamiento.jpg',
  precio: 0
};

/**
 * Determina el taller gratuito asignado según el diplomado:
 * 1. Si el diplomado tiene un taller configurado explícitamente en el catálogo (ej. en la edición o creación),
 *    respeta esa configuración exacta.
 * 2. Si no tiene configuración personalizada, aplica la regla por temática del diplomado:
 *    - TALLER DE SOFT SKILLS (TAL-01) para:
 *      1. Gestión Ambiental
 *      2. Prevención de la Conflictividad
 *      3. Gestión Logística y Proveedores
 *      4. Seguridad y Salud Ocupacional
 *    - TALLER DE SEGURIDAD BASADA EN EL COMPORTAMIENTO (TAL-02) para:
 *      Todos los demás diplomados de EDUMIN.
 */
export function obtenerTallerParaDiplomado(
  diplomadoNombreOrSlug: string,
  tallerConfigurado?: string | null
): TallerInfo {
  // 1. Respetar selección explícita del administrador si existe
  if (tallerConfigurado) {
    const confNorm = tallerConfigurado.toLowerCase();
    if (confNorm.includes('tal-01') || confNorm.includes('taller 1') || confNorm.includes('soft')) {
      return TALLER_SOFT_SKILLS;
    }
    if (confNorm.includes('tal-02') || confNorm.includes('taller 2') || confNorm.includes('seguridad')) {
      return TALLER_SEGURIDAD_BASADA;
    }
  }

  // 2. Regla automática por temática
  if (!diplomadoNombreOrSlug) return TALLER_SEGURIDAD_BASADA;

  const normalizado = diplomadoNombreOrSlug
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  const esSoftSkills = 
    // 1. Gestión Ambiental
    (normalizado.includes('gestion ambiental') || normalizado.includes('gestion-ambiental')) ||
    // 2. Prevención de la Conflictividad
    (normalizado.includes('conflictividad') || normalizado.includes('conflictividad-social')) ||
    // 3. Gestión Logística y Proveedores
    (normalizado.includes('proveedores') && normalizado.includes('logistica')) ||
    // 4. Seguridad y Salud Ocupacional
    (normalizado.includes('salud ocupacional') || normalizado.includes('ssoma-industria'));

  if (esSoftSkills) {
    return TALLER_SOFT_SKILLS;
  }

  return TALLER_SEGURIDAD_BASADA;
}
