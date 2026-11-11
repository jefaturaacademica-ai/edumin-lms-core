'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowLeft, Search, RefreshCw, 
  GraduationCap, BookOpen, Info, Check, ShieldCheck, ArrowUpRight, 
  X, Clock, ShoppingBag, ChevronDown, ChevronUp, ArrowRight, Award,
  Filter, ArrowUpDown
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { EduminCreditsCalculation } from '@/lib/utils/credits';
import { parsearResumenTexto, ResumenData, TemaClaveItem } from '@/lib/utils/resumenParser';
import { 
  CATALOGO_DIPLOMADOS, 
  CATALOGO_CURSOS 
} from '@/lib/data/catalogoGeneral';
import { ALL_DIPLOMADOS } from '@/lib/data/diplomadosData';

function normalizarTexto(texto: string): string {
  return (texto || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function getWhatsAppComprarCreditos(tipo: 'diplomado' | 'curso', titulo?: string) {
  const base = "https://wa.me/51924634568?text=";
  const msg = tipo === 'diplomado'
    ? `Hola EDUMIN, soy estudiante y deseo comprar 1 Crédito adicional de Diplomado${titulo ? ` para cursar: "${titulo}"` : ''}. Por favor bríndenme información y facilidades de pago.`
    : `Hola EDUMIN, soy estudiante y deseo adquirir Créditos adicionales de Cursos de Alta Especialización${titulo ? ` para llevar: "${titulo}"` : ''}. ¿Me podrían indicar los costos y promociones disponibles?`;
  return base + encodeURIComponent(msg);
}

export default function CanjearBeneficiosPage() {
  const [tabActual, setTabActual] = useState<'diplomados' | 'cursos' | 'reglas'>('diplomados');
  
  // Créditos EDUMIN
  const [eduminCredits, setEduminCredits] = useState<EduminCreditsCalculation | null>(null);
  const [loading, setLoading] = useState(true);

  // Catálogo dinámico desde Supabase
  const [catalogoApi, setCatalogoApi] = useState<{ diplomados: any[]; cursos: any[] } | null>(null);

  // Programas ya matriculados por el estudiante
  const [diplomadosMatriculadosSlugs, setDiplomadosMatriculadosSlugs] = useState<string[]>([]);
  const [cursosMatriculadosTitulos, setCursosMatriculadosTitulos] = useState<string[]>([]);

  // Selecciones
  const [diplomadosSeleccionados, setDiplomadosSeleccionados] = useState<string[]>([]);
  const [cursosSeleccionados, setCursosSeleccionados] = useState<string[]>([]);
  const [enviandoCanje, setEnviandoCanje] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<{ texto: string; tipo: 'diplomado' | 'curso' } | null>(null);
  
  // Buscadores, filtros y ordenamiento
  const [busqueda, setBusqueda] = useState<string>('');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todos');
  const [ordenDiplomados, setOrdenDiplomados] = useState<'catalogo' | 'az' | 'za'>('catalogo');
  const [busquedaCurso, setBusquedaCurso] = useState<string>('');
  const [filtroCategoriaCurso, setFiltroCategoriaCurso] = useState<string>('todos');
  const [ordenCursos, setOrdenCursos] = useState<'catalogo' | 'az' | 'za'>('catalogo');

  // Modal para ver temario oficial (temas colapsados por defecto)
  const [modalTemario, setModalTemario] = useState<{
    tipo: 'diplomado' | 'curso';
    item: any;
  } | null>(null);
  const [temasExpandidoModal, setTemasExpandidoModal] = useState<Record<string, boolean>>({});
  const [partesExpandidoModal, setPartesExpandidoModal] = useState<Record<string, boolean>>({});
  const [puntosClaveModal, setPuntosClaveModal] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setTemasExpandidoModal({});
    setPartesExpandidoModal({});
    setPuntosClaveModal({});
  }, [modalTemario]);

  // Función para recargar datos del estudiante
  async function cargarDatosEstudiante() {
    try {
      const res = await fetch('/api/dashboard/me');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          // Extraer diplomados ya matriculados
          const dipsSlugs: string[] = [];
          if (data.profile.diplomado_1) dipsSlugs.push(normalizarTexto(data.profile.diplomado_1));
          if (Array.isArray(data.profile.diplomados_json)) {
            data.profile.diplomados_json.forEach((d: any) => {
              if (d.slug) dipsSlugs.push(normalizarTexto(d.slug));
              if (d.titulo) dipsSlugs.push(normalizarTexto(d.titulo));
              if (d.id) dipsSlugs.push(normalizarTexto(d.id));
            });
          }
          setDiplomadosMatriculadosSlugs(Array.from(new Set(dipsSlugs)));

          // Extraer cursos ya matriculados
          const cursTitulos: string[] = [];
          if (Array.isArray(data.profile.cursos_json)) {
            data.profile.cursos_json.forEach((c: any) => {
              if (c.titulo) cursTitulos.push(normalizarTexto(c.titulo));
              if (c.codigo) cursTitulos.push(normalizarTexto(c.codigo));
              if (c.id) cursTitulos.push(normalizarTexto(String(c.id)));
            });
          }
          if (Array.isArray(data.matriculas)) {
            data.matriculas.forEach((m: any) => {
              if (m.titulo) cursTitulos.push(normalizarTexto(m.titulo));
              if (m.item_id) cursTitulos.push(normalizarTexto(String(m.item_id)));
            });
          }
          setCursosMatriculadosTitulos(Array.from(new Set(cursTitulos)));
        }
        if (data.eduminCredits) {
          setEduminCredits(data.eduminCredits);
        }
      }
    } catch (e) {
      console.error('Error cargando datos de usuario:', e);
    }
  }

  // Carga inicial de datos de usuario y catálogo oficial
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'cursos' || tabParam === 'diplomados' || tabParam === 'reglas') {
      setTabActual(tabParam);
    }

    async function inicializar() {
      setLoading(true);
      await cargarDatosEstudiante();
      try {
        const catRes = await fetch('/api/admin/catalogo');
        if (catRes.ok) {
          const catData = await catRes.json();
          setCatalogoApi(catData);
        }
      } catch (err) {
        console.error('Error cargando catálogo oficial:', err);
      } finally {
        setLoading(false);
      }
    }
    inicializar();
  }, []);

  const dipDisponibles = eduminCredits?.diplomados.disponibles ?? 0;
  const curDisponibles = eduminCredits?.cursos.disponibles ?? 0;
  const totalDisponibles = eduminCredits?.total.disponibles ?? 0;

  // 1. Mapeo de Diplomados Oficiales (Directo desde Supabase o fallback local)
  const diplomadosOpciones = useMemo(() => {
    if (catalogoApi && Array.isArray(catalogoApi.diplomados) && catalogoApi.diplomados.length > 0) {
      return catalogoApi.diplomados.map((d: any, idx: number) => {
        const numId = d.numId || idx + 1;
        const slug = d.id || d.slug || `dip-${String(numId).padStart(2, '0')}`;
        const matchStatic = ALL_DIPLOMADOS.find(s => s.numId === numId || normalizarTexto(s.titulo) === normalizarTexto(d.titulo));
        const mods = d.modulos || matchStatic?.modulos || [];
        const totalTemas = Array.isArray(mods)
          ? mods.reduce((acc: number, m: any) => acc + (Array.isArray(m.temas) && m.temas.length > 0 ? m.temas.length : (Array.isArray(m.clases) ? m.clases.length : 0)), 0)
          : 0;
        return {
          id: slug,
          slug,
          numId,
          codigo: d.codigo || `DIP-${String(numId).padStart(2, '0')}`,
          titulo: d.titulo,
          categoria: d.categoria || matchStatic?.categoria || 'Legal y cumplimiento',
          modulosCount: Array.isArray(mods) ? mods.length : (d.num_modulos || 3),
          totalTemas,
          imagen: d.imagen || matchStatic?.imagen || '/assets/images/daem/gestion-minera.webp',
          modulos: mods
        };
      });
    }
    return CATALOGO_DIPLOMADOS.map((d) => {
      const match = ALL_DIPLOMADOS.find(item => item.slug === d.slug);
      const mods = match?.modulos || [];
      const totalTemas = mods.reduce((acc: number, m: any) => acc + (Array.isArray(m.temas) && m.temas.length > 0 ? m.temas.length : (Array.isArray(m.clases) ? m.clases.length : 0)), 0);
      return {
        ...d,
        codigo: `DIP-${String(d.numId).padStart(2, '0')}`,
        totalTemas,
        modulos: mods
      };
    });
  }, [catalogoApi]);

  // 2. Mapeo de Cursos de Alta Especialización (Excluyendo Diplomados y Talleres)
  const cursosMapeados = useMemo(() => {
    if (catalogoApi && Array.isArray(catalogoApi.cursos) && catalogoApi.cursos.length > 0) {
      // Filtrar cursos reales: excluir talleres y diplomados
      const cursosPuros = catalogoApi.cursos.filter((c: any) => {
        const tipo = (c.tipo || '').toLowerCase();
        const cat = (c.categoria || '').toLowerCase();
        const cod = (c.codigo || '').toUpperCase();
        const esTaller = tipo === 'taller' || cat.includes('taller') || cod.startsWith('TAL-');
        const esDip = tipo === 'diplomado' || cat.includes('diplomado') || cod.startsWith('DIP-');
        return !esTaller && !esDip;
      });

      return cursosPuros.map((c: any, idx: number) => {
        const cod = c.codigo || `CUR-${String(idx + 1).padStart(2, '0')}`;
        const slug = c.slug || c.id || `cur-${String(idx + 1).padStart(2, '0')}`;
        const localMatch = CATALOGO_CURSOS.find(item => item.codigo === cod || normalizarTexto(item.titulo) === normalizarTexto(c.titulo));
        return {
          id: cod,
          codigo: cod,
          slug,
          titulo: c.titulo,
          categoria: c.categoria || localMatch?.categoria || 'Especialización',
          imagen: c.imagen || localMatch?.imagen || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80',
          duracion: c.duracion || `${c.horas || 20} Horas Académicas`,
          horas: c.horas || 20,
          temas: c.temas || [],
          lecciones: c.lecciones || []
        };
      });
    }

    return CATALOGO_CURSOS.map((c) => ({
      id: c.codigo,
      codigo: c.codigo,
      slug: c.codigo.toLowerCase(),
      titulo: c.titulo,
      categoria: c.categoria,
      imagen: c.imagen,
      duracion: c.duracion,
      horas: c.horas,
      temas: c.temas || [],
      lecciones: []
    }));
  }, [catalogoApi]);

  // Helpers para verificar si un programa ya está matriculado
  const esDiplomadoYaMatriculado = (op: any) => {
    const s = normalizarTexto(op.slug || op.id || '');
    const t = normalizarTexto(op.titulo || '');
    const cod = normalizarTexto(op.codigo || '');
    return diplomadosMatriculadosSlugs.some(matriculado => 
      matriculado === s || 
      matriculado === t || 
      matriculado === cod ||
      s.includes(matriculado) || 
      matriculado.includes(s)
    );
  };

  const esCursoYaMatriculado = (cur: any) => {
    const t = normalizarTexto(cur.titulo || '');
    const cod = normalizarTexto(cur.codigo || cur.id || '');
    return cursosMatriculadosTitulos.some(matriculado => 
      matriculado === t || 
      matriculado === cod ||
      t.includes(matriculado) || 
      matriculado.includes(t)
    );
  };

  // Categorías únicas para filtros
  const categoriasDiplomados = useMemo(() => {
    const set = new Set<string>();
    diplomadosOpciones.forEach(d => { if (d.categoria) set.add(d.categoria); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [diplomadosOpciones]);

  const categoriasCursos = useMemo(() => {
    const set = new Set<string>();
    cursosMapeados.forEach(c => { if (c.categoria) set.add(c.categoria); });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
  }, [cursosMapeados]);

  // Filtrado y ordenamiento de diplomados oficiales: SÓLO los que aún NO tiene matriculados
  const diplomadosFiltrados = useMemo(() => {
    const filtrados = diplomadosOpciones
      .filter(op => !esDiplomadoYaMatriculado(op))
      .filter(op => {
        const coincideCat = filtroCategoria === 'todos' || op.categoria === filtroCategoria;
        const textoBusq = normalizarTexto(busqueda);
        if (!textoBusq) return coincideCat;
        const coincideTitulo = normalizarTexto(op.titulo).includes(textoBusq);
        const coincideCatTexto = normalizarTexto(op.categoria).includes(textoBusq);
        const coincideCodigo = normalizarTexto(op.codigo).includes(textoBusq);
        return coincideCat && (coincideTitulo || coincideCatTexto || coincideCodigo);
      });

    if (ordenDiplomados === 'az') {
      return [...filtrados].sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'es', { sensitivity: 'base' }));
    }
    if (ordenDiplomados === 'za') {
      return [...filtrados].sort((a, b) => (b.titulo || '').localeCompare(a.titulo || '', 'es', { sensitivity: 'base' }));
    }
    return filtrados;
  }, [diplomadosOpciones, filtroCategoria, busqueda, ordenDiplomados, diplomadosMatriculadosSlugs]);

  // Filtrado y ordenamiento de cursos oficiales: SÓLO los que aún NO tiene matriculados
  const cursosFiltrados = useMemo(() => {
    const filtrados = cursosMapeados
      .filter(cur => !esCursoYaMatriculado(cur))
      .filter(cur => {
        const coincideCat = filtroCategoriaCurso === 'todos' || cur.categoria === filtroCategoriaCurso;
        const textoBusq = normalizarTexto(busquedaCurso);
        if (!textoBusq) return coincideCat;
        const coincideTitulo = normalizarTexto(cur.titulo).includes(textoBusq);
        const coincideCatTexto = normalizarTexto(cur.categoria).includes(textoBusq);
        const coincideCodigo = normalizarTexto(cur.codigo).includes(textoBusq);
        return coincideCat && (coincideTitulo || coincideCatTexto || coincideCodigo);
      });

    if (ordenCursos === 'az') {
      return [...filtrados].sort((a, b) => (a.titulo || '').localeCompare(b.titulo || '', 'es', { sensitivity: 'base' }));
    }
    if (ordenCursos === 'za') {
      return [...filtrados].sort((a, b) => (b.titulo || '').localeCompare(a.titulo || '', 'es', { sensitivity: 'base' }));
    }
    return filtrados;
  }, [cursosMapeados, filtroCategoriaCurso, busquedaCurso, ordenCursos, cursosMatriculadosTitulos]);

  // Toggle de selección de diplomados
  const toggleSeleccionDiplomado = (slug: string) => {
    if (mensajeExito) setMensajeExito(null);
    if (diplomadosSeleccionados.includes(slug)) {
      setDiplomadosSeleccionados(prev => prev.filter(item => item !== slug));
    } else {
      if (diplomadosSeleccionados.length < dipDisponibles) {
        setDiplomadosSeleccionados(prev => [...prev, slug]);
      } else {
        alert(`Dispones de ${dipDisponibles} Crédito(s) de Diplomado para canjear.`);
      }
    }
  };

  // Toggle de selección de cursos
  const toggleSeleccionCurso = (codigo: string) => {
    if (mensajeExito) setMensajeExito(null);
    if (cursosSeleccionados.includes(codigo)) {
      setCursosSeleccionados(prev => prev.filter(item => item !== codigo));
    } else {
      if (cursosSeleccionados.length < curDisponibles) {
        setCursosSeleccionados(prev => [...prev, codigo]);
      } else {
        alert(`Dispones de ${curDisponibles} Crédito(s) de Cursos de Alta Especialización para canjear.`);
      }
    }
  };

  // Confirmar Canje de Diplomados
  const confirmarCanjeDiplomados = async () => {
    if (diplomadosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un diplomado para canjear.');
      return;
    }
    setEnviandoCanje(true);
    try {
      const programaTitulosObj: Record<string, string> = {};
      diplomadosOpciones.forEach(op => {
        programaTitulosObj[op.slug] = op.titulo;
        programaTitulosObj[op.id] = op.titulo;
      });

      const res = await fetch('/api/dashboard/canjear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'DIPLOMADO',
          seleccionados: diplomadosSeleccionados,
          programaTitulos: programaTitulosObj
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const cant = diplomadosSeleccionados.length;
        setMensajeExito({
          tipo: 'diplomado',
          texto: `¡Felicitaciones! Has canjeado con éxito ${cant} Diplomado(s) Oficial(es). Ya se encuentran registrados en tu panel académico.`
        });
        setDiplomadosSeleccionados([]);
        await cargarDatosEstudiante();
      } else {
        alert(data.error || 'Error al procesar el canje de diplomado.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al procesar el canje.');
    } finally {
      setEnviandoCanje(false);
    }
  };

  // Confirmar Canje de Cursos
  const confirmarCanjeCursos = async () => {
    if (cursosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un curso para canjear.');
      return;
    }
    setEnviandoCanje(true);
    try {
      const programaTitulosObj: Record<string, string> = {};
      const payloadSeleccionados = cursosSeleccionados.map(cod => {
        const item = cursosMapeados.find(c => c.codigo === cod || c.id === cod);
        if (item) {
          programaTitulosObj[item.codigo] = item.titulo;
          programaTitulosObj[item.slug] = item.titulo;
        }
        return {
          id: cod,
          codigo: cod,
          titulo: item?.titulo || cod,
          categoria: item?.categoria || 'Especialización',
          duracion: item?.duracion || '20 Horas Académicas',
          horas: item?.horas || 20,
          imagen: item?.imagen
        };
      });

      const res = await fetch('/api/dashboard/canjear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'CURSO',
          seleccionados: payloadSeleccionados,
          programaTitulos: programaTitulosObj
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        const cant = cursosSeleccionados.length;
        setMensajeExito({
          tipo: 'curso',
          texto: `¡Felicitaciones! Has canjeado exitosamente ${cant} Curso(s) de Alta Especialización. Ya puedes acceder a ellos en tu aula virtual.`
        });
        setCursosSeleccionados([]);
        await cargarDatosEstudiante();
      } else {
        alert(data.error || 'Error al procesar el canje de cursos.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de conexión al procesar el canje.');
    } finally {
      setEnviandoCanje(false);
    }
  };

  if (loading) {
    return <DashboardLoader minHeight="min-h-screen" />;
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 lg:p-12 text-slate-900 dark:text-slate-100 pb-24 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera compacta: Volver + Título + KPIs de créditos en una sola fila */}
        <header className="bg-white dark:bg-slate-900 rounded-2xl px-4 sm:px-6 py-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Link 
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-50 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0"
            >
              <ArrowLeft className="size-4" /> Volver
            </Link>

            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Mis créditos EDUMIN
            </h1>
          </div>

          {/* KPIs de créditos en una sola fila */}
          <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar shrink-0">
            <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                Créditos diplomados
              </span>
              <span className="text-sm sm:text-base font-black tabular-nums text-indigo-700 dark:text-indigo-200">
                {dipDisponibles} disp.
              </span>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                Créditos cursos
              </span>
              <span className="text-sm sm:text-base font-black tabular-nums text-emerald-700 dark:text-emerald-200">
                {curDisponibles} disp.
              </span>
            </div>

            <div className="bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 px-3.5 py-2 rounded-xl flex items-center gap-2.5 shrink-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 whitespace-nowrap">
                Total créditos
              </span>
              <span className="text-sm sm:text-base font-black tabular-nums text-white">
                {totalDisponibles}
              </span>
            </div>
          </div>
        </header>

        {/* Navegación por Pestañas */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
          <button
            onClick={() => { setTabActual('diplomados'); setMensajeExito(null); }}
            className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              tabActual === 'diplomados'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Canjear mis diplomados
          </button>

          <button
            onClick={() => { setTabActual('cursos'); setMensajeExito(null); }}
            className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              tabActual === 'cursos'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Canjear mis cursos
          </button>

          <button
            onClick={() => { setTabActual('reglas'); setMensajeExito(null); }}
            className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              tabActual === 'reglas'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Información de créditos
          </button>
        </div>

        {/* ================= PESTAÑA 1: CANJEAR DIPLOMADOS ================= */}
        {tabActual === 'diplomados' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Buscar diplomado por nombre o código..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-slate-100"
                />
                {busqueda && (
                  <button
                    type="button"
                    onClick={() => setBusqueda('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <div className="relative min-w-[200px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={filtroCategoria}
                    onChange={(e) => setFiltroCategoria(e.target.value)}
                    aria-label="Filtrar diplomados por categoría"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="todos">
                      Todas las categorías ({diplomadosOpciones.filter(d => !esDiplomadoYaMatriculado(d)).length})
                    </option>
                    {categoriasDiplomados.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="relative min-w-[180px]">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={ordenDiplomados}
                    onChange={(e) => setOrdenDiplomados(e.target.value as 'catalogo' | 'az' | 'za')}
                    aria-label="Ordenar diplomados"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="catalogo">Orden oficial</option>
                    <option value="az">Alfabético (A - Z)</option>
                    <option value="za">Alfabético (Z - A)</option>
                  </select>
                </div>
              </div>
            </div>

            {dipDisponibles === 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 text-amber-600" />
                  <div>
                    Actualmente no dispones de Créditos de Diplomado libres. Si deseas cursar un nuevo programa oficial, puedes adquirir créditos adicionales en cualquier momento.
                  </div>
                </div>
                <a
                  href={getWhatsAppComprarCreditos('diplomado')}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Adquirir créditos
                </a>
              </div>
            )}

            {/* Listado de Diplomados: sólo programas pendientes (no matriculados aún) */}
            {diplomadosFiltrados.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="size-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 grid place-items-center mx-auto shadow-sm">
                  <CheckCircle2 className="size-7" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  No hay diplomados pendientes por canjear
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {busqueda || filtroCategoria !== 'todos'
                    ? 'No se encontraron programas con los filtros seleccionados.'
                    : '¡Excelente! Ya te encuentras matriculado en todos los diplomados oficiales disponibles en tu catálogo.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {diplomadosFiltrados.map((opcion) => {
                  const estaSeleccionado = diplomadosSeleccionados.includes(opcion.slug);

                  return (
                    <div 
                      key={opcion.slug}
                      onClick={() => {
                        if (dipDisponibles > 0) {
                          toggleSeleccionDiplomado(opcion.slug);
                        }
                      }}
                      className={`rounded-2xl overflow-hidden border flex flex-col justify-between transition-all select-none ${
                        estaSeleccionado 
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md cursor-pointer' 
                          : dipDisponibles > 0
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md cursor-default'
                      }`}
                    >
                      {/* Portada */}
                      <div className="relative h-40 w-full bg-slate-800 overflow-hidden">
                        <img 
                          src={opcion.imagen} 
                          alt={opcion.titulo}
                          className="object-cover w-full h-full opacity-90 transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                          <span className="text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                            {opcion.categoria}
                          </span>
                          {estaSeleccionado && (
                            <span className="text-[10px] font-bold text-white bg-indigo-600 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-400/30 flex items-center gap-1">
                              <Check className="size-3" /> Seleccionado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cuerpo */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {opcion.titulo}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span>{opcion.modulosCount} {opcion.modulosCount === 1 ? 'módulo' : 'módulos'}</span>
                            <span>·</span>
                            <span>{opcion.totalTemas || 0} {(opcion.totalTemas || 0) === 1 ? 'tema' : 'temas'}</span>
                          </div>
                        </div>

                        {/* Acción y Ver Temario */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalTemario({ tipo: 'diplomado', item: opcion });
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <BookOpen className="size-3.5" />
                            <span>Ver temario</span>
                          </button>

                          {dipDisponibles > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSeleccionDiplomado(opcion.slug);
                              }}
                              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition inline-flex items-center gap-1.5 cursor-pointer ${
                                estaSeleccionado
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:border-indigo-300'
                              }`}
                            >
                              <span>{estaSeleccionado ? 'Seleccionado' : 'Canjear (1 crédito)'}</span>
                              {estaSeleccionado ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                            </button>
                          ) : (
                            <a
                              href={getWhatsAppComprarCreditos('diplomado', opcion.titulo)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-bold px-3.5 py-1.5 rounded-xl border bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Comprar crédito</span>
                              <ArrowUpRight className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Barra flotante de confirmación (DIPLOMADOS) */}
            {diplomadosSeleccionados.length > 0 && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-20 border border-slate-800 animate-fadeInUp">
                <div>
                  <p className="text-xs text-slate-400">Diplomados seleccionados con Créditos EDUMIN:</p>
                  <p className="text-base font-bold text-white">{diplomadosSeleccionados.length} de {dipDisponibles} disponibles</p>
                </div>

                <button
                  onClick={confirmarCanjeDiplomados}
                  disabled={enviandoCanje}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {enviandoCanje ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Confirmar y Canjear Diplomados
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= PESTAÑA 2: CANJEAR CURSOS LIBRES ================= */}
        {tabActual === 'cursos' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                  type="text"
                  placeholder="Buscar curso por nombre o código..."
                  value={busquedaCurso}
                  onChange={(e) => setBusquedaCurso(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-10 pr-9 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-slate-100"
                />
                {busquedaCurso && (
                  <button
                    type="button"
                    onClick={() => setBusquedaCurso('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                <div className="relative min-w-[200px]">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={filtroCategoriaCurso}
                    onChange={(e) => setFiltroCategoriaCurso(e.target.value)}
                    aria-label="Filtrar cursos por categoría"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="todos">
                      Todas las categorías ({cursosMapeados.filter(c => !esCursoYaMatriculado(c)).length})
                    </option>
                    {categoriasCursos.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="relative min-w-[180px]">
                  <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" />
                  <select
                    value={ordenCursos}
                    onChange={(e) => setOrdenCursos(e.target.value as 'catalogo' | 'az' | 'za')}
                    aria-label="Ordenar cursos"
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-8 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                  >
                    <option value="catalogo">Orden oficial</option>
                    <option value="az">Alfabético (A - Z)</option>
                    <option value="za">Alfabético (Z - A)</option>
                  </select>
                </div>
              </div>
            </div>

            {curDisponibles === 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 flex-shrink-0 text-amber-600" />
                  <div>
                    No dispones de Créditos de Cursos Libres actualmente. Si deseas ampliar tu formación profesional, puedes adquirir créditos adicionales en cualquier momento.
                  </div>
                </div>
                <a
                  href={getWhatsAppComprarCreditos('curso')}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition shrink-0 inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" /> Adquirir créditos
                </a>
              </div>
            )}

            {/* Listado de Cursos: sólo cursos pendientes (no matriculados aún) */}
            {cursosFiltrados.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-10 text-center border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="size-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 grid place-items-center mx-auto shadow-sm">
                  <CheckCircle2 className="size-7" />
                </div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  No hay cursos pendientes por canjear
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  {busquedaCurso || filtroCategoriaCurso !== 'todos'
                    ? 'No se encontraron cursos con los filtros seleccionados.'
                    : '¡Excelente! Ya te encuentras matriculado en todos los cursos disponibles en tu catálogo.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cursosFiltrados.map((curso) => {
                  const estaSeleccionado = cursosSeleccionados.includes(curso.codigo);

                  return (
                    <div 
                      key={curso.id}
                      onClick={() => {
                        if (curDisponibles > 0) {
                          toggleSeleccionCurso(curso.codigo);
                        }
                      }}
                      className={`rounded-2xl overflow-hidden border flex flex-col justify-between transition-all select-none ${
                        estaSeleccionado 
                          ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/30 shadow-md cursor-pointer' 
                          : curDisponibles > 0
                          ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:shadow-md cursor-pointer'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md cursor-default'
                      }`}
                    >
                      {/* Portada */}
                      <div className="relative h-40 w-full bg-slate-800 overflow-hidden">
                        <img 
                          src={curso.imagen} 
                          alt={curso.titulo}
                          className="object-cover w-full h-full opacity-90 transition-transform duration-300 hover:scale-105"
                        />
                        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                          <span className="text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
                            {curso.categoria}
                          </span>
                          {estaSeleccionado && (
                            <span className="text-[10px] font-bold text-white bg-indigo-600 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-400/30 flex items-center gap-1">
                              <Check className="size-3" /> Seleccionado
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cuerpo */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white leading-snug line-clamp-2">
                            {curso.titulo}
                          </h3>
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                            <span>{curso.horas ? `${curso.horas} horas` : curso.duracion}</span>
                            <span>·</span>
                            <span>{Array.isArray(curso.temas) ? curso.temas.length : 0} {(Array.isArray(curso.temas) ? curso.temas.length : 0) === 1 ? 'tema' : 'temas'}</span>
                          </div>
                        </div>

                        {/* Acción y Ver Temario */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setModalTemario({ tipo: 'curso', item: curso });
                            }}
                            className="text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 bg-indigo-50/70 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 inline-flex items-center gap-1.5 transition cursor-pointer"
                          >
                            <BookOpen className="size-3.5" />
                            <span>Ver temario</span>
                          </button>

                          {curDisponibles > 0 ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSeleccionCurso(curso.codigo);
                              }}
                              className={`text-xs font-bold px-3.5 py-1.5 rounded-xl border transition inline-flex items-center gap-1.5 cursor-pointer ${
                                estaSeleccionado
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-indigo-50 hover:border-indigo-300'
                              }`}
                            >
                              <span>{estaSeleccionado ? 'Seleccionado' : 'Canjear (1 crédito)'}</span>
                              {estaSeleccionado ? <Check className="size-3.5" /> : <ArrowRight className="size-3.5" />}
                            </button>
                          ) : (
                            <a
                              href={getWhatsAppComprarCreditos('curso', curso.titulo)}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-xs font-bold px-3.5 py-1.5 rounded-xl border bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800 transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Comprar crédito</span>
                              <ArrowUpRight className="size-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Barra flotante para cursos */}
            {cursosSeleccionados.length > 0 && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-20 border border-slate-800 animate-fadeInUp">
                <div>
                  <p className="text-xs text-slate-400">Cursos seleccionados con Créditos EDUMIN:</p>
                  <p className="text-base font-bold text-white">{cursosSeleccionados.length} de {curDisponibles} disponibles</p>
                </div>

                <button
                  onClick={confirmarCanjeCursos}
                  disabled={enviandoCanje}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {enviandoCanje ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Confirmar y Canjear Cursos Libres
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================= PESTAÑA 3: REGLAS DE CRÉDITOS EDUMIN ================= */}
        {tabActual === 'reglas' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 space-y-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5" /> Reglamento Oficial del Sistema de Créditos
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                ¿Cómo funcionan tus Créditos EDUMIN?
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Tus créditos te permiten autogestionar tus cursos y diplomados a lo largo de tu formación profesional con total flexibilidad.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Paquete COMPLETO</div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">4 Créditos EDUMIN</div>
                <div className="text-xs text-slate-500 mt-2 space-y-1">
                  <div>• <strong>1 Crédito Diplomado</strong> (Elegido en matrícula)</div>
                  <div>• <strong>3 Créditos Cursos</strong> (Elegibles por el alumno)</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Paquete FULL</div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">6 Créditos EDUMIN</div>
                <div className="text-xs text-slate-500 mt-2 space-y-1">
                  <div>• <strong>1 Crédito Diplomado</strong> (Elegido en matrícula)</div>
                  <div>• <strong>5 Créditos Cursos</strong> (Elegibles por el alumno)</div>
                </div>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
                <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Paquete ILIMITADO</div>
                <div className="text-xl font-black text-slate-900 dark:text-white mt-1">18 Créditos EDUMIN</div>
                <div className="text-xs text-slate-500 mt-2 space-y-1">
                  <div>• <strong>3 Créditos Diplomados</strong> base (al consumirlos se abren +3 continuos)</div>
                  <div>• <strong>15 Créditos Cursos</strong> de libre elección</div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Reglas de Liberación según Forma de Pago:
              </h3>
              
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white">1. Pago 100% Contado o Pago Total en la Primera Cuota:</strong>
                  <p className="mt-1">
                    Al abonar el 100% del monto del programa (ya sea al contado o cancelando el precio completo en la primera cuota), se liberan y habilitan de inmediato todos los Créditos de Diplomados y Cursos incluidos en tu paquete.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white">2. Pago en Cuotas:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li><strong>Diplomados:</strong> Por el <strong>primer pago</strong> se habilita tu 1er diplomado; en el <strong>segundo pago</strong> se habilita el 2do diplomado (si cuentas con créditos disponibles); en la <strong>tercera cuota</strong> se habilita el 3er diplomado, y así sucesivamente según tus pagos y créditos.</li>
                    <li><strong>Primera Cuota (Cursos):</strong> Se habilitan <strong>1 curso</strong> en Completo, <strong>2 cursos</strong> en Full, y <strong>3 cursos</strong> en Ilimitado.</li>
                    <li><strong>Segunda Cuota (Cursos):</strong> Se liberan cursos adicionales: +1 en Completo (2 acumulados), +2 en Full (4 acumulados), y +3 en Ilimitado (6 acumulados). Si tu plan contempla únicamente 2 cuotas, al abonar esta última cuota se habilitan automáticamente todos los créditos restantes.</li>
                    <li><strong>Cuota Final:</strong> Al cancelar la última cuota programada, se desbloquean todos los diplomados y cursos restantes contratados.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Barra inferior compacta de confirmación tras canje exitoso */}
        {mensajeExito &&
          !(tabActual === 'diplomados' && diplomadosSeleccionados.length > 0) &&
          !(tabActual === 'cursos' && cursosSeleccionados.length > 0) && (
            <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky bottom-6 z-20 border border-emerald-500/40 animate-fadeInUp">
              <div className="flex items-center gap-3 min-w-0">
                <div className="size-9 rounded-xl bg-emerald-500 text-white grid place-items-center shrink-0 shadow-md shadow-emerald-500/30">
                  <CheckCircle2 className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-emerald-400">
                    ¡Canje procesado exitosamente!
                  </p>
                  <p className="text-xs text-slate-300 truncate sm:whitespace-normal">
                    {mensajeExito.texto}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {mensajeExito.tipo === 'diplomado' ? (
                  <Link
                    href="/dashboard/diplomados"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <GraduationCap className="size-4" /> Ir a mis diplomados
                  </Link>
                ) : (
                  <Link
                    href="/dashboard/cursos"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition shadow-md inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <BookOpen className="size-4" /> Ir a mis cursos
                  </Link>
                )}

                <button
                  type="button"
                  onClick={() => setMensajeExito(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs border border-slate-700 transition cursor-pointer"
                >
                  Seguir canjeando
                </button>
              </div>
            </div>
          )}

      </div>

      {/* ================= MODAL TEMARIO OFICIAL ================= */}
      {modalTemario && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setModalTemario(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cabecera del Modal */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-4 bg-slate-50/50 dark:bg-slate-950/50">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                  {modalTemario.tipo === 'diplomado' ? `Diplomado · ${modalTemario.item.categoria}` : `Curso · ${modalTemario.item.categoria}`}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {modalTemario.item.titulo}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                  <span className="flex items-center gap-1">
                    <Clock className="size-3 text-indigo-500" />
                    {modalTemario.tipo === 'diplomado'
                      ? `${modalTemario.item.modulosCount} módulos · ${modalTemario.item.totalTemas || 0} temas`
                      : `${modalTemario.item.horas ? `${modalTemario.item.horas} horas` : modalTemario.item.duracion} · ${Array.isArray(modalTemario.item.temas) ? modalTemario.item.temas.length : 0} temas`}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setModalTemario(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Contenido del Temario */}
            <div className="p-6 overflow-y-auto space-y-4">
              {modalTemario.tipo === 'diplomado' ? (
                // Temario del Diplomado (Módulos y temas)
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Estructura Curricular y Módulos Oficiales
                  </div>
                  {Array.isArray(modalTemario.item.modulos) && modalTemario.item.modulos.length > 0 ? (
                    modalTemario.item.modulos.map((mod: any, mIdx: number) => (
                      <div 
                        key={mIdx}
                        className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 uppercase">
                            {(mod.codigo || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`).toUpperCase()}
                          </span>
                          {mod.docente && (
                            <span className="text-[10px] text-slate-400">
                              Docente: {mod.docente}
                            </span>
                          )}
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white uppercase">
                          {(mod.nombre || '').toUpperCase()}
                        </h4>

                        {/* Temas oficiales del módulo (desplegable por tema y sub-desplegable por partes) */}
                        {Array.isArray(mod.temas) && mod.temas.length > 0 ? (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-2">
                            {mod.temas.map((tema: any, tIdx: number) => {
                              const titTema = typeof tema === 'object' ? (tema.titulo || `Tema ${String(tIdx + 1).padStart(2, '0')}`) : String(tema);
                              const clasesTema = typeof tema === 'object' && Array.isArray(tema.clases) ? tema.clases : [];
                              const tienePartes = clasesTema.length > 0;
                              const progKey = modalTemario.item.id || modalTemario.item.codigo || 'dip';
                              const temaKey = `dip-${progKey}-${mIdx}-${tIdx}`;
                              const estaExpandido = Boolean(temasExpandidoModal[temaKey]);

                              return (
                                <div key={tIdx} className="rounded-xl border border-slate-200/70 dark:border-slate-800/80 bg-white dark:bg-slate-900/70 overflow-hidden">
                                  <button
                                    type="button"
                                    disabled={!tienePartes}
                                    onClick={() => {
                                      if (!tienePartes) return;
                                      setTemasExpandidoModal(prev => ({ ...prev, [temaKey]: !prev[temaKey] }));
                                    }}
                                    className={`w-full px-3 py-2.5 text-left flex items-center justify-between gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 ${
                                      tienePartes ? 'hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer' : 'cursor-default'
                                    }`}
                                  >
                                    <span className="flex items-start gap-2 min-w-0">
                                      <span className="size-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                                      <span className="leading-snug uppercase">{titTema.toUpperCase()}</span>
                                    </span>
                                    {tienePartes && (
                                      <span className="flex items-center gap-2 shrink-0">
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                                          {clasesTema.length} {clasesTema.length === 1 ? 'parte' : 'partes'}
                                        </span>
                                        {estaExpandido
                                          ? <ChevronUp className="size-4 text-indigo-500 shrink-0" />
                                          : <ChevronDown className="size-4 text-slate-400 shrink-0" />}
                                      </span>
                                    )}
                                  </button>

                                  {tienePartes && estaExpandido && (
                                    <div className="px-3 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2 bg-slate-50/60 dark:bg-slate-950/40">
                                      {clasesTema.map((cl: any, clIdx: number) => {
                                        const partKey = `${temaKey}-parte-${clIdx}`;
                                        const rawTitParte = typeof cl === 'object' ? (cl?.titulo || `Parte ${clIdx + 1}`) : String(cl);
                                        const matchParte = rawTitParte.match(/Parte\s*\d+/i);
                                        const etiquetaParte = matchParte
                                          ? `Parte ${matchParte[0].replace(/\D+/g, '') || (clIdx + 1)}`
                                          : rawTitParte.replace(/^Clase\s*\d+\s*[:\-]\s*/i, '').trim() || `Parte ${clIdx + 1}`;

                                        const resumenParte: ResumenData | null = typeof cl === 'object' ? parsearResumenTexto(cl?.resumenTexto) : null;
                                        const parrafo = resumenParte?.parrafo || '';
                                        const puntosClave: TemaClaveItem[] = resumenParte?.temasClave || [];
                                        const tieneResumen = Boolean(parrafo || puntosClave.length > 0);
                                        const parteExpandida = Boolean(partesExpandidoModal[partKey]);
                                        const puntosAbiertos = Boolean(puntosClaveModal[partKey]);

                                        return (
                                          <div key={clIdx} className="rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                                            <button
                                              type="button"
                                              disabled={!tieneResumen}
                                              onClick={() => {
                                                if (!tieneResumen) return;
                                                setPartesExpandidoModal(prev => ({ ...prev, [partKey]: !prev[partKey] }));
                                              }}
                                              className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-[11px] font-bold ${
                                                tieneResumen
                                                  ? 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer'
                                                  : 'text-slate-400 dark:text-slate-500 cursor-default'
                                              }`}
                                            >
                                              <span className="flex items-center gap-2 min-w-0">
                                                <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold shrink-0">
                                                  {etiquetaParte}
                                                </span>
                                                {!tieneResumen && (
                                                  <span className="text-[10px] font-medium text-slate-400 italic">
                                                    Sin resumen disponible
                                                  </span>
                                                )}
                                              </span>
                                              {tieneResumen && (
                                                parteExpandida
                                                  ? <ChevronUp className="size-3.5 text-indigo-500 shrink-0" />
                                                  : <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                                              )}
                                            </button>

                                            {tieneResumen && parteExpandida && (
                                              <div className="px-3.5 pb-3 pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5 bg-slate-50/40 dark:bg-slate-950/30">
                                                {parrafo && (
                                                  <div className="space-y-1.5">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                                                      Resumen del tema
                                                    </span>
                                                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                                      {parrafo}
                                                    </p>
                                                  </div>
                                                )}

                                                {puntosClave.length > 0 && (
                                                  <div className="space-y-2">
                                                    <button
                                                      type="button"
                                                      onClick={() => setPuntosClaveModal(prev => ({ ...prev, [partKey]: !prev[partKey] }))}
                                                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800/60 transition cursor-pointer"
                                                    >
                                                      <span>{puntosAbiertos ? 'Ocultar puntos clave' : `Ver puntos clave (${puntosClave.length})`}</span>
                                                      {puntosAbiertos ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                                    </button>

                                                    {puntosAbiertos && (
                                                      <ul className="space-y-1.5 pt-1">
                                                        {puntosClave.map((pk: TemaClaveItem, pkIdx: number) => (
                                                          <li key={pkIdx} className="text-[11px] text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                                                            <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                            <span>
                                                              {pk.titulo ? <strong className="text-slate-800 dark:text-slate-100">{pk.titulo}: </strong> : null}
                                                              {pk.descripcion}
                                                            </span>
                                                          </li>
                                                        ))}
                                                      </ul>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : Array.isArray(mod.clases) && mod.clases.length > 0 ? (
                          <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 space-y-1.5">
                            {mod.clases.map((clase: any, cIdx: number) => {
                              const titClase = typeof clase === 'object' ? (clase.titulo || 'Sesión') : String(clase);
                              return (
                                <div key={cIdx} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                  <span className="size-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                                  <span>{titClase}</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500">
                      Información curricular completa disponible en la guía académica oficial.
                    </div>
                  )}
                </div>
              ) : (
                // Temario del Curso (Temas colapsados por defecto: clic para resumen, clic para puntos clave)
                <div className="space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Contenido Oficial y Temas de Especialización
                  </div>
                  {Array.isArray(modalTemario.item.temas) && modalTemario.item.temas.length > 0 ? (
                    <div className="space-y-2.5">
                      {modalTemario.item.temas.map((tema: string, tIdx: number) => {
                        const leccionesCurso = Array.isArray(modalTemario.item.lecciones) ? modalTemario.item.lecciones : [];
                        const filasTema = leccionesCurso.filter((l: any) => (l.tema || '').trim() === tema.trim());
                        const resumenes: ResumenData[] = filasTema
                          .map((l: any) => parsearResumenTexto(l?.resumenTexto))
                          .filter((r: ResumenData | null): r is ResumenData => Boolean(r));
                        const parrafos = resumenes.map((r: ResumenData) => r.parrafo).filter(Boolean);
                        const puntosClave: TemaClaveItem[] = resumenes.flatMap((r: ResumenData) => r.temasClave || []);
                        const tieneContenido = parrafos.length > 0 || puntosClave.length > 0;
                        const temaKey = `cur-${tIdx}`;
                        const estaExpandido = Boolean(temasExpandidoModal[temaKey]);
                        const puntosAbiertos = Boolean(puntosClaveModal[temaKey]);

                        return (
                          <div 
                            key={tIdx}
                            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 overflow-hidden"
                          >
                            <button
                              type="button"
                              disabled={!tieneContenido}
                              onClick={() => {
                                if (!tieneContenido) return;
                                setTemasExpandidoModal(prev => ({ ...prev, [temaKey]: !prev[temaKey] }));
                              }}
                              className={`w-full p-3.5 text-left flex items-center justify-between gap-3 ${
                                tieneContenido ? 'hover:bg-slate-100/70 dark:hover:bg-slate-900/60 cursor-pointer' : 'cursor-default'
                              }`}
                            >
                              <div className="flex items-start gap-3 min-w-0">
                                <div className="size-6 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 grid place-items-center text-xs font-black shrink-0">
                                  {tIdx + 1}
                                </div>
                                <div className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-snug uppercase">
                                  {tema.toUpperCase()}
                                </div>
                              </div>
                              {tieneContenido && (
                                estaExpandido
                                  ? <ChevronUp className="size-4 text-indigo-500 shrink-0" />
                                  : <ChevronDown className="size-4 text-slate-400 shrink-0" />
                              )}
                            </button>

                            {tieneContenido && estaExpandido && (
                              <div className="px-4 pb-4 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 space-y-3 bg-white dark:bg-slate-900/50">
                                {parrafos.length > 0 && (
                                  <div className="space-y-1.5">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                                      Resumen del tema
                                    </span>
                                    {parrafos.map((p: string, pIdx: number) => (
                                      <p key={pIdx} className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {p}
                                      </p>
                                    ))}
                                  </div>
                                )}

                                {puntosClave.length > 0 && (
                                  <div className="space-y-2">
                                    <button
                                      type="button"
                                      onClick={() => setPuntosClaveModal(prev => ({ ...prev, [temaKey]: !prev[temaKey] }))}
                                      className="inline-flex items-center gap-1.5 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-800/60 transition cursor-pointer"
                                    >
                                      <span>{puntosAbiertos ? 'Ocultar puntos clave' : `Ver puntos clave (${puntosClave.length})`}</span>
                                      {puntosAbiertos ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                                    </button>

                                    {puntosAbiertos && (
                                      <ul className="space-y-1.5 pt-1">
                                        {puntosClave.map((pk: any, pkIdx: number) => (
                                          <li key={pkIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 leading-relaxed">
                                            <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                            <span>
                                              {pk.titulo ? <strong className="text-slate-800 dark:text-slate-100">{pk.titulo}: </strong> : null}
                                              {pk.descripcion}
                                            </span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-xs text-slate-600 dark:text-slate-400">
                      Este curso aún no tiene temas registrados en Supabase.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Pie del Modal */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/50">
              <span className="text-[11px] text-slate-500 inline-flex items-center gap-1.5">
                <Award className="size-3.5 text-indigo-500" />
                Certificación modular respaldada por EDUMIN
              </span>
              <button
                onClick={() => setModalTemario(null)}
                className="bg-slate-900 text-white dark:bg-slate-800 text-xs font-bold px-5 py-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
