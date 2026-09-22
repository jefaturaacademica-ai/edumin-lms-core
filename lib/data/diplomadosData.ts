import derechoMineroJson from './diplomados/derecho-minero.json';
import comercioInternacionalJson from './diplomados/especialista-en-comercio-internacional-gestion-aduanera-y-logistica.json';
import geologiaMineraJson from './diplomados/geologia-minera.json';
import geomecanicaJson from './diplomados/geomecanica-subterranea-y-superficial.json';
import geometalurgiaJson from './diplomados/geometalurgia.json';
import geotecniaMineraJson from './diplomados/geotecnia-minera.json';
import gerenciaHseqJson from './diplomados/gerencia-de-sistemas-integrados-de-gestion-hseq.json';
import liderazgoMineriaJson from './diplomados/gerencia-estrategica-y-liderazgo-de-equipos-en-la-mineria.json';
import gestionAmbientalJson from './diplomados/gestion-ambiental-para-el-sector-minero-e-industrial.json';
import controlOperativoJson from './diplomados/gestion-de-control-operativo-en-procesos-mineros.json';
import operacionesIndustrialesJson from './diplomados/gestion-de-operaciones-industriales.json';
import bigDataGestionJson from './diplomados/gestion-estrategica-para-empresas-utilizando-big-data-y-analisis-predictivo.json';
import logisticaComprasJson from './diplomados/gestion-logistica-compras-inventarios-y-manejo-de-proveedores.json';
import logisticaAlmacenesJson from './diplomados/gestion-logistica-y-almacenes-en-mineria.json';
import logisticaProveedoresJson from './diplomados/gestion-logistica-y-proveedores-en-industria-y-mineria.json';
import gestionMineraJson from './diplomados/gestion-minera.json';
import legislacionLaboralJson from './diplomados/legislacion-laboral-y-elaboracion-de-planillas.json';
import mineria40Json from './diplomados/mineria-4-0-y-digitalizacion-minera.json';
import prevencionConflictividadJson from './diplomados/prevencion-de-la-conflictividad-riesgos-sociales-y-responsabilidad-social-minera.json';
import seguridadIndustrialJson from './diplomados/seguridad-industrial.json';
import seguridadSaludJson from './diplomados/seguridad-y-salud-ocupacional-en-la-industria-y-mineria.json';
import supplyChainJson from './diplomados/supply-chain-management-en-industria-y-mineria.json';

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
    docente: docente || 'Plana Docente de Alta Especialización',
    clases: Array.isArray(mod.clases) ? mod.clases.map(c => c.trim()).filter(Boolean) : []
  };
}

const RAW_DIPLOMADOS: { slug: string; numId: number; json: RawDiplomadoJSON; categoria: string; nivel: string; imagen: string; descripcion: string }[] = [
  {
    slug: 'derecho-minero',
    numId: 1,
    json: derechoMineroJson as RawDiplomadoJSON,
    categoria: 'Minería & Legal',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/derecho-minero.webp',
    descripcion: 'Marco legal, concesiones, permisos ambientales y normatividad del sector minero.'
  },
  {
    slug: 'especialista-en-comercio-internacional-gestion-aduanera-y-logistica',
    numId: 2,
    json: comercioInternacionalJson as RawDiplomadoJSON,
    categoria: 'Logística & Cadena de Suministro',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/comercio-internacional-y-aduanas.webp',
    descripcion: 'Procesos aduaneros, importación, exportación y cadena logística global.'
  },
  {
    slug: 'geologia-minera',
    numId: 3,
    json: geologiaMineraJson as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/geologia-minera.webp',
    descripcion: 'Evaluación de yacimientos, mineralogía, modelamiento y exploración geológica.'
  },
  {
    slug: 'geomecanica-subterranea-y-superficial',
    numId: 4,
    json: geomecanicaJson as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/geomecanica-minera.webp',
    descripcion: 'Estabilidad de taludes, comportamiento de rocas y control geomecánico en labores mineras.'
  },
  {
    slug: 'geometalurgia',
    numId: 5,
    json: geometalurgiaJson as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/geometalurgia.webp',
    descripcion: 'Optimización de la recuperación metálica, variabilidad mineralógica y geoestadística.'
  },
  {
    slug: 'geotecnia-minera',
    numId: 6,
    json: geotecniaMineraJson as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/geomecanica-minera.webp',
    descripcion: 'Mecánica de suelos y rocas, monitoreo geotécnico e hidrogeología aplicada a proyectos mineros.'
  },
  {
    slug: 'gerencia-de-sistemas-integrados-de-gestion-hseq',
    numId: 7,
    json: gerenciaHseqJson as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Gerencial',
    imagen: '/assets/images/daem/sistemas-integrados-hseq.webp',
    descripcion: 'Implementación y auditoría de sistemas ISO 9001, ISO 14001 e ISO 45001.'
  },
  {
    slug: 'gerencia-estrategica-y-liderazgo-de-equipos-en-la-mineria',
    numId: 8,
    json: liderazgoMineriaJson as RawDiplomadoJSON,
    categoria: 'Gestión & Operaciones',
    nivel: 'Gerencial',
    imagen: '/assets/images/daem/gestion-minera.webp',
    descripcion: 'Dirección de equipos de alto rendimiento, estrategia gerencial y compras en minería.'
  },
  {
    slug: 'gestion-ambiental-para-el-sector-minero-e-industrial',
    numId: 9,
    json: gestionAmbientalJson as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/gestion-ambiental-minera.webp',
    descripcion: 'Mitigación de impactos, planes de manejo, fiscalización y sostenibilidad ambiental.'
  },
  {
    slug: 'gestion-de-control-operativo-en-procesos-mineros',
    numId: 10,
    json: controlOperativoJson as RawDiplomadoJSON,
    categoria: 'Gestión & Operaciones',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/control-operativo-minero.webp',
    descripcion: 'Eficiencia operativa, optimización de procesos y control de cuellos de botella en plantas.'
  },
  {
    slug: 'gestion-de-operaciones-industriales',
    numId: 11,
    json: operacionesIndustrialesJson as RawDiplomadoJSON,
    categoria: 'Gestión & Operaciones',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/operaciones-industriales.webp',
    descripcion: 'Productividad, planeación de la producción, manufactura esbelta y mejora continua.'
  },
  {
    slug: 'gestion-estrategica-para-empresas-utilizando-big-data-y-analisis-predictivo',
    numId: 12,
    json: bigDataGestionJson as RawDiplomadoJSON,
    categoria: 'Gestión & Operaciones',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/big-data-y-analisis-predictivo.webp',
    descripcion: 'Toma de decisiones gerenciales basadas en Big Data, Machine Learning y análisis predictivo.'
  },
  {
    slug: 'gestion-logistica-compras-inventarios-y-manejo-de-proveedores',
    numId: 13,
    json: logisticaComprasJson as RawDiplomadoJSON,
    categoria: 'Logística & Cadena de Suministro',
    nivel: 'Gerencial',
    imagen: '/assets/images/daem/logistica-y-proveedores.webp',
    descripcion: 'Estrategias de abastecimiento, control presupuestario y negociación en minería.'
  },
  {
    slug: 'gestion-logistica-y-almacenes-en-mineria',
    numId: 14,
    json: logisticaAlmacenesJson as RawDiplomadoJSON,
    categoria: 'Logística & Cadena de Suministro',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/logistica-y-almacenes-mineros.webp',
    descripcion: 'Gestión estratégica de almacenes, tecnología y logística integral en entornos mineros.'
  },
  {
    slug: 'gestion-logistica-y-proveedores-en-industria-y-mineria',
    numId: 15,
    json: logisticaProveedoresJson as RawDiplomadoJSON,
    categoria: 'Logística & Cadena de Suministro',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/logistica-y-proveedores.webp',
    descripcion: 'Costos de almacenes, compras internacionales y gestión avanzada de riesgos logísticos.'
  },
  {
    slug: 'gestion-minera',
    numId: 16,
    json: gestionMineraJson as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Gerencial',
    imagen: '/assets/images/daem/gestion-minera.webp',
    descripcion: 'Operaciones mineras, gestión ambiental, responsabilidad social y finanzas mineras.'
  },
  {
    slug: 'legislacion-laboral-y-elaboracion-de-planillas',
    numId: 17,
    json: legislacionLaboralJson as RawDiplomadoJSON,
    categoria: 'Legal & Negocios',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/derecho-minero.webp',
    descripcion: 'Normativa laboral peruana, elaboración de planillas, T-Registro y PLAME.'
  },
  {
    slug: 'mineria-4-0-y-digitalizacion-minera',
    numId: 18,
    json: mineria40Json as RawDiplomadoJSON,
    categoria: 'Minería & Geología',
    nivel: 'Avanzado',
    imagen: '/assets/images/daem/mineria-4-0.webp',
    descripcion: 'Transformación digital, IoT, automatización y decisiones basadas en datos en minería.'
  },
  {
    slug: 'prevencion-de-la-conflictividad-riesgos-sociales-y-responsabilidad-social-minera',
    numId: 19,
    json: prevencionConflictividadJson as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/riesgos-sociales-y-responsabilidad-minera.webp',
    descripcion: 'Relacionamiento comunitario, prevención de conflictos y construcción de consensos.'
  },
  {
    slug: 'seguridad-industrial',
    numId: 20,
    json: seguridadIndustrialJson as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/seguridad-y-salud-ocupacional.webp',
    descripcion: 'Prevención de riesgos, salud ocupacional, trabajos de alto riesgo y auditoría ambiental.'
  },
  {
    slug: 'seguridad-y-salud-ocupacional-en-la-industria-y-mineria',
    numId: 21,
    json: seguridadSaludJson as RawDiplomadoJSON,
    categoria: 'Seguridad & SSOMA',
    nivel: 'Especialización',
    imagen: '/assets/images/daem/seguridad-y-salud-ocupacional.webp',
    descripcion: 'Ley 29783, inspección, investigación de accidentes y respuesta a emergencias.'
  },
  {
    slug: 'supply-chain-management-en-industria-y-mineria',
    numId: 22,
    json: supplyChainJson as RawDiplomadoJSON,
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
