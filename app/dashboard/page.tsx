import { redirect } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  BookOpen,
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

  // Si aún no se encuentra, buscar por documento en user_metadata si existiese
  const docMeta = user.user_metadata?.numero_documento || user.user_metadata?.dni_ce;
  if (!profile && docMeta) {
    const { data: profileByDni } = await admin
      .from("profiles")
      .select("*")
      .eq("numero_documento", String(docMeta))
      .maybeSingle();
    profile = profileByDni;
  }

  const safeProfile = profile || {
    id: user.id,
    role: 'ESTUDIANTE',
    nombres: user.user_metadata?.nombres || 'Estudiante',
    apellidos: user.user_metadata?.apellidos || '',
    numero_documento: docMeta || 'Sin documento',
    dni_ce: docMeta || 'Sin documento',
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

  // 1. DIPLOMADO DINÁMICO DEL ESTUDIANTE:
  const parsedDips = parseDiplomadosFromProfile(safeProfile);
  
  // Buscar prioritariamente el diplomado que esté EN CURSO (0 < avance < 100)
  // Si no hay ninguno en curso, buscar el primero pendiente (avance < 100)
  // Si todos están completados, tomar el último
  const activeDip = parsedDips.find(d => (d.avance || 0) > 0 && (d.avance || 0) < 100)
    || parsedDips.find(d => (d.avance || 0) < 100)
    || parsedDips[0]
    || null;

  let diplomadoData: {
    tiene: boolean;
    titulo: string;
    slug: string;
    avance: number;
    moduloTexto: string;
    link: string;
  };

  if (activeDip) {
    const matchedFullDip = getDiplomadoByTitleOrSlug(activeDip.slug || activeDip.id || activeDip.titulo);
    const tituloOficial = activeDip.titulo || matchedFullDip?.titulo || 'Mi Diplomado';
    const slugOficial = activeDip.slug || matchedFullDip?.slug || 'derecho-minero';
    
    // Obtener módulo actual según su progreso o primer módulo con nombre temático real
    let moduloTexto = 'MÓDULO 01';
    if (activeDip.modulos && activeDip.modulos.length > 0) {
      const modIncompletoIdx = activeDip.modulos.findIndex((m: any) => !activeDip?.completadosMap?.[m.id || m.codigo || m.nombre]);
      const targetIdx = modIncompletoIdx !== -1 ? modIncompletoIdx : 0;
      const modToShow = activeDip.modulos[targetIdx];
      const codigo = modToShow.codigo || (matchedFullDip?.modulos?.[targetIdx]?.codigo) || `MÓDULO ${String(targetIdx + 1).padStart(2, '0')}`;
      
      let nombre = (modToShow.nombre || '').trim();
      const esNombreGenerico = !nombre || /^m[oó]dulo\s*\d+$/i.test(nombre) || nombre.toLowerCase() === codigo.toLowerCase();
      
      if (esNombreGenerico) {
        const catalogMod = matchedFullDip?.modulos?.[targetIdx];
        if (catalogMod?.nombre && !/^m[oó]dulo\s*\d+$/i.test(catalogMod.nombre)) {
          nombre = catalogMod.nombre.trim();
        }
      }
      
      // Limpiar prefijo redundante "MÓDULO XX:" o similar si ya está contenido en el nombre
      nombre = nombre.replace(/^m[oó]dulo\s*\d+\s*[:\-\–]?\s*/i, '').trim();
      
      moduloTexto = nombre && nombre.toLowerCase() !== codigo.toLowerCase() ? `${codigo}: ${nombre}` : codigo;
    } else if (matchedFullDip?.modulos && matchedFullDip.modulos.length > 0) {
      const m0 = matchedFullDip.modulos[0];
      const codigo = m0.codigo || 'MÓDULO 01';
      let nombre = (m0.nombre || '').replace(/^m[oó]dulo\s*\d+\s*[:\-\–]?\s*/i, '').trim();
      moduloTexto = nombre && nombre.toLowerCase() !== codigo.toLowerCase() ? `${codigo}: ${nombre}` : codigo;
    }

    diplomadoData = {
      tiene: true,
      titulo: tituloOficial,
      slug: slugOficial,
      avance: Math.min(100, Math.max(0, Number(activeDip.avance || 0))),
      moduloTexto,
      link: `/dashboard/reproductor?slug=${slugOficial}`
    };
  } else {
    diplomadoData = {
      tiene: false,
      titulo: 'Sin diplomado asignado',
      slug: '',
      avance: 0,
      moduloTexto: 'Explora nuestro catálogo y canjea tu diplomado oficial.',
      link: '/dashboard/diplomados'
    };
  }

  // 2. CURSO DINÁMICO DEL ESTUDIANTE:
  const parsedCursos = parseCursosFromProfile(safeProfile);
  
  // Buscar prioritariamente el curso que esté EN CURSO (0 < avance < 100)
  // Si no hay ninguno en curso, buscar el primero pendiente (avance < 100)
  // Si todos están completados, tomar el último
  const activeCur = parsedCursos.find(c => (Number(c.avance) || 0) > 0 && (Number(c.avance) || 0) < 100)
    || parsedCursos.find(c => (Number(c.avance) || 0) < 100)
    || parsedCursos[0]
    || null;

  let cursoData: {
    tiene: boolean;
    titulo: string;
    id: string;
    avance: number;
    sesionTexto: string;
    link: string;
  };

  if (activeCur) {
    const curId = activeCur.id || activeCur.codigo || 'cur-01';
    cursoData = {
      tiene: true,
      titulo: activeCur.titulo || 'Mi Curso',
      id: curId,
      avance: Math.min(100, Math.max(0, Number(activeCur.avance || 0))),
      sesionTexto: activeCur.tipo ? `${activeCur.tipo} DE ESPECIALIZACIÓN` : 'CURSO DE ESPECIALIZACIÓN',
      link: `/dashboard/cursos/${curId}`
    };
  } else if (diplomadoData.tiene) {
    const tallerOficial = obtenerTallerParaDiplomado(diplomadoData.titulo);
    cursoData = {
      tiene: true,
      titulo: tallerOficial.titulo,
      id: tallerOficial.id,
      avance: 0,
      sesionTexto: 'TALLER OFICIAL DE REGALO',
      link: `/dashboard/cursos/${tallerOficial.id}`
    };
  } else {
    cursoData = {
      tiene: false,
      titulo: 'Sin cursos canjeados',
      id: '',
      avance: 0,
      sesionTexto: 'Canjea cursos libres de especialización con tus créditos.',
      link: '/dashboard/canjear'
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
              ¡Hola, <span className="text-blue-400 font-black">{primerNombre}</span>, bienvenid@ a tu ruta de aprendizaje!
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

      {/* SECCIÓN 1 (PRIMERA): PROGRESO ACADÉMICO - CONTINUAR DONDE TE QUEDASTE */}
      <section className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 pt-10">
        <div className="mb-6">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Continuar donde te quedaste
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tarjeta 1: Mis Diplomados (Recurso Académico - Azul Institucional) */}
          <article className="relative rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-500/40 transition">
            <div>
              {/* Encabezado: Icono a la izquierda y Título al lado */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0">
                    <GraduationCap className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    Mis diplomados
                  </h3>
                </div>
                {diplomadoData.tiene && (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    diplomadoData.avance === 100
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : diplomadoData.avance > 0
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {diplomadoData.avance === 100 ? 'Completado' : diplomadoData.avance > 0 ? 'En progreso' : 'Por iniciar'}
                  </span>
                )}
              </div>

              {/* Título del diplomado y módulo integrado */}
              <div className="min-h-[4.5rem] flex flex-col justify-center mb-2">
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug line-clamp-2 [text-wrap:balance]">
                  {diplomadoData.titulo}
                </h4>
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-1 mt-1">
                  {diplomadoData.moduloTexto}
                </p>
              </div>
            </div>

            {/* Zona inferior alineada: Avance + Barra + Acciones */}
            <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
              {/* Barra de Avance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Avance</span>
                  <span className="text-blue-600 dark:text-blue-400 tabular-nums">
                    {diplomadoData.avance}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${diplomadoData.avance}%` }} 
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <Link 
                  href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : "/dashboard/diplomados"}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition inline-flex items-center gap-1"
                >
                  Ver diplomados <ArrowUpRight className="size-3.5" />
                </Link>

                <Link 
                  href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : diplomadoData.link}
                  className="inline-flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-sm transition hover:shadow-blue-500/25 group cursor-pointer"
                >
                  <span>{diplomadoData.avance === 0 ? 'Comenzar diplomado' : 'Continuar diplomado'}</span>
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </article>

          {/* Tarjeta 2: Mis Cursos (Recurso Académico - Azul Institucional) */}
          <article className="relative rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-blue-300 dark:hover:border-blue-500/40 transition">
            <div>
              {/* Encabezado: Icono a la izquierda y Título al lado */}
              <div className="flex items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-10 place-items-center rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shrink-0">
                    <BookOpen className="size-5" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                    Mis cursos
                  </h3>
                </div>
                {cursoData.tiene && (
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${
                    cursoData.avance === 100
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : cursoData.avance > 0
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {cursoData.avance === 100 ? 'Completado' : cursoData.avance > 0 ? 'En progreso' : 'Por iniciar'}
                  </span>
                )}
              </div>

              {/* Título del curso limpio */}
              <div className="min-h-[4.5rem] flex flex-col justify-center mb-2">
                <h4 className="font-extrabold text-base sm:text-lg text-slate-900 dark:text-white leading-snug line-clamp-2 [text-wrap:balance]">
                  {cursoData.titulo}
                </h4>
              </div>
            </div>

            {/* Zona inferior alineada: Avance + Barra + Acciones */}
            <div className="mt-auto pt-5 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
              {/* Barra de Avance */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-slate-600 dark:text-slate-400">Avance</span>
                  <span className="text-blue-600 dark:text-blue-400 tabular-nums">
                    {cursoData.avance}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${cursoData.avance}%` }} 
                  />
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <Link 
                  href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : "/dashboard/cursos"}
                  className="text-xs font-bold text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition inline-flex items-center gap-1"
                >
                  Ver cursos <ArrowUpRight className="size-3.5" />
                </Link>

                <Link 
                  href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : cursoData.link}
                  className="inline-flex items-center gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl shadow-sm transition hover:shadow-blue-500/25 group cursor-pointer"
                >
                  <span>{cursoData.avance === 0 ? 'Comenzar curso' : 'Continuar curso'}</span>
                  <ArrowRight className="size-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          </article>

        </div>
      </section>

      {/* SECCIÓN 2 (SEGUNDA): CRÉDITOS Y ESTADO DE CUENTA */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:px-10 lg:grid-cols-3 lg:px-16">
        
        {/* Widget 1: Créditos EDUMIN disponibles (Ámbar / Oro) */}
        <article className="relative rounded-3xl bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-amber-300 dark:hover:border-amber-500/40 transition">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="grid size-10 place-items-center rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50 shrink-0">
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
              className="mt-6 inline-flex h-11 w-full justify-center items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white px-4 text-xs font-bold transition shadow-sm shadow-amber-600/20"
            >
              <Sparkles className="size-4" /> Canjear mis créditos
            </Link>
          ) : (
            <a
              href={whatsappComprarCreditosUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex h-11 w-full justify-center items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 text-white px-4 text-xs font-bold transition shadow-sm shadow-amber-600/20 cursor-pointer"
            >
              <ShoppingBag className="size-4" /> Comprar más créditos
            </a>
          )}
        </article>

        {/* Widget 2: Estado Financiero (Esmeralda) */}
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
              className="inline-flex h-11 w-full justify-center items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 text-xs font-bold transition shadow-sm shadow-emerald-600/20"
            >
              Ver mis pagos <ArrowUpRight className="size-4" />
            </Link>
          </div>
        </article>

        {/* Widget 3: Bolsa de Trabajo y Certificados del Estudiante */}
        <div className="flex flex-col gap-4 sm:gap-5">
          
          {/* Tarjeta Acceso Directo a Mis Certificados (Cian) */}
          <article className="relative flex-1 rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col justify-between hover:border-cyan-300 dark:hover:border-cyan-500/40 transition">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="grid size-10 place-items-center rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-100 dark:border-cyan-900/50 shrink-0">
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
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold px-4 text-xs shadow-sm shadow-cyan-600/20 transition"
              href={tieneDeudaVencida ? "/dashboard/pagos?bloqueado=deuda" : "/dashboard/certificados"}
            >
              Ver mis certificados <ArrowUpRight className="size-4" />
            </Link>
          </article>

          {/* Tarjeta de Bolsas de Trabajo (Regular y Exclusiva) (Púrpura / Morado) */}
          <article className="relative flex-1 rounded-3xl bg-white dark:bg-slate-900 p-5 sm:p-6 shadow-sm border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col justify-between hover:border-purple-300 dark:hover:border-purple-500/40 transition">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="grid size-10 place-items-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/50 shrink-0">
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
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-4 text-xs font-bold transition shadow-sm shadow-purple-600/20"
                  href={bolsaRegularUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Bolsa de trabajo regular <ArrowUpRight className="size-4" />
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-4 text-xs font-bold shadow-sm cursor-not-allowed select-none"
                >
                  Bolsa de trabajo regular <ArrowUpRight className="size-4" />
                </button>
              )}

              {/* Botón 2: Bolsa de Trabajo Exclusiva (Mismo color) */}
              {bolsaTrabajoExclusivaHabilitada ? (
                <a
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white px-4 text-xs font-bold transition shadow-sm shadow-purple-600/20"
                  href={bolsaExclusivaUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Bolsa de trabajo exclusiva <ArrowUpRight className="size-4" />
                </a>
              ) : (
                <button
                  disabled
                  className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 px-4 text-xs font-bold shadow-sm cursor-not-allowed select-none"
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
