'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  CheckCircle2, 
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
  Table
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDiplomadoBySlug } from '@/lib/data/diplomadosData';
import { getDriveVideoForClass } from '@/lib/data/driveVideos';
import { useTheme } from '@/context/theme-context';
import { parseDiplomadosFromProfile } from '@/lib/utils/profileParser';

export interface RecursoItem {
  id: string;
  tipo: 'pdf' | 'video' | 'audio' | 'interactivo' | 'excel';
  titulo: string;
  descripcion: string;
  archivo?: string;
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
  resumen: {
    objetivo: string;
    puntosClave: string[];
  };
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

  // Estados de datos de Supabase
  const [loading, setLoading] = useState(true);
  const [completadosMap, setCompletadosMap] = useState<Record<string, boolean>>({});
  const [catalogoMateriales, setCatalogoMateriales] = useState<any>(null);
  const [guardandoAvance, setGuardandoAvance] = useState(false);
  const [temasAbiertosMap, setTemasAbiertosMap] = useState<Record<string, boolean>>({});

  const toggleTema = (temaId: string) => {
    setTemasAbiertosMap(prev => ({
      ...prev,
      [temaId]: prev[temaId] === undefined ? false : !prev[temaId]
    }));
  };

  // Cargar datos de Supabase (/api/dashboard/me y /api/admin/catalogo)
  const cargarDatosSupabase = useCallback(async () => {
    try {
      setLoading(true);
      const [meRes, catRes] = await Promise.all([
        fetch('/api/dashboard/me').catch(() => null),
        fetch('/api/admin/catalogo').catch(() => null)
      ]);

      if (meRes && meRes.ok) {
        const meData = await meRes.json();
        const profile = meData.profile || meData;
        const diplomados = parseDiplomadosFromProfile(profile);
        
        // Buscar el diplomado actual en el perfil del alumno
        const targetSlugNorm = diplomadoId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const dipEnPerfil = Array.isArray(diplomados) 
          ? diplomados.find((d: any) => (d.slug || d.id || d.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm)
          : null;

        if (dipEnPerfil) {
          const map: Record<string, boolean> = {};
          if (dipEnPerfil.completadosMap && typeof dipEnPerfil.completadosMap === 'object') {
            Object.assign(map, dipEnPerfil.completadosMap);
          }
          if (Array.isArray(dipEnPerfil.modulos)) {
            dipEnPerfil.modulos.forEach((m: any, idx: number) => {
              const key = m.codigo || m.id || `Módulo ${(idx + 1).toString().padStart(2, '0')}`;
              if (map[key] === undefined && m.completado !== undefined) {
                map[key] = Boolean(m.completado);
              }
            });
          }
          setCompletadosMap(map);
        }
      }

      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        const todos = catData.cursos || catData.todos || [];
        const catItem = todos.find((c: any) => 
          c.id === diplomadoId || 
          (c.titulo && c.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === diplomadoId.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
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
    cargarDatosSupabase();
  }, [cargarDatosSupabase]);

  // Generar datos combinados con el diplomado base
  const diplomadoActual = useMemo(() => {
    const dip = getDiplomadoBySlug(diplomadoId) || getDiplomadoBySlug('derecho-minero');
    
    const titulo = catalogoMateriales?.titulo || dip?.titulo || 'Diplomado de Alta Especialización EDUMIN';
    let contadorGlobalTemas = 1;
    let contadorGlobalClases = 1;

    const modulosRaw = catalogoMateriales?.modulos?.length 
      ? catalogoMateriales.modulos 
      : (dip?.modulos || [
          { codigo: 'Módulo 01', nombre: 'Módulo I: Fundamentos y Gestión', clases: ['Sesión 1: Marco Normativo', 'Sesión 2: Gestión Aplicada'] },
          { codigo: 'Módulo 02', nombre: 'Módulo II: Operaciones y Estrategia', clases: ['Sesión 1: Operaciones', 'Sesión 2: Estrategia'] },
          { codigo: 'Módulo 03', nombre: 'Módulo III: Casuística y Proyectos', clases: ['Sesión 1: Casuística Práctica', 'Sesión 2: Evaluación Final'] }
        ]);

    let totalClasesContadas = 0;
    let clasesCompletadasContadas = 0;

    const modulosProcesados = modulosRaw.map((mod: any, modIdx: number) => {
      const modCodigoKey = mod.codigo || `Módulo ${(modIdx + 1).toString().padStart(2, '0')}`;
      const esModuloCompletadoEnBD = Boolean(completadosMap[modCodigoKey]);

      let temasProcesados: any[] | undefined = undefined;

      if (Array.isArray(mod.temas) && mod.temas.length > 0) {
        temasProcesados = mod.temas.map((tObj: any, tIdx: number) => {
          const numTema = contadorGlobalTemas++;
          const numTemaStr = numTema < 10 ? `0${numTema}` : `${numTema}`;
          const rawTitulo = tObj.titulo || `Tema ${numTemaStr}`;
          const temaTituloFinal = rawTitulo.replace(/^Tema \d+:/i, `Tema ${numTemaStr}:`);

          const rawTemaClases = Array.isArray(tObj.clases) ? tObj.clases : [];
          const temaClases: ClaseCompleta[] = rawTemaClases.map((claseTitleStr: any, claseIdx: number) => {
            const numClase = contadorGlobalClases++;
            const rawClaseTitle = typeof claseTitleStr === 'string' ? claseTitleStr : (claseTitleStr.titulo || `Clase ${numClase}`);
            const claseTitle = rawClaseTitle.replace(/\s*\(\d{1,2}\/\d{1,2}\)/g, '').trim();
            const claseId = `${modCodigoKey}-t${tIdx + 1}-c${claseIdx + 1}`;
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
                resumen: {
                  objetivo: `Comprender los conceptos principales y aplicación práctica de: ${claseTitle}.`,
                  puntosClave: [
                    `Revisión de la normativa vigente y estándares técnicos aplicables.`,
                    `Criterios clave para la toma de decisiones operativas y de gestión.`,
                    `Estrategias de análisis y resolución de problemas en el sector.`
                  ]
                },
                recursos: [
                  {
                    id: `rec-${claseId}-pdf`,
                    tipo: 'pdf',
                    titulo: pdfUrlFromCatalog ? `Separata_Oficial_CLASE_${numClase}.pdf` : `Separata_Oficial_CLASE_${numClase}.pdf`,
                    descripcion: 'Documento oficial con contenidos y diapositivas de la clase · PDF',
                    archivo: pdfUrlFromCatalog || `Separata_Oficial_CLASE_${numClase}.pdf`
                  },
                  ...(excelUrlFromCatalog ? [{
                    id: `rec-${claseId}-excel`,
                    tipo: 'excel' as const,
                    titulo: `Plantilla_Calculo_CLASE_${numClase}.xlsx`,
                    descripcion: 'Hoja de cálculo y plantilla interactiva de trabajo · EXCEL',
                    archivo: excelUrlFromCatalog
                  }] : []),
                  {
                    id: `rec-${claseId}-capsula`,
                    tipo: 'video',
                    titulo: `Cápsula de Resumen en Video`,
                    descripcion: 'Video sumario con los puntos más relevantes · 8 min',
                    duracion: '8 min'
                  },
                  {
                    id: `rec-${claseId}-audio`,
                    tipo: 'audio',
                    titulo: `Podcast de la Clase`,
                    descripcion: 'Audio en formato MP3 para estudio y repaso · 15 min',
                    duracion: '15 min'
                  }
                ]
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
      }

      let clasesAdicionalesProcesadas: ClaseCompleta[] = [];
      if (Array.isArray(mod.clasesAdicionales) && mod.clasesAdicionales.length > 0) {
        clasesAdicionalesProcesadas = mod.clasesAdicionales.map((claseTitleStr: any, cIdx: number) => {
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
              resumen: {
                objetivo: `Comprender los conceptos principales y aplicación práctica de: ${claseTitle}.`,
                puntosClave: [
                  `Revisión de la normativa vigente y estándares técnicos aplicables.`,
                  `Criterios clave para la toma de decisiones operativas y de gestión.`,
                  `Estrategias de análisis y resolución de problemas en el sector.`
                ]
              },
              recursos: [
                {
                  id: `rec-${claseId}-pdf`,
                  tipo: 'pdf',
                  titulo: pdfUrlFromCatalog ? `Separata_Oficial_CLASE_${numClase}.pdf` : `Separata_Oficial_CLASE_${numClase}.pdf`,
                  descripcion: 'Documento oficial con contenidos y diapositivas de la clase · PDF',
                  archivo: pdfUrlFromCatalog || `Separata_Oficial_CLASE_${numClase}.pdf`
                }
              ]
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

      let clases: ClaseCompleta[] = [];
      if (!temasProcesados) {
        const rawClases = (mod.clases && mod.clases.length > 0) 
          ? mod.clases 
          : ['Sesión Magistral de Introducción', 'Casuística Aplicada'];

        clases = rawClases.map((claseTitleStr: any, claseIdx: number) => {
          const numClase = contadorGlobalClases++;
          const claseTitle = typeof claseTitleStr === 'string' ? claseTitleStr : (claseTitleStr.titulo || `Clase ${numClase}`);
          const claseId = `${modCodigoKey}-c${numClase}`;
          const driveVideoUrl = getDriveVideoForClass(diplomadoId, modIdx, claseIdx);
          const videoUrlFromCatalog = (typeof claseTitleStr === 'object' && claseTitleStr.videoUrl)
            ? claseTitleStr.videoUrl
            : (driveVideoUrl || mod.videoUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ');
          const pdfUrlFromCatalog = typeof claseTitleStr === 'object' ? claseTitleStr.pdfUrl : mod.pdfUrl;
          const excelUrlFromCatalog = typeof claseTitleStr === 'object' ? claseTitleStr.excelUrl : mod.excelUrl;

          totalClasesContadas++;

          // Una clase está completada si su claseId individual está marcada o si el módulo completo lo está
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
              resumen: {
                objetivo: `Comprender los conceptos principales y aplicación práctica de: ${claseTitle}.`,
                puntosClave: [
                  `Revisión de la normativa vigente y estándares técnicos aplicables.`,
                  `Criterios clave para la toma de decisiones operativas y de gestión.`,
                  `Estrategias de análisis y resolución de problemas en el sector.`
                ]
              },
              recursos: [
                {
                  id: `rec-${claseId}-pdf`,
                  tipo: 'pdf',
                  titulo: pdfUrlFromCatalog ? `Separata_Oficial_CLASE_${numClase}.pdf` : `Separata_Oficial_CLASE_${numClase}.pdf`,
                  descripcion: 'Documento oficial con contenidos y diapositivas de la clase · PDF',
                  archivo: pdfUrlFromCatalog || `Separata_Oficial_CLASE_${numClase}.pdf`
                },
                ...(excelUrlFromCatalog ? [{
                  id: `rec-${claseId}-excel`,
                  tipo: 'excel' as const,
                  titulo: `Plantilla_Calculo_CLASE_${numClase}.xlsx`,
                  descripcion: 'Hoja de cálculo y plantilla interactiva de trabajo · EXCEL',
                  archivo: excelUrlFromCatalog
                }] : []),
                {
                  id: `rec-${claseId}-capsula`,
                  tipo: 'video',
                  titulo: `Cápsula de Resumen en Video`,
                  descripcion: 'Video sumario con los puntos más relevantes · 8 min',
                  duracion: '8 min'
                },
                {
                  id: `rec-${claseId}-audio`,
                  tipo: 'audio',
                  titulo: `Podcast de la Clase`,
                  descripcion: 'Audio en formato MP3 para estudio y repaso · 15 min',
                  duracion: '15 min'
                }
              ]
            }
          ];

          return {
            id: claseId,
            numeroClase: numClase,
            tituloClase: `CLASE ${numClase}: ${claseTitle.replace(/^Clase \d+:\s*/i, '')}`,
            moduloCodigo: modCodigoKey,
            moduloTitulo: `${modCodigoKey}: ${mod.nombre || mod.titulo || ''}`,
            completada: esCompletada,
            partes
          };
        });
      }

      const todasLasClasesDelModulo = temasProcesados 
        ? [...temasProcesados.flatMap((t: any) => t.clases), ...clasesAdicionalesProcesadas] 
        : clases;

      return {
        id: modCodigoKey,
        codigo: modCodigoKey,
        nombre: mod.nombre || mod.titulo || `Módulo ${(modIdx + 1).toString().padStart(2, '0')}`,
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
      titulo,
      avancePorcentaje,
      modulos: modulosProcesados
    };
  }, [diplomadoId, catalogoMateriales, completadosMap]);

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
  const [contenidoPrincipal, setContenidoPrincipal] = useState<'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo'>('video_clase');
  const [recursoActivoInfo, setRecursoActivoInfo] = useState<string>('Clase principal en video');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'recursos' | 'foro'>('resumen');
  
  // Estados del foro
  const [comentario, setComentario] = useState('');
  const [listaComentarios, setListaComentarios] = useState([
    { autor: 'Ing. Carlos Mendoza', texto: 'Excelente explicación de los temas de la clase.', fecha: 'Hace 2 horas' }
  ]);

  const [inicializadoNav, setInicializadoNav] = useState(false);

  // Sincronizar si cambia el parámetro de módulo en la URL o en la carga inicial
  useEffect(() => {
    if (modInicial && (!inicializadoNav || moduloQuery)) {
      setModuloActivo(modInicial.id);
      if (!claseActual && modInicial.clases && modInicial.clases.length > 0) {
        setClaseActual(modInicial.clases[0]);
        setParteSeleccionada(1);
      }
      setInicializadoNav(true);
    }
  }, [modInicial, moduloQuery, inicializadoNav, claseActual]);

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

  const tieneMultiplesPartes = (claseActual?.partes?.length ?? 0) > 1;

  const indiceActualPlano = useMemo(() => {
    if (!claseActual || !parteActiva) return -1;
    return todasLasPartes.findIndex(
      (item) => item.clase.id === claseActual.id && item.parte.numero === parteActiva.numero
    );
  }, [todasLasPartes, claseActual, parteActiva]);

  const itemAnterior = indiceActualPlano > 0 ? todasLasPartes[indiceActualPlano - 1] : null;
  const itemSiguiente = indiceActualPlano >= 0 && indiceActualPlano < todasLasPartes.length - 1 ? todasLasPartes[indiceActualPlano + 1] : null;

  const publicarComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    setListaComentarios([{ autor: 'Estudiante (Tú)', texto: comentario, fecha: 'Justo ahora' }, ...listaComentarios]);
    setComentario('');
  };

  const activarRecursoEnVisor = (tipo: 'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo', info: string) => {
    setContenidoPrincipal(tipo);
    setRecursoActivoInfo(info);
    const elem = document.getElementById('zona-reproductor-principal');
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
    return (
      <div className={`h-full min-h-screen grid place-items-center ${esOscuro ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin text-indigo-500" />
          <p className="text-xs font-semibold text-slate-400">Sincronizando contenidos con Supabase...</p>
        </div>
      </div>
    );
  }

  const moduloActualObj = diplomadoActual.modulos.find((m: any) => m.id === moduloActivo) || diplomadoActual.modulos[0];
  const leccionEstaCompletada = Boolean(
    completadosMap[claseActual.id] !== undefined
      ? completadosMap[claseActual.id]
      : (completadosMap[moduloActivo] || claseActual.completada)
  );

  return (
    <div className={`w-full min-h-full flex flex-col transition-colors duration-200 ${
      esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Bar FIJA EN EL ENCABEZADO */}
      <header className={`sticky top-0 z-30 h-16 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 backdrop-blur-md transition-colors ${
        esOscuro ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95'
      }`}>
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
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
          <div className="flex items-center gap-2 min-w-0">
            <Award className="w-5 h-5 text-indigo-500 shrink-0 hidden sm:block" />
            <h1 className={`text-xs sm:text-sm font-bold truncate ${
              esOscuro ? 'text-white' : 'text-slate-900'
            }`}>
              {diplomadoActual.titulo}
            </h1>
          </div>
        </div>

        {/* Indicador de Avance y Estado de Lección en Encabezado */}
        <div className="flex items-center gap-3">
          <div className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border flex items-center gap-2 transition-all ${
            esOscuro 
              ? 'bg-indigo-950/60 border-indigo-800/60 text-indigo-300' 
              : 'bg-indigo-50 border-indigo-200 text-indigo-900'
          }`}>
            <span className="font-extrabold uppercase tracking-wider text-[11px]">
              {claseActual.tituloClase.split(':')[0] || `Clase ${claseActual.numeroClase}`}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-500 hidden sm:inline">
              ✓ Guardado
            </span>
          </div>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* ZONA PRINCIPAL DE REPRODUCCIÓN (70%) */}
        <div id="zona-reproductor-principal" className={`flex-1 flex flex-col p-4 sm:p-8 lg:p-10 lg:border-r space-y-6 ${
          esOscuro ? 'lg:border-slate-800' : 'lg:border-slate-200'
        }`}>
          
          {/* VISOR MULTIMEDIA Y DOCUMENTOS */}
          <div className={`w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-lg relative flex flex-col items-center justify-center border ${
            esOscuro ? 'border-slate-800' : 'border-slate-300'
          }`}>
            
            {contenidoPrincipal === 'video_clase' && (
              <iframe 
                key={`${claseActual.id}-p${parteActiva.numero}`}
                src={parteActiva.videoUrl} 
                title={`${claseActual.tituloClase} - ${parteActiva.titulo}`}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}

            {/* VISOR DE PDF INTEGRADO */}
            {contenidoPrincipal === 'pdf_visor' && (
              <div className={`absolute inset-0 flex flex-col ${esOscuro ? 'bg-slate-900' : 'bg-slate-100'}`}>
                <div className={`px-6 py-3 border-b flex justify-between items-center shrink-0 ${
                  esOscuro ? 'bg-slate-950 border-slate-800 text-indigo-300' : 'bg-white border-slate-200 text-indigo-700'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <FileText className="w-4 h-4 text-indigo-500" /> Separata_Oficial_CLASE_{claseActual.numeroClase}.pdf
                  </div>
                  <span className={`text-[10px] px-2.5 py-1 rounded-md ${
                    esOscuro ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                  }`}>
                    Visualizador Integrado EDUMIN
                  </span>
                </div>
                <div className={`flex-1 p-4 grid place-items-center overflow-y-auto ${
                  esOscuro ? 'bg-slate-900/50' : 'bg-slate-200/50'
                }`}>
                  <div className={`w-full max-w-2xl p-6 sm:p-8 rounded-2xl shadow-xl text-left space-y-4 border ${
                    esOscuro ? 'bg-slate-950 text-slate-100 border-slate-800' : 'bg-white text-slate-900 border-slate-200'
                  }`}>
                    <div className={`border-b pb-3 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Documento oficial de estudio</span>
                      <h4 className="font-bold text-base sm:text-lg mt-1">{claseActual.tituloClase}</h4>
                    </div>
                    <p className={`text-xs leading-relaxed ${esOscuro ? 'text-slate-400' : 'text-slate-600'}`}>
                      El presente material de estudio contiene los contenidos y ejercicios aplicados correspondientes a esta sesión académica.
                    </p>
                    <div className={`p-4 rounded-xl text-xs italic ${
                      esOscuro ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600'
                    }`}>
                      [ Vista previa interactiva de la separata oficial de lectura obligatoria cargada en Supabase ]
                    </div>
                  </div>
                </div>
              </div>
            )}

            {contenidoPrincipal === 'resumen_video' && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${
                esOscuro ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-black' : 'bg-gradient-to-br from-indigo-50 via-white to-slate-100'
              }`}>
                <div className={`size-14 rounded-2xl grid place-items-center mb-3 ${
                  esOscuro ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-100 text-indigo-600 border border-indigo-200'
                }`}>
                  <Video className="w-7 h-7" />
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-2 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  Cápsula de Resumen en Video
                </h3>
                <iframe 
                  src={parteActiva.videoUrl} 
                  title="Resumen en Video"
                  className="w-full max-w-lg h-44 rounded-xl border border-slate-700 shadow-lg mt-1"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {contenidoPrincipal === 'resumen_audio' && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${
                esOscuro ? 'bg-gradient-to-br from-emerald-950 via-slate-900 to-black' : 'bg-gradient-to-br from-emerald-50 via-white to-slate-100'
              }`}>
                <div className={`size-14 rounded-2xl grid place-items-center mb-3 ${
                  esOscuro ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'
                }`}>
                  <Headphones className="w-7 h-7" />
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-2 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  Audio Podcast
                </h3>
                <div className={`w-full max-w-md p-4 rounded-xl flex items-center gap-4 mt-2 border ${
                  esOscuro ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                }`}>
                  <button className="size-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white grid place-items-center font-bold transition-colors shrink-0 shadow">
                    ▶
                  </button>
                  <div className="flex-1 text-left">
                    <p className={`text-xs font-bold truncate ${esOscuro ? 'text-white' : 'text-slate-800'}`}>
                      Podcast_CLASE_{claseActual.numeroClase}.mp3
                    </p>
                    <div className={`w-full h-2 rounded-full mt-2 overflow-hidden ${esOscuro ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div className="bg-emerald-500 h-full w-2/5"></div>
                    </div>
                  </div>
                  <span className={`text-xs shrink-0 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>15 min</span>
                </div>
              </div>
            )}

          </div>

          {/* TEMA ACTIVO Y SELECTOR DE SESIONES DEL TEMA */}
          {temaActual && temaActual.clases && temaActual.clases.length > 0 && (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-800/20">
                <div className="min-w-0">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">
                    {moduloActualObj?.nombre || 'Tema Activo'}
                  </span>
                  <h3 className={`text-sm sm:text-base font-bold leading-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                    {temaActual.titulo}
                  </h3>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border shrink-0 ${
                  esOscuro ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                }`}>
                  {temaActual.clases.filter((c: ClaseCompleta) => completadosMap[c.id]).length} de {temaActual.clases.length} sesiones completadas
                </span>
              </div>

              {/* Botones de Sesiones (Sesión 1, Sesión 2) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {temaActual.clases.map((claseItem: ClaseCompleta, sIdx: number) => {
                  const esSesionActiva = claseActual?.id === claseItem.id;
                  const esSesionCompletada = Boolean(completadosMap[claseItem.id]);

                  return (
                    <button
                      key={claseItem.id}
                      onClick={() => seleccionarSesion(moduloActivo, claseItem)}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                        esSesionActiva
                          ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-bold'
                          : esOscuro
                            ? 'bg-slate-800/80 border-slate-700/80 text-slate-200 hover:bg-slate-800'
                            : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className={`size-7 rounded-lg grid place-items-center shrink-0 font-extrabold text-xs ${
                          esSesionActiva 
                            ? 'bg-white/20 text-white' 
                            : esOscuro ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          📹
                        </div>
                        <div className="min-w-0">
                          <span className={`text-[10px] uppercase tracking-wider block ${
                            esSesionActiva ? 'text-indigo-100 font-bold' : 'text-indigo-400 font-semibold'
                          }`}>
                            Sesión {sIdx + 1} de {temaActual.clases.length}
                          </span>
                          <p className="text-xs truncate font-medium">
                            {claseItem.tituloClase.replace(/^CLASE \d+:\s*/i, '')}
                          </p>
                        </div>
                      </div>
                      {esSesionCompletada ? (
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${esSesionActiva ? 'text-white' : 'text-emerald-500'}`} />
                      ) : (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full shrink-0 font-semibold ${
                          esSesionActiva ? 'bg-white/20 text-white' : esOscuro ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                        }`}>
                          Disponible
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* CONTROLES DE LA CLASE, BOTÓN COMPLETAR Y NAVEGACIÓN */}
          <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
            esOscuro ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className={`text-lg sm:text-xl font-bold leading-snug ${
                  esOscuro ? 'text-white' : 'text-slate-900'
                }`}>
                  {claseActual.tituloClase}
                </h2>
                {contenidoPrincipal !== 'video_clase' && (
                  <p className={`text-xs mt-1 font-medium ${esOscuro ? 'text-indigo-400' : 'text-indigo-600'}`}>
                    Viendo: {recursoActivoInfo}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                {contenidoPrincipal !== 'video_clase' && (
                  <button 
                    onClick={() => activarRecursoEnVisor('video_clase', 'Video de la Clase')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow flex items-center justify-center gap-2 shrink-0"
                  >
                    <Video className="w-4 h-4" /> Ver Video Principal
                  </button>
                )}
              </div>
            </div>

            {/* BARRA DE NAVEGACIÓN SECUENCIAL */}
            <div className={`mt-5 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              esOscuro ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <button
                type="button"
                onClick={irAAnterior}
                disabled={!itemAnterior}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
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

              <div className={`text-center text-xs font-semibold px-4 py-1.5 rounded-lg ${
                esOscuro ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-100 text-slate-600'
              }`}>
                Sesión {indiceActualPlano >= 0 ? indiceActualPlano + 1 : 1} de {todasLasPartes.length}
              </div>

              <button
                type="button"
                onClick={irASiguiente}
                disabled={!itemSiguiente}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold px-4 py-2 rounded-xl border transition-all shrink-0 cursor-pointer ${
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

          {/* PESTAÑAS (TABS): RESUMEN, RECURSOS Y FORO */}
          <div className="mt-4">
            <div className={`flex flex-wrap items-center gap-2 border-b pb-3 ${
              esOscuro ? 'border-slate-800' : 'border-slate-200'
            }`}>
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
                Recursos Multimedia
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
                Foro de Consultas
              </button>
            </div>

            <div className="mt-5 text-sm leading-relaxed">
              
              {/* TAB RESUMEN */}
              {tabActiva === 'resumen' && (
                <div className={`p-6 rounded-2xl border space-y-4 ${
                  esOscuro ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                }`}>
                  <h4 className={`font-bold text-sm tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                    Objetivos y Puntos Clave de la Sesión:
                  </h4>
                  
                  <p className={`text-xs sm:text-sm leading-relaxed ${esOscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                    En esta sesión se abordaron los principios fundamentales de {claseActual.tituloClase}. Los contenidos han sido validados por el equipo académico de EDUMIN y están alineados a los estándares de la industria minera.
                  </p>

                  <ul className={`list-disc list-outside pl-5 space-y-2 text-xs sm:text-sm leading-relaxed ${
                    esOscuro ? 'text-slate-300 marker:text-indigo-400' : 'text-slate-700 marker:text-indigo-600'
                  }`}>
                    {parteActiva.resumen.puntosClave.map((punto, idx) => (
                      <li key={idx}>
                        {punto}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* TAB RECURSOS MULTIMEDIA Y DOCUMENTOS CARGADOS POR ADMINISTRADOR */}
              {tabActiva === 'recursos' && (
                <div className="space-y-3">
                  <p className={`text-xs mb-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                    Materiales oficiales de estudio configurados en el catálogo:
                  </p>

                  {parteActiva.recursos.map((rec) => (
                    <div 
                      key={rec.id}
                      className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border gap-4 transition-all ${
                        esOscuro 
                          ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${
                          rec.tipo === 'pdf' ? 'bg-rose-500/20 text-rose-500' :
                          rec.tipo === 'excel' ? 'bg-emerald-500/20 text-emerald-500' :
                          rec.tipo === 'video' ? 'bg-indigo-500/20 text-indigo-500' :
                          'bg-cyan-500/20 text-cyan-500'
                        }`}>
                          {rec.tipo === 'pdf' && <FileText className="w-5 h-5" />}
                          {rec.tipo === 'excel' && <Table className="w-5 h-5" />}
                          {rec.tipo === 'video' && <Video className="w-5 h-5" />}
                          {rec.tipo === 'audio' && <Headphones className="w-5 h-5" />}
                        </div>
                        <div>
                          <h4 className={`font-bold text-xs sm:text-sm ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                            {rec.titulo}
                          </h4>
                          <span className={`text-[11px] ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                            {rec.descripcion}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {rec.tipo === 'pdf' && (
                          <>
                            <button 
                              onClick={() => activarRecursoEnVisor('pdf_visor', 'Separata PDF Oficial')}
                              className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border ${
                                esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" /> Ver PDF
                            </button>
                            <a 
                              href={rec.archivo || '#'} 
                              target="_blank" 
                              rel="noreferrer"
                              className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow"
                            >
                              <Download className="w-3.5 h-3.5" /> Descargar
                            </a>
                          </>
                        )}
                        {rec.tipo === 'excel' && (
                          <a 
                            href={rec.archivo || '#'} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar Excel
                          </a>
                        )}
                        {rec.tipo === 'video' && (
                          <button 
                            onClick={() => activarRecursoEnVisor('resumen_video', 'Cápsula de Resumen en Video')}
                            className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border ${
                              esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver cápula
                          </button>
                        )}
                        {rec.tipo === 'audio' && (
                          <button 
                            onClick={() => activarRecursoEnVisor('resumen_audio', 'Podcast de Audio')}
                            className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border ${
                              esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" /> Escuchar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
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

        </div>

        {/* SIDEBAR DERECHO (30%) - TEMARIO CONTINUO */}
        <aside className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l flex flex-col shrink-0 lg:sticky lg:top-16 lg:h-[calc(100vh-4rem)] lg:overflow-y-auto transition-colors ${
          esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          {/* Header del temario con avance integrado */}
          <div className={`p-4 sm:p-5 border-b shrink-0 sticky top-0 z-10 backdrop-blur-md ${
            esOscuro ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95 shadow-2xs'
          }`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className={`font-bold text-base ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                Temario del diplomado
              </h3>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-md border ${
                diplomadoActual.avancePorcentaje > 0 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : esOscuro ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                {diplomadoActual.avancePorcentaje}%
              </span>
            </div>
            
            {/* Barra de progreso real calculada */}
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className={esOscuro ? 'text-slate-400' : 'text-slate-500'}>
                  Avance general
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

          {/* Lista Continua de Módulos y Clases */}
          <div className="p-4 space-y-6 pb-8">
            {diplomadoActual.modulos.map((mod: any) => {
              const estaModCompletado = Boolean(completadosMap[mod.codigo] || mod.completado);

              return (
                <div key={mod.id} className="space-y-2">
                  <div className={`pt-2 pb-2 px-1 border-b flex items-center justify-between ${
                    esOscuro ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-800'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">
                        {mod.codigo}
                      </span>
                      <h4 className="font-bold text-xs mt-0.5 leading-snug">
                        {mod.nombre}
                      </h4>
                    </div>
                    <button
                      onClick={() => toggleCompletarLeccion(mod.codigo)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ml-2 border transition-all ${
                        estaModCompletado
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : esOscuro ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {estaModCompletado ? 'Completado ✓' : `${mod.clases.length} clases`}
                    </button>
                  </div>

                  {mod.temas && mod.temas.length > 0 ? (
                    <div className="space-y-2 pt-1">
                      {mod.temas.map((tema: any) => {
                        const temaClases = tema.clases || [];
                        const esTemaCompletado = temaClases.length > 0 && temaClases.every((c: any) => Boolean(completadosMap[c.id] || completadosMap[mod.codigo]));
                        const esTemaSeleccionado = temaActual?.id === tema.id;

                        return (
                          <button
                            key={tema.id}
                            type="button"
                            onClick={() => seleccionarTema(mod.id, tema)}
                            className={`w-full text-left p-3 rounded-xl flex items-center justify-between text-xs font-semibold transition-all border cursor-pointer ${
                              esTemaSeleccionado
                                ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-bold'
                                : esTemaCompletado
                                  ? esOscuro
                                    ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/50'
                                    : 'bg-emerald-50/80 border-emerald-200 text-emerald-900 hover:bg-emerald-100 shadow-2xs'
                                  : esOscuro
                                    ? 'bg-slate-800/80 border-slate-700/60 text-slate-200 hover:bg-slate-800'
                                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:bg-slate-100 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 pr-2">
                              <Folder className={`w-4 h-4 shrink-0 ${
                                esTemaSeleccionado 
                                  ? 'text-white' 
                                  : esTemaCompletado ? 'text-emerald-500' : 'text-indigo-500'
                              }`} />
                              <span className="truncate text-xs font-bold leading-tight">
                                {tema.titulo}
                              </span>
                            </div>
                            {esTemaCompletado ? (
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md shrink-0 ${
                                esTemaSeleccionado ? 'bg-white/20 text-white' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              }`}>
                                ✓ Completado
                              </span>
                            ) : (
                              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md shrink-0 ${
                                esTemaSeleccionado ? 'bg-white/20 text-white' : esOscuro ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {temaClases.length} sesiones
                              </span>
                            )}
                          </button>
                        );
                      })}

                      {mod.clasesAdicionales && mod.clasesAdicionales.length > 0 && (
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/50 mt-2">
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block px-1">
                            ⭐ Clase Adicional
                          </span>
                          {mod.clasesAdicionales.map((clase: ClaseCompleta) => {
                            const esClaseSeleccionada = claseActual?.id === clase.id;
                            const estaCompletada = estaModCompletado || clase.completada;

                            return (
                              <button 
                                key={clase.id} 
                                onClick={() => seleccionarSesion(mod.id, clase)}
                                className={`w-full p-2.5 rounded-xl flex items-center justify-between text-left transition-all cursor-pointer border ${
                                  esClaseSeleccionada 
                                    ? 'bg-amber-600 text-white border-amber-500 shadow-md font-bold' 
                                    : esOscuro 
                                      ? 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:bg-slate-800' 
                                      : 'bg-amber-50/50 border-amber-200/80 text-amber-900 hover:bg-amber-100/80'
                                }`}
                              >
                                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                                  <div className="pt-0.5 shrink-0">
                                    {estaCompletada ? (
                                      <CheckCircle2 className={`w-4 h-4 shrink-0 ${esClaseSeleccionada ? 'text-white' : 'text-emerald-500'}`} />
                                    ) : (
                                      <div className={`size-4 rounded-full border-2 shrink-0 ${esClaseSeleccionada ? 'border-white' : 'border-amber-400'}`} />
                                    )}
                                  </div>
                                  <span className="text-xs leading-snug truncate">
                                    {clase.tituloClase}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {mod.clases.map((clase: ClaseCompleta) => {
                        const esClaseSeleccionada = claseActual?.id === clase.id;
                        const estaCompletada = estaModCompletado || clase.completada;

                        return (
                          <button 
                            key={clase.id} 
                            onClick={() => seleccionarClaseYParte(mod.id, clase, 1)}
                            className={`w-full p-2.5 rounded-xl flex items-start gap-2.5 text-left transition-all cursor-pointer ${
                              esClaseSeleccionada 
                                ? esOscuro 
                                  ? 'bg-indigo-600/20 text-indigo-200 font-semibold' 
                                  : 'bg-indigo-50 text-indigo-900 font-semibold shadow-2xs' 
                                : esOscuro 
                                  ? 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200' 
                                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                            }`}
                          >
                            <div className="pt-0.5 shrink-0">
                              {estaCompletada ? (
                                <CheckCircle2 className={`w-4 h-4 shrink-0 ${esClaseSeleccionada ? (esOscuro ? 'text-indigo-400' : 'text-indigo-600') : 'text-emerald-500'}`} />
                              ) : (
                                <div className={`size-4 rounded-full border-2 shrink-0 ${
                                  esClaseSeleccionada 
                                    ? (esOscuro ? 'border-indigo-400' : 'border-indigo-600') 
                                    : (esOscuro ? 'border-slate-500' : 'border-slate-400')
                                }`} />
                              )}
                            </div>
                            <span className="text-xs leading-snug line-clamp-2">
                              {clase.tituloClase}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

      </div>
    </div>
  );
}