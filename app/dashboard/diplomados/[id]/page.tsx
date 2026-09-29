'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  ArrowLeft, 
  Download, 
  Send, 
  Video, 
  Headphones, 
  Sparkles, 
  Eye, 
  Award, 
  Layers 
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDiplomadoBySlug } from '@/lib/data/diplomadosData';
import { useTheme } from '@/context/theme-context';

export interface RecursoItem {
  id: string;
  tipo: 'pdf' | 'video' | 'audio' | 'interactivo';
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

function generarEstructuraDiplomado(id: string) {
  const dip = getDiplomadoBySlug(id) || getDiplomadoBySlug('derecho-minero');
  
  if (!dip) {
    return {
      titulo: "Diplomado de Alta Especialización Edumin",
      avancePorcentaje: 45,
      modulos: []
    };
  }

  let contadorGlobalClases = 1;

  const modulosProcesados = dip.modulos.map((mod, modIdx) => {
    const rawClases = (mod.clases && mod.clases.length > 0) 
      ? mod.clases 
      : ['Sesión Magistral de Introducción', 'Casuística Aplicada'];

    const clases: ClaseCompleta[] = rawClases.map((claseTitle, claseIdx) => {
      const numClase = contadorGlobalClases++;
      const claseId = `${mod.codigo}-c${numClase}`;

      // Simulación: Las Clases 1 y 4 tienen 1 sola parte.
      // La Clase 3 tiene 5 partes y las demás tienen 2 partes.
      const esClaseDeUnaSolaParte = (numClase === 1 || numClase === 4);

      let partes: ParteClase[] = [];

      if (esClaseDeUnaSolaParte) {
        partes = [
          {
            id: `${claseId}-p1`,
            numero: 1,
            titulo: `Sesión Completa`,
            subtitulo: claseTitle,
            duracion: '60 min',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            completada: true,
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
                titulo: `Separata_Oficial_CLASE_${numClase}.pdf`,
                descripcion: 'Documento oficial con contenidos y diapositivas de la clase · 5.2 MB',
                archivo: `Separata_Oficial_CLASE_${numClase}.pdf`
              },
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
              },
              {
                id: `rec-${claseId}-interactivo`,
                tipo: 'interactivo',
                titulo: `Flashcards de Repaso`,
                descripcion: 'Módulo interactivo de autoevaluación y preguntas clave'
              }
            ]
          }
        ];
      } else if (numClase === 3) {
        // Simulación: La Clase 3 consta de 5 partes
        partes = [1, 2, 3, 4, 5].map((numP) => ({
          id: `${claseId}-p${numP}`,
          numero: numP,
          titulo: `Parte ${numP}`,
          subtitulo: claseTitle,
          duracion: `${35 + numP * 5} min`,
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          completada: numP <= 2,
          resumen: {
            objetivo: `Desarrollo de los temas correspondientes a la Parte ${numP} de: ${claseTitle}.`,
            puntosClave: [
              `Punto principal ${numP}.1: Fundamentos y marco operativo para esta sección.`,
              `Punto principal ${numP}.2: Aplicación técnica directa en procesos clave.`,
              `Punto principal ${numP}.3: Directrices y recomendaciones metodológicas.`
            ]
          },
          recursos: [
            {
              id: `rec-${claseId}-p${numP}-pdf`,
              tipo: 'pdf',
              titulo: `Separata_Oficial_CLASE_${numClase}_Parte${numP}.pdf`,
              descripcion: `Material de estudio oficial · Parte ${numP} · 4.${numP} MB`,
              archivo: `Separata_Oficial_CLASE_${numClase}_Parte${numP}.pdf`
            },
            {
              id: `rec-${claseId}-p${numP}-capsula`,
              tipo: 'video',
              titulo: `Cápsula de Resumen (Parte ${numP})`,
              descripcion: `Video sumario de la Parte ${numP} · ${5 + numP} min`,
              duracion: `${5 + numP} min`
            },
            {
              id: `rec-${claseId}-p${numP}-audio`,
              tipo: 'audio',
              titulo: `Podcast (Parte ${numP})`,
              descripcion: `Audio en formato MP3 de la Parte ${numP} · 12 min`,
              duracion: '12 min'
            },
            {
              id: `rec-${claseId}-p${numP}-interactivo`,
              tipo: 'interactivo',
              titulo: `Flashcards de Repaso (Parte ${numP})`,
              descripcion: 'Módulo interactivo de autoevaluación'
            }
          ]
        }));
      } else {
        partes = [
          {
            id: `${claseId}-p1`,
            numero: 1,
            titulo: `Parte 1`,
            subtitulo: claseTitle,
            duracion: '45 min',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            completada: (modIdx === 0 && claseIdx === 1),
            resumen: {
              objetivo: `Desarrollo de los temas correspondientes a la Parte 1 de: ${claseTitle}.`,
              puntosClave: [
                `Revisión de los puntos principales y marco aplicable.`,
                `Criterios técnicos y metodológicos para el análisis.`,
                `Fundamentos para la toma de decisiones en el sector.`
              ]
            },
            recursos: [
              {
                id: `rec-${claseId}-p1-pdf`,
                tipo: 'pdf',
                titulo: `Separata_Oficial_CLASE_${numClase}_Parte1.pdf`,
                descripcion: 'Material de estudio oficial · Parte 1 · 4.8 MB',
                archivo: `Separata_Oficial_CLASE_${numClase}_Parte1.pdf`
              },
              {
                id: `rec-${claseId}-p1-capsula`,
                tipo: 'video',
                titulo: `Cápsula de Resumen (Parte 1)`,
                descripcion: 'Video sumario con los conceptos de la Parte 1 · 6 min',
                duracion: '6 min'
              },
              {
                id: `rec-${claseId}-p1-audio`,
                tipo: 'audio',
                titulo: `Podcast (Parte 1)`,
                descripcion: 'Audio en formato MP3 de la Parte 1 · 12 min',
                duracion: '12 min'
              },
              {
                id: `rec-${claseId}-p1-interactivo`,
                tipo: 'interactivo',
                titulo: `Flashcards de Repaso (Parte 1)`,
                descripcion: 'Módulo interactivo de autoevaluación'
              }
            ]
          },
          {
            id: `${claseId}-p2`,
            numero: 2,
            titulo: `Parte 2`,
            subtitulo: claseTitle,
            duracion: '50 min',
            videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            completada: false,
            resumen: {
              objetivo: `Desarrollo y profundización de los temas correspondientes a la Parte 2 de: ${claseTitle}.`,
              puntosClave: [
                `Aplicación práctica y análisis de situaciones reales.`,
                `Taller guiado con matrices de resolución.`,
                `Lecciones aprendidas y recomendaciones técnicas.`
              ]
            },
            recursos: [
              {
                id: `rec-${claseId}-p2-pdf`,
                tipo: 'pdf',
                titulo: `Guia_Practica_CLASE_${numClase}_Parte2.pdf`,
                descripcion: 'Material de estudio oficial · Parte 2 · 3.5 MB',
                archivo: `Guia_Practica_CLASE_${numClase}_Parte2.pdf`
              },
              {
                id: `rec-${claseId}-p2-capsula`,
                tipo: 'video',
                titulo: `Cápsula de Resumen (Parte 2)`,
                descripcion: 'Video sumario de la Parte 2 · 7 min',
                duracion: '7 min'
              },
              {
                id: `rec-${claseId}-p2-audio`,
                tipo: 'audio',
                titulo: `Podcast (Parte 2)`,
                descripcion: 'Audio en formato MP3 de la Parte 2 · 15 min',
                duracion: '15 min'
              },
              {
                id: `rec-${claseId}-p2-interactivo`,
                tipo: 'interactivo',
                titulo: `Simulador de Repaso (Parte 2)`,
                descripcion: 'Módulo interactivo de autoevaluación'
              }
            ]
          }
        ];
      }

      const claseCompletada = partes.every(p => p.completada);

      return {
        id: claseId,
        numeroClase: numClase,
        tituloClase: `CLASE ${numClase}: ${claseTitle}`,
        moduloCodigo: mod.codigo,
        moduloTitulo: `${mod.codigo}: ${mod.nombre}`,
        completada: claseCompletada,
        partes
      };
    });

    return {
      id: mod.codigo,
      codigo: mod.codigo,
      nombre: mod.nombre,
      titulo: `${mod.codigo}: ${mod.nombre}`,
      clases
    };
  });

  return {
    titulo: dip.titulo,
    avancePorcentaje: 45,
    modulos: modulosProcesados
  };
}

export default function ReproductorClasesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const diplomadoId = params.id as string;
  const moduloQuery = searchParams.get('modulo');

  const { esOscuro } = useTheme();

  // Memorizar la data del diplomado
  const diplomadoActual = useMemo(() => generarEstructuraDiplomado(diplomadoId), [diplomadoId]);

  const modInicial = useMemo(() => {
    if (!diplomadoActual?.modulos?.length) return null;
    return diplomadoActual.modulos.find((m: any) => m.id === moduloQuery) || diplomadoActual.modulos[0];
  }, [diplomadoActual, moduloQuery]);

  const claseInicial = useMemo(() => {
    return modInicial?.clases?.[0] || null;
  }, [modInicial]);

  // Estados de navegación inicializados de inmediato
  const [moduloActivo, setModuloActivo] = useState<string>(modInicial?.id || '');
  const [claseActual, setClaseActual] = useState<ClaseCompleta | null>(claseInicial);
  const [parteSeleccionada, setParteSeleccionada] = useState<number>(1);

  // Estados de contenido principal y pestañas
  const [contenidoPrincipal, setContenidoPrincipal] = useState<'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo'>('video_clase');
  const [recursoActivoInfo, setRecursoActivoInfo] = useState<string>('Clase principal en video');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'recursos' | 'foro'>('resumen');
  
  // Estados del foro
  const [comentario, setComentario] = useState('');
  const [listaComentarios, setListaComentarios] = useState([
    { autor: 'Ing. Carlos Mendoza', texto: 'Excelente explicación de los temas de la clase.', fecha: 'Hace 2 horas' }
  ]);

  // Sincronizar si cambia el parámetro de módulo en la URL
  useEffect(() => {
    if (modInicial && (!claseActual || moduloActivo !== modInicial.id)) {
      setModuloActivo(modInicial.id);
      if (modInicial.clases && modInicial.clases.length > 0) {
        setClaseActual(modInicial.clases[0]);
        setParteSeleccionada(1);
      }
    }
  }, [modInicial]);

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

  const seleccionarClaseYParte = (moduloId: string, clase: ClaseCompleta, parteNum: number = 1) => {
    setModuloActivo(moduloId);
    setClaseActual(clase);
    setParteSeleccionada(parteNum);
    activarRecursoEnVisor('video_clase', clase.partes.length > 1 ? `Video de la Clase (Parte ${parteNum})` : 'Video de la Clase');
  };

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

  if (!claseActual || !parteActiva) {
    return (
      <div className={`h-full min-h-screen grid place-items-center ${esOscuro ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Cargando contenidos de la clase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-full flex flex-col transition-colors duration-200 ${
      esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Bar FIJA / STICKY EN EL ENCABEZADO */}
      <header className={`sticky top-0 z-30 h-16 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 backdrop-blur-md transition-colors ${
        esOscuro ? 'border-slate-800 bg-slate-900/95' : 'border-slate-200 bg-white/95'
      }`}>
        {/* Lado Izquierdo: Botón Volver + Título del Diplomado */}
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
                    <FileText className="w-4 h-4 text-indigo-500" /> Separata_Oficial_CLASE_{claseActual.numeroClase}{tieneMultiplesPartes ? `_Parte${parteSeleccionada}` : ''}.pdf
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
                      <h4 className="font-bold text-base sm:text-lg mt-1">{claseActual.tituloClase} {tieneMultiplesPartes ? `· Parte ${parteSeleccionada}` : ''}</h4>
                    </div>
                    <p className={`text-xs leading-relaxed ${esOscuro ? 'text-slate-400' : 'text-slate-600'}`}>
                      El presente material de estudio contiene los contenidos y ejercicios aplicados correspondientes a esta sesión académica.
                    </p>
                    <div className={`p-4 rounded-xl text-xs italic ${
                      esOscuro ? 'bg-slate-900 border border-slate-800 text-slate-400' : 'bg-slate-50 border border-slate-200 text-slate-600'
                    }`}>
                      [ Vista previa interactiva de la separata oficial de lectura obligatoria ]
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
                  Cápsula de Resumen en Video {tieneMultiplesPartes ? `(Parte ${parteSeleccionada})` : ''}
                </h3>
                <iframe 
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
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
                  Audio Podcast {tieneMultiplesPartes ? `(Parte ${parteSeleccionada})` : ''}
                </h3>
                <div className={`w-full max-w-md p-4 rounded-xl flex items-center gap-4 mt-2 border ${
                  esOscuro ? 'bg-slate-800/80 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-md'
                }`}>
                  <button className="size-11 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white grid place-items-center font-bold transition-colors shrink-0 shadow">
                    ▶
                  </button>
                  <div className="flex-1 text-left">
                    <p className={`text-xs font-bold truncate ${esOscuro ? 'text-white' : 'text-slate-800'}`}>
                      Podcast_CLASE_{claseActual.numeroClase}{tieneMultiplesPartes ? `_Parte${parteSeleccionada}` : ''}.mp3
                    </p>
                    <div className={`w-full h-2 rounded-full mt-2 overflow-hidden ${esOscuro ? 'bg-slate-700' : 'bg-slate-200'}`}>
                      <div className="bg-emerald-500 h-full w-2/5"></div>
                    </div>
                  </div>
                  <span className={`text-xs shrink-0 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>12 min</span>
                </div>
              </div>
            )}

            {contenidoPrincipal === 'resumen_interactivo' && (
              <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 text-center ${
                esOscuro ? 'bg-gradient-to-br from-cyan-950 via-slate-900 to-black' : 'bg-gradient-to-br from-cyan-50 via-white to-slate-100'
              }`}>
                <div className={`size-14 rounded-2xl grid place-items-center mb-3 ${
                  esOscuro ? 'bg-cyan-600/30 text-cyan-300 border border-cyan-500/30' : 'bg-cyan-100 text-cyan-600 border border-cyan-200'
                }`}>
                  <Sparkles className="w-7 h-7" />
                </div>
                <h3 className={`text-base sm:text-lg font-bold mb-2 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  Flashcards de Repaso {tieneMultiplesPartes ? `(Parte ${parteSeleccionada})` : ''}
                </h3>
                <div className={`p-6 rounded-xl max-w-md w-full text-left shadow-xl mt-1 border ${
                  esOscuro ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <span className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest">Pregunta Clave 1 de 4</span>
                  <p className={`text-sm font-semibold mt-2 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                    ¿Cuál es el tema principal revisado en esta sesión?
                  </p>
                  <div className="mt-4 flex gap-2">
                    <span className={`text-xs px-3 py-1.5 rounded-xl font-semibold border cursor-pointer ${
                      esOscuro ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 hover:bg-cyan-500/30' : 'bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100'
                    }`}>
                      Opción A (Correcta)
                    </span>
                    <span className={`text-xs px-3 py-1.5 rounded-xl cursor-pointer ${
                      esOscuro ? 'bg-slate-800 text-slate-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}>
                      Opción B
                    </span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* CONTROLES DE LA CLASE, SELECTOR DE PARTES Y NAVEGACIÓN */}
          <div className={`p-5 sm:p-6 rounded-2xl border transition-all ${
            esOscuro ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            
            {/* Header de la Clase */}
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

              {/* Botón de volver al video principal si se está viendo otro recurso */}
              {contenidoPrincipal !== 'video_clase' && (
                <button 
                  onClick={() => activarRecursoEnVisor('video_clase', tieneMultiplesPartes ? `Video de la Clase (Parte ${parteSeleccionada})` : 'Video de la Clase')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow flex items-center justify-center gap-2 shrink-0 self-start sm:self-auto"
                >
                  <Video className="w-4 h-4" /> Ver Video de la Clase
                </button>
              )}
            </div>

            {/* BARRA UNIFICADA: ANTERIOR + SEGMENTED PILLS DE PARTES + SIGUIENTE */}
            <div className={`mt-5 pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
              esOscuro ? 'border-slate-800' : 'border-slate-100'
            }`}>
              {/* Botón Anterior */}
              <button
                onClick={irAAnterior}
                disabled={!itemAnterior}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all shrink-0 ${
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

              {/* Segmented Control de Partes (Compacto y adaptable a 2, 3, 5+ partes) */}
              {tieneMultiplesPartes ? (
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full py-1 px-1 no-scrollbar justify-center">
                  {claseActual.partes.map((p) => {
                    const estaActiva = p.numero === parteSeleccionada;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          setParteSeleccionada(p.numero);
                          setContenidoPrincipal('video_clase');
                          setRecursoActivoInfo(`Video de la Clase (Parte ${p.numero})`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 border shrink-0 ${
                          estaActiva
                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm ring-2 ring-indigo-500/20'
                            : esOscuro
                              ? 'bg-slate-800/80 border-slate-700/80 text-slate-300 hover:bg-slate-700 hover:text-white'
                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                      >
                        <span>Parte {p.numero}</span>
                        {p.completada && (
                          <CheckCircle2 className={`w-3.5 h-3.5 ${estaActiva ? 'text-white' : 'text-emerald-500'}`} />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <span className={`text-xs font-semibold ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  CLASE {claseActual.numeroClase} · Sesión Completa
                </span>
              )}

              {/* Botón Siguiente */}
              <button
                onClick={irASiguiente}
                disabled={!itemSiguiente}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl border transition-all shrink-0 ${
                  itemSiguiente
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow'
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
                Recursos
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
                Foro
              </button>
            </div>

            <div className="mt-5 text-sm leading-relaxed">
              
              {/* TAB RESUMEN */}
              {tabActiva === 'resumen' && (
                <div className={`p-6 rounded-2xl border space-y-4 ${
                  esOscuro ? 'bg-slate-900/60 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                }`}>
                  <h4 className={`font-bold text-sm tracking-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                    Puntos clave aprendidos:
                  </h4>
                  
                  <p className={`text-xs sm:text-sm leading-relaxed ${esOscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                    En esta sesión se abordaron los principios fundamentales de la lección seleccionada. Podrás aplicar los conceptos teóricos revisados a casos prácticos dentro del entorno industrial y minero.
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

              {/* TAB RECURSOS MULTIMEDIA */}
              {tabActiva === 'recursos' && (
                <div className="space-y-3">
                  <p className={`text-xs mb-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                    Descarga o visualiza los materiales correspondientes a {tieneMultiplesPartes ? `la Parte ${parteSeleccionada}` : 'esta clase'}:
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
                          rec.tipo === 'video' ? 'bg-indigo-500/20 text-indigo-500' :
                          rec.tipo === 'audio' ? 'bg-emerald-500/20 text-emerald-500' :
                          'bg-cyan-500/20 text-cyan-500'
                        }`}>
                          {rec.tipo === 'pdf' && <FileText className="w-5 h-5" />}
                          {rec.tipo === 'video' && <Video className="w-5 h-5" />}
                          {rec.tipo === 'audio' && <Headphones className="w-5 h-5" />}
                          {rec.tipo === 'interactivo' && <Sparkles className="w-5 h-5" />}
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
                              <Eye className="w-3.5 h-3.5" /> Ver en visor
                            </button>
                            <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow">
                              <Download className="w-3.5 h-3.5" /> Descargar
                            </button>
                          </>
                        )}
                        {rec.tipo === 'video' && (
                          <button 
                            onClick={() => activarRecursoEnVisor('resumen_video', 'Cápsula de Resumen en Video')}
                            className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border ${
                              esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver cápsula
                          </button>
                        )}
                        {rec.tipo === 'audio' && (
                          <>
                            <button 
                              onClick={() => activarRecursoEnVisor('resumen_audio', 'Podcast de Audio')}
                              className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border ${
                                esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                              }`}
                            >
                              <Eye className="w-3.5 h-3.5" /> Escuchar
                            </button>
                            <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors shadow">
                              <Download className="w-3.5 h-3.5" /> MP3
                            </button>
                          </>
                        )}
                        {rec.tipo === 'interactivo' && (
                          <button 
                            onClick={() => activarRecursoEnVisor('resumen_interactivo', 'Flashcards de Repaso')}
                            className={`text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border ${
                              esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                            }`}
                          >
                            <Eye className="w-3.5 h-3.5" /> Iniciar repaso
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

        {/* SIDEBAR DERECHO (30%) - TEMARIO CONTINUO (SCROLL LIMITADO Y STICKY) */}
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
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md ${
                esOscuro ? 'bg-indigo-600/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
              }`}>
                {diplomadoActual.avancePorcentaje}%
              </span>
            </div>
            
            {/* Barra de progreso de avance curricular */}
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

          {/* Lista Continua de Módulos y Clases (Llega exactamente hasta la última clase) */}
          <div className="p-4 space-y-6 pb-8">
            {diplomadoActual.modulos.map((mod: any) => {
              return (
                <div key={mod.id} className="space-y-2">
                  {/* Encabezado del Módulo (Separador limpio y continuo) */}
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
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ml-2 ${
                      esOscuro ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {mod.clases.length} clases
                    </span>
                  </div>

                  {/* Lista de Clases del Módulo (Directas, sin duración y con check de estado) */}
                  <div className="space-y-1">
                    {mod.clases.map((clase: ClaseCompleta) => {
                      const esClaseSeleccionada = claseActual?.id === clase.id;
                      const estaCompletada = clase.completada;

                      return (
                        <button 
                          key={clase.id} 
                          onClick={() => seleccionarClaseYParte(mod.id, clase, 1)}
                          className={`w-full p-2.5 rounded-xl flex items-start gap-2.5 text-left transition-all ${
                            esClaseSeleccionada 
                              ? esOscuro 
                                ? 'bg-indigo-600/20 text-indigo-200 font-semibold' 
                                : 'bg-indigo-50 text-indigo-900 font-semibold shadow-xs' 
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
                                  : (esOscuro ? 'border-slate-600' : 'border-slate-300')
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
                </div>
              );
            })}
          </div>
        </aside>

      </div>
    </div>
  );
}