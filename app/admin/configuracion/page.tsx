'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, CheckCircle2, AlertCircle, Search, UserCheck, Layers, Award, Save, RefreshCw, Server,
  GraduationCap, Eye, ExternalLink, Database, Sparkles, Check, Plus, Trash2, Info, ArrowRightLeft
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useTabSlug } from '@/lib/hooks/useTabSlug';
import { LoginPersonalizacionTab } from '@/components/admin/configuracion/LoginPersonalizacionTab';
import { PaqueteDefinicion, PAQUETES_DEFAULT } from '@/lib/types/paquetes';
import { PermisosRolesTab } from '@/components/admin/configuracion/PermisosRolesTab';
import { AsignarRolesModal } from '@/components/admin/configuracion/AsignarRolesModal';
import { RolePermisoDefinicion, ROLES_PREDEFINIDOS } from '@/lib/types/roles';


export default function ConfiguracionRolesPage() {
  const [activeTab, setActiveTab] = useTabSlug<'rbac' | 'permisos' | 'paquetes' | 'simulador' | 'login'>('rbac', ['rbac', 'permisos', 'paquetes', 'simulador', 'login'] as const);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  // Configuración de roles y permisos
  const [rolesConfig, setRolesConfig] = useState<Record<string, RolePermisoDefinicion>>(ROLES_PREDEFINIDOS);
  const [guardandoRolId, setGuardandoRolId] = useState<string | null>(null);
  const [usuarioParaAsignar, setUsuarioParaAsignar] = useState<any | null>(null);

  
  // Estado para la configuración de plantillas de paquetes
  const [paquetesConfig, setPaquetesConfig] = useState<Record<string, PaqueteDefinicion>>(PAQUETES_DEFAULT);
  const [guardandoPaquetes, setGuardandoPaquetes] = useState(false);

  // Modal / Formulario para crear un nuevo paquete personalizado
  const [mostrarModalNuevoPaquete, setMostrarModalNuevoPaquete] = useState(false);
  const [nuevoPkgId, setNuevoPkgId] = useState('');
  const [nuevoPkgNombre, setNuevoPkgNombre] = useState('');
  const [nuevoPkgDescripcion, setNuevoPkgDescripcion] = useState('');
  const [nuevoPkgPrecioContado, setNuevoPkgPrecioContado] = useState(0);
  const [nuevoPkgPrecioCuotas, setNuevoPkgPrecioCuotas] = useState(0);
  const [nuevoPkgCuotas, setNuevoPkgCuotas] = useState(1);
  const [nuevoPkgCreditosDip, setNuevoPkgCreditosDip] = useState(1);
  const [nuevoPkgCreditosCur, setNuevoPkgCreditosCur] = useState(3);
  const [nuevoPkgModulares, setNuevoPkgModulares] = useState(3);
  const [nuevoPkgDiplomas, setNuevoPkgDiplomas] = useState(1);
  const [nuevoPkgCertCip, setNuevoPkgCertCip] = useState(false);
  const [nuevoPkgCertInternacional, setNuevoPkgCertInternacional] = useState(false);
  const [nuevoPkgBolsaRegular, setNuevoPkgBolsaRegular] = useState(true);
  const [nuevoPkgBolsaExclusiva, setNuevoPkgBolsaExclusiva] = useState(false);
  const [nuevoPkgDreambuilder, setNuevoPkgDreambuilder] = useState(true);

  // Configuración de bienvenida para el Dashboard de estudiantes
  const [bienvenidaPlantilla, setBienvenidaPlantilla] = useState('¡Hola, {nombre}, bienvenido a tu portal de especialización ejecutiva!');
  const [bienvenidaFondo, setBienvenidaFondo] = useState('https://img.magnific.com/foto-gratis/retrato-ingenieros-horas-trabajo-sitio-trabajo_23-2151589536.jpg?semt=ais_hybrid&w=740&q=80');
  const [guardandoBienvenida, setGuardandoBienvenida] = useState(false);

  const router = useRouter();
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    cargarUsuarios();
    cargarConfigRoles();
    cargarConfigPaquetes();
    cargarConfigBienvenida();
  }, []);

  const cargarConfigBienvenida = async () => {
    try {
      const res = await fetch('/api/admin/configuracion-bienvenida');
      if (res.ok) {
        const data = await res.json();
        if (data.config) {
          if (data.config.mensajePlantilla) setBienvenidaPlantilla(data.config.mensajePlantilla);
          if (data.config.imagenFondo) setBienvenidaFondo(data.config.imagenFondo);
        }
      }
    } catch (e) {
      console.error('Error cargando bienvenida:', e);
    }
  };

  const guardarConfigBienvenida = async () => {
    setGuardandoBienvenida(true);
    try {
      const res = await fetch('/api/admin/configuracion-bienvenida', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mensajePlantilla: bienvenidaPlantilla,
          imagenFondo: bienvenidaFondo
        })
      });
      if (res.ok) {
        setMensajeExito('¡Mensaje de bienvenida y portada del estudiante actualizados con éxito!');
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert('No se pudo guardar la configuración de bienvenida.');
      }
    } catch (e) {
      console.error(e);
      alert('Error al guardar configuración de bienvenida.');
    } finally {
      setGuardandoBienvenida(false);
    }
  };

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

  const cargarConfigPaquetes = async () => {
    try {
      const res = await fetch('/api/admin/configuracion-paquetes');
      if (res.ok) {
        const data = await res.json();
        if (data.paquetes && typeof data.paquetes === 'object') {
          setPaquetesConfig(data.paquetes);
        }
      }
    } catch (e) {
      console.error('Error cargando configuración de paquetes:', e);
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
        setUsuarios(prev => prev.map(u => {
          if (u.id === userId) {
            const activeRoles = ['ESTUDIANTE'];
            if (nuevoRol === 'ADMIN') activeRoles.push('ADMIN');
            else if (nuevoRol === 'SUPERADMIN') activeRoles.push('SUPERADMIN');
            else if (nuevoRol === 'DOCENTE') activeRoles.push('DOCENTE');
            return {
              ...u,
              role: nuevoRol,
              roles: activeRoles,
              esDual: nuevoRol === 'ADMIN' || nuevoRol === 'SUPERADMIN'
            };
          }
          return u;
        }));
        const labelExito = nuevoRol === 'ADMIN' 
          ? 'Estudiante + Administrador (Acceso dual activado)' 
          : nuevoRol === 'ESTUDIANTE' 
          ? 'Estudiante (Acceso a campus únicamente)' 
          : nuevoRol;
        setMensajeExito(`¡Permisos actualizados con éxito: ${labelExito}!`);
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert('No se pudo actualizar el rol en la base de datos.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de comunicación con el servidor.');
    }
  };

  
  const cargarConfigRoles = async () => {
    try {
      const res = await fetch('/api/admin/roles-config');
      if (res.ok) {
        const data = await res.json();
        if (data.roles) setRolesConfig(data.roles);
      }
    } catch (e) {
      console.error('Error cargando roles config:', e);
    }
  };

  const handleGuardarPermisosRol = async (rolId: string, modulos: string[]) => {
    setGuardandoRolId(rolId);
    try {
      const updated = {
        ...rolesConfig,
        [rolId]: {
          ...rolesConfig[rolId],
          modulosPermitidos: modulos
        }
      };
      setRolesConfig(updated);

      const res = await fetch('/api/admin/roles-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roles: updated })
      });

      if (res.ok) {
        setMensajeExito(`¡Permisos de ${rolesConfig[rolId]?.nombre || rolId} guardados exitosamente!`);
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert('No se pudieron guardar los permisos.');
      }
    } catch (e) {
      console.error(e);
      alert('Error de red al guardar permisos.');
    } finally {
      setGuardandoRolId(null);
    }
  };

  const handleCrearNuevoRol = async (nuevoRol: RolePermisoDefinicion) => {
    const updated = {
      ...rolesConfig,
      [nuevoRol.id]: nuevoRol
    };
    setRolesConfig(updated);

    const res = await fetch('/api/admin/roles-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: updated })
    });

    if (res.ok) {
      setMensajeExito(`¡Rol ${nuevoRol.nombre} creado y disponible para asignación!`);
      setTimeout(() => setMensajeExito(null), 4000);
    }
  };

  const handleEliminarRol = async (rolId: string) => {
    if (rolesConfig[rolId]?.esSistema) {
      alert('No se pueden eliminar los roles base del sistema.');
      return;
    }
    if (!confirm(`¿Eliminar el rol "${rolesConfig[rolId]?.nombre || rolId}"?`)) return;

    const copy = { ...rolesConfig };
    delete copy[rolId];
    setRolesConfig(copy);

    await fetch('/api/admin/roles-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roles: copy })
    });

    setMensajeExito('Rol eliminado correctamente.');
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleSuccessAsignarRoles = (userId: string, rolAdmin: string | null, rolAcad: string | null) => {
    setUsuarios(prev => prev.map(u => {
      if (u.id === userId) {
        const rolesActivos: string[] = [];
        if (rolAdmin) {
          rolesActivos.push(rolesConfig[rolAdmin]?.nombre || rolAdmin);
        }
        if (rolAcad) {
          rolesActivos.push(rolAcad === 'DOCENTE' ? 'Docente' : 'Estudiante');
        }
        return {
          ...u,
          rolAdministrativo: rolAdmin,
          rolAcademico: rolAcad,
          rolesActivos,
          esDual: Boolean(rolAdmin && rolAcad)
        };
      }
      return u;
    }));

    setUsuarioParaAsignar(null);
    setMensajeExito('¡Roles de usuario actualizados correctamente!');
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const guardarConfigPaquetes = async () => {
    setGuardandoPaquetes(true);
    try {
      const res = await fetch('/api/admin/configuracion-paquetes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paquetes: paquetesConfig })
      });

      if (res.ok) {
        setMensajeExito('¡Plantillas de paquetes actualizadas y guardadas con éxito!');
        setTimeout(() => setMensajeExito(null), 4000);
      } else {
        alert('No se pudo guardar la configuración de paquetes.');
      }
    } catch (e) {
      console.error('Error guardando paquetes:', e);
      alert('Error de red al guardar paquetes.');
    } finally {
      setGuardandoPaquetes(false);
    }
  };

  const handleCrearNuevoPaquete = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = nuevoPkgId.trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanId) {
      alert('Por favor ingrese un identificador válido para el paquete (Ej: BECA, CORPORATIVO)');
      return;
    }

    const nuevoPaquete: PaqueteDefinicion = {
      id: cleanId,
      nombre: nuevoPkgNombre.trim() || `Paquete ${cleanId}`,
      descripcion: nuevoPkgDescripcion.trim() || 'Paquete personalizado configurado desde administración.',
      precioContado: Number(nuevoPkgPrecioContado) || 0,
      precioCuotas: Number(nuevoPkgPrecioCuotas) || 0,
      cuotasSugeridas: Number(nuevoPkgCuotas) || 1,
      creditosDiplomados: Number(nuevoPkgCreditosDip) || 1,
      creditosCursos: Number(nuevoPkgCreditosCur) || 0,
      modulares: Number(nuevoPkgModulares) || 3,
      diplomas: Number(nuevoPkgDiplomas) || 1,
      certCip: Boolean(nuevoPkgCertCip),
      certInternacional: Boolean(nuevoPkgCertInternacional),
      bolsaTrabajoRegular: Boolean(nuevoPkgBolsaRegular),
      bolsaTrabajoExclusiva: Boolean(nuevoPkgBolsaExclusiva),
      dreambuilder: Boolean(nuevoPkgDreambuilder),
      esPersonalizado: true,
      colorTag: 'emerald'
    };

    const updated = {
      ...paquetesConfig,
      [cleanId]: nuevoPaquete
    };

    setPaquetesConfig(updated);
    setMostrarModalNuevoPaquete(false);
    setNuevoPkgId('');
    setNuevoPkgNombre('');
    setNuevoPkgDescripcion('');
    setNuevoPkgPrecioContado(0);
    setNuevoPkgPrecioCuotas(0);

    // Guardar inmediatamente
    fetch('/api/admin/configuracion-paquetes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paquetes: updated })
    });

    setMensajeExito(`¡Paquete ${cleanId} creado con éxito y disponible para matrículas!`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  const handleEliminarPaquetePersonalizado = (pkgId: string) => {
    if (['COMPLETO', 'FULL', 'ILIMITADO'].includes(pkgId)) {
      alert('Los paquetes base COMPLETO, FULL e ILIMITADO no se pueden eliminar.');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el paquete "${pkgId}"?`)) {
      const copy = { ...paquetesConfig };
      delete copy[pkgId];
      setPaquetesConfig(copy);

      fetch('/api/admin/configuracion-paquetes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paquetes: copy })
      });

      setMensajeExito(`Paquete ${pkgId} eliminado correctamente.`);
      setTimeout(() => setMensajeExito(null), 4000);
    }
  };

  const usuariosFiltrados = usuarios.filter(u => {
    const q = busqueda.toLowerCase().trim();
    if (!q) return true;
    const nom = `${u.nombres || ''} ${u.apellidos || ''}`.toLowerCase();
    const dni = (u.dni_ce || '').toLowerCase();
    const mail = (u.email || '').toLowerCase();
    const rol = [
      u.roles?.administrativo || '',
      u.roles?.academico || '',
      ...(Array.isArray(u.rolesActivos) ? u.rolesActivos : []),
      u.role || '',
    ].join(' ').toLowerCase();
    const pkg = (u.paquete_adquirido || '').toLowerCase();
    const esDual = Boolean(u.esDual || u.roles?.administrativo);
    const matchDual = esDual && (q.includes('dual') || q.includes('admin') || q.includes('estudiante') || q.includes('selector'));
    return nom.includes(q) || dni.includes(q) || mail.includes(q) || rol.includes(q) || pkg.includes(q) || matchDual;
  });

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0 h-full">
        
        <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0">
          <div className="max-w-7xl mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white mt-1 tracking-tight">
                Configuración y Roles (RBAC)
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                Administración de accesos de personal institucional, plantillas de paquetes y banners de acceso.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={cargarUsuarios}
                disabled={cargando}
                className="bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                Actualizar lista ({usuarios.length})
              </button>
            </div>
          </div>

          {/* Notificación de Éxito */}
          {mensajeExito && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-300">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {/* Pestañas de Navegación */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('rbac')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'rbac' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Users className="w-4 h-4" /> Directorio de Usuarios y Roles ({usuarios.length})
            </button>
            
            <button
              onClick={() => setActiveTab('permisos')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'permisos' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <ShieldCheck className="w-4 h-4" /> Permisos y roles del sistema ({Object.keys(rolesConfig).length})
            </button>

            <button
              onClick={() => setActiveTab('paquetes')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'paquetes' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Layers className="w-4 h-4" /> Configuración de paquetes y créditos ({Object.keys(paquetesConfig).length})
            </button>
            <button
              onClick={() => setActiveTab('simulador')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'simulador' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Eye className="w-4 h-4" /> Simulador de Alumno Full
            </button>
            <button
              onClick={() => setActiveTab('login')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 shrink-0 ${activeTab === 'login' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Sparkles className="w-4 h-4" /> Personalización de Login
            </button>
          </div>

          {/* CONTENIDOS DE LAS PESTAÑAS */}

          {activeTab === 'rbac' ? (
            /* TAB: GESTIÓN DE USUARIOS Y ROLES (RBAC) */
            <div className="space-y-4">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, correo, DNI o rol..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                  />
                </div>
                <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total usuarios: <span className="text-slate-900 dark:text-white font-black">{usuariosFiltrados.length}</span>
                  {usuarios.some(u => u.rolAdministrativo && u.rolAcademico) && (
                    <span className="ml-2 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-[10px]">
                      {usuarios.filter(u => u.rolAdministrativo && u.rolAcademico).length} con acceso dual
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-[10px] font-black uppercase tracking-wider text-slate-400">
                        <th className="py-3 px-4">Usuario</th>
                        <th className="py-3 px-4">DNI / CE</th>
                        <th className="py-3 px-4">Correo Institucional</th>
                        <th className="py-3 px-4">Rol Administrativo</th>
                        <th className="py-3 px-4">Rol Académico</th>
                        <th className="py-3 px-4 text-right">Acción</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                      {usuariosFiltrados.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-slate-400">
                            No se encontraron usuarios con el criterio de búsqueda.
                          </td>
                        </tr>
                      ) : (
                        usuariosFiltrados.map((u) => {
                          const rolAdminDef = u.rolAdministrativo ? rolesConfig[u.rolAdministrativo] : null;
                          const nombreAdmin = rolAdminDef?.nombre || u.rolAdministrativo;

                          return (
                            <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                {u.nombres} {u.apellidos}
                              </td>
                              <td className="py-3 px-4 font-mono text-slate-500">
                                {u.dni_ce}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                                {u.email}
                              </td>
                              <td className="py-3 px-4">
                                {u.rolAdministrativo ? (
                                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
                                    u.rolAdministrativo === 'SUPERADMIN'
                                      ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                                      : u.rolAdministrativo === 'FINANCIERO'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                                      : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                                  }`}>
                                    {nombreAdmin}
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium text-xs">Ninguno</span>
                                )}
                              </td>
                              <td className="py-3 px-4">
                                {u.rolAcademico === 'ESTUDIANTE' ? (
                                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
                                    Estudiante
                                  </span>
                                ) : u.rolAcademico === 'DOCENTE' ? (
                                  <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                                    Docente
                                  </span>
                                ) : (
                                  <span className="text-slate-400 font-medium text-xs">Ninguno</span>
                                )}
                              </td>
                              <td className="py-3 px-4 text-right whitespace-nowrap">
                                <button
                                  onClick={() => setUsuarioParaAsignar(u)}
                                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition cursor-pointer inline-flex items-center gap-1.5 shadow-sm whitespace-nowrap"
                                >
                                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                                  <span>Asignar roles</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : activeTab === 'permisos' ? (
            /* TAB: CONFIGURACIÓN DE PERMISOS POR ROL */
            <PermisosRolesTab
              rolesConfig={rolesConfig}
              onGuardarPermisos={handleGuardarPermisosRol}
              onCrearNuevoRol={handleCrearNuevoRol}
              onEliminarRol={handleEliminarRol}
              guardandoRolId={guardandoRolId}
            />
          ) : activeTab === 'paquetes' ? (
            /* TAB: CONFIGURACIÓN DE PAQUETES Y CRÉDITOS */
            <div className="space-y-6">
              
              {/* Barra de cabecera con botón de agregar paquete */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Plantillas maestras de paquetes</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Define las reglas comerciales, precios sugeridos y créditos otorgados. Lo que configures aquí se reflejará en la pantalla de matrícula de nuevo estudiante.
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setMostrarModalNuevoPaquete(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> + Crear paquete personalizado
                  </button>
                  <button
                    onClick={guardarConfigPaquetes}
                    disabled={guardandoPaquetes}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {guardandoPaquetes ? 'Guardando...' : 'Guardar cambios'}
                  </button>
                </div>
              </div>

              {/* Sección de Edición de Mensaje de Bienvenida y Portada */}
              <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-500" /> Mensaje de Bienvenida y Portada del Estudiante
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Personaliza el saludo en el Hero principal del dashboard del alumno. Usa la variable <code className="text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/60 px-1 py-0.5 rounded">{'{nombre}'}</code> para insertar dinámicamente el primer nombre del alumno.
                    </p>
                  </div>
                  <button
                    onClick={guardarConfigBienvenida}
                    disabled={guardandoBienvenida}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" /> {guardandoBienvenida ? 'Guardando...' : 'Guardar portada'}
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mensaje de bienvenida (Hero)
                    </label>
                    <input
                      type="text"
                      value={bienvenidaPlantilla}
                      onChange={(e) => setBienvenidaPlantilla(e.target.value)}
                      placeholder="¡Hola, {nombre}, bienvenid@ a tu ruta de aprendizaje!"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Vista previa: {bienvenidaPlantilla.replace('{nombre}', 'Manuel')}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      URL de Imagen de Fondo de Portada
                    </label>
                    <input
                      type="text"
                      value={bienvenidaFondo}
                      onChange={(e) => setBienvenidaFondo(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Proporciona la URL de la imagen que se mostrará como banner superior.
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid de Paquetes Configurados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.values(paquetesConfig).map((pkg) => {
                  const esBase = ['COMPLETO', 'FULL', 'ILIMITADO'].includes(pkg.id);
                  const colorTag = pkg.colorTag || (pkg.id === 'COMPLETO' ? 'indigo' : pkg.id === 'FULL' ? 'amber' : 'purple');

                  return (
                    <div 
                      key={pkg.id} 
                      className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col justify-between relative group"
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                            colorTag === 'emerald'
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-300'
                              : colorTag === 'amber'
                              ? 'text-amber-700 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-300'
                              : colorTag === 'purple'
                              ? 'text-purple-700 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-300'
                              : 'text-indigo-700 bg-indigo-50 dark:bg-indigo-950/50 dark:text-indigo-300'
                          }`}>
                            {pkg.esPersonalizado ? 'Personalizado' : (pkg.id === 'COMPLETO' ? 'Paquete Estándar' : pkg.id === 'FULL' ? 'Recomendado' : 'Acceso VIP')}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <Award className="w-4 h-4 text-slate-400" />
                            {!esBase && (
                              <button
                                title="Eliminar este paquete"
                                onClick={() => handleEliminarPaquetePersonalizado(pkg.id)}
                                className="text-slate-300 hover:text-rose-600 transition p-1 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>

                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">
                          {pkg.nombre}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                          {pkg.descripcion}
                        </p>

                        {/* Precios y Cuotas sugeridas */}
                        <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl mb-4 border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Precio Contado:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-slate-400">S/</span>
                              <input 
                                type="number" 
                                value={pkg.precioContado}
                                onChange={(e) => setPaquetesConfig({
                                  ...paquetesConfig,
                                  [pkg.id]: { ...pkg, precioContado: Number(e.target.value) || 0 }
                                })}
                                className="w-20 px-2 py-0.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-right font-black text-xs"
                              />
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-500 font-medium">Cuotas Sugeridas:</span>
                            <input 
                              type="number" 
                              value={pkg.cuotasSugeridas}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, cuotasSugeridas: Number(e.target.value) || 1 }
                              })}
                              className="w-16 px-2 py-0.5 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-right font-bold text-xs"
                            />
                          </div>
                        </div>
                        
                        {/* Reglas de Créditos y Certificados */}
                        <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4 text-xs font-medium">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-300 font-bold">Créditos de Diplomados:</span>
                            <input 
                              type="number" 
                              value={pkg.creditosDiplomados}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, creditosDiplomados: Math.max(0, parseInt(e.target.value) || 0) }
                              })}
                              className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-right font-black"
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-600 dark:text-slate-300 font-bold">Créditos de Cursos Libres:</span>
                            <input 
                              type="number" 
                              value={pkg.creditosCursos}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, creditosCursos: Math.max(0, parseInt(e.target.value) || 0) }
                              })}
                              className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-right font-black"
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Certificados Modulares:</span>
                            <input 
                              type="number" 
                              value={pkg.modulares}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, modulares: Math.max(0, parseInt(e.target.value) || 0) }
                              })}
                              className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-right font-semibold"
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Diploma General:</span>
                            <input 
                              type="number" 
                              value={pkg.diplomas}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, diplomas: Math.max(0, parseInt(e.target.value) || 0) }
                              })}
                              className="w-16 px-2 py-1 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 rounded-lg text-right font-semibold"
                            />
                          </div>

                          <div className="flex justify-between items-center pt-2">
                            <span className="text-slate-500">Certificación CIP Incluida:</span>
                            <input 
                              type="checkbox"
                              checked={Boolean(pkg.certCip)}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, certCip: e.target.checked }
                              })}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Certificación Internacional:</span>
                            <input 
                              type="checkbox"
                              checked={Boolean(pkg.certInternacional)}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, certInternacional: e.target.checked }
                              })}
                              className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Bolsa de Trabajo Regular:</span>
                            <input 
                              type="checkbox"
                              checked={pkg.bolsaTrabajoRegular !== false}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, bolsaTrabajoRegular: e.target.checked }
                              })}
                              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Bolsa de Trabajo Exclusiva:</span>
                            <input 
                              type="checkbox"
                              checked={Boolean(pkg.bolsaTrabajoExclusiva)}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, bolsaTrabajoExclusiva: e.target.checked }
                              })}
                              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
                            />
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-slate-500">Portal Dreambuilder:</span>
                            <input 
                              type="checkbox"
                              checked={pkg.dreambuilder !== false}
                              onChange={(e) => setPaquetesConfig({
                                ...paquetesConfig,
                                [pkg.id]: { ...pkg, dreambuilder: e.target.checked }
                              })}
                              className="w-4 h-4 text-violet-600 rounded cursor-pointer"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                        Código interno: <code className="font-mono font-bold text-slate-600 dark:text-slate-300">{pkg.id}</code>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Botón Guardar Inferior */}
              <div className="flex justify-end pt-4">
                <button
                  onClick={guardarConfigPaquetes}
                  disabled={guardandoPaquetes}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4" /> {guardandoPaquetes ? 'Guardando...' : 'Guardar todas las plantillas'}
                </button>
              </div>
            </div>
          ) : activeTab === 'simulador' ? (
            /* TAB: SIMULADOR DE VISTA ESTUDIANTE FULL */
            <div className="space-y-6">
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

                  <div className="pt-2 flex flex-wrap gap-3">
                    <Link
                      href="/dashboard"
                      className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" /> Entrar al Aula como Alumno Simulado
                    </Link>

                    <Link
                      href="/dashboard/examenes"
                      className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2.5 rounded-xl font-bold text-xs transition inline-flex items-center gap-2"
                    >
                      <BookOpen className="w-4 h-4" /> Probar Exámenes
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB: PERSONALIZACIÓN DEL LOGIN */
            <LoginPersonalizacionTab />
          )}

          </div>
        </main>
      </div>

      {/* Modal para Crear Nuevo Paquete Personalizado */}
      {mostrarModalNuevoPaquete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">
              Crear Nuevo Paquete Personalizado
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Configura un paquete para becas especiales, ventas corporativas o convenios empresariales.
            </p>

            <form onSubmit={handleCrearNuevoPaquete} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Código Identificador * (Ej: BECA, CORPORATIVO_CHINALCO)
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: BECA"
                  value={nuevoPkgId}
                  onChange={(e) => setNuevoPkgId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold font-mono uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Nombre descriptivo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Beca de Excelencia 100%"
                  value={nuevoPkgNombre}
                  onChange={(e) => setNuevoPkgNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción breve
                </label>
                <input
                  type="text"
                  placeholder="Ej: Acceso a 1 diplomado y 2 cursos para estudiantes destacados."
                  value={nuevoPkgDescripcion}
                  onChange={(e) => setNuevoPkgDescripcion(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Precio Contado (S/)
                  </label>
                  <input
                    type="number"
                    value={nuevoPkgPrecioContado}
                    onChange={(e) => setNuevoPkgPrecioContado(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Cuotas Sugeridas
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={nuevoPkgCuotas}
                    onChange={(e) => setNuevoPkgCuotas(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Créditos Diplomados
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={nuevoPkgCreditosDip}
                    onChange={(e) => setNuevoPkgCreditosDip(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Créditos Cursos Libres
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={nuevoPkgCreditosCur}
                    onChange={(e) => setNuevoPkgCreditosCur(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              {/* Checkboxes de beneficios */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoPkgCertCip}
                    onChange={(e) => setNuevoPkgCertCip(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Certificación CIP Incluida</span>
                </label>
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoPkgCertInternacional}
                    onChange={(e) => setNuevoPkgCertInternacional(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Certificación Internacional</span>
                </label>
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoPkgBolsaRegular}
                    onChange={(e) => setNuevoPkgBolsaRegular(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Bolsa de Trabajo Regular</span>
                </label>
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoPkgBolsaExclusiva}
                    onChange={(e) => setNuevoPkgBolsaExclusiva(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span>Bolsa de Trabajo Exclusiva</span>
                </label>
                <label className="flex items-center gap-2 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nuevoPkgDreambuilder}
                    onChange={(e) => setNuevoPkgDreambuilder(e.target.checked)}
                    className="rounded text-violet-600"
                  />
                  <span>Portal Dreambuilder</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevoPaquete(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-md cursor-pointer"
                >
                  Guardar y Habilitar Paquete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    
      {/* Modal para asignación de roles a usuario */}
      {usuarioParaAsignar && (
        <AsignarRolesModal
          usuario={usuarioParaAsignar}
          rolesConfig={rolesConfig}
          onClose={() => setUsuarioParaAsignar(null)}
          onSuccess={handleSuccessAsignarRoles}
        />
      )}
    </div>
  );
}
