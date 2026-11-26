'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook para sincronizar el estado de pestañas activas con la URL (query param / slug),
 * permitiendo que al recargar la página (F5) se mantenga la pestaña activa en la que el
 * usuario estaba trabajando.
 *
 * @param defaultTab Pestaña por defecto si no hay ninguna en la URL o si el valor es inválido.
 * @param allowedTabs Lista de pestañas válidas para esta vista.
 * @param paramKey Nombre del parámetro en la URL (por defecto 'tab').
 */
export function useTabSlug<T extends string>(
  defaultTab: T,
  allowedTabs: readonly T[],
  paramKey: string = 'tab'
): [T, (tab: T) => void] {
  // Función para extraer la pestaña actual de la URL (query param o hash)
  const getTabFromUrl = useCallback((): T => {
    if (typeof window === 'undefined') return defaultTab;
    try {
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get(paramKey);
      if (urlTab && (allowedTabs as readonly string[]).includes(urlTab)) {
        return urlTab as T;
      }
      // Soporte complementario para hash (#pestaña)
      const hash = window.location.hash.replace('#', '');
      if (hash && (allowedTabs as readonly string[]).includes(hash)) {
        return hash as T;
      }
    } catch {
      // Ignorar errores de parsing
    }
    return defaultTab;
  }, [defaultTab, allowedTabs, paramKey]);

  const [activeTab, setActiveTabState] = useState<T>(defaultTab);
  const isMountedRef = useRef(false);

  // Al montar en el cliente, sincronizar con la URL
  useEffect(() => {
    const tabFromUrl = getTabFromUrl();
    if (tabFromUrl !== activeTab) {
      setActiveTabState(tabFromUrl);
    }

    isMountedRef.current = true;

    // Escuchar eventos de navegación del navegador (Atrás / Adelante)
    const handlePopState = () => {
      const current = getTabFromUrl();
      setActiveTabState(current);
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [getTabFromUrl]);

  // Modificador de pestaña que actualiza tanto el estado como la URL en vivo
  const setActiveTab = useCallback(
    (newTab: T) => {
      setActiveTabState(newTab);

      if (typeof window === 'undefined') return;

      try {
        const url = new URL(window.location.href);
        if (newTab === defaultTab) {
          url.searchParams.delete(paramKey);
        } else {
          url.searchParams.set(paramKey, newTab);
        }
        // Limpiar hash si coincidía con una pestaña anterior
        if (url.hash) {
          url.hash = '';
        }
        const newSearch = url.searchParams.toString();
        const newPath = url.pathname + (newSearch ? `?${newSearch}` : '') + url.hash;
        window.history.replaceState(null, '', newPath);
      } catch (err) {
        console.error('Error al actualizar el slug de la pestaña en la URL:', err);
      }
    },
    [defaultTab, paramKey]
  );

  return [activeTab, setActiveTab];
}
