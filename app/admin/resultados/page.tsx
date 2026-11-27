'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, RefreshCw, TrendingUp, TrendingDown, Users, 
  CreditCard, Award, ShieldAlert, Download, Layers,
  CheckCircle2, Clock, Info, ShieldCheck, ArrowUpRight,
  Filter, Calendar
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/context/theme-context';

interface ResultadosData {
  kpis: {
    totalAlumnos: number;
    alumnosAlDia: number;
    alumnosConDeuda: number;
    alumnosBloqueados: number;
    tasaAlumnosAlDia: number;
    totalRecaudado: number;
    totalDeudaPendiente: number;
    tasaCobranza: number;
    tasaRetencion: number;
    tasaMorosidad: number;
    promedioNuevosAlumnosMes: number;
    tasaAprobacion: number;
  };
  diplomadosActivity: Array<{
    nombre: string;
    alDia: number;
    conSaldo: number;
    total: number;
  }>;
  paquetesDistribution: Array<{
    paquete: string;
    cantidad: number;
    porcentaje: number;
    color: string;
  }>;
  mesesSeries: Array<{
    mes: string;
    label: string;
    inscripciones: number;
    recaudacion: number;
    aprobados: number;
  }>;
  definiciones: Array<{
    titulo: string;
    descripcion: string;
  }>;
}

export default function AdminResultadosPage() {
  const { role } = useProfile();
  const { esOscuro } = useTheme();

  const [data, setData] = useState<ResultadosData | null>(null);
  const [cargando, setCargando] = useState(true);
  const [errorMensaje, setErrorMensaje] = useState<string | null>(null);
  const [filtroPeriodo, setFiltroPeriodo] = useState<'todo' | '6m' | '30d'>('todo');

  const esAdmin = role === 'ADMIN' || role === 'SUPERADMIN';

  const cargarResultados = async () => {
    setCargando(true);
    setErrorMensaje(null);
    try {
      const res = await fetch('/api/admin/resultados');
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setErrorMensaje(json.error || 'No se pudieron cargar las métricas');
      }
    } catch (err: any) {
      setErrorMensaje(err.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarResultados();
  }, []);

  // Gráfico Semicircular de Arco (Gauge SVG)
  const renderGaugeArco = (porcentaje: number, total: number, alDia: number) => {
    const radio = 70;
    const centroX = 90;
    const centroY = 85;
    const circunferenciaSemicirculo = Math.PI * radio;
    const offset = circunferenciaSemicirculo * (1 - Math.min(100, Math.max(0, porcentaje)) / 100);

    return (
      <div className="relative flex flex-col items-center justify-center pt-2">
        <svg viewBox="0 0 180 100" className="w-44 h-24 overflow-visible">
          {/* Arco de fondo */}
          <path
            d={`M 20 ${centroY} A ${radio} ${radio} 0 0 1 160 ${centroY}`}
            fill="none"
            stroke={esOscuro ? '#334155' : '#e2e8f0'}
            strokeWidth="14"
            strokeLinecap="round"
          />
          {/* Arco activo turquesa */}
          <path
            d={`M 20 ${centroY} A ${radio} ${radio} 0 0 1 160 ${centroY}`}
            fill="none"
            stroke="#06b6d4"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={circunferenciaSemicirculo}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>

        {/* Valor central */}
        <div className="absolute top-10 flex flex-col items-center text-center">
          <span className="text-2xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
            {alDia.toLocaleString('es-PE')}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {porcentaje}% al día
          </span>
        </div>

        {/* Rango inferior */}
        <div className="w-full flex justify-between px-3 text-[10px] font-bold text-slate-400 mt-1">
          <span>0</span>
          <span>{total.toLocaleString('es-PE')}</span>
        </div>
      </div>
    );
  };

  // Gráfico de Pastel / Donut SVG
  const renderDonutChart = (items: Array<{ paquete: string; cantidad: number; porcentaje: number; color: string }>) => {
    const radio = 60;
    const centro = 75;
    const grosor = 30;
    const circunferencia = 2 * Math.PI * radio;

    let offsetAcumulado = 0;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="relative w-40 h-40 shrink-0">
          <svg viewBox="0 0 150 150" className="w-full h-full -rotate-90 transform">
            {items.map((item, idx) => {
              const dashLength = (item.porcentaje / 100) * circunferencia;
              const currentOffset = offsetAcumulado;
              offsetAcumulado += dashLength;

              return (
                <circle
                  key={idx}
                  cx={centro}
                  cy={centro}
                  r={radio}
                  fill="none"
                  stroke={item.color}
                  strokeWidth={grosor}
                  strokeDasharray={`${dashLength} ${circunferencia - dashLength}`}
                  strokeDashoffset={-currentOffset}
                  className="transition-all duration-700 ease-out hover:opacity-90"
                />
              );
            })}
          </svg>
        </div>

        {/* Leyenda interactiva */}
        <div className="flex-1 space-y-1.5 w-full">
          {items.slice(0, 6).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="size-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-slate-600 dark:text-slate-300 font-medium truncate">
                  {item.paquete}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0 tabular-nums">
                <span className="font-bold text-slate-900 dark:text-white">{item.cantidad}</span>
                <span className="text-[11px] text-slate-400">({item.porcentaje}%)</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Mini Gráfico de Barras Verticales SVG
  const renderMiniBars = (series: Array<{ label: string; valor: number }>, color = '#06b6d4', suffix = '') => {
    const maxVal = Math.max(...series.map(s => s.valor), 1);
    const alturaMax = 60;

    return (
      <div className="pt-3">
        <div className="h-16 flex items-end gap-2 justify-between px-1">
          {series.map((s, idx) => {
            const pct = Math.max(10, Math.round((s.valor / maxVal) * alturaMax));
            return (
              <div key={idx} className="flex-1 flex flex-col items-center group relative">
                {/* Tooltip flotante */}
                <div className="absolute -top-7 hidden group-hover:flex bg-slate-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow pointer-events-none z-20 whitespace-nowrap">
                  {s.valor.toLocaleString('es-PE')}{suffix}
                </div>
                <div
                  style={{ height: `${pct}px`, backgroundColor: color }}
                  className="w-full rounded-t-md transition-all duration-500 ease-out hover:brightness-110"
                />
              </div>
            );
          })}
        </div>
        <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-1.5 mt-1 text-[9px] font-bold text-slate-400 uppercase">
          {series.map((s, idx) => (
            <span key={idx} className="flex-1 text-center truncate">{s.label.split(' ')[0]}</span>
          ))}
        </div>
      </div>
    );
  };

  if (!esAdmin && !cargando) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans">
        <AdminSidebar />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-4 shadow-sm">
            <ShieldAlert className="size-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-black text-slate-900 dark:text-white">Acceso restringido</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              El panel de Resultados está reservado exclusivamente para cuentas con rol administrativo o dirección.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const kpis = data?.kpis;
  const diplomados = data?.diplomadosActivity || [];
  const paquetes = data?.paquetesDistribution || [];
  const meses = data?.mesesSeries || [];
  const definiciones = data?.definiciones || [];

  const maxTotalDiplomados = Math.max(...diplomados.map(d => d.total), 1);

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto z-10 min-w-0">
          <div className="max-w-[1400px] mx-auto space-y-6">

            {/* Encabezado Principal */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 rounded-xl">
                    <BarChart3 className="size-5" />
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                    Resultados y métricas ejecutivas
                  </h1>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Tablero de control institucional con indicadores en tiempo real de Supabase.
                </p>
              </div>

              {/* Botones de acción y filtros */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl flex items-center text-xs font-bold text-slate-600 dark:text-slate-300">
                  <button
                    onClick={() => setFiltroPeriodo('todo')}
                    className={`px-3 py-1.5 rounded-xl transition ${filtroPeriodo === 'todo' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900'}`}
                  >
                    Histórico
                  </button>
                  <button
                    onClick={() => setFiltroPeriodo('6m')}
                    className={`px-3 py-1.5 rounded-xl transition ${filtroPeriodo === '6m' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900'}`}
                  >
                    Últimos 6 meses
                  </button>
                  <button
                    onClick={() => setFiltroPeriodo('30d')}
                    className={`px-3 py-1.5 rounded-xl transition ${filtroPeriodo === '30d' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'hover:text-slate-900'}`}
                  >
                    30 días
                  </button>
                </div>

                <button
                  type="button"
                  onClick={cargarResultados}
                  disabled={cargando}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl text-xs font-bold shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`size-3.5 ${cargando ? 'animate-spin' : ''}`} />
                  <span>Actualizar métricas</span>
                </button>
              </div>
            </div>

            {errorMensaje && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 px-5 py-3 rounded-2xl text-xs font-bold">
                {errorMensaje}
              </div>
            )}

            {/* SECCIÓN 1: TRES BLOQUES PRINCIPALES SUPERIORES (LAYOUT DEL MOCKUP) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              
              {/* Columna 1 (Izquierda): KPI Principal + Semicírculo Gauge */}
              <div className="lg:col-span-3 flex flex-col gap-5">
                {/* Tarjeta Alumnos Totales */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Alumnos matriculados
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Base histórica consolidada
                    </p>
                  </div>
                  <div className="my-4">
                    <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                      {cargando ? '...' : (kpis?.totalAlumnos ?? 0).toLocaleString('es-PE')}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-500">Recaudación acumulada</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 tabular-nums font-bold">
                      S/ {cargando ? '...' : (kpis?.totalRecaudado ?? 0).toLocaleString('es-PE')}
                    </strong>
                  </div>
                </div>

                {/* Tarjeta Semicírculo Gauge Alumnos al Día */}
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Alumnos al día
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Sin deuda ni morosidad activa
                    </p>
                  </div>

                  {renderGaugeArco(
                    kpis?.tasaAlumnosAlDia ?? 0,
                    kpis?.totalAlumnos ?? 0,
                    kpis?.alumnosAlDia ?? 0
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                    <span>Con saldo pendiente:</span>
                    <strong className="text-amber-600 dark:text-amber-400 tabular-nums">
                      {kpis?.alumnosConDeuda ?? 0}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Columna 2 (Centro): Gráfico de Barras Apiladas por Diplomado */}
              <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Actividad por diplomado
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                        Distribución de alumnos al día vs. con saldo pendiente
                      </p>
                    </div>

                    {/* Leyenda del gráfico */}
                    <div className="flex items-center gap-3 text-[11px] font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-cyan-500" />
                        <span className="text-slate-600 dark:text-slate-300">Al día</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="size-2.5 rounded-full bg-slate-700" />
                        <span className="text-slate-600 dark:text-slate-300">Con saldo</span>
                      </div>
                    </div>
                  </div>

                  {/* Barras verticales apiladas */}
                  <div className="pt-6 pb-2">
                    <div className="h-48 flex items-end justify-between gap-3 px-2">
                      {diplomados.map((d, idx) => {
                        const alturaMax = 180;
                        const alturaTotal = Math.max(30, Math.round((d.total / maxTotalDiplomados) * alturaMax));
                        const pctAlDia = d.total > 0 ? (d.alDia / d.total) : 0;
                        const altAlDia = Math.round(alturaTotal * pctAlDia);
                        const altSaldo = alturaTotal - altAlDia;

                        return (
                          <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                            {/* Tooltip con datos */}
                            <div className="absolute -top-12 hidden group-hover:flex flex-col bg-slate-900 text-white text-[10px] p-2 rounded-xl shadow-lg pointer-events-none z-30 whitespace-nowrap">
                              <span className="font-bold">{d.nombre}</span>
                              <span className="text-cyan-300">Al día: {d.alDia}</span>
                              <span className="text-slate-300">Con saldo: {d.conSaldo}</span>
                              <span className="text-slate-400">Total: {d.total}</span>
                            </div>

                            {/* Columna apilada */}
                            <div className="w-full max-w-[48px] flex flex-col rounded-t-xl overflow-hidden shadow-xs transition-all duration-500 ease-out hover:opacity-90">
                              {/* Segmento superior: Con saldo */}
                              <div
                                style={{ height: `${altSaldo}px` }}
                                className="bg-slate-700 flex items-center justify-center text-[10px] text-white font-bold tabular-nums"
                              >
                                {d.conSaldo > 0 && d.conSaldo}
                              </div>
                              {/* Segmento inferior: Al día */}
                              <div
                                style={{ height: `${altAlDia}px` }}
                                className="bg-cyan-500 flex items-center justify-center text-[10px] text-white font-bold tabular-nums"
                              >
                                {d.alDia > 0 && d.alDia}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Etiquetas en eje X */}
                    <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-3 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                      {diplomados.map((d, idx) => (
                        <div key={idx} className="flex-1 text-center px-1 truncate" title={d.nombre}>
                          {d.nombre}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs text-slate-400">
                  <span>Diplomados con mayor demanda</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">Top 5 programas</span>
                </div>
              </div>

              {/* Columna 3 (Derecha): Gráfico Circular de Paquetes */}
              <div className="lg:col-span-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Distribución por paquete
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                    Participación porcentual de la oferta académica
                  </p>
                </div>

                <div className="my-4">
                  {renderDonutChart(paquetes)}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                  <span>Modalidad principal</span>
                  <strong className="text-cyan-600 dark:text-cyan-400 font-bold">
                    {paquetes[0]?.paquete || 'COMPLETO'} ({paquetes[0]?.porcentaje || 0}%)
                  </strong>
                </div>
              </div>

            </div>

            {/* SECCIÓN 2: KPIs HORIZONTALES CON FLECHAS DE VARIACIÓN */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Tarjeta 1: Tasa de Cobranza */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tasa de cobranza
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Recaudado sobre facturado</p>
                </div>
                <div className="flex items-center justify-between my-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {kpis?.tasaCobranza ?? 0}%
                  </span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                    <TrendingUp className="size-5" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">62% efectividad neta</span>
              </div>

              {/* Tarjeta 2: Retención Activa */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Retención activa
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Alumnos sin bloqueo</p>
                </div>
                <div className="flex items-center justify-between my-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {kpis?.tasaRetencion ?? 100}%
                  </span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                    <TrendingUp className="size-5" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">Continuidad estudiantil</span>
              </div>

              {/* Tarjeta 3: Nuevos Alumnos Promedio */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between text-center items-center">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Ritmo de matrícula
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Nuevos alumnos por mes</p>
                </div>
                <div className="my-1 flex items-center justify-center gap-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {kpis?.promedioNuevosAlumnosMes ?? 0}
                  </span>
                  <div className="p-2 bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 rounded-xl">
                    <Users className="size-5" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-500">Promedio histórico mensual</span>
              </div>

              {/* Tarjeta 4: Tasa de Morosidad */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Tasa de morosidad
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Cuotas vencidas</p>
                </div>
                <div className="flex items-center justify-between my-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {kpis?.tasaMorosidad ?? 0}%
                  </span>
                  <div className="p-2 bg-amber-50 dark:bg-amber-950/60 text-amber-600 rounded-xl">
                    <TrendingDown className="size-5" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-amber-600">Sujeto a plan de pagos</span>
              </div>

              {/* Tarjeta 5: Aprobación Académica */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Aprobación académica
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Notas mayores a 14 pts</p>
                </div>
                <div className="flex items-center justify-between my-2">
                  <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                    {kpis?.tasaAprobacion ?? 0}%
                  </span>
                  <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                    <TrendingUp className="size-5" />
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-600">Rendimiento en evaluaciones</span>
              </div>

            </div>

            {/* SECCIÓN 3: FILA INFERIOR CON SERIES TEMPORALES Y DEFINICIONES (LAYOUT DEL MOCKUP) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              
              {/* Mini gráfico 1: Inscripciones por mes */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Inscripciones por mes
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Evolución semestral</p>
                </div>
                {renderMiniBars(meses.map(m => ({ label: m.label, valor: m.inscripciones })), '#06b6d4')}
              </div>

              {/* Mini gráfico 2: Recaudación por mes */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Recaudación mensual (S/)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Ingresos en caja</p>
                </div>
                {renderMiniBars(meses.map(m => ({ label: m.label, valor: m.recaudacion })), '#0f766e', ' S/')}
              </div>

              {/* Tarjeta 3: Definiciones / Glosario Institucional */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 pb-2 border-b border-slate-100 dark:border-slate-800">
                  <Info className="size-3.5 text-cyan-600" />
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Definiciones
                  </h4>
                </div>
                <div className="space-y-2 text-[10px] leading-tight">
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold block">Al día:</strong>
                    <span className="text-slate-500">Estudiantes con calendario financiero sin mora.</span>
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold block">Con saldo:</strong>
                    <span className="text-slate-500">Contratos de crédito con cuotas futuras.</span>
                  </div>
                  <div>
                    <strong className="text-slate-900 dark:text-white font-bold block">Retención:</strong>
                    <span className="text-slate-500">Alumnos sin bloqueo administrativo.</span>
                  </div>
                </div>
              </div>

              {/* Mini gráfico 4: Evaluaciones rendidas */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Evaluaciones rendidas
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Intentos calificados</p>
                </div>
                {renderMiniBars(meses.map(m => ({ label: m.label, valor: m.aprobados })), '#06b6d4')}
              </div>

              {/* Mini gráfico 5: Efectividad por cuota */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Cartera en cobranza
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">Saldo capital pendiente</p>
                </div>
                <div className="my-2">
                  <span className="text-xl font-black text-amber-600 dark:text-amber-400 tabular-nums">
                    S/ {(kpis?.totalDeudaPendiente ?? 0).toLocaleString('es-PE')}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Por liquidar en cuotas programadas</p>
                </div>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-[10px] text-slate-400">
                  <span>Facturación total</span>
                  <strong className="text-slate-700 dark:text-slate-300 tabular-nums font-bold">
                    S/ {((kpis?.totalRecaudado ?? 0) + (kpis?.totalDeudaPendiente ?? 0)).toLocaleString('es-PE')}
                  </strong>
                </div>
              </div>

            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
