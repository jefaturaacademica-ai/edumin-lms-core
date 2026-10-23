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
  | 'sans-formal'         // Inter, sans-serif
  | 'sans-roboto'         // Roboto, sans-serif
  | 'sans-outfit';        // Outfit, sans-serif (Geométrica Moderna Vanguardista)

export type FormatoFechaCertificado = 
  | 'larga'          // 20 de octubre de 2026
  | 'corta'          // 20/10/2026
  | 'mes-ano'        // Octubre de 2026
  | 'completa-texto'; // 20 de octubre de 2026

export type FormatoNombreEstudiante = 'apellidos-nombres' | 'nombres-apellidos' | 'mayusculas';

export type ModoHorasCreditos = 'horas-y-creditos' | 'solo-horas' | 'solo-creditos' | 'personalizado';

export const FUENTES_CERTIFICADO = [
  { id: 'serif-institucional', nombre: 'Times New Roman', fontFamily: '"Times New Roman", Times, Georgia, serif' },
  { id: 'serif-elegante', nombre: 'Georgia', fontFamily: 'Georgia, "Times New Roman", serif' },
  { id: 'serif-titular', nombre: 'Playfair Display', fontFamily: '"Playfair Display", Georgia, serif' },
  { id: 'serif-romana', nombre: 'Cinzel', fontFamily: '"Cinzel", Georgia, "Times New Roman", serif' },
  { id: 'serif-cormorant', nombre: 'Cormorant Garamond', fontFamily: '"Cormorant Garamond", Garamond, Georgia, serif' },
  { id: 'serif-lora', nombre: 'Lora', fontFamily: '"Lora", Georgia, serif' },
  { id: 'sans-outfit', nombre: 'Outfit', fontFamily: '"Outfit", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' },
  { id: 'sans-moderna', nombre: 'Montserrat', fontFamily: '"Montserrat", "Segoe UI", Arial, sans-serif' },
  { id: 'sans-formal', nombre: 'Inter', fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
  { id: 'sans-roboto', nombre: 'Roboto', fontFamily: '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }
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

let _measureCanvas: HTMLCanvasElement | null = null;

/**
 * Mide el ancho exacto del texto en puntos tipográficos (pt) utilizando el contexto 2D de Canvas.
 * Garantiza métricas idénticas entre la vista previa del navegador y el motor de PDF final.
 */
export function medirAnchoTextoPt(
  texto: string,
  tamanoPt: number,
  fuenteId?: TipoFuenteCertificado,
  esNegrita: boolean = true,
  esCursiva: boolean = false
): number {
  if (!texto) return 0;
  if (typeof document === 'undefined') {
    // Estimación conservadora en SSR para evitar saltos
    return texto.length * (tamanoPt * 0.62);
  }
  if (!_measureCanvas) {
    _measureCanvas = document.createElement('canvas');
  }
  const ctx = _measureCanvas.getContext('2d');
  if (!ctx) return texto.length * (tamanoPt * 0.62);

  const fontFam = obtenerFontFamily(fuenteId, '"Times New Roman", Times, Georgia, serif');
  const style = esCursiva ? 'italic ' : '';
  const weight = esNegrita ? 'bold ' : 'normal ';
  ctx.font = `${style}${weight}${tamanoPt}px ${fontFam}`;
  return ctx.measureText(texto).width;
}

/**
 * Resuelve el tamaño del QR en puntos (pt) para A4 (1 cm ≈ 28.346 pt)
 */
export function resolverTamanoQrPt(cfgQr: PosicionElemento): number {
  if (cfgQr.tamanoCm && cfgQr.tamanoCm > 0) {
    return Math.round(cfgQr.tamanoCm * 28.346);
  }
  return cfgQr.tamano || 56;
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

/**
 * Formatea el nombre del estudiante según el formato deseado en el certificado:
 * - 'apellidos-nombres': Quispe Ramos, Juan Carlos
 * - 'nombres-apellidos': Juan Carlos Quispe Ramos
 * - 'mayusculas': QUISPE RAMOS, JUAN CARLOS
 */
export function formatearNombreSegunEstilo(
  nombre: string,
  formato: FormatoNombreEstudiante = 'apellidos-nombres'
): string {
  if (!nombre) return '';
  const limpio = nombre.trim();
  if (formato === 'mayusculas') {
    return limpio.toUpperCase();
  }
  if (formato === 'nombres-apellidos') {
    if (limpio.includes(',')) {
      const [apellidos, nombres] = limpio.split(',').map(s => s.trim());
      return nombres ? `${nombres} ${apellidos}` : limpio;
    }
    return limpio;
  }
  // 'apellidos-nombres':
  if (limpio.includes(',')) {
    return limpio;
  }
  const partes = limpio.split(/\s+/);
  if (partes.length >= 3) {
    const apellidos = partes.slice(-2).join(' ');
    const nombres = partes.slice(0, -2).join(' ');
    return `${apellidos}, ${nombres}`;
  }
  return limpio;
}

/**
 * Resuelve la redacción de horas y créditos según la configuración del certificado:
 * - 'horas-y-creditos': Horas y créditos juntos
 * - 'solo-horas': Únicamente horas
 * - 'solo-creditos': Únicamente créditos
 * - 'personalizado': Texto libre
 * Soporta prefijo personalizable y sufijos personalizables (ej: "horas académicas", "créditos académicos", "hrs.", etc.)
 */

/**
 * Resuelve la redacción de la variable independiente HORAS:
 * Permite prefijo propio, valor de horas dinámico o fijo, y sufijo propio (o vacío).
 */
export function resolverTextoHoras(
  cfgHoras?: PosicionElemento,
  horasOriginales?: string,
  esDiploma: boolean = false,
  creditosOriginales?: string | number,
  horasNumOriginal?: string | number
): string {
  if (!cfgHoras) return '';
  if (cfgHoras.textoPersonalizado) {
    return cfgHoras.textoPersonalizado.trim();
  }
  if (cfgHoras.modoHorasCreditos === 'personalizado' && cfgHoras.textoHorasPersonalizado) {
    return cfgHoras.textoHorasPersonalizado.trim();
  }

  // 1. Extraer número de horas dinámico si no está explícito en cfgHoras.horasValor
  let valHoras = cfgHoras.horasValor?.trim();
  if (!valHoras) {
    if (horasNumOriginal) {
      valHoras = String(horasNumOriginal).replace(/[^0-9]/g, '').trim();
    } else if (horasOriginales) {
      const matchH = horasOriginales.match(/(\d+)\s*(?:horas|hrs)/i);
      if (matchH) {
        valHoras = matchH[1];
      } else {
        const justNum = horasOriginales.replace(/[^0-9]/g, '');
        if (justNum) valHoras = justNum;
      }
    }
  }
  if (!valHoras) {
    valHoras = esDiploma ? '325' : '108';
  }

  // Sufijo (por defecto 'horas académicas' si no está definido)
  const sufijo = cfgHoras.sufijo !== undefined 
    ? cfgHoras.sufijo.trim() 
    : (cfgHoras.sufijoHoras !== undefined ? cfgHoras.sufijoHoras.trim() : 'horas académicas');

  const textoNumeroYSufijo = valHoras.match(/horas|hrs/i)
    ? valHoras
    : (sufijo ? valHoras + ' ' + sufijo : valHoras);

  const prefijo = cfgHoras.textoPrefijo !== undefined ? cfgHoras.textoPrefijo : '';
  return (prefijo + textoNumeroYSufijo).trim();
}

/**
 * Resuelve la redacción de la variable independiente CRÉDITOS:
 * Permite prefijo propio (ej: "y ", "Créditos: "), valor dinámico o fijo, y sufijo propio (o vacío).
 */
export function resolverTextoCreditos(
  cfgCreditos?: PosicionElemento,
  creditosOriginales?: string | number,
  esDiploma: boolean = false,
  horasOriginales?: string,
  horasNumOriginal?: string | number
): string {
  if (!cfgCreditos) return '';
  if (cfgCreditos.textoPersonalizado) {
    return cfgCreditos.textoPersonalizado.trim();
  }

  // 1. Extraer número de créditos dinámico si no está explícito en cfgCreditos.creditosValor
  let valCreditos = cfgCreditos.creditosValor?.trim();
  if (!valCreditos) {
    if (creditosOriginales) {
      valCreditos = String(creditosOriginales).replace(/[^0-9]/g, '').trim();
    } else if (horasOriginales) {
      const matchC = horasOriginales.match(/(\d+)\s*cr[ée]ditos/i);
      if (matchC) {
        valCreditos = matchC[1];
      }
    }
  }
  if (!valCreditos) {
    valCreditos = esDiploma ? '13' : '4';
  }

  // Sufijo (por defecto 'créditos académicos' si no está definido)
  const sufijo = cfgCreditos.sufijo !== undefined 
    ? cfgCreditos.sufijo.trim() 
    : (cfgCreditos.sufijoCreditos !== undefined ? cfgCreditos.sufijoCreditos.trim() : 'créditos académicos');

  const textoNumeroYSufijo = valCreditos.match(/cr[ée]ditos|cr[ée]d/i)
    ? valCreditos
    : (sufijo ? valCreditos + ' ' + sufijo : valCreditos);

  const prefijo = cfgCreditos.textoPrefijo !== undefined ? cfgCreditos.textoPrefijo : '';
  return (prefijo + textoNumeroYSufijo).trim();
}

export function resolverTextoHorasCreditos(
  cfgHoras: PosicionElemento,
  horasOriginales?: string,
  esDiploma: boolean = false,
  creditosOriginales?: string | number,
  horasNumOriginal?: string | number
): string {
  if (cfgHoras.modoHorasCreditos === 'personalizado' && cfgHoras.textoHorasPersonalizado) {
    let personalizado = cfgHoras.textoHorasPersonalizado;
    // Sustitución inteligente de tokens si existen
    if (personalizado.includes('{horas}') || personalizado.includes('{creditos}')) {
      const h = cfgHoras.horasValor || (horasNumOriginal ? String(horasNumOriginal) : (esDiploma ? '325' : '108'));
      const c = cfgHoras.creditosValor || (creditosOriginales ? String(creditosOriginales) : (esDiploma ? '13' : '4'));
      personalizado = personalizado.replace(/\{horas\}/g, h).replace(/\{creditos\}/g, c);
    }
    return personalizado.trim();
  }

  // 1. Extraer número de horas dinámico si no está explícito en cfgHoras.horasValor
  let valHoras = cfgHoras.horasValor?.trim();
  if (!valHoras) {
    if (horasNumOriginal) {
      valHoras = String(horasNumOriginal).replace(/[^0-9]/g, '').trim();
    } else if (horasOriginales) {
      const matchH = horasOriginales.match(/(\d+)\s*(?:horas|hrs)/i);
      if (matchH) {
        valHoras = matchH[1];
      } else {
        const justNum = horasOriginales.replace(/[^0-9]/g, '');
        if (justNum) valHoras = justNum;
      }
    }
  }
  if (!valHoras) {
    valHoras = esDiploma ? '325' : '108';
  }

  // 2. Extraer número de créditos dinámico si no está explícito en cfgHoras.creditosValor
  let valCreditos = cfgHoras.creditosValor?.trim();
  if (!valCreditos) {
    if (creditosOriginales) {
      valCreditos = String(creditosOriginales).replace(/[^0-9]/g, '').trim();
    } else if (horasOriginales) {
      const matchC = horasOriginales.match(/(\d+)\s*cr[ée]ditos/i);
      if (matchC) {
        valCreditos = matchC[1];
      }
    }
  }
  if (!valCreditos) {
    valCreditos = esDiploma ? '13' : '4';
  }

  // 3. Sufijos personalizables (por defecto: "horas académicas" y "créditos académicos")
  const sufijoH = cfgHoras.sufijoHoras !== undefined 
    ? cfgHoras.sufijoHoras.trim() 
    : 'horas académicas';
  const sufijoC = cfgHoras.sufijoCreditos !== undefined 
    ? cfgHoras.sufijoCreditos.trim() 
    : 'créditos académicos';
  const conector = cfgHoras.conectorHorasCreditos !== undefined
    ? cfgHoras.conectorHorasCreditos
    : ' y ';

  // Armar partes con o sin sufijo (si el usuario ya escribió "horas" en el valor, no duplicar sufijo)
  const textoParteHoras = valHoras.match(/horas|hrs/i) 
    ? valHoras 
    : (sufijoH ? `${valHoras} ${sufijoH}` : valHoras);

  const textoParteCreditos = valCreditos.match(/cr[ée]ditos|cr[ée]d/i)
    ? valCreditos
    : (sufijoC ? `${valCreditos} ${sufijoC}` : valCreditos);

  let cuerpo = '';
  const modo = cfgHoras.modoHorasCreditos || 'horas-y-creditos';

  if (modo === 'solo-horas') {
    cuerpo = textoParteHoras;
  } else if (modo === 'solo-creditos') {
    cuerpo = textoParteCreditos;
  } else if (modo === 'horas-y-creditos') {
    cuerpo = `${textoParteHoras}${conector}${textoParteCreditos}`;
  }

  // Prefijo personalizable si está definido (incluso si el usuario lo deja vacío '')
  if (cfgHoras.textoPrefijo !== undefined) {
    return `${cfgHoras.textoPrefijo}${cuerpo}`.trim();
  }

  // Prefijo por defecto institucional si no fue especificado
  return esDiploma
    ? `con un total de ${cuerpo},`
    : `desarrollado según la malla curricular establecida con un total de ${cuerpo}`;
}

/**
 * Divide el título de programa o módulo en líneas equilibradas respetando el límite estricto según orientación:
 * - A4 Horizontal: Máximo 2 líneas
 * - A4 Vertical: Máximo 3 líneas
 * Mantiene palabras y conectores indivisibles.
 */
export function dividirTextoProgramaEnLineas(
  texto: string,
  orientacion: 'horizontal' | 'vertical',
  anchoMaxPt: number,
  tamanoBasePt: number,
  fuente?: TipoFuenteCertificado,
  esNegrita: boolean = true,
  esCursiva: boolean = false
): { lineas: string[]; tamanoFuentePt: number } {
  if (!texto) return { lineas: [''], tamanoFuentePt: tamanoBasePt };

  const palabras = texto.split(' ');
  const esVertical = orientacion === 'vertical';

  // 1. Probar si entra en 1 sola línea
  const ancho1LineaPt = medirAnchoTextoPt(texto, tamanoBasePt, fuente, esNegrita, esCursiva);
  if (ancho1LineaPt <= anchoMaxPt || palabras.length <= 1) {
    let tam = tamanoBasePt;
    if (ancho1LineaPt > anchoMaxPt && anchoMaxPt > 0) {
      tam = Math.max(10, Number((tamanoBasePt * (anchoMaxPt / ancho1LineaPt)).toFixed(1)));
    }
    return { lineas: [texto], tamanoFuentePt: tam };
  }

  // 2. Si no entra en 1 sola línea, calcular la mejor división en 2 líneas
  let mejorDiff2 = Infinity;
  let corte2 = Math.floor(palabras.length / 2);
  for (let i = 1; i < palabras.length; i++) {
    const p1 = palabras.slice(0, i).join(' ');
    const p2 = palabras.slice(i).join(' ');
    const diff = Math.abs(p1.length - p2.length);
    if (diff < mejorDiff2) {
      mejorDiff2 = diff;
      corte2 = i;
    }
  }
  const linea2_1 = palabras.slice(0, corte2).join(' ');
  const linea2_2 = palabras.slice(corte2).join(' ');
  const w2_1 = medirAnchoTextoPt(linea2_1, tamanoBasePt, fuente, esNegrita, esCursiva);
  const w2_2 = medirAnchoTextoPt(linea2_2, tamanoBasePt, fuente, esNegrita, esCursiva);
  const maxW2 = Math.max(w2_1, w2_2);

  // En Horizontal el máximo es de 2 líneas estrictas:
  if (!esVertical || palabras.length < 3) {
    let tam2 = tamanoBasePt;
    if (maxW2 > anchoMaxPt && anchoMaxPt > 0) {
      tam2 = Math.max(10, Number((tamanoBasePt * (anchoMaxPt / maxW2)).toFixed(1)));
    }
    return { lineas: [linea2_1, linea2_2], tamanoFuentePt: tam2 };
  }

  // 3. En Vertical el máximo es de hasta 3 líneas:
  // Si en 2 líneas sobrepasa el ancho físico máximo o tiene 4 o más palabras,
  // evaluamos si una división en 3 líneas distribuye mejor el texto.
  if (maxW2 > anchoMaxPt || palabras.length >= 4) {
    let mejorDiff3 = Infinity;
    let corte3_1 = 1;
    let corte3_2 = 2;

    for (let i = 1; i < palabras.length - 1; i++) {
      for (let j = i + 1; j < palabras.length; j++) {
        const p1 = palabras.slice(0, i).join(' ');
        const p2 = palabras.slice(i, j).join(' ');
        const p3 = palabras.slice(j).join(' ');
        const len1 = p1.length;
        const len2 = p2.length;
        const len3 = p3.length;
        const maxLen = Math.max(len1, len2, len3);
        const minLen = Math.min(len1, len2, len3);
        const diff = maxLen - minLen;
        if (diff < mejorDiff3) {
          mejorDiff3 = diff;
          corte3_1 = i;
          corte3_2 = j;
        }
      }
    }

    const l3_1 = palabras.slice(0, corte3_1).join(' ');
    const l3_2 = palabras.slice(corte3_1, corte3_2).join(' ');
    const l3_3 = palabras.slice(corte3_2).join(' ');

    const w3_1 = medirAnchoTextoPt(l3_1, tamanoBasePt, fuente, esNegrita, esCursiva);
    const w3_2 = medirAnchoTextoPt(l3_2, tamanoBasePt, fuente, esNegrita, esCursiva);
    const w3_3 = medirAnchoTextoPt(l3_3, tamanoBasePt, fuente, esNegrita, esCursiva);
    const maxW3 = Math.max(w3_1, w3_2, w3_3);

    // Si 3 líneas reduce el ancho de la línea más larga respecto a 2 líneas:
    if (maxW3 < maxW2) {
      let tam3 = tamanoBasePt;
      if (maxW3 > anchoMaxPt && anchoMaxPt > 0) {
        tam3 = Math.max(10, Number((tamanoBasePt * (anchoMaxPt / maxW3)).toFixed(1)));
      }
      return { lineas: [l3_1, l3_2, l3_3], tamanoFuentePt: tam3 };
    }
  }

  // Si 2 líneas ya eran óptimas en vertical
  let tamFinal = tamanoBasePt;
  if (maxW2 > anchoMaxPt && anchoMaxPt > 0) {
    tamFinal = Math.max(10, Number((tamanoBasePt * (anchoMaxPt / maxW2)).toFixed(1)));
  }
  return { lineas: [linea2_1, linea2_2], tamanoFuentePt: tamFinal };
}

export interface PosicionElemento {
  x: number; // Porcentaje 0 a 100 respecto al ancho A4
  y: number; // Porcentaje 0 a 100 respecto al alto A4
  alineacion: ElementoAlineacion;
  tamano?: number; // Tamaño en pt para QR
  tamanoCm?: number; // Tamaño físico en centímetros para QR (1 cm ≈ 28.346 pt)
  tamanoFuente?: number; // Tamaño de fuente en pt/px
  color?: string; // Color hexadecimal o rgb de texto (por defecto #000000)
  visible: boolean;
  fuente?: TipoFuenteCertificado;
  textoPrefijo?: string; // Prefijo personalizable (ej: "Fecha de emisión: ", "CÓD.: ", "Duración: ", o vacío)
  sufijo?: string; // Sufijo personalizable (ej: "horas académicas", "hrs.", "créditos", o vacío para solo el número)
  textoPersonalizado?: string; // Texto completamente libre
  formatoFecha?: FormatoFechaCertificado;
  formatoNombre?: FormatoNombreEstudiante;
  modoHorasCreditos?: ModoHorasCreditos;
  horasValor?: string;
  creditosValor?: string;
  sufijoHoras?: string; // Texto que acompaña a las horas (por defecto "horas académicas")
  sufijoCreditos?: string; // Texto que acompaña a los créditos (por defecto "créditos académicos")
  conectorHorasCreditos?: string; // Conector entre horas y créditos (por defecto " y ")
  textoHorasPersonalizado?: string;
  anchoMaximoCm?: number; // Ancho máximo físico en centímetros A4 para todas las variables
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
  creditos: PosicionElemento;
  fecha: PosicionElemento;
  codigo: PosicionElemento;
  qr: PosicionElemento;
}

export const DISENO_DEFAULT_HORIZONTAL: DisenoCoordenadas = {
  estudiante: { x: 50, y: 35, alineacion: 'center', visible: true, fuente: 'serif-institucional', formatoNombre: 'apellidos-nombres', anchoMaximoCm: 25.0, tamanoFuente: 36, color: '#000000', negrita: false, interlineado: 1.25 },
  programa: { x: 50, y: 53.5, alineacion: 'center', visible: true, fuente: 'sans-moderna', anchoMaximoCm: 25.5, tamanoFuente: 22, color: '#000000', negrita: false, interlineado: 1.25 },
  horas: { x: 50, y: 63, alineacion: 'center', visible: true, fuente: 'sans-formal', textoPrefijo: '', sufijo: 'horas académicas', tamanoFuente: 12, color: '#000000' },
  creditos: { x: 50, y: 66, alineacion: 'center', visible: false, fuente: 'sans-formal', textoPrefijo: '', sufijo: 'créditos académicos', tamanoFuente: 12, color: '#000000' },
  fecha: { x: 86, y: 88, alineacion: 'right', visible: true, fuente: 'sans-formal', textoPrefijo: 'Fecha de emisión: ', formatoFecha: 'larga', tamanoFuente: 10, color: '#000000' },
  codigo: { x: 86, y: 94, alineacion: 'right', visible: true, fuente: 'sans-formal', textoPrefijo: 'CÓD.: ', tamanoFuente: 11, color: '#000000', negrita: false },
  qr: { x: 86, y: 74, alineacion: 'right', tamano: 56, tamanoCm: 2.0, visible: true }
};

export const DISENO_DEFAULT_VERTICAL: DisenoCoordenadas = {
  estudiante: { x: 50, y: 38, alineacion: 'center', visible: true, fuente: 'serif-institucional', formatoNombre: 'apellidos-nombres', anchoMaximoCm: 18.5, tamanoFuente: 30, color: '#000000', negrita: false, interlineado: 1.25 },
  programa: { x: 50, y: 52, alineacion: 'center', visible: true, fuente: 'sans-moderna', anchoMaximoCm: 18.5, tamanoFuente: 18, color: '#000000', negrita: false, interlineado: 1.25 },
  horas: { x: 50, y: 61, alineacion: 'center', visible: true, fuente: 'sans-formal', textoPrefijo: '', sufijo: 'horas académicas', tamanoFuente: 10, color: '#000000' },
  creditos: { x: 50, y: 64, alineacion: 'center', visible: false, fuente: 'sans-formal', textoPrefijo: '', sufijo: 'créditos académicos', tamanoFuente: 10, color: '#000000' },
  fecha: { x: 50, y: 86, alineacion: 'center', visible: true, fuente: 'sans-formal', textoPrefijo: 'Fecha de emisión: ', formatoFecha: 'larga', tamanoFuente: 10, color: '#000000' },
  codigo: { x: 50, y: 92, alineacion: 'center', visible: true, fuente: 'sans-formal', textoPrefijo: 'CÓD.: ', tamanoFuente: 11, color: '#000000', negrita: false },
  qr: { x: 50, y: 74, alineacion: 'center', tamano: 56, tamanoCm: 2.0, visible: true }
};

export interface AvanzaCertificateProps {
  tipo: 'DIPLOMA' | 'MODULAR' | 'CURSO' | 'CIP' | 'MIAMI' | 'TALLER' | string;
  estudiante: string;
  programa: string;
  modulo?: string | null;
  horas?: string;
  creditos?: string | number;
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
  creditos,
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
    creditos: { ...baseDefaults.creditos, ...(diseno?.creditos || {}) },
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

  // Formateo del nombre según preferencia (Apellidos, Nombres | Nombres y Apellidos | Mayúsculas)
  const nombreRaw = (estudiante || 'Quispe Ramos, Juan Carlos').trim();
  const nombreEstudiante = formatearNombreSegunEstilo(nombreRaw, cfg.estudiante.formatoNombre);

  // Redacción de Horas (variable independiente)
  const textoHoras = resolverTextoHoras(cfg.horas, horas, esDiploma);

  // Redacción de Créditos (variable independiente)
  const textoCreditos = resolverTextoCreditos(cfg.creditos, creditos, esDiploma, horas);

  const anchoEstudiantePct = resolverAnchoPct(cfg.estudiante.anchoMaximoCm, cfg.estudiante.anchoMaximo || 84);
  const anchoProgramaPct = resolverAnchoPct(cfg.programa.anchoMaximoCm, cfg.programa.anchoMaximo || 86);
  const anchoHorasPct = resolverAnchoPct(cfg.horas.anchoMaximoCm, cfg.horas.anchoMaximo || (esVertical ? 85 : 84));
  const anchoCreditosPct = resolverAnchoPct(cfg.creditos?.anchoMaximoCm, cfg.creditos?.anchoMaximo || (esVertical ? 85 : 84));
  const anchoFechaPct = resolverAnchoPct(cfg.fecha.anchoMaximoCm, cfg.fecha.anchoMaximo || (esVertical ? 60 : 35));
  const anchoCodigoPct = resolverAnchoPct(cfg.codigo.anchoMaximoCm, cfg.codigo.anchoMaximo || (esVertical ? 60 : 35));

  // 1. AJUSTE EXCLUSIVO DE TAMAÑO PARA NOMBRE (Sin letter-spacing):
  // Se evalúa si el nombre sobrepasa el ancho físico máximo en cm (anchoEstudianteCm).
  // Solo cuando supera este límite físico se reduce proporcionalmente el font size en pt.
  const tamanoBaseEstPt = cfg.estudiante.tamanoFuente || (esVertical ? 28 : 36);
  const anchoEstudianteCm = cfg.estudiante.anchoMaximoCm || (esVertical ? 18.5 : 25.0);
  const anchoA4Pt = esVertical ? A4_ANCHO_PT_VERTICAL : A4_ANCHO_PT_HORIZONTAL;
  const maxEstudiantePt = (anchoEstudianteCm / anchoA4Cm) * anchoA4Pt;

  // Medición matemática real con canvas idéntica al generador de PDF
  const anchoMedidoEstPt = medirAnchoTextoPt(
    nombreEstudiante,
    tamanoBaseEstPt,
    cfg.estudiante.fuente,
    !!cfg.estudiante.negrita,
    !!cfg.estudiante.cursiva
  );

  let tamanoEstudiantePt = tamanoBaseEstPt;
  if (anchoMedidoEstPt > maxEstudiantePt && maxEstudiantePt > 0) {
    const factorEst = maxEstudiantePt / anchoMedidoEstPt;
    tamanoEstudiantePt = Math.max(12, Number((tamanoBaseEstPt * factorEst).toFixed(1)));
  }

  // 2. AJUSTE EXACTO DE LÍNEAS Y TAMAÑO PARA PROGRAMA (Máx. 2 líneas en Horizontal / Máx. 3 líneas en Vertical)
  const esModular = String(tipo).toUpperCase() === 'MODULAR' && Boolean(modulo);
  const textoProgFinal = esModular ? tituloModuloLimpio : tituloProgramaLimpio;
  const tamanoBaseProgPt = cfg.programa.tamanoFuente || (esVertical ? 18 : 22);
  const anchoProgCm = cfg.programa.anchoMaximoCm || (esVertical ? 18.5 : 25.5);
  const maxProgPt = (anchoProgCm / anchoA4Cm) * anchoA4Pt;

  const { lineas: progLineas, tamanoFuentePt: tamanoProgPt } = dividirTextoProgramaEnLineas(
    textoProgFinal,
    orientacion,
    maxProgPt,
    tamanoBaseProgPt,
    cfg.programa.fuente,
    !!cfg.programa.negrita,
    !!cfg.programa.cursiva
  );

  // 3. AJUSTE DE ANCHO Y ESCALA PARA HORAS
  const tamanoBaseHorasPt = cfg.horas.tamanoFuente || (esDiploma ? 12 : 11);
  const anchoHorasCm = cfg.horas.anchoMaximoCm || (esVertical ? 18.5 : 25.0);
  const maxHorasPt = (anchoHorasCm / anchoA4Cm) * anchoA4Pt;
  const anchoMedidoHorasPt = medirAnchoTextoPt(
    textoHoras,
    tamanoBaseHorasPt,
    cfg.horas.fuente,
    !!cfg.horas.negrita,
    !!cfg.horas.cursiva
  );
  let tamanoHorasPt = tamanoBaseHorasPt;
  if (anchoMedidoHorasPt > maxHorasPt && maxHorasPt > 0) {
    tamanoHorasPt = Math.max(7, Number((tamanoBaseHorasPt * (maxHorasPt / anchoMedidoHorasPt)).toFixed(1)));
  }

  // 3.1. AJUSTE DE ANCHO Y ESCALA PARA CRÉDITOS
  const tamanoBaseCredPt = cfg.creditos?.tamanoFuente || (esDiploma ? 12 : 11);
  const anchoCredCm = cfg.creditos?.anchoMaximoCm || (esVertical ? 18.5 : 25.0);
  const maxCredPt = (anchoCredCm / anchoA4Cm) * anchoA4Pt;
  const anchoMedidoCredPt = medirAnchoTextoPt(
    textoCreditos,
    tamanoBaseCredPt,
    cfg.creditos?.fuente,
    !!cfg.creditos?.negrita,
    !!cfg.creditos?.cursiva
  );
  let tamanoCreditosPt = tamanoBaseCredPt;
  if (anchoMedidoCredPt > maxCredPt && maxCredPt > 0) {
    tamanoCreditosPt = Math.max(7, Number((tamanoBaseCredPt * (maxCredPt / anchoMedidoCredPt)).toFixed(1)));
  }

  // 4. AJUSTE DE ANCHO Y ESCALA PARA FECHA (con prefijo y formato puro)
  const fechaPura = formatearFechaSegunEstilo(fecha, cfg.fecha.formatoFecha || 'larga');
  const prefijoFecha = cfg.fecha.textoPrefijo !== undefined ? cfg.fecha.textoPrefijo : 'Fecha de emisión: ';
  const textoFechaCompleto = `${prefijoFecha}${fechaPura}`.trim();
  const tamanoBaseFechaPt = cfg.fecha.tamanoFuente || 10;
  const anchoFechaCm = cfg.fecha.anchoMaximoCm || (esVertical ? 15.0 : 10.0);
  const maxFechaPt = (anchoFechaCm / anchoA4Cm) * anchoA4Pt;
  const anchoMedidoFechaPt = medirAnchoTextoPt(
    textoFechaCompleto,
    tamanoBaseFechaPt,
    cfg.fecha.fuente,
    !!cfg.fecha.negrita,
    !!cfg.fecha.cursiva
  );
  let tamanoFechaPt = tamanoBaseFechaPt;
  if (anchoMedidoFechaPt > maxFechaPt && maxFechaPt > 0) {
    tamanoFechaPt = Math.max(7, Number((tamanoBaseFechaPt * (maxFechaPt / anchoMedidoFechaPt)).toFixed(1)));
  }

  // 5. AJUSTE DE ANCHO Y ESCALA PARA CÓDIGO ÚNICO (puro texto)
  const prefijoCodigo = cfg.codigo.textoPrefijo !== undefined ? cfg.codigo.textoPrefijo : 'CÓD.: ';
  const textoCodigoCompleto = `${prefijoCodigo}${codigo}`.trim();
  const tamanoBaseCodPt = cfg.codigo.tamanoFuente || 11;
  const anchoCodigoCm = cfg.codigo.anchoMaximoCm || (esVertical ? 15.0 : 10.0);
  const maxCodPt = (anchoCodigoCm / anchoA4Cm) * anchoA4Pt;
  const anchoMedidoCodPt = medirAnchoTextoPt(
    textoCodigoCompleto,
    tamanoBaseCodPt,
    cfg.codigo.fuente,
    !!cfg.codigo.negrita,
    !!cfg.codigo.cursiva
  );
  let tamanoCodPt = tamanoBaseCodPt;
  if (anchoMedidoCodPt > maxCodPt && maxCodPt > 0) {
    tamanoCodPt = Math.max(7, Number((tamanoBaseCodPt * (maxCodPt / anchoMedidoCodPt)).toFixed(1)));
  }

  // Relaciones de aspecto A4 exactas:
  const a4AspectClass = esVertical ? 'aspect-[210/297]' : 'aspect-[297/210]';

  // El contenedor permanece fijado exactamente en (x, y).
  // La alineación ('left' | 'center' | 'right') únicamente alinea el texto DENTRO de la caja sin mover el contenedor.
  const getTransform = () => 'translate(-50%, -50%)';

  // Helper para obtener el transform según punto de anclaje de elementos con ancho automático:
  // - left: el punto (x, y) es el extremo izquierdo (translate(0, -50%))
  // - center: el punto (x, y) es el centro exacto (translate(-50%, -50%))
  // - right: el punto (x, y) es el extremo derecho (translate(-100%, -50%))
  const getTransformAuto = (alineacion: ElementoAlineacion = 'center') => {
    if (alineacion === 'left') return 'translate(0%, -50%)';
    if (alineacion === 'right') return 'translate(-100%, -50%)';
    return 'translate(-50%, -50%)';
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
      {/* Carga e inyección explícita de Google Fonts para garantizar Outfit, Playfair, Cinzel, Cormorant, Lora, etc. */}
      <link 
        rel="stylesheet" 
        href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;800;900&family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Inter:wght@400;500;600;700;800;900&family=Lora:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Montserrat:ital,wght@0,400;0,600;0,700;0,800;0,900;1,400;1,700&family=Outfit:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,600;0,700;0,900;1,600&family=Roboto:ital,wght@0,400;0,500;0,700;0,900;1,400;1,700&display=swap" 
      />
      {/* Guía si no tiene fondo */}
      {!bgImg && (
        <div className="absolute inset-0 flex flex-col items-center justify-between p-6 pointer-events-none bg-radial from-slate-50 via-white to-slate-100/60 border-2 border-dashed border-slate-300 rounded-xl m-2">
          <div className="flex items-center justify-between w-full opacity-40">
            <span className="text-[9px] tabular-nums font-bold tracking-widest text-slate-500 uppercase">
              Lienzo A4 {esVertical ? 'Vertical (21.0×29.7 cm)' : 'Horizontal (29.7×21.0 cm)'}
            </span>
            <span className="text-[9px] tabular-nums text-slate-400">Sin plantilla de fondo</span>
          </div>

          <div className="text-center opacity-30 my-auto">
            <FileImage className="size-12 mx-auto text-slate-400 mb-2 stroke-[1.2]" />
            <p className="text-xs font-semibold text-slate-600">Sube una imagen de fondo membretada A4</p>
            <p className="text-[10px] text-slate-400">Puedes arrastrar cualquier texto en vivo para calzarlo con el membrete</p>
          </div>

          <div className="w-full flex justify-end opacity-30">
            <span className="text-[8px] tabular-nums">EDUMIN • Modelo Base</span>
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
            cfg.estudiante.alineacion === 'center' ? 'justify-center text-center' :
            cfg.estudiante.alineacion === 'right' ? 'justify-end text-right' : 'justify-start text-left'
          } ${
            elementoActivo === 'estudiante' 
              ? 'outline outline-2 outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.estudiante.x}%`,
            top: `${cfg.estudiante.y}%`,
            width: `${anchoEstudiantePct}%`,
            maxWidth: `${anchoEstudiantePct}%`,
            transform: getTransform(),
            textAlign: cfg.estudiante.alineacion
          }}
        >
          <h2 
            className="leading-none whitespace-nowrap w-full"
            style={{
              fontFamily: obtenerFontFamily(cfg.estudiante.fuente, '"Times New Roman", Times, Georgia, serif'),
              fontSize: calcularTamanoCqw(tamanoEstudiantePt, orientacion),
              color: cfg.estudiante.color || '#000000',
              fontWeight: cfg.estudiante.negrita ? 'bold' : 'normal',
              fontStyle: cfg.estudiante.cursiva ? 'italic' : 'normal',
              textDecoration: cfg.estudiante.subrayado ? 'underline' : 'none',
              textAlign: cfg.estudiante.alineacion
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
              ? 'outline outline-2 outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.programa.x}%`,
            top: `${cfg.programa.y}%`,
            width: `${anchoProgramaPct}%`,
            maxWidth: `${anchoProgramaPct}%`,
            transform: getTransform()
          }}
        >
          <h3 
            className="uppercase font-black w-full"
            style={{
              fontFamily: obtenerFontFamily(cfg.programa.fuente, '"Montserrat", "Segoe UI", Arial, sans-serif'),
              fontSize: calcularTamanoCqw(tamanoProgPt, orientacion),
              color: cfg.programa.color || '#000000',
              fontWeight: cfg.programa.negrita ? 'bold' : 'normal',
              fontStyle: cfg.programa.cursiva ? 'italic' : 'normal',
              textDecoration: cfg.programa.subrayado ? 'underline' : 'none',
              lineHeight: cfg.programa.interlineado || 1.25,
              textAlign: cfg.programa.alineacion
            }}
          >
            {progLineas.map((lin, idx) => (
              <span key={idx} className="block whitespace-nowrap">{lin}</span>
            ))}
          </h3>
        </div>
      )}

      {/* 3. LÍNEA DE HORAS (Variable independiente) */}
      {cfg.horas.visible && (
        <div 
          onMouseDown={(e) => handleIniciarArrastre('horas', e)}
          onTouchStart={(e) => handleIniciarArrastre('horas', e)}
          onClick={(e) => {
            e.stopPropagation();
            if (onSeleccionarElemento) onSeleccionarElemento('horas');
          }}
          className={`absolute z-10 transition-all duration-150 flex items-center ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
          } ${
            cfg.horas.alineacion === 'center' ? 'justify-center text-center' :
            cfg.horas.alineacion === 'right' ? 'justify-end text-right' : 'justify-start text-left'
          } ${
            elementoActivo === 'horas' 
              ? 'outline outline-2 outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.horas.x}%`,
            top: `${cfg.horas.y}%`,
            width: 'max-content',
            maxWidth: 'none',
            transform: getTransformAuto(cfg.horas.alineacion),
            textAlign: cfg.horas.alineacion,
            fontFamily: obtenerFontFamily(cfg.horas.fuente, '"Segoe UI", Arial, sans-serif'),
            color: cfg.horas.color || '#000000',
            fontWeight: cfg.horas.negrita ? 'bold' : 'normal',
            fontStyle: cfg.horas.cursiva ? 'italic' : 'normal',
            textDecoration: cfg.horas.subrayado ? 'underline' : 'none'
          }}
        >
          <p 
            className="whitespace-nowrap inline-block"
            style={{ 
              fontFamily: obtenerFontFamily(cfg.horas.fuente, '"Segoe UI", Arial, sans-serif'),
              fontSize: calcularTamanoCqw(tamanoHorasPt, orientacion),
              textAlign: cfg.horas.alineacion 
            }}
          >
            {textoHoras}
          </p>
        </div>
      )}

      {/* 3.1. LÍNEA DE CRÉDITOS (Variable independiente) */}
      {cfg.creditos?.visible && (
        <div 
          onMouseDown={(e) => handleIniciarArrastre('creditos', e)}
          onTouchStart={(e) => handleIniciarArrastre('creditos', e)}
          onClick={(e) => {
            e.stopPropagation();
            if (onSeleccionarElemento) onSeleccionarElemento('creditos');
          }}
          className={`absolute z-10 transition-all duration-150 flex items-center ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
          } ${
            cfg.creditos.alineacion === 'center' ? 'justify-center text-center' :
            cfg.creditos.alineacion === 'right' ? 'justify-end text-right' : 'justify-start text-left'
          } ${
            elementoActivo === 'creditos' 
              ? 'outline outline-2 outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.creditos.x}%`,
            top: `${cfg.creditos.y}%`,
            width: 'max-content',
            maxWidth: 'none',
            transform: getTransformAuto(cfg.creditos.alineacion),
            textAlign: cfg.creditos.alineacion,
            fontFamily: obtenerFontFamily(cfg.creditos.fuente, '"Segoe UI", Arial, sans-serif'),
            color: cfg.creditos.color || '#000000',
            fontWeight: cfg.creditos.negrita ? 'bold' : 'normal',
            fontStyle: cfg.creditos.cursiva ? 'italic' : 'normal',
            textDecoration: cfg.creditos.subrayado ? 'underline' : 'none'
          }}
        >
          <p 
            className="whitespace-nowrap inline-block"
            style={{ 
              fontFamily: obtenerFontFamily(cfg.creditos.fuente, '"Segoe UI", Arial, sans-serif'),
              fontSize: calcularTamanoCqw(tamanoCreditosPt, orientacion),
              textAlign: cfg.creditos.alineacion 
            }}
          >
            {textoCreditos}
          </p>
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
          className={`absolute z-20 flex flex-col items-center justify-center bg-white p-1 rounded-lg border border-slate-200 aspect-square transition-all duration-150 ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-auto'
          } ${
            elementoActivo === 'qr' ? 'outline outline-2 outline-indigo-500 outline-offset-4 rounded-lg bg-indigo-500/[0.04]' : ''
          }`}
          style={{
            left: `${cfg.qr.x}%`,
            top: `${cfg.qr.y}%`,
            transform: getTransform(),
            width: calcularTamanoCqw(resolverTamanoQrPt(cfg.qr), orientacion),
            height: calcularTamanoCqw(resolverTamanoQrPt(cfg.qr), orientacion),
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
          className={`absolute z-20 transition-all duration-150 flex items-center ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
          } ${
            cfg.fecha.alineacion === 'center' ? 'justify-center text-center' :
            cfg.fecha.alineacion === 'right' ? 'justify-end text-right' : 'justify-start text-left'
          } ${
            elementoActivo === 'fecha' 
              ? 'outline outline-2 outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.fecha.x}%`,
            top: `${cfg.fecha.y}%`,
            width: 'max-content',
            maxWidth: 'none',
            transform: getTransformAuto(cfg.fecha.alineacion),
            textAlign: cfg.fecha.alineacion,
            fontFamily: obtenerFontFamily(cfg.fecha.fuente, '"Segoe UI", Arial, sans-serif')
          }}
        >
          <p 
            className="whitespace-nowrap inline-block"
            style={{ 
              fontFamily: obtenerFontFamily(cfg.fecha.fuente, '"Segoe UI", Arial, sans-serif'),
              fontSize: calcularTamanoCqw(tamanoFechaPt, orientacion),
              color: cfg.fecha.color || '#000000',
              fontWeight: cfg.fecha.negrita ? 'bold' : 'normal',
              fontStyle: cfg.fecha.cursiva ? 'italic' : 'normal',
              textDecoration: cfg.fecha.subrayado ? 'underline' : 'none',
              textAlign: cfg.fecha.alineacion
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
          className={`absolute z-20 transition-all duration-150 flex items-center ${
            modoArrastrable ? 'cursor-grab active:cursor-grabbing pointer-events-auto' : 'pointer-events-none'
          } ${
            cfg.codigo.alineacion === 'center' ? 'justify-center text-center' :
            cfg.codigo.alineacion === 'right' ? 'justify-end text-right' : 'justify-start text-left'
          } ${
            elementoActivo === 'codigo' 
              ? 'outline outline-2 outline-indigo-500 outline-offset-4 rounded-md bg-indigo-500/[0.04]' 
              : ''
          }`}
          style={{
            left: `${cfg.codigo.x}%`,
            top: `${cfg.codigo.y}%`,
            width: 'max-content',
            maxWidth: 'none',
            transform: getTransformAuto(cfg.codigo.alineacion),
            textAlign: cfg.codigo.alineacion
          }}
        >
          <span 
            className="whitespace-nowrap inline-block"
            style={{
              fontSize: calcularTamanoCqw(tamanoCodPt, orientacion),
              color: cfg.codigo.color || '#000000',
              fontFamily: obtenerFontFamily(cfg.codigo.fuente, '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'),
              fontWeight: cfg.codigo.negrita ? 'bold' : 'normal',
              fontStyle: cfg.codigo.cursiva ? 'italic' : 'normal',
              textDecoration: cfg.codigo.subrayado ? 'underline' : 'none',
              textAlign: cfg.codigo.alineacion
            }}
          >
            {textoCodigoCompleto}
          </span>
        </div>
      )}
    </div>
  );
}
