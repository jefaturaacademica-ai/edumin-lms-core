'use client';

import { useState } from 'react';
import { PlayCircle, CheckCircle2, FileText, ArrowLeft, Download, Video, Award } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function ReproductorCursoPage() {
  const params = useParams();
  const cursoId = params.id as string;

  // Base de datos simulada de contenidos para los cursos cortos (2 a 4 grabaciones + material)
  const cursosData: Record<string, { titulo: string; categoria: string; grabaciones: { id: string; titulo: string; duracion: string; videoUrl: string }[]; material: string }> = {
    'manejo-epps': {
      titulo: "Manejo de EPPs y Equipos de Protección según Ley 29783",
      categoria: "Seguridad",
      grabaciones: [
        { id: 'g1', titulo: 'Sesión 1: Marco normativo de EPPs en la Ley 29783', duracion: '35 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g2', titulo: 'Sesión 2: Clasificación y categorización de equipos de protección', duracion: '42 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
        { id: 'g3', titulo: 'Sesión 3: Inspección, mantenimiento y casos prácticos', duracion: '38 min', videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ' },
      ],
      material: 'Guia_Practica_EPPs_Ley29783.pdf'
    },
    'big-data': {
      titulo: "Fundamentos de Big Data y Analítica Predictiva para Operaciones",
      categoria: "Tecnología",
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

  const cursoActual = cursosData[cursoId] || cursosData['manejo-epps'];
  const [videoActivo, setVideoActivo] = useState(cursoActual.grabaciones[0]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      
      {/* Top Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900 px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard/cursos"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-400 hover:text-white transition-colors bg-slate-800/50 px-3 py-1.5 rounded-xl border border-slate-700/50"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a Cursos
          </Link>
          <div className="h-5 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h1 className="text-sm font-bold text-white truncate max-w-lg hidden sm:block">
              Curso Corto: {cursoActual.titulo}
            </h1>
          </div>
        </div>

        <span className="text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1.5 rounded-full">
          Curso Asincrónico Habilitado
        </span>
      </header>

      {/* Layout Principal */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* ZONA PRINCIPAL DE REPRODUCCIÓN (70%) */}
        <div className="flex-1 flex flex-col overflow-y-auto p-6 sm:p-10 lg:border-r border-slate-800 space-y-6">
          
          {/* Visor de Video */}
          <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
            <iframe 
              src={videoActivo.videoUrl} 
              title={videoActivo.titulo}
              className="w-full h-full object-cover absolute inset-0"
              allowFullScreen
            />
          </div>

          {/* Detalles de la Sesión Activa */}
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">Reproduciendo Sesión</span>
              <h2 className="text-lg font-bold text-white mt-1">{videoActivo.titulo}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Duración estimada: {videoActivo.duracion}</p>
            </div>
            <span className="bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 text-xs font-bold px-3.5 py-1.5 rounded-xl w-fit">
              {cursoActual.categoria}
            </span>
          </div>

          {/* Descargable de Material del Curso */}
          <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-3xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-12 rounded-2xl bg-indigo-600/20 text-indigo-400 grid place-items-center border border-indigo-500/30">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-white text-sm">Material Institucional del Curso</h4>
                <p className="text-xs text-slate-400">{cursoActual.material} · Documento PDF descargable</p>
              </div>
            </div>
            <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-md">
              <Download className="w-4 h-4" /> Descargar Material
            </button>
          </div>

        </div>

        {/* SIDEBAR DERECHO: LAS GRABACIONES DEL CURSO (2 a 4 sesiones) */}
        <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-5 border-b border-slate-800 bg-slate-950/50">
            <h3 className="font-bold text-white text-base">Grabaciones del Curso</h3>
            <p className="text-xs text-slate-400 mt-0.5">{cursoActual.grabaciones.length} Sesiones Magistrales</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cursoActual.grabaciones.map((grab, index) => {
              const esSeleccionado = videoActivo.id === grab.id;
              return (
                <div 
                  key={grab.id}
                  onClick={() => setVideoActivo(grab)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                    esSeleccionado 
                      ? 'bg-indigo-600/20 border-indigo-500/50 text-white' 
                      : 'bg-slate-950/40 border-slate-800 text-slate-300 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <PlayCircle className={`w-5 h-5 shrink-0 ${esSeleccionado ? 'text-indigo-400' : 'text-slate-500'}`} />
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block">Sesión 0{index + 1}</span>
                      <h4 className="font-bold text-xs mt-0.5 leading-snug">{grab.titulo}</h4>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-slate-500 shrink-0">{grab.duracion}</span>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}