'use client';

import { useState } from 'react';
import { 
  PlayCircle, 
  CheckCircle2, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  ArrowLeft, 
  Download,
  Send,
  Video,
  Headphones,
  Sparkles,
  Eye,
  Award
} from 'lucide-react';
import Link from 'next/link';

export default function DerechoMineroReproductorPage() {
  const [moduloActivo, setModuloActivo] = useState<number>(1);
  const [leccionActual, setLeccionActual] = useState({
    titulo: "MÓDULO I: LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR",
    subtitulo: "Regulación ambiental y gestión del catastro minero: áreas restringidas y su impacto"
  });

  const [contenidoPrincipal, setContenidoPrincipal] = useState<'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo'>('video_clase');
  const [recursoActivoInfo, setRecursoActivoInfo] = useState<string>('Clase Magistral en Video');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'recursos' | 'foro'>('resumen');
  const [comentario, setComentario] = useState('');
  const [listaComentarios, setListaComentarios] = useState([
    { autor: 'Dr. Roberto Gámez', texto: 'Bienvenidos al diplomado de Derecho Minero. Revisen los precedentes vinculantes del Consejo de Minería.', fecha: 'Hace 1 día' }
  ]);

  // ESTRUCTURA OFICIAL EXTRAÍDA DE TU MATRIZ PARA DERECHO MINERO
  const modulosDerechoMinero = [
    {
      id: 1,
      titulo: "MÓDULO I: LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR",
      horas: "108 horas",
      temas: [
        { id: 't1', titulo: 'Fundamentos del Derecho Ambiental Minero e IGA', duracion: '60 min', completada: true },
        { id: 't2', titulo: 'Estrategias de Certificación Ambiental en Exploración', duracion: '55 min', completada: true },
        { id: 't3', titulo: 'ECA, LMP y diseño de planes de monitoreo', duracion: '50 min', completada: false },
        { id: 't4', titulo: 'Gestión técnica y legal del Catastro Minero (GEOCATMIN)', duracion: '65 min', completada: false }
      ]
    },
    {
      id: 2,
      titulo: "MÓDULO II: JURISDICCIÓN MINERA, REGULACIÓN LABORAL Y SEGURIDAD",
      horas: "108 horas",
      temas: [
        { id: 't5', titulo: 'Estructura y competencia del Consejo de Minería', duracion: '50 min', completada: false },
        { id: 't6', titulo: 'Procedimiento ordinario minero y mantenimiento de titularidad', duracion: '60 min', completada: false },
        { id: 't7', titulo: 'Atribuciones de OSINERGMIN, OEFA y SUNAFIL', duracion: '55 min', completada: false }
      ]
    },
    {
      id: 3,
      titulo: "MÓDULO III: GESTIÓN CONTRACTUAL Y TITULARES MINEROS",
      horas: "109 horas",
      temas: [
        { id: 't8', titulo: 'Garantías jurídicas y obligaciones del titular minero', duracion: '50 min', completada: false },
        { id: 't9', titulo: 'Convenio 169 de la OIT y Consulta Previa', duracion: '60 min', completada: false },
        { id: 't10', titulo: 'Estrategias de defensa frente a invasiones y terceros', duracion: '45 min', completada: false }
      ]
    }
  ];

  const publicarComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    setListaComentarios([{ autor: 'Roger Sanalea (Estudiante)', texto: comentario, fecha: 'Justo ahora' }, ...listaComentarios]);
    setComentario('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/cursos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" /> Mis Cursos
          </Link>
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h1 className="text-sm font-bold text-white truncate max-w-md hidden sm:block">
              Diplomado: DERECHO MINERO (325 Horas Académicas)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-full">
            Avance: Módulo I (50%)
          </span>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ZONA PRINCIPAL (70%) */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 sm:p-10 lg:border-r border-slate-800">
          
          {/* VISOR MULTIMEDIA */}
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative flex flex-col items-center justify-center">
            
            {contenidoPrincipal === 'video_clase' && (
              <iframe 
                src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                title="Cátedra Magistral Derecho Minero"
                className="w-full h-full object-cover absolute inset-0"
                allowFullScreen
              />
            )}

            {contenidoPrincipal === 'pdf_visor' && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col">
                <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <FileText className="w-4 h-4 text-indigo-400" /> Separata_Oficial_Derecho_Minero_Mod1.pdf
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md">Visor Oficial EDUMIN</span>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50 flex justify-center">
                  <div className="bg-white text-slate-900 w-full max-w-2xl p-8 rounded-2xl shadow-xl text-left space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">Manual de Derecho Ambiental Minero y Permisología</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      El presente compendio recopila la normativa sobre Estudios de Impacto Ambiental (EIA-sd, EIA-d), Límites Máximos Permisibles (LMP) y su fiscalización estricta ante el OEFA y el MINEM.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {contenidoPrincipal === 'resumen_video' && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
                <Video className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-white mb-2">Video Resumen Ejecutivo (Módulo I)</h3>
                <iframe 
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ" 
                  title="Resumen Video"
                  className="w-full max-w-md h-40 rounded-xl border border-slate-700"
                  allowFullScreen
                />
              </div>
            )}

            {contenidoPrincipal === 'resumen_audio' && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
                <Headphones className="w-12 h-12 text-emerald-400 mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Audio Podcast: Jurisprudencia Minera</h3>
                <div className="w-full max-w-md bg-slate-800 p-4 rounded-2xl flex items-center gap-4">
                  <button className="size-10 rounded-full bg-emerald-600 text-white font-bold">▶</button>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-white">Podcast_Derecho_Minero_Ep1.mp3</p>
                    <div className="w-full bg-slate-700 h-2 rounded-full mt-2"><div className="bg-emerald-400 h-full w-1/2"></div></div>
                  </div>
                </div>
              </div>
            )}

            {contenidoPrincipal === 'resumen_interactivo' && (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
                <Sparkles className="w-12 h-12 text-cyan-400 mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Flashcards Interactivas - Catastro Minero</h3>
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full text-left">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">Pregunta Clave 1</span>
                  <p className="text-sm font-semibold text-white mt-2">¿Qué entidad administra el sistema oficial GEOCATMIN en el Perú?</p>
                  <div className="mt-4 flex gap-2">
                    <span className="bg-cyan-500/20 text-cyan-300 text-xs px-3 py-1.5 rounded-xl border border-cyan-500/30">INGEMMET</span>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Info Activa */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Visualizando: {recursoActivoInfo}</span>
              <h2 className="text-xl font-bold text-white mt-1">{leccionActual.titulo}</h2>
              <p className="text-xs text-slate-400 mt-1">{leccionActual.subtitulo}</p>
            </div>
            
            <button 
              onClick={() => { setContenidoPrincipal('video_clase'); setRecursoActivoInfo('Clase Magistral en Video'); }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors shadow-md"
            >
              Ver Video Principal
            </button>
          </div>

          {/* Pestañas */}
          <div className="mt-6">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
              <button
                onClick={() => setTabActiva('resumen')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tabActiva === 'resumen' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
              >
                Resumen del Módulo
              </button>
              <button
                onClick={() => setTabActiva('recursos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tabActiva === 'recursos' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
              >
                Recursos Multimedia y PDFs
              </button>
              <button
                onClick={() => setTabActiva('foro')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tabActiva === 'foro' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
              >
                Foro del Diplomado
              </button>
            </div>

            <div className="mt-6 text-slate-300 text-sm leading-relaxed">
              {tabActiva === 'resumen' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-white">Objetivos del Módulo I:</h3>
                  <p>Domina los fundamentos legales del sector extractivo, comprendiendo la tipología de los Instrumentos de Gestión Ambiental (IGA), el uso de plataformas oficiales como GEOCATMIN y la prevención de riesgos legales en concesiones mineras.</p>
                </div>
              )}

              {tabActiva === 'recursos' && (
                <div className="space-y-4">
                  {/* PDF */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-indigo-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Separata_Oficial_Derecho_Minero_Mod1.pdf</h4>
                        <span className="text-xs text-slate-500">Documento institucional · 5.1 MB</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setContenidoPrincipal('pdf_visor'); setRecursoActivoInfo('Separata PDF'); }} className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver</button>
                      <button className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Descargar</button>
                    </div>
                  </div>

                  {/* Video */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Video className="w-6 h-6 text-indigo-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Video Resumen Ejecutivo (Cápsula)</h4>
                        <span className="text-xs text-slate-500">Resumen en video · 8 min</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setContenidoPrincipal('resumen_video'); setRecursoActivoInfo('Resumen en Video'); }} className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver</button>
                      <button className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Descargar</button>
                    </div>
                  </div>

                  {/* Audio */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Headphones className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Audio Podcast de Análisis Jurídico</h4>
                        <span className="text-xs text-slate-500">Podcast MP3 · 15 min</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setContenidoPrincipal('resumen_audio'); setRecursoActivoInfo('Resumen en Audio'); }} className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver</button>
                      <button className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Descargar</button>
                    </div>
                  </div>

                  {/* Interactivo */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-cyan-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Flashcards Interactivas de Repaso</h4>
                        <span className="text-xs text-slate-500">Módulo de autoevaluación</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setContenidoPrincipal('resumen_interactivo'); setRecursoActivoInfo('Resumen Interactivo'); }} className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver</button>
                      <button className="bg-cyan-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Descargar</button>
                    </div>
                  </div>
                </div>
              )}

              {tabActiva === 'foro' && (
                <div className="space-y-6">
                  <form onSubmit={publicarComentario} className="flex gap-3">
                    <input 
                      type="text"
                      placeholder="Escribe tu consulta legal o comentario..."
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <button type="submit" className="bg-indigo-600 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 text-sm shrink-0">
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

        {/* SIDEBAR DERECHO: 3 MÓDULOS OFICIALES DE DERECHO MINERO */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-800 bg-slate-950/50">
            <h3 className="font-bold text-white text-base">Estructura Curricular</h3>
            <p className="text-xs text-slate-400 mt-0.5">3 Módulos Académicos Oficiales</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {modulosDerechoMinero.map((mod) => (
              <div key={mod.id} className="border border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setModuloActivo(mod.id === moduloActivo ? 0 : mod.id)}
                  className="w-full p-4 text-left flex items-center justify-between bg-slate-900/80 hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Módulo {mod.id} · {mod.horas}</span>
                    <h4 className="font-bold text-xs text-white mt-0.5">{mod.titulo}</h4>
                  </div>
                  {moduloActivo === mod.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {moduloActivo === mod.id && (
                  <div className="divide-y divide-slate-800/60">
                    {mod.temas.map((tema) => (
                      <div 
                        key={tema.id}
                        onClick={() => setLeccionActual({ titulo: mod.titulo, subtitulo: tema.titulo })}
                        className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          {tema.completada ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <PlayCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                          )}
                          <span className="text-xs font-medium text-slate-200">{tema.titulo}</span>
                        </div>
                        <span className="text-[10px] text-slate-500">{tema.duracion}</span>
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