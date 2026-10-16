'use client';

import { useState, useEffect, useCallback } from 'react';
import { PlayCircle, CheckCircle2, FileText, ArrowLeft, Download, Video, Award, Check, Loader2, Table, ExternalLink, Globe, Code } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTheme } from '@/context/theme-context';
import { parseCursosFromProfile } from '@/lib/utils/profileParser';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';

function formatearUrlVideoEmbed(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Google Drive: convertir /view o /view?usp=sharing a /preview
  if (trimmed.includes('drive.google.com')) {
    return trimmed.replace(/\/view(\?.*)?$/, '/preview');
  }

  // YouTube: convertir watch?v= o youtu.be a embed
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  return trimmed;
}

function getMaterialInfo(url: string) {
  const trimmed = (url || '').trim();
  const lower = trimmed.toLowerCase();

  const isGithub = lower.includes('github.io') || lower.includes('github.com');
  const isHtml = lower.endsWith('.html') || lower.includes('.html?') || lower.includes('/interactive');
  const isPdf = lower.endsWith('.pdf') || lower.includes('.pdf?') || lower.includes('drive.google.com');

  if (isGithub) {
    return {
      tipo: 'Repositorio GitHub / Pages',
      badgeColor: 'bg-slate-800 text-slate-100 border-slate-700',
      icono: 'github',
      verTexto: 'Ver en GitHub / Web',
      descargarTexto: 'Abrir Repositorio'
    };
  }

  if (isHtml) {
    return {
      tipo: 'Diapositivas HTML Interactivas',
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      icono: 'html',
      verTexto: 'Ver Diapositivas HTML',
      descargarTexto: 'Abrir Interactivo'
    };
  }

  if (isPdf) {
    return {
      tipo: 'Diapositivas PDF',
      badgeColor: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
      icono: 'pdf',
      verTexto: 'Ver Diapositivas',
      descargarTexto: 'Descargar PDF'
    };
  }

  return {
    tipo: 'Material Complementario',
    badgeColor: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    icono: 'doc',
    verTexto: 'Ver Material',
    descargarTexto: 'Descargar / Abrir'
  };
}

export default function ReproductorCursoPage() {
  const params = useParams();
  const cursoId = params.id as string;
  const { esOscuro } = useTheme();

  const [loading, setLoading] = useState(true);
  const [completadosMap, setCompletadosMap] = useState<Record<string, boolean>>({});
  const [cursoCatalogo, setCursoCatalogo] = useState<any>(null);
  const [guardandoAvance, setGuardandoAvance] = useState(false);

  // Base de datos de fallback para cursos cortos
  const cursosDataFallback: Record<string, { titulo: string; categoria: string; grabaciones: { id: string; titulo: string; duracion: string; videoUrl: string }[]; material: string }> = {
    'manejo-epps': {
      titulo: "Manejo de EPPs y Equipos de Protección según Ley 29783",
      categoria: "Seguridad Industrial",
      grabaciones: [
        { id: 'g1', titulo: 'Sesión 1: Marco normativo de EPPs en la Ley 29783', duracion: '35 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g2', titulo: 'Sesión 2: Clasificación y categorización de equipos de protección', duracion: '42 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g3', titulo: 'Sesión 3: Inspección, mantenimiento y casos prácticos', duracion: '38 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      ],
      material: 'Guia_Practica_EPPs_Ley29783.pdf'
    },
    'big-data': {
      titulo: "Fundamentos de Big Data y Analítica Predictiva para Operaciones",
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
      titulo: "Gestión de Riesgos Críticos y AST",
      categoria: "Seguridad Industrial",
      grabaciones: [
        { id: 'g1', titulo: 'Sesión 1: Identificación de peligros y evaluación de riesgos', duracion: '40 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g2', titulo: 'Sesión 2: Elaboración y aplicación correcta del AST', duracion: '45 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      ],
      material: 'Formato_AST_Guia.pdf'
    },
    'logistica-minera': {
      titulo: "Introducción a la Cadena de Suministro y Logística Minera",
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
        const cursos = profile?.cursos_json || (Array.isArray(profile?.cursos) ? profile.cursos : parseCursosFromProfile(profile));
        
        const targetNorm = cursoId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const curEnPerfil = Array.isArray(cursos)
          ? cursos.find((c: any) => (c.id || c.codigo || c.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetNorm)
          : null;

        if (curEnPerfil) {
          setCompletadosMap(prev => {
            const next = { ...prev };
            if (curEnPerfil.completadosMap && typeof curEnPerfil.completadosMap === 'object') {
              Object.assign(next, curEnPerfil.completadosMap);
            }
            next[curEnPerfil.id || cursoId] = Boolean(curEnPerfil.completado);
            return next;
          });
        }
      }

      if (catRes && catRes.ok) {
        const catData = await catRes.json();
        const todos = catData.cursos || catData.todos || [];
        const targetNorm = cursoId.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const catItem = todos.find((c: any) => 
          (c.id || c.codigo || c.titulo || '').toLowerCase().replace(/[^a-z0-9]+/g, '-') === targetNorm
        );
        if (catItem) {
          setCursoCatalogo(catItem);
        }
      }
    } catch (e) {
      console.error('Error al cargar curso:', e);
    } finally {
      setLoading(false);
    }
  }, [cursoId]);

  useEffect(() => {
    cargarDatosSupabase();
  }, [cargarDatosSupabase]);

  const fallback = cursosDataFallback[cursoId] || cursosDataFallback['manejo-epps'];
  const clasesDesdeCatalogo = (() => {
    if (cursoCatalogo?.modulos?.[0]?.clases && Array.isArray(cursoCatalogo.modulos[0].clases) && cursoCatalogo.modulos[0].clases.length > 0) {
      return cursoCatalogo.modulos[0].clases;
    }
    if (Array.isArray(cursoCatalogo?.clases) && cursoCatalogo.clases.length > 0) {
      return cursoCatalogo.clases;
    }
    return null;
  })();

  const cursoActual = {
    titulo: cursoCatalogo?.titulo || fallback.titulo,
    categoria: cursoCatalogo?.categoria || fallback.categoria,
    grabaciones: clasesDesdeCatalogo
      ? clasesDesdeCatalogo.map((claseStr: any, idx: number) => {
          const rawTitulo = typeof claseStr === 'string' ? claseStr : claseStr?.titulo;
          const parteNum = idx + 1;
          const tituloParte = rawTitulo || `Parte ${parteNum}`;
          const rawVideo = typeof claseStr === 'object' ? (claseStr?.videoUrl || claseStr?.iframe_url || '') : '';
          const mat1 = typeof claseStr === 'object' ? (claseStr?.material1 || claseStr?.pdfUrl || '') : '';
          const mat2 = typeof claseStr === 'object' ? (claseStr?.material2 || claseStr?.excelUrl || '') : '';

          return {
            id: typeof claseStr === 'object' && claseStr?.id ? claseStr.id : `parte-${parteNum}`,
            titulo: tituloParte,
            duracion: 'Clase Completa',
            videoUrl: formatearUrlVideoEmbed(rawVideo),
            videoUrlOriginal: rawVideo,
            material1: mat1,
            material2: mat2,
            pdfUrl: mat1,
            excelUrl: mat2
          };
        })
      : fallback.grabaciones.map((g: any) => ({
          ...g,
          material1: fallback.material,
          material2: '',
          pdfUrl: fallback.material,
          excelUrl: ''
        })),
    material: fallback.material
  };

  const [videoActivo, setVideoActivo] = useState<any>(cursoActual.grabaciones[0] || null);

  useEffect(() => {
    if (cursoActual.titulo) {
      document.title = `${cursoActual.titulo} | EDUMIN`;
    }
  }, [cursoActual.titulo]);

  useEffect(() => {
    if (cursoActual.grabaciones.length > 0) {
      setVideoActivo((prev: any) => {
        if (prev) {
          const encontrado = cursoActual.grabaciones.find((g: any) => g.id === prev.id);
          if (encontrado) return encontrado;
        }
        return cursoActual.grabaciones[0];
      });
    }
  }, [cursoCatalogo]);

  const toggleCompletarSesion = async (sesionId: string) => {
    try {
      setGuardandoAvance(true);
      const estadoActual = Boolean(completadosMap[sesionId]);
      const nuevoEstado = !estadoActual;

      const nuevoMap = { ...completadosMap, [sesionId]: nuevoEstado };
      setCompletadosMap(nuevoMap);

      const completadasCount = cursoActual.grabaciones.filter((g: any) => nuevoMap[g.id]).length;
      const totalGrabaciones = cursoActual.grabaciones.length;
      const nuevoAvance = totalGrabaciones > 0 ? Math.round((completadasCount / totalGrabaciones) * 100) : 0;

      await fetch('/api/dashboard/completar-leccion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cursoId: cursoId,
          cursoSlug: cursoId,
          cursoTitulo: cursoActual.titulo,
          sesionId: sesionId,
          claseId: sesionId,
          completado: nuevoEstado,
          completadosMap: nuevoMap,
          avancePorcentaje: nuevoAvance
        })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setGuardandoAvance(false);
    }
  };

  const totalGrabaciones = cursoActual.grabaciones.length;
  const completadasCount = cursoActual.grabaciones.filter((g: any) => completadosMap[g.id]).length;
  const avancePorcentaje = totalGrabaciones > 0 ? Math.round((completadasCount / totalGrabaciones) * 100) : 0;

  const sesionEstaCompletada = videoActivo ? Boolean(completadosMap[videoActivo.id]) : false;

  const renderMaterialCard = (url: string, num: number) => {
    if (!url || !url.trim()) return null;
    const info = getMaterialInfo(url);

    return (
      <div key={num} className={`p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
        esOscuro ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`size-8 rounded-lg grid place-items-center text-xs font-bold border shrink-0 ${
              info.icono === 'github'
                ? 'bg-slate-800 text-white border-slate-700'
                : info.icono === 'html'
                ? 'bg-amber-100 text-amber-800 border-amber-200'
                : 'bg-rose-100 text-rose-800 border-rose-200'
            }`}>
              {info.icono === 'github' ? <Globe className="w-4 h-4" /> : info.icono === 'html' ? <Code className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Material 0{num}
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block truncate max-w-[180px]">
                {info.tipo}
              </span>
            </div>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border shrink-0 ${info.badgeColor}`}>
            {info.tipo.split(' ')[0]}
          </span>
        </div>

        <div className="flex items-center gap-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-2 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>{info.verTexto}</span>
          </a>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            download
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1 border shrink-0 ${
              esOscuro
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
            }`}
            title="Descargar o abrir enlace"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </a>
        </div>
      </div>
    );
  };

  if (loading) {
    return <DashboardLoader minHeight="min-h-screen" />;
  }

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-200 ${
      esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      
      {/* Top Bar */}
      <header className={`h-16 border-b px-4 sm:px-6 flex items-center justify-between shrink-0 transition-colors ${
        esOscuro ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
      }`}>
        <div className="flex items-center gap-3 sm:gap-4">
          <Link 
            href="/dashboard/cursos"
            className={`inline-flex items-center gap-2 text-xs sm:text-sm font-semibold transition-colors px-3 py-1.5 rounded-xl border ${
              esOscuro 
                ? 'text-slate-400 hover:text-white bg-slate-800/50 border-slate-700/50' 
                : 'text-slate-600 hover:text-slate-900 bg-slate-100 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-4 h-4" /> 
            <span className="hidden sm:inline">Volver a Cursos</span>
            <span className="sm:hidden">Volver</span>
          </Link>
          <div className={`h-5 w-px hidden sm:block ${esOscuro ? 'bg-slate-800' : 'bg-slate-200'}`} />
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-500 hidden sm:block" />
            <h1 className={`text-xs sm:text-sm font-bold truncate max-w-lg hidden sm:block ${
              esOscuro ? 'text-white' : 'text-slate-900'
            }`}>
              {cursoActual.titulo}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`text-[11px] sm:text-xs font-bold px-3 py-1.5 rounded-full border ${
            avancePorcentaje > 0 
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
              : esOscuro ? 'bg-slate-800 text-slate-400 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
          }`}>
            Avance: {avancePorcentaje}%
          </span>
        </div>
      </header>

      {/* Layout Principal */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ZONA PRINCIPAL DE REPRODUCCIÓN (70%) */}
        <div className={`flex-1 flex flex-col overflow-y-auto p-4 sm:p-8 lg:p-10 lg:border-r space-y-6 ${
          esOscuro ? 'lg:border-slate-800' : 'lg:border-slate-200'
        }`}>
          
          {/* Visor de Video */}
          <div className={`w-full aspect-video bg-black rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl relative border ${
            esOscuro ? 'border-slate-800' : 'border-slate-300'
          }`}>
            {videoActivo?.videoUrl ? (
              <iframe 
                src={videoActivo.videoUrl} 
                title={videoActivo.titulo}
                className="w-full h-full object-cover absolute inset-0"
                allowFullScreen
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-4 text-center">
                <Video className="w-12 h-12 opacity-30 text-indigo-400" />
                <p className="text-sm font-bold text-slate-300">
                  {videoActivo?.titulo || 'Clase Seleccionada'}
                </p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Esta parte aún no cuenta con un enlace de video registrado en el catálogo.
                </p>
              </div>
            )}
          </div>

          {/* Detalles de la Sesión Activa + Botón Marcar Completado */}
          {videoActivo && (
            <div className={`p-5 sm:p-6 rounded-3xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
              esOscuro ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div>
                <span className="text-[10px] sm:text-xs font-bold text-indigo-500 uppercase tracking-widest">
                  Reproduciendo
                </span>
                <h2 className={`text-base sm:text-lg font-bold mt-1 ${
                  esOscuro ? 'text-white' : 'text-slate-900'
                }`}>
                  {videoActivo.titulo}
                </h2>
                <p className={`text-xs mt-0.5 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  Duración estimada: {videoActivo.duracion}
                </p>
              </div>

              <button
                onClick={() => toggleCompletarSesion(videoActivo.id)}
                disabled={guardandoAvance}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border shrink-0 ${
                  sesionEstaCompletada
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow'
                }`}
              >
                {guardandoAvance ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : sesionEstaCompletada ? (
                  <>
                    <Check className="w-4 h-4 text-white" />
                    <span>Completado ✓</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Marcar como Completado</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Materiales de la Clase (Parte X): Material 1 y Material 2 */}
          {(videoActivo?.material1 || videoActivo?.material2 || videoActivo?.pdfUrl) ? (
            <div className={`p-5 sm:p-6 rounded-3xl border transition-all space-y-4 ${
              esOscuro ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
            }`}>
              <div className="flex items-center gap-3 border-b pb-3 border-slate-100 dark:border-slate-800">
                <div className={`size-10 rounded-xl grid place-items-center border shrink-0 ${
                  esOscuro ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                }`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h4 className={`font-bold text-sm ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                    Materiales de la Clase · {videoActivo?.titulo || 'Parte Seleccionada'}
                  </h4>
                  <p className={`text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                    Diapositivas (PDF), recursos interactivos HTML y repositorios GitHub Pages para ver o descargar.
                  </p>
                </div>
              </div>

              {/* Botones de Material 1 y Material 2 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videoActivo?.material1 && renderMaterialCard(videoActivo.material1, 1)}
                {videoActivo?.material2 && renderMaterialCard(videoActivo.material2, 2)}
                {!videoActivo?.material1 && videoActivo?.pdfUrl && renderMaterialCard(videoActivo.pdfUrl, 1)}
              </div>
            </div>
          ) : (
            <div className={`p-5 rounded-2xl border transition-all flex items-center gap-3 ${
              esOscuro ? 'bg-slate-900/30 border-slate-800/80 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}>
              <FileText className="w-5 h-5 text-slate-400 shrink-0" />
              <p className="text-xs">
                No hay diapositivas o repositorios adicionales adjuntados para esta parte.
              </p>
            </div>
          )}

        </div>

        {/* SIDEBAR DERECHO: LAS GRABACIONES / PARTES DEL PROGRAMA */}
        <div className={`w-full lg:w-96 border-t lg:border-t-0 lg:border-l flex flex-col shrink-0 transition-colors ${
          esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className={`p-5 border-b shrink-0 ${
            esOscuro ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'
          }`}>
            <h3 className={`font-bold text-base ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              Clases del Programa
            </h3>
            <p className={`text-xs mt-0.5 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              {cursoActual.grabaciones.length} Partes Registradas
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cursoActual.grabaciones.map((grab: any, index: number) => {
              const esSeleccionado = videoActivo?.id === grab.id;
              const estaComp = Boolean(completadosMap[grab.id]);
              const parteTexto = grab.titulo?.toLowerCase().includes('parte')
                ? grab.titulo
                : `Parte ${index + 1}`;

              return (
                <div 
                  key={grab.id}
                  onClick={() => setVideoActivo(grab)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    esSeleccionado 
                      ? esOscuro
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white' 
                        : 'bg-indigo-50 border-indigo-500 text-indigo-950 shadow-sm'
                      : esOscuro
                        ? 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleCompletarSesion(grab.id);
                      }}
                      title={estaComp ? "Desmarcar completado (volver a en curso)" : "Marcar sesión como completada"}
                      className="p-1 rounded-lg transition-transform hover:scale-110 cursor-pointer shrink-0"
                    >
                      {estaComp ? (
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                      ) : (
                        <div className={`size-4.5 rounded-full border-2 shrink-0 ${
                          esSeleccionado 
                            ? 'border-indigo-500 hover:border-indigo-400' 
                            : esOscuro ? 'border-slate-500 hover:border-indigo-400' : 'border-slate-400 hover:border-indigo-600'
                        }`} />
                      )}
                    </button>
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 block">
                        {parteTexto}
                      </span>
                      <h4 className="font-bold text-xs mt-0.5 leading-snug truncate">
                        {grab.titulo}
                      </h4>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold shrink-0 ${
                    esOscuro ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {grab.duracion}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}