'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, User, Mail, Phone, MapPin, Globe, FileText, KeyRound, 
  Camera, Check, X, Trash2, ArrowUpRight, Lock, CheckCircle2,
  Calendar, ShieldAlert, Sparkles, GraduationCap, Edit3
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import AdminSidebar from '@/components/admin/admin-sidebar';
import { useTheme } from '@/context/theme-context';
import { useProfile } from '@/context/profile-context';
import { 
  LISTA_PAISES, 
  DEPARTAMENTOS_PERU, 
  parsearCelular, 
  formatearCelularGuardar, 
  parsearResidencia, 
  formatearResidenciaGuardar, 
  formatearFechaSlash,
  formatearFechaInput,
  formatearCelularVisual 
} from '@/lib/utils/paisesYRegiones';

function formatoTipoDocumento(tipo?: string) {
  if (!tipo) return 'DNI';
  const t = tipo.toLowerCase();
  if (t.includes('extranjer') || t === 'ce') return 'Carné de extranjería';
  if (t.includes('pasaporte')) return 'Pasaporte';
  if (t === 'otro') return 'Otro';
  return 'DNI';
}

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

  // Formulario de datos de contacto
  const [celular, setCelular] = useState('');
  const [residencia, setResidencia] = useState('');

  // Modal de edición
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false);
  const [codigoPaisCelular, setCodigoPaisCelular] = useState('+51');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [resPais, setResPais] = useState('Perú');
  const [resDepartamento, setResDepartamento] = useState('Lima');
  const [resCiudad, setResCiudad] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

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
            setCelular(data.celular || data.telefono || '');
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

  const abrirModalEdicion = () => {
    const parsedCel = parsearCelular(celular);
    setCodigoPaisCelular(parsedCel.dialCode);
    setNumeroCelular(parsedCel.numero);

    const parsedRes = parsearResidencia(residencia);
    setResPais(parsedRes.pais);
    setResDepartamento(parsedRes.departamento);
    setResCiudad(parsedRes.ciudad);

    setFechaNacimiento(formatearFechaInput(perfil?.fecha_nacimiento));

    setModalEdicionAbierto(true);
  };

  const handleGuardarDatos = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoDatos(true);
    setMensajeExito(null);
    setMensajeError(null);

    const celularFinal = formatearCelularGuardar(codigoPaisCelular, numeroCelular);
    const residenciaFinal = formatearResidenciaGuardar(resPais, resDepartamento, resCiudad);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesión no encontrada.');

      const { error } = await supabase
        .from('profiles')
        .update({
          telefono: celularFinal,
          residencia: residenciaFinal,
          fecha_nacimiento: fechaNacimiento || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;

      setCelular(celularFinal);
      setResidencia(residenciaFinal);
      setPerfil((prev: any) => ({
        ...prev,
        celular: celularFinal,
        telefono: celularFinal,
        residencia: residenciaFinal,
        fecha_nacimiento: fechaNacimiento || prev?.fecha_nacimiento
      }));

      setMensajeExito('Datos de perfil actualizados correctamente.');
      setModalEdicionAbierto(false);
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

      <main className="flex-1 p-6 sm:p-10 lg:p-16 overflow-y-auto z-10 min-w-0 pb-24">
        <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">

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

          {/* Tarjeta Hero / Perfil de Administrador (Armonizada con Perfil Estudiante) */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 shadow-xl text-white relative overflow-hidden border border-slate-800">
            <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              
              {/* Avatar con botón de subida */}
              <div className="relative group shrink-0">
                <div className={`size-24 sm:size-28 rounded-full bg-gradient-to-tr from-indigo-500 via-indigo-600 to-cyan-400 text-white text-3xl sm:text-4xl font-black flex items-center justify-center shadow-2xl ring-4 ${fotoTemporal ? 'ring-emerald-400' : 'ring-indigo-500/30'} shrink-0 overflow-hidden transition-all`}>
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
                  className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border-2 border-slate-900 transition-transform hover:scale-110 cursor-pointer"
                  title="Cambiar foto de perfil"
                >
                  <Camera className="w-4 h-4" />
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
              <div className="min-w-0 flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5">
                
                {/* 1. Arriba: Badge de Rol con rounded-md exactamente igual al sidebar */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/15 rounded-md border border-indigo-500/25">
                    <ShieldCheck className="size-3.5" />
                    <span>{rolLabel}</span>
                  </span>
                </div>

                {/* 2. El Nombre Completo */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                  {nombres} {apellidos}
                </h1>

                {/* 3. Botones Auxiliares */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                  <button
                    onClick={() => setModalPasswordAbierto(true)}
                    className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4 text-amber-400" />
                    <span>Cambiar contraseña</span>
                  </button>

                  {/* Acciones al seleccionar foto temporal */}
                  {fotoTemporal ? (
                    <>
                      <button
                        onClick={guardarNuevaFoto}
                        disabled={guardandoFoto}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>{guardandoFoto ? 'Guardando en Storage...' : 'Guardar foto'}</span>
                      </button>
                      <button
                        onClick={cancelarFotoTemporal}
                        disabled={guardandoFoto}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-60 text-slate-300 font-semibold text-xs transition-all border border-slate-700 cursor-pointer"
                      >
                        <span>Cancelar</span>
                      </button>
                    </>
                  ) : (
                    fotoPerfil && (
                      <button
                        onClick={handleQuitarFoto}
                        className="px-3.5 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-semibold inline-flex items-center gap-1.5 transition-colors border border-rose-500/20 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar foto</span>
                      </button>
                    )
                  )}
                </div>

                {errorFoto && (
                  <p className="text-xs text-rose-400 font-medium mt-1">
                    {errorFoto}
                  </p>
                )}
              </div>

            </div>
          </div>

          {/* BLOQUE 1: DATOS INSTITUCIONALES */}
          <div className={`rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors ${esOscuro ? 'bg-slate-900 text-slate-100 ring-1 ring-slate-800' : 'bg-white text-slate-900 shadow-slate-950/5 ring-1 ring-slate-200'}`}>
            <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
              <User className="w-5 h-5 text-indigo-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Datos institucionales</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nombres y Apellidos */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <User className="w-4 h-4 text-slate-400" /> Nombres
                </label>
                <div 
                  className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <span className="truncate">{nombres || 'No registrado'}</span>
                </div>
              </div>

              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <User className="w-4 h-4 text-slate-400" /> Apellidos
                </label>
                <div 
                  className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <span className="truncate">{apellidos || 'No registrado'}</span>
                </div>
              </div>

              {/* Documento de Identidad (Tipo + Número en estilo estándar homogéneo) */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <FileText className="w-4 h-4 text-slate-400" /> Documento de identidad
                </label>
                <div 
                  className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <span className="truncate">
                    {dni || perfil?.numero_documento || perfil?.dni_ce || perfil?.dni
                      ? `${formatoTipoDocumento(perfil?.tipo_documento)} - ${dni || perfil?.numero_documento || perfil?.dni_ce || perfil?.dni}`
                      : 'No registrado'}
                  </span>
                </div>
              </div>

              {/* Correo electrónico (1 sola columna) */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Mail className="w-4 h-4 text-slate-400" /> Correo electrónico
                </label>
                <div 
                  className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <span className="truncate">{email || perfil?.email || 'No registrado'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* BLOQUE 2: DATOS DE CONTACTO */}
          <div className={`rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors ${esOscuro ? 'bg-slate-900 text-slate-100 ring-1 ring-slate-800' : 'bg-white text-slate-900 shadow-slate-950/5 ring-1 ring-slate-200'}`}>
            <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
              <Phone className="w-5 h-5 text-emerald-500" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Datos de contacto</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Celular (con código de país) */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Phone className="w-4 h-4 text-slate-400" /> Número de celular
                </label>
                <div 
                  className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <span>{formatearCelularVisual(celular || perfil?.celular || perfil?.telefono)}</span>
                </div>
              </div>

              {/* Fecha de nacimiento */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Calendar className="w-4 h-4 text-slate-400" /> Fecha de nacimiento
                </label>
                <div 
                  className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <span>{formatearFechaSlash(perfil?.fecha_nacimiento) || 'No registrada'}</span>
                </div>
              </div>

              {/* País de residencia */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Globe className="w-4 h-4 text-slate-400" /> País de residencia
                </label>
                <div 
                  className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <span>{(() => {
                    const raw = residencia || perfil?.residencia;
                    return raw ? parsearResidencia(raw).pais || 'No registrado' : 'No registrado';
                  })()}</span>
                </div>
              </div>

              {/* Departamento y ciudad */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <MapPin className="w-4 h-4 text-slate-400" /> Departamento y ciudad
                </label>
                <div 
                  className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                >
                  <span>
                    {(() => {
                      const raw = residencia || perfil?.residencia;
                      if (!raw) return 'No registrado';
                      const parsed = parsearResidencia(raw);
                      const partes = Array.from(new Set([parsed.departamento, parsed.ciudad].filter(Boolean)));
                      return partes.length > 0 ? partes.join(' - ') : (parsed.pais ? 'No especificado' : 'No registrado');
                    })()}
                  </span>
                </div>
              </div>
            </div>

            {/* Barra inferior de acciones */}
            <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <p className={`text-sm leading-relaxed ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  Perfil institucional verificado. Tus datos oficiales son gestionados con estrictos protocolos de seguridad corporativa.
                </p>
              </div>
              <button 
                onClick={abrirModalEdicion}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" /> Editar perfil
              </button>
            </div>
          </div>

        </div>
      </main>

      {/* MODAL DE EDICIÓN DE DATOS (Mismo estándar que estudiante: país + celular + 3 niveles residencia) */}
      {modalEdicionAbierto && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setModalEdicionAbierto(false); }} 
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
        >
          <div 
            onClick={(e) => e.stopPropagation()} 
            className={`rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}
          >
            <button 
              onClick={() => setModalEdicionAbierto(false)}
              className={`absolute right-4 top-4 sm:right-6 sm:top-6 transition-colors p-2 rounded-full z-10 ${esOscuro ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
            >
              <X className="w-6 h-6" />
            </button>

            <div className={`mb-6 border-b pb-4 pr-8 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
              <h3 className={`text-2xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>Editar perfil institucional</h3>
              <p className={`text-sm mt-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                Actualiza tu número celular de contacto y tu ubicación de residencia.
              </p>
            </div>

            <form onSubmit={handleGuardarDatos} className="space-y-5">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Celular con selector de país */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                    Número de celular
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={codigoPaisCelular}
                      onChange={(e) => setCodigoPaisCelular(e.target.value)}
                      className={`w-36 border rounded-xl px-2.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer shrink-0 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    >
                      {LISTA_PAISES.map((p) => (
                        <option key={`${p.codigo}-${p.dialCode}`} value={p.dialCode}>
                          {p.nombre} ({p.dialCode})
                        </option>
                      ))}
                    </select>
                    <input 
                      type="tel" 
                      placeholder="Ej. 987654321"
                      value={numeroCelular}
                      onChange={(e) => setNumeroCelular(e.target.value)}
                      className={`flex-1 min-w-0 border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                  </div>
                </div>

                {/* Fecha de nacimiento */}
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                    Fecha de nacimiento
                  </label>
                  <input 
                    type="date" 
                    value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)}
                    className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                  />
                </div>
              </div>

              {/* Lugar de residencia en 3 niveles (País, Departamento/Región, Ciudad) */}
              <div className="border-t pt-4 border-slate-200 dark:border-slate-800">
                <label className={`block text-xs font-bold uppercase tracking-wider mb-2.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  Lugar de residencia
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">País</label>
                    <select
                      value={resPais}
                      onChange={(e) => {
                        const nuevoP = e.target.value;
                        setResPais(nuevoP);
                        if (nuevoP === 'Perú' && !DEPARTAMENTOS_PERU.includes(resDepartamento)) {
                          setResDepartamento('Lima');
                        }
                      }}
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    >
                      {LISTA_PAISES.map((p) => (
                        <option key={p.codigo} value={p.nombre}>
                          {p.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      {resPais === 'Perú' ? 'Departamento' : 'Departamento / Región'}
                    </label>
                    {resPais === 'Perú' ? (
                      <select
                        value={resDepartamento}
                        onChange={(e) => setResDepartamento(e.target.value)}
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      >
                        {DEPARTAMENTOS_PERU.map((dep) => (
                          <option key={dep} value={dep}>{dep}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={resDepartamento}
                        onChange={(e) => setResDepartamento(e.target.value)}
                        placeholder="Ej. Cundinamarca"
                        className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">Ciudad / Localidad</label>
                    <input
                      type="text"
                      value={resCiudad}
                      onChange={(e) => setResCiudad(e.target.value)}
                      placeholder="Ej. Lima, Trujillo"
                      className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex gap-3">
                <button 
                  type="submit"
                  disabled={guardandoDatos}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm cursor-pointer"
                >
                  {guardandoDatos ? 'Guardando cambios...' : 'Guardar cambios'}
                </button>
                <button 
                  type="button"
                  onClick={() => setModalEdicionAbierto(false)}
                  className={`py-3 px-5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  Cancelar
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

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
              className="absolute right-4 top-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
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
