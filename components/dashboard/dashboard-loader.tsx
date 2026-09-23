'use client';

import { useTheme } from '@/context/theme-context';
import { Sparkles, GraduationCap } from 'lucide-react';

interface DashboardLoaderProps {
  title?: string;
  subtitle?: string;
}

export function DashboardLoader({ 
  title = 'Cargando contenido...', 
  subtitle = 'Por favor espera un momento mientras preparamos tu información' 
}: DashboardLoaderProps) {
  const { esOscuro } = useTheme();

  return (
    <div className={`min-h-[70vh] flex flex-col items-center justify-center p-6 transition-colors duration-300 ${
      esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'
    }`}>
      <div className="relative flex flex-col items-center max-w-sm w-full text-center">
        
        {/* Animated Brand Pulse Ring */}
        <div className="relative mb-6">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 blur-xl animate-pulse" />
          <div className={`relative size-20 rounded-3xl grid place-items-center border shadow-xl backdrop-blur-md ${
            esOscuro ? 'bg-slate-900/90 border-indigo-500/30' : 'bg-white border-indigo-200'
          }`}>
            <GraduationCap className="w-10 h-10 text-indigo-500 animate-bounce" />
          </div>
          <div className="absolute -bottom-1 -right-1 size-7 bg-indigo-600 rounded-full grid place-items-center text-white shadow-md">
            <Sparkles className="w-4 h-4 animate-spin" />
          </div>
        </div>

        {/* Text Title & Subtitle */}
        <h3 className={`text-lg font-bold tracking-tight mb-1 ${
          esOscuro ? 'text-white' : 'text-slate-900'
        }`}>
          {title}
        </h3>
        <p className={`text-xs leading-relaxed mb-6 ${
          esOscuro ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {subtitle}
        </p>

        {/* Shimmer Skeleton Line Bar */}
        <div className={`w-full h-1.5 rounded-full overflow-hidden ${
          esOscuro ? 'bg-slate-800' : 'bg-slate-200'
        }`}>
          <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-indigo-600 animate-pulse rounded-full w-2/3" />
        </div>

      </div>
    </div>
  );
}
