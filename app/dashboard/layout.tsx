'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, BookOpen, Award, User, LogOut, GraduationCap, Wallet, Sun, Moon, Menu, X } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { ThemeProvider, useTheme } from '@/context/theme-context';
import { ProfileProvider, useProfile } from '@/context/profile-context';

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { esOscuro, toggleTema } = useTheme();
  const { nombres, apellidos, iniciales, paqueteContratado, fotoPerfil } = useProfile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const menuItems = [
    { name: 'Inicio', path: '/dashboard', icon: Home },
    { name: 'Mis diplomados', path: '/dashboard/diplomados', icon: GraduationCap },
    { name: 'Mis cursos', path: '/dashboard/cursos', icon: BookOpen },
    { name: 'Mis certificados', path: '/dashboard/certificados', icon: Award },
    { name: 'Mis pagos', path: '/dashboard/pagos', icon: Wallet },
    { name: 'Mi perfil', path: '/dashboard/perfil', icon: User },
  ];

  const primerNombre = nombres.trim().split(' ')[0] || 'Juan';
  const primerApellido = apellidos.trim().split(' ')[0] || 'Quispe';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Header Móvil (solo visible en pantallas < md) */}
      <header className="md:hidden bg-slate-950 text-slate-100 border-b border-slate-900 px-4 py-3 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-2">
          <img 
            src="https://raw.githubusercontent.com/videoconferenciasdiplomado-alt/imagenes/main/logo/logo%20blanco.png" 
            alt="Edumin Logo" 
            className="h-9 w-auto object-contain" 
          />
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Abrir menú"
            className="p-2 rounded-xl text-slate-300 hover:bg-white/10 hover:text-white transition-colors border border-white/10"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Overlay / Fondo Oscuro Translúcido para Móviles */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Drawer Móvil Desplegable (Desliza desde la izquierda) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-950 text-slate-300 flex flex-col border-r border-slate-900 md:hidden transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header / Logo + Avatar Opción 2 */}
        <div className="p-4 border-b border-white/5 shrink-0 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <img 
              src="https://raw.githubusercontent.com/videoconferenciasdiplomado-alt/imagenes/main/logo/logo%20blanco.png" 
              alt="Edumin Logo" 
              className="h-9 w-auto object-contain" 
            />
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <Link 
            href="/dashboard/perfil"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5 group"
          >
            <div className="relative size-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md ring-2 ring-indigo-400/30 shrink-0 overflow-hidden">
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                iniciales
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                {primerNombre} {primerApellido}
              </h4>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 rounded-md border border-indigo-500/20 truncate max-w-full">
                {paqueteContratado || 'Estudiante'}
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-4 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Link 
                key={item.name} 
                href={item.path}
                onClick={() => setMobileMenuOpen(false)}
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

        {/* Footer del Drawer Móvil */}
        <div className="p-4 border-t border-white/5 shrink-0 flex items-center gap-2">
          <button 
            onClick={() => {
              setMobileMenuOpen(false);
              handleLogout();
            }}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>

          <button
            onClick={toggleTema}
            title={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="p-2.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors border border-white/5 flex items-center justify-center shrink-0"
          >
            {esOscuro ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
            )}
          </button>
        </div>
      </aside>

      {/* Sidebar Oscuro Fijo en Pantalla para Escritorio (Desktop) */}
      <aside className="w-64 h-screen bg-slate-950 text-slate-300 flex flex-col hidden md:flex border-r border-slate-900 sticky top-0 shrink-0">
        {/* Header / Logo + Avatar Opción 2 */}
        <div className="p-5 flex flex-col gap-4 border-b border-white/5 shrink-0">
          <div className="flex items-center justify-center">
            <img 
              src="https://raw.githubusercontent.com/videoconferenciasdiplomado-alt/imagenes/main/logo/logo%20blanco.png" 
              alt="Edumin Logo" 
              className="h-12 w-auto object-contain" 
            />
          </div>
          
          <Link 
            href="/dashboard/perfil"
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5 group shadow-sm"
          >
            <div className="relative size-10 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-extrabold flex items-center justify-center text-xs shadow-md ring-2 ring-indigo-400/30 shrink-0 overflow-hidden">
              {fotoPerfil ? (
                <img src={fotoPerfil} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                iniciales
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-400 transition-colors">
                {primerNombre} {primerApellido}
              </h4>
              <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-semibold text-indigo-300 bg-indigo-500/15 rounded-md border border-indigo-500/20 truncate max-w-full">
                {paqueteContratado || 'Estudiante'}
              </span>
            </div>
          </Link>
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

        {/* Footer del Sidebar Desktop */}
        <div className="p-4 border-t border-white/5 shrink-0 flex items-center gap-2">
          <button 
            onClick={handleLogout}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors text-xs font-medium"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar sesión</span>
          </button>

          <button
            onClick={toggleTema}
            title={esOscuro ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="p-2.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors border border-white/5 flex items-center justify-center shrink-0"
          >
            {esOscuro ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-400" />
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
      <ProfileProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </ProfileProvider>
    </ThemeProvider>
  );
}