'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BookOpen, Award, User, LogOut, GraduationCap, Wallet } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
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
    { name: 'Diplomados', path: '/dashboard/diplomados', icon: GraduationCap },
    { name: 'Cursos', path: '/dashboard/cursos', icon: BookOpen },
    { name: 'Certificados', path: '/dashboard/certificados', icon: Award },
    { name: 'Mis Pagos', path: '/dashboard/pagos', icon: Wallet },
    { name: 'Mi Perfil', path: '/dashboard/perfil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar Oscuro (Estilo Premium) */}
      <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col hidden md:flex border-r border-slate-900">
        <div className="p-6 flex items-center justify-center border-b border-white/5">
          <img 
            src="https://raw.githubusercontent.com/videoconferenciasdiplomado-alt/imagenes/main/logo/logo%20blanco.png" 
            alt="Edumin Logo" 
            className="h-14 w-auto object-contain" 
          />
        </div>
        
        <nav className="flex-1 py-8 px-4 space-y-2">
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

        <div className="p-4 border-t border-white/5">
           <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Área Principal Dinámica */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}