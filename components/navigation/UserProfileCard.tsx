'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronDown, ShieldCheck, GraduationCap, Check } from 'lucide-react';
import { useProfile } from '@/context/profile-context';

interface UserProfileCardProps {
  currentView?: 'estudiante' | 'admin';
  className?: string;
  onNavigate?: () => void;
}

export function UserProfileCard({
  currentView = 'estudiante',
  className = '',
  onNavigate
}: UserProfileCardProps) {
  const router = useRouter();
  const { nombres, apellidos, iniciales, fotoPerfil, role } = useProfile();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Solo se considera que tiene 2 o más roles si es ADMIN o SUPERADMIN (o si está en vista admin)
  const hasMultipleRoles = role === 'ADMIN' || role === 'SUPERADMIN' || currentView === 'admin';

  const primerNombre = nombres ? nombres.trim().split(' ')[0] : (currentView === 'admin' ? 'Admin' : 'Estudiante');
  const primerApellido = apellidos ? apellidos.trim().split(' ')[0] : '';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLinkClick = () => {
    setOpen(false);
    if (onNavigate) onNavigate();
  };

  // CASO 1: USUARIO CON UN SOLO ROL (Estudiante regular)
  // Muestra nombre en fila 1 y badge de rol en fila 2; sin flecha ni menú desplegable
  if (!hasMultipleRoles) {
    return (
      <Link
        href="/dashboard/perfil"
        onClick={handleLinkClick}
        className={`flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group shadow-sm select-none ${className}`}
        title="Ver mi perfil"
      >
        <div className="relative size-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md ring-2 ring-indigo-400/30 shrink-0 overflow-hidden">
          {fotoPerfil ? (
            <img src={fotoPerfil} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            iniciales
          )}
        </div>
        <div className="min-w-0 flex-1">
          {/* Fila 1: Nombre completamente despejado */}
          <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
            {primerNombre} {primerApellido}
          </h4>
          {/* Fila 2: Rol del usuario */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold text-emerald-300 bg-emerald-500/15 rounded-md border border-emerald-500/25 truncate">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              Estudiante
            </span>
          </div>
        </div>
      </Link>
    );
  }

  // CASO 2: USUARIO CON 2 O MÁS ROLES (ADMIN / SUPERADMIN)
  // Fila 1: Nombre despejado para nombres largos
  // Fila 2: Badge del rol actual + flecha para expandir el selector de roles
  return (
    <div ref={containerRef} className={`relative w-full select-none ${className}`}>
      {/* Botón Tarjeta con Selector Integrado */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 text-left group shadow-sm cursor-pointer"
        title="Cambiar rol"
      >
        <div className="relative size-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md ring-2 ring-indigo-400/30 shrink-0 overflow-hidden">
          {fotoPerfil ? (
            <img src={fotoPerfil} alt="Foto de perfil" className="w-full h-full object-cover" />
          ) : (
            iniciales
          )}
        </div>

        <div className="min-w-0 flex-1">
          {/* Fila 1: Nombre totalmente libre y despejado para nombres largos */}
          <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
            {primerNombre} {primerApellido}
          </h4>

          {/* Fila 2: Badge del rol a la izquierda y Chevron a la derecha */}
          <div className="flex items-center justify-between gap-1.5 mt-0.5">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${
              currentView === 'admin'
                ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/25'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25'
            }`}>
              <span className={`size-1.5 rounded-full shrink-0 ${currentView === 'admin' ? 'bg-indigo-400' : 'bg-emerald-400 animate-pulse'}`} />
              {currentView === 'admin' ? 'Administrador' : 'Estudiante'}
            </span>

            <ChevronDown
              className={`size-3.5 text-slate-400 group-hover:text-white transition-transform duration-200 shrink-0 ${
                open ? 'rotate-180 text-white' : ''
              }`}
            />
          </div>
        </div>
      </button>

      {/* Menú Desplegable Exclusivo de Roles (Sin "Mi perfil", ya que está en el sidebar) */}
      {open && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-1.5 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95">
          <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Cambiar rol
          </div>

          {/* Opción 1: Vista Estudiante */}
          {currentView === 'estudiante' ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-300 font-semibold cursor-default">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-emerald-400" />
                <span>Estudiante</span>
              </div>
              <Check className="size-3.5 text-emerald-400" />
            </div>
          ) : (
            <Link
              href="/dashboard"
              onClick={handleLinkClick}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium"
            >
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-slate-400" />
                <span>Ver como Estudiante</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                Ir →
              </span>
            </Link>
          )}

          {/* Opción 2: Vista Administrador */}
          {currentView === 'admin' ? (
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-indigo-500/10 text-indigo-300 font-semibold cursor-default mt-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-indigo-400" />
                <span>Administrador</span>
              </div>
              <Check className="size-3.5 text-indigo-400" />
            </div>
          ) : (
            <Link
              href="/admin"
              onClick={handleLinkClick}
              className="flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-colors font-medium mt-1"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-slate-400" />
                <span>Panel Administrador</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">
                Ir →
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default UserProfileCard;
