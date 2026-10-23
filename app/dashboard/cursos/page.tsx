'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  PlayCircle, 
  Sparkles, 
  FileText, 
  Tag, 
  ShoppingBag, 
  ChevronDown, 
  ChevronUp, 
  Search, 
  RotateCcw, 
  BarChart2, 
  Clock, 
  Award,
  Wrench,
  X,
  CircleDashed,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/context/theme-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { StudentPageHeader } from '@/components/dashboard/StudentPageHeader';

import { parseCursosFromProfile } from '@/lib/utils/profileParser';

export default function CursosPage() {
  const [paquete, setPaquete] = useState<string>('FULL');
  const [nombres, setNombres] = useState<string>('Estudiante');
  const [loading, setLoading] = useState(true);

  // Estado para el Modo Oscuro / Claro desde el ThemeContext global
  const { esOscuro } = useTheme();

  // Control del despliegue del catálogo y filtro por píldoras de estado
  const [mostrarCatalogoAdicional, setMostrarCatalogoAdicional] = useState(false);
  const [filtroEstadoMatriculados, setFiltroEstadoMatriculados] = useState<'todos' | 'progreso' | 'completados'>('progreso');

  // ESTADO DE SIMULACIÓN DEV (SOLO DESARROLLO INTERNO)
  const [estadoSimuladoDev, setEstadoSimuladoDev] = useState<'sin_cursos' | 'un_curso' | 'todos'>('todos');
  const [mostrarPanelDev, setMostrarPanelDev] = useState(true);

  // Filtros interactivos y buscador superior
  const [busqueda, setBusqueda] = useState<string>('');
  const [ordenamiento, setOrdenamiento] = useState<string>('nuevo');
  
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos');
  const [nivelFiltro, setNivelFiltro] = useState<string>('Todos');
  const [precioMaximo, setPrecioMaximo] = useState<number>(159);

  // 1. Cursos matriculados (en progreso y completados)
  const listaBaseCursosMatriculados = [
    { 
      id: 'manejo-epps', 
      titulo: "MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783", 
      categoria: "Seguridad y prevención", 
      duracion: "20 horas académicas", 
      avance: 75,
      imagen: "/assets/images/cursos/cur-01-manejo-de-epps-segun-la-norma-tecnica-peruana-ley-29783.jpg"
    },
    { 
      id: 'big-data', 
      titulo: "FUNDAMENTOS DE BIG DATA", 
      categoria: "Inteligencia de datos", 
      duracion: "25 horas académicas", 
      avance: 40,
      imagen: "/assets/images/cursos/cur-21-fundamentos-de-big-data.jpg"
    },
    { 
      id: 'logistica-minera', 
      titulo: "LOGÍSTICA Y DISTRIBUCIÓN EN LA INDUSTRIA Y MINERÍA", 
      categoria: "Logística y almacenes", 
      duracion: "30 horas académicas", 
      avance: 20,
      imagen: "/assets/images/cursos/cur-07-logistica-y-distribucion-en-la-industria-y-mineria.jpg"
    },
    { 
      id: 'riesgos-criticos', 
      titulo: "GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA", 
      categoria: "Seguridad y prevención", 
      duracion: "15 horas académicas", 
      avance: 100,
      imagen: "/assets/images/cursos/cur-10-gestion-de-trabajo-en-alto-riesgo-en-mineria.jpg"
    },
    { 
      id: 'sistemas-hseq', 
      titulo: "SISTEMAS INTEGRADOS DE GESTIÓN HSEQ (ISO 9001, 14001, 45001)", 
      categoria: "Legislación y normativa", 
      duracion: "40 horas académicas", 
      avance: 100,
      imagen: "/assets/images/cursos/cur-66-sistemas-integrados-de-gestion-hseq-iso-9001-14001-45001.jpg"
    },
    { 
      id: 'iso-14001', 
      titulo: "REQUISITOS CLAVE DE ISO 14001 Y CÓMO APLICARLOS EN LA EMPRESA", 
      categoria: "Medio ambiente", 
      duracion: "30 horas académicas", 
      avance: 0,
      imagen: "/assets/images/cursos/cur-65-requisitos-clave-de-iso-14001-y-como-aplicarlos-en-la-empresa.jpg"
    },
    { 
      id: 'iso-9001', 
      titulo: "IMPLEMENTACIÓN DE LA NORMA ISO 9001:2015", 
      categoria: "Operaciones y procesos", 
      duracion: "30 horas académicas", 
      avance: 100,
      imagen: "/assets/images/cursos/cur-42-implementacion-de-la-norma-iso-9001-2015.jpg"
    }
  ];

  // Cursos reales cargados dinámicamente desde Supabase
  const [cursosEstudianteReal, setCursosEstudianteReal] = useState<any[]>([]);

  const listaCursosMatriculados = cursosEstudianteReal.length > 0
    ? cursosEstudianteReal
    : (estadoSimuladoDev === 'sin_cursos'
        ? []
        : (estadoSimuladoDev === 'un_curso'
            ? [listaBaseCursosMatriculados[0]]
            : listaBaseCursosMatriculados));

  // Separación por estado y filtrado activo según píldora seleccionada
  const cursosEnProgreso = listaCursosMatriculados.filter(c => c.avance < 100);
  const cursosCompletados = listaCursosMatriculados.filter(c => c.avance >= 100);

  const cursosMatriculadosMostrar = listaCursosMatriculados.filter(c => {
    if (filtroEstadoMatriculados === 'progreso') return c.avance < 100;
    if (filtroEstadoMatriculados === 'completados') return c.avance >= 100;
    return true;
  });

  // 2. Catálogo completo con los 76 cursos oficiales
  const catalogoGeneralCursos = [
    { titulo: "MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783", categoria: "Seguridad y prevención", duracion: "20 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Principiante", imagen: "/assets/images/cursos/cur-01-manejo-de-epps-segun-la-norma-tecnica-peruana-ley-29783.jpg" },
    { titulo: "IMPLEMENTACIÓN DE MEDIDAS DE CONTROL EN RIESGOS MINEROS", categoria: "Seguridad y prevención", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-02-implementacion-de-medidas-de-control-en-riesgos-mineros.jpg" },
    { titulo: "ERGONOMÍA Y SALUD OCUPACIONAL EN EL SECTOR MINERO E INDUSTRIAL", categoria: "Seguridad y prevención", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-03-ergonomia-y-salud-ocupacional-en-el-sector-minero-e-industrial.jpg" },
    { titulo: "GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA", categoria: "Seguridad y prevención", duracion: "15 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-10-gestion-de-trabajo-en-alto-riesgo-en-mineria.jpg" },
    { titulo: "CURSO DE PREVENCIÓN DE RIESGOS", categoria: "Seguridad y prevención", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-15-curso-de-prevencion-de-riesgos.jpg" },
    { titulo: "IMPLEMENTACIÓN DE LA ISO 45001:2018", categoria: "Seguridad y prevención", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-16-implementacion-de-la-iso-45001-2018.jpg" },
    { titulo: "GESTIÓN DE EMERGENCIAS EN INDUSTRIA Y MINERÍA", categoria: "Seguridad y prevención", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-17-gestion-de-emergencias-en-industria-y-mineria.jpg" },
    { titulo: "PRIMEROS AUXILIOS EN MINERÍA", categoria: "Seguridad y prevención", duracion: "15 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "/assets/images/cursos/cur-62-primeros-auxilios-en-mineria.jpg" },
    { titulo: "REQUISITOS CLAVE DE ISO 14001 Y CÓMO APLICARLOS EN LA EMPRESA", categoria: "Medio ambiente", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-65-requisitos-clave-de-iso-14001-y-como-aplicarlos-en-la-empresa.jpg" },
    { titulo: "SISTEMAS INTEGRADOS DE GESTIÓN HSEQ (ISO 9001, 14001, 45001)", categoria: "Legislación y normativa", duracion: "40 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-66-sistemas-integrados-de-gestion-hseq-iso-9001-14001-45001.jpg" },
    { titulo: "GESTIÓN DE CRISIS Y MANEJO DE CONFLICTOS EN AMBIENTES INDUSTRIALES", categoria: "Legislación y normativa", duracion: "25 Horas Académicas", precio: 99, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-67-gestion-de-crisis-y-manejo-de-conflictos-en-ambientes-industriales.jpg" },
    { titulo: "SALUD MENTAL EN EL TRABAJO: DETECCIÓN Y PREVENCIÓN DE TRASTORNOS PSICOLÓGICOS", categoria: "Seguridad y prevención", duracion: "15 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-72-salud-mental-en-el-trabajo-deteccion-y-prevencion-de-trastornos-psicologicos.jpg" },
    { titulo: "ERGONOMÍA Y DISEÑO DE PUESTOS DE TRABAJO EN LA INDUSTRIA", categoria: "Seguridad y prevención", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "/assets/images/cursos/cur-74-ergonomia-y-diseno-de-puestos-de-trabajo-en-la-industria.jpg" },
    { titulo: "GESTIÓN DE SEGURIDAD DURANTE LAS PARADAS DE PLANTA Y MANTENIMIENTO", categoria: "Mantenimiento industrial", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-75-gestion-de-seguridad-durante-las-paradas-de-planta-y-mantenimiento.jpg" },
    { titulo: "GESTIÓN DE RELAVES Y RESIDUOS MINEROS", categoria: "Medio ambiente", duracion: "35 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-76-gestion-de-relaves-y-residuos-mineros.jpg" },

    { titulo: "MARCO JURÍDICO Y NORMATIVO DE LA MINERÍA", categoria: "Legislación y normativa", duracion: "25 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-04-marco-juridico-y-normativo-de-la-mineria.jpg" },
    { titulo: "GESTIÓN DE PROVEEDORES EN MINERÍA", categoria: "Logística y almacenes", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-05-gestion-de-proveedores-en-mineria.jpg" },
    { titulo: "CONTRATOS EN LA INDUSTRIA MINERA", categoria: "Legislación y normativa", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-08-contratos-en-la-industria-minera.jpg" },
    { titulo: "DERECHOS HUMANOS EN MINERÍA", categoria: "Legislación y normativa", duracion: "15 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-09-derechos-humanos-en-mineria.jpg" },
    { titulo: "RESPONSABILIDAD PENAL EN MINERÍA", categoria: "Legislación y normativa", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-11-responsabilidad-penal-en-mineria.jpg" },
    { titulo: "DERECHO LABORAL EN MINERÍA", categoria: "Legislación y normativa", duracion: "25 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-12-derecho-laboral-en-mineria.jpg" },
    { titulo: "TIPOS DE CONCESIONES MINERAS", categoria: "Legislación y normativa", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-13-tipos-de-concesiones-mineras.jpg" },
    { titulo: "GESTIÓN DE OPERACIONES Y PROCESOS EN LA MINERÍA", categoria: "Operaciones y procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-46-gestion-de-operaciones-y-procesos-en-la-mineria.jpg" },
    { titulo: "PIRÁMIDE DE PROCESOS: TÉCNICAS DE CONTROL EN MINERÍA", categoria: "Operaciones y procesos", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "/assets/images/cursos/cur-47-piramide-de-procesos-tecnicas-de-control-en-mineria.jpg" },
    { titulo: "CONTROL DE CALIDAD EN PROCESOS MINEROS", categoria: "Operaciones y procesos", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-54-control-de-calidad-en-procesos-mineros.jpg" },
    { titulo: "MONITOREO Y CONTROL EN LA OPERACIÓN DE PLANTAS MINERAS", categoria: "Operaciones y procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-55-monitoreo-y-control-en-la-operacion-de-plantas-mineras.jpg" },
    { titulo: "SOSTENIBILIDAD Y SEGURIDAD EN CAMPAMENTOS MINEROS", categoria: "Seguridad y prevención", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "/assets/images/cursos/cur-56-sostenibilidad-y-seguridad-en-campamentos-mineros.jpg" },
    { titulo: "SOSTENIBILIDAD Y MINERÍA RESPONSABLE", categoria: "Medio ambiente", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-61-sostenibilidad-y-mineria-responsable.jpg" },
    { titulo: "EXPLORACIÓN MINERA Y EVALUACIÓN DE YACIMIENTOS", categoria: "Operaciones y procesos", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-64-exploracion-minera-y-evaluacion-de-yacimientos.jpg" },
    { titulo: "GESTIÓN DE LA ENERGÍA EN OPERACIONES MINERAS", categoria: "Medio ambiente", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-69-gestion-de-la-energia-en-operaciones-mineras.jpg" },

    { titulo: "FUNDAMENTOS DE BIG DATA", categoria: "Inteligencia de datos", duracion: "25 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Principiante", imagen: "/assets/images/cursos/cur-21-fundamentos-de-big-data.jpg" },
    { titulo: "MÉTODOS DE CAPTURA DE INFORMACIÓN EN BIG DATA", categoria: "Inteligencia de datos", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-22-metodos-de-captura-de-informacion-en-big-data.jpg" },
    { titulo: "TENDENCIAS 2025-2026: CLAVES DE BIG DATA", categoria: "Inteligencia de datos", duracion: "15 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "/assets/images/cursos/cur-23-tendencias-2025-2026-claves-de-big-data.jpg" },
    { titulo: "BIG DATA: TRANSFORMACIÓN DE DATOS (PYTHON Y R)", categoria: "Inteligencia de datos", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-24-big-data-transformacion-de-datos-python-y-r.jpg" },
    { titulo: "MINERÍA 4.0 ESSENTIALS: NUEVAS HERRAMIENTAS", categoria: "Tecnología e innovación", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-25-mineria-4-0-essentials-nuevas-herramientas.jpg" },
    { titulo: "INNOVACIÓN EN MINERÍA: APLICACIONES DE INTELIGENCIA ARTIFICIAL", categoria: "Tecnología e innovación", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-26-innovacion-en-mineria-aplicaciones-de-inteligencia-artificial.jpg" },
    { titulo: "AUTOMATIZACIÓN 4.0 EN PROCESOS MINEROS", categoria: "Tecnología e innovación", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-27-automatizacion-4-0-en-procesos-mineros.jpg" },
    { titulo: "INTRODUCCIÓN A LA GESTIÓN DE PROYECTOS", categoria: "Operaciones y procesos", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "/assets/images/cursos/cur-30-introduccion-a-la-gestion-de-proyectos.jpg" },
    { titulo: "ARQUITECTURA DE DATOS: LA IMPORTANCIA DEL DISEÑO, COMPONENTES, FUNCIÓN, CONFIGURACIÓN Y PATRONES", categoria: "Inteligencia de datos", duracion: "40 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-31-arquitectura-de-datos-la-importancia-del-diseno-componentes-funcion-configuracion-y-patrones.jpg" },
    { titulo: "ECOSISTEMA BIG DATA: HERRAMIENTAS Y TECNOLOGÍAS ESENCIALES", categoria: "Inteligencia de datos", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-32-ecosistema-big-data-herramientas-y-tecnologias-esenciales.jpg" },
    { titulo: "INTRODUCCIÓN A MACHINE LEARNING PARA BIG DATA", categoria: "Inteligencia de datos", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-33-introduccion-a-machine-learning-para-big-data.jpg" },
    { titulo: "PROYECTOS CON HERRAMIENTAS DIGITALES PARA MINERÍA", categoria: "Tecnología e innovación", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-34-proyectos-con-herramientas-digitales-para-mineria.jpg" },
    { titulo: "INTRODUCCIÓN A MACHINE LEARNING EN MINERÍA", categoria: "Tecnología e innovación", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-35-introduccion-a-machine-learning-en-mineria.jpg" },
    { titulo: "TIPOS DE INTELIGENCIA ARTIFICIAL APLICADAS A LA MINERÍA", categoria: "Tecnología e innovación", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-36-tipos-de-inteligencia-artificial-aplicadas-a-la-mineria.jpg" },
    { titulo: "HERRAMIENTAS DE BIG DATA APLICADA A MINERÍA", categoria: "Inteligencia de datos", duracion: "30 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-37-herramientas-de-big-data-aplicada-a-mineria.jpg" },
    { titulo: "CONTROL Y SUPERVISIÓN DE PROCESOS CON SOFTWARE SCADA", categoria: "Tecnología e innovación", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-45-control-y-supervision-de-procesos-con-software-scada.jpg" },
    { titulo: "PROCESO DE OPTIMIZACIÓN DEL MANTENIMIENTO A PARTIR DEL USO DE TÉCNICAS DE LA INDUSTRIA 4.0", categoria: "Mantenimiento industrial", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-48-proceso-de-optimizacion-del-mantenimiento-a-partir-del-uso-de-tecnicas-de-la-industria-4-0.jpg" },
    { titulo: "ANÁLISIS DE DATOS PARA OPTIMIZAR OPERACIONES MINERAS", categoria: "Inteligencia de datos", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-57-analisis-de-datos-para-optimizar-operaciones-mineras.jpg" },

    { titulo: "LOGÍSTICA Y DISTRIBUCIÓN EN LA INDUSTRIA Y MINERÍA", categoria: "Logística y almacenes", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-07-logistica-y-distribucion-en-la-industria-y-mineria.jpg" },
    { titulo: "CONTROL DE COSTOS EN ALMACENES MINEROS", categoria: "Logística y almacenes", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-06-control-de-costos-en-almacenes-mineros.jpg" },
    { titulo: "GESTIÓN DE CONTRATOS LOGÍSTICOS EN LA INDUSTRIA Y MINERÍA", categoria: "Logística y almacenes", duracion: "30 Horas Académicas", precio: 159, estado: "Especial", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-14-gestion-de-contratos-logisticos-en-la-industria-y-mineria.jpg" },
    { titulo: "GESTIÓN DE INVENTARIOS EN INDUSTRIA Y MINERÍA", categoria: "Logística y almacenes", duracion: "25 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-18-gestion-de-inventarios-en-industria-y-mineria.jpg" },
    { titulo: "CONTROL FINANCIERO EN ALMACENES", categoria: "Logística y almacenes", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-19-control-financiero-en-almacenes.jpg" },
    { titulo: "LOGÍSTICA INTERNA EN CONTROL DE ALMACENES", categoria: "Logística y almacenes", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "/assets/images/cursos/cur-20-logistica-interna-en-control-de-almacenes.jpg" },
    { titulo: "CADENA DE SUMINISTRO LOGÍSTICA Y DISTRIBUCIÓN", categoria: "Logística y almacenes", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-28-cadena-de-suministro-logistica-y-distribucion.jpg" },
    { titulo: "MEJORA DE LOS MÉTODOS Y MEDICIÓN DE LOS RECURSOS", categoria: "Operaciones y procesos", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-29-mejora-de-los-metodos-y-medicion-de-los-recursos.jpg" },
    { titulo: "INDICADORES CLAVE (KPIS) PARA LA CADENA DE ABASTECIMIENTOS", categoria: "Logística y almacenes", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "/assets/images/cursos/cur-63-indicadores-clave-kpis-para-la-cadena-de-abastecimientos.jpg" },
    { titulo: "GESTIÓN DE LA CADENA DE SUMINISTRO EN EMPRESAS MINERAS", categoria: "Logística y almacenes", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-70-gestion-de-la-cadena-de-suministro-en-empresas-mineras.jpg" },
    { titulo: "SEGURIDAD Y NORMATIVA EN EL CONTROL DE INVENTARIO Y LOGÍSTICA MINERA", categoria: "Legislación y normativa", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-71-seguridad-y-normativa-en-el-control-de-inventario-y-logistica-minera.jpg" },

    { titulo: "IMPORTACIÓN Y EXPORTACIÓN DESDE 0: CLAVES PARA EL ÉXITO", categoria: "Comercio exterior", duracion: "20 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Principiante", imagen: "/assets/images/cursos/cur-41-importacion-y-exportacion-desde-0-claves-para-el-exito.jpg" },
    { titulo: "IMPLEMENTACIÓN DE LA NORMA ISO 9001:2015", categoria: "Operaciones y procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-42-implementacion-de-la-norma-iso-9001-2015.jpg" },
    { titulo: "ANÁLISIS DE MERCADOS INTERNACIONALES: ESTRATEGIAS DE IMPORTACIÓN Y EXPORTACIÓN 2025-2026", categoria: "Comercio exterior", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-43-analisis-de-mercados-internacionales-estrategias-de-importacion-y-exportacion-2025-2026.jpg" },
    { titulo: "DE LA IMPORTACIÓN A LA VENTA ONLINE: IMPLEMENTA TU TIENDA VIRTUAL DESDE CERO", categoria: "Comercio exterior", duracion: "20 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Principiante", imagen: "/assets/images/cursos/cur-44-de-la-importacion-a-la-venta-online-implementa-tu-tienda-virtual-desde-cero.jpg" },
    { titulo: "DOCUMENTACIÓN Y TRÁMITES ADUANEROS", categoria: "Comercio exterior", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-51-documentacion-y-tramites-aduaneros.jpg" },
    { titulo: "REVISIÓN DE PROVEEDORES PARA EVITAR ESTAFAS EN IMPORTACIONES CHINAS", categoria: "Comercio exterior", duracion: "15 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "/assets/images/cursos/cur-52-revision-de-proveedores-para-evitar-estafas-en-importaciones-chinas.jpg" },
    { titulo: "PLANIFICACIÓN DE RIESGOS PARA IMPORTACIÓN Y EXPORTACIÓN", categoria: "Comercio exterior", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "/assets/images/cursos/cur-53-planificacion-de-riesgos-para-importacion-y-exportacion.jpg" },
    { titulo: "PLANIFICACIÓN ESTRATÉGICA Y BALANCED SCORECARD", categoria: "Operaciones y procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-68-planificacion-estrategica-y-balanced-scorecard.jpg" },

    { titulo: "GESTIÓN AVANZADA DE OPERACIONES INDUSTRIALES", categoria: "Operaciones y procesos", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-38-gestion-avanzada-de-operaciones-industriales.jpg" },
    { titulo: "BIG DATA APLICADA A PROCESOS INDUSTRIALES", categoria: "Inteligencia de datos", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-39-big-data-aplicada-a-procesos-industriales.jpg" },
    { titulo: "CONTROL DE COSTOS EN PRODUCCIÓN INDUSTRIAL O EN ÁREAS DE PRODUCCIÓN", categoria: "Operaciones y procesos", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-40-control-de-costos-en-produccion-industrial-o-en-areas-de-produccion.jpg" },
    { titulo: "SISTEMAS INTEGRADOS PARA LA GESTIÓN DE MANTENIMIENTO", categoria: "Mantenimiento industrial", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-49-sistemas-integrados-para-la-gestion-de-mantenimiento.jpg" },
    { titulo: "ESTÁNDARES Y SISTEMA DE CALIDAD DEL MANTENIMIENTO", categoria: "Mantenimiento industrial", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-50-estandares-y-sistema-de-calidad-del-mantenimiento.jpg" },
    { titulo: "SEGURIDAD Y CONTROL AMBIENTAL EN EL MANTENIMIENTO", categoria: "Mantenimiento industrial", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-58-seguridad-y-control-ambiental-en-el-mantenimiento.jpg" },
    { titulo: "GERENCIA DE PROYECTOS DEL MANTENIMIENTO", categoria: "Mantenimiento industrial", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "/assets/images/cursos/cur-59-gerencia-de-proyectos-del-mantenimiento.jpg" },
    { titulo: "GESTIÓN DE COSTOS DEL MANTENIMIENTO EN LA INDUSTRIA 4.0", categoria: "Mantenimiento industrial", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-60-gestion-de-costos-del-mantenimiento-en-la-industria-4-0.jpg" },
    { titulo: "IMPLEMENTACIÓN DE LEAN MANUFACTURING EN PROCESOS INDUSTRIALES", categoria: "Operaciones y procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-73-implementacion-de-lean-manufacturing-en-procesos-industriales.jpg" }
  ];

  const listaCategorias = ["Todas","Seguridad y prevención","Legislación y normativa","Logística y almacenes","Inteligencia de datos","Tecnología e innovación","Operaciones y procesos","Comercio exterior","Mantenimiento industrial","Medio ambiente"];
  const listaEstados = ['Todos', 'Más vendido', 'Nuevo', 'Especial'];
  const listaNiveles = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

  useEffect(() => {
    async function cargarPerfilYSupabase() {
      try {
        const res = await fetch('/api/dashboard/me');
        if (res.ok) {
          const data = await res.json();
          const prof = data.profile;
          const matriculas = data.matriculas || [];

          if (prof) {
            if (prof.nombres) setNombres(prof.nombres);
            if (prof.paquete_adquirido) setPaquete(prof.paquete_adquirido.toUpperCase());

            const cursosEnrolados: any[] = [];
            const idsAgregados = new Set<string>();

            // 1. Cursos matriculados explícitamente en la tabla matriculas
            (matriculas || []).forEach((m: any) => {
              if (m.tipo === 'CURSO' || m.tipo === 'curso' || m.tipo === 'TALLER') {
                const idSlug = m.item_id || m.titulo.toLowerCase().replace(/[^a-z0-9]/g, '-');
                if (!idsAgregados.has(idSlug)) {
                  idsAgregados.add(idSlug);
                  const catMatch = catalogoGeneralCursos.find(c => c.titulo.toUpperCase() === m.titulo?.toUpperCase());
                  cursosEnrolados.push({
                    id: idSlug,
                    titulo: m.titulo || 'Curso de Especialización',
                    categoria: catMatch?.categoria || 'Especialización',
                    duracion: catMatch?.duracion || '25 horas académicas',
                    avance: m.avance_porcentaje ?? 0,
                    imagen: catMatch?.imagen || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
                  });
                }
              }
            });

            // 2. Cursos del formato JSON de Supabase
            const cursosJsonPerfil = parseCursosFromProfile(prof);
            cursosJsonPerfil.forEach((cj) => {
              const idSlug = cj.id || cj.codigo.toLowerCase();
              if (!idsAgregados.has(idSlug)) {
                idsAgregados.add(idSlug);
                const catMatch = catalogoGeneralCursos.find(c => c.titulo.toUpperCase() === cj.titulo.toUpperCase());
                cursosEnrolados.push({
                  id: idSlug,
                  titulo: cj.titulo,
                  categoria: catMatch?.categoria || 'Seguridad & SSOMA',
                  duracion: catMatch?.duracion || '25 horas académicas',
                  avance: cj.completado ? 100 : (typeof cj.avance === 'number' ? cj.avance : 0),
                  nota: cj.nota,
                  imagen: catMatch?.imagen || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
                });
              }
            });

            // 2. Si no tiene cursos específicos canjeados aún en la BD, derivar automáticamente los cursos acordes a su diplomado asignado
            if (cursosEnrolados.length === 0 && prof.diplomado_1) {
              const dipNombre = prof.diplomado_1.toLowerCase();
              let categoriaPrincipal = 'Seguridad & SSOMA';
              if (dipNombre.includes('derecho') || dipNombre.includes('tierra') || dipNombre.includes('legal')) {
                categoriaPrincipal = 'Minería & Operaciones';
              } else if (dipNombre.includes('geologia') || dipNombre.includes('yacimiento') || dipNombre.includes('exploracion')) {
                categoriaPrincipal = 'Minería & Operaciones';
              } else if (dipNombre.includes('digital') || dipNombre.includes('4.0') || dipNombre.includes('automatizacion')) {
                categoriaPrincipal = 'Tecnología & Minería 4.0';
              } else if (dipNombre.includes('logistica') || dipNombre.includes('almacen')) {
                categoriaPrincipal = 'Logística & Suministro';
              }

              const cursosDeSubcategoria = catalogoGeneralCursos
                .filter(c => c.categoria === categoriaPrincipal)
                .slice(0, 4);

              cursosDeSubcategoria.forEach((cItem, idx) => {
                const cSlug = cItem.titulo.toLowerCase().replace(/[^a-z0-9]/g, '-');
                if (!idsAgregados.has(cSlug)) {
                  idsAgregados.add(cSlug);
                  cursosEnrolados.push({
                    id: cSlug,
                    titulo: cItem.titulo,
                    categoria: cItem.categoria,
                    duracion: cItem.duracion,
                    avance: idx === 0 ? 75 : (idx === 1 ? 40 : (idx === 2 ? 20 : 0)),
                    imagen: cItem.imagen
                  });
                }
              });
            }

            if (cursosEnrolados.length > 0) {
              setCursosEstudianteReal(cursosEnrolados);
            }
          }
        }
      } catch (err) {
        console.error('Error al cargar cursos de Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    cargarPerfilYSupabase();
  }, []);

  if (loading) {
    return <DashboardLoader />;
  }

  const resetearFiltros = () => {
    setCategoriaFiltro('Todas');
    setEstadoFiltro('Todos');
    setNivelFiltro('Todos');
    setPrecioMaximo(159);
    setBusqueda('');
  };

  const normalizarTexto = (texto: string) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  let cursosFiltrados = catalogoGeneralCursos.filter(c => {
    const noMatriculado = !listaCursosMatriculados.some(m => m.titulo.toLowerCase() === c.titulo.toLowerCase());
    
    const tituloNormalizado = normalizarTexto(c.titulo);
    const busquedaNormalizada = normalizarTexto(busqueda);
    
    const coincideBusqueda = tituloNormalizado.includes(busquedaNormalizada);
    const coincideCategoria = categoriaFiltro === 'Todas' || c.categoria === categoriaFiltro;
    const coincideEstado = estadoFiltro === 'Todos' || c.estado === estadoFiltro;
    const coincideNivel = nivelFiltro === 'Todos' || c.nivel === nivelFiltro;
    const coincidePrecio = c.precio <= precioMaximo;

    return noMatriculado && coincideBusqueda && coincideCategoria && coincideEstado && coincideNivel && coincidePrecio;
  });

  if (ordenamiento === 'alto') {
    cursosFiltrados.sort((a, b) => b.precio - a.precio);
  } else if (ordenamiento === 'bajo') {
    cursosFiltrados.sort((a, b) => a.precio - b.precio);
  }

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 pb-24 transition-colors duration-300 ${esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto space-y-10">
        
        {/* Encabezado Unificado */}
        <StudentPageHeader
          icon={BookOpen}
          title="Mis cursos"
          subtitle="Accede a tus cursos matriculados con seguimiento de avance o adquiere nuevas especializaciones."
        />

        {/* VISTA SEGÚN ESTADO DE CURSOS MATRICULADOS */}
        {listaCursosMatriculados.length === 0 ? (
          <div className={`rounded-3xl p-8 text-center border shadow-sm ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="size-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 grid place-items-center mb-4">
              <BookOpen className="size-8" />
            </div>
            <h3 className={`text-xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              Aún no tienes cursos matriculados en tu plan
            </h3>
            <p className={`mt-2 max-w-md mx-auto text-sm ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              Explora nuestra oferta completa con los 76 cursos oficiales de alta especialización o adquiere nuevos cursos para potenciar tu perfil profesional.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setMostrarCatalogoAdicional(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm inline-flex items-center gap-2 cursor-pointer"
              >
                <ShoppingBag className="size-4" /> Explorar catálogo de cursos
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* BARRA DE PÍLDORAS/TABS SUPERIORES DESLIZABLE EN MÓVIL */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full touch-pan-x pb-2 pr-4 border-b border-slate-200 dark:border-slate-800 no-scrollbar shrink-0">
              {/* EN PROGRESO (ÍNDIGO AL ACTIVAR) */}
              <button
                onClick={() => setFiltroEstadoMatriculados('progreso')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  filtroEstadoMatriculados === 'progreso'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : (esOscuro ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200')
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>En progreso</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  filtroEstadoMatriculados === 'progreso' 
                    ? 'bg-white/20 text-white' 
                    : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                }`}>
                  {cursosEnProgreso.length}
                </span>
              </button>

              {/* COMPLETADOS (ESMERALDA AL ACTIVAR) */}
              <button
                onClick={() => setFiltroEstadoMatriculados('completados')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  filtroEstadoMatriculados === 'completados'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : (esOscuro ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200')
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Completados</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  filtroEstadoMatriculados === 'completados' 
                    ? 'bg-white/20 text-white' 
                    : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                }`}>
                  {cursosCompletados.length}
                </span>
              </button>

              {/* TODOS (SLATE/NEUTRO AL ACTIVAR) */}
              <button
                onClick={() => setFiltroEstadoMatriculados('todos')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  filtroEstadoMatriculados === 'todos'
                    ? 'bg-slate-800 text-white dark:bg-slate-700 shadow-md shadow-slate-900/20'
                    : (esOscuro ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200')
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 shrink-0" />
                <span>Todos</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  filtroEstadoMatriculados === 'todos' 
                    ? 'bg-white/20 text-white' 
                    : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                }`}>
                  {listaCursosMatriculados.length}
                </span>
              </button>
            </div>

            {/* GRILLA DE CURSOS FILTRADOS POR LA PÍLDORA SELECCIONADA */}
            {cursosMatriculadosMostrar.length === 0 ? (
              <div className={`rounded-3xl p-8 sm:p-10 text-center border shadow-sm ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="size-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 grid place-items-center mb-4">
                  <ShoppingBag className="size-7" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  {filtroEstadoMatriculados === 'progreso' ? '¡No tienes cursos pendientes en desarrollo!' : 'Aún no posees cursos completados'}
                </h3>
                <p className={`mt-2 max-w-md mx-auto text-xs sm:text-sm leading-relaxed ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  Explora nuestra oferta completa con los 76 cursos oficiales de alta especialización y adquiere nuevos programas para continuar tu ruta de aprendizaje.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <button
                    onClick={() => setMostrarCatalogoAdicional(true)}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="size-4" /> Explorar catálogo de cursos
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {cursosMatriculadosMostrar.map((curso) => {
                  const esCompletado = curso.avance >= 100;
                  const esPorIniciar = curso.avance === 0;

                  // Centralización de estilos e información de estado
                  const infoEstado = esCompletado
                    ? {
                        label: 'Completado',
                        Icono: CheckCircle2,
                        badgeBg: 'bg-emerald-600/90 border-emerald-400/30 text-white',
                        duracionIconColor: 'text-emerald-400',
                        porcentajeColor: esOscuro ? 'text-emerald-400' : 'text-emerald-600',
                        barraBg: 'bg-emerald-600',
                        botonBg: 'bg-emerald-600 group-hover:bg-emerald-700 shadow-emerald-600/20 text-white',
                        botonTexto: 'Repasar curso'
                      }
                    : esPorIniciar
                    ? {
                        label: 'Por iniciar',
                        Icono: CircleDashed,
                        badgeBg: 'bg-amber-500/90 border-amber-400/30 text-white',
                        duracionIconColor: 'text-amber-400',
                        porcentajeColor: esOscuro ? 'text-slate-400' : 'text-slate-500',
                        barraBg: 'bg-slate-300 dark:bg-slate-700',
                        botonBg: 'bg-amber-600 group-hover:bg-amber-700 shadow-amber-600/20 text-white',
                        botonTexto: 'Iniciar curso'
                      }
                    : {
                        label: 'En progreso',
                        Icono: Clock,
                        badgeBg: 'bg-indigo-500/90 border-indigo-400/30 text-white',
                        duracionIconColor: 'text-indigo-400',
                        porcentajeColor: esOscuro ? 'text-indigo-400' : 'text-indigo-600',
                        barraBg: 'bg-indigo-600',
                        botonBg: 'bg-indigo-600 group-hover:bg-indigo-700 shadow-indigo-600/20 text-white',
                        botonTexto: 'Continuar curso'
                      };

                  const IconoEstado = infoEstado.Icono;

                  return (
                    <Link
                      key={curso.id}
                      href={`/dashboard/cursos/${curso.id}`}
                      className={`group rounded-2xl overflow-hidden shadow-sm border flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                        esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      {/* PORTADA CON ETIQUETAS */}
                      <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                        <img 
                          src={curso.imagen} 
                          alt={curso.titulo}
                          className="object-cover w-full h-full opacity-90 transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute top-3 inset-x-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
                          <span className="text-[11px] font-semibold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shrink-0">
                            {curso.categoria}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border backdrop-blur-md shrink-0 ${infoEstado.badgeBg}`}>
                            <IconoEstado className="size-3.5" /> {infoEstado.label}
                          </span>
                        </div>
                      </div>

                      {/* CUERPO CON ALINEACIÓN VERTICAL UNIFORME DE TODOS LOS ELEMENTOS */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="h-12 flex items-start overflow-hidden">
                            <h3 className={`text-base font-bold leading-snug line-clamp-2 text-balance ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                              {curso.titulo}
                            </h3>
                          </div>
                          <p className={`text-xs flex items-center gap-1.5 font-medium ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                            <Clock className={`w-4 h-4 ${infoEstado.duracionIconColor}`} /> {curso.duracion}
                          </p>
                        </div>

                        {/* BLOQUE DE AVANCE CON PORCENTAJE ARRIBA DE LA BARRA (FONT-BOLD UNIFICADO) */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className={esOscuro ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>
                              Avance
                            </span>
                            <span className={`font-bold ${infoEstado.porcentajeColor}`}>
                              {curso.avance}% completado
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${infoEstado.barraBg}`} 
                              style={{ width: `${curso.avance}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* BOTÓN ALINEADO CON ÍCONO ÚNICO UNIFORME */}
                      <div className={`px-6 pb-6 pt-3 border-t flex items-center justify-end ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div className={`w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center shadow-sm ${infoEstado.botonBg}`}>
                          <span>{infoEstado.botonTexto}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 3: BOTÓN DESPLEGABLE DE ADQUISICIÓN DE MÁS CURSOS */}
        <div className={`pt-6 border-t ${esOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">Catálogo Ampliado EDUMIN</span>
              <h3 className="text-xl font-bold">¿Deseas adquirir más cursos especializados?</h3>
              <p className="text-xs text-slate-300 mt-1">Explora nuestra oferta completa con los 76 cursos oficiales de alta especialización.</p>
            </div>
            
            <button
              onClick={() => setMostrarCatalogoAdicional(!mostrarCatalogoAdicional)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              {mostrarCatalogoAdicional ? 'Ocultar Catálogo' : 'Adquirir más cursos'}
              {mostrarCatalogoAdicional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* CONTENIDO DESPLEGABLE CON FILTROS Y BÚSQUEDA DEL CATÁLOGO */}
          {mostrarCatalogoAdicional && (
            <div className="mt-8 space-y-6 transition-all animate-fadeIn">
              
              <div className={`p-6 rounded-3xl shadow-sm border space-y-4 ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  
                  {/* Buscador */}
                  <div className="sm:col-span-12 lg:col-span-4">
                    <label className={`block text-xs font-bold mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                      🔎 Búsqueda por Nombre o Tema
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Buscar cursos..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={`w-full border rounded-2xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm ${
                          esOscuro ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Filtro Categoría */}
                  <div className="sm:col-span-4 lg:col-span-3">
                    <label className={`block text-xs font-bold mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                      📁 Categoría
                    </label>
                    <select
                      value={categoriaFiltro}
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                      className={`w-full border text-xs font-semibold p-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer ${
                        esOscuro ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {listaCategorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  {/* Filtro Estado */}
                  <div className="sm:col-span-4 lg:col-span-2">
                    <label className={`block text-xs font-bold mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                      🏷️ Etiqueta
                    </label>
                    <select
                      value={estadoFiltro}
                      onChange={(e) => setEstadoFiltro(e.target.value)}
                      className={`w-full border text-xs font-semibold p-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer ${
                        esOscuro ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {listaEstados.map(est => <option key={est} value={est}>{est}</option>)}
                    </select>
                  </div>

                  {/* Filtro Nivel */}
                  <div className="sm:col-span-4 lg:col-span-3">
                    <label className={`block text-xs font-bold mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                      🎓 Nivel
                    </label>
                    <select
                      value={nivelFiltro}
                      onChange={(e) => setNivelFiltro(e.target.value)}
                      className={`w-full border text-xs font-semibold p-2.5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer ${
                        esOscuro ? 'bg-slate-950 border-slate-800 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'
                      }`}
                    >
                      {listaNiveles.map(niv => <option key={niv} value={niv}>{niv}</option>)}
                    </select>
                  </div>

                </div>

                <div className={`pt-3 flex items-center justify-end gap-3 border-t ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button 
                    onClick={resetearFiltros}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold px-4 py-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Resetear filtros
                  </button>
                </div>
              </div>

              {/* GRILLA DE CURSOS EN CATÁLOGO */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cursosFiltrados.length === 0 ? (
                  <div className={`col-span-full rounded-3xl p-12 text-center border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <p className="text-sm font-medium">No se encontraron cursos que coincidan con tu búsqueda.</p>
                  </div>
                ) : (
                  cursosFiltrados.map((curso, idx) => (
                    <article 
                      key={idx} 
                      className={`relative overflow-hidden rounded-3xl shadow-sm border flex flex-col justify-between transition-all hover:shadow-md ${
                        esOscuro ? 'bg-slate-900 border-slate-800 hover:border-indigo-500/50' : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      <div className="relative h-44 w-full bg-slate-800">
                        <img 
                          src={curso.imagen} 
                          alt={curso.titulo}
                          className="object-cover w-full h-full opacity-90"
                        />
                        <div className="absolute top-3 inset-x-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none">
                          <span className="text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 shrink-0">
                            {curso.categoria}
                          </span>
                          <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 backdrop-blur-md px-2.5 py-1 rounded-full shrink-0">
                            {curso.estado}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <span className="text-[10px] font-bold text-indigo-400">
                            {curso.nivel}
                          </span>
                          <span className={`text-xs font-bold ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                            {curso.duracion}
                          </span>
                        </div>

                        <h3 className={`text-sm font-bold leading-snug ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                          {curso.titulo}
                        </h3>

                        <div className="mt-4 flex items-baseline gap-2">
                          <span className="text-2xl font-black tabular-nums text-emerald-400">S/ {curso.precio}</span>
                        </div>
                      </div>

                      <div className={`px-6 pb-6 pt-4 border-t flex items-center justify-between gap-3 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                          <Tag className="size-3" /> Oferta actual
                        </span>

                        <a
                          href={`https://wa.me/51987654321?text=Hola,%20deseo%20adquirir%20el%20curso:%20${encodeURIComponent(curso.titulo)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 text-xs font-bold transition shadow-sm shrink-0"
                        >
                          Adquirir curso
                        </a>
                      </div>
                    </article>
                  ))
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* PANEL FLOTANTE DE SIMULACIÓN DEV (DESARROLLO INTERNO) */}
      {mostrarPanelDev && (
        <aside className="fixed bottom-5 right-5 z-40 bg-slate-900/95 text-white border border-slate-700/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl max-w-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Wrench className="size-3.5" /> Simulador Dev (Interno)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md tabular-nums">v1.0</span>
              <button 
                onClick={() => setMostrarPanelDev(false)}
                className="text-slate-400 hover:text-white transition p-0.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Cerrar panel de simulación"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-300">
            Cambia de estado para probar la vista de cursos:
          </p>

          <div className="space-y-1.5 text-xs">
            <button
              onClick={() => setEstadoSimuladoDev('sin_cursos')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'sin_cursos' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>0 Cursos (Sin matricular)</span>
              {estadoSimuladoDev === 'sin_cursos' && <CheckCircle2 className="size-3.5 text-white" />}
            </button>

            <button
              onClick={() => setEstadoSimuladoDev('un_curso')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'un_curso' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>1 Curso en Progreso (75%)</span>
              {estadoSimuladoDev === 'un_curso' && <CheckCircle2 className="size-3.5 text-white" />}
            </button>

            <button
              onClick={() => setEstadoSimuladoDev('todos')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'todos' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>6 Cursos (Vista Completa)</span>
              {estadoSimuladoDev === 'todos' && <CheckCircle2 className="size-3.5 text-white" />}
            </button>
          </div>
        </aside>
      )}

    </main>
  );
}