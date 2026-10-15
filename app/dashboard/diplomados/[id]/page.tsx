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
import { useProfile } from '@/context/profile-context';
import { parseDiplomadosFromProfile, formatearCodigoModulo } from '@/lib/utils/profileParser';
import { 
  obtenerRecursosConLinks, 
  convertirFilasAListaModulos, 
  LeccionRow 
} from '@/lib/data/diplomadosLeccionesService';

export interface RecursoItem {
  id: string;
  tipo: 'pdf' | 'video' | 'audio' | 'interactivo' | 'excel' | 'material';
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

  // Estados del Examen del Módulo
  const [notasModulosMap, setNotasModulosMap] = useState<Record<string, number>>({});
  const [examenActivoModal, setExamenActivoModal] = useState<{ moduloCodigo: string; moduloNombre: string; moduloIdx: number } | null>(null);
  const [pasoModalExamen, setPasoModalExamen] = useState<'indicaciones' | 'cuestionario' | 'resultado' | 'ver_intento'>('indicaciones');
  const [respuestasExamen, setRespuestasExamen] = useState<Record<number, number>>({});
  const [respuestasPorModulo, setRespuestasPorModulo] = useState<Record<string, Record<number, number>>>({});
  const [guardandoExamen, setGuardandoExamen] = useState(false);
  const [resultadoExamen, setResultadoExamen] = useState<{ nota: number; aprobado: boolean } | null>(null);

  const toggleTema = (temaId: string) => {
    setTemasAbiertosMap(prev => ({
      ...prev,
      [temaId]: prev[temaId] === undefined ? false : !prev[temaId]
    }));
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

  const abrirModalExamen = (modCodigo: string, modNombre: string, modIdx: number) => {
    setExamenActivoModal({ moduloCodigo: modCodigo, moduloNombre: modNombre, moduloIdx: modIdx });
    setPasoModalExamen('indicaciones');
    setRespuestasExamen({});
    setResultadoExamen(null);
  };

  const abrirVerIntento = (modCodigo: string, modNombre: string, modIdx: number) => {
    setExamenActivoModal({ moduloCodigo: modCodigo, moduloNombre: modNombre, moduloIdx: modIdx });
    setPasoModalExamen('ver_intento');
    const nota = notasModulosMap[modCodigo] || 0;
    setResultadoExamen({ nota, aprobado: nota >= 12 });
  };

  const rendirExamenModulo = async () => {
    if (!examenActivoModal) return;

    const preguntas = generarPreguntasExamenModulo(examenActivoModal.moduloCodigo, examenActivoModal.moduloNombre);
    let aciertos = 0;
    preguntas.forEach((q, idx) => {
      if (respuestasExamen[idx] === q.respuestaCorrecta) {
        aciertos++;
      }
    });

    const notaFinal = aciertos * 4; // 5 preguntas * 4 pts = 20 max
    const aprobado = notaFinal >= 12; // Nota mínima aprobatoria 12/20

    setGuardandoExamen(true);
    try {
      const modCodigo = examenActivoModal.moduloCodigo;

      const nuevoNotasMap = { ...notasModulosMap, [modCodigo]: notaFinal };
      setNotasModulosMap(nuevoNotasMap);

      // Guardar respuestas seleccionadas para "Ver intento"
      setRespuestasPorModulo(prev => ({
        ...prev,
        [modCodigo]: { ...respuestasExamen }
      }));

      const nuevoCompletadosMap = { ...completadosMap };
      if (aprobado) {
        nuevoCompletadosMap[modCodigo] = true;
        setCompletadosMap(nuevoCompletadosMap);
      }

      setResultadoExamen({ nota: notaFinal, aprobado });
      setPasoModalExamen('resultado');

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

      // Guardar en Supabase via API
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
      console.error('Error al guardar nota de examen en Supabase:', err);
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
        const diplomados = parseDiplomadosFromProfile(profile);
        
        // Buscar el diplomado actual en el perfil del alumno
        const targetSlugNorm = diplomadoId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const dipEnPerfil = Array.isArray(diplomados) 
          ? diplomados.find((d: any) => (d.slug || d.id || d.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetSlugNorm)
          : null;

        if (dipEnPerfil) {
          const map: Record<string, boolean> = {};
          const nMap: Record<string, number> = {};

          if (dipEnPerfil.completadosMap && typeof dipEnPerfil.completadosMap === 'object') {
            Object.assign(map, dipEnPerfil.completadosMap);
          }
          if (Array.isArray(dipEnPerfil.modulos)) {
            dipEnPerfil.modulos.forEach((m: any, idx: number) => {
              const key = m.codigo || m.id || `Módulo ${(idx + 1).toString().padStart(2, '0')}`;
              if (map[key] === undefined && m.completado !== undefined) {
                map[key] = Boolean(m.completado);
              }
              if (m.nota !== undefined && m.nota !== null && (m.rendido === true || m.nota > 0)) {
                nMap[key] = Number(m.nota);
              }
            });
          }
          setCompletadosMap(map);
          setNotasModulosMap(nMap);
        } else {
          setCompletadosMap({});
          setNotasModulosMap({});
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

    // 1. PRIORIDAD: Usar datos de la tabla diplomados_lecciones de Supabase si existen
    if (leccionesTabla && leccionesTabla.length > 0) {
      const modulosDeTabla = convertirFilasAListaModulos(leccionesTabla);

      const modulosProcesados = modulosDeTabla.map((mod: any, modIdx: number) => {
        const modCodigoKey = mod.codigo || `Módulo ${(modIdx + 1).toString().padStart(2, '0')}`;
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

            const partes: ParteClase[] = [
              {
                id: `${claseId}-p1`,
                numero: 1,
                titulo: `Sesión Completa`,
                subtitulo: claseTitle,
                duracion: '60 min',
                videoUrl: driveVideoUrl,
                completada: esCompletada,
                resumen: {
                  objetivo: `Comprender los conceptos principales y aplicación práctica de: ${claseTitle}.`,
                  puntosClave: [
                    `Revisión de la normativa vigente y estándares técnicos aplicables.`,
                    `Criterios clave para la toma de decisiones operativas y de gestión.`,
                    `Estrategias de análisis y resolución de problemas en el sector.`
                  ]
                },
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

          const partes: ParteClase[] = [
            {
              id: `${claseId}-p1`,
              numero: 1,
              titulo: `Sesión Completa`,
              subtitulo: claseTitle,
              duracion: '60 min',
              videoUrl: driveVideoUrl,
              completada: esCompletada,
              resumen: {
                objetivo: `Comprender los conceptos principales y aplicación práctica de: ${claseTitle}.`,
                puntosClave: [
                  `Revisión de la normativa vigente y estándares técnicos aplicables.`,
                  `Criterios clave para la toma de decisiones operativas y de gestión.`,
                  `Estrategias de análisis y resolución de problemas en el sector.`
                ]
              },
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
      const modCodigoKey = mod.codigo || `Módulo ${(modIdx + 1).toString().padStart(2, '0')}`;
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
              resumen: {
                objetivo: `Comprender los conceptos principales y aplicación práctica de: ${claseTitle}.`,
                puntosClave: [
                  `Revisión de la normativa vigente y estándares técnicos aplicables.`,
                  `Criterios clave para la toma de decisiones operativas y de gestión.`,
                  `Estrategias de análisis y resolución de problemas en el sector.`
                ]
              },
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
              resumen: {
                objetivo: `Comprender los conceptos principales y aplicación práctica de: ${claseTitle}.`,
                puntosClave: [
                  `Revisión de la normativa vigente y estándares técnicos aplicables.`,
                  `Criterios clave para la toma de decisiones operativas y de gestión.`,
                  `Estrategias de análisis y resolución de problemas en el sector.`
                ]
              },
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
      titulo: tituloBase,
      avancePorcentaje,
      progreso: avancePorcentaje,
      modulos: modulosProcesados
    };
  }, [diplomadoId, catalogoMateriales, completadosMap, leccionesTabla]);

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
    const nombreCompleto = [nombres, apellidos].filter(Boolean).join(' ') || 'Estudiante';
    setListaComentarios([{ autor: nombreCompleto, texto: comentario, fecha: 'Justo ahora' }, ...listaComentarios]);
    setComentario('');
  };

  const activarRecursoEnVisor = (tipo: 'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo', info: string, url?: string) => {
    setContenidoPrincipal(tipo);
    setRecursoActivoInfo(info);
    if (url) {
      setRecursoUrlActivo(url);
    }
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
                src={(parteActiva.videoUrl || '').replace(/\/view(\?.*)?$/, '/preview')} 
                title={`${claseActual.tituloClase} - ${parteActiva.titulo}`}
                className="w-full h-full border-0 absolute inset-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            )}

            {/* VISOR DE PDF INTEGRADO */}
            {contenidoPrincipal === 'pdf_visor' && (
              <div className={`absolute inset-0 flex flex-col ${esOscuro ? 'bg-slate-900' : 'bg-slate-100'}`}>
                <div className={`px-4 sm:px-6 py-2.5 border-b flex justify-between items-center shrink-0 ${
                  esOscuro ? 'bg-slate-950 border-slate-800 text-indigo-300' : 'bg-white border-slate-200 text-indigo-700'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-bold truncate">
                    <FileText className="w-4 h-4 text-indigo-500 shrink-0" /> Material de clases: {claseActual.tituloClase}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => activarRecursoEnVisor('video_clase', 'Clase principal en video')}
                      className="text-[11px] font-bold px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition cursor-pointer"
                    >
                      Volver al Video
                    </button>
                    {(recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'pdf')?.archivo) && (
                      <a
                        href={recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'pdf')?.archivo || '#'}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="text-[11px] font-bold px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="size-3" /> Descargar
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full h-full relative bg-slate-950">
                  {Boolean(recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'pdf')?.archivo) ? (
                    <iframe
                      src={(recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'pdf')?.archivo || '').replace('/view', '/preview')}
                      className="w-full h-full border-0 absolute inset-0"
                      title="Visor PDF Oficial"
                    />
                  ) : (
                    <div className="flex-1 p-8 grid place-items-center text-center text-slate-400">
                      <p className="text-xs">No hay enlace de material de clases configurado para esta sesión.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* VISOR DE RESUMEN EN VIDEO */}
            {contenidoPrincipal === 'resumen_video' && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 text-center ${
                esOscuro ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-black' : 'bg-gradient-to-br from-indigo-50 via-white to-slate-100'
              }`}>
                <div className="w-full flex justify-between items-center mb-3 max-w-2xl px-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-indigo-600/30 text-indigo-400 grid place-items-center">
                      <Video className="w-3.5 h-3.5" />
                    </div>
                    <h3 className={`text-xs sm:text-sm font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                      Resumen en Video
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {(recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'video')?.archivo) && (
                      <a
                        href={recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'video')?.archivo}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="text-xs font-bold px-3 py-1.5 bg-indigo-700/70 hover:bg-indigo-600 text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </a>
                    )}
                    <button
                      onClick={() => activarRecursoEnVisor('video_clase', 'Clase principal en video')}
                      className="text-xs font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition cursor-pointer"
                    >
                      Volver al Video Principal
                    </button>
                  </div>
                </div>
                <iframe 
                  src={(recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'video')?.archivo || parteActiva.videoUrl).replace('/view', '/preview')} 
                  title="Resumen en Video"
                  className="w-full max-w-2xl flex-1 rounded-2xl border border-slate-700 shadow-2xl"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}

            {/* VISOR DE RESUMEN EN AUDIO */}
            {contenidoPrincipal === 'resumen_audio' && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 text-center ${
                esOscuro ? 'bg-gradient-to-br from-purple-950 via-slate-900 to-black' : 'bg-gradient-to-br from-purple-50 via-white to-slate-100'
              }`}>
                <div className="w-full flex justify-between items-center mb-3 max-w-3xl px-2 shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="size-7 rounded-lg bg-purple-600/30 text-purple-400 grid place-items-center">
                      <Headphones className="w-3.5 h-3.5" />
                    </div>
                    <h3 className={`text-xs sm:text-sm font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                      Resumen en Audio
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {(recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'audio')?.archivo) && (
                      <a
                        href={recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'audio')?.archivo}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="text-xs font-bold px-3 py-1.5 bg-purple-700/70 hover:bg-purple-600 text-white rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </a>
                    )}
                    <button
                      onClick={() => activarRecursoEnVisor('video_clase', 'Clase principal en video')}
                      className="text-xs font-bold px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition cursor-pointer"
                    >
                      Volver al Video
                    </button>
                  </div>
                </div>

                {(() => {
                  const audioUrl = recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'audio')?.archivo || '';
                  if (!audioUrl) {
                    return (
                      <div className="p-8 text-center text-slate-400">
                        <p className="text-xs italic">Enlace de resumen en audio no configurado aún.</p>
                      </div>
                    );
                  }

                  const esAudioDirecto = /\.(mp3|wav|ogg|m4a|aac)(\?.*)?$/i.test(audioUrl);

                  if (esAudioDirecto) {
                    return (
                      <div className={`w-full max-w-md p-6 rounded-2xl border text-center space-y-4 ${
                        esOscuro ? 'bg-slate-900/90 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-xl'
                      }`}>
                        <p className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">
                          Reproducción de Audio Oficial
                        </p>
                        <p className="text-xs sm:text-sm font-bold truncate">
                          {claseActual.tituloClase}
                        </p>
                        <audio 
                          controls 
                          autoPlay 
                          src={audioUrl} 
                          className="w-full mt-3" 
                        />
                      </div>
                    );
                  }

                  const embedUrl = audioUrl.includes('drive.google.com') && audioUrl.includes('/view')
                    ? audioUrl.replace('/view', '/preview')
                    : audioUrl;

                  return (
                    <div className="w-full max-w-3xl flex-1 flex flex-col rounded-2xl overflow-hidden border border-purple-800/40 shadow-2xl bg-black relative">
                      <iframe
                        src={embedUrl}
                        title="Resumen en Audio"
                        className="w-full h-full flex-1 border-0 absolute inset-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  );
                })()}
              </div>
            )}

            {/* VISOR DE RESUMEN INTERACTIVO */}
            {contenidoPrincipal === 'resumen_interactivo' && (
              <div className={`absolute inset-0 flex flex-col ${esOscuro ? 'bg-slate-900' : 'bg-slate-100'}`}>
                <div className={`px-4 sm:px-6 py-2.5 border-b flex justify-between items-center shrink-0 ${
                  esOscuro ? 'bg-slate-950 border-slate-800 text-amber-300' : 'bg-white border-slate-200 text-amber-700'
                }`}>
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Resumen Interactivo
                  </div>
                  <div className="flex items-center gap-2">
                    {(recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'interactivo')?.archivo) && (
                      <a
                        href={recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'interactivo')?.archivo}
                        target="_blank"
                        rel="noreferrer"
                        download
                        className="text-[11px] font-bold px-3 py-1 bg-amber-700/60 hover:bg-amber-600 text-white rounded-lg transition inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Download className="size-3" /> Descargar
                      </a>
                    )}
                    <button
                      onClick={() => activarRecursoEnVisor('video_clase', 'Clase principal en video')}
                      className="text-[11px] font-bold px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded-lg transition cursor-pointer"
                    >
                      Volver al Video
                    </button>
                  </div>
                </div>
                <div className="flex-1 w-full h-full relative">
                  {(recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'interactivo')?.archivo) ? (
                    <iframe
                      src={(recursoUrlActivo || parteActiva.recursos.find(r => r.tipo === 'interactivo')?.archivo || '').replace('/view', '/preview')}
                      className="w-full h-full border-0 absolute inset-0"
                      title="Resumen Interactivo"
                    />
                  ) : (
                    <div className="flex-1 p-8 grid place-items-center text-center text-slate-400">
                      <p className="text-sm">Resumen interactivo no disponible.</p>
                    </div>
                  )}
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
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <Video className="w-4 h-4" /> Ver Video Principal
                  </button>
                )}
              </div>
            </div>

            {/* Píldoras de Acceso Rápido para Recursos con Enlace */}
            {parteActiva && parteActiva.recursos && parteActiva.recursos.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-800/30">
                <span className={`text-[11px] font-bold uppercase tracking-wider mr-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  Recursos disponibles:
                </span>
                {parteActiva.recursos.map((rec) => {
                  if (rec.tipo === 'video') {
                    return (
                      <button
                        key={rec.id}
                        onClick={() => activarRecursoEnVisor('resumen_video', 'Resumen en Video', rec.archivo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          contenidoPrincipal === 'resumen_video'
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                            : esOscuro 
                              ? 'bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border-indigo-800/60'
                              : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                        }`}
                      >
                        <Video className="size-3.5" /> Resumen en Video
                      </button>
                    );
                  }
                  if (rec.tipo === 'audio') {
                    return (
                      <button
                        key={rec.id}
                        onClick={() => activarRecursoEnVisor('resumen_audio', 'Resumen en Audio', rec.archivo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          contenidoPrincipal === 'resumen_audio'
                            ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                            : esOscuro 
                              ? 'bg-purple-950/60 hover:bg-purple-900/60 text-purple-300 border-purple-800/60'
                              : 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200'
                        }`}
                      >
                        <Headphones className="size-3.5" /> Resumen en Audio
                      </button>
                    );
                  }
                  if (rec.tipo === 'pdf') {
                    return (
                      <button
                        key={rec.id}
                        onClick={() => activarRecursoEnVisor('pdf_visor', 'Material de clases', rec.archivo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          contenidoPrincipal === 'pdf_visor'
                            ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                            : esOscuro 
                              ? 'bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border-rose-800/60'
                              : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                        }`}
                      >
                        <FileText className="size-3.5" /> Material de clases
                      </button>
                    );
                  }
                  if (rec.tipo === 'interactivo') {
                    return (
                      <button
                        key={rec.id}
                        onClick={() => activarRecursoEnVisor('resumen_interactivo', 'Resumen Interactivo', rec.archivo)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          contenidoPrincipal === 'resumen_interactivo'
                            ? 'bg-amber-600 text-white border-amber-500 shadow-sm'
                            : esOscuro 
                              ? 'bg-amber-950/60 hover:bg-amber-900/60 text-amber-300 border-amber-800/60'
                              : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                        }`}
                      >
                        <Sparkles className="size-3.5" /> Resumen Interactivo
                      </button>
                    );
                  }
                  return (
                    <a
                      key={rec.id}
                      href={rec.archivo || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        esOscuro 
                          ? 'bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                          : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      <Download className="size-3.5" /> {rec.titulo}
                    </a>
                  );
                })}
              </div>
            )}

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

                  {parteActiva.recursos && parteActiva.recursos.length > 0 ? (
                    parteActiva.recursos.map((rec) => (
                      <div 
                        key={rec.id}
                        className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border gap-4 transition-all ${
                          esOscuro 
                            ? 'bg-slate-900 border-slate-800 hover:border-slate-700' 
                            : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${
                            rec.tipo === 'pdf' ? 'bg-rose-500/20 text-rose-500' :
                            rec.tipo === 'excel' ? 'bg-emerald-500/20 text-emerald-500' :
                            rec.tipo === 'video' ? 'bg-indigo-500/20 text-indigo-500' :
                            rec.tipo === 'audio' ? 'bg-purple-500/20 text-purple-500' :
                            rec.tipo === 'interactivo' ? 'bg-amber-500/20 text-amber-500' :
                            'bg-cyan-500/20 text-cyan-500'
                          }`}>
                            {rec.tipo === 'pdf' && <FileText className="w-5 h-5" />}
                            {rec.tipo === 'excel' && <Table className="w-5 h-5" />}
                            {rec.tipo === 'video' && <Video className="w-5 h-5" />}
                            {rec.tipo === 'audio' && <Headphones className="w-5 h-5" />}
                            {rec.tipo === 'interactivo' && <Sparkles className="w-5 h-5" />}
                            {rec.tipo === 'material' && <Folder className="w-5 h-5" />}
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

                        <div className="flex items-center gap-2 shrink-0">
                          {rec.tipo === 'pdf' && (
                            <>
                              <button 
                                onClick={() => activarRecursoEnVisor('pdf_visor', 'Material de clases', rec.archivo)}
                                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border cursor-pointer ${
                                  esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver PDF
                              </button>
                              <a 
                                href={rec.archivo || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                download
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Descargar
                              </a>
                            </>
                          )}
                          {rec.tipo === 'excel' && (
                            <>
                              <a 
                                href={rec.archivo || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border cursor-pointer ${
                                  esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" /> Abrir
                              </a>
                              <a 
                                href={rec.archivo || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                download
                                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Descargar Excel
                              </a>
                            </>
                          )}
                          {rec.tipo === 'video' && (
                            <>
                              <button 
                                onClick={() => activarRecursoEnVisor('resumen_video', 'Resumen en Video', rec.archivo)}
                                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border cursor-pointer ${
                                  esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" /> Ver Video
                              </button>
                              <a 
                                href={rec.archivo || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                download
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Descargar
                              </a>
                            </>
                          )}
                          {rec.tipo === 'audio' && (
                            <>
                              <button 
                                onClick={() => activarRecursoEnVisor('resumen_audio', 'Resumen en Audio', rec.archivo)}
                                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border cursor-pointer ${
                                  esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                }`}
                              >
                                <Headphones className="w-3.5 h-3.5" /> Escuchar
                              </button>
                              <a 
                                href={rec.archivo || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                download
                                className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Descargar
                              </a>
                            </>
                          )}
                          {rec.tipo === 'interactivo' && (
                            <>
                              <button 
                                onClick={() => activarRecursoEnVisor('resumen_interactivo', 'Resumen Interactivo', rec.archivo)}
                                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border cursor-pointer ${
                                  esOscuro ? 'bg-amber-900/40 hover:bg-amber-900/60 text-amber-300 border-amber-700' : 'bg-amber-100 hover:bg-amber-200 text-amber-800 border-amber-200'
                                }`}
                              >
                                <Sparkles className="w-3.5 h-3.5" /> Abrir Interactivo
                              </button>
                              <a 
                                href={rec.archivo || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                download
                                className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Descargar
                              </a>
                            </>
                          )}
                          {rec.tipo === 'material' && (
                            <>
                              <a 
                                href={rec.archivo || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border cursor-pointer ${
                                  esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                                }`}
                              >
                                <Eye className="w-3.5 h-3.5" /> Abrir
                              </a>
                              <a 
                                href={rec.archivo || '#'} 
                                target="_blank" 
                                rel="noreferrer"
                                download
                                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> Descargar
                              </a>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className={`p-8 text-center rounded-2xl border border-dashed ${
                      esOscuro ? 'border-slate-800 text-slate-400 bg-slate-900/40' : 'border-slate-200 text-slate-500 bg-slate-50'
                    }`}>
                      <p className="text-xs">
                        Esta sesión cuenta con su clase magistral en video. No hay materiales adicionales requeridos para este tema.
                      </p>
                    </div>
                  )}
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
          <div className="p-4 space-y-5 pb-8">
            {diplomadoActual.modulos.map((mod: any, modIdx: number) => {
              const estaModCompletado = Boolean(completadosMap[mod.codigo] || mod.completado);

              return (
                <div 
                  key={mod.id} 
                  className={`p-4 rounded-2xl border space-y-3 transition-all ${
                    esOscuro 
                      ? 'bg-slate-900/90 border-slate-800' 
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  <div className={`pb-2.5 border-b space-y-2 ${
                    esOscuro ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest block">
                          {formatearCodigoModulo(mod.codigo, modIdx)}
                        </span>
                        <h4 className="font-bold text-xs mt-0.5 leading-snug">
                          {mod.nombre}
                        </h4>
                      </div>
                      <button
                        onClick={() => toggleCompletarLeccion(mod.codigo)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ml-2 border transition-all cursor-pointer ${
                          estaModCompletado
                            ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                            : esOscuro ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {estaModCompletado ? 'Completado ✓' : `${mod.clases.length} clases`}
                      </button>
                    </div>
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
                        <div className="space-y-1.5 pt-2 border-t border-slate-200/50 dark:border-slate-800/50 mt-2">
                          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block px-1">
                            ⭐ Clase Adicional
                          </span>
                          {mod.clasesAdicionales.map((clase: ClaseCompleta) => {
                            const esClaseSeleccionada = claseActual?.id === clase.id;
                            const estaCompletada = estaModCompletado || Boolean(completadosMap[clase.id]);

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
                        const estaCompletada = estaModCompletado || Boolean(completadosMap[clase.id]);

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

                  {/* Fila del Examen del Módulo (Ubicado después de los temas y clases) */}
                  <div className={`mt-3 pt-2.5 border-t flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl p-3 ${
                    esOscuro ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`size-8 rounded-lg flex items-center justify-center shrink-0 ${
                        notasModulosMap[mod.codigo] !== undefined
                          ? (notasModulosMap[mod.codigo] >= 12 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500')
                          : 'bg-indigo-500/10 text-indigo-500'
                      }`}>
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className={`text-xs font-bold block truncate ${esOscuro ? 'text-slate-100' : 'text-slate-800'}`}>
                          Examen Modular {modIdx + 1}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-medium">
                          {notasModulosMap[mod.codigo] !== undefined
                            ? `Nota: ${notasModulosMap[mod.codigo].toString().padStart(2, '0')}/20 · ${notasModulosMap[mod.codigo] >= 12 ? 'Aprobado' : 'Desaprobado'}`
                            : '1 intento - 30 min'
                          }
                        </span>
                      </div>
                    </div>

                    {notasModulosMap[mod.codigo] !== undefined ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => abrirVerIntento(mod.codigo, mod.nombre, modIdx)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1 cursor-pointer ${
                            esOscuro 
                              ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' 
                              : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 shadow-2xs'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" /> Ver intento
                        </button>

                        {notasModulosMap[mod.codigo] >= 12 ? (
                          <Link
                            href="/dashboard/certificados"
                            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
                          >
                            <Award className="w-3.5 h-3.5" /> Descargar certificado
                          </Link>
                        ) : (
                          <a
                            href={`https://wa.me/51924400268?text=${encodeURIComponent(`Hola EDUMIN, desaprobé el Examen Modular ${modIdx + 1} en ${diplomadoActual.titulo}. Deseo pagar los S/ 25.00 para rendir mi Examen Sustitutorio.`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-3 py-1.5 rounded-lg transition-colors shadow-2xs"
                            title="Solo tienes 1 intento. Para rendir nuevamente debes pagar el sustitutorio de S/ 25."
                          >
                            <span>Sustitutorio (S/ 25)</span>
                          </a>
                        )}
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => abrirModalExamen(mod.codigo, mod.nombre, modIdx)}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 shadow-2xs cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" /> Rendir examen
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

      </div>

      {/* MODAL DE EVALUACIÓN MODULAR */}
      {examenActivoModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className={`max-w-2xl w-full rounded-2xl p-6 shadow-2xl space-y-6 border transition-all my-8 ${
            esOscuro ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Header Modal */}
            <div className="flex items-start justify-between border-b pb-4 border-slate-200 dark:border-slate-800">
              <div>
                <span className="text-xs font-bold text-indigo-500 uppercase tracking-wider block">
                  Examen Modular {examenActivoModal.moduloIdx + 1} · Evaluación Académica
                </span>
                <h3 className="text-base font-bold mt-1 leading-snug">
                  {examenActivoModal.moduloNombre}
                </h3>
              </div>
              <button
                onClick={() => setExamenActivoModal(null)}
                className={`p-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  esOscuro ? 'hover:bg-slate-800 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
                }`}
              >
                ✕
              </button>
            </div>

            {/* PASO 1: INDICACIONES PREVIAS AL EXAMEN */}
            {pasoModalExamen === 'indicaciones' && (
              <div className="space-y-5">
                <div className={`p-4 rounded-xl border ${
                  esOscuro ? 'bg-slate-800/60 border-slate-750' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-sm font-bold mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    Indicaciones para rendir tu evaluación
                  </h4>
                  <ul className="space-y-3 text-xs leading-relaxed">
                    <li className="flex items-start gap-2.5">
                      <span className="font-bold text-indigo-500 shrink-0">⏱️ Tiempo:</span>
                      <span>Tendrás un tiempo límite de <strong>30 minutos</strong> para responder el cuestionario completo.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-bold text-indigo-500 shrink-0">🎯 Intentos:</span>
                      <span>Cuentas con <strong>1 solo intento</strong> para rendir este examen modular.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-bold text-indigo-500 shrink-0">📝 Estructura:</span>
                      <span>Consta de <strong>5 preguntas objetivas</strong> de opción múltiple relacionadas al módulo cursado.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-bold text-indigo-500 shrink-0">🏆 Aprobación:</span>
                      <span>La nota mínima aprobatoria es <strong>12 / 20</strong> (cada pregunta correcta suma 4 puntos).</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-bold text-indigo-500 shrink-0">📜 Certificación:</span>
                      <span>Al aprobar con 12 o más, tu certificado modular se activará automáticamente para descarga en <strong>Mis Certificados</strong>.</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <span className="font-bold text-amber-500 shrink-0">⚠️ Sustitutorio:</span>
                      <span>En caso de desaprobar, deberás abonar el derecho de <strong>S/ 25.00</strong> para habilitar un Examen Sustitutorio.</span>
                    </li>
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setExamenActivoModal(null)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                      esOscuro ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPasoModalExamen('cuestionario')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" /> Comenzar Examen Ahora
                  </button>
                </div>
              </div>
            )}

            {/* PASO 2: CUESTIONARIO */}
            {pasoModalExamen === 'cuestionario' && (
              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-1">
                {generarPreguntasExamenModulo(examenActivoModal.moduloCodigo, examenActivoModal.moduloNombre).map((q, qIdx) => (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border space-y-3 ${
                      esOscuro ? 'bg-slate-800/60 border-slate-750' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <h4 className="text-xs font-bold leading-snug">
                      {qIdx + 1}. {q.pregunta}
                    </h4>
                    <div className="space-y-2">
                      {q.opciones.map((opt, optIdx) => {
                        const seleccionada = respuestasExamen[qIdx] === optIdx;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => setRespuestasExamen(prev => ({ ...prev, [qIdx]: optIdx }))}
                            className={`w-full text-left p-3 rounded-lg text-xs flex items-center gap-3 transition-all border cursor-pointer ${
                              seleccionada
                                ? 'bg-indigo-600 text-white border-indigo-500 font-semibold shadow-2xs'
                                : esOscuro
                                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <div className={`size-4 rounded-full border grid place-items-center shrink-0 ${
                              seleccionada ? 'border-white bg-white text-indigo-600 font-bold' : 'border-slate-400'
                            }`}>
                              {seleccionada && <div className="size-2 rounded-full bg-indigo-600" />}
                            </div>
                            <span className="leading-tight">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Botón de Envío */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <span className={`text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                    Preguntas respondidas: {Object.keys(respuestasExamen).length} / 5
                  </span>
                  <button
                    onClick={rendirExamenModulo}
                    disabled={Object.keys(respuestasExamen).length < 5 || guardandoExamen}
                    className={`px-6 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md ${
                      Object.keys(respuestasExamen).length === 5 && !guardandoExamen
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer'
                        : 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                    }`}
                  >
                    {guardandoExamen ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Guardando Nota en Supabase...
                      </>
                    ) : (
                      'Entregar y Finalizar Examen'
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* PASO 3: RESULTADOS INMEDIATOS */}
            {pasoModalExamen === 'resultado' && resultadoExamen && (
              <div className="space-y-6 text-center py-2">
                <div className={`p-6 rounded-2xl border ${
                  resultadoExamen.aprobado
                    ? esOscuro ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : esOscuro ? 'bg-rose-950/40 border-rose-800/60 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="text-4xl mb-2">
                    {resultadoExamen.aprobado ? '🎉' : '❌'}
                  </div>
                  <h4 className="text-lg font-bold">
                    {resultadoExamen.aprobado ? '¡Examen Aprobado con Éxito!' : 'Examen No Aprobado'}
                  </h4>
                  <p className="text-3xl font-black my-2">
                    Nota: {resultadoExamen.nota.toString().padStart(2, '0')} / 20
                  </p>
                  <p className="text-xs max-w-md mx-auto leading-relaxed">
                    {resultadoExamen.aprobado
                      ? '¡Felicitaciones! Has superado la nota mínima aprobatoria (12/20). Tu certificado de este módulo ya se encuentra disponible para descargar en la sección Mis Certificados.'
                      : 'Obtuviste una calificación menor a 12/20 y has completado tu único intento permitido. Para rendir tu Examen Sustitutorio y rehabilitar tu evaluación, abona el derecho de S/ 25.00 con soporte.'}
                  </p>
                </div>

                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => setPasoModalExamen('ver_intento')}
                    className={`font-bold text-xs px-4 py-2.5 rounded-xl border transition-colors inline-flex items-center gap-1.5 cursor-pointer ${
                      esOscuro ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-white border-slate-300 hover:bg-slate-100 text-slate-800 shadow-2xs'
                    }`}
                  >
                    <Eye className="w-4 h-4" /> Ver intento y revisión
                  </button>

                  {resultadoExamen.aprobado ? (
                    <Link
                      href="/dashboard/certificados"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Award className="w-4 h-4" /> Descargar Certificado
                    </Link>
                  ) : (
                    <a
                      href={`https://wa.me/51924400268?text=${encodeURIComponent(`Hola EDUMIN, rendí el Examen Modular ${examenActivoModal.moduloIdx + 1} con nota ${resultadoExamen.nota}/20 y deseo pagar los S/ 25.00 para habilitar el Examen Sustitutorio.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition-colors inline-flex items-center gap-1.5"
                    >
                      Solicitar Sustitutorio (S/ 25)
                    </a>
                  )}

                  <button
                    onClick={() => setExamenActivoModal(null)}
                    className={`font-bold text-xs px-5 py-2.5 rounded-xl border transition-colors cursor-pointer ${
                      esOscuro ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            )}

            {/* PASO 4: REVISIÓN DETALLADA DEL INTENTO ("VER INTENTO") */}
            {pasoModalExamen === 'ver_intento' && (() => {
              const preguntas = generarPreguntasExamenModulo(examenActivoModal.moduloCodigo, examenActivoModal.moduloNombre);
              const respuestasDelModulo = respuestasPorModulo[examenActivoModal.moduloCodigo] || {};
              const notaActual = notasModulosMap[examenActivoModal.moduloCodigo] ?? (resultadoExamen?.nota || 0);
              const aciertosObjetivo = Math.min(5, Math.max(0, Math.round(notaActual / 4)));

              return (
                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                  {/* Resumen de Calificación */}
                  <div className={`p-4 rounded-xl border flex items-center justify-between ${
                    notaActual >= 12 
                      ? (esOscuro ? 'bg-emerald-950/30 border-emerald-800/40' : 'bg-emerald-50 border-emerald-200')
                      : (esOscuro ? 'bg-rose-950/30 border-rose-800/40' : 'bg-rose-50 border-rose-200')
                  }`}>
                    <div>
                      <span className="text-xs font-bold block">
                        Calificación del intento: <span className="text-sm font-black">{notaActual.toString().padStart(2, '0')} / 20</span>
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {notaActual >= 12 ? 'Examen Aprobado (Mínimo 12/20)' : 'Examen Desaprobado (Requiere Sustitutorio)'}
                      </span>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                      notaActual >= 12
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                    }`}>
                      {notaActual >= 12 ? 'Aprobado ✓' : 'Desaprobado ❌'}
                    </span>
                  </div>

                  {/* Detalle Pregunta por Pregunta */}
                  <div className="space-y-4">
                    {preguntas.map((q, qIdx) => {
                      // Si tenemos la respuesta exacta guardada la usamos; sino la reconstruimos consistente con la nota
                      let seleccion = respuestasDelModulo[qIdx];
                      if (seleccion === undefined) {
                        seleccion = qIdx < aciertosObjetivo ? q.respuestaCorrecta : ((q.respuestaCorrecta + 1) % q.opciones.length);
                      }
                      const esCorrecta = seleccion === q.respuestaCorrecta;

                      return (
                        <div
                          key={q.id}
                          className={`p-4 rounded-xl border space-y-3 ${
                            esCorrecta 
                              ? (esOscuro ? 'bg-emerald-950/20 border-emerald-800/30' : 'bg-emerald-50/50 border-emerald-200')
                              : (esOscuro ? 'bg-rose-950/20 border-rose-800/30' : 'bg-rose-50/50 border-rose-200')
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-xs font-bold leading-snug">
                              {qIdx + 1}. {q.pregunta}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${
                              esCorrecta 
                                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                                : 'bg-rose-500/20 text-rose-400 border-rose-500/30'
                            }`}>
                              {esCorrecta ? '+4 pts (Correcto)' : '0 pts (Incorrecto)'}
                            </span>
                          </div>

                          <div className="space-y-2">
                            {q.opciones.map((opt, optIdx) => {
                              const esLaSeleccionada = seleccion === optIdx;
                              const esLaCorrecta = optIdx === q.respuestaCorrecta;

                              let estiloOpcion = esOscuro 
                                ? 'bg-slate-900 border-slate-800 text-slate-400' 
                                : 'bg-white border-slate-200 text-slate-600';

                              if (esLaSeleccionada && esCorrecta) {
                                estiloOpcion = 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold';
                              } else if (esLaSeleccionada && !esCorrecta) {
                                estiloOpcion = 'bg-rose-600/20 border-rose-500 text-rose-400 font-bold line-through';
                              } else if (!esLaSeleccionada && esLaCorrecta) {
                                estiloOpcion = 'bg-emerald-600/10 border-emerald-500/60 text-emerald-400 font-semibold';
                              }

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-lg text-xs border flex items-center justify-between gap-2 ${estiloOpcion}`}
                                >
                                  <span>{opt}</span>
                                  <div className="shrink-0 text-[10px] font-bold">
                                    {esLaSeleccionada && esCorrecta && '✓ Tu respuesta (Correcta)'}
                                    {esLaSeleccionada && !esCorrecta && '✗ Tu respuesta (Fallida)'}
                                    {!esLaSeleccionada && esLaCorrecta && '✓ Respuesta correcta'}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Acciones del pie en Ver Intento */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setPasoModalExamen('resultado')}
                      className={`px-4 py-2 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                        esOscuro ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      Volver
                    </button>

                    <div className="flex items-center gap-2">
                      {notaActual >= 12 ? (
                        <Link
                          href="/dashboard/certificados"
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Award className="w-4 h-4" /> Descargar Certificado
                        </Link>
                      ) : (
                        <a
                          href={`https://wa.me/51924400268?text=${encodeURIComponent(`Hola EDUMIN, revisé mi intento en el Examen Modular ${examenActivoModal.moduloIdx + 1} con nota ${notaActual}/20 y deseo pagar los S/ 25.00 para rendir el Examen Sustitutorio.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow transition-colors inline-flex items-center gap-1.5"
                        >
                          Sustitutorio (S/ 25)
                        </a>
                      )}
                      <button
                        onClick={() => setExamenActivoModal(null)}
                        className={`font-bold text-xs px-4 py-2 rounded-xl border transition-colors cursor-pointer ${
                          esOscuro ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-white' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-800'
                        }`}
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}