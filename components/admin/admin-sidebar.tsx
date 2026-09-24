'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, Award, UserCheck, Server, LayoutDashboard,
  Menu, X, Sun, Moon, Sparkles
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useTheme } from '@/context/theme-context';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { esOscuro, toggleTema } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard 360° & Tesorería',
      icon: LayoutDashboard,
      color: 'text-indigo-400',
      exact: true
    },
    {
      href: '/admin/catalogo',
      label: 'Catálogo & Módulos',
      icon: BookOpen,
      color: 'text-indigo-400'
    },
    {
      href: '/admin/alumnos-riesgo',
      label: 'Alumnos en Riesgo (Deserción Cero)',
      icon: Users,
      color: 'text-amber-400'
    },
    {
      href: '/admin/certificaciones',
      label: 'Certificados & CIP / MIAMI',
      icon: Award,
      color: 'text-amber-300'
    },
    {
      href: '/admin/solicitudes-datos',
      label: 'Buzón de Datos de Perfil',
      icon: UserCheck,
      color: 'text-emerald-300'
    },
    {
      href: '/admin/auditoria',
      label: 'Auditoría & Webhooks n8n',
      icon: Activity,
      color: 'text-emerald-400'
    },
    {
      href: '/admin/configuracion',
      label: 'Config. & Roles (RBAC)',
      icon: Settings,
      color: 'text-slate-400'
    },
    {
      href: '/admin/reportes',
      label: 'Reportes & Data (CSV)',
      icon: Server,
      color: 'text-sky-400'
    }
  ];

  return (
    <>
      {/* Header Móvil (Pantallas < md) */}
      <header className="md:hidden bg-slate-950 text-slate-100 border-b border-slate-900 px-4 py-3 flex items-center justify-between sticky top-0 z-40 w-full shrink-0">
        <Link href="/admin" className="flex items-center gap-2">
          <ShieldCheck className="w-7 h-7 text-indigo-500" />
          <div className="flex flex-col">
            <span className="font-black text-sm text-white tracking-tight leading-none">EDUMIN ADMIN</span>
            <span className="text-[9px] font-mono text-emerald-400 font-bold">Plataforma Ejecutiva</span>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTema}
            title={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="p-2 rounded-xl text-slate-300 hover:bg-white/10 transition-colors border border-white/10"
          >
            {esOscuro ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Abrir menú"
            className="p-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Overlay Translúcido Móvil */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 md:hidden transition-opacity"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Drawer Móvil */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-900 md:hidden transition-transform duration-300 ease-in-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b border-slate-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-indigo-500 shrink-0" />
            <div>
              <h2 className="text-sm font-black text-white tracking-tight leading-none">ADMIN PRO</h2>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">EDUMIN LMS v1.0</span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta de Usuario Admin en Móvil */}
        <div className="p-4 border-b border-slate-900 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md ring-2 ring-indigo-400/30">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">SuperAdmin Directoria</h4>
              <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 rounded-md border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
              </span>
            </div>
          </div>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
            
            const IconComponent = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2">
          <button 
            onClick={() => {
              setMobileOpen(false);
              handleLogout();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Sidebar Fijo Desktop */}
      <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col hidden md:flex shrink-0 z-20 min-h-screen border-r border-slate-800 dark:border-slate-900 sticky top-0">
        {/* Header Logo Desktop */}
        <div className="p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-indigo-500 shrink-0" />
            <div>
              <h2 className="text-xl font-black text-white tracking-tight leading-none">ADMIN PRO</h2>
              <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider">EDUMIN LMS v1.0</span>
            </div>
          </div>
          <button
            onClick={toggleTema}
            title={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            {esOscuro ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>

        {/* Tarjeta Admin Desktop */}
        <div className="p-3.5 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/50">
            <div className="relative size-9 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md ring-2 ring-indigo-400/30">
              AD
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate">SuperAdmin Directoria</h4>
              <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-500/10 rounded border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span> ONLINE
              </span>
            </div>
          </div>
        </div>
        
        {/* Navegación Desktop */}
        <nav className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href 
              : pathname.startsWith(item.href);
            
            const IconComponent = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all text-xs font-bold ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : item.color}`} />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer Logout Desktop */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <button 
            onClick={handleLogout} 
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors cursor-pointer text-xs font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
}
