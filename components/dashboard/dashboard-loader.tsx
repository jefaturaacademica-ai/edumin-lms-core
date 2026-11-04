'use client';

import React from 'react';

interface DashboardLoaderProps {
  className?: string;
  minHeight?: string;
}

export function DashboardLoader({ 
  className = '',
  minHeight = 'min-h-[calc(100vh-5rem)] md:min-h-full'
}: DashboardLoaderProps) {
  return (
    <div 
      className={`w-full h-full flex-1 flex items-center justify-center p-6 transition-colors duration-200 ${minHeight} bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${className}`}
      aria-label="Cargando..."
    >
      <div className="w-9 h-9 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default DashboardLoader;
