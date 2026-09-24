'use client';

import React from 'react';
import { Download, X } from 'lucide-react';

interface ReciboModalProps {
  reciboImprimir: any;
  alumnoSeleccionado: any;
  onClose: () => void;
}

export default function ReciboModal({
  reciboImprimir,
  alumnoSeleccionado,
  onClose
}: ReciboModalProps) {
  if (!reciboImprimir) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[10000] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl p-8 space-y-6 border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-start border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">EDUMIN LMS CORE</h2>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">Educación Ejecutiva en Minería y Seguridad</p>
          </div>
          <div className="text-right">
            <span className="bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-mono font-black text-xs px-2.5 py-1 rounded-md border border-indigo-200 dark:border-indigo-800 block">
              RECIBO INTERNO - {reciboImprimir.id ? String(reciboImprimir.id).substring(0, 6) : '1187'}
            </span>
            <span className="text-[10px] font-mono text-slate-400 block mt-1">{new Date().toLocaleDateString()}</span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Estudiante:</span>
            <strong className="text-slate-900 dark:text-white">{alumnoSeleccionado?.nombres} {alumnoSeleccionado?.apellidos}</strong>
          </div>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">DNI / CE:</span>
            <strong className="font-mono text-slate-900 dark:text-white">{alumnoSeleccionado?.dni_ce}</strong>
          </div>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Programa:</span>
            <strong className="text-indigo-600 dark:text-indigo-400">{alumnoSeleccionado?.diplomado_actual}</strong>
          </div>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Método de Pago:</span>
            <strong className="text-slate-800 dark:text-slate-200">{reciboImprimir.metodo || 'Yape / Plin'}</strong>
          </div>
          <div className="flex justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-slate-500 dark:text-slate-400 font-semibold">Nº Operación / Comprobante:</span>
            <strong className="font-mono text-slate-900 dark:text-white">{reciboImprimir.comprobante || 'OP-984321'}</strong>
          </div>
          <div className="flex justify-between bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-sm">
            <span className="text-emerald-900 dark:text-emerald-300 font-bold">Monto Total Pagado:</span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-black">S/ {Number(reciboImprimir.monto || 150).toFixed(2)}</strong>
          </div>
        </div>

        <div className="pt-2 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="size-4" /> Imprimir / Descargar PDF
          </button>
        </div>
      </div>
    </div>
  );
}
