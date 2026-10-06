export interface ModuloJSON {
  id: string;
  codigo: string;
  nombre: string;
  nota: number;
  completado: boolean;
}

export interface DiplomadoJSON {
  id: string;
  slug: string;
  titulo: string;
  avance: number;
  modulos: ModuloJSON[];
}

export interface CursoJSON {
  id: string;
  codigo: string;
  titulo: string;
  nota: number;
  completado: boolean;
  avance?: number;
}

export function parseDiplomadosFromProfile(profile: any): DiplomadoJSON[] {
  if (!profile) return [];

  // 1. Si existe la propiedad `diplomados` (array o string)
  if (Array.isArray(profile.diplomados)) {
    return profile.diplomados;
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
        if (Array.isArray(parsed)) return parsed;
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
      fallbackList.push({
        id: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        slug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        titulo: title,
        avance: 0,
        modulos: [
          { id: 'mod-01', codigo: 'Módulo 01', nombre: `Módulo 01 de ${title}`, nota: 0, completado: false },
          { id: 'mod-02', codigo: 'Módulo 02', nombre: `Módulo 02 de ${title}`, nota: 0, completado: false },
          { id: 'mod-03', codigo: 'Módulo 03', nombre: `Módulo 03 de ${title}`, nota: 0, completado: false }
        ]
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
