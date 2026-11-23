'use client';

/**
 * Cliente de caché en memoria y SessionStorage para acelerar la navegación
 * y eliminar tiempos de espera con cargadores/spinners en toda la plataforma.
 * Implementa estrategia Stale-While-Revalidate con deduplicación de peticiones simultáneas.
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Caché en memoria para acceso ultra-rápido durante la sesión activa
const memoryCache = new Map<string, CacheEntry<any>>();

// Registro de promesas en vuelo para deduplicar llamadas duplicadas simultáneas
const inFlightPromises = new Map<string, Promise<any>>();

const DEFAULT_TTL_MS = 4 * 60 * 1000; // 4 minutos por defecto

/**
 * Obtiene datos en caché si existen y no han expirado (o devuelve stale si se permite)
 */
export function getClientCachedData<T = any>(key: string, allowStale = true): T | null {
  if (typeof window === 'undefined') return null;

  // 1. Revisar memoria
  const memEntry = memoryCache.get(key);
  if (memEntry) {
    const isFresh = Date.now() - memEntry.timestamp < DEFAULT_TTL_MS;
    if (isFresh || allowStale) {
      return memEntry.data as T;
    }
  }

  // 2. Revisar sessionStorage como respaldo
  try {
    const raw = sessionStorage.getItem(`edumin_cache_${key}`);
    if (raw) {
      const parsed: CacheEntry<T> = JSON.parse(raw);
      const isFresh = Date.now() - parsed.timestamp < DEFAULT_TTL_MS;
      if (isFresh || allowStale) {
        memoryCache.set(key, parsed);
        return parsed.data;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Guarda datos en memoria y en sessionStorage
 */
export function setClientCachedData<T = any>(key: string, data: T): void {
  if (typeof window === 'undefined') return;

  const entry: CacheEntry<T> = {
    data,
    timestamp: Date.now(),
  };

  memoryCache.set(key, entry);

  try {
    sessionStorage.setItem(`edumin_cache_${key}`, JSON.stringify(entry));
  } catch {
    // Si sessionStorage está lleno, solo mantener en memoria
  }
}

/**
 * Invalida una o varias claves de caché cuando ocurre una mutación (guardar nota, pago, actualizar perfil, etc.)
 */
export function invalidateClientCache(keyOrPattern?: string): void {
  if (typeof window === 'undefined') return;

  if (!keyOrPattern) {
    memoryCache.clear();
    try {
      const toRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const k = sessionStorage.key(i);
        if (k && k.startsWith('edumin_cache_')) {
          toRemove.push(k);
        }
      }
      toRemove.forEach((k) => sessionStorage.removeItem(k));
    } catch {
      // ignore
    }
    return;
  }

  // Eliminar coincidencias de memoria
  for (const k of memoryCache.keys()) {
    if (k === keyOrPattern || k.includes(keyOrPattern)) {
      memoryCache.delete(k);
    }
  }

  // Eliminar coincidencias de sessionStorage
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith('edumin_cache_') && k.includes(keyOrPattern)) {
        toRemove.push(k);
      }
    }
    toRemove.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // ignore
  }
}

/**
 * Fetch con caché integrado y deduplicación de peticiones simultáneas.
 * Si ya hay una petición en curso a la misma URL, reutiliza la misma promesa.
 */
export async function fetchWithClientCache<T = any>(
  url: string,
  options?: RequestInit & { forceRefresh?: boolean; ttlMs?: number }
): Promise<T> {
  const force = options?.forceRefresh ?? false;

  // Si no es forzado, revisar si tenemos caché fresco
  if (!force) {
    const cached = getClientCachedData<T>(url, false);
    if (cached !== null) {
      return cached;
    }
  }

  // Deduplicar llamadas en vuelo (ej: 2 componentes llamando a /api/dashboard/me a la vez)
  if (inFlightPromises.has(url)) {
    return inFlightPromises.get(url) as Promise<T>;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, options);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} al obtener ${url}`);
      }
      const data = await res.json();
      setClientCachedData(url, data);
      return data as T;
    } finally {
      inFlightPromises.delete(url);
    }
  })();

  inFlightPromises.set(url, fetchPromise);
  return fetchPromise;
}
