'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeMode = 'claro' | 'oscuro' | 'sistema';

type ThemeContextType = {
  modo: ThemeMode;
  esOscuro: boolean;
  mounted: boolean;
  setModoTema: (modo: ThemeMode) => void;
  toggleTema: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  modo: 'oscuro',
  esOscuro: true,
  mounted: false,
  setModoTema: () => {},
  toggleTema: () => {},
});

function resolverEsOscuro(mode: ThemeMode): boolean {
  if (mode === 'oscuro') return true;
  if (mode === 'claro') return false;
  if (typeof window !== 'undefined' && window.matchMedia) {
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  return true;
}

function aplicarTemaAlDom(isDark: boolean, mode: ThemeMode) {
  if (typeof document === 'undefined') return;
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'oscuro');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.setAttribute('data-theme', 'claro');
  }
  document.documentElement.setAttribute('data-theme-mode', mode);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [modo, setModo] = useState<ThemeMode>('oscuro');
  const [esOscuro, setEsOscuro] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  const aplicarModo = useCallback((nuevoModo: ThemeMode) => {
    const isDark = resolverEsOscuro(nuevoModo);
    setModo(nuevoModo);
    setEsOscuro(isDark);
    if (typeof window !== 'undefined') {
      localStorage.setItem('edumin_theme_mode', nuevoModo);
      localStorage.setItem('edumin_theme', nuevoModo);
      aplicarTemaAlDom(isDark, nuevoModo);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    const saved = (localStorage.getItem('edumin_theme_mode') || localStorage.getItem('edumin_theme')) as ThemeMode | null;
    const initialMode: ThemeMode = (saved === 'claro' || saved === 'oscuro' || saved === 'sistema') ? saved : 'oscuro';
    const isDark = resolverEsOscuro(initialMode);
    
    setModo(initialMode);
    setEsOscuro(isDark);
    aplicarTemaAlDom(isDark, initialMode);
  }, []);

  // Escuchar cambios del sistema operativo cuando el modo activo sea 'sistema'
  useEffect(() => {
    if (modo !== 'sistema' || typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setEsOscuro(e.matches);
      aplicarTemaAlDom(e.matches, 'sistema');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [modo]);

  const setModoTema = (nuevoModo: ThemeMode) => {
    aplicarModo(nuevoModo);
  };

  const toggleTema = () => {
    aplicarModo(esOscuro ? 'claro' : 'oscuro');
  };

  return (
    <ThemeContext.Provider value={{ modo, esOscuro, mounted, setModoTema, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
