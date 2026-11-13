'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Lock, 
  Award, 
  CheckCircle2, 
  XCircle,
  Sparkles, 
  ShieldCheck, 
  Tag, 
  ArrowUpRight, 
  ShoppingBag, 
  ChevronUp, 
  ChevronDown, 
  Search, 
  RotateCcw, 
  BarChart2, 
  Clock, 
  ArrowRight,
  PlayCircle,
  X,
  FileText,
GraduationCap,
  UserCheck,
  CircleDashed
} from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/context/theme-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { StudentPageHeader } from '@/components/dashboard/StudentPageHeader';
import { TarjetaBloqueoOverlay } from '@/components/dashboard/TarjetaBloqueoOverlay';
import { ALL_DIPLOMADOS, getDiplomadoBySlug, getDiplomadoByTitleOrSlug, DiplomadoCompleto } from '@/lib/data/diplomadosData';
import { parseDiplomadosFromProfile, formatearCodigoModulo, calcularAvanceModuloGranular } from '@/lib/utils/profileParser';
import configuracionExamenesJson from '@/lib/data/configuracion_examenes.json';

export default function DiplomadosPage() {
  const [paquete, setPaquete] = useState<string>('FULL');
  const [nombres, setNombres] = useState<string>('Estudiante');
  const [loading, setLoading] = useState(true);
  const [creditosDipDisponibles, setCreditosDipDisponibles] = useState<number>(0);
  const [diplomadosHabilitados, setDiplomadosHabilitados] = useState<number>(999);
  const { esOscuro } = useTheme();

  // Diplomados reales obtenidos dinámicamente desde Supabase
  const [diplomadosEstudianteReal, setDiplomadosEstudianteReal] = useState<any[]>([]);
  const [catalogoSupabase, setCatalogoSupabase] = useState<any[]>([]);

  // Estado para desplegables (acordeón) de diplomados
  const [diplomadosAbiertos, setDiplomadosAbiertos] = useState<Record<string, boolean>>({});
  const [tarjetaBloqueoVisibleId, setTarjetaBloqueoVisibleId] = useState<string | null>(null);

  const toggleDiplomado = (id: string) => {
    setDiplomadosAbiertos(prev => ({
      ...prev,
      [id]: prev[id] === undefined ? false : !prev[id]
    }));
  };

  // Control del despliegue del catálogo y filtro por píldoras de estado
  const [mostrarCatalogoAdicional, setMostrarCatalogoAdicional] = useState(false);
  const [filtroEstadoMatriculados, setFiltroEstadoMatriculados] = useState<'todos' | 'progreso' | 'completados'>('progreso');

  // Modal para ver detalles y temario de un diplomado
  const [modalDiplomado, setModalDiplomado] = useState<DiplomadoCompleto | null>(null);

  // Filtros interactivos y buscador superior del catálogo
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [nivelFiltro, setNivelFiltro] = useState<string>('Todos');

  // Separación por estado y filtrado activo según píldora seleccionada
  // Un diplomado pasa a Completados si y solo si tiene 100% de avance Y aprobó todos sus módulos
  const esDiplomadoCompletadoHelper = (diplomado: any) => {
    if (!diplomado.modulos || diplomado.modulos.length === 0) return false;
    const codDip = (diplomado.codigo || diplomado.id || '').toUpperCase();
    return diplomado.modulos.every((m: any, idx: number) => {
      const av = typeof m.avance === 'number' 
        ? m.avance 
        : calcularAvanceModuloGranular(m, idx, diplomado.completadosMap);
      const modCodKey = formatearCodigoModulo(m.codigo, idx);
      const confItem = (configuracionExamenesJson as Record<string, any>)[`${codDip}_${modCodKey}`];
      const noAplica = confItem?.aplica_examen === false;
      const notaMinima = Number(confItem?.nota_minima ?? 12);
      if (noAplica) return av === 100;
      const examRendido = Boolean(m.rendido || (m.nota !== undefined && m.nota !== null && Number(m.nota) > 0));
      const examAprobado = examRendido && m.nota !== undefined && m.nota !== null && Number(m.nota) >= notaMinima;
      return av === 100 && examAprobado;
    });
  };

  const diplomadosActivosFinales = diplomadosEstudianteReal;
  const diplomadosEnProgreso = diplomadosActivosFinales.filter(d => !esDiplomadoCompletadoHelper(d));
  const diplomadosCompletados = diplomadosActivosFinales.filter(d => esDiplomadoCompletadoHelper(d));

  const diplomadosMatriculadosMostrar = diplomadosActivosFinales.filter(d => {
    if (filtroEstadoMatriculados === 'progreso') return !esDiplomadoCompletadoHelper(d);
    if (filtroEstadoMatriculados === 'completados') return esDiplomadoCompletadoHelper(d);
    return true;
  });

  const listaCategorias = [
    'Todas', 
    'Minería & Geología', 
    'Seguridad & SSOMA', 
    'Gestión & Operaciones', 
    'Logística & Cadena de Suministro', 
    'Legal & Negocios'
  ];

  const listaNiveles = ['Todos', 'Especialización', 'Avanzado', 'Gerencial'];

  useEffect(() => {
    async function cargarPerfilYSupabase() {
      try {
        const [meRes, catRes] = await Promise.all([
          fetch('/api/dashboard/me').catch(() => null),
          fetch('/api/admin/catalogo').catch(() => null)
        ]);

        let liveDiplomados: any[] = [];
        if (catRes && catRes.ok) {
          const catData = await catRes.json();
          liveDiplomados = catData.diplomados || [];
          if (liveDiplomados.length > 0) {
            setCatalogoSupabase(liveDiplomados);
          }
        }

        if (meRes && meRes.ok) {
          const data = await meRes.json();
          const prof = data.profile;
          const matriculas = data.matriculas || [];

          if (data.eduminCredits?.diplomados?.disponibles !== undefined) {
            setCreditosDipDisponibles(data.eduminCredits.diplomados.disponibles);
          }
          if (data.eduminCredits?.diplomados?.habilitados !== undefined) {
            setDiplomadosHabilitados(data.eduminCredits.diplomados.habilitados);
          }

          if (prof) {
            if (prof.paquete_adquirido) setPaquete(prof.paquete_adquirido);
            if (prof.nombres) setNombres(prof.nombres);

            const listMap: any[] = [];
            const addedSlugs = new Set<string>();

            // Parsear diplomados JSON del perfil en Supabase
            const parsedDiplomadosJson = parseDiplomadosFromProfile(prof);
            const dipJsonBySlug = new Map<string, any>();
            parsedDiplomadosJson.forEach((d: any) => {
              const matched = getDiplomadoByTitleOrSlug(d.titulo || d.slug || d.id);
              if (matched) {
                const existing = dipJsonBySlug.get(matched.slug);
                if (!existing) {
                  dipJsonBySlug.set(matched.slug, d);
                } else {
                  const mergedCompMap = { ...existing.completadosMap, ...d.completadosMap };
                  const maxAvance = Math.max(existing.avance || 0, d.avance || 0);
                  dipJsonBySlug.set(matched.slug, {
                    ...existing,
                    ...d,
                    slug: matched.slug,
                    id: matched.slug,
                    avance: maxAvance,
                    completadosMap: mergedCompMap
                  });
                }
              }
            });

            // Helper para procesar e incluir un diplomado
            const agregarDiplomadoALista = (matched: any, dipJson?: any) => {
              if (addedSlugs.has(matched.slug)) return;
              addedSlugs.add(matched.slug);

              const compMap = dipJson?.completadosMap || {};

              // Buscar si existe versión en vivo actualizada desde Supabase (/api/admin/catalogo)
              const liveDip = liveDiplomados.find((ld: any) => 
                ld.id === matched.slug || 
                (ld.codigo && ld.codigo.toLowerCase() === matched.id?.toLowerCase()) ||
                (ld.codigo && matched.numId && ld.codigo.toLowerCase() === `dip-${String(matched.numId).padStart(2, '0')}`.toLowerCase()) ||
                (ld.titulo && matched.titulo && ld.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '') === matched.titulo.toLowerCase().replace(/[^a-z0-9]+/g, ''))
              );

              const modulosSource = (liveDip && Array.isArray(liveDip.modulos) && liveDip.modulos.length > 0)
                ? liveDip.modulos
                : matched.modulos;

              const modulosMap = modulosSource.map((mod: any, mIdx: number) => {
                const modJson = dipJson?.modulos?.[mIdx];
                const avanceMod = calcularAvanceModuloGranular(mod, mIdx, compMap, modJson);
                const codigoFormateado = formatearCodigoModulo(mod.codigo, mIdx);
                const nombreUpper = (mod.nombre || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`).toUpperCase();
                return {
                  id: codigoFormateado,
                  codigo: codigoFormateado,
                  nombre: nombreUpper,
                  titulo: `${codigoFormateado}: ${nombreUpper}`.toUpperCase(),
                  docente: mod.docente || '',
                  clases: mod.clases || [],
                  avance: avanceMod,
                  nota: modJson?.nota !== undefined ? Number(modJson.nota) : undefined,
                  rendido: Boolean(modJson?.rendido || (modJson?.nota !== undefined && modJson?.nota !== null && Number(modJson?.nota) > 0)),
                  completado: avanceMod === 100
                };
              });

              const sumAvanceModulos = modulosMap.reduce((acc: number, m: any) => acc + m.avance, 0);
              const avanceCalc = modulosMap.length > 0 
                ? Math.round(sumAvanceModulos / modulosMap.length) 
                : 0;
              const avanceGuardado = (typeof dipJson?.avance === 'number' && dipJson.avance > 0) ? dipJson.avance : 0;
              const avanceFinal = Math.max(avanceGuardado, avanceCalc);

              listMap.push({
                id: matched.slug,
                codigo: liveDip?.codigo || dipJson?.codigo || '',
                titulo: (liveDip?.titulo || matched.titulo).toUpperCase(),
                avance: avanceFinal,
                imagen: (liveDip?.imagen && !liveDip.imagen.includes('gestion-minera.webp'))
                ? liveDip.imagen
                : (matched.imagen || liveDip?.imagen || '/assets/images/daem/gestion-minera.webp'),
                completadosMap: compMap,
                modulos: modulosMap
              });
            };

            // 1. Diplomados JSON del perfil en Supabase (orden cronológico de matrícula/canje)
            parsedDiplomadosJson.forEach((dipJson) => {
              const matched = getDiplomadoByTitleOrSlug(dipJson.titulo || dipJson.slug);
              if (matched) {
                agregarDiplomadoALista(matched, dipJson);
              }
            });

            // 2. Matrículas de tipo DIPLOMADO en Supabase (respaldo para registros que no estén en el perfil)
            (matriculas || []).forEach((m: any) => {
              if (m.tipo === 'DIPLOMADO' || m.tipo === 'diplomado') {
                const matched = getDiplomadoByTitleOrSlug(m.titulo || m.item_id);
                if (matched) {
                  const dipJson = dipJsonBySlug.get(matched.slug);
                  agregarDiplomadoALista(matched, dipJson);
                }
              }
            });

            if (listMap.length > 0) {
              setDiplomadosEstudianteReal(listMap);
            }
          }
        }
      } catch (err) {
        console.error('Error cargando diplomados de Supabase:', err);
      } finally {
        setLoading(false);
      }
    }
    cargarPerfilYSupabase();
  }, []);

  const resetearFiltros = () => {
    setCategoriaFiltro('Todas');
    setNivelFiltro('Todos');
    setBusqueda('');
  };

  const normalizarTexto = (texto: string) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const listaDiplomadosCatalogo = (() => {
    const base = ALL_DIPLOMADOS.map((dip) => {
      const live = catalogoSupabase.find((c: any) => 
        c.id === dip.slug || 
        (c.codigo && dip.numId && c.codigo.toLowerCase() === `dip-${String(dip.numId).padStart(2, '0')}`.toLowerCase()) ||
        (c.titulo && dip.titulo && c.titulo.toLowerCase().replace(/[^a-z0-9]+/g, '') === dip.titulo.toLowerCase().replace(/[^a-z0-9]+/g, ''))
      );
      if (!live) return dip;
      return {
        ...dip,
        titulo: live.titulo || dip.titulo,
        categoria: live.categoria || dip.categoria,
        nivel: live.nivel ?? dip.nivel,
        modulosCount: Array.isArray(live.modulos) ? live.modulos.length : (live.num_modulos ?? dip.modulosCount),
        modulos: Array.isArray(live.modulos) && live.modulos.length > 0 ? live.modulos : dip.modulos,
        imagen: live.imagen || dip.imagen
      };
    });

    const extraSupabase = catalogoSupabase.filter((c: any) => {
      const cod = String(c.codigo || '').toUpperCase();
      return !base.some(b => `DIP-${String(b.numId).padStart(2, '0')}` === cod || b.titulo.toUpperCase() === String(c.titulo || '').toUpperCase());
    }).map((c: any, idx: number) => ({
      id: c.id,
      slug: c.id,
      numId: Number(String(c.codigo || '').replace(/[^0-9]/g, '')) || (base.length + idx + 1),
      titulo: c.titulo,
      categoria: c.categoria || 'Legal y cumplimiento',
      nivel: c.nivel ?? '',
      descripcion: '',
      precioRegular: c.precio || 150,
      precioOferta: c.precio || 150,
      listaModulosTitulos: [],
      modulosCount: Array.isArray(c.modulos) ? c.modulos.length : (c.num_modulos ?? 3),
      modulos: c.modulos || [],
      imagen: c.imagen || '/assets/images/daem/gestion-minera.webp'
    }));

    return [...base, ...extraSupabase];
  })();

  const diplomadosFiltrados = listaDiplomadosCatalogo.filter(dip => {
    const tituloNormalizado = normalizarTexto(dip.titulo);
    const busquedaNormalizada = normalizarTexto(busqueda);
    
    const coincideBusqueda = tituloNormalizado.includes(busquedaNormalizada);
    const coincideCategoria = categoriaFiltro === 'Todas' || dip.categoria === categoriaFiltro;
    const coincideNivel = nivelFiltro === 'Todos' || dip.nivel === nivelFiltro;
    
    return coincideBusqueda && coincideCategoria && coincideNivel;
  });

  const esIlimitado = paquete === 'ILIMITADO';

  if (loading) {
    return (
      <div className="w-full h-full min-h-[calc(100vh-5rem)] flex items-center justify-center">
        <DashboardLoader minHeight="min-h-full" />
      </div>
    );
  }

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 pb-24 transition-colors duration-300 ${esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-7xl mx-auto space-y-12">
        
        {/* Encabezado Unificado con StudentPageHeader */}
        <StudentPageHeader
          icon={GraduationCap}
          title="Mis diplomados"
          subtitle="Accede a tus diplomados activos o explora el catálogo de especializaciones."
          iconClassName={esIlimitado ? 'text-amber-500' : 'text-indigo-600'}
        />

        {/* ZONA DIPLOMADOS ACTIVOS O ESTADO SIN DIPLOMADO */}
        {diplomadosActivosFinales.length === 0 ? (
          <div className={`rounded-3xl p-8 text-center border shadow-sm ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="size-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 grid place-items-center mb-4">
              <Award className="size-8" />
            </div>
            <h3 className={`text-xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              Aún no cuentas con diplomados activos matriculados
            </h3>
            <p className={`mt-2 max-w-md mx-auto text-sm ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              {creditosDipDisponibles > 0
                ? `Tu cuenta posee ${creditosDipDisponibles} ${creditosDipDisponibles === 1 ? 'crédito disponible' : 'créditos disponibles'} para habilitar tus diplomados de especialización. Explora nuestro catálogo oficial y canjea tu cupo activo.`
                : 'Explora nuestra oferta oficial con diplomados de alta especialización o adquiere créditos para potenciar tu perfil profesional.'}
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/dashboard/canjear?tab=diplomados"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm inline-flex items-center gap-2"
              >
                <Sparkles className="size-4" /> {creditosDipDisponibles > 0 ? 'Canjear cupo disponible' : 'Explorar catálogo'}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* BARRA DE PÍLDORAS/TABS SUPERIORES DESLIZABLE EN MÓVIL */}
            <div className="flex items-center gap-2 overflow-x-auto max-w-full touch-pan-x pb-2 pr-4 border-b border-slate-200 dark:border-slate-800 no-scrollbar shrink-0">
              {/* EN PROGRESO (ÍNDIGO) */}
              <button
                onClick={() => setFiltroEstadoMatriculados('progreso')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  filtroEstadoMatriculados === 'progreso'
                    ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/20'
                    : (esOscuro ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')
                }`}
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>En progreso</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  filtroEstadoMatriculados === 'progreso' 
                    ? 'bg-white/20 text-white' 
                    : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                }`}>
                  {diplomadosEnProgreso.length}
                </span>
              </button>

              {/* COMPLETADOS (ESMERALDA) */}
              <button
                onClick={() => setFiltroEstadoMatriculados('completados')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  filtroEstadoMatriculados === 'completados'
                    ? 'bg-emerald-600 text-white border-transparent shadow-md shadow-emerald-600/20'
                    : (esOscuro ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Completados</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  filtroEstadoMatriculados === 'completados' 
                    ? 'bg-white/20 text-white' 
                    : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                }`}>
                  {diplomadosCompletados.length}
                </span>
              </button>

              {/* TODOS (SLATE) */}
              <button
                onClick={() => setFiltroEstadoMatriculados('todos')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
                  filtroEstadoMatriculados === 'todos'
                    ? 'bg-slate-800 text-white dark:bg-slate-700 border-transparent shadow-md shadow-slate-900/20'
                    : (esOscuro ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span>Todos</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  filtroEstadoMatriculados === 'todos' 
                    ? 'bg-white/20 text-white' 
                    : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                }`}>
                  {diplomadosActivosFinales.length}
                </span>
              </button>
            </div>

            {/* LISTA DE DIPLOMADOS FILTRADOS */}
            {diplomadosMatriculadosMostrar.length === 0 ? (
              <div className={`rounded-3xl p-8 sm:p-10 text-center border shadow-sm ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="size-14 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 grid place-items-center mb-4">
                  <ShoppingBag className="size-7" />
                </div>
                <h3 className={`text-lg sm:text-xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  {filtroEstadoMatriculados === 'progreso' ? '¡Has avanzado en todos tus programas!' : 'Aún no posees diplomados completados'}
                </h3>
                <p className={`mt-2 max-w-md mx-auto text-xs sm:text-sm leading-relaxed ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  Explora nuestra oferta oficial con 22 diplomados de alta especialización y adquiere un nuevo programa para potenciar tu perfil profesional.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                  <Link
                    href="/dashboard/canjear?tab=diplomados"
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm inline-flex items-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="size-4" /> Explorar catálogo de diplomados
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fadeIn">
                                {diplomadosMatriculadosMostrar.map((diplomado, dIdx) => {
                  const indexEnrolado = diplomadosActivosFinales.findIndex(dip => dip.id === diplomado.id);
                  const estaBloqueadoPorCuota = (indexEnrolado !== -1 ? indexEnrolado : dIdx) >= diplomadosHabilitados;
                  const esCompletado = esDiplomadoCompletadoHelper(diplomado);
                  const estaAbierto = diplomadosAbiertos[diplomado.id] !== false;

                  // Conteo exacto de módulos completados (requiere 100% de clases y examen aprobado si aplica)
                  const codDip = (diplomado.codigo || diplomado.id || '').toUpperCase();
                  const modulosCompletadosCount = diplomado.modulos.filter((m: any, idx: number) => {
                    const av = typeof m.avance === 'number' 
                      ? m.avance 
                      : calcularAvanceModuloGranular(m, idx, diplomado.completadosMap);
                    const modCodKey = formatearCodigoModulo(m.codigo, idx);
                    const confItem = (configuracionExamenesJson as Record<string, any>)[`${codDip}_${modCodKey}`];
                    const noAplica = confItem?.aplica_examen === false;
                    const notaMinima = Number(confItem?.nota_minima ?? 12);
                    if (noAplica) return av === 100;
                    const examRendido = Boolean(m.rendido || (m.nota !== undefined && m.nota !== null && Number(m.nota) > 0));
                    const examAprobado = examRendido && m.nota !== undefined && m.nota !== null && Number(m.nota) >= notaMinima;
                    return av === 100 && examAprobado;
                  }).length;
                  const porcentajeModulos = Math.round((modulosCompletadosCount / diplomado.modulos.length) * 100);

                  return (
                    <div key={diplomado.id} className="space-y-4">
                      
                      {/* Cabecera Tipo Acordeón para el Diplomado (Estilo Plano Limpio: altura constante para 1 o 2 líneas) */}
                      <div 
                        onClick={() => toggleDiplomado(diplomado.id)}
                        className="py-3 px-1 sm:px-2 border-b border-slate-200 dark:border-slate-800 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-6 select-none group min-h-[4.25rem]"
                      >
                        {/* Contenedor del título limpio (sin badge al costado) */}
                        <div className="flex-1 min-w-0 h-12 flex items-center">
                          <h2 
                            title={diplomado.titulo}
                            className={`text-base sm:text-lg font-bold tracking-tight line-clamp-2 leading-snug text-balance uppercase ${
                              esOscuro ? 'text-white' : 'text-slate-900'
                            }`}
                          >
                            {diplomado.titulo}
                          </h2>
                        </div>

                        {/* Contenedor derecho: badge Bloqueado si aplica, o barra de avance de módulos */}
                        <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                          {estaBloqueadoPorCuota ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-600 text-white shadow-sm border border-purple-400/30">
                              <Lock className="size-3.5" /> Bloqueado por cuota
                            </span>
                          ) : (
                            <div className="flex flex-col gap-1.5 min-w-[150px] sm:min-w-[180px]">
                              <div className="flex items-center justify-end">
                                <span className={`text-xs font-bold text-right ${
                                  esCompletado 
                                    ? (esOscuro ? 'text-emerald-400' : 'text-emerald-600') 
                                    : (esOscuro ? 'text-indigo-400' : 'text-indigo-600')
                                }`}>
                                  {modulosCompletadosCount} de {diplomado.modulos.length} módulos completados
                                </span>
                              </div>
                              <div className={`w-full h-2 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-200'}`}>
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${esCompletado ? 'bg-emerald-600' : 'bg-indigo-600'}`}
                                  style={{ width: `${porcentajeModulos}%` }}
                                />
                              </div>
                            </div>
                          )}

                          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-200 transition-colors">
                            {estaAbierto ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                          </div>
                        </div>
                      </div>

                      {/* Grilla de Tarjetitas por Módulo */}
                      {estaAbierto && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
                          {diplomado.modulos.map((modulo: any, idx: number) => {
                            const avanceModulo = typeof modulo.avance === 'number' 
                              ? modulo.avance 
                              : calcularAvanceModuloGranular(modulo, idx, diplomado.completadosMap);

                                                        // Verificar estado del examen del módulo
                            const modCodKey = formatearCodigoModulo(modulo.codigo, idx);
                            const confItem = (configuracionExamenesJson as Record<string, any>)[`${codDip}_${modCodKey}`];
                            const noAplica = confItem?.aplica_examen === false;
                            const notaMinimaMod = Number(confItem?.nota_minima ?? 12);

                            const examenRendido = Boolean(modulo.rendido || (modulo.nota !== undefined && modulo.nota !== null && Number(modulo.nota) > 0));
                            const examenAprobado = examenRendido && modulo.nota !== undefined && modulo.nota !== null && Number(modulo.nota) >= notaMinimaMod;
                            const examenDesaprobado = !noAplica && examenRendido && !examenAprobado;

                            // El estado Desaprobado solo aplica cuando ya llegó al 100% de avance de clases.
                            // Si va en < 100% (ej. 70%), sigue mostrando "Continuar clases" (En progreso).
                            const esModuloCompletado = noAplica ? avanceModulo === 100 : (avanceModulo === 100 && examenAprobado);
                            const esModuloDesaprobado100 = !noAplica && avanceModulo === 100 && examenDesaprobado;
                            const tieneExamenPendiente = !noAplica && avanceModulo === 100 && !examenRendido;
                            const esModuloPorIniciar = avanceModulo === 0;

                            const whatsappCuotaUrl = `https://wa.me/51984512809?text=${encodeURIComponent(
                              `Hola EDUMIN, deseo orientación para pagar mi siguiente cuota y habilitar el diplomado: ${diplomado.titulo}.`
                            )}`;
                            const whatsappSustitutorioUrl = `https://wa.me/51924400268?text=${encodeURIComponent(
                              `Hola EDUMIN, desaprobé el ${modCodKey} de ${diplomado.titulo}. Deseo adquirir el Examen Sustitutorio.`
                            )}`;

                            // Centralización de estilos e información por estado del módulo (Bloqueado = purple, Desaprobado = rose)
                            const infoEstadoModulo = estaBloqueadoPorCuota
                              ? {
                                  label: 'Bloqueado',
                                  Icono: Lock,
                                  badgeBg: 'bg-purple-600 border-purple-400/30 text-white',
                                  duracionIconColor: 'text-purple-400',
                                  porcentajeColor: esOscuro ? 'text-purple-400' : 'text-purple-600',
                                  barraBg: 'bg-purple-600',
                                  botonBg: 'bg-purple-600 hover:bg-purple-700 shadow-purple-600/20 text-white font-bold cursor-pointer',
                                  botonTexto: 'Pagar cuota',
                                  enlaceHref: whatsappCuotaUrl
                                }
                              : esModuloDesaprobado100
                              ? {
                                  label: 'Examen desaprobado',
                                  Icono: XCircle,
                                  badgeBg: 'bg-rose-600 border-rose-400/30 text-white',
                                  duracionIconColor: 'text-rose-400',
                                  porcentajeColor: esOscuro ? 'text-rose-400' : 'text-rose-600',
                                  barraBg: 'bg-rose-600',
                                  botonBg: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 text-white font-bold cursor-pointer',
                                  botonTexto: 'Pagar sustitutorio',
                                  enlaceHref: `/dashboard/diplomados/${diplomado.id}?modulo=${modulo.id}&accion=examen`
                                }
                              : tieneExamenPendiente
                              ? {
                                  label: 'Examen pendiente',
                                  Icono: FileText,
                                  badgeBg: 'bg-amber-500 border-amber-300/40 text-white',
                                  duracionIconColor: 'text-amber-400',
                                  porcentajeColor: esOscuro ? 'text-amber-400' : 'text-amber-600',
                                  barraBg: 'bg-amber-500',
                                  botonBg: 'bg-amber-500 group-hover:bg-amber-600 shadow-amber-500/20 text-white font-bold',
                                  botonTexto: 'Dar examen',
                                  enlaceHref: `/dashboard/diplomados/${diplomado.id}?modulo=${modulo.id}&accion=examen`
                                }
                              : esModuloCompletado
                              ? {
                                  label: 'Completado',
                                  Icono: CheckCircle2,
                                  badgeBg: 'bg-emerald-600 border-emerald-400/30 text-white',
                                  duracionIconColor: 'text-emerald-400',
                                  porcentajeColor: esOscuro ? 'text-emerald-400' : 'text-emerald-600',
                                  barraBg: 'bg-emerald-600',
                                  botonBg: 'bg-emerald-600 group-hover:bg-emerald-700 shadow-emerald-600/20 text-white font-bold',
                                  botonTexto: 'Repasar clases',
                                  enlaceHref: `/dashboard/diplomados/${diplomado.id}?modulo=${modulo.id}`
                                }
                              : esModuloPorIniciar
                              ? {
                                  label: 'Por iniciar',
                                  Icono: CircleDashed,
                                  badgeBg: 'bg-slate-700 border-slate-500/30 text-white',
                                  duracionIconColor: 'text-slate-400',
                                  porcentajeColor: esOscuro ? 'text-slate-400' : 'text-slate-700',
                                  barraBg: 'bg-slate-700',
                                  botonBg: 'bg-slate-700 group-hover:bg-slate-800 text-white font-bold shadow-slate-700/20',
                                  botonTexto: 'Iniciar clases',
                                  enlaceHref: `/dashboard/diplomados/${diplomado.id}?modulo=${modulo.id}`
                                }
                              : {
                                  label: 'En progreso',
                                  Icono: Clock,
                                  badgeBg: 'bg-indigo-600 border-indigo-400/30 text-white',
                                  duracionIconColor: 'text-indigo-400',
                                  porcentajeColor: esOscuro ? 'text-indigo-400' : 'text-indigo-600',
                                  barraBg: 'bg-indigo-600',
                                  botonBg: 'bg-indigo-600 group-hover:bg-indigo-700 shadow-indigo-600/20 text-white font-bold',
                                  botonTexto: 'Continuar clases',
                                  enlaceHref: `/dashboard/diplomados/${diplomado.id}?modulo=${modulo.id}`
                                };

                            const IconoEstadoMod = infoEstadoModulo.Icono;
                            const cardBloqueoKey = `${diplomado.id}-${modulo.id}`;
                            const mostrarMensajeBloqueo = estaBloqueadoPorCuota && tarjetaBloqueoVisibleId === cardBloqueoKey;

                            const contenidoTarjetaModulo = (
                              <>
                                {/* Portada del Módulo */}
                                <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                                  <img 
                                    src={diplomado.imagen} 
                                    alt={modulo.titulo}
                                    className={`object-cover w-full h-full transition-transform duration-300 ${
                                      estaBloqueadoPorCuota ? 'opacity-65' : 'opacity-90 group-hover:scale-105'
                                    }`}
                                  />
                                  <div className="absolute top-3 inset-x-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none z-10">
                                    <span className="text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shrink-0 uppercase tracking-wide">
                                      {formatearCodigoModulo(modulo.codigo || modulo.id, idx).toUpperCase()}
                                    </span>
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border backdrop-blur-md shrink-0 ${infoEstadoModulo.badgeBg}`}>
                                      <IconoEstadoMod className="size-3.5" /> {infoEstadoModulo.label}
                                    </span>
                                  </div>

                                  <TarjetaBloqueoOverlay
                                    visible={mostrarMensajeBloqueo}
                                    onAutoHide={() =>
                                      setTarjetaBloqueoVisibleId((prev) =>
                                        prev === cardBloqueoKey ? null : prev
                                      )
                                    }
                                  />
                                </div>

                                {/* CUERPO CON ALINEACIÓN VERTICAL UNIFORME */}
                                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                  <div className="space-y-3">
                                    <div className="h-12 flex items-start overflow-hidden">
                                      <h3 className={`text-base font-bold leading-snug line-clamp-2 text-balance uppercase ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                                        {modulo.titulo.toUpperCase()}
                                      </h3>
                                    </div>
                                  </div>

                                  {/* BLOQUE DE AVANCE DEL MÓDULO */}
                                  <div className="space-y-1.5 pt-2">
                                    <div className="flex items-center justify-between text-xs font-bold">
                                      <span className={esOscuro ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>
                                        Avance
                                      </span>
                                      <span className={`font-bold ${infoEstadoModulo.porcentajeColor}`}>
                                        {avanceModulo}% completado
                                      </span>
                                    </div>
                                    <div className={`w-full h-2 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                      <div 
                                        className={`h-full rounded-full transition-all duration-500 ${infoEstadoModulo.barraBg}`} 
                                        style={{ width: `${avanceModulo}%` }}
                                      />
                                    </div>
                                  </div>
                                </div>

                                {/* Pie de Tarjetita con 1 Solo Botón Limpio */}
                                <div className={`px-6 pb-6 pt-3 border-t flex items-center justify-end ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                                  {estaBloqueadoPorCuota ? (
                                    <a
                                      href={whatsappCuotaUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className={`w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center shadow-sm ${infoEstadoModulo.botonBg}`}
                                    >
                                      <span>{infoEstadoModulo.botonTexto}</span>
                                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform hover:translate-x-0.5" />
                                    </a>
                                  ) : esModuloDesaprobado100 ? (
                                    <a
                                      href={whatsappSustitutorioUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      onClick={(e) => e.stopPropagation()}
                                      className={`w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center shadow-sm ${infoEstadoModulo.botonBg}`}
                                    >
                                      <span>{infoEstadoModulo.botonTexto}</span>
                                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform hover:translate-x-0.5" />
                                    </a>
                                  ) : (
                                    <div className={`w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center shadow-sm ${infoEstadoModulo.botonBg}`}>
                                      <span>{infoEstadoModulo.botonTexto}</span>
                                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform group-hover:translate-x-0.5" />
                                    </div>
                                  )}
                                </div>
                              </>
                            );

                            if (estaBloqueadoPorCuota) {
                              return (
                                <div
                                  key={modulo.id}
                                  onClick={() => setTarjetaBloqueoVisibleId(prev => prev === cardBloqueoKey ? null : cardBloqueoKey)}
                                  className={`group rounded-2xl overflow-hidden shadow-sm border flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                                    esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                                  }`}
                                >
                                  {contenidoTarjetaModulo}
                                </div>
                              );
                            }

                            if (esModuloDesaprobado100) {
                              return (
                                <div
                                  key={modulo.id}
                                  className={`group rounded-2xl overflow-hidden shadow-sm border flex flex-col justify-between transition-all hover:shadow-md ${
                                    esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                                  }`}
                                >
                                  <Link href={infoEstadoModulo.enlaceHref} className="flex-1 flex flex-col cursor-pointer">
                                    <div className="relative h-44 w-full bg-slate-800 overflow-hidden">
                                      <img
                                        src={diplomado.imagen}
                                        alt={modulo.titulo}
                                        className="object-cover w-full h-full transition-transform duration-300 opacity-90 group-hover:scale-105"
                                      />
                                      <div className="absolute top-3 inset-x-3 flex flex-wrap items-center justify-between gap-1.5 pointer-events-none z-10">
                                        <span className="text-[11px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 shrink-0 uppercase tracking-wide">
                                          {formatearCodigoModulo(modulo.codigo || modulo.id, idx).toUpperCase()}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border backdrop-blur-md shrink-0 ${infoEstadoModulo.badgeBg}`}>
                                          <IconoEstadoMod className="size-3.5" /> {infoEstadoModulo.label}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                                      <div className="space-y-3">
                                        <div className="h-12 flex items-start overflow-hidden">
                                          <h3 className={`text-base font-bold leading-snug line-clamp-2 text-balance uppercase ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                                            {modulo.titulo.toUpperCase()}
                                          </h3>
                                        </div>
                                      </div>
                                      <div className="space-y-1.5 pt-2">
                                        <div className="flex items-center justify-between text-xs font-bold">
                                          <span className={esOscuro ? 'text-slate-400 font-medium' : 'text-slate-500 font-medium'}>Avance</span>
                                          <span className={`font-bold ${infoEstadoModulo.porcentajeColor}`}>{avanceModulo}% completado</span>
                                        </div>
                                        <div className={`w-full h-2 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                          <div className={`h-full rounded-full transition-all duration-500 ${infoEstadoModulo.barraBg}`} style={{ width: `${avanceModulo}%` }} />
                                        </div>
                                      </div>
                                    </div>
                                  </Link>
                                  <div className={`px-6 pb-6 pt-3 border-t flex items-center justify-end ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                                    <a
                                      href={whatsappSustitutorioUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`w-full sm:w-auto text-xs font-bold px-5 py-2.5 rounded-xl transition-all inline-flex items-center justify-center shadow-sm ${infoEstadoModulo.botonBg}`}
                                    >
                                      <span>{infoEstadoModulo.botonTexto}</span>
                                      <ArrowRight className="w-3.5 h-3.5 ml-1.5 transition-transform hover:translate-x-0.5" />
                                    </a>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <Link
                                key={modulo.id} 
                                href={infoEstadoModulo.enlaceHref}
                                className={`group rounded-2xl overflow-hidden shadow-sm border flex flex-col justify-between transition-all hover:shadow-md cursor-pointer ${
                                  esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                                }`}
                              >
                                {contenidoTarjetaModulo}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 2: CATÁLOGO AMPLIADO Y CRÉDITOS DISPONIBLES */}
        <div className={`pt-6 border-t ${esOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block">Catálogo Ampliado EDUMIN</span>
                {creditosDipDisponibles > 0 && (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase px-2 py-0.5 rounded-full">
                    {creditosDipDisponibles} {creditosDipDisponibles === 1 ? 'crédito disponible' : 'créditos disponibles'}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold">
                {creditosDipDisponibles > 0 
                  ? `Tienes ${creditosDipDisponibles} ${creditosDipDisponibles === 1 ? 'diplomado disponible' : 'diplomados disponibles'} para canjear`
                  : '¿Deseas adquirir más diplomados oficiales?'}
              </h3>
              <p className="text-xs text-slate-300">
                {creditosDipDisponibles > 0
                  ? `Explora el catálogo oficial de los ${listaDiplomadosCatalogo.length || 22} diplomados de alta especialización y elige tu próximo programa sin costo adicional.`
                  : 'Amplía tu paquete adquiriendo nuevos créditos de diplomados de alta especialización para potenciar tu perfil profesional.'}
              </p>
            </div>
            
            <Link
              href="/dashboard/canjear?tab=diplomados"
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2 text-sm shrink-0 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>
                {creditosDipDisponibles > 0
                  ? (creditosDipDisponibles === 1 ? 'Canjear mi diplomado' : 'Canjear mis diplomados')
                  : 'Adquirir más diplomados'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

      </div>

      </main>
  );
}

