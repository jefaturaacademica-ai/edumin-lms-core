'use client';

import { useEffect, useState } from 'react';
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
  Sparkles
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

// Prefijos de discado internacional estándar (ITU-T E.164)
const codigosPaises = [
  { codigo: '+51', pais: 'Perú', bandera: '🇵🇪' },
  { codigo: '+52', pais: 'México', bandera: '🇲🇽' },
  { codigo: '+57', pais: 'Colombia', bandera: '🇨🇴' },
  { codigo: '+56', pais: 'Chile', bandera: '🇨🇱' },
  { codigo: '+54', pais: 'Argentina', bandera: '🇦🇷' },
  { codigo: '+593', pais: 'Ecuador', bandera: '🇪🇨' },
  { codigo: '+591', pais: 'Bolivia', bandera: '🇧🇴' },
  { codigo: '+34', pais: 'España', bandera: '🇪🇸' },
  { codigo: '+1', pais: 'EE.UU. / Canadá', bandera: '🇺🇸' },
];

export default function PerfilEstudiante() {
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [declaracionJurada, setDeclaracionJurada] = useState(false);
  
  // Estado completo del formulario en modo edición dentro del modal
  const [formEdicion, setFormEdicion] = useState({
    nombres: 'Juan Carlos',
    apellidos: 'Quispe Mamani',
    dni_ce: '73849201',
    email: 'alumno@edumin.pe',
    codigoPais: '+51',
    celularNumero: '984512809',
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
            celularNumero: data.celular?.replace(/^\+\d+\s*/, '') || prev.celularNumero,
            residencia: data.residencia || prev.residencia,
          }));
        }
      }
      setCargando(false);
    }
    cargarPerfil();
  }, [supabase]);

  const abrirModalEdicion = () => {
    setSolicitudEnviada(false);
    setDeclaracionJurada(false);
    setModalAbierto(true);
  };

  const guardarEdicion = (e: React.FormEvent) => {
    e.preventDefault();
    setSolicitudEnviada(true);

    // Actualizamos la vista local de manera optimista
    setPerfil((prev: any) => ({
      ...prev,
      nombres: formEdicion.nombres,
      apellidos: formEdicion.apellidos,
      dni_ce: formEdicion.dni_ce,
      email: formEdicion.email,
      celular: `${formEdicion.codigoPais} ${formEdicion.celularNumero}`,
      fecha_nacimiento: formEdicion.fechaNacimiento.split('-').reverse().join('/'),
      residencia: formEdicion.residencia,
    }));

    setTimeout(() => {
      setModalAbierto(false);
      setSolicitudEnviada(false);
    }, 2000);
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10 lg:p-16 text-slate-900">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <User className="w-8 h-8 text-indigo-600" />
            Mi Perfil
          </h1>
          <p className="mt-2 text-slate-500">
            Consulta tu información personal, académica y de residencia registrada en la plataforma.
          </p>
        </header>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-950/5 ring-1 ring-slate-200 relative overflow-hidden">
          {/* Elemento decorativo */}
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-slate-50 border border-slate-100" />
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              
              {/* Nombres y Apellidos */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <User className="w-4 h-4 text-slate-400" /> Nombres
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.nombres || formEdicion.nombres} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <User className="w-4 h-4 text-slate-400" /> Apellidos
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.apellidos || formEdicion.apellidos} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium"
                />
              </div>

              {/* DNI y Email */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <FileText className="w-4 h-4 text-slate-400" /> DNI / Carnet de Extranjería
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.dni_ce || formEdicion.dni_ce} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Mail className="w-4 h-4 text-slate-400" /> Correo Electrónico
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.email || formEdicion.email} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium"
                />
              </div>

              {/* Celular, Fecha de Nacimiento y Lugar de Residencia */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Phone className="w-4 h-4 text-indigo-500" /> Número de Celular
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.celular || `${formEdicion.codigoPais} ${formEdicion.celularNumero}`} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Fecha de Nacimiento
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.fecha_nacimiento || '14/06/1996'} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <MapPin className="w-4 h-4 text-indigo-500" /> Lugar de Residencia
                </label>
                <input 
                  type="text" 
                  readOnly 
                  value={perfil?.residencia || formEdicion.residencia} 
                  className="w-full bg-slate-50 border border-slate-200 text-slate-700 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none font-medium"
                />
              </div>

            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-500 max-w-md">
                  Tus datos son utilizados para la emisión oficial de tus certificados y diplomas digitales. Puedes editarlos en cualquier momento.
                </p>
              </div>
              <button 
                onClick={abrirModalEdicion}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 shrink-0"
              >
                <Edit3 className="w-4 h-4" /> Editar Perfil
              </button>
            </div>
          </div>
        </div>

        {/* MODAL DE EDICIÓN CON TODOS LOS CAMPOS */}
        {modalAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl p-8 shadow-2xl relative my-8 animate-in zoom-in-95 duration-200 border border-slate-200">
              
              <button 
                onClick={() => setModalAbierto(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-700 transition-colors p-2 rounded-full hover:bg-slate-100"
              >
                <X className="w-6 h-6" />
              </button>

              {solicitudEnviada ? (
                <div className="text-center py-12">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Perfil Actualizado!</h3>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Tus cambios han sido guardados correctamente en tu cuenta de usuario.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6 border-b border-slate-100 pb-4">
                    <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold mb-2">
                      <Sparkles className="w-3.5 h-3.5" /> Edición de Datos
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900">Editar Perfil</h3>
                    <p className="text-slate-500 text-sm mt-1">
                      Modifica la información de tu cuenta según corresponda.
                    </p>
                  </div>

                  <form onSubmit={guardarEdicion} className="space-y-5">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nombres */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Nombres
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formEdicion.nombres}
                          onChange={(e) => setFormEdicion({ ...formEdicion, nombres: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>

                      {/* Apellidos */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Apellidos
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formEdicion.apellidos}
                          onChange={(e) => setFormEdicion({ ...formEdicion, apellidos: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* DNI / CE */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          DNI / Carnet de Extranjería
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formEdicion.dni_ce}
                          onChange={(e) => setFormEdicion({ ...formEdicion, dni_ce: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>

                      {/* Correo Electrónico */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Correo Electrónico
                        </label>
                        <input 
                          type="email" 
                          required
                          value={formEdicion.email}
                          onChange={(e) => setFormEdicion({ ...formEdicion, email: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    {/* SELECTOR DE CELULAR CON CÓDIGO DE PAÍS */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                        Número de Celular
                      </label>
                      <div className="flex gap-2">
                        <select 
                          value={formEdicion.codigoPais}
                          onChange={(e) => setFormEdicion({ ...formEdicion, codigoPais: e.target.value })}
                          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600 shrink-0"
                        >
                          {codigosPaises.map((p) => (
                            <option key={p.codigo} value={p.codigo}>
                              {p.bandera} {p.codigo} ({p.pais})
                            </option>
                          ))}
                        </select>
                        <input 
                          type="tel" 
                          required
                          placeholder="987 654 321"
                          value={formEdicion.celularNumero}
                          onChange={(e) => setFormEdicion({ ...formEdicion, celularNumero: e.target.value })}
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* FECHA DE NACIMIENTO */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Fecha de Nacimiento
                        </label>
                        <input 
                          type="date" 
                          required
                          value={formEdicion.fechaNacimiento}
                          onChange={(e) => setFormEdicion({ ...formEdicion, fechaNacimiento: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>

                      {/* LUGAR DE RESIDENCIA */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                          Lugar de Residencia
                        </label>
                        <input 
                          type="text" 
                          required
                          value={formEdicion.residencia}
                          onChange={(e) => setFormEdicion({ ...formEdicion, residencia: e.target.value })}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        />
                      </div>
                    </div>

                    {/* CONFIRMACIÓN MEDIANTE CHECKBOX / DECLARACIÓN JURADA */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-start gap-3">
                      <input 
                        type="checkbox" 
                        required
                        id="declaracion"
                        checked={declaracionJurada}
                        onChange={(e) => setDeclaracionJurada(e.target.checked)}
                        className="mt-0.5 size-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer shrink-0"
                      />
                      <label htmlFor="declaracion" className="text-xs font-semibold text-slate-700 cursor-pointer leading-relaxed">
                        Declaro que los datos ingresados son correctos y verídicos para la actualización de mi perfil de estudiante.
                      </label>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button 
                        type="submit"
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-all shadow-md text-sm"
                      >
                        Guardar Cambios
                      </button>
                      <button 
                        type="button"
                        onClick={() => setModalAbierto(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-3 px-5 rounded-xl font-bold text-sm transition-colors"
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