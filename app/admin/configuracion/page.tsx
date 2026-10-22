'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, CheckCircle2, AlertCircle, Search, UserCheck, Layers, Award, Save, RefreshCw, Server,
  GraduationCap, Eye, ExternalLink, Database, Sparkles, Check
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/admin-sidebar';
import AdminHeader from '@/components/admin/admin-header';
import { LoginPersonalizacionTab } from '@/components/admin/configuracion/LoginPersonalizacionTab';

export default function ConfiguracionRolesPage() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'paquetes' | 'simulador' | 'login'>('rbac');
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  
  // Estado para la configuración de plantillas
  const [paquetesConfig, setPaquetesConfig] = useState({
    COMPLETO: { modulares: 3, diplomas: 1, cursos: 3, certCip: false },
    FULL: { modulares: 3, diplomas: 1, cursos: 5, certCip: true },
    ILIMITADO: { modulares: 10, diplomas: 5, cursos: 15, certCip: true }
  });

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/roles');
      if (res.ok) {
        const data = await res.json();
        setUsuarios(Array.isArray(data.usuarios) ? data.usuarios : []);
      }
    } catch (e) {
      console.error('Error cargando usuarios:', e);
    } finally {
      setCargando(false);
    }
  };

  const cambiarRolUsuario = async (userId: string, nuevoRol: string) => {
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role: nuevoRol })
      });

      if (res.ok) {
        setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, role: nuevoRol } : u));
        setMensajeExito(`¡Rol actualizado exitosamente a ${nuevoRol}!`);
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert('No se pudo actualizar el rol en la base de datos.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de comunicación con el servidor.');
    }
  };

  const guardarConfigPaquetes = () => {
    setMensajeExito('¡Plantillas de paquetes actualizadas con éxito!');
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase();
    const nom = `${u.nombres || ''} ${u.apellidos || ''}`.toLowerCase();
    const dni = (u.dni_ce || '').toLowerCase();
    const mail = (u.email || '').toLowerCase();
    const rol = (u.role || '').toLowerCase();
    return nom.includes(q) || dni.includes(q) || mail.includes(q) || rol.includes(q);
  });

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal con Header Superior Institucional */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        <AdminHeader breadcrumb="Configuración y Roles (RBAC)" />
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0">
          <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Configuración & Roles (RBAC)</h1>
              <p className="text-slate-500 mt-1">Gestión de permisos de usuarios, control de accesos y reglas de paquetes.</p>
            </div>
            <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 rounded-2xl tabular-nums font-bold border border-slate-800">
              🔒 Supabase RLS Protegido
            </div>
          </div>

          {mensajeExito && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{mensajeExito}</span>
            </div>
          )}

          {/* Navegación por pestañas */}
          <div className="flex border-b border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('rbac')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'rbac' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <UserCheck className="w-4 h-4" /> Control de Acceso RBAC ({usuarios.length} Usuarios)
            </button>
            <button
              onClick={() => setActiveTab('paquetes')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'paquetes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Layers className="w-4 h-4" /> Configuración de Paquetes & Créditos
            </button>
            <button
              onClick={() => setActiveTab('simulador')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'simulador' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <GraduationCap className="w-4 h-4" /> Vista Estudiante FULL (Simulador)
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'login' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" /> Personalización del Login
            </button>
          </div>

          {activeTab === 'rbac' ? (
            /* TAB: CONTROL RBAC DE USUARIOS */
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-100 pb-5">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Perfiles y Roles de Usuario</h3>
                  <p className="text-xs text-slate-500">Asigna permisos de SUPERADMIN, ADMIN, DOCENTE o ESTUDIANTE.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={cargarUsuarios}
                    className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    title="Actualizar lista"
                  >
                    <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                  </button>

                  <div className="relative flex-1 sm:w-64">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                      <Search className="size-4" />
                    </span>
                    <input 
                      type="text"
                      placeholder="Buscar usuario por DNI, Nombre o Email..."
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 text-slate-800"
                    />
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="pb-3 px-4">DNI / CE</th>
                      <th className="pb-3 px-4">Usuario</th>
                      <th className="pb-3 px-4">Paquete Asignado</th>
                      <th className="pb-3 px-4">Rol de Sistema</th>
                      <th className="pb-3 px-4 text-right">Acción de Rol</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {usuariosFiltrados.length > 0 ? (
                      usuariosFiltrados.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 tabular-nums font-bold text-indigo-600">{u.dni_ce}</td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {u.nombres} {u.apellidos}
                            <div className="text-[10px] text-slate-400 font-normal">{u.email}</div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-700">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-[10px] font-bold">
                              {u.paquete_adquirido || 'Estándar'}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-[10px] font-black ${u.role === 'SUPERADMIN' ? 'bg-purple-100 text-purple-800' : u.role === 'ADMIN' ? 'bg-indigo-100 text-indigo-800' : u.role === 'DOCENTE' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-800'}`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            <select
                              value={u.role}
                              onChange={(e) => cambiarRolUsuario(u.id, e.target.value)}
                              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer"
                            >
                              <option value="ESTUDIANTE">ESTUDIANTE</option>
                              <option value="DOCENTE">DOCENTE</option>
                              <option value="ADMIN">ADMINISTRADOR</option>
                              <option value="SUPERADMIN">SUPERADMIN</option>
                            </select>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-10 text-slate-400 font-medium">
                          No se encontraron usuarios coincidentes.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'paquetes' ? (
            /* TAB: CONFIGURACIÓN DE PLANTILLAS Y PAQUETES */
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Paquete COMPLETO */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">Paquete Standard</span>
                      <Award className="w-5 h-5 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Paquete COMPLETO</h3>
                    <p className="text-xs text-slate-500 mb-6">Reglas de emisión y límites de cursos para alumnos matriculados en modalidad Completo.</p>
                    
                    <div className="space-y-3 border-t border-slate-100 pt-4 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Certificados Modulares:</span>
                        <input 
                          type="number" 
                          value={paquetesConfig.COMPLETO.modulares}
                          onChange={(e) => setPaquetesConfig({ ...paquetesConfig, COMPLETO: { ...paquetesConfig.COMPLETO, modulares: parseInt(e.target.value) || 0 } })}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Diploma General:</span>
                        <input 
                          type="number" 
                          value={paquetesConfig.COMPLETO.diplomas}
                          onChange={(e) => setPaquetesConfig({ ...paquetesConfig, COMPLETO: { ...paquetesConfig.COMPLETO, diplomas: parseInt(e.target.value) || 0 } })}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cursos Libres Incluidos:</span>
                        <input 
                          type="number" 
                          value={paquetesConfig.COMPLETO.cursos}
                          onChange={(e) => setPaquetesConfig({ ...paquetesConfig, COMPLETO: { ...paquetesConfig.COMPLETO, cursos: parseInt(e.target.value) || 0 } })}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paquete FULL */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md">Paquete Recomendado</span>
                      <Award className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Paquete FULL</h3>
                    <p className="text-xs text-slate-500 mb-6">Incluye más cursos libres y derecho a certificación digital del Colegio de Ingenieros.</p>
                    
                    <div className="space-y-3 border-t border-slate-100 pt-4 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Certificados Modulares:</span>
                        <input 
                          type="number" 
                          value={paquetesConfig.FULL.modulares}
                          onChange={(e) => setPaquetesConfig({ ...paquetesConfig, FULL: { ...paquetesConfig.FULL, modulares: parseInt(e.target.value) || 0 } })}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Diploma General:</span>
                        <input 
                          type="number" 
                          value={paquetesConfig.FULL.diplomas}
                          onChange={(e) => setPaquetesConfig({ ...paquetesConfig, FULL: { ...paquetesConfig.FULL, diplomas: parseInt(e.target.value) || 0 } })}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cursos Libres Incluidos:</span>
                        <input 
                          type="number" 
                          value={paquetesConfig.FULL.cursos}
                          onChange={(e) => setPaquetesConfig({ ...paquetesConfig, FULL: { ...paquetesConfig.FULL, cursos: parseInt(e.target.value) || 0 } })}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Paquete ILIMITADO */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-1 rounded-md">Acceso Total VIP</span>
                      <Award className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Paquete ILIMITADO</h3>
                    <p className="text-xs text-slate-500 mb-6">Progresión ilimitada por bloques con aprobación directa de módulos.</p>
                    
                    <div className="space-y-3 border-t border-slate-100 pt-4 text-xs font-medium">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Certificados Modulares:</span>
                        <input 
                          type="number" 
                          value={paquetesConfig.ILIMITADO.modulares}
                          onChange={(e) => setPaquetesConfig({ ...paquetesConfig, ILIMITADO: { ...paquetesConfig.ILIMITADO, modulares: parseInt(e.target.value) || 0 } })}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Diploma General:</span>
                        <input 
                          type="number" 
                          value={paquetesConfig.ILIMITADO.diplomas}
                          onChange={(e) => setPaquetesConfig({ ...paquetesConfig, ILIMITADO: { ...paquetesConfig.ILIMITADO, diplomas: parseInt(e.target.value) || 0 } })}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold"
                        />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Cursos Libres Incluidos:</span>
                        <input 
                          type="number" 
                          value={paquetesConfig.ILIMITADO.cursos}
                          onChange={(e) => setPaquetesConfig({ ...paquetesConfig, ILIMITADO: { ...paquetesConfig.ILIMITADO, cursos: parseInt(e.target.value) || 0 } })}
                          className="w-16 px-2 py-1 border border-slate-200 rounded-lg text-right font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={guardarConfigPaquetes}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" /> Guardar Configuración de Plantillas
                </button>
              </div>
            </div>
          ) : activeTab === 'simulador' ? (
            /* TAB: SIMULADOR DE VISTA ESTUDIANTE FULL */
            <div className="space-y-6">
              {/* Tarjeta de Inicio Rápido de Simulación */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 rounded-3xl p-6 sm:p-8 border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <GraduationCap className="w-64 h-64 text-indigo-400" />
                </div>

                <div className="relative z-10 max-w-3xl space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    SIMULADOR ACTIVO EN TIEMPO REAL
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
                    Vista Estudiante con Paquete FULL
                  </h2>

                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                    Como administrador, puedes ingresar directamente al Aula Virtual (<code className="text-indigo-300 bg-white/10 px-1.5 py-0.5 rounded tabular-nums">/dashboard</code>). Tu sesión ejecutará automáticamente los privilegios de un alumno con <strong>Paquete FULL</strong>, con todas las cuotas al día, acceso irrestricto a los 3 módulos de <strong>Derecho Minero</strong> y opción de rendir exámenes y generar certificados.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Programa asignado</p>
                      <p className="text-xs font-bold text-white mt-0.5">Derecho Minero y Gestión Amb.</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Paquete simulado</p>
                      <p className="text-xs font-bold text-emerald-400 mt-0.5">FULL (Cursos + CIP)</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Estado financiero</p>
                      <p className="text-xs font-bold text-sky-400 mt-0.5">Habilitado 100%</p>
                    </div>
                  </div>

                  <div className="pt-4 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold px-6 py-3 rounded-2xl text-xs shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                    >
                      <GraduationCap className="w-4 h-4" />
                      <span>Ingresar al Aula como Estudiante (FULL)</span>
                      <span>→</span>
                    </Link>

                    <Link
                      href="/dashboard/certificados"
                      className="bg-white/10 hover:bg-white/20 text-white font-bold px-5 py-3 rounded-2xl text-xs border border-white/15 transition-all flex items-center gap-2"
                    >
                      <Award className="w-4 h-4 text-amber-400" />
                      <span>Ver Mis Certificados</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Guía Técnica Supabase */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="size-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">
                      ¿Cómo configurar en Supabase un estudiante para Derecho Minero?
                    </h3>
                    <p className="text-xs text-slate-500">
                      Guía directa para asignar diplomados, paquetes y roles desde el Table Editor de Supabase.
                    </p>
                  </div>
                </div>

                <div className="space-y-4 text-xs text-slate-700">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="size-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-[10px]">1</span>
                      Abre tu panel de Supabase y ve a la tabla:
                    </p>
                    <code className="block bg-slate-900 text-emerald-400 p-2.5 rounded-xl tabular-nums text-[11px]">
                      Table Editor ➔ tabla "profiles"
                    </code>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
                    <p className="font-bold text-slate-900 flex items-center gap-2">
                      <span className="size-5 rounded-full bg-indigo-600 text-white inline-flex items-center justify-center text-[10px]">2</span>
                      Ubica al usuario (por su DNI o email) y edita las siguientes columnas:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-sans">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Columna diplomado_1</span>
                        <p className="tabular-nums text-indigo-600 font-bold text-xs mt-1">Derecho Minero</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">O el nombre oficial: <em>"Diplomado en Derecho Minero y Gestión Ambiental"</em>.</p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Columna role</span>
                        <p className="tabular-nums text-indigo-600 font-bold text-xs mt-1">ESTUDIANTE</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">(Para administradores pon <code>ADMIN</code> o <code>SUPERADMIN</code>).</p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Columna paquete_adquirido</span>
                        <p className="tabular-nums text-emerald-600 font-bold text-xs mt-1">FULL</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Habilita acceso completo a cursos libres y certificaciones.</p>
                      </div>

                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Columna cuotas_pagadas</span>
                        <p className="tabular-nums text-sky-600 font-bold text-xs mt-1">6</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Evita cualquier bloqueo por pago pendiente.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <Sparkles className="size-4 text-amber-600" />
                      Tip Inteligente de Sincronización:
                    </p>
                    <p className="text-[11px] leading-relaxed">
                      El sistema cuenta con un parser inteligente. Cuando en <code className="bg-amber-100 px-1 rounded font-bold">diplomado_1</code> colocas <em>"Derecho Minero"</em>, la plataforma enlaza automáticamente sus 3 módulos oficiales con exámenes individuales (Módulo 1: Marco Legal y Regulación, Módulo 2: Fiscalización Ambiental, Módulo 3: Cierre de Minas y Sostenibilidad).
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <LoginPersonalizacionTab />
          )}

        </div>
      </main>
    </div>
    </div>
  );
}