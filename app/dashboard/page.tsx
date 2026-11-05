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
  Lock
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { calculateEduminCredits } from "@/lib/utils/credits";
import { getDiplomadoByTitleOrSlug } from "@/lib/data/diplomadosData";
import { parseDiplomadosFromProfile, parseCursosFromProfile } from "@/lib/utils/profileParser";
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
    cupos_diplomados: 0,
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

  // Cálculos de Créditos EDUMIN centralizados
  const eduminCredits = calculateEduminCredits({
    paqueteAdquirido: safeProfile.paquete_adquirido || 'FULL',
    cuotasPagadas: safeProfile.cuotas_pagadas || 1,
    cuotasTotales: safeProfile.cuotas_totales || (safeProfile.paquete_adquirido === 'ILIMITADO' ? 5 : 3),
    tipoPago: safeProfile.tipo_pago || 'CUOTAS',
    diplomadosConsumidos: safeProfile.cupos_diplomados || Math.max(1, parsedDips.length),
    cursosConsumidos: safeProfile.cupos_cursos || parsedCursos.length
  });

  // Consultar pagos reales del estudiante en Supabase para el widget de Estado de Cuenta
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

  // Motor Financiero Dinámico
  let costoTotal = configPaqueteActual?.precioContado || 900;
  let totalCuotas = configPaqueteActual?.cuotasSugeridas || 3;
  if (safeProfile.paquete_adquirido === 'COMPLETO') {
    costoTotal = configPaqueteActual?.precioContado || 540;
    totalCuotas = 3;
  } else if (safeProfile.paquete_adquirido === 'FULL') {
    costoTotal = configPaqueteActual?.precioContado || 900;
    totalCuotas = 3;
  } else if (safeProfile.paquete_adquirido === 'ILIMITADO') {
    costoTotal = configPaqueteActual?.precioContado || 1500;
    totalCuotas = 5;
  }

  let montoPagado = 0;
  let saldoPendiente = costoTotal;
  let deudaSaldada = false;

  if (pagosReales.length > 0) {
    let totalAcumuladoPagado = 0;
    let totalAcumuladoDeuda = 0;
    let tieneDeudaExplicit = false;

    pagosReales.forEach((p) => {
      let pagadoFila = 0;
      let deudaFila = 0;
      let cuotasArray: string[] = [p.cuota_01, p.cuota_02, p.cuota_03, p.cuota_04, p.cuota_05, p.cuota_06];

      if (typeof p.metodo === 'string' && p.metodo.startsWith('CREDITO_')) {
        try {
          const jsonStr = p.metodo.substring(p.metodo.indexOf('|') + 1).trim();
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed.cuotas)) {
            cuotasArray = parsed.cuotas;
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

      if (pagadoFila === 0) {
        pagadoFila = cuotasArray.reduce((acc, c) => {
          return c && c !== 'no corresponde' ? acc + (Number(c) || 0) : acc;
        }, 0);
      }

      if (pagadoFila === 0 && (p.estado === 'Pagado' || p.estado === 'APROBADO' || p.estado === 'Completado')) {
        pagadoFila = Number(p.monto) || 0;
      }

      totalAcumuladoPagado += pagadoFila;

      if (!tieneDeudaExplicit) {
        const montoBase = Number(p.monto) || costoTotal;
        deudaFila = Math.max(0, montoBase - pagadoFila);
      }
      totalAcumuladoDeuda += deudaFila;
    });

    montoPagado = totalAcumuladoPagado;
    saldoPendiente = tieneDeudaExplicit ? totalAcumuladoDeuda : Math.max(0, costoTotal - montoPagado);
    deudaSaldada = saldoPendiente <= 0;
  } else {
    // Estimación con base en cuotas_pagadas de su perfil
    const cuotaMonto = totalCuotas > 0 ? costoTotal / totalCuotas : 0;
    const cuotasEfectivas = Math.min(safeProfile.cuotas_pagadas || 0, totalCuotas);
    montoPagado = cuotasEfectivas * cuotaMonto;
    saldoPendiente = Math.max(0, costoTotal - montoPagado);
    deudaSaldada = saldoPendiente <= 0;
  }

  const fechaProximoPago = new Date();
  fechaProximoPago.setDate(15);
  fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
  const stringFechaPago = fechaProximoPago.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

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
                    {diplomadoPrincipal.modulos[0] ? `${diplomadoPrincipal.modulos[0].codigo}: ${diplomadoPrincipal.modulos[0].nombre}` : 'Módulo I'}
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
                  href="/dashboard/diplomados"
                  className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
                >
                  Ver mis Diplomados <ArrowUpRight className="size-3.5" />
                </Link>

                <Link 
                  href={`/dashboard/reproductor?slug=${diplomadoPrincipal.slug}`}
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
                  href="/dashboard/cursos"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                >
                  Ver mis Cursos <ArrowUpRight className="size-3.5" />
                </Link>

                <Link 
                  href={cursoPrincipal.link}
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
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:px-10 lg:grid-cols-3 lg:px-16 lg:py-10">
        
        {/* Widget 1: Créditos EDUMIN disponibles */}
        <article className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-sm ring-1 border border-slate-200 dark:border-slate-800 sm:p-9 flex flex-col justify-between">
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-indigo-100/50 dark:bg-indigo-950/40" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-400">Créditos EDUMIN</p>
                <h2 className="mt-3 text-5xl font-bold tracking-tighter text-slate-950 dark:text-white">
                  {eduminCredits.total.disponibles}
                </h2>
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
                <BookOpenCheck className="size-6" />
              </div>
            </div>

            <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span>Diplomados pendientes:</span>
                <strong className="font-bold text-slate-900 dark:text-white">
                  {eduminCredits.diplomados.disponibles} cupo(s)
                </strong>
              </div>
              <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                <span>Cursos libres pendientes:</span>
                <strong className="font-bold text-slate-900 dark:text-white">
                  {eduminCredits.cursos.disponibles} cupo(s)
                </strong>
              </div>
            </div>

            <p className="mt-3 text-[11px] text-slate-400 dark:text-slate-500">
              {eduminCredits.total.liberados} liberados por pagos · {eduminCredits.total.consumidos} canjeados
            </p>
          </div>

          {eduminCredits.total.disponibles > 0 ? (
            <Link
              href="/dashboard/canjear"
              className="mt-6 inline-flex h-12 w-full justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition hover:opacity-95"
            >
              <Sparkles className="size-4 animate-bounce" /> Canjear mis cursos y diplomados
            </Link>
          ) : (
            <Link
              href="/dashboard/canjear"
              className="mt-6 inline-flex h-11 w-full justify-center items-center gap-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 px-4 text-xs font-bold transition"
            >
              Ver mis créditos canjeados
            </Link>
          )}
        </article>

        {/* Widget 2: Estado Financiero */}
        <article className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 p-7 shadow-sm border border-slate-200 dark:border-slate-800 sm:p-9 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-3">
                <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <Wallet className="size-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Estado de Cuenta</h3>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">Monto total</span>
                <span className="font-semibold tabular-nums text-slate-900 dark:text-white">S/ {costoTotal}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-sm text-slate-500 dark:text-slate-400">Total pagado</span>
                <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">S/ {montoPagado}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500 dark:text-slate-400">Saldo pendiente</span>
                <span className="font-bold tabular-nums text-slate-900 dark:text-white">S/ {saldoPendiente}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {deudaSaldada ? (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-4 py-3 rounded-xl text-sm font-semibold border border-emerald-100 dark:border-emerald-800/50">
                <CheckCircle2 className="size-5 shrink-0" />
                <span>Cuenta al día. ¡Gracias por tu puntualidad!</span>
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 px-4 py-3 rounded-xl text-sm font-medium border border-amber-100 dark:border-amber-800/50">
                <CalendarDays className="size-5 shrink-0" />
                <span>Próximo pago: <strong>{stringFechaPago}</strong></span>
              </div>
            )}

            <Link
              href="/dashboard/pagos"
              className="inline-flex h-11 w-full justify-center items-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white px-4 text-xs font-bold transition shadow-sm border border-slate-800 dark:border-slate-700"
            >
              Ver Mis Pagos <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </article>

        {/* Widget 3: Bolsa de Trabajo y Dreambuilder */}
        <div className="flex flex-col gap-4">
          
          {/* Tarjeta Dreambuilder */}
          {dreambuilderHabilitado && (
            <article className="relative flex-1 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-900 p-6 text-white shadow-md">
              <div className="absolute right-0 top-0 size-32 rounded-bl-full bg-white/5" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Rocket className="size-5 text-indigo-300" /> Dreambuilder
                  </h3>
                  <p className="mt-1 text-xs text-indigo-200">Potencia tus objetivos profesionales y emprendimiento.</p>
                </div>
              </div>
              <a
                className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-white/10 px-4 text-sm font-bold text-white transition hover:bg-white/20 border border-white/10"
                href={dreambuilderUrl}
                target="_blank"
                rel="noreferrer"
              >
                Ingresar al portal <ArrowUpRight className="size-4" />
              </a>
            </article>
          )}

          {/* Tarjeta de Bolsas de Trabajo (Regular y Exclusiva) */}
          <article className="relative flex-1 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-md border border-slate-800 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Briefcase className="size-5 text-emerald-400" /> Bolsa de trabajo
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Accede a convocatorias y vacantes laborales activas en minería e industria.
              </p>
            </div>

            <div className="mt-4 space-y-2.5">
              {/* Botón 1: Bolsa de Trabajo Regular */}
              {bolsaTrabajoRegularHabilitada ? (
                <a
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 text-xs font-bold text-white transition shadow-sm"
                  href={bolsaRegularUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Bolsa de trabajo regular <ArrowUpRight className="size-4" />
                </a>
              ) : (
                <div className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950/60 px-4 text-xs font-medium text-slate-500 border border-dashed border-slate-800 cursor-not-allowed">
                  <Lock className="size-3.5" /> Bolsa de trabajo regular no disponible
                </div>
              )}

              {/* Botón 2: Bolsa de Trabajo Exclusiva */}
              {bolsaTrabajoExclusivaHabilitada ? (
                <a
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 text-xs font-bold text-white transition shadow-sm"
                  href={bolsaExclusivaUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Bolsa de trabajo exclusiva <ArrowUpRight className="size-4" />
                </a>
              ) : (
                <div className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-slate-950/60 px-4 text-xs font-medium text-slate-500 border border-dashed border-slate-800 cursor-not-allowed">
                  <Lock className="size-3.5" /> Bolsa de trabajo exclusiva (FULL / ILIMITADO)
                </div>
              )}
            </div>
          </article>
        </div>
      </section>
    </main>
  );
}
