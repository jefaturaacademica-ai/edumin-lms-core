'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Award, User, LogOut, GraduationCap, Wallet, Sun, Moon } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { ThemeProvider, useTheme } from '@/context/theme-context';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { esOscuro, toggleTema } = useTheme();

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { name: 'Inicio', path: '/dashboard', icon: Home },
    { name: 'Mis Diplomados', path: '/dashboard/diplomados', icon: GraduationCap },
    { name: 'Mis Cursos', path: '/dashboard/cursos', icon: BookOpen },
    { name: 'Mis Certificados', path: '/dashboard/certificados', icon: Award },
    { name: 'Mis Pagos', path: '/dashboard/pagos', icon: Wallet },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Oscuro Fijo en Pantalla */}
      <aside className="w-64 h-screen bg-slate-950 text-slate-300 flex flex-col hidden md:flex border-r border-slate-900 sticky top-0 shrink-0">
        {/* Header / Logo */}
        <div className="p-6 flex items-center justify-center border-b border-white/5 shrink-0">
          <img 
            src="https://raw.githubusercontent.com/videoconferenciasdiplomado-alt/imagenes/main/logo/logo%20blanco.png" 
            alt="Edumin Logo" 
            className="h-14 w-auto object-contain" 
          />
        </div>
        
        {/* Links de Navegación Scrollable */}
        <nav className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link 
                key={item.name} 
                href={item.path}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20' 
                    : 'hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer del Sidebar Fijo Abajo (Cerrar Sesión + Cambio de Tema) */}
        <div className="p-4 border-t border-white/5 shrink-0 flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut className="w-5 h-5" />
            <span>Cerrar Sesión</span>
          </button>

          <button
            onClick={toggleTema}
            title={esOscuro ? "Cambiar a Modo Claro" : "Cambiar a Modo Oscuro"}
            className="p-3 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors border border-white/5 flex items-center justify-center"
          >
            {esOscuro ? (
              <Sun className="w-5 h-5 text-amber-400" />
            ) : (
              <Moon className="w-5 h-5 text-indigo-400" />
            )}
          </button>
        </div>
      </aside>

      {/* Área Principal Dinámica */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </ThemeProvider>
  );
}