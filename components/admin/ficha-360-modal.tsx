'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Calendar, Plus, Settings, CreditCard, CheckCircle2, RefreshCw, 
  FileText, Download, Award, Send, AlertTriangle, Check, Coins, Receipt, Wallet,
  User, UserCheck, Phone, Mail, Sparkles, BookOpen, Clock, ShieldAlert,
  ChevronRight, Layers, Lock, Unlock, Trash2, ChevronDown, ChevronUp
} from 'lucide-react';

interface Ficha360ModalProps {
  alumnoSeleccionado: any;
  catalogoDiplomados: any[];
  onClose: () => void;
  onOpenEditCronograma?: () => void;
  onAbrirCronograma?: (cred?: any) => void;
  onSetPagoParaAnular: (pag: any) => void;
  onRegistrarPago: (cuotaIdxParam?: number, cargoExtraParam?: { concepto: string; monto: number }, datosExtraParam?: { nro_recibo?: string; nro_operacion?: string }) => Promise<void>;
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

  // Sub-filtro para Avance Académico: 'todos' | 'diplomados' | 'cursos' | 'talleres'
  const [filtroAcademico, setFiltroAcademico] = useState<'todos' | 'diplomados' | 'cursos' | 'talleres'>('todos');

  // Estado local para módulo de Cargos Extras
  const [conceptoExtra, setConceptoExtra] = useState<string>('Examen Sustitutorio');
  const [montoExtra, setMontoExtra] = useState<string>('25.00');

  // Estado para formulario colapsable de pago manual y cargo extra
  const [mostrarFormPago, setMostrarFormPago] = useState<boolean>(false);
  const [mostrarFormCargoExtra, setMostrarFormCargoExtra] = useState<boolean>(false);
  const [cuotaIdxSeleccionada, setCuotaIdxSeleccionada] = useState<number | null>(null);
  const [nroOperacion, setNroOperacion] = useState<string>('');
  const [fotoError, setFotoError] = useState<boolean>(false);

  useEffect(() => {
    setFotoError(false);
  }, [alumnoSeleccionado?.id]);

  const supabasePublicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wluuomwkxywpfotbngwf.supabase.co';
  const fotoEstudiante = (!fotoError && (alumnoSeleccionado?.foto_perfil || alumnoSeleccionado?.avatar_url))
    ? (alumnoSeleccionado.foto_perfil || alumnoSeleccionado.avatar_url)
    : (!fotoError && alumnoSeleccionado?.id 
        ? `${supabasePublicUrl}/storage/v1/object/public/avatars/${alumnoSeleccionado.id}/avatar.jpg`
        : null);

  // Actualizar monto sugerido según la cuota pendiente del estudiante al abrir o cambiar de crédito
  useEffect(() => {
    if (alumnoSeleccionado) {
      const creditos = alumnoSeleccionado.creditos || [];
      const cred = creditos[selectedCreditoIdx] || creditos[0];
      if (cred) {
        const cuotasRaw = cred.cuotas || [];
        const planRaw = cred.plan_cuotas || null;
        const activas = cuotasRaw
          .map((val: string, idx: number) => ({ val, idx }))
          .filter((item: { val: string; idx: number }) => item.val !== 'no corresponde');
        const totalCuotas = Math.max(1, activas.length);
        const basePlan = Math.round(Number(cred.monto || 0) / totalCuotas);

        // Buscar la primera cuota pendiente
        const pendientes = activas.map(({ val, idx }: { val: string; idx: number }) => {
          const plan = planRaw?.[idx] ? Number(planRaw[idx]) : basePlan;
          const pagado = Number(val) || 0;
          const pendiente = Math.max(0, plan - pagado);
          return { idx, plan, pagado, pendiente };
        }).filter((c: { idx: number; plan: number; pagado: number; pendiente: number }) => c.pendiente > 0 || c.pagado === 0);

        if (pendientes.length > 0) {
          const next = pendientes[0];
          const deudaTotal = Number(cred.total_deuda ?? 0);
          const sugerido = pendientes.length === 1 && deudaTotal > 0 ? deudaTotal : (next.pendiente > 0 ? next.pendiente : next.plan);
          setMontoPago(String(sugerido > 0 ? sugerido : basePlan));
        } else if (Number(cred.total_deuda) > 0) {
          setMontoPago(String(Number(cred.total_deuda)));
        } else {
          setMontoPago(String(basePlan));
        }
      } else if (alumnoSeleccionado.monto_cuota) {
        setMontoPago(String(Math.round(Number(alumnoSeleccionado.monto_cuota))));
      }
    }
  }, [alumnoSeleccionado, selectedCreditoIdx, setMontoPago]);
  const [nuevoDiplomadoSeleccionado, setNuevoDiplomadoSeleccionado] = useState<string>('');
  const [cargandoDiplomadoAccion, setCargandoDiplomadoAccion] = useState(false);
  const [nuevoCursoSeleccionado, setNuevoCursoSeleccionado] = useState<string>('');
  const [cargandoCursoAccion, setCargandoCursoAccion] = useState(false);
  const [nuevoTallerSeleccionado, setNuevoTallerSeleccionado] = useState<string>('');
  const [cargandoTallerAccion, setCargandoTallerAccion] = useState(false);
  const [reiniciandoExamenKey, setReiniciandoExamenKey] = useState<string | null>(null);

  // Catálogo oficial sincronizado con Supabase (diplomados con módulos reales, cursos y talleres)
  const [catalogoFetched, setCatalogoFetched] = useState<any[]>([]);
  const propCatalogoList = Array.isArray(catalogoDiplomados) ? catalogoDiplomados : [];
  const propTieneDiplomadosConModulos = propCatalogoList.some(
    (item: any) =>
      item &&
      (item.tipo === 'diplomado' || String(item.codigo || '').toUpperCase().startsWith('DIP-')) &&
      Array.isArray(item.modulos) &&
      item.modulos.length > 0
  );

  useEffect(() => {
    if (propTieneDiplomadosConModulos) return;

    let cancelado = false;
    fetch('/api/admin/catalogo')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelado || !data) return;
        const todos = Array.isArray(data.todos)
          ? data.todos
          : [
              ...(data.diplomados || []),
              ...(data.cursosEspecializacion || data.cursos || []),
              ...(data.talleres || [])
            ];
        if (todos.length > 0) {
          setCatalogoFetched(todos);
        }
      })
      .catch((err) => console.error('Error cargando catálogo oficial en Ficha 360:', err));

    return () => {
      cancelado = true;
    };
  }, [propTieneDiplomadosConModulos]);

  // Configuración oficial de exámenes (para saber si un módulo, curso o taller aplica examen o no)
  const [configsExamenes, setConfigsExamenes] = useState<any[]>([]);

  useEffect(() => {
    let cancelado = false;
    fetch('/api/admin/examenes/configuracion')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelado || !data) return;
        if (Array.isArray(data.data)) {
          setConfigsExamenes(data.data);
        }
      })
      .catch((err) => console.error('Error cargando configuración de exámenes en Ficha 360:', err));

    return () => {
      cancelado = true;
    };
  }, []);

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

  const handleResetExamen = async (params: {
    key: string;
    tipoPrograma: 'diplomado' | 'curso' | 'taller';
    programaTitulo: string;
    programaCodigo?: string;
    programaId?: string;
    moduloCodigo?: string;
    moduloIndex?: number;
  }) => {
    const etiquetaObjetivo =
      params.tipoPrograma === 'diplomado'
        ? `"${params.moduloCodigo}" en "${params.programaTitulo}"`
        : `"${params.programaTitulo}"`;

    const confirmMsg = `¿Desea borrar el intento de examen de ${etiquetaObjetivo} para ${alumnoSeleccionado.nombres} ${alumnoSeleccionado.apellidos}?\n\nEsto eliminará la nota registrada y permitirá al alumno volver a rendir su examen.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      setReiniciandoExamenKey(params.key);
      const res = await fetch('/api/admin/estudiantes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_examen_modulo',
          tipoPrograma: params.tipoPrograma,
          studentId: alumnoSeleccionado.id,
          dni_ce: alumnoSeleccionado.dni_ce,
          diplomadoTitulo: params.tipoPrograma === 'diplomado' ? params.programaTitulo : undefined,
          diplomadoCodigo: params.tipoPrograma === 'diplomado' ? params.programaCodigo : undefined,
          moduloCodigo: params.moduloCodigo,
          moduloIndex: params.moduloIndex,
          cursoTitulo: params.tipoPrograma !== 'diplomado' ? params.programaTitulo : undefined,
          cursoCodigo: params.tipoPrograma !== 'diplomado' ? params.programaCodigo : undefined,
          cursoId: params.tipoPrograma !== 'diplomado' ? params.programaId : undefined
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al reiniciar');
      }

      alert('Intento de examen borrado correctamente. El alumno ya puede rendir nuevamente su examen.');
      onRefetchEstudiantes?.();
    } catch (err: any) {
      alert(`Error: ${err.message || 'No se pudo reiniciar el intento de examen.'}`);
    } finally {
      setReiniciandoExamenKey(null);
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
    { id: 'cronograma', label: 'Cronograma y Finanzas', icon: Calendar, badge: Number(alumnoSeleccionado.deuda_total_pendiente || 0) > 0 ? `Deuda: S/ ${Number(alumnoSeleccionado.deuda_total_pendiente).toFixed(0)}` : 'Al día' },
    { id: 'academico', label: 'Avance académico', icon: Award, badge: `${alumnoSeleccionado.avance_porcentaje || 0}%` },
    { id: 'retencion', label: 'Deserción cero', icon: Send, badge: alumnoSeleccionado.nivel_riesgo_churn }
  ];

  return (
    <div onClick={(e) => { if (e.target === e.currentTarget) onClose(); }} className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-3 sm:p-4">
      <div onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-200 dark:border-slate-800 transition-colors animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Modal con Foto de Perfil */}
        <div className="px-6 sm:px-8 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-4 min-w-0 pr-4">
            {/* Foto de perfil del estudiante o iniciales por defecto (Formato Circular idéntico al Sidebar) */}
            <div className="size-14 sm:size-16 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 text-white text-lg sm:text-xl font-black flex items-center justify-center shadow-lg ring-2 ring-indigo-500/40 shrink-0 overflow-hidden select-none">
              {fotoEstudiante && !fotoError ? (
                <img 
                  src={fotoEstudiante} 
                  alt={alumnoSeleccionado.nombres} 
                  className="w-full h-full object-cover rounded-full" 
                  onError={() => setFotoError(true)}
                />
              ) : (
                <span>
                  {(alumnoSeleccionado.nombres?.[0] || 'A').toUpperCase()}{(alumnoSeleccionado.apellidos?.[0] || '').toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
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
              <h3 className="text-lg sm:text-2xl font-black text-white truncate">
                {alumnoSeleccionado.nombres} {alumnoSeleccionado.apellidos}
              </h3>
              <p className="text-xs text-slate-300 truncate mt-0.5">
                {alumnoSeleccionado.email} • {alumnoSeleccionado.telefono || 'Sin teléfono'} • Paquete: <strong className="text-amber-400">{alumnoSeleccionado.paquete_adquirido}</strong>
              </p>
            </div>
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
                    <strong className="tabular-nums text-sm text-slate-900 dark:text-white">
                      {creditoSeleccionado?.nro_pagare || `2026-I-000${alumnoSeleccionado.dni_ce.substring(0, 4)}`}
                    </strong>
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
                    onClick={() => {
                      if (onAbrirCronograma) {
                        onAbrirCronograma(creditoSeleccionado);
                      } else if (onOpenEditCronograma) {
                        onOpenEditCronograma();
                      }
                    }}
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

              {/* Barra de Acciones del Cronograma y Botón para Registrar Pago */}
              {(() => {
                const cuotasRaw = creditoSeleccionado?.cuotas || ['0', '0', '0', 'no corresponde', 'no corresponde', 'no corresponde'];
                const planCuotasRaw = creditoSeleccionado?.plan_cuotas || null;
                const cuotasActivas = cuotasRaw
                  .map((val: string, idx: number) => ({ val, idx }))
                  .filter((item: { val: string; idx: number }) => item.val !== 'no corresponde');
                const cuotasAMostrar = cuotasActivas.length > 0 ? cuotasActivas : [{ val: '0', idx: 0 }];
                const totalMontoCredito = Number(creditoSeleccionado?.monto || 0);
                const totalDeudaCredito = Number(creditoSeleccionado?.total_deuda ?? totalMontoCredito);
                const planCuotaBase = Math.round(totalMontoCredito / Math.max(1, cuotasAMostrar.length));

                const pendingCuotasList = cuotasAMostrar.map(({ val, idx }: { val: string; idx: number }) => {
                  const plan = planCuotasRaw?.[idx] ? Number(planCuotasRaw[idx]) : planCuotaBase;
                  const pagado = Number(val) || 0;
                  const pendiente = Math.max(0, plan - pagado);
                  return { idx, plan, pagado, pendiente };
                }).filter((c: { idx: number; plan: number; pagado: number; pendiente: number }) => c.pendiente > 0 || c.pagado === 0);

                const nextPendingCuota = pendingCuotasList[0] || null;

                return (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0">
                          <CreditCard className="size-5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                            Gestión de Cobranzas y Recibos
                          </h4>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {nextPendingCuota 
                              ? `Siguiente por cobrar: Cuota ${(nextPendingCuota.idx + 1).toString().padStart(2, '0')} (S/ ${(pendingCuotasList.length === 1 && totalDeudaCredito > 0 ? totalDeudaCredito : nextPendingCuota.pendiente).toFixed(2)})`
                              : (totalDeudaCredito === 0 ? '¡Crédito cancelado al 100%!' : 'No hay cuotas pendientes.')
                            }
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setMostrarFormCargoExtra(!mostrarFormCargoExtra);
                            if (!mostrarFormCargoExtra) setMostrarFormPago(false);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                            mostrarFormCargoExtra
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                              : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                          }`}
                        >
                          <Plus className="size-4" />
                          <span>{mostrarFormCargoExtra ? 'Cerrar cargo extra' : 'Añadir cargo extra'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (!mostrarFormPago) {
                              if (nextPendingCuota) {
                                setCuotaIdxSeleccionada(nextPendingCuota.idx);
                                const sug = pendingCuotasList.length === 1 && totalDeudaCredito > 0 ? totalDeudaCredito : (nextPendingCuota.pendiente > 0 ? nextPendingCuota.pendiente : nextPendingCuota.plan);
                                setMontoPago(String(sug > 0 ? sug : nextPendingCuota.plan));
                              }
                              onSetPagoIdParaValidar(creditoSeleccionado?.id || null);
                              setMostrarFormCargoExtra(false);
                            }
                            setMostrarFormPago(!mostrarFormPago);
                          }}
                          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                            mostrarFormPago
                              ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          }`}
                        >
                          {mostrarFormPago ? <ChevronUp className="size-4" /> : <Coins className="size-4" />}
                          <span>{mostrarFormPago ? 'Ocultar pago' : 'Registrar pago de cuota'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Formulario Desplegable de Cargo Extra */}
                    {mostrarFormCargoExtra && (
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-indigo-500/30 dark:border-indigo-500/20 shadow-md space-y-4 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                              Nuevo Cargo
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                              Añadir Cargo Extra / Adicional al Estudiante
                            </h4>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setMostrarFormCargoExtra(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold cursor-pointer"
                          >
                            Cerrar
                          </button>
                        </div>

                        <form 
                          onSubmit={async (e) => {
                            await handleAgregarCargoSubmit(e);
                            setMostrarFormCargoExtra(false);
                          }} 
                          className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                        >
                          <div className="sm:col-span-6">
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Concepto del cargo extra
                            </label>
                            <input 
                              type="text"
                              value={conceptoExtra}
                              onChange={(e) => setConceptoExtra(e.target.value)}
                              placeholder="Ej. Examen Sustitutorio, Mora, Certificado físico"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                              required
                            />
                          </div>
                          <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Monto (S/)
                            </label>
                            <input 
                              type="number"
                              step="0.01"
                              value={montoExtra}
                              onChange={(e) => setMontoExtra(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                              required
                            />
                          </div>
                          <div className="sm:col-span-3 flex gap-2">
                            <button
                              type="submit"
                              disabled={cargandoPago}
                              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm w-full"
                            >
                              {cargandoPago ? <RefreshCw className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                              <span>Registrar cargo</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Formulario Desplegable de Pago Manual */}
                    {mostrarFormPago && (
                      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-emerald-500/30 dark:border-emerald-500/20 shadow-md space-y-4 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-[10px] px-2.5 py-0.5 rounded-full uppercase">
                              Nuevo Abono
                            </span>
                            <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                              {cuotaIdxSeleccionada !== null 
                                ? `Abonando a: Cuota ${(cuotaIdxSeleccionada + 1).toString().padStart(2, '0')} - ${alumnoSeleccionado.diplomado_actual}`
                                : `Abonando a: Cuota ${(nextPendingCuota ? nextPendingCuota.idx + 1 : 1).toString().padStart(2, '0')}`
                              }
                            </h4>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setMostrarFormPago(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                          >
                            Cerrar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Monto pagado (S/)
                            </label>
                            <input 
                              type="number"
                              step="0.5"
                              value={montoPago}
                              onChange={(e) => setMontoPago(e.target.value)}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Acepta abono parcial o pago mayor
                            </span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Método de pago
                            </label>
                            <select
                              value={metodo}
                              onChange={(e) => {
                                setMetodo(e.target.value);
                                if (e.target.value === 'Efectivo en Caja') {
                                  setNroOperacion('N/A');
                                } else if (nroOperacion === 'N/A') {
                                  setNroOperacion('');
                                }
                              }}
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                              <option value="Yape / Plin">Yape / Plin</option>
                              <option value="Transferencia BCP">Transferencia BCP</option>
                              <option value="Tarjeta BBVA / Interbank">Tarjeta BBVA / Interbank</option>
                              <option value="Efectivo en Caja">Efectivo en Caja</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Nº Recibo / Boleta (Institucional)
                            </label>
                            <input 
                              type="text"
                              value={comprobante}
                              onChange={(e) => setComprobante(e.target.value)}
                              placeholder="REC-2026-00124"
                              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs tabular-nums font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Emisión formal (aplica a todo pago)
                            </span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                              Nº Operación Bancaria (Voucher)
                            </label>
                            <input 
                              type="text"
                              disabled={metodo === 'Efectivo en Caja'}
                              value={metodo === 'Efectivo en Caja' ? 'No aplica (Efectivo)' : nroOperacion}
                              onChange={(e) => setNroOperacion(e.target.value)}
                              placeholder="OP-123456"
                              className={`w-full px-3 py-2 border rounded-xl text-xs tabular-nums font-bold focus:ring-2 focus:ring-emerald-500 outline-none ${
                                metodo === 'Efectivo en Caja'
                                  ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 border-slate-200 dark:border-slate-800 italic cursor-not-allowed'
                                  : 'bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                              }`}
                            />
                            <span className="text-[10px] text-slate-400 mt-0.5 block">
                              Código de transacción bancaria / Yape
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setMostrarFormPago(false)}
                            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={async () => {
                              onSetPagoIdParaValidar(creditoSeleccionado?.id || null);
                              await onRegistrarPago(
                                cuotaIdxSeleccionada !== null ? cuotaIdxSeleccionada : undefined,
                                undefined,
                                {
                                  nro_recibo: comprobante,
                                  nro_operacion: metodo === 'Efectivo en Caja' ? 'N/A' : (nroOperacion || comprobante)
                                }
                              );
                              setMostrarFormPago(false);
                            }}
                            disabled={cargandoPago || Number(montoPago) <= 0}
                            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {cargandoPago ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Coins className="w-4 h-4" />}
                            <span>{cargandoPago ? 'Procesando pago...' : `Registrar pago (S/ ${Number(montoPago || 0).toFixed(2)})`}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tabla de Cuotas (Cuota 01 a Cuota 06 Dinámica) */}
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
                              <th className="py-2.5 px-4">Monto Programado</th>
                              <th className="py-2.5 px-4">Pagado</th>
                              <th className="py-2.5 px-4">Estado cuota</th>
                              <th className="py-2.5 px-4 text-right">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                            {cuotasAMostrar.map(({ val: cuotaVal, idx }: { val: string; idx: number }) => {
                              const nroFmt = (idx + 1).toString().padStart(2, '0');
                              const pagadoNum = Number(cuotaVal) || 0;
                              const planNum = planCuotasRaw?.[idx] ? Number(planCuotasRaw[idx]) : planCuotaBase;
                              const pendienteNum = Math.max(0, planNum - pagadoNum);
                              const estaTotalmentePagada = pagadoNum >= planNum && planNum > 0;
                              const esPagoParcial = pagadoNum > 0 && pagadoNum < planNum;

                              return (
                                <tr key={idx} className={estaTotalmentePagada ? 'bg-emerald-50/30 dark:bg-emerald-950/20' : esPagoParcial ? 'bg-sky-50/30 dark:bg-sky-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}>
                                  <td className="py-3 px-4 font-bold text-center text-slate-700 dark:text-slate-300">
                                    Cuota {nroFmt}
                                  </td>
                                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                    Cuota {nroFmt} - {alumnoSeleccionado.diplomado_actual}
                                  </td>
                                  <td className="py-3 px-4 tabular-nums font-bold text-slate-800 dark:text-slate-200">
                                    S/ {planNum.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 tabular-nums font-bold text-emerald-600 dark:text-emerald-400">
                                    S/ {pagadoNum.toFixed(2)}
                                  </td>
                                  <td className="py-3 px-4 font-bold">
                                    {estaTotalmentePagada ? (
                                      <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 inline-flex items-center gap-1">
                                        <CheckCircle2 className="size-3" /> Pagado (S/ {pagadoNum.toFixed(2)})
                                      </span>
                                    ) : esPagoParcial ? (
                                      <span className="bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 text-[10px] px-2.5 py-0.5 rounded-full border border-sky-200 dark:border-sky-800 inline-flex items-center gap-1">
                                        Abono parcial (S/ {pagadoNum.toFixed(2)} / S/ {planNum.toFixed(2)})
                                      </span>
                                    ) : (
                                      <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800 inline-flex items-center gap-1">
                                        Pendiente (S/ {planNum.toFixed(2)})
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                      {pagadoNum > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => onSetPagoParaAnular({ id: creditoSeleccionado?.id, dni_ce: alumnoSeleccionado.dni_ce, cuota_index: idx, monto: pagadoNum })}
                                          className="text-[10px] text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold underline cursor-pointer"
                                        >
                                          Anular
                                        </button>
                                      )}
                                      {!estaTotalmentePagada && (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCuotaIdxSeleccionada(idx);
                                            const montoASugerir = pendingCuotasList.length === 1 && totalDeudaCredito > 0 
                                              ? totalDeudaCredito 
                                              : (pendienteNum > 0 ? pendienteNum : planNum);
                                            setMontoPago(String(montoASugerir > 0 ? montoASugerir : planNum));
                                            onSetPagoIdParaValidar(creditoSeleccionado?.id || null);
                                            setMostrarFormPago(true);
                                          }}
                                          disabled={cargandoPago}
                                          className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded-lg text-[10px] font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1"
                                        >
                                          <CreditCard className="size-3" /> Registrar pago
                                        </button>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Historial Integrado de Cargos Extras */}
                    <div className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                      <div className="flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                          <Plus className="size-4 text-indigo-600 dark:text-indigo-400" /> Historial de cargos extras registrados
                        </h4>
                        <span className="text-[10px] text-slate-400 tabular-nums font-semibold">
                          {cargosExtras.length} cargo{cargosExtras.length === 1 ? '' : 's'} adicional{cargosExtras.length === 1 ? '' : 'es'}
                        </span>
                      </div>

                      {cargosExtras.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-5 text-center text-xs text-slate-400 font-medium">
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
                                <th className="py-2.5 px-4 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                              {cargosExtras.map((cargo: any, idx: number) => (
                                <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium">
                                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{cargo.concepto || 'Cargo adicional'}</td>
                                  <td className="py-3 px-4 tabular-nums font-bold text-slate-800 dark:text-slate-200">S/ {Number(cargo.monto || 0).toFixed(2)}</td>
                                  <td className="py-3 px-4 text-slate-500 dark:text-slate-400">{cargo.created_at ? new Date(cargo.created_at).toLocaleDateString('es-PE') : '-'}</td>
                                  <td className="py-3 px-4">
                                    <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-[10px] px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 font-bold">
                                      {cargo.estado || 'Aprobado'}
                                    </span>
                                  </td>
                                  <td className="py-3 px-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() => onSetPagoParaAnular({ id: cargo.id, dni_ce: alumnoSeleccionado.dni_ce, is_cargo_extra: true, monto: cargo.monto })}
                                      className="text-[10px] text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-bold underline cursor-pointer"
                                    >
                                      Anular cargo
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>
          )}

          {/* TAB 4: AVANCE ACADÉMICO SEPARADO (DIPLOMADOS, CURSOS Y TALLERES) Y CRÉDITOS EXTRA */}
          {modalTab === 'academico' && (() => {
            const normStr = (s?: string | null) =>
              (s || '')
                .toLowerCase()
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-+|-+$/g, '');

            const stripDipPrefix = (s?: string | null) =>
              normStr(s).replace(/^(diplomado-en-|especialista-en-)/, '');

            const esTallerItem = (c: any) => {
              if (!c) return false;
              const tipo = String(c.tipo || '').toUpperCase();
              const id = String(c.id || '').toLowerCase();
              const cod = String(c.codigo || '').toLowerCase();
              const cat = String(c.categoria || '').toLowerCase();
              const tit = String(c.titulo || '').toLowerCase();
              return (
                tipo === 'TALLER' ||
                cat.includes('taller') ||
                id.startsWith('tal-') ||
                cod.startsWith('tal-') ||
                tit.startsWith('taller de') ||
                Boolean(c.esRegalo)
              );
            };

            const catalogoActivo = propTieneDiplomadosConModulos
              ? propCatalogoList
              : catalogoFetched.length > 0
              ? catalogoFetched
              : propCatalogoList;

            const listDiplomadosExistentes = (
              alumnoSeleccionado.diplomados_lista && alumnoSeleccionado.diplomados_lista.length > 0
                ? alumnoSeleccionado.diplomados_lista
                : (alumnoSeleccionado.diplomados_json || []).map((d: any) => d.titulo)
            ) as string[];

            const allCursosYTalleresJson = Array.isArray(alumnoSeleccionado.cursos_json)
              ? alumnoSeleccionado.cursos_json
              : [];

            const cursosRealesJson = allCursosYTalleresJson.filter((c: any) => !esTallerItem(c));
            const talleresJson = allCursosYTalleresJson.filter((c: any) => esTallerItem(c));

            const listCursosExistentes = cursosRealesJson.map((c: any) => c.titulo || c.codigo) as string[];
            const listTalleresExistentes = talleresJson.map((t: any) => t.titulo || t.codigo) as string[];

            // Catálogo oficial desde Supabase separado por tipo
            const catalogoDiplomadosOficiales = catalogoActivo.filter(
              (d: any) => d && (d.tipo === 'diplomado' || String(d.codigo || d.id || '').toUpperCase().startsWith('DIP-'))
            );
            const catalogoCursosOficiales = catalogoActivo.filter(
              (d: any) => d && (d.tipo === 'curso' || String(d.codigo || d.id || '').toUpperCase().startsWith('CUR-'))
            );
            const catalogoTalleresOficiales = catalogoActivo.filter(
              (d: any) => d && (d.tipo === 'taller' || String(d.codigo || d.id || '').toUpperCase().startsWith('TAL-'))
            );

            const titulosCatalogo22 = catalogoDiplomadosOficiales
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

            const opcionesCursos76 = catalogoCursosOficiales.map((d: any, idx: number) => ({
              codigo: d.codigo || `CUR-${(idx + 1).toString().padStart(2, '0')}`,
              titulo: (d.titulo || d.nombre || '').trim().toUpperCase()
            })).filter((c: any) => Boolean(c.titulo));

            const opcionesTalleres = catalogoTalleresOficiales.length > 0
              ? catalogoTalleresOficiales.map((t: any, idx: number) => ({
                  codigo: t.codigo || `TAL-${(idx + 1).toString().padStart(2, '0')}`,
                  titulo: (t.titulo || t.nombre || '').trim().toUpperCase()
                }))
              : [
                  { codigo: 'TAL-01', titulo: 'TALLER DE SOFT SKILLS EN LA INDUSTRIA Y MINERÍA' },
                  { codigo: 'TAL-02', titulo: 'TALLER DE SEGURIDAD BASADA EN EL COMPORTAMIENTO' }
                ];

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

            const handleGuardarCursosYTalleresSubmit = async (
              itemsActualizados: any[],
              tipoActualizado: 'cursos' | 'talleres'
            ) => {
              if (tipoActualizado === 'cursos') setCargandoCursoAccion(true);
              else setCargandoTallerAccion(true);

              try {
                const res = await fetch('/api/admin/estudiantes', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    action: 'update_cursos',
                    studentId: alumnoSeleccionado.id,
                    dni_ce: alumnoSeleccionado.dni_ce,
                    cursos: itemsActualizados
                  })
                });

                if (res.ok) {
                  alert(
                    tipoActualizado === 'cursos'
                      ? 'Cursos de especialización actualizados en la base de datos.'
                      : 'Talleres actualizados en la base de datos.'
                  );
                  if (onRefetchEstudiantes) onRefetchEstudiantes();
                } else {
                  const errData = await res.json();
                  alert(`Error al actualizar: ${errData.error}`);
                }
              } catch (e: any) {
                alert(`Error de conexión: ${e.message}`);
              } finally {
                if (tipoActualizado === 'cursos') setCargandoCursoAccion(false);
                else setCargandoTallerAccion(false);
              }
            };

            const handleAgregarNuevoDiplomado = () => {
              if (!nuevoDiplomadoSeleccionado) {
                alert('Por favor selecciona un diplomado de la lista.');
                return;
              }
              if (listDiplomadosExistentes.some(d => stripDipPrefix(d) === stripDipPrefix(nuevoDiplomadoSeleccionado))) {
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
              if (listCursosExistentes.some(c => normStr(c) === normStr(nuevoCursoSeleccionado))) {
                alert('El alumno ya tiene asignado este curso.');
                return;
              }
              const actualizados = [...cursosRealesJson, { titulo: nuevoCursoSeleccionado, tipo: 'CURSO' }, ...talleresJson];
              handleGuardarCursosYTalleresSubmit(actualizados, 'cursos');
              setNuevoCursoSeleccionado('');
            };

            const handleQuitarCursoExistente = (indexAQuitar: number) => {
              if (!window.confirm('¿Desea desvincular este curso del estudiante?')) return;
              const cursosRestantes = cursosRealesJson.filter((_: any, idx: number) => idx !== indexAQuitar);
              handleGuardarCursosYTalleresSubmit([...cursosRestantes, ...talleresJson], 'cursos');
            };

            const handleAgregarNuevoTaller = () => {
              if (!nuevoTallerSeleccionado) {
                alert('Por favor selecciona un taller de la lista.');
                return;
              }
              if (listTalleresExistentes.some(t => normStr(t) === normStr(nuevoTallerSeleccionado))) {
                alert('El alumno ya tiene asignado este taller.');
                return;
              }
              const tallerCat = catalogoTalleresOficiales.find((t: any) => normStr(t.titulo) === normStr(nuevoTallerSeleccionado));
              const actualizados = [
                ...cursosRealesJson,
                ...talleresJson,
                {
                  titulo: nuevoTallerSeleccionado,
                  codigo: tallerCat?.codigo,
                  id: tallerCat?.id,
                  tipo: 'TALLER'
                }
              ];
              handleGuardarCursosYTalleresSubmit(actualizados, 'talleres');
              setNuevoTallerSeleccionado('');
            };

            const handleQuitarTallerExistente = (indexAQuitar: number) => {
              if (!window.confirm('¿Desea desvincular este taller del estudiante?')) return;
              const talleresRestantes = talleresJson.filter((_: any, idx: number) => idx !== indexAQuitar);
              handleGuardarCursosYTalleresSubmit([...cursosRealesJson, ...talleresRestantes], 'talleres');
            };

            // Créditos base según el paquete del alumno
            const paqueteNombre = (alumnoSeleccionado.paquete_adquirido || 'FULL').toUpperCase();
            const baseDip = paqueteNombre === 'ILIMITADO' ? 3 : 1;
            const baseCur = paqueteNombre === 'ILIMITADO' ? 15 : (paqueteNombre === 'FULL' ? 5 : 3);

            const totalDipContratados = baseDip + extraDip;
            const totalCurContratados = baseCur + extraCur;

            const dipConsumidos = listDiplomadosExistentes.length;
            const curConsumidos = cursosRealesJson.length;

            const dipDisponibles = Math.max(0, totalDipContratados - dipConsumidos);
            const curDisponibles = Math.max(0, totalCurContratados - curConsumidos);

            const obtenerEstadoExamenConfig = (
              codigoPrograma: string,
              tipoPrograma: 'diplomado' | 'curso' | 'taller',
              moduloCodigo?: string,
              nombrePrograma?: string
            ): { aplicaExamen: boolean; notaMinima: number } => {
              const codNorm = normStr(codigoPrograma);
              const nomNorm = normStr(nombrePrograma);
              const modNorm = normStr(moduloCodigo);

              const porPrograma = configsExamenes.filter((cfg: any) => {
                const cCod = normStr(cfg.codigo_programa);
                const cNom = normStr(cfg.nombre_programa);
                return (codNorm && cCod === codNorm) || (nomNorm && cNom === nomNorm);
              });

              let matchCfg: any = null;
              if (porPrograma.length > 0) {
                if (tipoPrograma === 'diplomado' && modNorm) {
                  matchCfg =
                    porPrograma.find((cfg: any) => normStr(cfg.modulo) === modNorm) ||
                    porPrograma.find((cfg: any) => normStr(cfg.id).endsWith(`-${modNorm}`)) ||
                    null;
                } else {
                  matchCfg = porPrograma[0];
                }
              }

              if (matchCfg) {
                return {
                  aplicaExamen: matchCfg.aplica_examen !== false,
                  notaMinima: Number(matchCfg.nota_minima ?? 12)
                };
              }

              return {
                aplicaExamen: tipoPrograma !== 'taller',
                notaMinima: 12
              };
            };

            // Renderizador compartido de tarjetas para Cursos y Talleres (con nota, estado y borrar intento)
            const renderTarjetaProgramaIndividual = (
              item: any,
              idx: number,
              kind: 'curso' | 'taller',
              onRemove: (idx: number) => void
            ) => {
              const catList = kind === 'taller' ? catalogoTalleresOficiales : catalogoCursosOficiales;
              const catMatch = catList.find((d: any) =>
                (item.codigo && d.codigo && normStr(d.codigo) === normStr(item.codigo)) ||
                (item.id && d.id && normStr(d.id) === normStr(item.id)) ||
                (item.titulo && d.titulo && normStr(d.titulo) === normStr(item.titulo))
              );

              const titulo = item.titulo || catMatch?.titulo || item.codigo || (kind === 'taller' ? `Taller ${idx + 1}` : `Curso ${idx + 1}`);
              const codigo = catMatch?.codigo || item.codigo || (kind === 'taller' ? `TAL-0${idx + 1}` : `CUR-0${idx + 1}`);
              const programaId = catMatch?.id || item.id || codigo.toLowerCase();

              const { aplicaExamen, notaMinima } = obtenerEstadoExamenConfig(codigo, kind, undefined, titulo);

              const haRendido = Boolean(
                item.rendido ||
                (item.nota !== undefined && item.nota !== null && Number(item.nota) > 0)
              );
              const tieneNota = haRendido && item.nota !== undefined && item.nota !== null;
              const notaNum = tieneNota ? Number(item.nota) : null;
              const avanceRaw = Math.min(100, Math.max(0, Number(item.avance) || 0));
              const estaAprobado = aplicaExamen
                ? Boolean(item.completado) || (notaNum !== null && notaNum >= notaMinima)
                : Boolean(item.completado) || avanceRaw >= 100;
              const avancePct = estaAprobado ? 100 : avanceRaw;
              const resetKey = `${kind}:${codigo}:${titulo}`;
              const estaReiniciando = reiniciandoExamenKey === resetKey;

              const esVerde = kind === 'curso';

              return (
                <div
                  key={`${codigo}-${idx}`}
                  className="border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 bg-white dark:bg-slate-900 space-y-3 shadow-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span
                        className={`text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0 ${
                          esVerde ? 'bg-emerald-600' : 'bg-amber-600'
                        }`}
                      >
                        {kind === 'taller' ? `Taller ${idx + 1}` : `Curso ${idx + 1}`}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                        {codigo}
                      </span>
                      {kind === 'taller' && item.esRegalo && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 shrink-0">
                          Incluido en matrícula
                        </span>
                      )}
                      <h5 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {titulo}
                      </h5>
                    </div>

                    <button
                      type="button"
                      onClick={() => onRemove(idx)}
                      title={`Desvincular ${kind}`}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition self-end sm:self-center shrink-0 cursor-pointer"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Estado de culminación */}
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                          estaAprobado
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : haRendido || avancePct > 0
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {estaAprobado ? (
                          <>
                            <CheckCircle2 className="size-3.5" /> Finalizado
                          </>
                        ) : haRendido || avancePct > 0 ? (
                          <>
                            <Clock className="size-3.5" /> En curso ({avancePct}%)
                          </>
                        ) : (
                          'Sin iniciar'
                        )}
                      </span>

                      {/* Estado y nota del examen (respetando configuración aplica_examen) */}
                      {haRendido && notaNum !== null ? (
                        <span
                          className={`font-bold px-2.5 py-1 rounded-lg text-[11px] border tabular-nums ${
                            notaNum >= notaMinima
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                          }`}
                        >
                          {notaNum >= notaMinima
                            ? `Examen aprobado · Nota: ${notaNum.toString().padStart(2, '0')}/20`
                            : `Examen desaprobado · Nota: ${notaNum.toString().padStart(2, '0')}/20`}
                        </span>
                      ) : !aplicaExamen ? (
                        <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold px-2.5 py-1 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700">
                          No aplica examen
                        </span>
                      ) : (
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2.5 py-1 rounded-lg text-[11px] border border-slate-200 dark:border-slate-700">
                          Examen pendiente
                        </span>
                      )}
                    </div>

                    {haRendido && (
                      <button
                        type="button"
                        disabled={estaReiniciando}
                        onClick={() =>
                          handleResetExamen({
                            key: resetKey,
                            tipoPrograma: kind,
                            programaTitulo: titulo,
                            programaCodigo: codigo,
                            programaId
                          })
                        }
                        className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Borrar intento de examen para permitir que el alumno vuelva a rendirlo"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${estaReiniciando ? 'animate-spin' : ''}`} />
                        <span>{estaReiniciando ? 'Borrando...' : 'Borrar intento'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            };

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

                {/* SUB-TABS PARA SEPARAR DIPLOMADOS, CURSOS Y TALLERES */}
                <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setFiltroAcademico('todos')}
                    className={`pb-2.5 px-4 font-bold text-xs transition border-b-2 cursor-pointer whitespace-nowrap ${
                      filtroAcademico === 'todos'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Ver todo ({listDiplomadosExistentes.length + cursosRealesJson.length + talleresJson.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAcademico('diplomados')}
                    className={`pb-2.5 px-4 font-bold text-xs transition border-b-2 cursor-pointer whitespace-nowrap ${
                      filtroAcademico === 'diplomados'
                        ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Diplomados ({listDiplomadosExistentes.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAcademico('cursos')}
                    className={`pb-2.5 px-4 font-bold text-xs transition border-b-2 cursor-pointer whitespace-nowrap ${
                      filtroAcademico === 'cursos'
                        ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Cursos ({cursosRealesJson.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroAcademico('talleres')}
                    className={`pb-2.5 px-4 font-bold text-xs transition border-b-2 cursor-pointer whitespace-nowrap ${
                      filtroAcademico === 'talleres'
                        ? 'border-amber-600 text-amber-600 dark:text-amber-400'
                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    Talleres ({talleresJson.length})
                  </button>
                </div>

                {/* BLOQUE DIPLOMADOS: ASIGNADOR Y AVANCE POR MÓDULOS */}
                {(filtroAcademico === 'todos' || filtroAcademico === 'diplomados') && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest block">
                            Catálogo oficial de diplomados
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
                            <option
                              key={idx}
                              value={t}
                              disabled={listDiplomadosExistentes.some(d => stripDipPrefix(d) === stripDipPrefix(t))}
                            >
                              {listDiplomadosExistentes.some(d => stripDipPrefix(d) === stripDipPrefix(t))
                                ? `${t} (Ya asignado)`
                                : `[DIP-${(idx + 1).toString().padStart(2, '0')}] ${t}`}
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
                      {listDiplomadosExistentes.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {listDiplomadosExistentes.map((dipName, dIdx) => (
                            <div key={dIdx} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs">
                              <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold">Diplomado {dIdx + 1}</span>
                              <span>{dipName}</span>
                              <button
                                type="button"
                                onClick={() => handleQuitarDiplomadoExistente(dIdx)}
                                title="Desvincular diplomado"
                                className="text-slate-400 hover:text-red-500 p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                              >
                                <X className="size-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Módulos y avance por módulo de cada diplomado (nombres oficiales de Supabase) */}
                    <div className="space-y-4">
                      {listDiplomadosExistentes.length === 0 ? (
                        <div className="bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                          El estudiante no tiene diplomados asignados actualmente.
                        </div>
                      ) : (
                        listDiplomadosExistentes.map((nombreDipStr, dipIdx) => {
                          const userDipInfo = (alumnoSeleccionado.diplomados_json || []).find(
                            (d: any) =>
                              stripDipPrefix(d.titulo) === stripDipPrefix(nombreDipStr) ||
                              stripDipPrefix(d.slug) === stripDipPrefix(nombreDipStr)
                          );

                          // Emparejar contra catálogo oficial de Supabase (usando titulo, codigo o slug sin prefijo)
                          const dipObj = catalogoDiplomadosOficiales.find((d: any) => {
                            const catTitle = d.titulo || d.nombre || '';
                            return (
                              (userDipInfo?.codigo && d.codigo && normStr(d.codigo) === normStr(userDipInfo.codigo)) ||
                              normStr(catTitle) === normStr(nombreDipStr) ||
                              stripDipPrefix(catTitle) === stripDipPrefix(nombreDipStr)
                            );
                          });

                          // Usar los módulos oficiales desde Supabase (`lecciones` vía /api/admin/catalogo)
                          const modulosArray =
                            dipObj && Array.isArray(dipObj.modulos) && dipObj.modulos.length > 0
                              ? dipObj.modulos
                              : Array.isArray(userDipInfo?.modulos)
                              ? userDipInfo.modulos
                              : [];

                          const modulosAprobadosCount = modulosArray.filter((m: any, mIdx: number) => {
                            const modCodigoKey = m.codigo || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`;
                            const { aplicaExamen, notaMinima } = obtenerEstadoExamenConfig(
                              dipObj?.codigo || userDipInfo?.codigo || '',
                              'diplomado',
                              modCodigoKey,
                              nombreDipStr
                            );
                            const userModInfo =
                              (userDipInfo?.modulos || []).find(
                                (um: any) =>
                                  normStr(um.codigo) === normStr(modCodigoKey) ||
                                  normStr(um.id) === normStr(modCodigoKey) ||
                                  (um.nombre && m.nombre && normStr(um.nombre) === normStr(m.nombre))
                              ) || userDipInfo?.modulos?.[mIdx];
                            const nota = userModInfo?.nota !== undefined && userModInfo?.nota !== null ? Number(userModInfo.nota) : null;
                            return aplicaExamen
                              ? Boolean(userModInfo?.completado) || (nota !== null && nota >= notaMinima)
                              : Boolean(userModInfo?.completado) || Boolean((userDipInfo?.completadosMap || {})[modCodigoKey]);
                          }).length;

                          const avanceDip =
                            modulosArray.length > 0
                              ? Math.round((modulosAprobadosCount / modulosArray.length) * 100)
                              : (userDipInfo?.avance ?? 0);

                          return (
                            <div key={dipIdx} className="border border-slate-200 dark:border-slate-800 rounded-2xl p-5 bg-white dark:bg-slate-900 space-y-4 shadow-sm">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="bg-indigo-600 text-white font-bold text-[10px] px-2.5 py-0.5 rounded-full shrink-0">
                                    Diplomado {dipIdx + 1}
                                  </span>
                                  <h5 className="font-black text-sm text-slate-900 dark:text-white truncate">{nombreDipStr}</h5>
                                </div>
                                <span className="text-[11px] tabular-nums font-bold text-slate-500 dark:text-slate-400 shrink-0">
                                  {dipObj?.codigo || userDipInfo?.codigo || `DIP-0${dipIdx + 1}`} · {modulosAprobadosCount}/{modulosArray.length} módulos aprobados
                                </span>
                              </div>

                              {/* Barra de progreso visual del diplomado */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                  <span>Avance general del diplomado</span>
                                  <span className="text-indigo-600 dark:text-indigo-400 tabular-nums">{avanceDip}% completado</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${avanceDip}%` }}></div>
                                </div>
                              </div>

                              {/* Estado por cada módulo (sin desglose de temas/clases) */}
                              <div className="space-y-2.5">
                                {modulosArray.length === 0 ? (
                                  <div className="text-xs text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                                    No se encontraron módulos registrados para este diplomado en el catálogo oficial.
                                  </div>
                                ) : (
                                  modulosArray.map((m: any, mIdx: number) => {
                                    const modCodigoKey = m.codigo || `MÓDULO ${(mIdx + 1).toString().padStart(2, '0')}`;
                                    const nombreOficialModulo = (m.nombre || m.titulo || '').trim();
                                    const modTitle =
                                      nombreOficialModulo && !/^m[oó]dulo\s*(\d+|[ivx]+|único)/i.test(nombreOficialModulo)
                                        ? `${modCodigoKey}: ${nombreOficialModulo}`
                                        : (nombreOficialModulo || modCodigoKey);

                                    const userModInfo =
                                      (userDipInfo?.modulos || []).find(
                                        (um: any) =>
                                          normStr(um.codigo) === normStr(modCodigoKey) ||
                                          normStr(um.id) === normStr(modCodigoKey) ||
                                          (um.nombre && nombreOficialModulo && normStr(um.nombre) === normStr(nombreOficialModulo))
                                      ) || userDipInfo?.modulos?.[mIdx];

                                    const { aplicaExamen, notaMinima } = obtenerEstadoExamenConfig(
                                      dipObj?.codigo || userDipInfo?.codigo || '',
                                      'diplomado',
                                      modCodigoKey,
                                      nombreDipStr
                                    );

                                    const haRendido = Boolean(
                                      userModInfo?.rendido ||
                                      (userModInfo?.nota !== undefined && userModInfo?.nota !== null && Number(userModInfo.nota) > 0)
                                    );
                                    const tieneNota = haRendido && userModInfo?.nota !== undefined && userModInfo?.nota !== null;
                                    const notaNum = tieneNota ? Number(userModInfo.nota) : null;
                                    const estaAprobado = aplicaExamen
                                      ? Boolean(userModInfo?.completado) || (notaNum !== null && notaNum >= notaMinima)
                                      : Boolean(userModInfo?.completado) || Boolean((userDipInfo?.completadosMap || {})[modCodigoKey]);
                                    const enProgreso = !estaAprobado && (haRendido || Boolean((userDipInfo?.completadosMap || {})[modCodigoKey]));

                                    const resetKey = `dip:${dipObj?.codigo || nombreDipStr}:${modCodigoKey}`;
                                    const estaReiniciando = reiniciandoExamenKey === resetKey;

                                    return (
                                      <div
                                        key={mIdx}
                                        className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                      >
                                        <div className="min-w-0 space-y-0.5">
                                          <div className="flex items-center gap-2">
                                            {estaAprobado ? (
                                              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                            ) : haRendido ? (
                                              <AlertTriangle className="size-4 text-rose-500 shrink-0" />
                                            ) : (
                                              <Clock className="size-4 text-slate-400 shrink-0" />
                                            )}
                                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                                              {modTitle}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="flex flex-wrap items-center gap-2 pl-6 sm:pl-0 shrink-0">
                                          <span
                                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                              estaAprobado
                                                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                                                : enProgreso
                                                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                                            }`}
                                          >
                                            {estaAprobado ? 'Módulo terminado' : enProgreso ? 'En curso' : 'Pendiente'}
                                          </span>

                                          {haRendido && notaNum !== null ? (
                                            <span
                                              className={`font-bold px-2.5 py-0.5 rounded-md text-[10px] border tabular-nums ${
                                                notaNum >= notaMinima
                                                  ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                                                  : 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                                              }`}
                                            >
                                              {notaNum >= notaMinima
                                                ? `Aprobado · Nota: ${notaNum.toString().padStart(2, '0')}/20`
                                                : `Desaprobado · Nota: ${notaNum.toString().padStart(2, '0')}/20`}
                                            </span>
                                          ) : !aplicaExamen ? (
                                            <span className="bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded-md text-[10px] border border-slate-200 dark:border-slate-700">
                                              No aplica examen
                                            </span>
                                          ) : (
                                            <span className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold px-2 py-0.5 rounded-md text-[10px]">
                                              Examen pendiente
                                            </span>
                                          )}

                                          {haRendido && (
                                            <button
                                              type="button"
                                              disabled={estaReiniciando}
                                              onClick={() =>
                                                handleResetExamen({
                                                  key: resetKey,
                                                  tipoPrograma: 'diplomado',
                                                  programaTitulo: nombreDipStr,
                                                  programaCodigo: dipObj?.codigo || userDipInfo?.codigo,
                                                  moduloCodigo: modCodigoKey,
                                                  moduloIndex: mIdx
                                                })
                                              }
                                              className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] px-2.5 py-1 rounded-md transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                              title="Borrar intento de examen para permitir que el alumno rinda su examen sustitutorio"
                                            >
                                              <RefreshCw className={`w-3 h-3 ${estaReiniciando ? 'animate-spin' : ''}`} />
                                              <span>{estaReiniciando ? 'Borrando...' : 'Borrar intento'}</span>
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* BLOQUE CURSOS: ASIGNADOR Y AVANCE/EXÁMENES DE CURSOS */}
                {(filtroAcademico === 'todos' || filtroAcademico === 'cursos') && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block">
                            Catálogo oficial de cursos especializados
                          </span>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            Cursos de {alumnoSeleccionado.nombres}
                          </h4>
                        </div>
                        <span className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-bold shrink-0">
                          {cursosRealesJson.length} curso(s) inscritos
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <select
                          value={nuevoCursoSeleccionado}
                          onChange={(e) => setNuevoCursoSeleccionado(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl p-3 outline-none focus:border-emerald-500 transition-colors w-full"
                        >
                          <option value="">Seleccionar curso de especialización</option>
                          {opcionesCursos76.map((c: any, idx: number) => (
                            <option
                              key={idx}
                              value={c.titulo}
                              disabled={listCursosExistentes.some(lc => normStr(lc) === normStr(c.titulo))}
                            >
                              {listCursosExistentes.some(lc => normStr(lc) === normStr(c.titulo))
                                ? `${c.titulo} (Ya asignado)`
                                : `[${c.codigo}] ${c.titulo}`}
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
                    </div>

                    {cursosRealesJson.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                        El estudiante no tiene cursos de especialización inscritos actualmente.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {cursosRealesJson.map((cursoItem: any, cIdx: number) =>
                          renderTarjetaProgramaIndividual(cursoItem, cIdx, 'curso', handleQuitarCursoExistente)
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* BLOQUE TALLERES: SEPARADO DE CURSOS, CON NOTA Y BORRAR INTENTO */}
                {(filtroAcademico === 'todos' || filtroAcademico === 'talleres') && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/40 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
                        <div>
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest block">
                            Catálogo oficial de talleres prácticos
                          </span>
                          <h4 className="text-base font-black text-slate-900 dark:text-white">
                            Talleres de {alumnoSeleccionado.nombres}
                          </h4>
                        </div>
                        <span className="text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full border border-amber-500/20 font-bold shrink-0">
                          {talleresJson.length} taller(es) asignados
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <select
                          value={nuevoTallerSeleccionado}
                          onChange={(e) => setNuevoTallerSeleccionado(e.target.value)}
                          className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs font-bold rounded-xl p-3 outline-none focus:border-amber-500 transition-colors w-full"
                        >
                          <option value="">Seleccionar taller oficial</option>
                          {opcionesTalleres.map((t: any, idx: number) => (
                            <option
                              key={idx}
                              value={t.titulo}
                              disabled={listTalleresExistentes.some(lt => normStr(lt) === normStr(t.titulo))}
                            >
                              {listTalleresExistentes.some(lt => normStr(lt) === normStr(t.titulo))
                                ? `${t.titulo} (Ya asignado)`
                                : `[${t.codigo}] ${t.titulo}`}
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          disabled={cargandoTallerAccion || !nuevoTallerSeleccionado}
                          onClick={handleAgregarNuevoTaller}
                          className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-5 py-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer w-full sm:w-auto shrink-0 shadow-sm"
                        >
                          <Plus className="size-4" />
                          <span>{cargandoTallerAccion ? 'Guardando...' : 'Añadir taller'}</span>
                        </button>
                      </div>
                    </div>

                    {talleresJson.length === 0 ? (
                      <div className="bg-slate-50 dark:bg-slate-800/20 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500">
                        El estudiante no tiene talleres asignados actualmente.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {talleresJson.map((tallerItem: any, tIdx: number) =>
                          renderTarjetaProgramaIndividual(tallerItem, tIdx, 'taller', handleQuitarTallerExistente)
                        )}
                      </div>
                    )}
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
