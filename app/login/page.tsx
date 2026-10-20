import { Suspense } from "react";
import { AnimatedLoginForm } from "@/components/auth/AnimatedLoginForm";
import { LoginHeaderActions } from "@/components/auth/LoginHeaderActions";
import { 
  MessageCircle, 
  Mail, 
  Phone, 
  Clock, 
  HelpCircle,
  GraduationCap,
  CreditCard
} from "lucide-react";
import { LOGIN_CONTACT_INFO } from "@/lib/data/loginContactInfo";
import { obtenerConfiguracionLogin } from "@/lib/services/loginBannerService";

export const metadata = {
  title: "Acceso al aula virtual",
  description: "Portal oficial de acceso al aula virtual y gestión académica de EDUMIN.",
};

export default async function LoginPage() {
  const { canales } = LOGIN_CONTACT_INFO;
  const bannerConfig = await obtenerConfiguracionLogin();

  const esModoHtml = bannerConfig.modo === 'html' && Boolean(bannerConfig.htmlPersonalizado?.trim());
  const esModoVacio = bannerConfig.modo === 'vacio';

  return (
    <main className="w-full min-h-screen bg-slate-950 font-sans text-slate-100 overflow-x-hidden relative">
      {/* Botones de Cabecera: Iniciar sesión como invitado y Validar certificado */}
      <LoginHeaderActions />

      <div className="flex w-full min-h-screen animate-fadeInPage opacity-0 [animation-fill-mode:forwards]">
        
        {/* Lado Izquierdo: Video Institucional con Tarjetas Dinámicas o Campaña HTML */}
        <section className="relative hidden lg:flex flex-1 overflow-hidden bg-slate-950 flex-col justify-between p-8 xl:p-12 z-[1]">
          {/* Video de Fondo */}
          <video
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover z-0 pointer-events-none"
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
          >
            <source
              src="https://res.cloudinary.com/pywzdfbb/video/upload/v1792166275/video1_final.mp4"
              type="video/mp4"
            />
            Tu navegador no soporta videos HTML5.
          </video>

          {/* Gradiente Oscuro Superpuesto para Contraste y Legibilidad */}
          <div className="absolute inset-0 z-[1] bg-gradient-to-br from-slate-950/80 via-slate-950/75 to-slate-950/90 backdrop-blur-[1.5px]" />

          {/* Header Superior Izquierdo: Logotipo Oficial */}
          <div className="relative z-10">
            <img
              src="/logo-blanco.png"
              alt="EDUMIN"
              className="h-10 w-auto object-contain"
            />
          </div>

          {/* Centro: Contenido Dinámico Administrable */}
          {esModoHtml ? (
            /* Modo Campaña / HTML Personalizado (ej. Navidad, avisos, promociones) */
            <div 
              className="relative z-10 max-w-2xl my-auto py-6 w-full animate-fadeInPage"
              dangerouslySetInnerHTML={{ __html: bannerConfig.htmlPersonalizado }}
            />
          ) : esModoVacio ? (
            /* Modo Limpio: Solo video de fondo y logo */
            <div className="relative z-10 my-auto" />
          ) : (
            /* Modo Canales Oficiales de Soporte y Contacto */
            <div className="relative z-10 max-w-2xl my-auto py-6 space-y-6">
              
              {/* Mensaje de Bienvenida */}
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-semibold">
                  <HelpCircle className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Centro de atención y soporte al estudiante</span>
                </div>
                <h2 className="text-2xl xl:text-3xl font-black text-white tracking-tight">
                  {LOGIN_CONTACT_INFO.tituloBienvenida}
                </h2>
                <p className="text-xs xl:text-sm text-slate-300 leading-relaxed max-w-xl">
                  {LOGIN_CONTACT_INFO.subtituloBienvenida}
                </p>
              </div>

              {/* Grid de Canales de Contacto Directo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* 1. Consultas académicas */}
                <div className="bg-slate-900/85 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-200 backdrop-blur-md shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                      <GraduationCap className="w-4 h-4" />
                      <span>{canales.academicas.titulo}</span>
                    </div>
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" title="Canal activo" />
                  </div>
                  <div>
                    <p className="text-base font-black text-white font-mono tracking-tight">
                      {canales.academicas.valor}
                    </p>
                  </div>
                  <a
                    href={canales.academicas.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition w-full justify-center cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{canales.academicas.textoBoton}</span>
                  </a>
                </div>

                {/* 2. Consultas de pagos */}
                <div className="bg-slate-900/85 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-200 backdrop-blur-md shadow-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                      <CreditCard className="w-4 h-4" />
                      <span>{canales.pagos.titulo}</span>
                    </div>
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" title="Canal activo" />
                  </div>
                  <div>
                    <p className="text-base font-black text-white font-mono tracking-tight">
                      {canales.pagos.valor}
                    </p>
                  </div>
                  <a
                    href={canales.pagos.enlace}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 px-3 py-1.5 rounded-xl transition w-full justify-center cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{canales.pagos.textoBoton}</span>
                  </a>
                </div>

                {/* 3. Correo electrónico */}
                <div className="bg-slate-900/85 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-200 backdrop-blur-md shadow-lg space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Mail className="w-4 h-4" />
                    <span>{canales.correo.titulo}</span>
                  </div>
                  <div>
                    <p className="text-xs xl:text-sm font-bold text-white font-mono truncate" title={canales.correo.valor}>
                      {canales.correo.valor}
                    </p>
                  </div>
                  <a
                    href={canales.correo.enlace}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-300 hover:text-white bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-500/30 px-3 py-1.5 rounded-xl transition w-full justify-center cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{canales.correo.textoBoton}</span>
                  </a>
                </div>

                {/* 4. Teléfono fijo */}
                <div className="bg-slate-900/85 hover:bg-slate-900 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-4 transition-all duration-200 backdrop-blur-md shadow-lg space-y-2.5">
                  <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider">
                    <Phone className="w-4 h-4" />
                    <span>{canales.telefonoFijo.titulo}</span>
                  </div>
                  <div>
                    <p className="text-base font-black text-white font-mono tracking-tight">
                      {canales.telefonoFijo.valor}
                    </p>
                  </div>
                  <a
                    href={canales.telefonoFijo.enlace}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 px-3 py-1.5 rounded-xl transition w-full justify-center cursor-pointer"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{canales.telefonoFijo.textoBoton}</span>
                  </a>
                </div>

              </div>

              {/* Franja de Horario de Atención */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl px-4 py-3 flex items-center gap-3 text-xs text-slate-300 backdrop-blur-md">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="font-medium">
                  {LOGIN_CONTACT_INFO.horarioAtencion}
                </span>
              </div>

            </div>
          )}

          {/* Footer Inferior Izquierdo */}
          <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/60 pt-4">
            <span className="text-[11px]">
              Instituto Internacional EDUMIN • Plataforma de especialización minera
            </span>
          </div>
        </section>

        {/* Lado Derecho: Formulario de Inicio de Sesión */}
        <section className="w-full lg:w-[500px] xl:w-[520px] min-h-screen bg-slate-950 flex flex-col justify-center items-center px-6 sm:px-12 py-10 relative text-white shadow-[-15px_0_40px_rgba(0,0,0,0.5)] z-10 border-l border-slate-800 animate-slideInRight opacity-0 [animation-fill-mode:forwards]">
          <Suspense fallback={<div className="w-full flex justify-center items-center min-h-[400px]"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" /></div>}>
            <AnimatedLoginForm />
          </Suspense>
        </section>

      </div>
    </main>
  );
}
