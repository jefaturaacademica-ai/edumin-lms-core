import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BookOpenCheck,
  GraduationCap,
  Rocket,
  Sparkles,
  Briefcase,
  Wallet,
  CalendarDays,
  CheckCircle2,
  Play,
  Award,
  Lock,
  AlertCircle,
  PhoneCall,
  ShoppingBag
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateEduminCredits, derivePaymentStateForCredits } from "@/lib/utils/credits";
import { formatearFechaVisual, resolverFechaVencimiento, evaluarEstadoDeuda } from "@/lib/utils/fechasCuotas";
import { getDiplomadoByTitleOrSlug } from "@/lib/data/diplomadosData";
import {
  parseDiplomadosFromProfile,
  parseCursosFromProfile,
  parseCuposCreditosFromProfile,
  filtrarCursosReales
} from "@/lib/utils/profileParser";
import { obtenerTallerParaDiplomado } from "@/lib/utils/tallerAsignado";
import { obtenerConfiguracionPaquetes } from "@/lib/services/paquetesService";
import { obtenerConfiguracionBienvenida } from "@/lib/services/bienvenidaService";
import Link from "next/link";

export const metadata = {
  title: "Inicio",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = createAdminClient();

  // Intentar obtener perfil con cliente admin usando select("*") para garantizar todas las columnas sin fallar por nombres inexistentes
  let { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  // Fallback si la búsqueda por ID no retornara resultados (ej: por email o DNI)
  if (!profile && user.email) {
    const { data: profileByEmail } = await admin
      .from("profiles")
      .select("*")
      .eq("email", user.email)
      .maybeSingle();
    profile = profileByEmail;
  }

  // Si aún no se encuentra, buscar por DNI en user_metadata si existiese
  if (!profile && user.user_metadata?.dni_ce) {
    const { data: profileByDni } = await admin
      .from("profiles")
      .select("*")
      .eq("dni_ce", String(user.user_metadata.dni_ce))
      .maybeSingle();
    profile = profileByDni;
  }

  const safeProfile = profile || {
    id: user.id,
    role: 'ESTUDIANTE',
    nombres: user.user_metadata?.nombres || 'Estudiante',
    apellidos: user.user_metadata?.apellidos || '',
    dni_ce: user.user_metadata?.dni_ce || 'Sin DNI',
    email: user.email || '',
    paquete_adquirido: 'FULL',
    cuotas_pagadas: 1,
    cupos_creditos: {
      diplomados: { asignados: 1, adicionales: 0, canjeados: 0 },
      cursos: { asignados: 5, adicionales: 0, canjeados: 0 },
      compras_directas: []
    },
    diplomados: null,
    cursos: null,
    diplomado_1: 'DERECHO MINERO',
    diplomado_2: null
  };

  // Cargar configuraciones del sistema
  const [paquetesConfig, bienvenidaConfig] = await Promise.all([
    obtenerConfiguracionPaquetes(),
    obtenerConfiguracionBienvenida()
  ]);

  const paqueteKey = (safeProfile.paquete_adquirido || 'FULL').toUpperCase();
  const configPaqueteActual = paquetesConfig[paqueteKey] || paquetesConfig['FULL'];

  // Obtener Diplomado principal real
  const parsedDips = parseDiplomadosFromProfile(safeProfile);
  const targetDip = parsedDips[0];
  const diplomadoNombre = targetDip?.titulo || (typeof safeProfile.diplomado_1 === 'string' && !safeProfile.diplomado_1.startsWith('DIPLOMADOS_LIST|') ? safeProfile.diplomado_1 : 'DERECHO MINERO');
  const diplomadoPrincipal = getDiplomadoByTitleOrSlug(diplomadoNombre);
  const avanceEstudiante = targetDip?.avance ?? 0;

  // Obtener Curso oficial real del estudiante
  const parsedCursos = parseCursosFromProfile(safeProfile);
  let cursoPrincipal: { titulo: string; sesionTexto?: string; avance: number; link: string } = {
    titulo: '',
    avance: 0,
    link: '/dashboard/cursos'
  };

  if (parsedCursos.length > 0) {
    const c = parsedCursos[0];
    cursoPrincipal = {
      titulo: c.titulo,
      avance: Number(c.avance || 0),
      link: `/dashboard/cursos/${c.id || c.codigo || 'cur-01'}`
    };
  } else {
    // Si no tiene cursos asignados aún, el taller oficial asignado según su diplomado
    const tallerOficial = obtenerTallerParaDiplomado(diplomadoNombre);
    cursoPrincipal = {
      titulo: tallerOficial.titulo,
      avance: 0,
      link: `/dashboard/cursos/${tallerOficial.id}`
    };
  }

  // Consultar pagos reales del estudiante en Supabase para el widget de Estado de Cuenta y créditos
  let pagosReales: any[] = [];
  try {
    const filterConditions: string[] = [`profile_id.eq.${safeProfile.id}`];
    if (safeProfile.dni_ce && safeProfile.dni_ce !== 'Sin DNI') {
      filterConditions.push(`dni_ce.eq.${safeProfile.dni_ce}`);
      filterConditions.push(`metodo.ilike.%${safeProfile.dni_ce}%`);
    }
    const { data: pData } = await admin
      .from('pagos')
      .select('*')
      .or(filterConditions.join(','))
      .order('created_at', { ascending: true });
    pagosReales = pData || [];
  } catch (err) {
    console.error('Error obteniendo pagos:', err);
  }

  // Evaluación estricta de deuda y cuotas vencidas
  const estadoDeuda = evaluarEstadoDeuda(safeProfile, pagosReales);
  const tieneDeudaVencida = estadoDeuda.tieneDeudaVencida;

  // Cálculos de Créditos EDUMIN centralizados con `profiles.cupos_creditos` y estado real de pagos
  const cupos = parseCuposCreditosFromProfile(safeProfile);
  const paymentState = derivePaymentStateForCredits({
    pagos: pagosReales,
    profile: safeProfile,
  });

  const eduminCredits = calculateEduminCredits({
    paqueteAdquirido: safeProfile.paquete_adquirido || 'FULL',
    cuotasPagadas: paymentState.cuotasPagadas,
    cuotasTotales: paymentState.cuotasTotales,
    tipoPago: paymentState.tipoPago,
    diplomadosConsumidos: cupos.diplomados.canjeados,
    cursosConsumidos: filtrarCursosReales(parsedCursos).length,
    creditosExtraDiplomados: cupos.diplomados.adicionales,
    creditosExtraCursos: cupos.cursos.adicionales,
  });

  // Motor Financiero Dinámico
  const esContado = 
    safeProfile.tipo_pago === 'CONTADO' ||
    String(safeProfile.paquete_adquirido || '').toUpperCase().includes('CONTADO');

  let totalCuotas = configPaqueteActual?.cuotasSugeridas || (paqueteKey === 'ILIMITADO' ? 5 : 3);
  const precioBasePaquete = Number(safeProfile.monto_total || 0) > 0 
    ? Number(safeProfile.monto_total)
    : (configPaqueteActual?.precioContado || (paqueteKey === 'ILIMITADO' ? 1500 : paqueteKey === 'COMPLETO' ? 540 : 900));
  let costoTotal = precioBasePaquete;

  let montoPagado = 0;
  let saldoPendiente = costoTotal;
  let proximaFechaVencimiento: string | null = null;

  if (pagosReales.length > 0) {
    let totalAcumuladoPagado = 0;
    let totalAcumuladoDeuda = 0;
    let totalAcumuladoPlan = 0;
    let tieneDeudaExplicit = false;

    pagosReales.forEach((p) => {
      if (p.is_cargo_extra) return;

      let pagadoFila = 0;
      let deudaFila = 0;
      let cuotasArray: string[] = [p.cuota_01, p.cuota_02, p.cuota_03, p.cuota_04, p.cuota_05, p.cuota_06];
      let fechasVencimientoFila: string[] | null = null;
      let planCuotasArray: string[] | null = null;

      if (typeof p.metodo === 'string' && p.metodo.startsWith('CREDITO_')) {
        try {
          const jsonStr = p.metodo.substring(p.metodo.indexOf('|') + 1).trim();
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed.cuotas)) {
            cuotasArray = parsed.cuotas;
          }
          if (Array.isArray(parsed.plan_cuotas)) {
            planCuotasArray = parsed.plan_cuotas;
          }
          if (Array.isArray(parsed.fechas_vencimiento)) {
            fechasVencimientoFila = parsed.fechas_vencimiento;
          }
          if (parsed.total_pagado !== undefined) {
            pagadoFila = Number(parsed.total_pagado) || 0;
          }
          if (parsed.total_deuda !== undefined) {
            deudaFila = Number(parsed.total_deuda) || 0;
            tieneDeudaExplicit = true;
          }
        } catch {
          // ignore
        }
      }

      const cuotasValidas = cuotasArray.filter(v => v !== 'no corresponde');
      if (cuotasValidas.length > 0) {
        totalCuotas = cuotasValidas.length;
      }

      if (pagadoFila === 0) {
        pagadoFila = cuotasArray.reduce((acc, c) => {
          return c && c !== 'no corresponde' ? acc + (Number(c) || 0) : acc;
        }, 0);
      }

      if (pagadoFila === 0 && (p.estado === 'Pagado' || p.estado === 'APROBADO' || p.estado === 'Completado')) {
        pagadoFila = Number(p.monto) || 0;
      }

      // Determinar el monto total del plan contratado real de esta fila de pago
      let planFila = Number(p.monto) || 0;
      if (planCuotasArray && Array.isArray(planCuotasArray)) {
        const sumPlan = planCuotasArray.filter(c => c !== 'no corresponde').reduce((acc, c) => acc + (Number(c) || 0), 0);
        if (sumPlan > 0) planFila = sumPlan;
      }
      if (planFila === 0 && cuotasValidas.length > 0 && cuotasValidas.some(c => Number(c) > 0)) {
        const sumValidas = cuotasValidas.reduce((acc, c) => acc + (Number(c) || 0), 0);
        if (sumValidas > pagadoFila) planFila = sumValidas;
      }
      if (planFila === 0) {
        planFila = pagadoFila + (deudaFila || 0);
      }

      if (!tieneDeudaExplicit) {
        if (planFila > 0) {
          deudaFila = Math.max(0, planFila - pagadoFila);
        } else {
          const cuotaMontoUnitario = precioBasePaquete / Math.max(1, totalCuotas);
          const pendientesFila = cuotasValidas.filter(v => Number(v) === 0).length;
          deudaFila = pendientesFila * cuotaMontoUnitario;
        }
      }

      totalAcumuladoPagado += pagadoFila;
      totalAcumuladoDeuda += deudaFila;
      totalAcumuladoPlan += (planFila > 0 ? planFila : (pagadoFila + deudaFila));

      // Buscar la primera cuota pendiente para su fecha de vencimiento real
      if (!proximaFechaVencimiento && (deudaFila > 0 || cuotasArray.some(v => v !== 'no corresponde' && Number(v) === 0))) {
        const primerPendienteIdx = cuotasArray.findIndex(v => v !== 'no corresponde' && Number(v) === 0);
        if (primerPendienteIdx !== -1) {
          proximaFechaVencimiento = resolverFechaVencimiento(
            primerPendienteIdx,
            fechasVencimientoFila,
            p.created_at || safeProfile.created_at
          );
        }
      }
    });

    if (totalAcumuladoPlan > 0) {
      costoTotal = totalAcumuladoPlan;
    }
    montoPagado = esContado ? costoTotal : totalAcumuladoPagado;
    saldoPendiente = esContado ? 0 : (tieneDeudaExplicit ? totalAcumuladoDeuda : Math.max(0, costoTotal - montoPagado));
  } else {
    // Estimación con base en cuotas_pagadas de su perfil
    const cuotaMonto = totalCuotas > 0 ? costoTotal / totalCuotas : 0;
    const cuotasEfectivas = esContado ? totalCuotas : Math.min(safeProfile.cuotas_pagadas || 0, totalCuotas);
    montoPagado = esContado ? costoTotal : cuotasEfectivas * cuotaMonto;
    saldoPendiente = esContado ? 0 : Math.max(0, costoTotal - montoPagado);
  }

  // Si tiene cuotas pendientes registradas en estadoDeuda, asegurar que saldoPendiente refleje la deuda real
  if (!esContado && estadoDeuda.cuotasPendientesCount > 0 && saldoPendiente <= 0) {
    const valorCuotaAprox = costoTotal / Math.max(1, totalCuotas);
    saldoPendiente = estadoDeuda.cuotasPendientesCount * valorCuotaAprox;
  }

  // Deuda saldada real: solo si el paquete está 100% completado (sin cuotas pendientes ni deuda vencida)
  const deudaSaldada = 
    estadoDeuda.esCompletado || 
    (esContado && !tieneDeudaVencida) || 
    (saldoPendiente <= 0 && estadoDeuda.cuotasPendientesCount === 0);

  // Si no se encontró fecha en pagos pero aún hay saldo pendiente
  const proximaFechaCalculada = estadoDeuda.proximaFechaPorVencer || proximaFechaVencimiento;
  if (!proximaFechaCalculada && !deudaSaldada) {
    const idxPendiente = paymentState.cuotasPagadas;
    proximaFechaVencimiento = resolverFechaVencimiento(
      idxPendiente,
      null,
      safeProfile.created_at || new Date().toISOString()
    );
  } else if (proximaFechaCalculada) {
    proximaFechaVencimiento = proximaFechaCalculada;
  }

  let stringFechaPago = '';
  if (proximaFechaVencimiento) {
    stringFechaPago = formatearFechaVisual(proximaFechaVencimiento);
  } else {
    const fechaProximoPago = new Date();
    fechaProximoPago.setDate(15);
    fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
    stringFechaPago = fechaProximoPago.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  // Extracción estricta del PRIMER NOMBRE del alumno
  let primerNombre = 'Estudiante';
  if (safeProfile.nombres && safeProfile.nombres.trim()) {
    // Si contiene nombre real, tomar la primera palabra limpia
    const parts = safeProfile.nombres.trim().split(/\s+/);
    if (parts[0]) {
      const clean = parts[0].replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ]/g, '');
      if (clean.length > 1) {
        primerNombre = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
      }
    }
  }

  // Beneficios de bolsa de trabajo y portal según configuración de paquete
  const bolsaTrabajoRegularHabilitada = configPaqueteActual?.bolsaTrabajoRegular !== false;
  const bolsaTrabajoExclusivaHabilitada = Boolean(configPaqueteActual?.bolsaTrabajoExclusiva);
  const dreambuilderHabilitado = configPaqueteActual?.dreambuilder !== false;

  const dreambuilderUrl = process.env.NEXT_PUBLIC_DREAMBUILDER_URL ?? "https://dreambuilder.com";
  const bolsaRegularUrl = process.env.NEXT_PUBLIC_BOLSA_REGULAR_URL ?? "https://chat.whatsapp.com/edumin-bolsa-regular";
  const bolsaExclusivaUrl = process.env.NEXT_PUBLIC_BOLSA_TRABAJO_URL ?? "https://chat.whatsapp.com/edumin-bolsa-exclusiva";

  const nombreEstudianteCompleto = [safeProfile.nombres, safeProfile.apellidos].filter(Boolean).join(" ") || "estudiante";
  const whatsappComprarCreditosUrl = `https://wa.me/51980694497?text=${encodeURIComponent(
    `Hola EDUMIN, soy ${nombreEstudianteCompleto}${safeProfile.dni_ce ? ` (DNI: ${safeProfile.dni_ce})` : ''}. Ya he utilizado todos mis créditos en el aula virtual y deseo adquirir más Créditos EDUMIN para seguir especializándome. ¿Me podrían indicar los paquetes, costos y promociones disponibles?`
  )}`;

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 transition-colors duration-150">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden px-6 py-12 sm:px-10 lg:px-16 lg:py-16 border-b border-slate-800 bg-slate-950">
        <div 
          className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat opacity-100"
          style={{ backgroundImage: `url('${bienvenidaConfig.imagenFondo || 'https://img.magnific.com/foto-gratis/retrato-ingenieros-horas-trabajo-sitio-trabajo_23-2151589536.jpg?semt=ais_hybrid&w=740&q=80'}')` }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/50 to-slate-950/90" />

        <div className="mx-auto max-w-6xl">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md [text-wrap:balance]">
              ¡Hola, <span className="text-indigo-400 font-black">{primerNombre}</span>, bienvenid@ a tu ruta de aprendizaje!
            </h1>
          </div>
        </div>
      </section>

      {/* Banner de alerta si tiene cuotas vencidas */}
      {tieneDeudaVencida && (
        <section className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 pt-8 -mb-4">
          <div className="rounded-3xl p-6 bg-gradient-to-r from-red-950 via-rose-950 to-slate-950 border border-red-500/40 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <Lock className="size-3" /> Acceso restringido por cuota vencida
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                Atención: Regulariza tu pago pendiente para desbloquear tu campus
              </h2>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                Registras una cuota vencida{estadoDeuda.primeraFechaVencida ? ` (${formatearFechaVisual(estadoDeuda.primeraFechaVencida)})` : ''}. El acceso a tus diplomados, cursos y certificaciones ha sido pausado. Dirígete a Mis Pagos para regularizar tu situación financiera.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <Link
                href="/dashboard/pagos?bloqueado=deuda"
                className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Wallet className="size-4" /> Ir a Mis pagos
              </Link>
              <a
                href="https://wa.me/51980694497?text=Hola%20EDUMIN,%20deseo%20regularizar%20mi%20cuota%20vencida"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white/10 hover:bg-white/20 text-white font-bold text-xs px-4 py-2.5 rounded-xl border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneCall className="size-4" /> Coordinar por WhatsApp
              </a>
            </div>
          </div>
        </section>
      )}

      {/* SECCIÓN 1 (PRIMERA): PROGRESO ACADÉMICO */}
      <section className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 pt-10">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="mb-6">
            <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-1">
              Progreso Académico
            </span>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Continuar donde te quedaste
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tarjeta de Mis Diplomados */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-indigo-600 text-white grid place-items-center shrink-0 shadow-sm">
                  <Award className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block mb-0.5">
                    Mis diplomados
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5 line-clamp-2 [text-wrap:balance]">
                    {diplomadoPrincipal.titulo}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                    {diplomadoPrincipal.modulos[0] ? `${diplomadoPrincipal.modulos[0].codigo}: ${diplomadoPrincipal.modulos[0].nombre}` : 'MÓDULO 01'}
                  </p>
                </div>
              </div>

              {/* Barra de Avance */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Avance</span>
                  <span className="text-indigo-600 dark:text-indigo-400">{avanceEstudiante}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${avanceEstudiante}%` }} />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <Link 
                  href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : "/dashboard/diplomados"}
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  Ver mis Diplomados <ArrowUpRight className="size-3.5" />
                </Link>

                <Link 
                  href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : `/dashboard/reproductor?slug=${diplomadoPrincipal.slug}`}
                  className="inline-flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-sm transition"
                >
                  <span className="grid size-5 place-items-center rounded-full bg-white text-indigo-600">
                    <Play className="size-3 fill-indigo-600 ml-0.5" />
                  </span>
                  Reanudar clase
                </Link>
              </div>
            </div>

            {/* Tarjeta de Mis Cursos */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0 shadow-sm">
                  <BookOpenCheck className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-0.5">
                    Mis cursos
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5 line-clamp-2 [text-wrap:balance]">
                    {cursoPrincipal.titulo}
                  </h3>
                </div>
              </div>

              {/* Barra de Avance */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Avance</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{cursoPrincipal.avance}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: `${cursoPrincipal.avance}%` }} />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between gap-2">
                <Link 
                  href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : "/dashboard/cursos"}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  Ver mis Cursos <ArrowUpRight className="size-3.5" />
                </Link>

                <Link 
                  href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : cursoPrincipal.link}
                  className="inline-flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-sm transition"
                >
                  <span className="grid size-5 place-items-center rounded-full bg-white text-emerald-600">
                    <Play className="size-3 fill-emerald-600 ml-0.5" />
                  </span>
                  Continuar curso
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SECCIÓN 2 (SEGUNDA): CRÉDITOS Y ESTADO DE CUENTA */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:px-10 lg:grid-cols-3 lg:px-16">
        
        {/* Widget 1: Créditos EDUMIN disponibles */}
        <article className="relative rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-500/40 transition">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="grid size-10 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                <BookOpenCheck className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Créditos EDUMIN</h3>
            </div>

            <div className="mb-4">
              <h2 className="text-5xl font-black tracking-tight text-slate-900 dark:text-white">
                {eduminCredits.total.disponibles}
              </h2>
            </div>

            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Diplomados pendientes:</span>
                <strong className="font-bold text-slate-900 dark:text-white">
                  {eduminCredits.diplomados.disponibles} cupo(s)
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                <span>Cursos libres pendientes:</span>
                <strong className="font-bold text-slate-900 dark:text-white">
                  {eduminCredits.cursos.disponibles} cupo(s)
                </strong>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
              {eduminCredits.total.liberados} liberados por pagos · {eduminCredits.total.consumidos} canjeados
            </p>

            {eduminCredits.total.disponibles === 0 && (
              <div className="mt-3.5 flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 p-2.5 text-[11px] text-amber-800 dark:text-amber-300 font-medium">
                <Sparkles className="size-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>¡Has canjeado todos tus créditos! Adquiere más para seguir aprendiendo.</span>
              </div>
            )}
          </div>

          {eduminCredits.total.disponibles > 0 ? (
            <Link
              href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : "/dashboard/canjear"}
              className="mt-6 inline-flex h-11 w-full justify-center items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 text-xs font-bold transition shadow-sm shadow-indigo-600/20"
            >
              <Sparkles className="size-4 " /> Canjear mis cursos y diplomados
            </Link>
          ) : (
            <div className="mt-5 space-y-2">
              <a
                href={whatsappComprarCreditosUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-11 w-full justify-center items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-xs font-bold transition shadow-sm shadow-emerald-600/20 cursor-pointer"
              >
                <ShoppingBag className="size-4" /> Comprar más créditos
              </a>
              <Link
                href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : "/dashboard/canjear"}
                className="inline-flex h-9 w-full justify-center items-center gap-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-3 text-xs font-semibold transition"
              >
                Ver mis créditos canjeados
              </Link>
            </div>
          )}
        </article>

        {/* Widget 2: Estado Financiero */}
        <article className="relative rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-500/40 transition">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
                <Wallet className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Estado de cuenta</h3>
            </div>
            
            <div className="space-y-3.5">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Monto total</span>
                <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white">S/ {costoTotal}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-2.5">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total pagado</span>
                <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">S/ {montoPagado}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500 dark:text-slate-400">Saldo pendiente</span>
                <span className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">S/ {saldoPendiente}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {tieneDeudaVencida ? (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-xl text-xs font-bold border border-red-200 dark:border-red-800/50">
                <AlertCircle className="size-4 shrink-0 text-red-600 dark:text-red-400" />
                <span>Cuota vencida ({estadoDeuda.primeraFechaVencida ? formatearFechaVisual(estadoDeuda.primeraFechaVencida) : 'Pendiente'}) - Acceso bloqueado</span>
              </div>
            ) : deudaSaldada ? (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-semibold border border-emerald-200 dark:border-emerald-800/50">
                <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>Deuda 100% cancelada · ¡Programa pagado!</span>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-4 py-2.5 rounded-xl text-xs font-medium border border-amber-200 dark:border-amber-800/50">
                <CalendarDays className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <span>Próximo pago: <strong>{stringFechaPago}</strong></span>
              </div>
            )}

            <Link
              href="/dashboard/pagos"
              className="inline-flex h-11 w-full justify-center items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 text-xs font-bold transition shadow-sm border border-slate-800 dark:border-slate-700"
            >
              Ver mis pagos <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </article>

        {/* Widget 3: Bolsa de Trabajo y Certificados del Estudiante */}
        <div className="flex flex-col gap-4 sm:gap-5">
          
          {/* Tarjeta Acceso Directo a Mis Certificados */}
          <article className="relative flex-1 rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col justify-between hover:border-indigo-300 dark:hover:border-indigo-500/40 transition">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="grid size-10 place-items-center rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50 shrink-0">
                  <Award className="size-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Mis certificados
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Descarga tus diplomas generales, certificados modulares y acreditaciones oficiales con QR.
              </p>
            </div>
            <Link
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 text-xs shadow-sm shadow-indigo-600/20 transition"
              href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : "/dashboard/certificados"}
            >
              Ver mis certificados <ArrowUpRight className="size-4" />
            </Link>
          </article>

          {/* Tarjeta de Bolsas de Trabajo (Regular y Exclusiva) */}
          <article className="relative flex-1 rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col justify-between hover:border-emerald-300 dark:hover:border-emerald-500/40 transition">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50 shrink-0">
                  <Briefcase className="size-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Bolsa de trabajo
                </h3>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Accede a convocatorias y vacantes laborales activas en minería e industria.
              </p>
            </div>

            <div className="mt-4 space-y-2">
              {/* Botón 1: Bolsa de Trabajo Regular */}
              {bolsaTrabajoRegularHabilitada ? (
                <a
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-xs font-bold transition shadow-sm shadow-emerald-600/20"
                  href={bolsaRegularUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Bolsa de trabajo regular <ArrowUpRight className="size-4" />
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600/90 text-white px-4 text-xs font-bold shadow-sm cursor-not-allowed select-none opacity-80"
                >
                  Bolsa de trabajo regular <ArrowUpRight className="size-4" />
                </button>
              )}

              {/* Botón 2: Bolsa de Trabajo Exclusiva */}
              {bolsaTrabajoExclusivaHabilitada ? (
                <a
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-xs font-bold transition shadow-sm shadow-emerald-600/20"
                  href={bolsaExclusivaUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Bolsa de trabajo exclusiva <ArrowUpRight className="size-4" />
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600/90 text-white px-4 text-xs font-bold shadow-sm cursor-not-allowed select-none opacity-80"
                >
                  Bolsa de trabajo exclusiva <ArrowUpRight className="size-4" />
                </button>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
