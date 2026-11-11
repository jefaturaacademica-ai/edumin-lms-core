import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';

export interface ModuloJSON {
  id: string;
  codigo: string;
  nombre: string;
  nota?: number;
  completado?: boolean;
  codigo_cert?: string;
  fecha?: string;
  horas?: string;
}

export interface CuposCreditosCategoria {
  asignados: number;
  adicionales: number;
  canjeados: number;
}

export interface CuposCreditosJSON {
  diplomados: CuposCreditosCategoria;
  cursos: CuposCreditosCategoria;
  compras_directas?: any[];
}

export interface ProfileRolesJSON {
  administrativo: string | null;
  academico: string | null;
}

/**
 * Obtiene un rol principal compatible para vistas/autorización rápida a partir
 * de `profiles.roles` (JSONB) con fallback al antiguo `profile.role`.
 */
export function getPrimaryRoleFromProfile(profile: any): string {
  const rolesObj = profile?.roles && typeof profile.roles === 'object' ? profile.roles : null;
  if (rolesObj) {
    if (rolesObj.administrativo === 'SUPERADMIN') return 'SUPERADMIN';
    if (rolesObj.administrativo) return 'ADMIN';
    if (rolesObj.academico === 'DOCENTE') return 'DOCENTE';
    if (rolesObj.academico === 'ESTUDIANTE') return 'ESTUDIANTE';
  }
  return profile?.role ? String(profile.role).toUpperCase() : 'ESTUDIANTE';
}

export interface DiplomadoJSON {
  id: string;
  slug: string;
  titulo: string;
  avance: number;
  completadosMap?: Record<string, boolean>;
  modulos: ModuloJSON[];
  codigo?: string;
  fecha?: string;
  horas?: string;
  promedio?: number;
  completado?: boolean;
}

export interface CursoJSON {
  id: string;
  codigo: string;
  titulo: string;
  nota: number;
  completado: boolean;
  avance?: number;
  completadosMap?: Record<string, boolean>;
  categoria?: string;
  duracion?: string;
  horas?: string;
  fecha?: string;
  imagen?: string;
  tipo?: string;
  esRegalo?: boolean;
  color?: string;
  leccionesTotal?: number;
  leccionesCompletadas?: number;
  activo?: boolean;
}

export function parseDiplomadosFromProfile(profile: any): DiplomadoJSON[] {
  if (!profile) return [];

  const normalizeSlug = (s?: string) => {
    if (!s) return '';
    return s.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  // 1. Si existe la propiedad `diplomados` o `diplomados_json` (array ya parseado/enriquecido)
  if (Array.isArray(profile.diplomados_json)) {
    return profile.diplomados_json.map((d: any) => ({
      ...d,
      slug: normalizeSlug(d.slug || d.id || d.titulo),
      id: normalizeSlug(d.id || d.slug || d.titulo)
    }));
  }

  if (Array.isArray(profile.diplomados)) {
    return profile.diplomados.map((d: any) => ({
      ...d,
      slug: normalizeSlug(d.slug || d.id || d.titulo),
      id: normalizeSlug(d.id || d.slug || d.titulo)
    }));
  }

  // 2. Si `diplomados` o `diplomado_1` viene serializado como `DIPLOMADOS_LIST|[...]`
  const strCandidates = [
    profile.diplomados,
    profile.diplomado_1,
    profile.diplomado_2
  ];

  for (const candidate of strCandidates) {
    if (typeof candidate === 'string' && (candidate.startsWith('DIPLOMADOS_LIST|') || candidate.startsWith('DIPLOMADOS_CONFIG|'))) {
      try {
        const jsonStr = candidate.substring(candidate.indexOf('|') + 1).trim();
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          return parsed.map((d: any) => ({
            ...d,
            slug: normalizeSlug(d.slug || d.id || d.titulo),
            id: normalizeSlug(d.id || d.slug || d.titulo)
          }));
        } else if (parsed && Array.isArray(parsed.lista)) {
          return parsed.lista.map((d: any) => ({
            ...d,
            slug: normalizeSlug(d.slug || d.id || d.titulo),
            id: normalizeSlug(d.id || d.slug || d.titulo)
          }));
        }
      } catch (e) {
        console.error('Error parsing DIPLOMADOS JSON:', e);
      }
    }
  }

  // 3. Fallback a columnas texto simples `diplomado_1` .. `10`
  const fallbackList: DiplomadoJSON[] = [];
  for (let i = 1; i <= 10; i++) {
    const val = profile[`diplomado_${i}`];
    if (val && typeof val === 'string' && !val.startsWith('DIPLOMADOS_LIST|') && !val.startsWith('CURSOS_LIST|') && val.trim() !== '') {
      const title = val.trim();
      const matchedData = getDiplomadoByTitleOrSlug(title);
      const matchedTitle = matchedData?.titulo || title;
      const matchedSlug = matchedData?.slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const modulosList = matchedData?.modulos && matchedData.modulos.length > 0
        ? matchedData.modulos.map((m: any, mIdx: number) => ({
            id: formatearCodigoModulo(m.codigo, mIdx),
            codigo: formatearCodigoModulo(m.codigo, mIdx),
            nombre: m.nombre || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`,
            nota: 0,
            completado: false
          }))
        : [
            { id: 'MÓDULO 01', codigo: 'MÓDULO 01', nombre: `MÓDULO 01 DE ${matchedTitle}`, nota: 0, completado: false },
            { id: 'MÓDULO 02', codigo: 'MÓDULO 02', nombre: `MÓDULO 02 DE ${matchedTitle}`, nota: 0, completado: false },
            { id: 'MÓDULO 03', codigo: 'MÓDULO 03', nombre: `MÓDULO 03 DE ${matchedTitle}`, nota: 0, completado: false }
          ];

      fallbackList.push({
        id: matchedSlug,
        slug: matchedSlug,
        titulo: matchedTitle,
        avance: 0,
        modulos: modulosList
      });
    }
  }

  return fallbackList;
}

export function parseCursosFromProfile(profile: any): CursoJSON[] {
  if (!profile) return [];

  if (Array.isArray(profile.cursos)) {
    return profile.cursos;
  }
  if (Array.isArray(profile.cursos_json)) {
    return profile.cursos_json;
  }

  const strCandidates = [
    profile.cursos,
    profile.diplomado_2,
    profile.diplomado_1
  ];

  for (const candidate of strCandidates) {
    if (typeof candidate === 'string') {
      const trimmed = candidate.trim();
      if (trimmed.startsWith('CURSOS_LIST|')) {
        try {
          const jsonStr = trimmed.substring(trimmed.indexOf('|') + 1).trim();
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && Array.isArray(parsed.lista)) return parsed.lista;
        } catch (e) {
          console.error('Error parsing CURSOS_LIST JSON:', e);
        }
      } else if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) return parsed;
          if (parsed && Array.isArray(parsed.lista)) return parsed.lista;
        } catch (e) {
          // ignore
        }
      }
    }
  }

  return [];
}

export function formatearCodigoModulo(codigo?: string, index?: number): string {
  const raw = String(codigo || '').trim();
  if (!raw) {
    const num = (index ?? 0) + 1;
    return `MÓDULO ${num.toString().padStart(2, '0')}`;
  }

  // Números arábigos con palabra Módulo (ej. "Módulo 1", "Módulo 01", "MÓDULO 12")
  const matchMod = raw.match(/^M[óo]dulo\s*0*(\d+)$/i);
  if (matchMod) {
    const num = parseInt(matchMod[1], 10);
    return `MÓDULO ${num.toString().padStart(2, '0')}`;
  }

  // Prefijo corto M01 / mod-01 / M1
  const matchM = raw.match(/^(?:M|mod)[-_]?0*(\d+)$/i);
  if (matchM) {
    const num = parseInt(matchM[1], 10);
    return `MÓDULO ${num.toString().padStart(2, '0')}`;
  }

  // Solo número arábigo ("1", "02", "10")
  const matchNum = raw.match(/^\d+$/);
  if (matchNum) {
    const num = parseInt(matchNum[0], 10);
    return `MÓDULO ${num.toString().padStart(2, '0')}`;
  }

  // Romanos heredados únicamente si el token completo es romano ("MÓDULO I", "II", etc.)
  // Evita falsos positivos con palabras como "MÓDULO ÚNICO" que contienen la letra I.
  const matchRom = raw.match(/^(?:M[ÓO]DULO\s+)?(XII|XI|X|IX|VIII|VII|VI|IV|V|III|II|I)$/i);
  if (matchRom) {
    const mapaRomano: Record<string, number> = {
      I: 1, II: 2, III: 3, IV: 4, V: 5, VI: 6,
      VII: 7, VIII: 8, IX: 9, X: 10, XI: 11, XII: 12
    };
    const n = mapaRomano[matchRom[1].toUpperCase()];
    if (n) return `MÓDULO ${n.toString().padStart(2, '0')}`;
  }

  // Cualquier etiqueta personalizada proveniente de Supabase (ej. "MÓDULO ÚNICO") se respeta tal cual en mayúsculas
  return raw.toUpperCase();
}

export function calcularAvanceModuloGranular(
  mod: any,
  mIdx: number,
  completadosMap: Record<string, boolean> = {},
  modJson?: any
): number {
  const modCodeKey = mod.codigo || `M${String(mIdx + 1).padStart(2, '0')}`;
  const modCodeNorm = modCodeKey.toUpperCase().replace(/\s+/g, '');
  const altModKey = `MÓDULO ${String(mIdx + 1).padStart(2, '0')}`.toUpperCase().replace(/\s+/g, '');
  
  if (completadosMap[modCodeKey] || completadosMap[modCodeNorm] || completadosMap[altModKey] || modJson?.completado) {
    return 100;
  }

  const classKeysInMap = Object.keys(completadosMap).filter(k => completadosMap[k] === true);
  let totalClasesModulo = 0;
  let completadasModulo = 0;

  const modPrefixes = [
    `m0${mIdx + 1}`,
    `m${mIdx + 1}`,
    `mod0${mIdx + 1}`,
    `mod${mIdx + 1}`,
    `modulo0${mIdx + 1}`,
    `modulo${mIdx + 1}`,
    modCodeKey.toLowerCase().replace(/[^a-z0-9]+/g, '')
  ];

  const doneCount = classKeysInMap.filter(key => {
    const keyNorm = key.toLowerCase().replace(/[^a-z0-9]+/g, '');
    return modPrefixes.some(prefix => keyNorm.startsWith(prefix));
  }).length;

  if (Array.isArray(mod.clases) && mod.clases.length > 0) {
    totalClasesModulo = mod.clases.length;
    completadasModulo = Math.min(totalClasesModulo, doneCount);
  } else {
    totalClasesModulo = mIdx === 1 ? 7 : 6;
    completadasModulo = Math.min(totalClasesModulo, doneCount);
  }

  if (totalClasesModulo === 0) return 0;
  return Math.min(100, Math.round((completadasModulo / totalClasesModulo) * 100));
}


export function parseCreditosExtraFromProfile(profile: any): { creditosExtraDiplomados: number; creditosExtraCursos: number } {
  if (!profile) return { creditosExtraDiplomados: 0, creditosExtraCursos: 0 };

  if (profile.cupos_creditos && typeof profile.cupos_creditos === 'object') {
    const dipAdic = Math.max(0, Number(profile.cupos_creditos?.diplomados?.adicionales) || 0);
    const curAdic = Math.max(0, Number(profile.cupos_creditos?.cursos?.adicionales) || 0);
    return { creditosExtraDiplomados: dipAdic, creditosExtraCursos: curAdic };
  }

  let extraDip = 0;
  let extraCur = 0;

  if (profile.creditos_extra_diplomados !== undefined && profile.creditos_extra_diplomados !== null) {
    extraDip = Math.max(extraDip, Number(profile.creditos_extra_diplomados) || 0);
  }
  if (profile.creditos_extra_cursos !== undefined && profile.creditos_extra_cursos !== null) {
    extraCur = Math.max(extraCur, Number(profile.creditos_extra_cursos) || 0);
  }

  const strCandidates = [profile.diplomados, profile.cursos];
  for (const candidate of strCandidates) {
    if (typeof candidate === 'string' && candidate.includes('|')) {
      try {
        const jsonStr = candidate.substring(candidate.indexOf('|') + 1).trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          if (parsed.creditos_extra_diplomados !== undefined) {
            extraDip = Math.max(extraDip, Number(parsed.creditos_extra_diplomados) || 0);
          }
          if (parsed.creditos_extra_cursos !== undefined) {
            extraCur = Math.max(extraCur, Number(parsed.creditos_extra_cursos) || 0);
          }
        }
      } catch {}
    }
  }
  return { creditosExtraDiplomados: extraDip, creditosExtraCursos: extraCur };
}

/**
 * Obtiene la estructura centralizada `cupos_creditos` desde `profiles`,
 * con respaldo automático para perfiles aún no migrados.
 */
export function parseCuposCreditosFromProfile(profile: any): CuposCreditosJSON {
  const pkg = String(profile?.paquete_adquirido || 'COMPLETO').toUpperCase();
  const defaultDip = pkg === 'ILIMITADO' ? 3 : 1;
  const defaultCur = pkg === 'ILIMITADO' ? 15 : pkg === 'FULL' ? 5 : 3;

  const parsedDipCount = parseDiplomadosFromProfile(profile).length;
  const parsedCursosRealesCount = filtrarCursosReales(parseCursosFromProfile(profile)).length;
  const tieneListaDip = parsedDipCount > 0 || Array.isArray(profile?.diplomados) || (typeof profile?.diplomados === 'string' && profile.diplomados.includes('|'));
  const tieneListaCur = parsedCursosRealesCount > 0 || Array.isArray(profile?.cursos) || (typeof profile?.cursos === 'string' && profile.cursos.includes('|'));

  const existing = profile?.cupos_creditos;
  if (existing && typeof existing === 'object') {
    return {
      diplomados: {
        asignados: Math.max(0, Number(existing.diplomados?.asignados ?? profile?.cupos_diplomados ?? defaultDip)),
        adicionales: Math.max(0, Number(existing.diplomados?.adicionales ?? 0)),
        canjeados: tieneListaDip
          ? parsedDipCount
          : Math.max(0, Number(existing.diplomados?.canjeados ?? 0)),
      },
      cursos: {
        asignados: Math.max(0, Number(existing.cursos?.asignados ?? defaultCur)),
        adicionales: Math.max(0, Number(existing.cursos?.adicionales ?? 0)),
        canjeados: tieneListaCur
          ? parsedCursosRealesCount
          : Math.max(0, Number(existing.cursos?.canjeados ?? 0)),
      },
      compras_directas: Array.isArray(existing.compras_directas) ? existing.compras_directas : [],
    };
  }

  return {
    diplomados: {
      asignados: Math.max(0, Number(profile?.cupos_diplomados ?? defaultDip)),
      adicionales: 0,
      canjeados: parsedDipCount,
    },
    cursos: {
      asignados: defaultCur,
      adicionales: 0,
      canjeados: parsedCursosRealesCount,
    },
    compras_directas: [],
  };
}

export function buildUpdatedCuposCreditos(
  profile: any,
  updates: {
    diplomadosAsignados?: number;
    diplomadosAdicionales?: number;
    diplomadosCanjeados?: number;
    cursosAsignados?: number;
    cursosAdicionales?: number;
    cursosCanjeados?: number;
  }
): CuposCreditosJSON {
  const current = parseCuposCreditosFromProfile(profile);
  return {
    diplomados: {
      asignados: updates.diplomadosAsignados !== undefined ? Math.max(0, updates.diplomadosAsignados) : current.diplomados.asignados,
      adicionales: updates.diplomadosAdicionales !== undefined ? Math.max(0, updates.diplomadosAdicionales) : current.diplomados.adicionales,
      canjeados: updates.diplomadosCanjeados !== undefined ? Math.max(0, updates.diplomadosCanjeados) : current.diplomados.canjeados,
    },
    cursos: {
      asignados: updates.cursosAsignados !== undefined ? Math.max(0, updates.cursosAsignados) : current.cursos.asignados,
      adicionales: updates.cursosAdicionales !== undefined ? Math.max(0, updates.cursosAdicionales) : current.cursos.adicionales,
      canjeados: updates.cursosCanjeados !== undefined ? Math.max(0, updates.cursosCanjeados) : current.cursos.canjeados,
    },
    compras_directas: current.compras_directas || [],
  };
}

/**
 * Determina si un elemento del perfil es un taller de regalo (no consume créditos de cursos)
 */
export function esCursoTaller(c: any): boolean {
  if (!c) return false;
  const tipo = String(c.tipo || '').toUpperCase();
  const id = String(c.id || '').toLowerCase();
  const cod = String(c.codigo || '').toLowerCase();
  const cat = String(c.categoria || '').toLowerCase();
  const tit = String(c.titulo || '').toLowerCase();
  return Boolean(
    tipo === 'TALLER' ||
    cat.includes('taller') ||
    id.startsWith('tal-') ||
    cod.startsWith('tal-') ||
    tit.startsWith('taller de') ||
    c.esRegalo
  );
}

/**
 * Filtra únicamente los cursos reales, excluyendo talleres y regalos complementarios
 */
export function filtrarCursosReales(cursos: any[]): CursoJSON[] {
  if (!Array.isArray(cursos)) return [];
  return cursos.filter(c => Boolean(c) && !esCursoTaller(c));
}
