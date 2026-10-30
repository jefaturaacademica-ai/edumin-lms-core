'use client';

import { useState, useEffect } from 'react';
import { 
  Sparkles, CheckCircle2, ArrowLeft, BookOpenCheck, Search, RefreshCw, 
  GraduationCap, BookOpen, Layers, Info, Check, ShieldCheck, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { EduminCreditsCalculation } from '@/lib/utils/credits';

export default function CanjearBeneficiosPage() {
  const [tabActual, setTabActual] = useState<'diplomados' | 'cursos' | 'reglas'>('diplomados');
  const [nombres, setNombres] = useState<string>('Estudiante');
  const [paquete, setPaquete] = useState<string>('COMPLETO');
  const [tipoPago, setTipoPago] = useState<string>('CUOTAS');
  const [cuotasPagadas, setCuotasPagadas] = useState<number>(1);
  const [cuotasTotales, setCuotasTotales] = useState<number>(3);
  
  // Créditos EDUMIN
  const [eduminCredits, setEduminCredits] = useState<EduminCreditsCalculation | null>(null);
  const [loading, setLoading] = useState(true);

  // Selecciones
  const [diplomadosSeleccionados, setDiplomadosSeleccionados] = useState<string[]>([]);
  const [cursosSeleccionados, setCursosSeleccionados] = useState<number[]>([]);
  const [enviandoCanje, setEnviandoCanje] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<{ texto: string; tipo: 'diplomado' | 'curso' } | null>(null);
  
  // Buscadores
  const [busqueda, setBusqueda] = useState<string>('');

  // 22 diplomados oficiales EDUMIN
  const opcionesDiplomados = [
    { id: 'derecho-minero', titulo: "1. DERECHO MINERO", categoria: "Legal & Negocios", modulos: "03 Módulos" },
    { id: 'comercio-internacional', titulo: "2. ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA", categoria: "Logística & Cadena de Suministro", modulos: "03 Módulos" },
    { id: 'geologia-minera', titulo: "3. GEOLOGÍA MINERA", categoria: "Minería & Geología", modulos: "03 Módulos" },
    { id: 'geometalurgia', titulo: "4. GEOMETALURGIA", categoria: "Minería & Geología", modulos: "03 Módulos" },
    { id: 'geomecanica', titulo: "5. GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL", categoria: "Minería & Geología", modulos: "03 Módulos" },
    { id: 'geotecnia-minera', titulo: "6. GEOTECNIA MINERA", categoria: "Minería & Geología", modulos: "03 Módulos" },
    { id: 'gerencia-hseq', titulo: "7. GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ", categoria: "Seguridad & SSOMA", modulos: "03 Módulos" },
    { id: 'liderazgo-mineria', titulo: "8. GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA", categoria: "Gestión & Operaciones", modulos: "05 Módulos" },
    { id: 'gestion-ambiental', titulo: "9. GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL", categoria: "Seguridad & SSOMA", modulos: "03 Módulos" },
    { id: 'control-operativo', titulo: "10. GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS", categoria: "Gestión & Operaciones", modulos: "03 Módulos" },
    { id: 'operaciones-industriales', titulo: "11. GESTIÓN DE OPERACIONES INDUSTRIALES", categoria: "Gestión & Operaciones", modulos: "03 Módulos" },
    { id: 'big-data-gestion', titulo: "12. GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO", categoria: "Gestión & Operaciones", modulos: "03 Módulos" },
    { id: 'logistica-compras', titulo: "13. GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES", categoria: "Logística & Cadena de Suministro", modulos: "05 Módulos" },
    { id: 'logistica-mineria', titulo: "14. GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA", categoria: "Logística & Cadena de Suministro", modulos: "03 Módulos" },
    { id: 'logistica-industria', titulo: "15. GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA", categoria: "Logística & Cadena de Suministro", modulos: "03 Módulos" },
    { id: 'gestion-minera', titulo: "16. GESTIÓN MINERA", categoria: "Gestión & Operaciones", modulos: "03 Módulos" },
    { id: 'legislacion-laboral', titulo: "17. LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS", categoria: "Legal & Negocios", modulos: "05 Módulos" },
    { id: 'mineria-digital', titulo: "18. MINERÍA 4.0 Y DIGITALIZACIÓN MINERA", categoria: "Gestión & Operaciones", modulos: "03 Módulos" },
    { id: 'conflictividad-social', titulo: "19. PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL", categoria: "Legal & Negocios", modulos: "03 Módulos" },
    { id: 'seguridad-industrial', titulo: "20. SEGURIDAD INDUSTRIAL", categoria: "Seguridad & SSOMA", modulos: "03 Módulos" },
    { id: 'ssoma-industria', titulo: "21. SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA", categoria: "Seguridad & SSOMA", modulos: "04 Módulos" },
    { id: 'supply-chain', titulo: "22. SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA", categoria: "Logística & Cadena de Suministro", modulos: "03 Módulos" }
  ];

  // Cursos libres
  const [cursosLibres, setCursosLibres] = useState<any[]>([
    { id: 1, curso: "MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783", categoria: "Seguridad y prevención" },
    { id: 2, curso: "IMPLEMENTACIÓN DE MEDIDAS DE CONTROL EN RIESGOS MINEROS", categoria: "Seguridad y prevención" },
    { id: 3, curso: "ERGONOMÍA Y SALUD OCUPACIONAL EN EL SECTOR MINERO E INDUSTRIAL", categoria: "Seguridad y prevención" },
    { id: 4, curso: "MARCO JURÍDICO Y NORMATIVO DE LA MINERÍA", categoria: "Legislación y normativa" },
    { id: 5, curso: "GESTIÓN DE PROVEEDORES EN MINERÍA", categoria: "Logística y almacenes" },
    { id: 6, curso: "CONTROL DE COSTOS EN ALMACENES MINEROS", categoria: "Logística y almacenes" },
    { id: 7, curso: "LOGÍSTICA Y DISTRIBUCIÓN EN LA INDUSTRIA Y MINERÍA", categoria: "Logística y almacenes" },
    { id: 8, curso: "CONTRATOS EN LA INDUSTRIA MINERA", categoria: "Legislación y normativa" },
    { id: 9, curso: "DERECHOS HUMANOS EN MINERÍA", categoria: "Legislación y normativa" },
    { id: 10, curso: "GESTIÓN DE TRABAJO EN ALTO RIESGO EN MINERÍA", categoria: "Seguridad y prevención" },
    { id: 11, curso: "INVESTIGACIÓN DE ACCIDENTES E INCIDENTES LABORALES", categoria: "Seguridad y prevención" },
    { id: 12, curso: "FISCALIZACIÓN LABORAL POR SUNAFIL EN EL SECTOR MINERO", categoria: "Legislación y normativa" }
  ]);

  useEffect(() => {
    async function cargarDatos() {
      try {
        const res = await fetch('/api/dashboard/me');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            if (data.profile.nombres) setNombres(data.profile.nombres);
            if (data.profile.paquete_adquirido) setPaquete(data.profile.paquete_adquirido.toUpperCase());
            if (data.profile.tipo_pago) setTipoPago(data.profile.tipo_pago);
            if (data.profile.cuotas_pagadas !== undefined) setCuotasPagadas(data.profile.cuotas_pagadas);
            if (data.profile.cuotas_totales !== undefined) setCuotasTotales(data.profile.cuotas_totales);
          }
          if (data.eduminCredits) {
            setEduminCredits(data.eduminCredits);
          }
        }
      } catch (e) {
        console.error('Error cargando datos de usuario:', e);
      } finally {
        setLoading(false);
      }
    }
    cargarDatos();
  }, []);

  const dipDisponibles = eduminCredits?.diplomados.disponibles ?? 0;
  const curDisponibles = eduminCredits?.cursos.disponibles ?? 0;
  const totalDisponibles = eduminCredits?.total.disponibles ?? 0;

  const toggleSeleccionDiplomado = (id: string) => {
    if (diplomadosSeleccionados.includes(id)) {
      setDiplomadosSeleccionados(diplomadosSeleccionados.filter(item => item !== id));
    } else {
      if (diplomadosSeleccionados.length < dipDisponibles) {
        setDiplomadosSeleccionados([...diplomadosSeleccionados, id]);
      } else {
        alert(`Dispones de ${dipDisponibles} Crédito(s) de Diplomado para canjear.`);
      }
    }
  };

  const toggleSeleccionCurso = (id: number) => {
    if (cursosSeleccionados.includes(id)) {
      setCursosSeleccionados(cursosSeleccionados.filter(item => item !== id));
    } else {
      if (cursosSeleccionados.length < curDisponibles) {
        setCursosSeleccionados([...cursosSeleccionados, id]);
      } else {
        alert(`Dispones de ${curDisponibles} Crédito(s) de Cursos Libres para canjear.`);
      }
    }
  };

  const confirmarCanjeDiplomados = async () => {
    if (diplomadosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un diplomado para canjear.');
      return;
    }
    setEnviandoCanje(true);
    try {
      const programaTitulosObj: Record<string, string> = {};
      opcionesDiplomados.forEach(op => {
        programaTitulosObj[op.id] = op.titulo;
      });

      const res = await fetch('/api/dashboard/canjear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seleccionados: diplomadosSeleccionados,
          programaTitulos: programaTitulosObj
        })
      });
      const data = await res.json();
      if (res.ok) {
        setMensajeExito({
          texto: `¡Has canjeado exitosamente ${diplomadosSeleccionados.length} diplomado(s)! Ya están habilitados en tu aula virtual.`,
          tipo: 'diplomado'
        });
        setDiplomadosSeleccionados([]);
      } else {
        alert(`Error al procesar el canje: ${data.error || 'Intente nuevamente'}`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    } finally {
      setEnviandoCanje(false);
    }
  };

  const confirmarCanjeCursos = async () => {
    if (cursosSeleccionados.length === 0) {
      alert('Por favor selecciona al menos un curso para canjear.');
      return;
    }
    setEnviandoCanje(true);
    try {
      // Simular registro y éxito de canje de cursos libres
      await new Promise(r => setTimeout(r, 800));
      setMensajeExito({
        texto: `¡Has canjeado ${cursosSeleccionados.length} curso(s) libre(s) con tus Créditos EDUMIN!`,
        tipo: 'curso'
      });
      setCursosSeleccionados([]);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setEnviandoCanje(false);
    }
  };

  const normalizarTexto = (texto: string) => {
    return (texto || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const diplomadosFiltrados = opcionesDiplomados.filter(op => 
    normalizarTexto(op.titulo).includes(normalizarTexto(busqueda)) || 
    normalizarTexto(op.categoria).includes(normalizarTexto(busqueda))
  );

  const cursosFiltrados = cursosLibres.filter(cur =>
    normalizarTexto(cur.curso).includes(normalizarTexto(busqueda)) ||
    normalizarTexto(cur.categoria).includes(normalizarTexto(busqueda))
  );

  if (loading) {
    return <DashboardLoader minHeight="min-h-screen" />;
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-8 lg:p-12 text-slate-900 dark:text-slate-100 pb-24 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Cabecera de Navegación */}
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-900 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm transition"
          >
            <ArrowLeft className="size-4" /> Volver al Aula Virtual
          </Link>
          
          <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
            <Sparkles className="size-3.5" /> Paquete {paquete}: Créditos EDUMIN
          </div>
        </div>

        {/* Tarjeta de Bienvenida y Resumen de Créditos */}
        <header className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">
                <Sparkles className="w-4 h-4" /> Autogestión de Beneficios Académicos
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Mis Créditos EDUMIN
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Hola, <strong className="text-slate-900 dark:text-white">{nombres}</strong>. Utiliza tus créditos para matricularte en nuevos programas y cursos según tus necesidades.
              </p>
            </div>

            {/* Badges de Créditos Disponibles */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 px-4 py-2.5 rounded-2xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                  Créditos Diplomados
                </div>
                <div className="text-xl font-black text-indigo-700 dark:text-indigo-200 mt-0.5">
                  {dipDisponibles} disp.
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-2xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Créditos Cursos
                </div>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-200 mt-0.5">
                  {curDisponibles} disp.
                </div>
              </div>

              <div className="bg-slate-900 text-white dark:bg-slate-800 border border-slate-700 px-4 py-2.5 rounded-2xl text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Total Créditos
                </div>
                <div className="text-xl font-black text-white mt-0.5">
                  {totalDisponibles}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de progreso visual */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              Modalidad: <strong className="text-slate-800 dark:text-slate-200">{tipoPago === 'CONTADO' ? '100% Contado' : `En Cuotas (${cuotasPagadas} de ${cuotasTotales} pagadas)`}</strong>
            </div>
            <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer" onClick={() => setTabActual('reglas')}>
              <Info className="w-4 h-4" /> Ver cómo se liberan mis créditos por cuota
            </div>
          </div>
        </header>

        {/* Mensaje de Éxito al canjear */}
        {mensajeExito && (
          <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-3xl p-6 sm:p-8 text-center space-y-3">
            <div className="size-12 bg-emerald-600 text-white rounded-2xl grid place-items-center mx-auto shadow-md">
              <CheckCircle2 className="size-6" />
            </div>
            <h2 className="text-xl font-bold text-emerald-900 dark:text-emerald-200">¡Canje Exitoso!</h2>
            <p className="text-xs sm:text-sm text-emerald-700 dark:text-emerald-300 max-w-md mx-auto">
              {mensajeExito.texto}
            </p>
            <div className="pt-2">
              <Link 
                href="/dashboard"
                className="inline-block bg-slate-900 dark:bg-slate-800 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-md hover:bg-slate-800 transition"
              >
                Ir a Mi Aula Virtual
              </Link>
            </div>
          </div>
        )}

        {/* Navegación por Pestañas */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
          <button
            onClick={() => setTabActual('diplomados')}
            className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              tabActual === 'diplomados'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            Canjear Diplomados ({dipDisponibles} disp.)
          </button>

          <button
            onClick={() => setTabActual('cursos')}
            className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              tabActual === 'cursos'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Canjear Cursos Libres ({curDisponibles} disp.)
          </button>

          <button
            onClick={() => setTabActual('reglas')}
            className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
              tabActual === 'reglas'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            Reglas de Créditos EDUMIN
          </button>
        </div>

        {/* PESTAÑA 1: CANJEAR DIPLOMADOS */}
        {tabActual === 'diplomados' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar diplomado de especialización..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="text-xs text-slate-500">
                Seleccionados: <strong className="text-indigo-600">{diplomadosSeleccionados.length}</strong> de <strong>{dipDisponibles}</strong> disponibles
              </div>
            </div>

            {dipDisponibles === 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-3">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div>
                  Ya has canjeado o tienes asignados tus Créditos de Diplomado actuales. 
                  {tipoPago === 'CUOTAS' && cuotasPagadas < cuotasTotales 
                    ? ` Al registrar tu cuota 0${cuotasPagadas + 1} se liberarán automáticamente nuevos beneficios.`
                    : ' Explora la pestaña de Cursos Libres para continuar tu formación.'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diplomadosFiltrados.map((opcion) => {
                const estaSeleccionado = diplomadosSeleccionados.includes(opcion.id);
                return (
                  <div 
                    key={opcion.id}
                    onClick={() => dipDisponibles > 0 && toggleSeleccionDiplomado(opcion.id)}
                    className={`p-5 rounded-3xl border transition-all flex flex-col justify-between gap-3 ${
                      estaSeleccionado 
                        ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/20' 
                        : dipDisponibles > 0
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300 cursor-pointer'
                        : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`size-10 rounded-xl grid place-items-center shrink-0 ${estaSeleccionado ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'}`}>
                        <GraduationCap className="size-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                          Diplomado · {opcion.categoria}
                        </span>
                        <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white mt-0.5 leading-snug">
                          {opcion.titulo}
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-1">{opcion.modulos} · Certificación Modular</p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className={`text-[11px] font-bold px-3 py-1.5 rounded-xl border transition ${
                        estaSeleccionado 
                          ? 'bg-indigo-600 text-white border-indigo-600' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                        {estaSeleccionado ? 'Seleccionado (1 Crédito)' : 'Canjear Diplomado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra flotante de confirmación */}
            {diplomadosSeleccionados.length > 0 && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-10">
                <div>
                  <p className="text-xs text-slate-400">Diplomados seleccionados con Créditos EDUMIN:</p>
                  <p className="text-base font-bold">{diplomadosSeleccionados.length} de {dipDisponibles} disponibles</p>
                </div>

                <button
                  onClick={confirmarCanjeDiplomados}
                  disabled={enviandoCanje}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {enviandoCanje ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Confirmar y Canjear Diplomados
                </button>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: CANJEAR CURSOS LIBRES */}
        {tabActual === 'cursos' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Buscar curso libre por nombre o área..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl pl-11 pr-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="text-xs text-slate-500">
                Seleccionados: <strong className="text-emerald-600">{cursosSeleccionados.length}</strong> de <strong>{curDisponibles}</strong> disponibles
              </div>
            </div>

            {curDisponibles === 0 && (
              <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl text-xs text-amber-800 dark:text-amber-200 flex items-center gap-3">
                <Info className="w-5 h-5 flex-shrink-0" />
                <div>
                  No dispones de Créditos de Cursos Libres en este momento. 
                  {tipoPago === 'CUOTAS' && cuotasPagadas < cuotasTotales 
                    ? ` Al registrar tu siguiente cuota de pago se liberarán nuevos créditos de cursos libres.`
                    : ' Has completado tu paquete de cursos.'}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cursosFiltrados.map((curso) => {
                const estaSeleccionado = cursosSeleccionados.includes(curso.id);
                return (
                  <div
                    key={curso.id}
                    onClick={() => curDisponibles > 0 && toggleSeleccionCurso(curso.id)}
                    className={`p-5 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                      estaSeleccionado
                        ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
                        : curDisponibles > 0
                        ? 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 cursor-pointer'
                        : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                        {curso.categoria}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white mt-1 leading-snug">
                        {curso.curso}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <span className="text-[10px] text-slate-400">1 Crédito Curso</span>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${
                        estaSeleccionado
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}>
                        {estaSeleccionado ? 'Elegido' : 'Canjear'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Barra flotante para cursos */}
            {cursosSeleccionados.length > 0 && (
              <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-10">
                <div>
                  <p className="text-xs text-slate-400">Cursos seleccionados con Créditos EDUMIN:</p>
                  <p className="text-base font-bold">{cursosSeleccionados.length} de {curDisponibles} disponibles</p>
                </div>

                <button
                  onClick={confirmarCanjeCursos}
                  disabled={enviandoCanje}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {enviandoCanje ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
                  Confirmar y Canjear Cursos Libres
                </button>
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: REGLAS DE CRÉDITOS EDUMIN */}
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
                Tus créditos te permiten autogestionar tus cursos y diplomados a lo largo de tu formación profesional.
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
                  <strong className="text-slate-900 dark:text-white">1. Pago 100% Contado o Cancelación Total:</strong>
                  <p className="mt-1">
                    Al no registrar saldo pendiente, se liberan el 100% de los Créditos de Diplomados y Cursos de tu paquete de forma inmediata.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <strong className="text-slate-900 dark:text-white">2. Pago en Cuotas:</strong>
                  <ul className="list-disc pl-5 mt-2 space-y-1.5">
                    <li><strong>Primera Cuota:</strong> Se habilita tu diplomado principal (1 Crédito Diplomado) y tu primera cuota de cursos: <strong>1 curso</strong> en Completo, <strong>2 cursos</strong> en Full, y <strong>3 cursos</strong> en Ilimitado.</li>
                    <li><strong>Segunda Cuota:</strong> Se liberan cursos adicionales: +1 en Completo (2 acumulados), +2 en Full (4 acumulados), y +3 en Ilimitado. Si tu plan comercial contempla únicamente 2 cuotas, al abonar esta última cuota se liberan automáticamente todos los créditos restantes del paquete por quedar sin deuda.</li>
                    <li><strong>Cuota Final:</strong> Al cancelar la última cuota programada, se desbloquean todos los créditos restantes contratados.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
