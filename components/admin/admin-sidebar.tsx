'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, Award, UserCheck, Server, LayoutDashboard
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

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
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex shrink-0 z-20 min-h-screen border-r border-slate-800">
      {/* Header Logo */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <ShieldCheck className="w-8 h-8 text-indigo-500 shrink-0" />
        <div>
          <h2 className="text-xl font-black text-white tracking-tight leading-none">ADMIN PRO</h2>
          <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wider">EDUMIN LMS v1.0</span>
        </div>
      </div>
      
      {/* Navegación Principal */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
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

      {/* Footer User Info & Logout */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center gap-2 mb-3 px-2">
          <div className="size-2 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sesión: SuperAdmin</span>
        </div>
        <button 
          onClick={handleLogout} 
          className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors cursor-pointer text-xs font-bold"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}
