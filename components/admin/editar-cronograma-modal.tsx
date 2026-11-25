'use client';

import React from 'react';
import { X, CheckCircle2, Plus, Trash2, Calendar } from 'lucide-react';
import { formatearFechaISO, sumarMeses } from '@/lib/utils/fechasCuotas';

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
  editFechas6?: { val: string }[];
  setEditFechas6?: (val: { val: string }[]) => void;
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
  editFechas6 = Array(6).fill({ val: '' }),
  setEditFechas6,
  onClose,
  onSave
}: EditarCronogramaModalProps) {
  if (!isOpen || !alumnoSeleccionado) return null;

  const creditos = (alumnoSeleccionado as any).creditos || [];
  const creditoActual = creditos[selectedCreditoIdx] || creditos[0];

  const cuotasActivas = editCuotas6
    .map((item, idx) => ({ ...item, idx }))
    .filter(item => item.val !== 'no corresponde');

  const activasFinal = cuotasActivas.length > 0 ? cuotasActivas : [{ val: String(editMontoTotal), idx: 0 }];

  const handleAgregarCuota = () => {
    if (activasFinal.length >= 6) return;
    const siguienteIdx = activasFinal.length;
    const copy = [...editCuotas6];
    copy[siguienteIdx] = { val: '0' };
    setEditCuotas6(copy);

    if (setEditFechas6) {
      const copyFechas = [...editFechas6];
      const fechaAnterior = copyFechas[siguienteIdx - 1]?.val;
      const base = fechaAnterior ? new Date(fechaAnterior) : new Date();
      const nuevaFecha = sumarMeses(base, 1);
      copyFechas[siguienteIdx] = { val: formatearFechaISO(nuevaFecha) };
      setEditFechas6(copyFechas);
    }
  };

  const handleEliminarCuota = (targetIdx: number) => {
    if (activasFinal.length <= 1) return;
    const copy = [...editCuotas6];
    copy[targetIdx] = { val: 'no corresponde' };
    setEditCuotas6(copy);
  };

  const handleAutocalcularFechas = () => {
    if (!setEditFechas6) return;
    const fechaInicialStr = editFechas6[0]?.val || creditoActual?.created_at || new Date().toISOString();
    const base = new Date(fechaInicialStr);
    const fechaValida = isNaN(base.getTime()) ? new Date() : base;

    const copyFechas = [...editFechas6];
    activasFinal.forEach((item, indexEnActivas) => {
      const f = sumarMeses(fechaValida, indexEnActivas);
      copyFechas[item.idx] = { val: formatearFechaISO(f) };
    });
    setEditFechas6(copyFechas);
  };

  const sumaCalculada = editCuotas6.reduce((acc, item) => {
    return item.val !== 'no corresponde' ? acc + (Number(item.val) || 0) : acc;
  }, 0);

  const coincide = Math.abs(sumaCalculada - editMontoTotal) <= 0.01;

  return (
    <div 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} 
      className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
    >
      <div 
        onClick={(e) => e.stopPropagation()} 
        className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col my-auto overflow-hidden"
      >
        {/* Header fijo */}
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 p-4 shrink-0">
          <div>
            <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase border border-indigo-200 dark:border-indigo-800/50">
              Configuración de Cuotas y Vencimientos
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-1">
              Editar Cronograma y Cuotas (Crédito #{creditoActual?.num_credito || (selectedCreditoIdx + 1)})
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
        <div className="px-4 pt-3 pb-0 shrink-0">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-0.5 font-medium">
            <div className="truncate"><span className="text-slate-500 dark:text-slate-400">Alumno:</span> <strong className="text-slate-900 dark:text-white">{alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}</strong></div>
            <div className="flex gap-4">
              <div><span className="text-slate-500 dark:text-slate-400">DNI:</span> <strong className="tabular-nums text-indigo-600 dark:text-indigo-400">{alumnoSeleccionado.dni_ce}</strong></div>
              <div className="truncate"><span className="text-slate-500 dark:text-slate-400">Programa:</span> <strong className="text-slate-800 dark:text-slate-200">{alumnoSeleccionado.diplomado_actual}</strong></div>
            </div>
          </div>
        </div>

        {/* Formulario con cuerpo scrolleable y footer fijo */}
        <form onSubmit={onSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
          <div className="space-y-3 overflow-y-auto px-4 py-3 flex-1 min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
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
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Pagaré N.º
                </label>
                <input
                  type="text"
                  value={editNroPagare || ''}
                  placeholder="2026-I-0001"
                  onChange={(e) => {
                    if (setEditNroPagare) setEditNroPagare(e.target.value);
                  }}
                  className="w-full p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none"
                />
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-2.5">
              <div className="flex flex-wrap justify-between items-center gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-900 dark:text-indigo-300 uppercase">
                    Plan de Cuotas y Vencimientos ({activasFinal.length} cuota{activasFinal.length === 1 ? '' : 's'})
                  </label>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Ajusta los montos y fechas de vencimiento de cada cuota:
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleAutocalcularFechas}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline cursor-pointer shrink-0 flex items-center gap-1"
                  >
                    <Calendar className="size-3" /> Fechas mensuales
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (activasFinal.length > 0) {
                        const cuotaBase = Math.floor(editMontoTotal / activasFinal.length);
                        const resto = editMontoTotal - (cuotaBase * activasFinal.length);
                        const copy = [...editCuotas6];
                        activasFinal.forEach((x, idx) => {
                          const valFinal = idx === activasFinal.length - 1 ? cuotaBase + resto : cuotaBase;
                          copy[x.idx] = { val: String(valFinal) };
                        });
                        setEditCuotas6(copy);
                      }
                    }}
                    className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 underline cursor-pointer shrink-0"
                  >
                    Distribuir montos
                  </button>
                </div>
              </div>

              {/* Lista vertical limpia de cuotas estilo timeline con monto y fecha */}
              <div className="space-y-2 pt-1">
                {activasFinal.map((item, indexEnActivas) => {
                  const nroFmt = (item.idx + 1).toString().padStart(2, '0');
                  const esUltima = indexEnActivas === activasFinal.length - 1 && activasFinal.length > 1;
                  const fechaActual = editFechas6?.[item.idx]?.val || '';

                  return (
                    <div 
                      key={item.idx} 
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-slate-100/70 dark:hover:bg-slate-800/70 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/80 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-black text-xs flex items-center justify-center shrink-0">
                          {nroFmt}
                        </span>
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-xs block">
                            Cuota {nroFmt}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {indexEnActivas === 0 ? 'Matrícula / Cuota 01' : `Periodo mes ${indexEnActivas + 1}`}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 shrink-0">
                        {/* Selector de Fecha de Vencimiento */}
                        <div className="flex items-center gap-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase hidden sm:inline">
                            Vence:
                          </label>
                          <input
                            type="date"
                            value={fechaActual}
                            onChange={(e) => {
                              if (!setEditFechas6) return;
                              const copy = [...editFechas6];
                              copy[item.idx] = { val: e.target.value };
                              setEditFechas6(copy);
                            }}
                            className="py-1 px-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-600 outline-none shadow-xs"
                          />
                        </div>

                        {/* Input de Monto */}
                        <div className="relative flex items-center">
                          <span className="absolute left-2.5 text-slate-400 dark:text-slate-500 font-bold text-xs pointer-events-none">
                            S/
                          </span>
                          <input
                            type="number"
                            step="1"
                            value={item.val}
                            placeholder="0.00"
                            onChange={(e) => {
                              const newVal = e.target.value;
                              const copy = [...editCuotas6];
                              copy[item.idx] = { val: newVal };
                              setEditCuotas6(copy);
                            }}
                            className="w-24 pl-7 pr-2.5 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs tabular-nums font-black text-right text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none shadow-xs"
                          />
                        </div>

                        {esUltima ? (
                          <button
                            type="button"
                            onClick={() => handleEliminarCuota(item.idx)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition cursor-pointer shrink-0"
                            title={`Eliminar Cuota ${nroFmt}`}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        ) : (
                          <div className="w-7 h-7 shrink-0 hidden sm:block" aria-hidden="true" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {activasFinal.length < 6 && (
                <button
                  type="button"
                  onClick={handleAgregarCuota}
                  className="w-full py-2 mt-1 border-2 border-dashed border-indigo-200 dark:border-indigo-800/80 hover:border-indigo-400 dark:hover:border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="size-3.5" />
                  <span>Añadir Cuota 0{activasFinal.length + 1}</span>
                </button>
              )}
            </div>
          </div>

          {/* Footer fijo */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 shrink-0 space-y-2.5">
            <div className={`p-2.5 rounded-xl border text-xs font-bold space-y-0.5 ${coincide ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800'}`}>
              <div className="flex justify-between items-center text-[11px] sm:text-xs">
                <span>Suma Cuotas: S/ {sumaCalculada.toFixed(2)}</span>
                <span>Total Crédito: S/ {editMontoTotal.toFixed(2)}</span>
              </div>
              {!coincide && (
                <p className="text-[10px] text-amber-700 dark:text-amber-400 font-normal">
                  La suma de las cuotas (S/ ${sumaCalculada.toFixed(2)}) debe ser igual al total del crédito (S/ ${editMontoTotal.toFixed(2)}) para poder guardar.
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-200/70 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
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
          </div>
        </form>
      </div>
    </div>
  );
}
