import Link from 'next/link';
import { GraduationCap, ArrowRight, ShieldCheck, BookOpenCheck, Award } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-indigo-500 selection:text-white">
      {/* Navbar superior */}
      <header className="max-w-6xl w-full mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
            <GraduationCap className="size-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">edumin</span>
        </div>
        <Link
          href="/login"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-5 py-2.5 text-sm font-bold text-white transition-all shadow-lg shadow-indigo-600/20"
        >
          <span>Acceder al Aula Virtual</span>
          <ArrowRight className="size-4" />
        </Link>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl w-full mx-auto px-6 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-4 py-1.5 text-sm font-semibold text-indigo-300 mb-6 backdrop-blur">
            <SparklesIcon className="size-4" /> Plataforma Educativa Automatizada
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Impulsa tu futuro con diplomados de <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">alta especialización</span>
          </h1>
          <p className="mt-6 text-lg text-slate-400 leading-relaxed max-w-xl">
            Bienvenido al portal oficial de gestión académica de EDUMIN. Accede a tus cursos, gestiona tus créditos y obtén certificaciones oficiales con validación digital.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-8 py-4 text-base font-bold text-white transition-all shadow-xl shadow-indigo-600/25"
            >
              Iniciar Sesión con DNI
              <ArrowRight className="size-5" />
            </Link>
          </div>
        </div>

        {/* Tarjetas informativas flotantes (Estilo Premium) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 grid place-items-center text-indigo-400 mb-4">
              <BookOpenCheck className="size-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Matrícula Flexible</h3>
            <p className="text-sm text-slate-400">Elige tus cursos y gestiona tus créditos en tiempo real según tu avance.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur sm:translate-y-6">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 grid place-items-center text-cyan-400 mb-4">
              <Award className="size-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Certificación Oficial</h3>
            <p className="text-sm text-slate-400">Obtén tus diplomas modulares y generales con códigos QR de verificación.</p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 grid place-items-center text-purple-400 mb-4">
              <ShieldCheck className="size-6" />
            </div>
            <h3 className="font-bold text-lg text-white mb-1">Seguridad Total</h3>
            <p className="text-sm text-slate-400">Acceso exclusivo mediante credenciales y control estricto de perfiles.</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto px-6 py-8 border-t border-slate-900 text-center text-sm text-slate-500">
        &copy; 2026 EDUMIN LMS. Todos los derechos reservados.
      </footer>
    </div>
  );
}

function SparklesIcon(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4M4 19h4M13 3l4 8M17 3l-4 8M21 14l-4 8M17 14l4 8" />
    </svg>
  );
}