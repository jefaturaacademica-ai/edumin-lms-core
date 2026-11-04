'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sliders, Search, Filter, CheckCircle2, AlertCircle, Edit3, 
  RotateCcw, Sparkles, Check, X, Clock, Award, HelpCircle, 
  GraduationCap, BookOpen, Layers, CheckSquare, XCircle,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ShieldCheck, RefreshCw, Info, Save
} from 'lucide-react';
import type { ConfiguracionExamenItem } from '@/lib/types/examenes';

interface ConfiguracionExamenesTabProps {
  onNotificacion?: (msg: string) => void;
}

interface DisponibilidadBanco {
  facil: number;
  medio: number;
  dificil: number;
  opcion_unica: number;
  opcion_multiple: number;
  total: number;
}

export default function ConfiguracionExamenesTab({ onNotificacion }: ConfiguracionExamenesTabProps) {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionExamenItem[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);

  // Filtros
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'diplomado' | 'curso' | 'taller'>('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'aplica' | 'no_aplica'>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Paginación
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(15);

  // Modal de edición
  const [showModal, setShowModal] = useState(false);
  const [configEditando, setConfigEditando] = useState<ConfiguracionExamenItem | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [toggleCargandoId, setToggleCargandoId] = useState<string | null>(null);

  // Disponibilidad de preguntas en el banco para el modal activo
  const [disponibilidadBanco, setDisponibilidadBanco] = useState<DisponibilidadBanco | null>(null);
  const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);

  // Cargar configuraciones desde el API
  const cargarConfiguraciones = async () => {
    setCargando(true);
    setErrorMensaje(null);
    try {
      const res = await fetch('/api/admin/examenes/configuracion');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setConfiguraciones(data.data);
      } else {
        setErrorMensaje(data.error || 'Error al cargar configuraciones');
      }
    } catch (err: any) {
      setErrorMensaje(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  // Filtrado reactivo en memoria
  const configsFiltradas = useMemo(() => {
    return configuraciones.filter(item => {
      // Tipo
      if (filtroTipo !== 'todos' && item.tipo_programa.toLowerCase() !== filtroTipo.toLowerCase()) {
        return false;
      }
      // Estado
      if (filtroEstado === 'aplica' && !item.aplica_examen) return false;
      if (filtroEstado === 'no_aplica' && item.aplica_examen) return false;

      // Búsqueda
      if (busqueda.trim()) {
        const term = busqueda.toLowerCase().trim();
        const coincideCod = item.codigo_programa.toLowerCase().includes(term);
        const coincideNom = item.nombre_programa.toLowerCase().includes(term);
        const coincideMod = item.modulo.toLowerCase().includes(term);
        if (!coincideCod && !coincideNom && !coincideMod) return false;
      }
      return true;
    });
  }, [configuraciones, filtroTipo, filtroEstado, busqueda]);

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(configsFiltradas.length / porPagina));
  const configsPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * porPagina;
    return configsFiltradas.slice(inicio, inicio + porPagina);
  }, [configsFiltradas, paginaActual, porPagina]);

  // Métricas
  const totalEvaluaciones = configuraciones.length;
  const totalConExamen = configuraciones.filter(c => c.aplica_examen).length;
  const totalSinExamen = configuraciones.filter(c => !c.aplica_examen).length;
  const promedioMinutos = useMemo(() => {
    const conExamen = configuraciones.filter(c => c.aplica_examen);
    if (conExamen.length === 0) return 30;
    const suma = conExamen.reduce((acc, c) => acc + (c.tiempo_minutos || 30), 0);
    return Math.round(suma / conExamen.length);
  }, [configuraciones]);

  // Alternar rápidamente "Aplica examen" en una fila
  const alternarAplicaExamen = async (item: ConfiguracionExamenItem) => {
    const nuevoEstado = !item.aplica_examen;
    setToggleCargandoId(item.id);
    try {
      const itemActualizado: ConfiguracionExamenItem = {
        ...item,
        aplica_examen: nuevoEstado
      };

      const res = await fetch('/api/admin/examenes/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(itemActualizado)
      });
      const data = await res.json();
      if (data.success) {
        setConfiguraciones(prev => prev.map(c => c.id === item.id ? itemActualizado : c));
        if (onNotificacion) {
          onNotificacion(`Examen ${nuevoEstado ? 'activado' : 'desactivado'} para ${item.codigo_programa} (${item.modulo})`);
        }
      } else {
        alert(data.error || 'No se pudo actualizar el estado');
      }
    } catch (err: any) {
      alert('Error de conexión: ' + err.message);
    } finally {
      setToggleCargandoId(null);
    }
  };

  // Abrir modal de edición y consultar banco de preguntas disponible
  const abrirEditar = async (item: ConfiguracionExamenItem) => {
    setConfigEditando(JSON.parse(JSON.stringify(item)));
    setShowModal(true);
    setDisponibilidadBanco(null);
    setCargandoDisponibilidad(true);

    try {
      const res = await fetch(`/api/admin/examenes/configuracion?accion=disponibilidad_banco&codigo_programa=${encodeURIComponent(item.codigo_programa)}&modulo=${encodeURIComponent(item.modulo)}`);
      const data = await res.json();
      if (data.success && data.disponibilidad) {
        setDisponibilidadBanco(data.disponibilidad);
      }
    } catch (e) {
      console.warn('No se pudo consultar disponibilidad del banco:', e);
    } finally {
      setCargandoDisponibilidad(false);
    }
  };

  // Guardar modal de edición
  const guardarModalEdicion = async () => {
    if (!configEditando) return;

    if (configEditando.aplica_examen) {
      // 1. Debe contar con preguntas en el banco para habilitar examen
      if (disponibilidadBanco && disponibilidadBanco.total === 0) {
        alert('No se puede activar el examen para este contenido porque no tiene preguntas registradas en el banco de preguntas.');
        return;
      }

      // 2. La suma de preguntas por nivel debe ser exactamente igual al total configurado
      if (sumaDificultades !== configEditando.cantidad_preguntas) {
        alert(`La suma de preguntas por nivel (${sumaDificultades}) debe ser exactamente igual a la cantidad total de preguntas (${configEditando.cantidad_preguntas}). Haz clic en "Auto-balancear" o ajusta los valores.`);
        return;
      }

      // 3. Validación de niveles sin banco
      if (disponibilidadBanco) {
        if (disponibilidadBanco.dificil === 0 && configEditando.preguntas_dificil > 0) {
          alert('No se pueden asignar preguntas difíciles porque este programa no tiene preguntas difíciles en el banco (disponibles: 0).');
          return;
        }
        if (disponibilidadBanco.facil === 0 && configEditando.preguntas_facil > 0) {
          alert('No se pueden asignar preguntas fáciles porque este programa no tiene preguntas fáciles en el banco (disponibles: 0).');
          return;
        }
        if (disponibilidadBanco.medio === 0 && configEditando.preguntas_medio > 0) {
          alert('No se pueden asignar preguntas medias porque este programa no tiene preguntas medias en el banco (disponibles: 0).');
          return;
        }

        // 4. Validación de suma por tipo de pregunta
        if (sumaTipos !== configEditando.cantidad_preguntas) {
          alert(`La suma de preguntas por tipo (${sumaTipos}) debe ser exactamente igual a la cantidad total de preguntas (${configEditando.cantidad_preguntas}).`);
          return;
        }

        if ((configEditando.preguntas_opcion_unica ?? 0) > disponibilidadBanco.opcion_unica) {
          alert(`No puedes asignar ${configEditando.preguntas_opcion_unica} preguntas de opción única porque solo hay ${disponibilidadBanco.opcion_unica} disponibles en el banco.`);
          return;
        }

        if ((configEditando.preguntas_opcion_multiple ?? 0) > disponibilidadBanco.opcion_multiple) {
          alert(`No puedes asignar ${configEditando.preguntas_opcion_multiple} preguntas de selección múltiple porque solo hay ${disponibilidadBanco.opcion_multiple} disponibles en el banco.`);
          return;
        }
      }
    }

    setGuardando(true);
    try {
      const res = await fetch('/api/admin/examenes/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configEditando)
      });
      const data = await res.json();
      if (data.success && data.data) {
        setConfiguraciones(prev => prev.map(c => c.id === data.data.id ? data.data : c));
        setShowModal(false);
        setConfigEditando(null);
        if (onNotificacion) {
          onNotificacion(`Configuración guardada para ${data.data.codigo_programa} (${data.data.modulo})`);
        }
      } else {
        alert(data.error || 'Error al guardar configuración');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Restablecer a valores por defecto
  const restablecerPredeterminado = () => {
    if (!configEditando) return;
    const esTaller = configEditando.tipo_programa === 'taller';
    const esCurso = configEditando.tipo_programa === 'curso';

    setConfigEditando({
      ...configEditando,
      aplica_examen: !esTaller,
      tiempo_minutos: 30,
      cantidad_preguntas: 10,
      preguntas_facil: esCurso ? 7 : 0,
      preguntas_medio: esCurso ? 3 : 7,
      preguntas_dificil: esCurso ? 0 : 3,
      nota_minima: 12,
      intentos_permitidos: 1 // Global: 1 intento
    });
  };

  // Auto-balancear dificultad considerando las preguntas reales disponibles en el banco
  const autoBalancearDificultad = () => {
    if (!configEditando) return;
    const total = configEditando.cantidad_preguntas || 10;
    const esCurso = configEditando.tipo_programa === 'curso';
    const hayDificiles = (disponibilidadBanco?.dificil ?? (esCurso ? 0 : 3)) > 0;

    if (!hayDificiles || esCurso) {
      // Cursos y programas sin preguntas difíciles: 7 fáciles y 3 medio (o proporcional 70% / 30%)
      const facil = total === 10 ? 7 : Math.round(total * 0.7);
      const medio = total - facil;
      setConfigEditando({
        ...configEditando,
        preguntas_facil: facil,
        preguntas_medio: medio,
        preguntas_dificil: 0
      });
    } else {
      // Diplomados: 0 fácil, 7 medio, 3 difícil (o proporcional)
      const alto = total === 10 ? 3 : Math.max(1, Math.min(disponibilidadBanco?.dificil || 3, Math.round(total * 0.3)));
      const medio = total - alto;
      setConfigEditando({
        ...configEditando,
        preguntas_facil: 0,
        preguntas_medio: medio,
        preguntas_dificil: alto
      });
    }
  };

  const sumaDificultades = useMemo(() => {
    if (!configEditando) return 0;
    return (Number(configEditando.preguntas_facil) || 0) + 
           (Number(configEditando.preguntas_medio) || 0) + 
           (Number(configEditando.preguntas_dificil) || 0);
  }, [configEditando?.preguntas_facil, configEditando?.preguntas_medio, configEditando?.preguntas_dificil]);

  const sumaTipos = useMemo(() => {
    if (!configEditando) return 0;
    return (Number(configEditando.preguntas_opcion_unica) || 0) + 
           (Number(configEditando.preguntas_opcion_multiple) || 0);
  }, [configEditando?.preguntas_opcion_unica, configEditando?.preguntas_opcion_multiple]);

  const nivelesSinBanco = useMemo(() => {
    if (!disponibilidadBanco) return [];
    const res: string[] = [];
    if (disponibilidadBanco.facil === 0) res.push('fácil');
    if (disponibilidadBanco.medio === 0) res.push('medio');
    if (disponibilidadBanco.dificil === 0) res.push('difícil');
    return res;
  }, [disponibilidadBanco]);

  const esCursoSinDificiles = useMemo(() => {
    if (!configEditando) return false;
    return (disponibilidadBanco?.dificil === 0) || (configEditando.tipo_programa === 'curso' && (!disponibilidadBanco || disponibilidadBanco.dificil === 0));
  }, [configEditando, disponibilidadBanco]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* 1. Tarjetas de métricas superiores */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Total evaluaciones */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total evaluaciones
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {totalEvaluaciones}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Diplomados, cursos y talleres</p>
          </div>
          <div className="size-11 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800/40 text-indigo-600 dark:text-indigo-400 grid place-items-center">
            <Layers className="size-5" />
          </div>
        </div>

        {/* Aplica examen */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              Aplica examen
            </p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
              {totalConExamen}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Evaluación requerida</p>
          </div>
          <div className="size-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 text-emerald-600 dark:text-emerald-400 grid place-items-center">
            <CheckCircle2 className="size-5" />
          </div>
        </div>

        {/* No aplica examen */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
              No aplica examen
            </p>
            <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {totalSinExamen}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Exentos (ej: talleres)</p>
          </div>
          <div className="size-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800/40 text-amber-600 dark:text-amber-400 grid place-items-center">
            <XCircle className="size-5" />
          </div>
        </div>

        {/* Tiempo promedio */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
              Tiempo promedio
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {promedioMinutos} min
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">Temporizador oficial</p>
          </div>
          <div className="size-11 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/40 text-purple-600 dark:text-purple-400 grid place-items-center">
            <Clock className="size-5" />
          </div>
        </div>
      </div>

      {/* 2. Barra de filtros, búsqueda y acciones */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Filtro por tipo de programa */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setFiltroTipo('todos'); setPaginaActual(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtroTipo === 'todos' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos ({configuraciones.length})
            </button>
            <button
              type="button"
              onClick={() => { setFiltroTipo('diplomado'); setPaginaActual(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtroTipo === 'diplomado' 
                  ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Diplomados ({configuraciones.filter(c => c.tipo_programa === 'diplomado').length})
            </button>
            <button
              type="button"
              onClick={() => { setFiltroTipo('curso'); setPaginaActual(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtroTipo === 'curso' 
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Cursos ({configuraciones.filter(c => c.tipo_programa === 'curso').length})
            </button>
            <button
              type="button"
              onClick={() => { setFiltroTipo('taller'); setPaginaActual(1); }}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                filtroTipo === 'taller' 
                  ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-sm' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Talleres ({configuraciones.filter(c => c.tipo_programa === 'taller').length})
            </button>
          </div>

          {/* Filtro por estado de examen */}
          <select
            value={filtroEstado}
            onChange={(e) => { setFiltroEstado(e.target.value as any); setPaginaActual(1); }}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="todos">Estado: todos</option>
            <option value="aplica">Solo aplica examen</option>
            <option value="no_aplica">Solo no aplica examen</option>
          </select>
        </div>

        {/* Buscador y refrescar */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código, título o módulo..."
              value={busqueda}
              onChange={(e) => { setBusqueda(e.target.value); setPaginaActual(1); }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {busqueda && (
              <button
                type="button"
                onClick={() => setBusqueda('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={cargarConfiguraciones}
            title="Recargar configuraciones"
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`size-4 ${cargando ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Tabla de evaluaciones */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="py-20 text-center space-y-3">
            <RotateCcw className="size-8 mx-auto text-indigo-600 dark:text-indigo-400 animate-spin" />
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
              Cargando catálogo de configuraciones de examen...
            </p>
          </div>
        ) : configsFiltradas.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <AlertCircle className="size-8 mx-auto text-slate-400" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No se encontraron evaluaciones con los filtros actuales
            </p>
            <p className="text-xs text-slate-400">
              Intenta cambiar los términos de búsqueda o limpiar los filtros seleccionados.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Programa</th>
                  <th className="py-3.5 px-4">Módulo / evaluación</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">¿Aplica examen?</th>
                  <th className="py-3.5 px-4 text-center">Tiempo</th>
                  <th className="py-3.5 px-4 text-center">Preguntas</th>
                  <th className="py-3.5 px-4 text-center">Dificultad (F/M/D)</th>
                  <th className="py-3.5 px-4 text-center">Nota mínima</th>
                  <th className="py-3.5 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {configsPaginadas.map((item) => {
                  const esTaller = item.tipo_programa === 'taller';
                  const esCurso = item.tipo_programa === 'curso';
                  const toggleCargando = toggleCargandoId === item.id;

                  return (
                    <tr 
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Programa */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 ${
                            esTaller 
                              ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800/40' 
                              : esCurso 
                                ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800/40'
                                : 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800/40'
                          }`}>
                            {item.codigo_programa}
                          </span>
                          <span className="truncate font-bold text-slate-800 dark:text-slate-100" title={item.nombre_programa}>
                            {item.nombre_programa}
                          </span>
                        </div>
                      </td>

                      {/* Módulo */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-[11px]">
                          <BookOpen className="size-3 text-slate-400" />
                          {item.modulo}
                        </span>
                      </td>

                      {/* ¿Aplica examen? Botón en una sola fila */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => alternarAplicaExamen(item)}
                          disabled={toggleCargando}
                          className={`whitespace-nowrap inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm ${
                            item.aplica_examen 
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700 hover:bg-slate-200'
                          }`}
                          title={item.aplica_examen ? 'Clic para deshabilitar examen' : 'Clic para habilitar examen'}
                        >
                          {toggleCargando ? (
                            <RotateCcw className="size-3.5 animate-spin shrink-0" />
                          ) : item.aplica_examen ? (
                            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          ) : (
                            <XCircle className="size-3.5 text-slate-400 shrink-0" />
                          )}
                          <span className="whitespace-nowrap">{item.aplica_examen ? 'Aplica examen' : 'No aplica'}</span>
                        </button>
                      </td>

                      {/* Tiempo */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.aplica_examen ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 font-bold">
                            <Clock className="size-3 text-purple-500" />
                            {item.tiempo_minutos} min
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Preguntas */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.aplica_examen ? (
                          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-200 font-bold">
                            <HelpCircle className="size-3 text-indigo-500" />
                            {item.cantidad_preguntas} preg.
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Dificultad (F/M/D) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.aplica_examen ? (
                          <div className="inline-flex items-center gap-1 text-[10px] font-bold">
                            <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300" title="Fácil">
                              F: {item.preguntas_facil || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300" title="Medio">
                              M: {item.preguntas_medio || 7}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300" title="Difícil">
                              D: {item.preguntas_dificil || 0}
                            </span>
                            <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300" title="Tipos: Opción única y Selección múltiple">
                              Ú:{item.preguntas_opcion_unica ?? 7} M:{item.preguntas_opcion_multiple ?? 3}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Nota mínima */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {item.aplica_examen ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <Award className="size-3" />
                            {item.nota_minima} / 20
                          </span>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => abrirEditar(item)}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-950/50 dark:hover:text-indigo-400 text-slate-700 dark:text-slate-300 font-bold text-xs inline-flex items-center gap-1.5 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                        >
                          <Edit3 className="size-3.5" />
                          <span>Editar</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 4. Barra de paginación */}
        {!cargando && configsFiltradas.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
            <div>
              Mostrando <strong className="text-slate-800 dark:text-slate-200">{(paginaActual - 1) * porPagina + 1}</strong> a <strong className="text-slate-800 dark:text-slate-200">{Math.min(paginaActual * porPagina, configsFiltradas.length)}</strong> de <strong className="text-slate-800 dark:text-slate-200">{configsFiltradas.length}</strong> evaluaciones
            </div>

            <div className="flex items-center gap-2">
              <select
                value={porPagina}
                onChange={(e) => { setPorPagina(Number(e.target.value)); setPaginaActual(1); }}
                className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
              >
                <option value={10}>10 por página</option>
                <option value={15}>15 por página</option>
                <option value={25}>25 por página</option>
                <option value={50}>50 por página</option>
              </select>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPaginaActual(1)}
                  disabled={paginaActual === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronsLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                  disabled={paginaActual === 1}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <span className="px-3 py-1 font-bold text-slate-700 dark:text-slate-200">
                  {paginaActual} / {totalPaginas}
                </span>
                <button
                  type="button"
                  onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                  disabled={paginaActual === totalPaginas}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronRight className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPaginaActual(totalPaginas)}
                  disabled={paginaActual === totalPaginas}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer disabled:cursor-not-allowed"
                >
                  <ChevronsRight className="size-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Modal de edición de configuración de examen (sin sliders, con alertas de disponibilidad en banco) */}
      {showModal && configEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scaleUp">
            {/* Cabecera del modal */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                    {configEditando.codigo_programa}
                  </span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    {configEditando.modulo}
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Configurar evaluación: {configEditando.nombre_programa}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Cuerpo del modal */}
            <div className="p-6 space-y-6">
              {/* Aviso si no hay preguntas en el banco para este programa */}
              {disponibilidadBanco && disponibilidadBanco.total === 0 && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  <AlertCircle className="size-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>Este contenido no tiene preguntas registradas en el banco de preguntas. No se puede activar el examen hasta cargar preguntas en el banco.</span>
                </div>
              )}

              {/* Toggle principal: ¿Aplica examen? */}
              <div className={`p-4 rounded-xl border transition-all ${
                configEditando.aplica_examen 
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <label className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className={`size-4 ${configEditando.aplica_examen ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                      ¿Aplica examen para este contenido?
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {configEditando.aplica_examen 
                        ? 'El estudiante debe rendir y aprobar el examen para obtener su nota y certificación.'
                        : 'No requiere examen. El estudiante se certificará directamente al completar el 100% de las clases.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!configEditando.aplica_examen && disponibilidadBanco && disponibilidadBanco.total === 0) {
                        alert('No se puede activar el examen porque este contenido no tiene preguntas registradas en el banco de preguntas.');
                        return;
                      }
                      setConfigEditando({
                        ...configEditando,
                        aplica_examen: !configEditando.aplica_examen
                      });
                    }}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      configEditando.aplica_examen ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                        configEditando.aplica_examen ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Parámetros de examen (solo si aplica examen) */}
              {configEditando.aplica_examen ? (
                <div className="space-y-5">
                  {/* Tiempo límite en minutos (sin slider, con presets) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Clock className="size-3.5 text-purple-600 dark:text-purple-400" />
                        Tiempo límite para rendir examen (minutos):
                      </label>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300">
                        {configEditando.tiempo_minutos} minutos
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={5}
                        max={180}
                        value={configEditando.tiempo_minutos}
                        onChange={(e) => setConfigEditando({
                          ...configEditando,
                          tiempo_minutos: Math.max(1, Number(e.target.value))
                        })}
                        className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />

                      {/* Botones sugeridos */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium mr-1">Sugeridos:</span>
                        {[15, 20, 30, 45, 60].map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setConfigEditando({ ...configEditando, tiempo_minutos: t })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                              configEditando.tiempo_minutos === t
                                ? 'bg-purple-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {t} min
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Cantidad total de preguntas (sin slider, con presets) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <HelpCircle className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                        Cantidad total de preguntas por examen:
                      </label>
                      <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-indigo-100 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300">
                        {configEditando.cantidad_preguntas} preguntas
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={configEditando.cantidad_preguntas}
                        onChange={(e) => setConfigEditando({
                          ...configEditando,
                          cantidad_preguntas: Math.max(1, Number(e.target.value))
                        })}
                        className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />

                      {/* Botones sugeridos */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-slate-400 font-medium mr-1">Sugeridos:</span>
                        {[5, 10, 15, 20].map((q) => (
                          <button
                            key={q}
                            type="button"
                            onClick={() => setConfigEditando({ ...configEditando, cantidad_preguntas: q })}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold cursor-pointer transition ${
                              configEditando.cantidad_preguntas === q
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {q} preg.
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Distribución por nivel de dificultad con disponibilidad del banco */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Sliders className="size-3.5 text-blue-500" />
                          Distribución de preguntas por nivel de dificultad:
                        </label>
                        <p className="text-[11px] text-slate-400">
                          Suma actual: <strong>{sumaDificultades}</strong> de <strong>{configEditando.cantidad_preguntas}</strong>
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={autoBalancearDificultad}
                        className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 text-[11px] font-bold hover:bg-blue-100 transition cursor-pointer"
                      >
                        Auto-balancear
                      </button>
                    </div>

                    {/* Aviso compacto si algún nivel no tiene preguntas en el banco */}
                    {nivelesSinBanco.length > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-medium">
                        <AlertCircle className="size-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                        <span>Sin preguntas en el banco: <strong>{nivelesSinBanco.join(', ')}</strong> (0 disponibles). Esos niveles no se pueden asignar.</span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                      {/* Fácil */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            Fácil:
                          </label>
                          {disponibilidadBanco && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              disp: {disponibilidadBanco.facil}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={disponibilidadBanco ? disponibilidadBanco.facil : configEditando.cantidad_preguntas}
                          disabled={disponibilidadBanco?.facil === 0}
                          value={disponibilidadBanco?.facil === 0 ? 0 : configEditando.preguntas_facil}
                          onChange={(e) => setConfigEditando({
                            ...configEditando,
                            preguntas_facil: Math.max(0, Number(e.target.value))
                          })}
                          className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 ${
                            disponibilidadBanco?.facil === 0
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-emerald-500'
                          }`}
                        />
                      </div>

                      {/* Medio */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-blue-600 dark:text-blue-400">
                            Medio:
                          </label>
                          {disponibilidadBanco && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              disp: {disponibilidadBanco.medio}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={disponibilidadBanco ? disponibilidadBanco.medio : configEditando.cantidad_preguntas}
                          disabled={disponibilidadBanco?.medio === 0}
                          value={disponibilidadBanco?.medio === 0 ? 0 : configEditando.preguntas_medio}
                          onChange={(e) => setConfigEditando({
                            ...configEditando,
                            preguntas_medio: Math.max(0, Number(e.target.value))
                          })}
                          className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 ${
                            disponibilidadBanco?.medio === 0
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-blue-500'
                          }`}
                        />
                      </div>

                      {/* Difícil / Alto */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-rose-600 dark:text-rose-400">
                            Difícil:
                          </label>
                          {disponibilidadBanco && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              disp: {disponibilidadBanco.dificil}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={disponibilidadBanco ? disponibilidadBanco.dificil : configEditando.cantidad_preguntas}
                          disabled={disponibilidadBanco?.dificil === 0 || esCursoSinDificiles}
                          value={disponibilidadBanco?.dificil === 0 || esCursoSinDificiles ? 0 : configEditando.preguntas_dificil}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            if (disponibilidadBanco && disponibilidadBanco.dificil === 0 && val > 0) {
                              alert('No hay preguntas difíciles disponibles en el banco para este programa.');
                              return;
                            }
                            setConfigEditando({
                              ...configEditando,
                              preguntas_dificil: val
                            });
                          }}
                          className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 ${
                            disponibilidadBanco?.dificil === 0 || esCursoSinDificiles
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-rose-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Verificador estricto de balance */}
                    {sumaDificultades !== configEditando.cantidad_preguntas ? (
                      <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="size-4 shrink-0" />
                          <span>
                            La suma de preguntas ({sumaDificultades}) debe ser igual al total ({configEditando.cantidad_preguntas}). {configEditando.cantidad_preguntas - sumaDificultades > 0 ? `Faltan asignar ${configEditando.cantidad_preguntas - sumaDificultades} pregunta(s).` : `Hay un exceso de ${sumaDificultades - configEditando.cantidad_preguntas} pregunta(s).`}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={autoBalancearDificultad}
                          className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold shrink-0 hover:bg-rose-500 cursor-pointer"
                        >
                          Corregir
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                        <CheckCircle2 className="size-4 shrink-0" />
                        <span>Distribución balanceada: {sumaDificultades} de {configEditando.cantidad_preguntas} preguntas asignadas.</span>
                      </div>
                    )}
                  </div>

                  {/* Distribución por tipo de pregunta con disponibilidad en el banco */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Distribución por tipo de pregunta:
                      </label>
                      <span className={`text-[11px] font-bold ${
                        sumaTipos === configEditando.cantidad_preguntas 
                          ? 'text-emerald-500' 
                          : 'text-amber-500'
                      }`}>
                        {sumaTipos} de {configEditando.cantidad_preguntas} asignadas
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Opción única */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            Opción única
                          </span>
                          {disponibilidadBanco && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              disp: {disponibilidadBanco.opcion_unica}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={disponibilidadBanco ? disponibilidadBanco.opcion_unica : configEditando.cantidad_preguntas}
                          disabled={disponibilidadBanco?.opcion_unica === 0}
                          value={configEditando.preguntas_opcion_unica ?? 7}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setConfigEditando({
                              ...configEditando,
                              preguntas_opcion_unica: val
                            });
                          }}
                          className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 ${
                            disponibilidadBanco?.opcion_unica === 0
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-indigo-500'
                          }`}
                        />
                      </div>

                      {/* Selección múltiple */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                            Selección múltiple
                          </span>
                          {disponibilidadBanco && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              disp: {disponibilidadBanco.opcion_multiple}
                            </span>
                          )}
                        </div>
                        <input
                          type="number"
                          min={0}
                          max={disponibilidadBanco ? disponibilidadBanco.opcion_multiple : configEditando.cantidad_preguntas}
                          disabled={disponibilidadBanco?.opcion_multiple === 0}
                          value={configEditando.preguntas_opcion_multiple ?? 3}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setConfigEditando({
                              ...configEditando,
                              preguntas_opcion_multiple: val
                            });
                          }}
                          className={`w-full px-3 py-1.5 border rounded-xl text-xs font-bold text-center focus:outline-none focus:ring-2 ${
                            disponibilidadBanco?.opcion_multiple === 0
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed'
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:ring-purple-500'
                          }`}
                        />
                      </div>
                    </div>

                    {sumaTipos !== configEditando.cantidad_preguntas && (
                      <p className="text-[11px] text-amber-500 font-medium">
                        La suma de preguntas por tipo ({sumaTipos}) debe ser igual al total ({configEditando.cantidad_preguntas}).
                      </p>
                    )}
                  </div>

                  {/* Nota mínima aprobatoria e intentos permitidos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Nota mínima aprobatoria */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <Award className="size-3.5 text-amber-500" />
                        Nota mínima aprobatoria:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          max={20}
                          step={1}
                          value={configEditando.nota_minima}
                          onChange={(e) => setConfigEditando({
                            ...configEditando,
                            nota_minima: Math.max(0, Math.min(20, Number(e.target.value)))
                          })}
                          className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-center text-amber-600 dark:text-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="text-xs text-slate-400">/ 20 puntos (predeterminado: 12)</span>
                      </div>
                    </div>

                    {/* Intentos permitidos */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <RotateCcw className="size-3.5 text-indigo-500" />
                        Intentos permitidos:
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={10}
                          value={configEditando.intentos_permitidos}
                          onChange={(e) => setConfigEditando({
                            ...configEditando,
                            intentos_permitidos: Math.max(1, Number(e.target.value))
                          })}
                          className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-black text-center text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-400">intento(s) por alumno (predeterminado: 1)</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Evaluación desactivada
                  </p>
                  Los estudiantes cursarán este contenido viendo las lecciones. Cuando su avance alcance el 100%, el sistema habilitará su certificado sin requerir examen.
                </div>
              )}
            </div>

            {/* Pie del modal */}
            <div className="p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 flex items-center justify-between">
              <button
                type="button"
                onClick={restablecerPredeterminado}
                className="px-3 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Restablecer a predeterminado
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={guardarModalEdicion}
                  disabled={guardando || (configEditando.aplica_examen && (sumaDificultades !== configEditando.cantidad_preguntas || sumaTipos !== configEditando.cantidad_preguntas)) || (configEditando.aplica_examen && Boolean(disponibilidadBanco && disponibilidadBanco.total === 0))}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/20 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {guardando ? <RotateCcw className="size-4 animate-spin" /> : <Save className="size-4" />}
                  <span>{guardando ? 'Guardando...' : 'Guardar configuración'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
