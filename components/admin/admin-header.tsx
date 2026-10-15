'use client';

import React from 'react';
import InstitutionalUserDropdown from '@/components/navigation/InstitutionalUserDropdown';

interface AdminHeaderProps {
  breadcrumb?: string;
}

export default function AdminHeader({ breadcrumb = 'Plataforma Ejecutiva' }: AdminHeaderProps) {
  return (
    <header className="hidden md:flex items-center justify-between px-6 py-2.5 bg-slate-950 text-white border-b border-slate-900 shrink-0 z-20">
      <div className="flex items-center gap-3">
        <span className="font-extrabold tracking-tight text-xs text-slate-300 uppercase">EDUMIN ADMIN</span>
        <span className="text-slate-600 text-xs">/</span>
        <span className="text-xs text-indigo-400 font-semibold">{breadcrumb}</span>
      </div>

      <div className="flex items-center gap-3">
        <InstitutionalUserDropdown />
      </div>
    </header>
  );
}
