'use client';

import React, { useState } from 'react';
import { 
  CreditCard, Search, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, AlertTriangle, UserX, CheckCircle2, Lock, Unlock, Calendar, Sparkles, X, Clock 
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default function AlumnosRiesgoPage() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'deuda' | 'bloqueado'>('todos');
  const [mesSeleccionado, setMesSeleccionado] = useState<string>('todos');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  
  // Estados para el modal de Prórroga por Días
  const [showProrrogaModal, setShowProrrogaModal] = useState(false);
  const [alumnoSeleccionadoProrroga, setAlumnoSeleccionadoProrroga] = useState<any>(null);
  const [diasProrroga, setDiasProrroga] = useState<string>('3');

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const [estudiantes, setEstudiantes] = useState<any[]>([
    { id: '1', dni: '45678912', nombre: 'Lucero Martinez', email: 'lucero@gmail.com', programa: 'DERECHO MINERO', cuotasPendientes: 2, deudaMonto: 300.00, mesDeuda: 'agosto', prorrogaHasta: null, estado: 'Deuda Activa', bloqueado: false },
    { id: '2', dni: '71234568', nombre: 'Marcos Quispe', email: 'marcos.q@hotmail.com', programa: 'GEOLOGÍA MINERA', cuotasPendientes: 1, deudaMonto: 150.00, mesDeuda: 'septiembre', prorrogaHasta: '2026-09-27', estado: 'Prórroga Activa', bloqueado: false },
    { id: '3', dni: '78912345', nombre: 'Ana Torres V.', email: 'ana.torres@gmail.com', programa: 'HSEQ SISTEMAS', cuotasPendientes: 3, deudaMonto: 450.00, mesDeuda: 'julio', prorrogaHasta: null, estado: 'Bloqueado por Sistema', bloqueado: true },
    { id: '4', dni: '43210987', nombre: 'Pedro Huanca', email: 'pedro.h@outlook.com', programa: 'SEGURIDAD INDUSTRIAL', cuotasPendientes: 1, deudaMonto: 150.00, mesDeuda: 'agosto', prorrogaHasta: null, estado: 'Deuda Activa', bloqueado: false },
  ]);

  React.useEffect(() => {
    cargarEstudiantes();
  }, []);

  const cargarEstudiantes = async () => {
    try {
      const res = await fetch('/api/admin/alumnos-riesgo');
      if (res.ok) {
        const data = await res.json();
        if (data.estudiantes && data.estudiantes.length > 0) {
          const formateados = data.estudiantes.map((e: any) => {
            const cuotasPend = Math.max(0, 3 - (e.cuotas_pagadas || 1));
            return {
              id: e.id,
              dni: e.dni_ce,
              nombre: `${e.nombres} ${e.apellidos}`,
              email: e.email,
              programa: e.paquete_adquirido ? `PAQUETE ${e.paquete_adquirido}` : 'DIPLOMADO OFICIAL',
              cuotasPendientes: cuotasPend,
              deudaMonto: cuotasPend * 150.00,
              mesDeuda: 'septiembre',
              prorrogaHasta: e.prorroga_hasta || null,
              estado: e.bloqueado ? 'Bloqueado por Sistema' : (e.prorroga_hasta ? 'Prórroga Activa' : (cuotasPend > 0 ? 'Deuda Activa' : 'Al Día')),
              bloqueado: Boolean(e.bloqueado)
            };
          });
          setEstudiantes(formateados);
        }
      }
    } catch (err) {
      console.error('Error cargando estudiantes:', err);
    }
  };

  const toggleBloqueo = async (id: string | number) => {
    const estudiante = estudiantes.find(e => e.id === id);
    if (!estudiante) return;

    const nuevoBloqueo = !estudiante.bloqueado;

    try {
      await fetch('/api/admin/alumnos-riesgo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id, action: 'bloqueo', bloqueado: nuevoBloqueo })
      });
    } catch (err) {
      console.error(err);
    }

    setEstudiantes(prev => prev.map(est => {
      if (est.id === id) {
        return {
          ...est,
          bloqueado: nuevoBloqueo,
          estado: nuevoBloqueo ? 'Bloqueado por Sistema' : 'Deuda Activa',
          prorrogaHasta: null
        };
      }
      return est;
    }));
    setMensajeExito("¡Estado de acceso del estudiante actualizado!");
    setTimeout(() => setMensajeExito(null), 4000);
  };

  // Guardar la prórroga calculando la fecha límite según los días seleccionados
  const confirmarProrroga = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoSeleccionadoProrroga) return;

    const dias = parseInt(diasProrroga) || 3;
    const fechaFutura = new Date();
    fechaFutura.setDate(fechaFutura.getDate() + dias);
    const fechaFormateada = fechaFutura.toISOString().split('T')[0];

    try {
      await fetch('/api/admin/alumnos-riesgo', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: alumnoSeleccionadoProrroga.id,
          action: 'prorroga',
          prorroga_hasta: fechaFormateada
        })
      });
    } catch (err) {
      console.error(err);
    }

    setEstudiantes(prev => prev.map(est => {
      if (est.id === alumnoSeleccionadoProrroga.id) {
        return {
          ...est,
          prorrogaHasta: fechaFormateada,
          estado: `Prórroga (${dias} días)`,
          bloqueado: false
        };
      }
      return est;
    }));

    setShowProrrogaModal(false);
    setAlumnoSeleccionadoProrroga(null);
    setMensajeExito(`¡Prórroga de ${dias} días concedida con éxito! Vence el ${fechaFormateada}`);
    setTimeout(() => setMensajeExito(null), 5000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const estudiantesFiltrados = estudiantes.filter(est => {
    const coincideTexto = est.nombre.toLowerCase().includes(busqueda.toLowerCase()) || est.dni.includes(busqueda);
    const coincideMes = mesSeleccionado === 'todos' || est.mesDeuda === mesSeleccionado;
    
    if (filtroEstado === 'deuda') return coincideTexto && coincideMes && est.cuotasPendientes > 0 && !est.bloqueado;
    if (filtroEstado === 'bloqueado') return coincideTexto && coincideMes && est.bloqueado;
    return coincideTexto && coincideMes;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto">
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Base & Alumnos en Riesgo</h1>
              <p className="text-slate-500 mt-1">Control de estudiantes, deudas por meses y prórrogas temporales automatizadas.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-bold block">Corte Automático Programado</span>
                <span>Bloqueo masivo el <strong className="font-mono underline">24/09/2026</strong></span>
              </div>
            </div>
          </div>

          {mensajeExito && (
            <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{mensajeExito}</span>
            </div>
          )}

          {/* Tarjetas de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Alumnos con Deuda Activa</p>
                <div className="p-2.5 bg-red-50 text-red-600 rounded-2xl">
                  <AlertTriangle className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-red-600 mt-3">14</h3>
            </div>
            
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Bloqueados por Sistema</p>
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <UserX className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-amber-600 mt-3">6</h3>
            </div>

            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
              <div className="flex justify-between items-center">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Base Estudiantil</p>
                <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Users className="size-5" />
                </div>
              </div>
              <h3 className="text-3xl font-black text-slate-900 mt-3">128</h3>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-5">
              
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex gap-2">
                  <button 
                    onClick={() => setFiltroEstado('todos')} 
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${filtroEstado === 'todos' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Todos
                  </button>
                  <button 
                    onClick={() => setFiltroEstado('deuda')} 
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${filtroEstado === 'deuda' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Con Deuda
                  </button>
                  <button 
                    onClick={() => setFiltroEstado('bloqueado')} 
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${filtroEstado === 'bloqueado' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    Bloqueados
                  </button>
                </div>

                <select 
                  value={mesSeleccionado}
                  onChange={(e) => setMesSeleccionado(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                >
                  <option value="todos">📅 Filtrar por Mes (Todos)</option>
                  <option value="julio">Julio</option>
                  <option value="agosto">Agosto</option>
                  <option value="septiembre">Septiembre</option>
                </select>
              </div>

              <div className="relative w-full lg:w-72">
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

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="pb-3 px-4">DNI / CE</th>
                    <th className="pb-3 px-4">Estudiante</th>
                    <th className="pb-3 px-4">Programa</th>
                    <th className="pb-3 px-4">Mes Deuda</th>
                    <th className="pb-3 px-4">Deuda Pendiente</th>
                    <th className="pb-3 px-4">Estado / Vencimiento Prórroga</th>
                    <th className="pb-3 px-4 text-right">Control de Acceso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {estudiantesFiltrados.length > 0 ? (
                    estudiantesFiltrados.map((est) => (
                      <tr key={est.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-indigo-600">{est.dni}</td>
                        <td className="py-4 px-4 font-bold text-slate-800">
                          {est.nombre}
                          <div className="text-[10px] text-slate-400 font-normal">{est.email}</div>
                        </td>
                        <td className="py-4 px-4 font-medium text-slate-600">{est.programa}</td>
                        <td className="py-4 px-4 font-bold capitalize text-slate-700">
                          <span className="bg-slate-100 px-2.5 py-1 rounded-md">{est.mesDeuda}</span>
                        </td>
                        <td className="py-4 px-4 font-black text-red-600">
                          S/ {est.deudaMonto.toFixed(2)}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${est.bloqueado ? 'bg-amber-100 text-amber-800' : est.prorrogaHasta ? 'bg-indigo-100 text-indigo-800' : 'bg-red-100 text-red-800'}`}>
                            {est.estado}
                          </span>
                          {est.prorrogaHasta && (
                            <span className="block text-[10px] text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                              <Clock className="size-3" /> Expira: {est.prorrogaHasta}
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right space-x-2">
                          <button 
                            onClick={() => { setAlumnoSeleccionadoProrroga(est); setShowProrrogaModal(true); }}
                            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer"
                          >
                            <Sparkles className="size-3.5" /> Dar Prórroga
                          </button>

                          <button 
                            onClick={() => toggleBloqueo(est.id)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all inline-flex items-center gap-1 shadow-sm cursor-pointer ${est.bloqueado ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-600 hover:text-white'}`}
                          >
                            {est.bloqueado ? <><Unlock className="size-3.5" /> Desbloquear</> : <><Lock className="size-3.5" /> Bloquear</>}
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-slate-400 font-medium">
                        No se encontraron estudiantes para los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

          </div>

        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL: CONFIGURAR DÍAS DE PRÓRROGA INDIVIDUAL             */}
      {/* ========================================================= */}
      {showProrrogaModal && alumnoSeleccionadoProrroga && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Otorgar Prórroga Temporal</h3>
              <button onClick={() => setShowProrrogaModal(false)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={confirmarProrroga} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-2">Estudiante seleccionado:</p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  {alumnoSeleccionadoProrroga.nombre} <span className="text-indigo-600 font-mono font-normal">({alumnoSeleccionadoProrroga.dni})</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Días de gracia / prórroga <span className="text-red-500">*</span>
                </label>
                <select 
                  value={diasProrroga} 
                  onChange={(e) => setDiasProrroga(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-semibold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800 cursor-pointer"
                >
                  <option value="2">2 Días de prórroga</option>
                  <option value="3">3 Días de prórroga</option>
                  <option value="5">5 Días de prórroga</option>
                  <option value="7">1 semana (7 días)</option>
                  <option value="15">15 días de prórroga</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-1.5">El sistema reactivará el bloqueo automático una vez cumplido este periodo.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowProrrogaModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer"
                >
                  Confirmar Prórroga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}