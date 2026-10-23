export interface ModuloDiplomado {
  id: string;
  nombre: string;
}

export interface Diplomado {
  id: string;
  titulo: string;
  modulos: number;
  categoria: string;
  descripcion: string;
  listaModulos: string[];
}

export interface CursoCorto {
  id: string;
  titulo: string;
  categoria: string;
}

import { ALL_DIPLOMADOS } from './diplomadosData';

export const DIPLOMADOS_EDUMIN: Diplomado[] = ALL_DIPLOMADOS.map((item) => ({
  id: item.id,
  titulo: item.titulo,
  modulos: item.modulosCount,
  categoria: item.categoria,
  descripcion: item.descripcion,
  listaModulos: item.listaModulosTitulos
}));

export const CURSOS_CORTOS_EDUMIN: CursoCorto[] = [
  { id: "cur-1", titulo: "Manejo de EPPs según la Norma Técnica Peruana Ley 29783", categoria: "Seguridad y prevención" },
  { id: "cur-2", titulo: "Implementación de Medidas de Control en Riesgos Mineros", categoria: "Seguridad y prevención" },
  { id: "cur-3", titulo: "Ergonomía y Salud Ocupacional en el Sector Minero e Industrial", categoria: "Seguridad y prevención" },
  { id: "cur-4", titulo: "Marco Jurídico y Normativo de la Minería", categoria: "Legislación y normativa" },
  { id: "cur-5", titulo: "Gestión de Proveedores en Minería", categoria: "Logística y almacenes" },
  { id: "cur-6", titulo: "Control de Costos en Almacenes Mineros", categoria: "Logística y almacenes" },
  { id: "cur-7", titulo: "Logística y Distribución en la Industria y Minería", categoria: "Logística y almacenes" },
  { id: "cur-8", titulo: "Contratos en la Industria Minera", categoria: "Legislación y normativa" },
  { id: "cur-9", titulo: "Derechos Humanos en Minería", categoria: "Legislación y normativa" },
  { id: "cur-10", titulo: "Gestión de Trabajo en Alto Riesgo en Minería", categoria: "Seguridad y prevención" },
  { id: "cur-11", titulo: "Responsabilidad Penal en Minería", categoria: "Legislación y normativa" },
  { id: "cur-12", titulo: "Derecho Laboral en Minería", categoria: "Legislación y normativa" },
  { id: "cur-13", titulo: "Tipos de Concesiones Mineras", categoria: "Legislación y normativa" },
  { id: "cur-14", titulo: "Gestión de Contratos Logísticos en la Industria y Minería", categoria: "Logística y almacenes" },
  { id: "cur-15", titulo: "Curso de Prevención de Riesgos", categoria: "Seguridad y prevención" },
  { id: "cur-16", titulo: "Implementación de la ISO 45001:2018", categoria: "Seguridad y prevención" },
  { id: "cur-17", titulo: "Gestión de Emergencias en Industria y Minería", categoria: "Seguridad y prevención" },
  { id: "cur-18", titulo: "Gestión de Inventarios en Industria y Minería", categoria: "Logística y almacenes" },
  { id: "cur-19", titulo: "Control Financiero en Almacenes", categoria: "Logística y almacenes" },
  { id: "cur-20", titulo: "Logística Interna en Control de Almacenes", categoria: "Logística y almacenes" },
  { id: "cur-21", titulo: "Fundamentos de Big Data", categoria: "Inteligencia de datos" },
  { id: "cur-22", titulo: "Métodos de Captura de Información en Big Data", categoria: "Inteligencia de datos" },
  { id: "cur-23", titulo: "Tendencias 2025-2026: Claves de Big Data", categoria: "Inteligencia de datos" },
  { id: "cur-24", titulo: "Big Data: Transformación de Datos (Python y R)", categoria: "Inteligencia de datos" },
  { id: "cur-25", titulo: "Minería 4.0 Essentials: Nuevas Herramientas", categoria: "Tecnología e innovación" },
  { id: "cur-26", titulo: "Innovación en Minería: Aplicaciones de Inteligencia Artificial", categoria: "Tecnología e innovación" },
  { id: "cur-27", titulo: "Automatización 4.0 en Procesos Mineros", categoria: "Tecnología e innovación" },
  { id: "cur-28", titulo: "Cadena de Suministro Logística y Distribución", categoria: "Logística y almacenes" },
  { id: "cur-29", titulo: "Mejora de los Métodos y Medición de los Recursos", categoria: "Operaciones y procesos" },
  { id: "cur-30", titulo: "Introducción a la Gestión de Proyectos", categoria: "Operaciones y procesos" },
  { id: "cur-31", titulo: "Arquitectura de Datos: La importancia del diseño, componentes, función, configuración y patrones", categoria: "Inteligencia de datos" },
  { id: "cur-32", titulo: "Ecosistema Big Data: Herramientas y tecnologías esenciales", categoria: "Inteligencia de datos" },
  { id: "cur-33", titulo: "Introducción a Machine Learning para Big Data", categoria: "Inteligencia de datos" },
  { id: "cur-34", titulo: "Proyectos con Herramientas Digitales para Minería", categoria: "Tecnología e innovación" },
  { id: "cur-35", titulo: "Introducción a Machine Learning en Minería", categoria: "Tecnología e innovación" },
  { id: "cur-36", titulo: "Tipos de Inteligencia Artificial Aplicadas a la Minería", categoria: "Tecnología e innovación" },
  { id: "cur-37", titulo: "Herramientas de Big Data Aplicada a Minería", categoria: "Inteligencia de datos" },
  { id: "cur-38", titulo: "Gestión Avanzada de Operaciones Industriales", categoria: "Operaciones y procesos" },
  { id: "cur-39", titulo: "Big Data Aplicada a Procesos Industriales", categoria: "Inteligencia de datos" },
  { id: "cur-40", titulo: "Control de Costos en Producción Industrial o en Áreas de Producción", categoria: "Operaciones y procesos" },
  { id: "cur-41", titulo: "Importación y Exportación desde 0: Claves para el éxito", categoria: "Comercio exterior" },
  { id: "cur-42", titulo: "Implementación de la Norma ISO 9001:2015", categoria: "Operaciones y procesos" },
  { id: "cur-43", titulo: "Análisis de Mercados Internacionales: Estrategias de Importación y Exportación 2025-2026", categoria: "Comercio exterior" },
  { id: "cur-44", titulo: "De la Importación a la Venta Online: Implementa tu tienda virtual desde cero", categoria: "Comercio exterior" },
  { id: "cur-45", titulo: "Control y Supervisión de Procesos con Software SCADA", categoria: "Tecnología e innovación" },
  { id: "cur-46", titulo: "Gestión de Operaciones y Procesos en la Minería", categoria: "Operaciones y procesos" },
  { id: "cur-47", titulo: "Pirámide de Procesos: Técnicas de control en minería", categoria: "Operaciones y procesos" },
  { id: "cur-48", titulo: "Proceso de optimización del mantenimiento a partir del uso de técnicas de la Industria 4.0", categoria: "Mantenimiento industrial" },
  { id: "cur-49", titulo: "Sistemas Integrados para la Gestión de Mantenimiento", categoria: "Mantenimiento industrial" },
  { id: "cur-50", titulo: "Estándares y Sistema de Calidad del Mantenimiento", categoria: "Mantenimiento industrial" },
  { id: "cur-51", titulo: "Documentación y Trámites Aduaneros", categoria: "Comercio exterior" },
  { id: "cur-52", titulo: "Revisión de Proveedores para evitar estafas en importaciones chinas", categoria: "Comercio exterior" },
  { id: "cur-53", titulo: "Planificación de riesgos para importación y exportación", categoria: "Comercio exterior" },
  { id: "cur-54", titulo: "Control de Calidad en Procesos Mineros", categoria: "Operaciones y procesos" },
  { id: "cur-55", titulo: "Monitoreo y Control en la Operación de Plantas Mineras", categoria: "Operaciones y procesos" },
  { id: "cur-56", titulo: "Sostenibilidad y Seguridad en Campamentos Mineros", categoria: "Seguridad y prevención" },
  { id: "cur-57", titulo: "Análisis de Datos para Optimizar Operaciones Mineras", categoria: "Inteligencia de datos" },
  { id: "cur-58", titulo: "Seguridad y Control Ambiental en el Mantenimiento", categoria: "Mantenimiento industrial" },
  { id: "cur-59", titulo: "Gerencia de Proyectos del Mantenimiento", categoria: "Mantenimiento industrial" },
  { id: "cur-60", titulo: "Gestión de Costos del Mantenimiento en la Industria 4.0", categoria: "Mantenimiento industrial" },
  { id: "cur-61", titulo: "Sostenibilidad y Minería Responsable", categoria: "Medio ambiente" },
  { id: "cur-62", titulo: "Primeros Auxilios en Minería", categoria: "Seguridad y prevención" },
  { id: "cur-63", titulo: "Indicadores Clave (KPIs) para la Cadena de Abastecimientos", categoria: "Logística y almacenes" },
  { id: "cur-64", titulo: "Exploración Minera y Evaluación de Yacimientos", categoria: "Operaciones y procesos" },
  { id: "cur-65", titulo: "Requisitos Clave de ISO 14001 y cómo aplicarlos en la empresa", categoria: "Medio ambiente" },
  { id: "cur-66", titulo: "Sistemas Integrados de Gestión HSEQ (ISO 9001, 14001, 45001)", categoria: "Legislación y normativa" },
  { id: "cur-67", titulo: "Gestión de Crisis y Manejo de Conflictos en Ambientes Industriales", categoria: "Legislación y normativa" },
  { id: "cur-68", titulo: "Planificación Estratégica y Balanced Scorecard", categoria: "Operaciones y procesos" },
  { id: "cur-69", titulo: "Gestión de la Energía en Operaciones Mineras", categoria: "Medio ambiente" },
  { id: "cur-70", titulo: "Gestión de la Cadena de Suministro en Empresas Mineras", categoria: "Logística y almacenes" },
  { id: "cur-71", titulo: "Seguridad y Normativa en el Control de Inventario y Logística Minera", categoria: "Legislación y normativa" },
  { id: "cur-72", titulo: "Salud Mental en el Trabajo: Detección y prevención de trastornos psicológicos", categoria: "Seguridad y prevención" },
  { id: "cur-73", titulo: "Implementación de Lean Manufacturing en Procesos Industriales", categoria: "Operaciones y procesos" },
  { id: "cur-74", titulo: "Ergonomía y Diseño de Puestos de Trabajo en la Industria", categoria: "Seguridad y prevención" },
  { id: "cur-75", titulo: "Gestión de Seguridad durante las Paradas de Planta y Mantenimiento", categoria: "Mantenimiento industrial" },
  { id: "cur-76", titulo: "Gestión de Relaves y Residuos Mineros", categoria: "Medio ambiente" },
];