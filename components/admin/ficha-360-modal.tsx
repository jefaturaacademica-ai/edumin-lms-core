'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Plus, Settings, CreditCard, CheckCircle2, RefreshCw, 
  FileText, Download, Award, Send, AlertTriangle, DollarSign, Check,
  User, UserCheck, Phone, Mail, Sparkles, BookOpen, Clock, ShieldAlert,
  ChevronRight, Layers, Lock, Unlock
} from 'lucide-react';

interface Ficha360ModalProps {
  alumnoSeleccionado: any;
  catalogoDiplomados: any[];
  onClose: () => void;
  onOpenEditCronograma?: () => void;
  onAbrirCronograma?: (cred?: any) => void;
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
  onRefetchEstudiantes?: () => void;
}

export default function Ficha360Modal({
  alumnoSeleccionado,
  catalogoDiplomados,
  onClose,
  onOpenEditCronograma,
  onAbrirCronograma,
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
  enviandoAlertaWhatsApp,
  onRefetchEstudiantes
}: Ficha360ModalProps) {
  // Pestañas modernas
  const [modalTab, setModalTab] = useState<'datos' | 'cronograma' | 'creditos' | 'academico' | 'retencion'>('datos');

  // Estado para edición de datos del estudiante
  const [editNombres, setEditNombres] = useState<string>('');
  const [editApellidos, setEditApellidos] = useState<string>('');
  const [editDni, setEditDni] = useState<string>('');
  const [editEmail, setEditEmail] = useState<string>('');
  const [editTelefono, setEditTelefono] = useState<string>('');
  const [editFechaNacimiento, setEditFechaNacimiento] = useState<string>('');
  const [editPaquete, setEditPaquete] = useState<string>('FULL');
  const [editBloqueado, setEditBloqueado] = useState<boolean>(false);
  const [editProrroga, setEditProrroga] = useState<string>('');
  const [guardandoPerfil, setGuardandoPerfil] = useState<boolean>(false);
  const [mensajePerfil, setMensajePerfil] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  // Estado para gestión de créditos EDUMIN adicionales
  const [extraDip, setExtraDip] = useState<number>(0);
  const [extraCur, setExtraCur] = useState<number>(0);
  const [guardandoCreditosExtra, setGuardandoCreditosExtra] = useState<boolean>(false);
  const [mensajeCreditosExtra, setMensajeCreditosExtra] = useState<{ texto: string; tipo: 'exito' | 'error' } | null>(null);

  // Sub-filtro para Avance Académico: 'todos' | 'diplomados' | 'cursos'
  const [filtroAcademico, setFiltroAcademico] = useState<'todos' | 'diplomados' | 'cursos'>('todos');

  // Estado local para módulo de Cargos Extras
  const [conceptoExtra, setConceptoExtra] = useState<string>('Examen Sustitutorio');
  const [montoExtra, setMontoExtra] = useState<string>('25.00');

  // Estado local para asignador de diplomados y cursos
  const [nuevoDiplomadoSeleccionado, setNuevoDiplomadoSeleccionado] = useState<string>('');
  const [cargandoDiplomadoAccion, setCargandoDiplomadoAccion] = useState(false);
  const [nuevoCursoSeleccionado, setNuevoCursoSeleccionado] = useState<string>('');
  const [cargandoCursoAccion, setCargandoCursoAccion] = useState(false);
  const [reiniciandoExamenModulo, setReiniciandoExamenModulo] = useState<string | null>(null);

  // Inicializar estado cuando cambia el alumno seleccionado
  useEffect(() => {
    if (alumnoSeleccionado) {
      setEditNombres(alumnoSeleccionado.nombres || '');
      setEditApellidos(alumnoSeleccionado.apellidos || '');
      setEditDni(alumnoSeleccionado.dni_ce || '');
      setEditEmail(alumnoSeleccionado.email || '');
      setEditTelefono(alumnoSeleccionado.telefono && alumnoSeleccionado.telefono !== 'Sin teléfono' ? alumnoSeleccionado.telefono : '');
      setEditFechaNacimiento(alumnoSeleccionado.fecha_nacimiento || '');
      setEditPaquete(alumnoSeleccionado.paquete_adquirido || 'FULL');
      setEditBloqueado(Boolean(alumnoSeleccionado.bloqueado));
      setEditProrroga(alumnoSeleccionado.prorroga_hasta || '');
      setExtraDip(alumnoSeleccionado.creditos_extra_diplomados || 0);
      setExtraCur(alumnoSeleccionado.creditos_extra_cursos || 0);
      setMensajePerfil(null);
      setMensajeCreditosExtra(null);
    }
  }, [alumnoSeleccionado]);

  if (!alumnoSeleccionado) return null;

  const creditosAlumno = alumnoSeleccionado.creditos || [];
  const creditoSeleccionado = creditosAlumno[selectedCreditoIdx] || creditosAlumno[0];
  const historialPagos = alumnoSeleccionado.historial_pagos || [];
  const cargosExtras = alumnoSeleccionado.cargos_extras || [];

  // Guardar perfil del estudiante
  const handleGuardarPerfilSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editNombres.trim() || !editApellidos.trim() || !editDni.trim()) {
      setMensajePerfil({ texto: 'Por favor complete nombres, apellidos y DNI / CE.', tipo: 'error' });
      return;
    }

    setGuardandoPerfil(true);
    setMensajePerfil(null);

    try {
      const res = await fetch('/api/admin/estudiantes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_perfil',
          studentId: alumnoSeleccionado.id,
          dni_ce: alumnoSeleccionado.dni_ce,
          nombres: editNombres.trim(),
          apellidos: editApellidos.trim(),
          new_dni_ce: editDni.trim(),
          email: editEmail.trim(),
          telefono: editTelefono.trim(),
          fecha_nacimiento: editFechaNacimiento.trim() || null,
          paquete_adquirido: editPaquete,
          bloqueado: editBloqueado,
          prorroga_hasta: editProrroga || null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMensajePerfil({ texto: 'Los datos del estudiante se actualizaron exitosamente en la base de datos.', tipo: 'exito' });
        onRefetchEstudiantes?.();
      } else {
        setMensajePerfil({ texto: data.error || 'Ocurrió un error al actualizar los datos.', tipo: 'error' });
      }
    } catch (err: any) {
      setMensajePerfil({ texto: `Error de conexión: ${err.message}`, tipo: 'error' });
    } finally {
      setGuardandoPerfil(false);
    }
  };

  // Guardar créditos adicionales
  const handleGuardarCreditosExtraSubmit = async () => {
    setGuardandoCreditosExtra(true);
    setMensajeCreditosExtra(null);

    try {
      const res = await fetch('/api/admin/estudiantes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_creditos_extra',
          studentId: alumnoSeleccionado.id,
          dni_ce: alumnoSeleccionado.dni_ce,
          creditos_extra_diplomados: extraDip,
          creditos_extra_cursos: extraCur
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMensajeCreditosExtra({ texto: 'Créditos adicionales actualizados y sincronizados para el estudiante.', tipo: 'exito' });
        onRefetchEstudiantes?.();
      } else {
        setMensajeCreditosExtra({ texto: data.error || 'Error al actualizar créditos.', tipo: 'error' });
      }
    } catch (err: any) {
      setMensajeCreditosExtra({ texto: `Error de conexión: ${err.message}`, tipo: 'error' });
    } finally {
      setGuardandoCreditosExtra(false);
    }
  };

  const handleAgregarCargoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = Number(montoExtra);
    if (!conceptoExtra || isNaN(montoNum) || montoNum <= 0) {
      alert('Por favor ingrese un concepto y monto válido para el cargo extra.');
      return;
    }
    await onRegistrarPago(undefined, { concepto: conceptoExtra, monto: montoNum });
  };

  const handleResetExamenModulo = async (diplomadoTitulo: string, moduloCodigo: string) => {
    const confirmMsg = `¿Desea reiniciar el intento de examen del "${moduloCodigo}" en "${diplomadoTitulo}" para el alumno ${alumnoSeleccionado.nombres} ${alumnoSeleccionado.apellidos}?\n\nEsto borrará la nota anterior y permitirá al alumno rendir su examen sustitutorio (S/ 25.00).`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setReiniciandoExamenModulo(moduloCodigo);
      const res = await fetch('/api/admin/estudiantes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_examen_modulo',
          studentId: alumnoSeleccionado.id,
          dni_ce: alumnoSeleccionado.dni_ce,
          diplomadoTitulo,
          moduloCodigo
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al reiniciar');
      }

      alert('Intento de examen reiniciado correctamente. El alumno ya puede rendir su examen sustitutorio.');
      onRefetchEstudiantes?.();
    } catch (err: any) {
      alert(`Error: ${err.message || 'No se pudo reiniciar el intento de examen.'}`);
    } finally {
      setReiniciandoExamenModulo(null);
    }
  };

  interface TabItem {
    id: 'datos' | 'cronograma' | 'creditos' | 'academico' | 'retencion';
    label: string;
    icon: any;
    badge?: string | number;
  }

  const tabsConfig: TabItem[] = [
    { id: 'datos', label: 'Datos del estudiante', icon: User },
    { id: 'cronograma', label: 'Cronograma de pagos', icon: Calendar },
    { id: 'creditos', label: 'Cargos extras', icon: Plus, badge: cargosExtras.length },
    { id: 'academico', label: 'Avance académico', icon: Award, badge: `${alumnoSeleccionado.avance_porcentaje || 0}%` },
    { id: 'retencion', label: 'Deserción cero', icon: Send, badge: alumnoSeleccionado.nivel_riesgo_churn }
  ];

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-800 transition-colors animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="min-w-0 pr-4">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-wider bg-indigo-600 text-white px-2.5 py-0.5 rounded-full shrink-0">
                Ficha 360° del estudiante
              </span>
              <span className="text-xs tabular-nums font-bold text-slate-300 shrink-0">
                DNI / CE: {alumnoSeleccionado.dni_ce}
              </span>
              {alumnoSeleccionado.deuda_total_pendiente === 0 && (
                <span className="text-[10px] font-bold bg-emerald-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="size-3" /> Sin deuda pendiente
                </span>
              )}
              {alumnoSeleccionado.bloqueado && (
                <span className="text-[10px] font-bold bg-rose-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                  <Lock className="size-3" /> Acceso bloqueado
                </span>
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-white truncate">
              {alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}
            </h3>
            <p className="text-xs text-slate-300 truncate mt-0.5">
              {alumnoSeleccionado.email} • {alumnoSeleccionado.telefono || 'Sin teléfono'} • Paquete: <strong className="text-amber-400">{alumnoSeleccionado.paquete_adquirido}</strong>
            </p>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition cursor-pointer shrink-0"
            title="Cerrar ficha"
          >
            <X className="size-6" />
          </button>
        </div>

        {/* Pestañas de Navegación del Modal (Estilo Píldoras Modernas sin bordes apretados) */}
        <div className="px-6 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/80 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
          {tabsConfig.map((t) => {
            const IconComp = t.icon;
            const isActive = modalTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setModalTab(t.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/20' 
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <IconComp className="size-4 shrink-0" />
                <span>{t.label}</span>
                {t.badge !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}>
                    {t.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Cuerpo del Modal con scroll limpio */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          
          {/* TAB 1: DATOS DEL ESTUDIANTE Y EDICIÓN COMPLETA */}
          {modalTab === 'datos' && (
            <div className="space-y-6">
              
              {/* Notificación de resultado de guardado */}
              {mensajePerfil && (
                <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                  mensajePerfil.tipo === 'exito'
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                }`}>
                  {mensajePerfil.tipo === 'exito' ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertTriangle className="size-4 shrink-0" />}
                  <span>{mensajePerfil.texto}</span>
                </div>
              )}

              <form onSubmit={handleGuardarPerfilSubmit} className="space-y-5">
                
                {/* Bloque 1: Identificación y Contacto */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <User className="size-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Información personal y de contacto
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Nombres
                      </label>
                      <input 
                        type="text"
                        value={editNombres}
                        onChange={(e) => setEditNombres(e.target.value)}
                        placeholder="Nombres completos"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Apellidos
                      </label>
                      <input 
                        type="text"
                        value={editApellidos}
                        onChange={(e) => setEditApellidos(e.target.value)}
                        placeholder="Apellidos completos"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        DNI / CE (Identificación Oficial)
                      </label>
                      <input 
                        type="text"
                        value={editDni}
                        onChange={(e) => setEditDni(e.target.value)}
                        placeholder="Número de documento"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold tabular-nums text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Correo electrónico
                      </label>
                      <input 
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        placeholder="correo@ejemplo.com"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Teléfono / WhatsApp
                      </label>
                      <input 
                        type="tel"
                        value={editTelefono}
                        onChange={(e) => setEditTelefono(e.target.value)}
                        placeholder="999888777"
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold tabular-nums text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Fecha de nacimiento
                      </label>
                      <input 
                        type="date"
                        value={editFechaNacimiento}
                        onChange={(e) => setEditFechaNacimiento(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold tabular-nums text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Bloque 2: Paquete y Estado de Acceso */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                    <Layers className="size-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                      Paquete contratado y control de acceso
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Paquete de estudios
                      </label>
                      <select
                        value={editPaquete}
                        onChange={(e) => setEditPaquete(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                      >
                        <option value="COMPLETO">COMPLETO (1 Diplomado + 3 Cursos)</option>
                        <option value="FULL">FULL (1 Diplomado + 5 Cursos)</option>
                        <option value="ILIMITADO">ILIMITADO (Acceso Total)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Estado de acceso a la plataforma
                      </label>
                      <select
                        value={editBloqueado ? 'bloqueado' : 'activo'}
                        onChange={(e) => setEditBloqueado(e.target.value === 'bloqueado')}
                        className={`w-full px-3.5 py-2.5 border rounded-xl text-xs font-bold outline-none transition-colors ${
                          editBloqueado 
                            ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-300' 
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                        }`}
                      >
                        <option value="activo">Habilitado (Acceso regular)</option>
                        <option value="bloqueado">Bloqueado por deuda</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase mb-1">
                        Prórroga de acceso hasta
                      </label>
                      <input 
                        type="date"
                        value={editProrroga}
                        onChange={(e) => setEditProrroga(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold tabular-nums text-slate-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Botón de Guardado */}
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={guardandoPerfil}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
                  >
                    {guardandoPerfil ? <RefreshCw className="size-4 animate-spin" /> : <Check className="size-4" />}
                    <span>{guardandoPerfil ? 'Guardando cambios...' : 'Guardar datos del estudiante'}</span>
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 2: CRONOGRAMA DE PAGOS */}
          {modalTab === 'cronograma' && (
            <div className="space-y-6">
              
              {/* Header Pagaré & Botones */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="tabular-nums text-[10px] text-slate-400 uppercase block">Pagaré Nº</span>
                    <strong className="tabular-nums text-sm text-slate-900 dark:text-white">2026-I-000{alumnoSeleccionado.dni_ce.substring(0, 4)}</strong>
                  </div>
                  <div>
                    <span className="tabular-nums text-[10px] text-slate-400 uppercase block">Programa inscrito</span>
                    <strong className="text-indigo-600 dark:text-indigo-400 truncate block">{alumnoSeleccionado.diplomado_actual}</strong>
                  </div>
                  <div>
                    <span className="tabular-nums text-[10px] text-slate-400 uppercase block">Monto total programa</span>
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black tabular-nums text-sm">S/ {alumnoSeleccionado.monto_total_programa.toFixed(2)}</strong>
                  </div>
                  <div>
                    <span className="tabular-nums text-[10px] text-slate-400 uppercase block">Deuda pendiente</span>
                    <strong className="text-red-600 dark:text-red-400 font-black tabular-nums text-sm">S/ {alumnoSeleccionado.deuda_total_pendiente.toFixed(2)}</strong>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onOpenEditCronograma}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Settings className="size-3.5" /> Editar cronograma
                  </button>
                </div>
              </div>

              {/* Selector de Créditos / Contratos del Alumno (si posee más de 1) */}
              {creditosAlumno.length > 1 && (
                <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3 rounded-2xl border border-indigo-100 dark:border-indigo-900 flex items-center gap-2">
                  <span className="text-xs font-bold text-indigo-900 dark:text-indigo-300 uppercase">Créditos del alumno:</span>
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
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Monto crédito #{creditoSeleccionado.num_credito || (selectedCreditoIdx + 1)}</span>
                    <p className="text-lg font-black tabular-nums text-slate-900 dark:text-white mt-0.5">S/ {Number(creditoSeleccionado.monto || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total pagado</span>
                    <p className="text-lg font-black tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">S/ {Number(creditoSeleccionado.total_pagado || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Capital pendiente</span>
                    <p className="text-lg font-black tabular-nums text-red-600 dark:text-red-400 mt-0.5">S/ {Number(creditoSeleccionado.total_deuda || 0).toFixed(2)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado crédito</span>
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
                    <Calendar className="size-4 text-indigo-600 dark:text-indigo-400" /> Desglose de cuotas
                  </h4>
                  <span className="text-[10px] text-slate-400 tabular-nums">Sincronizado con Supabase</span>
                </div>

                <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                        <th className="py-2.5 px-4 text-center">Cuota</th>
                        <th className="py-2.5 px-4">Concepto</th>
                        <th className="py-2.5 px-4">Monto / Valor</th>
                        <th className="py-2.5 px-4">Estado cuota</th>
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
                              <td className="py-3 px-4 tabular-nums font-bold text-slate-800 dark:text-slate-200">
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
                                    Pagado (S/ {montoNum.toFixed(2)})
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                                    Pendiente (S/ 0.00)
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
                                      Anular cuota
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
                                      {cargandoPago ? <RefreshCw className="size-3 animate-spin" /> : <CheckCircle2 className="size-3" />} Validar pago
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
                  <CreditCard className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Registrar nuevo pago y generar recibo
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Monto pagado (S/)</label>
                    <input 
                      type="number"
                      value={montoPago}
                      onChange={(e) => setMontoPago(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Nº comprobante / operación</label>
                    <input 
                      type="text"
                      value={comprobante}
                      onChange={(e) => setComprobante(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs tabular-nums font-bold text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Método de pago</label>
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
                  {cargandoPago ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                  <span>{cargandoPago ? 'Procesando pago...' : 'Registrar pago'}</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: CARGOS EXTRAS */}
          {modalTab === 'creditos' && (
            <div className="space-y-6">
              <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Añadir cargo extra al estudiante
                </h4>

                <form onSubmit={handleAgregarCargoSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Concepto</label>
                    <input 
                      type="text"
                      value={conceptoExtra}
                      onChange={(e) => setConceptoExtra(e.target.value)}
                      placeholder="Ej. Examen Sustitutorio, Mora"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">Monto (S/)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={montoExtra}
                      onChange={(e) => setMontoExtra(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={cargandoPago}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
                  >
                    {cargandoPago ? <RefreshCw className="size-3 animate-spin" /> : <Plus className="size-3" />}
                    <span>Añadir cargo</span>
                  </button>
                </form>
              </div>

              {/* Historial de Cargos Extras */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Historial de cargos extras registrados
                </h4>

                {cargosExtras.length === 0 ? (
                  <div className="bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                    No se registran cargos adicionales para este estudiante.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 shadow-sm">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold tracking-wider">
                          <th className="py-2.5 px-4">Concepto</th>
                          <th className="py-2.5 px-4">Monto</th>
                          <th className="py-2.5 px-4">Fecha</th>
                          <th className="py-2.5 px-4">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {cargosExtras.map((cargo: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{cargo.concepto || 'Cargo adicional'}</td>
                            <td className="py-3 px-4 tabular-nums font-bold text-slate-800 dark:text-slate-200">S/ {Number(cargo.monto || 0).toFixed(2)}</td>
                            <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{cargo.created_at ? new Date(cargo.created_at).toLocaleDateString('es-PE') : '-'}</td>
                            <td className="py-3 px-4">
                              <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold">
                                {cargo.estado || 'Aprobado'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: AVANCE ACADÉMICO SEPARADO (DIPLOMADOS Y CURSOS) Y CRÉDITOS EXTRA */}
          {modalTab === 'academico' && (() => {
            const listDiplomadosExistentes = (
              alumnoSeleccionado.diplomados_lista && alumnoSeleccionado.diplomados_lista.length > 0
                ? alumnoSeleccionado.diplomados_lista
                : (alumnoSeleccionado.diplomados_json || []).map((d: any) => d.titulo)
            ) as string[];

            const listCursosExistentes = (
              (alumnoSeleccionado.cursos_json || []).map((c: any) => c.titulo || c.codigo)
            ) as string[];

            const listaDiplomados = listDiplomadosExistentes;
            const listaCursos = listCursosExistentes;

            // 22 diplomados oficiales del catálogo
            const titulosCatalogo22 = (catalogoDiplomados || [])
              .filter((d: any) => d && (d.tipo === 'diplomado' || String(d.id).startsWith('dip-') || String(d.categoria).includes('Diplomados')))
              .map((d: any) => (d.titulo || d.nombre || '').trim().toUpperCase())
              .filter(Boolean);

            const titulosOficiales22 = titulosCatalogo22.length > 0 ? titulosCatalogo22 : [
              "DERECHO MINERO",
              "ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA",
              "GEOLOGÍA MINERA",
              "GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL",
              "GEOMETALURGIA",
              "GEOTECNIA MINERA",
              "GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ",
              "GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA",
              "GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL",
              "GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS",
              "GESTIÓN DE OPERACIONES INDUSTRIALES",
              "GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO",
              "GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES",
              "GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA",
              "GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA",
              "GESTIÓN MINERA",
              "LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS",
              "MINERÍA 4.0 Y DIGITALIZACIÓN MINERA",
              "PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL MINERA",
              "SEGURIDAD INDUSTRIAL",
              "SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA",
              "SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA"
            ];

            // 76 Cursos oficiales del catálogo
            const titulosCursos76 = (catalogoDiplomados || [])
              .filter((d: any) => d && (d.tipo === 'curso' || String(d.id).startsWith('cur-') || String(d.categoria).includes('Cursos')))
              .map((d: any) => (d.titulo || d.nombre || '').trim().toUpperCase())
              .filter(Boolean);

            const handleGuardarDiplomadosSubmit = async (nuevosDips: string[]) => {
              setCargandoDiplomadoAccion(true);
              try {
                const res = await fetch('/api/admin/estudiantes', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update_diplomados',
                    studentId: alumnoSeleccionado.id,
                    dni_ce: alumnoSeleccionado.dni_ce,
                    diplomados: nuevosDips
                  })
                });

                if (res.ok) {
                  alert('Diplomados actualizados y sincronizados en la base de datos.');
                  if (onRefetchEstudiantes) onRefetchEstudiantes();
                } else {
                  const errData = await res.json();
                  alert(`Error al actualizar: ${errData.error}`);
                }
              } catch (e: any) {
                alert(`Error de conexión: ${e.message}`);
              } finally {
                setCargandoDiplomadoAccion(false);
              }
            };

            const handleGuardarCursosSubmit = async (nuevosCursos: string[]) => {
              setCargandoCursoAccion(true);
              try {
                const res = await fetch('/api/admin/estudiantes', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update_cursos',
                    studentId: alumnoSeleccionado.id,
                    dni_ce: alumnoSeleccionado.dni_ce,
                    cursos: nuevosCursos
                  })
                });

                if (res.ok) {
                  alert('Cursos de especialización actualizados en la base de datos.');
                  if (onRefetchEstudiantes) onRefetchEstudiantes();
                } else {
                  const errData = await res.json();
                  alert(`Error al actualizar cursos: ${errData.error}`);
                }
              } catch (e: any) {
                alert(`Error de conexión: ${e.message}`);
              } finally {
                setCargandoCursoAccion(false);
              }
            };

            const handleAgregarNuevoDiplomado = () => {
              if (!nuevoDiplomadoSeleccionado) {
                alert('Por favor selecciona un diplomado de la lista.');
                return;
              }
              if (listDiplomadosExistentes.includes(nuevoDiplomadoSeleccionado)) {
                alert('El alumno ya tiene asignado este diplomado.');
                return;
              }
              const actualizados = [...listDiplomadosExistentes, nuevoDiplomadoSeleccionado];
              handleGuardarDiplomadosSubmit(actualizados);
              setNuevoDiplomadoSeleccionado('');
            };

            const handleQuitarDiplomadoExistente = (indexAQuitar: number) => {
              if (!window.confirm('¿Desea desvincular este diplomado del estudiante?')) return;
              const actualizados = listDiplomadosExistentes.filter((_, idx) => idx !== indexAQuitar);
              handleGuardarDiplomadosSubmit(actualizados);
            };

            const handleAgregarNuevoCurso = () => {
              if (!nuevoCursoSeleccionado) {
                alert('Por favor selecciona un curso de la lista.');
                return;
              }
              if (listCursosExistentes.includes(nuevoCursoSeleccionado)) {
                alert('El alumno ya tiene asignado este curso.');
                return;
              }
              const actualizados = [...listCursosExistentes, nuevoCursoSeleccionado];
              handleGuardarCursosSubmit(actualizados);
              setNuevoCursoSeleccionado('');
            };

            const handleQuitarCursoExistente = (indexAQuitar: number) => {
              if (!window.confirm('¿Desea desvincular este curso del estudiante?')) return;
              const actualizados = listCursosExistentes.filter((_, idx) => idx !== indexAQuitar);
              handleGuardarCursosSubmit(actualizados);
            };

            // Créditos base según el paquete del alumno
            const paqueteNombre = (alumnoSeleccionado.paquete_adquirido || 'FULL').toUpperCase();
            const baseDip = paqueteNombre === 'ILIMITADO' ? 3 : 1;
            const baseCur = paqueteNombre === 'ILIMITADO' ? 15 : (paqueteNombre === 'FULL' ? 5 : 3);

            const totalDipContratados = baseDip + extraDip;
            const totalCurContratados = baseCur + extraCur;

            const dipConsumidos = listDiplomadosExistentes.length;
            const curConsumidos = listCursosExistentes.length;

            const dipDisponibles = Math.max(0, totalDipContratados - dipConsumidos);
            const curDisponibles = Math.max(0, totalCurContratados - curConsumidos);

            return (
              <div className="space-y-6">

                {/* PANEL SUPERIOR: CRÉDITOS Y CUPOS TOTALES DEL ESTUDIANTE */}
                <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                        Control de créditos EDUMIN
                      </span>
                      <h4 className="text-sm font-black text-slate-900 dark:text-white">
                        Créditos totales y adicionales del estudiante
                      </h4>
                    </div>
                    <div className="text-right">
                      <span className="text-xs bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800 font-bold inline-block">
                        Paquete {paqueteNombre}
                      </span>
                    </div>
                  </div>

                  {mensajeCreditosExtra && (
                    <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                      mensajeCreditosExtra.tipo === 'exito'
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}>
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>{mensajeCreditosExtra.texto}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Tarjeta 1: Diplomados Totales (Base + Extra) */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-2xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Award className="size-4 text-indigo-600 dark:text-indigo-400" />
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Diplomados autorizados
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                            Base del paquete: <strong className="text-slate-700 dark:text-slate-300">{baseDip} diplomado</strong>
                            {extraDip > 0 && <span className="text-indigo-600 dark:text-indigo-400 font-bold"> (+{extraDip} adicional{extraDip > 1 ? 'es' : ''})</span>}
                          </span>
                        </div>

                        {/* Contador interactivo del total */}
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            disabled={extraDip <= 0}
                            onClick={() => setExtraDip(Math.max(0, extraDip - 1))}
                            className="size-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold grid place-items-center cursor-pointer transition shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Disminuir créditos extra"
                          >
                            -
                          </button>
                          <div className="w-10 text-center">
                            <span className="font-black tabular-nums text-base text-indigo-600 dark:text-indigo-400 block">
                              {totalDipContratados}
                            </span>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold leading-none">
                              Total
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExtraDip(extraDip + 1)}
                            className="size-7 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold grid place-items-center cursor-pointer transition shadow-2xs"
                            title="Sumar 1 crédito adicional"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Estado de consumo y disponibilidad */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Inscritos: <strong className="text-slate-800 dark:text-slate-200">{dipConsumidos}</strong>
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          dipDisponibles > 0 
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                          {dipDisponibles > 0 ? `${dipDisponibles} disponible(s) para elegir` : 'Todos asignados'}
                        </span>
                      </div>
                    </div>

                    {/* Tarjeta 2: Cursos Totales (Base + Extra) */}
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between gap-3 shadow-2xs">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="size-4 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              Cursos libres autorizados
                            </span>
                          </div>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">
                            Base del paquete: <strong className="text-slate-700 dark:text-slate-300">{baseCur} cursos</strong>
                            {extraCur > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-bold"> (+{extraCur} adicional{extraCur > 1 ? 'es' : ''})</span>}
                          </span>
                        </div>

                        {/* Contador interactivo del total */}
                        <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                          <button
                            type="button"
                            disabled={extraCur <= 0}
                            onClick={() => setExtraCur(Math.max(0, extraCur - 1))}
                            className="size-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-bold grid place-items-center cursor-pointer transition shadow-2xs disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Disminuir créditos extra"
                          >
                            -
                          </button>
                          <div className="w-10 text-center">
                            <span className="font-black tabular-nums text-base text-emerald-600 dark:text-emerald-400 block">
                              {totalCurContratados}
                            </span>
                            <span className="text-[9px] text-slate-400 block uppercase font-bold leading-none">
                              Total
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setExtraCur(extraCur + 1)}
                            className="size-7 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold grid place-items-center cursor-pointer transition shadow-2xs"
                            title="Sumar 1 crédito adicional"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      {/* Estado de consumo y disponibilidad */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400 text-[11px]">
                          Inscritos: <strong className="text-slate-800 dark:text-slate-200">{curConsumidos}</strong>
                        </span>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          curDisponibles > 0 
                            ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}>
                          {curDisponibles > 0 ? `${curDisponibles} disponible(s) para elegir` : 'Todos asignados'}
                        </span>
                      </div>
                    </div>

                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      disabled={guardandoCreditosExtra}
                      onClick={handleGuardarCreditosExtraSubmit}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-sm"
                    >
                      {guardandoCreditosExtra ? <RefreshCw className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                      <span>{guardandoCreditosExtra ? 'Guardando créditos...' : 'Guardar créditos adicionales'}</span>
                    </button>
                  </div>
                </div>

                {/* SUB-TABS PARA SEPARAR DIPLOMADOS Y CURSOS */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
                  <button
                    type="button"
                    onClick={() => setFiltroAcademico('todos')}
                    className={`pb-2.5 px-4 font-bold text-xs transition border-b-2 cursor-pointer ${
                      filtroAcademico === 'todos'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Ver todo ({listaDiplomados.length + listaCursos.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAcademico('diplomados')}
                    className={`pb-2.5 px-4 font-bold text-xs transition border-b-2 cursor-pointer ${
                      filtroAcademico === 'diplomados'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Diplomados ({listaDiplomados.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAcademico('cursos')}
                    className={`pb-2.5 px-4 font-bold text-xs transition border-b-2 cursor-pointer ${
                      filtroAcademico === 'cursos'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Cursos y talleres ({listaCursos.length})
                  </button>
                </div>

                {/* BLOQUE DIPLOMADOS: ASIGNADOR Y LISTADO DETALLADO */}
                {(filtroAcademico === 'todos' || filtroAcademico === 'diplomados') && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                            Catálogo oficial de 22 diplomados
                          </span>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            Asignar diplomado a {alumnoSeleccionado.nombres}
                          </h4>
                        </div>
                        <span className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-500/20 font-bold shrink-0">
                          {listDiplomadosExistentes.length} diplomado(s) inscritos
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <select
                          value={nuevoDiplomadoSeleccionado}
                          onChange={(e) => setNuevoDiplomadoSeleccionado(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl p-3 outline-none focus:border-indigo-500 transition-colors w-full"
                        >
                          <option value="">Seleccionar diplomado del catálogo</option>
                          {titulosOficiales22.map((t, idx) => (
                            <option key={idx} value={t} disabled={listDiplomadosExistentes.includes(t)}>
                              {listDiplomadosExistentes.includes(t) ? `${t} (Ya asignado)` : `[DIP-${(idx + 1).toString().padStart(2, '0')}] ${t}`}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={cargandoDiplomadoAccion || !nuevoDiplomadoSeleccionado}
                          onClick={handleAgregarNuevoDiplomado}
                          className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shrink-0 shadow-sm"
                        >
                          <Plus className="size-4" />
                          <span>{cargandoDiplomadoAccion ? 'Guardando...' : 'Añadir diplomado'}</span>
                        </button>
                      </div>

                      {/* Chips de diplomados vinculados con botón de quitar */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {listDiplomadosExistentes.map((dipName, dIdx) => (
                          <div key={dIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">Diplomado {dIdx + 1}</span>
                            <span>{dipName}</span>
                            <button
                              type="button"
                              onClick={() => handleQuitarDiplomadoExistente(dIdx)}
                              title="Desvincular diplomado"
                              className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Módulos y avance de cada diplomado */}
                    <div className="space-y-4">
                      {listaDiplomados.map((nombreDipStr, dipIdx) => {
                        const nombreAlumnoDip = nombreDipStr.toLowerCase().trim();
                        const dipObj = (catalogoDiplomados || []).find((d: any) => 
                          d && typeof d.nombre === 'string' && d.nombre.toLowerCase().trim() === nombreAlumnoDip
                        ) || (catalogoDiplomados || [])[dipIdx % (catalogoDiplomados.length || 1)];

                        const userDipInfo = (alumnoSeleccionado.diplomados_json || []).find((d: any) => d.titulo === nombreDipStr);
                        const avanceDip = userDipInfo?.avance ?? 0;

                        const modulosArray = (dipObj && dipObj.modulos && dipObj.modulos.length > 0) ? dipObj.modulos : [
                          { titulo: 'Módulo 01: Fundamentos y Marco Teórico', clases: [{ titulo: 'Clase 01: Introducción General', duracion: '45 min' }, { titulo: 'Clase 02: Normativa Legal', duracion: '50 min' }] },
                          { titulo: 'Módulo 02: Gestión Operativa y Control', clases: [{ titulo: 'Clase 03: Herramientas Operativas', duracion: '60 min' }, { titulo: 'Clase 04: Control de Riesgos', duracion: '55 min' }] },
                          { titulo: 'Módulo 03: Proyectos Avanzados', clases: [{ titulo: 'Clase 05: Casos Prácticos', duracion: '90 min' }] }
                        ];

                        let claseContador = 1;

                        return (
                          <div key={dipIdx} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                              <div className="flex items-center gap-2">
                                <span className="bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
                                  Diplomado {dipIdx + 1}
                                </span>
                                <h5 className="font-black text-sm text-slate-900 dark:text-white">{nombreDipStr}</h5>
                              </div>
                              <span className="text-[10px] tabular-nums text-slate-400">
                                Código: {dipObj?.codigo || `DIP-0${dipIdx + 1}`} | Módulos: {modulosArray.length}
                              </span>
                            </div>

                            {/* Barra de progreso visual */}
                            <div className="space-y-1">
                              <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                <span>Progreso académico del diplomado</span>
                                <span className="text-indigo-600 dark:text-indigo-400 tabular-nums">{avanceDip}% completado</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${avanceDip}%` }}></div>
                              </div>
                            </div>

                            <div className="space-y-3">
                              {modulosArray.map((m: any, mIdx: number) => {
                                const modTitle = m.titulo || m.nombre || `Módulo 0${mIdx + 1}`;
                                const modCodigoKey = m.codigo || `Módulo 0${mIdx + 1}`;

                                const userModInfo = (userDipInfo?.modulos || []).find((um: any) =>
                                  um.codigo === modCodigoKey ||
                                  um.id === modCodigoKey ||
                                  (um.nombre && m.titulo && um.nombre.toLowerCase().includes(m.titulo.toLowerCase()))
                                ) || userDipInfo?.modulos?.[mIdx];

                                const tieneNota = userModInfo?.nota !== undefined && userModInfo?.nota !== null;
                                const notaNum = tieneNota ? Number(userModInfo.nota) : null;
                                const estaAprobado = userModInfo?.completado || (notaNum !== null && notaNum >= 12);
                                const haRendido = Boolean(userModInfo?.rendido || tieneNota);
                                const estaReiniciando = reiniciandoExamenModulo === modCodigoKey;

                                const clases = m.clases || [];
                                return (
                                  <div key={mIdx} className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 space-y-2">
                                    <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
                                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{modTitle}</span>
                                      
                                      <div className="flex items-center gap-2">
                                        {haRendido && notaNum !== null ? (
                                          <span className={`font-bold px-2 py-0.5 rounded text-[10px] border ${
                                            estaAprobado
                                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                          }`}>
                                            {estaAprobado ? `Aprobado (Nota: ${notaNum.toString().padStart(2, '0')}/20)` : `Desaprobado (Nota: ${notaNum.toString().padStart(2, '0')}/20)`}
                                          </span>
                                        ) : (
                                          <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded text-[10px]">
                                            Pendiente de examen
                                          </span>
                                        )}

                                        {haRendido && (
                                          <button
                                            type="button"
                                            disabled={estaReiniciando}
                                            onClick={() => handleResetExamenModulo(nombreDipStr, modCodigoKey)}
                                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                            title="Borrar intento de examen para permitir que el alumno rinda su examen sustitutorio (S/ 25)"
                                          >
                                            <RefreshCw className={`w-3 h-3 ${estaReiniciando ? 'animate-spin' : ''}`} />
                                            <span>{estaReiniciando ? 'Reiniciando...' : 'Borrar intento / Sustitutorio (S/ 25)'}</span>
                                          </button>
                                        )}
                                      </div>
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
                                              <span className="text-[10px] text-slate-400 tabular-nums">{c.duracion || '45 min'}</span>
                                            </div>
                                          );
                                        })
                                      ) : (
                                        <div className="text-[11px] text-slate-400 italic">Clases programadas según temario oficial.</div>
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
                )}

                {/* BLOQUE CURSOS: ASIGNADOR Y LISTADO DETALLADO */}
                {(filtroAcademico === 'todos' || filtroAcademico === 'cursos') && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
                            Catálogo oficial de 76 cursos especializados
                          </span>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            Asignar cursos a {alumnoSeleccionado.nombres}
                          </h4>
                        </div>
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold shrink-0">
                          {listCursosExistentes.length} curso(s) inscritos
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <select
                          value={nuevoCursoSeleccionado}
                          onChange={(e) => setNuevoCursoSeleccionado(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl p-3 outline-none focus:border-emerald-500 transition-colors w-full"
                        >
                          <option value="">Seleccionar curso de especialización</option>
                          {titulosCursos76.map((t, idx) => (
                            <option key={idx} value={t} disabled={listCursosExistentes.includes(t)}>
                              {listCursosExistentes.includes(t) ? `${t} (Ya asignado)` : `[CUR-${(idx + 1).toString().padStart(2, '0')}] ${t}`}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={cargandoCursoAccion || !nuevoCursoSeleccionado}
                          onClick={handleAgregarNuevoCurso}
                          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shrink-0 shadow-sm"
                        >
                          <Plus className="size-4" />
                          <span>{cargandoCursoAccion ? 'Guardando...' : 'Añadir curso'}</span>
                        </button>
                      </div>

                      {/* Chips de cursos matriculados con opción de desvincular */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {listCursosExistentes.map((curName, cIdx) => (
                          <div key={cIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                            <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">Curso {cIdx + 1}</span>
                            <span>{curName}</span>
                            <button
                              type="button"
                              onClick={() => handleQuitarCursoExistente(cIdx)}
                              title="Desvincular curso"
                              className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

              </div>
            );
          })()}

          {/* TAB 5: RETENCIÓN & DESERCIÓN CERO */}
          {modalTab === 'retencion' && (
            <div className="space-y-6">
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-6 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-amber-900 dark:text-amber-300 text-sm">Diagnóstico de riesgo de deserción</h4>
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
                <span>Disparar alerta WhatsApp de retención</span>
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
