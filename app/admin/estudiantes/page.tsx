'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, RefreshCw, Eye, ShieldCheck, 
  CheckCircle2, AlertTriangle, UserCheck, GraduationCap, Download
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AnularPagoModal from '@/components/admin/anular-pago-modal';
import ReciboModal from '@/components/admin/recibo-modal';
import EditarCronogramaModal from '@/components/admin/editar-cronograma-modal';
import Ficha360Modal from '@/components/admin/ficha-360-modal';
import { EstudianteCompleto } from '@/lib/data/mockStudents';

export default function AdminEstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<EstudianteCompleto[]>([]);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos');
  
  // Modal Ficha 360°
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<EstudianteCompleto | null>(null);

  const [catalogoFull, setCatalogoFull] = useState<any[]>([]);

  useEffect(() => {
    cargarEstudiantes();
    cargarCatalogo();
  }, []);

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
        await cargarEstudiantes();
      } else {
        setMensaje({ texto: `Error: ${data.error || 'No se pudo procesar la solicitud'}`, tipo: 'error' });
      }
    } catch {
      setMensaje({ texto: 'Error de conexión con el servidor local.', tipo: 'error' });
    } finally {
      setCargandoPago(false);
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
        await cargarEstudiantes();
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
      alert(`¡Alerta de Retención (Deserción Cero) enviada a n8n para notificar vía WhatsApp a ${alumnoSeleccionado.nombres}!`);
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

      {/* Contenido Principal */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0 h-full">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Encabezado */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Sincronizado Supabase
                </span>
                <span className="text-slate-400 text-xs font-mono">• public.profiles</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> 
                Directorio y Secretaría de Estudiantes
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Administra inscripciones, asignación de diplomados, notas por módulo y Ficha 360° en tiempo real.
              </p>
            </div>

            <button
              onClick={cargarEstudiantes}
              disabled={cargando}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar Lista {cargando && estudiantes.length === 0 ? '' : `(${estudiantes.length})`}
            </button>
          </div>

          {/* Filtros de Búsqueda */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="size-4" />
              </span>
              <input 
                type="text"
                placeholder="Buscar por DNI, Nombres, Apellidos o Correo..."
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
                <option value="todos">Todos los Estados de Deuda</option>
                <option value="Al Día">Al Día</option>
                <option value="Deuda Activa">Deuda Activa</option>
                <option value="Constancia de no adeudo">Constancia de no adeudo</option>
                <option value="Bloqueado por Sistema">Bloqueado por Sistema</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filtroRiesgo}
                onChange={(e) => setFiltroRiesgo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="todos">Todos los Niveles de Riesgo</option>
                <option value="BAJO">Riesgo Bajo</option>
                <option value="MEDIO">Riesgo Medio</option>
                <option value="ALTO">Riesgo Alto</option>
                <option value="CRÍTICO">Riesgo Crítico</option>
              </select>
            </div>
          </div>

          {/* Tabla de Estudiantes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">DNI / CE</th>
                    <th className="py-3 px-4">Estudiante</th>
                    <th className="py-3 px-4">Paquete & Diplomado Actual</th>
                    <th className="py-3 px-4 text-center">Avance Real</th>
                    <th className="py-3 px-4">Estado Pago</th>
                    <th className="py-3 px-4 text-center">Riesgo</th>
                    <th className="py-3 px-4 text-right">Ficha 360°</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {cargando && estudiantes.length === 0 ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={`skeleton-${i}`} className="animate-pulse">
                        <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-20"></div></td>
                        <td className="py-4 px-4 space-y-1.5">
                          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-36"></div>
                          <div className="h-3 bg-slate-100 dark:bg-slate-800/60 rounded w-48"></div>
                        </td>
                        <td className="py-4 px-4"><div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-32"></div></td>
                        <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-md w-12 mx-auto"></div></td>
                        <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-24"></div></td>
                        <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-200 dark:bg-slate-800 rounded-full w-16 mx-auto"></div></td>
                        <td className="py-4 px-4 text-right"><div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-xl w-24 ml-auto"></div></td>
                      </tr>
                    ))
                  ) : estudiantesFiltrados.length > 0 ? (
                    estudiantesFiltrados.map((est) => (
                      <tr key={est.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{est.dni_ce}</td>
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-100">
                          <div>{est.nombres} {est.apellidos}</div>
                          <div className="text-[10px] font-normal text-slate-400">{est.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px] mr-2">
                            {est.paquete_adquirido || 'FULL'}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {est.diplomado_actual || 'DERECHO MINERO'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md text-[11px]">
                            {est.avance_porcentaje ?? 50}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            est.estado === 'Constancia de no adeudo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            est.estado === 'Deuda Activa' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {est.estado}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            est.nivel_riesgo_churn === 'CRÍTICO' ? 'bg-rose-600 text-white' :
                            est.nivel_riesgo_churn === 'ALTO' ? 'bg-amber-500 text-white' :
                            'bg-emerald-600 text-white'
                          }`}>
                            {est.nivel_riesgo_churn}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setAlumnoSeleccionado(est)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Eye className="size-3.5" /> Abrir Ficha
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                        No se encontraron estudiantes para la búsqueda.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Modal Ficha 360° */}
      {alumnoSeleccionado && (
        <Ficha360Modal
          alumnoSeleccionado={alumnoSeleccionado}
          catalogoDiplomados={catalogoFull}
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
