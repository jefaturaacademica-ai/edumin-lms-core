'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle2, PlayCircle, Sparkles, ShieldCheck, Tag, ArrowUpRight, Sun, Moon, ShoppingBag, ChevronUp, ChevronDown, Search, RotateCcw, BarChart2, Layers } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function DiplomadosPage() {
  const [paquete, setPaquete] = useState<string>('FULL');
  const [nombres, setNombres] = useState<string>('Estudiante');
  const [loading, setLoading] = useState(true);
  const [esOscuro, setEsOscuro] = useState(true);

  // Control del despliegue del catálogo de diplomados
  const [mostrarCatalogoAdicional, setMostrarCatalogoAdicional] = useState(false);

  // Filtros interactivos y buscador superior
  const [busqueda, setBusqueda] = useState<string>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('Todas');
  const [nivelFiltro, setNivelFiltro] = useState<string>('Todos');

  // Diplomado Activo Dinámico (Derecho Minero) con Imagen y Avance
  const diplomadoActivo = {
    id: 'derecho-minero', 
    titulo: '1. DERECHO MINERO',
    avance: 45, // Porcentaje de avance
    imagen: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80",
    modulos: [
      { id: 'modulo-1', titulo: 'MÓDULO I: LEGISLACIÓN MINERA Y MARCO LEGAL' },
      { id: 'modulo-2', titulo: 'MÓDULO II: JURISDICCIÓN MINERA Y REGULACIÓN LABORAL' },
      { id: 'modulo-3', titulo: 'MÓDULO III: GESTIÓN CONTRACTUAL Y CONCESIONES' }
    ]
  };

  const listaCategorias = [
    'Todas', 
    'Minería & Geología', 
    'Seguridad & SSOMA', 
    'Gestión & Operaciones', 
    'Logística & Cadena de Suministro', 
    'Legal & Negocios'
  ];

  const listaNiveles = ['Todos', 'Especialización', 'Avanzado', 'Gerencial'];

  // Lista oficial de los 21 diplomados adicionales
  const listaDiplomadosAdicionales = [
    { id: 2, idRuta: 'comercio-internacional', titulo: "ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA", modulos: "03 Módulos", categoria: "Logística & Cadena de Suministro", nivel: "Especialización", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" },
    { id: 3, idRuta: 'geologia-minera', titulo: "GEOLOGÍA MINERA", modulos: "03 Módulos", categoria: "Minería & Geología", nivel: "Especialización", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=600&q=80" },
    { id: 4, idRuta: 'geometalurgia', titulo: "GEOMETALURGIA", modulos: "03 Módulos", categoria: "Minería & Geología", nivel: "Avanzado", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80" },
    { id: 5, idRuta: 'geomecanica', titulo: "GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL", modulos: "03 Módulos", categoria: "Minería & Geología", nivel: "Avanzado", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80" },
    { id: 6, idRuta: 'geotecnia-minera', titulo: "GEOTECNIA MINERA", modulos: "03 Módulos", categoria: "Minería & Geología", nivel: "Avanzado", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80" },
    { id: 7, idRuta: 'gerencia-hseq', titulo: "GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ", modulos: "03 Módulos", categoria: "Seguridad & SSOMA", nivel: "Gerencial", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { id: 8, idRuta: 'liderazgo-mineria', titulo: "GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA", modulos: "05 Módulos", categoria: "Gestión & Operaciones", nivel: "Gerencial", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=600&q=80" },
    { id: 9, idRuta: 'gestion-ambiental', titulo: "GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL", modulos: "03 Módulos", categoria: "Seguridad & SSOMA", nivel: "Especialización", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&w=600&q=80" },
    { id: 10, idRuta: 'control-operativo', titulo: "GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS", modulos: "03 Módulos", categoria: "Gestión & Operaciones", nivel: "Avanzado", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80" },
    { id: 11, idRuta: 'operaciones-industriales', titulo: "GESTIÓN DE OPERACIONES INDUSTRIALES", modulos: "03 Módulos", categoria: "Gestión & Operaciones", nivel: "Avanzado", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=600&q=80" },
    { id: 12, idRuta: 'big-data-gestion', titulo: "GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO", modulos: "03 Módulos", categoria: "Gestión & Operaciones", nivel: "Avanzado", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=600&q=80" },
    { id: 13, idRuta: 'logistica-compras', titulo: "GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES", modulos: "05 Módulos", categoria: "Logística & Cadena de Suministro", nivel: "Gerencial", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" },
    { id: 14, idRuta: 'logistica-mineria', titulo: "GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA", modulos: "03 Módulos", categoria: "Logística & Cadena de Suministro", nivel: "Especialización", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80" },
    { id: 15, idRuta: 'logistica-industria', titulo: "GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA", modulos: "03 Módulos", categoria: "Logística & Cadena de Suministro", nivel: "Especialización", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1586528116495-21e35496c21e?auto=format&fit=crop&w=600&q=80" },
    { id: 16, idRuta: 'gestion-minera', titulo: "GESTIÓN MINERA", modulos: "03 Módulos", categoria: "Gestión & Operaciones", nivel: "Especialización", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1578328819058-b69f3a3b0f6b?auto=format&fit=crop&w=600&q=80" },
    { id: 17, idRuta: 'legislacion-laboral', titulo: "LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS", modulos: "05 Módulos", categoria: "Legal & Negocios", nivel: "Especialización", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=600&q=80" },
    { id: 18, idRuta: 'mineria-digital', titulo: "MINERÍA 4.0 Y DIGITALIZACIÓN MINERA", modulos: "03 Módulos", categoria: "Gestión & Operaciones", nivel: "Avanzado", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=600&q=80" },
    { id: 19, idRuta: 'conflictividad-social', titulo: "PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL", modulos: "03 Módulos", categoria: "Legal & Negocios", nivel: "Avanzado", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=600&q=80" },
    { id: 20, idRuta: 'seguridad-industrial', titulo: "SEGURIDAD INDUSTRIAL", modulos: "03 Módulos", categoria: "Seguridad & SSOMA", nivel: "Especialización", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80" },
    { id: 21, idRuta: 'ssoma-industria', titulo: "SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA", modulos: "04 Módulos", categoria: "Seguridad & SSOMA", nivel: "Especialización", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80" },
    { id: 22, idRuta: 'supply-chain', titulo: "SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA", modulos: "03 Módulos", categoria: "Logística & Cadena de Suministro", nivel: "Gerencial", precioRegular: 1200, precioOferta: 400, imagen: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80" },
  ];

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
          if (profile.nombres) setNombres(profile.nombres);
          if (profile.paquete_adquirido) setPaquete(profile.paquete_adquirido.toUpperCase());
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

  // Función de normalización para que ignore tildes y mayúsculas
  const normalizarTexto = (texto: string) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  let diplomadosFiltrados = listaDiplomadosAdicionales.filter(dip => {
    const tituloNormalizado = normalizarTexto(dip.titulo);
    const busquedaNormalizada = normalizarTexto(busqueda);
    
    const coincideBusqueda = tituloNormalizado.includes(busquedaNormalizada);
    const coincideCategoria = categoriaFiltro === 'Todas' || dip.categoria === categoriaFiltro;
    const coincideNivel = nivelFiltro === 'Todos' || dip.nivel === nivelFiltro;
    
    return coincideBusqueda && coincideCategoria && coincideNivel;
  });

  // CONSTANTE MAGICA: Detectar si es alumno VIP
  const esIlimitado = paquete === 'ILIMITADO';

  if (loading) {
    return (
      <div className={`min-h-screen grid place-items-center p-10 ${esOscuro ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <p className="text-indigo-500 font-medium animate-pulse">Cargando experiencia académica...</p>
      </div>
    );
  }

  return (
    <main className={`min-h-screen pb-24 transition-colors duration-300 ${esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      
      {/* Hero Header */}
      <section className={`relative overflow-hidden px-6 py-12 sm:px-10 lg:px-16 border-b shadow-md ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className={`absolute inset-0 -z-10 ${esOscuro ? 'bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.25),transparent_50%)]' : 'bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08),transparent_50%)]'}`} />
        
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-start justify-between gap-6">
          <div>
            <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm mb-4 backdrop-blur-md border ${
              esIlimitado 
                ? 'bg-amber-500/20 border-amber-400/30 text-amber-500' 
                : 'bg-indigo-500/20 border-indigo-400/30 text-indigo-500'
            }`}>
              <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Paquete Activo: {paquete}
            </div>
            <h1 className={`text-3xl sm:text-4xl font-black tracking-tight flex items-center gap-3 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
              <BookOpen className={`w-8 h-8 ${esIlimitado ? 'text-amber-500' : 'text-indigo-500'}`} />
              Mis Diplomados y Programas
            </h1>
            <p className={`mt-2 max-w-2xl text-sm sm:text-base ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
              Bienvenido, <span className={`font-semibold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>{nombres}</span>. Accede a tu diplomado principal o explora el catálogo de especializaciones.
            </p>
          </div>

          <button
            onClick={() => setEsOscuro(!esOscuro)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm border shrink-0 ${
              esOscuro 
                ? 'bg-slate-950 text-amber-400 border-slate-800 hover:bg-slate-800' 
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            {esOscuro ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-indigo-600" />}
            <span>{esOscuro ? 'Modo Claro' : 'Modo Oscuro'}</span>
          </button>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 sm:px-10 lg:px-16 pt-10 space-y-10">
        
        {/* ZONA 1: DIPLOMADO PRINCIPAL ACTIVO CON IMAGEN Y AVANCE */}
        <div className={`rounded-3xl overflow-hidden shadow-sm border ${esOscuro ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
          <div className="flex flex-col md:flex-row">
            
            <div className="relative w-full md:w-2/5 lg:w-1/3 min-h-[250px] bg-slate-800">
              <img 
                src={diplomadoActivo.imagen} 
                alt="Derecho Minero" 
                className="absolute inset-0 w-full h-full object-cover opacity-90"
              />
              <div className="absolute top-4 left-4">
                <span className={`text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-1.5`}>
                  <ShieldCheck className="size-3.5" /> Acceso Completo
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8 flex-1 flex flex-col justify-between">
              <div>
                <span className={`text-xs font-bold uppercase tracking-widest block mb-2 ${esIlimitado ? 'text-amber-500' : 'text-indigo-500'}`}>
                  PROGRAMA EN CURSO ({paquete})
                </span>
                <h3 className={`text-2xl font-black uppercase leading-tight ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                  {diplomadoActivo.titulo}
                </h3>
                
                <div className="mt-5 space-y-2 max-w-sm">
                  <div className="flex justify-between text-xs font-bold">
                    <span className={`flex items-center gap-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-600'}`}>
                      <BarChart2 className={`size-4 ${esIlimitado ? 'text-amber-500' : 'text-indigo-500'}`} /> Avance del Diplomado
                    </span>
                    <span className={`${esIlimitado ? 'text-amber-500' : 'text-indigo-500'}`}>{diplomadoActivo.avance}%</span>
                  </div>
                  <div className={`w-full h-2.5 rounded-full overflow-hidden ${esOscuro ? 'bg-slate-800' : 'bg-slate-100'}`}>
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${esIlimitado ? 'bg-amber-500' : 'bg-indigo-600'}`}
                      style={{ width: `${diplomadoActivo.avance}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 mt-6">
                {diplomadoActivo.modulos.map((modulo) => (
                  <div key={modulo.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all gap-3 ${esOscuro ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-800/60' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <Layers className={`w-5 h-5 shrink-0 ${esIlimitado ? 'text-amber-500' : 'text-indigo-500'}`} />
                      <span className={`font-semibold text-xs sm:text-sm ${esOscuro ? 'text-slate-200' : 'text-slate-800'}`}>
                        {modulo.titulo}
                      </span>
                    </div>
                    <Link 
                      href={`/dashboard/diplomados/${diplomadoActivo.id}?modulo=${modulo.id}`} 
                      className={`text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-1.5 shadow-sm shrink-0 justify-center ${esIlimitado ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                    >
                      <PlayCircle className="w-4 h-4" /> Estudiar
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 2: BOTÓN DESPLEGABLE DE ADQUISICIÓN O CANJE */}
        <div className={`pt-6 border-t ${esOscuro ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className={`text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-slate-800 ${esIlimitado ? 'bg-gradient-to-r from-slate-900 to-amber-950' : 'bg-gradient-to-r from-slate-900 to-indigo-950'}`}>
            <div>
              <span className={`text-xs font-bold uppercase tracking-widest block mb-1 ${esIlimitado ? 'text-amber-400' : 'text-indigo-400'}`}>Catálogo Ampliado EDUMIN</span>
              <h3 className="text-xl font-bold">{esIlimitado ? 'Aprovecha tus beneficios ilimitados' : '¿Deseas adquirir más Diplomados especializados?'}</h3>
              <p className="text-xs text-slate-300 mt-1">Explora nuestra oferta completa con los 21 programas oficiales de alta especialización.</p>
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

          {/* CONTENIDO DESPLEGABLE CON FILTROS */}
          {mostrarCatalogoAdicional && (
            <div className="mt-8 space-y-6 transition-all animate-fadeIn">
              
              <div className={`p-6 rounded-3xl shadow-sm border space-y-4 ${esOscuro ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  
                  <div className="relative sm:col-span-6">
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

                  <div className="sm:col-span-3">
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

                  <div className="sm:col-span-3">
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

              {/* GRILLA DE CATÁLOGO ADICIONAL CON LOGICA VIP "ILIMITADO" */}
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
                            {dip.modulos}
                          </span>
                        </div>

                        <h3 className={`text-sm font-bold leading-snug ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
                          {dip.id}. {dip.titulo}
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

                        <Link
                          href={esIlimitado ? `/dashboard/canjear` : `/dashboard/diplomados/${dip.idRuta}`}
                          className={`inline-flex items-center gap-1.5 rounded-xl text-white px-4 py-2.5 text-xs font-bold transition shadow-sm shrink-0 ${
                            esIlimitado ? 'bg-amber-600 hover:bg-amber-500' : 'bg-indigo-600 hover:bg-indigo-500'
                          }`}
                        >
                          {esIlimitado ? 'Canjear Cupo' : 'Ver detalles'}
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </div>
                    </article>
                  ))
                )}
              </div>

            </div>
          )}
        </div>

      </div>
    </main>
  );
}