import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';

export interface ModuloJSON {
  id: string;
  codigo: string;
  nombre: string;
  nota: number;
  completado: boolean;
  codigo_cert?: string;
  fecha?: string;
  horas?: string;
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

  // 1. Si existe la propiedad `diplomados` (array o string)
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
    if (typeof candidate === 'string' && candidate.startsWith('DIPLOMADOS_LIST|')) {
      try {
        const jsonStr = candidate.substring(candidate.indexOf('|') + 1).trim();
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) {
          return parsed.map((d: any) => ({
            ...d,
            slug: normalizeSlug(d.slug || d.id || d.titulo),
            id: normalizeSlug(d.id || d.slug || d.titulo)
          }));
        }
      } catch (e) {
        console.error('Error parsing DIPLOMADOS_LIST JSON:', e);
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
            id: m.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
            codigo: m.codigo || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
            nombre: m.nombre || `Módulo ${(mIdx + 1).toString().padStart(2, '0')}`,
            nota: 0,
            completado: false
          }))
        : [
            { id: 'mod-01', codigo: 'Módulo 01', nombre: `Módulo 01 de ${matchedTitle}`, nota: 0, completado: false },
            { id: 'mod-02', codigo: 'Módulo 02', nombre: `Módulo 02 de ${matchedTitle}`, nota: 0, completado: false },
            { id: 'mod-03', codigo: 'Módulo 03', nombre: `Módulo 03 de ${matchedTitle}`, nota: 0, completado: false }
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

  const strCandidates = [
    profile.cursos,
    profile.diplomado_2,
    profile.diplomado_1
  ];

  for (const candidate of strCandidates) {
    if (typeof candidate === 'string' && candidate.startsWith('CURSOS_LIST|')) {
      try {
        const jsonStr = candidate.substring(candidate.indexOf('|') + 1).trim();
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Error parsing CURSOS_LIST JSON:', e);
      }
    }
  }

  return [];
}

export function formatearCodigoModulo(codigo?: string, index?: number): string {
  if (!codigo) {
    const num = (index ?? 0) + 1;
    return `MÓDULO ${num.toString().padStart(2, '0')}`;
  }

  // Si ya contiene Módulo 01, Módulo 1, etc.
  const matchMod = codigo.match(/Mó?dulo\s*0*(\d+)/i);
  if (matchMod) {
    const num = parseInt(matchMod[1], 10);
    return `MÓDULO ${num.toString().padStart(2, '0')}`;
  }

  // Si es del tipo M01, M02, M1, M2
  const matchM = codigo.match(/^M0*(\d+)$/i);
  if (matchM) {
    const num = parseInt(matchM[1], 10);
    return `MÓDULO ${num.toString().padStart(2, '0')}`;
  }

  // Si es solo número (1, 2, 3)
  const matchNum = codigo.match(/^\d+$/);
  if (matchNum) {
    const num = parseInt(matchNum[0], 10);
    return `MÓDULO ${num.toString().padStart(2, '0')}`;
  }

  // Romanos (MÓDULO I, MÓDULO II, MÓDULO III)
  if (/III/i.test(codigo)) return 'MÓDULO 03';
  if (/II/i.test(codigo)) return 'MÓDULO 02';
  if (/I/i.test(codigo)) return 'MÓDULO 01';

  const num = (index ?? 0) + 1;
  return `MÓDULO ${num.toString().padStart(2, '0')}`;
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

