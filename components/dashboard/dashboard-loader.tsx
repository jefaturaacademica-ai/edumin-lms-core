'use client';

import { useTheme } from '@/context/theme-context';

export function DashboardLoader() {
  const { esOscuro } = useTheme();

  return (
    <div className={`w-full h-full min-h-[75vh] flex-1 flex items-center justify-center p-6 transition-colors duration-200 ${
      esOscuro ? 'bg-slate-950' : 'bg-slate-50'
    }`}>
      <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
