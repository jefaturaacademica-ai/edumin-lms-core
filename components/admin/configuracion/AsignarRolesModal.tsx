'use client';

import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Check, Shield, GraduationCap, BookOpen, AlertCircle } from 'lucide-react';
import { RolePermisoDefinicion } from '@/lib/types/roles';

interface AsignarRolesModalProps {
  usuario: any;
  rolesConfig: Record<string, RolePermisoDefinicion>;
  onClose: () => void;
  onSuccess: (userId: string, rolAdministrativo: string | null, rolAcademico: string | null) => void;
}

export function AsignarRolesModal({
  usuario,
  rolesConfig,
  onClose,
  onSuccess
}: AsignarRolesModalProps) {
  const [rolAdmin, setRolAdmin] = useState<string>(usuario?.rolAdministrativo || '');
  const [rolAcad, setRolAcad] = useState<string>(usuario?.rolAcademico || '');
  const [guardando, setGuardando] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setRolAdmin(usuario?.rolAdministrativo || '');
    setRolAcad(usuario?.rolAcademico || '');
    setErrorMsg(null);
  }, [usuario]);

  if (!usuario) return null;

  // Filtrar roles administrativos de la configuración
  const rolesAdminList = Object.values(rolesConfig).filter(r => r.tipo === 'ADMINISTRATIVO');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rolAdmin && !rolAcad) {
      setErrorMsg('Debes asignar al menos un rol (administrativo o académico) para este usuario.');
      return;
    }

    setGuardando(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/roles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: usuario.id,
          rolAdministrativo: rolAdmin || null,
          rolAcademico: rolAcad || null
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        onSuccess(usuario.id, rolAdmin || null, rolAcad || null);
      } else {
        setErrorMsg(data.error || 'Error al actualizar los roles en la base de datos.');
      }
    } catch (err: any) {
      setErrorMsg('Error de red al guardar los roles.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Cabecera del Modal */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                Asignación de roles
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {usuario.nombres} {usuario.apellidos} · DNI: <span className="font-mono">{usuario.dni_ce}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Campo 1: Rol Administrativo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Rol administrativo (Máximo 1)
            </label>
            <select
              value={rolAdmin}
              onChange={(e) => setRolAdmin(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Ninguno (Sin acceso al panel administrativo)</option>
              {rolesAdminList.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nombre} ({r.descripcion.length > 50 ? `${r.descripcion.substring(0, 50)}...` : r.descripcion})
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Determina los módulos del sidebar y paneles del dashboard administrativo permitidos.
            </p>
          </div>

          {/* Campo 2: Rol Académico */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Rol académico (Máximo 1)
            </label>
            <select
              value={rolAcad}
              onChange={(e) => setRolAcad(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-semibold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
            >
              <option value="">Ninguno (Usuario institucional sin matrícula estudiantil)</option>
              <option value="ESTUDIANTE">Estudiante (Acceso a campus virtual, cursos y diplomados)</option>
              <option value="DOCENTE">Docente (Módulo docente y calificaciones)</option>
            </select>
            <p className="text-[11px] text-slate-500">
              Define si el usuario puede acceder a la vista de alumno o dictado en el campus.
            </p>
          </div>

          {/* Previsualización en vivo de roles */}
          <div className="p-4 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Vista previa de roles asignados
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {rolAdmin && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {rolesConfig[rolAdmin]?.nombre || rolAdmin}
                </span>
              )}
              {rolAcad === 'ESTUDIANTE' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <GraduationCap className="w-3.5 h-3.5" />
                  Estudiante
                </span>
              )}
              {rolAcad === 'DOCENTE' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-black bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <BookOpen className="w-3.5 h-3.5" />
                  Docente
                </span>
              )}
              {!rolAdmin && !rolAcad && (
                <span className="text-xs text-rose-500 font-bold">
                  Sin roles seleccionados
                </span>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed pt-1 border-t border-slate-100 dark:border-slate-900">
              {rolAdmin && rolAcad ? (
                <>Al poseer <strong>rol administrativo</strong> y <strong>rol académico</strong>, el usuario tendrá acceso dual y en el login podrá elegir a qué perfil ingresar.</>
              ) : rolAdmin ? (
                <>Usuario puramente administrativo. Ingresará directamente al panel de administración institucional.</>
              ) : rolAcad ? (
                <>Usuario con acceso exclusivo al campus virtual. En ningún caso podrá entrar al panel de administración.</>
              ) : (
                <>Selecciona al menos un rol para este usuario.</>
              )}
            </p>
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={guardando}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md shadow-indigo-600/20"
            >
              <Check className="w-4 h-4" />
              <span>{guardando ? 'Guardando...' : 'Guardar asignación'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
