'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, UserCheck, CheckCircle2, XCircle, Search, FileText, Download, Award, Server, Edit3, X, Save, RefreshCw,
  GraduationCap, QrCode, Printer, Copy, Check, Filter, UserCog, Mail, Phone, Calendar
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';

export interface EstudiantePerfil {
  id: string;
  dni_ce: string;
  nombres: string;
  apellidos: string;
  email: string;
  telefono: string;
  programa: string;
  paquete: string;
  fechaIngreso: string;
  estado: string;
}

export default function SolicitudesDatosAdminPage() {
  const [activeTab, setActiveTab] = useState<'estudiantes' | 'solicitudes'>('estudiantes');
  const [estudiantes, setEstudiantes] = useState<EstudiantePerfil[]>([]);
  const [solicitudes, setSolicitudes] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal para edición directa de perfil
  const [showEdicionDirectaModal, setShowEdicionDirectaModal] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState<any>(null);

  // Modal para constancia de estudio
  const [estudianteConstancia, setEstudianteConstancia] = useState<EstudiantePerfil | null>(null);
  const [copiadoLinkConstancia, setCopiadoLinkConstancia] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/solicitudes-datos');
      if (res.ok) {
        const data = await res.json();
        if (data.estudiantes) setEstudiantes(data.estudiantes);
        if (data.solicitudes) setSolicitudes(data.solicitudes);
      }
    } catch (e) {
      console.error('Error al cargar datos:', e);
    } finally {
      setCargando(false);
    }
  };

  const aprobarSolicitud = async (sol: any) => {
    try {
      await fetch('/api/admin/solicitudes-datos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: sol.estudianteId,
          solicitudId: sol.id,
          nombres: sol.nombresSolicitados,
          apellidos: sol.apellidosSolicitados,
          dni_ce: sol.dniSolicitado,
          accion: 'aprobar'
        })
      });
    } catch (err) {
      console.error(err);
    }

    setSolicitudes(prev => prev.map(s => s.id === sol.id ? { ...s, estado: 'Aprobada' } : s));
    
    // Actualizar también en el directorio local de estudiantes
    setEstudiantes(prev => prev.map(e => e.id === sol.estudianteId ? {
      ...e,
      nombres: sol.nombresSolicitados,
      apellidos: sol.apellidosSolicitados,
      dni_ce: sol.dniSolicitado
    } : e));

    setMensajeExito(`¡Solicitud aprobada! Los datos de ${sol.nombresSolicitados} ${sol.apellidosSolicitados} fueron actualizados en la base de datos.`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const rechazarSolicitud = async (sol: any) => {
    const solId = typeof sol === 'string' ? sol : sol?.id;
    try {
      await fetch('/api/admin/solicitudes-datos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          solicitudId: solId,
          studentId: typeof sol === 'object' ? sol.estudianteId : undefined,
          accion: 'rechazar'
        })
      });
    } catch (err) {
      console.error(err);
    }

    setSolicitudes(prev => prev.map(s => s.id === solId ? { ...s, estado: 'Rechazada' } : s));
    setMensajeExito('Solicitud rechazada correctamente.');
    setTimeout(() => setMensajeExito(null), 3000);
  };

  const abrirEdicionDirecta = (alumno: EstudiantePerfil) => {
    setAlumnoEditando({
      id: alumno.id,
      nombres: alumno.nombres,
      apellidos: alumno.apellidos,
      dni_ce: alumno.dni_ce,
      email: alumno.email,
      telefono: alumno.telefono,
      programa: alumno.programa
    });
    setShowEdicionDirectaModal(true);
  };

  const guardarEdicionDirecta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoEditando) return;

    try {
      await fetch('/api/admin/solicitudes-datos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: alumnoEditando.id,
          nombres: alumnoEditando.nombres,
          apellidos: alumnoEditando.apellidos,
          dni_ce: alumnoEditando.dni_ce,
          accion: 'editar_directo'
        })
      });
    } catch (err) {
      console.error(err);
    }

    // Actualizar estado local
    setEstudiantes(prev => prev.map(est => est.id === alumnoEditando.id ? {
      ...est,
      nombres: alumnoEditando.nombres,
      apellidos: alumnoEditando.apellidos,
      dni_ce: alumnoEditando.dni_ce,
      email: alumnoEditando.email,
      telefono: alumnoEditando.telefono,
      programa: alumnoEditando.programa
    } : est));

    setShowEdicionDirectaModal(false);
    setMensajeExito(`¡Ficha del estudiante ${alumnoEditando.nombres} ${alumnoEditando.apellidos} actualizada con éxito!`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const copiarEnlaceConstancia = (codigo: string) => {
    const link = `https://edumin.pe/validar-constancia/${codigo}`;
    navigator.clipboard.writeText(link);
    setCopiadoLinkConstancia(true);
    setTimeout(() => setCopiadoLinkConstancia(false), 2500);
  };

  // Filtrado de estudiantes
  const estudiantesFiltrados = estudiantes.filter(e => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    const nombreCompleto = `${e.nombres} ${e.apellidos}`.toLowerCase();
    return nombreCompleto.includes(q) || e.dni_ce.includes(q) || e.email.toLowerCase().includes(q) || e.programa.toLowerCase().includes(q);
  });

  // Filtrado de solicitudes
  const solicitudesFiltradas = solicitudes.filter(s => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    return s.nombreActual.toLowerCase().includes(q) || s.dniActual.includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0 h-full">
        <div className="max-w-7xl mx-auto space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-indigo-200 dark:border-indigo-800">
                  Secretaría académica
                </span>
                <span className="text-slate-400 dark:text-slate-500 text-xs font-mono">• Fichas de estudiantes y constancias</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                Gestión de estudiantes y actualización de datos
              </h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={cargarDatos}
                className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                <span>Recargar datos</span>
              </button>
            </div>
          </div>

          {mensajeExito && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{mensajeExito}</span>
            </div>
          )}

          {/* Pestañas de navegación */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
            
            {/* PESTAÑA 1: DIRECTORIO DE ESTUDIANTES */}
            <button
              onClick={() => setActiveTab('estudiantes')}
              className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'estudiantes' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Users className="w-4 h-4 text-indigo-600" />
              Directorio de estudiantes ({estudiantes.length})
            </button>

            {/* PESTAÑA 2: BUZÓN DE SOLICITUDES DE RECTIFICACIÓN */}
            <button
              onClick={() => setActiveTab('solicitudes')}
              className={`pb-3 px-5 font-bold text-xs sm:text-sm transition border-b-2 cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === 'solicitudes' 
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' 
                  : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <FileText className="w-4 h-4 text-purple-600" /> 
              Buzón de solicitudes ({solicitudes.filter(s => s.estado === 'Pendiente').length} pendientes)
            </button>
          </div>

          {/* TAB 1: DIRECTORIO DE ESTUDIANTES (EDICIÓN DIRECTA Y CONSTANCIAS) */}
          {activeTab === 'estudiantes' && (
            <div className="space-y-6">
              
              {/* Buscador */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Perfiles académicos y datos de estudiantes
                  </h3>
                  <p className="text-xs text-slate-500">
                    Puedes editar nombres, DNI o generar constancias de estudio oficiales de forma directa.
                  </p>
                </div>

                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por alumno, DNI o correo..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              {/* Tabla de Directorio de Estudiantes */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-bold bg-slate-50/50 dark:bg-slate-800/30">
                        <th className="py-3.5 px-4">Estudiante / DNI</th>
                        <th className="py-3.5 px-4">Programa matriculado</th>
                        <th className="py-3.5 px-4">Contacto</th>
                        <th className="py-3.5 px-4">Estado</th>
                        <th className="py-3.5 px-4 text-right">Acciones directas</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                      {estudiantesFiltrados.length > 0 ? (
                        estudiantesFiltrados.map((est) => (
                          <tr key={est.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                            
                            {/* Nombre y DNI */}
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-900 dark:text-white">
                                {est.nombres} {est.apellidos}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                DNI: {est.dni_ce}
                              </div>
                            </td>

                            {/* Programa */}
                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                                {est.programa}
                              </div>
                              <span className="inline-block mt-0.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded text-[9px] font-bold border border-indigo-200 dark:border-indigo-800">
                                Plan {est.paquete}
                              </span>
                            </td>

                            {/* Contacto */}
                            <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                              <div className="flex items-center gap-1 text-[11px]">
                                <Mail className="w-3 h-3 text-slate-400" />
                                <span className="truncate max-w-[160px]">{est.email}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                                <Phone className="w-3 h-3" />
                                <span>{est.telefono}</span>
                              </div>
                            </td>

                            {/* Estado */}
                            <td className="py-3.5 px-4">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                <CheckCircle2 className="w-3 h-3" /> {est.estado}
                              </span>
                            </td>

                            {/* Acciones: Editar Ficha y Generar Constancia */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                
                                {/* Generar Constancia de Estudio */}
                                <button
                                  onClick={() => setEstudianteConstancia(est)}
                                  className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                                  title="Generar constancia de estudio en PDF con código QR"
                                >
                                  <GraduationCap className="w-3.5 h-3.5" />
                                  <span>Constancia de estudio</span>
                                </button>

                                {/* Editar Datos Directo */}
                                <button
                                  onClick={() => abrirEdicionDirecta(est)}
                                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl font-bold text-xs transition flex items-center gap-1 cursor-pointer"
                                  title="Editar nombres, DNI o programa directamente"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                  <span>Editar datos</span>
                                </button>

                              </div>
                            </td>

                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-12 text-slate-400 font-medium">
                            No se encontraron estudiantes con los criterios de búsqueda.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: BUZÓN DE SOLICITUDES DE RECTIFICACIÓN DE DATOS */}
          {activeTab === 'solicitudes' && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Solicitudes de rectificación de datos</h3>
                  <p className="text-xs text-slate-500">Audita y compara los datos actuales con el documento de identidad adjunto por el estudiante.</p>
                </div>

                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Buscar por DNI o nombre..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 dark:text-slate-200"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="pb-3 px-4">DNI actual</th>
                      <th className="pb-3 px-4">Nombre actual en sistema</th>
                      <th className="pb-3 px-4">Datos solicitados (nuevos)</th>
                      <th className="pb-3 px-4">Documento sustento</th>
                      <th className="pb-3 px-4">Estado</th>
                      <th className="pb-3 px-4 text-right">Acción de auditoría</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {solicitudesFiltradas.length > 0 ? (
                      solicitudesFiltradas.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{s.dniActual}</td>
                          <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-200">
                            {s.nombreActual}
                            <div className="text-[10px] text-slate-400 font-normal">{s.email}</div>
                          </td>
                          <td className="py-4 px-4 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 rounded-xl">
                            {s.nombresSolicitados} {s.apellidosSolicitados}
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">DNI: {s.dniSolicitado}</div>
                          </td>
                          <td className="py-4 px-4">
                            <a
                              href={s.sustentoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition"
                            >
                              <FileText className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> 
                              <span>Ver foto DNI / PDF</span>
                            </a>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.estado === 'Aprobada' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' : s.estado === 'Rechazada' ? 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'}`}>
                              {s.estado}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right space-x-2">
                            {s.estado === 'Pendiente' ? (
                              <>
                                <button
                                  onClick={() => aprobarSolicitud(s)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer shadow-sm"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" /> 
                                  <span>Aprobar y actualizar</span>
                                </button>
                                <button
                                  onClick={() => rechazarSolicitud(s.id)}
                                  className="bg-red-50 dark:bg-red-950/50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" /> 
                                  <span>Rechazar</span>
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold">
                                Auditoría completada
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                          {cargando ? 'Cargando solicitudes de datos...' : 'No hay solicitudes coincidentes.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL 1: CONSTANCIA DE ESTUDIO OFICIAL A4 */}
      {estudianteConstancia && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col my-8">
            
            {/* Header del Modal */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Constancia de estudios oficial A4 • Verificación QR
                </h3>
              </div>
              <button 
                onClick={() => setEstudianteConstancia(null)} 
                className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Documento A4 Simulado */}
            <div className="p-6 bg-slate-950 flex items-center justify-center">
              <div className="bg-white border-8 border-indigo-950/20 p-8 rounded-2xl w-full text-slate-900 shadow-2xl relative font-sans">
                
                {/* Membrete Oficial */}
                <div className="flex justify-between items-center border-b-2 border-indigo-900 pb-4 mb-6">
                  <div className="text-left">
                    <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-900 uppercase block">ESCUELA DE POSTGRADO & MINERÍA</span>
                    <h4 className="text-sm font-black tracking-tight text-slate-900">INSTITUTO INTERNACIONAL EDUMIN</h4>
                    <span className="text-[8px] text-slate-500 block">RUC: 20608945123 • Registro de Secretaría Académica</span>
                  </div>
                  <div className="size-10 rounded-xl bg-indigo-900 text-white flex items-center justify-center font-black text-sm shadow-md">
                    EDM
                  </div>
                </div>

                {/* Título de la Constancia */}
                <div className="text-center my-6">
                  <h3 className="text-base font-black uppercase tracking-wider text-indigo-950 border-b-2 border-indigo-600 inline-block pb-1">
                    CONSTANCIA DE ESTUDIOS Y MATRÍCULA
                  </h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-1">CÓDIGO: EDM-2026-CST-{estudianteConstancia.dni_ce}</p>
                </div>

                {/* Cuerpo del Texto Formal */}
                <div className="space-y-4 text-xs leading-relaxed text-slate-800 text-justify">
                  <p>
                    La Dirección Académica y de Secretaría General del <strong>Instituto Internacional EDUMIN</strong>, por medio del presente documento:
                  </p>
                  
                  <p className="text-center font-bold text-sm tracking-widest text-indigo-950 uppercase py-1">
                    HACE CONSTAR:
                  </p>

                  <p>
                    Que el/la estudiante <strong>{estudianteConstancia.nombres.toUpperCase()} {estudianteConstancia.apellidos.toUpperCase()}</strong>, identificado(a) con Documento Nacional de Identidad / CE N° <strong>{estudianteConstancia.dni_ce}</strong>, se encuentra formalmente matriculado(a) y en condición académica de <strong>ALUMNO REGULAR</strong> en el programa de especialización:
                  </p>

                  <div className="p-3 bg-indigo-50/70 border-l-4 border-indigo-600 rounded-r-xl text-center">
                    <span className="text-xs font-black uppercase text-indigo-950 block">
                      {estudianteConstancia.programa}
                    </span>
                    <span className="text-[10px] text-slate-600 block mt-0.5">
                      Modalidad Online Asincrónica • Periodo Académico 2026
                    </span>
                  </div>

                  <p>
                    Se expide la presente constancia a solicitud de la parte interesada para los fines académicos, laborales o administrativos que estime conveniente.
                  </p>
                </div>

                {/* Pie de Firma y QR */}
                <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end text-[9px] text-slate-600">
                  <div className="text-left font-mono">
                    <p>Fecha de emisión: {new Date().toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                    <p className="mt-0.5">Lima, Perú</p>
                  </div>

                  {/* Firma */}
                  <div className="text-center">
                    <div className="w-28 border-b border-slate-400 mb-1"></div>
                    <span className="text-[8px] block font-bold text-slate-900">Dirección Académica</span>
                    <span className="text-[7px] text-slate-500">Instituto Internacional EDUMIN</span>
                  </div>

                  {/* QR de Verificación */}
                  <div className="flex flex-col items-center p-1 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <QrCode className="w-7 h-7 text-slate-900" />
                    <span className="text-[6px] font-mono mt-0.5 font-bold">CÓDIGO VÁLIDO</span>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer con Acciones */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copiarEnlaceConstancia(estudianteConstancia.dni_ce)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 transition cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  {copiadoLinkConstancia ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiadoLinkConstancia ? '¡Enlace copiado!' : 'Copiar link de validación'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-md cursor-pointer flex items-center gap-2"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir / Descargar PDF</span>
                </button>
                <button
                  onClick={() => setEstudianteConstancia(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: EDICIÓN DIRECTA DE FICHA DE ESTUDIANTE */}
      {showEdicionDirectaModal && alumnoEditando && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 dark:border-slate-800 my-8">
            <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Edición directa de ficha de estudiante
                </h3>
              </div>
              <button onClick={() => setShowEdicionDirectaModal(false)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={guardarEdicionDirecta} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Nombres
                  </label>
                  <input 
                    type="text" 
                    required
                    value={alumnoEditando.nombres}
                    onChange={(e) => setAlumnoEditando({ ...alumnoEditando, nombres: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Apellidos
                  </label>
                  <input 
                    type="text" 
                    required
                    value={alumnoEditando.apellidos}
                    onChange={(e) => setAlumnoEditando({ ...alumnoEditando, apellidos: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    DNI / Carné de extranjería
                  </label>
                  <input 
                    type="text" 
                    required
                    value={alumnoEditando.dni_ce}
                    onChange={(e) => setAlumnoEditando({ ...alumnoEditando, dni_ce: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Teléfono / WhatsApp
                  </label>
                  <input 
                    type="text" 
                    value={alumnoEditando.telefono || ''}
                    onChange={(e) => setAlumnoEditando({ ...alumnoEditando, telefono: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Correo electrónico
                </label>
                <input 
                  type="email" 
                  value={alumnoEditando.email || ''}
                  onChange={(e) => setAlumnoEditando({ ...alumnoEditando, email: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Programa o diplomado matriculado
                </label>
                <input 
                  type="text" 
                  value={alumnoEditando.programa || ''}
                  onChange={(e) => setAlumnoEditando({ ...alumnoEditando, programa: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold bg-slate-50 dark:bg-slate-800 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button 
                  type="button" 
                  onClick={() => setShowEdicionDirectaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar cambios en Supabase</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
