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
  X
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDiplomadoBySlug } from '@/lib/data/diplomadosData';
import { getDriveVideoForClass } from '@/lib/data/driveVideos';
import { useTheme } from '@/context/theme-context';
import { useProfile } from '@/context/profile-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { parseDiplomadosFromProfile, formatearCodigoModulo } from '@/lib/utils/profileParser';
import { PreguntaExamenEstudiante, DetalleCalificacionPregunta } from '@/lib/types/examenes';
import {
  ExamenBarraSuperior,
  ExamenIndicacionesPanel,
  ExamenResultadoYRetroalimentacion,
  ConfigExamenEstudiante
} from '@/components/dashboard/examen-estudiante-ui';
import { formatearTextoCientifico } from '@/lib/utils/textoCientifico';
import { parsearResumenTexto, ResumenData } from '@/lib/utils/resumenParser';
import resumenesCacheJson from '@/lib/data/resumenes_clases_cache.json';
import { 
  obtenerRecursosConLinks, 
  convertirFilasAListaModulos, 
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

export interface ClaseCompleta {
  id: string;
  numeroClase: number;
  tituloClase: string;
  moduloCodigo: string;
  moduloTitulo: string;
  completada: boolean;
  partes: ParteClase[];
}

export default function ReproductorClasesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const diplomadoId = params.id as string;
  const moduloQuery = searchParams.get('modulo');

  const { esOscuro } = useTheme();
  const { nombres, apellidos } = useProfile();

  // Estados de datos de Supabase
  const [loading, setLoading] = useState(true);
  const [completadosMap, setCompletadosMap] = useState<Record<string, boolean>>({});
  const [catalogoMateriales, setCatalogoMateriales] = useState<any>(null);
  const [leccionesTabla, setLeccionesTabla] = useState<LeccionRow[]>([]);
  const [recursoUrlActivo, setRecursoUrlActivo] = useState<string>('');
  const [guardandoAvance, setGuardandoAvance] = useState(false);
  const [temasAbiertosMap, setTemasAbiertosMap] = useState<Record<string, boolean>>({});
  const [dniAlumno, setDniAlumno] = useState<string>('71234567');
  const [modoCine, setModoCine] = useState(false);

  // Estados del Examen del Módulo
  const [notasModulosMap, setNotasModulosMap] = useState<Record<string, number>>({});
  const [examenActivoModal, setExamenActivoModal] = useState<{ moduloCodigo: string; moduloNombre: string; moduloIdx: number } | null>(null);
  const [pasoModalExamen, setPasoModalExamen] = useState<'indicaciones' | 'cuestionario' | 'resultado' | 'ver_intento'>('indicaciones');
  const [respuestasExamen, setRespuestasExamen] = useState<Record<number, number>>({});
  const [respuestasExamenDinamicas, setRespuestasExamenDinamicas] = useState<Record<string, number[]>>({});
  const [preguntasExamenDinamicas, setPreguntasExamenDinamicas] = useState<PreguntaExamenEstudiante[]>([]);
  const [cargandoPreguntasExamen, setCargandoPreguntasExamen] = useState(false);
  const [cargandoConfigExamen, setCargandoConfigExamen] = useState(false);
  const [detallesCalificacionExamen, setDetallesCalificacionExamen] = useState<DetalleCalificacionPregunta[] | null>(null);
  const [modulosConExamenDisponibles, setModulosConExamenDisponibles] = useState<string[]>([]);
  const [tiempoRestanteSegundos, setTiempoRestanteSegundos] = useState<number>(30 * 60);
  const [configExamenActivo, setConfigExamenActivo] = useState<ConfigExamenEstudiante | null>(null);
  const [respuestasPorModulo, setRespuestasPorModulo] = useState<Record<string, Record<number, number>>>({});
  const [guardandoExamen, setGuardandoExamen] = useState(false);
  const [resultadoExamen, setResultadoExamen] = useState<{ nota: number; aprobado: boolean } | null>(null);
  const [tiempoRegistroExamen, setTiempoRegistroExamen] = useState<{ inicio: string | null; fin: string | null }>({
    inicio: null,
    fin: null
  });
  const [mostrarRetroalimentacion, setMostrarRetroalimentacion] = useState(false);
  const [cargandoRetroalimentacion, setCargandoRetroalimentacion] = useState(false);
  const [configsModulosMap, setConfigsModulosMap] = useState<Record<string, ConfigExamenEstudiante>>({});
  const [intentosCargados, setIntentosCargados] = useState(false);
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

  const toggleTema = (temaId: string) => {
    setTemasAbiertosMap(prev => ({
      ...prev,
      [temaId]: prev[temaId] === undefined ? false : !prev[temaId]
    }));
  };

  // Resolver el código oficial de diplomado (DIP-01 .. DIP-22)
  const codigoDipActual: string = useMemo(() => {
    if (leccionesTabla && leccionesTabla[0]?.CodigoDiplomado) {
      return leccionesTabla[0].CodigoDiplomado;
    }
    if (/^dip-\d+$/i.test(diplomadoId)) {
      const num = diplomadoId.replace(/[^0-9]/g, '').padStart(2, '0');
      return `DIP-${num}`;
    }
    const matched = getDiplomadoBySlug(diplomadoId);
    if (matched && (matched as any).numId) {
      return `DIP-${(matched as any).numId.toString().padStart(2, '0')}`;
    }
    return 'DIP-01';
  }, [leccionesTabla, diplomadoId]);

  // Cargar disponibilidad y configuraciones de exámenes para el diplomado matriculado
  useEffect(() => {
    if (!codigoDipActual) return;
    fetch(`/api/dashboard/examenes?codigoDiplomado=${encodeURIComponent(codigoDipActual)}&accion=disponibilidad`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.modulosConPreguntas)) {
          setModulosConExamenDisponibles(d.modulosConPreguntas);
        }
        if (d.success && d.configsPorModulo && typeof d.configsPorModulo === 'object') {
          setConfigsModulosMap(d.configsPorModulo);
        }
      })
      .catch(err => console.warn('Error al verificar modulos con examen:', err));
  }, [codigoDipActual]);

  // Hidratar notas guardadas directamente desde public.notas_modulos en Supabase
  useEffect(() => {
    if (loading) return;
    if (!codigoDipActual || !dniAlumno) {
      setIntentosCargados(true);
      return;
    }
    fetch(`/api/dashboard/examenes?codigoDiplomado=${encodeURIComponent(codigoDipActual)}&dni=${encodeURIComponent(dniAlumno)}&accion=mis_intentos`)
      .then(r => r.json())
      .then(d => {
        if (d.success && Array.isArray(d.intentos) && d.intentos.length > 0) {
          setNotasModulosMap(prev => {
            const next = { ...prev };
            d.intentos.forEach((it: any) => {
              const notaNum = Number(it.nota ?? 0);
              const modNum = Number(it.modulo_numero || 0);
              if (modNum > 0) {
                const modKey = `MÓDULO ${modNum.toString().padStart(2, '0')}`;
                if (next[modKey] === undefined) next[modKey] = notaNum;
              }
              if (it.modulo_nombre && next[it.modulo_nombre] === undefined) {
                next[it.modulo_nombre] = notaNum;
              }
            });
            return next;
          });
        }
      })
      .catch(err => console.warn('Error al cargar intentos previos del diplomado:', err))
      .finally(() => setIntentosCargados(true));
  }, [loading, codigoDipActual, dniAlumno]);

  const esModuloConExamenDisponible = useCallback((modCodigo: string) => {
    if (!modulosConExamenDisponibles || modulosConExamenDisponibles.length === 0) {
      return false;
    }
    const norm = modCodigo.toLowerCase().replace('ó', 'o');
    return modulosConExamenDisponibles.some(m => m.toLowerCase().replace('ó', 'o').includes(norm));
  }, [modulosConExamenDisponibles]);

  // Contador de tiempo regresivo para el examen
  useEffect(() => {
    if (pasoModalExamen !== 'cuestionario' || cargandoPreguntasExamen || guardandoExamen) {
      return;
    }

    const interval = setInterval(() => {
      setTiempoRestanteSegundos(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Tiempo agotado: entregar y calificar automáticamente en el estado en que se encuentre
          rendirExamenModulo();
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

  // Generador de 5 preguntas objetivas por módulo
  const generarPreguntasExamenModulo = (modCodigo: string, modNombre: string) => {
    return [
      {
        id: 1,
        pregunta: `¿Cuál es el marco regulatorio y técnico fundamental abordado en ${modNombre}?`,
        opciones: [
          'Reglamentos y estándares técnicos de cumplimiento obligatorio en el sector',
          'Directivas informativas sin carácter vinculante',
          'Manuales de usuario informáticos sin impacto legal',
          'Protocolos internacionales no aplicables a la gestión nacional'
        ],
        respuestaCorrecta: 0
      },
      {
        id: 2,
        pregunta: `En la evaluación técnica de ${modNombre}, ¿qué criterio es prioritario?`,
        opciones: [
          'Desestimar los reportes de campo y priorizar la rapidez',
          'Análisis integral de riesgos y cumplimiento de estándares de calidad y seguridad',
          'Considerar únicamente los costos de inversión inicial',
          'Omitir los procedimientos de fiscalización'
        ],
        respuestaCorrecta: 1
      },
      {
        id: 3,
        pregunta: `¿Qué herramienta o procedimiento se aplica para garantizar la eficiencia operacional en ${modNombre}?`,
        opciones: [
          'Monitoreo continuo de indicadores KPI y auditoría de procesos',
          'Registro manual informal en hojas sueltas',
          'Inspecciones aleatorias sin periodicidad ni formato',
          'Estimaciones empíricas sin sustento técnico'
        ],
        respuestaCorrecta: 0
      },
      {
        id: 4,
        pregunta: `¿Cuál es el objetivo principal del análisis de casuística práctica en ${modNombre}?`,
        opciones: [
          'Cumplir con una formalidad documental',
          'Resolver escenarios reales mediante la aplicación directa de normativas y estándares',
          'Generar archivos administrativos de almacenamiento',
          'Evitar el uso de metodologías modernas de gestión'
        ],
        respuestaCorrecta: 1
      },
      {
        id: 5,
        pregunta: `Para lograr la aprobación del módulo en ${modNombre}, ¿cuál es la nota mínima requerida sobre 20?`,
        opciones: [
          'Nota mínima de 08 / 20',
          'Nota mínima de 10 / 20',
          'Nota mínima aprobatoria de 12 / 20',
          'Nota mínima de 18 / 20'
        ],
        respuestaCorrecta: 2
      }
    ];
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

  const abrirModalExamen = async (modCodigo: string, modNombre: string, modIdx: number) => {
    if (!esModuloConExamenDisponible(modCodigo) && notasModulosMap[modCodigo] === undefined) {
      return;
    }

    setExamenActivoModal({ moduloCodigo: modCodigo, moduloNombre: modNombre, moduloIdx: modIdx });
    setPasoModalExamen('indicaciones');
    setRespuestasExamen({});
    setRespuestasExamenDinamicas({});
    setPreguntasExamenDinamicas([]);
    setResultadoExamen(null);
    setTiempoRegistroExamen({ inicio: null, fin: null });
    setDetallesCalificacionExamen(null);
    setMostrarRetroalimentacion(false);
    setConfigExamenActivo(null);
    fechaInicioExamenRef.current = null;
    setTiempoRestanteSegundos(30 * 60);
    scrollExamenArriba();

    // Cargar configuración oficial y verificar si ya agotó intentos en notas_modulos
    try {
      setCargandoConfigExamen(true);
      const res = await fetch(
        `/api/dashboard/examenes?codigoDiplomado=${encodeURIComponent(codigoDipActual)}&modulo=${encodeURIComponent(modCodigo)}&dni=${encodeURIComponent(dniAlumno || '71234567')}&accion=ver_intento`
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
        setNotasModulosMap(prev => ({ ...prev, [modCodigo]: notaGuardada }));
        setDetallesCalificacionExamen(data.intento.detalles_examen || null);
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
      console.error('Error al cargar configuración de examen:', err);
    } finally {
      setCargandoConfigExamen(false);
    }
  };

  // Iniciar cuestionario: mantiene la barra superior y carga las preguntas en la segunda parte
  const comenzarExamenModulo = async () => {
    if (!examenActivoModal) return;
    const modCodigo = examenActivoModal.moduloCodigo;
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
        `/api/dashboard/examenes?codigoDiplomado=${encodeURIComponent(codigoDipActual)}&modulo=${encodeURIComponent(modCodigo)}&dni=${encodeURIComponent(dniAlumno || '71234567')}`
      );
      const data = await res.json();
      if (data.config) {
        setConfigExamenActivo(data.config);
        const minutos = data.config.tiempo_minutos || 30;
        setTiempoRestanteSegundos(minutos * 60);
      }
      if (data.intentoAgotado && data.intento) {
        const notaGuardada = Number(data.intento.nota ?? 0);
        setNotasModulosMap(prev => ({ ...prev, [modCodigo]: notaGuardada }));
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
      if (data.success && data.preguntas && data.preguntas.length > 0) {
        fechaInicioExamenRef.current = new Date().toISOString();
        setPreguntasExamenDinamicas(data.preguntas);
      } else {
        setPreguntasExamenDinamicas([]);
      }
    } catch (err) {
      console.error('Error al cargar preguntas de examen:', err);
      setPreguntasExamenDinamicas([]);
    } finally {
      setCargandoPreguntasExamen(false);
    }
  };

  const abrirVerIntento = async (modCodigo: string, modNombre: string, modIdx: number) => {
    setExamenActivoModal({ moduloCodigo: modCodigo, moduloNombre: modNombre, moduloIdx: modIdx });
    setPasoModalExamen('ver_intento');
    setMostrarRetroalimentacion(false);
    const nota = notasModulosMap[modCodigo] || 0;
    setResultadoExamen({ nota, aprobado: nota >= (configExamenActivo?.nota_minima ?? 12) });
    setTiempoRegistroExamen({ inicio: null, fin: null });
    setDetallesCalificacionExamen(null);
    scrollExamenArriba();

    try {
      setCargandoRetroalimentacion(true);
      const res = await fetch(`/api/dashboard/examenes?codigoDiplomado=${encodeURIComponent(codigoDipActual)}&modulo=${encodeURIComponent(modCodigo)}&dni=${encodeURIComponent(dniAlumno || '71234567')}&accion=ver_intento`);
      const data = await res.json();
      if (data.config) {
        setConfigExamenActivo(data.config);
        setResultadoExamen({ nota, aprobado: nota >= (data.config.nota_minima ?? 12) });
      }
      if (data.intento && data.intento.nota !== undefined && data.intento.nota !== null) {
        const n = Number(data.intento.nota);
        setNotasModulosMap(prev => (prev[modCodigo] === n ? prev : { ...prev, [modCodigo]: n }));
        setResultadoExamen({ nota: n, aprobado: n >= (data.config?.nota_minima ?? 12) });
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
  };

  const rendirExamenModulo = async () => {
    if (!examenActivoModal) return;

    setGuardandoExamen(true);
    try {
      const modCodigo = examenActivoModal.moduloCodigo;
      const codDip = codigoDipActual;
      const preguntasActuales = preguntasExamenRef.current;
      const respuestasActuales = respuestasExamenRef.current;
      const respuestasCompletas: Record<string, number[]> = {};
      preguntasActuales.forEach(q => {
        respuestasCompletas[q.id] = respuestasActuales[q.id] || [];
      });

      // Llamar al endpoint de calificación de examen
      const resCalificacion = await fetch('/api/dashboard/examenes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          codigoDiplomado: codDip,
          modulo: modCodigo,
          dni: dniAlumno || '71234567',
          fechaInicio: fechaInicioExamenRef.current,
          respuestasUsuario: Object.keys(respuestasCompletas).length > 0 ? respuestasCompletas : respuestasActuales
        })
      });

      const dataCalificacion = await resCalificacion.json();
      if (dataCalificacion.intentoAgotado && dataCalificacion.intento) {
        const notaGuardada = Number(dataCalificacion.intento.nota ?? 0);
        setNotasModulosMap(prev => ({ ...prev, [modCodigo]: notaGuardada }));
        setDetallesCalificacionExamen(dataCalificacion.intento.detalles_examen || null);
        setTiempoRegistroExamen({
          inicio: dataCalificacion.intento.fecha_inicio || null,
          fin: dataCalificacion.intento.fecha_fin || dataCalificacion.intento.updated_at || null
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

      let notaFinal = 0;
      let aprobado = false;
      let detalles = null;

      if (dataCalificacion.success && dataCalificacion.resultado) {
        notaFinal = dataCalificacion.resultado.nota;
        aprobado = dataCalificacion.resultado.aprobado;
        detalles = dataCalificacion.resultado.detalles;
        setDetallesCalificacionExamen(detalles);
        setTiempoRegistroExamen({
          inicio: dataCalificacion.resultado.fechaInicio || fechaInicioExamenRef.current || null,
          fin: dataCalificacion.resultado.fechaFin || new Date().toISOString()
        });
      } else {
        // Fallback local en caso de error
        let aciertos = 0;
        preguntasActuales.forEach((q) => {
          const resp = respuestasActuales[q.id];
          if (resp && resp.length > 0) aciertos++;
        });
        notaFinal = Math.min(20, Math.round((aciertos * (20 / Math.max(1, preguntasActuales.length)))));
        aprobado = notaFinal >= (configExamenActivo?.nota_minima ?? 12);
        setTiempoRegistroExamen({
          inicio: fechaInicioExamenRef.current || null,
          fin: new Date().toISOString()
        });
      }

      const nuevoNotasMap = { ...notasModulosMap, [modCodigo]: notaFinal };
      setNotasModulosMap(nuevoNotasMap);

      const nuevoCompletadosMap = { ...completadosMap };
      if (aprobado) {
        nuevoCompletadosMap[modCodigo] = true;
        setCompletadosMap(nuevoCompletadosMap);
      }

      setResultadoExamen({ nota: notaFinal, aprobado });
      setMostrarRetroalimentacion(false);
      setPasoModalExamen('resultado');
      scrollExamenArriba();

      // Recalcular el porcentaje de avance granular
      let totalClases = 0;
      let clasesCompletadas = 0;
      if (diplomadoActual && diplomadoActual.modulos) {
        diplomadoActual.modulos.forEach((m: any) => {
          m.clases.forEach((c: any) => {
            totalClases++;
            const isDone = nuevoCompletadosMap[c.id] !== undefined 
              ? nuevoCompletadosMap[c.id] 
              : (nuevoCompletadosMap[m.codigo] !== undefined ? nuevoCompletadosMap[m.codigo] : c.completada);
            if (isDone) clasesCompletadas++;
          });
        });
      }
      const nuevoAvance = totalClases > 0 ? Math.round((clasesCompletadas / totalClases) * 100) : 0;

      // Guardar en Supabase via API completar-leccion
      await fetch('/api/dashboard/completar-leccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diplomadoSlug: diplomadoId,
          diplomadoTitulo: diplomadoActual?.titulo,
          moduloId: modCodigo,
          moduloNombre: examenActivoModal.moduloNombre,
          moduloIndex: examenActivoModal.moduloIdx,
          nota: notaFinal,
          rendido: true,
          completado: aprobado,
          completadosMap: nuevoCompletadosMap,
          avancePorcentaje: nuevoAvance,
          dni: dniAlumno || '71234567'
        })
      });
    } catch (err) {
      console.error('Error al calificar y guardar examen:', err);
    } finally {
      setGuardandoExamen(false);
    }
  };

  // Cargar datos de Supabase (/api/dashboard/me, /api/admin/catalogo y /api/admin/diplomados-lecciones)
  const cargarDatosSupabase = useCallback(async () => {
    try {
      setLoading(true);
      const [meRes, catRes, leccRes] = await Promise.all([
        fetch('/api/dashboard/me').catch(() => null),
        fetch('/api/admin/catalogo').catch(() => null),
        fetch(`/api/admin/diplomados-lecciones?slug=${encodeURIComponent(diplomadoId)}`).catch(() => null)
      ]);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        const profile = meData.profile || meData;
        if (profile?.dni_ce || profile?.dni) setDniAlumno(profile.dni_ce || profile.dni);
        const diplomados = Array.isArray(profile?.diplomados_json) && profile.diplomados_json.length > 0
          ? profile.diplomados_json
          : parseDiplomadosFromProfile(profile);
        
        // Buscar el diplomado actual en el perfil del alumno
        const targetSlugNorm = diplomadoId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const dipEnPerfil = Array.isArray(diplomados) 
          ? diplomados.find((d: any) =>
              (d.slug || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm ||
              (d.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm ||
              (d.codigo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm ||
              (d.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm
            )
          : null;

        if (dipEnPerfil) {
          const map: Record<string, boolean> = {};
          const nMap: Record<string, number> = {};

          if (dipEnPerfil.completadosMap && typeof dipEnPerfil.completadosMap === 'object') {
            Object.assign(map, dipEnPerfil.completadosMap);
          }
          if (Array.isArray(dipEnPerfil.modulos)) {
            dipEnPerfil.modulos.forEach((m: any, idx: number) => {
              const modKeyEstandar = formatearCodigoModulo(m.codigo || m.id, idx);
              const key = m.codigo || m.id || modKeyEstandar;
              if (map[key] === undefined && m.completado !== undefined) {
                map[key] = Boolean(m.completado);
              }
              if (map[modKeyEstandar] === undefined && m.completado !== undefined) {
                map[modKeyEstandar] = Boolean(m.completado);
              }
              if (m.nota !== undefined && m.nota !== null && (m.rendido === true || m.nota > 0)) {
                const notaNum = Number(m.nota);
                nMap[key] = notaNum;
                nMap[modKeyEstandar] = notaNum;
              }
            });
          }
          setCompletadosMap(map);
          setNotasModulosMap(prev => ({ ...prev, ...nMap }));
        } else {
          setCompletadosMap({});
        }
      }

      if (leccRes && leccRes.ok) {
        const leccData = await leccRes.json();
        if (leccData && Array.isArray(leccData.filas) && leccData.filas.length > 0) {
          setLeccionesTabla(leccData.filas);
        }
      }

      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        const todos = catData.diplomados || catData.cursos || catData.todos || [];
        const targetSlugNorm = diplomadoId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const catItem = todos.find((c: any) => 
          c.id === diplomadoId || 
          (c.codigo && c.codigo.toLowerCase() === diplomadoId.toLowerCase()) ||
          (c.titulo && c.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm) ||
          (c.titulo && c.titulo.toLowerCase().includes(targetSlugNorm))
        );
        if (catItem) {
          setCatalogoMateriales(catItem);
        }
      }
    } catch (e) {
      console.error('Error al cargar datos de Supabase:', e);
    } finally {
      setLoading(false);
    }
  }, [diplomadoId]);

  useEffect(() => {
    accionExamenProcesadaRef.current = false;
    setIntentosCargados(false);
    setCompletadosMap({});
    setNotasModulosMap({});
    cargarDatosSupabase();
  }, [diplomadoId, cargarDatosSupabase]);

  // Generar datos combinados con el diplomado base
  const diplomadoActual = useMemo(() => {
    const dip = getDiplomadoBySlug(diplomadoId) || getDiplomadoBySlug('derecho-minero');
    const tituloBase = dip?.titulo || diplomadoId.toUpperCase().replace(/-/g, ' ');
    
    let totalClasesContadas = 0;
    let clasesCompletadasContadas = 0;
    let contadorGlobalTemas = 1;
    let contadorGlobalClases = 1;

    // 1. PRIORIDAD: Usar datos de la tabla lecciones de Supabase si existen
    if (leccionesTabla && leccionesTabla.length > 0) {
      const modulosDeTabla = convertirFilasAListaModulos(leccionesTabla);

      const modulosProcesados = modulosDeTabla.map((mod: any, modIdx: number) => {
        const modCodigoKey = formatearCodigoModulo(mod.codigo, modIdx);
        const esModuloCompletadoEnBD = Boolean(completadosMap[modCodigoKey]);

        const temasProcesados = (mod.temas || []).map((tObj: any, tIdx: number) => {
          const numTema = contadorGlobalTemas++;
          const numTemaStr = numTema < 10 ? `0${numTema}` : `${numTema}`;
          const rawTitulo = tObj.titulo || `Tema ${numTemaStr}`;
          const temaLimpio = rawTitulo
            .replace(/^Tema\s*\d+[:\-\s]*/i, '')
            .replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '')
            .trim();
          const temaTituloFinal = `Tema ${numTemaStr}: ${temaLimpio}`;
          const rawTemaClases = Array.isArray(tObj.clases) ? tObj.clases : [];

          const temaClases: ClaseCompleta[] = rawTemaClases.map((claseRow: any, claseIdx: number) => {
            const numClase = contadorGlobalClases++;
            const isObj = typeof claseRow === 'object' && claseRow !== null;
            const rawClaseTitle = isObj ? (claseRow.titulo || claseRow.Sesion || `Clase ${numClase}`) : String(claseRow);
            let claseTitle = rawClaseTitle.replace(/\s*\(\d{1,2}\/\d{1,2}\)/g, '').trim();

            if (rawTemaClases.length > 1 && (claseTitle.toLowerCase() === temaLimpio.toLowerCase() || /^Clase\s*\d+/i.test(claseTitle) || /^Sesión\s*\d+/i.test(claseTitle))) {
              claseTitle = `Parte ${claseIdx + 1}`;
            }

            const claseId = `${modCodigoKey}-t${tIdx + 1}-c${claseIdx + 1}`;
            const videoUrlFromTable = isObj ? (claseRow.VideoUrl || claseRow.videoUrl || claseRow.iframe_url) : null;
            const driveVideoUrl = videoUrlFromTable || (getDriveVideoForClass(diplomadoId, modIdx, totalClasesContadas) || 'https://www.youtube.com/embed/dQw4w9WgXcQ');

            totalClasesContadas++;

            const esCompletada = Boolean(
              completadosMap[claseId] !== undefined
                ? completadosMap[claseId]
                : (esModuloCompletadoEnBD && completadosMap[claseId] !== false)
            );
            if (esCompletada) clasesCompletadasContadas++;

            const recursos = isObj ? obtenerRecursosConLinks(claseRow, numClase) : [];

            const rawTextoResumen = (isObj ? (claseRow.resumenTexto || claseRow.ResumenTexto) : null) 
              || (isObj && claseRow.id ? (resumenesCacheJson as Record<string, any>)[claseRow.id]?.markdown : null);
            const resumenData = parsearResumenTexto(rawTextoResumen);

            const partes: ParteClase[] = [
              {
                id: `${claseId}-p1`,
                numero: 1,
                titulo: `Sesión Completa`,
                subtitulo: claseTitle,
                duracion: '60 min',
                videoUrl: driveVideoUrl,
                completada: esCompletada,
                resumen: resumenData,
                recursos
              }
            ];

            return {
              id: claseId,
              numeroClase: numClase,
              tituloClase: claseTitle.startsWith('Clase') ? claseTitle : `CLASE ${numClase}: ${claseTitle}`,
              moduloCodigo: modCodigoKey,
              moduloTitulo: `${modCodigoKey}: ${mod.nombre || ''}`,
              completada: esCompletada,
              partes
            };
          });

          return {
            id: `${modCodigoKey}-t${tIdx + 1}`,
            titulo: temaTituloFinal,
            clases: temaClases
          };
        });

        const clasesAdicionalesProcesadas: ClaseCompleta[] = (mod.clasesAdicionales || []).map((caRow: any, cIdx: number) => {
          const numClase = contadorGlobalClases++;
          const isObj = typeof caRow === 'object' && caRow !== null;
          const claseTitle = isObj ? (caRow.titulo || caRow.Sesion || `Clase Adicional`) : String(caRow);
          const claseId = `${modCodigoKey}-adic-${cIdx + 1}`;
          const videoUrlFromTable = isObj ? (caRow.VideoUrl || caRow.videoUrl || caRow.iframe_url) : null;
          const driveVideoUrl = videoUrlFromTable || (getDriveVideoForClass(diplomadoId, modIdx, totalClasesContadas) || 'https://www.youtube.com/embed/dQw4w9WgXcQ');

          totalClasesContadas++;

          const esCompletada = Boolean(
            completadosMap[claseId] !== undefined
              ? completadosMap[claseId]
              : (esModuloCompletadoEnBD && completadosMap[claseId] !== false)
          );
          if (esCompletada) clasesCompletadasContadas++;

          const recursos = isObj ? obtenerRecursosConLinks(caRow, numClase) : [];

          const rawTextoResumen = (isObj ? (caRow.resumenTexto || caRow.ResumenTexto) : null) 
            || (isObj && caRow.id ? (resumenesCacheJson as Record<string, any>)[caRow.id]?.markdown : null);
          const resumenData = parsearResumenTexto(rawTextoResumen);

          const partes: ParteClase[] = [
            {
              id: `${claseId}-p1`,
              numero: 1,
              titulo: `Sesión Completa`,
              subtitulo: claseTitle,
              duracion: '60 min',
              videoUrl: driveVideoUrl,
              completada: esCompletada,
              resumen: resumenData,
              recursos
            }
          ];

          return {
            id: claseId,
            numeroClase: numClase,
            tituloClase: `⭐ ${claseTitle}`,
            moduloCodigo: modCodigoKey,
            moduloTitulo: `${modCodigoKey}: ${mod.nombre || ''}`,
            completada: esCompletada,
            partes
          };
        });

        const todasClasesModulo = [
          ...temasProcesados.flatMap((t: any) => t.clases),
          ...clasesAdicionalesProcesadas
        ];

        return {
          id: modCodigoKey,
          codigo: modCodigoKey,
          nombre: mod.nombre,
          docente: mod.docente || '',
          temas: temasProcesados,
          clasesAdicionales: clasesAdicionalesProcesadas,
          clases: todasClasesModulo,
          completado: esModuloCompletadoEnBD || (todasClasesModulo.length > 0 && todasClasesModulo.every(c => c.completada))
        };
      });

      const avancePorcentaje = totalClasesContadas > 0
        ? Math.round((clasesCompletadasContadas / totalClasesContadas) * 100)
        : 0;

      return {
        id: diplomadoId,
        codigo: leccionesTabla[0]?.CodigoDiplomado || codigoDipActual,
        titulo: (leccionesTabla[0]?.Diplomado || tituloBase).toUpperCase(),
        avancePorcentaje,
        progreso: avancePorcentaje,
        modulos: modulosProcesados
      };
    }

    const baseModulos = dip?.modulos || [];
    const modulosInput = catalogoMateriales?.modulos?.length ? catalogoMateriales.modulos : baseModulos;

    const modulosRaw = modulosInput.map((mod: any, mIdx: number) => {
      const baseMod = baseModulos[mIdx] || {};
      const temasCombinados = (Array.isArray(mod.temas) && mod.temas.length > 0)
        ? mod.temas
        : (Array.isArray(baseMod.temas) && baseMod.temas.length > 0 ? baseMod.temas : null);

      return {
        ...mod,
        temas: temasCombinados
      };
    });

    totalClasesContadas = 0;
    clasesCompletadasContadas = 0;
    contadorGlobalTemas = 1;
    contadorGlobalClases = 1;

    const modulosProcesados = modulosRaw.map((mod: any, modIdx: number) => {
      const modCodigoKey = formatearCodigoModulo(mod.codigo, modIdx);
      const esModuloCompletadoEnBD = Boolean(completadosMap[modCodigoKey]);

      // Normalizar e igualar estructura de temas para TODOS los diplomados
      let rawTemasInput = Array.isArray(mod.temas) && mod.temas.length > 0 ? mod.temas : null;

      if (!rawTemasInput) {
        const rawClasesList = Array.isArray(mod.clases) && mod.clases.length > 0 
          ? mod.clases 
          : ['Sesión Magistral de Introducción', 'Casuística Aplicada'];
        
        let hasExplicitOrRepeatingTema = false;
        const temaNamesSeen: string[] = [];

        rawClasesList.forEach((cItem: any) => {
          const isObj = typeof cItem === 'object' && cItem !== null;
          const tName = isObj ? (cItem.tema || cItem.titulo || '') : String(cItem);
          const cleanName = tName.replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '').replace(/\s*\(Parte\s*\d+\)$/i, '').trim();
          if (isObj && cItem.tema) hasExplicitOrRepeatingTema = true;
          if (cleanName && temaNamesSeen.includes(cleanName.toLowerCase())) hasExplicitOrRepeatingTema = true;
          if (cleanName) temaNamesSeen.push(cleanName.toLowerCase());
        });

        rawTemasInput = [];

        if (hasExplicitOrRepeatingTema) {
          let currentGroup: { titulo: string; clases: any[] } | null = null;
          rawClasesList.forEach((cItem: any) => {
            const isObj = typeof cItem === 'object' && cItem !== null;
            const rawTit = isObj ? (cItem.tema || cItem.titulo || '') : String(cItem);
            const temaLimpio = rawTit.replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '').replace(/\s*\(Parte\s*\d+\)$/i, '').trim();

            if (currentGroup && currentGroup.titulo.toLowerCase() === temaLimpio.toLowerCase()) {
              currentGroup.clases.push(cItem);
            } else {
              currentGroup = {
                titulo: temaLimpio || 'Especialización Aplicada',
                clases: [cItem]
              };
              rawTemasInput.push(currentGroup);
            }
          });
        } else {
          for (let i = 0; i < rawClasesList.length; i += 2) {
            const chunk = rawClasesList.slice(i, i + 2);
            const firstItem = chunk[0];
            const firstClaseTitle = typeof firstItem === 'string'
              ? firstItem.replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '').trim()
              : (firstItem?.titulo || 'Especialización Aplicada');

            const tNum = Math.floor(i / 2) + 1;
            const tNumGlobal = (modIdx * 3) + tNum;
            const tNumStr = tNumGlobal < 10 ? `0${tNumGlobal}` : `${tNumGlobal}`;

            rawTemasInput.push({
              titulo: `Tema ${tNumStr}: ${firstClaseTitle || 'Fundamentos y Gestión Aplicada'}`,
              clases: chunk
            });
          }
        }
      }

      const temasProcesados = rawTemasInput.map((tObj: any, tIdx: number) => {
        const numTema = contadorGlobalTemas++;
        const numTemaStr = numTema < 10 ? `0${numTema}` : `${numTema}`;
        const rawTitulo = tObj.titulo || `Tema ${numTemaStr}`;
        const temaLimpio = rawTitulo
          .replace(/^Tema\s*\d+[:\-\s]*/i, '')
          .replace(/^(Clase|CLASE|Sesión|SESIÓN)\s*\d+[:\-\s]*/i, '')
          .trim();
        const temaTituloFinal = `Tema ${numTemaStr}: ${temaLimpio}`;
        const temaClean = temaLimpio;

        const rawTemaClases = Array.isArray(tObj.clases) ? tObj.clases : [];
        const isMultiSession = rawTemaClases.length > 1;

        const temaClases: ClaseCompleta[] = rawTemaClases.map((claseTitleStr: any, claseIdx: number) => {
          const numClase = contadorGlobalClases++;
          const isObj = typeof claseTitleStr === 'object' && claseTitleStr !== null;
          const rawClaseTitle = isObj ? (claseTitleStr.titulo || `Clase ${numClase}`) : String(claseTitleStr);
          let claseTitle = rawClaseTitle.replace(/\s*\(\d{1,2}\/\d{1,2}\)/g, '').trim();

          if (isMultiSession && (claseTitle.toLowerCase() === temaClean.toLowerCase() || /^Clase\s*\d+/i.test(claseTitle) || /^Sesión\s*\d+/i.test(claseTitle))) {
            claseTitle = `Parte ${claseIdx + 1}`;
          }
          const claseId = `${modCodigoKey}-t${tIdx + 1}-c${claseIdx + 1}`;
          const driveVideoUrl = isObj && (claseTitleStr.videoUrl || claseTitleStr.iframe_url)
            ? (claseTitleStr.videoUrl || claseTitleStr.iframe_url)
            : (getDriveVideoForClass(diplomadoId, modIdx, totalClasesContadas) || mod.videoUrl);
          const videoUrlFromCatalog = driveVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
          const pdfUrlFromCatalog = isObj ? (claseTitleStr.pdfUrl || claseTitleStr.pdf_url) : mod.pdfUrl;
          const excelUrlFromCatalog = isObj ? (claseTitleStr.excelUrl || claseTitleStr.excel_url) : mod.excelUrl;

          totalClasesContadas++;

          const esCompletada = Boolean(
            completadosMap[claseId] !== undefined
              ? completadosMap[claseId]
              : (esModuloCompletadoEnBD && completadosMap[claseId] !== false)
          );
          if (esCompletada) clasesCompletadasContadas++;

          const partes: ParteClase[] = [
            {
              id: `${claseId}-p1`,
              numero: 1,
              titulo: `Sesión Completa`,
              subtitulo: claseTitle,
              duracion: '60 min',
              videoUrl: videoUrlFromCatalog,
              completada: esCompletada,
              resumen: null,
              recursos: isObj 
                ? obtenerRecursosConLinks(claseTitleStr, numClase) 
                : (pdfUrlFromCatalog ? [{
                    id: `rec-${claseId}-pdf`,
                    tipo: 'pdf' as const,
                    titulo: 'Material de clases',
                    descripcion: 'Documento oficial con contenidos y diapositivas de la sesión · PDF',
                    archivo: pdfUrlFromCatalog,
                    url: pdfUrlFromCatalog
                  }] : [])
            }
          ];

          return {
            id: claseId,
            numeroClase: numClase,
            tituloClase: claseTitle.startsWith('Clase') ? claseTitle : `CLASE ${numClase}: ${claseTitle}`,
            moduloCodigo: modCodigoKey,
            moduloTitulo: `${modCodigoKey}: ${mod.nombre || mod.titulo || ''}`,
            completada: esCompletada,
            partes
          };
        });

        return {
          id: `${modCodigoKey}-t${tIdx + 1}`,
          titulo: temaTituloFinal,
          clases: temaClases
        };
      });

      // Clases adicionales (presentes en todos los módulos de forma uniforme)
      let rawAdicionalesInput = Array.isArray(mod.clasesAdicionales) ? mod.clasesAdicionales : [];
      if (rawAdicionalesInput.length === 0) {
        rawAdicionalesInput = [
          {
            titulo: 'Clase Adicional: Sesión Especial de Refuerzo y Casuística Práctica',
            videoUrl: getDriveVideoForClass(diplomadoId, modIdx, 6) || mod.videoUrl
          }
        ];
      }

      let clasesAdicionalesProcesadas: ClaseCompleta[] = [];
      if (rawAdicionalesInput.length > 0) {
        clasesAdicionalesProcesadas = rawAdicionalesInput.map((claseTitleStr: any, cIdx: number) => {
          const numClase = contadorGlobalClases++;
          const claseTitle = typeof claseTitleStr === 'string' ? claseTitleStr : (claseTitleStr.titulo || `Clase Adicional`);
          const claseId = `${modCodigoKey}-adic-${cIdx + 1}`;
          const driveVideoUrl = typeof claseTitleStr === 'object' && claseTitleStr.videoUrl 
            ? claseTitleStr.videoUrl 
            : (getDriveVideoForClass(diplomadoId, modIdx, totalClasesContadas) || mod.videoUrl);
          const videoUrlFromCatalog = driveVideoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ';
          const pdfUrlFromCatalog = typeof claseTitleStr === 'object' ? claseTitleStr.pdfUrl : mod.pdfUrl;
          const excelUrlFromCatalog = typeof claseTitleStr === 'object' ? claseTitleStr.excelUrl : mod.excelUrl;

          totalClasesContadas++;

          const esCompletada = Boolean(
            completadosMap[claseId] !== undefined
              ? completadosMap[claseId]
              : (esModuloCompletadoEnBD && completadosMap[claseId] !== false)
          );
          if (esCompletada) clasesCompletadasContadas++;

          const partes: ParteClase[] = [
            {
              id: `${claseId}-p1`,
              numero: 1,
              titulo: `Sesión Completa`,
              subtitulo: claseTitle,
              duracion: '60 min',
              videoUrl: videoUrlFromCatalog,
              completada: esCompletada,
              resumen: null,
              recursos: typeof claseTitleStr === 'object' 
                ? obtenerRecursosConLinks(claseTitleStr, numClase)
                : (pdfUrlFromCatalog ? [{
                    id: `rec-${claseId}-pdf`,
                    tipo: 'pdf' as const,
                    titulo: 'Material de clases',
                    descripcion: 'Documento oficial con contenidos y diapositivas de la sesión · PDF',
                    archivo: pdfUrlFromCatalog,
                    url: pdfUrlFromCatalog
                  }] : [])
            }
          ];

          return {
            id: claseId,
            numeroClase: numClase,
            tituloClase: claseTitle.startsWith('Clase') ? claseTitle : `CLASE ${numClase}: ${claseTitle}`,
            moduloCodigo: modCodigoKey,
            moduloTitulo: `${modCodigoKey}: ${mod.nombre || mod.titulo || ''}`,
            completada: esCompletada,
            partes
          };
        });
      }

      const todasLasClasesDelModulo: ClaseCompleta[] = [
        ...temasProcesados.flatMap((t: any) => t.clases),
        ...clasesAdicionalesProcesadas
      ];

      return {
        id: modCodigoKey,
        codigo: modCodigoKey,
        nombre: mod.nombre || mod.titulo || modCodigoKey,
        titulo: `${modCodigoKey}: ${mod.nombre || ''}`,
        clases: todasLasClasesDelModulo,
        temas: temasProcesados,
        clasesAdicionales: clasesAdicionalesProcesadas,
        completado: esModuloCompletadoEnBD
      };
    });

    const avancePorcentaje = totalClasesContadas > 0 
      ? Math.round((clasesCompletadasContadas / totalClasesContadas) * 100) 
      : 0;

    return {
      titulo: tituloBase,
      avancePorcentaje,
      progreso: avancePorcentaje,
      modulos: modulosProcesados
    };
  }, [diplomadoId, catalogoMateriales, completadosMap, leccionesTabla]);

  useEffect(() => {
    if (diplomadoActual?.titulo) {
      document.title = `${diplomadoActual.titulo} | EDUMIN`;
    }
  }, [diplomadoActual?.titulo]);

  const modInicial = useMemo(() => {
    if (!diplomadoActual?.modulos?.length) return null;
    if (!moduloQuery) return diplomadoActual.modulos[0];

    const queryNorm = moduloQuery.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const queryNum = queryNorm.replace(/[^0-9]/g, '');

    const found = diplomadoActual.modulos.find((m: any, idx: number) => {
      if (m.id === moduloQuery || m.codigo === moduloQuery) return true;
      const idNorm = (m.id || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      const codNorm = (m.codigo || '').toLowerCase().replace(/[^a-z0-9]+/g, '');
      if (idNorm === queryNorm || codNorm === queryNorm) return true;

      const modNum = String(idx + 1);
      if (queryNum && (queryNum === modNum || queryNum === modNum.padStart(2, '0'))) return true;

      return false;
    });

    return found || diplomadoActual.modulos[0];
  }, [diplomadoActual, moduloQuery]);

  const claseInicial = useMemo(() => {
    return modInicial?.clases?.[0] || null;
  }, [modInicial]);

  // Estados de navegación
  const [moduloActivo, setModuloActivo] = useState<string>(modInicial?.id || '');
  const [claseActual, setClaseActual] = useState<ClaseCompleta | null>(claseInicial);
  const [parteSeleccionada, setParteSeleccionada] = useState<number>(1);

  // Tema activo determinado a partir de la clase actual
  const temaActual = useMemo(() => {
    if (!claseActual || !diplomadoActual) return null;
    for (const mod of diplomadoActual.modulos) {
      if (mod.temas) {
        for (const t of mod.temas) {
          if (t.clases.some((c: ClaseCompleta) => c.id === claseActual.id)) {
            return t;
          }
        }
      }
    }
    return null;
  }, [claseActual, diplomadoActual]);

  // Estados de contenido principal y pestañas
  const [contenidoPrincipal, setContenidoPrincipal] = useState<'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo' | 'mapamental'>('video_clase');
  const [recursoActivoInfo, setRecursoActivoInfo] = useState<string>('Clase principal en video');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'recursos' | 'foro'>('resumen');
  const [menuFormatoAbierto, setMenuFormatoAbierto] = useState<boolean>(false);
  
  // Estados del foro
  const [comentario, setComentario] = useState('');
  const [listaComentarios, setListaComentarios] = useState<{ autor: string; texto: string; fecha: string }[]>([]);

  const [inicializadoNav, setInicializadoNav] = useState(false);

  // Sincronizar claseActual cuando diplomadoActual o modInicial se actualizan desde Supabase
  useEffect(() => {
    if (!diplomadoActual || !diplomadoActual.modulos?.length) return;

    // Si ya tenemos una claseActual, buscar su versión actualizada en el nuevo diplomadoActual
    if (claseActual) {
      for (const mod of diplomadoActual.modulos) {
        const found = mod.clases?.find((c: ClaseCompleta) => c.id === claseActual.id);
        if (found) {
          if (found !== claseActual) {
            setClaseActual(found);
          }
          return;
        }
      }
    }

    // Si no había claseActual o cambió el módulo vía URL, seleccionar la primera clase de modInicial
    const targetMod = modInicial || diplomadoActual.modulos[0];
    if (targetMod && targetMod.clases && targetMod.clases.length > 0) {
      setModuloActivo(targetMod.id);
      setClaseActual(targetMod.clases[0]);
      setParteSeleccionada(1);
      setInicializadoNav(true);
    }
  }, [diplomadoActual, modInicial, claseActual, moduloQuery]);

  // Si la URL viene con ?accion=examen, abrir automáticamente el examen una sola vez al cargar
  useEffect(() => {
    if (loading || !intentosCargados || accionExamenProcesadaRef.current) return;
    if (diplomadoActual && diplomadoActual.modulos) {
      const accion = searchParams.get('accion');
      if (accion === 'examen') {
        const targetMod = modInicial || diplomadoActual.modulos[0];
        if (targetMod) {
          accionExamenProcesadaRef.current = true;
          const idx = diplomadoActual.modulos.findIndex((m: any) => m.id === targetMod.id || m.codigo === targetMod.codigo);
          const modIdx = idx !== -1 ? idx : 0;
          const cod = targetMod.codigo || targetMod.id;
          if (notasModulosMap[cod] !== undefined) {
            abrirVerIntento(cod, targetMod.nombre, modIdx);
          } else {
            abrirModalExamen(cod, targetMod.nombre, modIdx);
          }
        }
      }
    }
  }, [loading, intentosCargados, diplomadoActual, modInicial, searchParams, notasModulosMap]);

  // Actualizar el título de la pestaña del navegador con el nombre del diplomado en mayúsculas
  useEffect(() => {
    if (diplomadoActual?.titulo) {
      document.title = diplomadoActual.titulo.toUpperCase();
    }
  }, [diplomadoActual?.titulo]);

  // Alternar estado completado de la lección y sincronizar con Supabase
  const toggleCompletarLeccion = async (targetId: string) => {
    try {
      setGuardandoAvance(true);
      const estadoActual = Boolean(completadosMap[targetId]);
      const nuevoEstado = !estadoActual;

      // Actualizar estado local inmediatamente
      const nuevoMap = { ...completadosMap, [targetId]: nuevoEstado };

      // Si targetId corresponde a un módulo completo, actualizar todas sus clases
      const modMatch = diplomadoActual?.modulos?.find((m: any) => m.codigo === targetId || m.id === targetId);
      if (modMatch && Array.isArray(modMatch.clases)) {
        modMatch.clases.forEach((c: any) => {
          nuevoMap[c.id] = nuevoEstado;
        });
      }

      setCompletadosMap(nuevoMap);

      // Recalcular el porcentaje de avance granular
      let totalClases = 0;
      let clasesCompletadas = 0;
      if (diplomadoActual && diplomadoActual.modulos) {
        diplomadoActual.modulos.forEach((m: any) => {
          m.clases.forEach((c: any) => {
            totalClases++;
            const isDone = nuevoMap[c.id] !== undefined 
              ? nuevoMap[c.id] 
              : (nuevoMap[m.codigo] !== undefined ? nuevoMap[m.codigo] : c.completada);
            if (isDone) clasesCompletadas++;
          });
        });
      }

      const nuevoAvance = totalClases > 0 ? Math.round((clasesCompletadas / totalClases) * 100) : 0;

      // Enviar actualización a la API en Supabase
      const response = await fetch('/api/dashboard/completar-leccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diplomadoSlug: diplomadoId,
          claseId: targetId,
          moduloId: targetId,
          completado: nuevoEstado,
          completadosMap: nuevoMap,
          avancePorcentaje: nuevoAvance,
          dni: '71234567'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error al actualizar lección:', errorData);
      }
    } catch (err) {
      console.error('Error de red al completar lección:', err);
    } finally {
      setGuardandoAvance(false);
    }
  };

  // Lista plana de todas las partes para navegación Secuencial
  const todasLasPartes = useMemo(() => {
    if (!diplomadoActual || !diplomadoActual.modulos) return [];
    const lista: { clase: ClaseCompleta; parte: ParteClase }[] = [];
    diplomadoActual.modulos.forEach((m: any) => {
      m.clases.forEach((c: ClaseCompleta) => {
        c.partes.forEach((p: ParteClase) => {
          lista.push({ clase: c, parte: p });
        });
      });
    });
    return lista;
  }, [diplomadoActual]);

  const parteActiva = useMemo(() => {
    if (!claseActual) return null;
    return claseActual.partes.find((p) => p.numero === parteSeleccionada) || claseActual.partes[0];
  }, [claseActual, parteSeleccionada]);

  // Determina si la clase actual tiene un resumen real asignado
  const tieneResumen = Boolean(
    parteActiva?.resumen?.parrafo || 
    (parteActiva?.resumen?.temasClave && parteActiva.resumen.temasClave.length > 0)
  );

  // Si la clase no tiene resumen y se estaba en la pestaña resumen, redirigir a recursos multimedia
  useEffect(() => {
    if (!tieneResumen && tabActiva === 'resumen') {
      setTabActiva('recursos');
    }
  }, [tieneResumen, tabActiva]);

  const tieneMultiplesPartes = (claseActual?.partes?.length ?? 0) > 1;

  const indiceActualPlano = useMemo(() => {
    if (!claseActual || !parteActiva) return -1;
    return todasLasPartes.findIndex(
      (item) => item.clase.id === claseActual.id && item.parte.numero === parteActiva.numero
    );
  }, [todasLasPartes, claseActual, parteActiva]);

  const itemAnterior = indiceActualPlano > 0 ? todasLasPartes[indiceActualPlano - 1] : null;
  const itemSiguiente = indiceActualPlano >= 0 && indiceActualPlano < todasLasPartes.length - 1 ? todasLasPartes[indiceActualPlano + 1] : null;

  // Lista plana de todos los temas para el contador de navegación
  const todosLosTemas = useMemo(() => {
    if (!diplomadoActual || !diplomadoActual.modulos) return [];
    const lista: { id: string; moduloCodigo: string; titulo: string; clases: ClaseCompleta[] }[] = [];
    diplomadoActual.modulos.forEach((m: any) => {
      if (Array.isArray(m.temas)) {
        m.temas.forEach((t: any) => {
          lista.push({
            id: t.id,
            moduloCodigo: m.codigo,
            titulo: t.titulo,
            clases: t.clases || []
          });
        });
      }
    });
    return lista;
  }, [diplomadoActual]);

  const indiceTemaActual = useMemo(() => {
    if (!temaActual || todosLosTemas.length === 0) return 0;
    const foundIdx = todosLosTemas.findIndex(t => t.id === temaActual.id);
    return foundIdx >= 0 ? foundIdx : 0;
  }, [temaActual, todosLosTemas]);

  const totalTemas = todosLosTemas.length || 1;
  const numeroTemaActual = indiceTemaActual + 1;

  const publicarComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    const nombreCompleto = [nombres, apellidos].filter(Boolean).join(' ') || 'Estudiante';
    setListaComentarios([{ autor: nombreCompleto, texto: comentario, fecha: 'Justo ahora' }, ...listaComentarios]);
    setComentario('');
  };

  const activarRecursoEnVisor = (tipo: 'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo' | 'mapamental', info: string, url?: string) => {
    setContenidoPrincipal(tipo);
    setRecursoActivoInfo(info);
    if (url) {
      setRecursoUrlActivo(url);
    }
  };

  const marcarLeccionCompletadaAuto = useCallback(async (claseId: string, modId: string) => {
    if (!claseId || completadosMap[claseId]) return;

    const nuevoMap = { ...completadosMap, [claseId]: true };
    setCompletadosMap(nuevoMap);

    let totalClases = 0;
    let clasesCompletadas = 0;

    if (diplomadoActual && diplomadoActual.modulos) {
      diplomadoActual.modulos.forEach((m: any) => {
        m.clases.forEach((c: any) => {
          totalClases++;
          const isDone = nuevoMap[c.id] !== undefined 
            ? nuevoMap[c.id] 
            : (nuevoMap[m.codigo] !== undefined ? nuevoMap[m.codigo] : c.completada);
          if (isDone) clasesCompletadas++;
        });
      });
    }

    const nuevoAvance = totalClases > 0 ? Math.round((clasesCompletadas / totalClases) * 100) : 0;

    setGuardandoAvance(true);
    try {
      await fetch('/api/dashboard/completar-leccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diplomadoSlug: diplomadoId,
          claseId: claseId,
          moduloId: modId,
          completado: true,
          completadosMap: nuevoMap,
          avancePorcentaje: nuevoAvance,
          dni: '71234567'
        })
      });
    } catch (err) {
      console.error('Error al autocompletar lección:', err);
    } finally {
      setGuardandoAvance(false);
    }
  }, [completadosMap, diplomadoActual, diplomadoId]);

  const seleccionarTema = (moduloId: string, temaObj: any) => {
    setExamenActivoModal(null);
    setModuloActivo(moduloId);
    if (temaObj.clases && temaObj.clases.length > 0) {
      const primeraClase = temaObj.clases[0];
      setClaseActual(primeraClase);
      setParteSeleccionada(1);
      activarRecursoEnVisor('video_clase', 'Video de la Clase');
      marcarLeccionCompletadaAuto(primeraClase.id, moduloId);
    }
  };

  const seleccionarSesion = (moduloId: string, claseObj: ClaseCompleta) => {
    setExamenActivoModal(null);
    setModuloActivo(moduloId);
    setClaseActual(claseObj);
    setParteSeleccionada(1);
    activarRecursoEnVisor('video_clase', 'Video de la Clase');
    marcarLeccionCompletadaAuto(claseObj.id, moduloId);
  };

  const seleccionarClaseYParte = (moduloId: string, clase: ClaseCompleta, parteNum: number = 1) => {
    setModuloActivo(moduloId);
    setClaseActual(clase);
    setParteSeleccionada(parteNum);
    activarRecursoEnVisor('video_clase', clase.partes.length > 1 ? `Video de la Clase (Parte ${parteNum})` : 'Video de la Clase');
    marcarLeccionCompletadaAuto(clase.id, moduloId);
  };

  useEffect(() => {
    if (claseActual && !loading && !completadosMap[claseActual.id]) {
      marcarLeccionCompletadaAuto(claseActual.id, claseActual.moduloCodigo);
    }
  }, [claseActual, loading, completadosMap, marcarLeccionCompletadaAuto]);

  const irAAnterior = () => {
    if (itemAnterior) {
      seleccionarClaseYParte(itemAnterior.clase.moduloCodigo, itemAnterior.clase, itemAnterior.parte.numero);
    }
  };

  const irASiguiente = () => {
    if (itemSiguiente) {
      seleccionarClaseYParte(itemSiguiente.clase.moduloCodigo, itemSiguiente.clase, itemSiguiente.parte.numero);
    }
  };

  if (loading || !claseActual || !parteActiva) {
    return <DashboardLoader minHeight="min-h-screen" />;
  }

  const moduloActualObj = diplomadoActual.modulos.find((m: any) => m.id === moduloActivo) || diplomadoActual.modulos[0];
  const leccionEstaCompletada = Boolean(
    completadosMap[claseActual.id] !== undefined
      ? completadosMap[claseActual.id]
      : (completadosMap[moduloActivo] || claseActual.completada)
  );

  return (
    <div className={`w-full h-full max-h-full flex flex-col overflow-hidden transition-colors duration-200 ${
      esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Bar FIJA EN EL ENCABEZADO */}
      <header className={`sticky top-0 z-30 h-16 min-h-16 max-h-16 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 backdrop-blur-md transition-colors ${
        esOscuro ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95'
      }`}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1 pr-3">
          <Link 
            href="/dashboard/diplomados"
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
            <h1 className={`text-xs sm:text-sm font-bold line-clamp-2 leading-tight ${
              esOscuro ? 'text-white' : 'text-slate-900'
            }`}>
              {diplomadoActual.titulo}
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

      {/* Layout Principal */}
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
                titulo={
                  /^M[ÓO]DULO\s+\d+$/i.test(examenActivoModal.moduloCodigo || '')
                    ? `Examen modular ${(examenActivoModal.moduloIdx + 1).toString().padStart(2, '0')}`
                    : (examenActivoModal.moduloCodigo
                        ? `Examen ${formatearCodigoModulo(examenActivoModal.moduloCodigo, examenActivoModal.moduloIdx)}`
                        : `Examen modular ${(examenActivoModal.moduloIdx + 1).toString().padStart(2, '0')}`)
                }
                esOscuro={esOscuro}
                enCuestionario={pasoModalExamen === 'cuestionario'}
                respondidas={Object.values(respuestasExamenDinamicas).filter(arr => arr && arr.length > 0).length}
                totalPreguntas={preguntasExamenDinamicas.length || configExamenActivo?.cantidad_preguntas || 0}
                tiempoRestanteSegundos={tiempoRestanteSegundos}
                tiempoFormateado={formatearTiempoDisponible(tiempoRestanteSegundos)}
              />

              {/* SEGUNDA PARTE: INDICACIONES / CARGADOR / PREGUNTAS / RESULTADO */}
              <div id="examen-cuerpo-scroll" className="p-5 sm:p-8 lg:flex-1 lg:min-h-0 lg:overflow-y-auto">
                {/* PASO 1: INDICACIONES PREVIAS AL EXAMEN */}
                {pasoModalExamen === 'indicaciones' && (
                  <ExamenIndicacionesPanel
                    esOscuro={esOscuro}
                    cargandoConfig={cargandoConfigExamen}
                    config={configExamenActivo}
                    tipo="diplomado"
                    onCancelar={() => setExamenActivoModal(null)}
                    onComenzar={comenzarExamenModulo}
                  />
                )}

                {/* PASO 2: CUESTIONARIO */}
                {pasoModalExamen === 'cuestionario' && (
                  <div className="space-y-5">
                    {cargandoPreguntasExamen ? (
                      <div className="py-14 text-center text-slate-400 space-y-3">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                        <p className="text-sm font-semibold">Cargando las preguntas oficiales de tu diplomado...</p>
                      </div>
                    ) : preguntasExamenDinamicas.length === 0 ? (
                      <div className="p-10 text-center space-y-3 border rounded-2xl border-dashed border-slate-300 dark:border-slate-800">
                        <AlertCircle className="w-10 h-10 text-slate-400 mx-auto" />
                        <h4 className="font-bold text-sm">Examen en preparación</h4>
                        <p className="text-xs text-slate-500 max-w-md mx-auto">
                          Aún no se han publicado las preguntas para este módulo de tu diplomado. La coordinación académica las habilitará próximamente.
                        </p>
                        <button
                          type="button"
                          onClick={() => setExamenActivoModal(null)}
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
                                {formatearTextoCientifico(q.pregunta)}
                              </h3>

                              <div className="space-y-2.5 pt-1">
                                {q.opciones.map((opt, optIndex) => {
                                  const optIdx = typeof opt.indice === 'number' ? opt.indice : optIndex;
                                  const seleccionada = seleccionadasActuales.includes(optIdx);

                                  return (
                                    <button
                                      key={optIdx}
                                      type="button"
                                      onClick={() => {
                                        setRespuestasExamenDinamicas(prev => {
                                          const prevList = prev[q.id] || [];
                                          if (esMultiple) {
                                            const yaEsta = prevList.includes(optIdx);
                                            const nueva = yaEsta 
                                              ? prevList.filter(x => x !== optIdx) 
                                              : [...prevList, optIdx];
                                            return { ...prev, [q.id]: nueva };
                                          } else {
                                            return { ...prev, [q.id]: [optIdx] };
                                          }
                                        });
                                      }}
                                      className={`w-full text-left p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm flex items-center gap-3.5 transition-colors border cursor-pointer ${
                                        seleccionada
                                          ? 'bg-indigo-600/10 border-indigo-600 text-indigo-600 dark:text-indigo-300 font-semibold ring-1 ring-indigo-600'
                                          : esOscuro
                                            ? 'bg-slate-800/40 border-slate-800 hover:bg-slate-800/70 text-slate-300'
                                            : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                                      }`}
                                    >
                                      <div className={`size-5 rounded-${esMultiple ? 'md' : 'full'} border flex items-center justify-center shrink-0 mt-0.5 ${
                                        seleccionada
                                          ? 'border-indigo-600 bg-indigo-600 text-white'
                                          : esOscuro ? 'border-slate-600' : 'border-slate-300'
                                      }`}>
                                        {seleccionada && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                                      </div>
                                      <span className="leading-relaxed flex-1 text-pretty">{formatearTextoCientifico(opt.text)}</span>
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
                            onClick={() => rendirExamenModulo()}
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
                {(pasoModalExamen === 'resultado' || pasoModalExamen === 'ver_intento') && (() => {
                  const notaFinalMostrar =
                    pasoModalExamen === 'ver_intento'
                      ? (notasModulosMap[examenActivoModal.moduloCodigo] ?? resultadoExamen?.nota ?? 0)
                      : (resultadoExamen?.nota ?? 0);
                  const notaMinima = configExamenActivo?.nota_minima ?? 12;
                  const aprobadoMostrar =
                    pasoModalExamen === 'ver_intento'
                      ? notaFinalMostrar >= notaMinima
                      : Boolean(resultadoExamen?.aprobado);

                  return (
                    <ExamenResultadoYRetroalimentacion
                      esOscuro={esOscuro}
                      nota={notaFinalMostrar}
                      aprobado={aprobadoMostrar}
                      notaMinima={notaMinima}
                      detalles={detallesCalificacionExamen}
                      cargandoRetroalimentacion={cargandoRetroalimentacion}
                      mostrarRetroalimentacion={mostrarRetroalimentacion}
                      onToggleRetroalimentacion={() => setMostrarRetroalimentacion(prev => !prev)}
                      fechaInicio={tiempoRegistroExamen.inicio}
                      fechaFin={tiempoRegistroExamen.fin}
                      whatsappSustitutorioHref={`https://wa.me/51924400268?text=${encodeURIComponent(`Hola EDUMIN, revisé mi intento en el examen modular ${(examenActivoModal.moduloIdx + 1).toString().padStart(2, '0')} con nota ${notaFinalMostrar}/20 y deseo pagar los S/ 25.00 para rendir el examen sustitutorio.`)}`}
                      formatearTexto={formatearTextoCientifico}
                    />
                  );
                })()}
              </div>
            </div>
          ) : (
            <>
          
          {/* CONTENEDOR INTEGRADO: BARRA DE CONTROL CONTINUA + VISOR MULTIMEDIA */}
          {(() => {
            if (!claseActual || !parteActiva) return null;

            // Determinar información del recurso activo
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
                    <iframe 
                      key={`${claseActual.id}-p${parteActiva.numero}`}
                      src={(parteActiva.videoUrl || '').replace(/\/view(\?.*)?$/, '/preview')} 
                      title={`${claseActual.tituloClase} - ${parteActiva.titulo}`}
                      className="w-full h-full border-0 absolute inset-0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                    />
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
                              {recursoActivoInfo || claseActual.tituloClase}
                            </p>
                            <audio controls autoPlay src={url} className="w-full mt-2" />
                          </div>
                        </div>
                      );
                    }

                    let embedUrl = url;
                    if (embedUrl.includes('drive.google.com') && embedUrl.includes('/view')) {
                      embedUrl = embedUrl.replace(/\/view(\?.*)?$/, '/preview');
                    }

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
            const partesDelTema = (temaActual && temaActual.clases && temaActual.clases.length > 0)
              ? temaActual.clases
              : (claseActual ? [claseActual] : []);
            const tituloMostrar = (temaActual?.titulo || claseActual.tituloClase || '').toUpperCase();

            return (
              <div className={`p-4 sm:p-5 shrink-0 rounded-2xl border transition-all space-y-4 ${
                esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
              }`}>
                {/* Encabezado: Título en mayúsculas sin etiquetas redundantes */}
                <div className="flex items-center justify-between gap-2.5">
                  <h2 className={`text-sm sm:text-base font-bold leading-snug uppercase ${
                    esOscuro ? 'text-white' : 'text-slate-900'
                  }`}>
                    {tituloMostrar}
                  </h2>
                </div>

                {/* Selector de Partes con ancho fijo y flex-wrap para pasar a 2da fila cuando hay muchas partes */}
                <div className="flex flex-wrap items-center gap-2.5 w-full">
                  {partesDelTema.map((claseItem: ClaseCompleta, pIdx: number) => {
                    const esParteActiva = claseActual?.id === claseItem.id;
                    const esParteCompletada = Boolean(completadosMap[claseItem.id]);

                    return (
                      <button
                        key={claseItem.id}
                        type="button"
                        onClick={() => seleccionarSesion(moduloActivo, claseItem)}
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
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
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
              {tabActiva === 'resumen' && tieneResumen && parteActiva.resumen && (
                <div className={`p-6 sm:p-7 rounded-2xl border space-y-6 ${
                  esOscuro ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                }`}>
                  {/* SECCIÓN RESUMEN */}
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

                  {/* SECCIÓN PUNTOS CLAVE */}
                  {parteActiva.resumen.temasClave && parteActiva.resumen.temasClave.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-slate-200/60 dark:border-slate-800/60">
                      <h4 className={`text-xs font-black uppercase tracking-wider ${esOscuro ? 'text-indigo-400' : 'text-indigo-600'}`}>
                        Puntos clave:
                      </h4>
                      <ul className="space-y-2.5">
                        {parteActiva.resumen.temasClave.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-relaxed">
                            <span className="text-indigo-500 font-bold text-base leading-none select-none shrink-0 mt-0.5">•</span>
                            <div className="flex-1">
                              {item.titulo ? (
                                <>
                                  <strong className={`font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                                    {item.titulo}:
                                  </strong>{' '}
                                  <span className={esOscuro ? 'text-slate-300' : 'text-slate-700'}>
                                    {item.descripcion}
                                  </span>
                                </>
                              ) : (
                                <span className={esOscuro ? 'text-slate-300' : 'text-slate-700'}>
                                  {item.descripcion}
                                </span>
                              )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB RECURSOS MULTIMEDIA Y DOCUMENTOS */}
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

              {/* TAB FORO */}
              {tabActiva === 'foro' && (
                <div className="space-y-6">
                  <form onSubmit={publicarComentario} className="flex flex-col sm:flex-row gap-3">
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
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shrink-0 shadow">
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

        {/* SIDEBAR DERECHO (30%) - TEMARIO CONTINUO */}
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
                Temario del diplomado
              </h3>
            </div>
            
            {/* Barra de progreso real calculada */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className={esOscuro ? 'text-slate-400' : 'text-slate-500'}>
                  Avance
                </span>
                <span className={`font-semibold ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  {diplomadoActual.avancePorcentaje}% completado
                </span>
              </div>
              <div className={`w-full h-2 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-200'}`}>
                <div 
                  className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${diplomadoActual.avancePorcentaje}%` }}
                />
              </div>
            </div>
          </div>

          {/* Lista Continua de Módulos y Clases (Directo en la columna, separados por línea divisoria completa) */}
          <div className="divide-y divide-slate-200 dark:divide-slate-800 pb-8">
            {diplomadoActual.modulos.map((mod: any, modIdx: number) => {
              const totalClasesMod = mod.clases?.length || 0;
              const estaModCompletado = Boolean(completadosMap[mod.codigo] || mod.completado);
              const completadasMod = estaModCompletado
                ? totalClasesMod
                : (mod.clases || []).filter((c: any) => Boolean(completadosMap[c.id])).length;
              const esModTotalmenteCompletado = estaModCompletado || (totalClasesMod > 0 && completadasMod === totalClasesMod);

              return (
                <div key={mod.id} className="p-4 space-y-3">
                  {/* Encabezado del Módulo: Fila 1 = Código y Contador | Fila 2 = Título Completo */}
                  <div className="space-y-1 pb-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
                        {formatearCodigoModulo(mod.codigo, modIdx).toUpperCase()}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
                        <span>{`${completadasMod}/${totalClasesMod} clases`}</span>
                        {esModTotalmenteCompletado && (
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={2.8} />
                        )}
                      </span>
                    </div>
                    <h4 className={`font-bold text-xs leading-snug uppercase ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                      {(mod.nombre || '').toUpperCase()}
                    </h4>
                  </div>

                  {/* Lista de Temas */}
                  {mod.temas && mod.temas.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {mod.temas.map((tema: any) => {
                        const temaClases = tema.clases || [];
                        const esTemaCompletado = temaClases.length > 0 && temaClases.every((c: any) => Boolean(completadosMap[c.id] || completadosMap[mod.codigo]));
                        const esTemaSeleccionado = !examenActivoModal && (temaActual?.id === tema.id);

                        return (
                          <button
                            key={tema.id}
                            type="button"
                            onClick={() => seleccionarTema(mod.id, tema)}
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
                                <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                                  esTemaSeleccionado 
                                    ? '[&>circle]:fill-white [&>circle]:stroke-white [&>path]:stroke-indigo-600 [&>path]:stroke-[2.5]' 
                                    : '[&>circle]:fill-emerald-500 [&>circle]:stroke-emerald-500 [&>path]:stroke-white [&>path]:stroke-[2.5]'
                                }`} strokeWidth={2.2} />
                              ) : (
                                <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                                  esTemaSeleccionado ? 'text-white/70' : esOscuro ? 'text-slate-500' : 'text-slate-400'
                                }`} strokeWidth={1.8} />
                              )}
                            </div>
                            <span className="truncate text-xs font-bold leading-tight uppercase flex-1 min-w-0">
                              {(tema.titulo || '').toUpperCase()}
                            </span>
                          </button>
                        );
                      })}

                      {mod.clasesAdicionales && mod.clasesAdicionales.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 mt-2">
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block px-1">
                            ⭐ CLASE ADICIONAL
                          </span>
                          {mod.clasesAdicionales.map((clase: ClaseCompleta) => {
                            const esClaseSeleccionada = !examenActivoModal && (claseActual?.id === clase.id);
                            const estaCompletada = estaModCompletado || Boolean(completadosMap[clase.id]);

                            return (
                              <button 
                                key={clase.id} 
                                onClick={() => seleccionarSesion(mod.id, clase)}
                                className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-left transition-all cursor-pointer border ${
                                  esClaseSeleccionada 
                                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-bold' 
                                    : esOscuro 
                                      ? 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800' 
                                      : 'bg-amber-50/50 border-amber-200/80 text-amber-900 hover:bg-amber-100/80'
                                }`}
                              >
                                <div className="shrink-0">
                                  {estaCompletada ? (
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                                      esClaseSeleccionada 
                                        ? '[&>circle]:fill-white [&>circle]:stroke-white [&>path]:stroke-indigo-600 [&>path]:stroke-[2.5]' 
                                        : '[&>circle]:fill-emerald-500 [&>circle]:stroke-emerald-500 [&>path]:stroke-white [&>path]:stroke-[2.5]'
                                    }`} strokeWidth={2.2} />
                                  ) : (
                                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${esClaseSeleccionada ? 'text-white/70' : 'text-slate-400'}`} strokeWidth={1.8} />
                                  )}
                                </div>
                                <span className="text-xs leading-snug truncate uppercase font-bold flex-1 min-w-0">
                                  {clase.tituloClase?.toUpperCase()}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {mod.clases.map((clase: ClaseCompleta) => {
                        const esClaseSeleccionada = !examenActivoModal && (claseActual?.id === clase.id);
                        const estaCompletada = estaModCompletado || Boolean(completadosMap[clase.id]);

                        return (
                          <button 
                            key={clase.id} 
                            onClick={() => seleccionarClaseYParte(mod.id, clase, 1)}
                            className={`w-full p-2.5 rounded-xl flex items-center gap-2.5 text-left transition-all cursor-pointer border ${
                              esClaseSeleccionada 
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-bold'
                                : esOscuro 
                                  ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-transparent' 
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-transparent'
                            }`}
                          >
                            <div className="shrink-0">
                              {estaCompletada ? (
                                <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                                  esClaseSeleccionada 
                                    ? '[&>circle]:fill-white [&>circle]:stroke-white [&>path]:stroke-indigo-600 [&>path]:stroke-[2.5]' 
                                    : '[&>circle]:fill-emerald-500 [&>circle]:stroke-emerald-500 [&>path]:stroke-white [&>path]:stroke-[2.5]'
                                }`} strokeWidth={2.2} />
                              ) : (
                                <CheckCircle2 className={`w-4 h-4 shrink-0 ${
                                  esClaseSeleccionada 
                                    ? 'text-white/70' 
                                    : (esOscuro ? 'text-slate-500' : 'text-slate-400')
                                }`} strokeWidth={1.8} />
                              )}
                            </div>
                            <span className="text-xs leading-snug line-clamp-2 uppercase font-medium flex-1 min-w-0">
                              {clase.tituloClase?.toUpperCase()}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}                  {/* Fila del Examen del Módulo o Certificación Directa */}
                  {(() => {
                    // Si el módulo no aplica examen o no tiene evaluación asignada (certificación directa)
                    const tieneExamen = esModuloConExamenDisponible(mod.codigo);
                    if (!tieneExamen && notasModulosMap[mod.codigo] === undefined) {
                      return (
                        <div 
                          className={`mt-2 p-3 rounded-xl border transition-all select-none space-y-2.5 ${
                            esModTotalmenteCompletado
                              ? (esOscuro ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200' : 'bg-emerald-50/80 border-emerald-200 text-emerald-900')
                              : (esOscuro ? 'bg-slate-800/60 border-slate-700/60 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800')
                          }`}
                        >
                          {/* Fila 1: Icono + Título + Subtítulo */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              esModTotalmenteCompletado
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-blue-500/15 text-blue-500'
                            }`}>
                              <Award className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className={`text-xs font-bold block truncate uppercase ${
                                esOscuro ? 'text-slate-100' : 'text-slate-800'
                              }`}>
                                Certificación {formatearCodigoModulo(mod.codigo, modIdx)}
                              </span>
                              <span className="text-[11px] block font-medium truncate text-slate-400">
                                {esModTotalmenteCompletado
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
                            {esModTotalmenteCompletado ? (
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

                    const modKeyCfg = formatearCodigoModulo(mod.codigo, modIdx);
                    const cfgMod = configsModulosMap[mod.codigo] || configsModulosMap[modKeyCfg] || null;
                    const intentosMod = cfgMod?.intentos_permitidos ?? 1;
                    const minutosMod = cfgMod?.tiempo_minutos ?? 30;
                    const notaMinimaMod = cfgMod?.nota_minima ?? 12;

                    const esExamenActivo = Boolean(examenActivoModal && (
                      examenActivoModal.moduloCodigo === mod.codigo || 
                      examenActivoModal.moduloCodigo === mod.id ||
                      examenActivoModal.moduloIdx === modIdx
                    ));
                    const examenRendidoMod = notasModulosMap[mod.codigo] !== undefined;
                    const examenDesaprobadoMod = examenRendidoMod && notasModulosMap[mod.codigo] < notaMinimaMod;

                    return (
                      <div 
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          if (notasModulosMap[mod.codigo] !== undefined) {
                            abrirVerIntento(mod.codigo, mod.nombre, modIdx);
                          } else {
                            abrirModalExamen(mod.codigo, mod.nombre, modIdx);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            if (notasModulosMap[mod.codigo] !== undefined) {
                              abrirVerIntento(mod.codigo, mod.nombre, modIdx);
                            } else {
                              abrirModalExamen(mod.codigo, mod.nombre, modIdx);
                            }
                          }
                        }}
                        className={`mt-2 p-3 rounded-xl border transition-all cursor-pointer select-none space-y-2.5 ${
                        esExamenActivo
                          ? (examenDesaprobadoMod
                              ? 'bg-rose-600 text-white border-rose-600 shadow-md font-bold'
                              : 'bg-amber-500 text-white border-amber-500 shadow-md font-bold')
                          : esOscuro 
                            ? 'bg-slate-800/60 border-slate-700/60 text-slate-200 hover:bg-slate-800 shadow-2xs' 
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 shadow-2xs'
                      }`}>
                        {/* Fila Superior: Icono + Título + Subtítulo / Botón Rendir Examen */}
                        <div className="flex items-center justify-between gap-2.5 min-w-0">
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                              esExamenActivo
                                ? 'bg-white/20 text-white'
                                : examenDesaprobadoMod
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
                                {/^M[ÓO]DULO\s+\d+$/i.test(modKeyCfg)
                                  ? `EXAMEN MODULAR ${(modIdx + 1).toString().padStart(2, '0')}`
                                  : `EXAMEN ${modKeyCfg}`}
                              </span>
                              <span className={`text-[11px] block font-medium truncate ${
                                esExamenActivo
                                  ? 'text-white/80'
                                  : examenDesaprobadoMod
                                    ? 'text-rose-500 dark:text-rose-400'
                                    : 'text-slate-400'
                              }`}>
                                {notasModulosMap[mod.codigo] !== undefined
                                  ? `Nota: ${notasModulosMap[mod.codigo].toString().padStart(2, '0')}/20 · ${examenDesaprobadoMod ? 'Desaprobado' : 'Aprobado'}`
                                  : `${intentosMod} ${intentosMod === 1 ? 'intento' : 'intentos'} · ${minutosMod} min`
                                }
                              </span>
                            </div>
                          </div>

                          {notasModulosMap[mod.codigo] === undefined && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalExamen(mod.codigo, mod.nombre, modIdx);
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
                        {notasModulosMap[mod.codigo] !== undefined && (
                          <div className={`pt-2 border-t flex items-center gap-2 ${
                            esExamenActivo 
                              ? 'border-white/20' 
                              : esOscuro ? 'border-slate-700/60' : 'border-slate-200'
                          }`}>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirVerIntento(mod.codigo, mod.nombre, modIdx);
                              }}
                              className={`flex-1 text-xs font-bold px-2.5 py-1.5 rounded-xl border transition-colors flex items-center justify-center gap-1.5 cursor-pointer truncate ${
                                esExamenActivo
                                  ? (examenDesaprobadoMod
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

                            {!examenDesaprobadoMod ? (
                              <Link
                                href="/dashboard/certificados"
                                onClick={(e) => e.stopPropagation()}
                                className={`flex-1 inline-flex items-center justify-center gap-1.5 font-bold text-xs px-2.5 py-1.5 rounded-xl border transition-colors shadow-2xs cursor-pointer truncate ${
                                  esExamenActivo
                                    ? 'bg-white text-amber-600 border-white hover:bg-amber-50 shadow-xs'
                                    : 'bg-amber-500 hover:bg-amber-600 border-amber-500 text-white shadow-amber-500/20 shadow-sm'
                                }`}
                                title="Descargar certificado modular"
                              >
                                <Award className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">Ver certificado</span>
                              </Link>
                            ) : (
                              <a
                                href={`https://wa.me/51924400268?text=${encodeURIComponent(`Hola EDUMIN, desaprobé el Examen Modular ${(modIdx + 1).toString().padStart(2, '0')} en ${diplomadoActual.titulo}. Deseo solicitar el Examen Sustitutorio.`)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className={`flex-1 inline-flex items-center justify-center gap-1 font-bold text-xs px-2 py-1.5 rounded-xl border transition-colors shadow-2xs truncate ${
                                  esExamenActivo
                                    ? 'bg-white text-rose-600 border-white hover:bg-rose-50 shadow-xs'
                                    : 'bg-rose-600 hover:bg-rose-700 border-rose-600 text-white shadow-rose-600/20 shadow-sm'
                                }`}
                                title="Pagar examen sustitutorio"
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
              );
            })}
          </div>
        </aside>
        )}

      </div>
    </div>
  );
}
