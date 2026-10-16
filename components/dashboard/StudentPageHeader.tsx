'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '@/context/theme-context';

interface StudentPageHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  iconClassName?: string;
  children?: React.ReactNode;
}

export function StudentPageHeader({
  icon: Icon,
  title,
  subtitle,
  iconClassName,
  children
}: StudentPageHeaderProps) {
  const { esOscuro } = useTheme();

  return (
    <header className="mb-8 sm:mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 className={`text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3 ${
          esOscuro ? 'text-white' : 'text-slate-900'
        }`}>
          <Icon className={`w-7 h-7 sm:w-8 sm:h-8 shrink-0 ${
            iconClassName || (esOscuro ? 'text-indigo-400' : 'text-indigo-600')
          }`} />
          <span>{title}</span>
        </h1>
        <p className={`mt-2 text-xs sm:text-sm max-w-2xl leading-relaxed ${
          esOscuro ? 'text-slate-400' : 'text-slate-500'
        }`}>
          {subtitle}
        </p>
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0">
          {children}
        </div>
      )}
    </header>
  );
}

export default StudentPageHeader;
