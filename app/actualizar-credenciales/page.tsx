import { ShieldCheck } from "lucide-react";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";

export const metadata = {
  title: "Actualizar credenciales | Edumin",
};

export default function UpdateCredentialsPage() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-5 py-10">
      <section className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl shadow-slate-900/10 ring-1 ring-slate-200 sm:p-10">
        <div className="grid size-12 place-items-center rounded-2xl bg-indigo-50 text-indigo-600">
          <ShieldCheck className="size-6" />
        </div>
        <p className="mt-6 text-sm font-bold uppercase tracking-[0.15em] text-indigo-600">Seguridad de tu cuenta</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">Actualiza tus credenciales</h1>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Por seguridad, debes establecer una nueva contraseña antes de ingresar al aula virtual.
        </p>
        <UpdatePasswordForm />
      </section>
    </main>
  );
}
