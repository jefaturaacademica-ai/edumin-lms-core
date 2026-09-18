import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  BookOpenCheck,
  GraduationCap,
  Layers3,
  Rocket,
  Sparkles,
  Briefcase,
  Wallet,
  CalendarDays,
  CheckCircle2,
  Play,
  Award
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { calculateReleasedCredits } from "@/lib/utils/credits";
import Link from "next/link";

export const metadata = {
  title: "Dashboard | Edumin",
};

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("nombres, paquete_adquirido, cuotas_pagadas, cupos_diplomados")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    throw new Error("No fue posible obtener el perfil del estudiante.");
  }

  // Cálculos de Créditos
  const releasedCredits = calculateReleasedCredits(
    profile.paquete_adquirido,
    profile.cuotas_pagadas,
  );
  const availableCredits = Math.max(0, releasedCredits - profile.cupos_diplomados);
  
  // Lógica de Beneficios Premium
  const isPremium = profile.paquete_adquirido === "FULL" || profile.paquete_adquirido === "ILIMITADO";
  const dreambuilderUrl = process.env.NEXT_PUBLIC_DREAMBUILDER_URL ?? "https://dreambuilder.com";
  const bolsaTrabajoUrl = process.env.NEXT_PUBLIC_BOLSA_TRABAJO_URL ?? "https://chat.whatsapp.com/edumin-bolsa-exclusiva";

  // Motor Financiero
  let costoTotal = 0;
  let totalCuotas = 0;
  
  if (profile.paquete_adquirido === 'COMPLETO') {
    costoTotal = 540;
    totalCuotas = 3;
  } else if (profile.paquete_adquirido === 'FULL') {
    costoTotal = 900;
    totalCuotas = 3;
  } else if (profile.paquete_adquirido === 'ILIMITADO') {
    costoTotal = 1500;
    totalCuotas = 5;
  }

  const cuotaMonto = costoTotal / totalCuotas;
  const cuotasEfectivas = Math.min(profile.cuotas_pagadas, totalCuotas);
  const montoPagado = cuotasEfectivas * cuotaMonto;
  const saldoPendiente = costoTotal - montoPagado;
  const deudaSaldada = saldoPendiente <= 0;

  const fechaProximoPago = new Date();
  fechaProximoPago.setDate(15);
  fechaProximoPago.setMonth(fechaProximoPago.getMonth() + 1);
  const stringFechaPago = fechaProximoPago.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <main className="min-h-screen overflow-hidden bg-slate-50 text-slate-950 pb-20">
      {/* Hero Section */}
      <section className="relative isolate overflow-hidden px-6 py-12 sm:px-10 lg:px-16 lg:py-20 border-b border-slate-800 bg-slate-950">
        <div 
          className="absolute inset-0 -z-20 bg-cover bg-center bg-no-repeat opacity-100"
          style={{ backgroundImage: `url('https://img.magnific.com/foto-gratis/retrato-ingenieros-horas-trabajo-sitio-trabajo_23-2151589536.jpg?semt=ais_hybrid&w=740&q=80')` }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-slate-950/85 via-slate-950/50 to-slate-950/90" />

        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3 text-white">
              <div className="grid size-11 place-items-center rounded-2xl bg-indigo-600/40 ring-1 ring-indigo-400/40 backdrop-blur-md shadow-inner">
                <GraduationCap className="size-6 text-indigo-300" />
              </div>
              <div>
                <span className="text-lg font-extrabold tracking-tight text-white block">EDUMIN</span>
                <span className="text-xs text-indigo-300 font-medium">Centro de Especialización Profesional</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-500/20 px-3.5 py-1.5 text-sm font-semibold text-indigo-200 backdrop-blur-md shadow-sm">
                <Sparkles className="size-4 text-indigo-400 animate-pulse" />
                Tu espacio de crecimiento profesional
              </div>
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl drop-shadow-md">
                ¡Hola, <span className="text-indigo-400 font-black">{profile.nombres}</span>, bienvenido a tu ruta de aprendizaje!
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-200 font-medium drop-shadow">
                Accede a tus programas de especialización en minería, seguridad, industria y negocios diseñados para potenciar tu perfil ejecutivo.
              </p>
            </div>
            
            <div className="inline-flex w-fit items-center gap-3 rounded-2xl border border-white/15 bg-slate-900/90 px-5 py-3.5 text-white shadow-xl backdrop-blur-xl ring-1 ring-white/10">
              <Layers3 className="size-5 text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Paquete activo</span>
                <span className="text-sm font-bold text-indigo-200 tracking-wide">
                  {profile.paquete_adquirido}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Grid Principal de Widgets */}
      <section className="mx-auto grid max-w-6xl gap-6 px-6 py-10 sm:px-10 lg:grid-cols-3 lg:px-16 lg:py-14">
        
        {/* Widget 1: Créditos y Canje de Beneficios Pendientes */}
        <article className="relative overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-9 flex flex-col justify-between">
          <div className="absolute -right-12 -top-12 size-44 rounded-full bg-indigo-100/50" />
          <div className="relative">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.16em] text-indigo-600">Créditos disponibles</p>
                <h2 className="mt-3 text-5xl font-bold tracking-tighter text-slate-950">{availableCredits}</h2>
              </div>
              <div className="grid size-12 place-items-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
                <BookOpenCheck className="size-6" />
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {availableCredits > 0 ? (
                <>Tienes <strong className="font-bold text-slate-950">{availableCredits} cupos pendientes</strong> para canjear en tu diplomado.</>
              ) : (
                <>Has canjeado todos tus cupos disponibles de tu plan actual.</>
              )}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {releasedCredits} liberados por cuota · {profile.cupos_diplomados} usados
            </p>
          </div>

          {availableCredits > 0 && (
            <Link
              href="/dashboard/canjear"
              className="mt-6 inline-flex h-12 w-full justify-center items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white px-4 text-xs font-extrabold uppercase tracking-wider shadow-lg shadow-indigo-600/30 transition hover:opacity-95"
            >
              <Sparkles className="size-4 animate-bounce" /> ¡Quiero canjear mi beneficio pendiente!
            </Link>
          )}
        </article>

        {/* Widget 2: Estado Financiero */}
        <article className="relative overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-slate-200 sm:p-9 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="grid size-10 place-items-center rounded-xl bg-emerald-100 text-emerald-600">
                <Wallet className="size-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Estado de Cuenta</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Monto total</span>
                <span className="font-semibold text-slate-900">S/ {costoTotal}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-500">Total pagado</span>
                <span className="font-semibold text-emerald-600">S/ {montoPagado}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Saldo pendiente</span>
                <span className="font-bold text-slate-900">S/ {saldoPendiente}</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {deudaSaldada ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-3 rounded-xl text-sm font-semibold">
                <CheckCircle2 className="size-5" />
                Cuenta al día. ¡Gracias!
              </div>
            ) : (
              <div className="flex items-center gap-3 bg-amber-50 text-amber-700 px-4 py-3 rounded-xl text-sm font-medium">
                <CalendarDays className="size-5 shrink-0" />
                <span>Próximo pago: <strong>{stringFechaPago}</strong></span>
              </div>
            )}
          </div>
        </article>

        {/* Widget 3: Beneficios Premium */}
        <div className="flex flex-col gap-4">
          {isPremium && (
            <article className="relative flex-1 overflow-hidden rounded-3xl bg-gradient-to-br from-violet-700 to-indigo-900 p-6 text-white shadow-md">
              <div className="absolute right-0 top-0 size-32 rounded-bl-full bg-white/5" />
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Rocket className="size-5 text-indigo-300" /> Dreambuilder
                  </h3>
                  <p className="mt-1 text-xs text-indigo-200">Potencia tus objetivos profesionales.</p>
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

          {isPremium ? (
            <article className="relative flex-1 overflow-hidden rounded-3xl bg-slate-900 p-6 text-white shadow-md border border-slate-800">
              <div className="relative z-10">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Briefcase className="size-5 text-emerald-400" /> Bolsa de Trabajo
                </h3>
                <p className="mt-1 text-xs text-slate-400">Ofertas exclusivas para tu paquete.</p>
              </div>
              <a
                className="mt-4 inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 px-4 text-sm font-bold text-white transition"
                href={bolsaTrabajoUrl}
                target="_blank"
                rel="noreferrer"
              >
                Unirme al grupo VIP <ArrowUpRight className="size-4" />
              </a>
            </article>
          ) : (
            <article className="flex-1 rounded-3xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
              <Briefcase className="size-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-600">Bolsa de Trabajo</p>
              <p className="text-xs text-slate-400 mt-1">Beneficio disponible en paquetes FULL e ILIMITADO.</p>
            </article>
          )}
        </div>
      </section>

      {/* SECCIÓN: CONTINUAR DONDE TE QUEDASTE */}
      <section className="mx-auto max-w-6xl px-6 sm:px-10 lg:px-16 pt-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider block mb-1">Progreso Académico</span>
              <h2 className="text-2xl font-bold text-slate-900">Continuar donde te quedaste</h2>
              <p className="text-xs text-slate-500 mt-1">Retoma tus sesiones de estudio activas en tus programas y cursos cortos.</p>
            </div>
            
            {/* BOTÓN PRINCIPAL POR DEFECTO: "VER MIS DIPLOMADOS" */}
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard/diplomados"
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow-sm"
              >
                Ver mis Diplomados
              </Link>
              <Link 
                href="/dashboard/cursos"
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                Ver mis Cursos
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Tarjeta de Diplomado (Derecho Minero) */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-indigo-600 text-white grid place-items-center shrink-0 shadow-sm">
                  <Award className="size-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest block">Programa Principal</span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">Derecho Minero & Normativa</h3>
                  <p className="text-xs text-slate-500 mt-1">Módulo I: Legislación Minera y Marco Legal</p>
                </div>
              </div>

              {/* Barra de Progreso Visual */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Avance del programa</span>
                  <span className="text-indigo-600">50%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '50%' }} />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <Link 
                  href="/dashboard/diplomados/derecho-minero/modulo-1"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl shadow-sm transition"
                >
                  <span className="grid size-5 place-items-center rounded-full bg-white text-indigo-600">
                    <Play className="size-3 fill-indigo-600 ml-0.5" />
                  </span>
                  Reanudar clase
                </Link>
              </div>
            </div>

            {/* Tarjeta de Curso (Manejo de EPPs) */}
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition">
              <div className="flex items-start gap-4">
                <div className="size-12 rounded-xl bg-emerald-600 text-white grid place-items-center shrink-0 shadow-sm">
                  <BookOpenCheck className="size-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest block">Curso Asincrónico</span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">Manejo de EPPs según Ley 29783</h3>
                  <p className="text-xs text-slate-500 mt-1">Sesión 2: Clasificación y Equipos</p>
                </div>
              </div>

              {/* Barra de Progreso Visual */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-bold">
                  <span className="text-slate-600">Avance del curso</span>
                  <span className="text-emerald-600">75%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '75%' }} />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end">
                <Link 
                  href="/dashboard/cursos/manejo-epps"
                  className="inline-flex items-center gap-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl shadow-sm transition"
                >
                  <span className="grid size-5 place-items-center rounded-full bg-white text-emerald-600">
                    <Play className="size-3 fill-emerald-600 ml-0.5" />
                  </span>
                  Reanudar clase
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </main>
  );
}