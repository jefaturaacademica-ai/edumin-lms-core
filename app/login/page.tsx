import { GraduationCap, ShieldCheck, Sparkles } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Ingresar | Edumin",
  description: "Accede a tu aula virtual Edumin.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 lg:grid lg:grid-cols-2">
      <section
        className="relative hidden overflow-hidden bg-slate-900 p-10 lg:flex lg:flex-col lg:justify-between xl:p-14"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(15, 23, 42, 0.94), rgba(30, 27, 75, 0.78)), url('https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1800&q=85')",
          backgroundPosition: "center",
          backgroundSize: "cover",
        }}
      >
        <div className="relative flex items-center gap-3 text-white">
          <div className="grid size-11 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <GraduationCap className="size-6" />
          </div>
          <span className="text-xl font-bold tracking-tight">edumin</span>
        </div>

        <div className="relative max-w-xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-sm font-medium text-indigo-100 backdrop-blur">
            <Sparkles className="size-4 text-indigo-300" />
            Formación que transforma
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-white xl:text-5xl">
            Impulsa tu potencial, aprende sin límites.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-200">
            Una experiencia de aprendizaje diseñada para que avances con claridad,
            acompañamiento y resultados reales.
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-sm text-slate-200">
          <ShieldCheck className="size-5 text-emerald-300" />
          Tu información está protegida y segura.
        </div>
      </section>

      <section className="flex min-h-screen items-center justify-center bg-slate-50 px-5 py-10 sm:px-8">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-200 sm:p-9">
          <div className="mb-8 lg:hidden">
            <div className="mb-6 flex items-center gap-3 text-indigo-950">
              <div className="grid size-10 place-items-center rounded-xl bg-indigo-600 text-white">
                <GraduationCap className="size-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">edumin</span>
            </div>
          </div>
          <div className="mb-8">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-indigo-600">
              Bienvenido de vuelta
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-slate-950">
              Ingresa a tu Aula Virtual
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Usa tu documento de identidad y contraseña para continuar.
            </p>
          </div>
          <LoginForm />
        </div>
      </section>
    </main>
  );
}
