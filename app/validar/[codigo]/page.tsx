'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { ShieldCheck, CheckCircle2, Award, FileText, QrCode, ArrowLeft, Download, ExternalLink, GraduationCap, Clock, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export default function ValidarCertificadoPage() {
  const params = useParams();
  const codigo = params?.codigo as string;

  const [cargando, setCargando] = useState(true);
  const [certificado, setCertificado] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!codigo) return;
    validarCertificado();
  }, [codigo]);

  const validarCertificado = async () => {
    setCargando(true);
    setError(null);
    try {
      const res = await fetch(`/api/validar/${encodeURIComponent(codigo)}`);
      if (!res.ok) {
        const errData = await res.json();
        setError(errData.error || 'Código de certificado no encontrado o no válido.');
        setCertificado(null);
      } else {
        const data = await res.json();
        setCertificado(data.certificado);
      }
    } catch (e: any) {
      setError('Error de conexión al validar el certificado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header Público de Validación */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-sm">
              EM
            </div>
            <div>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 block uppercase">
                Sistema Oficial de Verificación QR
              </span>
              <h1 className="text-sm sm:text-base font-extrabold text-white">
                INSTITUTO INTERNACIONAL EDUMIN
              </h1>
            </div>
          </div>

          <Link 
            href="/login"
            className="text-xs font-bold text-slate-400 hover:text-white transition flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700"
          >
            <span>Aula Virtual</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {cargando ? (
          <div className="text-center py-20 space-y-4">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-indigo-500 border-t-transparent"></div>
            <p className="text-xs font-mono text-slate-400">Verificando autenticidad en la red de Supabase...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/40 border border-rose-800/60 rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto">
            <div className="size-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 grid place-items-center mx-auto text-rose-400">
              <AlertTriangle className="size-8" />
            </div>
            <h2 className="text-xl font-bold text-rose-200">Certificado No Encontrado</h2>
            <p className="text-xs text-rose-300/80 leading-relaxed">
              El código de verificación <code className="bg-rose-900/60 px-2 py-0.5 rounded font-mono text-rose-200">{codigo}</code> no coincide con ningún registro activo o emitido.
            </p>
          </div>
        ) : certificado && (
          <div className="space-y-6 animate-in fade-in">
            
            {/* Banner de Verificación Exitosa */}
            <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl shadow-emerald-950/20">
              <div className="flex items-center gap-4 text-center sm:text-left">
                <div className="size-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 grid place-items-center shrink-0 text-emerald-400">
                  <ShieldCheck className="size-8" />
                </div>
                <div>
                  <div className="flex items-center justify-center sm:justify-start gap-2">
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30 uppercase tracking-wider">
                      ✓ Documento Oficial Verificado
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white mt-1">
                    Certificado Válido y Registrado en la Plataforma EDUMIN
                  </h2>
                  <p className="text-xs text-emerald-200/80 font-mono mt-0.5">
                    Código de Registro: {certificado.codigo}
                  </p>
                </div>
              </div>

              <div className="shrink-0 text-right sm:border-l border-emerald-800/50 sm:pl-6">
                <span className="text-[10px] text-slate-400 font-mono block">Estado de Habilitación:</span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-1 rounded-xl inline-block mt-0.5">
                  100% Habilitado
                </span>
              </div>
            </div>

            {/* Ficha de Detalles Técnicos del Documento */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Titular del Certificado</span>
                <p className="text-sm font-black text-white truncate">{certificado.estudiante}</p>
                <p className="text-xs text-indigo-400 font-mono">DNI: {certificado.dni}</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Modalidad & Horas</span>
                <p className="text-sm font-bold text-slate-200">{certificado.horas}</p>
                <p className="text-xs text-emerald-400 font-bold">Nota Aprobatoria: {certificado.nota} / 20</p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Fecha de Emisión</span>
                <p className="text-sm font-bold text-slate-200">{certificado.fecha}</p>
                <p className="text-xs text-slate-400 font-mono">Tipo: {certificado.tipo}</p>
              </div>
            </div>

            {/* Previsualización Fiel Máster A4 */}
            <div className="p-4 sm:p-8 bg-slate-900/60 border border-slate-800 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-500" />
                  Previsualización Digital Oficial A4 (Documento Snapshot)
                </h3>

                <button 
                  onClick={() => window.print()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Imprimir / PDF</span>
                </button>
              </div>

              {/* Canvas A4 Certificado */}
              <div className="rounded-2xl border-8 border-amber-600/40 bg-gradient-to-br from-amber-50 via-white to-amber-50/60 p-8 text-center shadow-2xl relative text-slate-900">
                <div className="flex justify-between items-center border-b border-black/10 pb-3 mb-4">
                  <div className="text-left">
                    <span className="text-[9px] font-mono font-bold tracking-widest block opacity-70 text-slate-600">
                      ESCUELA DE POSTGRADO & MINERÍA
                    </span>
                    <h4 className="text-xs font-black text-slate-900">INSTITUTO INTERNACIONAL EDUMIN</h4>
                  </div>
                  <div className="size-8 rounded-full bg-indigo-600/10 border border-indigo-600/30 flex items-center justify-center text-indigo-700 font-black text-xs shrink-0">
                    EM
                  </div>
                </div>

                <span className="text-[10px] uppercase font-bold tracking-widest opacity-80 block text-slate-700">
                  {certificado.tipo === 'DIPLOMA' ? 'DIPLOMA DE ALTA ESPECIALIZACIÓN' : certificado.tipo === 'MODULAR' ? 'CERTIFICADO MODULAR OFICIAL' : 'CERTIFICADO DE ESPECIALIZACIÓN PROFESIONAL'}
                </span>

                <p className="text-[11px] opacity-70 mt-2 text-slate-600">Otorgado a favor de:</p>
                
                <h3 className="text-xl sm:text-2xl font-extrabold font-serif text-slate-900 my-2 underline decoration-amber-500 underline-offset-4">
                  {certificado.estudiante}
                </h3>
                <p className="text-[10px] opacity-60 font-mono text-slate-600">DNI / CE: {certificado.dni}</p>

                <p className="text-xs mt-3 px-4 leading-relaxed opacity-85 text-slate-700">
                  Por haber cumplido y aprobado con excelencia los requisitos del programa oficial de:
                </p>
                <p className="text-sm sm:text-base font-black mt-1 uppercase px-4 text-indigo-950 tracking-wide">
                  {certificado.modulo ? `${certificado.modulo} • ${certificado.programa}` : certificado.programa}
                </p>

                <div className="my-4 flex items-center justify-center gap-4 text-xs font-bold text-slate-800">
                  <span className="px-3 py-1 rounded-lg border border-black/10 bg-black/5">
                    ⏱️ {certificado.horas}
                  </span>
                  <span className="px-3 py-1 rounded-lg border border-black/10 bg-black/5">
                    🏆 Calificación: {certificado.nota} / 20
                  </span>
                </div>

                <div className="mt-6 pt-4 border-t border-black/10 flex justify-between items-end text-[9px] opacity-80 text-slate-700">
                  <div className="text-left font-mono">
                    <p>Fecha de emisión: {certificado.fecha}</p>
                    <p className="font-bold mt-0.5 text-indigo-900">Código: {certificado.codigo}</p>
                  </div>

                  <div className="flex gap-4 sm:gap-6">
                    <div className="text-center">
                      <div className="w-16 sm:w-20 border-b border-black/30 mb-1"></div>
                      <span className="text-[8px] block font-bold text-slate-800">Director Académico</span>
                      <span className="text-[7px] opacity-70 text-slate-500">EDUMIN LMS</span>
                    </div>
                    <div className="text-center">
                      <div className="w-16 sm:w-20 border-b border-black/30 mb-1"></div>
                      <span className="text-[8px] block font-bold text-slate-800">Coordinador General</span>
                      <span className="text-[7px] opacity-70 text-slate-500">EDUMIN LMS</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center p-1 bg-white text-slate-900 rounded-lg border border-slate-200 shadow-sm shrink-0">
                    <QrCode className="w-7 h-7 text-slate-900" />
                    <span className="text-[7px] font-mono mt-0.5 font-bold">VÁLIDO</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      </main>
    </div>
  );
}
