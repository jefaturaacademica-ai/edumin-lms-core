'use client';

import { useState } from 'react';
import { BookOpen, CheckCircle, Lock, Sparkles, Search, Award, Filter } from 'lucide-react';
import { DIPLOMADOS_EDUMIN, CURSOS_CORTOS_EDUMIN } from '@/lib/data/catalogo';

export function SelectorCursos({ availableCredits, paquete, dni }: { availableCredits: number; paquete: string; dni: string }) {
  const [modalDiplomadoAbierto, setModalDiplomadoAbierto] = useState(false);
  const [diplomadoElegido, setDiplomadoElegido] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('Todos');
  const [mensaje, setMensaje] = useState<string | null>(null);

  const categorias = ['Todos', ...Array.from(new Set(CURSOS_CORTOS_EDUMIN.map(c => c.categoria)))];

  const cursosFiltrados = CURSOS_CORTOS_EDUMIN.filter(curso => {
    const coincideCategoria = categoriaSeleccionada === 'Todos' || curso.categoria === categoriaSeleccionada;
    const coincideBusqueda = curso.titulo.toLowerCase().includes(busqueda.toLowerCase()) || 
                             curso.categoria.toLowerCase().includes(busqueda.toLowerCase());
    return coincideCategoria && coincideBusqueda;
  });

  const seleccionarDiplomado = (titulo: string) => {
    setDiplomadoElegido(titulo);
    setModalDiplomadoAbierto(false);
    setMensaje(`¡Diplomado registrado correctamente: ${titulo}!`);
  };

  return (
    <section id="cursos" className="mx-auto max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
      
      {/* Banner de Selección de Diplomado (Fijo una vez elegido) */}
      {paquete !== 'ILIMITADO' && (
        <div className="mb-10 bg-gradient-to-r from-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-indigo-600/30 border border-indigo-400/30 grid place-items-center text-indigo-300 shrink-0">
              <Award className="size-7" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Tu Diplomado Principal ({paquete})</span>
              <h3 className="text-xl font-bold mt-1">
                {diplomadoElegido ? diplomadoElegido : "Aún no has seleccionado tu Diplomado principal"}
              </h3>
              <p className="text-slate-400 text-sm mt-0.5">
                {diplomadoElegido ? "Programa fijado para tu certificación oficial." : "Elige tu diplomado de alta especialización (Selección única)."}
              </p>
            </div>
          </div>
          
          {!diplomadoElegido ? (
            <button
              onClick={() => setModalDiplomadoAbierto(true)}
              className="bg-white text-slate-950 hover:bg-indigo-50 font-bold px-6 py-3 rounded-xl transition-all shadow-md shrink-0"
            >
              Elegir mi Diplomado
            </button>
          ) : (
            <div className="bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold px-4 py-2.5 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Seleccionado y Bloqueado
            </div>
          )}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-sm font-bold uppercase tracking-widest text-indigo-600">Catálogo Académico</span>
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 mt-1">Cursos de Alta Especialización</h2>
          <p className="text-slate-500 text-sm mt-1">Explora los cursos asincrónicos y gasta tus créditos disponibles.</p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por curso..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm"
          />
        </div>
      </div>

      {/* Filtros por Categoría */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <Filter className="w-4 h-4 text-slate-400 shrink-0 mr-1" />
        {categorias.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoriaSeleccionada(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              categoriaSeleccionada === cat
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {mensaje && (
        <div className="mb-6 p-4 rounded-xl text-sm font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
          {mensaje}
        </div>
      )}

      {/* Grid de Cursos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cursosFiltrados.map((curso) => {
          const tieneCreditos = availableCredits > 0;

          return (
            <div 
              key={curso.id}
              className={`bg-white rounded-3xl p-6 shadow-sm border transition-all flex flex-col justify-between ${
                tieneCreditos ? 'border-slate-200 hover:shadow-md hover:border-indigo-200' : 'border-slate-200 opacity-80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold">
                    {curso.categoria}
                  </span>
                  <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-md">
                    1 Módulo
                  </span>
                </div>
                <h3 className="font-bold text-base text-slate-900 mb-4 leading-snug">{curso.titulo}</h3>
              </div>

              <div>
                {tieneCreditos ? (
                  <button
                    onClick={() => setMensaje(`¡Matriculado en el curso: ${curso.titulo}!`)}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    <CheckCircle className="w-4 h-4" /> Matricularme (1 Crédito)
                  </button>
                ) : (
                  <div className="w-full bg-slate-100 text-slate-400 py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 text-sm cursor-not-allowed border border-slate-200">
                    <Lock className="w-4 h-4 text-slate-400" /> Sin créditos disponibles
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL PARA ELEGIR EL DIPLOMADO (Única oportunidad) */}
      {modalDiplomadoAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-y-auto p-8 shadow-2xl relative">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">Elige tu Diplomado Principal</h3>
                <p className="text-slate-500 text-sm">⚠️ Atención: Una vez seleccionado, el programa quedará fijo y no podrá cambiarse desde el portal.</p>
              </div>
              <button onClick={() => setModalDiplomadoAbierto(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              {DIPLOMADOS_EDUMIN.map((dip) => (
                <div 
                  key={dip.id}
                  onClick={() => seleccionarDiplomado(dip.titulo)}
                  className="border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 p-4 rounded-2xl cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">{dip.categoria}</span>
                    <h4 className="font-bold text-slate-900 mt-2 text-sm leading-snug">{dip.titulo}</h4>
                    <p className="text-xs text-slate-500 mt-1">{dip.modulos} Módulos</p>
                  </div>
                  <div className="mt-4 text-xs font-bold text-indigo-600 flex items-center gap-1">
                    Fijar este diplomado →
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}