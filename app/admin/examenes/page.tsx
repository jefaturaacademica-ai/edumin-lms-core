'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileQuestion, Search, Plus, Filter, CheckCircle2, 
  AlertCircle, Edit3, Trash2, Eye, Code, 
  RotateCcw, Sparkles, Check, X, HelpCircle, Layers,
  Copy, BookOpen, Clock, Award, ShieldAlert, ArrowUpDown, ChevronDown
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AdminHeader from '@/components/admin/admin-header';
import { PreguntaBanco, OpcionPregunta, TipoPregunta } from '@/lib/types/examenes';

export default function AdminExamenesPage() {
  // Filtros
  const [diplomadoSeleccionado, setDiplomadoSeleccionado] = useState('DIP-01');
  const [moduloSeleccionado, setModuloSeleccionado] = useState('Módulo 01');
  const [filtroDificultad, setFiltroDificultad] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Datos
  const [preguntas, setPreguntas] = useState<PreguntaBanco[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Modales
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [preguntaVerJson, setPreguntaVerJson] = useState<PreguntaBanco | null>(null);
  const [jsonCopiado, setJsonCopiado] = useState(false);

  const [showEditModal, setShowEditModal] = useState(false);
  const [preguntaEditando, setPreguntaEditando] = useState<Partial<PreguntaBanco> | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [showImportModal, setShowImportModal] = useState(false);
  const [jsonParaImportar, setJsonParaImportar] = useState('');

  // Lista de diplomados soportados
  const listaDiplomados = [
    { codigo: 'DIP-01', nombre: 'DERECHO MINERO' },
    { codigo: 'DIP-02', nombre: 'COMERCIO INTERNACIONAL' },
    { codigo: 'DIP-03', nombre: 'GEOLOGÍA MINERA' },
    { codigo: 'DIP-04', nombre: 'GEOMECÁNICA SUBTERRÁNEA' },
    { codigo: 'DIP-05', nombre: 'GEOMETALURGIA' },
    { codigo: 'DIP-06', nombre: 'GEOTECNIA MINERA' },
    { codigo: 'DIP-20', nombre: 'SEGURIDAD INDUSTRIAL' }
  ];

  const listaModulos = ['Módulo 01', 'Módulo 02', 'Módulo 03'];

  // Cargar preguntas desde la API
  const cargarPreguntas = async () => {
    setCargando(true);
    setErrorMensaje(null);
    try {
      const params = new URLSearchParams();
      if (diplomadoSeleccionado) params.append('codigoDiplomado', diplomadoSeleccionado);
      if (moduloSeleccionado) params.append('modulo', moduloSeleccionado);
      if (filtroDificultad !== 'TODOS') params.append('dificultad', filtroDificultad);
      if (filtroTipo !== 'TODOS') params.append('tipo', filtroTipo);
      if (busqueda.trim()) params.append('busqueda', busqueda.trim());

      const res = await fetch(`/api/admin/examenes/banco?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPreguntas(data.preguntas || []);
      } else {
        setErrorMensaje(data.error || 'Error al cargar banco');
      }
    } catch (err: any) {
      setErrorMensaje(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPreguntas();
  }, [diplomadoSeleccionado, moduloSeleccionado, filtroDificultad, filtroTipo]);

  // Manejo de búsqueda diferida
  useEffect(() => {
    const handler = setTimeout(() => {
      cargarPreguntas();
    }, 300);
    return () => clearTimeout(handler);
  }, [busqueda]);

  // Alternar estado activo/inactivo
  const alternarEstado = async (p: PreguntaBanco) => {
    try {
      const res = await fetch('/api/admin/examenes/banco', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: p.id,
          activo: !p.activo,
          soloCambioEstado: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setPreguntas(prev => prev.map(item => item.id === p.id ? { ...item, activo: !item.activo } : item));
        mostrarNotificacion(`Pregunta ${!p.activo ? 'activada' : 'pausada'} con éxito`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Eliminar pregunta
  const handleEliminar = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta pregunta del banco?')) return;
    try {
      const res = await fetch(`/api/admin/examenes/banco?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setPreguntas(prev => prev.filter(p => p.id !== id));
        mostrarNotificacion('Pregunta eliminada del banco');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Abrir modal de edición
  const abrirEdicion = (p: PreguntaBanco) => {
    setPreguntaEditando(JSON.parse(JSON.stringify(p)));
    setShowEditModal(true);
  };

  // Abrir modal de nueva pregunta
  const abrirNuevaPregunta = () => {
    const nombreDip = listaDiplomados.find(d => d.codigo === diplomadoSeleccionado)?.nombre || 'DIPLOMADO';
    setPreguntaEditando({
      codigo_diplomado: diplomadoSeleccionado,
      diplomado: nombreDip,
      modulo: moduloSeleccionado,
      dificultad: 'MEDIO',
      tipo: 'multiple_choice',
      pregunta: '',
      hint: '',
      activo: true,
      opciones: [
        { text: '', isCorrect: true, rationale: '' },
        { text: '', isCorrect: false, rationale: '' },
        { text: '', isCorrect: false, rationale: '' },
        { text: '', isCorrect: false, rationale: '' }
      ]
    });
    setShowEditModal(true);
  };

  // Guardar cambios en pregunta
  const guardarEdicion = async () => {
    if (!preguntaEditando || !preguntaEditando.pregunta?.trim()) {
      alert('Debe ingresar el enunciado de la pregunta');
      return;
    }

    const tieneCorrecta = preguntaEditando.opciones?.some(o => o.isCorrect);
    if (!tieneCorrecta) {
      alert('Debe marcar al menos una alternativa como correcta');
      return;
    }

    setGuardando(true);
    try {
      const res = await fetch('/api/admin/examenes/banco', {
        method: preguntaEditando.id ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preguntaEditando)
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setPreguntaEditando(null);
        cargarPreguntas();
        mostrarNotificacion('Pregunta guardada correctamente');
      } else {
        alert(data.error || 'Error al guardar');
      }
    } catch (err: any) {
      alert(err.message || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  // Importar desde JSON pegado
  const procesarImportacionJson = async () => {
    if (!jsonParaImportar.trim()) return;
    try {
      const parsed = JSON.parse(jsonParaImportar);
      const quizList = Array.isArray(parsed) ? parsed : (parsed.quiz || []);
      if (!quizList.length) {
        alert('No se encontraron preguntas en formato quiz en el JSON ingresado');
        return;
      }

      const nombreDip = listaDiplomados.find(d => d.codigo === diplomadoSeleccionado)?.nombre || 'DIPLOMADO';

      const itemsParaGuardar = quizList.map((q: any) => ({
        codigo_diplomado: diplomadoSeleccionado,
        diplomado: nombreDip,
        modulo: moduloSeleccionado,
        dificultad: filtroDificultad !== 'TODOS' ? filtroDificultad : 'MEDIO',
        tipo: q.type === 'multiple_select' ? 'multiple_select' : 'multiple_choice',
        pregunta: (q.question || '').trim(),
        opciones: (q.answerOptions || []).map((opt: any) => ({
          text: opt.text || '',
          isCorrect: Boolean(opt.isCorrect),
          rationale: opt.rationale || ''
        })),
        hint: q.hint || null,
        activo: true
      }));

      const res = await fetch('/api/admin/examenes/banco', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemsParaGuardar)
      });
      const data = await res.json();
      if (data.success) {
        setShowImportModal(false);
        setJsonParaImportar('');
        cargarPreguntas();
        mostrarNotificacion(`Se importaron ${itemsParaGuardar.length} preguntas exitosamente`);
      } else {
        alert(data.error || 'Error al importar');
      }
    } catch (err: any) {
      alert('Error en formato JSON: ' + err.message);
    }
  };

  const mostrarNotificacion = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 3500);
  };

  // Métricas
  const totalActivas = useMemo(() => preguntas.filter(p => p.activo).length, [preguntas]);
  const totalSeleccionUnica = useMemo(() => preguntas.filter(p => p.tipo === 'multiple_choice').length, [preguntas]);
  const totalSeleccionMultiple = useMemo(() => preguntas.filter(p => p.tipo === 'multiple_select').length, [preguntas]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Evaluaciones y Banco de Preguntas" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Notificación de éxito */}
          {mensajeExito && (
            <div className="p-3.5 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-sm flex items-center justify-between animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                <span className="font-semibold">{mensajeExito}</span>
              </div>
              <button onClick={() => setMensajeExito(null)} className="text-emerald-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Banner de Regla de Evaluación y Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                <FileQuestion className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total en Banco</p>
                <p className="text-2xl font-black text-white">{preguntas.length}</p>
                <p className="text-[11px] text-purple-400 font-medium">{totalActivas} activas para sorteo</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <ArrowUpDown className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Regla por Alumno</p>
                <p className="text-xl font-black text-indigo-300">10 preguntas</p>
                <p className="text-[11px] text-slate-400">Sorteadas aleatoriamente</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nota Aprobatoria</p>
                <p className="text-xl font-black text-emerald-400">12.00 / 20</p>
                <p className="text-[11px] text-slate-400">6 aciertos mínimos</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <Layers className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Composición</p>
                <p className="text-sm font-bold text-slate-200">
                  <span className="text-sky-400">{totalSeleccionUnica}</span> única · <span className="text-amber-400">{totalSeleccionMultiple}</span> múltiple
                </p>
                <p className="text-[11px] text-slate-400">Con feedback formativo</p>
              </div>
            </div>
          </div>

          {/* Barra de Filtros y Acciones */}
          <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-sm space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Selector de Diplomado */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Diplomado
                </label>
                <select
                  value={diplomadoSeleccionado}
                  onChange={(e) => setDiplomadoSeleccionado(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {listaDiplomados.map(d => (
                    <option key={d.codigo} value={d.codigo}>
                      {d.codigo} - {d.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector de Módulo */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Módulo
                </label>
                <select
                  value={moduloSeleccionado}
                  onChange={(e) => setModuloSeleccionado(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  {listaModulos.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Filtro Dificultad */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Dificultad
                </label>
                <select
                  value={filtroDificultad}
                  onChange={(e) => setFiltroDificultad(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="TODOS">Todas las dificultades</option>
                  <option value="MEDIO">Nivel Medio</option>
                  <option value="ALTO">Nivel Alto</option>
                  <option value="FACIL">Nivel Fácil</option>
                </select>
              </div>

              {/* Filtro Tipo */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">
                  Tipo de Pregunta
                </label>
                <select
                  value={filtroTipo}
                  onChange={(e) => setFiltroTipo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer"
                >
                  <option value="TODOS">Todos los tipos</option>
                  <option value="multiple_choice">Opción única (1 respuesta)</option>
                  <option value="multiple_select">Selección múltiple (varias)</option>
                </select>
              </div>
            </div>

            {/* Buscador y Botones de Creación */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800/60">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Buscar texto en preguntas..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowImportModal(true)}
                  className="px-3.5 py-2 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer"
                  title="Importar preguntas desde formato JSON"
                >
                  <Code className="w-3.5 h-3.5 text-purple-400" />
                  <span>Importar JSON</span>
                </button>

                <button
                  type="button"
                  onClick={abrirNuevaPregunta}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/30 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Pregunta</span>
                </button>
              </div>
            </div>
          </div>

          {/* Listado de Preguntas */}
          <div className="space-y-3">
            {cargando ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RotateCcw className="w-6 h-6 animate-spin mx-auto text-purple-400" />
                <p className="text-xs">Cargando preguntas del módulo...</p>
              </div>
            ) : preguntas.length === 0 ? (
              <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800/80 text-slate-400 space-y-3">
                <FileQuestion className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold">No se encontraron preguntas para este módulo o filtro</p>
                <p className="text-xs text-slate-500">Puedes añadir preguntas manualmente o importar tus archivos JSON.</p>
                <button
                  onClick={abrirNuevaPregunta}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> Crear primera pregunta
                </button>
              </div>
            ) : (
              preguntas.map((p, idx) => {
                const esMultiple = p.tipo === 'multiple_select';
                return (
                  <div 
                    key={p.id}
                    className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                      p.activo 
                        ? 'bg-slate-900/80 border-slate-800/80 hover:border-slate-700' 
                        : 'bg-slate-950/60 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2.5 flex-1 min-w-0">
                        {/* Badges de Metadatos */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                          <span className="px-2.5 py-0.5 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
                            #{idx + 1}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg border ${
                            esMultiple 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' 
                              : 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                          }`}>
                            {esMultiple ? 'Selección Múltiple' : 'Opción Única'}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-lg border ${
                            p.dificultad === 'ALTO'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                              : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                          }`}>
                            Nivel {p.dificultad}
                          </span>
                          {!p.activo && (
                            <span className="px-2 py-0.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 text-[10px]">
                              PAUSADA
                            </span>
                          )}
                        </div>

                        {/* Enunciado */}
                        <h3 className="text-sm font-semibold text-white leading-relaxed">
                          {p.pregunta}
                        </h3>

                        {/* Alternativas compactas */}
                        <div className="space-y-1.5 pt-1">
                          {p.opciones.map((opt, oIdx) => (
                            <div 
                              key={oIdx}
                              className={`text-xs p-2 rounded-xl flex items-start gap-2.5 border ${
                                opt.isCorrect
                                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
                                  : 'bg-slate-950/40 border-slate-800/60 text-slate-300'
                              }`}
                            >
                              <div className="pt-0.5 shrink-0">
                                {opt.isCorrect ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <div className="w-3.5 h-3.5 rounded-full border border-slate-600" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className={opt.isCorrect ? 'font-semibold text-emerald-100' : ''}>
                                  {opt.text}
                                </span>
                                {opt.rationale && (
                                  <p className="text-[11px] text-slate-400 mt-0.5 italic">
                                    💡 <strong className="text-slate-300">Feedback:</strong> {opt.rationale}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Pista si existe */}
                        {p.hint && (
                          <div className="text-[11px] text-purple-300/80 bg-purple-950/20 border border-purple-900/30 px-3 py-1.5 rounded-xl flex items-center gap-2">
                            <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span><strong>Pista:</strong> {p.hint}</span>
                          </div>
                        )}
                      </div>

                      {/* Botones de Acción */}
                      <div className="flex flex-col sm:flex-row items-center gap-1.5 shrink-0">
                        {/* Botón Ver JSON */}
                        <button
                          type="button"
                          onClick={() => {
                            setPreguntaVerJson(p);
                            setShowJsonModal(true);
                            setJsonCopiado(false);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-white bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                          title="Ver JSON de esta pregunta"
                        >
                          <Code className="w-4 h-4" />
                        </button>

                        {/* Botón Editar */}
                        <button
                          type="button"
                          onClick={() => abrirEdicion(p)}
                          className="p-2 rounded-xl text-slate-400 hover:text-purple-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                          title="Editar pregunta"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {/* Botón Activar / Pausar */}
                        <button
                          type="button"
                          onClick={() => alternarEstado(p)}
                          className={`p-2 rounded-xl border transition-colors ${
                            p.activo 
                              ? 'text-emerald-400 hover:text-emerald-300 bg-emerald-950/30 border-emerald-900/50' 
                              : 'text-slate-500 hover:text-slate-300 bg-slate-800/50 border-slate-700/60'
                          }`}
                          title={p.activo ? 'Pausar pregunta' : 'Activar pregunta'}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          type="button"
                          onClick={() => handleEliminar(p.id)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-400 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/60 transition-colors"
                          title="Eliminar pregunta"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </main>
      </div>

      {/* MODAL: Ver JSON de la Pregunta */}
      {showJsonModal && preguntaVerJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Visualizador JSON de la Pregunta</h3>
              </div>
              <button 
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-950">
              <pre className="text-xs text-emerald-400 font-mono whitespace-pre-wrap break-words leading-relaxed select-all">
                {JSON.stringify({
                  type: preguntaVerJson.tipo,
                  question: preguntaVerJson.pregunta,
                  answerOptions: preguntaVerJson.opciones,
                  hint: preguntaVerJson.hint
                }, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Formato compatible con los archivos de examen del diplomado
              </span>
              <button
                type="button"
                onClick={() => {
                  const payload = JSON.stringify({
                    type: preguntaVerJson.tipo,
                    question: preguntaVerJson.pregunta,
                    answerOptions: preguntaVerJson.opciones,
                    hint: preguntaVerJson.hint
                  }, null, 2);
                  navigator.clipboard.writeText(payload);
                  setJsonCopiado(true);
                  setTimeout(() => setJsonCopiado(false), 2000);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all"
              >
                {jsonCopiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{jsonCopiado ? '¡Copiado!' : 'Copiar JSON'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Crear / Editar Pregunta */}
      {showEditModal && preguntaEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">
                  {preguntaEditando.id ? 'Editar Pregunta del Banco' : 'Nueva Pregunta para el Banco'}
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Asignación y Metadatos */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Módulo</label>
                  <select
                    value={preguntaEditando.modulo || moduloSeleccionado}
                    onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, modulo: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    {listaModulos.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Tipo de Pregunta</label>
                  <select
                    value={preguntaEditando.tipo || 'multiple_choice'}
                    onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, tipo: e.target.value as TipoPregunta }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="multiple_choice">Opción Única (1 correcta)</option>
                    <option value="multiple_select">Selección Múltiple (varias correctas)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1">Dificultad</label>
                  <select
                    value={preguntaEditando.dificultad || 'MEDIO'}
                    onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, dificultad: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none"
                  >
                    <option value="MEDIO">Nivel Medio</option>
                    <option value="ALTO">Nivel Alto</option>
                    <option value="FACIL">Nivel Fácil</option>
                  </select>
                </div>
              </div>

              {/* Enunciado */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">Enunciado de la Pregunta</label>
                <textarea
                  rows={3}
                  value={preguntaEditando.pregunta || ''}
                  onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, pregunta: e.target.value }))}
                  placeholder="Escriba la pregunta completa aquí..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Alternativas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Alternativas de Respuesta y Retroalimentación
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const opts = [...(preguntaEditando.opciones || [])];
                      opts.push({ text: '', isCorrect: false, rationale: '' });
                      setPreguntaEditando(prev => ({ ...prev!, opciones: opts }));
                    }}
                    className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar alternativa
                  </button>
                </div>

                {(preguntaEditando.opciones || []).map((opt, oIdx) => (
                  <div key={oIdx} className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const opts = [...(preguntaEditando.opciones || [])];
                          if (preguntaEditando.tipo === 'multiple_choice') {
                            opts.forEach((o, i) => o.isCorrect = (i === oIdx));
                          } else {
                            opts[oIdx].isCorrect = !opts[oIdx].isCorrect;
                          }
                          setPreguntaEditando(prev => ({ ...prev!, opciones: opts }));
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border flex items-center gap-1.5 cursor-pointer transition-all ${
                          opt.isCorrect 
                            ? 'bg-emerald-600 text-white border-emerald-500' 
                            : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{opt.isCorrect ? 'Correcta' : 'Marcar correcta'}</span>
                      </button>

                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => {
                          const opts = [...(preguntaEditando.opciones || [])];
                          opts[oIdx].text = e.target.value;
                          setPreguntaEditando(prev => ({ ...prev!, opciones: opts }));
                        }}
                        placeholder={`Alternativa ${oIdx + 1}...`}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />

                      {(preguntaEditando.opciones || []).length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const opts = (preguntaEditando.opciones || []).filter((_, i) => i !== oIdx);
                            setPreguntaEditando(prev => ({ ...prev!, opciones: opts }));
                          }}
                          className="p-1.5 text-slate-500 hover:text-rose-400 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={opt.rationale || ''}
                      onChange={(e) => {
                        const opts = [...(preguntaEditando.opciones || [])];
                        opts[oIdx].rationale = e.target.value;
                        setPreguntaEditando(prev => ({ ...prev!, opciones: opts }));
                      }}
                      placeholder="Retroalimentación (rationale): justificación de por qué es correcta o falsa..."
                      className="w-full bg-slate-900/60 border border-slate-800/80 rounded-lg px-3 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none"
                    />
                  </div>
                ))}
              </div>

              {/* Pista (Hint) */}
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1">
                  Pista de apoyo (Hint opcional)
                </label>
                <input
                  type="text"
                  value={preguntaEditando.hint || ''}
                  onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, hint: e.target.value }))}
                  placeholder="Ej: Considere el artículo 23 de la Ley General de Minería..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarEdicion}
                disabled={guardando}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer transition-all disabled:opacity-50"
              >
                {guardando ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>{guardando ? 'Guardando...' : 'Guardar Pregunta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Importar JSON masivo */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Importar Preguntas desde JSON</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
              <p className="text-xs text-slate-300">
                Pega el contenido JSON del examen (con clave <code className="text-purple-300">quiz</code> o lista de preguntas). 
                Se asignará automáticamente al diplomado <strong>{diplomadoSeleccionado}</strong> y al <strong>{moduloSeleccionado}</strong>.
              </p>
              <textarea
                rows={12}
                value={jsonParaImportar}
                onChange={(e) => setJsonParaImportar(e.target.value)}
                placeholder='{\n  "quiz": [\n    {\n      "type": "multiple_choice",\n      "question": "¿...?",\n      "answerOptions": [\n        { "text": "...", "isCorrect": true, "rationale": "..." }\n      ]\n    }\n  ]\n}'
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 cursor-pointer transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={procesarImportacionJson}
                disabled={!jsonParaImportar.trim()}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer transition-all disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>Procesar e Importar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
