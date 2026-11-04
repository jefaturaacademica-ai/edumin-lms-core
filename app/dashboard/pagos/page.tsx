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
  FileText
} from 'lucide-react';
import { useTheme } from '@/context/theme-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { StudentPageHeader } from '@/components/dashboard/StudentPageHeader';

export default function PagosEstudiantePage() {
  const { esOscuro } = useTheme();

  // Estados de datos reales de Supabase
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [pagosSupabase, setPagosSupabase] = useState<any[]>([]);

  // Estados de simulación dev (para pruebas manuales si se activa el simulador)
  const [modoPrueba, setModoPrueba] = useState<'al_dia' | 'completado' | 'bloqueo'>('al_dia');
  const [tipoPlan, setTipoPlan] = useState<'cuotas' | 'contado'>('cuotas');
  
  const [pestanaActiva, setPestanaActiva] = useState<'cronograma' | 'historial'>('cronograma');

  // Estado para el modal de recibo imprimible
  const [reciboSeleccionado, setReciboSeleccionado] = useState<any>(null);

  useEffect(() => {
    async function cargarDatosPagos() {
      try {
        setLoading(true);
        const res = await fetch('/api/dashboard/me');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            setProfile(data.profile);
            setPagosSupabase(data.pagos || []);
            
            // Evaluar estado financiero real del alumno desde Supabase
            const totalDeudaReal = (data.pagos || []).reduce((acc: number, p: any) => acc + (p.total_deuda ?? 0), 0);
            const cuotasPagadasCount = (data.pagos || []).reduce((acc: number, p: any) => {
              if (Array.isArray(p.cuotas)) {
                return acc + p.cuotas.filter((v: string) => v !== 'no corresponde' && Number(v) > 0).length;
              }
              return acc;
            }, 0);

            if (data.profile.tipo_pago === 'CONTADO' || String(data.profile.paquete_adquirido).includes('CONTADO')) {
              setTipoPlan('contado');
            }

            if (data.profile.bloqueado) {
              setModoPrueba('bloqueo');
            } else if (totalDeudaReal === 0 && cuotasPagadasCount > 0) {
              setModoPrueba('completado');
            } else {
              setModoPrueba('al_dia');
            }
          }
        }
      } catch (e) {
        console.error('Error cargando datos de pagos de Supabase:', e);
      } finally {
        setLoading(false);
      }
    }
    cargarDatosPagos();
  }, []);

  // Construir cronograma real dinámicamente desde la coincidencia de DNI en Supabase (tabla /pagos)
  const cronogramaRealSupabase = useMemo(() => {
    if (!pagosSupabase || pagosSupabase.length === 0) {
      // Fallback si no hay registros de pagos creados aún
      const paquete = profile?.paquete_adquirido || 'FULL';
      const montoTotal = paquete === 'ILIMITADO' ? 1500 : paquete === 'FULL' ? 900 : 540;
      const totalCuotas = paquete === 'ILIMITADO' ? 5 : 3;
      const cuotaMonto = montoTotal / totalCuotas;

      return Array.from({ length: totalCuotas }).map((_, idx) => ({
        id: `sim-${idx + 1}`,
        cuota: `Cuota 0${idx + 1} de 0${totalCuotas}`,
        concepto: idx === 0 ? 'Matrícula + Primera Cuota Diplomado' : `Cuota 0${idx + 1} Académica`,
        monto: cuotaMonto,
        fecha: `15/0${idx + 1}/2026`,
        comprobante: idx === 0 ? 'OP-882910' : '-',
        medio: idx === 0 ? 'Yape / Plin' : '-',
        estado: idx === 0 ? 'Pagado' : 'Por vencer'
      }));
    }

    const items: any[] = [];
    let contadorCuotaGlobal = 1;

    pagosSupabase.forEach((pago: any) => {
      if (pago.is_cargo_extra) {
        items.push({
          id: pago.id,
          cuota: `Cargo Extra`,
          concepto: pago.concepto || 'Examen Sustitutorio',
          monto: Number(pago.monto || 0),
          fecha: pago.created_at ? new Date(pago.created_at).toLocaleDateString('es-PE') : '15/02/2026',
          comprobante: `OP-CARGO-${String(pago.id).substring(0, 6)}`,
          medio: pago.metodo || 'Yape / Plin',
          estado: pago.estado || 'Pagado'
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
        const montoCuota = Number(cVal) > 0 ? Number(cVal) : montoBaseCuota;
        const esPagada = Number(cVal) > 0;
        const estadoCuota = esPagada ? 'Pagado' : profile?.bloqueado ? 'Vencido' : 'Por vencer';

        items.push({
          id: `${pago.id}-c${numCuota}`,
          cuota: totalValidasCount === 1 ? 'Cuota Única' : `Cuota 0${numCuota} de 0${totalValidasCount}`,
          concepto: numCuota === 1 ? `Cuota 01 - Matrícula + Programa (${profile?.diplomado_1 || 'Diplomado'})` : `Cuota 0${numCuota} Académica`,
          monto: montoCuota,
          fecha: `15/0${Math.min(9, numCuota + 1)}/2026`,
          comprobante: esPagada ? `OP-CUOTA-0${numCuota}` : '-',
          medio: esPagada ? (pago.metodo && !pago.metodo.startsWith('CREDITO_') ? pago.metodo : 'Yape / Plin') : '-',
          estado: estadoCuota
        });
        contadorCuotaGlobal++;
      });
    });

    return items;
  }, [pagosSupabase, profile]);

  const cronogramaActual = cronogramaRealSupabase;

  // Filtrar solo los comprobantes de cuotas pagadas o cargos extras para el Historial de Comprobantes
  const historialComprobantes = cronogramaActual.filter(item => item.estado === 'Pagado' || item.estado === 'APROBADO' || item.cuota === 'Cargo Extra');

  if (loading) {
    return <DashboardLoader />;
  }

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 relative pb-28 transition-colors ${
      esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="max-w-6xl mx-auto">
        
        {/* Encabezado Unificado */}
        <StudentPageHeader
          icon={Wallet}
          title="Mis pagos"
          subtitle="Consulta tus cuotas canceladas, fechas de vencimiento y comprobantes de pago oficiales."
        >
          {profile && (
            <span className="text-xs tabular-nums font-bold px-3.5 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-800 shrink-0">
              DNI: {profile.dni_ce} • Paquete: {profile.paquete_adquirido || 'FULL'}
            </span>
          )}
        </StudentPageHeader>

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
                  Has completado tus cuotas programadas puntualmente. Recuerda mantener tus pagos al día para garantizar el acceso ininterrumpido a tus clases y certificaciones.
                </p>
              </div>

              <a
                href="https://wa.me/51984512809?text=Hola%20EDUMIN,%20deseo%20consultar%20mi%20estado%20de%20pago"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                Contactar Asesor de Pagos
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
                    <CheckCircle2 className="size-3" /> Deuda 100% Cancelada
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  ¡Felicitaciones! Has cancelado el 100% de tu programa
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  No registras saldos pendientes. Tu Constancia de No Adeudo Financiero está activa para la emisión de tus certificaciones oficiales.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold px-4 py-2.5 rounded-xl flex items-center gap-1.5">
                  <Award className="size-4" /> Constancia de No Adeudo Activa
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
                  <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                    <AlertCircle className="size-3" /> Acceso Restringido por Cuota Vencida
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  ⚠️ Atención: Regulariza tu cuota pendiente para reactivar tu campus
                </h2>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                  Registras una cuota vencida. Regulariza tu pago vía WhatsApp o solicita una prórroga de pago con tu asesor financiero.
                </p>
              </div>

              <a
                href="https://wa.me/51984512809?text=Hola%20EDUMIN,%20deseo%20regularizar%20mi%20pago%20vencido"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-lg flex items-center gap-1.5 shrink-0"
              >
                <PhoneCall className="w-4 h-4" />
                Regularizar Pago vía WhatsApp
              </a>
            </div>
          </div>
        )}

        {/* PESTAÑAS DE NAVEGACIÓN (CRONOGRAMA VS HISTORIAL) */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 gap-2">
          <button
            onClick={() => setPestanaActiva('cronograma')}
            className={`px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer ${
              pestanaActiva === 'cronograma'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Calendar className="size-4" /> Cronograma de Pagos ({cronogramaActual.length})
          </button>
          <button
            onClick={() => setPestanaActiva('historial')}
            className={`px-5 py-3 font-bold text-xs border-b-2 transition flex items-center gap-2 cursor-pointer ${
              pestanaActiva === 'historial'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FileText className="size-4" /> Historial de Comprobantes ({historialComprobantes.length})
          </button>
        </div>

        {/* TABLA DE CRONOGRAMA */}
        {pestanaActiva === 'cronograma' && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Desglose de Cuotas y Vencimientos
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
                    <th className="py-3 px-4">Fecha Vencimiento</th>
                    <th className="py-3 px-4">Nº Comprobante</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Recibo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {cronogramaActual.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-4 px-4 font-bold text-slate-900 dark:text-white">{item.cuota}</td>
                      <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{item.concepto}</td>
                      <td className="py-4 px-4 tabular-nums font-bold text-slate-900 dark:text-white">S/ {Number(item.monto).toFixed(2)}</td>
                      <td className="py-4 px-4 tabular-nums text-slate-600 dark:text-slate-400">{item.fecha}</td>
                      <td className="py-4 px-4 tabular-nums text-slate-600 dark:text-slate-400">{item.comprobante}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          item.estado === 'Pagado' || item.estado === 'APROBADO' || item.estado === 'Completado'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300'
                            : item.estado === 'Vencido'
                              ? 'bg-red-100 dark:bg-red-950/80 text-red-800 dark:text-red-300'
                              : 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300'
                        }`}>
                          {item.estado}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {(item.estado === 'Pagado' || item.estado === 'APROBADO' || item.estado === 'Completado' || item.cuota === 'Cargo Extra') ? (
                          <button
                            onClick={() => setReciboSeleccionado(item)}
                            className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="size-3.5" /> Ver Recibo
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">No emitido</span>
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
                Historial de Recibos y Comprobantes Emitidos
              </h3>
              <span className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                Total Emitidos: {historialComprobantes.length}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Nº Comprobante</th>
                    <th className="py-3 px-4">Concepto de Pago</th>
                    <th className="py-3 px-4">Monto Abonado</th>
                    <th className="py-3 px-4">Medio de Pago</th>
                    <th className="py-3 px-4">Fecha de Emisión</th>
                    <th className="py-3 px-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {historialComprobantes.length > 0 ? (
                    historialComprobantes.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                        <td className="py-4 px-4 tabular-nums font-bold text-slate-900 dark:text-white">{item.comprobante}</td>
                        <td className="py-4 px-4 text-slate-700 dark:text-slate-300">{item.concepto}</td>
                        <td className="py-4 px-4 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">S/ {Number(item.monto).toFixed(2)}</td>
                        <td className="py-4 px-4 text-slate-600 dark:text-slate-400">{item.medio}</td>
                        <td className="py-4 px-4 tabular-nums text-slate-600 dark:text-slate-400">{item.fecha}</td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setReciboSeleccionado(item)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl font-bold text-[11px] transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                          >
                            <Printer className="size-3.5" /> Imprimir / PDF
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

      {/* MODAL RECIBO IMPRIMIBLE */}
      {reciboSeleccionado && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setReciboSeleccionado(null); }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
          <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white">
            <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-black tracking-tight">EDUMIN LMS CORE</h2>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">Educación Ejecutiva en Minería y Seguridad</p>
              </div>
              <div className="text-right">
                <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 tabular-nums font-black text-xs px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 block">
                  RECIBO - {reciboSeleccionado.comprobante}
                </span>
                <span className="text-[10px] tabular-nums text-slate-400 block mt-1">{reciboSeleccionado.fecha}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Estudiante:</span>
                <strong>{profile?.nombres || 'Estudiante'} {profile?.apellidos || ''}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">DNI / CE:</span>
                <strong className="tabular-nums">{profile?.dni_ce || 'Sin DNI'}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Concepto:</span>
                <strong className="text-indigo-600 dark:text-indigo-400">{reciboSeleccionado.concepto}</strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span className="text-slate-500 font-semibold">Medio de Pago:</span>
                <strong>{reciboSeleccionado.medio}</strong>
              </div>
              <div className="flex justify-between bg-emerald-50 dark:bg-emerald-950/50 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-sm">
                <span className="text-emerald-900 dark:text-emerald-300 font-bold">Monto Total Pagado:</span>
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
