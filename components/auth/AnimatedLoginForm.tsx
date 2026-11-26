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
  ArrowLeft,
  KeyRound,
  Mail,
  CheckCircle2
} from "lucide-react";
import { loginWithDni, type LoginState } from "@/actions/auth";
import { limpiarSesionLocal } from "@/context/profile-context";
import { cerrarSesionUsuario } from "@/lib/auth/logout";

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

  // Estados para Recuperación / Restablecimiento de Contraseña
  const [modoRecuperar, setModoRecuperar] = useState(false);
  const [recuperarPaso, setRecuperarPaso] = useState<1 | 2 | 3>(1);
  const [recuperarUsuario, setRecuperarUsuario] = useState("");
  const [recuperarEmail, setRecuperarEmail] = useState("");
  const [recuperarToken, setRecuperarToken] = useState("");
  const [recuperarNombre, setRecuperarNombre] = useState("");
  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [mostrarNuevaPassword, setMostrarNuevaPassword] = useState(false);
  const [cargandoRecuperar, setCargandoRecuperar] = useState(false);
  const [recuperarError, setRecuperarError] = useState<string | null>(null);
  const [cerrandoSesion, setCerrandoSesion] = useState(false);
  const [fotoError, setFotoError] = useState(false);

  const dniInputRef = useRef<HTMLInputElement>(null);

  // Limpiar cualquier residuo de sesión local previa al cargar la pantalla de login
  useEffect(() => {
    limpiarSesionLocal();
  }, []);

  // Escuchar si se activa/desactiva el modo invitado desde el botón superior o URL
  useEffect(() => {
    const activarInvitado = () => {
      setDniValue("71234567");
      setPasswordValue("71234567");
      setInfoMessage("Credenciales de invitado cargadas (Usuario: 71234567). Pulsa en 'Ingresar al aula virtual'.");
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

  // Manejador: Verificar identidad (Paso 1)
  const handleVerificarIdentidad = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecuperarError(null);

    const usuarioLimpio = recuperarUsuario.trim();
    const emailLimpio = recuperarEmail.trim().toLowerCase();

    if (!usuarioLimpio || !emailLimpio) {
      setRecuperarError("Por favor completa tu usuario y correo electrónico registrado.");
      return;
    }

    setCargandoRecuperar(true);
    try {
      const res = await fetch("/api/auth/recuperar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "verificar",
          usuario: usuarioLimpio,
          email: emailLimpio,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRecuperarError(data.error || "No se pudo verificar tu cuenta.");
      } else {
        setRecuperarToken(data.token);
        setRecuperarNombre(data.nombre || "Estudiante");
        setRecuperarPaso(2);
      }
    } catch (err: any) {
      setRecuperarError("Error de conexión al verificar tus datos.");
    } finally {
      setCargandoRecuperar(false);
    }
  };

  // Manejador: Guardar nueva contraseña (Paso 2)
  const handleGuardarNuevaPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecuperarError(null);

    if (nuevaPassword.length < 6) {
      setRecuperarError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setRecuperarError("Las contraseñas no coinciden.");
      return;
    }

    setCargandoRecuperar(true);
    try {
      const res = await fetch("/api/auth/recuperar-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "restablecer",
          token: recuperarToken,
          password: nuevaPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setRecuperarError(data.error || "No se pudo actualizar la contraseña.");
      } else {
        setRecuperarPaso(3);
      }
    } catch (err: any) {
      setRecuperarError("Error de conexión al actualizar la contraseña.");
    } finally {
      setCargandoRecuperar(false);
    }
  };

  // -------------------------------------------------------------
  // VISTA 1: Flujo de Recuperación / Restablecimiento de Contraseña
  // -------------------------------------------------------------
  if (modoRecuperar) {
    return (
      <div className={`w-full max-w-[380px] text-center animate-fadeInUp-box opacity-0 [animation-fill-mode:forwards] ${className}`}>
        {/* Logotipo Oficial */}
        <div className="flex flex-col items-center justify-center mb-6 select-none">
          <img
            src="/logo-blanco.png"
            alt="EDUMIN"
            className="h-11 sm:h-12 w-auto object-contain drop-shadow"
          />
        </div>

        {/* PASO 1: Ingreso de Usuario y Correo Registrado */}
        {recuperarPaso === 1 && (
          <div>
            <div className="mb-6">
              <div className="size-12 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                <KeyRound className="size-6" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Restablecer contraseña
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ingresa tu usuario y correo registrado para verificar tu identidad
              </p>
            </div>

            <form onSubmit={handleVerificarIdentidad} className="space-y-4 text-left" noValidate>
              {/* Campo Usuario */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="rec-usuario">
                  Usuario
                </label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="rec-usuario"
                    className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={recuperarUsuario}
                    onChange={(e) => setRecuperarUsuario(e.target.value)}
                    placeholder="Ingresa tu usuario"
                    required
                  />
                </div>
              </div>

              {/* Campo Correo Registrado */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="rec-email">
                  Correo electrónico registrado
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="rec-email"
                    type="email"
                    className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={recuperarEmail}
                    onChange={(e) => setRecuperarEmail(e.target.value)}
                    placeholder="ejemplo@correo.com"
                    required
                  />
                </div>
              </div>

              {recuperarError && (
                <p className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs text-rose-300 leading-tight">
                  {recuperarError}
                </p>
              )}

              <button
                type="submit"
                disabled={cargandoRecuperar}
                className="w-full mt-2 py-3 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer shadow-lg disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border border-indigo-500 shadow-[0_6px_20px_rgba(79,70,229,0.35)]"
              >
                {cargandoRecuperar && <LoaderCircle className="size-4 animate-spin text-white" />}
                {cargandoRecuperar ? "Verificando identidad..." : "Verificar datos"}
              </button>

              <button
                type="button"
                onClick={() => setModoRecuperar(false)}
                className="w-full text-center text-xs text-slate-400 hover:text-white transition mt-3 flex items-center justify-center gap-1.5 cursor-pointer py-1"
              >
                <ArrowLeft className="size-3.5" />
                <span>Volver al formulario de acceso</span>
              </button>
            </form>
          </div>
        )}

        {/* PASO 2: Nueva Contraseña */}
        {recuperarPaso === 2 && (
          <div>
            <div className="mb-6">
              <div className="size-12 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-3 shadow-inner">
                <LockKeyhole className="size-6" />
              </div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                Nueva contraseña
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Hola {recuperarNombre}, ingresa tu nueva contraseña de acceso
              </p>
            </div>

            <form onSubmit={handleGuardarNuevaPassword} className="space-y-4 text-left" noValidate>
              {/* Nueva Contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="nueva-pass">
                  Nueva contraseña
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="nueva-pass"
                    type={mostrarNuevaPassword ? "text" : "password"}
                    className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-11 pr-11 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={nuevaPassword}
                    onChange={(e) => setNuevaPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setMostrarNuevaPassword(!mostrarNuevaPassword)}
                    className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-white cursor-pointer"
                  >
                    {mostrarNuevaPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {/* Confirmar Contraseña */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="conf-pass">
                  Confirmar contraseña
                </label>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="conf-pass"
                    type={mostrarNuevaPassword ? "text" : "password"}
                    className="h-11 w-full rounded-xl border border-white/15 bg-white/[0.05] pl-11 pr-4 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    value={confirmarPassword}
                    onChange={(e) => setConfirmarPassword(e.target.value)}
                    placeholder="Repite tu nueva contraseña"
                    required
                  />
                </div>
              </div>

              {recuperarError && (
                <p className="rounded-xl bg-rose-500/15 border border-rose-500/30 px-3 py-2 text-xs text-rose-300 leading-tight">
                  {recuperarError}
                </p>
              )}

              <button
                type="submit"
                disabled={cargandoRecuperar}
                className="w-full mt-2 py-3 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer shadow-lg disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border border-indigo-500 shadow-[0_6px_20px_rgba(79,70,229,0.35)]"
              >
                {cargandoRecuperar && <LoaderCircle className="size-4 animate-spin text-white" />}
                {cargandoRecuperar ? "Guardando contraseña..." : "Guardar y actualizar"}
              </button>
            </form>
          </div>
        )}

        {/* PASO 3: Éxito */}
        {recuperarPaso === 3 && (
          <div className="space-y-4 py-2">
            <div className="size-14 mx-auto rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="size-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                ¡Contraseña restablecida!
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-1 max-w-xs mx-auto">
                Tu contraseña ha sido actualizada correctamente. Ya puedes ingresar al aula virtual con tus nuevas credenciales.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDniValue(recuperarUsuario);
                setPasswordValue("");
                setModoRecuperar(false);
                setRecuperarPaso(1);
                setTimeout(() => {
                  const passInput = document.getElementById("password");
                  passInput?.focus();
                }, 100);
              }}
              className="w-full py-3 px-6 rounded-xl text-sm font-bold text-white transition-all duration-200 cursor-pointer shadow-lg flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 border border-emerald-500 shadow-[0_6px_20px_rgba(16,185,129,0.35)] mt-4"
            >
              <span>Iniciar sesión ahora</span>
              <ArrowRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // VISTA 2: Selector de Roles (Múltiples perfiles)
  // -------------------------------------------------------------
  if (state.requiresRoleSelection && state.userRoles && state.userRoles.length > 0) {
    const primerNombre = state.userName?.split(" ")[0] || "bienvenido";
    const iniciales = state.userName
      ? state.userName
          .split(" ")
          .filter(Boolean)
          .slice(0, 2)
          .map((n) => n[0].toUpperCase())
          .join("")
      : "U";

    return (
      <div className={`w-full max-w-[400px] text-center animate-fadeInUp-box opacity-0 [animation-fill-mode:forwards] space-y-6 ${className}`}>
        {/* Cabecera del Selector de Roles con Foto de Perfil */}
        <div className="flex flex-col items-center justify-center select-none">
          <div className="relative size-16 sm:size-20 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 text-white font-extrabold flex items-center justify-center text-xl sm:text-2xl shadow-xl ring-4 ring-indigo-500/30 mb-3.5 shrink-0 overflow-hidden">
            {state.userPhoto && !fotoError ? (
              <img
                src={state.userPhoto}
                alt="Foto de perfil"
                className="w-full h-full object-cover"
                onError={() => setFotoError(true)}
              />
            ) : (
              <span>{iniciales}</span>
            )}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Hola, {primerNombre}
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
                onClick={() => {
                  document.cookie = `edumin_active_view=${esEstudiante ? 'estudiante' : 'admin'}; path=/; max-age=31536000; SameSite=Lax`;
                  router.push(rol.ruta);
                }}
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
                  <span className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors block">
                    {rol.titulo}
                  </span>
                </div>

                <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-1 shrink-0 ml-2" />
              </button>
            );
          })}
        </div>

        <div className="pt-2">
          <button
            type="button"
            disabled={cerrandoSesion}
            onClick={async () => {
              setCerrandoSesion(true);
              await cerrarSesionUsuario();
              window.location.href = '/login';
            }}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer disabled:opacity-60"
          >
            {cerrandoSesion ? (
              <LoaderCircle className="size-3.5 animate-spin" />
            ) : (
              <ArrowLeft className="size-3.5" />
            )}
            <span>{cerrandoSesion ? "Cerrando sesión..." : "Volver al formulario de acceso"}</span>
          </button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VISTA 3: Formulario de Inicio de Sesión Limpio y Unificado
  // -------------------------------------------------------------
  return (
    <div className={`w-full max-w-[380px] text-center animate-fadeInUp-box opacity-0 [animation-fill-mode:forwards] ${className}`}>
      {/* Logotipo Oficial Horizontal */}
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
        {/* Campo Usuario */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="dni">
            Usuario
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
              placeholder="Ingresa tu usuario"
              required
            />
          </div>
        </div>

        {/* Campo Contraseña con Enlace de Recuperación */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-300 tracking-wide block" htmlFor="password">
              Contraseña
            </label>
            <button
              type="button"
              onClick={() => {
                setModoRecuperar(true);
                setRecuperarPaso(1);
                setRecuperarUsuario(dniValue);
                setRecuperarEmail("");
                setRecuperarError(null);
              }}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition cursor-pointer hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </button>
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
        <div className="pt-2">
          <button
            className="w-full h-12 py-3 px-6 rounded-xl text-sm font-bold text-white transition-colors duration-200 cursor-pointer shadow-lg disabled:cursor-not-allowed disabled:opacity-60 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border border-indigo-500 shadow-[0_6px_20px_rgba(79,70,229,0.35)]"
            disabled={isPending}
            type="submit"
          >
            {isPending && <LoaderCircle aria-hidden="true" className="size-4 animate-spin text-white" />}
            {isPending ? "Verificando acceso..." : "Ingresar al aula virtual"}
          </button>
        </div>
      </form>
    </div>
  );
}
