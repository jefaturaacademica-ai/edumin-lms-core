'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Bell, 
  HelpCircle, 
  ChevronDown, 
  ShieldCheck, 
  GraduationCap, 
  Settings, 
  Key, 
  LogOut, 
  Check, 
  Video, 
  MessageSquare, 
  BookOpen, 
  Info, 
  TrendingUp,
  User,
  Sparkles
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface InstitutionalUserDropdownProps {
  className?: string;
}

export default function InstitutionalUserDropdown({ className = '' }: InstitutionalUserDropdownProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [userRole, setUserRole] = useState<string>('Jefatura');
  const [userName, setUserName] = useState<string>('Dirección General');
  const [userEmail, setUserEmail] = useState<string>('admin@edumin.pe');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const isAdminRoute = pathname.startsWith('/admin');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const res = await fetch('/api/dashboard/me');
        if (res.ok) {
          const data = await res.json();
          if (data.profile) {
            const role = data.profile.role;
            if (role === 'SUPERADMIN' || role === 'ADMIN') {
              setUserRole('Jefatura');
            } else if (role === 'DOCENTE') {
              setUserRole('Docente');
            } else {
              setUserRole('Estudiante');
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

  // Cerrar dropdown al hacer click afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setNotificationsOpen(false);
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
    <div ref={dropdownRef} className={`relative flex items-center gap-2 select-none ${className}`}>
      
      {/* Botón de Notificaciones (Campana) */}
      <div className="relative">
        <button
          onClick={() => {
            setNotificationsOpen(!notificationsOpen);
            setDropdownOpen(false);
          }}
          title="Notificaciones del Sistema"
          className="size-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors relative cursor-pointer"
        >
          <Bell className="size-4" />
          <span className="absolute top-1.5 right-1.5 size-2 bg-emerald-500 rounded-full ring-2 ring-slate-950 animate-pulse"></span>
        </button>

        {/* Modal/Pop de Notificaciones */}
        {notificationsOpen && (
          <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 text-xs animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2 mb-3">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Bell className="size-3.5 text-indigo-600 dark:text-indigo-400" /> Notificaciones
              </span>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold">
                2 nuevas
              </span>
            </div>
            <div className="space-y-2">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Sistema EDUMIN en tiempo real</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Base de datos de alumnos y certificaciones sincronizada con Supabase.</p>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-800 dark:text-slate-200 text-[11px]">Simulador de Estudiante FULL</p>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Puedes alternar entre Administrador y Estudiante en cualquier momento.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Botón de Ayuda (Interrogación) */}
      <button
        onClick={() => setInfoModalOpen(true)}
        title="Centro de Ayuda & Guía del Sistema"
        className="size-9 rounded-xl flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
      >
        <HelpCircle className="size-4" />
      </button>

      {/* Botón Principal de Usuario / Rol (Estilo Jefatura ▾) */}
      <button
        onClick={() => {
          setDropdownOpen(!dropdownOpen);
          setNotificationsOpen(false);
        }}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all font-sans text-xs font-bold cursor-pointer"
      >
        <span>{userRole}</span>
        <ChevronDown className={`size-3.5 text-slate-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* MENÚ DESPLEGABLE INSTITUCIONAL */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 font-sans divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200 text-xs">
          
          {/* Cabecera del Usuario */}
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md">
                AD
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-slate-900 dark:text-white text-xs truncate">{userName}</p>
                <p className="text-[10px] text-slate-400 font-mono truncate">{userEmail}</p>
                <span className="inline-block mt-0.5 text-[9px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide">
                  Rol activo: {userRole}
                </span>
              </div>
            </div>
          </div>

          {/* Grupo 1: Enlaces Académicos */}
          <div className="py-1">
            <Link
              href="/dashboard/cursos"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <Video className="size-3.5 text-slate-400" />
              <span>Conferencias y grabaciones</span>
            </Link>
            <Link
              href="/admin/alumnos-riesgo"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <MessageSquare className="size-3.5 text-slate-400" />
              <span>Mis tickets y alertas</span>
            </Link>
            <Link
              href="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <BookOpen className="size-3.5 text-indigo-500" />
              <span>EDUMIN Academy (Aula)</span>
            </Link>
            <button
              onClick={() => {
                setDropdownOpen(false);
                setInfoModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors text-left cursor-pointer"
            >
              <Info className="size-3.5 text-slate-400" />
              <span>Acerca de EDUMIN LMS</span>
            </button>
          </div>

          {/* Grupo 2: CAMBIO DE ROL / VISTA (El requerimiento solicitado) */}
          <div className="py-1 bg-indigo-50/50 dark:bg-indigo-950/20">
            <div className="px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
              Modo de navegación
            </div>

            {/* Opción A: Ingresar como Administrador */}
            <Link
              href="/admin"
              onClick={() => setDropdownOpen(false)}
              className={`flex items-center justify-between px-4 py-2 transition-colors ${
                isAdminRoute 
                  ? 'bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-900 dark:text-indigo-200 font-bold' 
                  : 'hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="size-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Ingresar como administrador</span>
              </div>
              {isAdminRoute && <Check className="size-3.5 text-indigo-600 dark:text-indigo-400" />}
            </Link>

            {/* Opción B: Ingresar como Docente */}
            <button
              onClick={() => {
                alert('Modo Docente: En este modo se gestionan grabaciones y foros temáticos asignados a la plana docente.');
                setDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 text-slate-700 dark:text-slate-300 transition-colors text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <User className="size-3.5 text-slate-400" />
                <span>Ingresar como docente</span>
              </div>
            </button>

            {/* Opción C: Ingresar como Estudiante (Paquete FULL) */}
            <Link
              href="/dashboard"
              onClick={() => setDropdownOpen(false)}
              className={`flex items-center justify-between px-4 py-2 transition-colors ${
                isDashboardRoute 
                  ? 'bg-emerald-100/70 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 font-bold' 
                  : 'hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">Ingresar como estudiante (FULL)</span>
              </div>
              {isDashboardRoute && <Check className="size-3.5 text-emerald-600 dark:text-emerald-400" />}
            </Link>
          </div>

          {/* Grupo 3: Configuración y Auditoría */}
          <div className="py-1">
            <Link
              href="/admin/configuracion"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <Settings className="size-3.5 text-slate-400" />
              <span>Configuración</span>
            </Link>
            <Link
              href="/admin/auditoria"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <TrendingUp className="size-3.5 text-slate-400" />
              <span>Mejora continua & auditoría</span>
            </Link>
          </div>

          {/* Grupo 4: Seguridad y Cierre */}
          <div className="py-1">
            <Link
              href="/actualizar-credenciales"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition-colors"
            >
              <Key className="size-3.5 text-slate-400" />
              <span>Cambiar contraseña</span>
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold transition-colors text-left cursor-pointer"
            >
              <LogOut className="size-3.5" />
              <span>Cerrar sesión</span>
            </button>
          </div>

        </div>
      )}

      {/* Modal Informativo "Acerca de EDUMIN LMS" */}
      {infoModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center animate-in zoom-in-95">
            <div className="size-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto border border-indigo-200 dark:border-indigo-800">
              <Sparkles className="size-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">EDUMIN LMS Core</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Plataforma Educativa Ejecutiva de Alta Especialización</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 text-left text-xs text-slate-600 dark:text-slate-300 space-y-2 border border-slate-100 dark:border-slate-800">
              <p>• <strong>Versión:</strong> 1.0 Producción</p>
              <p>• <strong>Base de datos:</strong> Supabase PostgreSQL</p>
              <p>• <strong>Arquitectura:</strong> Next.js 16 App Router + Tailwind CSS</p>
              <p>• <strong>Automatizaciones:</strong> Webhooks a n8n</p>
              <p>• <strong>Certificaciones:</strong> Validadas con Código Único y QR Oficial</p>
            </div>
            <button
              onClick={() => setInfoModalOpen(false)}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-xs transition cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
