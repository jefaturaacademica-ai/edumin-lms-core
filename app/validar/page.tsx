'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Search, 
  ShieldCheck, 
  ArrowLeft, 
  BookOpen, 
  Calendar, 
  UserCheck, 
  GraduationCap, 
  Clock, 
  AlertCircle,
  QrCode as QrIcon
} from 'lucide-react';
import Link from 'next/link';
import AvanzaCertificateRenderer from '@/components/certificates/AvanzaCertificateRenderer';
import { 
  encriptarTokenCertificado, 
  desencriptarTokenCertificado, 
  normalizarCodigoCertificado 
} from '@/lib/utils/certificateUtils';

function ValidarCertificadoContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Parámetros de URL seguros (?v=... o ?token=... o ?codigo=...)
  const tokenParam = searchParams.get('v') || searchParams.get('token');
  const codigoParam = searchParams.get('codigo') || searchParams.get('c');
  const tieneParametro = Boolean(tokenParam || codigoParam);

  const [codigoInput, setCodigoInput] = useState('');
  const [errorInput, setErrorInput] = useState<string | null>(null);

  // Estados de consulta y resultado inicializados inmediatamente según la URL
  const [cargando, setCargando] = useState(tieneParametro);
  const [certificado, setCertificado] = useState<any>(null);
  const [errorConsulta, setErrorConsulta] = useState<string | null>(null);
  const [esEscaneoQr, setEsEscaneoQr] = useState(Boolean(tokenParam));

  useEffect(() => {
    document.title = 'Validación de certificado | EDUMIN';

    if (tokenParam) {
      setEsEscaneoQr(true);
      const codigoReal = desencriptarTokenCertificado(tokenParam);
      if (!codigoReal) {
        setErrorConsulta('El enlace o código QR de verificación es inválido o ha sido alterado.');
        setCertificado(null);
        setCargando(false);
        return;
      }
      ejecutarValidacion(codigoReal);
    } else if (codigoParam) {
      setEsEscaneoQr(false);
      ejecutarValidacion(normalizarCodigoCertificado(codigoParam));
    } else {
      setCertificado(null);
      setErrorConsulta(null);
      setCargando(false);
      setEsEscaneoQr(false);
    }
  }, [tokenParam, codigoParam]);

  const ejecutarValidacion = async (codigoABuscar: string) => {
    setCargando(true);
    setErrorConsulta(null);
    try {
      const res = await fetch(`/api/validar/${encodeURIComponent(codigoABuscar)}`);
      if (!res.ok) {
        const errData = await res.json();
        setErrorConsulta(errData.error || 'Código de certificado no válido o no encontrado.');
        setCertificado(null);
      } else {
        const data = await res.json();
        setCertificado(data.certificado);
      }
    } catch {
      setErrorConsulta('Error de conexión al validar el certificado.');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmitBusqueda = (e: React.FormEvent) => {
    e.preventDefault();
    const codigoLimpio = normalizarCodigoCertificado(codigoInput);
    if (!codigoLimpio) {
      setErrorInput('Por favor, ingresa el código del certificado.');
      return;
    }
    setErrorInput(null);
    setCargando(true);
    const tokenSeguro = encriptarTokenCertificado(codigoLimpio);
    router.push(`/validar?v=${encodeURIComponent(tokenSeguro)}`);
  };

  const handleLimpiarBusqueda = () => {
    setCodigoInput('');
    setCertificado(null);
    setErrorConsulta(null);
    setCargando(false);
    setEsEscaneoQr(false);
    router.push('/validar');
  };

  // Si hay parámetro en la URL y aún no hay respuesta o está cargando, NUNCA mostrar el buscador
  const estaVerificando = cargando || (tieneParametro && !certificado && !errorConsulta);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased">
      {/* Barra de Encabezado Oscura */}
      <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/validar" onClick={handleLimpiarBusqueda} className="flex items-center gap-3 hover:opacity-90 transition">
            <img
              src="/logo-blanco.png"
              alt="EDUMIN"
              className="h-8 sm:h-9 w-auto object-contain"
            />
            <div className="h-5 w-px bg-slate-700 hidden sm:block" />
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
              Sistema oficial de verificación
            </h1>
          </Link>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 flex flex-col justify-center">
        
        {estaVerificando ? (
          /* Estado de Verificación Inmediata al Escanear QR o Consultar */
          <div className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 text-center space-y-5 max-w-md mx-auto shadow-sm my-auto w-full animate-in fade-in duration-150">
            <div className="relative size-16 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border-4 border-indigo-200 animate-ping opacity-60"></div>
              <div className="size-16 rounded-full bg-indigo-50 border-2 border-indigo-200 grid place-items-center text-indigo-600 relative z-10 shadow-xs">
                <ShieldCheck className="w-8 h-8 animate-pulse text-indigo-600" />
              </div>
            </div>

            <div className="space-y-1.5">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {esEscaneoQr ? 'Validando código QR oficial' : 'Verificando documento oficial'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                {esEscaneoQr 
                  ? 'Comprobando firma digital y autenticidad del registro en EDUMIN...' 
                  : 'Consultando registro en la base de datos central...'}
              </p>
            </div>

            <div className="pt-1 flex justify-center items-center gap-1.5">
              <div className="size-2 rounded-full bg-indigo-600 animate-bounce"></div>
              <div className="size-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.15s]"></div>
              <div className="size-2 rounded-full bg-indigo-600 animate-bounce [animation-delay:0.3s]"></div>
            </div>
          </div>
        ) : errorConsulta ? (
          /* Estado de Error / Código no encontrado o token alterado */
          <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 text-center space-y-5 max-w-lg mx-auto shadow-sm my-auto w-full">
            <div className="size-12 rounded-full bg-rose-100 text-rose-600 grid place-items-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Certificado no válido
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {errorConsulta}
              </p>
            </div>

            {/* Reintentar ingresando el código manualmente */}
            <form onSubmit={handleSubmitBusqueda} className="space-y-3 pt-2">
              <div className="relative">
                <input
                  type="text"
                  value={codigoInput}
                  onChange={(e) => {
                    setCodigoInput(e.target.value.toUpperCase());
                    if (errorInput) setErrorInput(null);
                  }}
                  placeholder="Código del certificado"
                  className="w-full bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-mono text-slate-900 outline-none uppercase"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Search className="w-4 h-4" />
                <span>Verificar</span>
              </button>
            </form>

            <div>
              <button
                onClick={handleLimpiarBusqueda}
                className="text-xs text-slate-500 hover:text-slate-800 transition font-medium inline-flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a la búsqueda principal</span>
              </button>
            </div>
          </div>
        ) : certificado ? (
          /* Estado Válido: Muestra el Certificado Acreditado */
          <div className="space-y-5 my-auto w-full animate-in fade-in duration-200">
            
            {/* Banner de Verificación con el ÚNICO botón de "Validar otro certificado" */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
              <div className="flex items-center gap-3.5 text-center sm:text-left">
                <div className="size-11 rounded-xl bg-emerald-100 border border-emerald-300 grid place-items-center shrink-0 text-emerald-700">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider mb-1">
                    {esEscaneoQr && <QrIcon className="w-3 h-3 text-emerald-700" />}
                    <span>✓ Documento oficial verificado</span>
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    Certificado auténtico y registrado en EDUMIN
                  </h2>
                  <p className="text-xs text-slate-600 font-mono">
                    Código de registro: <strong className="text-slate-900">{certificado.codigo}</strong>
                  </p>
                </div>
              </div>

              {/* Botón único de Validar otro certificado */}
              <button
                onClick={handleLimpiarBusqueda}
                className="text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white border border-slate-200 hover:border-slate-300 px-4 py-2.5 rounded-xl transition shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-indigo-600" />
                <span>Validar otro certificado</span>
              </button>
            </div>

            {/* Disposición en 2 Columnas para Desktop (Datos a la izquierda + Certificado a la derecha) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* Columna Izquierda: Datos del Certificado */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-sm space-y-3.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 pb-2.5">
                  Datos del certificado
                </h3>

                {/* Estudiante */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Estudiante acreditado</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{certificado.estudiante}</p>
                  <p className="text-xs font-mono text-slate-500">DNI / CE: {certificado.dni}</p>
                </div>

                {/* Programa / Diplomado */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Programa académico</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{certificado.programa}</p>
                  {certificado.modulo && (
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">
                      Módulo: <span className="text-slate-700">{certificado.modulo}</span>
                    </p>
                  )}
                </div>

                {/* Horas y Calificación en 2 columnas internas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                      <Clock className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Horas lectivas</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-slate-900">{certificado.horas}</p>
                  </div>

                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Nota final</span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-emerald-700">{certificado.nota} / 20</p>
                  </div>
                </div>

                {/* Fecha y Tipo */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Emisión y tipo</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">{certificado.fecha}</p>
                  <p className="text-xs text-slate-500">Tipo: {certificado.tipo}</p>
                </div>
              </div>

              {/* Columna Derecha: Certificado Oficial Emitido (Directo, sin textos de previsualización) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-3 sm:p-5 shadow-sm">
                <div 
                  className="bg-slate-100/70 border border-slate-200 rounded-xl p-2 sm:p-4 flex items-center justify-center select-none relative overflow-hidden"
                  onContextMenu={(e) => e.preventDefault()}
                  onDragStart={(e) => e.preventDefault()}
                >
                  {(() => {
                    const snap = certificado.plantilla_snapshot || {};
                    const orientacionFinal = snap.orientacion || 'horizontal';
                    return (
                      <div className={`w-full flex items-center justify-center relative ${orientacionFinal === 'vertical' ? 'max-w-sm' : 'max-w-xl'}`}>
                        <AvanzaCertificateRenderer
                          tipo={certificado.tipo}
                          orientacion={orientacionFinal}
                          estudiante={certificado.estudiante}
                          programa={certificado.programa}
                          modulo={certificado.modulo}
                          horas={certificado.horas}
                          fecha={certificado.fecha}
                          codigo={certificado.codigo}
                          imagenFondoUrl={snap.imagenFondoUrl}
                          incluyeQr={true}
                        />

                        {/* Capa protectora transparente */}
                        <div 
                          className="absolute inset-0 z-30 cursor-default bg-transparent select-none"
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                        />
                      </div>
                    );
                  })()}
                </div>
              </div>

            </div>

          </div>
        ) : (
          /* Formulario Inicial de Búsqueda (Solo cuando se entra a /validar directamente sin parámetros) */
          <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6 my-auto max-w-xl mx-auto w-full animate-in fade-in duration-150">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Validar certificado
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Ingresa el código del certificado para verificar su validez.
              </p>
            </div>

            <form onSubmit={handleSubmitBusqueda} className="space-y-4">
              <div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    id="codigo-input"
                    type="text"
                    value={codigoInput}
                    onChange={(e) => {
                      setCodigoInput(e.target.value.toUpperCase());
                      if (errorInput) setErrorInput(null);
                    }}
                    placeholder="Código del certificado"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 focus:bg-white focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 rounded-xl text-slate-900 placeholder:text-slate-400 text-sm sm:text-base outline-none transition font-mono uppercase"
                    autoFocus
                  />
                </div>
                {errorInput && (
                  <p className="text-xs text-rose-600 mt-2 font-medium">
                    {errorInput}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold py-3 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-sm cursor-pointer text-sm sm:text-base"
              >
                <ShieldCheck className="w-5 h-5" />
                <span>Verificar</span>
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

export default function ValidarBusquedaPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4 max-w-sm mx-auto shadow-sm">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-3 border-indigo-600 border-t-transparent"></div>
          <p className="text-xs font-semibold text-slate-600">Iniciando verificación oficial...</p>
        </div>
      </div>
    }>
      <ValidarCertificadoContent />
    </Suspense>
  );
}
