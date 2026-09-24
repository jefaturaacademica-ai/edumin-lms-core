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
      categoria: "Seguridad & SSOMA", 
      duracion: "20 horas académicas", 
      avance: 75,
      imagen: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80"
    },
    { 
      id: 'big-data', 
      titulo: "FUNDAMENTOS DE BIG DATA", 
      categoria: "Tecnología & Minería 4.0", 
      duracion: "25 horas académicas", 
      avance: 40,
      imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80"
    },
    { 
      id: 'logistica-minera', 
      titulo: "LOGÍSTICA Y DISTRIBUCIÓN EN LA INDUSTRIA Y MINERÍA", 
      categoria: "Logística & Suministro", 
      duracion: "30 horas académicas", 
      avance: 20,
      imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80"
    },
    { 
      id: 'riesgos-criticos', 
      titulo: "GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA", 
      categoria: "Seguridad & SSOMA", 
      duracion: "15 horas académicas", 
      avance: 100,
      imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80"
    },
    { 
      id: 'sistemas-hseq', 
      titulo: "SISTEMAS INTEGRADOS DE GESTIÓN HSEQ (ISO 9001, 14001, 45001)", 
      categoria: "Seguridad & SSOMA", 
      duracion: "40 horas académicas", 
      avance: 100,
      imagen: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80"
    },
    { 
      id: 'iso-14001', 
      titulo: "REQUISITOS CLAVE DE ISO 14001 Y CÓMO APLICARLOS EN LA EMPRESA", 
      categoria: "Ambiental", 
      duracion: "30 horas académicas", 
      avance: 0,
      imagen: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=600&q=80"
    },
    { 
      id: 'iso-9001', 
      titulo: "IMPLEMENTACIÓN DE LA NORMA ISO 9001:2015", 
      categoria: "Legal & Negocios", 
      duracion: "30 horas académicas", 
      avance: 100,
      imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80"
    }
  ];

  const listaCursosMatriculados = estadoSimuladoDev === 'sin_cursos'
    ? []
    : (estadoSimuladoDev === 'un_curso'
        ? [listaBaseCursosMatriculados[0]]
        : listaBaseCursosMatriculados);

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
    { titulo: "MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783", categoria: "Seguridad & SSOMA", duracion: "20 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80" },
    { titulo: "IMPLEMENTACIÓN DE MEDIDAS DE CONTROL EN RIESGOS MINEROS", categoria: "Seguridad & SSOMA", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1541888946425-d0fbb18f064c?auto=format&fit=crop&w=600&q=80" },
    { titulo: "ERGONOMÍA Y SALUD OCUPACIONAL EN EL SECTOR MINERO E INDUSTRIAL", categoria: "Seguridad & SSOMA", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA", categoria: "Seguridad & SSOMA", duracion: "15 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80" },
    { titulo: "CURSO DE PREVENCIÓN DE RIESGOS", categoria: "Seguridad & SSOMA", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80" },
    { titulo: "IMPLEMENTACIÓN DE LA ISO 45001:2018", categoria: "Seguridad & SSOMA", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE EMERGENCIAS EN INDUSTRIA Y MINERÍA", categoria: "Seguridad & SSOMA", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?auto=format&fit=crop&w=600&q=80" },
    { titulo: "PRIMEROS AUXILIOS EN MINERÍA", categoria: "Seguridad & SSOMA", duracion: "15 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=600&q=80" },
    { titulo: "REQUISITOS CLAVE DE ISO 14001 Y CÓMO APLICARLOS EN LA EMPRESA", categoria: "Seguridad & SSOMA", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1532938911079-1b06ac7ceec7?auto=format&fit=crop&w=600&q=80" },
    { titulo: "SISTEMAS INTEGRADOS DE GESTIÓN HSEQ (ISO 9001, 14001, 45001)", categoria: "Seguridad & SSOMA", duracion: "40 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE CRISIS Y MANEJO DE CONFLICTOS EN AMBIENTES INDUSTRIALES", categoria: "Seguridad & SSOMA", duracion: "25 Horas Académicas", precio: 99, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80" },
    { titulo: "SALUD MENTAL EN EL TRABAJO: DETECCIÓN Y PREVENCIÓN DE TRASTORNOS PSICOLÓGICOS", categoria: "Seguridad & SSOMA", duracion: "15 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=600&q=80" },
    { titulo: "ERGONOMÍA Y DISEÑO DE PUESTOS DE TRABAJO EN LA INDUSTRIA", categoria: "Seguridad & SSOMA", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE SEGURIDAD DURANTE LAS PARADAS DE PLANTA Y MANTENIMIENTO", categoria: "Seguridad & SSOMA", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE RELAVES Y RESIDUOS MINEROS", categoria: "Seguridad & SSOMA", duracion: "35 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80" },

    { titulo: "MARCO JURÍDICO Y NORMATIVO DE LA MINERÍA", categoria: "Minería & Operaciones", duracion: "25 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE PROVEEDORES EN MINERÍA", categoria: "Minería & Operaciones", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80" },
    { titulo: "CONTRATOS EN LA INDUSTRIA MINERA", categoria: "Minería & Operaciones", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1450133064473-71024230f91b?auto=format&fit=crop&w=600&q=80" },
    { titulo: "DERECHOS HUMANOS EN MINERÍA", categoria: "Minería & Operaciones", duracion: "15 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80" },
    { titulo: "RESPONSABILIDAD PENAL EN MINERÍA", categoria: "Minería & Operaciones", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { titulo: "DERECHO LABORAL EN MINERÍA", categoria: "Minería & Operaciones", duracion: "25 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=600&q=80" },
    { titulo: "TIPOS DE CONCESIONES MINERAS", categoria: "Minería & Operaciones", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE OPERACIONES Y PROCESOS EN LA MINERÍA", categoria: "Minería & Operaciones", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80" },
    { titulo: "PIRÁMIDE DE PROCESOS: TÉCNICAS DE CONTROL EN MINERÍA", categoria: "Minería & Operaciones", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80" },
    { titulo: "CONTROL DE CALIDAD EN PROCESOS MINEROS", categoria: "Minería & Operaciones", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80" },
    { titulo: "MONITOREO Y CONTROL EN LA OPERACIÓN DE PLANTAS MINERAS", categoria: "Minería & Operaciones", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" },
    { titulo: "SOSTENIBILIDAD Y SEGURIDAD EN CAMPAMENTOS MINEROS", categoria: "Minería & Operaciones", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80" },
    { titulo: "SOSTENIBILIDAD Y MINERÍA RESPONSABLE", categoria: "Minería & Operaciones", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80" },
    { titulo: "EXPLORACIÓN MINERA Y EVALUACIÓN DE YACIMIENTOS", categoria: "Minería & Operaciones", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE LA ENERGÍA EN OPERACIONES MINERAS", categoria: "Minería & Operaciones", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=600&q=80" },

    { titulo: "FUNDAMENTOS DE BIG DATA", categoria: "Tecnología & Minería 4.0", duracion: "25 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" },
    { titulo: "MÉTODOS DE CAPTURA DE INFORMACIÓN EN BIG DATA", categoria: "Tecnología & Minería 4.0", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=600&q=80" },
    { titulo: "TENDENCIAS 2025-2026 CLAVES DE BIG DATA", categoria: "Tecnología & Minería 4.0", duracion: "15 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80" },
    { titulo: "BIG DATA: TRANSFORMACIÓN DE DATOS (PYTHON Y R)", categoria: "Tecnología & Minería 4.0", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=600&q=80" },
    { titulo: "MINERÍA 4.0 ESSENTIALS (NUEVAS HERRAMIENTAS)", categoria: "Tecnología & Minería 4.0", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80" },
    { titulo: "INNOVACIÓN EN MINERÍA: APLICACIONES DE INTELIGENCIA ARTIFICIAL", categoria: "Tecnología & Minería 4.0", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=600&q=80" },
    { titulo: "AUTOMATIZACIÓN 4.0 EN PROCESOS MINEROS", categoria: "Tecnología & Minería 4.0", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80" },
    { titulo: "INTRODUCCIÓN A LA GESTIÓN DE PROYECTOS", categoria: "Tecnología & Minería 4.0", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { titulo: "ARQUITECTURA DE DATOS: DISEÑO, COMPONENTES, FUNCIÓN Y PATRONES", categoria: "Tecnología & Minería 4.0", duracion: "40 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80" },
    { titulo: "ECOSISTEMA BIG DATA: HERRAMIENTAS Y TECNOLOGÍAS ESENCIALES", categoria: "Tecnología & Minería 4.0", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80" },
    { titulo: "INTRODUCCIÓN A MACHINE LEARNING PARA BIG DATA", categoria: "Tecnología & Minería 4.0", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1527474322635-a2d9f588acac?auto=format&fit=crop&w=600&q=80" },
    { titulo: "PROYECTOS CON HERRAMIENTAS DIGITALES PARA MINERÍA", categoria: "Tecnología & Minería 4.0", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=600&q=80" },
    { titulo: "INTRODUCCIÓN A MACHINE LEARNING EN MINERÍA", categoria: "Tecnología & Minería 4.0", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80" },
    { titulo: "TIPOS DE INTELIGENCIA ARTIFICIAL APLICADAS A LA MINERÍA", categoria: "Tecnología & Minería 4.0", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80" },
    { titulo: "HERRAMIENTAS DE BIG DATA APLICADA A MINERÍA", categoria: "Tecnología & Minería 4.0", duracion: "30 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" },
    { titulo: "CONTROL Y SUPERVISIÓN DE PROCESOS CON SOFTWARE SCADA", categoria: "Tecnología & Minería 4.0", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80" },
    { titulo: "PROCESO DE OPTIMIZACIÓN DE MANTENIMIENTO CON TÉCNICAS DE INDUSTRIA 4.0", categoria: "Tecnología & Minería 4.0", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80" },
    { titulo: "ANÁLISIS DE DATOS PARA OPTIMIZAR OPERACIONES MINERAS", categoria: "Tecnología & Minería 4.0", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=600&q=80" },

    { titulo: "LOGÍSTICA Y DISTRIBUCIÓN EN LA INDUSTRIA Y MINERÍA", categoria: "Logística & Suministro", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" },
    { titulo: "CONTROL DE COSTOS EN ALMACENES MINEROS", categoria: "Logística & Suministro", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE CONTRATOS LOGÍSTICOS EN LA INDUSTRIA Y MINERÍA", categoria: "Logística & Suministro", duracion: "30 Horas Académicas", precio: 159, estado: "Especial", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE INVENTARIOS EN INDUSTRIA Y MINERÍA", categoria: "Logística & Suministro", duracion: "25 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1586528116495-21e35496c21e?auto=format&fit=crop&w=600&q=80" },
    { titulo: "CONTROL FINANCIERO EN ALMACENES", categoria: "Logística & Suministro", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80" },
    { titulo: "LOGÍSTICA INTERNA EN CONTROL DE ALMACENES", categoria: "Logística & Suministro", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80" },
    { titulo: "CADENA DE SUMINISTRO LOGÍSTICA Y DISTRIBUCIÓN", categoria: "Logística & Suministro", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" },
    { titulo: "MEJORA DE LOS MÉTODOS Y MEDICIÓN DE LOS RECURSOS", categoria: "Logística & Suministro", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { titulo: "INDICADORES CLAVE (KPIS) PARA LA CADENA DE ABASTECIMIENTOS", categoria: "Logística & Suministro", duracion: "20 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE LA CADENA DE SUMINISTRO EN EMPRESAS MINERAS", categoria: "Logística & Suministro", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1586528116495-21e35496c21e?auto=format&fit=crop&w=600&q=80" },
    { titulo: "SEGURIDAD Y NORMATIVA EN EL CONTROL DE INVENTARIO Y LOGÍSTICA MINERA", categoria: "Logística & Suministro", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80" },

    { titulo: "IMPORTACIÓN Y EXPORTACIÓN DESDE 0: CLAVES PARA EL ÉXITO", categoria: "Legal & Negocios", duracion: "20 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" },
    { titulo: "IMPLEMENTACIÓN DE LA NORMA ISO 9001:2015", categoria: "Legal & Negocios", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { titulo: "ANÁLISIS DE MERCADOS INTERNACIONALES: ESTRATEGIAS DE IMPORTACIÓN Y EXPORTACIÓN", categoria: "Legal & Negocios", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=600&q=80" },
    { titulo: "DE LA IMPORTACIÓN A LA VENTA ONLINE: IMPLEMENTA TU TIENDA VIRTUAL DESDE CERO", categoria: "Legal & Negocios", duracion: "20 Horas Académicas", precio: 99, estado: "Más vendido", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80" },
    { titulo: "DOCUMENTACIÓN Y TRÁMITES ADUANEROS", categoria: "Legal & Negocios", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80" },
    { titulo: "REVISIÓN DE PROVEEDORES PARA EVITAR ESTAFAS EN IMPORTACIONES CHINAS", categoria: "Legal & Negocios", duracion: "15 Horas Académicas", precio: 99, estado: "Especial", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80" },
    { titulo: "PLANIFICACIÓN DE RIESGOS PARA IMPORTACIÓN Y EXPORTACIÓN", categoria: "Legal & Negocios", duracion: "20 Horas Académicas", precio: 99, estado: "Nuevo", nivel: "Principiante", imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { titulo: "PLANIFICACIÓN ESTRATÉGICA Y BALANCED SCORECARD", categoria: "Legal & Negocios", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80" },

    { titulo: "GESTIÓN AVANZADA DE OPERACIONES INDUSTRIALES", categoria: "Mantenimiento & Procesos", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80" },
    { titulo: "BIG DATA APLICADA A PROCESOS INDUSTRIALES", categoria: "Mantenimiento & Procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" },
    { titulo: "CONTROL DE COSTOS EN PRODUCCIÓN INDUSTRIAL O EN ÁREAS DE PRODUCCIÓN", categoria: "Mantenimiento & Procesos", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80" },
    { titulo: "SISTEMAS INTEGRADOS PARA LA GESTIÓN DE MANTENIMIENTO", categoria: "Mantenimiento & Procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80" },
    { titulo: "ESTÁNDARES Y SISTEMA DE CALIDAD DEL MANTENIMIENTO", categoria: "Mantenimiento & Procesos", duracion: "25 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { titulo: "SEGURIDAD Y CONTROL AMBIENTAL EN EL MANTENIMIENTO", categoria: "Mantenimiento & Procesos", duracion: "25 Horas Académicas", precio: 159, estado: "Especial", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GERENCIA DE PROYECTOS DEL MANTENIMIENTO", categoria: "Mantenimiento & Procesos", duracion: "35 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Avanzado", imagen: "https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=600&q=80" },
    { titulo: "GESTIÓN DE COSTOS DEL MANTENIMIENTO EN LA INDUSTRIA 4.0", categoria: "Mantenimiento & Procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Nuevo", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80" },
    { titulo: "IMPLEMENTACIÓN DE LEAN MANUFACTURING EN PROCESOS INDUSTRIALES", categoria: "Mantenimiento & Procesos", duracion: "30 Horas Académicas", precio: 159, estado: "Más vendido", nivel: "Intermedio", imagen: "https://images.unsplash.com/photo-1586528116495-21e35496c21e?auto=format&fit=crop&w=600&q=80" }
  ];

  const listaCategorias = ['Todas', 'Seguridad & SSOMA', 'Minería & Operaciones', 'Tecnología & Minería 4.0', 'Logística & Suministro', 'Legal & Negocios', 'Mantenimiento & Procesos'];
  const listaEstados = ['Todos', 'Más vendido', 'Nuevo', 'Especial'];
  const listaNiveles = ['Todos', 'Principiante', 'Intermedio', 'Avanzado'];

  useEffect(() => {
    async function cargarPerfil() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombres, paquete_adquirido')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.nombres) setNombres(profile.nombres);
          if (profile.paquete_adquirido) setPaquete(profile.paquete_adquirido.toUpperCase());
        }
      }
      setLoading(false);
    }
    cargarPerfil();
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
        
        {/* CABECERA */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className={`text-3xl font-bold tracking-tight flex items-center gap-3 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              <BookOpen className="w-8 h-8 text-indigo-600" />
              Mis cursos y talleres
            </h1>
            <p className={`mt-2 text-sm ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              Accede a tus cursos matriculados con seguimiento de avance o adquiere nuevas especializaciones.
            </p>
          </div>
        </header>

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
              <div className={`rounded-3xl p-10 text-center border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                <p className="text-sm font-medium">
                  No tienes cursos en la sección &quot;{filtroEstadoMatriculados === 'progreso' ? 'En progreso' : 'Completados'}&quot;.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fadeIn">
                {cursosMatriculadosMostrar.map((curso) => {
                  const esCompletado = curso.avance >= 100;
                  const esPorIniciar = curso.avance === 0;

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
                          {esCompletado ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-emerald-600/90 text-white backdrop-blur-md border-emerald-400/30 shrink-0">
                              <CheckCircle2 className="size-3.5" /> Completado
                            </span>
                          ) : esPorIniciar ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-amber-500/90 text-white backdrop-blur-md border-amber-400/30 shrink-0">
                              <CircleDashed className="size-3.5" /> Por iniciar
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border bg-indigo-500/90 text-white backdrop-blur-md border-indigo-400/30 shrink-0">
                              <Clock className="size-3.5" /> En progreso
                            </span>
                          )}
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
                            <Clock className={`w-4 h-4 ${esCompletado ? 'text-emerald-400' : esPorIniciar ? 'text-amber-400' : 'text-indigo-400'}`} /> {curso.duracion}
                          </p>
                        </div>

                        {/* BLOQUE DE AVANCE CON PORCENTAJE ARRIBA DE LA BARRA */}
                        <div className="space-y-1.5 pt-2">
                          <div className="flex items-center justify-between text-xs font-bold">
                            <span className={esOscuro ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>
                              Avance
                            </span>
                            <span className={esCompletado ? 'text-emerald-400 font-extrabold' : (esPorIniciar ? (esOscuro ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium') : (esOscuro ? 'text-indigo-400 font-bold' : 'text-indigo-600 font-bold'))}>
                              {curso.avance}% completado
                            </span>
                          </div>
                          <div className={`w-full h-2 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                esCompletado 
                                  ? 'bg-emerald-500' 
                                  : esPorIniciar 
                                  ? 'bg-slate-300 dark:bg-slate-700' 
                                  : 'bg-indigo-600'
                              }`} 
                              style={{ width: `${curso.avance}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* BOTÓN ALINEADO CON ÍCONO ÚNICO UNIFORME */}
                      <div className={`px-6 pb-6 pt-3 border-t flex items-center justify-end ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                        <div 
                          className={`w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center shadow-sm ${
                            esCompletado
                              ? 'bg-emerald-600 group-hover:bg-emerald-700 text-white shadow-emerald-600/20'
                              : esPorIniciar
                              ? 'bg-amber-600 group-hover:bg-amber-700 text-white shadow-amber-600/20'
                              : 'bg-indigo-600 group-hover:bg-indigo-700 text-white shadow-indigo-600/20'
                          }`}
                        >
                          <span>{esCompletado ? 'Repasar curso' : esPorIniciar ? 'Iniciar curso' : 'Continuar curso'}</span>
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
                          <span className="text-2xl font-black text-emerald-400">S/ {curso.precio}</span>
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
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono">v1.0</span>
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