"use client";

import React, { useActionState, useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Eye, 
  EyeOff, 
  LoaderCircle, 
  LockKeyhole, 
  UserRound, 
  Sparkles, 
  ShieldCheck, 
  GraduationCap, 
  ArrowRight,
  Layers,
  ArrowLeft
} from "lucide-react";
import { loginWithDni, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

interface AnimatedLoginFormProps {
  className?: string;
}

export function AnimatedLoginForm({ className = "" }: AnimatedLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(loginWithDni, initialState);

  const [showPassword, setShowPassword] = useState(false);
  const [dniValue, setDniValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const dniInputRef = useRef<HTMLInputElement>(null);

  // Escuchar si se activa/desactiva el modo invitado desde el botón superior o URL
  useEffect(() => {
    const activarInvitado = () => {
      setDniValue("71234567");
      setPasswordValue("71234567");
      setInfoMessage("Credenciales de invitado cargadas (DNI: 71234567). Pulsa en 'Ingresar al aula virtual'.");
      window.dispatchEvent(new CustomEvent("modo-invitado-cambiado", { detail: { activo: true } }));
    };

    const activarEstudiante = () => {
      setDniValue("");
      setPasswordValue("");
      setInfoMessage(null);
      window.dispatchEvent(new CustomEvent("modo-invitado-cambiado", { detail: { activo: false } }));
      setTimeout(() => dniInputRef.current?.focus(), 50);
    };

    if (searchParams?.get("modo") === "invitado") {
      activarInvitado();
    }

    const handler = (e: any) => {
      if (e.detail?.modo === "invitado") {
        activarInvitado();
      } else if (e.detail?.modo === "estudiante") {
        activarEstudiante();
      }
    };

    window.addEventListener("toggle-modo-invitado", handler);
    return () => window.removeEventListener("toggle-modo-invitado", handler);
  }, [searchParams]);

  const handleDniChange = (val: string) => {
    setDniValue(val);
    if (val !== "71234567" && infoMessage) {
      setInfoMessage(null);
      window.dispatchEvent(new CustomEvent("modo-invitado-cambiado", { detail: { activo: false } }));
    }
  };

  const handlePasswordChange = (val: string) => {
    setPasswordValue(val);
    if (val !== "71234567" && infoMessage) {
      setInfoMessage(null);
      window.dispatchEvent(new CustomEvent("modo-invitado-cambiado", { detail: { activo: false } }));
    }
  };

  // Si el usuario tiene múltiples roles (ej. usuario 11111111 que es Admin + Estudiante), mostramos el selector de roles
  if (state.requiresRoleSelection && state.userRoles && state.userRoles.length > 0) {
    return (
      <div className={`w-full max-w-[400px] text-center animate-fadeInUp-box opacity-0 [animation-fill-mode:forwards] space-y-6 ${className}`}>
        {/* Cabecera del Selector de Roles */}
        <div className="flex flex-col items-center justify-center select-none">
          <div className="size-14 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 grid place-items-center mb-3 text-indigo-400">
            <Layers className="size-7" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Hola, {state.userName?.split(" ")[0] || "bienvenido"}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-xs leading-relaxed">
            Tu cuenta cuenta con múltiples entornos disponibles. Selecciona a qué panel deseas ingresar:
          </p>
        </div>

        {/* Tarjetas de Selección de Roles */}
        <div className="space-y-3 text-left">
          {state.userRoles.map((rol) => {
            const esEstudiante = rol.id === "estudiante";
            return (
              <button
                key={rol.id}
                type="button"
                onClick={() => router.push(rol.ruta)}
                className="w-full group bg-slate-900/90 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 p-4 rounded-2xl transition-all duration-200 shadow-lg cursor-pointer flex items-center justify-between text-left"
              >
                <div className="flex items-center gap-3.5">
                  <div className={`size-11 rounded-xl grid place-items-center shrink-0 border ${
                    esEstudiante 
                      ? "bg-indigo-600/20 border-indigo-500/30 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white" 
                      : "bg-purple-600/20 border-purple-500/30 text-purple-400 group-hover:bg-purple-600 group-hover:text-white"
                  } transition-colors`}>
                    {esEstudiante ? <GraduationCap className="size-5" /> : <ShieldCheck className="size-5" />}
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors block">
                      {rol.titulo}
                    </span>
                    <p className="text-[11px] text-slate-400 leading-tight">
                      {rol.subtitulo}
                    </p>
                  </div>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
              </button>
            );
          })}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer"
          >
            <ArrowLeft className="size-3.5" />
            <span>Volver al formulario de acceso</span>
          </button>
        </div>
      </div>
    );
  }

  // Formulario de Inicio de Sesión Limpio y Unificado
  return (
    <div className={`w-full max-w-[380px] text-center animate-fadeInUp-box opacity-0 [animation-fill-mode:forwards] ${className}`}>
      {/* Logotipo Oficial Horizontal (Sin texto redundante debajo) */}
      <div className="flex flex-col items-center justify-center mb-6 select-none">
        <img
          src="/logo-blanco.png"
          alt="EDUMIN"
          className="h-11 sm:h-12 w-auto object-contain drop-shadow"
        />
      </div>

      {/* Título Institucional */}
      <div className="mb-6">
        <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
          Acceso a la plataforma
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Ingresa tus credenciales para acceder al aula virtual
        </p>
      </div>

      {/* Formulario de Inicio de Sesión */}
      <form action={formAction} className="space-y-4 text-left" noValidate>
        {/* Campo DNI */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="dni">
            DNI o carnet de extranjería
          </label>
          <div className="relative">
            <UserRound
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={dniInputRef}
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              id="dni"
              name="dni"
              value={dniValue}
              onChange={(e) => handleDniChange(e.target.value)}
              placeholder="Ingresa tu número de documento"
              required
            />
          </div>
        </div>

        {/* Campo Contraseña */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="password">
              Contraseña
            </label>
            <span className="text-[10px] text-slate-400 font-medium">Acceso seguro</span>
          </div>
          <div className="relative">
            <LockKeyhole
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              autoComplete="current-password"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              id="password"
              name="password"
              value={passwordValue}
              onChange={(e) => handlePasswordChange(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none cursor-pointer"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mensaje Informativo (ej. modo invitado) */}
        {infoMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-indigo-500/10 border border-indigo-500/25 px-3 py-2 text-xs text-indigo-200">
            <Sparkles className="size-3.5 text-indigo-400 shrink-0" />
            <p className="leading-tight text-[11px]">{infoMessage}</p>
          </div>
        )}

        {/* Mensaje de Error */}
        {state.error && (
          <p aria-live="polite" className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs text-rose-300 leading-tight">
            {state.error}
          </p>
        )}

        {/* Botón Principal de Acceso en Indigo Institucional */}
        <button
          className="w-full mt-2 py-3 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer shadow-lg disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border border-indigo-500 shadow-[0_6px_20px_rgba(79,70,229,0.35)] hover:-translate-y-0.5"
          disabled={isPending}
          type="submit"
        >
          {isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-white" />}
          {isPending ? "Verificando acceso..." : "Ingresar al aula virtual"}
        </button>
      </form>
    </div>
  );
}
