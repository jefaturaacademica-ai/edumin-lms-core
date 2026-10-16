"use client";

import React, { useActionState, useState, useRef, useEffect } from "react";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, UserRound, Sparkles, CheckCircle2 } from "lucide-react";
import { loginWithDni, type LoginState } from "@/actions/auth";

const initialState: LoginState = {};

interface AnimatedLoginFormProps {
  className?: string;
}

export function AnimatedLoginForm({ className = "" }: AnimatedLoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginWithDni, initialState);

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"estudiantes" | "invitado" | "administrativo" | "docente">("estudiantes");
  const [showPassword, setShowPassword] = useState(false);
  const [dniValue, setDniValue] = useState("");
  const [passwordValue, setPasswordValue] = useState("");
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const dniInputRef = useRef<HTMLInputElement>(null);

  const handleToggleAdmin = (checked: boolean) => {
    setIsAdminMode(checked);
    setInfoMessage(null);
    if (checked) {
      setActiveTab("administrativo");
      setDniValue("");
      setPasswordValue("");
    } else {
      setActiveTab("estudiantes");
      setDniValue("");
      setPasswordValue("");
    }
  };

  const handleSelectTab = (tab: "estudiantes" | "invitado" | "administrativo" | "docente") => {
    setActiveTab(tab);
    if (tab === "invitado") {
      setDniValue("71234567");
      setPasswordValue("71234567");
      setInfoMessage("Credenciales de invitado cargadas (DNI: 71234567). Pulsa 'Ingresar al Aula Virtual'.");
    } else if (tab === "estudiantes") {
      setDniValue("");
      setPasswordValue("");
      setInfoMessage(null);
      dniInputRef.current?.focus();
    } else if (tab === "administrativo") {
      setDniValue("11111111");
      setPasswordValue("11111111");
      setInfoMessage("Credenciales de Administrador cargadas (DNI: 11111111).");
    } else if (tab === "docente") {
      setDniValue("");
      setPasswordValue("");
      setInfoMessage("Ingresa con tu DNI de docente asignado.");
      dniInputRef.current?.focus();
    }
  };

  return (
    <div className={`w-full max-w-[380px] text-center animate-fadeInUp-box opacity-0 [animation-fill-mode:forwards] ${className}`}>
      {/* Logos Institucionales */}
      <h1 className="text-3xl sm:text-4xl font-black tracking-[1.5px] text-white uppercase select-none">
        EDUMIN
      </h1>
      <p className="text-[11px] sm:text-xs tracking-[2px] uppercase text-slate-400 mt-1 mb-6 font-semibold select-none">
        Plataforma Educativa Minera
      </p>

      {/* Título Dinámico según Modo */}
      <div className="mb-6">
        <h2 className="text-sm sm:text-base font-semibold text-slate-200 tracking-wide transition-all duration-300">
          {isAdminMode ? "Acceso de Gestión y Docencia" : "Iniciar sesión a través de SSO"}
        </h2>
      </div>

      {/* Botones Selectores Dinámicos (Estudiantes / Invitado o Administrativo / Docente) */}
      <div className="grid grid-cols-2 gap-2.5 mb-6">
        {!isAdminMode ? (
          <>
            <button
              type="button"
              onClick={() => handleSelectTab("estudiantes")}
              className={`w-full py-3 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer border ${
                activeTab === "estudiantes"
                  ? "bg-[#f97316] border-[#f97316] text-white shadow-[0_4px_16px_rgba(249,115,22,0.35)] scale-[1.02]"
                  : "bg-white/[0.05] border-white/20 text-slate-300 hover:border-white/40 hover:bg-white/[0.08]"
              }`}
            >
              Estudiantes
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("invitado")}
              className={`w-full py-3 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer border ${
                activeTab === "invitado"
                  ? "bg-[#f97316] border-[#f97316] text-white shadow-[0_4px_16px_rgba(249,115,22,0.35)] scale-[1.02]"
                  : "bg-white/[0.05] border-white/20 text-slate-300 hover:border-white/40 hover:bg-white/[0.08]"
              }`}
            >
              Invitado
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleSelectTab("administrativo")}
              className={`w-full py-3 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer border ${
                activeTab === "administrativo"
                  ? "bg-[#f97316] border-[#f97316] text-white shadow-[0_4px_16px_rgba(249,115,22,0.35)] scale-[1.02]"
                  : "bg-white/[0.05] border-white/20 text-slate-300 hover:border-white/40 hover:bg-white/[0.08]"
              }`}
            >
              Administrativo
            </button>
            <button
              type="button"
              onClick={() => handleSelectTab("docente")}
              className={`w-full py-3 px-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 cursor-pointer border ${
                activeTab === "docente"
                  ? "bg-[#f97316] border-[#f97316] text-white shadow-[0_4px_16px_rgba(249,115,22,0.35)] scale-[1.02]"
                  : "bg-white/[0.05] border-white/20 text-slate-300 hover:border-white/40 hover:bg-white/[0.08]"
              }`}
            >
              Docente
            </button>
          </>
        )}
      </div>

      {/* Formulario de Inicio de Sesión */}
      <form action={formAction} className="space-y-4 text-left" noValidate>
        {/* Campo DNI */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="dni">
            {isAdminMode ? "Documento de Identidad (Admin/Docente)" : "DNI o Carnet de Extranjería"}
          </label>
          <div className="relative">
            <UserRound
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={dniInputRef}
              autoComplete="username"
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20"
              id="dni"
              name="dni"
              value={dniValue}
              onChange={(e) => setDniValue(e.target.value)}
              placeholder={isAdminMode ? "Ej. 11111111" : "Ingresa tu número de DNI"}
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
              className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#f97316] focus:ring-2 focus:ring-[#f97316]/20"
              id="password"
              name="password"
              value={passwordValue}
              onChange={(e) => setPasswordValue(e.target.value)}
              placeholder="Ingresa tu contraseña"
              required
              type={showPassword ? "text" : "password"}
            />
            <button
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-white/10 hover:text-white focus:outline-none"
              onClick={() => setShowPassword((visible) => !visible)}
              type="button"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>

        {/* Mensaje Informativo (ej. modo invitado) */}
        {infoMessage && (
          <div className="flex items-center gap-2 rounded-xl bg-orange-500/10 border border-orange-500/20 px-3 py-2 text-xs text-orange-200">
            <Sparkles className="size-3.5 text-[#f97316] shrink-0" />
            <p className="leading-tight text-[11px]">{infoMessage}</p>
          </div>
        )}

        {/* Mensaje de Error */}
        {state.error && (
          <p aria-live="polite" className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs text-rose-300 leading-tight">
            {state.error}
          </p>
        )}

        {/* Botón Principal de Acceso (Estilo .btn-sso) */}
        <button
          className="w-full mt-2 py-3.5 px-6 rounded-full text-sm font-bold text-white transition-all duration-300 cursor-pointer shadow-lg disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 bg-[#f97316] hover:bg-orange-600 border border-[#f97316] shadow-[0_6px_20px_rgba(249,115,22,0.35)] hover:-translate-y-0.5"
          disabled={isPending}
          type="submit"
        >
          {isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-white" />}
          {isPending
            ? "Verificando acceso..."
            : isAdminMode
            ? "Ingresar al Panel de Gestión"
            : "Ingresar al Aula Virtual"}
        </button>
      </form>

      {/* Switch Toggle Institucional al Pie (Lado Administrativo / Estudiante) */}
      <div className="mt-8 pt-6 border-t border-white/[0.08] flex items-center justify-center gap-3 animate-fadeIn-admin opacity-0 [animation-fill-mode:forwards]">
        <label className="edumin-switch">
          <input
            type="checkbox"
            checked={isAdminMode}
            onChange={(e) => handleToggleAdmin(e.target.checked)}
          />
          <span className="edumin-slider"></span>
        </label>
        <span
          className={`text-xs select-none transition-all duration-200 ${
            isAdminMode ? "font-bold text-white" : "font-medium text-slate-400"
          }`}
        >
          {isAdminMode ? "Acceso de Gestión y Docencia" : "Inicio de sesión de administrador"}
        </span>
      </div>
    </div>
  );
}
