'use client';

import { useEffect, useRef } from 'react';

export const MENSAJE_BLOQUEO_CUOTA =
  'Este contenido se habilitará automáticamente al registrar el pago de tu siguiente cuota.';

interface TarjetaBloqueoOverlayProps {
  visible: boolean;
  onAutoHide?: () => void;
  autoHideMs?: number;
}

/**
 * Superposición compartida para tarjetas de módulos y cursos bloqueados por cuota.
 * Se muestra suavemente cuando el estudiante intenta ingresar y se oculta sola tras unos segundos.
 */
export function TarjetaBloqueoOverlay({
  visible,
  onAutoHide,
  autoHideMs = 3500,
}: TarjetaBloqueoOverlayProps) {
  const onAutoHideRef = useRef(onAutoHide);

  useEffect(() => {
    onAutoHideRef.current = onAutoHide;
  }, [onAutoHide]);

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      onAutoHideRef.current?.();
    }, autoHideMs);
    return () => clearTimeout(timer);
  }, [visible, autoHideMs]);

  return (
    <div
      aria-hidden={!visible}
      className={`absolute inset-0 z-[5] flex items-center justify-center p-4 pt-12 bg-slate-950/65 backdrop-blur-[2px] transition-opacity duration-300 ease-out pointer-events-none ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className={`bg-slate-950/85 border border-white/15 rounded-xl px-3.5 py-2.5 text-center max-w-[92%] shadow-lg transition-all duration-300 ease-out ${
          visible ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-1.5'
        }`}
      >
        <p className="text-xs font-medium text-white leading-snug text-balance">
          {MENSAJE_BLOQUEO_CUOTA}
        </p>
      </div>
    </div>
  );
}
