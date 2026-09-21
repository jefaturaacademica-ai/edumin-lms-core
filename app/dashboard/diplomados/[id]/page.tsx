'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ChevronLeft,
  ChevronRight,
  ArrowLeft, 
  Download,
  Send,
  Video,
  Headphones,
  Sparkles,
  Eye,
  Award
} from 'lucide-react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDiplomadoBySlug } from '@/lib/data/diplomadosData';

function obtenerDatosDiplomado(id: string) {
  const dip = getDiplomadoBySlug(id) || getDiplomadoBySlug('derecho-minero');
  if (dip) {
    return {
      titulo: dip.titulo,
      avance: "45%",
      modulos: dip.modulos.map((mod, modIdx) => ({
        id: mod.codigo,
        titulo: `${mod.codigo}: ${mod.nombre}`,
        docente: mod.docente,
        lecciones: (mod.clases && mod.clases.length > 0 ? mod.clases : ['Sesión Magistral de Introducción', 'Casuística Aplicada']).map((claseTitle, claseIdx) => ({
          id: `${mod.codigo}-l${claseIdx + 1}`,
          titulo: `${claseIdx + 1}. ${claseTitle}`,
          duracion: '45 min',
          completada: modIdx === 0 && claseIdx === 0,
          videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
        }))
      }))
    };
  }
  return {
    titulo: "Diplomado de Alta Especialización Edumin",
    avance: "0%",
    modulos: []
  };
}

export default function ReproductorClasesPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const diplomadoId = params.id as string;
  const moduloQuery = searchParams.get('modulo');

  // Memorizar la data del diplomado para evitar la recreación de objetos en cada renderizado
  const diplomadoActual = useMemo(() => obtenerDatosDiplomado(diplomadoId), [diplomadoId]);

  // Estados de navegación
  const [moduloActivo, setModuloActivo] = useState<string>('');
  const [leccionActual, setLeccionActual] = useState<any>(null);

  // Estados de contenido principal y pestañas
  const [contenidoPrincipal, setContenidoPrincipal] = useState<'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo'>('video_clase');
  const [recursoActivoInfo, setRecursoActivoInfo] = useState<string>('Clase principal en video');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'recursos' | 'foro'>('resumen');
  
  // Estados del foro
  const [comentario, setComentario] = useState('');
  const [listaComentarios, setListaComentarios] = useState([
    { autor: 'Carlos Mendoza', texto: 'Excelente explicación sobre los plazos y marcos normativos.', fecha: 'Hace 2 horas' }
  ]);

  // Lista plana de todas las lecciones para navegación Secuencial (Anterior / Siguiente)
  const todasLasLecciones = useMemo(() => {
    if (!diplomadoActual || !diplomadoActual.modulos) return [];
    return diplomadoActual.modulos.flatMap((m: any) => 
      m.lecciones.map((l: any) => ({ ...l, moduloId: m.id, moduloTitulo: m.titulo }))
    );
  }, [diplomadoActual]);

  const indiceActual = todasLasLecciones.findIndex((l: any) => l.id === leccionActual?.id);
  const leccionAnterior = indiceActual > 0 ? todasLasLecciones[indiceActual - 1] : null;
  const leccionSiguiente = indiceActual >= 0 && indiceActual < todasLasLecciones.length - 1 ? todasLasLecciones[indiceActual + 1] : null;

  // Inicialización (Lee la URL para abrir el módulo y la clase correcta)
  useEffect(() => {
    if (!diplomadoActual || !diplomadoActual.modulos || diplomadoActual.modulos.length === 0) return;

    let modInicial = diplomadoActual.modulos.find((m: any) => m.id === moduloQuery);
    if (!modInicial) modInicial = diplomadoActual.modulos[0];

    setModuloActivo(modInicial.id);
    if (!leccionActual && modInicial.lecciones && modInicial.lecciones.length > 0) {
      setLeccionActual(modInicial.lecciones[0]);
    }
  }, [diplomadoId, moduloQuery, diplomadoActual]);

  const publicarComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    setListaComentarios([{ autor: 'Roger Sanalea (Tú)', texto: comentario, fecha: 'Justo ahora' }, ...listaComentarios]);
    setComentario('');
  };

  const seleccionarLeccion = (moduloId: string, leccion: any) => {
    setModuloActivo(moduloId);
    setLeccionActual(leccion);
    setContenidoPrincipal('video_clase');
    setRecursoActivoInfo('Clase principal en video');
  };

  const irALeccionAnterior = () => {
    if (leccionAnterior) {
      setModuloActivo(leccionAnterior.moduloId);
      setLeccionActual(leccionAnterior);
      setContenidoPrincipal('video_clase');
      setRecursoActivoInfo('Clase principal en video');
    }
  };

  const irALeccionSiguiente = () => {
    if (leccionSiguiente) {
      setModuloActivo(leccionSiguiente.moduloId);
      setLeccionActual(leccionSiguiente);
      setContenidoPrincipal('video_clase');
      setRecursoActivoInfo('Clase principal en video');
    }
  };

  if (!leccionActual) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/diplomados"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Mis Diplomados
          </Link>
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <Award className="w-5 h-5 text-indigo-400 hidden sm:block" />
          <h1 className="text-sm font-bold text-white truncate max-w-md hidden sm:block">
            {diplomadoActual.titulo}
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-full">
            Avance General: {diplomadoActual.avance}
          </span>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ZONA PRINCIPAL (70%) */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 sm:p-10 lg:border-r border-slate-800">
          
          {/* VISOR MULTIMEDIA Y DOCUMENTOS DINÁMICO */}
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative flex flex-col items-center justify-center">
            
            {contenidoPrincipal === 'video_clase' && (
              <iframe 
                src={leccionActual.videoUrl} 
                title={leccionActual.titulo}
                className="w-full h-full object-cover absolute inset-0"
                allowFullScreen
              />
            )}

            {/* VISOR DE PDF INTEGRADO */}
            {contenidoPrincipal === 'pdf_visor' && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col">
                <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <FileText className="w-4 h-4 text-indigo-400" /> Material_Lectura_Oficial.pdf
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md">Visualizador Integrado EDUMIN</span>
                </div>
                <div className="flex-1 p-4 grid place-items-center bg-slate-900/50 overflow-y-auto">
                  <div className="bg-white text-slate-900 w-full max-w-2xl p-8 rounded-2xl shadow-xl text-left space-y-4">
                    <div className="border-b pb-3">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">Documento Oficial de Estudio</span>
                      <h4 className="font-bold text-lg text-slate-900">Lectura complementaria: {leccionActual.titulo}</h4>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      El marco regulatorio de la actividad en el Perú se fundamenta en el marco legal vigente... Este documento detalla las normas aplicables y la gestión técnica ante las autoridades competentes.
                    </p>
                    <div className="p-4 bg-slate-50 border rounded-xl text-xs text-slate-500 italic">
                      [ Vista previa interactiva del documento oficial de lectura obligatoria para la certificación de la lección ]
                    </div>
                  </div>
                </div>
              </div>
            )}

            {contenidoPrincipal === 'resumen_video' && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
                <div className="size-16 rounded-2xl bg-indigo-600/30 border border-indigo-500/30 grid place-items-center text-indigo-300 mb-4 animate-bounce">
                  <Video className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Reproduciendo Resumen en Video (Cápsula Breve)</h3>
                <iframe 
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                  title="Resumen en Video"
                  className="w-full max-w-lg h-44 rounded-2xl border border-slate-700 shadow-lg mt-2"
                  allowFullScreen
                />
              </div>
            )}

            {contenidoPrincipal === 'resumen_audio' && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
                <div className="size-16 rounded-2xl bg-emerald-600/30 border border-emerald-500/30 grid place-items-center text-emerald-300 mb-4">
                  <Headphones className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Audio Podcast Educativo</h3>
                <div className="w-full max-w-md bg-slate-800/80 border border-slate-700 p-4 rounded-2xl flex items-center gap-4 mt-2">
                  <button className="size-12 rounded-full bg-emerald-600 text-white grid place-items-center font-bold hover:bg-emerald-500 transition-colors shrink-0">▶</button>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-white">Podcast_Resumen_Leccion.mp3</p>
                    <div className="w-full bg-slate-700 h-2 rounded-full mt-2 overflow-hidden">
                      <div className="bg-emerald-400 h-full w-2/5"></div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400">12:45 min</span>
                </div>
              </div>
            )}

            {contenidoPrincipal === 'resumen_interactivo' && (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
                <div className="size-16 rounded-2xl bg-cyan-600/30 border border-cyan-500/30 grid place-items-center text-cyan-300 mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Resumen Interactivo y Flashcards</h3>
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full text-left shadow-xl mt-2">
                  <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Tarjeta 1 de 5</span>
                  <p className="text-sm font-semibold text-white mt-2">¿Cuál es el organismo encargado de fiscalizar los impactos ambientales?</p>
                  <div className="mt-4 flex gap-2">
                    <span className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs px-3 py-1.5 rounded-xl font-semibold cursor-pointer hover:bg-cyan-500/30">OEFA</span>
                    <span className="bg-slate-800 text-slate-400 text-xs px-3 py-1.5 rounded-xl cursor-pointer hover:bg-slate-700">MINEM</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Info y Controles de Navegación de Clases */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Visualizando: {recursoActivoInfo}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">{leccionActual.titulo}</h2>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => { setContenidoPrincipal('video_clase'); setRecursoActivoInfo('Clase principal en video'); }}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md flex items-center gap-2"
              >
                Ver Video de la Clase
              </button>
            </div>
          </div>

          {/* Pestañas (Tabs) */}
          <div className="mt-6">
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 pb-3">
              <button
                onClick={() => setTabActiva('resumen')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tabActiva === 'resumen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Resumen de la Clase
              </button>
              <button
                onClick={() => setTabActiva('recursos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tabActiva === 'recursos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Recursos y Formatos Multimedia
              </button>
              <button
                onClick={() => setTabActiva('foro')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  tabActiva === 'foro' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-900'
                }`}
              >
                Foro / Preguntas
              </button>
            </div>

            <div className="mt-6 text-slate-300 text-sm leading-relaxed">
              
              {/* TAB RESUMEN */}
              {tabActiva === 'resumen' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-white text-base">Puntos Clave Aprendidos:</h3>
                  <p>En esta sesión se abordaron los principios fundamentales de la lección seleccionada. Podrás aplicar los conceptos teóricos revisados a casos prácticos dentro del entorno industrial y minero.</p>
                </div>
              )}

              {/* TAB RECURSOS MULTIMEDIA (INTEGRADOS AL VISOR) */}
              {tabActiva === 'recursos' && (
                <div className="space-y-4">
                  
                  {/* Recurso 1: PDF */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-indigo-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Lectura_Oficial_Obligatoria.pdf</h4>
                        <span className="text-xs text-slate-500">Documento oficial · 4.2 MB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setContenidoPrincipal('pdf_visor'); setRecursoActivoInfo('Separata PDF Oficial'); }}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </button>
                      <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </button>
                    </div>
                  </div>

                  {/* Recurso 2: Resumen en Video */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
                    <div className="flex items-center gap-3">
                      <Video className="w-6 h-6 text-indigo-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Resumen Ejecutivo en Video (Cápsula)</h4>
                        <span className="text-xs text-slate-500">Video sumario · 5 min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setContenidoPrincipal('resumen_video'); setRecursoActivoInfo('Resumen en Video'); }}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </button>
                    </div>
                  </div>

                  {/* Recurso 3: Resumen en Audio */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
                    <div className="flex items-center gap-3">
                      <Headphones className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Resumen en Audio (Podcast Educativo)</h4>
                        <span className="text-xs text-slate-500">Audio MP3 · 12 min</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setContenidoPrincipal('resumen_audio'); setRecursoActivoInfo('Resumen en Audio'); }}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </button>
                      <button className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors">
                        <Download className="w-3.5 h-3.5" /> Descargar
                      </button>
                    </div>
                  </div>

                  {/* Recurso 4: Resumen Interactivo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl gap-4">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-cyan-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Resumen Interactivo y Flashcards</h4>
                        <span className="text-xs text-slate-500">Módulo digital de repaso</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => { setContenidoPrincipal('resumen_interactivo'); setRecursoActivoInfo('Resumen Interactivo'); }}
                        className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB FORO */}
              {tabActiva === 'foro' && (
                <div className="space-y-6">
                  <form onSubmit={publicarComentario} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text"
                      placeholder="Escribe una duda o aporte para el docente..."
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shrink-0">
                      <Send className="w-4 h-4" /> Enviar
                    </button>
                  </form>

                  <div className="space-y-4">
                    {listaComentarios.map((c, i) => (
                      <div key={i} className="bg-slate-900/60 border border-slate-800 p-4 rounded-2xl">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-xs text-indigo-300">{c.autor}</span>
                          <span className="text-[10px] text-slate-500">{c.fecha}</span>
                        </div>
                        <p className="text-sm text-slate-300">{c.texto}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* SIDEBAR DERECHO (30%) - TEMARIO */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-800 bg-slate-950/50">
            <h3 className="font-bold text-white text-base">Temario del Diplomado</h3>
            <p className="text-xs text-slate-400 mt-0.5">Navega por las unidades y lecciones</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {diplomadoActual.modulos.map((mod: any) => (
              <div key={mod.id} className="border border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setModuloActivo(mod.id === moduloActivo ? '' : mod.id)}
                  className="w-full p-4 text-left flex items-center justify-between bg-slate-900/80 hover:bg-slate-800/50 transition-colors"
                >
                  <div className="pr-4">
                    <h4 className="font-bold text-xs text-indigo-300 uppercase tracking-widest leading-snug">{mod.titulo}</h4>
                  </div>
                  {moduloActivo === mod.id ? <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />}
                </button>

                {moduloActivo === mod.id && (
                  <div className="divide-y divide-slate-800/60 border-t border-slate-800">
                    {mod.lecciones.map((lec: any) => (
                      <div 
                        key={lec.id}
                        onClick={() => seleccionarLeccion(mod.id, lec)}
                        className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                          leccionActual?.id === lec.id ? 'bg-indigo-600/10 border-l-4 border-indigo-500' : 'hover:bg-slate-800/30 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {lec.completada ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <PlayCircle className={`w-4 h-4 shrink-0 ${leccionActual?.id === lec.id ? 'text-indigo-400' : 'text-slate-500'}`} />
                          )}
                          <span className={`text-xs font-medium line-clamp-1 ${leccionActual?.id === lec.id ? 'text-white' : 'text-slate-300'}`}>{lec.titulo}</span>
                        </div>
                        <span className="text-[10px] text-slate-500 shrink-0 ml-2">{lec.duracion}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}