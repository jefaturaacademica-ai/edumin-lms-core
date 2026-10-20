'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, UserRound, GraduationCap } from 'lucide-react';

export function LoginHeaderActions() {
  const [esModoInvitado, setEsModoInvitado] = useState(false);

  useEffect(() => {
    const handleModo = (e: any) => {
      if (typeof e.detail?.activo === 'boolean') {
        setEsModoInvitado(e.detail.activo);
      }
    };
    window.addEventListener('modo-invitado-cambiado', handleModo);
    return () => window.removeEventListener('modo-invitado-cambiado', handleModo);
  }, []);

  const handleToggleInvitado = () => {
    const nuevoModo = !esModoInvitado;
    setEsModoInvitado(nuevoModo);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('toggle-modo-invitado', {
          detail: { modo: nuevoModo ? 'invitado' : 'estudiante' }
        })
      );
    }
  };

  return (
    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-30 flex items-center gap-2 sm:gap-3">
      {/* Botón Alternable: Iniciar sesión como invitado / Iniciar sesión como estudiante */}
      <button
        type="button"
        onClick={handleToggleInvitado}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md backdrop-blur-md ${
          esModoInvitado
            ? 'text-indigo-200 bg-indigo-950/80 hover:bg-indigo-900/90 border border-indigo-500/50 ring-2 ring-indigo-500/20'
            : 'text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80'
        }`}
        title={
          esModoInvitado
            ? 'Limpiar credenciales y volver al modo estudiante'
            : 'Cargar credenciales de demostración de invitado'
        }
      >
        {esModoInvitado ? (
          <>
            <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Iniciar sesión como estudiante</span>
          </>
        ) : (
          <>
            <UserRound className="w-3.5 h-3.5 text-indigo-400" />
            <span>Iniciar sesión como invitado</span>
          </>
        )}
      </button>

      {/* Botón ÚNICO Validar certificado (Abre en una nueva pestaña) */}
      <Link
        href="/validar"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 shadow-md backdrop-blur-md transition-all group"
      >
        <ShieldCheck className="w-4 h-4 text-indigo-400 transition-transform group-hover:scale-110" />
        <span>Validar certificado</span>
      </Link>
    </div>
  );
}
