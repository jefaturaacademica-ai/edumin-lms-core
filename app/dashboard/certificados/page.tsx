'use client';

import { useState } from 'react';
import { Award, FileText, Download, CheckCircle, AlertTriangle, ShieldCheck, Globe } from 'lucide-react';

export default function CertificadosPage() {
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoCertificacion, setTipoCertificacion] = useState<'CIP' | 'MIAMI'>('CIP');
  const [terminosAceptados, setTerminosAceptados] = useState(false);
  const [solicitudEnviada, setSolicitudEnviada] = useState(false);
  const [filtroDiplomado, setFiltroDiplomado] = useState('Todos');

  // Simulando perfil de usuario (Paquete ILIMITADO o FULL)
  const paqueteUsuario = 'ILIMITADO'; // Puede cambiar a 'FULL' o 'COMPLETO' para probar
  const diplomadosCompletados = [
    'Seguridad y Salud Ocupacional en Minería',
    'Gestión Logística y Almacenes en Minería'
  ];
  const [diplomadoSeleccionado, setDiplomadoSeleccionado] = useState(diplomadosCompletados[0]);

  const certificadosModulares = [
    { id: 1, modulo: 'Módulo 1: Fundamentos de Liderazgo Minero', diplomado: 'Gestión Estratégica en Minería', nota: 16, fecha: '12/03/2026' },
    { id: 2, modulo: 'Módulo 2: Gestión de Equipos de Alto Rendimiento', diplomado: 'Gestión Estratégica en Minería', nota: 18, fecha: '28/04/2026' },
    { id: 3, modulo: 'Módulo 1: Marco Normativo y Ley 29783', diplomado: 'Seguridad y Salud Ocupacional', nota: 15, fecha: '10/01/2026' },
  ];

  const certificadosFiltrados = filtroDiplomado === 'Todos' 
    ? certificadosModulares 
    : certificadosModulares.filter(c => c.diplomado === filtroDiplomado);

  const abrirModal = (tipo: 'CIP' | 'MIAMI') => {
    setTipoCertificacion(tipo);
    setTerminosAceptados(false);
    setSolicitudEnviada(false);
    setModalAbierto(true);
  };

  const enviarSolicitud = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminosAceptados) return;
    setSolicitudEnviada(true);
    setTimeout(() => {
      setModalAbierto(false);
      setSolicitudEnviada(false);
    }, 3000);
  };

  return (
    <main className="min-h-screen bg-slate-50 p-6 sm:p-10 lg:p-16 text-slate-900">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Award className="w-8 h-8 text-indigo-600" />
            Muro de Certificados y Logros
          </h1>
          <p className="mt-2 text-slate-500">
            Consulta tus calificaciones modulares, descarga tus diplomas oficiales y gestiona tus beneficios profesionales.
          </p>
        </header>

        {/* SECCIÓN 1: CERTIFICADOS MODULARES */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-slate-900">Certificados Modulares (PAE)</h3>
              <p className="text-slate-500 text-sm">Descarga inmediata de tus programas de alta especialización aprobados (Nota &gt;= 12)[cite: 1].</p>
            </div>
            
            <select 
              value={filtroDiplomado}
              onChange={(e) => setFiltroDiplomado(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
            >
              <option value="Todos">Todos los diplomados</option>
              <option value="Gestión Estratégica en Minería">Gestión Estratégica en Minería</option>
              <option value="Seguridad y Salud Ocupacional">Seguridad y Salud Ocupacional</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Nombre del Módulo</th>
                  <th className="py-3 px-4">Diplomado</th>
                  <th className="py-3 px-4 text-center">Nota</th>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {certificadosFiltrados.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-4 font-semibold text-slate-800">{cert.modulo}</td>
                    <td className="py-4 px-4 text-slate-500 text-xs">{cert.diplomado}</td>
                    <td className="py-4 px-4 text-center">
                      <span className="bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-lg text-xs">
                        {cert.nota}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-slate-500 text-xs">{cert.fecha}</td>
                    <td className="py-4 px-4 text-right">
                      <button className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors">
                        <Download className="w-3.5 h-3.5" /> Descargar PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECCIÓN 2: DIPLOMAS GENERALES EDUMIN */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200 mb-10">
          <h3 className="text-xl font-bold text-slate-900 mb-2">Diplomas Generales EDUMIN y Registro Académico</h3>
          <p className="text-slate-500 text-sm mb-6">Se desbloquean automáticamente al certificar el 100% de los módulos de tu programa[cite: 1].</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="border border-slate-200 rounded-3xl p-6 bg-slate-50/50 relative overflow-hidden flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full">En Progreso</span>
                  <span className="text-xs text-slate-400">2 de 3 Módulos</span>
                </div>
                <h4 className="font-bold text-slate-900 text-base">Gestión Estratégica y Liderazgo en Minería</h4>
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-600 mb-1">
                    <span>Progreso general</span>
                    <span>66%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full w-2/3"></div>
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-6 italic">Te falta aprobar 1 módulo para obtener tu diploma general[cite: 1].</p>
            </div>

            <div className="border border-indigo-200 rounded-3xl p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white relative overflow-hidden flex flex-col justify-between shadow-md">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-[11px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Completado 100%
                  </span>
                </div>
                <h4 className="font-bold text-white text-base">Seguridad y Salud Ocupacional en Minería</h4>
                <p className="text-xs text-indigo-200 mt-2">Promedio final obtenido: <strong className="text-white">16.5 (Aprobado)</strong></p>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <button className="flex-1 bg-white hover:bg-indigo-50 text-indigo-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-2">
                  <Download className="w-3.5 h-3.5" /> Descargar Diploma
                </button>
                <button className="bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition-colors border border-white/20 flex items-center justify-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" /> Registro Académico
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SECCIÓN 3: BENEFICIOS PREMIUM (CIP Y MIAMI) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Tarjeta CIP */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">Beneficio Nacional</span>
              <h3 className="text-xl font-bold mt-1">Colegio de Ingenieros del Perú (CIP)</h3>
              <p className="text-slate-300 text-sm mt-2">
                Certificación oficial avalada por el CIP para tu diplomado finalizado[cite: 1].
              </p>
            </div>
            <button
              onClick={() => abrirModal('CIP')}
              className="mt-6 w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <ShieldCheck className="w-4 h-4" /> Reclamar Certificación CIP
            </button>
          </div>

          {/* Tarjeta MIAMI */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-300">Beneficio Internacional</span>
              <h3 className="text-xl font-bold mt-1">San Ignacio University (Miami, FL)</h3>
              <p className="text-slate-300 text-sm mt-2">
                Certificación internacional con validez global en el programa de tu elección[cite: 1].
              </p>
            </div>
            <button
              onClick={() => abrirModal('MIAMI')}
              className="mt-6 w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 text-sm"
            >
              <Globe className="w-4 h-4" /> Reclamar Certificación MIAMI
            </button>
          </div>

        </div>

        {/* MODAL DE VALIDACIÓN UNIFICADO (CIP / MIAMI) */}
        {modalAbierto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white text-slate-900 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative">
              <button 
                onClick={() => setModalAbierto(false)} 
                className="absolute right-6 top-6 text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>

              {solicitudEnviada ? (
                <div className="text-center py-8">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-2">Solicitud de {tipoCertificacion} Enviada</h3>
                  <p className="text-slate-500 text-sm">Tus datos de verificación han sido ingresados al sistema para su trámite institucional[cite: 1].</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-xl bg-amber-100 text-amber-600 grid place-items-center shrink-0">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">Reclamar {tipoCertificacion === 'CIP' ? 'Certificación CIP' : 'Certificación MIAMI'}</h3>
                      <p className="text-xs text-amber-600 font-semibold">Verifica tu información antes de enviar el formato.</p>
                    </div>
                  </div>

                  <form onSubmit={enviarSolicitud} className="space-y-4 mt-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombres y Apellidos</label>
                      <input 
                        type="text" 
                        readOnly 
                        value="Roger Sanalea" 
                        className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 cursor-not-allowed"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Teléfono</label>
                        <input 
                          type="text" 
                          readOnly 
                          value="900000005" 
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo Electrónico</label>
                        <input 
                          type="text" 
                          readOnly 
                          value="superadmin@edumin.pe" 
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 cursor-not-allowed"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Diplomado Aplicado</label>
                      {paqueteUsuario === 'ILIMITADO' ? (
                        <select
                          value={diplomadoSeleccionado}
                          onChange={(e) => setDiplomadoSeleccionado(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                        >
                          {diplomadosCompletados.map((dip) => (
                            <option key={dip} value={dip}>{dip}</option>
                          ))}
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          readOnly 
                          value={diplomadosCompletados[0]} 
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-600 cursor-not-allowed"
                        />
                      )}
                      <p className="text-[11px] text-slate-400 mt-1">
                        {paqueteUsuario === 'ILIMITADO' ? "Paquete Ilimitado: Elige a qué diplomado deseas aplicar este beneficio[cite: 1]." : "Paquete Regular: Aplica al diplomado principal de tu cuenta[cite: 1]."}
                      </p>
                    </div>

                    <div className="pt-2">
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input 
                          type="checkbox" 
                          required
                          checked={terminosAceptados}
                          onChange={(e) => setTerminosAceptados(e.target.checked)}
                          className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                        />
                        <span className="text-xs text-slate-600">
                          Confirmo que mis datos están escritos correctamente (incluyendo tildes) y asumo la responsabilidad sobre la emisión institucional[cite: 1].
                        </span>
                      </label>
                    </div>

                    <button 
                      type="submit"
                      disabled={!terminosAceptados}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-md mt-2 text-sm"
                    >
                      Enviar Solicitud a Secretaría
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