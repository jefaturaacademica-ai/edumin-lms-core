'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Lock, 
  CheckCircle2, 
  XCircle,
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
X,
  CircleDashed,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/context/theme-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import configuracionExamenesJson from '@/lib/data/configuracion_examenes.json';
import { StudentPageHeader } from '@/components/dashboard/StudentPageHeader';
import { TarjetaBloqueoOverlay } from '@/components/dashboard/TarjetaBloqueoOverlay';

import { parseCursosFromProfile, parseDiplomadosFromProfile, filtrarCursosReales, esCursoTaller } from '@/lib/utils/profileParser';
import { obtenerTallerParaDiplomado, TALLER_SOFT_SKILLS, TALLER_SEGURIDAD_BASADA } from '@/lib/utils/tallerAsignado';

export default function CursosPage() {
  const [paquete, setPaquete] = useState<string>('FULL');
  const [nombres, setNombres] = useState<string>('Estudiante');
  const [loading, setLoading] = useState(true);
  const [creditosCursosDisponibles, setCreditosCursosDisponibles] = useState<number>(0);
  const [cursosHabilitados, setCursosHabilitados] = useState<number>(999);

  // Estado para el Modo Oscuro / Claro desde el ThemeContext global
  const { esOscuro } = useTheme();

  // Control del despliegue del catálogo y filtro por píldoras de estado
  const [mostrarCatalogoAdicional, setMostrarCatalogoAdicional] = useState(false);
  const [filtroEstadoMatriculados, setFiltroEstadoMatriculados] = useState<'todos' | 'progreso' | 'completados'>('progreso');
  const [tarjetaBloqueoVisibleId, setTarjetaBloqueoVisibleId] = useState<string | null>(null);

  // Filtros interactivos y buscador superior
  const [busqueda, setBusqueda] = useState<string>('');
  const [ordenamiento, setOrdenamiento] = useState<string>('nuevo');
  
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('Todos');
  const [nivelFiltro, setNivelFiltro] = useState<string>('Todos');
  const [precioMaximo, setPrecioMaximo] = useState<number>(159);

  // Helper para determinar si un curso pasa a Completados (100% avance Y examen aprobado si aplica)
  const esCursoCompletadoHelper = (c: any) => {
    const codNormalizado = (c.codigo || c.id || '').toUpperCase();
    const confClaveCurso = `${codNormalizado}_Examen del curso`;
    const confClaveTaller = `${codNormalizado}_Examen del taller`;
    const configItem = (configuracionExamenesJson as Record<string, any>)[confClaveCurso] 
      || (configuracionExamenesJson as Record<string, any>)[confClaveTaller];
    const noAplicaExamen = configItem?.aplica_examen === false;
    const notaMinima = Number(configItem?.nota_minima ?? 12);

    if (noAplicaExamen) {
      return (Number(c.avance) >= 100) || Boolean(c.completado);
    }
    const examenRendido = Boolean(c.rendido || (c.nota !== undefined && c.nota !== null && Number(c.nota) > 0));
    const examenAprobado = examenRendido && c.nota !== undefined && c.nota !== null && Number(c.nota) >= notaMinima;
    return (Number(c.avance) >= 100) && examenAprobado;
  };

  // Cursos reales cargados dinámicamente desde Supabase
  const [cursosEstudianteReal, setCursosEstudianteReal] = useState<any[]>([]);

  const listaCursosMatriculados = cursosEstudianteReal;
  const listaSoloCursosReales = filtrarCursosReales(listaCursosMatriculados);

  // Separación por estado y filtrado activo según píldora seleccionada
  const cursosEnProgreso = listaCursosMatriculados.filter(c => !esCursoCompletadoHelper(c));
  const cursosCompletados = listaCursosMatriculados.filter(c => esCursoCompletadoHelper(c));

  const cursosMatriculadosMostrar = listaCursosMatriculados.filter(c => {
    if (filtroEstadoMatriculados === 'progreso') return !esCursoCompletadoHelper(c);
    if (filtroEstadoMatriculados === 'completados') return esCursoCompletadoHelper(c);
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
    { titulo: "IMPLEMENTACIÓN DE LEAN MANUFACTURING EN PROCESOS INDUSTRIALES", categoria: "Operaciones y procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "/assets/images/cursos/cur-73-implementacion-de-lean-manufacturing-en-procesos-industriales.jpg" },
    { titulo: "TALLER DE SOFT SKILLS EN LA INDUSTRIA Y MINERÍA", categoria: "Taller", duracion: "20 Horas Académicas", precio: 0, estado: "Especial", nivel: "Práctico", imagen: "/assets/images/cursos/tal-01-taller-de-soft-skills-en-la-industria-y-mineria.jpg" },
    { titulo: "TALLER DE SEGURIDAD BASADA EN EL COMPORTAMIENTO", categoria: "Taller", duracion: "20 Horas Académicas", precio: 0, estado: "Especial", nivel: "Práctico", imagen: "/assets/images/cursos/tal-02-taller-de-seguridad-basada-en-el-comportamiento.jpg" }
  ];

  const listaCategorias = ["Todas", "Taller", "Seguridad y prevención", "Legislación y normativa", "Logística y almacenes", "Inteligencia de datos", "Tecnología e innovación", "Operaciones y procesos", "Comercio exterior", "Mantenimiento industrial", "Medio ambiente"];
  const listaEstados = ['Todos', 'Más vendido', 'Nuevo', 'Especial'];
  const listaNiveles = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

  useEffect(() => {
    async function cargarPerfilYSupabase() {
      try {
        const [res, catRes] = await Promise.all([
          fetch('/api/dashboard/me'),
          fetch('/api/admin/catalogo').catch(() => null)
        ]);

        let liveCatalogoCursos: any[] = [];
        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          liveCatalogoCursos = [
            ...(catData.cursosEspecializacion || []),
            ...(catData.talleres || [])
          ];
        }

        if (res.ok) {
          const data = await res.json();
          const prof = data.profile;
          const matriculas = data.matriculas || [];

          if (data.eduminCredits?.cursos?.disponibles !== undefined) {
            setCreditosCursosDisponibles(data.eduminCredits.cursos.disponibles);
          }
          if (data.eduminCredits?.cursos?.habilitados !== undefined) {
            setCursosHabilitados(data.eduminCredits.cursos.habilitados);
          }
          if (prof) {
            if (prof.nombres) setNombres(prof.nombres);
            if (prof.paquete_adquirido) setPaquete(prof.paquete_adquirido.toUpperCase());

            const cursosEnrolados: any[] = [];
            const idsAgregados = new Set<string>();

            const buscarMatchCatalogo = (codigo?: string, titulo?: string, id?: string) => {
              const codUp = String(codigo || id || '').toUpperCase();
              const titNorm = (titulo || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
              const liveMatch = liveCatalogoCursos.find((lc: any) =>
                (codUp && String(lc.codigo || '').toUpperCase() === codUp) ||
                (id && String(lc.id || '').toLowerCase() === String(id).toLowerCase()) ||
                (titNorm && String(lc.titulo || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === titNorm)
              );
              const localMatch = catalogoGeneralCursos.find(c =>
                c.titulo.toUpperCase() === titulo?.toUpperCase() ||
                (titNorm && c.titulo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === titNorm)
              );
              return {
                id: liveMatch?.id,
                codigo: liveMatch?.codigo,
                tipo: liveMatch?.tipo,
                categoria: liveMatch?.categoria || localMatch?.categoria,
                duracion: liveMatch?.duracion || localMatch?.duracion,
                imagen: liveMatch?.imagen || localMatch?.imagen,
                titulo: liveMatch?.titulo || titulo
              };
            };

            // 1. Cursos y talleres del formato JSON de Supabase (orden cronológico de matrícula/canje)
            const cursosJsonPerfil = Array.isArray(prof.cursos_json) && prof.cursos_json.length > 0
              ? prof.cursos_json
              : parseCursosFromProfile(prof);
            cursosJsonPerfil.forEach((cj: any) => {
              const catMatch = buscarMatchCatalogo(cj.codigo, cj.titulo, cj.id);
              const idSlug = catMatch.id || cj.id || cj.codigo?.toLowerCase() || cj.titulo?.toLowerCase().replace(/[^a-z0-9]/g, '-');
              if (!idsAgregados.has(idSlug)) {
                idsAgregados.add(idSlug);
                const tipoCat = String(catMatch.tipo || cj.tipo || '').toUpperCase();
                const esTaller = Boolean(
                  tipoCat === 'TALLER' ||
                  esCursoTaller({ ...cj, id: idSlug, codigo: catMatch.codigo || cj.codigo, tipo: tipoCat })
                );
                cursosEnrolados.push({
                  id: idSlug,
                  codigo: catMatch.codigo || cj.codigo,
                  titulo: catMatch.titulo || cj.titulo,
                  tipo: esTaller ? 'TALLER' : 'CURSO',
                  categoria: esTaller ? (catMatch.categoria || 'Taller') : (catMatch.categoria || cj.categoria || 'Seguridad y prevención'),
                  duracion: catMatch.duracion || cj.duracion || (esTaller ? '20 Horas Académicas' : '40 horas'),
                  avance: cj.completado ? 100 : (typeof cj.avance === 'number' ? cj.avance : 0),
                  nota: cj.nota,
                  rendido: Boolean((cj as any).rendido || (cj.nota !== undefined && cj.nota !== null && Number(cj.nota) > 0)),
                  imagen: catMatch.imagen || cj.imagen || (esTaller ? '/assets/images/cursos/tal-02-taller-de-seguridad-basada-en-el-comportamiento.jpg' : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'),
                  esRegalo: esTaller
                });
              }
            });

            // 2. Cursos matriculados explícitamente en la tabla matriculas (respaldo si no estuvieran en el perfil)
            (matriculas || []).forEach((m: any) => {
              if (m.tipo === 'CURSO' || m.tipo === 'curso' || m.tipo === 'TALLER' || m.tipo === 'taller') {
                const catMatch = buscarMatchCatalogo(m.item_id, m.titulo, m.item_id);
                const idSlug = catMatch.id || m.item_id || m.titulo.toLowerCase().replace(/[^a-z0-9]/g, '-');
                if (!idsAgregados.has(idSlug)) {
                  idsAgregados.add(idSlug);
                  const tipoCat = String(catMatch.tipo || m.tipo || '').toUpperCase();
                  const esTaller = Boolean(tipoCat === 'TALLER' || m.es_regalo || idSlug.startsWith('tal-'));
                  cursosEnrolados.push({
                    id: idSlug,
                    codigo: catMatch.codigo,
                    titulo: catMatch.titulo || m.titulo || 'Curso de Especialización',
                    tipo: esTaller ? 'TALLER' : 'CURSO',
                    categoria: catMatch.categoria || (esTaller ? 'Taller' : 'Seguridad y prevención'),
                    duracion: catMatch.duracion || '20 Horas Académicas',
                    avance: m.avance_porcentaje ?? 0,
                    nota: m.nota,
                    rendido: Boolean(m.rendido || (m.nota !== undefined && m.nota !== null && Number(m.nota) > 0)),
                    imagen: catMatch.imagen || (esTaller ? '/assets/images/cursos/tal-02-taller-de-seguridad-basada-en-el-comportamiento.jpg' : 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'),
                    esRegalo: esTaller
                  });
                }
              }
            });

            // 3. Inyectar taller de regalo asignado según diplomados matriculados si no está en la lista
            const diplomadosEstudiante = Array.isArray(prof.diplomados_json) && prof.diplomados_json.length > 0
              ? prof.diplomados_json
              : parseDiplomadosFromProfile(prof);
            
            const titulosDiplomados: string[] = [];
            if (prof.diplomado_1) titulosDiplomados.push(prof.diplomado_1);
            if (prof.diplomado_2) titulosDiplomados.push(prof.diplomado_2);
            diplomadosEstudiante.forEach((d: any) => {
              const t = d.titulo || d.slug;
              if (t && !titulosDiplomados.includes(t)) titulosDiplomados.push(t);
            });

            titulosDiplomados.forEach((dipTitulo: string) => {
              const taller = obtenerTallerParaDiplomado(dipTitulo);
              if (taller && !idsAgregados.has(taller.id.toLowerCase())) {
                idsAgregados.add(taller.id.toLowerCase());
                const catMatch = buscarMatchCatalogo(taller.codigo, taller.titulo, taller.id);
                cursosEnrolados.push({
                  id: taller.id,
                  codigo: taller.codigo,
                  titulo: catMatch.titulo || taller.titulo,
                  tipo: 'TALLER',
                  categoria: catMatch.categoria || 'Taller',
                  duracion: catMatch.duracion || taller.duracion || '20 Horas Académicas',
                  avance: 0,
                  nota: 0,
                  rendido: false,
                  imagen: catMatch.imagen || taller.imagen || '/assets/images/cursos/tal-02-taller-de-seguridad-basada-en-el-comportamiento.jpg',
                  esRegalo: true
                });
              }
            });

            // Asignar todos los cursos y talleres enrolados
            setCursosEstudianteReal(cursosEnrolados);
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
    return (
      <div className="w-full h-full min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <DashboardLoader minHeight="min-h-full" />
      </div>
    );
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
                  <Link
                    href="/dashboard/canjear?tab=cursos"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="size-4" /> Explorar catálogo de cursos
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {cursosMatriculadosMostrar.map((curso, cIdx) => {
                  const codNormalizado = (curso.codigo || curso.id || '').toUpperCase();
                  const confClaveCurso = `${codNormalizado}_Examen del curso`;
                  const confClaveTaller = `${codNormalizado}_Examen del taller`;
                  const configItem = (configuracionExamenesJson as Record<string, any>)[confClaveCurso] 
                    || (configuracionExamenesJson as Record<string, any>)[confClaveTaller];
                  const noAplicaExamen = configItem?.aplica_examen === false;
                  const notaMinimaCurso = Number(configItem?.nota_minima ?? 12);

                  const examenRendido = Boolean(curso.rendido || (curso.nota !== undefined && curso.nota !== null && Number(curso.nota) > 0));
                  const examenAprobado = examenRendido && curso.nota !== undefined && curso.nota !== null && Number(curso.nota) >= notaMinimaCurso;
                  const examenDesaprobado = !noAplicaExamen && examenRendido && !examenAprobado;

                  const esCompletado = noAplicaExamen ? (curso.avance >= 100 || Boolean(curso.completado)) : (curso.avance >= 100 && examenAprobado);
                  const esDesaprobado100 = !noAplicaExamen && curso.avance >= 100 && examenDesaprobado;
                  const tieneExamenPendiente = !noAplicaExamen && curso.avance >= 100 && !examenRendido;
                  const esPorIniciar = curso.avance === 0;

                  // Verificación de habilitación por cuotas pagadas (solo contando cursos reales por tipo !== 'TALLER')
                  const esTaller = esCursoTaller(curso);
                  const indexSoloCurso = esTaller ? -1 : listaSoloCursosReales.findIndex(cur => cur.id === curso.id);
                  const estaBloqueadoPorCuotas = !esTaller && indexSoloCurso !== -1 && indexSoloCurso >= cursosHabilitados;

                  const whatsappCuotaUrl = `https://wa.me/51984512809?text=${encodeURIComponent(
                    `Hola EDUMIN, deseo orientación para pagar mi siguiente cuota y habilitar el curso: ${curso.titulo}.`
                  )}`;
                  const whatsappSustitutorioUrl = `https://wa.me/51924400268?text=${encodeURIComponent(
                    `Hola EDUMIN, desaprobé el Examen de ${curso.titulo}. Deseo adquirir el Examen Sustitutorio.`
                  )}`;

                  // Centralización de estilos e información de estado (Bloqueado = purple, Desaprobado = rose)
                  const infoEstado = estaBloqueadoPorCuotas
                    ? {
                        label: 'Bloqueado',
                        Icono: Lock,
                        badgeBg: 'bg-purple-600 border-purple-400/30 text-white',
                        duracionIconColor: 'text-purple-400',
                        porcentajeColor: esOscuro ? 'text-purple-400' : 'text-purple-600',
                        barraBg: 'bg-purple-600',
                        botonBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 text-white font-bold cursor-pointer',
                        botonTexto: 'Pagar cuota'
                      }
                    : esDesaprobado100
                    ? {
                        label: 'Examen desaprobado',
                        Icono: XCircle,
                        badgeBg: 'bg-rose-600 border-rose-400/30 text-white',
                        duracionIconColor: 'text-rose-400',
                        porcentajeColor: esOscuro ? 'text-rose-400' : 'text-rose-600',
                        barraBg: 'bg-rose-600',
                        botonBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 text-white font-bold cursor-pointer',
                        botonTexto: 'Pagar sustitutorio'
                      }
                    : esCompletado
                    ? {
                        label: 'Completado',
                        Icono: CheckCircle2,
                        badgeBg: 'bg-emerald-600 border-emerald-400/30 text-white',
                        duracionIconColor: 'text-emerald-400',
                        porcentajeColor: esOscuro ? 'text-emerald-400' : 'text-emerald-600',
                        barraBg: 'bg-emerald-600',
                        botonBg: 'bg-emerald-600 group-hover:bg-emerald-700 shadow-emerald-600/20 text-white font-bold',
                        botonTexto: 'Repasar clases'
                      }
                    : tieneExamenPendiente
                    ? {
                        label: 'Examen pendiente',
                        Icono: FileText,
                        badgeBg: 'bg-amber-500 border-amber-300/40 text-white',
                        duracionIconColor: 'text-amber-400',
                        porcentajeColor: esOscuro ? 'text-amber-400' : 'text-amber-600',
                        barraBg: 'bg-amber-500',
                        botonBg: 'bg-amber-500 group-hover:bg-amber-600 shadow-amber-500/20 text-white font-bold',
                        botonTexto: 'Dar examen'
                      }
                    : esPorIniciar
                    ? {
                        label: 'Por iniciar',
                        Icono: CircleDashed,
                        badgeBg: 'bg-slate-700 border-slate-500/30 text-white',
                        duracionIconColor: 'text-slate-400',
                        porcentajeColor: esOscuro ? 'text-slate-400' : 'text-slate-700',
                        barraBg: 'bg-slate-700',
                        botonBg: 'bg-slate-700 group-hover:bg-slate-800 text-white font-bold',
                        botonTexto: 'Iniciar clases'
                      }
                    : {
                        label: 'En progreso',
                        Icono: Clock,
                        badgeBg: 'bg-indigo-600 border-indigo-400/30 text-white',
                        duracionIconColor: 'text-indigo-400',
                        porcentajeColor: esOscuro ? 'text-indigo-400' : 'text-indigo-600',
                        barraBg: 'bg-indigo-600',
                        botonBg: 'bg-indigo-600 group-hover:bg-indigo-700 shadow-indigo-600/20 text-white font-bold',
                        botonTexto: 'Continuar clases'
                      };

                  const IconoEstado = infoEstado.Icono;
                  const mostrarMensajeBloqueo = estaBloqueadoPorCuotas && tarjetaBloqueoVisibleId === curso.id;

                  const contenidoTarjetaCurso = (
                    <>
                      {/* PORTADA CON ETIQUETAS */}
                      <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                        <img 
                          src={curso.imagen} 
                          alt={curso.titulo}
                          className={`object-cover w-full h-full transition-transform duration-300 ${
                            estaBloqueadoPorCuotas ? 'opacity-65' : 'opacity-90 group-hover:scale-105'
                          }`}
                        />
                        <div className="absolute top-3 inset-x-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none z-10">
                          <span className="text-[11px] font-semibold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shrink-0">
                            {curso.categoria}
                          </span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border backdrop-blur-md shrink-0 ${infoEstado.badgeBg}`}>
                            <IconoEstado className="size-3.5" /> {infoEstado.label}
                          </span>
                        </div>

                        <TarjetaBloqueoOverlay
                          visible={mostrarMensajeBloqueo}
                          onAutoHide={() =>
                            setTarjetaBloqueoVisibleId((prev) =>
                              prev === curso.id ? null : prev
                            )
                          }
                        />
                      </div>

                      {/* CUERPO CON ALINEACIÓN VERTICAL UNIFORME DE TODOS LOS ELEMENTOS */}
                      <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-3">
                          <div className="h-12 flex items-start overflow-hidden">
                            <h3 className={`text-base font-bold leading-snug line-clamp-2 text-balance uppercase ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                              {curso.titulo.toUpperCase()}
                            </h3>
                          </div>
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
                        {estaBloqueadoPorCuotas ? (
                          <a
                            href={whatsappCuotaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center shadow-sm ${infoEstado.botonBg}`}
                          >
                            <span>{infoEstado.botonTexto}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform hover:translate-x-0.5" />
                          </a>
                        ) : (
                          <div className={`w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center shadow-sm ${infoEstado.botonBg}`}>
                            <span>{infoEstado.botonTexto}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                          </div>
                        )}
                      </div>
                    </>
                  );

                  if (estaBloqueadoPorCuotas) {
                    return (
                      <div
                        key={curso.id}
                        onClick={() => setTarjetaBloqueoVisibleId(prev => prev === curso.id ? null : curso.id)}
                        className={`group rounded-2xl overflow-hidden shadow-sm border flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                          esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        {contenidoTarjetaCurso}
                      </div>
                    );
                  }

                  if (esDesaprobado100) {
                    return (
                      <div
                        key={curso.id}
                        className={`group rounded-2xl overflow-hidden shadow-sm border flex flex-col justify-between transition-all hover:shadow-md ${
                          esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                        }`}
                      >
                        <Link href={`/dashboard/cursos/${curso.id}?accion=examen`} className="flex-1 flex flex-col cursor-pointer">
                          <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                            <img
                              src={curso.imagen}
                              alt={curso.titulo}
                              className="object-cover w-full h-full transition-transform duration-300 opacity-90 group-hover:scale-105"
                            />
                            <div className="absolute top-3 inset-x-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none z-10">
                              <span className="text-[11px] font-semibold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shrink-0">
                                {curso.categoria}
                              </span>
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border backdrop-blur-md shrink-0 ${infoEstado.badgeBg}`}>
                                <IconoEstado className="size-3.5" /> {infoEstado.label}
                              </span>
                            </div>
                          </div>
                          <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                            <div className="space-y-3">
                              <div className="h-12 flex items-start overflow-hidden">
                                <h3 className={`text-base font-bold leading-snug line-clamp-2 text-balance uppercase ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                                  {curso.titulo.toUpperCase()}
                                </h3>
                              </div>
                            </div>
                            <div className="space-y-1.5 pt-2">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className={esOscuro ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>Avance</span>
                                <span className={`font-bold ${infoEstado.porcentajeColor}`}>{curso.avance}% completado</span>
                              </div>
                              <div className={`w-full h-2 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <div className={`h-full rounded-full transition-all duration-500 ${infoEstado.barraBg}`} style={{ width: `${curso.avance}%` }} />
                              </div>
                            </div>
                          </div>
                        </Link>
                        <div className={`px-6 pb-6 pt-3 border-t flex items-center justify-end ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                          <a
                            href={whatsappSustitutorioUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center shadow-sm ${infoEstado.botonBg}`}
                          >
                            <span>{infoEstado.botonTexto}</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform hover:translate-x-0.5" />
                          </a>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={curso.id}
                      href={`/dashboard/cursos/${curso.id}`}
                      className={`group rounded-2xl overflow-hidden shadow-sm border flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                        esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      {contenidoTarjetaCurso}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 3: CATÁLOGO AMPLIADO Y CRÉDITOS DISPONIBLES */}
        <div className={`pt-6 border-t ${esOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">Catálogo Ampliado EDUMIN</span>
                {creditosCursosDisponibles > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    {creditosCursosDisponibles} {creditosCursosDisponibles === 1 ? 'crédito disponible' : 'créditos disponibles'}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold">
                {creditosCursosDisponibles > 0 
                  ? `Tienes ${creditosCursosDisponibles} ${creditosCursosDisponibles === 1 ? 'curso disponible' : 'cursos disponibles'} para canjear`
                  : '¿Deseas adquirir más cursos de especialización?'}
              </h3>
              <p className="text-xs text-slate-300">
                {creditosCursosDisponibles > 0
                  ? 'Explora el catálogo oficial de los 76 cursos de especialización y elige el que impulse tu crecimiento profesional.'
                  : 'Amplía tu paquete adquiriendo nuevos créditos de cursos de alta especialización para continuar tu ruta de aprendizaje.'}
              </p>
            </div>
            
            <Link
              href="/dashboard/canjear?tab=cursos"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{creditosCursosDisponibles > 0 ? 'Canjear mis cursos' : 'Adquirir más cursos'}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      </main>
  );
}
