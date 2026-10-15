'use client';

import React from 'react';
import { QrCode } from 'lucide-react';
import { formatearFechaEmision } from '@/lib/utils/certificateUtils';

interface AvanzaCertificateProps {
  tipo: 'DIPLOMA' | 'MODULAR' | string;
  estudiante: string;
  programa: string;
  modulo?: string | null;
  horas?: string;
  fecha?: string;
  codigo: string;
  ciudad?: string;
  className?: string;
}

export default function AvanzaCertificateRenderer({
  tipo,
  estudiante,
  programa,
  modulo,
  horas,
  fecha,
  codigo,
  ciudad = 'Arequipa',
  className = ''
}: AvanzaCertificateProps) {
  const esDiploma = String(tipo).toUpperCase() === 'DIPLOMA';

  const horasDefecto = esDiploma 
    ? '325 horas académicas y 13 créditos académicos' 
    : '108 horas académicas';
  const horasFinal = horas || horasDefecto;

  const fechaTextoFinal = formatearFechaEmision(fecha, ciudad);

  // Formato del nombre de estudiante: centrado, estilizado
  const nombreEstudiante = estudiante || 'Estudiante EDUMIN';

  // Fondo oficial Avanza
  const bgImg = esDiploma
    ? '/assets/certificates/plantilla_avanza_diploma_bg.png'
    : '/assets/certificates/plantilla_avanza_modular_bg.png';

  const tituloProgramaLimpio = (programa || 'DERECHO MINERO')
    .replace(/^Diplomado de Alta Especialización en\s*/i, '')
    .replace(/^Diplomado en\s*/i, '')
    .trim();

  const tituloModuloLimpio = (modulo || 'LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR')
    .replace(/^Módulo\s*\d+[:\-\s]*/i, '')
    .trim();

  return (
    <div 
      className={`relative w-full aspect-[2000/1414] bg-white text-slate-900 select-none overflow-hidden rounded-xl shadow-2xl ${className}`}
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* 1. NOMBRE DEL ESTUDIANTE */}
      <div 
        className="absolute left-0 right-0 text-center px-8 z-10 flex items-center justify-center pointer-events-none"
        style={{
          top: esDiploma ? '30.5%' : '36.5%',
          height: '8.5%'
        }}
      >
        <h2 className="font-serif font-black text-slate-900 tracking-tight leading-none text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-[44px]">
          {nombreEstudiante}
        </h2>
      </div>

      {/* 2. TÍTULO DEL PROGRAMA O MÓDULO */}
      <div 
        className="absolute left-0 right-0 text-center px-12 z-10 flex items-center justify-center pointer-events-none"
        style={{
          top: esDiploma ? '50.8%' : '53.6%',
          height: '8.0%'
        }}
      >
        <h3 className="font-sans font-black text-slate-950 uppercase tracking-wide leading-tight text-base sm:text-lg md:text-xl lg:text-2xl xl:text-[32px] max-w-[85%] truncate">
          {esDiploma ? tituloProgramaLimpio : tituloModuloLimpio}
        </h3>
      </div>

      {/* 3. LÍNEA DE HORAS Y CRÉDITOS */}
      <div 
        className="absolute left-0 right-0 text-center px-8 z-10 flex items-center justify-center pointer-events-none"
        style={{
          top: esDiploma ? '61.7%' : '63.2%',
          height: '3.5%'
        }}
      >
        {esDiploma ? (
          <p className="font-sans font-normal text-slate-800 text-[9px] sm:text-[11px] md:text-xs lg:text-[15px]">
            con un total de <strong className="font-bold">{horasFinal}</strong>,
          </p>
        ) : (
          <p className="font-sans font-normal text-slate-800 text-[8px] sm:text-[10px] md:text-[11px] lg:text-[14px]">
            desarrollado según la malla curricular establecida con un total de <strong className="font-bold">{horasFinal}</strong>
          </p>
        )}
      </div>

      {/* 4. BLOQUE INFERIOR DERECHO: QR, FECHA DE EMISIÓN Y CÓDIGO ÚNICO */}
      <div 
        className="absolute z-20 flex flex-col items-end justify-end space-y-1 sm:space-y-1.5 pointer-events-auto"
        style={{
          bottom: '3.5%',
          right: '4.5%'
        }}
      >
        {/* QR de Validación Oficial */}
        <div className="flex flex-col items-center bg-white p-1 rounded-lg shadow-sm border border-slate-200">
          <span className="text-[6px] sm:text-[7px] md:text-[8px] font-bold text-slate-700 tracking-tight leading-none mb-0.5">
            Validar certificado
          </span>
          <div className="size-9 sm:size-12 md:size-14 lg:size-16 grid place-items-center">
            <QrCode className="size-full text-slate-950" />
          </div>
        </div>

        {/* Fecha de Emisión */}
        <p className="font-sans text-[7px] sm:text-[9px] md:text-[10px] font-medium text-slate-700 tracking-tight">
          Fecha de emisión: {fechaTextoFinal}
        </p>

        {/* Barra con Código Único */}
        <div 
          className={`px-2.5 sm:px-3.5 py-0.5 sm:py-1 rounded-sm font-mono font-bold text-[8px] sm:text-[10px] md:text-xs lg:text-sm tracking-wider text-white shadow-xs ${
            esDiploma ? 'bg-[#ff9700]' : 'bg-[#3a6dfa]'
          }`}
        >
          CÓD.: {codigo}
        </div>
      </div>
    </div>
  );
}
