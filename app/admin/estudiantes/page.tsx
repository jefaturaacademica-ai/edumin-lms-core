'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, RefreshCw, Eye, ShieldCheck, 
  CheckCircle2, AlertTriangle, UserCheck, GraduationCap, Download,
  UserPlus, Plus, Sparkles, BookOpen, CreditCard, AlertCircle, ArrowRight,
  Check, Mail, Phone, Hash, DollarSign, Calendar
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useTabSlug } from '@/lib/hooks/useTabSlug';
import AnularPagoModal from '@/components/admin/anular-pago-modal';
import ReciboModal from '@/components/admin/recibo-modal';
import EditarCronogramaModal from '@/components/admin/editar-cronograma-modal';
import Ficha360Modal from '@/components/admin/ficha-360-modal';
import { EstudianteCompleto } from '@/lib/data/mockStudents';
import { PaqueteDefinicion, PAQUETES_DEFAULT } from '@/lib/types/paquetes';

const DIPLOMADOS_EDUMIN = [
  "DIPLOMADO EN DERECHO MINERO",
  "ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA",
  "DIPLOMADO EN GEOLOGÍA MINERA",
  "DIPLOMADO EN GEOMETALURGIA",
  "DIPLOMADO EN GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL",
  "DIPLOMADO EN GEOTECNIA MINERA",
  "DIPLOMADO EN GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ",
  "DIPLOMADO EN GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA",
  "DIPLOMADO EN GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL",
  "DIPLOMADO EN GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS",
  "DIPLOMADO EN GESTIÓN DE OPERACIONES INDUSTRIALES",
  "DIPLOMADO EN GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO",
  "DIPLOMADO EN GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES",
  "DIPLOMADO EN GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA",
  "DIPLOMADO EN GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA",
  "DIPLOMADO EN GESTIÓN MINERA",
  "DIPLOMADO EN LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS",
  "DIPLOMADO EN MINERÍA 4.0 Y DIGITALIZACIÓN MINERA",
  "DIPLOMADO EN PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL",
  "DIPLOMADO EN SEGURIDAD INDUSTRIAL",
  "DIPLOMADO EN SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA",
  "DIPLOMADO EN SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA"
];

export default function AdminEstudiantesPage() {
  const [activeTab, setActiveTab] = useTabSlug<'directorio' | 'nuevo'>('directorio', ['directorio', 'nuevo'] as const);
  const [estudiantes, setEstudiantes] = useState<EstudianteCompleto[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos');
  
  // Modal Ficha 360°
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<EstudianteCompleto | null>(null);

  const [catalogoFull, setCatalogoFull] = useState<any[]>([]);

  // Estados Formulario Nuevo Estudiante
  const [nuevoDni, setNuevoDni] = useState('');
  const [nuevoNombres, setNuevoNombres] = useState('');
  const [nuevoApellidos, setNuevoApellidos] = useState('');
  const [nuevoEmail, setNuevoEmail] = useState('');
  const [nuevoTelefono, setNuevoTelefono] = useState('');
  const [nuevoFechaNacimiento, setNuevoFechaNacimiento] = useState('');
  const [paquetesDisponibles, setPaquetesDisponibles] = useState<Record<string, PaqueteDefinicion>>(PAQUETES_DEFAULT);
  const [nuevoPaquete, setNuevoPaquete] = useState<string>('COMPLETO');
  const [nuevoTipoPago, setNuevoTipoPago] = useState<'CONTADO' | 'CUOTAS'>('CUOTAS');
  const [nuevoCuotasTotales, setNuevoCuotasTotales] = useState(3);
  const [nuevoMontoTotal, setNuevoMontoTotal] = useState(540);
  const [nuevoMontoCuota, setNuevoMontoCuota] = useState(180);
  const [nuevoDiplomado1, setNuevoDiplomado1] = useState(DIPLOMADOS_EDUMIN[0]);
  const [guardandoNuevo, setGuardandoNuevo] = useState(false);
  const [mensajeNuevo, setMensajeNuevo] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  useEffect(() => {
    cargarEstudiantes();
    cargarCatalogo();
    cargarConfigPaquetes();
  }, []);

  const cargarConfigPaquetes = async () => {
    try {
      const res = await fetch('/api/admin/configuracion-paquetes');
      if (res.ok) {
        const data = await res.json();
        if (data.paquetes && typeof data.paquetes === 'object') {
          setPaquetesDisponibles(data.paquetes);
        }
      }
    } catch (e) {
      console.error('Error cargando paquetes configurados:', e);
    }
  };

  // Actualizar montos por defecto según paquete y tipo de pago
  const handleCambioPaquete = (pkgKey: string) => {
    setNuevoPaquete(pkgKey);
    const def = paquetesDisponibles[pkgKey] || PAQUETES_DEFAULT[pkgKey] || {
      precioContado: 540,
      precioCuotas: 540,
      cuotasSugeridas: 3
    };

    const precioBase = nuevoTipoPago === 'CONTADO' ? def.precioContado : def.precioCuotas;
    setNuevoMontoTotal(precioBase);

    if (nuevoTipoPago === 'CONTADO') {
      setNuevoCuotasTotales(1);
      setNuevoMontoCuota(precioBase);
    } else {
      const cuotas = def.cuotasSugeridas || 3;
      setNuevoCuotasTotales(cuotas);
      setNuevoMontoCuota(cuotas > 0 ? Math.round(precioBase / cuotas) : precioBase);
    }
  };

  const handleCambioTipoPago = (tipo: 'CONTADO' | 'CUOTAS') => {
    setNuevoTipoPago(tipo);
    const def = paquetesDisponibles[nuevoPaquete] || PAQUETES_DEFAULT[nuevoPaquete] || {
      precioContado: 540,
      precioCuotas: 540,
      cuotasSugeridas: 3
    };

    if (tipo === 'CONTADO') {
      setNuevoMontoTotal(def.precioContado);
      setNuevoCuotasTotales(1);
      setNuevoMontoCuota(def.precioContado);
    } else {
      const precio = def.precioCuotas;
      const cuotas = def.cuotasSugeridas || 3;
      setNuevoMontoTotal(precio);
      setNuevoCuotasTotales(cuotas);
      setNuevoMontoCuota(cuotas > 0 ? Math.round(precio / cuotas) : precio);
    }
  };

  const cargarCatalogo = async () => {
    try {
      const res = await fetch('/api/admin/catalogo');
      if (res.ok) {
        const data = await res.json();
        setCatalogoFull(data.cursos || []);
      }
    } catch (e) {
      console.error('Error al cargar catálogo en estudiantes:', e);
    }
  };

  const cargarEstudiantes = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/estudiantes');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.estudiantes)) {
          setEstudiantes(data.estudiantes);
          setAlumnoSeleccionado((prev) => {
            if (!prev) return null;
            return data.estudiantes.find((e: EstudianteCompleto) => e.id === prev.id || e.dni_ce === prev.dni_ce) || null;
          });
        }
      }
    } catch (e) {
      console.error('Error cargando estudiantes:', e);
    } finally {
      setCargando(false);
    }
  };

  const handleCrearEstudianteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDni.trim() || !nuevoNombres.trim() || !nuevoApellidos.trim() || !nuevoEmail.trim()) {
      setMensajeNuevo({ texto: 'Por favor complete todos los campos obligatorios (*).', tipo: 'error' });
      return;
    }

    setGuardandoNuevo(true);
    setMensajeNuevo(null);

    try {
      const defPaquete = paquetesDisponibles[nuevoPaquete] || PAQUETES_DEFAULT[nuevoPaquete];

      const res = await fetch('/api/admin/estudiantes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni_ce: nuevoDni.trim(),
          nombres: nuevoNombres.trim(),
          apellidos: nuevoApellidos.trim(),
          email: nuevoEmail.trim(),
          telefono: nuevoTelefono.trim(),
          fecha_nacimiento: nuevoFechaNacimiento ? nuevoFechaNacimiento.trim() : null,
          paquete_adquirido: nuevoPaquete,
          tipo_pago: nuevoTipoPago,
          cuotas_totales: nuevoCuotasTotales,
          monto_total: nuevoMontoTotal,
          monto_cuota: nuevoMontoCuota,
          diplomado_1: nuevoDiplomado1,
          cupos_diplomados_personalizados: defPaquete?.creditosDiplomados,
          cupos_cursos_personalizados: defPaquete?.creditosCursos
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setMensajeNuevo({
          texto: `¡Estudiante ${nuevoNombres} ${nuevoApellidos} creado exitosamente! Credenciales por defecto: DNI ${nuevoDni.trim()}`,
          tipo: 'exito'
        });

        // Limpiar formulario
        setNuevoDni('');
        setNuevoNombres('');
        setNuevoApellidos('');
        setNuevoEmail('');
        setNuevoTelefono('');
        setNuevoFechaNacimiento('');

        await cargarEstudiantes();

        // Regresar a la pestaña directorio tras 2 segundos
        setTimeout(() => {
          setActiveTab('directorio');
          setMensajeNuevo(null);
        }, 2200);
      } else {
        setMensajeNuevo({ texto: data.error || 'Error al registrar estudiante.', tipo: 'error' });
      }
    } catch (err: any) {
      setMensajeNuevo({ texto: `Error de conexión: ${err.message}`, tipo: 'error' });
    } finally {
      setGuardandoNuevo(false);
    }
  };

  // Estados de Registro de Pago
  const [montoPago, setMontoPago] = useState<string>('150.00');
  const [comprobante, setComprobante] = useState<string>('OP-984321');
  const [metodo, setMetodo] = useState<string>('Yape / Plin');
  const [descuento, setDescuento] = useState<string>('0.00');
  const [pagoIdParaValidar, setPagoIdParaValidar] = useState<string | null>(null);
  const [selectedCreditoIdx, setSelectedCreditoIdx] = useState<number>(0);
  const [cargandoPago, setCargandoPago] = useState<boolean>(false);
  const [mensaje, setMensaje] = useState<{ texto: string; tipo: 'exito' | 'error'; webhookStatus?: string } | null>(null);

  // Estados de Anulación de Pago
  const [pagoParaAnular, setPagoParaAnular] = useState<any | null>(null);
  const [cargandoAnulacion, setCargandoAnulacion] = useState<boolean>(false);

  // Estados de Modales Adicionales
  const [reciboImprimir, setReciboImprimir] = useState<any | null>(null);
  const [mostrarEditarCronogramaModal, setMostrarEditarCronogramaModal] = useState<boolean>(false);
  const [editMontoTotal, setEditMontoTotal] = useState<number>(1500);
  const [editCuotas6, setEditCuotas6] = useState<{ val: string }[]>(Array(6).fill({ val: 'no corresponde' }));
  const [enviandoAlertaWhatsApp, setEnviandoAlertaWhatsApp] = useState<boolean>(false);

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

      if (cargoExtraParam) {
        payload.is_cargo_extra = true;
        payload.concepto_cargo = cargoExtraParam.concepto;
      } else {
        const creditoActual = alumnoSeleccionado.creditos?.[selectedCreditoIdx] || alumnoSeleccionado.creditos?.[0];
        payload.num_credito = creditoActual?.num_credito || 1;
        if (cuotaIdxParam !== undefined) {
          payload.cuota_index = cuotaIdxParam;
        }
      }

      const res = await fetch('/api/admin/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (res.ok) {
        setMensaje({ 
          texto: data.mensaje || '¡Pago registrado exitosamente en el cronograma!', 
          tipo: 'exito',
          webhookStatus: data.webhookStatus
        });
        await cargarEstudiantes();
      } else {
        setMensaje({ texto: data.error || 'Error al registrar el pago.', tipo: 'error' });
      }
    } catch (e: any) {
      setMensaje({ texto: 'Error de conexión al procesar el pago.', tipo: 'error' });
    } finally {
      setCargandoPago(false);
    }
  };

  const handleAnularPagoSubmit = async () => {
    if (!alumnoSeleccionado || !pagoParaAnular) return;
    setCargandoAnulacion(true);
    try {
      const res = await fetch('/api/admin/pagos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni_ce: alumnoSeleccionado.dni_ce,
          pago_id: pagoParaAnular.id,
          cuota_index: pagoParaAnular.cuota_index,
          num_credito: pagoParaAnular.num_credito || 1,
          is_cargo_extra: Boolean(pagoParaAnular.is_cargo_extra)
        })
      });

      const data = await res.json();

      if (res.ok) {
        setPagoParaAnular(null);
        await cargarEstudiantes();
        alert('Pago o cuota anulada exitosamente en el cronograma.');
      } else {
        alert(`Error al anular el pago: ${data.error || 'Error imprevisto'}`);
      }
    } catch (e: any) {
      alert(`Error de conexión: ${e.message}`);
    } finally {
      setCargandoAnulacion(false);
    }
  };

  const handleGuardarCronogramaSubmit = async () => {
    if (!alumnoSeleccionado) return;
    try {
      const creditoActual = alumnoSeleccionado.creditos?.[selectedCreditoIdx] || alumnoSeleccionado.creditos?.[0];
      const res = await fetch('/api/admin/pagos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dni_ce: alumnoSeleccionado.dni_ce,
          pago_id: creditoActual?.id,
          num_credito: creditoActual?.num_credito || 1,
          monto_total: editMontoTotal,
          cuotas: editCuotas6.map(c => c.val)
        })
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        alert('¡Configuración de cuotas y cronograma actualizada exitosamente en Supabase!');
        setMostrarEditarCronogramaModal(false);
        await cargarEstudiantes();
      } else {
        alert(`Error al guardar configuración de cronograma: ${data.error || 'Error imprevisto'}`);
      }
    } catch (err: any) {
      alert(`Error de conexión: ${err.message}`);
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
      alert(`¡Alerta de Retención enviada a n8n para notificar vía WhatsApp a ${alumnoSeleccionado.nombres}!`);
    } catch (e) {
      console.error(e);
    } finally {
      setEnviandoAlertaWhatsApp(false);
    }
  };

  const limpiarTexto = (t: string) => (t || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const estudiantesFiltrados = estudiantes.filter(est => {
    const q = limpiarTexto(busqueda);
    const coincideBusqueda = !busqueda || 
      limpiarTexto(est.nombres).includes(q) || 
      limpiarTexto(est.apellidos).includes(q) || 
      limpiarTexto(est.dni_ce).includes(q) ||
      limpiarTexto(est.email).includes(q);

    const coincideEstado = filtroEstado === 'todos' || est.estado === filtroEstado;
    const coincideRiesgo = filtroRiesgo === 'todos' || est.nivel_riesgo_churn === filtroRiesgo;

    return coincideBusqueda && coincideEstado && coincideRiesgo;
  });

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      
      {/* Sidebar Principal Unificado */}
      <AdminSidebar />

      {/* Contenido Principal con Header Superior */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Encabezado */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                Directorio y secretaría de estudiantes
              </h1>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveTab('nuevo')}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                + Nuevo estudiante
              </button>

              <button
                onClick={cargarEstudiantes}
                disabled={cargando}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                Actualizar lista ({estudiantes.length})
              </button>
            </div>
          </div>

          {/* Navegación por pestañas principales */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
            {/* Pestaña 1: Directorio de estudiantes */}
            <button
              onClick={() => setActiveTab('directorio')}
              className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'directorio' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              Directorio de estudiantes ({estudiantes.length})
            </button>

            {/* Pestaña 2: Nuevo estudiante */}
            <button
              onClick={() => setActiveTab('nuevo')}
              className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'nuevo' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <UserPlus className="w-4 h-4 text-emerald-600" /> 
              Nuevo estudiante
            </button>
          </div>

          {/* CONTENIDO PESTAÑA 1: DIRECTORIO DE ESTUDIANTES */}
          {activeTab === 'directorio' && (
            <div className="space-y-6">
              {/* Filtros de búsqueda */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-6 relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                    <Search className="size-4" />
                  </span>
                  <input 
                    type="text"
                    placeholder="Buscar por DNI, nombres, apellidos o correo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="todos">Todos los estados de deuda</option>
                    <option value="Al Día">Al día</option>
                    <option value="Deuda Activa">Deuda activa</option>
                    <option value="Constancia de no adeudo">Constancia de no adeudo</option>
                    <option value="Bloqueado por Sistema">Bloqueado por sistema</option>
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <select
                    value={filtroRiesgo}
                    onChange={(e) => setFiltroRiesgo(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="todos">Todos los niveles de riesgo</option>
                    <option value="BAJO">Riesgo bajo</option>
                    <option value="MEDIO">Riesgo medio</option>
                    <option value="ALTO">Riesgo alto</option>
                    <option value="CRÍTICO">Riesgo crítico</option>
                  </select>
                </div>
              </div>

              {/* Tabla de estudiantes */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                        <th className="py-3 px-4">DNI / CE</th>
                        <th className="py-3 px-4">Estudiante</th>
                        <th className="py-3 px-4">Programa principal</th>
                        <th className="py-3 px-4">Paquete y créditos</th>
                        <th className="py-3 px-4 text-center">Avance</th>
                        <th className="py-3 px-4 text-center">Estado de deuda</th>
                        <th className="py-3 px-4 text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium">
                      {cargando ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                            Cargando estudiantes desde Supabase...
                          </td>
                        </tr>
                      ) : estudiantesFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-400">
                            No se encontraron estudiantes registrados con los filtros aplicados.
                          </td>
                        </tr>
                      ) : (
                        estudiantesFiltrados.map((est) => (
                          <tr key={est.id || est.dni_ce} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                              {est.dni_ce}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 dark:text-white">
                                  {est.nombres} {est.apellidos}
                                </span>
                                {est.role === 'ADMIN' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                                    Admin
                                  </span>
                                )}
                                {est.role === 'SUPERADMIN' && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 shrink-0">
                                    Superadmin
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-normal">
                                {est.email}
                              </div>
                            </td>
                            <td className="py-3 px-4 max-w-[200px] truncate text-slate-700 dark:text-slate-300">
                              {est.diplomado_actual || 'DIPLOMADO EN DERECHO MINERO'}
                            </td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                                {est.paquete_adquirido}
                              </span>
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                Cuotas: {est.cuotas_pagadas || 1}/{est.cuotas_totales || 3}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="inline-flex items-center gap-1 font-bold text-slate-800 dark:text-slate-200">
                                <span>{est.avance_porcentaje || 0}%</span>
                              </div>
                              <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 mx-auto mt-1 overflow-hidden">
                                <div 
                                  className="bg-indigo-600 h-1.5 rounded-full" 
                                  style={{ width: `${Math.min(100, est.avance_porcentaje || 0)}%` }}
                                />
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                est.estado === 'Constancia de no adeudo'
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                  : est.estado === 'Deuda Activa'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                  : est.estado === 'Bloqueado por Sistema'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  : 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300'
                              }`}>
                                {est.estado}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                onClick={() => setAlumnoSeleccionado(est)}
                                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Ficha 360°
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* CONTENIDO PESTAÑA 2: NUEVO ESTUDIANTE (FORMULARIO MANUAL) */}
          {activeTab === 'nuevo' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-10 shadow-sm max-w-4xl mx-auto space-y-8">
              
              <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-full text-xs font-bold mb-2">
                  <UserPlus className="w-3.5 h-3.5" /> Formulario de alta y matrícula directa
                </div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  Registrar nuevo estudiante
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Crea la cuenta en Supabase Auth y el perfil en la base de datos. La contraseña inicial será automáticamente su número de DNI o carnet.
                </p>
              </div>

              {mensajeNuevo && (
                <div className={`p-4 rounded-2xl flex items-center gap-3 text-xs font-semibold ${
                  mensajeNuevo.tipo === 'exito' 
                    ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-200 dark:border-rose-800'
                }`}>
                  {mensajeNuevo.tipo === 'exito' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                  )}
                  <span>{mensajeNuevo.texto}</span>
                </div>
              )}

              <form onSubmit={handleCrearEstudianteSubmit} className="space-y-6">
                
                {/* Sección 1: Datos personales */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-indigo-500" /> 1. Datos personales del estudiante
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        DNI / Carnet de extranjería *
                      </label>
                      <div className="relative">
                        <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input 
                          type="text" 
                          required
                          placeholder="Ej: 71234567"
                          value={nuevoDni}
                          onChange={(e) => setNuevoDni(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Correo electrónico *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input 
                          type="email" 
                          required
                          placeholder="alumno@correo.com"
                          value={nuevoEmail}
                          onChange={(e) => setNuevoEmail(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nombres *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej: Juan Carlos"
                        value={nuevoNombres}
                        onChange={(e) => setNuevoNombres(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Apellidos *
                      </label>
                      <input 
                        type="text" 
                        required
                        placeholder="Ej: Quispe Ramos"
                        value={nuevoApellidos}
                        onChange={(e) => setNuevoApellidos(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Teléfono / WhatsApp (opcional)
                      </label>
                      <div className="relative">
                        <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input 
                          type="text" 
                          placeholder="+51 987654321"
                          value={nuevoTelefono}
                          onChange={(e) => setNuevoTelefono(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Fecha de nacimiento (opcional)
                      </label>
                      <div className="relative">
                        <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                        <input 
                          type="date" 
                          value={nuevoFechaNacimiento}
                          onChange={(e) => setNuevoFechaNacimiento(e.target.value)}
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sección 2: Paquete y créditos EDUMIN */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" /> 2. Paquete comercial y créditos EDUMIN
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    {Object.values(paquetesDisponibles).map((pkg) => {
                      const esSeleccionado = nuevoPaquete === pkg.id;
                      const totalCreditos = (pkg.creditosDiplomados || 0) + (pkg.creditosCursos || 0);

                      return (
                        <button
                          key={pkg.id}
                          type="button"
                          onClick={() => handleCambioPaquete(pkg.id)}
                          className={`p-4 rounded-2xl border text-left transition cursor-pointer relative ${
                            esSeleccionado
                              ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 ring-2 ring-indigo-600'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-bold text-xs text-slate-900 dark:text-white uppercase">{pkg.nombre}</span>
                            {pkg.esPersonalizado && (
                              <span className="text-[9px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                                Personalizado
                              </span>
                            )}
                          </div>
                          
                          <div className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">
                            S/ {(nuevoTipoPago === 'CONTADO' ? pkg.precioContado : pkg.precioCuotas).toFixed(2)}
                          </div>

                          <div className="text-[11px] text-slate-500 mt-2 space-y-0.5">
                            <div>• {pkg.creditosDiplomados} {pkg.creditosDiplomados === 1 ? 'crédito de diplomado' : 'créditos de diplomados'}</div>
                            <div>• {pkg.creditosCursos} créditos de cursos</div>
                            <div className="font-bold text-indigo-600 dark:text-indigo-300 pt-1">
                              Total: {totalCreditos} créditos EDUMIN
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Diplomado inicial de ingreso (elegido en ventas) *
                    </label>
                    <div className="relative">
                      <BookOpen className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                      <select
                        value={nuevoDiplomado1}
                        onChange={(e) => setNuevoDiplomado1(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        {DIPLOMADOS_EDUMIN.map((dip, idx) => (
                          <option key={idx} value={dip}>{dip}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Este diplomado consumirá el primer crédito de diplomado asignado. Los créditos de cursos libres quedarán disponibles para que el alumno se autogestione desde su módulo de canje.
                    </p>
                  </div>
                </div>

                {/* Sección 3: Modalidad financiera y cuotas */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-500" /> 3. Modalidad financiera y cronograma
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Forma de pago
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleCambioTipoPago('CUOTAS')}
                          className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            nuevoTipoPago === 'CUOTAS'
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          En cuotas
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCambioTipoPago('CONTADO')}
                          className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                            nuevoTipoPago === 'CONTADO'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          Al contado
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Número de cuotas
                      </label>
                      <select
                        disabled={nuevoTipoPago === 'CONTADO'}
                        value={nuevoCuotasTotales}
                        onChange={(e) => setNuevoCuotasTotales(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 disabled:opacity-50"
                      >
                        {nuevoTipoPago === 'CONTADO' ? (
                          <option value={1}>1 cuota única (al contado)</option>
                        ) : (
                          <>
                            <option value={2}>2 cuotas</option>
                            <option value={3}>3 cuotas (estándar)</option>
                            <option value={4}>4 cuotas</option>
                            <option value={5}>5 cuotas (ilimitado)</option>
                          </>
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Monto total (S/)
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        value={nuevoMontoTotal}
                        onChange={(e) => setNuevoMontoTotal(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Monto de cuota inicial / pagada al ingresar (S/)
                      </label>
                      <input 
                        type="number"
                        step="0.01"
                        value={nuevoMontoCuota}
                        onChange={(e) => setNuevoMontoCuota(Number(e.target.value))}
                        className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <span>
                      Saldo pendiente al ingresar: <strong className="text-slate-900 dark:text-white">S/ {Math.max(0, nuevoMontoTotal - nuevoMontoCuota).toFixed(2)}</strong>
                    </span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">
                      {nuevoTipoPago === 'CONTADO' ? 'Constancia de no adeudo inmediata' : 'Cuota 01 pagada'}
                    </span>
                  </div>
                </div>

                {/* Botón de Envío */}
                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('directorio')}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={guardandoNuevo}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {guardandoNuevo ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" /> Creando cuenta...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" /> Matricular y crear estudiante
                      </>
                    )}
                  </button>
                </div>
              </form>

            </div>
          )}

          </div>
        </main>
      </div>

      {/* Modal Ficha 360° del Alumno */}
      {alumnoSeleccionado && (
        <Ficha360Modal
          alumnoSeleccionado={alumnoSeleccionado}
          catalogoDiplomados={catalogoFull}
          onClose={() => setAlumnoSeleccionado(null)}
          onAbrirCronograma={(cred: any) => {
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
          onRefetchEstudiantes={cargarEstudiantes}
        />
      )}

      {/* Modal: Recibo Interno Imprimible */}
      <ReciboModal
        reciboImprimir={reciboImprimir}
        alumnoSeleccionado={alumnoSeleccionado}
        onClose={() => setReciboImprimir(null)}
      />

      {/* Modal: Anulación de Pago */}
      <AnularPagoModal
        pagoParaAnular={pagoParaAnular}
        alumnoSeleccionado={alumnoSeleccionado}
        onClose={() => setPagoParaAnular(null)}
        onSubmit={handleAnularPagoSubmit}
        cargandoAnulacion={cargandoAnulacion}
      />

      {/* Modal: Editar Cuotas y Cronograma de Pagos */}
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
