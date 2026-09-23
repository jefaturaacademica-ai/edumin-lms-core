'use client';

import { useEffect, useState, useRef } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  ShieldAlert, 
  CheckCircle, 
  X,
  Calendar,
  MapPin,
  Edit3,
  Camera,
  Building2,
  Trash2,
  KeyRound,
  Lock,
  GraduationCap,
  Sparkles,
  Check
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/context/theme-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';

export default function PerfilEstudiante() {
  const { esOscuro } = useTheme();

  const { 
    nombres, 
    apellidos, 
    iniciales, 
    paqueteContratado, 
    fotoPerfil, 
    actualizarFotoPerfil,
    actualizarDatosUsuario 
  } = useProfile();

  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [declaracionJurada, setDeclaracionJurada] = useState(false);

  // Estados para Cambiar Contraseña
  const [formPassword, setFormPassword] = useState({ actual: '', nueva: '', confirmar: '' });
  const [passwordExito, setPasswordExito] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Estados para Foto de Perfil (Vista previa y validación sin transparencia)
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  
  const inputFotoRef = useRef<HTMLInputElement>(null);

  // Estado del formulario en modo edición (celular en un único campo limpio)
  const [formEdicion, setFormEdicion] = useState({
    nombres: nombres,
    apellidos: apellidos,
    dni_ce: '73849201',
    email: 'alumno@edumin.pe',
    celular: '+51 984 512 809',
    fechaNacimiento: '1996-06-14',
    residencia: 'Arequipa, Perú (Distrito de Yanahuara)',
  });

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  useEffect(() => {
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        if (data) {
          setPerfil(data);
          setFormEdicion((prev) => ({
            ...prev,
            nombres: data.nombres || prev.nombres,
            apellidos: data.apellidos || prev.apellidos,
            dni_ce: data.dni_ce || prev.dni_ce,
            email: data.email || prev.email,
            celular: data.celular || prev.celular,
            residencia: data.residencia || prev.residencia,
          }));
          actualizarDatosUsuario({
            nombres: data.nombres || nombres,
            apellidos: data.apellidos || apellidos,
          });
        }
      }
      setCargando(false);
    }
    cargarPerfil();
  }, [supabase]);

  // Manejo de carga y vista previa de foto de perfil (sin transparencia)
  const handleCambiarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorFoto(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'];
    if (!tiposPermitidos.includes(file.type.toLowerCase())) {
      setErrorFoto('Formato no permitido. Por favor selecciona una imagen JPG, JPEG o WEBP.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.src = reader.result as string;
      img.onload = () => {
        // Renderizar en Canvas con fondo blanco para eliminar cualquier transparencia
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff'; // Fondo blanco opaco sin transparencia
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
          setFotoTemporal(jpegDataUrl);
        } else {
          setFotoTemporal(reader.result as string);
        }
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const guardarNuevaFoto = () => {
    if (fotoTemporal) {
      actualizarFotoPerfil(fotoTemporal);
      setFotoTemporal(null);
      setErrorFoto(null);
    }
  };

  const cancelarFotoTemporal = () => {
    setFotoTemporal(null);
    setErrorFoto(null);
  };

  const abrirModalEdicion = () => {
    setSolicitudEnviada(false);
    setDeclaracionJurada(false);
    setModalAbierto(true);
  };

  const handleCambiarPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (formPassword.nueva !== formPassword.confirmar) {
      setPasswordError('Las nuevas contraseñas no coinciden');
      return;
    }
    if (formPassword.nueva.length < 6) {
      setPasswordError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }

    setPasswordExito(true);
    setTimeout(() => {
      setModalPasswordAbierto(false);
      setPasswordExito(false);
      setFormPassword({ actual: '', nueva: '', confirmar: '' });
    }, 2000);
  };

  const enviarSolicitudAdministracion = (e: React.FormEvent) => {
    e.preventDefault();
    setSolicitudEnviada(true);

    actualizarDatosUsuario({
      nombres: formEdicion.nombres,
      apellidos: formEdicion.apellidos,
    });

    setPerfil((prev: any) => ({
      ...prev,
      nombres: formEdicion.nombres,
      apellidos: formEdicion.apellidos,
      dni_ce: formEdicion.dni_ce,
      email: formEdicion.email,
      celular: formEdicion.celular,
      fecha_nacimiento: formEdicion.fechaNacimiento.split('-').reverse().join('/'),
      residencia: formEdicion.residencia,
    }));

    setTimeout(() => {
      setModalAbierto(false);
      setSolicitudEnviada(false);
    }, 2500);
  };

  if (cargando) {
    return (
      <DashboardLoader 
        title="Cargando información del perfil..." 
        subtitle="Consultando datos personales y de residencia institucionales" 
      />
    );
  }

  return (
    <main className={`min-h-screen p-6 sm:p-10 lg:p-16 transition-colors duration-300 ${esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className={`text-3xl font-bold tracking-tight flex items-center gap-3 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>
            <User className="w-8 h-8 text-indigo-600" />
            Mi perfil
          </h1>
          <p className={`mt-2 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
            Consulta tu información personal y de residencia registrada en la plataforma.
          </p>
        </header>

        {/* TARJETA CON AVATAR E IDENTIDAD DEL ESTUDIANTE */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 shadow-xl text-white relative overflow-hidden mb-8 border border-slate-800">
          {/* Elemento Decorativo de Fondo */}
          <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
            
            {/* Círculo del Avatar */}
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

              {/* Input oculto para seleccionar foto (Formatos soportados sin transparencia) */}
              <input 
                type="file" 
                ref={inputFotoRef} 
                accept="image/jpeg,image/jpg,image/webp,image/png" 
                className="hidden" 
                onChange={handleCambiarFoto} 
              />

              <button 
                onClick={() => inputFotoRef.current?.click()}
                title="Cambiar foto de perfil"
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border-2 border-slate-900 transition-transform hover:scale-110"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* A su lado: Etiqueta del programa arriba -> Nombre -> Botones auxiliares */}
            <div className="min-w-0 flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5">
              
              {/* 1. Arriba: Etiqueta del Programa */}
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                  <span>{paqueteContratado || 'Estudiante'}</span>
                </span>
              </div>

              {/* 2. El Nombre */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {nombres} {apellidos}
              </h2>

              {/* 3. Botones Auxiliares */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                <button
                  onClick={() => setModalPasswordAbierto(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all shadow-md flex items-center gap-2"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Cambiar contraseña</span>
                </button>

                {/* Botones al cargar nueva foto previa */}
                {fotoTemporal ? (
                  <>
                    <button
                      onClick={guardarNuevaFoto}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 animate-in fade-in"
                    >
                      <Check className="w-4 h-4" />
                      <span>Guardar foto</span>
                    </button>
                    <button
                      onClick={cancelarFotoTemporal}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all border border-slate-700"
                    >
                      <span>Cancelar</span>
                    </button>
                  </>
                ) : (
                  fotoPerfil && (
                    <button
                      onClick={() => actualizarFotoPerfil(null)}
                      className="px-3.5 py-2.5 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 font-semibold inline-flex items-center gap-1.5 transition-colors border border-rose-500/20"
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

        {/* DATOS OFICIALES DEL PERFIL */}
        <div className={`rounded-3xl p-8 shadow-xl relative overflow-hidden transition-colors ${esOscuro ? 'bg-slate-900 text-slate-100 ring-1 ring-slate-800' : 'bg-white text-slate-900 shadow-slate-950/5 ring-1 ring-slate-200'}`}>
          {/* Elemento decorativo */}
          <div className={`absolute -right-20 -top-20 size-64 rounded-full border ${esOscuro ? 'bg-slate-800/30 border-slate-800' : 'bg-slate-50 border-slate-100'}`} />
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              
              {/* Nombres y Apellidos */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <User className="w-4 h-4 text-slate-400" /> Nombres
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={nombres} 
                  className={`w-full border rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                />
              </div>

              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <User className="w-4 h-4 text-slate-400" /> Apellidos
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={apellidos} 
                  className={`w-full border rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                />
              </div>

              {/* DNI y Email */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <FileText className="w-4 h-4 text-slate-400" /> DNI / Carnet de extranjería
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.dni_ce || formEdicion.dni_ce} 
                  className={`w-full border rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                />
              </div>

              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Mail className="w-4 h-4 text-slate-400" /> Correo electrónico
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.email || formEdicion.email} 
                  className={`w-full border rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                />
              </div>

              {/* Celular (Campo único) y Fecha de Nacimiento */}
              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Phone className="w-4 h-4 text-indigo-400" /> Número de celular
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.celular || formEdicion.celular} 
                  className={`w-full border rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                />
              </div>

              <div>
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Calendar className="w-4 h-4 text-indigo-400" /> Fecha de nacimiento
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.fecha_nacimiento || '14/06/1996'} 
                  className={`w-full border rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                />
              </div>

              <div className="md:col-span-2">
                <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                  <MapPin className="w-4 h-4 text-indigo-400" /> Lugar de residencia
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.residencia || formEdicion.residencia} 
                  className={`w-full border rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                />
              </div>

            </div>

            <div className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className={`text-sm max-w-md ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                  Tus datos son utilizados para la emisión oficial de tus certificados y diplomas digitales. La modificación pasará a validación de administración.
                </p>
              </div>
              <button 
                onClick={abrirModalEdicion}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
              >
                <Edit3 className="w-4 h-4" /> Editar perfil
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DE EDICIÓN PARA VALIDACIÓN DE ADMINISTRACIÓN */}
        {modalAbierto && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div className={`rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              
              <button 
                onClick={() => setModalAbierto(false)}
                className={`absolute right-4 top-4 sm:right-6 sm:top-6 transition-colors p-2 rounded-full z-10 ${esOscuro ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <X className="w-6 h-6" />
              </button>

              {solicitudEnviada ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>¡Solicitud enviada a administración!</h3>
                  <p className={`max-w-md mx-auto text-sm leading-relaxed ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tus cambios han sido enviados correctamente a revisión. El equipo administrativo validará la información brindada antes de actualizarla oficialmente en tus certificados.
                  </p>
                </div>
              ) : (
                <>
                  <div className={`mb-6 border-b pb-4 pr-8 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`text-2xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>Editar perfil</h3>
                    <p className={`text-sm mt-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                      Los datos modificados pasarán a verificación del equipo administrativo.
                    </p>
                  </div>

                  <form onSubmit={enviarSolicitudAdministracion} className="space-y-5">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nombres */}
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          Nombres
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formEdicion.nombres}
                          onChange={(e) => setFormEdicion({ ...formEdicion, nombres: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                      </div>

                      {/* Apellidos */}
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          Apellidos
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formEdicion.apellidos}
                          onChange={(e) => setFormEdicion({ ...formEdicion, apellidos: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* DNI / CE */}
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          DNI / Carnet de extranjería
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formEdicion.dni_ce}
                          onChange={(e) => setFormEdicion({ ...formEdicion, dni_ce: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                      </div>

                      {/* Correo electrónico */}
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          Correo electrónico
                        </label>
                        <input 
                          type="email" 
                          required
                          value={formEdicion.email}
                          onChange={(e) => setFormEdicion({ ...formEdicion, email: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                      </div>
                    </div>

                    {/* Fila 3: Celular (Único Campo) + Fecha de nacimiento */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          Número de celular
                        </label>
                        <input 
                          type="tel" 
                          required
                          placeholder="+51 984 512 809"
                          value={formEdicion.celular}
                          onChange={(e) => setFormEdicion({ ...formEdicion, celular: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                      </div>

                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          Fecha de nacimiento
                        </label>
                        <input 
                          type="date" 
                          required
                          value={formEdicion.fechaNacimiento}
                          onChange={(e) => setFormEdicion({ ...formEdicion, fechaNacimiento: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                      </div>
                    </div>

                    {/* Fila 4 Completa: Lugar de residencia */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                        Lugar de residencia
                      </label>
                      <input 
                        type="text" 
                        required
                        value={formEdicion.residencia}
                        onChange={(e) => setFormEdicion({ ...formEdicion, residencia: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      />
                    </div>

                    {/* CONFIRMACIÓN MEDIANTE CHECKBOX / DECLARACIÓN JURADA */}
                    <div className={`border rounded-2xl p-4 flex items-start gap-3 ${esOscuro ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <input 
                        type="checkbox" 
                        required
                        id="declaracion"
                        checked={declaracionJurada}
                        onChange={(e) => setDeclaracionJurada(e.target.checked)}
                        className="mt-0.5 size-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                      />
                      <label htmlFor="declaracion" className={`text-xs font-semibold cursor-pointer leading-relaxed ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                        Declaro que los datos ingresados son verídicos y solicito su actualización oficial ante la administración.
                      </label>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button 
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm"
                      >
                        Enviar solicitud a administración
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModalAbierto(false)}
                        className={`py-3 px-5 rounded-xl font-bold text-sm transition-colors ${esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
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

        {/* MODAL DE CAMBIAR CONTRASEÑA */}
        {modalPasswordAbierto && (
          <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div className={`rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              <button 
                onClick={() => {
                  setModalPasswordAbierto(false);
                  setPasswordExito(false);
                  setPasswordError('');
                }}
                className={`absolute right-4 top-4 sm:right-6 sm:top-6 transition-colors p-2 rounded-full z-10 ${esOscuro ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <X className="w-5 h-5" />
              </button>

              {passwordExito ? (
                <div className="text-center py-6">
                  <div className="mx-auto w-14 h-14 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-3 border border-emerald-500/20">
                    <CheckCircle className="w-7 h-7" />
                  </div>
                  <h3 className={`text-xl font-bold mb-1 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>¡Contraseña actualizada!</h3>
                  <p className={`text-xs ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tu contraseña de acceso ha sido modificada correctamente.
                  </p>
                </div>
              ) : (
                <>
                  <div className={`mb-6 border-b pb-3 pr-8 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`text-xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>Cambiar contraseña</h3>
                    <p className={`text-xs mt-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                      Ingresa tu clave actual y define tu nueva contraseña.
                    </p>
                  </div>

                  {passwordError && (
                    <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
                      {passwordError}
                    </div>
                  )}

                  <form onSubmit={handleCambiarPassword} className="space-y-4">
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                        Contraseña actual
                      </label>
                      <input 
                        type="password"
                        required
                        value={formPassword.actual}
                        onChange={(e) => setFormPassword({ ...formPassword, actual: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                        Nueva contraseña
                      </label>
                      <input 
                        type="password"
                        required
                        minLength={6}
                        value={formPassword.nueva}
                        onChange={(e) => setFormPassword({ ...formPassword, nueva: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      />
                    </div>

                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                        Confirmar nueva contraseña
                      </label>
                      <input 
                        type="password"
                        required
                        minLength={6}
                        value={formPassword.confirmar}
                        onChange={(e) => setFormPassword({ ...formPassword, confirmar: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      />
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button 
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm"
                      >
                        Actualizar contraseña
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModalPasswordAbierto(false)}
                        className={`py-3 px-4 rounded-xl font-bold text-sm transition-colors ${esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
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
    </main>
  );
}