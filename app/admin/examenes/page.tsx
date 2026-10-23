'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileQuestion, Search, Plus, Filter, CheckCircle2, 
  AlertCircle, Edit3, Trash2, Eye, Code, 
  RotateCcw, Sparkles, Check, X, HelpCircle, Layers,
  Copy, BookOpen, Clock, Award, ArrowUpDown, Upload, FileText,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, GraduationCap, BookMarked
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AdminHeader from '@/components/admin/admin-header';
import { useTheme } from '@/context/theme-context';
import { formatearTextoCientifico, limpiarTextoCientificoPlano } from '@/lib/utils/textoCientifico';
import { PreguntaBanco, OpcionPregunta, TipoPregunta } from '@/lib/types/examenes';
import CURSOS_RAW from '@/lib/data/cursos.json';

// Lista oficial de 22 diplomados con nombres completos originales
const LISTA_DIPLOMADOS_OFICIALES = [
  { codigo: 'DIP-01', nombre: 'DERECHO MINERO' },
  { codigo: 'DIP-02', nombre: 'ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA' },
  { codigo: 'DIP-03', nombre: 'GEOLOGÍA MINERA' },
  { codigo: 'DIP-04', nombre: 'GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL' },
  { codigo: 'DIP-05', nombre: 'GEOMETALURGIA' },
  { codigo: 'DIP-06', nombre: 'GEOTECNIA MINERA' },
  { codigo: 'DIP-07', nombre: 'GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ' },
  { codigo: 'DIP-08', nombre: 'GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA' },
  { codigo: 'DIP-09', nombre: 'GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL' },
  { codigo: 'DIP-10', nombre: 'GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS' },
  { codigo: 'DIP-11', nombre: 'GESTIÓN DE OPERACIONES INDUSTRIALES' },
  { codigo: 'DIP-12', nombre: 'GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO' },
  { codigo: 'DIP-13', nombre: 'GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES' },
  { codigo: 'DIP-14', nombre: 'GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA' },
  { codigo: 'DIP-15', nombre: 'GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA' },
  { codigo: 'DIP-16', nombre: 'GESTIÓN MINERA' },
  { codigo: 'DIP-17', nombre: 'LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS' },
  { codigo: 'DIP-18', nombre: 'MINERÍA 4.0 Y DIGITALIZACIÓN MINERA' },
  { codigo: 'DIP-19', nombre: 'PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL MINERA' },
  { codigo: 'DIP-20', nombre: 'SEGURIDAD INDUSTRIAL' },
  { codigo: 'DIP-21', nombre: 'SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA' },
  { codigo: 'DIP-22', nombre: 'SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA' }
];

// Lista oficial de cursos desde JSON base
const LISTA_CURSOS_OFICIALES = (CURSOS_RAW as any[]).map((c: any, index: number) => ({
  codigo: `CUR-${(index + 1).toString().padStart(2, '0')}`,
  nombre: (c.curso || c.nombre || '').trim().toUpperCase()
}));

export default function AdminExamenesPage() {
  const { esOscuro } = useTheme();

  // Catálogos separados de diplomados y cursos
  const [listaDiplomados, setListaDiplomados] = useState(LISTA_DIPLOMADOS_OFICIALES);
  const [listaCursos, setListaCursos] = useState(LISTA_CURSOS_OFICIALES);

  // Filtros de navegación
  const [tipoPrograma, setTipoPrograma] = useState<'TODOS' | 'DIPLOMADOS' | 'CURSOS'>('TODOS');
  const [diplomadoSeleccionado, setDiplomadoSeleccionado] = useState('TODOS');
  const [moduloSeleccionado, setModuloSeleccionado] = useState('TODOS');
  const [filtroDificultad, setFiltroDificultad] = useState('TODOS');
  const [filtroTipo, setFiltroTipo] = useState('TODOS');
  const [busqueda, setBusqueda] = useState('');

  // Paginación para no sobrecargar el visor
  const [paginaActual, setPaginaActual] = useState(1);
  const [porPagina, setPorPagina] = useState(10); // 10 o 20 por página

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

  // Estados para Modal de Importación
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTipoPrograma, setImportTipoPrograma] = useState<'DIPLOMADO' | 'CURSO'>('DIPLOMADO');
  const [importDiplomado, setImportDiplomado] = useState('DIP-01');
  const [importModulo, setImportModulo] = useState('Módulo 01');
  const [importDificultad, setImportDificultad] = useState('MEDIO');
  const [jsonParaImportar, setJsonParaImportar] = useState('');
  const [archivoCargadoNombre, setArchivoCargadoNombre] = useState<string | null>(null);
  const [resumenPreguntasImportar, setResumenPreguntasImportar] = useState<number | null>(null);
  const [importando, setImportando] = useState(false);

  const DIPLOMADOS_CINCO_MODULOS = ['DIP-08', 'DIP-13', 'DIP-17'];
  const listaModulos = useMemo(() => {
    if (diplomadoSeleccionado === 'TODOS' || !diplomadoSeleccionado) {
      return ['Módulo 01', 'Módulo 02', 'Módulo 03', 'Módulo 04', 'Módulo 05'];
    }
    if (diplomadoSeleccionado.startsWith('CUR-')) {
      return ['Examen del Curso'];
    }
    if (DIPLOMADOS_CINCO_MODULOS.includes(diplomadoSeleccionado)) {
      return ['Módulo 01', 'Módulo 02', 'Módulo 03', 'Módulo 04', 'Módulo 05'];
    }
    return ['Módulo 01', 'Módulo 02', 'Módulo 03'];
  }, [diplomadoSeleccionado]);

  const listaModulosImport = useMemo(() => {
    if (importDiplomado.startsWith('CUR-')) {
      return ['Examen del Curso'];
    }
    if (DIPLOMADOS_CINCO_MODULOS.includes(importDiplomado)) {
      return ['Módulo 01', 'Módulo 02', 'Módulo 03', 'Módulo 04', 'Módulo 05'];
    }
    return ['Módulo 01', 'Módulo 02', 'Módulo 03'];
  }, [importDiplomado]);

  // Cargar catálogo dinámico de diplomados y cursos si está disponible
  useEffect(() => {
    const cargarCatalogoCompleto = async () => {
      try {
        const res = await fetch('/api/admin/catalogo');
        const data = await res.json();
        if (data.success) {
          if (Array.isArray(data.diplomados) && data.diplomados.length > 0) {
            const dips = data.diplomados.map((d: any) => ({
              codigo: d.codigo,
              nombre: (d.titulo || d.diplomado || d.nombre || '').trim().toUpperCase()
            }));
            setListaDiplomados(dips);
          }
          if (Array.isArray(data.cursos) && data.cursos.length > 0) {
            const cursos = data.cursos.map((c: any) => ({
              codigo: c.codigo,
              nombre: (c.titulo || c.nombre || c.curso || '').trim().toUpperCase()
            }));
            setListaCursos(cursos);
          }
        }
      } catch {
        // Fallback a los catálogos oficiales ya cargados
      }
    };
    cargarCatalogoCompleto();
  }, []);

  // Catálogo unificado
  const todosLosProgramas = useMemo(() => {
    return [...listaDiplomados, ...listaCursos];
  }, [listaDiplomados, listaCursos]);

  // Programa actual seleccionado
  const diplomadoActual = useMemo(() => {
    if (diplomadoSeleccionado === 'TODOS') {
      if (tipoPrograma === 'DIPLOMADOS') {
        return {
          codigo: 'TODOS',
          nombre: 'Todos los Diplomados Oficiales'
        };
      }
      if (tipoPrograma === 'CURSOS') {
        return {
          codigo: 'TODOS',
          nombre: 'Todos los Cursos de Especialización'
        };
      }
      return {
        codigo: 'TODOS',
        nombre: 'Todos los Diplomados y Cursos'
      };
    }
    return todosLosProgramas.find(d => d.codigo === diplomadoSeleccionado) || {
      codigo: diplomadoSeleccionado,
      nombre: diplomadoSeleccionado
    };
  }, [todosLosProgramas, diplomadoSeleccionado, tipoPrograma]);

  // Cargar preguntas desde la API
  const cargarPreguntas = async () => {
    setCargando(true);
    setErrorMensaje(null);
    try {
      const params = new URLSearchParams();
      if (diplomadoSeleccionado && diplomadoSeleccionado !== 'TODOS') {
        params.append('codigoDiplomado', diplomadoSeleccionado);
      } else if (tipoPrograma && tipoPrograma !== 'TODOS') {
        params.append('tipoPrograma', tipoPrograma);
      }

      if (moduloSeleccionado && moduloSeleccionado !== 'TODOS') {
        params.append('modulo', moduloSeleccionado);
      }
      if (filtroDificultad !== 'TODOS') params.append('dificultad', filtroDificultad);
      if (filtroTipo !== 'TODOS') params.append('tipo', filtroTipo);
      if (busqueda.trim()) params.append('busqueda', busqueda.trim());

      const res = await fetch(`/api/admin/examenes/banco?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setPreguntas(data.preguntas || []);
        setPaginaActual(1);
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
  }, [diplomadoSeleccionado, tipoPrograma, moduloSeleccionado, filtroDificultad, filtroTipo]);

  // Búsqueda diferida
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
    let codDip = diplomadoSeleccionado !== 'TODOS' ? diplomadoSeleccionado : (
      tipoPrograma === 'CURSOS' ? (listaCursos[0]?.codigo || 'CUR-01') : (listaDiplomados[0]?.codigo || 'DIP-01')
    );
    const dipObj = todosLosProgramas.find(d => d.codigo === codDip);
    const nombreDip = dipObj?.nombre || codDip;
    const esCurso = codDip.startsWith('CUR-');
    const mod = esCurso ? 'Examen del Curso' : (moduloSeleccionado !== 'TODOS' ? moduloSeleccionado : 'Módulo 01');

    setPreguntaEditando({
      codigo_diplomado: codDip,
      diplomado: nombreDip,
      modulo: mod,
      dificultad: filtroDificultad !== 'TODOS' ? filtroDificultad : 'MEDIO',
      tipo: filtroTipo !== 'TODOS' ? (filtroTipo as TipoPregunta) : 'multiple_choice',
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

  // Abrir modal de importación
  const abrirModalImportacion = () => {
    let codDip = diplomadoSeleccionado !== 'TODOS' ? diplomadoSeleccionado : (
      tipoPrograma === 'CURSOS' ? (listaCursos[0]?.codigo || 'CUR-01') : (listaDiplomados[0]?.codigo || 'DIP-01')
    );
    const esCurso = codDip.startsWith('CUR-');
    setImportTipoPrograma(esCurso ? 'CURSO' : 'DIPLOMADO');
    setImportDiplomado(codDip);
    setImportModulo(esCurso ? 'Examen del Curso' : (moduloSeleccionado !== 'TODOS' ? moduloSeleccionado : 'Módulo 01'));
    setImportDificultad(filtroDificultad !== 'TODOS' ? filtroDificultad : 'MEDIO');
    setJsonParaImportar('');
    setArchivoCargadoNombre(null);
    setResumenPreguntasImportar(null);
    setShowImportModal(true);
  };

  // Manejar archivo .json subido
  const manejarSubidaArchivoJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setArchivoCargadoNombre(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setJsonParaImportar(content);
        try {
          const parsed = JSON.parse(content);
          const list = Array.isArray(parsed) ? parsed : (parsed.quiz || []);
          setResumenPreguntasImportar(list.length);
        } catch {
          setResumenPreguntasImportar(null);
        }
      }
    };
    reader.readAsText(file);
  };

  // Procesar e importar preguntas desde archivo JSON o texto
  const procesarImportacionJson = async () => {
    if (!jsonParaImportar.trim()) {
      alert('Por favor selecciona un archivo JSON o pega su contenido.');
      return;
    }

    setImportando(true);
    try {
      const parsed = JSON.parse(jsonParaImportar);
      const quizList = Array.isArray(parsed) ? parsed : (parsed.quiz || []);
      if (!quizList.length) {
        alert('No se encontraron preguntas en formato quiz en el archivo JSON.');
        setImportando(false);
        return;
      }

      const nombreProg = todosLosProgramas.find(d => d.codigo === importDiplomado)?.nombre || importDiplomado;

      const itemsParaGuardar = quizList.map((q: any) => ({
        codigo_diplomado: importDiplomado,
        diplomado: nombreProg,
        modulo: importDiplomado.startsWith('CUR-') ? 'Examen del Curso' : importModulo,
        dificultad: q.difficulty || importDificultad,
        tipo: q.type === 'multiple_select' ? 'multiple_select' : 'multiple_choice',
        pregunta: limpiarTextoCientificoPlano(q.question || ''),
        opciones: (q.answerOptions || []).map((opt: any) => ({
          text: limpiarTextoCientificoPlano(opt.text || ''),
          isCorrect: Boolean(opt.isCorrect),
          rationale: limpiarTextoCientificoPlano(opt.rationale || '')
        })),
        hint: q.hint ? limpiarTextoCientificoPlano(q.hint) : null,
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
        setArchivoCargadoNombre(null);
        setResumenPreguntasImportar(null);

        // Si importó a un programa o módulo, sincronizar la vista activa para ver los resultados
        setDiplomadoSeleccionado(importDiplomado);
        if (importDiplomado.startsWith('CUR-')) {
          setTipoPrograma('CURSOS');
          setModuloSeleccionado('TODOS');
        } else {
          setTipoPrograma('DIPLOMADOS');
          setModuloSeleccionado(importModulo);
        }
        cargarPreguntas();
        mostrarNotificacion(`Se importaron ${itemsParaGuardar.length} preguntas exitosamente para ${importDiplomado}`);
      } else {
        alert(data.error || 'Error al importar');
      }
    } catch (err: any) {
      alert('Error en formato JSON: ' + err.message);
    } finally {
      setImportando(false);
    }
  };

  const mostrarNotificacion = (msg: string) => {
    setMensajeExito(msg);
    setTimeout(() => setMensajeExito(null), 3500);
  };

  // Métricas dinámicas y globales según las preguntas en vista
  const totalActivas = useMemo(() => preguntas.filter(p => p.activo).length, [preguntas]);
  const totalPausadas = useMemo(() => preguntas.length - totalActivas, [preguntas, totalActivas]);
  const totalMedio = useMemo(() => preguntas.filter(p => p.dificultad === 'MEDIO').length, [preguntas]);
  const totalAlto = useMemo(() => preguntas.filter(p => p.dificultad === 'ALTO').length, [preguntas]);
  const totalFacil = useMemo(() => preguntas.filter(p => p.dificultad === 'FACIL').length, [preguntas]);
  const totalSeleccionUnica = useMemo(() => preguntas.filter(p => p.tipo === 'multiple_choice').length, [preguntas]);
  const totalSeleccionMultiple = useMemo(() => preguntas.filter(p => p.tipo === 'multiple_select').length, [preguntas]);
  const totalDiplomadosUnicos = useMemo(() => new Set(preguntas.map(p => p.codigo_diplomado).filter(Boolean)).size, [preguntas]);
  const totalModulosUnicos = useMemo(() => new Set(preguntas.map(p => p.modulo).filter(Boolean)).size, [preguntas]);

  // Métricas y segmentación de paginación
  const totalPaginas = Math.max(1, Math.ceil(preguntas.length / porPagina));
  const indiceInicio = (paginaActual - 1) * porPagina;
  const indiceFin = Math.min(indiceInicio + porPagina, preguntas.length);
  const preguntasPaginadas = useMemo(() => {
    return preguntas.slice(indiceInicio, indiceFin);
  }, [preguntas, indiceInicio, indiceFin]);

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors duration-200">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader title="Evaluaciones y Banco de preguntas" />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Notificación de éxito */}
          {mensajeExito && (
            <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-500/40 rounded-xl text-emerald-800 dark:text-emerald-300 text-sm flex items-center justify-between shadow-sm animate-fadeIn">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="font-semibold">{mensajeExito}</span>
              </div>
              <button onClick={() => setMensajeExito(null)} className="text-emerald-600 dark:text-emerald-400 hover:opacity-75">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Contenedor en 2 Columnas: Columna de Filtros + Columna Banco de preguntas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Columna Lateral: Filtro, Búsqueda y Acciones Rápidas */}
            <aside className="lg:col-span-4 xl:col-span-3 space-y-4 self-start">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 transition-colors">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <h2 className="text-sm font-bold text-slate-900 dark:text-white">Filtro y búsqueda</h2>
                  </div>
                  {(busqueda || tipoPrograma !== 'TODOS' || diplomadoSeleccionado !== 'TODOS' || moduloSeleccionado !== 'TODOS' || filtroDificultad !== 'TODOS' || filtroTipo !== 'TODOS') && (
                    <button
                      type="button"
                      onClick={() => {
                        setBusqueda('');
                        setTipoPrograma('TODOS');
                        setDiplomadoSeleccionado('TODOS');
                        setModuloSeleccionado('TODOS');
                        setFiltroDificultad('TODOS');
                        setFiltroTipo('TODOS');
                      }}
                      className="text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {/* Botones de Acción */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={abrirNuevaPregunta}
                    className="w-full px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-purple-600/20 transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir pregunta</span>
                  </button>

                  <button
                    type="button"
                    onClick={abrirModalImportacion}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
                    title="Importar preguntas desde formato JSON"
                  >
                    <Code className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>Importar JSON</span>
                  </button>
                </div>

                {/* Buscador */}
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Buscar en texto
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar preguntas..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                    />
                  </div>
                </div>

                {/* 1. Selector de Tipo de Programa */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    1. Modalidad / Tipo
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-950/80 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      type="button"
                      onClick={() => {
                        setTipoPrograma('TODOS');
                        setDiplomadoSeleccionado('TODOS');
                        setModuloSeleccionado('TODOS');
                      }}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all text-center ${
                        tipoPrograma === 'TODOS'
                          ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-300 shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      Todos
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipoPrograma('DIPLOMADOS');
                        setDiplomadoSeleccionado('TODOS');
                        setModuloSeleccionado('TODOS');
                      }}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                        tipoPrograma === 'DIPLOMADOS'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>Diplomados</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setTipoPrograma('CURSOS');
                        setDiplomadoSeleccionado('TODOS');
                        setModuloSeleccionado('TODOS');
                      }}
                      className={`py-1.5 px-2 text-[11px] font-bold rounded-lg transition-all text-center flex items-center justify-center gap-1 ${
                        tipoPrograma === 'CURSOS'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>Cursos</span>
                    </button>
                  </div>
                </div>

                {/* 2. Selector según Tipo de Programa */}
                {tipoPrograma === 'DIPLOMADOS' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        2. Diplomado Oficial
                      </label>
                      <select
                        value={diplomadoSeleccionado}
                        onChange={(e) => {
                          setDiplomadoSeleccionado(e.target.value);
                          setModuloSeleccionado('TODOS');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer transition-colors"
                      >
                        <option value="TODOS">Todos los diplomados ({listaDiplomados.length})</option>
                        {listaDiplomados.map(d => (
                          <option key={d.codigo} value={d.codigo}>
                            {d.codigo} - {d.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        3. Módulo
                      </label>
                      <select
                        value={moduloSeleccionado}
                        onChange={(e) => setModuloSeleccionado(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer transition-colors"
                      >
                        <option value="TODOS">Todos los módulos</option>
                        {listaModulos.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {tipoPrograma === 'CURSOS' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        2. Curso de Especialización
                      </label>
                      <select
                        value={diplomadoSeleccionado}
                        onChange={(e) => {
                          setDiplomadoSeleccionado(e.target.value);
                          setModuloSeleccionado('TODOS');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer transition-colors"
                      >
                        <option value="TODOS">Todos los cursos ({listaCursos.length})</option>
                        {listaCursos.map(c => (
                          <option key={c.codigo} value={c.codigo}>
                            {c.codigo} - {c.nombre}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-800 dark:text-blue-300 space-y-1">
                      <p className="text-[11px] font-bold flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Evaluación Única</span>
                      </p>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                        En cursos aplica 1 solo examen por cada curso con 10 preguntas sorteadas del banco.
                      </p>
                    </div>
                  </>
                )}

                {tipoPrograma === 'TODOS' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        2. Programa Específico (Opcional)
                      </label>
                      <select
                        value={diplomadoSeleccionado}
                        onChange={(e) => {
                          setDiplomadoSeleccionado(e.target.value);
                          setModuloSeleccionado('TODOS');
                        }}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer transition-colors"
                      >
                        <option value="TODOS">Todos los diplomados y cursos ({todosLosProgramas.length})</option>
                        <optgroup label="🎓 DIPLOMADOS OFICIALES">
                          {listaDiplomados.map(d => (
                            <option key={d.codigo} value={d.codigo}>
                              {d.codigo} - {d.nombre}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="📚 CURSOS DE ESPECIALIZACIÓN">
                          {listaCursos.map(c => (
                            <option key={c.codigo} value={c.codigo}>
                              {c.codigo} - {c.nombre}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                        3. Módulo
                      </label>
                      <select
                        value={moduloSeleccionado}
                        onChange={(e) => setModuloSeleccionado(e.target.value)}
                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 cursor-pointer transition-colors"
                      >
                        <option value="TODOS">Todos los módulos</option>
                        {listaModulos.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                {/* Filtro Dificultad */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Dificultad
                  </label>
                  <select
                    value={filtroDificultad}
                    onChange={(e) => setFiltroDificultad(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer transition-colors"
                  >
                    <option value="TODOS">Todas las dificultades</option>
                    <option value="MEDIO">Nivel medio</option>
                    <option value="ALTO">Nivel alto</option>
                    <option value="FACIL">Nivel fácil</option>
                  </select>
                </div>

                {/* Filtro Tipo */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase tracking-wider">
                    Tipo de pregunta
                  </label>
                  <select
                    value={filtroTipo}
                    onChange={(e) => setFiltroTipo(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-900 dark:text-slate-200 focus:outline-none focus:border-purple-500 cursor-pointer transition-colors"
                  >
                    <option value="TODOS">Todos los tipos</option>
                    <option value="multiple_choice">Opción única (1 respuesta)</option>
                    <option value="multiple_select">Selección múltiple (varias)</option>
                  </select>
                </div>

                {/* Regla pedagógica */}
                <div className="p-3 bg-purple-500/5 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 rounded-xl space-y-1">
                  <p className="text-[11px] font-bold text-purple-700 dark:text-purple-300 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5" />
                    <span>Sorteo automático</span>
                  </p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-snug">
                    Se sortearán <strong>10 preguntas</strong> (7 nivel medio y 3 nivel alto) para la evaluación. Nota aprobatoria: <strong>12.00 / 20</strong>.
                  </p>
                </div>
              </div>
            </aside>

            {/* Columna Principal: Banco de preguntas */}
            <section className="lg:col-span-8 xl:col-span-9 space-y-4 min-w-0 w-full self-start">
              {/* Contexto del Diplomado y Módulo seleccionado */}
              <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2.5 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-3 py-1 rounded-lg bg-purple-600 text-white font-black text-xs tracking-wider shadow-sm">
                      {diplomadoSeleccionado === 'TODOS'
                        ? (tipoPrograma === 'DIPLOMADOS' ? 'TODOS LOS DIPLOMADOS' : (tipoPrograma === 'CURSOS' ? 'TODOS LOS CURSOS' : 'BANCO GLOBAL'))
                        : diplomadoActual.codigo}
                    </span>
                    {tipoPrograma !== 'CURSOS' && (
                      <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300">
                        {moduloSeleccionado === 'TODOS' ? 'Todos los módulos' : moduloSeleccionado}
                      </span>
                    )}
                    {tipoPrograma === 'CURSOS' && (
                      <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-xs font-bold text-blue-700 dark:text-blue-300">
                        Examen del Curso
                      </span>
                    )}
                    {filtroDificultad !== 'TODOS' && (
                      <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold">
                        Nivel {filtroDificultad.toLowerCase()}
                      </span>
                    )}
                    {filtroTipo !== 'TODOS' && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-xs font-bold">
                        {filtroTipo === 'multiple_select' ? 'Múltiple' : 'Única'}
                      </span>
                    )}
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-extrabold">
                      {preguntas.length} {preguntas.length === 1 ? 'pregunta' : 'preguntas'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold">
                      {totalActivas} activas para sorteo
                    </span>
                    <button
                      type="button"
                      onClick={cargarPreguntas}
                      disabled={cargando}
                      title="Actualizar preguntas"
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <RotateCcw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>

                <div>
                  <h1 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-snug">
                    {diplomadoSeleccionado === 'TODOS'
                      ? (tipoPrograma === 'DIPLOMADOS' ? 'Banco de Preguntas - Diplomados Oficiales' : (tipoPrograma === 'CURSOS' ? 'Banco de Preguntas - Cursos de Especialización' : 'Banco Global de Preguntas'))
                      : diplomadoActual.nombre}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {diplomadoSeleccionado === 'TODOS'
                      ? moduloSeleccionado === 'TODOS'
                        ? 'Visualizando preguntas del repositorio general según los filtros activos.'
                        : `Visualizando preguntas del ${moduloSeleccionado}.`
                      : moduloSeleccionado === 'TODOS'
                        ? `Visualizando todas las preguntas de ${diplomadoActual.nombre}.`
                        : `Banco de preguntas de ${moduloSeleccionado} para ${diplomadoActual.nombre}.`}
                  </p>
                </div>

                {/* Métricas y KPIs Integrados Dinámicamente en la Cabecera */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 pt-3 mt-1 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                      <FileQuestion className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        {diplomadoSeleccionado === 'TODOS' && moduloSeleccionado === 'TODOS' ? 'En banco' : 'En vista'}
                      </p>
                      <p className="text-sm font-black text-slate-900 dark:text-white leading-tight">
                        {preguntas.length}{' '}
                        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                          ({totalActivas} act · {totalPausadas} paus)
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <ArrowUpDown className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dificultad</p>
                      <p className="text-xs font-bold text-indigo-600 dark:text-indigo-300 leading-tight">
                        {totalMedio} medio · {totalAlto} alto
                        {totalFacil > 0 && ` · ${totalFacil} fácil`}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">10 por examen</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                      <Award className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Alcance</p>
                      <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
                        {totalDiplomadosUnicos} {totalDiplomadosUnicos === 1 ? 'programa' : 'programas'}
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {totalModulosUnicos} {totalModulosUnicos === 1 ? 'módulo' : 'módulos'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tipo</p>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200 leading-tight">
                        <span className="text-sky-600 dark:text-sky-400">{totalSeleccionUnica}</span> única ·{' '}
                        <span className="text-amber-600 dark:text-amber-400">{totalSeleccionMultiple}</span> múltiple
                      </p>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">Con feedback</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Barra Superior de Paginación y Control de Densidad */}
              {!cargando && preguntas.length > 0 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs text-xs transition-colors">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                    <span>Mostrando</span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {indiceInicio + 1} - {indiceFin}
                    </span>
                    <span>de</span>
                    <span className="font-bold text-slate-900 dark:text-white">{preguntas.length}</span>
                    <span>preguntas</span>
                    <span className="text-[11px] text-purple-600 dark:text-purple-400 font-bold ml-1">
                      (Página {paginaActual} de {totalPaginas})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 ml-auto">
                    {/* Selector de cantidad por página: 10 o 20 */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-500 dark:text-slate-400 text-[11px] font-semibold">Ver:</span>
                      <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
                        {[10, 20, 50].map((num) => (
                          <button
                            key={num}
                            type="button"
                            onClick={() => {
                              setPorPagina(num);
                              setPaginaActual(1);
                            }}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                              porPagina === num
                                ? 'bg-purple-600 text-white shadow-xs'
                                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                            }`}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Botones de navegación compacta */}
                    {totalPaginas > 1 && (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                          disabled={paginaActual === 1}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          title="Página anterior"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 font-bold text-[11px] text-slate-700 dark:text-slate-300">
                          {paginaActual} / {totalPaginas}
                        </span>
                        <button
                          type="button"
                          onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                          disabled={paginaActual === totalPaginas}
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
                          title="Página siguiente"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Listado de Preguntas */}
              <div className="space-y-3">
                {cargando ? (
                  <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-2">
                    <RotateCcw className="w-6 h-6 animate-spin mx-auto text-purple-600 dark:text-purple-400" />
                    <p className="text-xs">Cargando banco de preguntas...</p>
                  </div>
                ) : preguntas.length === 0 ? (
                  <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 space-y-3 shadow-sm">
                    <FileQuestion className="w-10 h-10 mx-auto text-slate-400 dark:text-slate-600" />
                    <p className="text-sm font-semibold">No se encontraron preguntas para los filtros seleccionados</p>
                    <p className="text-xs text-slate-500">Puedes limpiar los filtros, añadir preguntas manualmente o importar tus archivos JSON.</p>
                    <div className="flex items-center justify-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setBusqueda('');
                          setTipoPrograma('TODOS');
                          setDiplomadoSeleccionado('TODOS');
                          setModuloSeleccionado('TODOS');
                          setFiltroDificultad('TODOS');
                          setFiltroTipo('TODOS');
                          setPaginaActual(1);
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer shadow-sm"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Ver todo el banco
                      </button>
                      <button
                        onClick={abrirNuevaPregunta}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-all cursor-pointer shadow-md"
                      >
                        <Plus className="w-4 h-4" /> Crear primera pregunta
                      </button>
                    </div>
                  </div>
                ) : (
                  preguntasPaginadas.map((p, idx) => {
                    const esMultiple = p.tipo === 'multiple_select';
                    const numeroPreguntaReal = indiceInicio + idx + 1;
                    return (
                      <div 
                        key={p.id}
                        className={`p-4 sm:p-5 rounded-2xl border transition-all shadow-sm ${
                          p.activo 
                            ? 'bg-white dark:bg-slate-900/80 border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700' 
                            : 'bg-slate-100/70 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800/40 opacity-70'
                        }`}
                      >
                        <div className="space-y-3.5">
                          {/* Fila superior: Badges a la izquierda y Botones de acción a la derecha */}
                          <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2 border-b border-slate-100 dark:border-slate-800/80">
                            {/* Badges de Metadatos */}
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-black">
                                #{numeroPreguntaReal}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold ${
                                p.codigo_diplomado?.startsWith('CUR-')
                                  ? 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
                                  : 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30'
                              }`} title={p.diplomado || p.codigo_diplomado}>
                                {p.codigo_diplomado || 'DIP'}
                              </span>
                              <span className="px-2.5 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                                {p.modulo}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold ${
                                esMultiple 
                                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300' 
                                  : 'bg-sky-500/10 border-sky-500/30 text-sky-700 dark:text-sky-300'
                              }`}>
                                {esMultiple ? 'Selección múltiple' : 'Opción única'}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-lg border text-xs font-bold ${
                                p.dificultad === 'ALTO'
                                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                                  : p.dificultad === 'FACIL'
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300'
                              }`}>
                                Nivel {p.dificultad?.toLowerCase()}
                              </span>
                              {!p.activo && (
                                <span className="px-2.5 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700 text-xs font-bold">
                                  PAUSADA
                                </span>
                              )}
                            </div>

                            {/* Botones de Acción (en la fila superior) */}
                            <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                              {/* Botón Ver JSON */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPreguntaVerJson(p);
                                  setShowJsonModal(true);
                                  setJsonCopiado(false);
                                }}
                                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors shadow-xs"
                                title="Ver JSON de esta pregunta"
                              >
                                <Code className="w-4 h-4" />
                              </button>

                              {/* Botón Editar */}
                              <button
                                type="button"
                                onClick={() => abrirEdicion(p)}
                                className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 bg-slate-100 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors shadow-xs"
                                title="Editar pregunta"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Botón Activar / Pausar */}
                              <button
                                type="button"
                                onClick={() => alternarEstado(p)}
                                className={`p-2 rounded-xl border transition-colors shadow-xs ${
                                  p.activo 
                                    ? 'text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-900/50' 
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 bg-slate-100 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/60'
                                }`}
                                title={p.activo ? 'Pausar pregunta' : 'Activar pregunta'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>

                              {/* Botón Eliminar */}
                              <button
                                type="button"
                                onClick={() => handleEliminar(p.id)}
                                className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-slate-100 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-colors shadow-xs"
                                title="Eliminar pregunta"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Siguiente fila: Enunciado ocupando todo el ancho */}
                          <h3 className="text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                            {formatearTextoCientifico(p.pregunta)}
                          </h3>

                          {/* Alternativas compactas ocupando todo el ancho */}
                          <div className="space-y-2 pt-1">
                            {p.opciones.map((opt, oIdx) => (
                              <div 
                                key={oIdx}
                                className={`text-sm p-3 rounded-xl flex items-start gap-3 border transition-colors ${
                                  opt.isCorrect
                                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
                                    : 'bg-slate-50/80 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800/60 text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {/* Indicador: Cuadrado si es selección múltiple, Círculo si es opción única. Check adentro si es correcta */}
                                <div className="pt-0.5 shrink-0">
                                  <div
                                    className={`w-4.5 h-4.5 flex items-center justify-center border transition-all ${
                                      esMultiple ? 'rounded-[5px]' : 'rounded-full'
                                    } ${
                                      opt.isCorrect
                                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                        : 'border-slate-400 dark:border-slate-600 bg-white dark:bg-slate-900/60'
                                    }`}
                                  >
                                    {opt.isCorrect && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <span className={opt.isCorrect ? 'font-semibold text-emerald-950 dark:text-emerald-100' : ''}>
                                    {formatearTextoCientifico(opt.text)}
                                  </span>
                                  {opt.rationale && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 italic leading-relaxed">
                                      <strong className="text-slate-800 dark:text-slate-300 not-italic font-bold">Feedback:</strong> {formatearTextoCientifico(opt.rationale)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Pista si existe */}
                          {p.hint && (
                            <div className="text-xs text-purple-800 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/30 px-3.5 py-2 rounded-xl flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                              <span><strong>Pista:</strong> {formatearTextoCientifico(p.hint)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Barra Inferior de Paginación Completa */}
              {!cargando && totalPaginas > 1 && (
                <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-xs mt-4 transition-colors">
                  <p className="text-slate-500 dark:text-slate-400 text-xs">
                    Mostrando <span className="font-bold text-slate-900 dark:text-white">{indiceInicio + 1}</span> a <span className="font-bold text-slate-900 dark:text-white">{indiceFin}</span> de <span className="font-bold text-slate-900 dark:text-white">{preguntas.length}</span> preguntas
                  </p>

                  <div className="flex items-center gap-1.5 ml-auto">
                    <button
                      type="button"
                      onClick={() => setPaginaActual(1)}
                      disabled={paginaActual === 1}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-all"
                      title="Primera página"
                    >
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                      disabled={paginaActual === 1}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" /> Anterior
                    </button>

                    {/* Números de página */}
                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                        .filter(p => p === 1 || p === totalPaginas || Math.abs(p - paginaActual) <= 2)
                        .reduce<(number | string)[]>((acc, p, idx, arr) => {
                          if (idx > 0 && p - (arr[idx - 1] as number) > 1) {
                            acc.push('...');
                          }
                          acc.push(p);
                          return acc;
                        }, [])
                        .map((item, idx) => {
                          if (item === '...') {
                            return (
                              <span key={`ellipsis-${idx}`} className="px-2 text-slate-400 text-xs font-bold">
                                ...
                              </span>
                            );
                          }
                          const num = item as number;
                          const activo = num === paginaActual;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setPaginaActual(num)}
                              className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                                activo
                                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                      disabled={paginaActual === totalPaginas}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-all"
                    >
                      Siguiente <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaginaActual(totalPaginas)}
                      disabled={paginaActual === totalPaginas}
                      className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1 transition-all"
                      title="Última página"
                    >
                      <ChevronsRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* MODAL: Ver JSON de la Pregunta */}
      {showJsonModal && preguntaVerJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Code className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Visualizador JSON de la Pregunta</h3>
              </div>
              <button 
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-950">
              <pre className="text-xs text-emerald-400 tabular-nums whitespace-pre-wrap break-words leading-relaxed select-all">
                {JSON.stringify({
                  type: preguntaVerJson.tipo,
                  question: preguntaVerJson.pregunta,
                  answerOptions: preguntaVerJson.opciones,
                  hint: preguntaVerJson.hint
                }, null, 2)}
              </pre>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
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
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 cursor-pointer transition-all shadow-md"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {preguntaEditando.id ? 'Editar pregunta del banco' : 'Nueva pregunta para el banco'}
                </h3>
              </div>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Contexto del Programa de Destino */}
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                    Diplomado y módulo asignado
                  </span>
                  <p className="text-xs font-black text-slate-900 dark:text-white">
                    {preguntaEditando.codigo_diplomado || diplomadoSeleccionado} - {preguntaEditando.diplomado || diplomadoActual.nombre}
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 self-start sm:self-auto shadow-xs">
                  {preguntaEditando.modulo || moduloSeleccionado}
                </span>
              </div>

              {/* Asignación y Metadatos */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Diplomado / Curso</label>
                  <select
                    value={preguntaEditando.codigo_diplomado || diplomadoSeleccionado}
                    onChange={(e) => {
                      const cod = e.target.value;
                      const prog = todosLosProgramas.find(d => d.codigo === cod);
                      const esCur = cod.startsWith('CUR-');
                      setPreguntaEditando(prev => ({ 
                        ...prev!, 
                        codigo_diplomado: cod,
                        diplomado: prog?.nombre || cod,
                        modulo: esCur ? 'Examen del Curso' : (prev?.modulo === 'Examen del Curso' ? 'Módulo 01' : (prev?.modulo || 'Módulo 01'))
                      }));
                    }}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <optgroup label="🎓 DIPLOMADOS OFICIALES">
                      {listaDiplomados.map(d => (
                        <option key={d.codigo} value={d.codigo}>
                          {d.codigo} - {d.nombre}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="📚 CURSOS DE ESPECIALIZACIÓN">
                      {listaCursos.map(c => (
                        <option key={c.codigo} value={c.codigo}>
                          {c.codigo} - {c.nombre}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Módulo</label>
                  {(preguntaEditando.codigo_diplomado || '').startsWith('CUR-') ? (
                    <input
                      type="text"
                      readOnly
                      value="Examen del Curso"
                      className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-not-allowed"
                    />
                  ) : (
                    <select
                      value={preguntaEditando.modulo || moduloSeleccionado}
                      onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, modulo: e.target.value }))}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      {(DIPLOMADOS_CINCO_MODULOS.includes(preguntaEditando.codigo_diplomado || diplomadoSeleccionado)
                        ? ['Módulo 01', 'Módulo 02', 'Módulo 03', 'Módulo 04', 'Módulo 05']
                        : ['Módulo 01', 'Módulo 02', 'Módulo 03']
                      ).map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Dificultad</label>
                  <select
                    value={preguntaEditando.dificultad || 'MEDIO'}
                    onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, dificultad: e.target.value }))}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                  >
                    <option value="MEDIO">Nivel medio</option>
                    <option value="ALTO">Nivel alto</option>
                    <option value="FACIL">Nivel fácil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Tipo de pregunta</label>
                <select
                  value={preguntaEditando.tipo || 'multiple_choice'}
                  onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, tipo: e.target.value as TipoPregunta }))}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                >
                  <option value="multiple_choice">Opción única (1 correcta)</option>
                  <option value="multiple_select">Selección múltiple (varias correctas)</option>
                </select>
              </div>

              {/* Enunciado */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">Enunciado de la Pregunta</label>
                <textarea
                  rows={3}
                  value={preguntaEditando.pregunta || ''}
                  onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, pregunta: e.target.value }))}
                  placeholder="Escriba la pregunta completa aquí..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>

              {/* Alternativas */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Alternativas de Respuesta y Retroalimentación
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const opts = [...(preguntaEditando.opciones || [])];
                      opts.push({ text: '', isCorrect: false, rationale: '' });
                      setPreguntaEditando(prev => ({ ...prev!, opciones: opts }));
                    }}
                    className="text-xs text-purple-600 dark:text-purple-400 hover:opacity-80 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar alternativa
                  </button>
                </div>

                {(preguntaEditando.opciones || []).map((opt, oIdx) => (
                  <div key={oIdx} className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
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
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border flex items-center gap-2 cursor-pointer transition-all ${
                          opt.isCorrect 
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-400 dark:border-emerald-600 shadow-sm' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className={`w-4 h-4 shrink-0 flex items-center justify-center border transition-all ${
                          preguntaEditando.tipo === 'multiple_select' ? 'rounded-[4px]' : 'rounded-full'
                        } ${
                          opt.isCorrect 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-900'
                        }`}>
                          {opt.isCorrect && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
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
                        className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                      />

                      {(preguntaEditando.opciones || []).length > 2 && (
                        <button
                          type="button"
                          onClick={() => {
                            const opts = (preguntaEditando.opciones || []).filter((_, i) => i !== oIdx);
                            setPreguntaEditando(prev => ({ ...prev!, opciones: opts }));
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
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
                      className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800/80 rounded-lg px-3 py-1.5 text-[11px] text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none transition-colors"
                    />
                  </div>
                ))}
              </div>

              {/* Pista (Hint) */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1">
                  Pista de apoyo (Hint opcional)
                </label>
                <input
                  type="text"
                  value={preguntaEditando.hint || ''}
                  onChange={(e) => setPreguntaEditando(prev => ({ ...prev!, hint: e.target.value }))}
                  placeholder="Ej: Considere el artículo 23 de la Ley General de Minería..."
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={guardarEdicion}
                disabled={guardando}
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/30 cursor-pointer transition-all disabled:opacity-50"
              >
                {guardando ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 stroke-[2.5]" />}
                <span>{guardando ? 'Guardando...' : 'Guardar pregunta'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Importar preguntas desde archivo JSON */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Importar preguntas desde JSON</h3>
              </div>
              <button onClick={() => setShowImportModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
              {/* Paso 1: Asignación de destino */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  1. Asignar diplomado, módulo y nivel
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Diplomado / Curso
                    </label>
                    <select
                      value={importDiplomado}
                      onChange={(e) => {
                        const val = e.target.value;
                        setImportDiplomado(val);
                        if (val.startsWith('CUR-')) {
                          setImportModulo('Examen del Curso');
                        } else if (importModulo === 'Examen del Curso') {
                          setImportModulo('Módulo 01');
                        }
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <optgroup label="🎓 DIPLOMADOS OFICIALES">
                        {listaDiplomados.map(d => (
                          <option key={d.codigo} value={d.codigo}>
                            {d.codigo} - {d.nombre}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="📚 CURSOS DE ESPECIALIZACIÓN">
                        {listaCursos.map(c => (
                          <option key={c.codigo} value={c.codigo}>
                            {c.codigo} - {c.nombre}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Módulo
                    </label>
                    {importDiplomado.startsWith('CUR-') ? (
                      <input
                        type="text"
                        readOnly
                        value="Examen del Curso"
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 cursor-not-allowed"
                      />
                    ) : (
                      <select
                        value={importModulo}
                        onChange={(e) => setImportModulo(e.target.value)}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                      >
                        {listaModulosImport.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
                      Nivel / Dificultad
                    </label>
                    <select
                      value={importDificultad}
                      onChange={(e) => setImportDificultad(e.target.value)}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-purple-500 transition-colors"
                    >
                      <option value="MEDIO">Nivel medio</option>
                      <option value="ALTO">Nivel alto</option>
                      <option value="FACIL">Nivel fácil</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Paso 2: Cargar archivo JSON */}
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                  2. Cargar archivo .json
                </span>

                <label
                  htmlFor="json-file-input"
                  className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    archivoCargadoNombre 
                      ? 'border-emerald-500/60 bg-emerald-50/40 dark:bg-emerald-950/20' 
                      : 'border-slate-300 dark:border-slate-700 hover:border-purple-500/60 bg-slate-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <input
                    id="json-file-input"
                    type="file"
                    accept=".json,application/json"
                    onChange={manejarSubidaArchivoJson}
                    className="hidden"
                  />

                  {archivoCargadoNombre ? (
                    <div className="space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {archivoCargadoNombre}
                      </p>
                      <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {resumenPreguntasImportar !== null ? `${resumenPreguntasImportar} preguntas listas para procesar` : 'Archivo JSON cargado'}
                      </p>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 hover:underline inline-block pt-1">
                        Clic para cambiar de archivo
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                        <Upload className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        Haz clic para subir tu archivo .json de evaluación
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Soporta archivos con formato <code className="text-purple-600 dark:text-purple-300 font-bold">quiz</code> o lista directa de preguntas
                      </p>
                    </div>
                  )}
                </label>

                {/* Editor / Pegado manual */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                      O revisa / pega el contenido JSON manualmente:
                    </label>
                    {resumenPreguntasImportar !== null && (
                      <span className="text-[11px] font-bold text-purple-600 dark:text-purple-400">
                        {resumenPreguntasImportar} preguntas detectadas
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={5}
                    value={jsonParaImportar}
                    onChange={(e) => {
                      const val = e.target.value;
                      setJsonParaImportar(val);
                      try {
                        const p = JSON.parse(val);
                        const list = Array.isArray(p) ? p : (p.quiz || []);
                        setResumenPreguntasImportar(list.length);
                      } catch {
                        setResumenPreguntasImportar(null);
                      }
                    }}
                    placeholder='{"quiz": [{"type": "multiple_choice", "question": "...", "answerOptions": [...]}]}'
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs tabular-nums text-emerald-300 placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Destino: <strong>{importDiplomado}</strong> · <strong>{importModulo}</strong>
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowImportModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={procesarImportacionJson}
                  disabled={!jsonParaImportar.trim() || importando}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-600/30 cursor-pointer transition-all disabled:opacity-50"
                >
                  {importando ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>
                    {importando 
                      ? 'Procesando...' 
                      : (resumenPreguntasImportar ? `Procesar e importar (${resumenPreguntasImportar})` : 'Procesar e importar')}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
