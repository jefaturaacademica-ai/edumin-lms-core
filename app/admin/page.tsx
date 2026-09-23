'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, ShieldCheck, Users, BookOpen, Settings, LogOut,
  CheckCircle2, Activity, DollarSign, Calendar, FileText, Check, AlertCircle, 
  Tag, Download, Clock, UserCheck, Award, FileCheck, Server, RefreshCw,
  TrendingUp, AlertTriangle, Filter, Eye, Phone, MessageSquare, Send, Sparkles, BarChart3, GraduationCap, ArrowUpRight, Zap
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { MOCK_ESTUDIANTES, EstudianteCompleto } from '@/lib/data/mockStudents';

export default function AdminDashboard360() {
  const [activeTab, setActiveTab] = useState<'analitica' | 'tesoreria'>('analitica');
  
  // Filtros Cruzados / Múltiples
  const [filtroMes, setFiltroMes] = useState<string>('todos');
  const [filtroPaquete, setFiltroPaquete] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');
  const [filtroRiesgoChurn, setFiltroRiesgoChurn] = useState<string>('todos');
  const [filtroInactividad, setFiltroInactividad] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState<string>('');

  // Ficha 360° Modal
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<EstudianteCompleto | null>(null);
  const [modalTab, setModalTab] = useState<'financiero' | 'academico' | 'retencion'>('financiero');

  // Formulario de Pago en Ficha 360 / Tesorería
  const [montoPago, setMontoPago] = useState<string>('150.00');
  const [comprobante, setComprobante] = useState<string>('OP-984321');
  const [metodo, setMetodo] = useState<string>('Yape / Plin');
  const [descuento, setDescuento] = useState<string>('0');
  const [cargandoPago, setCargandoPago] = useState(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error'; webhookStatus?: number } | null>(null);

  // Webhook de Retención / Wasapi
  const [enviandoAlertaWhatsApp, setEnviandoAlertaWhatsApp] = useState(false);

  // Filtrado cruzado de estudiantes
  const estudiantesFiltrados = MOCK_ESTUDIANTES.filter(e => {
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
        alumnoSeleccionado.cuotas_pagadas += 1;
        alumnoSeleccionado.estado = 'Al Día';
        alumnoSeleccionado.bloqueado = false;
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
          {/* BARRA DE FILTROS CRUZADOS Y MÚLTIPLES (CRITICAL REQUIREMENT)*/}
          {/* ========================================================= */}
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

          {/* ========================================================= */}
          {/* TARJETAS DE KPIS GLOBALES 360°                            */}
          {/* ========================================================= */}
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

          {/* ========================================================= */}
          {/* TABLA PRINCIPAL DE FICHA 360° DEL ALUMNO (ENTERPRISE)     */}
          {/* ========================================================= */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Consolidado Estudiantil 360° & Control de Deserción</h3>
                <p className="text-xs text-slate-500">Haz clic en cualquier alumno para abrir su Ficha 360° (Académica, Financiera y Retención).</p>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
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
                          <span className="text-[10px] text-slate-500 font-semibold">{e.diplomado_actual}</span>
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
                        No se encontraron estudiantes para la combinación de filtros seleccionada.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL FICHA 360° DEL ALUMNO (ENTERPRISE DASHBOARD)        */}
      {/* ========================================================= */}
      {alumnoSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Header Modal */}
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Ficha 360° Estudiantil
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-500">DNI: {alumnoSeleccionado.dni_ce}</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900">{alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}</h3>
                <p className="text-xs text-slate-500">{alumnoSeleccionado.email} • {alumnoSeleccionado.telefono} • Canal: <strong className="text-slate-700">{alumnoSeleccionado.canal_adquisicion}</strong></p>
              </div>
              <button onClick={() => setAlumnoSeleccionado(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <ShieldCheck className="w-6 h-6 text-slate-400" />
              </button>
            </div>

            {/* Sub-navegación por pestañas del modal */}
            <div className="flex border-b border-slate-200 px-8 bg-slate-50/50">
              <button
                onClick={() => setModalTab('financiero')}
                className={`py-3 px-4 font-bold text-xs border-b-2 cursor-pointer transition ${modalTab === 'financiero' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                💳 Estado Financiero & Pagos
              </button>
              <button
                onClick={() => setModalTab('academico')}
                className={`py-3 px-4 font-bold text-xs border-b-2 cursor-pointer transition ${modalTab === 'academico' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                🎓 Avance Académico & Notas ({alumnoSeleccionado.avance_porcentaje}%)
              </button>
              <button
                onClick={() => setModalTab('retencion')}
                className={`py-3 px-4 font-bold text-xs border-b-2 cursor-pointer transition ${modalTab === 'retencion' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
              >
                ⚡ Deserción Cero & Retención (Riesgo: {alumnoSeleccionado.nivel_riesgo_churn})
              </button>
            </div>

            {/* Cuerpo del Modal */}
            <div className="p-8 overflow-y-auto flex-1 space-y-6">
              
              {modalTab === 'financiero' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Monto Total Pagado</span>
                      <p className="text-xl font-black text-emerald-600 mt-1">S/ {alumnoSeleccionado.monto_total_pagado.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Deuda Pendiente</span>
                      <p className="text-xl font-black text-red-600 mt-1">S/ {alumnoSeleccionado.deuda_total_pendiente.toFixed(2)}</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Cuotas Salderas</span>
                      <p className="text-xl font-black text-indigo-700 mt-1">{alumnoSeleccionado.cuotas_pagadas} / {alumnoSeleccionado.cuotas_totales}</p>
                    </div>
                  </div>

                  {/* Formulario de Pago */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-4">
                    <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-indigo-600" /> Validar Nueva Cuota y Disparar Webhook n8n
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
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Nº Comprobante</label>
                        <input 
                          type="text"
                          value={comprobante}
                          onChange={(e) => setComprobante(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Descuento (S/)</label>
                        <input 
                          type="number"
                          value={descuento}
                          onChange={(e) => setDescuento(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                        />
                      </div>
                    </div>

                    <button
                      onClick={registrarPago}
                      disabled={cargandoPago}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer w-full"
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
                </div>
              ) : modalTab === 'academico' ? (
                <div className="space-y-6">
                  <div className="flex justify-between items-center bg-indigo-50 p-4 rounded-2xl border border-indigo-100">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-700 uppercase">Programa Inscrito</span>
                      <h4 className="text-base font-bold text-indigo-950 mt-0.5">{alumnoSeleccionado.diplomado_actual}</h4>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-indigo-700 uppercase">Nota Promedio</span>
                      <p className="text-2xl font-black text-indigo-700">{alumnoSeleccionado.nota_promedio}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Progreso por Módulos</h5>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                      <span>MÓDULO I: Fundamentos y Marco Teórico</span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">Aprobado (Nota: 17)</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                      <span>MÓDULO II: Gestión Operativa y Control</span>
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">Aprobado (Nota: 16)</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs flex justify-between items-center">
                      <span>MÓDULO III: Proyectos Avanzados</span>
                      <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">En Curso</span>
                    </div>
                  </div>
                </div>
              ) : (
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

    </div>
  );
}