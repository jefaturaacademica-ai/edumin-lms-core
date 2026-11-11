'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { 
  CheckCircle2, 
  Circle,
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  Folder,
  ArrowLeft, 
  Download, 
  Send, 
  Video, 
  Headphones, 
  Sparkles, 
  Eye, 
  Award,
  Check,
  Loader2,
  Table,
  ExternalLink,
  Network,
  Clapperboard,
  PanelRightClose,
  PanelRightOpen,
  AlertCircle,
  Globe,
  Code,
  X
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTheme } from '@/context/theme-context';
import { useProfile } from '@/context/profile-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { parseCursosFromProfile } from '@/lib/utils/profileParser';
import { PreguntaExamenEstudiante, DetalleCalificacionPregunta } from '@/lib/types/examenes';
import {
  ExamenBarraSuperior,
  ExamenIndicacionesPanel,
  ExamenResultadoYRetroalimentacion,
  ConfigExamenEstudiante
} from '@/components/dashboard/examen-estudiante-ui';
import { parsearResumenTexto, ResumenData } from '@/lib/utils/resumenParser';
import resumenesCacheJson from '@/lib/data/resumenes_clases_cache.json';
import { 
  obtenerRecursosConLinks, 
  normalizeLeccionRow,
  LeccionRow 
} from '@/lib/data/diplomadosLeccionesService';

export interface RecursoItem {
  id: string;
  tipo: 'pdf' | 'video' | 'audio' | 'interactivo' | 'mapamental' | 'excel' | 'material';
  titulo: string;
  descripcion: string;
  archivo?: string;
  url?: string;
  duracion?: string;
}

export interface ParteClase {
  id: string;
  numero: number;
  titulo: string;
  subtitulo: string;
  duracion: string;
  videoUrl: string;
  completada: boolean;
  resumen?: ResumenData | null;
  recursos: RecursoItem[];
}

export interface TemaCurso {
  id: string;
  numeroTema: number;
  titulo: string;
  completado: boolean;
  partes: ParteClase[];
}

function formatearUrlVideoEmbed(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Google Drive: convertir /view o /view?usp=sharing a /preview
  if (trimmed.includes('drive.google.com')) {
    return trimmed.replace(/\/view(\?.*)?$/, '/preview');
  }

  // YouTube: convertir watch?v= o youtu.be a embed
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  return trimmed;
}

export default function ReproductorCursoPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const cursoId = (params.id as string) || '';

  const { esOscuro } = useTheme();
  const { nombres, apellidos } = useProfile();

  // Estados de datos de Supabase y Catálogo
  const [loading, setLoading] = useState(true);
  const [completadosMap, setCompletadosMap] = useState<Record<string, boolean>>({});
  const [cursoCatalogo, setCursoCatalogo] = useState<any>(null);
  const [leccionesTabla, setLeccionesTabla] = useState<LeccionRow[]>([]);
  const [recursoUrlActivo, setRecursoUrlActivo] = useState<string>('');
  const [guardandoAvance, setGuardandoAvance] = useState(false);
  const [dniAlumno, setDniAlumno] = useState<string>('71234567');
  const [modoCine, setModoCine] = useState(false);

  // Estados de Navegación del Curso
  const [temaActivoId, setTemaActivoId] = useState<string>('');
  const [parteSeleccionada, setParteSeleccionada] = useState<number>(1);

  // Estados de contenido principal y pestañas
  const [contenidoPrincipal, setContenidoPrincipal] = useState<'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo' | 'mapamental'>('video_clase');
  const [recursoActivoInfo, setRecursoActivoInfo] = useState<string>('Grabación de la clase');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'recursos' | 'foro'>('resumen');
  const [menuFormatoAbierto, setMenuFormatoAbierto] = useState<boolean>(false);

  // Estados del Foro
  const [comentario, setComentario] = useState('');
  const [listaComentarios, setListaComentarios] = useState<{ autor: string; texto: string; fecha: string }[]>([
    {
      autor: 'Ing. Carlos Mendoza (Tutor)',
      texto: 'Bienvenidos a este curso especializado. Los recursos interactivos, diapositivas y el examen están a su disposición. No duden en formular cualquier consulta técnica en este espacio.',
      fecha: 'Hace 2 días'
    }
  ]);

  // Estados del Examen del Curso
  const [notaCurso, setNotaCurso] = useState<number | undefined>(undefined);
  const [examenActivoModal, setExamenActivoModal] = useState<boolean>(false);
  const [pasoModalExamen, setPasoModalExamen] = useState<'indicaciones' | 'cuestionario' | 'resultado' | 'ver_intento'>('indicaciones');
  const [respuestasExamenDinamicas, setRespuestasExamenDinamicas] = useState<Record<string, number[]>>({});
  const [preguntasExamenDinamicas, setPreguntasExamenDinamicas] = useState<PreguntaExamenEstudiante[]>([]);
  const [cargandoPreguntasExamen, setCargandoPreguntasExamen] = useState(false);
  const [cargandoConfigExamen, setCargandoConfigExamen] = useState(false);
  const [detallesCalificacionExamen, setDetallesCalificacionExamen] = useState<DetalleCalificacionPregunta[] | null>(null);
  const [tiempoRestanteSegundos, setTiempoRestanteSegundos] = useState<number>(30 * 60);
  const [configExamenActivo, setConfigExamenActivo] = useState<ConfigExamenEstudiante | null>(null);
  const [guardandoExamen, setGuardandoExamen] = useState(false);
  const [resultadoExamen, setResultadoExamen] = useState<{ nota: number; aprobado: boolean } | null>(null);
  const [tiempoRegistroExamen, setTiempoRegistroExamen] = useState<{ inicio: string | null; fin: string | null }>({
    inicio: null,
    fin: null
  });
  const [mostrarRetroalimentacion, setMostrarRetroalimentacion] = useState(false);
  const [cargandoRetroalimentacion, setCargandoRetroalimentacion] = useState(false);
  const [intentoVerificado, setIntentoVerificado] = useState(false);
  const accionExamenProcesadaRef = useRef(false);
  const fechaInicioExamenRef = useRef<string | null>(null);
  const respuestasExamenRef = useRef<Record<string, number[]>>({});
  const preguntasExamenRef = useRef<PreguntaExamenEstudiante[]>([]);

  useEffect(() => {
    respuestasExamenRef.current = respuestasExamenDinamicas;
  }, [respuestasExamenDinamicas]);

  useEffect(() => {
    preguntasExamenRef.current = preguntasExamenDinamicas;
  }, [preguntasExamenDinamicas]);

  // Base de datos de fallback para cursos cortos cuando aún no se conectan a Supabase
  const cursosDataFallback: Record<string, { titulo: string; categoria: string; grabaciones: { id: string; titulo: string; duracion: string; videoUrl: string }[]; material: string }> = {
    'manejo-epps': {
      titulo: "MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783",
      categoria: "Seguridad Industrial",
      grabaciones: [
        { id: 'g1', titulo: 'Sesión 1: Marco normativo de EPPs en la Ley 29783', duracion: '35 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g2', titulo: 'Sesión 2: Clasificación y categorización de equipos de protección', duracion: '42 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g3', titulo: 'Sesión 3: Inspección, mantenimiento y casos prácticos', duracion: '38 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      ],
      material: 'Guia_Practica_EPPs_Ley29783.pdf'
    },
    'big-data': {
      titulo: "FUNDAMENTOS DE BIG DATA Y ANALÍTICA PREDICTIVA PARA OPERACIONES",
      categoria: "Tecnología Minera",
      grabaciones: [
        { id: 'g1', titulo: 'Sesión 1: Introducción al Big Data en entornos industriales', duracion: '45 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g2', titulo: 'Sesión 2: Recopilación y limpieza de datos operativos', duracion: '50 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g3', titulo: 'Sesión 3: Modelos predictivos para mantenimiento', duracion: '40 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g4', titulo: 'Sesión 4: Visualización de KPIs con herramientas modernas', duracion: '35 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      ],
      material: 'Manual_BigData_Operaciones.pdf'
    },
    'riesgos-criticos': {
      titulo: "GESTIÓN DE RIESGOS CRÍTICOS Y AST",
      categoria: "Seguridad Industrial",
      grabaciones: [
        { id: 'g1', titulo: 'Sesión 1: Identificación de peligros y evaluación de riesgos', duracion: '40 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g2', titulo: 'Sesión 2: Elaboración y aplicación correcta del AST', duracion: '45 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      ],
      material: 'Formato_AST_Guia.pdf'
    },
    'logistica-minera': {
      titulo: "INTRODUCCIÓN A LA CADENA DE SUMINISTRO Y LOGÍSTICA MINERA",
      categoria: "Logística",
      grabaciones: [
        { id: 'g1', titulo: 'Sesión 1: Ecosistema logístico en proyectos mineros', duracion: '50 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g2', titulo: 'Sesión 2: Gestión de inventarios críticos en locación', duracion: '45 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g3', titulo: 'Sesión 3: Cadena de suministro y selección de proveedores', duracion: '40 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g4', titulo: 'Sesión 4: Optimización de transporte de minerales', duracion: '45 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      ],
      material: 'Separata_Logistica_Minera.pdf'
    }
  };

  // Cargar datos de Supabase (/api/dashboard/me, /api/admin/catalogo y /api/admin/diplomados-lecciones)
  const cargarDatosSupabase = useCallback(async () => {
    try {
      setLoading(true);
      const [meRes, catRes, leccRes] = await Promise.all([
        fetch('/api/dashboard/me').catch(() => null),
        fetch('/api/admin/catalogo').catch(() => null),
        fetch(`/api/admin/diplomados-lecciones?slug=${encodeURIComponent(cursoId)}&tipo=curso`).catch(() => null)
      ]);

      let userDni = '71234567';

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        const profile = meData.profile || meData;
        if (profile?.dni_ce || profile?.dni) {
          userDni = profile.dni_ce || profile.dni;
          setDniAlumno(userDni);
        }

        const cursos = profile?.cursos_json || (Array.isArray(profile?.cursos) ? profile.cursos : parseCursosFromProfile(profile));
        const normSlug = (s?: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const targetNorm = normSlug(cursoId);
        const targetNumeric = /^\d+$/.test(cursoId.trim()) ? cursoId.trim() : (cursoId.match(/^(?:cur|tal)-?(\d+)$/i)?.[1] || '');
        const curEnPerfil = Array.isArray(cursos)
          ? cursos.find((c: any) => {
              const cId = normSlug(String(c.id || ''));
              const cCod = normSlug(String(c.codigo || ''));
              const cTit = normSlug(String(c.titulo || ''));
              return (
                (cId && cId === targetNorm) ||
                (cCod && cCod === targetNorm) ||
                (targetNumeric && cId === targetNumeric) ||
                (cTit && (cTit === targetNorm || (targetNorm.length > 3 && cTit.includes(targetNorm))))
              );
            })
          : null;

        if (curEnPerfil) {
          const map: Record<string, boolean> = {};
          if (curEnPerfil.completadosMap && typeof curEnPerfil.completadosMap === 'object') {
            Object.assign(map, curEnPerfil.completadosMap);
          }
          if (curEnPerfil.completado) {
            map[curEnPerfil.id || cursoId] = true;
          }
          setCompletadosMap(map);

          if (
            curEnPerfil.nota !== undefined &&
            curEnPerfil.nota !== null &&
            (curEnPerfil.rendido === true || Number(curEnPerfil.nota) > 0)
          ) {
            setNotaCurso(Number(curEnPerfil.nota));
          }
        }
      }

      let resolvedCatItem: any = null;
      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        const todos = [
          ...(catData.cursosEspecializacion || []),
          ...(catData.talleres || []),
          ...(catData.cursos || []),
          ...(catData.todos || [])
        ].filter((c: any) => c.tipo !== 'diplomado' && !String(c.codigo || '').toUpperCase().startsWith('DIP-'));
        const norm = (s: string) => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        const targetNorm = norm(cursoId);
        const targetNumeric = /^\d+$/.test(cursoId.trim()) ? `cur-${cursoId.trim().padStart(2, '0')}` : '';
        const catItem =
          todos.find((c: any) =>
            String(c.id || '').toLowerCase() === cursoId.toLowerCase() ||
            (c.codigo && c.codigo.toLowerCase() === cursoId.toLowerCase()) ||
            (targetNumeric && c.codigo && c.codigo.toLowerCase() === targetNumeric) ||
            (c.titulo && norm(c.titulo) === targetNorm)
          ) ||
          todos.find((c: any) => c.titulo && targetNorm.length > 3 && norm(c.titulo).includes(targetNorm));
        if (catItem) {
          resolvedCatItem = catItem;
          setCursoCatalogo(catItem);
        }
      }

      let leccionesValidas: LeccionRow[] = [];
      if (leccRes && leccRes.ok) {
        const leccData = await leccRes.json();
        if (leccData && Array.isArray(leccData.filas) && leccData.filas.length > 0) {
          leccionesValidas = leccData.filas.filter((f: any) => !String(f.CodigoDiplomado || '').toUpperCase().startsWith('DIP-'));
        }
      }

      if (leccionesValidas.length === 0 && resolvedCatItem?.codigo) {
        const retryRes = await fetch(`/api/admin/diplomados-lecciones?codigo=${encodeURIComponent(resolvedCatItem.codigo)}&tipo=curso`).catch(() => null);
        if (retryRes && retryRes.ok) {
          const retryData = await retryRes.json();
          if (retryData && Array.isArray(retryData.filas) && retryData.filas.length > 0) {
            leccionesValidas = retryData.filas.filter((f: any) => !String(f.CodigoDiplomado || '').toUpperCase().startsWith('DIP-'));
          }
        }
      }

      if (leccionesValidas.length > 0) {
        setLeccionesTabla(leccionesValidas);
      }
    } catch (e) {
      console.error('Error al cargar datos del curso:', e);
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => {
    accionExamenProcesadaRef.current = false;
    setIntentoVerificado(false);
    cargarDatosSupabase();
  }, [cursoId, cargarDatosSupabase]);

  // Resolver el código oficial de curso (ej: CUR-01, CUR-19, TAL-01...)
  const codigoCursoActual: string = useMemo(() => {
    if (leccionesTabla && leccionesTabla[0]?.CodigoDiplomado) {
      return leccionesTabla[0].CodigoDiplomado;
    }
    const match = (cursoId || '').match(/^(cur|tal)-?(\d+)$/i);
    if (match) {
      return `${match[1].toUpperCase()}-${match[2].padStart(2, '0')}`;
    }
    if (/^\d+$/.test((cursoId || '').trim())) {
      return `CUR-${cursoId.trim().padStart(2, '0')}`;
    }
    if (cursoCatalogo?.codigo) {
      return cursoCatalogo.codigo;
    }
    return '';
  }, [leccionesTabla, cursoId, cursoCatalogo]);

  // Consultar notas_modulos en Supabase para saber si ya rindió el examen del curso y cargar configuración
  useEffect(() => {
    if (loading) return;
    if (!codigoCursoActual || !dniAlumno) {
      setIntentoVerificado(true);
      return;
    }
    fetch(`/api/dashboard/examenes?codigoDiplomado=${encodeURIComponent(codigoCursoActual)}&modulo=${encodeURIComponent('Examen del Curso')}&dni=${encodeURIComponent(dniAlumno)}&accion=ver_intento`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          if (d.config) {
            setConfigExamenActivo(d.config);
          }
          if (d.intento && d.intento.nota !== undefined && d.intento.nota !== null) {
            setNotaCurso(Number(d.intento.nota));
            if (d.intento.detalles_examen) {
              setDetallesCalificacionExamen(d.intento.detalles_examen);
            }
          }
        }
      })
      .catch(err => console.warn('Error al verificar intento previo del curso:', err))
      .finally(() => setIntentoVerificado(true));
  }, [loading, codigoCursoActual, dniAlumno]);

  // Si la URL viene con ?accion=examen, abrir automáticamente la evaluación una sola vez al cargar
  useEffect(() => {
    if (loading || !intentoVerificado || accionExamenProcesadaRef.current) return;
    const accion = searchParams.get('accion');
    if (accion === 'examen') {
      accionExamenProcesadaRef.current = true;
      if (configExamenActivo && configExamenActivo.aplica_examen === false) {
        return;
      }
      if (notaCurso !== undefined) {
        abrirVerIntento();
      } else {
        abrirModalExamen();
      }
    }
  }, [loading, intentoVerificado, searchParams, notaCurso, configExamenActivo]);

  // Fallback si no hay filas cargadas en Supabase aún
  const fallback = cursosDataFallback[cursoId] || cursosDataFallback['manejo-epps'];

  // Construir la estructura oficial del curso y sus temas
  const cursoEstructurado = useMemo(() => {
    let globalClaseCounter = 1;

    // 1. PRIORIDAD: Usar datos de la tabla lecciones de Supabase
    if (leccionesTabla && leccionesTabla.length > 0) {
      const temasMap = new Map<string, LeccionRow[]>();
      let tituloOficial = leccionesTabla[0].Diplomado || cursoCatalogo?.titulo || fallback.titulo;
      let docenteOficial = leccionesTabla[0].Docente || cursoCatalogo?.docente || '';

      leccionesTabla.forEach(f => {
        const r = normalizeLeccionRow(f);
        const tKey = r.Tema || 'Tema 01: Contenido del Curso';
        if (!temasMap.has(tKey)) {
          temasMap.set(tKey, []);
        }
        temasMap.get(tKey)!.push(r);
      });

      const temas: TemaCurso[] = Array.from(temasMap.entries()).map(([temaTituloRaw, rows], tIdx) => {
        const numTema = tIdx + 1;
        const numTemaStr = numTema < 10 ? `0${numTema}` : `${numTema}`;
        const temaLimpio = temaTituloRaw
          .replace(/^Tema\s*\d+[:\-\s]*/i, '')
          .replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '')
          .trim();
        const temaTituloFinal = `Tema ${numTemaStr}: ${temaLimpio || 'Contenido de la Sesión'}`;

        const partes: ParteClase[] = rows.map((r, pIdx) => {
          const numParte = pIdx + 1;
          const parteId = r.id || `tema-${numTema}-parte-${numParte}`;
          const recursos = obtenerRecursosConLinks(r, globalClaseCounter++);
          const resumenParsed = parsearResumenTexto(r.ResumenTexto) || (resumenesCacheJson as any)[parteId] || null;

          return {
            id: parteId,
            numero: numParte,
            titulo: r.Sesion || (rows.length > 1 ? `Parte ${numParte}` : 'Clase Completa'),
            subtitulo: r.Docente ? `Docente: ${r.Docente}` : `Tema ${numTemaStr}`,
            duracion: 'Clase Completa',
            videoUrl: formatearUrlVideoEmbed(r.VideoUrl || ''),
            completada: Boolean(completadosMap[parteId]),
            resumen: resumenParsed,
            recursos: recursos
          };
        });

        const esTemaCompletado = partes.length > 0 && partes.every(p => p.completada);

        return {
          id: `tema-${numTema}`,
          numeroTema: numTema,
          titulo: temaTituloFinal,
          completado: esTemaCompletado,
          partes: partes
        };
      });

      return {
        titulo: tituloOficial,
        categoria: cursoCatalogo?.categoria || fallback.categoria,
        docente: docenteOficial,
        temas: temas
      };
    }

    // 2. FALLBACK: Construir a partir de catálogo o base de datos de respaldo
    const clasesDesdeCatalogo = (() => {
      if (cursoCatalogo?.modulos?.[0]?.clases && Array.isArray(cursoCatalogo.modulos[0].clases) && cursoCatalogo.modulos[0].clases.length > 0) {
        return cursoCatalogo.modulos[0].clases;
      }
      if (Array.isArray(cursoCatalogo?.clases) && cursoCatalogo.clases.length > 0) {
        return cursoCatalogo.clases;
      }
      return null;
    })();

    const listaRaw = clasesDesdeCatalogo || fallback.grabaciones;

    const temas: TemaCurso[] = listaRaw.map((item: any, idx: number) => {
      const numTema = idx + 1;
      const numTemaStr = numTema < 10 ? `0${numTema}` : `${numTema}`;
      const rawTitulo = typeof item === 'string' ? item : (item.titulo || `Tema ${numTemaStr}`);
      const temaLimpio = rawTitulo
        .replace(/^Tema\s*\d+[:\-\s]*/i, '')
        .replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '')
        .trim();
      const temaTituloFinal = `Tema ${numTemaStr}: ${temaLimpio || 'Contenido de la Sesión'}`;

      const rawVideo = typeof item === 'object' ? (item.videoUrl || item.iframe_url || '') : '';
      const mat1 = typeof item === 'object' ? (item.material1 || item.pdfUrl || fallback.material) : fallback.material;
      const mat2 = typeof item === 'object' ? (item.material2 || item.excelUrl || '') : '';
      const parteId = (typeof item === 'object' && item.id) ? item.id : `tema-${numTema}-parte-1`;

      const recursos: RecursoItem[] = [];
      if (mat1) {
        recursos.push({
          id: `rec-mat1-${numTema}`,
          tipo: 'pdf',
          titulo: 'Material de la clase',
          descripcion: 'Diapositivas y contenidos oficiales de la sesión en PDF',
          archivo: mat1,
          url: mat1
        });
      }
      if (mat2) {
        recursos.push({
          id: `rec-mat2-${numTema}`,
          tipo: 'excel',
          titulo: 'Material adicional',
          descripcion: 'Recurso complementario de estudio',
          archivo: mat2,
          url: mat2
        });
      }

      const parte: ParteClase = {
        id: parteId,
        numero: 1,
        titulo: 'Parte 1',
        subtitulo: cursoCatalogo?.docente || 'Docente especializado',
        duracion: typeof item === 'object' && item.duracion ? item.duracion : 'Clase Completa',
        videoUrl: formatearUrlVideoEmbed(rawVideo),
        completada: Boolean(completadosMap[parteId]),
        resumen: null,
        recursos: recursos
      };

      return {
        id: `tema-${numTema}`,
        numeroTema: numTema,
        titulo: temaTituloFinal,
        completado: Boolean(completadosMap[parteId]),
        partes: [parte]
      };
    });

    return {
      titulo: cursoCatalogo?.titulo || fallback.titulo,
      categoria: cursoCatalogo?.categoria || fallback.categoria,
      docente: cursoCatalogo?.docente || '',
      temas: temas
    };
  }, [leccionesTabla, cursoCatalogo, fallback, completadosMap]);

  // Inicializar tema activo y parte seleccionada
  useEffect(() => {
    if (cursoEstructurado.temas.length > 0) {
      if (!temaActivoId || !cursoEstructurado.temas.some(t => t.id === temaActivoId)) {
        setTemaActivoId(cursoEstructurado.temas[0].id);
        setParteSeleccionada(1);
      }
    }
  }, [cursoEstructurado.temas, temaActivoId]);

  // Actualizar el título de la pestaña del navegador con el nombre del curso
  useEffect(() => {
    if (cursoEstructurado?.titulo) {
      document.title = `${cursoEstructurado.titulo.toUpperCase()} | EDUMIN`;
    }
  }, [cursoEstructurado?.titulo]);

  // Tema activo y parte activa en el reproductor
  const temaActual = useMemo(() => {
    return cursoEstructurado.temas.find(t => t.id === temaActivoId) || cursoEstructurado.temas[0] || null;
  }, [cursoEstructurado.temas, temaActivoId]);

  const parteActiva = useMemo(() => {
    if (!temaActual || temaActual.partes.length === 0) return null;
    return temaActual.partes.find(p => p.numero === parteSeleccionada) || temaActual.partes[0];
  }, [temaActual, parteSeleccionada]);

  // Lista plana de todas las partes para navegación secuencial y cálculo de avance
  const todasLasPartes = useMemo(() => {
    const lista: { tema: TemaCurso; parte: ParteClase }[] = [];
    cursoEstructurado.temas.forEach(t => {
      t.partes.forEach(p => {
        lista.push({ tema: t, parte: p });
      });
    });
    return lista;
  }, [cursoEstructurado.temas]);

  // Cálculo de avance porcentual del curso
  const totalPartesContadas = todasLasPartes.length;
  const partesCompletadasContadas = todasLasPartes.filter(item => completadosMap[item.parte.id]).length;
  const avancePorcentaje = totalPartesContadas > 0 
    ? Math.round((partesCompletadasContadas / totalPartesContadas) * 100) 
    : 0;

  // Determinar si la parte activa tiene resumen pedagógico
  const tieneResumen = Boolean(
    parteActiva?.resumen?.parrafo || 
    (parteActiva?.resumen?.temasClave && parteActiva.resumen.temasClave.length > 0)
  );

  useEffect(() => {
    if (!tieneResumen && tabActiva === 'resumen') {
      setTabActiva('recursos');
    }
  }, [tieneResumen, tabActiva]);

  // Navegación secuencial Anterior / Siguiente
  const indiceActualPlano = useMemo(() => {
    if (!temaActual || !parteActiva) return -1;
    return todasLasPartes.findIndex(
      item => item.tema.id === temaActual.id && item.parte.numero === parteActiva.numero
    );
  }, [todasLasPartes, temaActual, parteActiva]);

  const itemAnterior = indiceActualPlano > 0 ? todasLasPartes[indiceActualPlano - 1] : null;
  const itemSiguiente = indiceActualPlano >= 0 && indiceActualPlano < todasLasPartes.length - 1 ? todasLasPartes[indiceActualPlano + 1] : null;

  // Contador de temas para la interfaz
  const totalTemas = cursoEstructurado.temas.length;
  const numeroTemaActual = temaActual ? (cursoEstructurado.temas.findIndex(t => t.id === temaActual.id) + 1) : 1;

  // Activar un recurso específico en el visor
  const activarRecursoEnVisor = (tipo: 'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo' | 'mapamental', titulo: string, url?: string) => {
    setContenidoPrincipal(tipo);
    setRecursoActivoInfo(titulo);
    if (url) {
      setRecursoUrlActivo(url);
    }
  };

  // Marcar automáticamente la lección como completada
  const marcarLeccionCompletadaAuto = useCallback(async (targetId: string) => {
    if (!targetId || completadosMap[targetId]) return;

    try {
      const nuevoMap = { ...completadosMap, [targetId]: true };
      setCompletadosMap(nuevoMap);

      const completadasCount = todasLasPartes.filter(item => nuevoMap[item.parte.id]).length;
      const totalContadas = todasLasPartes.length;
      const nuevoAvance = totalContadas > 0 ? Math.round((completadasCount / totalContadas) * 100) : 0;

      await fetch('/api/dashboard/completar-leccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoId: cursoId,
          cursoSlug: cursoId,
          cursoTitulo: cursoEstructurado.titulo,
          claseId: targetId,
          sesionId: targetId,
          completado: true,
          completadosMap: nuevoMap,
          avancePorcentaje: nuevoAvance,
          dni: dniAlumno
        })
      });
    } catch (err) {
      console.warn('Error al guardar avance automático:', err);
    }
  }, [completadosMap, todasLasPartes, cursoId, cursoEstructurado.titulo, dniAlumno]);

  // Selección de tema y de parte
  const seleccionarTema = (tema: TemaCurso) => {
    setExamenActivoModal(false);
    setTemaActivoId(tema.id);
    setParteSeleccionada(1);
    activarRecursoEnVisor('video_clase', 'Grabación de la clase');
    if (tema.partes[0]) {
      marcarLeccionCompletadaAuto(tema.partes[0].id);
    }
  };

  const seleccionarParte = (tema: TemaCurso, parteNum: number) => {
    setExamenActivoModal(false);
    setTemaActivoId(tema.id);
    setParteSeleccionada(parteNum);
    activarRecursoEnVisor('video_clase', tema.partes.length > 1 ? `Grabación (Parte ${parteNum})` : 'Grabación de la clase');
    const targetParte = tema.partes.find(p => p.numero === parteNum) || tema.partes[0];
    if (targetParte) {
      marcarLeccionCompletadaAuto(targetParte.id);
    }
  };

  useEffect(() => {
    if (parteActiva && !loading && !completadosMap[parteActiva.id]) {
      marcarLeccionCompletadaAuto(parteActiva.id);
    }
  }, [parteActiva, loading, completadosMap, marcarLeccionCompletadaAuto]);

  const irAAnterior = () => {
    if (itemAnterior) {
      seleccionarParte(itemAnterior.tema, itemAnterior.parte.numero);
    }
  };

  const irASiguiente = () => {
    if (itemSiguiente) {
      seleccionarParte(itemSiguiente.tema, itemSiguiente.parte.numero);
    }
  };

  // Temporizador para el examen
  useEffect(() => {
    if (pasoModalExamen !== 'cuestionario' || cargandoPreguntasExamen || guardandoExamen) {
      return;
    }

    const interval = setInterval(() => {
      setTiempoRestanteSegundos(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          rendirExamenCurso();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [pasoModalExamen, cargandoPreguntasExamen, guardandoExamen]);

  const formatearTiempoDisponible = (segundos: number) => {
    const m = Math.floor(segundos / 60);
    const s = segundos % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const scrollExamenArriba = () => {
    const cuerpo = document.getElementById('examen-cuerpo-scroll');
    if (cuerpo) {
      cuerpo.scrollTo({ top: 0, behavior: 'smooth' });
    }
    const zona = document.getElementById('zona-reproductor-principal');
    if (zona) {
      zona.scrollTo({ top: 0, behavior: 'smooth' });
      if (zona.parentElement) {
        zona.parentElement.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Abrir vista previa de indicaciones del examen
  const abrirModalExamen = async () => {
    if (configExamenActivo && configExamenActivo.aplica_examen === false) {
      return;
    }
    if (notaCurso !== undefined) {
      const permitidos = configExamenActivo?.intentos_permitidos ?? 1;
      if (permitidos <= 1) {
        abrirVerIntento();
        return;
      }
    }

    setExamenActivoModal(true);
    setPasoModalExamen('indicaciones');
    setRespuestasExamenDinamicas({});
    setPreguntasExamenDinamicas([]);
    setResultadoExamen(null);
    setTiempoRegistroExamen({ inicio: null, fin: null });
    setDetallesCalificacionExamen(null);
    setMostrarRetroalimentacion(false);
    fechaInicioExamenRef.current = null;
    setTiempoRestanteSegundos((configExamenActivo?.tiempo_minutos || 30) * 60);
    scrollExamenArriba();

    try {
      setCargandoConfigExamen(!configExamenActivo);
      const res = await fetch(
        `/api/dashboard/examenes?codigoDiplomado=${encodeURIComponent(codigoCursoActual)}&modulo=${encodeURIComponent('Examen del Curso')}&dni=${encodeURIComponent(dniAlumno || '71234567')}&accion=ver_intento`
      );
      const data = await res.json();
      if (data.config) {
        setConfigExamenActivo(data.config);
        const minutos = data.config.tiempo_minutos || 30;
        setTiempoRestanteSegundos(minutos * 60);
      }
      const permitidos = data.intentosPermitidos ?? data.config?.intentos_permitidos ?? 1;
      const realizados = data.intentosRealizados ?? (data.intento ? 1 : 0);
      if (data.intento && realizados >= permitidos) {
        const notaGuardada = Number(data.intento.nota ?? 0);
        setNotaCurso(notaGuardada);
        if (data.intento.detalles_examen) {
          setDetallesCalificacionExamen(data.intento.detalles_examen);
        }
        setTiempoRegistroExamen({
          inicio: data.intento.fecha_inicio || null,
          fin: data.intento.fecha_fin || data.intento.updated_at || null
        });
        setResultadoExamen({
          nota: notaGuardada,
          aprobado: notaGuardada >= (data.config?.nota_minima ?? 12)
        });
        setMostrarRetroalimentacion(false);
        setPasoModalExamen('ver_intento');
      }
    } catch (err) {
      console.error('Error al cargar configuración de examen del curso:', err);
    } finally {
      setCargandoConfigExamen(false);
    }
  };

  // Iniciar cuestionario: mantiene la barra superior y carga las preguntas en la segunda parte
  const comenzarExamenCurso = async () => {
    setPasoModalExamen('cuestionario');
    setRespuestasExamenDinamicas({});
    setPreguntasExamenDinamicas([]);
    setMostrarRetroalimentacion(false);
    setCargandoPreguntasExamen(true);
    fechaInicioExamenRef.current = new Date().toISOString();
    setTiempoRestanteSegundos((configExamenActivo?.tiempo_minutos || 30) * 60);
    scrollExamenArriba();

    try {
      const res = await fetch(
        `/api/dashboard/examenes?codigoDiplomado=${encodeURIComponent(codigoCursoActual)}&modulo=${encodeURIComponent('Examen del Curso')}&dni=${encodeURIComponent(dniAlumno || '71234567')}`
      );
      const data = await res.json();
      if (data.config) {
        setConfigExamenActivo(data.config);
        const minutos = data.config.tiempo_minutos || 30;
        setTiempoRestanteSegundos(minutos * 60);
      }
      if (data.intentoAgotado && data.intento) {
        const notaGuardada = Number(data.intento.nota ?? 0);
        setNotaCurso(notaGuardada);
        setDetallesCalificacionExamen(data.intento.detalles_examen || null);
        setTiempoRegistroExamen({
          inicio: data.intento.fecha_inicio || null,
          fin: data.intento.fecha_fin || data.intento.updated_at || null
        });
        setResultadoExamen({
          nota: notaGuardada,
          aprobado: notaGuardada >= (data.config?.nota_minima ?? configExamenActivo?.nota_minima ?? 12)
        });
        setMostrarRetroalimentacion(false);
        setPasoModalExamen('ver_intento');
        return;
      }
      if (data.aplica_examen === false || data.config?.aplica_examen === false) {
        setPreguntasExamenDinamicas([]);
        return;
      }
      if (data.success && data.preguntas && data.preguntas.length > 0) {
        fechaInicioExamenRef.current = new Date().toISOString();
        setPreguntasExamenDinamicas(data.preguntas);
      } else {
        setPreguntasExamenDinamicas([]);
      }
    } catch (err) {
      console.error('Error al cargar preguntas de examen del curso:', err);
      setPreguntasExamenDinamicas([]);
    } finally {
      setCargandoPreguntasExamen(false);
    }
  };

  // Ver Intento Previo de Examen
  const abrirVerIntento = async () => {
    setExamenActivoModal(true);
    setPasoModalExamen('ver_intento');
    setMostrarRetroalimentacion(false);
    const nota = notaCurso || 0;
    const notaMinima = configExamenActivo?.nota_minima ?? 12;
    setResultadoExamen({ nota, aprobado: nota >= notaMinima });
    scrollExamenArriba();

    if (!detallesCalificacionExamen || detallesCalificacionExamen.length === 0 || !tiempoRegistroExamen.fin) {
      try {
        setCargandoRetroalimentacion(true);
        const res = await fetch(`/api/dashboard/examenes?codigoDiplomado=${encodeURIComponent(codigoCursoActual)}&modulo=${encodeURIComponent('Examen del Curso')}&dni=${encodeURIComponent(dniAlumno)}&accion=ver_intento`);
        const data = await res.json();
        if (data.config) {
          setConfigExamenActivo(data.config);
          setResultadoExamen({ nota, aprobado: nota >= (data.config.nota_minima ?? 12) });
        }
        if (data.intento && data.intento.nota !== undefined && data.intento.nota !== null) {
          const n = Number(data.intento.nota);
          setNotaCurso(n);
          setResultadoExamen({ nota: n, aprobado: n >= (data.config?.nota_minima ?? notaMinima) });
        }
        if (data.intento) {
          setTiempoRegistroExamen({
            inicio: data.intento.fecha_inicio || null,
            fin: data.intento.fecha_fin || data.intento.updated_at || null
          });
        }
        if (data.success && data.intento?.detalles_examen) {
          setDetallesCalificacionExamen(data.intento.detalles_examen);
        }
      } catch (e) {
        console.warn('No se pudo recuperar intento previo de notas_modulos:', e);
      } finally {
        setCargandoRetroalimentacion(false);
      }
    }
  };

  const seleccionarOpcionDinamica = (preguntaId: string, indice: number, esMultiple: boolean) => {
    setRespuestasExamenDinamicas(prevMap => {
      const actual = prevMap[preguntaId] || [];
      if (esMultiple) {
        const yaExiste = actual.includes(indice);
        const siguiente = yaExiste ? actual.filter(i => i !== indice) : [...actual, indice];
        return { ...prevMap, [preguntaId]: siguiente };
      } else {
        return { ...prevMap, [preguntaId]: [indice] };
      }
    });
  };

  // Entregar y calificar el examen (sin restricción de preguntas obligatorias)
  const rendirExamenCurso = async () => {
    try {
      setGuardandoExamen(true);
      const preguntasActuales = preguntasExamenRef.current;
      const respuestasActuales = respuestasExamenRef.current;
      const respuestasCompletas: Record<string, number[]> = {};
      preguntasActuales.forEach(p => {
        respuestasCompletas[p.id] = respuestasActuales[p.id] || [];
      });

      const res = await fetch('/api/dashboard/examenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigoDiplomado: codigoCursoActual,
          modulo: 'Examen del Curso',
          dni: dniAlumno,
          fechaInicio: fechaInicioExamenRef.current,
          respuestasUsuario: Object.keys(respuestasCompletas).length > 0 ? respuestasCompletas : respuestasActuales
        })
      });

      const data = await res.json();
      if (data.intentoAgotado && data.intento) {
        const notaGuardada = Number(data.intento.nota ?? 0);
        setNotaCurso(notaGuardada);
        setDetallesCalificacionExamen(data.intento.detalles_examen || null);
        setTiempoRegistroExamen({
          inicio: data.intento.fecha_inicio || null,
          fin: data.intento.fecha_fin || data.intento.updated_at || null
        });
        setResultadoExamen({
          nota: notaGuardada,
          aprobado: notaGuardada >= (configExamenActivo?.nota_minima ?? 12)
        });
        setMostrarRetroalimentacion(false);
        setPasoModalExamen('resultado');
        scrollExamenArriba();
        return;
      }

      if (data.success && data.resultado) {
        const { nota, aprobado, detalles, fechaInicio, fechaFin } = data.resultado;
        setNotaCurso(nota);
        setResultadoExamen({ nota, aprobado });
        setTiempoRegistroExamen({
          inicio: fechaInicio || fechaInicioExamenRef.current || null,
          fin: fechaFin || new Date().toISOString()
        });
        setDetallesCalificacionExamen(detalles || null);
        setMostrarRetroalimentacion(false);
        setPasoModalExamen('resultado');
        scrollExamenArriba();

        try {
          await fetch('/api/dashboard/completar-leccion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              cursoId: codigoCursoActual || cursoId,
              cursoSlug: cursoId,
              cursoTitulo: cursoEstructurado.titulo,
              tipo: 'curso',
              nota: Number(nota),
              rendido: true,
              completado: Boolean(aprobado),
              dni: dniAlumno,
              ...(aprobado ? { avancePorcentaje: 100 } : {})
            })
          });
        } catch (err) {
          console.error('Error sincronizando evaluación de curso con perfil:', err);
        }
      } else {
        alert(data.error || 'Hubo un problema al calificar el examen. Intente nuevamente.');
      }
    } catch (e) {
      console.error('Error al entregar examen:', e);
      alert('Error de conexión al enviar tus respuestas.');
    } finally {
      setGuardandoExamen(false);
    }
  };

  const agregarComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    const nombreUsuario = [nombres, apellidos].filter(Boolean).join(' ') || 'Estudiante';
    setListaComentarios(prev => [
      {
        autor: nombreUsuario,
        texto: comentario.trim(),
        fecha: 'Hace un momento'
      },
      ...prev
    ]);
    setComentario('');
  };

  if (loading || !temaActual || !parteActiva) {
    return <DashboardLoader minHeight="min-h-screen" />;
  }

  const esTaller = cursoEstructurado.titulo.toUpperCase().includes('TALLER') || (cursoCatalogo?.tipo || '').toLowerCase().includes('taller');

  return (
    <div className={`w-full h-full max-h-full flex flex-col overflow-hidden transition-colors duration-200 ${
      esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* TOP BAR FIJA EN EL ENCABEZADO */}
      <header className={`sticky top-0 z-30 h-16 min-h-16 max-h-16 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 backdrop-blur-md transition-colors ${
        esOscuro ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95'
      }`}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-3">
          <Link 
            href="/dashboard/cursos"
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors px-3 py-1.5 rounded-xl border shrink-0 ${
              esOscuro 
                ? 'text-slate-400 hover:text-white bg-slate-800/50 border-slate-700/50' 
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> 
            <span>Volver</span>
          </Link>
          <div className={`h-5 w-px hidden sm:block shrink-0 ${esOscuro ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div className="min-w-0">
            <h1 className={`text-xs sm:text-sm font-bold line-clamp-2 leading-tight uppercase ${
              esOscuro ? 'text-white' : 'text-slate-900'
            }`}>
              {cursoEstructurado.titulo}
            </h1>
          </div>
        </div>

        {/* Botón Ocultar / Mostrar Temario */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setModoCine(!modoCine)}
            className={`text-xs font-semibold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
              esOscuro
                ? 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
            }`}
            title={modoCine ? 'Mostrar temario' : 'Ocultar temario'}
          >
            {modoCine ? (
              <>
                <PanelRightOpen className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Mostrar temario</span>
              </>
            ) : (
              <>
                <PanelRightClose className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Ocultar temario</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* LAYOUT PRINCIPAL */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
        
        {/* ZONA PRINCIPAL DE REPRODUCCIÓN (70%) O ENTORNO DE EVALUACIÓN */}
        <div id="zona-reproductor-principal" className={`flex-1 lg:h-full min-h-0 p-4 sm:p-8 lg:p-10 ${modoCine ? 'lg:border-r-0' : 'lg:border-r'} ${
          examenActivoModal ? 'lg:overflow-hidden lg:flex lg:flex-col' : 'lg:overflow-y-auto space-y-6'
        } ${
          esOscuro ? 'lg:border-slate-800' : 'lg:border-slate-200'
        }`}>
          {examenActivoModal ? (
            /* ENTORNO DE EVALUACIÓN OFICIAL INTEGRADO (BARRA SUPERIOR CONTINUA + CUERPO) */
            <div
              className={`w-full shrink-0 lg:shrink lg:min-h-0 lg:max-h-full rounded-2xl overflow-x-clip lg:overflow-hidden shadow-lg border flex flex-col animate-in fade-in duration-200 ${
                esOscuro ? 'border-slate-800 bg-slate-900/90 text-white' : 'border-slate-300 bg-white text-slate-900'
              }`}
            >
              <ExamenBarraSuperior
                titulo="Examen del curso"
                esOscuro={esOscuro}
                enCuestionario={pasoModalExamen === 'cuestionario'}
                respondidas={Object.values(respuestasExamenDinamicas).filter(arr => arr && arr.length > 0).length}
                totalPreguntas={preguntasExamenDinamicas.length || configExamenActivo?.cantidad_preguntas || 0}
                tiempoRestanteSegundos={tiempoRestanteSegundos}
                tiempoFormateado={formatearTiempoDisponible(tiempoRestanteSegundos)}
              />

              {/* SEGUNDA PARTE: INDICACIONES / CARGADOR / PREGUNTAS / RESULTADO */}
              <div id="examen-cuerpo-scroll" className="p-5 sm:p-8 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
                {/* PASO 1: INDICACIONES PREVIAS */}
                {pasoModalExamen === 'indicaciones' && (
                  <ExamenIndicacionesPanel
                    esOscuro={esOscuro}
                    cargandoConfig={cargandoConfigExamen}
                    config={configExamenActivo}
                    tipo="curso"
                    onCancelar={() => setExamenActivoModal(false)}
                    onComenzar={comenzarExamenCurso}
                  />
                )}

                {/* PASO 2: CUESTIONARIO */}
                {pasoModalExamen === 'cuestionario' && (
                  <div className="space-y-5">
                    {cargandoPreguntasExamen ? (
                      <div className="py-14 text-center text-slate-400 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                        <p className="text-sm font-semibold">Cargando las preguntas oficiales del curso...</p>
                      </div>
                    ) : configExamenActivo && configExamenActivo.aplica_examen === false ? (
                      <div className="p-10 text-center space-y-3 border rounded-2xl border-dashed border-emerald-300 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20">
                        <Award className="w-10 h-10 text-emerald-600 dark:text-emerald-400 mx-auto" />
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white">Este curso no requiere examen</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                          La certificación oficial se otorga directamente al completar el 100% de las clases del temario. No es necesario rendir ninguna evaluación.
                        </p>
                        <button
                          type="button"
                          onClick={() => setExamenActivoModal(false)}
                          className="mt-2 text-xs font-bold px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition cursor-pointer"
                        >
                          Volver a las clases
                        </button>
                      </div>
                    ) : preguntasExamenDinamicas.length === 0 ? (
                      <div className="p-10 text-center space-y-3 border rounded-2xl border-dashed border-slate-300 dark:border-slate-800">
                        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                        <h4 className="font-bold text-sm">Examen en preparación</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Aún no se han publicado las preguntas para este curso. La coordinación académica las habilitará próximamente.
                        </p>
                        <button
                          type="button"
                          onClick={() => setExamenActivoModal(false)}
                          className="mt-2 text-xs font-bold px-4 py-2 bg-indigo-600 text-white rounded-xl cursor-pointer"
                        >
                          Volver a las clases
                        </button>
                      </div>
                    ) : (
                      <>
                        {preguntasExamenDinamicas.map((q, qIdx) => {
                          const esMultiple = q.tipo === 'multiple_select';
                          const seleccionadasActuales = respuestasExamenDinamicas[q.id] || [];

                          return (
                            <div
                              id={`pregunta-card-${q.id}`}
                              key={q.id}
                              className={`p-5 sm:p-6 rounded-2xl border space-y-3.5 transition-all ${
                                esOscuro ? 'bg-slate-900/70 border-slate-800' : 'bg-slate-50/60 border-slate-200'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                  Pregunta {qIdx + 1} de {preguntasExamenDinamicas.length}
                                </span>

                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border ${
                                  esMultiple 
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' 
                                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500 dark:text-indigo-400'
                                }`}>
                                  {esMultiple ? 'Selección múltiple' : 'Opción única'}
                                </span>
                              </div>

                              <h3 className="text-sm sm:text-base font-semibold leading-relaxed text-pretty">
                                {q.pregunta}
                              </h3>

                              <div className="space-y-2.5 pt-1">
                                {q.opciones.map((opt, optIndex) => {
                                  const optIdx = typeof opt.indice === 'number' ? opt.indice : optIndex;
                                  const marcada = seleccionadasActuales.includes(optIdx);
                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() => seleccionarOpcionDinamica(q.id, optIdx, esMultiple)}
                                      className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-start gap-3 cursor-pointer ${
                                        marcada
                                          ? 'bg-indigo-600/10 border-indigo-600 text-indigo-600 dark:text-indigo-300 font-semibold ring-1 ring-indigo-600'
                                          : esOscuro
                                            ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 text-slate-300'
                                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      <div className={`size-5 rounded-${esMultiple ? 'md' : 'full'} border flex items-center justify-center shrink-0 mt-0.5 ${
                                        marcada
                                          ? 'border-indigo-600 bg-indigo-600 text-white'
                                          : esOscuro ? 'border-slate-600' : 'border-slate-300'
                                      }`}>
                                        {marcada && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                      </div>
                                      <span className="leading-relaxed flex-1 text-pretty">{opt.text}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}

                        {/* Botón de entrega al lado derecho */}
                        <div className="pt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() => rendirExamenCurso()}
                            disabled={guardandoExamen}
                            className="w-full sm:w-auto font-bold text-xs sm:text-sm px-6 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 disabled:opacity-60"
                          >
                            {guardandoExamen ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Calificando...</span>
                              </>
                            ) : (
                              <>
                                <Award className="w-4 h-4" />
                                <span>Entregar examen</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* PASO 3 y 4: RESULTADO / VER INTENTO PREVIO */}
                {(pasoModalExamen === 'resultado' || pasoModalExamen === 'ver_intento') && resultadoExamen && (
                  <ExamenResultadoYRetroalimentacion
                    esOscuro={esOscuro}
                    nota={resultadoExamen.nota}
                    aprobado={resultadoExamen.aprobado}
                    notaMinima={configExamenActivo?.nota_minima ?? 12}
                    detalles={detallesCalificacionExamen}
                    cargandoRetroalimentacion={cargandoRetroalimentacion}
                    mostrarRetroalimentacion={mostrarRetroalimentacion}
                    onToggleRetroalimentacion={() => setMostrarRetroalimentacion(prev => !prev)}
                    fechaInicio={tiempoRegistroExamen.inicio}
                    fechaFin={tiempoRegistroExamen.fin}
                    whatsappSustitutorioHref={`https://wa.me/51924400268?text=${encodeURIComponent(`Hola EDUMIN, revisé mi intento en el Examen de ${cursoEstructurado.titulo} con nota ${resultadoExamen.nota}/20 y deseo pagar los S/ 25.00 para rendir el Examen Sustitutorio.`)}`}
                  />
                )}
              </div>
            </div>
          ) : (
            /* ZONA PRINCIPAL DE REPRODUCCIÓN (GRABACIÓN + SELECTOR DE RECURSOS) */
            <>
              {/* CONTENEDOR INTEGRADO: BARRA DE CONTROL CONTINUA + VISOR MULTIMEDIA */}
              {(() => {
                if (!parteActiva) return null;

                let tituloRecurso = 'Grabación de la clase';
                let tipoRecurso: 'video' | 'pdf' | 'excel' | 'audio' | 'interactivo' | 'mapamental' | 'material' = 'video';
                let urlRecurso = (parteActiva.videoUrl || '').replace(/\/preview(\?.*)?$/, '/view');

                if (contenidoPrincipal !== 'video_clase') {
                  const recMatch = parteActiva.recursos?.find(r => 
                    (r.archivo && r.archivo === recursoUrlActivo) || 
                    (r.url && r.url === recursoUrlActivo) ||
                    (r.titulo && r.titulo === recursoActivoInfo)
                  );

                  if (recMatch) {
                    tituloRecurso = recMatch.titulo;
                    tipoRecurso = recMatch.tipo;
                    urlRecurso = recMatch.archivo || recMatch.url || recursoUrlActivo;
                  } else if (contenidoPrincipal === 'pdf_visor') {
                    const recPdf = parteActiva.recursos?.find(r => r.tipo === 'pdf');
                    tituloRecurso = recursoActivoInfo || recPdf?.titulo || 'Material en PDF';
                    tipoRecurso = 'pdf';
                    urlRecurso = recursoUrlActivo || recPdf?.archivo || recPdf?.url || '';
                  } else if (contenidoPrincipal === 'resumen_video') {
                    const recVid = parteActiva.recursos?.find(r => r.tipo === 'video');
                    tituloRecurso = recursoActivoInfo || recVid?.titulo || 'Resumen en video';
                    tipoRecurso = 'video';
                    urlRecurso = recursoUrlActivo || recVid?.archivo || recVid?.url || parteActiva.videoUrl || '';
                  } else if (contenidoPrincipal === 'resumen_audio') {
                    const recAud = parteActiva.recursos?.find(r => r.tipo === 'audio');
                    tituloRecurso = recursoActivoInfo || recAud?.titulo || 'Resumen en audio';
                    tipoRecurso = 'audio';
                    urlRecurso = recursoUrlActivo || recAud?.archivo || recAud?.url || '';
                  } else if (contenidoPrincipal === 'resumen_interactivo') {
                    const recInt = parteActiva.recursos?.find(r => r.tipo === 'interactivo');
                    tituloRecurso = recursoActivoInfo || recInt?.titulo || 'Resumen interactivo';
                    tipoRecurso = 'interactivo';
                    urlRecurso = recursoUrlActivo || recInt?.archivo || recInt?.url || '';
                  } else if (contenidoPrincipal === 'mapamental') {
                    const recMap = parteActiva.recursos?.find(r => r.tipo === 'mapamental');
                    tituloRecurso = recursoActivoInfo || recMap?.titulo || 'Mapa mental';
                    tipoRecurso = 'mapamental';
                    urlRecurso = recursoUrlActivo || recMap?.archivo || recMap?.url || '';
                  }
                }

                const tieneRecursosAdicionales = (parteActiva.recursos && parteActiva.recursos.length > 0);

                return (
                  <div className={`w-full shrink-0 rounded-2xl overflow-hidden shadow-lg border flex flex-col ${
                    esOscuro ? 'border-slate-800 bg-slate-900/90' : 'border-slate-300 bg-white'
                  }`}>
                    {/* BARRA SUPERIOR CONTINUA DEL VISOR */}
                    <div className={`px-3.5 sm:px-5 py-3 border-b flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 ${
                      esOscuro ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50/90'
                    }`}>
                      {/* LADO IZQUIERDO: RECURSO ACTUAL (ÍCONO + TÍTULO) */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-9 rounded-xl grid place-items-center shrink-0 ${
                          contenidoPrincipal === 'video_clase' ? 'bg-indigo-500/20 text-indigo-400' :
                          tipoRecurso === 'pdf' ? 'bg-rose-500/20 text-rose-500' :
                          tipoRecurso === 'material' ? 'bg-cyan-500/20 text-cyan-400' :
                          tipoRecurso === 'excel' ? 'bg-emerald-500/20 text-emerald-500' :
                          tipoRecurso === 'video' ? 'bg-amber-500/20 text-amber-400' :
                          tipoRecurso === 'audio' ? 'bg-purple-500/20 text-purple-400' :
                          tipoRecurso === 'interactivo' ? 'bg-emerald-500/20 text-emerald-400' :
                          tipoRecurso === 'mapamental' ? 'bg-teal-500/20 text-teal-400' :
                          'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {contenidoPrincipal === 'video_clase' && <Video className="w-4.5 h-4.5" />}
                          {contenidoPrincipal !== 'video_clase' && tipoRecurso === 'pdf' && <FileText className="w-4.5 h-4.5" />}
                          {contenidoPrincipal !== 'video_clase' && tipoRecurso === 'material' && <Folder className="w-4.5 h-4.5" />}
                          {contenidoPrincipal !== 'video_clase' && tipoRecurso === 'excel' && <Table className="w-4.5 h-4.5" />}
                          {contenidoPrincipal !== 'video_clase' && tipoRecurso === 'video' && <Clapperboard className="w-4.5 h-4.5" />}
                          {contenidoPrincipal !== 'video_clase' && tipoRecurso === 'audio' && <Headphones className="w-4.5 h-4.5" />}
                          {contenidoPrincipal !== 'video_clase' && tipoRecurso === 'interactivo' && <Sparkles className="w-4.5 h-4.5" />}
                          {contenidoPrincipal !== 'video_clase' && tipoRecurso === 'mapamental' && <Network className="w-4.5 h-4.5" />}
                        </div>
                        <div className="min-w-0">
                          <h3 className={`text-xs sm:text-sm font-bold truncate ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                            {tituloRecurso}
                          </h3>
                        </div>
                      </div>

                      {/* LADO DERECHO: ACCIONES Y SELECTOR */}
                      <div className="flex items-center gap-2 shrink-0 ml-auto">
                        {/* BOTÓN IR AL VIDEO PRINCIPAL (GRABACIÓN) */}
                        <button
                          type="button"
                          onClick={() => {
                            activarRecursoEnVisor('video_clase', 'Grabación de la clase');
                            setMenuFormatoAbierto(false);
                          }}
                          title="Ver grabación oficial en video"
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                            contenidoPrincipal === 'video_clase'
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
                              : esOscuro
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs hover:text-slate-900'
                          }`}
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Grabación</span>
                        </button>

                        {/* SELECTOR DESPLEGABLE DE RECURSOS */}
                        {tieneRecursosAdicionales && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setMenuFormatoAbierto(!menuFormatoAbierto)}
                              className={`text-xs font-bold px-3 py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer ${
                                menuFormatoAbierto || contenidoPrincipal !== 'video_clase'
                                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-2xs'
                                  : esOscuro
                                    ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                                    : 'bg-white hover:bg-slate-100 text-slate-800 border-slate-200 shadow-2xs'
                              }`}
                              title="Elegir otro recurso multimedia"
                            >
                              <span>Cambiar recurso</span>
                              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuFormatoAbierto ? 'rotate-180' : ''}`} />
                            </button>

                            {menuFormatoAbierto && (
                              <>
                                <div 
                                  className="fixed inset-0 z-40" 
                                  onClick={() => setMenuFormatoAbierto(false)} 
                                />
                                <div className={`absolute right-0 mt-2 w-64 max-h-80 overflow-y-auto rounded-2xl border backdrop-blur-xl shadow-2xl p-1.5 z-50 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150 ${
                                  esOscuro ? 'bg-slate-950/95 border-slate-800 text-white' : 'bg-white/95 border-slate-200 text-slate-900'
                                }`}>
                                  <div className={`px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider border-b ${
                                    esOscuro ? 'text-slate-400 border-slate-800' : 'text-slate-500 border-slate-100'
                                  }`}>
                                    Recursos disponibles
                                  </div>

                                  {/* Opción Grabación */}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      activarRecursoEnVisor('video_clase', 'Grabación de la clase');
                                      setMenuFormatoAbierto(false);
                                    }}
                                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                                      contenidoPrincipal === 'video_clase'
                                        ? 'bg-indigo-600 text-white font-bold'
                                        : esOscuro ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'
                                    }`}
                                  >
                                    <Video className="w-4 h-4 text-indigo-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <span className="block truncate font-bold">Grabación de la clase</span>
                                    </div>
                                    {contenidoPrincipal === 'video_clase' && <Check className="w-3.5 h-3.5 shrink-0" />}
                                  </button>

                                  {/* Demás recursos de parteActiva */}
                                  {parteActiva.recursos?.map((rec) => {
                                    const visorTipo = 
                                      rec.tipo === 'video' ? 'resumen_video' :
                                      rec.tipo === 'audio' ? 'resumen_audio' :
                                      rec.tipo === 'interactivo' ? 'resumen_interactivo' :
                                      rec.tipo === 'mapamental' ? 'mapamental' : 'pdf_visor';
                                    const esActivo = (contenidoPrincipal === visorTipo) && (
                                      recursoUrlActivo === (rec.archivo || rec.url) ||
                                      recursoActivoInfo === rec.titulo
                                    );

                                    return (
                                      <button
                                        key={rec.id}
                                        type="button"
                                        onClick={() => {
                                          activarRecursoEnVisor(visorTipo, rec.titulo || 'Recurso', rec.archivo || rec.url);
                                          setMenuFormatoAbierto(false);
                                        }}
                                        className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer text-left ${
                                          esActivo
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : esOscuro ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-800 hover:bg-slate-100'
                                        }`}
                                      >
                                        <div className="shrink-0">
                                          {rec.tipo === 'pdf' && <FileText className="w-4 h-4 text-rose-400" />}
                                          {rec.tipo === 'material' && <Folder className="w-4 h-4 text-cyan-400" />}
                                          {rec.tipo === 'excel' && <Table className="w-4 h-4 text-emerald-400" />}
                                          {rec.tipo === 'video' && <Clapperboard className="w-4 h-4 text-amber-400" />}
                                          {rec.tipo === 'audio' && <Headphones className="w-4 h-4 text-purple-400" />}
                                          {rec.tipo === 'interactivo' && <Sparkles className="w-4 h-4 text-emerald-400" />}
                                          {rec.tipo === 'mapamental' && <Network className="w-4 h-4 text-teal-400" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <span className="block truncate font-bold">{rec.titulo}</span>
                                        </div>
                                        {esActivo && <Check className="w-3.5 h-3.5 shrink-0" />}
                                      </button>
                                    );
                                  })}
                                </div>
                              </>
                            )}
                          </div>
                        )}

                        {/* BOTÓN VER EN NUEVA PESTAÑA */}
                        {urlRecurso && (
                          <a
                            href={urlRecurso}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir este recurso en una nueva pestaña"
                            className={`p-2 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                              esOscuro
                                ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700 hover:text-white'
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs hover:text-slate-900'
                            }`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>

                    {/* ÁREA DE VISOR / IFRAME */}
                    <div className="w-full aspect-video shrink-0 bg-black relative flex flex-col items-center justify-center">
                      {contenidoPrincipal === 'video_clase' && (
                        parteActiva.videoUrl ? (
                          <iframe 
                            key={`${temaActual.id}-p${parteActiva.numero}`}
                            src={formatearUrlVideoEmbed(parteActiva.videoUrl)} 
                            title={`${temaActual.titulo} - ${parteActiva.titulo}`}
                            className="w-full h-full border-0 absolute inset-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                            <Video className="w-12 h-12 opacity-30 text-indigo-400" />
                            <p className="text-sm font-bold text-slate-300">
                              {parteActiva.titulo}
                            </p>
                            <p className="text-xs text-slate-500 max-w-sm">
                              Esta sesión aún no cuenta con un enlace de video registrado en el catálogo.
                            </p>
                          </div>
                        )
                      )}

                      {contenidoPrincipal !== 'video_clase' && (() => {
                        let url = recursoUrlActivo;
                        if (!url) {
                          if (contenidoPrincipal === 'pdf_visor') {
                            url = parteActiva.recursos.find(r => r.tipo === 'pdf')?.archivo || '';
                          } else if (contenidoPrincipal === 'resumen_video') {
                            url = parteActiva.recursos.find(r => r.tipo === 'video')?.archivo || parteActiva.videoUrl || '';
                          } else if (contenidoPrincipal === 'resumen_audio') {
                            url = parteActiva.recursos.find(r => r.tipo === 'audio')?.archivo || '';
                          } else if (contenidoPrincipal === 'resumen_interactivo') {
                            url = parteActiva.recursos.find(r => r.tipo === 'interactivo')?.archivo || '';
                          } else if (contenidoPrincipal === 'mapamental') {
                            url = parteActiva.recursos.find(r => r.tipo === 'mapamental')?.archivo || '';
                          }
                        }

                        if (!url) {
                          return (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-400 bg-slate-950">
                              <p className="text-xs sm:text-sm">No hay enlace configurado para este recurso.</p>
                            </div>
                          );
                        }

                        const esAudioDirecto = contenidoPrincipal === 'resumen_audio' && /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(url);

                        if (esAudioDirecto) {
                          return (
                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950">
                              <div className={`w-full max-w-md p-6 rounded-2xl border text-center space-y-4 ${
                                esOscuro ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                              }`}>
                                <p className="text-xs sm:text-sm font-bold truncate">
                                  {recursoActivoInfo || temaActual.titulo}
                                </p>
                                <audio controls autoPlay src={url} className="w-full mt-2" />
                              </div>
                            </div>
                          );
                        }

                        let embedUrl = formatearUrlVideoEmbed(url);

                        return (
                          <iframe 
                            key={`${contenidoPrincipal}-${embedUrl}`}
                            src={embedUrl}
                            title={recursoActivoInfo || 'Recurso Multimedia'}
                            className="w-full h-full border-0 absolute inset-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        );
                      })()}
                    </div>
                  </div>
                );
              })()}

              {/* SECCIÓN UNIFICADA: TEMA ACTIVO, SELECTOR DE PARTES Y NAVEGACIÓN */}
              {(() => {
                const partesDelTema = (temaActual && temaActual.partes && temaActual.partes.length > 0)
                  ? temaActual.partes
                  : (parteActiva ? [parteActiva] : []);
                const tituloMostrar = (temaActual?.titulo || cursoEstructurado.titulo || '').toUpperCase();

                return (
                  <div className={`p-4 sm:p-5 shrink-0 rounded-2xl border transition-all space-y-4 ${
                    esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                  }`}>
                    {/* Encabezado: Título en mayúsculas */}
                    <div className="flex items-center justify-between gap-2.5">
                      <h2 className={`text-sm sm:text-base font-bold leading-snug uppercase ${
                        esOscuro ? 'text-white' : 'text-slate-900'
                      }`}>
                        {tituloMostrar}
                      </h2>
                    </div>

                    {/* Selector de Partes */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full">
                      {partesDelTema.map((parteItem: ParteClase, pIdx: number) => {
                        const esParteActiva = parteActiva?.id === parteItem.id;
                        const esParteCompletada = Boolean(completadosMap[parteItem.id]);

                        return (
                          <button
                            key={parteItem.id}
                            type="button"
                            onClick={() => seleccionarParte(temaActual, parteItem.numero)}
                            className={`w-32 sm:w-36 shrink-0 p-2.5 rounded-xl border flex items-center gap-2.5 transition-all cursor-pointer select-none ${
                              esParteActiva
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm font-bold'
                                : esOscuro
                                  ? 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className="shrink-0">
                              {esParteCompletada ? (
                                <CheckCircle2 
                                  className={`w-4 h-4 shrink-0 ${
                                    esParteActiva 
                                      ? '[&>circle]:fill-white [&>circle]:stroke-white [&>path]:stroke-indigo-600 [&>path]:stroke-[2.5]' 
                                      : '[&>circle]:fill-emerald-500 [&>circle]:stroke-emerald-500 [&>path]:stroke-white [&>path]:stroke-[2.5]'
                                  }`} 
                                  strokeWidth={2.2} 
                                />
                              ) : (
                                <CheckCircle2 
                                  className={`w-4 h-4 shrink-0 ${
                                    esParteActiva 
                                      ? 'text-white/70' 
                                      : esOscuro ? 'text-slate-500' : 'text-slate-400'
                                  }`} 
                                  strokeWidth={1.8} 
                                />
                              )}
                            </div>
                            <span className="text-xs font-bold truncate uppercase flex-1 text-left">
                              Parte {String(pIdx + 1).padStart(2, '0')}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Navegación secuencial de temas (Anterior / Contador de Temas / Siguiente) */}
                    <div className="pt-1 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={irAAnterior}
                        disabled={!itemAnterior}
                        className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                          itemAnterior
                            ? esOscuro
                              ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
                              : 'bg-slate-100 text-slate-800 border-slate-200 hover:bg-slate-200'
                            : 'opacity-40 cursor-not-allowed text-slate-500 border-transparent'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" /> 
                        <span>Anterior</span>
                      </button>

                      <div className={`text-center text-xs font-semibold px-4 py-1.5 rounded-lg shrink-0 ${
                        esOscuro ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Tema {numeroTemaActual} de {totalTemas}
                      </div>

                      <button
                        type="button"
                        onClick={irASiguiente}
                        disabled={!itemSiguiente}
                        className={`inline-flex items-center justify-center gap-1.5 text-xs font-bold px-4 py-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
                          itemSiguiente
                            ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-xs'
                            : 'opacity-40 cursor-not-allowed text-slate-500 border-transparent'
                        }`}
                      >
                        <span>Siguiente</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* PESTAÑAS (TABS): RESUMEN, RECURSOS Y FORO */}
              <div className="mt-4">
                <div className={`flex flex-wrap items-center gap-2 border-b pb-3 ${
                  esOscuro ? 'border-slate-800' : 'border-slate-200'
                }`}>
                  {tieneResumen && (
                    <button
                      onClick={() => setTabActiva('resumen')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        tabActiva === 'resumen' 
                          ? 'bg-indigo-600 text-white shadow-sm' 
                          : esOscuro 
                            ? 'text-slate-400 hover:text-white hover:bg-slate-900' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      Resumen
                    </button>
                  )}
                  <button
                    onClick={() => setTabActiva('recursos')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tabActiva === 'recursos' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : esOscuro 
                          ? 'text-slate-400 hover:text-white hover:bg-slate-900' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Recursos multimedia
                  </button>
                  <button
                    onClick={() => setTabActiva('foro')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      tabActiva === 'foro' 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : esOscuro 
                          ? 'text-slate-400 hover:text-white hover:bg-slate-900' 
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    Foro de consultas
                  </button>
                </div>

                <div className="mt-5 text-sm leading-relaxed">
                  
                  {/* TAB RESUMEN */}
                  {tabActiva === 'resumen' && tieneResumen && parteActiva?.resumen && (
                    <div className={`p-6 sm:p-7 rounded-2xl border space-y-6 ${
                      esOscuro ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                    }`}>
                      {parteActiva.resumen.parrafo && (
                        <div className="space-y-2">
                          <h4 className={`text-xs font-black uppercase tracking-wider ${esOscuro ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Resumen:
                          </h4>
                          <p className={`text-xs sm:text-sm leading-relaxed ${esOscuro ? 'text-slate-200' : 'text-slate-700'}`}>
                            {parteActiva.resumen.parrafo}
                          </p>
                        </div>
                      )}

                      {parteActiva.resumen.temasClave && parteActiva.resumen.temasClave.length > 0 && (
                        <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                          <h4 className={`text-xs font-black uppercase tracking-wider ${esOscuro ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            Puntos clave:
                          </h4>
                          <ul className="space-y-2.5">
                            {parteActiva.resumen.temasClave.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm">
                                <span className="text-indigo-500 font-bold shrink-0">•</span>
                                <div>
                                  {item.titulo && <strong className="text-slate-900 dark:text-white mr-1.5">{item.titulo}:</strong>}
                                  <span>{item.descripcion}</span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB RECURSOS MULTIMEDIA Y DOCUMENTOS (ESTRUCTURA IDÉNTICA A DIPLOMADOS) */}
                  {tabActiva === 'recursos' && (
                    <div className="space-y-3">
                      {/* 1. GRABACIÓN DE LA CLASE (SIEMPRE PRIMER RECURSO) */}
                      {(() => {
                        const esGrabacionActiva = contenidoPrincipal === 'video_clase';

                        return (
                          <div 
                            className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border gap-4 transition-all ${
                              esGrabacionActiva
                                ? esOscuro
                                  ? 'bg-indigo-950/40 border-indigo-700/60 ring-1 ring-indigo-500/30 shadow-sm'
                                  : 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/30 shadow-sm'
                                : esOscuro 
                                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${
                                esGrabacionActiva 
                                  ? 'bg-indigo-600 text-white shadow-xs' 
                                  : 'bg-indigo-500/20 text-indigo-500'
                              }`}>
                                <Video className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className={`font-bold text-xs sm:text-sm truncate ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                                  Grabación de la clase {parteActiva.titulo ? `· ${parteActiva.titulo}` : ''}
                                </h4>
                                <span className={`text-[11px] block truncate ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                                  Clase magistral completa en video de alta definición.
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button 
                                type="button"
                                onClick={() => activarRecursoEnVisor('video_clase', 'Grabación de la clase')}
                                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border cursor-pointer ${
                                  esGrabacionActiva
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                                    : esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver en visor
                              </button>
                              <a 
                                href={parteActiva.videoUrl || '#'} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                title="Abrir en nueva pestaña"
                                className={`p-2 rounded-xl flex items-center justify-center transition-colors border cursor-pointer ${
                                  esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                }`}
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        );
                      })()}

                      {/* RESTO DE RECURSOS MULTIMEDIA */}
                      {parteActiva.recursos && parteActiva.recursos.length > 0 ? (
                        parteActiva.recursos.map((rec) => {
                          const esRecursoActivo = (() => {
                            if (rec.tipo === 'video' && contenidoPrincipal === 'resumen_video') return true;
                            if (rec.tipo === 'audio' && contenidoPrincipal === 'resumen_audio') return true;
                            if (rec.tipo === 'interactivo' && contenidoPrincipal === 'resumen_interactivo') return true;
                            if (rec.tipo === 'mapamental' && contenidoPrincipal === 'mapamental') return true;
                            if (rec.tipo === 'pdf' && contenidoPrincipal === 'pdf_visor') return true;
                            return false;
                          })();

                          return (
                            <div 
                              key={rec.id}
                              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border gap-4 transition-all ${
                                esRecursoActivo 
                                  ? esOscuro
                                    ? 'bg-indigo-950/40 border-indigo-700/60 ring-1 ring-indigo-500/30 shadow-sm'
                                    : 'bg-indigo-50/70 border-indigo-300 ring-1 ring-indigo-400/30 shadow-sm'
                                  : esOscuro 
                                    ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${
                                  esRecursoActivo
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : rec.tipo === 'pdf' ? 'bg-rose-500/20 text-rose-500' :
                                      rec.tipo === 'material' ? 'bg-cyan-500/20 text-cyan-500' :
                                      rec.tipo === 'excel' ? 'bg-emerald-500/20 text-emerald-500' :
                                      rec.tipo === 'video' ? 'bg-amber-500/20 text-amber-500' :
                                      rec.tipo === 'audio' ? 'bg-purple-500/20 text-purple-500' :
                                      rec.tipo === 'interactivo' ? 'bg-emerald-500/20 text-emerald-500' :
                                      rec.tipo === 'mapamental' ? 'bg-teal-500/20 text-teal-500' :
                                      'bg-cyan-500/20 text-cyan-500'
                                }`}>
                                  {rec.tipo === 'pdf' && <FileText className="w-5 h-5" />}
                                  {rec.tipo === 'material' && <Folder className="w-5 h-5" />}
                                  {rec.tipo === 'excel' && <Table className="w-5 h-5" />}
                                  {rec.tipo === 'video' && <Clapperboard className="w-5 h-5" />}
                                  {rec.tipo === 'audio' && <Headphones className="w-5 h-5" />}
                                  {rec.tipo === 'interactivo' && <Sparkles className="w-5 h-5" />}
                                  {rec.tipo === 'mapamental' && <Network className="w-5 h-5" />}
                                </div>
                                <div className="min-w-0">
                                  <h4 className={`font-bold text-xs sm:text-sm truncate ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                                    {rec.titulo}
                                  </h4>
                                  <span className={`text-[11px] block truncate ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {rec.descripcion}
                                  </span>
                                </div>
                              </div>

                              {/* ÚNICOS 2 BOTONES: VER EN VISOR Y NUEVA PESTAÑA */}
                              <div className="flex items-center gap-2 shrink-0">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    const visorTipo = 
                                      rec.tipo === 'video' ? 'resumen_video' :
                                      rec.tipo === 'audio' ? 'resumen_audio' :
                                      rec.tipo === 'interactivo' ? 'resumen_interactivo' :
                                      rec.tipo === 'mapamental' ? 'mapamental' : 'pdf_visor';
                                    activarRecursoEnVisor(visorTipo, rec.titulo || 'Recurso', rec.archivo || rec.url);
                                  }}
                                  className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border cursor-pointer ${
                                    esRecursoActivo
                                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                                      : esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                  }`}
                                >
                                  <Eye className="w-3.5 h-3.5" /> Ver en visor
                                </button>
                                <a 
                                  href={rec.archivo || rec.url || '#'} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  title="Abrir en nueva pestaña"
                                  className={`p-2 rounded-xl flex items-center justify-center transition-colors border cursor-pointer ${
                                    esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                                  }`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            </div>
                          );
                        })
                      ) : null}
                    </div>
                  )}

                  {/* TAB FORO DE CONSULTAS */}
                  {tabActiva === 'foro' && (
                    <div className="space-y-6">
                      <form onSubmit={agregarComentario} className="flex flex-col sm:flex-row gap-3">
                        <input 
                          type="text"
                          placeholder="Escribe una duda o consulta académica para el docente..."
                          value={comentario}
                          onChange={(e) => setComentario(e.target.value)}
                          className={`flex-1 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 border transition-all ${
                            esOscuro 
                              ? 'bg-slate-900 border-slate-800 text-white placeholder:text-slate-500' 
                              : 'bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 shadow-sm'
                          }`}
                        />
                        <button 
                          type="submit" 
                          disabled={!comentario.trim()}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white font-bold px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shrink-0 shadow cursor-pointer"
                        >
                          <Send className="w-4 h-4" /> Enviar comentario
                        </button>
                      </form>

                      <div className="space-y-3">
                        {listaComentarios.map((c, i) => (
                          <div 
                            key={i} 
                            className={`p-4 rounded-2xl border transition-all ${
                              esOscuro ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-xs text-indigo-500">{c.autor}</span>
                              <span className={`text-[10px] ${esOscuro ? 'text-slate-500' : 'text-slate-400'}`}>{c.fecha}</span>
                            </div>
                            <p className="text-xs sm:text-sm">{c.texto}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </>
          )}

        </div>

        {/* SIDEBAR DERECHO (30%) - TEMARIO CONTINUO SIN MÓDULOS */}
        {!modoCine && (
          <aside className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l flex flex-col shrink-0 lg:h-full lg:overflow-y-auto transition-colors ${
            esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Header del temario con avance integrado */}
            <div className={`p-4 sm:p-5 border-b shrink-0 sticky top-0 z-10 backdrop-blur-md ${
              esOscuro ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95 shadow-2xs'
            }`}>
              <div>
                <h3 className={`font-bold text-base ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  {esTaller ? 'Temario del taller' : 'Temario del curso'}
                </h3>
              </div>
              
              {/* Barra de progreso real calculada */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <span className={esOscuro ? 'text-slate-400' : 'text-slate-500'}>
                    Avance
                  </span>
                  <span className={`font-semibold ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                    {avancePorcentaje}% completado
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-200'}`}>
                  <div 
                    className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    style={{ width: `${avancePorcentaje}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Lista Continua de Temas (Directamente los temas, sin módulos) */}
            <div className="p-4 space-y-2 pb-8">
              {cursoEstructurado.temas.map((tema: TemaCurso) => {
                const esTemaSeleccionado = !examenActivoModal && (temaActual?.id === tema.id);
                const esTemaCompletado = tema.completado || (tema.partes.length > 0 && tema.partes.every(p => completadosMap[p.id]));

                return (
                  <button
                    key={tema.id}
                    type="button"
                    onClick={() => seleccionarTema(tema)}
                    className={`w-full text-left p-3 rounded-xl flex items-center gap-2.5 text-xs font-semibold transition-all border cursor-pointer ${
                      esTemaSeleccionado
                        ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-bold'
                        : esOscuro
                          ? 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    <div className="shrink-0">
                      {esTemaCompletado ? (
                        <CheckCircle2 
                          className={`w-4 h-4 shrink-0 ${
                            esTemaSeleccionado 
                              ? '[&>circle]:fill-white [&>circle]:stroke-white [&>path]:stroke-indigo-600 [&>path]:stroke-[2.5]' 
                              : '[&>circle]:fill-emerald-500 [&>circle]:stroke-emerald-500 [&>path]:stroke-white [&>path]:stroke-[2.5]'
                          }`} 
                          strokeWidth={2.2} 
                        />
                      ) : (
                        <CheckCircle2 
                          className={`w-4 h-4 shrink-0 ${
                            esTemaSeleccionado ? 'text-white/70' : esOscuro ? 'text-slate-500' : 'text-slate-400'
                          }`} 
                          strokeWidth={1.8} 
                        />
                      )}
                    </div>
                    
                    <span className="truncate text-xs font-bold leading-tight uppercase flex-1 min-w-0">
                      {tema.titulo.toUpperCase()}
                    </span>

                    {tema.partes.length > 1 && (
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border shrink-0 ${
                        esTemaSeleccionado
                          ? 'bg-white/20 border-white/30 text-white'
                          : esOscuro ? 'bg-slate-700/50 border-slate-600 text-slate-300' : 'bg-slate-200/80 border-slate-300 text-slate-600'
                      }`}>
                        {tema.partes.length} partes
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Fila del Examen del Curso o Certificación Directa */}
              {(() => {
                const esExamenActivo = Boolean(examenActivoModal);

                // Si este curso no aplica examen (certificación directa)
                if (configExamenActivo && configExamenActivo.aplica_examen === false) {
                  const completadoTotal = avancePorcentaje >= 100;

                  return (
                    <div 
                      className={`mt-4 p-3 rounded-xl border transition-all select-none space-y-2.5 ${
                        completadoTotal
                          ? (esOscuro ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50/80 border-emerald-200 text-emerald-900')
                          : (esOscuro ? 'bg-slate-800/60 border-slate-700/60 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800')
                      }`}
                    >
                      {/* Fila 1: Icono + Título + Subtítulo */}
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          completadoTotal
                            ? 'bg-emerald-500/15 text-emerald-500'
                            : 'bg-blue-500/15 text-blue-500'
                        }`}>
                          <Award className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-bold block truncate uppercase ${
                            esOscuro ? 'text-slate-100' : 'text-slate-800'
                          }`}>
                            Certificación del curso
                          </span>
                          <span className="text-[11px] block font-medium truncate text-slate-400">
                            {completadoTotal
                              ? 'Clases completadas · Certificado listo'
                              : 'Certificación directa · Sin examen'
                            }
                          </span>
                        </div>
                      </div>

                      {/* Fila 2: Botón Ver certificado */}
                      <div className={`pt-2 border-t flex items-center gap-2 ${
                        esOscuro ? 'border-slate-700/60' : 'border-slate-200'
                      }`}>
                        {completadoTotal ? (
                          <Link
                            href="/dashboard/certificados"
                            className="w-full inline-flex items-center justify-center gap-1.5 font-bold text-xs px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-2xs transition-colors"
                          >
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span>Ver certificado</span>
                          </Link>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="w-full inline-flex items-center justify-center gap-1.5 font-semibold text-xs px-3 py-1.5 rounded-xl bg-slate-200/80 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed border border-slate-300/40 dark:border-slate-700/40"
                          >
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span>Ver certificado</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }

                const examenRendido = notaCurso !== undefined;
                const examenDesaprobado = examenRendido && notaCurso < (configExamenActivo?.nota_minima ?? 12);

                return (
                  <div 
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      if (notaCurso !== undefined) {
                        abrirVerIntento();
                      } else {
                        abrirModalExamen();
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (notaCurso !== undefined) {
                          abrirVerIntento();
                        } else {
                          abrirModalExamen();
                        }
                      }
                    }}
                    className={`mt-4 p-3 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 ${
                      esExamenActivo
                        ? (examenDesaprobado
                            ? 'bg-rose-600 text-white border-rose-600 shadow-md font-bold'
                            : 'bg-amber-500 text-white border-amber-500 shadow-md font-bold')
                        : esOscuro 
                          ? 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 shadow-2xs' 
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 shadow-2xs'
                    }`}
                  >
                    {/* Fila Superior: Icono + Título + Subtítulo / Botón Rendir Examen */}
                    <div className="flex items-center justify-between gap-2.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                          esExamenActivo
                            ? 'bg-white/20 text-white'
                            : examenDesaprobado
                              ? 'bg-rose-500/15 text-rose-500'
                              : 'bg-amber-500/15 text-amber-500'
                        }`}>
                          <FileText className={`w-4 h-4 ${esExamenActivo ? 'text-white' : ''}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className={`text-xs font-bold block truncate uppercase ${
                            esExamenActivo
                              ? 'text-white'
                              : esOscuro ? 'text-slate-100' : 'text-slate-800'
                          }`}>
                            EXAMEN DEL CURSO
                          </span>
                          <span className={`text-[11px] block font-medium truncate ${
                            esExamenActivo
                              ? 'text-white/80'
                              : examenDesaprobado
                                ? 'text-rose-500 dark:text-rose-400'
                                : 'text-slate-400'
                          }`}>
                            {notaCurso !== undefined
                              ? `Nota: ${notaCurso.toString().padStart(2, '0')}/20 · ${examenDesaprobado ? 'Desaprobado' : 'Aprobado'}`
                              : `${configExamenActivo?.intentos_permitidos ?? 1} ${(configExamenActivo?.intentos_permitidos ?? 1) === 1 ? 'intento' : 'intentos'} · ${configExamenActivo?.tiempo_minutos ?? 30} min`
                            }
                          </span>
                        </div>
                      </div>

                      {notaCurso === undefined && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirModalExamen();
                          }}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all flex items-center justify-center shrink-0 cursor-pointer ${
                            esExamenActivo
                              ? 'bg-white text-amber-600 hover:bg-amber-50 shadow-xs'
                              : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20 shadow-sm'
                          }`}
                        >
                          <span>Rendir examen</span>
                        </button>
                      )}
                    </div>

                    {/* Fila Inferior: Botones de Acción (Cuando el examen ya fue rendido) */}
                    {notaCurso !== undefined && (
                      <div className={`pt-2 border-t flex items-center gap-2 ${
                        esExamenActivo 
                          ? 'border-white/20' 
                          : esOscuro ? 'border-slate-700/60' : 'border-slate-200'
                      }`}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirVerIntento();
                          }}
                          className={`flex-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                            esExamenActivo
                              ? (examenDesaprobado
                                  ? 'bg-white text-rose-600 border-white hover:bg-rose-50 shadow-xs'
                                  : 'bg-white text-amber-600 border-white hover:bg-amber-50 shadow-xs')
                              : esOscuro 
                                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700' 
                                : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">Ver intento</span>
                        </button>

                        {!examenDesaprobado ? (
                          <Link
                            href="/dashboard/certificados"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 inline-flex items-center justify-center gap-1.5 font-bold text-xs px-2.5 py-1.5 rounded-xl border transition-colors shadow-2xs cursor-pointer truncate ${
                              esExamenActivo
                                ? 'bg-white text-amber-600 border-white hover:bg-amber-50 shadow-xs'
                                : 'bg-amber-500 hover:bg-amber-600 border-amber-500 text-white shadow-amber-500/20 shadow-sm'
                            }`}
                            title="Descargar certificado"
                          >
                            <Award className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">Ver certificado</span>
                          </Link>
                        ) : (
                          <a
                            href={`https://wa.me/51924400268?text=${encodeURIComponent(`Hola EDUMIN, revisé mi intento en el Examen de ${cursoEstructurado.titulo} con nota ${notaCurso}/20 y deseo solicitar el Examen Sustitutorio.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`flex-1 inline-flex items-center justify-center gap-1 font-bold text-xs px-2 py-1.5 rounded-xl border transition-colors shadow-2xs cursor-pointer truncate ${
                              esExamenActivo
                                ? 'bg-white text-rose-600 border-white hover:bg-rose-50 shadow-xs'
                                : 'bg-rose-600 hover:bg-rose-700 border-rose-600 text-white shadow-rose-600/20 shadow-sm'
                            }`}
                          >
                            <span className="truncate">Pagar sustitutorio</span>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </aside>
        )}

      </div>

    </div>
  );
}
