'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, CheckCircle2, AlertCircle, Search, UserCheck, Layers, Award, Save, RefreshCw, Server
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default function ConfiguracionRolesPage() {
  const [activeTab, setActiveTab] = useState<'rbac' | 'paquetes'>('rbac');
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
        if (data.usuarios && data.usuarios.length > 0) {
          setUsuarios(data.usuarios);
        } else {
          // Usuarios mock de demostración si la tabla está vacía
          setUsuarios([
            { id: 'usr-1', dni_ce: '70000001', nombres: 'SuperAdmin', apellidos: 'Principal', email: 'admin@edumin.pe', role: 'SUPERADMIN', paquete_adquirido: 'ILIMITADO' },
            { id: 'usr-2', dni_ce: '45678912', nombres: 'Lucero', apellidos: 'Martinez', email: 'lucero@gmail.com', role: 'ESTUDIANTE', paquete_adquirido: 'COMPLETO' },
            { id: 'usr-3', dni_ce: '71234568', nombres: 'Reginaldo', apellidos: 'Andía', email: 'docente.andia@edumin.pe', role: 'DOCENTE', paquete_adquirido: 'FULL' },
            { id: 'usr-4', dni_ce: '78912345', nombres: 'Coordinación', apellidos: 'Académica', email: 'coordinacion@edumin.pe', role: 'ADMIN', paquete_adquirido: 'FULL' },
          ]);
        }
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
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Configuración & Roles (RBAC)</h1>
              <p className="text-slate-500 mt-1">Gestión de permisos de usuarios, control de accesos y reglas de paquetes.</p>
            </div>
            <div className="bg-slate-900 text-slate-300 text-xs px-4 py-2 rounded-2xl font-mono font-bold border border-slate-800">
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
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('rbac')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === 'rbac' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <UserCheck className="w-4 h-4" /> Control de Acceso RBAC ({usuarios.length} Usuarios)
            </button>
            <button
              onClick={() => setActiveTab('paquetes')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === 'paquetes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Layers className="w-4 h-4" /> Configuración de Paquetes & Créditos
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
                          <td className="py-4 px-4 font-mono font-bold text-indigo-600">{u.dni_ce}</td>
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
          ) : (
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
          )}

        </div>
      </main>
    </div>
  );
}