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

export const DIPLOMADOS_EDUMIN: Diplomado[] = [
  {
    id: "dip-1",
    titulo: "DERECHO MINERO",
    modulos: 3,
    categoria: "Minería y Legal",
    descripcion: "Marco legal, concesiones y normatividad del sector minero.",
    listaModulos: [
      "MÓDULO I: LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR",
      "MÓDULO II: JURISDICCIÓN MINERA, REGULACIÓN LABORAL Y NORMATIVAS DE SEGURIDAD",
      "MÓDULO III: GESTIÓN CONTRACTUAL, CONCESIONES Y RESPONSABILIDADES DE LOS TITULARES MINEROS"
    ]
  },
  {
    id: "dip-2",
    titulo: "ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA",
    modulos: 3,
    categoria: "Negocios",
    descripcion: "Procesos aduaneros, importación, exportación y cadena logística global.",
    listaModulos: [
      "MÓDULO I: REGULACIÓN DEL COMERCIO INTERNACIONAL EN EEUU Y CHINA: NORMATIVA Y DESAFÍOS LEGALES",
      "MÓDULO II: OPTIMIZACIÓN DE LA GESTIÓN ADUANERA EN EL PROCESO DE IMPORTACIÓN",
      "MÓDULO III: GESTIÓN INTEGRAL DE LA LOGÍSTICA EN EL COMERCIO INTERNACIONAL"
    ]
  },
  {
    id: "dip-3",
    titulo: "GEOLOGÍA MINERA",
    modulos: 3,
    categoria: "Minería",
    descripcion: "Evaluación de yacimientos, modelamiento y exploración.",
    listaModulos: [
      "MÓDULO I: FUNDAMENTOS DE GEOLOGÍA MINERA",
      "MÓDULO II: EXPLORACIÓN GEOLÓGICA Y EVALUACIÓN DE RECURSOS MINERALES",
      "MÓDULO III: OPERACIONES MINERAS Y GESTIÓN AMBIENTAL"
    ]
  },
  {
    id: "dip-4",
    titulo: "GEOMETALURGIA",
    modulos: 3,
    categoria: "Minería",
    descripcion: "Optimización de la recuperación metálica y variabilidad mineralógica.",
    listaModulos: [
      "MÓDULO I: MÉTODOS DE SEPARACIÓN Y CONCENTRACIÓN DE MINERALES",
      "MÓDULO II: INNOVACIÓN EN GEOESTADÍSTICA Y METALÚRGIA AVANZADA: DE LA TEORÍA A LA PRÁCTICA",
      "MÓDULO III: ESTRATEGIAS GEOMETALÚRGICAS Y REDUCCIÓN DE COSTOS EN OPERACIONES MINERAS"
    ]
  },
  {
    id: "dip-5",
    titulo: "GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL",
    modulos: 3,
    categoria: "Minería",
    descripcion: "Estabilidad de taludes y control en labores mineras.",
    listaModulos: [
      "MÓDULO I: PRINCIPIOS Y APLICACIONES DE LA GEOMECÁNICA EN MINERÍA",
      "MÓDULO II: GEOMECÁNICA SUBTERRANEA: COMPORTAMIENTO DE ROCAS Y SUELOS EN MINERÍA",
      "MÓDULO III: GEOTECNIA APLICADA EN MINERÍA A CIELO ABIERTO"
    ]
  },
  {
    id: "dip-6",
    titulo: "GEOTECNIA MINERA",
    modulos: 3,
    categoria: "Minería",
    descripcion: "Mecánica de suelos y rocas aplicada a proyectos mineros.",
    listaModulos: [
      "MÓDULO I: GEOTÉCNIA DE SUELOS Y ROCAS",
      "MÓDULO II: MONITOREO GEOTÉCNICO E INSTRUMENTACIÓN EN MINERÍA",
      "MÓDULO III: ANÁLISIS HIDROGEOLÓGICO Y DRENAJE EN MINERÍA"
    ]
  },
  {
    id: "dip-7",
    titulo: "GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ",
    modulos: 3,
    categoria: "Gestión",
    descripcion: "ISO 9001, 14001 y ISO 45001 aplicadas a la industria.",
    listaModulos: [
      "MÓDULO I: INTRODUCCIÓN A LOS SISTEMAS DE GESTIÓN HSEQ",
      "MÓDULO II: INTERPRETACIÓN DE LAS NORMAS ISO 9001, ISO 45001 E ISO 14001",
      "MÓDULO III: DOCUMENTACIÓN DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ"
    ]
  },
  {
    id: "dip-8",
    titulo: "GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA",
    modulos: 5,
    categoria: "Liderazgo",
    descripcion: "Dirección de equipos de alto rendimiento en operaciones complejas.",
    listaModulos: [
      "MÓDULO I: PANORAMA DE LA INDUSTRIA MINERA",
      "MÓDULO II: LIDERAZGO GERENCIAL EN LA INDUSTRIA MINERA",
      "MÓDULO III: GESTIÓN ESTRATÉGICA Y CADENA DE SUMINISTRO",
      "MÓDULO IV: GESTIÓN DE COMPRAS Y COMERCIO INTERNACIONAL",
      "MÓDULO V: EVALUACIÓN Y AUDITORÍA DE PROVEEDORES"
    ]
  },
  {
    id: "dip-9",
    titulo: "GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL",
    modulos: 3,
    categoria: "Ambiental",
    descripcion: "Mitigación de impactos, planes de manejo y fiscalización ambiental.",
    listaModulos: [
      "MÓDULO I: GESTIÓN AMBIENTAL APLICADA A ENTORNOS INDUSTRIALES Y MINEROS",
      "MÓDULO II: HERRAMIENTAS TÉCNICAS DE CONTROL Y GESTIÓN AMBIENTAL OPERATIVA",
      "MÓDULO III: ESTRATEGIAS DE SOSTENIBILIDAD Y MEJORA AMBIENTAL CONTINUA"
    ]
  },
  {
    id: "dip-10",
    titulo: "GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS",
    modulos: 3,
    categoria: "Operaciones",
    descripcion: "Eficiencia y control de cuellos de botella en plantas.",
    listaModulos: [
      "MÓDULO I: GESTIÓN EN OPERACIONES MINERAS PRODUCTIVAS",
      "MÓDULO II: OPTIMIZACIÓN Y AUTOMATIZACIÓN DE LOS PROCESOS EN LAS OPERACIONES MINERAS",
      "MÓDULO III: PLANIFICACIÓN ESTRATÉGICA Y GESTIÓN RIESGOS EN LAS OPERACIONES MINERAS"
    ]
  },
  {
    id: "dip-11",
    titulo: "GESTIÓN DE OPERACIONES INDUSTRIALES",
    modulos: 3,
    categoria: "Operaciones",
    descripcion: "Productividad, manufactura esbelta y mejora continua.",
    listaModulos: [
      "MÓDULO I: SOFT SKILLS EN INDUSTRIA",
      "MÓDULO II: LA GESTIÓN DE OPERACIONES INDUSTRIALES",
      "MÓDULO III: PLANEACIÓN Y CONTROL DE LA PRODUCCIÓN"
    ]
  },
  {
    id: "dip-12",
    titulo: "GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO",
    modulos: 3,
    categoria: "Tecnología",
    descripcion: "Toma de decisiones gerenciales basadas en análisis de datos.",
    listaModulos: [
      "MÓDULO I: BIGDATA: DESDE LA RECOLECCIÓN DE DATOS A LA VISUALIZACIÓN DE INFORMES",
      "MÓDULO II: ANÁLISIS PREDICTIVO PARA LA TOMA DE DECISIONES ESTRATÉGICAS",
      "MÓDULO III: REDES NEURONALES Y DEEP LEARNING"
    ]
  },
  {
    id: "dip-13",
    titulo: "GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES",
    modulos: 5,
    categoria: "Logística",
    descripcion: "Estrategias de abastecimiento y optimización de almacenes.",
    listaModulos: [
      "MÓDULO I: INTRODUCCIÓN A LA GESTIÓN DE COMPRAS EN LA MINERÍA",
      "MÓDULO II: ESTRATEGIAS DE COMPRAS Y NEGOCIACIÓN EN MINERÍA",
      "MÓDULO III: ANÁLISIS PRESUPUESTARIO Y DE LA GESTIÓN DE COMPRAS",
      "MÓDULO IV: LOGÍSTICA Y GESTIÓN DE INVENTARIOS EN MINERÍA",
      "MÓDULO V: RESPONSABILIDAD SOCIAL Y SOSTENIBILIDAD EN COMPRAS MINERAS"
    ]
  },
  {
    id: "dip-14",
    titulo: "GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA",
    modulos: 3,
    categoria: "Logística y Minería",
    descripcion: "Control de inventarios críticos para operaciones mineras.",
    listaModulos: [
      "MÓDULO I: GESTIÓN LOGÍSTICA INTEGRAL EN MINERÍA",
      "MÓDULO II: GESTIÓN ESTRATÉGICA DE ALMACENES EN ENTORNOS MINEROS",
      "MÓDULO III: TECNOLOGÍA, INNOVACIÓN Y SOSTENIBILIDAD EN LOGÍSTICA MINERA"
    ]
  },
  {
    id: "dip-15",
    titulo: "GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA",
    modulos: 3,
    categoria: "Logística",
    descripcion: "Cadena de suministro y gestión de contratos con proveedores.",
    listaModulos: [
      "MÓDULO I: COSTOS Y PRESUPUESTOS DE ALMACENES EN INDUSTRIA Y MINERIA",
      "MÓDULO II: ESTRATEGIAS GLOBALES EN COMPRAS INTERNACIONALES",
      "MÓDULO III: IDENTIFICACIÓN Y GESTIÓN AVANZADA DE RIESGOS EN LA LOGÍSTICA MINERA"
    ]
  },
  {
    id: "dip-16",
    titulo: "GESTIÓN MINERA",
    modulos: 3,
    categoria: "Minería",
    descripcion: "Estrategias, planificación y sostenibilidad para la industria minera.",
    listaModulos: [
      "MÓDULO I: OPERACIONES MINERAS",
      "MÓDULO II: MEDIO AMBIENTE, RESPONSABILIDAD SOCIAL Y SEGURIDAD EN LA MINERÍA",
      "MÓDULO III: GESTIÓN DE PROYECTOS Y FINANZAS EN LA MINERÍA"
    ]
  },
  {
    id: "dip-17",
    titulo: "LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS",
    modulos: 5,
    categoria: "Legal",
    descripcion: "Normativa laboral peruana, contratos, beneficios y cálculo de planillas.",
    listaModulos: [
      "MÓDULO I: INTRODUCCIÓN A LA LEGISLACIÓN LABORAL EN PERÚ",
      "MÓDULO II: REGULACIÓN ESPECÍFICA EN LA LEGISLACIÓN LABORAL PERUANA",
      "MÓDULO III: TEMAS AVANZADOS DE LEGISLACIÓN LABORAL",
      "MÓDULO IV: PLANILLAS Y OBLIGACIONES LABORALES",
      "MÓDULO V: ELABORACIÓN DE PLANILLA Y REGISTRO EN PLAME, T-REGISTRO Y AFPNET"
    ]
  },
  {
    id: "dip-18",
    titulo: "MINERÍA 4.0 Y DIGITALIZACIÓN MINERA",
    modulos: 3,
    categoria: "Tecnología y Minería",
    descripcion: "Automatización, IoT, gemelos digitales y tecnologías emergentes.",
    listaModulos: [
      "MÓDULO I: TRANSFORMACIÓN DIGITAL EN LA MINERÍA: TÉCNOLOGÍAS EMERGENTES, TENDENCIAS Y NUEVAS OPORTUNIDADES",
      "MÓDULO II: DIGITALIZACIÓN DE PROCESOS MINEROS",
      "MÓDULO III: GESTIÓN Y TOMA DE DECISIONES BASADA EN DATOS"
    ]
  },
  {
    id: "dip-19",
    titulo: "PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL MINERA",
    modulos: 3,
    categoria: "Social",
    descripcion: "Relacionamiento comunitario y gestión de licencias sociales.",
    listaModulos: [
      "MÓDULO I: PREVENCIÓN EFECTIVA DE CONFLICTOS SOCIALES Y GESTIÓN DE RIESGOS SOCIALES EN PROYECTOS",
      "MÓDULO II: COMUNICACIÓN EFECTIVA PARA LA PREVENCIÓN DE CONFLICTOS Y LA CONSTRUCCIÓN DE CONSENSOS",
      "MÓDULO III: GESTIÓN DE RELACIONES COMUNITARIAS Y RESOLUCIÓN DE CONFLICTOS"
    ]
  },
  {
    id: "dip-20",
    titulo: "SEGURIDAD INDUSTRIAL",
    modulos: 3,
    categoria: "Seguridad",
    descripcion: "Prevención de riesgos y cultura de seguridad en operaciones críticas.",
    listaModulos: [
      "MÓDULO I: GESTIÓN DE OPERACIONES INDUSTRIALES Y SALUD OCUPACIONAL",
      "MÓDULO II: SEGURIDAD INDUSTRIAL, NORMATIVA Y TRABAJOS DE ALTO RIESGO",
      "MÓDULO III: NORMATIVA AMBIENTAL, AUDITORÍA Y FORMACIÓN DE ENTRENADORES"
    ]
  },
  {
    id: "dip-21",
    titulo: "SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA",
    modulos: 3,
    categoria: "Seguridad",
    descripcion: "Ley 29783, IPERC y gestión integral de riesgos laborales.",
    listaModulos: [
      "MÓDULO I: NORMATIVA 2025 EN INDUSTRIA Y MINERÍA",
      "MÓDULO II: NORMATIVA INTERNACIONAL Y GESTIÓN DEL MEDIO AMBIENTE",
      "MÓDULO III: INSPECCIÓN, INVESTIGACIÓN Y RESPUESTA A EMERGENCIAS EN MINERÍA"
    ]
  },
  {
    id: "dip-22",
    titulo: "SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA",
    modulos: 3,
    categoria: "Logística",
    descripcion: "Gestión integral de la cadena de abastecimiento global.",
    listaModulos: [
      "MÓDULO I: GESTIÓN ESTRATÉGICA DE LA LOGÍSTICA Y LA CADENA DE SUMINISTRO EN MINERÍA",
      "MÓDULO II: GESTIÓN DE COMPRAS Y ABASTECIMIENTO EN LA CADENA DE SUMINISTRO",
      "MÓDULO III: EL ENTORNO INTERNACIONAL, TENDENCIAS Y MEJORES PRÁCTICAS"
    ]
  }
];

export const CURSOS_CORTOS_EDUMIN: CursoCorto[] = [
  { id: "cur-1", titulo: "Manejo de EPPs según la Norma Técnica Peruana Ley 29783", categoria: "Seguridad" },
  { id: "cur-2", titulo: "Implementación de Medidas de Control en Riesgos Mineros", categoria: "Seguridad" },
  { id: "cur-3", titulo: "Ergonomía y Salud Ocupacional en el Sector Minero e Industrial", categoria: "Seguridad" },
  { id: "cur-4", titulo: "Marco Jurídico y Normativo de la Minería", categoria: "Legal" },
  { id: "cur-5", titulo: "Gestión de Proveedores en Minería", categoria: "Logística" },
  { id: "cur-6", titulo: "Control de Costos en Almacenes Mineros", categoria: "Logística" },
  { id: "cur-7", titulo: "Logística y Distribución en la Industria y Minería", categoria: "Logística" },
  { id: "cur-8", titulo: "Contratos en la Industria Minera", categoria: "Legal" },
  { id: "cur-9", titulo: "Derechos Humanos en Minería", categoria: "Social" },
  { id: "cur-10", titulo: "Gestión de Trabajo en Alto Riesgo en Minería", categoria: "Seguridad" },
  { id: "cur-11", titulo: "Responsabilidad Penal en Minería", categoria: "Legal" },
  { id: "cur-12", titulo: "Derecho Laboral en Minería", categoria: "Legal" },
  { id: "cur-13", titulo: "Tipos de Concesiones Mineras", categoria: "Legal" },
  { id: "cur-14", titulo: "Gestión de Contratos Logísticos en la Industria y Minería", categoria: "Logística" },
  { id: "cur-15", titulo: "Curso de Prevención de Riesgos", categoria: "Seguridad" },
  { id: "cur-16", titulo: "Implementación de la ISO 45001:2018", categoria: "Gestión" },
  { id: "cur-17", titulo: "Gestión de Emergencias en Industria y Minería", categoria: "Seguridad" },
  { id: "cur-18", titulo: "Gestión de Inventarios en Industria y Minería", categoria: "Logística" },
  { id: "cur-19", titulo: "Control Financiero en Almacenes", categoria: "Finanzas" },
  { id: "cur-20", titulo: "Logística Interna en Control de Almacenes", categoria: "Logística" },
  { id: "cur-21", titulo: "Fundamentos de Big Data", categoria: "Tecnología" },
  { id: "cur-22", titulo: "Métodos de Captura de Información en Big Data", categoria: "Tecnología" },
  { id: "cur-23", titulo: "Tendencias 2025-2026 Claves de Big Data", categoria: "Tecnología" },
  { id: "cur-24", titulo: "Big Data: Transformación de Datos (Python y R)", categoria: "Tecnología" },
  { id: "cur-25", titulo: "Minería 4.0 Essentials (Nuevas Herramientas)", categoria: "Tecnología" },
  { id: "cur-26", titulo: "Innovación en Minería: Aplicaciones de Inteligencia Artificial", categoria: "Tecnología" },
  { id: "cur-27", titulo: "Automatización 4.0 en Procesos Mineros", categoria: "Tecnología" },
  { id: "cur-28", titulo: "Cadena de Suministro Logística y Distribución", categoria: "Logística" },
  { id: "cur-29", titulo: "Mejora de los Métodos y Medición de los Recursos", categoria: "Operaciones" },
  { id: "cur-30", titulo: "Introducción a la Gestión de Proyectos", categoria: "Gestión" },
  { id: "cur-31", titulo: "Arquitectura de Datos: La importancia del diseño, componentes, función, configuración y patrones", categoria: "Tecnología" },
  { id: "cur-32", titulo: "Ecosistema Big Data: Herramientas y tecnologías esenciales", categoria: "Tecnología" },
  { id: "cur-33", titulo: "Introducción a Machine Learning para Big Data", categoria: "Tecnología" },
  { id: "cur-34", titulo: "Proyectos con Herramientas Digitales para Minería", categoria: "Tecnología" },
  { id: "cur-35", titulo: "Introducción a Machine Learning en Minería", categoria: "Tecnología" },
  { id: "cur-36", titulo: "Tipos de Inteligencia Artificial Aplicadas a la Minería", categoria: "Tecnología" },
  { id: "cur-37", titulo: "Herramientas de Big Data Aplicada a Minería", categoria: "Tecnología" },
  { id: "cur-38", titulo: "Gestión Avanzada de Operaciones Industriales", categoria: "Operaciones" },
  { id: "cur-39", titulo: "Big Data Aplicada a Procesos Industriales", categoria: "Tecnología" },
  { id: "cur-40", titulo: "Control de Costos en Producción Industrial o en Áreas de Producción", categoria: "Finanzas" },
  { id: "cur-41", titulo: "Importación y Exportación desde 0: Claves para el éxito", categoria: "Negocios" },
  { id: "cur-42", titulo: "Implementación de la Norma ISO 9001:2015", categoria: "Gestión" },
  { id: "cur-43", titulo: "Análisis de Mercados Internacionales: Estrategias de Importación y Exportación 2025-2026", categoria: "Negocios" },
  { id: "cur-44", titulo: "De la Importación a la Venta Online: Implementa tu tienda virtual desde cero", categoria: "Negocios" },
  { id: "cur-45", titulo: "Control y Supervisión de Procesos con Software SCADA", categoria: "Tecnología" },
  { id: "cur-46", titulo: "Gestión de Operaciones y Procesos en la Minería", categoria: "Operaciones" },
  { id: "cur-47", titulo: "Pirámide de Procesos: Técnicas de control en minería", categoria: "Operaciones" },
  { id: "cur-48", titulo: "Proceso de optimización de mantenimiento a partir del uso de técnicas de la Industria 4.0", categoria: "Operaciones" },
  { id: "cur-49", titulo: "Sistemas Integrados para la Gestión de Mantenimiento", categoria: "Operaciones" },
  { id: "cur-50", titulo: "Estándares y Sistema de Calidad del Mantenimiento", categoria: "Gestión" },
  { id: "cur-51", titulo: "Documentación y Trámites Aduaneros", categoria: "Negocios" },
  { id: "cur-52", titulo: "Revisión de Proveedores para evitar estafas en importaciones chinas", categoria: "Negocios" },
  { id: "cur-53", titulo: "Planificación de riesgos para importación y exportación", categoria: "Negocios" },
  { id: "cur-54", titulo: "Control de Calidad en Procesos Mineros", categoria: "Operaciones" },
  { id: "cur-55", titulo: "Monitoreo y Control en la Operación de Plantas Mineras", categoria: "Operaciones" },
  { id: "cur-56", titulo: "Sostenibilidad y Seguridad en Campamentos Mineros", categoria: "Seguridad" },
  { id: "cur-57", titulo: "Análisis de Datos para Optimizar Operaciones Mineras", categoria: "Tecnología" },
  { id: "cur-58", titulo: "Seguridad y Control Ambiental en el Mantenimiento", categoria: "Ambiental" },
  { id: "cur-59", titulo: "Gerencia de Proyectos del Mantenimiento", categoria: "Gestión" },
  { id: "cur-60", titulo: "Gestión de Costos del Mantenimiento en la Industria 4.0", categoria: "Finanzas" },
  { id: "cur-61", titulo: "Sostenibilidad y Minería Responsable", categoria: "Ambiental" },
  { id: "cur-62", titulo: "Primeros Auxilios en Minería", categoria: "Seguridad" },
  { id: "cur-63", titulo: "Indicadores Clave (KPIs) para la Cadena de Abastecimientos", categoria: "Logística" },
  { id: "cur-64", titulo: "Exploración Minera y Evaluación de Yacimientos", categoria: "Minería" },
  { id: "cur-65", titulo: "Requisitos Clave de ISO 14001 y cómo aplicarlos en la empresa", categoria: "Ambiental" },
  { id: "cur-66", titulo: "Sistemas Integrados de Gestión HSEQ (ISO 9001, 14001, 45001)", categoria: "Gestión" },
  { id: "cur-67", titulo: "Gestión de Crisis y Manejo de Conflictos en Ambientes Industriales", categoria: "Social" },
  { id: "cur-68", titulo: "Planificación Estratégica y Balanced Scorecard", categoria: "Gestión" },
  { id: "cur-69", titulo: "Gestión de la Energía en Operaciones Mineras", categoria: "Operaciones" },
  { id: "cur-70", titulo: "Gestión de la Cadena de Suministro en Empresas Mineras", categoria: "Logística" },
  { id: "cur-71", titulo: "Seguridad y Normativa en el Control de Inventario y Logística Minera", categoria: "Seguridad" },
  { id: "cur-72", titulo: "Salud Mental en el Trabajo: Detección y prevención de trastornos psicológicos", categoria: "Seguridad" },
  { id: "cur-73", titulo: "Implementación de Lean Manufacturing en Procesos Industriales", categoria: "Operaciones" },
  { id: "cur-74", titulo: "Ergonomía y Diseño de Puestos de Trabajo en la Industria", categoria: "Seguridad" },
  { id: "cur-75", titulo: "Gestión de Seguridad durante las Paradas de Planta y Mantenimiento", categoria: "Seguridad" },
  { id: "cur-76", titulo: "Gestión de Relaves y Residuos Mineros", categoria: "Ambiental" },
];