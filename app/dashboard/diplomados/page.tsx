'use client';

import { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Award, 
  CheckCircle2, 
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
  X,
  FileText,
  Wrench,
  GraduationCap,
  UserCheck
} from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/context/theme-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { ALL_DIPLOMADOS, getDiplomadoBySlug, DiplomadoCompleto } from '@/lib/data/diplomadosData';

export default function DiplomadosPage() {
  const [paquete, setPaquete] = useState<string>('FULL');
  const [nombres, setNombres] = useState<string>('Estudiante');
  const [loading, setLoading] = useState(true);
  const { esOscuro } = useTheme();

  // Control del despliegue del catálogo y filtro por píldoras de estado
  const [mostrarCatalogoAdicional, setMostrarCatalogoAdicional] = useState(false);
  const [filtroEstadoMatriculados, setFiltroEstadoMatriculados] = useState<'todos' | 'progreso' | 'completados'>('todos');

  // Modal para ver detalles y temario de un diplomado
  const [modalDiplomado, setModalDiplomado] = useState<DiplomadoCompleto | null>(null);

  // ESTADO DE SIMULACIÓN DEV (SOLO DESARROLLO INTERNO)
  const [estadoSimuladoDev, setEstadoSimuladoDev] = useState<'sin_diplomado' | 'curso' | 'completado' | 'dos_diplomados'>('curso');
  const [mostrarPanelDev, setMostrarPanelDev] = useState(true);

  // Filtros interactivos y buscador superior del catálogo
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [nivelFiltro, setNivelFiltro] = useState<string>('Todos');

  // Datos completos de los diplomados habilitados activados desde los JSONs
  const derechoMineroData = getDiplomadoBySlug('derecho-minero');
  const planillasData = getDiplomadoBySlug('legislacion-laboral-y-elaboracion-de-planillas');
  const seguridadSaludData = getDiplomadoBySlug('seguridad-y-salud-ocupacional-en-la-industria-y-mineria');

  // Construcción dinámica de diplomados activos según el Simulador Dev usando los JSONs
  const diplomadosActivosSimulados = [
    {
      id: 'derecho-minero',
      titulo: derechoMineroData?.titulo || 'DERECHO MINERO',
      avance: estadoSimuladoDev === 'completado' ? 100 : 45,
      imagen: derechoMineroData?.imagen || "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
      modulos: (derechoMineroData?.modulos || []).map((m) => ({
        id: m.codigo,
        titulo: `${m.codigo}: ${m.nombre}`,
        docente: m.docente
      }))
    },
    ...(estadoSimuladoDev === 'dos_diplomados' && planillasData ? [{
      id: planillasData.slug,
      titulo: planillasData.titulo,
      avance: 20,
      imagen: planillasData.imagen,
      modulos: planillasData.modulos.map((m) => ({
        id: m.codigo,
        titulo: `${m.codigo}: ${m.nombre}`,
        docente: m.docente
      }))
    }] : []),
    ...(estadoSimuladoDev === 'dos_diplomados' && seguridadSaludData ? [{
      id: seguridadSaludData.slug,
      titulo: seguridadSaludData.titulo,
      avance: 100,
      imagen: seguridadSaludData.imagen,
      modulos: seguridadSaludData.modulos.map((m) => ({
        id: m.codigo,
        titulo: `${m.codigo}: ${m.nombre}`,
        docente: m.docente
      }))
    }] : [])
  ];

  const diplomadosEnProgreso = diplomadosActivosSimulados.filter(d => d.avance < 100);
  const diplomadosCompletados = diplomadosActivosSimulados.filter(d => d.avance >= 100);

  const diplomadosMatriculadosMostrar = diplomadosActivosSimulados.filter(d => {
    if (filtroEstadoMatriculados === 'progreso') return d.avance < 100;
    if (filtroEstadoMatriculados === 'completados') return d.avance >= 100;
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
    async function cargarPerfil() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('nombres, paquete_adquirido')
          .eq('id', user.id)
          .single();
        if (profile) {
          if (profile.paquete_adquirido) setPaquete(profile.paquete_adquirido);
          if (profile.nombres) setNombres(profile.nombres);
        }
      }
      setLoading(false);
    }
    cargarPerfil();
  }, []);

  const resetearFiltros = () => {
    setCategoriaFiltro('Todas');
    setNivelFiltro('Todos');
    setBusqueda('');
  };

  const normalizarTexto = (texto: string) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const diplomadosFiltrados = ALL_DIPLOMADOS.filter(dip => {
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
      <DashboardLoader 
        title="Cargando experiencia académica..." 
        subtitle="Consultando tus diplomados y programas de especialización" 
      />
    );
  }

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 pb-24 transition-colors duration-300 ${esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-6xl mx-auto space-y-12">
        
        {/* Encabezado Limpio */}
        <header className="mb-10">
          <h1 className={`text-3xl font-bold tracking-tight flex items-center gap-3 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
            <GraduationCap className={`w-8 h-8 ${esIlimitado ? 'text-amber-500' : 'text-indigo-600'}`} />
            Mis Diplomados y Programas
          </h1>
          <p className={`mt-2 text-sm sm:text-base ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
            Accede a tus diplomados activos o explora el catálogo de especializaciones.
          </p>
        </header>

        {/* ZONA DIPLOMADOS ACTIVOS O ESTADO SIN DIPLOMADO */}
        {estadoSimuladoDev === 'sin_diplomado' ? (
          <div className={`rounded-3xl p-8 text-center border shadow-sm ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            <div className="size-16 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 grid place-items-center mb-4">
              <Award className="size-8" />
            </div>
            <h3 className={`text-xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              Aún no has seleccionado tu diplomado principal
            </h3>
            <p className={`mt-2 max-w-md mx-auto text-sm ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              Tu cuenta posee créditos disponibles para habilitar tus diplomados de especialización. Explora nuestro catálogo oficial o canjea tu cupo activo.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                href="/dashboard/canjear"
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm inline-flex items-center gap-2"
              >
                <Sparkles className="size-4" /> Canjear cupo disponible
              </Link>
              <button
                onClick={() => setMostrarCatalogoAdicional(true)}
                className={`text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm inline-flex items-center gap-2 ${
                  esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                <BookOpen className="size-4" /> Explorar catálogo
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* BARRA DE PÍLDORAS/TABS SUPERIORES */}
            <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setFiltroEstadoMatriculados('todos')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  filtroEstadoMatriculados === 'todos'
                    ? (esIlimitado ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20')
                    : (esOscuro ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200')
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Todos los diplomados</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  filtroEstadoMatriculados === 'todos' ? 'bg-white/20 text-white' : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                }`}>
                  {diplomadosActivosSimulados.length}
                </span>
              </button>

              <button
                onClick={() => setFiltroEstadoMatriculados('progreso')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  filtroEstadoMatriculados === 'progreso'
                    ? (esIlimitado ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20')
                    : (esOscuro ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200')
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>En progreso</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  filtroEstadoMatriculados === 'progreso' ? 'bg-white/20 text-white' : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                }`}>
                  {diplomadosEnProgreso.length}
                </span>
              </button>

              <button
                onClick={() => setFiltroEstadoMatriculados('completados')}
                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  filtroEstadoMatriculados === 'completados'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : (esOscuro ? 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200')
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Completados</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                  filtroEstadoMatriculados === 'completados' ? 'bg-white/20 text-white' : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
                }`}>
                  {diplomadosCompletados.length}
                </span>
              </button>
            </div>

            {/* LISTA DE DIPLOMADOS FILTRADOS */}
            {diplomadosMatriculadosMostrar.length === 0 ? (
              <div className={`rounded-3xl p-10 text-center border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                <p className="text-sm font-medium">
                  No tienes diplomados en la sección &quot;{filtroEstadoMatriculados === 'progreso' ? 'En progreso' : 'Completados'}&quot;.
                </p>
              </div>
            ) : (
              <div className="space-y-8 animate-fadeIn">
                {diplomadosMatriculadosMostrar.map((diplomado) => {
                  const esCompletado = diplomado.avance >= 100;
                  return (
                    <div 
                      key={diplomado.id} 
                      className={`rounded-3xl overflow-hidden shadow-sm border ${esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}
                    >
                      <div className="flex flex-col md:flex-row">
                        
                        <div className="relative w-full md:w-2/5 lg:w-1/3 min-h-[250px] bg-slate-800">
                          <img 
                            src={diplomado.imagen} 
                            alt={diplomado.titulo} 
                            className="absolute inset-0 w-full h-full object-cover opacity-90"
                          />
                          <div className="absolute top-4 left-4">
                            <span className="text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5">
                              <ShieldCheck className="size-3.5" /> Acceso Completo
                            </span>
                          </div>
                          <div className="absolute top-4 right-4">
                            {esCompletado ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-md bg-emerald-600/90 text-white border-emerald-400/30">
                                <CheckCircle2 className="size-3.5 text-white" /> Estado: Completado
                              </span>
                            ) : (
                              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider border backdrop-blur-md shadow-md ${
                                esIlimitado ? 'bg-amber-500/90 text-white border-amber-400/30' : 'bg-indigo-600/90 text-white border-indigo-400/30'
                              }`}>
                                <Clock className="size-3.5 animate-pulse" /> Estado: En Progreso
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
                          <div>
                            <h3 className={`text-xl sm:text-2xl font-black uppercase leading-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                              {diplomado.titulo}
                            </h3>
                            
                            <div className="mt-5 space-y-2 max-w-sm">
                              <div className="flex justify-between text-xs font-bold">
                                <span className={`flex items-center gap-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                                  <BarChart2 className={`size-4 ${esCompletado ? 'text-emerald-500' : (esIlimitado ? 'text-amber-500' : 'text-indigo-500')}`} /> 
                                  Avance del Diplomado
                                </span>
                                <span className={esCompletado ? (esOscuro ? 'text-emerald-400' : 'text-emerald-600') : (esIlimitado ? 'text-amber-500' : 'text-indigo-500')}>
                                  {diplomado.avance}%
                                </span>
                              </div>
                              <div className={`w-full h-2.5 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                <div 
                                  className={`h-full rounded-full transition-all duration-500 ${esCompletado ? 'bg-emerald-500' : (esIlimitado ? 'bg-amber-500' : 'bg-indigo-600')}`}
                                  style={{ width: `${diplomado.avance}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-3 mt-6">
                            {diplomado.modulos.map((modulo) => (
                              <div key={modulo.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all gap-3 ${esOscuro ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                <div className="flex items-center gap-3">
                                  <BookOpen className={`w-5 h-5 shrink-0 ${esCompletado ? 'text-emerald-500' : (esIlimitado ? 'text-amber-500' : 'text-indigo-500')}`} />
                                  <div>
                                    <span className={`font-semibold text-xs sm:text-sm block ${esOscuro ? 'text-slate-200' : 'text-slate-800'}`}>
                                      {modulo.titulo}
                                    </span>
                                    {modulo.docente && (
                                      <span className={`text-[10px] font-medium block mt-0.5 ${esOscuro ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        👨‍🏫 Docente: {modulo.docente}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <Link 
                                  href={`/dashboard/diplomados/${diplomado.id}?modulo=${modulo.id}`} 
                                  className={`text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm shrink-0 justify-center ${
                                    esCompletado ? 'bg-emerald-600 hover:bg-emerald-500' : (esIlimitado ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500')
                                  }`}
                                >
                                  <span>{esCompletado ? 'Repasar clases' : 'Ver clases'}</span>
                                  <ArrowRight className="w-4 h-4" />
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* SECCIÓN 2: BOTÓN DESPLEGABLE DE ADQUISICIÓN O CANJE */}
        <div className={`pt-6 border-t ${esOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className={`text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 ${esIlimitado ? 'bg-gradient-to-r from-slate-900 to-amber-950' : 'bg-gradient-to-r from-slate-900 to-indigo-950'}`}>
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest block mb-1 ${esIlimitado ? 'text-amber-400' : 'text-indigo-400'}`}>Catálogo Ampliado EDUMIN</span>
              <h3 className="text-xl font-bold">{esIlimitado ? 'Aprovecha tus beneficios ilimitados' : '¿Deseas adquirir más Diplomados especializados?'}</h3>
              <p className="text-xs text-slate-300 mt-1">Explora nuestra oferta completa con los 22 programas oficiales de alta especialización.</p>
            </div>
            
            <button
              onClick={() => setMostrarCatalogoAdicional(!mostrarCatalogoAdicional)}
              className={`text-white font-bold px-6 py-3.5 rounded-2xl transition-all shadow-lg flex items-center gap-2 text-sm shrink-0 ${esIlimitado ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/30'}`}
            >
              {esIlimitado ? <Sparkles className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
              {mostrarCatalogoAdicional ? 'Ocultar Catálogo' : (esIlimitado ? 'Ver Diplomados Incluidos' : 'Adquirir más diplomados')}
              {mostrarCatalogoAdicional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* CONTENIDO DESPLEGABLE CON FILTROS Y ETIQUETAS */}
          {mostrarCatalogoAdicional && (
            <div className="mt-8 space-y-6 transition-all animate-fadeIn">
              
              <div className={`p-6 rounded-3xl shadow-sm border space-y-4 ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  
                  {/* Filtro 1: Buscador */}
                  <div className="sm:col-span-6">
                    <label className={`block text-xs font-bold mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                      🔎 Búsqueda por Nombre o Palabra Clave
                    </label>
                    <div className="relative">
                      <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Buscar programas... (Ej: logistica, gestion)"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={`w-full border rounded-2xl pl-11 pr-4 py-2.5 text-xs focus:outline-none focus:ring-2 shadow-sm ${
                          esOscuro ? 'bg-slate-950 border-slate-800 text-white placeholder-slate-500 focus:ring-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-900 focus:ring-indigo-600'
                        } ${esIlimitado && 'focus:ring-amber-500'}`}
                      />
                    </div>
                  </div>

                  {/* Filtro 2: Categoría */}
                  <div className="sm:col-span-3">
                    <label className={`block text-xs font-bold mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                      📁 Área de Especialización
                    </label>
                    <select
                      value={categoriaFiltro}
                      onChange={(e) => setCategoriaFiltro(e.target.value)}
                      className={`w-full border text-xs font-semibold p-2.5 rounded-2xl focus:outline-none focus:ring-2 cursor-pointer ${
                        esOscuro ? 'bg-slate-950 border-slate-800 text-white focus:ring-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600'
                      } ${esIlimitado && 'focus:ring-amber-500'}`}
                    >
                      {listaCategorias.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  {/* Filtro 3: Nivel */}
                  <div className="sm:col-span-3">
                    <label className={`block text-xs font-bold mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                      🎓 Nivel del Diplomado
                    </label>
                    <select
                      value={nivelFiltro}
                      onChange={(e) => setNivelFiltro(e.target.value)}
                      className={`w-full border text-xs font-semibold p-2.5 rounded-2xl focus:outline-none focus:ring-2 cursor-pointer ${
                        esOscuro ? 'bg-slate-950 border-slate-800 text-white focus:ring-indigo-600' : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-indigo-600'
                      } ${esIlimitado && 'focus:ring-amber-500'}`}
                    >
                      {listaNiveles.map(niv => <option key={niv} value={niv}>{niv}</option>)}
                    </select>
                  </div>

                </div>

                <div className={`pt-3 flex items-center justify-end gap-3 border-t ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                  <button 
                    onClick={resetearFiltros}
                    className="inline-flex items-center gap-1.5 text-slate-400 hover:text-white text-xs font-semibold px-4 py-2 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Resetear filtros
                  </button>
                </div>
              </div>

              {/* GRILLA DE CATÁLOGO CON BOTÓN VER DETALLES */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {diplomadosFiltrados.length === 0 ? (
                  <div className={`col-span-full rounded-3xl p-12 text-center border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-400' : 'bg-white border-slate-200 text-slate-500'}`}>
                    <p className="text-sm font-medium">No se encontraron diplomados que coincidan con tu búsqueda.</p>
                  </div>
                ) : (
                  diplomadosFiltrados.map((dip) => (
                    <article 
                      key={dip.id} 
                      className={`relative overflow-hidden rounded-3xl shadow-sm border flex flex-col justify-between transition-all hover:shadow-md ${
                        esOscuro 
                          ? `bg-slate-900 border-slate-800 ${esIlimitado ? 'hover:border-amber-500/50' : 'hover:border-indigo-500/50'}`
                          : 'bg-white border-slate-200 hover:border-indigo-300'
                      }`}
                    >
                      {/* Portada de Imagen */}
                      <div className="relative h-44 w-full bg-slate-800">
                        <img 
                          src={dip.imagen} 
                          alt={dip.titulo}
                          className="object-cover w-full h-full opacity-90"
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                            {dip.categoria}
                          </span>
                        </div>
                      </div>

                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <span className={`text-[10px] font-bold ${esIlimitado ? 'text-amber-500' : (esOscuro ? 'text-indigo-400' : 'text-indigo-600')}`}>
                            {dip.nivel}
                          </span>
                          <span className={`text-xs font-bold ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                            {String(dip.modulosCount).padStart(2, '0')} Módulos
                          </span>
                        </div>

                        <h3 className={`text-sm font-bold leading-snug ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                          {dip.titulo}
                        </h3>

                        <div className="mt-4 flex items-baseline gap-2">
                          {esIlimitado ? (
                            <>
                              <span className={`text-xl font-black ${esOscuro ? 'text-amber-400' : 'text-amber-600'}`}>Incluido</span>
                              <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold border ${esOscuro ? 'bg-amber-500/10 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                                <Sparkles className="size-3" /> Plan Ilimitado
                              </span>
                            </>
                          ) : (
                            <>
                              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 line-through">S/ {dip.precioRegular}</span>
                              <span className={`text-xl font-black ${esOscuro ? 'text-emerald-400' : 'text-emerald-600'}`}>S/ {dip.precioOferta}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className={`px-6 pb-6 pt-4 border-t flex items-center justify-between gap-3 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                          esIlimitado 
                            ? (esOscuro ? 'text-amber-400' : 'text-amber-600') 
                            : (esOscuro ? 'text-emerald-400' : 'text-emerald-600')
                        }`}>
                          {esIlimitado ? <Sparkles className="size-3" /> : <Tag className="size-3" />} 
                          {esIlimitado ? 'Beneficio exclusivo' : 'Oferta actual'}
                        </span>

                        <button
                          onClick={() => setModalDiplomado(dip)}
                          className={`inline-flex items-center gap-1.5 rounded-xl text-white px-4 py-2.5 text-xs font-bold transition shadow-sm shrink-0 ${
                            esIlimitado ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                          }`}
                        >
                          Ver detalles
                          <ArrowUpRight className="size-3.5" />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>

            </div>
          )}
        </div>

      </div>

      {/* MODAL DE DETALLES Y TEMARIO DEL DIPLOMADO */}
      {modalDiplomado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
          <div 
            className={`relative w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border ${
              esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            } my-8`}
          >
            {/* Botón Cerrar Modal */}
            <button 
              onClick={() => setModalDiplomado(null)}
              className="absolute top-4 right-4 z-10 grid size-9 place-items-center rounded-full bg-slate-950/80 text-white hover:bg-slate-800 backdrop-blur-md border border-white/10 transition"
            >
              <X className="size-5" />
            </button>

            {/* Cabecera / Portada del Modal */}
            <div className="relative h-56 w-full bg-slate-800">
              <img 
                src={modalDiplomado.imagen} 
                alt={modalDiplomado.titulo}
                className="object-cover w-full h-full opacity-90"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute bottom-5 left-6 right-6">
                <div className="flex flex-wrap gap-2 mb-2">
                  <span className="text-[10px] font-bold text-white bg-indigo-600/90 backdrop-blur-md px-3 py-1 rounded-full">
                    {modalDiplomado.categoria}
                  </span>
                  <span className="text-[10px] font-bold text-slate-200 bg-slate-800/90 backdrop-blur-md px-3 py-1 rounded-full">
                    {modalDiplomado.nivel}
                  </span>
                  <span className="text-[10px] font-bold text-amber-300 bg-amber-500/20 border border-amber-500/30 backdrop-blur-md px-3 py-1 rounded-full">
                    {String(modalDiplomado.modulosCount).padStart(2, '0')} Módulos
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white uppercase leading-tight">
                  {modalDiplomado.titulo}
                </h2>
              </div>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-6 sm:p-8 space-y-6 max-h-[55vh] overflow-y-auto">
              
              {/* Bloque de Inversión y Acción */}
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                esOscuro ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-100/80 border-slate-200'
              }`}>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest block ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>Inversión / Programa</span>
                  {esIlimitado ? (
                    <span className="text-base font-black text-amber-500 flex items-center gap-1.5 mt-0.5">
                      <Sparkles className="size-4" /> Incluido en tu Plan Ilimitado
                    </span>
                  ) : (
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 line-through">S/ {modalDiplomado.precioRegular}</span>
                      <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">S/ {modalDiplomado.precioOferta}</span>
                    </div>
                  )}
                </div>

                {esIlimitado ? (
                  <Link
                    href="/dashboard/canjear"
                    className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm text-center"
                  >
                    Canjear con mi Cupo
                  </Link>
                ) : (
                  <a
                    href={`https://wa.me/51987654321?text=Hola,%20deseo%20adquirir%20el%20diplomado:%20${encodeURIComponent(modalDiplomado.titulo)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-3 rounded-xl transition shadow-sm text-center flex items-center justify-center gap-1.5"
                  >
                    Adquirir diplomado <ArrowUpRight className="size-4" />
                  </a>
                )}
              </div>

              {/* Sección de Temario Oficial extraído dinámicamente del JSON */}
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 mb-4 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  <FileText className="size-5 text-indigo-600 dark:text-indigo-400" /> Temario Oficial y Estructura por Módulos
                </h3>

                <div className="space-y-4">
                  {modalDiplomado.modulos && modalDiplomado.modulos.length > 0 ? (
                    modalDiplomado.modulos.map((mod, idx) => (
                      <div key={idx} className={`p-4 rounded-2xl border space-y-2.5 ${esOscuro ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                            {mod.codigo || `MÓDULO ${idx + 1}`}
                          </span>
                          {mod.docente && (
                            <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                              esOscuro 
                                ? 'bg-slate-800 text-indigo-300 border border-slate-700' 
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              <UserCheck className="size-3 text-indigo-600 dark:text-indigo-400" /> Docente: {mod.docente}
                            </span>
                          )}
                        </div>
                        <h4 className={`text-sm font-bold leading-snug ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                          {mod.nombre}
                        </h4>
                        {mod.clases && mod.clases.length > 0 && (
                          <div className={`mt-3 pt-2.5 border-t space-y-1.5 ${esOscuro ? 'border-slate-800/60' : 'border-slate-200'}`}>
                            <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                              Sesiones y Clases Incluidas:
                            </span>
                            {mod.clases.map((clase, cIdx) => (
                              <div key={cIdx} className={`text-xs flex items-start gap-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                                <span className="size-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 mt-1.5 shrink-0" />
                                <span className="leading-snug">{clase}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className={`text-xs italic ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>No hay información de módulos registrada para este diplomado.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Pie de Página del Modal */}
            <div className={`p-4 border-t flex items-center justify-between ${esOscuro ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50'}`}>
              <span className={`text-xs font-medium ${esOscuro ? 'text-slate-400' : 'text-slate-600'}`}>
                🎓 Certificación oficial respaldada por EDUMIN
              </span>
              <button
                onClick={() => setModalDiplomado(null)}
                className={`px-5 py-2.5 text-xs font-bold rounded-xl transition ${
                  esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                }`}
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PANEL FLOTANTE DE SIMULACIÓN DEV (DESARROLLO INTERNO) */}
      {mostrarPanelDev && (
        <aside className="fixed bottom-5 right-5 z-40 bg-slate-900/95 text-white border border-slate-700/80 backdrop-blur-md p-4 rounded-2xl shadow-2xl max-w-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <Wrench className="size-3.5" /> Simulador Dev (Interno)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md font-mono">v1.0</span>
              <button 
                onClick={() => setMostrarPanelDev(false)}
                className="text-slate-400 hover:text-white transition p-0.5 rounded-lg hover:bg-slate-800 cursor-pointer"
                title="Cerrar panel de simulación"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          <p className="text-[11px] text-slate-300">
            Cambia de estado para probar la vista de diplomados:
          </p>

          <div className="space-y-1.5 text-xs">
            <button
              onClick={() => setEstadoSimuladoDev('sin_diplomado')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'sin_diplomado' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>0 Diplomados (Sin fijar)</span>
              {estadoSimuladoDev === 'sin_diplomado' && <CheckCircle2 className="size-3.5 text-white" />}
            </button>

            <button
              onClick={() => setEstadoSimuladoDev('curso')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'curso' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>1 Diplomado en Progreso (Derecho Minero 45%)</span>
              {estadoSimuladoDev === 'curso' && <CheckCircle2 className="size-3.5 text-white" />}
            </button>

            <button
              onClick={() => setEstadoSimuladoDev('completado')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'completado' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>1 Diplomado Completado (100%)</span>
              {estadoSimuladoDev === 'completado' && <CheckCircle2 className="size-3.5 text-white" />}
            </button>

            <button
              onClick={() => setEstadoSimuladoDev('dos_diplomados')}
              className={`w-full text-left px-3 py-2 rounded-xl transition text-[11px] font-medium flex items-center justify-between cursor-pointer ${
                estadoSimuladoDev === 'dos_diplomados' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300'
              }`}
            >
              <span>3 Diplomados (2 en progreso + 1 completado)</span>
              {estadoSimuladoDev === 'dos_diplomados' && <CheckCircle2 className="size-3.5 text-white" />}
            </button>
          </div>
        </aside>
      )}

    </main>
  );
}