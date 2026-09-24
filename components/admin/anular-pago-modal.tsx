'use client';

import React, { useState } from 'react';
import { X, RefreshCw, AlertTriangle } from 'lucide-react';

interface AnularPagoModalProps {
  pagoParaAnular: any;
  alumnoSeleccionado: any;
  onClose: () => void;
  onSubmit: (motivo: string) => Promise<void>;
  cargandoAnulacion: boolean;
}

export default function AnularPagoModal({
  pagoParaAnular,
  alumnoSeleccionado,
  onClose,
  onSubmit,
  cargandoAnulacion
}: AnularPagoModalProps) {
  const [motivo, setMotivo] = useState('');

  if (!pagoParaAnular) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivo.trim()) return;
    await onSubmit(motivo.trim());
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl p-6 space-y-5 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <span className="bg-red-100 dark:bg-red-950/60 text-red-800 dark:text-red-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase border border-red-200 dark:border-red-800/50">
              Acción de Administrador
            </span>
            <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Anulación de Pago</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5 font-medium">
          <div>
            <span className="text-slate-500 dark:text-slate-400">Estudiante:</span>{' '}
            <strong className="text-slate-900 dark:text-white">{pagoParaAnular.estudiante_nombre || alumnoSeleccionado?.nombres} ({pagoParaAnular.dni_ce || alumnoSeleccionado?.dni_ce})</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Concepto / Cuota:</span>{' '}
            <strong className="text-indigo-600 dark:text-indigo-400">{pagoParaAnular.nro_cuota || pagoParaAnular.concepto || 'Cuota 1'}</strong>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400">Monto A Anular:</span>{' '}
            <strong className="text-red-600 dark:text-red-400 font-bold">S/ {Number(pagoParaAnular.monto || 150).toFixed(2)}</strong>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
              Motivo / Justificación Obligatoria <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              placeholder="Ej. Se ingresó por error un pago duplicado o comprobante rechazado por el banco..."
              className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
            />
            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
              ⚠️ Esta anulación actualizará Supabase, registrará auditoría forense y disparará una alerta a n8n.
            </p>
          </div>

          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargandoAnulacion || !motivo.trim()}
              className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md disabled:opacity-50 cursor-pointer"
            >
              {cargandoAnulacion ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              Confirmar Anulación y Notificar n8n
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
