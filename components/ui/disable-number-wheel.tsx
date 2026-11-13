'use client';

import { useEffect } from 'react';

/**
 * Evita que la rueda del mouse incremente o decremente campos <input type="number">
 * al hacer scroll en cualquier vista del LMS, manteniendo el desplazamiento normal de la página.
 */
export function DisableNumberWheel() {
  useEffect(() => {
    const handleWheel = () => {
      const active = document.activeElement;
      if (active instanceof HTMLInputElement && active.type === 'number') {
        active.blur();
      }
    };

    document.addEventListener('wheel', handleWheel, { capture: true, passive: true });
    return () => {
      document.removeEventListener('wheel', handleWheel, { capture: true });
    };
  }, []);

  return null;
}
