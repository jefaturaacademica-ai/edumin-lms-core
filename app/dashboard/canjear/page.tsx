'use client';

import { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, ArrowLeft, BookOpenCheck, Search } from 'lucide-react';
import Link from 'next/link';
import { createBrowserClient } from '@supabase/ssr';

export default function CanjearBeneficiosPage() {
  const [nombres, setNombres] = useState<string>('Estudiante');
  const [paquete, setPaquete] = useState<string>('COMPLETO');
  const [cuposDisponibles, setCuposDisponibles] = useState<number>(2);
  const [loading, setLoading] = useState(true);
  const [seleccionados, setSeleccionados] = useState<string[]>([]);
  const [mensajeExito, setMensajeExito] = useState(false);
  
  // Estado para el buscador
  const [busqueda, setBusqueda] = useState<string>('');

  // Lista oficial de los 22 diplomados EDUMIN
  const opcionesCanje = [
    { id: 'derecho-minero', titulo: "1. DERECHO MINERO", categoria: "Legal & Negocios", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'comercio-internacional', titulo: "2. ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA", categoria: "Logística & Cadena de Suministro", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'geologia-minera', titulo: "3. GEOLOGÍA MINERA", categoria: "Minería & Geología", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'geometalurgia', titulo: "4. GEOMETALURGIA", categoria: "Minería & Geología", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'geomecanica', titulo: "5. GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL", categoria: "Minería & Geología", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'geotecnia-minera', titulo: "6. GEOTECNIA MINERA", categoria: "Minería & Geología", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'gerencia-hseq', titulo: "7. GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ", categoria: "Seguridad & SSOMA", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'liderazgo-mineria', titulo: "8. GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA", categoria: "Gestión & Operaciones", modulos: "05 Módulos", tipo: "Diplomado" },
    { id: 'gestion-ambiental', titulo: "9. GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL", categoria: "Seguridad & SSOMA", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'control-operativo', titulo: "10. GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS", categoria: "Gestión & Operaciones", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'operaciones-industriales', titulo: "11. GESTIÓN DE OPERACIONES INDUSTRIALES", categoria: "Gestión & Operaciones", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'big-data-gestion', titulo: "12. GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO", categoria: "Gestión & Operaciones", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'logistica-compras', titulo: "13. GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES", categoria: "Logística & Cadena de Suministro", modulos: "05 Módulos", tipo: "Diplomado" },
    { id: 'logistica-mineria', titulo: "14. GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA", categoria: "Logística & Cadena de Suministro", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'logistica-industria', titulo: "15. GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA", categoria: "Logística & Cadena de Suministro", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'gestion-minera', titulo: "16. GESTIÓN MINERA", categoria: "Gestión & Operaciones", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'legislacion-laboral', titulo: "17. LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS", categoria: "Legal & Negocios", modulos: "05 Módulos", tipo: "Diplomado" },
    { id: 'mineria-digital', titulo: "18. MINERÍA 4.0 Y DIGITALIZACIÓN MINERA", categoria: "Gestión & Operaciones", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'conflictividad-social', titulo: "19. PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL", categoria: "Legal & Negocios", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'seguridad-industrial', titulo: "20. SEGURIDAD INDUSTRIAL", categoria: "Seguridad & SSOMA", modulos: "03 Módulos", tipo: "Diplomado" },
    { id: 'ssoma-industria', titulo: "21. SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA", categoria: "Seguridad & SSOMA", modulos: "04 Módulos", tipo: "Diplomado" },
    { id: 'supply-chain', titulo: "22. SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA", categoria: "Logística & Cadena de Suministro", modulos: "03 Módulos", tipo: "Diplomado" }
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
          .select('nombres, paquete_adquirido, cuotas_pagadas, cupos_diplomados')
          .eq('id', user.id)
          .single();

        if (profile) {
          if (profile.nombres) setNombres(profile.nombres);
          if (profile.paquete_adquirido) setPaquete(profile.paquete_adquirido.toUpperCase());
          
          // Cálculo dinámico de créditos según cuotas pagadas
          const cuotas = profile.cuotas_pagadas || 1;
          let liberados = cuotas * 1;
          if (profile.paquete_adquirido === 'FULL') liberados = cuotas * 2;
          if (profile.paquete_adquirido === 'ILIMITADO') liberados = cuotas * 3;
          
          const disponibles = Math.max(0, liberados - (profile.cupos_diplomados || 0));
          setCuposDisponibles(disponibles > 0 ? disponibles : 2);
        }
      }
      setLoading(false);
    }
    cargarPerfil();
  }, []);

  const toggleSeleccion = (id: string) => {
    if (seleccionados.includes(id)) {
      setSeleccionados(seleccionados.filter(item => item !== id));
    } else {
      if (seleccionados.length < cuposDisponibles) {
        setSeleccionados([...seleccionados, id]);
      } else {
        alert(`Solo tienes ${cuposDisponibles} cupos disponibles para canjear en este momento.`);
      }
    }
  };

  const confirmarCanje = () => {
    if (seleccionados.length === 0) {
      alert('Por favor, selecciona al menos un programa para canjear.');
      return;
    }
    setMensajeExito(true);
  };

  // Función para ignorar tildes y mayúsculas en el buscador
  const normalizarTexto = (texto: string) => {
    return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };

  const opcionesFiltradas = opcionesCanje.filter(opcion => 
    normalizarTexto(opcion.titulo).includes(normalizarTexto(busqueda)) || 
    normalizarTexto(opcion.categoria).includes(normalizarTexto(busqueda))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 grid place-items-center p-10">
        <p className="text-slate-500 font-medium animate-pulse">Cargando información de beneficios...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10 lg:p-16 text-slate-900 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        
        <div className="flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition"
          >
            <ArrowLeft className="size-4" /> Volver al Inicio
          </Link>
          
          <div className="inline-flex items-center gap-2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
            <Sparkles className="size-3.5" /> Paquete {paquete}: Canje de Beneficios
          </div>
        </div>

        <header className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 space-y-3">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Canjea tus Cupos Académicos Pendientes
          </h1>
          <p className="text-sm text-slate-500 max-w-2xl">
            Hola, <span className="font-semibold text-slate-900">{nombres}</span>. Tienes <strong className="text-indigo-600">{cuposDisponibles - seleccionados.length} cupos disponibles</strong> para seleccionar los diplomados de tu preferencia.
          </p>
        </header>

        {mensajeExito ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-10 text-center space-y-4">
            <div className="size-16 bg-emerald-600 text-white rounded-2xl grid place-items-center mx-auto shadow-md">
              <CheckCircle2 className="size-8" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-900">¡Canje realizado con éxito!</h2>
            <p className="text-sm text-emerald-700 max-w-md mx-auto">
              Tus cupos han sido registrados correctamente. Ya puedes acceder a tus clases desde tu panel principal.
            </p>
            <Link 
              href="/dashboard/diplomados"
              className="inline-block bg-slate-900 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-md hover:bg-slate-800 transition"
            >
              Ir a Mis Diplomados
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Buscador Integrado */}
            <div className="relative w-full max-w-md">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input 
                type="text"
                placeholder="Buscar programa o categoría (Ej: mineria, logistica)..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-600 shadow-sm text-slate-900"
              />
            </div>

            {/* Lista de opciones (Configurada en 2 columnas para no hacer tan larga la vista) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opcionesFiltradas.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-500 border border-slate-200 bg-white rounded-3xl">
                  No se encontraron diplomados con ese término.
                </div>
              ) : (
                opcionesFiltradas.map((opcion) => {
                  const estaSeleccionado = seleccionados.includes(opcion.id);
                  return (
                    <div 
                      key={opcion.id}
                      onClick={() => toggleSeleccion(opcion.id)}
                      className={`p-6 rounded-3xl border cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        estaSeleccionado 
                          ? 'bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-sm' 
                          : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`size-12 rounded-2xl grid place-items-center shrink-0 ${estaSeleccionado ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                          <BookOpenCheck className="size-6" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">{opcion.tipo} · {opcion.categoria}</span>
                          <h3 className="font-bold text-sm text-slate-900 mt-0.5 leading-snug">{opcion.titulo}</h3>
                          <p className="text-xs text-slate-500 mt-1.5">{opcion.modulos} · Modalidad Virtual Asincrónica</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <span className={`text-xs font-bold px-4 py-2 rounded-xl border transition ${
                          estaSeleccionado 
                            ? 'bg-indigo-600 text-white border-indigo-600' 
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}>
                          {estaSeleccionado ? 'Seleccionado' : 'Elegir cupo'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Barra de acción inferior */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 sticky bottom-6 z-10">
              <div>
                <p className="text-xs text-slate-400">Cupos seleccionados para canje:</p>
                <p className="text-lg font-bold">{seleccionados.length} de {cuposDisponibles} disponibles</p>
              </div>

              <button
                onClick={confirmarCanje}
                disabled={seleccionados.length === 0}
                className={`w-full sm:w-auto font-bold px-6 py-3 rounded-2xl text-xs transition shadow-md ${
                  seleccionados.length > 0 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer' 
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                Confirmar y Canjear Mis Cupos
              </button>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}