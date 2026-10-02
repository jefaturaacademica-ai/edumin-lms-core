'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
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
  Award,
  FileSpreadsheet,
  Loader2,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { getDiplomadoByTitleOrSlug } from '@/lib/data/diplomadosData';
import { parseDiplomadosFromProfile } from '@/lib/utils/profileParser';

function ReproductorContent() {
  const searchParams = useSearchParams();
  const slugParam = searchParams.get('slug') || searchParams.get('diplomado') || searchParams.get('curso') || 'derecho-minero';

  const [loading, setLoading] = useState(true);
  const [completando, setCompletando] = useState(false);
  const [perfilEstudiante, setPerfilEstudiante] = useState<any>(null);
  const [diplomadoObj, setDiplomadoObj] = useState<any>(null);
  const [catalogoSupabase, setCatalogoSupabase] = useState<any[]>([]);

  const [moduloActivo, setModuloActivo] = useState<number>(1);
  const [leccionActual, setLeccionActual] = useState<{
    titulo: string;
    subtitulo: string;
    iframe_url?: string;
    pdf_url?: string;
    excel_url?: string;
    moduloIndex?: number;
    completada?: boolean;
  }>({
    titulo: 'MÓDULO I: DERECHO MINERO',
    subtitulo: 'Clase 1: Introducción y Marcos Regularios',
    iframe_url: '',
    pdf_url: '',
    excel_url: ''
  });

  const [contenidoPrincipal, setContenidoPrincipal] = useState<'video_clase' | 'pdf_visor' | 'resumen_video' | 'resumen_audio' | 'resumen_interactivo' | 'excel_visor'>('video_clase');
  const [recursoActivoInfo, setRecursoActivoInfo] = useState<string>('Clase Magistral en Video');
  const [tabActiva, setTabActiva] = useState<'resumen' | 'recursos' | 'foro'>('resumen');
  const [comentario, setComentario] = useState('');
  const [listaComentarios, setListaComentarios] = useState([
    { autor: 'Docente Titular', texto: `Bienvenidos a la clase. Revisen el material de lectura y plantillas adjuntas en la plataforma.`, fecha: 'Hace 1 día' }
  ]);

  // Cargar datos de Supabase (/api/dashboard/me y /api/admin/catalogo)
  useEffect(() => {
    async function cargarDatosCompleto() {
      setLoading(true);
      try {
        // 1. Obtener Perfil del estudiante
        const resMe = await fetch('/api/dashboard/me');
        let prof = null;
        if (resMe.ok) {
          const dataMe = await resMe.json();
          prof = dataMe.profile;
          setPerfilEstudiante(prof);
        }

        // 2. Obtener Catálogo desde Supabase
        const resCat = await fetch('/api/admin/catalogo');
        let catItems: any[] = [];
        if (resCat.ok) {
          const dataCat = await resCat.json();
          catItems = dataCat.cursos || [];
          setCatalogoSupabase(catItems);
        }

        // 3. Emparejar Diplomado
        const fallbackProgram = getDiplomadoByTitleOrSlug(slugParam);
        
        // Buscar en catálogo Supabase por slug, id o titulo
        const catMatch = catItems.find(item => 
          (item.id && item.id.toLowerCase() === slugParam.toLowerCase()) ||
          (item.codigo && item.codigo.toLowerCase() === slugParam.toLowerCase()) ||
          (item.titulo && item.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugParam.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        );

        // Buscar en diplomados JSON del perfil del alumno
        const parsedProfileDip = parseDiplomadosFromProfile(prof);
        const userDipMatch = parsedProfileDip.find((d: any) => 
          (d.slug && d.slug.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugParam.toLowerCase().replace(/[^a-z0-9]+/g, '-')) ||
          (d.id && d.id.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugParam.toLowerCase().replace(/[^a-z0-9]+/g, '-')) ||
          (d.titulo && d.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '-') === slugParam.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
        );

        const titleFinal = catMatch?.titulo || userDipMatch?.titulo || fallbackProgram.titulo;
        const modulosSource = (catMatch?.modulos && Array.isArray(catMatch.modulos) && catMatch.modulos.length > 0)
          ? catMatch.modulos
          : fallbackProgram.modulos;

        // Mapear módulos con estado de completado
        const modulosMapeados = modulosSource.map((m: any, idx: number) => {
          const userModState = userDipMatch?.modulos?.[idx];
          const isComp = userModState?.completado ?? (idx === 0);
          const clasesList = (Array.isArray(m.clases) ? m.clases : []).map((cItem: any) => {
            const isObj = typeof cItem === 'object' && cItem !== null;
            return {
              titulo: isObj ? cItem.titulo : String(cItem),
              iframe_url: isObj ? (cItem.iframe_url || '') : '',
              pdf_url: isObj ? (cItem.pdf_url || '') : '',
              excel_url: isObj ? (cItem.excel_url || '') : ''
            };
          });

          if (clasesList.length === 0) {
            clasesList.push({
              titulo: `Clase 1: Introducción a ${m.nombre || 'Módulo'}`,
              iframe_url: '',
              pdf_url: '',
              excel_url: ''
            });
          }

          return {
            id: idx + 1,
            codigo: m.codigo || `Módulo ${(idx + 1).toString().padStart(2, '0')}`,
            nombre: m.nombre || `MóDULO ${(idx + 1).toString().padStart(2, '0')}`,
            docente: m.docente || fallbackProgram.modulos[0]?.docente || 'Docente EDUMIN',
            completado: isComp,
            clases: clasesList
          };
        });

        const dipCalculated = {
          titulo: titleFinal,
          avance: userDipMatch?.avance ?? Math.round((modulosMapeados.filter((m: any) => m.completado).length / modulosMapeados.length) * 100),
          modulos: modulosMapeados
        };

        setDiplomadoObj(dipCalculated);

        // Seleccionar primera lección por defecto
        if (dipCalculated.modulos.length > 0) {
          const firstMod = dipCalculated.modulos[0];
          const firstClase = firstMod.clases[0] || { titulo: 'Clase 1: Introducción' };

          setLeccionActual({
            titulo: `${firstMod.codigo}: ${firstMod.nombre}`,
            subtitulo: firstClase.titulo,
            iframe_url: firstClase.iframe_url,
            pdf_url: firstClase.pdf_url,
            excel_url: firstClase.excel_url,
            moduloIndex: 0,
            completada: firstMod.completado
          });
        }
      } catch (e) {
        console.error('Error al inicializar reproductor:', e);
      } finally {
        setLoading(false);
      }
    }

    cargarDatosCompleto();
  }, [slugParam]);

  // Marcar/Desmarcar Lección como Completada en Supabase
  const handleToggleCompletada = async (mIdx: number) => {
    if (!diplomadoObj || completando) return;
    setCompletando(true);

    try {
      const currentModState = diplomadoObj.modulos[mIdx]?.completado;
      const nextState = !currentModState;

      const res = await fetch('/api/dashboard/completar-leccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diplomadoSlug: slugParam,
          diplomadoTitulo: diplomadoObj.titulo,
          moduloIndex: mIdx,
          completado: nextState
        })
      });

      const data = await res.json();

      if (res.ok) {
        // Actualizar estado local dinámicamente
        const nuevosModulos = [...diplomadoObj.modulos];
        nuevosModulos[mIdx] = { ...nuevosModulos[mIdx], completado: nextState };

        const completadosCount = nuevosModulos.filter((m: any) => m.completado).length;
        const nuevoAvance = Math.round((completadosCount / nuevosModulos.length) * 100);

        setDiplomadoObj({
          ...diplomadoObj,
          avance: nuevoAvance,
          modulos: nuevosModulos
        });

        if (leccionActual.moduloIndex === mIdx) {
          setLeccionActual(prev => ({ ...prev, completada: nextState }));
        }
      } else {
        alert(`Error al registrar en Supabase: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error de red al completar lección: ${e.message}`);
    } finally {
      setCompletando(false);
    }
  };

  const publicarComentario = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comentario.trim()) return;
    setListaComentarios([{ autor: perfilEstudiante ? `${perfilEstudiante.nombres} ${perfilEstudiante.apellidos}` : 'Estudiante EDUMIN', texto: comentario, fecha: 'Justo ahora' }, ...listaComentarios]);
    setComentario('');
  };

  if (loading || !diplomadoObj) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        <p className="text-xs font-bold text-slate-400">Sincronizando contenidos de Supabase...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/diplomados"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" /> Mis Programas
          </Link>
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400 shrink-0" />
            <h1 className="text-sm font-bold text-white truncate max-w-md hidden sm:block">
              {diplomadoObj.titulo} (120 Horas)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1.5 rounded-full">
            Avance General: {diplomadoObj.avance}% completado
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
                src={leccionActual.iframe_url || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
                title={leccionActual.subtitulo}
                className="w-full h-full object-cover absolute inset-0"
                allowFullScreen
              />
            )}

            {contenidoPrincipal === 'pdf_visor' && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col">
                <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <FileText className="w-4 h-4 text-indigo-400" /> Material Lectura Obligatoria (PDF)
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md">Visor Oficial EDUMIN</span>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50 flex justify-center items-center">
                  <div className="bg-white text-slate-900 w-full max-w-2xl p-8 rounded-2xl shadow-xl text-left space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2">{leccionActual.subtitulo}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Material académico oficial guardado en Supabase. Puedes previsualizar el documento completo o descargarlo directamente.
                    </p>
                    {leccionActual.pdf_url ? (
                      <a href={leccionActual.pdf_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-xl">
                        <Download className="w-4 h-4" /> Abrir PDF Oficial
                      </a>
                    ) : (
                      <p className="text-xs text-indigo-600 font-semibold italic">PDF estándar predeterminado disponible.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {contenidoPrincipal === 'excel_visor' && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col">
                <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Planilla de Trabajo Excel (.xlsx)
                  </div>
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-md">Material Descargable</span>
                </div>
                <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50 flex justify-center items-center">
                  <div className="bg-white text-slate-900 w-full max-w-2xl p-8 rounded-2xl shadow-xl text-left space-y-4">
                    <h4 className="font-bold text-lg border-b pb-2 text-emerald-900">Plantilla de Cálculo y Casos Prácticos</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Utiliza este recurso dinámico preparado por la plana docente para ejercitar tus conocimientos.
                    </p>
                    {leccionActual.excel_url ? (
                      <a href={leccionActual.excel_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-emerald-600 text-white font-bold text-xs px-4 py-2 rounded-xl">
                        <Download className="w-4 h-4" /> Descargar Excel (.xlsx)
                      </a>
                    ) : (
                      <p className="text-xs text-emerald-600 font-semibold italic">Plantilla Excel estándar predeterminada disponible.</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {contenidoPrincipal === 'resumen_video' && (
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
                <Video className="w-12 h-12 text-indigo-400 mb-3 animate-pulse" />
                <h3 className="text-lg font-bold text-white mb-2">Video Cápsula Resumen</h3>
                <iframe 
                  src={leccionActual.iframe_url || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
                  title="Resumen Video"
                  className="w-full max-w-md h-40 rounded-xl border border-slate-700"
                  allowFullScreen
                />
              </div>
            )}

            {contenidoPrincipal === 'resumen_audio' && (
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
                <Headphones className="w-12 h-12 text-emerald-400 mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Podcast Audio de Cátedra</h3>
                <div className="w-full max-w-md bg-slate-800 p-4 rounded-2xl flex items-center gap-4">
                  <button className="size-10 rounded-full bg-emerald-600 text-white font-bold">▶</button>
                  <div className="flex-1 text-left">
                    <p className="text-xs font-bold text-white">Audio_Resumen_Modulo.mp3</p>
                    <div className="w-full bg-slate-700 h-2 rounded-full mt-2"><div className="bg-emerald-400 h-full w-1/2"></div></div>
                  </div>
                </div>
              </div>
            )}

            {contenidoPrincipal === 'resumen_interactivo' && (
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 via-slate-900 to-black flex flex-col items-center justify-center p-8">
                <Sparkles className="w-12 h-12 text-cyan-400 mb-3" />
                <h3 className="text-lg font-bold text-white mb-2">Flashcards Interactivas</h3>
                <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl max-w-md w-full text-left">
                  <span className="text-[10px] text-cyan-400 font-bold uppercase">Pregunta de Autoevaluación</span>
                  <p className="text-sm font-semibold text-white mt-2">¿Cuáles son las variables normativas clave evaluadas en este módulo?</p>
                </div>
              </div>
            )}

          </div>

          {/* Info Activa y Botón de Marcar Completada */}
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Visualizando: {recursoActivoInfo}</span>
              <h2 className="text-xl font-bold text-white mt-1">{leccionActual.titulo}</h2>
              <p className="text-xs text-slate-400 mt-1">{leccionActual.subtitulo}</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <button 
                onClick={() => handleToggleCompletada(leccionActual.moduloIndex ?? 0)}
                disabled={completando}
                className={`font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  leccionActual.completada 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                }`}
              >
                {completando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : leccionActual.completada ? (
                  <>
                    <Check className="w-4 h-4 text-white" /> Lección Completada
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Marcar como Completado
                  </>
                )}
              </button>

              <button 
                onClick={() => { setContenidoPrincipal('video_clase'); setRecursoActivoInfo('Clase Magistral en Video'); }}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors border border-slate-700"
              >
                Ver Video Principal
              </button>
            </div>
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
                Recursos Multimedia, PDFs y Excel
              </button>
              <button
                onClick={() => setTabActiva('foro')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tabActiva === 'foro' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:bg-slate-900'}`}
              >
                Foro de Consultas
              </button>
            </div>

            <div className="mt-6 text-slate-300 text-sm leading-relaxed">
              {tabActiva === 'resumen' && (
                <div className="space-y-3">
                  <h3 className="font-bold text-white">Objetivos Curriculares:</h3>
                  <p>Aprende de manera directa con casos reales de la industria. Revisa las separatas, iFrames de clases en vivo y plantillas Excel proporcionadas por la Plana Docente Titular.</p>
                </div>
              )}

              {tabActiva === 'recursos' && (
                <div className="space-y-4">
                  {/* PDF */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-indigo-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Separata PDF Oficial</h4>
                        <span className="text-xs text-slate-500">Documento de lectura institucional</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setContenidoPrincipal('pdf_visor'); setRecursoActivoInfo('Separata PDF'); }} className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver</button>
                      {leccionActual.pdf_url && (
                        <a href={leccionActual.pdf_url} target="_blank" rel="noopener noreferrer" className="bg-indigo-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Descargar</a>
                      )}
                    </div>
                  </div>

                  {/* Excel */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Plantilla / Hoja Excel de Casos (.xlsx)</h4>
                        <span className="text-xs text-slate-500">Material de aplicación práctica</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setContenidoPrincipal('excel_visor'); setRecursoActivoInfo('Archivo Excel'); }} className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver</button>
                      {leccionActual.excel_url && (
                        <a href={leccionActual.excel_url} target="_blank" rel="noopener noreferrer" className="bg-emerald-600 text-white text-xs font-bold px-3 py-2 rounded-xl flex items-center gap-1"><Download className="w-3.5 h-3.5" /> Descargar</a>
                      )}
                    </div>
                  </div>

                  {/* Video Cápsula */}
                  <div className="flex items-center justify-between p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <Video className="w-6 h-6 text-indigo-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">Cápsula de Resumen de Clase</h4>
                        <span className="text-xs text-slate-500">Video explicativo</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setContenidoPrincipal('resumen_video'); setRecursoActivoInfo('Resumen en Video'); }} className="bg-slate-800 text-white text-xs font-bold px-3 py-2 rounded-xl border border-slate-700 flex items-center gap-1"><Eye className="w-3.5 h-3.5" /> Ver</button>
                    </div>
                  </div>

                </div>
              )}

              {tabActiva === 'foro' && (
                <div className="space-y-6">
                  <form onSubmit={publicarComentario} className="flex gap-3">
                    <input 
                      type="text"
                      placeholder="Escribe tu consulta o comentario..."
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

        {/* SIDEBAR DERECHO: ESTRUCTURA CURRICULAR DINÁMICA */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-white text-base">Estructura Curricular</h3>
              <p className="text-xs text-slate-400 mt-0.5">{diplomadoObj.modulos.length} Módulos Registrados</p>
            </div>
            <span className="bg-indigo-600/20 text-indigo-300 text-xs font-bold px-3 py-1 rounded-full border border-indigo-500/30">
              {diplomadoObj.avance}%
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {diplomadoObj.modulos.map((mod: any, mIdx: number) => (
              <div key={mod.id} className="border border-slate-800 bg-slate-950/40 rounded-2xl overflow-hidden">
                <button
                  onClick={() => setModuloActivo(mod.id === moduloActivo ? 0 : mod.id)}
                  className="w-full p-4 text-left flex items-center justify-between bg-slate-900/80 hover:bg-slate-800 transition-colors"
                >
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{mod.codigo}</span>
                    <h4 className="font-bold text-xs text-white mt-0.5">{mod.nombre}</h4>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-semibold">Docente: {mod.docente}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {mod.completado ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">En curso</span>
                    )}
                    {moduloActivo === mod.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </button>

                  <div className="divide-y divide-slate-800/60 bg-slate-950/60 p-2 space-y-1">
                    {mod.clases.map((clase: any, cIdx: number) => {
                      const isSelected = leccionActual.subtitulo === clase.titulo;
                      
                      return (
                        <div 
                          key={cIdx}
                          className={`p-3 rounded-xl flex items-center justify-between transition-colors ${
                            isSelected ? 'bg-indigo-950/80 border border-indigo-500/40' : 'hover:bg-slate-800/60'
                          }`}
                        >
                          <div 
                            onClick={() => {
                              setLeccionActual({
                                titulo: `${mod.codigo}: ${mod.nombre}`,
                                subtitulo: clase.titulo,
                                iframe_url: clase.iframe_url,
                                pdf_url: clase.pdf_url,
                                excel_url: clase.excel_url,
                                moduloIndex: mIdx,
                                completada: mod.completado
                              });
                              setContenidoPrincipal('video_clase');
                            }}
                            className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                          >
                            {mod.completado ? (
                              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                            ) : (
                              <PlayCircle className="w-4.5 h-4.5 text-indigo-400 shrink-0" />
                            )}
                            <span className={`text-xs font-semibold truncate ${isSelected ? 'text-indigo-300 font-bold' : 'text-slate-200'}`}>
                              {clase.titulo}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCompletada(mIdx);
                              }}
                              title={mod.completado ? "Marcar como incompleto" : "Marcar lección como completada"}
                              className={`p-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                mod.completado 
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30' 
                                  : 'bg-slate-800 text-slate-400 hover:bg-indigo-600 hover:text-white border border-slate-700'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">{mod.completado ? 'Completada' : 'Completar'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleToggleCompletada(mIdx)}
                        disabled={completando}
                        className={`w-full text-center py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                          mod.completado 
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60 hover:bg-emerald-900'
                            : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        {mod.completado ? '✔ Módulo Completado (100%)' : 'Marcar Módulo Completo'}
                      </button>
                    </div>
                  </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default function DerechoMineroReproductorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8">Cargando reproductor de clases...</div>}>
      <ReproductorContent />
    </Suspense>
  );
}