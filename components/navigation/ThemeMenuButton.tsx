'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useTheme, ThemeMode } from '@/context/theme-context';

interface ThemeMenuButtonProps {
  className?: string;
  dropdownAlign?: 'left' | 'right';
}

export function ThemeMenuButton({ className = '', dropdownAlign = 'right' }: ThemeMenuButtonProps) {
  const { modo, esOscuro, setModoTema, mounted } = useTheme();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const opciones: { key: ThemeMode; label: string; icon: typeof Sun }[] = [
    { key: 'claro', label: 'Modo claro', icon: Sun },
    { key: 'oscuro', label: 'Modo oscuro', icon: Moon },
    { key: 'sistema', label: 'Automático (Sistema)', icon: Laptop },
  ];

  const IconoActual = !mounted
    ? Moon
    : modo === 'claro'
    ? Sun
    : modo === 'sistema'
    ? Laptop
    : Moon;

  const colorIcono = !mounted
    ? 'text-indigo-400'
    : modo === 'claro'
    ? 'text-amber-400'
    : modo === 'sistema'
    ? 'text-cyan-400'
    : 'text-indigo-400';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Botón Principal del Tema */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        title="Cambiar apariencia (Claro, Oscuro o Sistema)"
        className="p-2.5 rounded-xl text-slate-400 hover:bg-white/10 hover:text-white transition-colors border border-white/5 flex items-center justify-center shrink-0 cursor-pointer shadow-sm group"
        aria-label="Seleccionar modo de apariencia"
      >
        <IconoActual className={`w-4 h-4 transition-transform group-hover:scale-110 ${colorIcono}`} />
      </button>

      {/* Menú Desplegable Flotante que se abre hacia arriba */}
      {open && (
        <div
          className={`absolute bottom-full mb-2 ${
            dropdownAlign === 'left' ? 'left-0' : 'right-0'
          } w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl py-1.5 z-50 text-xs text-slate-200 animate-in fade-in zoom-in-95 divide-y divide-white/5 select-none`}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Tema de la plataforma
          </div>

          <div className="py-1">
            {opciones.map((opcion) => {
              const IconComp = opcion.icon;
              const esActivo = modo === opcion.key;

              return (
                <button
                  key={opcion.key}
                  type="button"
                  onClick={() => {
                    setModoTema(opcion.key);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
                    esActivo
                      ? 'bg-indigo-600/20 text-indigo-300 font-bold'
                      : 'hover:bg-white/5 text-slate-300 hover:text-white font-medium'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp
                      className={`size-4 ${
                        opcion.key === 'claro'
                          ? 'text-amber-400'
                          : opcion.key === 'oscuro'
                          ? 'text-indigo-400'
                          : 'text-cyan-400'
                      }`}
                    />
                    <span>{opcion.label}</span>
                  </div>
                  {esActivo && <Check className="size-3.5 text-indigo-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThemeMenuButton;
