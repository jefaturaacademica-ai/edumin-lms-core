'use client';

import React, { useState } from 'react';
import { 
  X, Calendar, Plus, Settings, CreditCard, CheckCircle2, RefreshCw, 
  FileText, Download, Award, Send, AlertTriangle, DollarSign, Check
} from 'lucide-react';

interface Ficha360ModalProps {
  alumnoSeleccionado: any;
  catalogoDiplomados: any[];
  onClose: () => void;
  onOpenEditCronograma: () => void;
  onSetPagoParaAnular: (pag: any) => void;
  onRegistrarPago: (cuotaIdxParam?: number, cargoExtraParam?: { concepto: string; monto: number }) => Promise<void>;
  montoPago: string;
  setMontoPago: (val: string) => void;
  comprobante: string;
  setComprobante: (val: string) => void;
  metodo: string;
  setMetodo: (val: string) => void;
  cargandoPago: boolean;
  mensaje: { texto: string; tipo: 'exito' | 'error' } | null;
  selectedCreditoIdx: number;
  setSelectedCreditoIdx: (idx: number) => void;
  onSetPagoIdParaValidar: (id: string | null) => void;
  onSetReciboImprimir: (pag: any) => void;
  onEnviarAlertaWhatsApp: () => Promise<void>;
  enviandoAlertaWhatsApp: boolean;
}

export default function Ficha360Modal({
  alumnoSeleccionado,
  catalogoDiplomados,
  onClose,
  onOpenEditCronograma,
  onSetPagoParaAnular,
  onRegistrarPago,
  montoPago,
  setMontoPago,
  comprobante,
  setComprobante,
  metodo,
  setMetodo,
  cargandoPago,
  mensaje,
  selectedCreditoIdx,
  setSelectedCreditoIdx,
  onSetPagoIdParaValidar,
  onSetReciboImprimir,
  onEnviarAlertaWhatsApp,
  enviandoAlertaWhatsApp
}: Ficha360ModalProps) {
  const [modalTab, setModalTab] = useState<'cronograma' | 'creditos' | 'academico' | 'retencion'>('cronograma');

  // Estado local para módulo de Cargos Extras (Examen Sustitutorio, Mora, etc.)
  const [conceptoExtra, setConceptoExtra] = useState<string>('Examen Sustitutorio');
  const [montoExtra, setMontoExtra] = useState<string>('25.00');

  if (!alumnoSeleccionado) return null;

  const creditosAlumno = alumnoSeleccionado.creditos || [];
  const creditoSeleccionado = creditosAlumno[selectedCreditoIdx] || creditosAlumno[0];
  const historialPagos = alumnoSeleccionado.historial_pagos || [];
  const cargosExtras = alumnoSeleccionado.cargos_extras || [];

  const handleAgregarCargoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = Number(montoExtra);
    if (!conceptoExtra || isNaN(montoNum) || montoNum <= 0) {
      alert('Por favor ingrese un concepto y monto válido para el cargo extra.');
      return;
    }
    await onRegistrarPago(undefined, { concepto: conceptoExtra, monto: montoNum });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-100 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-500 text-white px-2.5 py-0.5 rounded-full">
                Ficha 360° Estudiantil
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">DNI / CE: {alumnoSeleccionado.dni_ce}</span>
              {alumnoSeleccionado.deuda_total_pendiente === 0 && (
                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="size-3" /> Constancia de no adeudo Activa
                </span>
              )}
            </div>
            <h3 className="text-2xl font-black text-white">{alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}</h3>
            <p className="text-xs text-slate-300">{alumnoSeleccionado.email} • {alumnoSeleccionado.telefono} • Paquete: <strong className="text-amber-400">{alumnoSeleccionado.paquete_adquirido}</strong></p>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Pestañas de Navegación del Modal */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 pt-3 overflow-x-auto">
          {[
            { id: 'cronograma', label: 'Cronograma de Pagos & Cuotas', icon: Calendar },
            { id: 'creditos', label: `Cargos Extras (${cargosExtras.length})`, icon: Plus },
            { id: 'academico', label: `Avance Académico (${alumnoSeleccionado.avance_porcentaje}%)`, icon: Award },
            { id: 'retencion', label: `Deserción Cero (${alumnoSeleccionado.nivel_riesgo_churn})`, icon: Send }
          ].map((t) => {
            const IconComp = t.icon;
            const isActive = modalTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setModalTab(t.id as any)}
                className={`flex items-center gap-2 px-5 py-3 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive 
                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 bg-white dark:bg-slate-900 rounded-t-2xl shadow-sm' 
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <IconComp className="size-4" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* Cuerpo del Modal */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* TAB 1: CRONOGRAMA DE PAGOS */}
          {modalTab === 'cronograma' && (
            <div className="space-y-6">
              
              {/* Header Pagaré & Botones */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">Pagaré Nº</span>
                    <strong className="font-mono text-sm text-slate-900 dark:text-white">2026-I-000{alumnoSeleccionado.dni_ce.substring(0, 4)}</strong>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">Programa Inscrito</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 truncate block">{alumnoSeleccionado.diplomado_actual}</strong>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">Monto Total Programa</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black text-sm">S/ {alumnoSeleccionado.monto_total_programa.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-slate-400 uppercase block">Deuda Pendiente</span>
                    <strong className="text-red-600 dark:text-red-400 font-black text-sm">S/ {alumnoSeleccionado.deuda_total_pendiente.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onOpenEditCronograma}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Settings className="size-3.5" /> Editar Cuotas / Cronograma
                  </button>
                </div>
              </div>

              {/* Selector de Créditos / Contratos del Alumno (si posee más de 1) */}
              {creditosAlumno.length > 1 && (
                <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">Créditos del Alumno:</span>
                  <div className="flex gap-2">
                    {creditosAlumno.map((cred: any, cIdx: number) => (
                      <button
                        key={cIdx}
                        type="button"
                        onClick={() => setSelectedCreditoIdx(cIdx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          selectedCreditoIdx === cIdx 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        <CreditCard className="size-3.5" /> Crédito #{cred.num_credito || (cIdx + 1)} (S/ {cred.monto})
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tarjetas de Resumen Financiero por Crédito */}
              {creditoSeleccionado && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monto Crédito #{creditoSeleccionado.num_credito || (selectedCreditoIdx + 1)}</span>
                    <p className="text-lg font-black text-slate-900 dark:text-white mt-0.5">S/ {Number(creditoSeleccionado.monto || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Pagado</span>
                    <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">S/ {Number(creditoSeleccionado.total_pagado || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capital Pendiente</span>
                    <p className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5">S/ {Number(creditoSeleccionado.total_deuda || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado Crédito</span>
                    <p className={`text-sm font-black mt-1 ${creditoSeleccionado.total_deuda === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {creditoSeleccionado.total_deuda === 0 ? 'Cancelado' : 'Pendiente'}
                    </p>
                  </div>
                </div>
              )}

              {/* Tabla de Cuotas (Cuota 01 a Cuota 06) */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Calendar className="size-4 text-indigo-600 dark:text-indigo-400" /> Desglose de Cuotas (Cuota 01 - Cuota 06)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">1 Fila por Crédito en Supabase</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-2.5 px-4 text-center">Cuota</th>
                        <th className="py-2.5 px-4">Concepto</th>
                        <th className="py-2.5 px-4">Monto / Valor</th>
                        <th className="py-2.5 px-4">Estado Cuota</th>
                        <th className="py-2.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {(() => {
                        const cuotasObj = creditoSeleccionado?.cuotas || ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'];

                        return cuotasObj.map((cuotaVal: string, idx: number) => {
                          const nroFmt = (idx + 1).toString().padStart(2, '0');
                          const esNoCorresponde = cuotaVal === 'no corresponde';
                          const montoNum = Number(cuotaVal) || 0;
                          const estaPagada = !esNoCorresponde && montoNum > 0;

                          return (
                            <tr key={idx} className={esNoCorresponde ? 'bg-slate-50/50 dark:bg-slate-950/50 opacity-60' : estaPagada ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}>
                              <td className="py-3 px-4 font-bold text-center text-slate-700 dark:text-slate-300">Cuota {nroFmt}</td>
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                Cuota {nroFmt} - {alumnoSeleccionado.diplomado_actual}
                              </td>
                              <td className="py-3 px-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                                {esNoCorresponde ? (
                                  <span className="text-slate-400 italic">no corresponde</span>
                                ) : (
                                  `S/ ${montoNum.toFixed(2)}`
                                )}
                              </td>
                              <td className="py-3 px-4 font-bold">
                                {esNoCorresponde ? (
                                  <span className="bg-slate-100 dark:bg-slate-800 text-slate-400 text-[10px] px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                                    no corresponde
                                  </span>
                                ) : estaPagada ? (
                                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                    PAGADO (S/ {montoNum.toFixed(2)})
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                    PENDIENTE (S/ 0.00)
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                {!esNoCorresponde && (
                                  estaPagada ? (
                                    <button
                                      type="button"
                                      onClick={() => onSetPagoParaAnular({ id: creditoSeleccionado?.id, dni_ce: alumnoSeleccionado.dni_ce, cuota_index: idx, monto: montoNum })}
                                      className="text-[10px] text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold underline cursor-pointer"
                                    >
                                      Anular Cuota
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        const defMonto = creditoSeleccionado ? (creditoSeleccionado.monto / Math.max(1, creditoSeleccionado.cuotas.filter((x: string) => x !== 'no corresponde').length)) : 150;
                                        setMontoPago(defMonto.toString());
                                        onSetPagoIdParaValidar(creditoSeleccionado?.id || null);
                                        await onRegistrarPago(idx);
                                      }}
                                      disabled={cargandoPago}
                                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1"
                                    >
                                      {cargandoPago ? <RefreshCw className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />} Validar Pago
                                    </button>
                                  )
                                )}
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Formulario Rápido de Pago Manual */}
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Registrar Nuevo Pago en BD Supabase & Generar Recibo
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Monto Pagado (S/)</label>
                    <input 
                      type="number"
                      value={montoPago}
                      onChange={(e) => setMontoPago(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nº Comprobante / Operación</label>
                    <input 
                      type="text"
                      value={comprobante}
                      onChange={(e) => setComprobante(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Método de Pago</label>
                    <select
                      value={metodo}
                      onChange={(e) => setMetodo(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Yape / Plin">Yape / Plin</option>
                      <option value="Transferencia BCP">Transferencia BCP</option>
                      <option value="Tarjeta BBVA / Interbank">Tarjeta BBVA / Interbank</option>
                      <option value="Efectivo en Caja">Efectivo en Caja</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => onRegistrarPago()}
                  disabled={cargandoPago}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer w-full"
                >
                  {cargandoPago ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Confirmar Pago (+1 Cuota) y Notificar a n8n
                </button>

                {mensaje && (
                  <div className={`p-3 rounded-xl text-xs font-bold border ${mensaje.tipo === 'exito' ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800'}`}>
                    {mensaje.texto}
                  </div>
                )}
              </div>

              {/* Historial Detallado de Transacciones Registradas */}
              {historialPagos.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <FileText className="size-4 text-indigo-600 dark:text-indigo-400" /> Historial de Transacciones Registradas en Supabase ({historialPagos.length})
                  </h4>

                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="py-2.5 px-4">Concepto / Cuota</th>
                          <th className="py-2.5 px-4">Comprobante</th>
                          <th className="py-2.5 px-4">Monto Pagado</th>
                          <th className="py-2.5 px-4">Método</th>
                          <th className="py-2.5 px-4">Estado</th>
                          <th className="py-2.5 px-4 text-right">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                        {historialPagos.map((p: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{p.concepto || p.nro_cuota}</td>
                            <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-400">{p.comprobante || 'OP-984321'}</td>
                            <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">S/ {Number(p.monto || 0).toFixed(2)}</td>
                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">{p.metodo || 'Yape / Plin'}</td>
                            <td className="py-3 px-4">
                              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                {p.estado || 'APROBADO'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => onSetReciboImprimir(p)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold underline cursor-pointer"
                              >
                                Recibo
                              </button>
                              <button
                                type="button"
                                onClick={() => onSetPagoParaAnular(p)}
                                className="text-[10px] text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold underline cursor-pointer"
                              >
                                Anular
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: CARGOS EXTRAS (EXAMEN SUSTITUTORIO, MORA, ETC.) */}
          {modalTab === 'creditos' && (
            <div className="space-y-6">
              
              <div className="bg-indigo-50 dark:bg-indigo-950/40 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-sm font-black text-indigo-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Plus className="size-4 text-indigo-600 dark:text-indigo-400" /> Registrar Nuevo Cargo Extra / Trámite Especial
                    </h4>
                    <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-0.5">
                      Añade cobros adicionales por Examen Sustitutorio, Mora, Certificado Físico o Gastos Administrativos en Supabase.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleAgregarCargoSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Concepto del Cargo</label>
                    <select
                      value={conceptoExtra}
                      onChange={(e) => setConceptoExtra(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    >
                      <option value="Examen Sustitutorio">Examen Sustitutorio (S/ 25.00)</option>
                      <option value="Mora por Incumplimiento">Mora por Incumplimiento (S/ 50.00)</option>
                      <option value="Trámite de Certificado Físico">Trámite de Certificado Físico (S/ 80.00)</option>
                      <option value="Reingreso Extemporáneo">Reingreso Extemporáneo (S/ 100.00)</option>
                      <option value="Constancia Especial">Constancia Especial (S/ 35.00)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Monto a Cobrar (S/)</label>
                    <input 
                      type="number"
                      step="5"
                      value={montoExtra}
                      onChange={(e) => setMontoExtra(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      disabled={cargandoPago}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      {cargandoPago ? <RefreshCw className="size-4 animate-spin" /> : <Plus className="size-4" />}
                      Registrar Cargo en Supabase
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista de Cargos Registrados */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <CreditCard className="size-4 text-indigo-600 dark:text-indigo-400" /> Cargos Extras Registrados ({cargosExtras.length})
                </h4>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-2.5 px-4">Concepto</th>
                        <th className="py-2.5 px-4">Monto</th>
                        <th className="py-2.5 px-4">Fecha</th>
                        <th className="py-2.5 px-4">Estado</th>
                        <th className="py-2.5 px-4 text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {cargosExtras.length > 0 ? (
                        cargosExtras.map((cg: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{cg.concepto || 'Examen Sustitutorio'}</td>
                            <td className="py-3 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">S/ {Number(cg.monto || 0).toFixed(2)}</td>
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                              {new Date(cg.created_at || Date.now()).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                                {cg.estado || 'APROBADO'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right space-x-2">
                              <button
                                type="button"
                                onClick={() => onSetReciboImprimir(cg)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-bold underline cursor-pointer"
                              >
                                Recibo
                              </button>
                              <button
                                type="button"
                                onClick={() => onSetPagoParaAnular(cg)}
                                className="text-[10px] text-red-600 hover:text-red-800 dark:text-red-400 font-bold underline cursor-pointer"
                              >
                                Anular
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-slate-400 dark:text-slate-500 font-medium">
                            No hay cargos extras registrados para este estudiante.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: AVANCE ACADÉMICO CON BARRAS DE PROGRESO */}
          {modalTab === 'academico' && (() => {
            const diplomadosAlumno = [
              alumnoSeleccionado?.diplomado_actual,
              alumnoSeleccionado?.diplomado_2,
              (alumnoSeleccionado as any)?.diplomado_3,
              (alumnoSeleccionado as any)?.diplomado_4,
              (alumnoSeleccionado as any)?.diplomado_5,
            ].filter(Boolean) as string[];

            const listaDiplomados = diplomadosAlumno.length > 0 ? diplomadosAlumno : ['DIPLOMADO EN GESTIÓN MINERA'];

            return (
              <div className="space-y-6">
                <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Paquete & Diplomados Asignados</span>
                    <h4 className="text-sm font-black text-indigo-950 dark:text-white mt-0.5">
                      Paquete {alumnoSeleccionado.paquete_adquirido} ({listaDiplomados.length} Diplomado{listaDiplomados.length > 1 ? 's' : ''})
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase">Nota Promedio</span>
                    <p className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{alumnoSeleccionado.nota_promedio}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {listaDiplomados.map((nombreDipStr, dipIdx) => {
                    const nombreAlumnoDip = nombreDipStr.toLowerCase().trim();
                    const dipObj = (catalogoDiplomados || []).find((d: any) => 
                      d && typeof d.nombre === 'string' && d.nombre.toLowerCase().trim() === nombreAlumnoDip
                    ) || (catalogoDiplomados || [])[dipIdx % (catalogoDiplomados.length || 1)];

                    const modulosArray = (dipObj && dipObj.modulos && dipObj.modulos.length > 0) ? dipObj.modulos : [
                      { titulo: 'Módulo 01: Fundamentos y Marco Teórico', clases: [{ titulo: 'Clase 01: Introducción General', duracion: '45 min' }, { titulo: 'Clase 02: Normativa Legal', duracion: '50 min' }] },
                      { titulo: 'Módulo 02: Gestión Operativa y Control', clases: [{ titulo: 'Clase 03: Herramientas Operativas', duracion: '60 min' }, { titulo: 'Clase 04: Control de Riesgos', duracion: '55 min' }] },
                      { titulo: 'Módulo 03: Proyectos Avanzados', clases: [{ titulo: 'Clase 05: Casos Prácticos', duracion: '90 min' }] }
                    ];

                    let claseContador = 1;

                    return (
                      <div key={dipIdx} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full">
                              Diplomado 0{dipIdx + 1}
                            </span>
                            <h5 className="font-black text-sm text-slate-900 dark:text-white">{nombreDipStr}</h5>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400">
                            Código: {dipObj?.codigo || `DIP-0${dipIdx + 1}`} | Módulos: {modulosArray.length}
                          </span>
                        </div>

                        {/* Barra de progreso visual */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                            <span>Progreso Académico del Diplomado</span>
                            <span className="text-indigo-600 dark:text-indigo-400 font-mono">65% completado</span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div className="h-full bg-gradient-to-r from-indigo-600 to-cyan-500 rounded-full" style={{ width: '65%' }}></div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          {modulosArray.map((m: any, mIdx: number) => {
                            const modTitle = m.titulo || `Módulo 0${mIdx + 1}`;
                            const clases = m.clases || [];
                            return (
                              <div key={mIdx} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-200 dark:border-slate-800 space-y-2">
                                <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-1.5">
                                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{modTitle}</span>
                                  <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded text-[10px]">
                                    {mIdx === 0 ? 'Aprobado (Nota: 18)' : mIdx === 1 ? 'Aprobado (Nota: 16)' : 'En Curso'}
                                  </span>
                                </div>
                                <div className="space-y-1 pl-1">
                                  {clases.length > 0 ? (
                                    clases.map((c: any, cIdx: number) => {
                                      const currentClaseNum = claseContador++;
                                      const rawTitle = typeof c === 'string' ? c : (c.titulo || `Clase ${currentClaseNum.toString().padStart(2, '0')}`);
                                      const tituloFinal = rawTitle.includes('Clase') ? rawTitle : `Clase ${currentClaseNum.toString().padStart(2, '0')}: ${rawTitle}`;
                                      return (
                                        <div key={cIdx} className="text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-100 dark:border-slate-800 font-medium">
                                          <span className="flex items-center gap-2">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                            {tituloFinal}
                                          </span>
                                          <span className="text-[10px] text-slate-400 font-mono">{c.duracion || '45 min'}</span>
                                        </div>
                                      );
                                    })
                                  ) : (
                                    <div className="text-[11px] text-slate-400 italic">Clases programadas según temario.</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* TAB 4: RETENCIÓN & DESERCIÓN CERO */}
          {modalTab === 'retencion' && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Diagnóstico de Riesgo de Deserción</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-black ${
                    alumnoSeleccionado.nivel_riesgo_churn === 'CRÍTICO' ? 'bg-red-600 text-white animate-pulse' : 'bg-amber-600 text-white'
                  }`}>
                    {alumnoSeleccionado.nivel_riesgo_churn}
                  </span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  El estudiante registra <strong className="font-bold">{alumnoSeleccionado.dias_inactivo} días de inactividad</strong>. Última conexión: {alumnoSeleccionado.ultima_conexion}.
                </p>
              </div>

              <button
                onClick={onEnviarAlertaWhatsApp}
                disabled={enviandoAlertaWhatsApp}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {enviandoAlertaWhatsApp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                Disparar Alerta WhatsApp de Retención (Vía n8n / Wasapi)
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
