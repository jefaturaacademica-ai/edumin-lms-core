'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, User, Mail, Phone, MapPin, FileText, KeyRound, 
  Camera, Check, X, Trash2, ArrowUpRight, Lock, CheckCircle2,
  Calendar, ShieldAlert, Sparkles, GraduationCap
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useTheme } from '@/context/theme-context';
import { useProfile } from '@/context/profile-context';

export default function AdminPerfilPage() {
  const { esOscuro } = useTheme();
  const { 
    nombres, apellidos, iniciales, fotoPerfil, role, dni,
    actualizarDatosUsuario, actualizarFotoPerfil
  } = useProfile();

  const [perfil, setPerfil] = useState<any>(null);
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Formulario de edición de contacto
  const [celular, setCelular] = useState('');
  const [residencia, setResidencia] = useState('');

  // Manejo de foto
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [fileFotoTemporal, setFileFotoTemporal] = useState<File | null>(null);
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);

  // Modal cambiar contraseña
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [passwordActual, setPasswordActual] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [passwordExito, setPasswordExito] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function cargarPerfil() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (data) {
            setPerfil(data);
            setEmail(data.email || user.email || '');
            setCelular(data.celular || '');
            setResidencia(data.residencia || '');
          }
        }
      } catch (err) {
        console.error('Error al cargar perfil admin:', err);
      } finally {
        setCargando(false);
      }
    }

    cargarPerfil();
  }, [supabase]);

  // Manejo de carga de foto con Center Crop 320x320
  const handleCambiarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorFoto(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'];
    if (!tiposPermitidos.includes(file.type.toLowerCase())) {
      setErrorFoto('Formato no permitido. Selecciona una imagen JPG, WEBP o PNG.');
      e.target.value = '';
      return;
    }

    if (file.size > 8 * 1024 * 1024) {
      setErrorFoto('La imagen supera el límite de 8 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        const TARGET_SIZE = 320;
        const minDim = Math.min(img.width, img.height);
        const sx = (img.width - minDim) / 2;
        const sy = (img.height - minDim) / 2;

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
        ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);

        canvas.toBlob((blob) => {
          if (!blob) return;
          const previewUrl = URL.createObjectURL(blob);
          const croppedFile = new File([blob], `avatar-${Date.now()}.jpg`, { type: 'image/jpeg' });
          setFotoTemporal(previewUrl);
          setFileFotoTemporal(croppedFile);
        }, 'image/jpeg', 0.92);
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const cancelarFotoTemporal = () => {
    if (fotoTemporal) URL.revokeObjectURL(fotoTemporal);
    setFotoTemporal(null);
    setFileFotoTemporal(null);
    setErrorFoto(null);
  };

  const guardarNuevaFoto = async () => {
    if (!fileFotoTemporal) return;
    setGuardandoFoto(true);
    setErrorFoto(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró sesión activa.');

      const fileExt = 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, fileFotoTemporal, { upsert: true });

      if (uploadError) {
        // Fallback a perfiles si avatars no existe
        const { error: fallbackError } = await supabase.storage
          .from('perfiles')
          .upload(filePath, fileFotoTemporal, { upsert: true });

        if (fallbackError) throw uploadError;
      }

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const urlFinal = urlData?.publicUrl || '';

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          foto_perfil: urlFinal,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      actualizarFotoPerfil(urlFinal);
      setFotoTemporal(null);
      setFileFotoTemporal(null);
      setMensajeExito('Foto de perfil actualizada correctamente.');
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setErrorFoto(err.message || 'Error al guardar la foto.');
    } finally {
      setGuardandoFoto(false);
    }
  };

  const handleQuitarFoto = async () => {
    if (!confirm('¿Deseas eliminar tu foto de perfil institucional?')) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('profiles')
        .update({
          foto_perfil: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      actualizarFotoPerfil('');
      setMensajeExito('Foto eliminada correctamente.');
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGuardarContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoDatos(true);
    setMensajeExito(null);
    setMensajeError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesión no encontrada.');

      const { error } = await supabase
        .from('profiles')
        .update({
          celular: celular.trim(),
          residencia: residencia.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setMensajeExito('Datos de contacto actualizados correctamente.');
      setTimeout(() => setMensajeExito(null), 4000);
    } catch (err: any) {
      setMensajeError(err.message || 'Error al guardar los datos.');
    } finally {
      setGuardandoDatos(false);
    }
  };

  const handleCambiarPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (nuevaPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setPasswordError('Las contraseñas no coinciden.');
      return;
    }

    setGuardandoPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: nuevaPassword
      });

      if (error) throw error;

      setPasswordExito(true);
      setTimeout(() => {
        setModalPasswordAbierto(false);
        setPasswordExito(false);
        setPasswordActual('');
        setNuevaPassword('');
        setConfirmarPassword('');
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Error al actualizar la contraseña.');
    } finally {
      setGuardandoPassword(false);
    }
  };

  const rolLabel = role === 'SUPERADMIN' 
    ? 'Superadministrador' 
    : (role === 'ADMIN' ? 'Administrador' : (role === 'FINANCIERO' ? 'Financiero' : 'Personal institucional'));

  return (
    <div className="min-h-screen md:h-screen md:overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans relative transition-colors">
      <AdminSidebar />

      <main className="flex-1 p-4 sm:p-8 overflow-y-auto z-10 min-w-0">
        <div className="max-w-5xl mx-auto space-y-6">

          {/* Notificaciones Flash */}
          {mensajeExito && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="size-4 shrink-0" />
              <span>{mensajeExito}</span>
            </div>
          )}

          {mensajeError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <ShieldAlert className="size-4 shrink-0" />
              <span>{mensajeError}</span>
            </div>
          )}

          {/* Tarjeta Hero / Perfil de Administrador */}
          <div className="rounded-3xl p-6 sm:p-8 relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 text-white shadow-xl">
            <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
              
              {/* Avatar con botón de subida */}
              <div className="relative group shrink-0">
                <div className="size-24 sm:size-28 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 text-white font-black flex items-center justify-center text-3xl shadow-xl ring-4 ring-indigo-400/30 overflow-hidden">
                  {fotoTemporal ? (
                    <img src={fotoTemporal} alt="Vista previa" className="w-full h-full object-cover" />
                  ) : fotoPerfil ? (
                    <img src={fotoPerfil} alt="Foto de perfil" className="w-full h-full object-cover" />
                  ) : (
                    iniciales
                  )}
                </div>

                <label 
                  htmlFor="input-foto-admin" 
                  className="absolute bottom-0 right-0 p-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg cursor-pointer transition-all transform group-hover:scale-105"
                  title="Cambiar foto de perfil"
                >
                  <Camera className="size-4" />
                  <input 
                    type="file" 
                    id="input-foto-admin" 
                    accept="image/png, image/jpeg, image/jpg, image/webp" 
                    onChange={handleCambiarFoto} 
                    className="hidden" 
                  />
                </label>
              </div>

              {/* Información y Acciones Principales */}
              <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
                
                {/* Badges de Rol */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    <ShieldCheck className="size-3.5" />
                    <span>{rolLabel}</span>
                  </span>

                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-slate-300 border border-white/10">
                    <span>Cuenta de administración</span>
                  </span>
                </div>

                {/* Nombre Completo */}
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight truncate">
                  {nombres} {apellidos}
                </h1>
                <p className="text-xs text-slate-400 truncate">
                  {email || 'administrador@edumin.edu.pe'}
                </p>

                {/* Botones de Acción */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
                  <button
                    onClick={() => setModalPasswordAbierto(true)}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="size-4 text-amber-400" />
                    <span>Cambiar contraseña</span>
                  </button>

                  {/* Acciones al seleccionar foto temporal */}
                  {fotoTemporal ? (
                    <>
                      <button
                        onClick={guardarNuevaFoto}
                        disabled={guardandoFoto}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="size-4" />
                        <span>{guardandoFoto ? 'Guardando...' : 'Guardar foto'}</span>
                      </button>
                      <button
                        onClick={cancelarFotoTemporal}
                        disabled={guardandoFoto}
                        className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-300 font-semibold text-xs transition-all border border-slate-700 cursor-pointer"
                      >
                        <span>Cancelar</span>
                      </button>
                    </>
                  ) : (
                    fotoPerfil && (
                      <button
                        onClick={handleQuitarFoto}
                        className="px-3.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-semibold inline-flex items-center gap-1.5 transition-colors border border-rose-500/20 cursor-pointer"
                      >
                        <Trash2 className="size-3.5" />
                        <span>Quitar foto</span>
                      </button>
                    )
                  )}

                  {/* Enlace opcional al campus estudiantil si tiene acceso dual */}
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-semibold text-xs transition-all inline-flex items-center gap-2"
                    title="Ir a mi campus de estudiante"
                  >
                    <GraduationCap className="size-4 text-emerald-400" />
                    <span>Ver como estudiante</span>
                    <ArrowUpRight className="size-3 text-slate-400" />
                  </Link>
                </div>

                {errorFoto && (
                  <p className="text-xs text-rose-400 font-medium mt-1">
                    {errorFoto}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* Grid de Secciones: Datos Oficiales y Permisos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Columna 1 y 2: Datos Personales y de Contacto */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Datos Institucionales Oficiales */}
              <div className={`p-6 sm:p-7 rounded-3xl border transition-colors ${
                esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <div className="flex items-center gap-2.5 mb-5 border-b pb-4 border-slate-200 dark:border-slate-800">
                  <User className="size-5 text-indigo-500" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Datos institucionales
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Identificación registrada del administrador en el sistema.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Nombres
                    </label>
                    <input 
                      type="text" 
                      readOnly 
                      value={nombres} 
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-not-allowed focus:outline-none ${
                        esOscuro ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Apellidos
                    </label>
                    <input 
                      type="text" 
                      readOnly 
                      value={apellidos} 
                      className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-semibold cursor-not-allowed focus:outline-none ${
                        esOscuro ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Documento de identidad (DNI / CE)
                    </label>
                    <div className="relative">
                      <FileText className="size-4 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        readOnly 
                        value={dni || perfil?.dni_ce || 'No registrado'} 
                        className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold cursor-not-allowed focus:outline-none ${
                          esOscuro ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
                      Correo institucional
                    </label>
                    <div className="relative">
                      <Mail className="size-4 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="text" 
                        readOnly 
                        value={email || perfil?.email || ''} 
                        className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold cursor-not-allowed focus:outline-none ${
                          esOscuro ? 'bg-slate-950/70 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Formulario de Datos de Contacto Editables */}
              <form 
                onSubmit={handleGuardarContacto}
                className={`p-6 sm:p-7 rounded-3xl border transition-colors ${
                  esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-5 border-b pb-4 border-slate-200 dark:border-slate-800">
                  <Phone className="size-5 text-emerald-500" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      Datos de contacto
                    </h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mantén actualizados tu número celular y tu ubicación de residencia.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Número celular
                    </label>
                    <div className="relative">
                      <Phone className="size-4 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="tel"
                        value={celular}
                        onChange={(e) => setCelular(e.target.value)}
                        placeholder="Ej. 987654321"
                        className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Lugar de residencia (ciudad / país)
                    </label>
                    <div className="relative">
                      <MapPin className="size-4 text-slate-400 absolute left-3 top-3" />
                      <input 
                        type="text"
                        value={residencia}
                        onChange={(e) => setResidencia(e.target.value)}
                        placeholder="Ej. Lima, Perú"
                        className={`w-full border rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                          esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={guardandoDatos}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <Check className="size-4" />
                    <span>{guardandoDatos ? 'Guardando...' : 'Actualizar contacto'}</span>
                  </button>
                </div>
              </form>

            </div>

            {/* Columna 3: Tarjeta de Privilegios y Seguridad */}
            <div className="space-y-6">
              
              <div className={`p-6 rounded-3xl border transition-colors ${
                esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <div className="flex items-center gap-2.5 mb-4">
                  <ShieldCheck className="size-5 text-indigo-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Permisos de tu rol
                  </h3>
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Tu usuario cuenta con el rol institucional de <strong className="text-indigo-400">{rolLabel}</strong>. Tus accesos en la plataforma son:
                </p>

                <div className="space-y-2.5">
                  {role === 'SUPERADMIN' ? (
                    <>
                      <div className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Acceso total a todos los módulos y funciones.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Gestión de roles y permisos institucionales (RBAC).</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Auditoría de eventos y webhooks en tiempo real.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Gestión académica completa, exámenes y catálogo.</span>
                      </div>
                    </>
                  ) : role === 'ADMIN' ? (
                    <>
                      <div className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Gestión académica (catálogo, evaluaciones y estudiantes).</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Dashboard financiero y retención estudiantil.</span>
                      </div>
                      <div className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>Descarga y generación de reportes ejecutivos CSV.</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>Acceso al módulo de finanzas y retención de alumnos.</span>
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-4 border-t border-slate-800">
                  <Link
                    href="/admin/configuracion?tab=permisos"
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <span>Consultar matriz de permisos</span>
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>

              {/* Tarjeta de Seguridad */}
              <div className={`p-6 rounded-3xl border transition-colors ${
                esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm'
              }`}>
                <div className="flex items-center gap-2.5 mb-3">
                  <Lock className="size-5 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Seguridad de la cuenta
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
                  Para mantener protegidos los datos institucionales, recomendamos renovar periódicamente tu contraseña.
                </p>
                <button
                  type="button"
                  onClick={() => setModalPasswordAbierto(true)}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <KeyRound className="size-4 text-amber-400" />
                  <span>Modificar contraseña</span>
                </button>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* Modal Cambiar Contraseña */}
      {modalPasswordAbierto && (
        <div 
          onClick={(e) => { 
            if (e.target === e.currentTarget) { 
              setModalPasswordAbierto(false); 
              setPasswordExito(false); 
              setPasswordError(''); 
            } 
          }} 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className={`rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl relative border ${
              esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <button 
              onClick={() => {
                setModalPasswordAbierto(false);
                setPasswordExito(false);
                setPasswordError('');
              }}
              className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="size-5" />
            </button>

            {passwordExito ? (
              <div className="text-center py-6">
                <div className="mx-auto size-14 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-3 border border-emerald-500/20">
                  <Check className="size-7" />
                </div>
                <h3 className="text-lg font-bold text-white">Contraseña actualizada</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Tu nueva contraseña ha sido guardada con éxito.
                </p>
              </div>
            ) : (
              <>
                <div className="mb-5 border-b pb-3 pr-8 border-slate-800">
                  <h3 className="text-lg font-bold text-white">Cambiar contraseña</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Ingresa y confirma tu nueva contraseña de acceso administrativo.
                  </p>
                </div>

                {passwordError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
                    {passwordError}
                  </div>
                )}

                <form onSubmit={handleCambiarPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Nueva contraseña
                    </label>
                    <input 
                      type="password"
                      required
                      minLength={6}
                      value={nuevaPassword}
                      onChange={(e) => setNuevaPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirmar nueva contraseña
                    </label>
                    <input 
                      type="password"
                      required
                      minLength={6}
                      value={confirmarPassword}
                      onChange={(e) => setConfirmarPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full border rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 bg-slate-950 border-slate-800 text-white"
                    />
                  </div>

                  <div className="pt-2 flex gap-3">
                    <button 
                      type="submit"
                      disabled={guardandoPassword}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 rounded-xl font-bold transition-all shadow-md text-xs cursor-pointer"
                    >
                      {guardandoPassword ? 'Guardando...' : 'Guardar contraseña'}
                    </button>
                    <button 
                      type="button"
                      onClick={() => setModalPasswordAbierto(false)}
                      className="py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
