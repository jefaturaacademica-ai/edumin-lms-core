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
  Globe,
  Edit3,
  Camera,
  Building2,
  Trash2,
  KeyRound,
  Check
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/context/theme-context';
import { DashboardLoader } from '@/components/dashboard/dashboard-loader';
import { StudentPageHeader } from '@/components/dashboard/StudentPageHeader';
import { getClientCachedData, invalidateClientCache } from '@/lib/utils/clientCache';
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

  // Modales independientes
  const [modalSolicitudAbierto, setModalSolicitudAbierto] = useState(false);
  const [modalContactoAbierto, setModalContactoAbierto] = useState(false);
  const [modalPasswordAbierto, setModalPasswordAbierto] = useState(false);

  // Estados de solicitud administrativa (Datos institucionales)
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [enviandoSolicitud, setEnviandoSolicitud] = useState(false);
  const [declaracionJurada, setDeclaracionJurada] = useState(false);
  const [formSolicitud, setFormSolicitud] = useState({
    nombres: '',
    apellidos: '',
    tipo_documento: 'DNI',
    dni_ce: '',
    motivo: ''
  });

  // Estados de edición directa (Datos de contacto)
  const [guardandoContacto, setGuardandoContacto] = useState(false);
  const [contactoExito, setContactoExito] = useState(false);
  const [codigoPaisCelular, setCodigoPaisCelular] = useState('+51');
  const [numeroCelular, setNumeroCelular] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [resPais, setResPais] = useState('Perú');
  const [resDepartamento, setResDepartamento] = useState('Lima');
  const [resCiudad, setResCiudad] = useState('');

  // Estados para Cambiar Contraseña
  const [formPassword, setFormPassword] = useState({ actual: '', nueva: '', confirmar: '' });
  const [passwordExito, setPasswordExito] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  
  // Estados para Foto de Perfil
  const [fotoTemporal, setFotoTemporal] = useState<string | null>(null);
  const [errorFoto, setErrorFoto] = useState<string | null>(null);
  const [guardandoFoto, setGuardandoFoto] = useState(false);
  const inputFotoRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    // Si existe caché en cliente, hidratar inmediatamente sin esperar el fetch
    const cachedProf = getClientCachedData('/api/dashboard/me')?.profile;
    if (cachedProf) {
      setPerfil(cachedProf);
      setCargando(false);
    }

    async function cargarPerfil() {
      try {
        const res = await fetch('/api/dashboard/me');
        if (res.ok) {
          const data = await res.json();
          const p = data.profile;
          if (p) {
            setPerfil(p);
            actualizarDatosUsuario({
              nombres: p.nombres || nombres,
              apellidos: p.apellidos || apellidos,
            });
            const fotoValida = p.foto_perfil || null;
            if (fotoValida) {
              actualizarFotoPerfil(fotoValida);
            }
          }
        }
      } catch (err) {
        console.error('Error cargando perfil:', err);
      } finally {
        setCargando(false);
      }
    }
    cargarPerfil();
  }, []);

  // Manejo de carga y vista previa de foto de perfil (estandarizada a 320x320 cuadrada)
  const handleCambiarFoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorFoto(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/webp', 'image/png'];
    if (!tiposPermitidos.includes(file.type.toLowerCase())) {
      setErrorFoto('Formato no permitido. Por favor selecciona una imagen JPG, JPEG, WEBP o PNG.');
      e.target.value = '';
      return;
    }

    const MAX_MB = 8;
    if (file.size > MAX_MB * 1024 * 1024) {
      setErrorFoto(`La imagen seleccionada supera el límite de ${MAX_MB} MB. Por favor sube una foto más liviana.`);
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
        const cropX = Math.round((img.width - minDim) / 2);
        const cropY = Math.round((img.height - minDim) / 2);

        const canvas = document.createElement('canvas');
        canvas.width = TARGET_SIZE;
        canvas.height = TARGET_SIZE;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, TARGET_SIZE, TARGET_SIZE);
          ctx.drawImage(img, cropX, cropY, minDim, minDim, 0, 0, TARGET_SIZE, TARGET_SIZE);
          const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFotoTemporal(jpegDataUrl);
        } else {
          setFotoTemporal(reader.result as string);
        }
      };
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const guardarNuevaFoto = async () => {
    if (fotoTemporal) {
      setGuardandoFoto(true);
      try {
        const res = await fetch('/api/dashboard/perfil', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'actualizar_foto', foto_perfil: fotoTemporal })
        });
        const data = await res.json();
        const nuevaUrl = data.profile?.foto_perfil || fotoTemporal;
        actualizarFotoPerfil(nuevaUrl);
        invalidateClientCache('/api/dashboard/me');
      } catch (e) {
        console.error('Error guardando foto en Supabase Storage:', e);
        actualizarFotoPerfil(fotoTemporal);
      } finally {
        setGuardandoFoto(false);
        setFotoTemporal(null);
        setErrorFoto(null);
      }
    }
  };

  const cancelarFotoTemporal = () => {
    setFotoTemporal(null);
    setErrorFoto(null);
  };

  const handleQuitarFoto = async () => {
    actualizarFotoPerfil(null);
    try {
      await fetch('/api/dashboard/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'actualizar_foto', foto_perfil: '' })
      });
      invalidateClientCache('/api/dashboard/me');
    } catch (e) {
      console.error('Error al quitar foto en Supabase:', e);
    }
  };

  // Abrir Modal 1: Solicitud de cambio de datos institucionales
  const abrirModalSolicitud = () => {
    setSolicitudEnviada(false);
    setDeclaracionJurada(false);
    setFormSolicitud({
      nombres: perfil?.nombres || nombres || '',
      apellidos: perfil?.apellidos || apellidos || '',
      tipo_documento: perfil?.tipo_documento || 'DNI',
      dni_ce: perfil?.numero_documento || perfil?.dni_ce || perfil?.dni || '',
      motivo: ''
    });
    setModalSolicitudAbierto(true);
  };

  // Enviar Solicitud formal a administración (requiere declaración jurada)
  const handleEnviarSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!declaracionJurada) return;

    setEnviandoSolicitud(true);
    try {
      const res = await fetch('/api/dashboard/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'solicitud_cambio_datos',
          nombresSolicitados: formSolicitud.nombres,
          apellidosSolicitados: formSolicitud.apellidos,
          dniSolicitado: formSolicitud.dni_ce,
          tipoDocumentoSolicitado: formSolicitud.tipo_documento,
          motivo: formSolicitud.motivo || 'Rectificación de Datos de Certificación',
          declaracionJurada: true
        })
      });
      if (res.ok) {
        setSolicitudEnviada(true);
        setTimeout(() => {
          setModalSolicitudAbierto(false);
          setSolicitudEnviada(false);
        }, 2200);
      }
    } catch (err) {
      console.error('Error enviando solicitud:', err);
    } finally {
      setEnviandoSolicitud(false);
    }
  };

  // Abrir Modal 2: Edición de datos de contacto (sin trámite ni declaración jurada)
  const abrirModalContacto = () => {
    setContactoExito(false);
    const parsedCel = parsearCelular(perfil?.telefono || perfil?.celular);
    setCodigoPaisCelular(parsedCel.dialCode);
    setNumeroCelular(parsedCel.numero);

    const parsedRes = parsearResidencia(perfil?.residencia);
    setResPais(parsedRes.pais);
    setResDepartamento(parsedRes.departamento);
    setResCiudad(parsedRes.ciudad);

    setFechaNacimiento(formatearFechaInput(perfil?.fecha_nacimiento));
    setModalContactoAbierto(true);
  };

  // Guardar datos de contacto directos
  const handleGuardarContacto = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardandoContacto(true);

    const celularFinal = formatearCelularGuardar(codigoPaisCelular, numeroCelular);
    const residenciaFinal = formatearResidenciaGuardar(resPais, resDepartamento, resCiudad);

    try {
      const res = await fetch('/api/dashboard/perfil', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'actualizar_contacto',
          celular: celularFinal,
          residencia: residenciaFinal,
          fecha_nacimiento: fechaNacimiento || null
        })
      });

      if (res.ok) {
        setPerfil((prev: any) => ({
          ...prev,
          telefono: celularFinal,
          celular: celularFinal,
          residencia: residenciaFinal,
          fecha_nacimiento: fechaNacimiento || prev?.fecha_nacimiento
        }));
        invalidateClientCache('/api/dashboard/me');
        setContactoExito(true);
        setTimeout(() => {
          setModalContactoAbierto(false);
          setContactoExito(false);
        }, 1200);
      }
    } catch (err) {
      console.error('Error guardando datos de contacto:', err);
    } finally {
      setGuardandoContacto(false);
    }
  };

  // Modal de Cambiar Contraseña
  const handleCambiarPassword = async (e: React.FormEvent) => {
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

    try {
      const { error } = await supabase.auth.updateUser({ password: formPassword.nueva });
      if (error) {
        setPasswordError(error.message);
        return;
      }
      setPasswordExito(true);
      setTimeout(() => {
        setModalPasswordAbierto(false);
        setPasswordExito(false);
        setFormPassword({ actual: '', nueva: '', confirmar: '' });
      }, 2000);
    } catch (err: any) {
      setPasswordError(err.message || 'Error al actualizar la contraseña.');
    }
  };

  if (cargando) {
    return <DashboardLoader />;
  }

  return (
    <main 
      suppressHydrationWarning
      className={`min-h-screen p-6 sm:p-10 lg:p-16 pb-24 transition-colors duration-200 ${esOscuro ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}
    >
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Encabezado Unificado */}
        <StudentPageHeader
          icon={User}
          title="Mi perfil"
        />

        {/* HERO CARD: AVATAR E IDENTIDAD (Estilo idéntico a vista Administrador) */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 rounded-3xl p-6 sm:p-8 shadow-xl text-white relative overflow-hidden border border-slate-800">
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
                className="absolute bottom-0 right-0 p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-lg border-2 border-slate-900 transition-transform hover:scale-110 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Información Principal: Rol -> Nombre -> Acciones */}
            <div className="min-w-0 flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-2.5">
              
              {/* 1. Arriba: Badge de Rol ("Estudiante") con rounded-md exactamente igual al sidebar */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-emerald-300 bg-emerald-500/15 rounded-md border border-emerald-500/25">
                  <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>Estudiante</span>
                </span>
                {paqueteContratado && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold text-indigo-300 bg-indigo-500/15 rounded-md border border-indigo-500/25">
                    <span>{paqueteContratado}</span>
                  </span>
                )}
              </div>

              {/* 2. El Nombre Completo */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {nombres} {apellidos}
              </h2>

              {/* 3. Botones Auxiliares */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1">
                <button
                  onClick={() => setModalPasswordAbierto(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/15 font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <KeyRound className="w-4 h-4 text-amber-400" />
                  <span>Cambiar contraseña</span>
                </button>

                {fotoTemporal ? (
                  <>
                    <button
                      onClick={guardarNuevaFoto}
                      disabled={guardandoFoto}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white font-semibold text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>{guardandoFoto ? 'Guardando...' : 'Guardar foto'}</span>
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

        {/* BLOQUE 1: DATOS INSTITUCIONALES (Con Solicitud Previa a Administración) */}
        <div className={`rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors ${esOscuro ? 'bg-slate-900 text-slate-100 ring-1 ring-slate-800' : 'bg-white text-slate-900 shadow-slate-950/5 ring-1 ring-slate-200'}`}>
          <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
            <Building2 className="w-5 h-5 text-indigo-500" />
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
                <span className="truncate">{perfil?.nombres || nombres || 'No registrado'}</span>
              </div>
            </div>

            <div>
              <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                <User className="w-4 h-4 text-slate-400" /> Apellidos
              </label>
              <div 
                className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <span className="truncate">{perfil?.apellidos || apellidos || 'No registrado'}</span>
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
                  {perfil?.numero_documento || perfil?.dni_ce || perfil?.dni
                    ? `${formatoTipoDocumento(perfil?.tipo_documento)} - ${perfil?.numero_documento || perfil?.dni_ce || perfil?.dni}`
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
                <span className="truncate">{perfil?.email || 'No registrado'}</span>
              </div>
            </div>
          </div>

          {/* Barra inferior: Solicitud formal a administración */}
          <div className={`mt-8 pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0" />
              <p className={`text-sm leading-relaxed ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                Tus datos son utilizados para la emisión oficial de tus certificados y diplomas digitales. La modificación pasará a validación de administración.
              </p>
            </div>
            <button 
              onClick={abrirModalSolicitud}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer text-xs sm:text-sm"
            >
              <FileText className="w-4 h-4" /> Solicitar rectificación
            </button>
          </div>
        </div>

        {/* BLOQUE 2: DATOS DE CONTACTO (Edición Directa Inmediata) */}
        <div className={`rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden transition-colors ${esOscuro ? 'bg-slate-900 text-slate-100 ring-1 ring-slate-800' : 'bg-white text-slate-900 shadow-slate-950/5 ring-1 ring-slate-200'}`}>
          <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-200 dark:border-slate-800">
            <Phone className="w-5 h-5 text-emerald-500" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Datos de contacto</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Celular con formato visual y código de país */}
            <div>
              <label className={`flex items-center gap-2 text-sm font-semibold mb-2 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                <Phone className="w-4 h-4 text-slate-400" /> Número de celular
              </label>
              <div 
                className={`w-full border rounded-xl px-4 py-3 cursor-default select-text font-medium min-h-[48px] flex items-center ${esOscuro ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
              >
                <span>{formatearCelularVisual(perfil?.telefono || perfil?.celular)}</span>
              </div>
            </div>

            {/* Fecha de Nacimiento en formato DD/MM/YYYY */}
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
                <span>{perfil?.residencia ? parsearResidencia(perfil.residencia).pais || 'No registrado' : 'No registrado'}</span>
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
                    if (!perfil?.residencia) return 'No registrado';
                    const parsed = parsearResidencia(perfil.residencia);
                    const partes = Array.from(new Set([parsed.departamento, parsed.ciudad].filter(Boolean)));
                    return partes.length > 0 ? partes.join(' - ') : (parsed.pais ? 'No especificado' : 'No registrado');
                  })()}
                </span>
              </div>
            </div>
          </div>

          {/* Barra inferior: Edición directa inmediata */}
          <div className={`pt-6 border-t flex flex-col sm:flex-row items-center justify-between gap-4 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Phone className="w-5 h-5 text-emerald-500 shrink-0" />
              <p className={`text-sm leading-relaxed ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                Mantén actualizados tus canales de contacto directo para recibir notificaciones académicas, cronogramas y alertas del aula virtual.
              </p>
            </div>
            <button 
              onClick={abrirModalContacto}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer text-xs sm:text-sm"
            >
              <Edit3 className="w-4 h-4" /> Editar contacto
            </button>
          </div>
        </div>

        {/* MODAL 1: SOLICITUD DE RECTIFICACIÓN ANTE ADMINISTRACIÓN */}
        {modalSolicitudAbierto && (
          <div onClick={(e) => { if (e.target === e.currentTarget) setModalSolicitudAbierto(false); }} className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div onClick={(e) => e.stopPropagation()} className={`rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              
              <button 
                onClick={() => setModalSolicitudAbierto(false)}
                className={`absolute right-4 top-4 sm:right-6 sm:top-6 transition-colors p-2 rounded-full z-10 ${esOscuro ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <X className="w-6 h-6" />
              </button>

              {solicitudEnviada ? (
                <div className="text-center py-10">
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
                    <h3 className={`text-2xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>Solicitud de rectificación de datos</h3>
                    <p className={`text-sm mt-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                      Los cambios en tus datos institucionales requieren validación por parte del equipo administrativo para garantizar la emisión legal de tus certificados.
                    </p>
                  </div>

                  <form onSubmit={handleEnviarSolicitud} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nombres */}
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          Nombres oficiales
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formSolicitud.nombres}
                          onChange={(e) => setFormSolicitud({ ...formSolicitud, nombres: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                      </div>

                      {/* Apellidos */}
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          Apellidos oficiales
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formSolicitud.apellidos}
                          onChange={(e) => setFormSolicitud({ ...formSolicitud, apellidos: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Tipo de documento */}
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          Tipo de documento
                        </label>
                        <select 
                          value={formSolicitud.tipo_documento}
                          onChange={(e) => setFormSolicitud({ ...formSolicitud, tipo_documento: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 cursor-pointer ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        >
                          <option value="DNI">DNI</option>
                          <option value="CE">Carné de extranjería</option>
                          <option value="PASAPORTE">Pasaporte</option>
                          <option value="OTRO">Otro</option>
                        </select>
                      </div>

                      {/* Número de documento */}
                      <div>
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                          Número de documento
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formSolicitud.dni_ce}
                          onChange={(e) => setFormSolicitud({ ...formSolicitud, dni_ce: e.target.value })}
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                        />
                      </div>
                    </div>

                    {/* Motivo de rectificación */}
                    <div>
                      <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                        Motivo de la rectificación
                      </label>
                      <input 
                        type="text"
                        placeholder="Ej. Corrección de tildes, error en número de documento"
                        value={formSolicitud.motivo}
                        onChange={(e) => setFormSolicitud({ ...formSolicitud, motivo: e.target.value })}
                        className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                      />
                    </div>

                    {/* Declaración Jurada */}
                    <div className={`border rounded-2xl p-4 flex items-start gap-3 ${esOscuro ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                      <input 
                        type="checkbox" 
                        required
                        id="declaracion_solicitud"
                        checked={declaracionJurada}
                        onChange={(e) => setDeclaracionJurada(e.target.checked)}
                        className="mt-0.5 size-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                      />
                      <label htmlFor="declaracion_solicitud" className={`text-xs font-semibold cursor-pointer leading-relaxed ${esOscuro ? 'text-slate-300' : 'text-slate-700'}`}>
                        Declaro bajo juramento que los datos ingresados corresponden estrictamente a mi identidad oficial y solicito su actualización en mis registros académicos institucionales.
                      </label>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button 
                        type="submit"
                        disabled={enviandoSolicitud || !declaracionJurada}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm cursor-pointer"
                      >
                        {enviandoSolicitud ? 'Enviando solicitud...' : 'Enviar solicitud a administración'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModalSolicitudAbierto(false)}
                        className={`py-3 px-5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
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

        {/* MODAL 2: EDICIÓN DIRECTA DE DATOS DE CONTACTO (Sin trámite ni declaración jurada) */}
        {modalContactoAbierto && (
          <div onClick={(e) => { if (e.target === e.currentTarget) setModalContactoAbierto(false); }} className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div onClick={(e) => e.stopPropagation()} className={`rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200 border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
              
              <button 
                onClick={() => setModalContactoAbierto(false)}
                className={`absolute right-4 top-4 sm:right-6 sm:top-6 transition-colors p-2 rounded-full z-10 ${esOscuro ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'}`}
              >
                <X className="w-6 h-6" />
              </button>

              {contactoExito ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-500/20">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className={`text-2xl font-bold mb-2 ${esOscuro ? 'text-white' : 'text-slate-900'}`}>¡Datos de contacto actualizados!</h3>
                  <p className={`max-w-md mx-auto text-sm leading-relaxed ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                    Tus datos de comunicación han sido guardados correctamente en tu perfil.
                  </p>
                </div>
              ) : (
                <>
                  <div className={`mb-6 border-b pb-4 pr-8 ${esOscuro ? 'border-slate-800' : 'border-slate-100'}`}>
                    <h3 className={`text-2xl font-bold ${esOscuro ? 'text-white' : 'text-slate-900'}`}>Editar datos de contacto</h3>
                    <p className={`text-sm mt-1 ${esOscuro ? 'text-slate-400' : 'text-slate-500'}`}>
                      Actualiza tu número telefónico, fecha de nacimiento y lugar de residencia. Los cambios se aplicarán inmediatamente.
                    </p>
                  </div>

                  <form onSubmit={handleGuardarContacto} className="space-y-4">
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
                            className={`w-36 border rounded-xl px-2.5 py-2.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer shrink-0 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                          >
                            {LISTA_PAISES.map((p) => (
                              <option key={`${p.codigo}-${p.dialCode}`} value={p.dialCode}>
                                {p.nombre} ({p.dialCode})
                              </option>
                            ))}
                          </select>
                          <input 
                            type="tel" 
                            placeholder="Ej. 912345678"
                            value={numeroCelular}
                            onChange={(e) => setNumeroCelular(e.target.value)}
                            className={`flex-1 min-w-0 border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
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
                          className={`w-full border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
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
                            className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
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
                              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 cursor-pointer ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
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
                              className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
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
                            className={`w-full border rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-600 ${esOscuro ? 'bg-slate-950 border-slate-800 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button 
                        type="submit"
                        disabled={guardandoContacto}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm cursor-pointer"
                      >
                        {guardandoContacto ? 'Guardando cambios...' : 'Guardar datos de contacto'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModalContactoAbierto(false)}
                        className={`py-3 px-5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
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

        {/* MODAL 3: CAMBIAR CONTRASEÑA */}
        {modalPasswordAbierto && (
          <div onClick={(e) => { if (e.target === e.currentTarget) { setModalPasswordAbierto(false); setPasswordExito(false); setPasswordError(''); } }} className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div onClick={(e) => e.stopPropagation()} className={`rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl relative my-auto max-h-[90vh] overflow-y-auto border ${esOscuro ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'}`}>
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
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm cursor-pointer"
                      >
                        Actualizar contraseña
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModalPasswordAbierto(false)}
                        className={`py-3 px-4 rounded-xl font-bold text-sm transition-colors cursor-pointer ${esOscuro ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
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
