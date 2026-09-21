'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type ThemeContextType = {
  esOscuro: boolean;
  toggleTema: () => void;
};

const ThemeContext = createContext<ThemeContextType>({
  esOscuro: true,
  toggleTema: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [esOscuro, setEsOscuro] = useState<boolean>(true);
  const [mounted, setMounted] = useState<boolean>(false);

  useEffect(() => {
    const saved = localStorage.getItem('edumin_theme');
    if (saved !== null) {
      setEsOscuro(saved === 'oscuro');
    }
    setMounted(true);
  }, []);

  const toggleTema = () => {
    setEsOscuro((prev) => {
      const next = !prev;
      localStorage.setItem('edumin_theme', next ? 'oscuro' : 'claro');
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ esOscuro, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
