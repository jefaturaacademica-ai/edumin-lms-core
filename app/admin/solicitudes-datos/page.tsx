'use client';

import React, { useState } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, UserCheck, CheckCircle2, XCircle, Search, FileText, Download, Award, Server, Edit3, X, Save
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SolicitudesDatosAdminPage() {
  const [solicitudes, setSolicitudes] = useState([
    {
      id: 'sol-dat-01',
      estudianteId: 'est-07',
      nombreActual: 'Sofia Beatriz Mendoza Ugarte',
      dniActual: '73412098',
      email: 'sofia.mendoza@gmail.com',
      nombresSolicitados: 'Sofía Beatriz',
      apellidosSolicitados: 'Mendoza de Ugarte',
      dniSolicitado: '73412098',
      fecha: '2026-09-22',
      sustentoUrl: '/assets/docs/dni_sofia_mendoza.pdf',
      estado: 'Pendiente'
    },
    {
      id: 'sol-dat-02',
      estudianteId: 'est-02',
      nombreActual: 'Marcos Quispe',
      dniActual: '71234568',
      email: 'marcos.q@hotmail.com',
      nombresSolicitados: 'Marcos Alexander',
      apellidosSolicitados: 'Quispe Huamán',
      dniSolicitado: '71234568',
      fecha: '2026-09-20',
      sustentoUrl: '/assets/docs/dni_marcos_quispe.pdf',
      estado: 'Pendiente'
    }
  ]);

  const [busqueda, setBusqueda] = useState('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);

  // Modal para edición directa
  const [showEdicionDirectaModal, setShowEdicionDirectaModal] = useState(false);
  const [alumnoEditando, setAlumnoEditando] = useState<any>(null);

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const aprobarSolicitud = (id: string) => {
    const sol = solicitudes.find(s => s.id === id);
    if (!sol) return;

    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: 'Aprobada' } : s));
    setMensajeExito(`¡Solicitud aprobada! Los datos de ${sol.nombresSolicitados} ${sol.apellidosSolicitados} fueron actualizados en el sistema.`);
    setTimeout(() => setMensajeExito(null), 5000);
  };

  const rechazarSolicitud = (id: string) => {
    setSolicitudes(prev => prev.map(s => s.id === id ? { ...s, estado: 'Rechazada' } : s));
    setMensajeExito('Solicitud rechazada correctamente.');
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const guardarEdicionDirecta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoEditando) return;

    setShowEdicionDirectaModal(false);
    setMensajeExito(`¡Ficha del alumno ${alumnoEditando.nombres} ${alumnoEditando.apellidos} actualizada por el Administrador!`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const solicitudesFiltradas = solicitudes.filter(s => {
    const q = busqueda.toLowerCase();
    return s.nombreActual.toLowerCase().includes(q) || s.dniActual.includes(q) || s.email.toLowerCase().includes(q);
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex-col hidden md:flex shrink-0 z-20">
        <div className="p-6 flex items-center gap-3 border-b border-slate-800">
          <ShieldCheck className="w-8 h-8 text-indigo-500" />
          <h2 className="text-xl font-bold text-white tracking-tight">ADMIN PRO</h2>
        </div>
        
        <nav className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <Link href="/admin" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium hover:bg-slate-800 hover:text-white text-slate-300">
            <CreditCard className="w-5 h-5 shrink-0" />
            <span>Tesorería & Pagos</span>
          </Link>

          <Link href="/admin/catalogo" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium hover:bg-slate-800 hover:text-white text-slate-300">
            <BookOpen className="w-5 h-5 shrink-0 text-indigo-400" />
            <span>Catálogo & Módulos</span>
          </Link>

          <Link href="/admin/alumnos-riesgo" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium hover:bg-slate-800 hover:text-white text-slate-300">
            <Users className="w-5 h-5 shrink-0 text-amber-400" />
            <span>Alumnos en Riesgo</span>
          </Link>

          <Link href="/admin/certificaciones" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium hover:bg-slate-800 hover:text-white text-slate-300">
            <Award className="w-5 h-5 shrink-0 text-amber-300" />
            <span>Certificados & CIP</span>
          </Link>

          <Link href="/admin/solicitudes-datos" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium bg-indigo-600 text-white shadow-md shadow-indigo-600/25">
            <UserCheck className="w-5 h-5 shrink-0 text-emerald-300" />
            <span>Buzón de Datos</span>
          </Link>

          <Link href="/admin/auditoria" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium hover:bg-slate-800 hover:text-white text-slate-300">
            <Activity className="w-5 h-5 shrink-0 text-emerald-400" />
            <span>Auditoría & Webhooks</span>
          </Link>

          <Link href="/admin/configuracion" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium hover:bg-slate-800 hover:text-white text-slate-300">
            <Settings className="w-5 h-5 shrink-0 text-slate-400" />
            <span>Config. & Roles</span>
          </Link>

          <Link href="/admin/reportes" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors text-sm font-medium hover:bg-slate-800 hover:text-white text-slate-300">
            <Server className="w-5 h-5 shrink-0 text-sky-400" />
            <span>Reportes & Data</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors cursor-pointer">
            <LogOut className="w-5 h-5" />
            <span className="font-medium text-sm">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Buzón de Solicitudes de Actualización de Datos</h1>
              <p className="text-slate-500 mt-1">Revisa y audita las solicitudes de corrección de Nombres, Apellidos y DNI enviadas por los alumnos.</p>
            </div>
          </div>

          {mensajeExito && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{mensajeExito}</span>
            </div>
          )}

          {/* Buscador de Alumnos y Buzón */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Solicitudes Pendientes de Auditoría</h3>
                <p className="text-xs text-slate-500">Compara los datos actuales contra los sustentados en el documento adjunto.</p>
              </div>

              <div className="relative w-full sm:w-72">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Search className="size-4" />
                </span>
                <input 
                  type="text"
                  placeholder="Buscar por DNI o Nombre..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="pb-3 px-4">DNI Actual</th>
                    <th className="pb-3 px-4">Nombre Actual en Sistema</th>
                    <th className="pb-3 px-4">Datos Solicitados (Nuevos)</th>
                    <th className="pb-3 px-4">Documento Sustento</th>
                    <th className="pb-3 px-4">Estado</th>
                    <th className="pb-3 px-4 text-right">Acción de Auditoría</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {solicitudesFiltradas.length > 0 ? (
                    solicitudesFiltradas.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-indigo-600">{s.dniActual}</td>
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {s.nombreActual}
                          <div className="text-[10px] text-slate-400 font-normal">{s.email}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-emerald-700 bg-emerald-50/50 rounded-xl">
                          {s.nombresSolicitados} {s.apellidosSolicitados}
                          <div className="text-[10px] text-emerald-600 font-mono">DNI: {s.dniSolicitado}</div>
                        </td>
                        <td className="py-4 px-4">
                          <a
                            href={s.sustentoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition"
                          >
                            <FileText className="w-3.5 h-3.5 text-indigo-600" /> Ver Foto DNI / PDF
                          </a>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.estado === 'Aprobada' ? 'bg-emerald-100 text-emerald-800' : s.estado === 'Rechazada' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>
                            {s.estado}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          {s.estado === 'Pendiente' ? (
                            <>
                              <button
                                onClick={() => aprobarSolicitud(s.id)}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" /> Aprobar y Actualizar
                              </button>
                              <button
                                onClick={() => rechazarSolicitud(s.id)}
                                className="bg-red-50 text-red-600 hover:bg-red-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" /> Rechazar
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => { setAlumnoEditando({ nombres: s.nombresSolicitados, apellidos: s.apellidosSolicitados, dni_ce: s.dniSolicitado }); setShowEdicionDirectaModal(true); }}
                              className="bg-slate-100 text-slate-700 hover:bg-slate-200 px-3 py-1.5 rounded-xl font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Editar Ficha Directa
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                        No hay solicitudes coincidentes.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* MODAL: EDICIÓN DIRECTA DE FICHA DE ESTUDIANTE */}
      {showEdicionDirectaModal && alumnoEditando && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Edición Directa por Administrador</h3>
              <button onClick={() => setShowEdicionDirectaModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={guardarEdicionDirecta} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Nombres</label>
                <input 
                  type="text" 
                  value={alumnoEditando.nombres}
                  onChange={(e) => setAlumnoEditando({ ...alumnoEditando, nombres: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Apellidos</label>
                <input 
                  type="text" 
                  value={alumnoEditando.apellidos}
                  onChange={(e) => setAlumnoEditando({ ...alumnoEditando, apellidos: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-bold bg-slate-50 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">DNI / CE</label>
                <input 
                  type="text" 
                  value={alumnoEditando.dni_ce}
                  onChange={(e) => setAlumnoEditando({ ...alumnoEditando, dni_ce: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowEdicionDirectaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
