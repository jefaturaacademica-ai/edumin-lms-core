'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Search, ShieldCheck, Users, BookOpen, Settings, LogOut,
  CheckCircle2, Activity, DollarSign, Calendar, FileText, Check, AlertCircle, 
  Tag, Download, Clock, UserCheck, Award, FileCheck, Server, RefreshCw,
  TrendingUp, AlertTriangle, Filter, Eye, Phone, MessageSquare, Send, Sparkles, BarChart3, GraduationCap, ArrowUpRight, Zap, X, Plus
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AnularPagoModal from '@/components/admin/anular-pago-modal';
import ReciboModal from '@/components/admin/recibo-modal';
import EditarCronogramaModal from '@/components/admin/editar-cronograma-modal';
import Ficha360Modal from '@/components/admin/ficha-360-modal';
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

  // Modales adicionales de Recibos y Constancia de No Adeudo
  const [reciboImprimir, setReciboImprimir] = useState<any | null>(null);
  const [mostrarConstanciaModal, setMostrarConstanciaModal] = useState<boolean>(false);

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
  const [selectedCreditoIdx, setSelectedCreditoIdx] = useState<number>(0);
  const [editMontoTotal, setEditMontoTotal] = useState<number>(1500);
  const [editCuotas6, setEditCuotas6] = useState<{ val: string }[]>([
    { val: '0' }, { val: 'no corresponde' }, { val: 'no corresponde' }, { val: 'no corresponde' }, { val: 'no corresponde' }, { val: 'no corresponde' }
  ]);

  // Pago Específico Seleccionado para Validar
  const [pagoIdParaValidar, setPagoIdParaValidar] = useState<string | null>(null);

  // Catálogo de Diplomados de Supabase para enlazar módulos reales
  const [catalogoDiplomados, setCatalogoDiplomados] = useState<any[]>([]);

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
          setAlumnoSeleccionado((prev) => {
            if (!prev) return null;
            const updated = data.estudiantes.find((e: EstudianteCompleto) => e.id === prev.id || e.dni_ce === prev.dni_ce);
            return updated || prev;
          });
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

  const handleAnularPagoSubmit = async (motivo: string) => {
    if (!pagoParaAnular || !motivo.trim()) return;

    setCargandoAnulacion(true);
    try {
      const res = await fetch('/api/admin/pagos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'anular',
          pago_id: pagoParaAnular.id,
          dni_ce: pagoParaAnular.dni_ce || alumnoSeleccionado?.dni_ce,
          cuota_index: pagoParaAnular.cuota_index,
          motivo_anulacion: motivo.trim()
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert(`¡Pago anulado exitosamente! Motivo registrado: "${motivo.trim()}". Notificación enviada a n8n.`);
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

    const creditos = (alumnoSeleccionado as any).creditos || [];
    const creditoActual = creditos[selectedCreditoIdx] || creditos[0];

    const cuotasArray = editCuotas6.map(item => item.val || 'no corresponde');

    const sumaCuotas = cuotasArray.reduce((acc, val) => {
      return val !== 'no corresponde' ? acc + (Number(val) || 0) : acc;
    }, 0);

    if (Math.abs(sumaCuotas - editMontoTotal) > 0.01) {
      alert(`⚠️ Error de Validación: La suma de las cuotas (S/ ${sumaCuotas.toFixed(2)}) debe ser igual al total del programa (S/ ${editMontoTotal.toFixed(2)}). Por favor ajusta los montos antes de guardar el cronograma.`);
      return;
    }

    try {
      const res = await fetch('/api/admin/pagos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'editar_cronograma',
          pago_id: creditoActual?.id,
          dni_ce: alumnoSeleccionado.dni_ce,
          num_credito: creditoActual?.num_credito || (selectedCreditoIdx + 1),
          monto_total: editMontoTotal,
          cuotas: cuotasArray
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert('¡Configuración de cuotas y cronograma actualizada exitosamente en Supabase!');
        setMostrarEditarCronogramaModal(false);
        await cargarEstudiantesDeSupabase();
      } else {
        alert(`Error al guardar configuración de cronograma: ${data.error || 'Error imprevisto'}`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
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

  const registrarPago = async (cuotaIdxParam?: number, cargoExtraParam?: { concepto: string; monto: number }) => {
    if (!alumnoSeleccionado) return;
    setCargandoPago(true);
    setMensaje(null);
    try {
      const payload: any = {
        dni_ce: alumnoSeleccionado.dni_ce,
        monto: cargoExtraParam ? cargoExtraParam.monto : Number(montoPago),
        metodo: cargoExtraParam ? `Cargo Extra: ${cargoExtraParam.concepto}` : metodo,
        comprobante: cargoExtraParam ? `CARGO-${Math.floor(100000 + Math.random() * 900000)}` : comprobante,
        pago_id: pagoIdParaValidar,
        descuento: Number(descuento)
      };

      if (cuotaIdxParam !== undefined) {
        payload.cuota_index = cuotaIdxParam;
      }

      if (cargoExtraParam) {
        payload.is_cargo_extra = true;
        payload.concepto = cargoExtraParam.concepto;
      }

      const res = await fetch('/api/admin/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      
      if (res.ok) {
        setMensaje({ 
          texto: cargoExtraParam 
            ? `¡Cargo extra "${cargoExtraParam.concepto}" (S/ ${cargoExtraParam.monto.toFixed(2)}) registrado en Supabase para ${alumnoSeleccionado.nombres}!`
            : `¡Cuota validada y webhook enviado a n8n para ${alumnoSeleccionado.nombres}!`, 
          tipo: 'exito',
          webhookStatus: data.webhookStatus
        });
        
        setPagoIdParaValidar(null);
        await cargarEstudiantesDeSupabase();
      } else {
        setMensaje({ texto: `Error: ${data.error || 'No se pudo procesar la solicitud'}`, tipo: 'error' });
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans relative overflow-hidden transition-colors">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Área Principal de Contenido */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                  Mando Central 360°
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">• Estrategia Comercial & Deserción Cero</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                Dashboard 360° & Analítica Ejecutiva
              </h1>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('analitica')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'analitica' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-4 h-4" /> Analítica 360° & Retención
              </button>
              <button 
                onClick={() => setActiveTab('tesoreria')}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                  activeTab === 'tesoreria' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
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
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                      Filtros Múltiples & Cruzados de Data
                    </h3>
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
                    className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Limpiar Todos los Filtros
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                  
                  {/* Buscador Texto */}
                  <div className="lg:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Buscar Alumno / DNI</label>
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 dark:text-slate-500" />
                      <input 
                        type="text"
                        placeholder="Ej. 76543210 o Lucero..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 dark:text-slate-200"
                      />
                    </div>
                  </div>

                  {/* Filtro Mes */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">📅 Mes Registro</label>
                    <select 
                      value={filtroMes} 
                      onChange={(e) => setFiltroMes(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todos los Meses</option>
                      <option value="julio">Julio</option>
                      <option value="agosto">Agosto</option>
                      <option value="septiembre">Septiembre</option>
                    </select>
                  </div>

                  {/* Filtro Paquete */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">📦 Paquete Adquirido</label>
                    <select 
                      value={filtroPaquete} 
                      onChange={(e) => setFiltroPaquete(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todos los Paquetes</option>
                      <option value="COMPLETO">COMPLETO</option>
                      <option value="FULL">FULL</option>
                      <option value="ILIMITADO">ILIMITADO</option>
                    </select>
                  </div>

                  {/* Filtro Estado Financiero */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">💳 Estado Pago</label>
                    <select 
                      value={filtroEstado} 
                      onChange={(e) => setFiltroEstado(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                    >
                      <option value="todos">Todos los Estados</option>
                      <option value="Constancia de no adeudo">Constancia de no adeudo (Saldado)</option>
                      <option value="Al Día">Al Día</option>
                      <option value="Deuda Activa">Con Deuda Activa</option>
                      <option value="Prórroga Activa">Prórroga Activa</option>
                      <option value="Prórroga Vencida">Prórroga Vencida</option>
                      <option value="Bloqueado por Sistema">Bloqueado por Sistema</option>
                    </select>
                  </div>

                  {/* Filtro Riesgo Churn */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">⚠️ Riesgo Deserción</label>
                    <select 
                      value={filtroRiesgoChurn} 
                      onChange={(e) => setFiltroRiesgoChurn(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
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
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Recaudación Filtrada</p>
                    <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl">
                      <DollarSign className="size-5" />
                    </div>
                  </div>
                  {cargandoEstudiantes ? (
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mt-3 w-32" />
                  ) : (
                    <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-3">S/ {totalRecaudado.toFixed(2)}</h3>
                  )}
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 flex items-center gap-1">
                    <TrendingUp className="size-3" /> Cobrado a tiempo
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Deuda Pendiente Cobro</p>
                    <div className="p-2.5 bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 rounded-2xl">
                      <AlertTriangle className="size-5" />
                    </div>
                  </div>
                  {cargandoEstudiantes ? (
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mt-3 w-32" />
                  ) : (
                    <h3 className="text-3xl font-black text-red-600 dark:text-red-400 mt-3">S/ {totalDeudaPendiente.toFixed(2)}</h3>
                  )}
                  <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-1">Suma de cuotas por vencer/vencidas</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Riesgo Crítico Churn</p>
                    <div className="p-2.5 bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 rounded-2xl">
                      <Users className="size-5" />
                    </div>
                  </div>
                  {cargandoEstudiantes ? (
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mt-3 w-28" />
                  ) : (
                    <h3 className="text-3xl font-black text-amber-600 dark:text-amber-400 mt-3">{alumnosRiesgoCritico} Alumnos</h3>
                  )}
                  <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1">Inactivos {'>'} 7d o morosos</p>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Avance Académico Promedio</p>
                    <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
                      <GraduationCap className="size-5" />
                    </div>
                  </div>
                  {cargandoEstudiantes ? (
                    <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse mt-3 w-24" />
                  ) : (
                    <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400 mt-3">{promedioAvanceGlobal}%</h3>
                  )}
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-1">Porcentaje de módulos completados</p>
                </div>
              </div>

              {/* TABLA PRINCIPAL DE FICHA 360° DEL ALUMNO */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Consolidado Estudiantil 360° & Control de Deserción</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Haz clic en cualquier alumno para abrir su Ficha 360° (Académica, Financiera y Retención).</p>
                  </div>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full flex items-center gap-1.5">
                    {cargandoEstudiantes && <RefreshCw className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />}
                    {estudiantesFiltrados.length} Alumnos Encontrados
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                        <th className="pb-3 px-4">DNI / CE</th>
                        <th className="pb-3 px-4">Estudiante</th>
                        <th className="pb-3 px-4">Paquete & Programa</th>
                        <th className="pb-3 px-4">Última Conexión</th>
                        <th className="pb-3 px-4">% Pago Completado</th>
                        <th className="pb-3 px-4">Estado Pago</th>
                        <th className="pb-3 px-4">Riesgo Churn</th>
                        <th className="pb-3 px-4 text-right">Ficha 360°</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {cargandoEstudiantes ? (
                        Array.from({ length: 4 }).map((_, idx) => (
                          <tr key={idx} className="animate-pulse">
                            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36" /></td>
                            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" /></td>
                            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24" /></td>
                            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-28" /></td>
                            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20" /></td>
                            <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-16" /></td>
                            <td className="py-4 px-4 text-right"><div className="h-6 bg-slate-200 dark:bg-slate-800 rounded-xl w-24 ml-auto" /></td>
                          </tr>
                        ))
                      ) : estudiantesFiltrados.length > 0 ? (
                        estudiantesFiltrados.map((e) => {
                          const pagado = e.monto_total_pagado || 0;
                          const totalProg = e.monto_total_programa || (pagado + (e.deuda_total_pendiente || 0)) || 1;
                          const porcentajePago = Math.min(100, Math.round((pagado / (totalProg || 1)) * 100));

                          return (
                            <tr key={e.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{e.dni_ce}</td>
                              <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                                {e.nombres} {e.apellidos}
                                <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{e.email}</div>
                              </td>
                              <td className="py-4 px-4">
                                <span className="bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-2 py-0.5 rounded text-[10px] font-bold block w-fit mb-0.5">
                                  {e.paquete_adquirido}
                                </span>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">
                                  {e.diplomado_actual}
                                  {e.diplomado_2 && <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold mt-0.5">+ {e.diplomado_2}</div>}
                                </span>
                              </td>
                              <td className="py-4 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400 dark:text-slate-500" /> {e.ultima_conexion}
                                </span>
                              </td>
                              
                              {/* % PAGO COMPLETADO (CON MONTO PAGADO Y TOTAL PROGRAMA) */}
                              <td className="py-4 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-16 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                    <div 
                                      className={`h-full ${porcentajePago === 100 ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-500'}`} 
                                      style={{ width: `${porcentajePago}%` }}
                                    ></div>
                                  </div>
                                  <span className="font-black text-slate-900 dark:text-white text-xs">{porcentajePago}%</span>
                                </div>
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block mt-0.5">
                                  Pagó: <strong className="text-emerald-700 dark:text-emerald-400 font-bold">S/ {pagado.toFixed(2)}</strong> / S/ {totalProg.toFixed(2)}
                                </span>
                              </td>

                              {/* ESTADO DE PAGO CON COLOR VERDE / EMERALD DISTINTO PARA CONSTANCIA DE NO ADEUDO */}
                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-sm inline-block ${
                                  e.estado === 'Constancia de no adeudo'
                                    ? 'bg-emerald-100 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-black'
                                    : e.estado === 'Al Día'
                                      ? 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300'
                                      : e.estado === 'Prórroga Activa'
                                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                                        : 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300'
                                }`}>
                                  {e.estado}
                                </span>
                              </td>

                              <td className="py-4 px-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                                  e.nivel_riesgo_churn === 'CRÍTICO' 
                                    ? 'bg-red-600 text-white animate-pulse' 
                                    : e.nivel_riesgo_churn === 'ALTO' 
                                      ? 'bg-amber-500 text-white' 
                                      : e.nivel_riesgo_churn === 'MEDIO' 
                                        ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300' 
                                        : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                                }`}>
                                  {e.nivel_riesgo_churn}
                                </span>
                              </td>

                              <td className="py-4 px-4 text-right">
                                <button
                                  onClick={() => { setAlumnoSeleccionado(e); setMontoPago(e.monto_cuota.toFixed(2)); }}
                                  className="bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-600 dark:hover:bg-indigo-600 text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-sm inline-flex items-center gap-1 cursor-pointer border border-indigo-200/50 dark:border-indigo-800/50"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Abrir Ficha
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                            No se encontraron estudiantes para la combinación de filtros seleccionada.
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
                return [{
                  id: `pago-demo-${e.id}`,
                  fecha: '2026-09-20',
                  monto: e.monto_cuota || 150,
                  metodo: 'Yape / Plin',
                  comprobante: 'OP-PENDIENTE',
                  estado: e.deuda_total_pendiente > 0 ? 'PENDIENTE' : 'APROBADO',
                  estudiante_nombre: `${e.nombres} ${e.apellidos}`,
                  estudiante_dni: e.dni_ce,
                  programa: e.diplomado_actual,
                  mes_registro: e.mes_inscripcion,
                  nro_cuota: `Cuota 1 de ${e.cuotas_totales}`
                }];
              });

              return (
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
                    <div>
                      <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                        Auditoría Financiera
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">Registro de Pagos y Tesorería</h3>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] uppercase tracking-wider font-bold">
                          <th className="pb-3 px-4">Nº Operación</th>
                          <th className="pb-3 px-4">Estudiante & DNI</th>
                          <th className="pb-3 px-4">Programa</th>
                          <th className="pb-3 px-4">Concepto / Cuota</th>
                          <th className="pb-3 px-4">Monto Pagado</th>
                          <th className="pb-3 px-4">Método</th>
                          <th className="pb-3 px-4">Estado</th>
                          <th className="pb-3 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                        {todosLosPagos.length > 0 ? (
                          todosLosPagos.map((pag, pIdx) => {
                            const esAprobado = pag.estado === 'APROBADO' || pag.estado === 'VALIDADO';
                            return (
                              <tr key={pIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="py-4 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                                  {pag.comprobante || 'OP-984321'}
                                </td>
                                <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                                  {pag.estudiante_nombre}
                                  <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 font-normal">{pag.estudiante_dni}</div>
                                </td>
                                <td className="py-4 px-4 text-slate-600 dark:text-slate-400 font-medium">{pag.programa}</td>
                                <td className="py-4 px-4 text-indigo-700 dark:text-indigo-400 font-bold">{pag.nro_cuota}</td>
                                <td className="py-4 px-4 font-black text-slate-900 dark:text-white">S/ {Number(pag.monto || 150).toFixed(2)}</td>
                                <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{pag.metodo || 'Yape'}</td>
                                <td className="py-4 px-4">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                    esAprobado 
                                      ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300' 
                                      : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                                  }`}>
                                    {pag.estado || 'APROBADO'}
                                  </span>
                                </td>
                                <td className="py-4 px-4 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      const matchingAlumno = estudiantes.find(e => e.dni_ce === pag.estudiante_dni);
                                      if (matchingAlumno) setAlumnoSeleccionado(matchingAlumno);
                                      setReciboImprimir(pag);
                                    }}
                                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer"
                                  >
                                    <Download className="size-3" /> Recibo
                                  </button>
                                  {esAprobado && (
                                    <button
                                      onClick={() => {
                                        const matchingAlumno = estudiantes.find(e => e.dni_ce === pag.estudiante_dni);
                                        if (matchingAlumno) setAlumnoSeleccionado(matchingAlumno);
                                        setPagoParaAnular(pag);
                                      }}
                                      className="bg-red-50 dark:bg-red-950/60 hover:bg-red-600 text-red-600 hover:text-white dark:text-red-400 px-2.5 py-1.5 rounded-xl text-[10px] font-bold transition inline-flex items-center gap-1 cursor-pointer border border-red-200 dark:border-red-800/50"
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
                            <td colSpan={8} className="text-center py-12 text-slate-400 dark:text-slate-500 font-medium">
                              No se encontraron pagos registrados para los filtros seleccionados.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })()
          )}

        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL FICHA 360° DEL ALUMNO (SUBCOMPONENTE RESTRUCTURADO) */}
      {/* ========================================================= */}
      <Ficha360Modal
        alumnoSeleccionado={alumnoSeleccionado}
        catalogoDiplomados={catalogoDiplomados}
        onClose={() => setAlumnoSeleccionado(null)}
        onOpenEditCronograma={() => {
          if (!alumnoSeleccionado) return;
          const creditos = (alumnoSeleccionado as any).creditos || [];
          const cred = creditos[selectedCreditoIdx] || creditos[0];
          if (cred) {
            setEditMontoTotal(cred.monto_total || alumnoSeleccionado.monto_total_programa || 1500);
            if (cred.cuotas_desglose && cred.cuotas_desglose.length > 0) {
              setEditCuotas6(cred.cuotas_desglose.map((val: string) => ({ val })));
            }
          }
          setMostrarEditarCronogramaModal(true);
        }}
        onSetPagoParaAnular={(pag) => setPagoParaAnular(pag)}
        onRegistrarPago={registrarPago}
        montoPago={montoPago}
        setMontoPago={setMontoPago}
        comprobante={comprobante}
        setComprobante={setComprobante}
        metodo={metodo}
        setMetodo={setMetodo}
        cargandoPago={cargandoPago}
        mensaje={mensaje}
        selectedCreditoIdx={selectedCreditoIdx}
        setSelectedCreditoIdx={setSelectedCreditoIdx}
        onSetPagoIdParaValidar={setPagoIdParaValidar}
        onSetReciboImprimir={(pag) => setReciboImprimir(pag)}
        onEnviarAlertaWhatsApp={enviarAlertaWhatsAppRetencion}
        enviandoAlertaWhatsApp={enviandoAlertaWhatsApp}
      />

      {/* ========================================================= */}
      {/* MODAL: RECIBO INTERNO IMPRIMIBLE */}
      {/* ========================================================= */}
      <ReciboModal
        reciboImprimir={reciboImprimir}
        alumnoSeleccionado={alumnoSeleccionado}
        onClose={() => setReciboImprimir(null)}
      />

      {/* ========================================================= */}
      {/* MODAL: CONSTANCIA DE NO ADEUDO IMPRIMIBLE */}
      {/* ========================================================= */}
      {mostrarConstanciaModal && alumnoSeleccionado && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl p-10 space-y-6 border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200">
            
            <div className="flex justify-center mb-2">
              <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 rounded-full">
                <Award className="size-10" />
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Constancia de No Adeudo</h2>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-bold mt-1">EDUMIN LMS - Plataforma Educativa Ejecutiva</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 text-left space-y-3 text-xs leading-relaxed">
              <p className="text-slate-700 dark:text-slate-300">
                La Dirección Académica y Financiera de <strong>EDUMIN LMS CORE</strong> hace constar que el/la alumno(a):
              </p>
              <h3 className="text-base font-black text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-700 pb-2">
                {alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}
              </h3>
              <p className="text-slate-700 dark:text-slate-300">
                Con Documento de Identidad <strong>DNI/CE Nº {alumnoSeleccionado.dni_ce}</strong>, inscrito(a) en el programa:
              </p>
              <p className="font-bold text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800">
                {alumnoSeleccionado.diplomado_actual}
              </p>
              <p className="text-slate-700 dark:text-slate-300 pt-2 font-medium">
                <strong>NO REGISTRA DEUDAS NI OBLIGACIONES FINANCIERAS PENDIENTES</strong> con la institución al día de la fecha. Ha cancelado el 100% de los derechos de enseñanza correspondientes.
              </p>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800 pt-4">
              <span>Código Validación: EDUMIN-NO-ADEUDO-2026</span>
              <span>Fecha: {new Date().toLocaleDateString()}</span>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setMostrarConstanciaModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
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
      <AnularPagoModal
        pagoParaAnular={pagoParaAnular}
        alumnoSeleccionado={alumnoSeleccionado}
        onClose={() => setPagoParaAnular(null)}
        onSubmit={handleAnularPagoSubmit}
        cargandoAnulacion={cargandoAnulacion}
      />

      {/* ========================================================= */}
      {/* MODAL: EDITAR CUOTAS Y CRONOGRAMA DE PAGOS EN SUPABASE */}
      {/* ========================================================= */}
      <EditarCronogramaModal
        isOpen={mostrarEditarCronogramaModal}
        alumnoSeleccionado={alumnoSeleccionado}
        selectedCreditoIdx={selectedCreditoIdx}
        editMontoTotal={editMontoTotal}
        setEditMontoTotal={setEditMontoTotal}
        editCuotas6={editCuotas6}
        setEditCuotas6={setEditCuotas6}
        onClose={() => setMostrarEditarCronogramaModal(false)}
        onSave={handleGuardarCronogramaSubmit}
      />

    </div>
  );
}