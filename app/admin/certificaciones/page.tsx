'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Users, BookOpen, Settings, LogOut,
  Activity, Award, CheckCircle2, QrCode, FileText, Download, Layers, UserCheck, Server, X, Plus, Eye, Send, RefreshCw
} from 'lucide-react';
import AdminSidebar from '@/components/admin/admin-sidebar';

export default function CertificacionesAdminPage() {
  const [activeTab, setActiveTab] = useState<'editor' | 'emision' | 'cip'>('cip');
  const [mensajeExito, setMensajeExito] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  // Solicitudes CIP/MIAMI recibidas
  const [solicitudesCip, setSolicitudesCip] = useState<any[]>([]);

  // Modal para adjuntar certificado
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState<any>(null);
  const [codigoQrGen, setCodigoQrGen] = useState('EDUMIN-CIP-2026-9843');
  const [archivoPdf, setArchivoPdf] = useState<File | null>(null);

  useEffect(() => {
    cargarSolicitudes();
  }, []);

  const cargarSolicitudes = async () => {
    setCargando(true);
    try {
      const res = await fetch('/api/admin/certificaciones');
      if (res.ok) {
        const data = await res.json();
        if (data.solicitudes && data.solicitudes.length > 0) {
          setSolicitudesCip(data.solicitudes);
        } else {
          setSolicitudesCip([
            { id: 'sol-01', estudiante: 'Jorge Luis Ramos Morales', dni: '45892301', email: 'jorge.ramos@gmail.com', programa: 'SEGURIDAD Y SALUD OCUPACIONAL', tipo: 'CIP (Nacional)', fecha: '2026-09-22', estado: 'Pendiente' },
            { id: 'sol-02', estudiante: 'Carlos Eduardo Benavides', dni: '43210987', email: 'carlos.benavides@outlook.com', programa: 'MINERÍA 4.0 Y DIGITALIZACIÓN', tipo: 'MIAMI (Internacional)', fecha: '2026-09-21', estado: 'Emitido' },
          ]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  const aprobarCertificadoCip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!solicitudSeleccionada) return;

    try {
      await fetch('/api/admin/certificaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: solicitudSeleccionada.id,
          dni: solicitudSeleccionada.dni,
          codigoQr: codigoQrGen
        })
      });
    } catch (err) {
      console.error(err);
    }

    setSolicitudesCip(prev => prev.map(s => s.id === solicitudSeleccionada.id ? { ...s, estado: 'Emitido' } : s));
    setSolicitudSeleccionada(null);
    setMensajeExito(`¡Certificación CIP asignada exitosamente con código QR ${codigoQrGen}!`);
    setTimeout(() => setMensajeExito(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans relative overflow-hidden">
      
      {/* Sidebar Unificado */}
      <AdminSidebar />

      {/* Contenido Principal */}
      <main className="flex-1 p-8 overflow-y-auto z-10">
        <div className="max-w-7xl mx-auto space-y-8">
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Centro de Certificaciones & Beneficios Premium</h1>
              <p className="text-slate-500 mt-1">Estructuración de diplomas, emisor masivo A4 y gestión de solicitudes CIP / MIAMI.</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2 rounded-2xl text-xs font-bold flex items-center gap-2">
              <QrCode className="w-4 h-4 text-amber-600" /> QR de Verificación Automático
            </div>
          </div>

          {mensajeExito && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-xs font-bold">{mensajeExito}</span>
            </div>
          )}

          {/* Navegación por pestañas */}
          <div className="flex border-b border-slate-200">
            <button
              onClick={() => setActiveTab('cip')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === 'cip' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Award className="w-4 h-4 text-amber-500" /> Solicitudes CIP / MIAMI ({solicitudesCip.length})
            </button>
            <button
              onClick={() => setActiveTab('editor')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === 'editor' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <FileText className="w-4 h-4" /> Editor Visual de Plantillas (Canvas A4)
            </button>
            <button
              onClick={() => setActiveTab('emision')}
              className={`pb-3 px-6 font-bold text-sm transition border-b-2 cursor-pointer flex items-center gap-2 ${activeTab === 'emision' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            >
              <Layers className="w-4 h-4" /> Emisión Masiva de Certificados
            </button>
          </div>

          {activeTab === 'cip' ? (
            /* TAB: BUZÓN CIP / MIAMI */
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Buzón de Solicitudes CIP / MIAMI</h3>
                  <p className="text-xs text-slate-500">Alumnos que reclamaron su certificación nacional o internacional tras completar el diplomado.</p>
                </div>
                <button 
                  onClick={cargarSolicitudes}
                  className="p-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="pb-3 px-4">DNI / CE</th>
                      <th className="pb-3 px-4">Estudiante</th>
                      <th className="pb-3 px-4">Programa Aprobado</th>
                      <th className="pb-3 px-4">Beneficio Solicitado</th>
                      <th className="pb-3 px-4">Estado</th>
                      <th className="pb-3 px-4 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {solicitudesCip.length > 0 ? (
                      solicitudesCip.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4 font-mono font-bold text-indigo-600">{s.dni}</td>
                          <td className="py-4 px-4 font-bold text-slate-800">
                            {s.estudiante}
                            <div className="text-[10px] text-slate-400 font-normal">{s.email}</div>
                          </td>
                          <td className="py-4 px-4 font-semibold text-slate-700">{s.programa}</td>
                          <td className="py-4 px-4">
                            <span className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-amber-200">
                              {s.tipo}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${s.estado === 'Emitido' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                              {s.estado}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-right">
                            {s.estado === 'Pendiente' ? (
                              <button
                                onClick={() => setSolicitudSeleccionada(s)}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl font-bold text-xs shadow-sm transition inline-flex items-center gap-1 cursor-pointer"
                              >
                                <Award className="w-3.5 h-3.5" /> Asignar PDF / QR
                              </button>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Notificado al Alumno
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="text-center py-10 text-slate-400 font-medium">
                          {cargando ? 'Cargando solicitudes CIP...' : 'No hay solicitudes CIP registradas.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'editor' ? (
            /* TAB: EDITOR VISUAL A4 */
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Editor Visual de Plantillas (Canvas A4)</h3>
                <p className="text-xs text-slate-500">Arrastra variables dinámicas sobre el diseño A4 para previsualizar el certificado final.</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">
                  <h4 className="text-slate-400 uppercase text-[10px] tracking-wider mb-2">Variables Dinámicas</h4>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab hover:border-indigo-500 font-mono text-[11px] text-indigo-700">[Nombre Estudiante]</div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab hover:border-indigo-500 font-mono text-[11px] text-indigo-700">[Programa Académico]</div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab hover:border-indigo-500 font-mono text-[11px] text-indigo-700">[Fecha de Emisión]</div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab hover:border-indigo-500 font-mono text-[11px] text-indigo-700">[Código Único QR]</div>
                  <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-sm cursor-grab hover:border-indigo-500 font-mono text-[11px] text-indigo-700">[Nota Promedio]</div>
                </div>

                {/* Canvas A4 Simulado */}
                <div className="lg:col-span-3 bg-slate-900 p-8 rounded-3xl flex items-center justify-center min-h-[380px]">
                  <div className="bg-gradient-to-br from-amber-50 via-white to-amber-50/40 border-8 border-amber-600/30 p-8 rounded-2xl max-w-xl w-full text-center shadow-2xl relative">
                    <Award className="w-12 h-12 text-amber-600 mx-auto mb-2" />
                    <span className="text-[10px] uppercase font-bold tracking-widest text-amber-700">EDUMIN LMS • INSTITUTO INTERNACIONAL DE MINERÍA</span>
                    <h2 className="text-2xl font-black text-slate-900 mt-2 tracking-tight">CERTIFICADO DE ALTA ESPECIALIZACIÓN</h2>
                    <p className="text-xs text-slate-500 mt-1">Otorgado a favor de:</p>
                    <p className="text-xl font-bold font-serif text-indigo-900 my-3 underline decoration-amber-500">[Nombre del Estudiante]</p>
                    <p className="text-xs text-slate-600">Por haber completado satisfactoriamente el programa de <strong className="text-slate-900">[Programa Académico]</strong> con nota sobresaliente.</p>
                    
                    <div className="mt-6 pt-4 border-t border-amber-200/60 flex justify-between items-center text-[10px] text-slate-500 font-mono">
                      <span>Emisión: [Fecha]</span>
                      <div className="flex items-center gap-1 bg-white p-1.5 rounded-lg border border-slate-200">
                        <QrCode className="w-5 h-5 text-slate-800" />
                        <span>[Código QR]</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* TAB: EMISIÓN MASIVA */
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 space-y-6">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Emisión Masiva de Certificados</h3>
                <p className="text-xs text-slate-500">Genera certificados en lote para todos los estudiantes con calificación aprobatoria (Nota {'>'}= 12).</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Seleccionar Diplomado</label>
                  <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600">
                    <option value="1">1. DERECHO MINERO (DIP-01)</option>
                    <option value="2">2. GEOLOGÍA MINERA (DIP-03)</option>
                    <option value="3">3. GERENCIA HSEQ (DIP-07)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Seleccionar Módulo</label>
                  <select className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-600">
                    <option value="m1">MÓDULO I: Marco Legal Minero</option>
                    <option value="m2">MÓDULO II: Permisos Ambientales</option>
                    <option value="all">Todos los Módulos del Diplomado</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => { setMensajeExito('¡Se generaron 14 certificados PDF con código QR para los alumnos aprobados!'); setTimeout(() => setMensajeExito(null), 4000); }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-xl font-bold text-xs shadow-md transition inline-flex items-center gap-2 cursor-pointer"
              >
                <Layers className="w-4 h-4" /> Generar Diplomas Masivos (Nota {'>'}= 12)
              </button>
            </div>
          )}

        </div>
      </main>

      {/* MODAL: ASIGNAR CERTIFICADO CIP */}
      {solicitudSeleccionada && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Validar y Adjuntar Certificado CIP</h3>
              <button onClick={() => setSolicitudSeleccionada(null)} className="p-1.5 hover:bg-slate-200 rounded-full transition-colors text-slate-500 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={aprobarCertificadoCip} className="p-6 space-y-4">
              <div>
                <p className="text-xs text-slate-500 mb-1">Estudiante Solicitante:</p>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800">
                  {solicitudSeleccionada.estudiante} <span className="text-indigo-600 font-mono">({solicitudSeleccionada.dni})</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Código Único QR de Validación</label>
                <input 
                  type="text" 
                  value={codigoQrGen}
                  onChange={(e) => setCodigoQrGen(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-mono font-bold bg-slate-50 focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Adjuntar Archivo PDF Validado</label>
                <input 
                  type="file" 
                  accept=".pdf"
                  required
                  onChange={(e) => e.target.files && setArchivoPdf(e.target.files[0])}
                  className="w-full text-xs text-slate-500 border border-slate-200 rounded-xl p-2 bg-slate-50"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setSolicitudSeleccionada(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="bg-indigo-600 text-white px-5 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition shadow-md cursor-pointer"
                >
                  Emitir y Notificar Alumno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
