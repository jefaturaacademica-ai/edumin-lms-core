'use client';

import React, { useRef, useState, useEffect } from 'react';
import { QrCode, FileImage } from 'lucide-react';
import QRCode from 'qrcode';
import { generarUrlQRValidacion } from '@/lib/utils/certificateUtils';

export type ElementoAlineacion = 'left' | 'center' | 'right';

export type TipoFuenteCertificado = 
  | 'serif-institucional' // Times New Roman, serif
  | 'serif-elegante'      // Georgia, serif
  | 'serif-titular'       // Playfair Display, Georgia, serif
  | 'serif-romana'        // Cinzel, serif (Romana Solemne para diplomas)
  | 'serif-cormorant'     // Cormorant Garamond, serif (Académica de Lujo)
  | 'serif-lora'          // Lora, Georgia, serif (Editorial Formal)
  | 'sans-moderna'        // Montserrat, Segoe UI, sans-serif
  | 'sans-formal';        // Inter, Roboto, sans-serif

export type FormatoFechaCertificado = 
  | 'larga'          // 20 de octubre de 2026
  | 'corta'          // 20/10/2026
  | 'mes-ano'        // Octubre de 2026
  | 'completa-texto'; // 20 de octubre de 2026

export const FUENTES_CERTIFICADO = [
  { id: 'serif-institucional', nombre: 'Times New Roman (Institucional)', fontFamily: '"Times New Roman", Times, Georgia, serif' },
  { id: 'serif-elegante', nombre: 'Georgia (Elegante Clásica)', fontFamily: 'Georgia, "Times New Roman", serif' },
  { id: 'serif-titular', nombre: 'Playfair Display (Distinción / Título)', fontFamily: '"Playfair Display", Georgia, serif' },
  { id: 'serif-romana', nombre: 'Cinzel (Romana Imperial / Solemne)', fontFamily: '"Cinzel", Georgia, "Times New Roman", serif' },
  { id: 'serif-cormorant', nombre: 'Cormorant Garamond (Académica de Lujo)', fontFamily: '"Cormorant Garamond", Garamond, Georgia, serif' },
  { id: 'serif-lora', nombre: 'Lora (Editorial Formal)', fontFamily: '"Lora", Georgia, serif' },
  { id: 'sans-moderna', nombre: 'Montserrat (Solemne / Moderna)', fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif' },
  { id: 'sans-formal', nombre: 'Inter (Limpia / Técnica Oficial)', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
] as const;

// Dimensiones de referencia física estándar A4 en puntos tipográficos (72 pt / pulgada)
export const A4_ANCHO_PT_HORIZONTAL = 841.89; // 29.7 cm
export const A4_ALTO_PT_HORIZONTAL = 595.28;  // 21.0 cm

export const A4_ANCHO_PT_VERTICAL = 595.28;   // 21.0 cm
export const A4_ALTO_PT_VERTICAL = 841.89;    // 29.7 cm

/**
 * Convierte un tamaño tipográfico (pt) a unidades relativas al contenedor A4 (cqw)
 * para que la vista previa en pantalla sea 100% fiel e idéntica al PDF final en cualquier resolución.
 */
export function calcularTamanoCqw(tamanoPt: number, orientacion: 'horizontal' | 'vertical' = 'horizontal'): string {
  const baseW = orientacion === 'vertical' ? A4_ANCHO_PT_VERTICAL : A4_ANCHO_PT_HORIZONTAL;
  return `${((tamanoPt / baseW) * 100).toFixed(4)}cqw`;
}

/**
 * Convierte un tamaño tipográfico (pt) a píxeles exactos de alta resolución sobre el Canvas de dibujo (200-300 DPI)
 */
export function calcularTamanoPxCanvas(tamanoPt: number, orientacion: 'horizontal' | 'vertical', canvasW: number): number {
  const baseW = orientacion === 'vertical' ? A4_ANCHO_PT_VERTICAL : A4_ANCHO_PT_HORIZONTAL;
  return Math.round((tamanoPt / baseW) * canvasW);
}

export function obtenerFontFamily(fuenteId?: TipoFuenteCertificado, fallback: string = '"Times New Roman", serif'): string {
  if (!fuenteId) return fallback;
  const match = FUENTES_CERTIFICADO.find(f => f.id === fuenteId);
  return match ? match.fontFamily : fallback;
}

/**
 * Mantiene las conjunciones ("y", "e", "o", "u") unidas a la palabra anterior
 * mediante un espacio de no separación (\u00A0) para evitar que queden huérfanas
 * al saltar de línea (ej: "LOGÍSTICA Y\u00A0ALMACENES").
 */
export function ajustarConectorSinHuerfana(texto: string): string {
  if (!texto) return '';
  return texto.replace(/(\S+)\s+([yYeEoOuU])(\s+)/g, '$1\u00A0$2$3');
}

/**
 * Formatea estrictamente la fecha pura (sin prefijos ni ciudades forzadas)
 */
export function formatearFechaSegunEstilo(
  fechaStr?: string, 
  formato: FormatoFechaCertificado = 'larga'
): string {
  let dateObj = new Date();
  if (fechaStr && typeof fechaStr === 'string' && fechaStr.trim() !== '') {
    const raw = fechaStr.replace(/^Fecha de emisión:\s*/i, '').replace(/^[A-Za-z\s]+,\s*/, '').trim();
    const parts = raw.split('-');
    if (parts.length === 3 && !isNaN(Number(parts[0])) && !isNaN(Number(parts[1])) && !isNaN(Number(parts[2]))) {
      const parsedD = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      if (!isNaN(parsedD.getTime())) dateObj = parsedD;
    } else {
      const parsed = Date.parse(raw);
      if (!isNaN(parsed)) {
        const parsedD = new Date(parsed);
        if (!isNaN(parsedD.getTime())) dateObj = parsedD;
      }
    }
  }

  if (isNaN(dateObj.getTime())) {
    dateObj = new Date();
  }

  const dia = dateObj.getDate() || 1;
  const meses = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
  ];
  const mIndex = (!isNaN(dateObj.getMonth()) && dateObj.getMonth() >= 0 && dateObj.getMonth() < 12) 
    ? dateObj.getMonth() 
    : 0;
  const mesNombre = meses[mIndex] || 'enero';
  const anio = (!isNaN(dateObj.getFullYear()) && dateObj.getFullYear() > 1900) 
    ? dateObj.getFullYear() 
    : 2026;
  const dStr = dia.toString().padStart(2, '0');
  const mStr = (mIndex + 1).toString().padStart(2, '0');

  switch (formato) {
    case 'corta':
      return `${dStr}/${mStr}/${anio}`;
    case 'mes-ano':
      return `${mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1)} de ${anio}`;
    case 'completa-texto':
    case 'larga':
    default:
      return `${dia} de ${mesNombre} de ${anio}`;
  }
}

export interface PosicionElemento {
  x: number; // Porcentaje 0 a 100 respecto al ancho A4
  y: number; // Porcentaje 0 a 100 respecto al alto A4
  alineacion: ElementoAlineacion;
  tamano?: number; // Tamaño en px para QR
  tamanoFuente?: number; // Tamaño de fuente en pt/px
  color?: string; // Color hexadecimal o rgb de texto (por defecto #000000)
  visible: boolean;
  fuente?: TipoFuenteCertificado;
  textoPrefijo?: string; // Prefijo personalizable (ej: "Fecha de emisión: ", "CÓD.: ", "Arequipa, ")
  formatoFecha?: FormatoFechaCertificado;
  anchoMaximoCm?: number; // Ancho máximo físico en centímetros A4
  anchoMaximo?: number; // Porcentaje de ancho máximo (compatibilidad)
  interlineado?: number; // Altura de línea / espacio entre filas (multiplicador, ej: 1.25)
  negrita?: boolean; // Negrita (bold)
  cursiva?: boolean; // Cursiva (italic)
  subrayado?: boolean; // Subrayado (underline)
}

export interface DisenoCoordenadas {
  estudiante: PosicionElemento;
  programa: PosicionElemento;
  horas: PosicionElemento;
  fecha: PosicionElemento;
  codigo: PosicionElemento;
  qr: PosicionElemento;
}

export const DISENO_DEFAULT_HORIZONTAL: DisenoCoordenadas = {
  estudiante: { x: 50, y: 35, alineacion: 'center', visible: true, fuente: 'serif-institucional', anchoMaximoCm: 25.0, tamanoFuente: 36, color: '#000000', negrita: true, interlineado: 1.25 },
  programa: { x: 50, y: 53.5, alineacion: 'center', visible: true, fuente: 'sans-moderna', anchoMaximoCm: 25.5, tamanoFuente: 22, color: '#000000', negrita: true, interlineado: 1.25 },
  horas: { x: 50, y: 63, alineacion: 'center', visible: true, fuente: 'sans-formal', tamanoFuente: 12, color: '#000000' },
  fecha: { x: 86, y: 88, alineacion: 'right', visible: true, fuente: 'sans-formal', textoPrefijo: 'Fecha de emisión: ', formatoFecha: 'larga', tamanoFuente: 10, color: '#000000' },
  codigo: { x: 86, y: 94, alineacion: 'right', visible: true, fuente: 'sans-formal', textoPrefijo: 'CÓD.: ', tamanoFuente: 11, color: '#000000', negrita: true },
  qr: { x: 86, y: 74, alineacion: 'right', tamano: 56, visible: true }
};

export const DISENO_DEFAULT_VERTICAL: DisenoCoordenadas = {
  estudiante: { x: 50, y: 38, alineacion: 'center', visible: true, fuente: 'serif-institucional', anchoMaximoCm: 18.5, tamanoFuente: 30, color: '#000000', negrita: true, interlineado: 1.25 },
  programa: { x: 50, y: 52, alineacion: 'center', visible: true, fuente: 'sans-moderna', anchoMaximoCm: 18.5, tamanoFuente: 18, color: '#000000', negrita: true, interlineado: 1.25 },
  horas: { x: 50, y: 61, alineacion: 'center', visible: true, fuente: 'sans-formal', tamanoFuente: 10, color: '#000000' },
  fecha: { x: 50, y: 86, alineacion: 'center', visible: true, fuente: 'sans-formal', textoPrefijo: 'Fecha de emisión: ', formatoFecha: 'larga', tamanoFuente: 10, color: '#000000' },
  codigo: { x: 50, y: 92, alineacion: 'center', visible: true, fuente: 'sans-formal', textoPrefijo: 'CÓD.: ', tamanoFuente: 11, color: '#000000', negrita: true },
  qr: { x: 50, y: 74, alineacion: 'center', tamano: 56, visible: true }
};

export interface AvanzaCertificateProps {
  tipo: 'DIPLOMA' | 'MODULAR' | 'CURSO' | 'CIP' | 'MIAMI' | 'TALLER' | string;
  estudiante: string;
  programa: string;
  modulo?: string | null;
  horas?: string;
  fecha?: string;
  codigo: string;
  ciudad?: string;
  className?: string;
  orientacion?: 'horizontal' | 'vertical';
  imagenFondoUrl?: string | null;
  incluyeQr?: boolean;
  diseno?: Partial<DisenoCoordenadas>;
  elementoActivo?: string | null;
  modoArrastrable?: boolean;
  onMoverElemento?: (campo: keyof DisenoCoordenadas, x: number, y: number) => void;
  onSeleccionarElemento?: (campo: keyof DisenoCoordenadas) => void;
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
  className = '',
  orientacion = 'horizontal',
  imagenFondoUrl,
  incluyeQr = true,
  diseno,
  elementoActivo,
  modoArrastrable = false,
  onMoverElemento,
  onSeleccionarElemento
}: AvanzaCertificateProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const esDiploma = String(tipo).toUpperCase() === 'DIPLOMA';
  const esVertical = orientacion === 'vertical';

  // Dimensiones físicas A4 exactas en centímetros
  const anchoA4Cm = esVertical ? 21.0 : 29.7;
  const altoA4Cm = esVertical ? 29.7 : 21.0;

  const horasDefecto = esDiploma 
    ? '325 horas académicas y 13 créditos académicos' 
    : '108 horas académicas';
  const horasFinal = horas || horasDefecto;

  const nombreEstudiante = (estudiante || 'Quispe Ramos, Juan Carlos').trim();

  let bgImg: string | null = null;
  if (imagenFondoUrl !== undefined) {
    bgImg = imagenFondoUrl;
  } else {
    bgImg = esDiploma
      ? '/assets/certificates/plantilla_avanza_diploma_bg.png'
      : '/assets/certificates/plantilla_avanza_modular_bg.png';
  }

  const rawPrograma = (programa || 'DERECHO MINERO')
    .replace(/^Diplomado de Alta Especialización en\s*/i, '')
    .replace(/^Diplomado en\s*/i, '')
    .trim();

  const rawModulo = (modulo || 'LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR')
    .replace(/^Módulo\s*\d+[:\-\s]*/i, '')
    .trim();

  const tituloProgramaLimpio = ajustarConectorSinHuerfana(rawPrograma);
  const tituloModuloLimpio = ajustarConectorSinHuerfana(rawModulo);

  // Coordenadas resueltas combinando defaults de orientación con personalizaciones
  const baseDefaults = esVertical ? DISENO_DEFAULT_VERTICAL : DISENO_DEFAULT_HORIZONTAL;
  const cfg: DisenoCoordenadas = {
    estudiante: { ...baseDefaults.estudiante, ...(diseno?.estudiante || {}) },
    programa: { ...baseDefaults.programa, ...(diseno?.programa || {}) },
    horas: { ...baseDefaults.horas, ...(diseno?.horas || {}) },
    fecha: { ...baseDefaults.fecha, ...(diseno?.fecha || {}) },
    codigo: { ...baseDefaults.codigo, ...(diseno?.codigo || {}) },
    qr: { ...baseDefaults.qr, ...(diseno?.qr || {}) }
  };

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!incluyeQr || !cfg.qr.visible || !codigo) return;
    try {
      const qrTargetUrl = generarUrlQRValidacion(codigo);
      QRCode.toDataURL(qrTargetUrl, {
        margin: 1,
        width: 256,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' }
      }).then(url => {
        setQrDataUrl(url);
      }).catch(err => {
        console.error('Error generando QR oficial:', err);
      });
    } catch (e) {
      console.error('Error QR:', e);
    }
  }, [codigo, incluyeQr, cfg.qr.visible]);

  // Convertir ancho en CM a porcentaje de ancho del contenedor
  const resolverAnchoPct = (anchoCm?: number, fallbackPct: number = 84) => {
    if (anchoCm && anchoCm > 0) {
      return Math.min(98, Math.max(20, (anchoCm / anchoA4Cm) * 100));
    }
    return fallbackPct;
  };

  const anchoEstudiantePct = resolverAnchoPct(cfg.estudiante.anchoMaximoCm, cfg.estudiante.anchoMaximo || 84);
  const anchoProgramaPct = resolverAnchoPct(cfg.programa.anchoMaximoCm, cfg.programa.anchoMaximo || 86);

  // 1. AJUSTE EXCLUSIVO DE TAMAÑO PARA NOMBRE (Sin letter-spacing):
  // Se evalúa si el nombre sobrepasa el ancho físico máximo en cm (anchoEstudianteCm).
  // Solo cuando supera este límite físico se reduce proporcionalmente el font size en pt.
  const lenEstudiante = nombreEstudiante.length;
  const tamanoBaseEstPt = cfg.estudiante.tamanoFuente || (esVertical ? 28 : 36);
  const anchoEstudianteCm = cfg.estudiante.anchoMaximoCm || (esVertical ? 18.5 : 25.0);
  // Ancho estimado por carácter (~0.46 em para nombres como "Quispe Ramos, Juan Carlos", 1 pt = 0.03528 cm)
  const anchoEstimadoEstCm = lenEstudiante * (tamanoBaseEstPt * 0.03528 * 0.46);

  let tamanoEstudiantePt = tamanoBaseEstPt;
  if (anchoEstimadoEstCm > anchoEstudianteCm) {
    const factorEst = anchoEstudianteCm / anchoEstimadoEstCm;
    tamanoEstudiantePt = Math.max(14, Number((tamanoBaseEstPt * factorEst).toFixed(1)));
  }

  // 2. AJUSTE EXACTO DE LÍNEAS Y TAMAÑO PARA PROGRAMA (Idéntico a PDF, sin elipsis ni truncamiento)
  const textoProgFinal = esDiploma ? tituloProgramaLimpio : tituloModuloLimpio;
  const palabrasProg = textoProgFinal.split(' ');
  const tamanoBaseProgPt = cfg.programa.tamanoFuente || (esVertical ? 18 : 22);
  const anchoProgCm = cfg.programa.anchoMaximoCm || (esVertical ? 18.5 : 25.5);
  // Ancho estimado por carácter en cm (~0.0215 cm para Montserrat mayúsculas a 1pt)
  const factorCharCm = 0.03528 * 0.58;

  // Ancho estimado si estuviera en 1 sola línea
  const anchoProg1LineaCm = textoProgFinal.length * (tamanoBaseProgPt * factorCharCm);
  const cabeProgramaEn1Linea = anchoProg1LineaCm <= anchoProgCm;

  let lineaProg1 = textoProgFinal;
  let lineaProg2 = '';
  let tamanoProgPt = tamanoBaseProgPt;

  if (!cabeProgramaEn1Linea && palabrasProg.length > 1) {
    // Dividir en 2 líneas equilibradas exactamente igual que en el generador de PDF
    let mejorDiff = Infinity;
    let mejorCorte = Math.floor(palabrasProg.length / 2);

    for (let i = 1; i < palabrasProg.length; i++) {
      const p1 = palabrasProg.slice(0, i).join(' ');
      const p2 = palabrasProg.slice(i).join(' ');
      const diff = Math.abs(p1.length - p2.length);
      if (diff < mejorDiff) {
        mejorDiff = diff;
        mejorCorte = i;
      }
    }

    lineaProg1 = palabrasProg.slice(0, mejorCorte).join(' ');
    lineaProg2 = palabrasProg.slice(mejorCorte).join(' ');

    // Determinar la línea más larga de las dos
    const maxLineChars = Math.max(lineaProg1.length, lineaProg2.length);
    const anchoMaxLineaCm = maxLineChars * (tamanoBaseProgPt * factorCharCm);

    // Si la línea más larga excede el ancho físico máximo en cm, reducimos font size automáticamente
    if (anchoMaxLineaCm > anchoProgCm) {
      const escala = anchoProgCm / anchoMaxLineaCm;
      tamanoProgPt = Math.max(11, Number((tamanoBaseProgPt * escala).toFixed(1)));
    }
  } else if (!cabeProgramaEn1Linea) {
    // Palabra única muy larga
    if (anchoProg1LineaCm > anchoProgCm) {
      const escala = anchoProgCm / anchoProg1LineaCm;
      tamanoProgPt = Math.max(11, Number((tamanoBaseProgPt * escala).toFixed(1)));
    }
  }

  // Fecha pura formateada con prefijo personalizable
  const fechaPura = formatearFechaSegunEstilo(fecha, cfg.fecha.formatoFecha || 'larga');
  const prefijoFecha = cfg.fecha.textoPrefijo !== undefined ? cfg.fecha.textoPrefijo : 'Fecha de emisión: ';
  const textoFechaCompleto = `${prefijoFecha}${fechaPura}`.trim();

  // Prefijo del código único (puro texto, sin contenedor de color)
  const prefijoCodigo = cfg.codigo.textoPrefijo !== undefined ? cfg.codigo.textoPrefijo : 'CÓD.: ';
  const textoCodigoCompleto = `${prefijoCodigo}${codigo}`.trim();

  // Relaciones de aspecto A4 exactas:
  const a4AspectClass = esVertical ? 'aspect-[210/297]' : 'aspect-[297/210]';

  const getTransform = (alineacion: ElementoAlineacion) => {
    if (alineacion === 'center') return 'translate(-50%, -50%)';
    if (alineacion === 'right') return 'translate(-100%, -50%)';
    return 'translate(0, -50%)';
  };

  // Manejador interactivo de Drag & Drop para ubicar elementos directamente en el canvas A4
  // REGLA SOLICITADA: Solo permite arrastrar la variable ACTIVA.
  // Si se presiona sobre otra variable, únicamente la selecciona en el editor para evitar movimientos involuntarios.
  const handleIniciarArrastre = (campo: keyof DisenoCoordenadas, e: React.MouseEvent | React.TouchEvent) => {
    if (!modoArrastrable || !onMoverElemento) return;
    e.stopPropagation();

    if (elementoActivo !== campo) {
      if (onSeleccionarElemento) onSeleccionarElemento(campo);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const actualizarPosicion = (clientX: number, clientY: number) => {
      const rect = container.getBoundingClientRect();
      const rawX = ((clientX - rect.left) / rect.width) * 100;
      const rawY = ((clientY - rect.top) / rect.height) * 100;
      const x = Math.max(0, Math.min(100, Math.round(rawX * 10) / 10));
      const y = Math.max(0, Math.min(100, Math.round(rawY * 10) / 10));
      onMoverElemento(campo, x, y);
    };

    const handleMouseMove = (ev: MouseEvent) => {
      ev.preventDefault();
      actualizarPosicion(ev.clientX, ev.clientY);
    };

    const handleTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length > 0) {
        actualizarPosicion(ev.touches[0].clientX, ev.touches[0].clientY);
      }
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleMouseUp);
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${a4AspectClass} bg-white text-slate-900 select-none overflow-hidden rounded-xl shadow-2xl transition-all duration-300 border border-slate-200/80 ${className}`}
      style={{
        containerType: 'inline-size',
        containerName: 'certificadoA4',
        backgroundImage: bgImg ? `url(${bgImg})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Guía si no tiene fondo */}
      {!bgImg && (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none bg-radial from-slate-50 via-white to-slate-100/60 border-2 border-dashed border-slate-300 rounded-xl m-2">
          <div className="flex items-center justify-between w-full opacity-40">
            <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase">
              Lienzo A4 {esVertical ? 'Vertical (21.0×29.7 cm)' : 'Horizontal (29.7×21.0 cm)'}
            </span>
            <span className="text-[9px] font-mono text-slate-400">Sin plantilla de fondo</span>
          </div>

          <div className="text-center opacity-30 my-auto">
            <FileImage className="size-12 mx-auto text-slate-400 mb-2 stroke-[1.2]" />
            <p className="text-xs font-semibold text-slate-600">Sube una imagen de fondo membretada A4</p>
            <p className="text-[10px] text-slate-400">Puedes arrastrar cualquier texto en vivo para calzarlo con el membrete</p>
          </div>

          <div className="w-full flex justify-end opacity-30">
            <span className="text-[8px] font-mono">EDUMIN • Modelo Base</span>
          </div>
        </div>
      )}

      {/* 1. NOMBRE DEL ESTUDIANTE: Siempre 1 sola línea, ancho delimitado en CM, centrado y con auto-escala */}
      {cfg.estudiante.visible && (
        <div 
          onMouseDown={(e) => handleIniciarArrastre('estudiante', e)}
          onTouchStart={(e) => handleIniciarArrastre('estudiante', e)}
          onClick={(e) => {
            e.stopPropagation();
            if (onSeleccionarElemento) onSeleccionarElemento('estudiante');
          }}
          className={`absolute z-10 transition-all duration-150 flex items-center ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
          } ${
            cfg.estudiante.alineacion === 'center' ? 'justify-center' :
            cfg.estudiante.alineacion === 'right' ? 'justify-end' : 'justify-start'
          } ${
            elementoActivo === 'estudiante' 
              ? 'outline outline-2 outline-dashed outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.estudiante.x}%`,
            top: `${cfg.estudiante.y}%`,
            width: `${anchoEstudiantePct}%`,
            maxWidth: `${anchoEstudiantePct}%`,
            transform: getTransform(cfg.estudiante.alineacion),
            textAlign: cfg.estudiante.alineacion
          }}
        >
          <h2 
            className="leading-none whitespace-nowrap"
            style={{
              fontFamily: obtenerFontFamily(cfg.estudiante.fuente, '"Times New Roman", Times, Georgia, serif'),
              fontSize: calcularTamanoCqw(tamanoEstudiantePt, orientacion),
              color: cfg.estudiante.color || '#000000',
              fontWeight: cfg.estudiante.negrita !== false ? 'bold' : 'normal',
              fontStyle: cfg.estudiante.cursiva ? 'italic' : 'normal',
              textDecoration: cfg.estudiante.subrayado ? 'underline' : 'none',
              transformOrigin: cfg.estudiante.alineacion === 'center' ? 'center' : cfg.estudiante.alineacion === 'right' ? 'right' : 'left'
            }}
          >
            {nombreEstudiante}
          </h2>
        </div>
      )}

      {/* 2. TÍTULO DEL PROGRAMA O MÓDULO: Hasta 2 líneas máximo, equilibrado y sin elipsis */}
      {cfg.programa.visible && (
        <div 
          onMouseDown={(e) => handleIniciarArrastre('programa', e)}
          onTouchStart={(e) => handleIniciarArrastre('programa', e)}
          onClick={(e) => {
            e.stopPropagation();
            if (onSeleccionarElemento) onSeleccionarElemento('programa');
          }}
          className={`absolute z-10 transition-all duration-150 flex flex-col justify-center ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
          } ${
            cfg.programa.alineacion === 'center' ? 'items-center text-center' :
            cfg.programa.alineacion === 'right' ? 'items-end text-right' : 'items-start text-left'
          } ${
            elementoActivo === 'programa' 
              ? 'outline outline-2 outline-dashed outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.programa.x}%`,
            top: `${cfg.programa.y}%`,
            width: `${anchoProgramaPct}%`,
            maxWidth: `${anchoProgramaPct}%`,
            transform: getTransform(cfg.programa.alineacion)
          }}
        >
          <h3 
            className="uppercase tracking-wide font-black w-full"
            style={{
              fontFamily: obtenerFontFamily(cfg.programa.fuente, '"Montserrat", "Segoe UI", Arial, sans-serif'),
              fontSize: calcularTamanoCqw(tamanoProgPt, orientacion),
              color: cfg.programa.color || '#000000',
              fontWeight: cfg.programa.negrita !== false ? 'bold' : 'normal',
              fontStyle: cfg.programa.cursiva ? 'italic' : 'normal',
              textDecoration: cfg.programa.subrayado ? 'underline' : 'none',
              lineHeight: cfg.programa.interlineado || 1.25,
              textAlign: cfg.programa.alineacion
            }}
          >
            {lineaProg2 ? (
              <>
                <span className="block whitespace-nowrap">{lineaProg1}</span>
                <span className="block whitespace-nowrap">{lineaProg2}</span>
              </>
            ) : (
              <span className="block whitespace-nowrap">{lineaProg1}</span>
            )}
          </h3>
        </div>
      )}

      {/* 3. LÍNEA DE HORAS Y CRÉDITOS */}
      {cfg.horas.visible && (
        <div 
          onMouseDown={(e) => handleIniciarArrastre('horas', e)}
          onTouchStart={(e) => handleIniciarArrastre('horas', e)}
          onClick={(e) => {
            e.stopPropagation();
            if (onSeleccionarElemento) onSeleccionarElemento('horas');
          }}
          className={`absolute z-10 max-w-[90%] transition-all duration-150 ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
          } ${
            elementoActivo === 'horas' 
              ? 'outline outline-2 outline-dashed outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.horas.x}%`,
            top: `${cfg.horas.y}%`,
            transform: getTransform(cfg.horas.alineacion),
            textAlign: cfg.horas.alineacion,
            fontFamily: obtenerFontFamily(cfg.horas.fuente, '"Segoe UI", Arial, sans-serif'),
            color: cfg.horas.color || '#000000',
            fontWeight: cfg.horas.negrita ? 'bold' : 'normal',
            fontStyle: cfg.horas.cursiva ? 'italic' : 'normal',
            textDecoration: cfg.horas.subrayado ? 'underline' : 'none'
          }}
        >
          {esDiploma ? (
            <p 
              className="whitespace-nowrap"
              style={{ fontSize: calcularTamanoCqw(cfg.horas.tamanoFuente || 12, orientacion) }}
            >
              con un total de <strong className="font-bold">{horasFinal}</strong>,
            </p>
          ) : (
            <p 
              className="whitespace-nowrap"
              style={{ fontSize: calcularTamanoCqw(cfg.horas.tamanoFuente || 11, orientacion) }}
            >
              desarrollado según la malla curricular establecida con un total de <strong className="font-bold">{horasFinal}</strong>
            </p>
          )}
        </div>
      )}

      {/* 4. CÓDIGO QR 1:1 CON VALIDADOR */}
      {cfg.qr.visible && (
        <div 
          onMouseDown={(e) => handleIniciarArrastre('qr', e)}
          onTouchStart={(e) => handleIniciarArrastre('qr', e)}
          onClick={(e) => {
            e.stopPropagation();
            if (onSeleccionarElemento) onSeleccionarElemento('qr');
          }}
          className={`absolute z-20 flex flex-col items-center justify-center bg-white p-1 rounded-lg shadow-sm border border-slate-200 aspect-square transition-all duration-150 ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-auto'
          } ${
            elementoActivo === 'qr' ? 'outline outline-2 outline-dashed outline-indigo-500 outline-offset-4 rounded-lg' : ''
          }`}
          style={{
            left: `${cfg.qr.x}%`,
            top: `${cfg.qr.y}%`,
            transform: getTransform(cfg.qr.alineacion),
            width: calcularTamanoCqw(cfg.qr.tamano || 56, orientacion),
            height: calcularTamanoCqw(cfg.qr.tamano || 56, orientacion),
            aspectRatio: '1 / 1'
          }}
        >
          <div className="w-full h-full aspect-square grid place-items-center overflow-hidden">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt={`QR Oficial ${codigo}`}
                className="w-full h-full object-contain aspect-square pointer-events-none select-none"
              />
            ) : (
              <QrCode className="w-full h-full text-slate-950 aspect-square animate-pulse" />
            )}
          </div>
        </div>
      )}

      {/* 5. FECHA DE EMISIÓN CON PREFIJO Y FORMATO PERSONALIZABLE */}
      {cfg.fecha.visible && (
        <div 
          onMouseDown={(e) => handleIniciarArrastre('fecha', e)}
          onTouchStart={(e) => handleIniciarArrastre('fecha', e)}
          onClick={(e) => {
            e.stopPropagation();
            if (onSeleccionarElemento) onSeleccionarElemento('fecha');
          }}
          className={`absolute z-20 transition-all duration-150 ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
          } ${
            elementoActivo === 'fecha' 
              ? 'outline outline-2 outline-dashed outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.fecha.x}%`,
            top: `${cfg.fecha.y}%`,
            transform: getTransform(cfg.fecha.alineacion),
            textAlign: cfg.fecha.alineacion,
            fontFamily: obtenerFontFamily(cfg.fecha.fuente, '"Segoe UI", Arial, sans-serif')
          }}
        >
          <p 
            className="whitespace-nowrap"
            style={{ 
              fontSize: calcularTamanoCqw(cfg.fecha.tamanoFuente || 10, orientacion),
              color: cfg.fecha.color || '#000000',
              fontWeight: cfg.fecha.negrita ? 'bold' : 'normal',
              fontStyle: cfg.fecha.cursiva ? 'italic' : 'normal',
              textDecoration: cfg.fecha.subrayado ? 'underline' : 'none'
            }}
          >
            {textoFechaCompleto}
          </p>
        </div>
      )}

      {/* 6. CÓDIGO ALFANUMÉRICO ÚNICO: Puro texto sin fondo de color */}
      {cfg.codigo.visible && (
        <div 
          onMouseDown={(e) => handleIniciarArrastre('codigo', e)}
          onTouchStart={(e) => handleIniciarArrastre('codigo', e)}
          onClick={(e) => {
            e.stopPropagation();
            if (onSeleccionarElemento) onSeleccionarElemento('codigo');
          }}
          className={`absolute z-20 transition-all duration-150 ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
          } ${
            elementoActivo === 'codigo' 
              ? 'outline outline-2 outline-dashed outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.codigo.x}%`,
            top: `${cfg.codigo.y}%`,
            transform: getTransform(cfg.codigo.alineacion),
            textAlign: cfg.codigo.alineacion
          }}
        >
          <span 
            className="tracking-wider whitespace-nowrap"
            style={{
              fontSize: calcularTamanoCqw(cfg.codigo.tamanoFuente || 11, orientacion),
              color: cfg.codigo.color || '#000000',
              fontFamily: obtenerFontFamily(cfg.codigo.fuente, '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'),
              fontWeight: cfg.codigo.negrita !== false ? 'bold' : 'normal',
              fontStyle: cfg.codigo.cursiva ? 'italic' : 'normal',
              textDecoration: cfg.codigo.subrayado ? 'underline' : 'none'
            }}
          >
            {textoCodigoCompleto}
          </span>
        </div>
      )}
    </div>
  );
}
