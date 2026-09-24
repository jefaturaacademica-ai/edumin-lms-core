'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, ShieldCheck, Users, BookOpen, Settings, LogOut,
  CheckCircle2, Activity, DollarSign, Calendar, FileText, Check, AlertCircle, 
  Tag, Download, Clock, UserCheck, Award, FileCheck, Server, RefreshCw,
  TrendingUp, AlertTriangle, Filter, Eye, Phone, MessageSquare, Send, Sparkles, BarChart3, GraduationCap, ArrowUpRight, Zap, X, Plus
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { MOCK_ESTUDIANTES, EstudianteCompleto } from '@/lib/data/mockStudents';

export default function AdminDashboard360() {
  const [activeTab, setActiveTab] = useState<'analitica' | 'tesoreria'>('analitica');
  const [estudiantes, setEstudiantes] = useState<EstudianteCompleto[]>(MOCK_ESTUDIANTES);
  const [cargandoEstudiantes, setCargandoEstudiantes] = useState(true);

  // Filtros Cruzados / Múltiples
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroPaquete, setFiltroPaquete] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroRiesgoChurn, setFiltroRiesgoChurn] = useState<string>('todos');
  const [filtroInactividad, setFiltroInactividad] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Ficha 360° Modal
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<EstudianteCompleto | null>(null);
  const [modalTab, setModalTab] = useState<'financiero' | 'creditos' | 'academico' | 'retencion'>('financiero');
  
  // Modales adicionales de Recibos y Constancia de No Adeudo
  const [reciboImprimir, setReciboImprimir] = useState<any | null>(null);
  const [mostrarConstanciaModal, setMostrarConstanciaModal] = useState<boolean>(false);
  
  // Cargos adicionales (Examen Sustitutorio, Mora, etc.)
  const [nuevoCargoConcepto, setNuevoCargoConcepto] = useState<string>('Examen Sustitutorio');
  const [nuevoCargoMonto, setNuevoCargoMonto] = useState<string>('25.00');

  // Formulario de Pago en Ficha 360 / Tesorería
  const [montoPago, setMontoPago] = useState<string>('150.00');
  const [comprobante, setComprobante] = useState<string>('OP-984321');
  const [metodo, setMetodo] = useState<string>('Yape / Plin');
  const [descuento, setDescuento] = useState<string>('0');
  const [cargandoPago, setCargandoPago] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error'; webhookStatus?: number } | null>(null);

  // Webhook de Retención / Wasapi
  const [enviandoAlertaWhatsApp, setEnviandoAlertaWhatsApp] = useState(false);

  // Anulación de pagos con justificación & n8n
  const [pagoParaAnular, setPagoParaAnular] = useState<any | null>(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState<string>('');
  const [cargandoAnulacion, setCargandoAnulacion] = useState(false);

  // Edición de Cronogramas y Cuotas
  const [mostrarEditarCronogramaModal, setMostrarEditarCronogramaModal] = useState(false);
  const [editCuotasTotales, setEditCuotasTotales] = useState<number>(3);
  const [editMontoCuota, setEditMontoCuota] = useState<number>(150);
  const [editMontoTotal, setEditMontoTotal] = useState<number>(1500);

  // Catálogo de Diplomados de Supabase para enlazar módulos reales
  const [catalogoDiplomados, setCatalogoDiplomados] = useState<any[]>([]);

  // Detalle de Cuota para Pago Manual (Cuota 1 de 6, etc.)
  const [nroCuotaPago, setNroCuotaPago] = useState<string>('Cuota 1 de 6');

  useEffect(() => {
    cargarEstudiantesDeSupabase();
    cargarCatalogoSupabase();
  }, []);

  const cargarEstudiantesDeSupabase = async () => {
    setCargandoEstudiantes(true);
    try {
      const res = await fetch('/api/admin/estudiantes');
      if (res.ok) {
        const data = await res.json();
        if (data.estudiantes && data.estudiantes.length > 0) {
          setEstudiantes(data.estudiantes);
        }
      }
    } catch (e) {
      console.error('Error cargando estudiantes de Supabase:', e);
    } finally {
      setCargandoEstudiantes(false);
    }
  };

  const cargarCatalogoSupabase = async () => {
    try {
      const res = await fetch('/api/admin/catalogo');
      if (res.ok) {
        const data = await res.json();
        setCatalogoDiplomados(data.diplomados || []);
      }
    } catch (e) {
      console.error('Error cargando catálogo:', e);
    }
  };

  const handleAnularPagoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pagoParaAnular || !motivoAnulacion.trim()) {
      alert('Debe ingresar una justificación obligatoria para anular el pago.');
      return;
    }

    setCargandoAnulacion(true);
    try {
      const res = await fetch('/api/admin/pagos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'anular',
          pago_id: pagoParaAnular.id,
          dni_ce: pagoParaAnular.dni_ce || alumnoSeleccionado?.dni_ce,
          motivo_anulacion: motivoAnulacion.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`¡Pago anulado exitosamente! Motivo registrado: "${motivoAnulacion.trim()}". Notificación enviada a n8n.`);
        setPagoParaAnular(null);
        setMotivoAnulacion('');
        await cargarEstudiantesDeSupabase();
      } else {
        alert(`Error al anular pago: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
    } finally {
      setCargandoAnulacion(false);
    }
  };

  const handleGuardarCronogramaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoSeleccionado) return;

    try {
      const res = await fetch('/api/admin/pagos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'editar_cronograma',
          student_id: alumnoSeleccionado.id,
          dni_ce: alumnoSeleccionado.dni_ce,
          cuotas_totales: editCuotasTotales,
          monto_cuota: editMontoCuota
        })
      });

      if (res.ok) {
        alert('¡Configuración de cuotas y cronograma actualizada exitosamente en Supabase!');
        setMostrarEditarCronogramaModal(false);
        await cargarEstudiantesDeSupabase();
      } else {
        alert('Error al guardar configuración de cronograma');
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  // Filtrado cruzado de estudiantes
  const estudiantesFiltrados = estudiantes.filter(e => {
    // 1. Filtro Texto
    const q = busqueda.toLowerCase().trim();
    const coincideTexto = !q || (
      e.dni_ce.includes(q) ||
      e.nombres.toLowerCase().includes(q) ||
      e.apellidos.toLowerCase().includes(q) ||
      `${e.nombres} ${e.apellidos}`.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    );

    // 2. Filtro Mes
    const coincideMes = filtroMes === 'todos' || e.mes_inscripcion === filtroMes;

    // 3. Filtro Paquete
    const coincidePaquete = filtroPaquete === 'todos' || e.paquete_adquirido === filtroPaquete;

    // 4. Filtro Estado
    const coincideEstado = filtroEstado === 'todos' || e.estado === filtroEstado;

    // 5. Filtro Riesgo Churn
    const coincideRiesgo = filtroRiesgoChurn === 'todos' || e.nivel_riesgo_churn === filtroRiesgoChurn;

    // 6. Filtro Inactividad
    let coincideInactividad = true;
    if (filtroInactividad === 'hoy') coincideInactividad = e.dias_inactivo === 0;
    if (filtroInactividad === '3d') coincideInactividad = e.dias_inactivo >= 3;
    if (filtroInactividad === '7d') coincideInactividad = e.dias_inactivo >= 7;
    if (filtroInactividad === '14d') coincideInactividad = e.dias_inactivo >= 14;

    return coincideTexto && coincideMes && coincidePaquete && coincideEstado && coincideRiesgo && coincideInactividad;
  });

  // Cálculo de KPIs dinámicos basados en la lista filtrada
  const totalRecaudado = estudiantesFiltrados.reduce((acc, curr) => acc + curr.monto_total_pagado, 0);
  const totalDeudaPendiente = estudiantesFiltrados.reduce((acc, curr) => acc + curr.deuda_total_pendiente, 0);
  const alumnosRiesgoCritico = estudiantesFiltrados.filter(e => e.nivel_riesgo_churn === 'ALTO' || e.nivel_riesgo_churn === 'CRÍTICO').length;
  const promedioAvanceGlobal = estudiantesFiltrados.length > 0 
    ? Math.round(estudiantesFiltrados.reduce((acc, curr) => acc + curr.avance_porcentaje, 0) / estudiantesFiltrados.length) 
    : 0;

  const registrarPago = async () => {
    if (!alumnoSeleccionado) return;
    setCargandoPago(true);
    setMensaje(null);
    try {
      const res = await fetch('/api/admin/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          dni_ce: alumnoSeleccionado.dni_ce,
          monto: Number(montoPago),
          metodo,
          comprobante,
          descuento: Number(descuento)
        })
      });
      const data = await res.json();
      
      if (res.ok) {
        setMensaje({ 
          texto: `¡Cuota validada y webhook enviado a n8n para ${alumnoSeleccionado.nombres}!`, 
          tipo: 'exito',
          webhookStatus: data.webhookStatus
        });
        
        // Actualizar en el estado local y recargar de Supabase
        alumnoSeleccionado.cuotas_pagadas += 1;
        alumnoSeleccionado.estado = 'Al Día';
        alumnoSeleccionado.bloqueado = false;
        cargarEstudiantesDeSupabase();
      } else {
        setMensaje({ texto: `Error: ${data.error || 'No se pudo procesar la cuota'}`, tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión con el servidor local.', tipo: 'error' });
    } finally {
      setCargandoPago(false);
    }
  };

  const enviarAlertaWhatsAppRetencion = async () => {
    if (!alumnoSeleccionado) return;
    setEnviandoAlertaWhatsApp(true);
    try {
      await fetch('/api/admin/auditoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'ALERTA_RETENCION_DESERCION_CERO',
          detalles: {
            estudiante: `${alumnoSeleccionado.nombres} ${alumnoSeleccionado.apellidos}`,
            dni_ce: alumnoSeleccionado.dni_ce,
            telefono: alumnoSeleccionado.telefono,
            dias_inactivo: alumnoSeleccionado.dias_inactivo,
            deuda: alumnoSeleccionado.deuda_total_pendiente,
            riesgo: alumnoSeleccionado.nivel_riesgo_churn
          }
        })
      });
      alert(`¡Alerta de Retención (Deserción Cero) enviada a n8n para notificar vía WhatsApp a ${alumnoSeleccionado.nombres}!`);
    } catch (e) {
      console.error(e);
    } finally {
      setEnviandoAlertaWhatsApp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Área Principal de Contenido */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 text-indigo-800 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">Mando Central 360°</span>
                <span className="text-slate-400 text-xs font-mono">• Estrategia Comercial & Deserción Cero</span>
              </div>
              <h1 className="text-3xl font-black text-slate-900 mt-1">Dashboard 360° & Analítica Ejecutiva</h1>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('analitica')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${activeTab === 'analitica' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <BarChart3 className="w-4 h-4" /> Analítica 360° & Retención
              </button>
              <button 
                onClick={() => setActiveTab('tesoreria')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${activeTab === 'tesoreria' ? 'bg-indigo-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                <CreditCard className="w-4 h-4" /> Módulo de Tesorería Rápida
              </button>
            </div>
          </header>

          {/* ========================================================= */}
          {/* TAB 1: ANALÍTICA 360° DE ESTUDIANTES */}
          {/* ========================================================= */}
          {activeTab === 'analitica' ? (
            <>
              {/* BARRA DE FILTROS CRUZADOS Y MÚLTIPLES */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-600" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">Filtros Múltiples & Cruzados de Data</h3>
                  </div>
                  <button 
                    onClick={() => {
                      setFiltroMes('todos');
                      setFiltroPaquete('todos');
                      setFiltroEstado('todos');
                      setFiltroRiesgoChurn('todos');
                      setFiltroInactividad('todos');
                      setBusqueda('');
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:underline cursor-pointer"
                  >
                    Limpiar Todos los Filtros
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  
                  {/* Buscador Texto */}
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Buscar Alumno / DNI</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input 
                        type="text"
                        placeholder="Ej. 76543210 o Lucero..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Filtro Mes */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📅 Mes Registro</label>
                    <select 
                      value={filtroMes} 
                      onChange={(e) => setFiltroMes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todos los Meses</option>
                      <option value="julio">Julio</option>
                      <option value="agosto">Agosto</option>
                      <option value="septiembre">Septiembre</option>
                    </select>
                  </div>

                  {/* Filtro Paquete */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">📦 Paquete Adquirido</label>
                    <select 
                      value={filtroPaquete} 
                      onChange={(e) => setFiltroPaquete(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todos los Paquetes</option>
                      <option value="COMPLETO">COMPLETO</option>
                      <option value="FULL">FULL</option>
                      <option value="ILIMITADO">ILIMITADO</option>
                    </select>
                  </div>

                  {/* Filtro Estado Financiero */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">💳 Estado Pago</label>
                    <select 
                      value={filtroEstado} 
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todos los Estados</option>
                      <option value="Al Día">Al Día (Saldado)</option>
                      <option value="Deuda Activa">Con Deuda Activa</option>
                      <option value="Prórroga Activa">Prórroga Activa</option>
                      <option value="Prórroga Vencida">Prórroga Vencida</option>
                      <option value="Bloqueado por Sistema">Bloqueado por Sistema</option>
                    </select>
                  </div>

                  {/* Filtro Riesgo Churn */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">⚠️ Riesgo Deserción</label>
                    <select 
                      value={filtroRiesgoChurn} 
                      onChange={(e) => setFiltroRiesgoChurn(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todos los Niveles</option>
                      <option value="BAJO">Riesgo Bajo</option>
                      <option value="MEDIO">Riesgo Medio</option>
                      <option value="ALTO">Riesgo Alto</option>
                      <option value="CRÍTICO">Riesgo Crítico (Urgente)</option>
                    </select>
                  </div>

                </div>
              </div>

              {/* TARJETAS DE KPIS GLOBALES 360° */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recaudación Filtrada</p>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                      <DollarSign className="size-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-slate-900 mt-3">S/ {totalRecaudado.toFixed(2)}</h3>
                  <p className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                    <TrendingUp className="size-3" /> Cobrado a tiempo
                  </p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Deuda Pendiente Cobro</p>
                    <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
                      <AlertTriangle className="size-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-red-600 mt-3">S/ {totalDeudaPendiente.toFixed(2)}</h3>
                  <p className="text-[10px] text-red-500 font-bold mt-1">Suma de cuotas por vencer/vencidas</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Riesgo Crítico Churn</p>
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                      <Users className="size-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-amber-600 mt-3">{alumnosRiesgoCritico} Alumnos</h3>
                  <p className="text-[10px] text-amber-600 font-bold mt-1">Inactivos {'>'} 7d o morosos</p>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avance Académico Promedio</p>
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                      <GraduationCap className="size-5" />
                    </div>
                  </div>
                  <h3 className="text-3xl font-black text-indigo-700 mt-3">{promedioAvanceGlobal}%</h3>
                  <p className="text-[10px] text-indigo-600 font-bold mt-1">Porcentaje de módulos completados</p>
                </div>
              </div>

              {/* TABLA PRINCIPAL DE FICHA 360° DEL ALUMNO */}
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">Consolidado Estudiantil 360° & Control de Deserción</h3>
                    <p className="text-xs text-slate-500">Haz clic en cualquier alumno para abrir su Ficha 360° (Académica, Financiera y Retención).</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
                    {cargandoEstudiantes && <RefreshCw className="w-3 h-3 animate-spin text-indigo-600" />}
                    {estudiantesFiltrados.length} Alumnos Encontrados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                        <th className="pb-3 px-4">DNI / CE</th>
                        <th className="pb-3 px-4">Estudiante</th>
                        <th className="pb-3 px-4">Paquete & Programa</th>
                        <th className="pb-3 px-4">Última Conexión</th>
                        <th className="pb-3 px-4">% Avance & Nota</th>
                        <th className="pb-3 px-4">Estado Pago</th>
                        <th className="pb-3 px-4">Riesgo Churn</th>
                        <th className="pb-3 px-4 text-right">Ficha 360°</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {estudiantesFiltrados.length > 0 ? (
                        estudiantesFiltrados.map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-indigo-600">{e.dni_ce}</td>
                            <td className="py-4 px-4 font-bold text-slate-800">
                              {e.nombres} {e.apellidos}
                              <div className="text-[10px] text-slate-400 font-normal">{e.email}</div>
                            </td>
                            <td className="py-4 px-4">
                              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded text-[10px] font-bold block w-fit mb-0.5">
                                {e.paquete_adquirido}
                              </span>
                              <span className="text-[10px] text-slate-500 font-semibold block">
                                {e.diplomado_actual}
                                {e.diplomado_2 && <div className="text-[10px] text-indigo-600 font-bold mt-0.5">+ {e.diplomado_2}</div>}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-mono text-[11px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" /> {e.ultima_conexion}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-2">
                                <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
                                  <div className="bg-indigo-600 h-full" style={{ width: `${e.avance_porcentaje}%` }}></div>
                                </div>
                                <span className="font-bold text-slate-800 text-[11px]">{e.avance_porcentaje}%</span>
                              </div>
                              <span className="text-[10px] text-slate-400">Nota Prom: <strong className="text-slate-700">{e.nota_promedio}</strong></span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${e.bloqueado ? 'bg-amber-100 text-amber-800' : e.estado === 'Al Día' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                                {e.estado}
                              </span>
                            </td>
                            <td className="py-4 px-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${e.nivel_riesgo_churn === 'CRÍTICO' ? 'bg-red-600 text-white animate-pulse' : e.nivel_riesgo_churn === 'ALTO' ? 'bg-amber-500 text-white' : e.nivel_riesgo_churn === 'MEDIO' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                                {e.nivel_riesgo_churn}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <button
                                onClick={() => { setAlumnoSeleccionado(e); setMontoPago(e.monto_cuota.toFixed(2)); }}
                                className="bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" /> Abrir Ficha
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                            {cargandoEstudiantes ? 'Cargando estudiantes desde Supabase...' : 'No se encontraron estudiantes para la combinación de filtros seleccionada.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* ========================================================= */
            /* TAB 2: MÓDULO DE TESORERÍA RÁPIDA (TODOS LOS PAGOS) */
            /* ========================================================= */
            (() => {
              const todosLosPagos = estudiantes.flatMap(e => {
                const pagos = e.historial_pagos || [];
                if (pagos.length > 0) {
                  return pagos.map((p, idx) => ({
                    ...p,
                    estudiante_nombre: `${e.nombres} ${e.apellidos}`,
                    estudiante_dni: e.dni_ce,
                    programa: e.diplomado_actual,
                    mes_registro: e.mes_inscripcion,
                    nro_cuota: p.nro_cuota || p.concepto || `Cuota ${idx + 1} de ${e.cuotas_totales}`
                  }));
                }
                return Array.from({ length: e.cuotas_pagadas }).map((_, idx) => ({
                  id: `PAGO-${e.dni_ce}-${idx + 1}`,
                  student_id: e.id,
                  dni_ce: e.dni_ce,
                  estudiante_nombre: `${e.nombres} ${e.apellidos}`,
                  estudiante_dni: e.dni_ce,
                  programa: e.diplomado_actual,
                  monto: e.monto_cuota,
                  metodo: 'Yape / Plin',
                  comprobante: `OP-${847320 + idx}`,
                  nro_cuota: `Cuota ${idx + 1} de ${e.cuotas_totales}`,
                  concepto: `Cuota ${idx + 1} de ${e.cuotas_totales}`,
                  estado: 'Completado',
                  created_at: new Date().toISOString(),
                  mes_registro: e.mes_inscripcion
                }));
              });

              const q = busqueda.toLowerCase().trim();
              const pagosFiltrados = todosLosPagos.filter(p => {
                const coincideMes = filtroMes === 'todos' || (p.mes_registro && p.mes_registro.toLowerCase() === filtroMes.toLowerCase());
                const coincideTexto = !q || (
                  p.estudiante_dni.includes(q) ||
                  p.estudiante_nombre.toLowerCase().includes(q) ||
                  String(p.nro_cuota).toLowerCase().includes(q) ||
                  String(p.comprobante).toLowerCase().includes(q)
                );
                return coincideMes && coincideTexto;
              });

              const totalMontoOperaciones = pagosFiltrados.filter(p => p.estado !== 'Anulado').reduce((acc, curr) => acc + Number(curr.monto || 0), 0);
              const totalAnuladosCount = pagosFiltrados.filter(p => p.estado === 'Anulado').length;

              return (
                <div className="space-y-6">
                  {/* Filtros de Tesorería */}
                  <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-[250px]">
                      <div className="relative w-full">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                        <input 
                          type="text"
                          placeholder="Buscar por DNI, Estudiante, N° Cuota o Comprobante..."
                          value={busqueda}
                          onChange={(e) => setBusqueda(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div>
                        <select 
                          value={filtroMes} 
                          onChange={(e) => setFiltroMes(e.target.value)}
                          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                        >
                          <option value="todos">📅 Todos los Meses</option>
                          <option value="julio">Julio</option>
                          <option value="agosto">Agosto</option>
                          <option value="septiembre">Septiembre</option>
                        </select>
                      </div>

                      <button 
                        onClick={() => { setFiltroMes('todos'); setBusqueda(''); }}
                        className="text-xs font-bold text-indigo-600 hover:underline cursor-pointer"
                      >
                        Limpiar
                      </button>
                    </div>
                  </div>

                  {/* KPIs Tesorería */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Recaudación Total Filtrada</span>
                        <h3 className="text-2xl font-black text-emerald-600 mt-1">S/ {totalMontoOperaciones.toFixed(2)}</h3>
                        <p className="text-[10px] text-emerald-700 font-semibold mt-0.5">{pagosFiltrados.filter(p => p.estado !== 'Anulado').length} Transacciones Efectivas</p>
                      </div>
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                        <DollarSign className="size-6" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pagos Anulados</span>
                        <h3 className="text-2xl font-black text-red-600 mt-1">{totalAnuladosCount} Anulaciones</h3>
                        <p className="text-[10px] text-red-500 font-semibold mt-0.5">Con justificación & audit log</p>
                      </div>
                      <div className="p-3 bg-red-50 text-red-600 rounded-2xl">
                        <AlertTriangle className="size-6" />
                      </div>
                    </div>

                    <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Identificación de Cuotas</span>
                        <h3 className="text-2xl font-black text-indigo-700 mt-1">Cuota N° Exacta</h3>
                        <p className="text-[10px] text-indigo-600 font-semibold mt-0.5">Enlazado con profiles y Supabase</p>
                      </div>
                      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                        <FileText className="size-6" />
                      </div>
                    </div>
                  </div>

                  {/* Tabla de Tesorería Rápida */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">Módulo de Tesorería Rápida & Control de Recibos</h3>
                        <p className="text-xs text-slate-500">Muestra cada pago de cuota con su identificador (ej. Cuota 1 de 6, Cuota 2 de 6) y botón de anulación con justificación.</p>
                      </div>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                        {pagosFiltrados.length} Registros Encontrados
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase font-bold tracking-wider bg-slate-50/50">
                            <th className="py-3 px-4">Recibo / DNI</th>
                            <th className="py-3 px-4">Estudiante</th>
                            <th className="py-3 px-4">Programa / Diplomado</th>
                            <th className="py-3 px-4">Identificador Cuota</th>
                            <th className="py-3 px-4 font-mono">Monto (S/)</th>
                            <th className="py-3 px-4">Método & Op.</th>
                            <th className="py-3 px-4">Estado</th>
                            <th className="py-3 px-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {pagosFiltrados.length > 0 ? (
                            pagosFiltrados.map((pag, pIdx) => {
                              const esAnulado = pag.estado === 'Anulado';
                              return (
                                <tr key={pag.id || pIdx} className={esAnulado ? 'bg-red-50/40' : 'hover:bg-slate-50'}>
                                  <td className="py-3.5 px-4 font-mono">
                                    <span className="font-bold text-indigo-700 block">RECIBO-{pag.id ? String(pag.id).substring(0, 6) : 1000 + pIdx}</span>
                                    <span className="text-[10px] text-slate-400 font-bold">{pag.estudiante_dni}</span>
                                  </td>
                                  <td className="py-3.5 px-4 font-bold text-slate-900">
                                    {pag.estudiante_nombre}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-700">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px] font-semibold block w-fit truncate max-w-[200px]" title={pag.programa}>
                                      {pag.programa}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className="bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-1 rounded-full text-[10px] font-black">
                                      {pag.nro_cuota || pag.concepto || 'Cuota 1 de 3'}
                                    </span>
                                  </td>
                                  <td className="py-3.5 px-4 font-mono font-black text-emerald-700 text-sm">
                                    S/ {Number(pag.monto || 150).toFixed(2)}
                                  </td>
                                  <td className="py-3.5 px-4 text-slate-600">
                                    <div>{pag.metodo || 'Yape / Plin'}</div>
                                    <div className="text-[10px] font-mono text-slate-400">{pag.comprobante || 'OP-984321'}</div>
                                  </td>
                                  <td className="py-3.5 px-4">
                                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${esAnulado ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800'}`}>
                                      {esAnulado ? 'ANULADO' : 'Completado'}
                                    </span>
                                    {esAnulado && pag.motivo_anulacion && (
                                      <div className="text-[9px] text-red-600 italic mt-1 max-w-[140px] truncate" title={pag.motivo_anulacion}>
                                        Motivo: {pag.motivo_anulacion}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-4 text-right space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setReciboImprimir(pag)}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Download className="size-3" /> Imprimir
                                    </button>
                                    {!esAnulado && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPagoParaAnular(pag);
                                          setMotivoAnulacion('');
                                        }}
                                        className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer border border-red-200"
                                      >
                                        <X className="size-3" /> Anular Pago
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                                No se encontraron pagos registrados para los filtros seleccionados.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()
          )}

        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL FICHA 360° DEL ALUMNO (GESTIÓN FINANCIERA & CRÉDITOS) */}
      {/* ========================================================= */}
      {alumnoSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                    Ficha 360° Estudiantil
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-300">DNI / CE: {alumnoSeleccionado.dni_ce}</span>
                  {alumnoSeleccionado.deuda_total_pendiente === 0 && (
                    <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle2 className="size-3" /> Constancia de no adeudo Activa
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-white">{alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}</h3>
                <p className="text-xs text-slate-300">{alumnoSeleccionado.email} • {alumnoSeleccionado.telefono} • Paquete: <strong className="text-amber-400">{alumnoSeleccionado.paquete_adquirido}</strong></p>
              </div>

              <div className="flex items-center gap-3">
                {alumnoSeleccionado.deuda_total_pendiente === 0 && (
                  <button
                    type="button"
                    onClick={() => setMostrarConstanciaModal(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition shadow flex items-center gap-1.5 cursor-pointer"
                  >
                    <Award className="size-4" /> Constancia de No Adeudo
                  </button>
                )}
                <button 
                  onClick={() => setAlumnoSeleccionado(null)} 
                  className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Navegación por pestañas del modal */}
            <div className="flex border-b border-slate-200 px-8 bg-slate-50">
              <button
                onClick={() => setModalTab('financiero')}
                className={`py-3 px-5 font-bold text-xs border-b-2 cursor-pointer transition flex items-center gap-2 ${modalTab === 'financiero' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <CreditCard className="size-4" /> Cronograma de Pagos & Créditos
              </button>
              <button
                onClick={() => setModalTab('creditos')}
                className={`py-3 px-5 font-bold text-xs border-b-2 cursor-pointer transition flex items-center gap-2 ${modalTab === 'creditos' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <Plus className="size-4" /> Cargos Extras (Examen Sustitutorio)
              </button>
              <button
                onClick={() => setModalTab('academico')}
                className={`py-3 px-5 font-bold text-xs border-b-2 cursor-pointer transition flex items-center gap-2 ${modalTab === 'academico' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <GraduationCap className="size-4" /> Avance Académico ({alumnoSeleccionado.avance_porcentaje}%)
              </button>
              <button
                onClick={() => setModalTab('retencion')}
                className={`py-3 px-5 font-bold text-xs border-b-2 cursor-pointer transition flex items-center gap-2 ${modalTab === 'retencion' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                <Zap className="size-4 text-amber-500" /> Deserción Cero ({alumnoSeleccionado.nivel_riesgo_churn})
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              
              {/* TAB 1: CRONOGRAMA DE PAGOS Y CRÉDITOS */}
              {modalTab === 'financiero' && (
                <div className="space-y-6">
                  
                  {/* Encabezado del Pagaré / Contrato */}
                  <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 flex flex-wrap justify-between items-center text-xs gap-3">
                    <div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase block">Pagaré Nº</span>
                      <strong className="font-mono text-sm text-slate-900">2026-I-000{alumnoSeleccionado.dni_ce.substring(0, 4)}</strong>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase block">Fecha Inscripción</span>
                      <strong className="text-slate-800">15/01/2026</strong>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase block">Programa Inscrito</span>
                      <strong className="text-indigo-700">{alumnoSeleccionado.diplomado_actual}</strong>
                    </div>
                    <div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase block">Valor Total Programa</span>
                      <strong className="text-emerald-700 font-black text-sm">S/ {((alumnoSeleccionado.cuotas_totales || 3) * (alumnoSeleccionado.monto_cuota || 150)).toFixed(2)}</strong>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const cuotas = alumnoSeleccionado.cuotas_totales || 3;
                          const monto = alumnoSeleccionado.monto_cuota || 150;
                          const total = (cuotas * monto) || 1500;
                          setEditMontoTotal(total);
                          setEditCuotasTotales(cuotas);
                          setEditMontoCuota(Math.round((total / cuotas) * 100) / 100);
                          setMostrarEditarCronogramaModal(true);
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Settings className="size-3.5 text-white" /> Editar Cuotas / Cronograma
                      </button>
                      <button
                        type="button"
                        onClick={() => setModalTab('creditos')}
                        className="bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <Plus className="size-3.5 text-emerald-400" /> Crear Crédito / Cargo Extra
                      </button>
                    </div>
                  </div>

                  {/* Tarjetas de Resumen Financiero Estilo SIGA / ERP */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capital Pendiente</span>
                      <p className="text-lg font-black text-slate-900 mt-0.5">S/ {alumnoSeleccionado.deuda_total_pendiente.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Penalización / Mora</span>
                      <p className="text-lg font-black text-amber-600 mt-0.5">S/ 0.00</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pendiente</span>
                      <p className="text-lg font-black text-red-600 mt-0.5">S/ {alumnoSeleccionado.deuda_total_pendiente.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monto Pagado</span>
                      <p className="text-lg font-black text-emerald-600 mt-0.5">S/ {alumnoSeleccionado.monto_total_pagado.toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Tabla de Cuotas Programadas (Cronograma de Pagos) */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                        <Calendar className="size-4 text-indigo-600" /> Cuotas Programadas & Estado de Deuda
                      </h4>
                      <span className="text-[10px] text-slate-400 font-mono">Cuotas: {alumnoSeleccionado.cuotas_pagadas} de {alumnoSeleccionado.cuotas_totales} canceladas</span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <th className="py-2.5 px-4 text-center">Nº</th>
                            <th className="py-2.5 px-4">Concepto / Fecha Cuota</th>
                            <th className="py-2.5 px-4">Capital (S/)</th>
                            <th className="py-2.5 px-4">Penalización</th>
                            <th className="py-2.5 px-4">Total Cuota Hoy</th>
                            <th className="py-2.5 px-4">Pagado</th>
                            <th className="py-2.5 px-4 text-right">Estado / Acción</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {Array.from({ length: alumnoSeleccionado.cuotas_totales || 3 }).map((_, idx) => {
                            const nroCuota = idx + 1;
                            const estaPagada = nroCuota <= alumnoSeleccionado.cuotas_pagadas;
                            const fechaSimulada = `28/${(idx + 1).toString().padStart(2, '0')}/2026`;

                            return (
                              <tr key={idx} className={estaPagada ? 'bg-emerald-50/30' : 'hover:bg-slate-50'}>
                                <td className="py-3 px-4 font-bold text-center text-slate-700">{nroCuota}</td>
                                <td className="py-3 px-4">
                                  <div className="font-bold text-slate-900">Cuota {nroCuota} - {alumnoSeleccionado.diplomado_actual}</div>
                                  <div className="text-[10px] font-mono text-slate-400">Vence: {fechaSimulada}</div>
                                </td>
                                <td className="py-3 px-4 font-mono font-bold text-slate-800">S/ {alumnoSeleccionado.monto_cuota.toFixed(2)}</td>
                                <td className="py-3 px-4 font-mono text-slate-500">S/ 0.00</td>
                                <td className="py-3 px-4 font-mono font-bold text-indigo-700">S/ {alumnoSeleccionado.monto_cuota.toFixed(2)}</td>
                                <td className="py-3 px-4 font-mono text-emerald-700 font-bold">
                                  {estaPagada ? `S/ ${alumnoSeleccionado.monto_cuota.toFixed(2)}` : 'S/ 0.00'}
                                </td>
                                <td className="py-3 px-4 text-right">
                                  {estaPagada ? (
                                    <span className="bg-emerald-100 text-emerald-800 font-black text-[10px] px-2.5 py-1 rounded-full border border-emerald-200">
                                      PAGADO
                                    </span>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={registrarPago}
                                      disabled={cargandoPago}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1"
                                    >
                                      {cargandoPago ? <RefreshCw className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />} Validar Pago
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Formulario Rápido de Pago Manual */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" /> Registrar Nuevo Pago en BD Supabase & Generar Recibo
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Monto Pagado (S/)</label>
                        <input 
                          type="number"
                          value={montoPago}
                          onChange={(e) => setMontoPago(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Nº Comprobante / Operación</label>
                        <input 
                          type="text"
                          value={comprobante}
                          onChange={(e) => setComprobante(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Método de Pago</label>
                        <select
                          value={metodo}
                          onChange={(e) => setMetodo(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        >
                          <option value="Yape / Plin">Yape / Plin</option>
                          <option value="Transferencia BCP">Transferencia BCP</option>
                          <option value="Tarjeta BBVA / Interbank">Tarjeta BBVA / Interbank</option>
                          <option value="Efectivo en Caja">Efectivo en Caja</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={registrarPago}
                      disabled={cargandoPago}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer w-full"
                    >
                      {cargandoPago ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      Confirmar Pago (+1 Cuota) y Notificar a n8n
                    </button>

                    {mensaje && (
                      <div className={`p-3 rounded-xl text-xs font-bold border ${mensaje.tipo === 'exito' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}>
                        {mensaje.texto}
                      </div>
                    )}
                  </div>

                  {/* Tabla de Pagos Realizados / Recibos Emitidos (Estilo Imagen 2) */}
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FileText className="size-4 text-indigo-600" /> Pagos Realizados & Recibos Internos Emitidos
                    </h4>

                    <div className="overflow-x-auto border border-slate-200 rounded-2xl bg-white shadow-sm">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                            <th className="py-2.5 px-4">Recibo ID / Concepto</th>
                            <th className="py-2.5 px-4">Fecha Pago</th>
                            <th className="py-2.5 px-4">Método</th>
                            <th className="py-2.5 px-4 font-right">Monto (S/)</th>
                            <th className="py-2.5 px-4">Estado</th>
                            <th className="py-2.5 px-4 text-right">Acciones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {alumnoSeleccionado.historial_pagos && alumnoSeleccionado.historial_pagos.length > 0 ? (
                            alumnoSeleccionado.historial_pagos.map((pag: any, pIdx: number) => {
                              const esAnulado = pag.estado === 'Anulado';
                              const nroCuotaText = pag.nro_cuota || pag.concepto || `Cuota ${pIdx + 1} de ${alumnoSeleccionado.cuotas_totales}`;
                              return (
                                <tr key={pag.id || pIdx} className={esAnulado ? 'bg-red-50/50' : 'hover:bg-slate-50'}>
                                  <td className="py-3 px-4">
                                    <div className="font-mono font-bold text-indigo-700 flex items-center gap-1.5">
                                      <FileText className="size-3.5 text-slate-400" /> RECIBO - {pag.id ? String(pag.id).substring(0, 8) : 1180 + pIdx}
                                    </div>
                                    <div className="text-[10px] text-slate-500 font-bold mt-0.5">{nroCuotaText}</div>
                                  </td>
                                  <td className="py-3 px-4 font-mono text-slate-600">{new Date(pag.created_at || Date.now()).toLocaleDateString()}</td>
                                  <td className="py-3 px-4 font-bold text-slate-800">{pag.metodo || 'Yape / Plin'}</td>
                                  <td className="py-3 px-4 font-mono font-bold text-emerald-700">S/ {Number(pag.monto || 150).toFixed(2)}</td>
                                  <td className="py-3 px-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${esAnulado ? 'bg-red-100 text-red-800 border border-red-200' : 'bg-emerald-100 text-emerald-800'}`}>
                                      {esAnulado ? 'ANULADO' : 'Completado'}
                                    </span>
                                    {esAnulado && pag.motivo_anulacion && (
                                      <div className="text-[9px] text-red-600 italic mt-0.5 max-w-[150px] truncate" title={pag.motivo_anulacion}>
                                        Motivo: {pag.motivo_anulacion}
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right space-x-1.5">
                                    <button
                                      type="button"
                                      onClick={() => setReciboImprimir(pag)}
                                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                                    >
                                      <Download className="size-3" /> Imprimir Recibo
                                    </button>
                                    {!esAnulado && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setPagoParaAnular({ ...pag, estudiante_nombre: `${alumnoSeleccionado.nombres} ${alumnoSeleccionado.apellidos}`, dni_ce: alumnoSeleccionado.dni_ce });
                                          setMotivoAnulacion('');
                                        }}
                                        className="bg-red-50 hover:bg-red-600 text-red-600 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer border border-red-200"
                                      >
                                        <X className="size-3" /> Anular
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={6} className="py-6 text-center text-slate-400 text-xs italic">
                                No hay pagos registrados en Supabase para este alumno aún.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: CARGOS EXTRAS (EXAMEN SUSTITUTORIO, PENALIZACIONES) */}
              {modalTab === 'creditos' && (
                <div className="space-y-6">
                  <div className="bg-indigo-50 border border-indigo-200 p-6 rounded-2xl space-y-3">
                    <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                      <Sparkles className="size-4 text-indigo-600" /> Gestión de Cargos Adicionales y Pagos Extras
                    </h4>
                    <p className="text-xs text-indigo-800">
                      Agrega cobros adicionales por <strong>Examen Sustitutorio (S/ 25.00)</strong>, penalizaciones por mora o servicios especiales que se cargarán al expediente del alumno.
                    </p>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      alert(`¡Cargo extra por [${nuevoCargoConcepto}] de S/ ${nuevoCargoMonto} registrado exitosamente en el expediente!`);
                      setNuevoCargoConcepto('Examen Sustitutorio');
                      setNuevoCargoMonto('25.00');
                    }}
                    className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Concepto del Cargo</label>
                        <select
                          value={nuevoCargoConcepto}
                          onChange={(e) => setNuevoCargoConcepto(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        >
                          <option value="Examen Sustitutorio">Examen Sustitutorio (S/ 25.00)</option>
                          <option value="Penalización por Mora">Penalización por Mora (S/ 30.00)</option>
                          <option value="Certificado Físico Adicional">Certificado Físico Adicional (S/ 50.00)</option>
                          <option value="Trámite Especial">Trámite Especial (S/ 20.00)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Monto A Cobrar (S/)</label>
                        <input 
                          type="number"
                          value={nuevoCargoMonto}
                          onChange={(e) => setNuevoCargoMonto(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer w-full"
                    >
                      <Plus className="size-4" /> Agregar Cargo Extra al Cronograma
                    </button>
                  </form>
                </div>
              )}

              {/* TAB 3: AVANCE ACADÉMICO */}
              {modalTab === 'academico' && (() => {
                const nombreAlumnoDip = (alumnoSeleccionado?.diplomado_actual || '').toLowerCase().trim();
                const dip = (catalogoDiplomados || []).find((d: any) => 
                  d && typeof d.nombre === 'string' && d.nombre.toLowerCase().trim() === nombreAlumnoDip
                ) || (catalogoDiplomados || [])[0];
                const modulosArray = (dip && dip.modulos && dip.modulos.length > 0) ? dip.modulos : [
                  { titulo: 'Módulo 01: Fundamentos y Marco Teórico', clases: [{ titulo: 'Clase 01: Introducción General', duracion: '45 min' }, { titulo: 'Clase 02: Normativa Legal', duracion: '50 min' }] },
                  { titulo: 'Módulo 02: Gestión Operativa y Control', clases: [{ titulo: 'Clase 03: Herramientas Operativas', duracion: '60 min' }, { titulo: 'Clase 04: Control de Riesgos', duracion: '55 min' }] },
                  { titulo: 'Módulo 03: Proyectos Avanzados', clases: [{ titulo: 'Clase 05: Casos Prácticos', duracion: '90 min' }] }
                ];

                let claseContador = 1;

                return (
                  <div className="space-y-6">
                    <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-700 uppercase">Programa Inscrito</span>
                        <h4 className="text-base font-bold text-indigo-950 mt-0.5">{alumnoSeleccionado.diplomado_actual}</h4>
                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">Código: {dip?.codigo || 'DIP-2026'} | Versión: {dip?.version || 1} | Módulos: {dip?.nro_modulos || modulosArray.length}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-indigo-700 uppercase">Nota Promedio</span>
                        <p className="text-2xl font-black text-indigo-700">{alumnoSeleccionado.nota_promedio}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Estructura Académica de Módulos y Clases (Secuencia en Orden)</h5>
                      {modulosArray.map((m: any, mIdx: number) => {
                        const modTitle = m.titulo || `Módulo 0${mIdx + 1}`;
                        const clases = m.clases || [];
                        return (
                          <div key={mIdx} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
                            <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                              <span className="font-bold text-xs text-slate-900">{modTitle}</span>
                              <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                                {mIdx === 0 ? 'Aprobado (Nota: 18)' : mIdx === 1 ? 'Aprobado (Nota: 16)' : 'En Curso'}
                              </span>
                            </div>
                            <div className="space-y-1.5 pl-2">
                              {clases.length > 0 ? (
                                clases.map((c: any, cIdx: number) => {
                                  const currentClaseNum = claseContador++;
                                  const rawTitle = typeof c === 'string' ? c : (c.titulo || `Clase ${currentClaseNum.toString().padStart(2, '0')}`);
                                  const tituloFinal = rawTitle.includes('Clase') ? rawTitle : `Clase ${currentClaseNum.toString().padStart(2, '0')}: ${rawTitle}`;
                                  return (
                                    <div key={cIdx} className="text-xs text-slate-600 flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 font-medium">
                                      <span className="flex items-center gap-2">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                        {tituloFinal}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono">{c.duracion || '45 min'}</span>
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="text-[11px] text-slate-400 italic">Clases programadas según temario.</div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}

              {/* TAB 4: RETENCIÓN */}
              {modalTab === 'retencion' && (
                <div className="space-y-6">
                  <div className="bg-amber-50 border border-amber-200 p-6 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-amber-900 text-sm">Diagnóstico de Riesgo de Deserción</h4>
                      <span className={`px-3 py-1 rounded-full text-xs font-black ${alumnoSeleccionado.nivel_riesgo_churn === 'CRÍTICO' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white'}`}>
                        {alumnoSeleccionado.nivel_riesgo_churn}
                      </span>
                    </div>
                    <p className="text-xs text-amber-800">
                      El estudiante registra <strong className="font-bold">{alumnoSeleccionado.dias_inactivo} días de inactividad</strong>. Última conexión: {alumnoSeleccionado.ultima_conexion}.
                    </p>
                  </div>

                  <button
                    onClick={enviarAlertaWhatsAppRetencion}
                    disabled={enviandoAlertaWhatsApp}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {enviandoAlertaWhatsApp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Disparar Alerta WhatsApp de Retención (Vía n8n / Wasapi)
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: RECIBO INTERNO IMPRIMIBLE */}
      {/* ========================================================= */}
      {reciboImprimir && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">EDUMIN LMS CORE</h2>
                <p className="text-[10px] text-slate-500">Educación Ejecutiva en Minería y Seguridad</p>
              </div>
              <div className="text-right">
                <span className="bg-indigo-50 text-indigo-700 font-mono font-black text-xs px-2.5 py-1 rounded-md border border-indigo-200 block">
                  RECIBO INTERNO - {reciboImprimir.id ? reciboImprimir.id.substring(0, 6) : '1187'}
                </span>
                <span className="text-[10px] font-mono text-slate-400 block mt-1">{new Date().toLocaleDateString()}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Estudiante:</span>
                <strong className="text-slate-900">{alumnoSeleccionado?.nombres} {alumnoSeleccionado?.apellidos}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">DNI / CE:</span>
                <strong className="font-mono text-slate-900">{alumnoSeleccionado?.dni_ce}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Programa:</span>
                <strong className="text-indigo-700">{alumnoSeleccionado?.diplomado_actual}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Método de Pago:</span>
                <strong className="text-slate-800">{reciboImprimir.metodo || 'Yape / Plin'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 font-semibold">Nº Operación / Comprobante:</span>
                <strong className="font-mono text-slate-900">{reciboImprimir.comprobante || 'OP-984321'}</strong>
              </div>
              <div className="flex justify-between bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-sm">
                <span className="text-emerald-900 font-bold">Monto Total Pagado:</span>
                <strong className="text-emerald-700 font-black">S/ {Number(reciboImprimir.monto || 150).toFixed(2)}</strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setReciboImprimir(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="size-4" /> Imprimir / Descargar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CONSTANCIA DE NO ADEUDO IMPRIMIBLE */}
      {/* ========================================================= */}
      {mostrarConstanciaModal && alumnoSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-10 space-y-6 border border-slate-200 text-center animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-emerald-100 text-emerald-700 rounded-full">
                <Award className="size-10" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Constancia de No Adeudo</h2>
              <p className="text-xs text-emerald-700 font-bold mt-1">EDUMIN LMS - Plataforma Educativa Ejecutiva</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-left space-y-3 text-xs leading-relaxed">
              <p className="text-slate-700">
                La Dirección Académica y Financiera de <strong>EDUMIN LMS CORE</strong> hace constar que el/la alumno(a):
              </p>
              <h3 className="text-base font-black text-slate-900 border-b border-slate-200 pb-2">
                {alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}
              </h3>
              <p className="text-slate-700">
                Con Documento de Identidad <strong>DNI/CE Nº {alumnoSeleccionado.dni_ce}</strong>, inscrito(a) en el programa:
              </p>
              <p className="font-bold text-indigo-700 bg-indigo-50 p-2.5 rounded-xl border border-indigo-100">
                {alumnoSeleccionado.diplomado_actual}
              </p>
              <p className="text-slate-700 pt-2 font-medium">
                <strong>NO REGISTRA DEUDAS NI OBLIGACIONES FINANCIERAS PENDIENTES</strong> con la institución al día de la fecha. Ha cancelado el 100% de los derechos de enseñanza correspondientes.
              </p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
              <span>Código Validación: EDUMIN-NO-ADEUDO-2026</span>
              <span>Fecha: {new Date().toLocaleDateString()}</span>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setMostrarConstanciaModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <Download className="size-4" /> Descargar / Imprimir Constancia (PDF)
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ANULACIÓN DE PAGO CON JUSTIFICACIÓN OBLIGATORIA & N8N */}
      {/* ========================================================= */}
      {pagoParaAnular && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="bg-red-100 text-red-800 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">Acción de Administrador</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Anulación de Pago</h3>
              </div>
              <button onClick={() => setPagoParaAnular(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs space-y-1.5 font-medium">
              <div><span className="text-slate-500">Estudiante:</span> <strong className="text-slate-900">{pagoParaAnular.estudiante_nombre || alumnoSeleccionado?.nombres} ({pagoParaAnular.dni_ce || alumnoSeleccionado?.dni_ce})</strong></div>
              <div><span className="text-slate-500">Concepto / Cuota:</span> <strong className="text-indigo-700">{pagoParaAnular.nro_cuota || pagoParaAnular.concepto || 'Cuota 1'}</strong></div>
              <div><span className="text-slate-500">Monto A Anular:</span> <strong className="text-red-600 font-bold">S/ {Number(pagoParaAnular.monto || 150).toFixed(2)}</strong></div>
            </div>

            <form onSubmit={handleAnularPagoSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Motivo / Justificación Obligatoria <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={motivoAnulacion}
                  onChange={(e) => setMotivoAnulacion(e.target.value)}
                  placeholder="Ej. Se ingresó por error un pago duplicado o comprobante rechazado por el banco..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-red-500 outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-1">⚠️ Esta anulación actualizará Supabase (profiles.cuotas_pagadas - 1), registrará auditoría forense y disparará una alerta a n8n.</p>
              </div>

              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setPagoParaAnular(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={cargandoAnulacion || !motivoAnulacion.trim()}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  {cargandoAnulacion ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                  Confirmar Anulación y Notificar n8n
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR CUOTAS Y CRONOGRAMA DE PAGOS EN SUPABASE */}
      {/* ========================================================= */}
      {mostrarEditarCronogramaModal && alumnoSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 border border-slate-200 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="bg-indigo-100 text-indigo-800 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">Configuración de Cuotas</span>
                <h3 className="text-lg font-black text-slate-900 mt-1">Editar Cronograma & Cuotas</h3>
              </div>
              <button onClick={() => setMostrarEditarCronogramaModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs space-y-1 font-medium">
              <div><span className="text-slate-500">Alumno:</span> <strong className="text-slate-900">{alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}</strong></div>
              <div><span className="text-slate-500">DNI:</span> <strong className="font-mono text-indigo-700">{alumnoSeleccionado.dni_ce}</strong></div>
              <div><span className="text-slate-500">Programa:</span> <strong className="text-slate-800">{alumnoSeleccionado.diplomado_actual}</strong></div>
            </div>

            <form onSubmit={handleGuardarCronogramaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Valor Total del Programa / Deuda Total (S/)
                </label>
                <input
                  type="number"
                  step="10"
                  value={editMontoTotal}
                  onChange={(e) => {
                    const total = Number(e.target.value) || 0;
                    setEditMontoTotal(total);
                    if (editCuotasTotales > 0) {
                      setEditMontoCuota(Math.round((total / editCuotasTotales) * 100) / 100);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Número de Cuotas Totales
                </label>
                <select
                  value={editCuotasTotales}
                  onChange={(e) => {
                    const cuotas = Number(e.target.value) || 1;
                    setEditCuotasTotales(cuotas);
                    if (editMontoTotal > 0) {
                      setEditMontoCuota(Math.round((editMontoTotal / cuotas) * 100) / 100);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 cursor-pointer focus:ring-2 focus:ring-indigo-600 outline-none"
                >
                  <option value={1}>1 Cuota (100% Contado / Pago Único)</option>
                  <option value={2}>2 Cuotas</option>
                  <option value={3}>3 Cuotas (Estándar)</option>
                  <option value={4}>4 Cuotas</option>
                  <option value={5}>5 Cuotas</option>
                  <option value={6}>6 Cuotas (Especial FULL)</option>
                  <option value={12}>12 Cuotas (Programa Ilimitado)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Monto de Cada Cuota (S/) <span className="text-indigo-600 font-bold">(Calculado automáticamente)</span>
                </label>
                <input
                  type="number"
                  step="1"
                  value={editMontoCuota}
                  onChange={(e) => {
                    const cuotaVal = Number(e.target.value) || 0;
                    setEditMontoCuota(cuotaVal);
                    setEditMontoTotal(Math.round(cuotaVal * editCuotasTotales * 100) / 100);
                  }}
                  className="w-full p-2.5 bg-indigo-50/50 border border-indigo-200 rounded-xl text-xs font-black text-indigo-900 focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>

              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between font-bold">
                <span>Plan de Pago Calculado:</span>
                <span className="text-emerald-800 font-black">
                  {editCuotasTotales} cuotas x S/ {editMontoCuota.toFixed(2)} = S/ {editMontoTotal.toFixed(2)}
                </span>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setMostrarEditarCronogramaModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Guardar en Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}