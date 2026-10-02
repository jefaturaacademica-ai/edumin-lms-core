import diplomadosTodosJson from './diplomados_todos.json';

export interface RawModuloJSON {
  codigo?: string;
  nombre?: string;
  docente?: string;
  clases?: string[];
}

export interface RawDiplomadoJSON {
  diplomado: string;
  modulos: RawModuloJSON[];
}

export interface ModuloDetalle {
  codigo: string;
  nombre: string;
  docente: string;
  clases: string[];
}

export interface DiplomadoCompleto {
  id: string;
  slug: string;
  numId: number;
  titulo: string;
  modulosCount: number;
  categoria: string;
  nivel: string;
  descripcion: string;
  imagen: string;
  precioRegular: number;
  precioOferta: number;
  listaModulosTitulos: string[];
  modulos: ModuloDetalle[];
}

function obtenerEtiquetaModulo(rawCodigo: string, index: number): string {
  const romanos = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  const match = (rawCodigo || '').match(/\d+/);
  const num = match ? parseInt(match[0], 10) : index + 1;
  const romano = romanos[num - 1] || `${num}`;
  return `MÓDULO ${romano}`;
}

function normalizarModulo(mod: RawModuloJSON, index: number): ModuloDetalle {
  let rawCodigo = mod.codigo || `M${String(index + 1).padStart(2, '0')}`;
  let nombre = (mod.nombre || '').trim();
  let docente = (mod.docente || '').trim();

  // Caso 1: el campo docente contiene "MÓDULO XX - Nombre"
  if (/MÓDULO\s*\d+\s*[-–]/i.test(docente)) {
    const parts = docente.split(/MÓDULO\s*\d+\s*[-–]/i);
    const docenteNombre = parts[0].trim();
    const tituloModulo = parts[1] ? parts[1].trim() : '';
    if (!nombre && tituloModulo) {
      nombre = tituloModulo;
    }
    if (docenteNombre) {
      docente = docenteNombre;
    }
  }

  // Caso 2: el campo nombre contiene "Docentes: ... MÓDULO XX - Nombre"
  if (/MÓDULO\s*\d+\s*[-–]/i.test(nombre)) {
    const parts = nombre.split(/MÓDULO\s*\d+\s*[-–]/i);
    const docenteParte = parts[0].trim();
    const tituloModulo = parts[1] ? parts[1].trim() : '';
    if (tituloModulo) {
      nombre = tituloModulo;
    }
    if (!docente && docenteParte) {
      docente = docenteParte;
    }
  }

  // Limpiar cualquier prefijo de módulo repetido en el nombre (ej. "MÓDULO I:", "M01 -", etc.)
  nombre = nombre.replace(/^(MÓDULO\s*[\dIVX]+|M\d+)\s*[:\-\–]?\s*/i, '').trim();

  const etiquetaModulo = obtenerEtiquetaModulo(rawCodigo, index);

  if (!nombre) {
    nombre = `ESPECIALIZACIÓN ACADÉMICA`;
  }

  docente = docente.replace(/^Docentes?:\s*/i, '').trim();

  return {
    codigo: etiquetaModulo,
    nombre,
    docente: docente || '',
    clases: Array.isArray(mod.clases) ? mod.clases.map(c => c.trim()).filter(Boolean) : []
  };
}

const RAW_DIPLOMADOS: { slug: string; numId: number; json: RawDiplomadoJSON; categoria: string; nivel: string; imagen: string; descripcion: string }[] = [
  {
    slug: 'derecho-minero',
    numId: 1,
    json: (diplomadosTodosJson.diplomados[0] || {}) as RawDiplomadoJSON,
    categoria: 'Minería & Legal',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/derecho-minero.webp',
    descripcion: 'Marco legal, concesiones, permisos ambientales y normatividad del sector minero.'
  },
  {
    slug: 'especialista-en-comercio-internacional-gestion-aduanera-y-logistica',
    numId: 2,
    json: (diplomadosTodosJson.diplomados[1] || {}) as RawDiplomadoJSON,
    categoria: 'Logística & Cadena de Suministro',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/comercio-internacional-y-aduanas.webp',
    descripcion: 'Procesos aduaneros, importación, exportación y cadena logística global.'
  },
  {
    slug: 'geologia-minera',
    numId: 3,
    json: (diplomadosTodosJson.diplomados[2] || {}) as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/geologia-minera.webp',
    descripcion: 'Evaluación de yacimientos, mineralogía, modelamiento y exploración geológica.'
  },
  {
    slug: 'geomecanica-subterranea-y-superficial',
    numId: 4,
    json: (diplomadosTodosJson.diplomados[3] || {}) as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/geomecanica-minera.webp',
    descripcion: 'Estabilidad de taludes, comportamiento de rocas y control geomecánico en labores mineras.'
  },
  {
    slug: 'geometalurgia',
    numId: 5,
    json: (diplomadosTodosJson.diplomados[4] || {}) as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/geometalurgia.webp',
    descripcion: 'Optimización de la recuperación metálica, variabilidad mineralógica y geoestadística.'
  },
  {
    slug: 'geotecnia-minera',
    numId: 6,
    json: (diplomadosTodosJson.diplomados[5] || {}) as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/geotecnia-minera.webp',
    descripcion: 'Mecánica de suelos y rocas, monitoreo geotécnico e hidrogeología aplicada a proyectos mineros.'
  },
  {
    slug: 'gerencia-de-sistemas-integrados-de-gestion-hseq',
    numId: 7,
    json: (diplomadosTodosJson.diplomados[6] || {}) as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Gerencial',
    imagen: '/assets/images/daem/sistemas-integrados-hseq.webp',
    descripcion: 'Implementación y auditoría de sistemas ISO 9001, ISO 14001 e ISO 45001.'
  },
  {
    slug: 'gerencia-estrategica-y-liderazgo-de-equipos-en-la-mineria',
    numId: 8,
    json: (diplomadosTodosJson.diplomados[7] || {}) as RawDiplomadoJSON,
    categoria: 'Gestión & Operaciones',
    nivel: 'Gerencial',
    imagen: '/assets/images/daem/gerencia-estrategica-y-liderazgo.webp',
    descripcion: 'Dirección de equipos de alto rendimiento, estrategia gerencial y compras en minería.'
  },
  {
    slug: 'gestion-ambiental-para-el-sector-minero-e-industrial',
    numId: 9,
    json: (diplomadosTodosJson.diplomados[8] || {}) as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/gestion-ambiental-minera.webp',
    descripcion: 'Mitigación de impactos, planes de manejo, fiscalización y sostenibilidad ambiental.'
  },
  {
    slug: 'gestion-de-control-operativo-en-procesos-mineros',
    numId: 10,
    json: (diplomadosTodosJson.diplomados[9] || {}) as RawDiplomadoJSON,
    categoria: 'Gestión & Operaciones',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/control-operativo-minero.webp',
    descripcion: 'Eficiencia operativa, optimización de procesos y control de cuellos de botella en plantas.'
  },
  {
    slug: 'gestion-de-operaciones-industriales',
    numId: 11,
    json: (diplomadosTodosJson.diplomados[10] || {}) as RawDiplomadoJSON,
    categoria: 'Gestión & Operaciones',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/operaciones-industriales.webp',
    descripcion: 'Productividad, planeación de la producción, manufactura esbelta y mejora continua.'
  },
  {
    slug: 'gestion-estrategica-para-empresas-utilizando-big-data-y-analisis-predictivo',
    numId: 12,
    json: (diplomadosTodosJson.diplomados[11] || {}) as RawDiplomadoJSON,
    categoria: 'Gestión & Operaciones',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/big-data-y-analisis-predictivo.webp',
    descripcion: 'Toma de decisiones gerenciales basadas en Big Data, Machine Learning y análisis predictivo.'
  },
  {
    slug: 'gestion-logistica-compras-inventarios-y-manejo-de-proveedores',
    numId: 13,
    json: (diplomadosTodosJson.diplomados[12] || {}) as RawDiplomadoJSON,
    categoria: 'Logística & Cadena de Suministro',
    nivel: 'Gerencial',
    imagen: '/assets/images/daem/compras-inventarios-y-proveedores.webp',
    descripcion: 'Estrategias de abastecimiento, control presupuestario y negociación en minería.'
  },
  {
    slug: 'gestion-logistica-y-almacenes-en-mineria',
    numId: 14,
    json: (diplomadosTodosJson.diplomados[13] || {}) as RawDiplomadoJSON,
    categoria: 'Logística & Cadena de Suministro',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/logistica-y-almacenes-mineros.webp',
    descripcion: 'Gestión estratégica de almacenes, tecnología y logística integral en entornos mineros.'
  },
  {
    slug: 'gestion-logistica-y-proveedores-en-industria-y-mineria',
    numId: 15,
    json: (diplomadosTodosJson.diplomados[14] || {}) as RawDiplomadoJSON,
    categoria: 'Logística & Cadena de Suministro',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/logistica-y-proveedores.webp',
    descripcion: 'Costos de almacenes, compras internacionales y gestión avanzada de riesgos logísticos.'
  },
  {
    slug: 'gestion-minera',
    numId: 16,
    json: (diplomadosTodosJson.diplomados[15] || {}) as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Gerencial',
    imagen: '/assets/images/daem/gestion-minera.webp',
    descripcion: 'Operaciones mineras, gestión ambiental, responsabilidad social y finanzas mineras.'
  },
  {
    slug: 'legislacion-laboral-y-elaboracion-de-planillas',
    numId: 17,
    json: (diplomadosTodosJson.diplomados[16] || {}) as RawDiplomadoJSON,
    categoria: 'Legal & Negocios',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/legislacion-laboral-y-planillas.webp',
    descripcion: 'Normativa laboral peruana, elaboración de planillas, T-Registro y PLAME.'
  },
  {
    slug: 'mineria-4-0-y-digitalizacion-minera',
    numId: 18,
    json: (diplomadosTodosJson.diplomados[17] || {}) as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/mineria-4-0.webp',
    descripcion: 'Transformación digital, IoT, automatización y decisiones basadas en datos en minería.'
  },
  {
    slug: 'prevencion-de-la-conflictividad-riesgos-sociales-y-responsabilidad-social-minera',
    numId: 19,
    json: (diplomadosTodosJson.diplomados[18] || {}) as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/riesgos-sociales-y-responsabilidad-minera.webp',
    descripcion: 'Relacionamiento comunitario, prevención de conflictos y construcción de consensos.'
  },
  {
    slug: 'seguridad-industrial',
    numId: 20,
    json: (diplomadosTodosJson.diplomados[19] || {}) as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/seguridad-industrial.webp',
    descripcion: 'Prevención de riesgos, salud ocupacional, trabajos de alto riesgo y auditoría ambiental.'
  },
  {
    slug: 'seguridad-y-salud-ocupacional-en-la-industria-y-mineria',
    numId: 21,
    json: (diplomadosTodosJson.diplomados[20] || {}) as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/seguridad-y-salud-ocupacional.webp',
    descripcion: 'Ley 29783, inspección, investigación de accidentes y respuesta a emergencias.'
  },
  {
    slug: 'supply-chain-management-en-industria-y-mineria',
    numId: 22,
    json: (diplomadosTodosJson.diplomados[21] || {}) as RawDiplomadoJSON,
    categoria: 'Logística & Cadena de Suministro',
    nivel: 'Gerencial',
    imagen: '/assets/images/daem/supply-chain-minero.webp',
    descripcion: 'Gestión estratégica de la cadena de suministro, abastecimiento e internacionalización.'
  }
];

export const ALL_DIPLOMADOS: DiplomadoCompleto[] = RAW_DIPLOMADOS.map((item) => {
  const modulosNormalizados = (item.json.modulos || []).map((mod, idx) => normalizarModulo(mod, idx));
  const listaModulosTitulos = modulosNormalizados.map((m) => `${m.codigo}: ${m.nombre}`);

  return {
    id: item.slug,
    slug: item.slug,
    numId: item.numId,
    titulo: item.json.diplomado,
    modulosCount: modulosNormalizados.length,
    categoria: item.categoria,
    nivel: item.nivel,
    descripcion: item.descripcion,
    imagen: item.imagen,
    precioRegular: 1200,
    precioOferta: 400,
    listaModulosTitulos,
    modulos: modulosNormalizados
  };
});

export function getDiplomadoBySlug(slug: string): DiplomadoCompleto | undefined {
  if (!slug) return undefined;

  const slugNorm = slug.toLowerCase().trim();

  // Alias comunes
  if (slugNorm === 'big-data-gestion' || slugNorm === 'dip-12') {
    return ALL_DIPLOMADOS.find(d => d.slug === 'gestion-estrategica-para-empresas-utilizando-big-data-y-analisis-predictivo');
  }
  if (slugNorm === 'comercio-internacional' || slugNorm === 'dip-2') {
    return ALL_DIPLOMADOS.find(d => d.slug === 'especialista-en-comercio-internacional-gestion-aduanera-y-logistica');
  }
  if (slugNorm === 'geomecanica' || slugNorm === 'dip-5') {
    return ALL_DIPLOMADOS.find(d => d.slug === 'geomecanica-subterranea-y-superficial');
  }
  if (slugNorm === 'gerencia-hseq' || slugNorm === 'dip-7') {
    return ALL_DIPLOMADOS.find(d => d.slug === 'gerencia-de-sistemas-integrados-de-gestion-hseq');
  }
  if (slugNorm === 'liderazgo-mineria' || slugNorm === 'dip-8') {
    return ALL_DIPLOMADOS.find(d => d.slug === 'gerencia-estrategica-y-liderazgo-de-equipos-en-la-mineria');
  }
  if (slugNorm === 'gestion-ambiental' || slugNorm === 'dip-9') {
    return ALL_DIPLOMADOS.find(d => d.slug === 'gestion-ambiental-para-el-sector-minero-e-industrial');
  }
  if (slugNorm === 'control-operativo' || slugNorm === 'dip-10') {
    return ALL_DIPLOMADOS.find(d => d.slug === 'gestion-de-control-operativo-en-procesos-mineros');
  }
  if (slugNorm === 'operaciones-industriales' || slugNorm === 'dip-11') {
    return ALL_DIPLOMADOS.find(d => d.slug === 'gestion-de-operaciones-industriales');
  }
  if (slugNorm === 'logistica-compras' || slugNorm === 'dip-13') {
    return ALL_DIPLOMADOS.find(d => d.slug === 'gestion-logistica-compras-inventarios-y-manejo-de-proveedores');
  }

  return ALL_DIPLOMADOS.find(d => d.slug === slugNorm || d.id === slugNorm);
}

export function getDiplomadoByTitleOrSlug(titleOrSlug: string): DiplomadoCompleto {
  if (!titleOrSlug) return ALL_DIPLOMADOS[0];

  const matchDirect = getDiplomadoBySlug(titleOrSlug);
  if (matchDirect) return matchDirect;

  const normTarget = titleOrSlug.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  // 1. Match directo o parcial por título
  const found = ALL_DIPLOMADOS.find(d => {
    const normTitle = d.titulo.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
    return normTitle === normTarget || normTitle.includes(normTarget) || normTarget.includes(normTitle);
  });
  if (found) return found;

  // 2. Coincidencia por palabras clave
  if (normTarget.includes('derecho') || normTarget.includes('juridic')) return getDiplomadoBySlug('derecho-minero') || ALL_DIPLOMADOS[0];
  if (normTarget.includes('seguridad') || normTarget.includes('ssoma') || normTarget.includes('salud')) return getDiplomadoBySlug('seguridad-y-salud-ocupacional-en-la-industria-y-mineria') || ALL_DIPLOMADOS[0];
  if (normTarget.includes('geologia') || normTarget.includes('yacimiento') || normTarget.includes('exploracion')) return ALL_DIPLOMADOS.find(d => d.slug.includes('geologia')) || ALL_DIPLOMADOS[0];
  if (normTarget.includes('ventilacion') || normTarget.includes('gases')) return ALL_DIPLOMADOS.find(d => d.slug.includes('ventilacion')) || ALL_DIPLOMADOS[0];
  if (normTarget.includes('hseq') || normTarget.includes('iso')) return ALL_DIPLOMADOS.find(d => d.slug.includes('hseq')) || ALL_DIPLOMADOS[0];
  if (normTarget.includes('planilla') || normTarget.includes('laboral')) return getDiplomadoBySlug('legislacion-laboral-y-elaboracion-de-planillas') || ALL_DIPLOMADOS[0];

  return ALL_DIPLOMADOS[0];
}
