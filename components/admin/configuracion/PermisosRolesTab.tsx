'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, Shield, Plus, Trash2, Save, Check, CheckSquare, 
  Square, BookOpen, GraduationCap, AlertCircle, Layers, Sparkles, X, Sliders, CheckCircle2 
} from 'lucide-react';
import { 
  RolePermisoDefinicion, 
  SidebarCategoriaModulo, 
  SIDEBAR_MODULOS_EDUMIN 
} from '@/lib/types/roles';

interface PermisosRolesTabProps {
  rolesConfig: Record<string, RolePermisoDefinicion>;
  onGuardarPermisos: (rolId: string, modulos: string[]) => Promise<void>;
  onCrearNuevoRol: (nuevoRol: RolePermisoDefinicion) => Promise<void>;
  onEliminarRol: (rolId: string) => Promise<void>;
  guardandoRolId: string | null;
}

export function PermisosRolesTab({
  rolesConfig,
  onGuardarPermisos,
  onCrearNuevoRol,
  onEliminarRol,
  guardandoRolId
}: PermisosRolesTabProps) {
  // Modal de edición de permisos para un rol específico
  const [rolParaEditar, setRolParaEditar] = useState<RolePermisoDefinicion | null>(null);
  const [modulosEditando, setModulosEditando] = useState<string[]>([]);

  // Modal para crear nuevo rol personalizado
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoId, setNuevoId] = useState('');
  const [nuevoDescripcion, setNuevoDescripcion] = useState('');
  const [nuevoColor, setNuevoColor] = useState('indigo');
  const [nuevoModulos, setNuevoModulos] = useState<string[]>([]);
  const [creando, setCreando] = useState(false);

  // Filtrar roles
  const rolesAdmin = Object.values(rolesConfig).filter(r => r.tipo === 'ADMINISTRATIVO');
  const rolesAcademicos = Object.values(rolesConfig).filter(r => r.tipo === 'ACADEMICO');

  // Total de módulos registrados en el sistema
  const totalModulosSistema = SIDEBAR_MODULOS_EDUMIN.reduce((acc, cat) => acc + cat.items.length, 0);

  // Abrir modal de edición para un rol
  const handleAbrirEditarRol = (rol: RolePermisoDefinicion) => {
    setRolParaEditar(rol);
    setModulosEditando([...(rol.modulosPermitidos || [])]);
  };

  // Alternar un módulo individual en el modal de edición
  const toggleModuloEnEdicion = (href: string) => {
    setModulosEditando(prev => 
      prev.includes(href) ? prev.filter(h => h !== href) : [...prev, href]
    );
  };

  // Alternar un bloque completo en el modal de edición
  const toggleBloqueEnEdicion = (categoria: SidebarCategoriaModulo) => {
    const hrefsBloque = categoria.items.map(i => i.href);
    const todosSeleccionados = hrefsBloque.every(h => modulosEditando.includes(h));

    if (todosSeleccionados) {
      setModulosEditando(prev => prev.filter(h => !hrefsBloque.includes(h)));
    } else {
      setModulosEditando(prev => Array.from(new Set([...prev, ...hrefsBloque])));
    }
  };

  // Guardar cambios del modal de edición
  const handleGuardarModalEdicion = async () => {
    if (!rolParaEditar) return;
    await onGuardarPermisos(rolParaEditar.id, modulosEditando);
    setRolParaEditar(null);
  };

  // Crear nuevo rol personalizado
  const handleCrearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = (nuevoId || nuevoNombre).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    if (!cleanId || !nuevoNombre.trim()) {
      alert('Por favor complete el nombre y código del rol.');
      return;
    }

    setCreando(true);
    try {
      const nuevo: RolePermisoDefinicion = {
        id: cleanId,
        nombre: nuevoNombre.trim(),
        tipo: 'ADMINISTRATIVO',
        descripcion: nuevoDescripcion.trim() || 'Rol administrativo personalizado.',
        esSistema: false,
        color: nuevoColor,
        modulosPermitidos: nuevoModulos
      };

      await onCrearNuevoRol(nuevo);
      setMostrarModalNuevo(false);
      setNuevoNombre('');
      setNuevoId('');
      setNuevoDescripcion('');
      setNuevoModulos([]);
    } finally {
      setCreando(false);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Cabecera de la Pestaña */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-600" />
            Permisos y configuración de roles
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Cada rol posee permisos específicos sobre los módulos del panel de administración. Haz clic en "Editar permisos" para personalizar sus accesos.
          </p>
        </div>
        <button
          onClick={() => setMostrarModalNuevo(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> + Crear rol administrativo personalizado
        </button>
      </div>

      {/* SECCIÓN 1: ROLES ADMINISTRATIVOS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Roles administrativos ({rolesAdmin.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Tienen acceso a módulos del panel de administración
          </span>
        </div>

        {/* Grid de Tarjetas Limpias por Rol */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rolesAdmin.map((rol) => {
            const modulosPermitidos = rol.modulosPermitidos || [];
            const cantModulos = modulosPermitidos.length;
            const esAccesoTotal = cantModulos === totalModulosSistema;

            // Bloques a los que tiene al menos un módulo habilitado
            const bloquesActivos = SIDEBAR_MODULOS_EDUMIN.filter(cat => 
              cat.items.some(i => modulosPermitidos.includes(i.href))
            );

            return (
              <div 
                key={rol.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition"
              >
                <div className="space-y-3">
                  
                  {/* Encabezado de la Tarjeta */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                        rol.color === 'purple' 
                          ? 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
                          : rol.color === 'emerald'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                          : 'bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800'
                      }`}>
                        {rol.nombre}
                      </span>
                      {rol.esSistema ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                          Sistema
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          Personalizado
                        </span>
                      )}
                    </div>

                    {!rol.esSistema && (
                      <button
                        onClick={() => onEliminarRol(rol.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                        title="Eliminar este rol personalizado"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Descripción */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                    {rol.descripcion}
                  </p>

                  {/* Resumen de Módulos y Bloques */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium text-[11px]">
                        Cobertura en panel:
                      </span>
                      <span className={`font-bold tabular-nums text-[11px] ${
                        esAccesoTotal 
                          ? 'text-purple-600 dark:text-purple-400' 
                          : cantModulos > 0 
                          ? 'text-indigo-600 dark:text-indigo-400' 
                          : 'text-slate-400'
                      }`}>
                        {cantModulos} de {totalModulosSistema} módulos {esAccesoTotal && '(Total)'}
                      </span>
                    </div>

                    {/* Bloques Activos */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {bloquesActivos.length > 0 ? (
                        bloquesActivos.map(b => (
                          <span 
                            key={b.idBloque}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300"
                          >
                            {b.categoria}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">
                          Sin módulos asignados
                        </span>
                      )}
                    </div>
                  </div>

                </div>

                {/* Botón para Abrir Modal de Edición de Permisos */}
                <button
                  onClick={() => handleAbrirEditarRol(rol)}
                  className="w-full mt-4 py-2 px-3 bg-slate-50 hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-indigo-950/40 text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Editar permisos</span>
                </button>

              </div>
            );
          })}
        </div>
      </div>

      {/* SECCIÓN 2: ROLES ACADÉMICOS */}
      <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Roles académicos ({rolesAcademicos.length})
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Tienen acceso exclusivo al campus virtual de estudiantes o módulo docente
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Tarjeta Estudiante */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4" />
                Estudiante
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                Rol del sistema
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Acceso al campus virtual (<code className="font-mono text-[11px] text-indigo-600">/dashboard</code>), diplomados inscritos, cursos libres asignados, cronograma de cuotas y evaluaciones académicas.
            </p>
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-[11px] text-emerald-800 dark:text-emerald-300 font-semibold flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Protección estricta: en ningún caso tiene acceso a módulos del panel de administración.</span>
            </div>
          </div>

          {/* Tarjeta Docente */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" />
                Docente
              </span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500">
                Próximamente
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Acceso académico para dictado de sesiones en vivo, registro de calificaciones por módulo y toma de asistencia de alumnos.
            </p>
            <div className="p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl text-[11px] text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Módulo docente actualmente en diseño; se configurará en la siguiente fase.</span>
            </div>
          </div>

        </div>
      </div>

      {/* MODAL PARA EDITAR PERMISOS DE UN ROL */}
      {rolParaEditar && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            {/* Cabecera del Modal de Edición */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                  <Sliders className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    Editar permisos: {rolParaEditar.nombre}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Selecciona los bloques y módulos del sidebar a los que este rol tendrá acceso.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRolParaEditar(null)}
                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido con Checkboxes de Bloques y Módulos */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                <span>
                  Módulos seleccionados: <strong className="text-slate-900 dark:text-white">{modulosEditando.length}</strong> de {totalModulosSistema}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const allHrefs = SIDEBAR_MODULOS_EDUMIN.flatMap(c => c.items.map(i => i.href));
                      setModulosEditando(allHrefs);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                  >
                    Seleccionar todos
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() => setModulosEditando([])}
                    className="text-slate-400 hover:text-slate-600 hover:underline cursor-pointer"
                  >
                    Deseleccionar todos
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {SIDEBAR_MODULOS_EDUMIN.map((cat) => {
                  const hrefsCat = cat.items.map(i => i.href);
                  const seleccionadosCat = hrefsCat.filter(h => modulosEditando.includes(h));
                  const todosSeleccionados = seleccionadosCat.length === hrefsCat.length && hrefsCat.length > 0;
                  const algunoSeleccionado = seleccionadosCat.length > 0 && !todosSeleccionados;

                  return (
                    <div 
                      key={cat.idBloque} 
                      className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      {/* Checkbox de Bloque Completo */}
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200/60 dark:border-slate-800">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={todosSeleccionados}
                            ref={(el) => {
                              if (el) el.indeterminate = algunoSeleccionado;
                            }}
                            onChange={() => toggleBloqueEnEdicion(cat)}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs font-black text-slate-900 dark:text-white">
                            Bloque: {cat.categoria}
                          </span>
                        </label>
                        <span className="text-[10px] tabular-nums font-bold text-slate-400">
                          {seleccionadosCat.length}/{hrefsCat.length} módulos
                        </span>
                      </div>

                      {/* Módulos individuales del bloque */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                        {cat.items.map((item) => {
                          const isChecked = modulosEditando.includes(item.href);

                          return (
                            <label 
                              key={item.href}
                              className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-medium transition cursor-pointer select-none ${
                                isChecked 
                                  ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-900 dark:text-indigo-200 border border-indigo-200/60 dark:border-indigo-800' 
                                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-transparent'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleModuloEnEdicion(item.href)}
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <div className="truncate">
                                <span className="block truncate font-bold text-[11px]">{item.label}</span>
                                <span className="block font-mono text-[9px] text-slate-400 truncate">{item.href}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Footer con Botones */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setRolParaEditar(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGuardarModalEdicion}
                disabled={guardandoRolId === rolParaEditar.id}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
              >
                <Save className="w-4 h-4" />
                <span>{guardandoRolId === rolParaEditar.id ? 'Guardando...' : 'Guardar permisos'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL PARA CREAR ROL ADMINISTRATIVO PERSONALIZADO */}
      {mostrarModalNuevo && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Crear rol administrativo personalizado
                </h3>
              </div>
              <button
                onClick={() => setMostrarModalNuevo(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre del rol *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Coordinador Académico"
                    value={nuevoNombre}
                    onChange={(e) => {
                      setNuevoNombre(e.target.value);
                      if (!nuevoId) {
                        setNuevoId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'));
                      }
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Identificador (Código) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="COORDINADOR"
                    value={nuevoId}
                    onChange={(e) => setNuevoId(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '_'))}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Descripción del rol
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalla las responsabilidades o alcance de este rol..."
                  value={nuevoDescripcion}
                  onChange={(e) => setNuevoDescripcion(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs"
                />
              </div>

              {/* Selección de Módulos iniciales */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Módulos iniciales permitidos:
                </span>

                <div className="space-y-3 max-h-60 overflow-y-auto p-1">
                  {SIDEBAR_MODULOS_EDUMIN.map((cat) => {
                    const hrefsCat = cat.items.map(i => i.href);
                    const todos = hrefsCat.every(h => nuevoModulos.includes(h));

                    return (
                      <div key={cat.idBloque} className="p-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={todos}
                            onChange={() => {
                              if (todos) {
                                setNuevoModulos(prev => prev.filter(h => !hrefsCat.includes(h)));
                              } else {
                                setNuevoModulos(prev => Array.from(new Set([...prev, ...hrefsCat])));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                          />
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            Bloque: {cat.categoria}
                          </span>
                        </label>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-6">
                          {cat.items.map((item) => (
                            <label key={item.href} className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={nuevoModulos.includes(item.href)}
                                onChange={() => {
                                  setNuevoModulos(prev => 
                                    prev.includes(item.href) 
                                      ? prev.filter(h => h !== item.href) 
                                      : [...prev, item.href]
                                  );
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                              <span className="truncate">{item.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setMostrarModalNuevo(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creando}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {creando ? 'Creando rol...' : 'Crear rol y habilitar'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
