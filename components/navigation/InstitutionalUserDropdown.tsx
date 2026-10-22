'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ChevronDown, 
  ShieldCheck, 
  GraduationCap, 
  Settings, 
  Key, 
  LogOut, 
  Check 
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface InstitutionalUserDropdownProps {
  className?: string;
}

export default function InstitutionalUserDropdown({ className = '' }: InstitutionalUserDropdownProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState<string>('Usuario');
  const [userEmail, setUserEmail] = useState<string>('');
  const [userRole, setUserRole] = useState<string>('ESTUDIANTE');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  // Solo los administradores reales pueden ver opciones de administrador o alternar
  const isRealAdmin = userRole === 'ADMIN' || userRole === 'SUPERADMIN';

  // El texto del botón:
  // - Si el usuario es ESTUDIANTE: Siempre dirá "Estudiante"
  // - Si el usuario es ADMIN o SUPERADMIN: Dirá "Administrador" en /admin, o "Estudiante" en /dashboard
  const rolMostrado = isRealAdmin 
    ? (isAdminRoute ? 'Administrador' : 'Estudiante')
    : 'Estudiante';

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/dashboard/me');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            if (data.profile.role) {
              setUserRole(String(data.profile.role).toUpperCase());
            }
            if (data.profile.nombres) {
              setUserName(`${data.profile.nombres} ${data.profile.apellidos || ''}`.trim());
            }
            if (data.profile.email) {
              setUserEmail(data.profile.email);
            }
          }
        }
      } catch (e) {
        console.error('Error fetching user data in dropdown:', e);
      }
    };
    fetchUserData();
  }, [pathname]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div ref={dropdownRef} className={`relative flex items-center select-none ${className}`}>
      
      {/* Botón Principal del Rol: Estudiante ▾ o Administrador ▾ */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700/80 hover:border-slate-600 transition-all font-sans text-xs font-bold shadow-sm cursor-pointer"
      >
        <span>{rolMostrado}</span>
        <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* MENÚ DESPLEGABLE CON CONTROL DE ACCESO RBAC */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 font-sans divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 text-xs">
          
          {/* Cabecera del Usuario (Identificación rápida) */}
          <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40">
            <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{userName}</p>
            {userEmail && <p className="text-[10px] text-slate-400 tabular-nums truncate">{userEmail}</p>}
          </div>

          {/* Opciones de Navegación según Rol Real */}
          <div className="py-1">
            {/* Opción 1: Ingresar como administrador (ESTRICTAMENTE SOLO PARA ROL ADMIN / SUPERADMIN) */}
            {isRealAdmin && (
              <Link
                href="/admin"
                onClick={() => setDropdownOpen(false)}
                className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                  isAdminRoute 
                    ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 font-bold' 
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="size-4 text-indigo-500" />
                  <span>Ingresar como administrador</span>
                </div>
                {isAdminRoute && <Check className="size-3.5 text-indigo-500" />}
              </Link>
            )}

            {/* Opción 2: Ingresar como estudiante (disponible para todos) */}
            <Link
              href="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className={`flex items-center justify-between px-4 py-2.5 transition-colors ${
                isDashboardRoute 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="size-4 text-emerald-500" />
                <span>Ingresar como estudiante</span>
              </div>
              {isDashboardRoute && <Check className="size-3.5 text-emerald-500" />}
            </Link>
          </div>

          {/* 3. Configuración (ESTRICTAMENTE SOLO PARA ROL ADMIN / SUPERADMIN) */}
          {isRealAdmin && (
            <div className="py-1">
              <Link
                href="/admin/configuracion"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
              >
                <Settings className="size-4 text-slate-400" />
                <span>Configuración</span>
              </Link>
            </div>
          )}

          {/* 4. Cambiar contraseña & 5. Cerrar sesión */}
          <div className="py-1">
            <Link
              href="/actualizar-credenciales"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <Key className="size-4 text-slate-400" />
              <span>Cambiar contraseña</span>
            </Link>
            
            <button
              onClick={() => {
                setDropdownOpen(false);
                handleLogout();
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold transition-colors text-left cursor-pointer"
            >
              <LogOut className="size-4" />
              <span>Cerrar sesión</span>
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
