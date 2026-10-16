import { Montserrat } from "next/font/google";
import { AnimatedLoginForm } from "@/components/auth/AnimatedLoginForm";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata = {
  title: "Acceso",
  description: "Portal oficial de acceso al Aula Virtual y Gestión Académica de EDUMIN.",
};

export default function LoginPage() {
  return (
    <main className={`w-full min-h-screen bg-[#0f172a] overflow-x-hidden ${montserrat.className}`}>
      <div className="flex w-full min-h-screen animate-fadeInPage opacity-0 [animation-fill-mode:forwards]">
        
        {/* Lado Izquierdo: Video Institucional con Personas en la Mina */}
        <section className="relative hidden lg:block flex-1 overflow-hidden bg-[#0f172a]">
          <video
            className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover z-[1] pointer-events-none"
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

          {/* Gradiente Oscuro Superpuesto para Contraste y Elegancia */}
          <div className="absolute inset-0 z-[2] bg-gradient-to-br from-[#0f172a]/30 via-[#0b1329]/45 to-[#0b1329]/80" />

          {/* Badge de Marca Institucional (Inferior Izquierda con Acento Naranja) */}
          <div className="absolute bottom-10 left-10 z-[3] text-white bg-[#0f172a]/80 px-7 py-4 rounded-xl backdrop-blur-md border-l-4 border-[#f97316] shadow-[0_10px_25px_rgba(0,0,0,0.3)] animate-fadeInUp-badge opacity-0 [animation-fill-mode:forwards]">
            <h1 className="text-2xl font-black tracking-wide text-white">EDUMIN</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
              Centro de Alta Capacitación Especializada en Minería
            </p>
          </div>
        </section>

        {/* Lado Derecho: Panel Institucional en Azul Oscuro Elegante (#0b1329) */}
        <section className="w-full lg:w-[500px] xl:w-[520px] min-h-screen bg-[#0b1329] flex flex-col justify-center items-center px-6 sm:px-12 py-10 relative text-white shadow-[-15px_0_40px_rgba(0,0,0,0.3)] z-10 border-l border-white/[0.08] animate-slideInRight opacity-0 [animation-fill-mode:forwards]">
          <AnimatedLoginForm />
        </section>

      </div>
    </main>
  );
}
