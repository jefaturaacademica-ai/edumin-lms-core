'use client';

import React from 'react';
import { ThemeProvider } from '@/context/theme-context';
import { ProfileProvider } from '@/context/profile-context';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <ProfileProvider>
        {children}
      </ProfileProvider>
    </ThemeProvider>
  );
}
