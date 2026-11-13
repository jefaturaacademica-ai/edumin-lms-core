'use client';

import React from 'react';
import { X, CheckCircle2 } from 'lucide-react';

interface EditarCronogramaModalProps {
  isOpen: boolean;
  alumnoSeleccionado: any;
  selectedCreditoIdx: number;
  editMontoTotal: number;
  setEditMontoTotal: (val: number) => void;
  editNroPagare?: string;
  setEditNroPagare?: (val: string) => void;
  editCuotas6: { val: string }[];
  setEditCuotas6: (val: { val: string }[]) => void;
  onClose: () => void;
  onSave: (e: React.FormEvent) => Promise<void>;
}

export default function EditarCronogramaModal({
  isOpen,
  alumnoSeleccionado,
  selectedCreditoIdx,
  editMontoTotal,
  setEditMontoTotal,
  editNroPagare,
  setEditNroPagare,
  editCuotas6,
  setEditCuotas6,
  onClose,
  onSave
}: EditarCronogramaModalProps) {
  if (!isOpen || !alumnoSeleccionado) return null;

  const creditos = (alumnoSeleccionado as any).creditos || [];
  const creditoActual = creditos[selectedCreditoIdx] || creditos[0];

  const sumaCalculada = editCuotas6.reduce((acc, item) => {
    return item.val !== 'no corresponde' ? acc + (Number(item.val) || 0) : acc;
  }, 0);

  const coincide = Math.abs(sumaCalculada - editMontoTotal) <= 0.01;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col my-auto"
      >
        {/* Header fijo */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3 shrink-0">
          <div>
            <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase border border-indigo-200 dark:border-indigo-800/50">
              Configuración de Cuotas
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
              Editar Cronograma & Cuotas (Crédito #{creditoActual?.num_credito || (selectedCreditoIdx + 1)})
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen Alumno */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1 font-medium mt-3 shrink-0">
          <div><span className="text-slate-500 dark:text-slate-400">Alumno:</span> <strong className="text-slate-900 dark:text-white">{alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}</strong></div>
          <div><span className="text-slate-500 dark:text-slate-400">DNI:</span> <strong className="tabular-nums text-indigo-600 dark:text-indigo-400">{alumnoSeleccionado.dni_ce}</strong></div>
          <div><span className="text-slate-500 dark:text-slate-400">Programa:</span> <strong className="text-slate-800 dark:text-slate-200">{alumnoSeleccionado.diplomado_actual}</strong></div>
        </div>

        {/* Formulario scrolleable que no se desborda */}
        <form onSubmit={onSave} className="space-y-4 overflow-y-auto pr-1 flex-1 py-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Monto Total (S/)
              </label>
              <input
                type="number"
                step="10"
                value={editMontoTotal}
                onChange={(e) => {
                  const total = Number(e.target.value) || 0;
                  setEditMontoTotal(total);
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                Pagaré Nº
              </label>
              <input
                type="text"
                value={editNroPagare || ''}
                placeholder="2026-I-0001"
                onChange={(e) => {
                  if (setEditNroPagare) setEditNroPagare(e.target.value);
                }}
                className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
              />
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-3">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">
                Desglose por Cuota (01 a 06)
              </label>
              <button
                type="button"
                onClick={() => {
                  // Dividir equitativamente entre las cuotas que corresponden
                  const correspondientes = editCuotas6.map((c, i) => ({ c, i })).filter(x => x.c.val !== 'no corresponde');
                  if (correspondientes.length > 0) {
                    const cuotaBase = Math.floor(editMontoTotal / correspondientes.length);
                    const resto = editMontoTotal - (cuotaBase * correspondientes.length);
                    const copy = [...editCuotas6];
                    correspondientes.forEach((x, idx) => {
                      const valFinal = idx === correspondientes.length - 1 ? cuotaBase + resto : cuotaBase;
                      copy[x.i] = { val: String(valFinal) };
                    });
                    setEditCuotas6(copy);
                  }
                }}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline cursor-pointer"
              >
                Distribuir equitativo
              </button>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Ingresa el monto programado o marca &quot;no corresponde&quot; si el plan tiene menos cuotas:
            </p>
            
            <div className="space-y-2">
              {editCuotas6.map((item, idx) => {
                const nroFmt = (idx + 1).toString().padStart(2, '0');
                const esNoCorresponde = item.val === 'no corresponde';

                return (
                  <div key={idx} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300 w-16">Cuota {nroFmt}:</span>
                    
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        disabled={esNoCorresponde}
                        value={esNoCorresponde ? '' : item.val}
                        placeholder={esNoCorresponde ? 'no corresponde' : '0.00'}
                        onChange={(e) => {
                          const newVal = e.target.value;
                          const copy = [...editCuotas6];
                          copy[idx] = { val: newVal };
                          setEditCuotas6(copy);
                        }}
                        className={`w-full px-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs tabular-nums font-bold text-slate-900 dark:text-white ${esNoCorresponde ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 italic' : ''}`}
                      />
                      <label className="flex items-center gap-1 cursor-pointer select-none text-[10px] font-bold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={esNoCorresponde}
                          onChange={(e) => {
                            const copy = [...editCuotas6];
                            copy[idx] = { val: e.target.checked ? 'no corresponde' : '0' };
                            setEditCuotas6(copy);
                          }}
                          className="rounded text-indigo-600 cursor-pointer"
                        />
                        No corresponde
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`p-3 rounded-xl border text-xs font-bold space-y-1 ${coincide ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'}`}>
            <div className="flex justify-between items-center">
              <span>Suma Cuotas: S/ {sumaCalculada.toFixed(2)}</span>
              <span>Total Crédito: S/ {editMontoTotal.toFixed(2)}</span>
            </div>
            {!coincide && (
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-normal">
                La suma de las cuotas (S/ {sumaCalculada.toFixed(2)}) debe ser igual al total del crédito (S/ {editMontoTotal.toFixed(2)}) para poder guardar.
              </p>
            )}
          </div>

          {/* Footer fijo con botones de acción */}
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!coincide}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Guardar en Supabase
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
