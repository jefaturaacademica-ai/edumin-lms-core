'use client';

import { useEffect, useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  FileText, 
  ShieldAlert, 
  CheckCircle, 
  UploadCloud, 
  X,
  CreditCard
} from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

export default function PerfilEstudiante() {
  const [perfil, setPerfil] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  
  // Estado del formulario del modal
  const [datoAModificar, setDatoAModificar] = useState('Nombres y Apellidos');
  const [motivo, setMotivo] = useState('');

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
        setPerfil(data);
      }
      setCargando(false);
    }
    cargarPerfil();
  }, [supabase]);

  const enviarSolicitud = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí a futuro se insertará en una tabla "solicitudes_actualizacion"
    setSolicitudEnviada(true);
    setTimeout(() => {
      setModalAbierto(false);
      setSolicitudEnviada(false);
      setMotivo('');
    }, 3000);
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
            Consulta tu información personal y académica registrada en la plataforma.
          </p>
        </header>

        <div className="bg-white rounded-3xl p-8 shadow-xl shadow-slate-950/5 ring-1 ring-slate-200 relative overflow-hidden">
          {/* Elemento decorativo */}
          <div className="absolute -right-20 -top-20 size-64 rounded-full bg-slate-50 border border-slate-100" />
          
          <div className="relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              
              {/* Grupo de Inputs - Solo Lectura */}
              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <User className="w-4 h-4 text-slate-400" /> Nombres
                  </label>
                  <input 
                    type="text" 
                    readOnly 
                    value={perfil?.nombres || ''} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <User className="w-4 h-4 text-slate-400" /> Apellidos
                  </label>
                  <input 
                    type="text" 
                    readOnly 
                    value={perfil?.apellidos || ''} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <FileText className="w-4 h-4 text-slate-400" /> DNI / Carnet de Extranjería
                  </label>
                  <input 
                    type="text" 
                    readOnly 
                    value={perfil?.dni_ce || ''} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                    <Mail className="w-4 h-4 text-slate-400" /> Correo Electrónico
                  </label>
                  <input 
                    type="text" 
                    readOnly 
                    value={perfil?.email || ''} 
                    className="w-full bg-slate-50 border border-slate-200 text-slate-500 rounded-xl px-4 py-3 cursor-not-allowed focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-500 max-w-md">
                  Por medidas de seguridad y para la correcta emisión de tus certificados, estos datos están bloqueados. Si detectas un error, solicita una modificación.
                </p>
              </div>
              <button 
                onClick={() => setModalAbierto(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-xl font-medium transition-colors shrink-0"
              >
                Solicitar Actualización
              </button>
            </div>
          </div>
        </div>

        {/* Modal de Solicitud */}
        {modalAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl relative animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setModalAbierto(false)}
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {solicitudEnviada ? (
                <div className="text-center py-10">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Solicitud Enviada</h3>
                  <p className="text-slate-500">Un administrador revisará tu sustento y actualizará tu perfil en breve.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Actualizar Datos</h3>
                  <p className="text-slate-500 mb-6 text-sm">
                    Indica qué dato necesitas corregir y sube una foto de tu DNI como sustento.
                  </p>

                  <form onSubmit={enviarSolicitud} className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Dato a modificar</label>
                      <select 
                        value={datoAModificar}
                        onChange={(e) => setDatoAModificar(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                      >
                        <option>Nombres y Apellidos</option>
                        <option>DNI / Carnet de Extranjería</option>
                        <option>Correo Electrónico</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Sustento (Opcional por ahora)</label>
                      <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:bg-indigo-50 transition-colors cursor-pointer">
                        <UploadCloud className="w-8 h-8 mb-2 text-indigo-500" />
                        <span className="text-sm font-medium">Haz clic para subir imagen de tu DNI</span>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-bold transition-colors mt-4"
                    >
                      Enviar a Administración
                    </button>
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