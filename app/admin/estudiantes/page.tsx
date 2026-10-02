'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, Search, RefreshCw, Eye, ShieldCheck, 
  CheckCircle2, AlertTriangle, UserCheck, GraduationCap, Download
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';
import Ficha360Modal from '@/components/admin/ficha-360-modal';
import { MOCK_ESTUDIANTES, EstudianteCompleto } from '@/lib/data/mockStudents';

export default function AdminEstudiantesPage() {
  const [estudiantes, setEstudiantes] = useState<EstudianteCompleto[]>(MOCK_ESTUDIANTES);
  const [cargando, setCargando] = useState(true);
  
  // Filtros
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroRiesgo, setFiltroRiesgo] = useState('todos');
  
  // Modal Ficha 360°
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState<EstudianteCompleto | null>(null);

  const [catalogoFull, setCatalogoFull] = useState<any[]>([]);

  useEffect(() => {
    cargarEstudiantes();
    cargarCatalogo();
  }, []);

  const cargarCatalogo = async () => {
    try {
      const res = await fetch('/api/admin/catalogo');
      if (res.ok) {
        const data = await res.json();
        setCatalogoFull(data.cursos || []);
      }
    } catch (e) {
      console.error('Error al cargar catálogo en estudiantes:', e);
    }
  };

  const cargarEstudiantes = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/estudiantes');
      if (res.ok) {
        const data = await res.json();
        if (data.estudiantes && data.estudiantes.length > 0) {
          setEstudiantes(data.estudiantes);
          setAlumnoSeleccionado((prev) => {
            if (!prev) return null;
            return data.estudiantes.find((e: EstudianteCompleto) => e.id === prev.id || e.dni_ce === prev.dni_ce) || prev;
          });
        }
      }
    } catch (e) {
      console.error('Error cargando estudiantes:', e);
    } finally {
      setCargando(false);
    }
  };

  const limpiarTexto = (t: string) => (t || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

  const estudiantesFiltrados = estudiantes.filter(est => {
    const q = limpiarTexto(busqueda);
    const coincideBusqueda = !busqueda || 
      limpiarTexto(est.nombres).includes(q) || 
      limpiarTexto(est.apellidos).includes(q) || 
      limpiarTexto(est.dni_ce).includes(q) ||
      limpiarTexto(est.email).includes(q);

    const coincideEstado = filtroEstado === 'todos' || est.estado === filtroEstado;
    const coincideRiesgo = filtroRiesgo === 'todos' || est.nivel_riesgo_churn === filtroRiesgo;

    return coincideBusqueda && coincideEstado && coincideRiesgo;
  });

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      
      {/* Sidebar Principal Unificado */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0 h-full">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Encabezado */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Sincronizado Supabase
                </span>
                <span className="text-slate-400 text-xs font-mono">• public.profiles</span>
              </div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white mt-1 flex items-center gap-2">
                <Users className="w-8 h-8 text-indigo-600 dark:text-indigo-400" /> 
                Directorio y Secretaría de Estudiantes
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Administra inscripciones, asignación de diplomados, notas por módulo y Ficha 360° en tiempo real.
              </p>
            </div>

            <button
              onClick={cargarEstudiantes}
              disabled={cargando}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar Lista ({estudiantes.length})
            </button>
          </div>

          {/* Filtros de Búsqueda */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm grid grid-cols-1 sm:grid-cols-12 gap-4">
            <div className="sm:col-span-6 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                <Search className="size-4" />
              </span>
              <input 
                type="text"
                placeholder="Buscar por DNI, Nombres, Apellidos o Correo..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="sm:col-span-3">
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="todos">Todos los Estados de Deuda</option>
                <option value="Al Día">Al Día</option>
                <option value="Deuda Activa">Deuda Activa</option>
                <option value="Constancia de no adeudo">Constancia de no adeudo</option>
                <option value="Bloqueado por Sistema">Bloqueado por Sistema</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <select
                value={filtroRiesgo}
                onChange={(e) => setFiltroRiesgo(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200"
              >
                <option value="todos">Todos los Niveles de Riesgo</option>
                <option value="BAJO">Riesgo Bajo</option>
                <option value="MEDIO">Riesgo Medio</option>
                <option value="ALTO">Riesgo Alto</option>
                <option value="CRÍTICO">Riesgo Crítico</option>
              </select>
            </div>
          </div>

          {/* Tabla de Estudiantes */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                    <th className="py-3 px-4">DNI / CE</th>
                    <th className="py-3 px-4">Estudiante</th>
                    <th className="py-3 px-4">Paquete & Diplomado Actual</th>
                    <th className="py-3 px-4 text-center">Avance Real</th>
                    <th className="py-3 px-4">Estado Pago</th>
                    <th className="py-3 px-4 text-center">Riesgo</th>
                    <th className="py-3 px-4 text-right">Ficha 360°</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {estudiantesFiltrados.length > 0 ? (
                    estudiantesFiltrados.map((est) => (
                      <tr key={est.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-4 font-mono font-bold text-indigo-600 dark:text-indigo-400">{est.dni_ce}</td>
                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-slate-100">
                          <div>{est.nombres} {est.apellidos}</div>
                          <div className="text-[10px] font-normal text-slate-400">{est.email}</div>
                        </td>
                        <td className="py-4 px-4">
                          <span className="bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded text-[10px] mr-2">
                            {est.paquete_adquirido || 'FULL'}
                          </span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {est.diplomado_actual || 'DERECHO MINERO'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-1 rounded-md text-[11px]">
                            {est.avance_porcentaje ?? 50}%
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            est.estado === 'Constancia de no adeudo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            est.estado === 'Deuda Activa' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                            'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {est.estado}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            est.nivel_riesgo_churn === 'CRÍTICO' ? 'bg-rose-600 text-white' :
                            est.nivel_riesgo_churn === 'ALTO' ? 'bg-amber-500 text-white' :
                            'bg-emerald-600 text-white'
                          }`}>
                            {est.nivel_riesgo_churn}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <button
                            onClick={() => setAlumnoSeleccionado(est)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                          >
                            <Eye className="size-3.5" /> Abrir Ficha
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">
                        {cargando ? 'Cargando estudiantes...' : 'No se encontraron estudiantes para la búsqueda.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Modal Ficha 360° */}
      {alumnoSeleccionado && (
        <Ficha360Modal
          alumnoSeleccionado={alumnoSeleccionado}
          catalogoDiplomados={catalogoFull}
          onClose={() => setAlumnoSeleccionado(null)}
          onOpenEditCronograma={() => {}}
          onSetPagoParaAnular={() => {}}
          onRegistrarPago={async () => {}}
          montoPago="150.00"
          setMontoPago={() => {}}
          comprobante="OP-984321"
          setComprobante={() => {}}
          metodo="Yape / Plin"
          setMetodo={() => {}}
          cargandoPago={false}
          mensaje={null}
          selectedCreditoIdx={0}
          setSelectedCreditoIdx={() => {}}
          onSetPagoIdParaValidar={() => {}}
          onSetReciboImprimir={() => {}}
          onEnviarAlertaWhatsApp={async () => {}}
          enviandoAlertaWhatsApp={false}
          onRefetchEstudiantes={cargarEstudiantes}
        />
      )}

    </div>
  );
}
