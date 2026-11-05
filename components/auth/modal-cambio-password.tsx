'use client';

import React, { useState } from 'react';
import { ShieldCheck, KeyRound, CheckCircle2, Lock, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';

interface ModalCambioPasswordProps {
  nombres?: string;
  dni?: string;
  onCompletado: () => void;
}

export function ModalCambioPassword({ nombres, dni, onCompletado }: ModalCambioPasswordProps) {
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [exitoMsg, setExitoMsg] = useState<string | null>(null);

  // Manejar cambiar contraseña
  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (nuevaPassword.length < 6) {
      setErrorMsg('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (nuevaPassword !== confirmarPassword) {
      setErrorMsg('Las contraseñas no coinciden.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('/api/dashboard/seguridad-credenciales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'cambiar_password',
          password: nuevaPassword
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExitoMsg('¡Contraseña actualizada correctamente! Ingresando a tu aula...');
        setTimeout(() => {
          onCompletado();
        }, 1200);
      } else {
        setErrorMsg(data.error || 'No se pudo actualizar la contraseña.');
      }
    } catch (err: any) {
      setErrorMsg(`Error de conexión: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  // Manejar mantener contraseña actual (por defecto DNI)
  const handleMantenerActual = async () => {
    setCargando(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/dashboard/seguridad-credenciales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'mantener_actual'
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onCompletado();
      } else {
        setErrorMsg(data.error || 'No se pudo registrar la preferencia.');
      }
    } catch (err: any) {
      setErrorMsg(`Error de conexión: ${err.message}`);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 overflow-hidden text-slate-900 dark:text-slate-100">
        
        {/* Glow decorativo de fondo */}
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Encabezado */}
        <div className="flex items-center gap-3 mb-4">
          <div className="size-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
            <KeyRound className="size-6" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              {nombres ? `¡Hola, ${nombres.split(' ')[0]}!` : '¡Te damos la bienvenida al Aula Virtual!'}
            </h2>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
          Tu cuenta fue configurada con tu número de documento como contraseña inicial. Si lo deseas, puedes establecer una nueva contraseña a continuación o mantener la actual.
        </p>

        {/* Mensaje de Éxito */}
        {exitoMsg && (
          <div className="mb-4 p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-300 font-semibold animate-in fade-in">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{exitoMsg}</span>
          </div>
        )}

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="mb-4 p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-700 dark:text-rose-300 font-semibold">
            {errorMsg}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleCambiarPassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Nueva contraseña
            </label>
            <div className="relative">
              <Lock className="size-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type={mostrarPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={nuevaPassword}
                onChange={(e) => setNuevaPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
              <button
                type="button"
                onClick={() => setMostrarPassword(!mostrarPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                {mostrarPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Confirma tu nueva contraseña
            </label>
            <div className="relative">
              <Lock className="size-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
              <input
                type={mostrarPassword ? "text" : "password"}
                placeholder="Repite la contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <button
              type="submit"
              disabled={cargando || !nuevaPassword.trim()}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <KeyRound className="size-4" />
              {cargando ? 'Guardando...' : 'Establecer nueva contraseña y continuar'}
            </button>

            <button
              type="button"
              disabled={cargando}
              onClick={handleMantenerActual}
              className="w-full py-2.5 px-4 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>Mantener mi contraseña actual (por defecto)</span>
              <ArrowRight className="size-3.5 text-slate-400" />
            </button>
          </div>
        </form>

        <p className="mt-4 text-[11px] text-center text-slate-400">
          Podrás modificar tu contraseña en cualquier momento desde tu menú de perfil.
        </p>
      </div>
    </div>
  );
}
