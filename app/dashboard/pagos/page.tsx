'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  CheckCircle2, 
  AlertCircle, 
  PhoneCall, 
  Eye, 
  Printer, 
  X,
  Award,
  Calendar,
  FileText,
  CreditCard,
  Check,
  Send,
  ExternalLink
} from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { StudentPageHeader } from '@/components/dashboard/StudentPageHeader';
import { formatearFechaVisual, resolverFechaVencimiento, esFechaVencida, evaluarEstadoDeuda, EvaluacionEstadoDeuda } from '@/lib/utils/fechasCuotas';
import { getClientCachedData, fetchWithClientCache } from '@/lib/utils/clientCache';

export default function PagosEstudiantePage() {
  const { esOscuro } = useTheme();

  // Estados de datos reales de Supabase
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pagosSupabase, setPagosSupabase] = useState<any[]>([]);
  const [estadoDeudaEstudiante, setEstadoDeudaEstudiante] = useState<EvaluacionEstadoDeuda | null>(null);

  // Estados de simulación dev (para pruebas manuales si se activa el simulador)
  const [modoPrueba, setModoPrueba] = useState<'al_dia' | 'completado' | 'bloqueo'>('al_dia');
  const [tipoPlan, setTipoPlan] = useState<'cuotas' | 'contado'>('cuotas');
  
  const [pestanaActiva, setPestanaActiva] = useState<'cronograma' | 'historial'>('cronograma');

  // Estado para el modal de recibo imprimible
  const [reciboSeleccionado, setReciboSeleccionado] = useState<any>(null);

  // Estado para el modal de "Ir a pagar"
  const [cuotaParaPagar, setCuotaParaPagar] = useState<any>(null);

  useEffect(() => {
    function procesarPagosPayload(data: any) {
      if (!data?.profile) return;
      setProfile(data.profile);
      setPagosSupabase(data.pagos || []);
      
      // Evaluar estado financiero real del alumno de forma integral
      const evaluacion = evaluarEstadoDeuda(data.profile, data.pagos || []);
      setEstadoDeudaEstudiante(evaluacion);

      const esPlanContado = 
        data.profile?.tipo_pago === 'CONTADO' || 
        String(data.profile?.paquete_adquirido).includes('CONTADO') ||
        (data.pagos || []).some((p: any) => {
          if (Array.isArray(p.cuotas)) {
            const validas = p.cuotas.filter((c: string) => c !== 'no corresponde');
            return validas.length === 1;
          }
          return false;
        });

      if (esPlanContado) {
        setTipoPlan('contado');
      }

      if (evaluacion.tieneDeudaVencida || data.profile.bloqueado) {
        setModoPrueba('bloqueo');
      } else if (evaluacion.esCompletado) {
        setModoPrueba('completado');
      } else {
        setModoPrueba('al_dia');
      }
    }

    // 1. Hidratación instantánea desde caché si existe
    const cachedMe = getClientCachedData('/api/dashboard/me');
    if (cachedMe) {
      procesarPagosPayload(cachedMe);
      setLoading(false);
    }

    // 2. Revalidación en segundo plano (stale-while-revalidate forzado)
    async function cargarDatosPagos() {
      try {
        const data = await fetchWithClientCache('/api/dashboard/me', { forceRefresh: true });
        if (data) {
          procesarPagosPayload(data);
        }
      } catch (e) {
        console.error('Error cargando datos de pagos de Supabase:', e);
      } finally {
        setLoading(false);
      }
    }
    cargarDatosPagos();
  }, []);

  // Construir cronograma real dinámicamente desde Supabase respetando fechas reales de vencimiento y pagos
  const cronogramaRealSupabase = useMemo(() => {
    const nombrePrograma = profile?.diplomado_actual || profile?.diplomados_json?.[0]?.titulo || (typeof profile?.diplomado_1 === 'string' && !profile.diplomado_1.startsWith('DIPLOMADOS_LIST|') ? profile.diplomado_1 : 'DERECHO MINERO');

    if (!pagosSupabase || pagosSupabase.length === 0) {
      // Fallback si no hay registros de pagos creados aún
      const paquete = profile?.paquete_adquirido || 'FULL';
      const montoTotal = paquete === 'ILIMITADO' ? 1500 : paquete === 'FULL' ? 900 : 540;
      const totalCuotas: number = tipoPlan === 'contado' ? 1 : (paquete === 'ILIMITADO' ? 5 : 3);
      const cuotaMonto = montoTotal / totalCuotas;
      const fechaBase = profile?.created_at || new Date().toISOString();

      return Array.from({ length: totalCuotas }).map((_, idx) => {
        const fechaCalculada = resolverFechaVencimiento(idx, null, fechaBase);
        const numCuota = idx + 1;
        const nroFmt = String(numCuota).padStart(2, '0');
        const estaVencida = esFechaVencida(fechaCalculada);

        return {
          id: `sim-${numCuota}`,
          numCuota,
          cuota: totalCuotas === 1 ? 'Cuota única' : `Cuota ${nroFmt} de ${String(totalCuotas).padStart(2, '0')}`,
          concepto: totalCuotas === 1 ? `Cuota única - ${nombrePrograma}` : `Cuota ${nroFmt} - ${nombrePrograma}`,
          monto: cuotaMonto,
          fecha_vencimiento: formatearFechaVisual(fechaCalculada),
          fecha_pago: '-',
          comprobante: '-',
          nro_operacion: null,
          medio: '-',
          estado: estaVencida ? 'Vencido' : 'Por vencer',
          esPagada: false
        };
      });
    }

    const items: any[] = [];

    pagosSupabase.forEach((pago: any) => {
      if (pago.is_cargo_extra) {
        items.push({
          id: pago.id,
          numCuota: 99,
          cuota: 'Cargo extra',
          concepto: pago.concepto || 'Examen sustitutorio',
          monto: Number(pago.monto || 0),
          fecha_vencimiento: pago.created_at ? formatearFechaVisual(pago.created_at) : formatearFechaVisual(new Date().toISOString()),
          fecha_pago: pago.created_at ? formatearFechaVisual(pago.created_at) : formatearFechaVisual(new Date().toISOString()),
          comprobante: pago.nro_recibo || pago.comprobante || '-',
          nro_operacion: pago.nro_operacion || 'N/A',
          medio: pago.metodo && pago.metodo !== 'Por Pagar' && !pago.metodo.startsWith('CREDITO_') ? pago.metodo : 'Yape / Plin',
          estado: pago.estado || 'Pagado',
          esPagada: true
        });
        return;
      }

      const cuotasArray: string[] = Array.isArray(pago.cuotas) ? pago.cuotas : ['0', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde', 'no corresponde'];
      const cuotasValidas = cuotasArray.filter(v => v !== 'no corresponde');
      const totalValidasCount = cuotasValidas.length;
      const montoBaseCuota = pago.monto ? (pago.monto / Math.max(1, totalValidasCount)) : 300;

      cuotasArray.forEach((cVal: string, cIdx: number) => {
        if (cVal === 'no corresponde') return;

        const numCuota = cIdx + 1;
        const nroFmt = String(numCuota).padStart(2, '0');
        const montoCuota = Number(cVal) > 0 ? Number(cVal) : montoBaseCuota;
        const esPagada = Number(cVal) > 0;

        // Fecha de vencimiento real obtenida del plan guardado o calculada mensualmente desde la inscripción
        const fechaCalculada = resolverFechaVencimiento(
          cIdx, 
          pago.fechas_vencimiento, 
          pago.created_at || profile?.created_at
        );
        const estaVencida = !esPagada && esFechaVencida(fechaCalculada);
        const estadoCuota = esPagada ? 'Pagado' : (estaVencida || profile?.bloqueado) ? 'Vencido' : 'Por vencer';

        const reciboCuota = pago.cuotas_recibos?.[cIdx]?.nro_recibo || (esPagada ? (cIdx === 0 ? pago.nro_recibo : null) : null);
        const operacionCuota = pago.cuotas_recibos?.[cIdx]?.nro_operacion || (esPagada ? (pago.nro_operacion || null) : null);
        const fechaPagoRaw = pago.cuotas_recibos?.[cIdx]?.fecha || (esPagada ? (pago.created_at || profile?.created_at) : null);
        const medioPagoCuota = pago.cuotas_recibos?.[cIdx]?.metodo || (pago.metodo && pago.metodo !== 'Por Pagar' && !pago.metodo.startsWith('CREDITO_') ? pago.metodo : 'Yape / Plin');

        items.push({
          id: `${pago.id}-c${numCuota}`,
          numCuota,
          cuota: totalValidasCount === 1 ? 'Cuota única' : `Cuota ${nroFmt} de ${String(totalValidasCount).padStart(2, '0')}`,
          concepto: totalValidasCount === 1 ? `Cuota única - ${nombrePrograma}` : `Cuota ${nroFmt} - ${nombrePrograma}`,
          monto: montoCuota,
          fecha_vencimiento: formatearFechaVisual(fechaCalculada),
          fecha_pago: esPagada ? (fechaPagoRaw ? formatearFechaVisual(fechaPagoRaw) : formatearFechaVisual(pago.created_at)) : '-',
          comprobante: esPagada ? (reciboCuota || pago.nro_recibo || '-') : '-',
          nro_operacion: operacionCuota || (esPagada ? 'N/A' : null),
          medio: esPagada ? medioPagoCuota : '-',
          estado: estadoCuota,
          esPagada
        });
      });
    });

    return items;
  }, [pagosSupabase, profile]);

  const cronogramaActual = cronogramaRealSupabase;

  // Filtrar solo los comprobantes de cuotas pagadas o cargos extras para el Historial de Comprobantes
  const historialComprobantes = cronogramaActual.filter(item => item.esPagada || item.estado === 'Pagado' || item.estado === 'APROBADO' || item.cuota === 'Cargo extra');

  if (loading) {
    return <DashboardLoader />;
  }

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 relative pb-28 transition-colors duration-200 ${
      esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Encabezado unificado */}
        <StudentPageHeader
          icon={Wallet}
          title="Mis pagos"
        />

        {/* PESTAÑAS DE NAVEGACIÓN (CRONOGRAMA VS HISTORIAL) */}
        <div className="flex items-center gap-2 overflow-x-auto max-w-full touch-pan-x pb-2 pr-4 border-b border-slate-200 dark:border-slate-800 no-scrollbar shrink-0">
          <button
            onClick={() => setPestanaActiva('cronograma')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              pestanaActiva === 'cronograma'
                ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/20'
                : (esOscuro ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')
            }`}
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Cronograma de pagos</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              pestanaActiva === 'cronograma'
                ? 'bg-white/20 text-white'
                : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
            }`}>
              {cronogramaActual.length}
            </span>
          </button>

          <button
            onClick={() => setPestanaActiva('historial')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold border transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 ${
              pestanaActiva === 'historial'
                ? 'bg-indigo-600 text-white border-transparent shadow-md shadow-indigo-600/20'
                : (esOscuro ? 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:bg-slate-800' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100')
            }`}
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span>Comprobantes de pago</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              pestanaActiva === 'historial'
                ? 'bg-white/20 text-white'
                : (esOscuro ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')
            }`}>
              {historialComprobantes.length}
            </span>
          </button>
        </div>

        {/* BANNERS DE ESTADO FINANCIERO REAL */}
        {modoPrueba === 'al_dia' && (
          <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-6 border relative overflow-hidden transition-all ${
            esOscuro 
              ? 'bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border-indigo-500/30' 
              : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border-indigo-500/30'
          }`}>
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 size-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  ¡Tu cuenta se encuentra al día y en orden!
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {estadoDeudaEstudiante?.proximaFechaPorVencer
                    ? `Has completado tus cuotas programadas puntualmente. Tu próxima cuota vence el ${formatearFechaVisual(estadoDeudaEstudiante.proximaFechaPorVencer)}. Recuerda mantener tus pagos al día para garantizar el acceso ininterrumpido a tus clases y certificaciones.`
                    : 'Has completado tus cuotas programadas puntualmente. Recuerda mantener tus pagos al día para garantizar el acceso ininterrumpido a tus clases y certificaciones.'}
                </p>
              </div>

              <a
                href="https://wa.me/51980694497?text=Hola%20EDUMIN,%20deseo%20consultar%20mi%20estado%20de%20pago"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                Contactar asesor de pagos
              </a>
            </div>
          </div>
        )}

        {modoPrueba === 'completado' && (
          <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-6 border relative overflow-hidden transition-all ${
            esOscuro
              ? 'bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-950 border-emerald-500/30'
              : 'bg-gradient-to-r from-emerald-950 via-teal-950 to-slate-950 border-emerald-500/30'
          }`}>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-emerald-500 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Deuda 100% cancelada
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  ¡Felicitaciones! Has cancelado el 100% de tu programa
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  No registras saldos pendientes. Tu constancia de no adeudo financiero está activa para la emisión de tus certificaciones oficiales.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
                  <Award className="size-4" /> Constancia de no adeudo activa
                </span>
              </div>
            </div>
          </div>
        )}

        {modoPrueba === 'bloqueo' && (
          <div className={`rounded-2xl p-5 sm:p-6 text-white shadow-xl mb-6 border relative overflow-hidden transition-all ${
            esOscuro
              ? 'bg-gradient-to-r from-slate-900 via-red-950/90 to-slate-950 border-red-500/40'
              : 'bg-gradient-to-r from-red-950 via-rose-950 to-slate-950 border-red-500/40'
          }`}>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-2xl">
                <div className="flex items-center gap-2">
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle className="size-3" /> Acceso restringido por cuota vencida
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  Atención: Regulariza tu cuota pendiente para reactivar tu campus
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  {estadoDeudaEstudiante?.primeraFechaVencida
                    ? `Registras una cuota vencida (fecha de vencimiento: ${formatearFechaVisual(estadoDeudaEstudiante.primeraFechaVencida)}). El acceso a tus programas, clases y certificaciones está restringido. Regulariza tu pago vía WhatsApp o solicita una prórroga para rehabilitar tus accesos.`
                    : 'Registras una cuota vencida. Regulariza tu pago vía WhatsApp o solicita una prórroga de pago con tu asesor financiero para reactivar tus accesos.'}
                </p>
              </div>

              <a
                href="https://wa.me/51980694497?text=Hola%20EDUMIN,%20deseo%20regularizar%20mi%20pago%20vencido"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-1.5 shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                Regularizar pago vía WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* TABLA DE CRONOGRAMA */}
        {pestanaActiva === 'cronograma' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Desglose de cuotas y vencimientos
              </h3>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                Coincidencia por DNI: {profile?.dni_ce}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Cuota</th>
                    <th className="py-3 px-4">Concepto</th>
                    <th className="py-3 px-4">Monto</th>
                    <th className="py-3 px-4">Fecha de vencimiento</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {cronogramaActual.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{item.cuota}</td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{item.concepto}</td>
                      <td className="py-4 px-4 tabular-nums font-bold text-slate-900 dark:text-white">S/ {Number(item.monto).toFixed(2)}</td>
                      <td className="py-4 px-4 tabular-nums font-semibold text-slate-700 dark:text-slate-300">{item.fecha_vencimiento}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.esPagada || item.estado === 'Pagado' || item.estado === 'APROBADO' || item.estado === 'Completado'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : item.estado === 'Vencido'
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                        }`}>
                          {item.esPagada ? 'Pagado' : item.estado}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {item.esPagada ? (
                          <button
                            onClick={() => setReciboSeleccionado(item)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="size-3.5" /> Ver recibo
                          </button>
                        ) : (
                          <button
                            onClick={() => setCuotaParaPagar(item)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1.5 cursor-pointer shadow-sm hover:shadow"
                          >
                            <CreditCard className="size-3.5" /> Ir a pagar
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TABLA DE HISTORIAL DE COMPROBANTES */}
        {pestanaActiva === 'historial' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Historial de recibos y comprobantes emitidos
              </h3>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                Total emitidos: {historialComprobantes.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">N.º de recibo</th>
                    <th className="py-3 px-4">Concepto de pago</th>
                    <th className="py-3 px-4">Monto abonado</th>
                    <th className="py-3 px-4">Medio de pago</th>
                    <th className="py-3 px-4">Fecha de pago</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {historialComprobantes.length > 0 ? (
                    historialComprobantes.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-4 px-4 tabular-nums font-bold text-indigo-600 dark:text-indigo-400">{item.comprobante}</td>
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{item.concepto}</td>
                        <td className="py-4 px-4 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">S/ {Number(item.monto).toFixed(2)}</td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{item.medio}</td>
                        <td className="py-4 px-4 tabular-nums text-slate-600 dark:text-slate-400">{item.fecha_pago || item.fecha_vencimiento}</td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setReciboSeleccionado(item)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Printer className="size-3.5" /> Ver recibo
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 italic">
                        No se registran comprobantes emitidos aún.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* MODAL IR A PAGAR (CANALES OFICIALES DE PAGO) */}
      {cuotaParaPagar && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setCuotaParaPagar(null); }} 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-6 sm:p-7 space-y-5 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white animate-in zoom-in-95 duration-150 my-auto"
          >
            {/* Header del modal */}
            <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <span className="bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  Canales oficiales de pago
                </span>
                <h3 className="text-lg font-bold tracking-tight mt-1 text-slate-900 dark:text-white">
                  Realizar pago de {cuotaParaPagar.cuota.toLowerCase()}
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setCuotaParaPagar(null)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Resumen de la cuota */}
            <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block truncate">
                  {cuotaParaPagar.concepto}
                </span>
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block">
                  Fecha de vencimiento: <strong className="text-slate-900 dark:text-white">{cuotaParaPagar.fecha_vencimiento}</strong>
                </span>
              </div>
              <div className="text-right shrink-0">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Monto a pagar</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                  S/ {Number(cuotaParaPagar.monto).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Coordinación y canales oficiales de recaudación */}
            <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
              <div className="flex items-start gap-3">
                <div className="size-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 font-bold text-xs shadow-xs">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Canales oficiales de pago y tesorería
                  </h4>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Para garantizar la seguridad de tu abono y proporcionarte los números de cuenta bancaria o código QR oficial vigentes, coordina directamente con el área de finanzas a través de nuestro canal institucional de WhatsApp.
                  </p>
                </div>
              </div>
            </div>

            {/* Aviso y acción WhatsApp */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Una vez realizado el abono, notifícalo adjuntando tu constancia o comprobante para la emisión y validación de tu recibo oficial.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  type="button"
                  onClick={() => setCuotaParaPagar(null)}
                  className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer text-center"
                >
                  Cerrar
                </button>
                <a
                  href={`https://wa.me/51980694497?text=${encodeURIComponent(
                    `Hola EDUMIN, soy ${profile?.nombres || ''} ${profile?.apellidos || ''} (DNI: ${profile?.dni_ce || ''}). Deseo solicitar los números de cuenta oficiales para realizar el abono de la ${cuotaParaPagar.cuota} por el monto de S/ ${Number(cuotaParaPagar.monto).toFixed(2)} de mi programa ${profile?.diplomado_actual || profile?.diplomados_json?.[0]?.titulo || profile?.diplomado_1 || 'EDUMIN'}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="size-4" />
                  <span>Solicitar cuentas y coordinar pago por WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECIBO IMPRIMIBLE (IDÉNTICO AL PANEL DE ADMINISTRACIÓN) */}
      {reciboSeleccionado && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setReciboSeleccionado(null); }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight">EDUMIN</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Comprobante oficial de pago</p>
              </div>
              <div className="text-right">
                <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 tabular-nums font-black text-xs px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 block">
                  RECIBO OFICIAL - {reciboSeleccionado.comprobante}
                </span>
                <span className="text-[10px] tabular-nums text-slate-400 block mt-1">
                  {reciboSeleccionado.fecha_pago || reciboSeleccionado.fecha_vencimiento || new Date().toLocaleDateString('es-PE')}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Estudiante:</span>
                <strong className="text-slate-900 dark:text-white">{profile?.nombres || 'Estudiante'} {profile?.apellidos || ''}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">DNI / CE:</span>
                <strong className="tabular-nums text-slate-900 dark:text-white">{profile?.dni_ce || 'Sin DNI'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Programa:</span>
                <strong className="text-indigo-600 dark:text-indigo-400">
                  {profile?.diplomado_actual || profile?.diplomados_json?.[0]?.titulo || (typeof profile?.diplomado_1 === 'string' && !profile.diplomado_1.startsWith('DIPLOMADOS_LIST|') ? profile.diplomado_1 : 'DERECHO MINERO')}
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Concepto:</span>
                <strong className="text-slate-900 dark:text-white">{reciboSeleccionado.concepto}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">N.º de recibo oficial:</span>
                <strong className="tabular-nums text-indigo-600 dark:text-indigo-400 font-bold">{reciboSeleccionado.comprobante}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Método de pago:</span>
                <strong className="text-slate-800 dark:text-slate-200">{reciboSeleccionado.medio}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">N.º de operación bancaria:</span>
                <strong className="tabular-nums text-slate-900 dark:text-white">{reciboSeleccionado.nro_operacion || 'No aplica (Efectivo)'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Fecha de pago:</span>
                <strong className="tabular-nums text-slate-900 dark:text-white">{reciboSeleccionado.fecha_pago || '-'}</strong>
              </div>
              <div className="flex justify-between bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-sm">
                <span className="text-emerald-900 dark:text-emerald-300 font-bold">Monto total pagado:</span>
                <strong className="text-emerald-700 dark:text-emerald-400 font-black tabular-nums">S/ {Number(reciboSeleccionado.monto).toFixed(2)}</strong>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReciboSeleccionado(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="size-4" /> Imprimir / PDF
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}
