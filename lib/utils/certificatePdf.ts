/**
 * Generador nativo y optimizado de certificados A4 para EDUMIN y AVANZA
 * Proporciona descarga directa de PDF A4 (Horizontal o Vertical)
 * sin dependencias pesadas, con máxima nitidez de impresión y proporciones exactas.
 */

import { 
  DisenoCoordenadas, 
  DISENO_DEFAULT_HORIZONTAL, 
  DISENO_DEFAULT_VERTICAL,
  ajustarConectorSinHuerfana,
  obtenerFontFamily,
  formatearFechaSegunEstilo,
  calcularTamanoPxCanvas,
  resolverTamanoQrPt,
  formatearNombreSegunEstilo,
  resolverTextoHorasCreditos
} from '@/components/certificates/AvanzaCertificateRenderer';
import QRCode from 'qrcode';
import { generarUrlQRValidacion } from '@/lib/utils/certificateUtils';

export interface CertificadoPdfData {
  tipo: 'DIPLOMA' | 'MODULAR' | 'CURSO' | 'CIP' | 'MIAMI' | 'TALLER' | string;
  orientacion?: 'horizontal' | 'vertical';
  estudiante: string;
  programa: string;
  modulo?: string | null;
  horas?: string;
  fecha?: string;
  codigo: string;
  ciudad?: string;
  imagenFondoUrl?: string | null;
  incluyeQr?: boolean;
  diseno?: Partial<DisenoCoordenadas>;
}

/**
 * Empaqueta un buffer JPEG en una estructura binaria PDF 1.4 A4 válida.
 * Dimensiones estándar A4 (72 puntos por pulgada):
 * - Horizontal (Landscape): 841.89 pt ancho x 595.28 pt alto
 * - Vertical (Portrait): 595.28 pt ancho x 841.89 pt alto
 */
export function empaquetarJpegEnPdfA4(
  jpegBytes: Uint8Array,
  orientacion: 'horizontal' | 'vertical' = 'horizontal',
  imgWidthPx: number = 2480,
  imgHeightPx: number = 1754
): Uint8Array {
  const isLandscape = orientacion === 'horizontal';
  const pageW = isLandscape ? 841.89 : 595.28;
  const pageH = isLandscape ? 595.28 : 841.89;

  const encoder = new TextEncoder();

  const header = '%PDF-1.4\n';
  const obj1 = '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n';
  const obj2 = '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n';
  const obj3 = `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`;

  const imgHeader = `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgWidthPx} /Height ${imgHeightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`;
  const imgFooter = '\nendstream\nendobj\n';

  const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im1 Do\nQ`;
  const obj5 = `5 0 obj\n<< /Length ${encoder.encode(contentStream).length} >>\nstream\n${contentStream}\nendstream\nendobj\n`;

  const partHeader = encoder.encode(header);
  const partObj1 = encoder.encode(obj1);
  const partObj2 = encoder.encode(obj2);
  const partObj3 = encoder.encode(obj3);
  const partImgHeader = encoder.encode(imgHeader);
  const partImgFooter = encoder.encode(imgFooter);
  const partObj5 = encoder.encode(obj5);

  // Calcular offsets para la tabla xref
  let currentOffset = partHeader.length;
  const offsets: string[] = ['0000000000 65535 f \n'];

  offsets.push(String(currentOffset).padStart(10, '0') + ' 00000 n \n');
  currentOffset += partObj1.length;

  offsets.push(String(currentOffset).padStart(10, '0') + ' 00000 n \n');
  currentOffset += partObj2.length;

  offsets.push(String(currentOffset).padStart(10, '0') + ' 00000 n \n');
  currentOffset += partObj3.length;

  offsets.push(String(currentOffset).padStart(10, '0') + ' 00000 n \n');
  currentOffset += partImgHeader.length + jpegBytes.length + partImgFooter.length;

  offsets.push(String(currentOffset).padStart(10, '0') + ' 00000 n \n');
  const xrefOffset = currentOffset + partObj5.length;

  const xref = `xref\n0 6\n${offsets.join('')}trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const partXref = encoder.encode(xref);

  const totalLength = 
    partHeader.length +
    partObj1.length +
    partObj2.length +
    partObj3.length +
    partImgHeader.length +
    jpegBytes.length +
    partImgFooter.length +
    partObj5.length +
    partXref.length;

  const pdf = new Uint8Array(totalLength);
  let pos = 0;

  const pushPart = (chunk: Uint8Array) => {
    pdf.set(chunk, pos);
    pos += chunk.length;
  };

  pushPart(partHeader);
  pushPart(partObj1);
  pushPart(partObj2);
  pushPart(partObj3);
  pushPart(partImgHeader);
  pushPart(jpegBytes);
  pushPart(partImgFooter);
  pushPart(partObj5);
  pushPart(partXref);

  return pdf;
}

function buildCanvasFont(
  fontSize: number,
  fontFamily: string,
  negrita?: boolean,
  cursiva?: boolean
): string {
  const italic = cursiva ? 'italic ' : '';
  const weight = negrita ? 'bold ' : 'normal ';
  return `${italic}${weight}${fontSize}px ${fontFamily}`;
}

function drawStyledText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  fontSize: number,
  subrayado?: boolean
) {
  ctx.fillText(text, x, y);
  if (subrayado) {
    const width = ctx.measureText(text).width;
    let startX = x;
    if (ctx.textAlign === 'center') {
      startX = x - width / 2;
    } else if (ctx.textAlign === 'right') {
      startX = x - width;
    }
    const underlineY = y + (fontSize * 0.55);
    const prevStroke = ctx.strokeStyle;
    const prevLineWidth = ctx.lineWidth;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.lineWidth = Math.max(1.5, fontSize * 0.06);
    ctx.beginPath();
    ctx.moveTo(startX, underlineY);
    ctx.lineTo(startX + width, underlineY);
    ctx.stroke();
    ctx.strokeStyle = prevStroke;
    ctx.lineWidth = prevLineWidth;
  }
}

/**
 * Renderiza el certificado con máxima resolución sobre un canvas A4 y genera el PDF descargable
 */
export async function descargarCertificadoA4Pdf(data: CertificadoPdfData, nombreArchivo?: string): Promise<void> {
  const orientacion = data.orientacion || 'horizontal';
  const isLandscape = orientacion === 'horizontal';

  // Dimensiones A4 a 200 DPI (alta resolución nítida para impresión: 2338 x 1653)
  const canvasW = isLandscape ? 2338 : 1653;
  const canvasH = isLandscape ? 1653 : 2338;
  const anchoA4Cm = isLandscape ? 29.7 : 21.0;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('No se pudo inicializar el contexto 2D para renderizar el certificado.');
  }

  // Fondo blanco base
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasW, canvasH);

  // Determinar URL de fondo
  let bgUrl = data.imagenFondoUrl;
  if (!bgUrl) {
    const esDip = String(data.tipo).toUpperCase() === 'DIPLOMA';
    bgUrl = esDip 
      ? '/assets/certificates/plantilla_avanza_diploma_bg.png' 
      : '/assets/certificates/plantilla_avanza_modular_bg.png';
  }

  // Cargar fuentes web antes de dibujar en canvas para garantizar métricas y glifos idénticos
  if (typeof document !== 'undefined' && document.fonts) {
    try {
      await Promise.allSettled([
        document.fonts.load('bold 36px "Outfit"'),
        document.fonts.load('normal 24px "Outfit"'),
        document.fonts.load('bold 36px "Montserrat"'),
        document.fonts.load('normal 24px "Montserrat"'),
        document.fonts.load('bold 36px "Inter"'),
        document.fonts.load('normal 24px "Inter"'),
        document.fonts.load('bold 36px "Cinzel"'),
        document.fonts.load('normal 24px "Cinzel"'),
        document.fonts.load('bold 36px "Playfair Display"'),
        document.fonts.load('normal 24px "Playfair Display"'),
        document.fonts.load('bold 36px "Cormorant Garamond"'),
        document.fonts.load('normal 24px "Cormorant Garamond"'),
        document.fonts.load('bold 36px "Lora"'),
        document.fonts.load('normal 24px "Lora"'),
        document.fonts.load('bold 36px "Roboto"'),
        document.fonts.load('normal 24px "Roboto"'),
        document.fonts.ready
      ]);
    } catch {}
  }

  // Cargar imagen de fondo si existe manteniendo cover exacto (sin distorsión y centrada)
  // con soporte nativo para URLs locales, blob: y remotas sin bloqueos CORS
  if (bgUrl) {
    try {
      const img = new Image();
      let objectUrlToRevoke: string | null = null;
      let finalSrc = bgUrl;

      // Si es URL remota, intentamos fetch como blob para evitar completamente problemas de CORS en canvas
      if (bgUrl.startsWith('http://') || bgUrl.startsWith('https://')) {
        try {
          const res = await fetch(bgUrl);
          if (res.ok) {
            const blob = await res.blob();
            finalSrc = URL.createObjectURL(blob);
            objectUrlToRevoke = finalSrc;
          }
        } catch {
          // Si fetch directo falla, fallback a cargar con crossOrigin
          img.crossOrigin = 'anonymous';
        }
      }

      const cargada = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => {
          console.warn('No se pudo cargar la imagen de fondo en canvas:', bgUrl);
          resolve(false);
        };
        img.src = finalSrc;
      });

      if (cargada && img.complete && img.naturalWidth > 0) {
        const canvasRatio = canvasW / canvasH;
        const imgRatio = img.naturalWidth / img.naturalHeight;
        let drawW = canvasW;
        let drawH = canvasH;
        let offsetX = 0;
        let offsetY = 0;

        if (imgRatio > canvasRatio) {
          drawH = canvasH;
          drawW = canvasH * imgRatio;
          offsetX = (canvasW - drawW) / 2;
          offsetY = 0;
        } else {
          drawW = canvasW;
          drawH = canvasW / imgRatio;
          offsetX = 0;
          offsetY = (canvasH - drawH) / 2;
        }

        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);
      }

      if (objectUrlToRevoke) {
        URL.revokeObjectURL(objectUrlToRevoke);
      }
    } catch (e) {
      console.warn('Advertencia cargando imagen de fondo para PDF:', e);
    }
  }

  // Configuración de coordenadas resueltas
  const baseDefaults = isLandscape ? DISENO_DEFAULT_HORIZONTAL : DISENO_DEFAULT_VERTICAL;
  const cfg: DisenoCoordenadas = {
    estudiante: { ...baseDefaults.estudiante, ...(data.diseno?.estudiante || {}) },
    programa: { ...baseDefaults.programa, ...(data.diseno?.programa || {}) },
    horas: { ...baseDefaults.horas, ...(data.diseno?.horas || {}) },
    fecha: { ...baseDefaults.fecha, ...(data.diseno?.fecha || {}) },
    codigo: { ...baseDefaults.codigo, ...(data.diseno?.codigo || {}) },
    qr: { ...baseDefaults.qr, ...(data.diseno?.qr || {}) }
  };

  const esDiploma = String(data.tipo).toUpperCase() === 'DIPLOMA';
  const rawEstudiante = (data.estudiante || 'Quispe Ramos, Juan Carlos').trim();
  const nombreEstudiante = formatearNombreSegunEstilo(rawEstudiante, cfg.estudiante.formatoNombre);

  const rawPrograma = (data.programa || 'DERECHO MINERO')
    .replace(/^Diplomado de Alta Especialización en\s*/i, '')
    .replace(/^Diplomado en\s*/i, '')
    .trim();

  const rawModulo = (data.modulo || 'LEGISLACIÓN MINERA Y MARCO LEGAL DEL SECTOR')
    .replace(/^Módulo\s*\d+[:\-\s]*/i, '')
    .trim();

  const esModular = String(data.tipo).toUpperCase() === 'MODULAR' && Boolean(data.modulo);
  const textoProgramaBase = esModular ? rawModulo : rawPrograma;
  const textoProgramaFinal = ajustarConectorSinHuerfana(textoProgramaBase);

  // Redacción oficial de horas y créditos (horas y créditos, solo horas, solo créditos o personalizada)
  const horasTexto = resolverTextoHorasCreditos(cfg.horas, data.horas, esDiploma);
  
  // Fecha pura y prefijo configurable
  const fechaPura = formatearFechaSegunEstilo(data.fecha, cfg.fecha.formatoFecha || 'larga');
  const prefijoFecha = cfg.fecha.textoPrefijo !== undefined ? cfg.fecha.textoPrefijo : 'Fecha de emisión: ';
  const fechaTextoFinal = `${prefijoFecha}${fechaPura}`.trim();
  const codigoCert = data.codigo || 'HNYNXT2';

  ctx.textBaseline = 'middle';

  // 1. NOMBRE DEL ESTUDIANTE: Proporción exacta en pt/px, siempre 1 sola línea y auto-escala sin corte
  if (cfg.estudiante.visible) {
    const estX = (cfg.estudiante.x / 100) * canvasW;
    const estY = (cfg.estudiante.y / 100) * canvasH;

    let maxEstudianteW = canvasW * 0.84;
    if (cfg.estudiante.anchoMaximoCm && cfg.estudiante.anchoMaximoCm > 0) {
      maxEstudianteW = canvasW * (cfg.estudiante.anchoMaximoCm / anchoA4Cm);
    } else if (cfg.estudiante.anchoMaximo) {
      maxEstudianteW = canvasW * (cfg.estudiante.anchoMaximo / 100);
    }

    const fontEstudiante = obtenerFontFamily(cfg.estudiante.fuente, '"Times New Roman", Times, Georgia, serif');
    const colorEstudiante = cfg.estudiante.color || '#000000';
    const esNegrita = cfg.estudiante.negrita !== false;
    const esCursiva = !!cfg.estudiante.cursiva;

    let fontSize = calcularTamanoPxCanvas(
      cfg.estudiante.tamanoFuente || (isLandscape ? 36 : 28),
      orientacion,
      canvasW
    );

    ctx.font = buildCanvasFont(fontSize, fontEstudiante, esNegrita, esCursiva);
    let measuredWidth = ctx.measureText(nombreEstudiante).width;

    // Si excede el ancho máximo físico en cm, reducir suavemente escala para que jamás se corte ni desborde
    if (measuredWidth > maxEstudianteW && maxEstudianteW > 0) {
      const scale = maxEstudianteW / measuredWidth;
      fontSize = Math.max(14, Math.floor(fontSize * scale));
      ctx.font = buildCanvasFont(fontSize, fontEstudiante, esNegrita, esCursiva);
    }

    ctx.textAlign = cfg.estudiante.alineacion;
    let estDrawX = estX;
    if (cfg.estudiante.alineacion === 'left') {
      estDrawX = estX - (maxEstudianteW / 2);
    } else if (cfg.estudiante.alineacion === 'right') {
      estDrawX = estX + (maxEstudianteW / 2);
    }

    ctx.fillStyle = colorEstudiante;
    drawStyledText(ctx, nombreEstudiante, estDrawX, estY, fontSize, cfg.estudiante.subrayado);
  }

  // 2. TÍTULO DEL PROGRAMA O MÓDULO: Hasta 2 líneas máximo, balanceado en CM y conector "Y" indivisible
  if (cfg.programa.visible) {
    const progX = (cfg.programa.x / 100) * canvasW;
    const progY = (cfg.programa.y / 100) * canvasH;

    let maxProgW = canvasW * 0.86;
    if (cfg.programa.anchoMaximoCm && cfg.programa.anchoMaximoCm > 0) {
      maxProgW = canvasW * (cfg.programa.anchoMaximoCm / anchoA4Cm);
    } else if (cfg.programa.anchoMaximo) {
      maxProgW = canvasW * (cfg.programa.anchoMaximo / 100);
    }

    const fontProg = obtenerFontFamily(cfg.programa.fuente, '"Montserrat", "Segoe UI", Arial, sans-serif');
    const colorProg = cfg.programa.color || '#000000';
    const esNegritaProg = cfg.programa.negrita !== false;
    const esCursivaProg = !!cfg.programa.cursiva;

    let progFontSize = calcularTamanoPxCanvas(
      cfg.programa.tamanoFuente || (isLandscape ? 22 : 18),
      orientacion,
      canvasW
    );

    ctx.font = buildCanvasFont(progFontSize, fontProg, esNegritaProg, esCursivaProg);
    ctx.fillStyle = colorProg;
    ctx.textAlign = cfg.programa.alineacion;

    let progDrawX = progX;
    if (cfg.programa.alineacion === 'left') {
      progDrawX = progX - (maxProgW / 2);
    } else if (cfg.programa.alineacion === 'right') {
      progDrawX = progX + (maxProgW / 2);
    }

    const widthTotal = ctx.measureText(textoProgramaFinal).width;

    if (widthTotal <= maxProgW) {
      drawStyledText(ctx, textoProgramaFinal, progDrawX, progY, progFontSize, cfg.programa.subrayado);
    } else {
      // Dividir en máximo 2 líneas balanceadas respetando palabras y no-separables (\u00A0)
      const palabras = textoProgramaFinal.split(' ');
      let mejorDiff = Infinity;
      let mejorCorte = Math.floor(palabras.length / 2);

      for (let i = 1; i < palabras.length; i++) {
        const parte1 = palabras.slice(0, i).join(' ');
        const parte2 = palabras.slice(i).join(' ');
        const w1 = ctx.measureText(parte1).width;
        const w2 = ctx.measureText(parte2).width;
        const diff = Math.abs(w1 - w2);
        if (diff < mejorDiff) {
          mejorDiff = diff;
          mejorCorte = i;
        }
      }

      const linea1 = palabras.slice(0, mejorCorte).join(' ');
      const linea2 = palabras.slice(mejorCorte).join(' ');

      const maxLineW = Math.max(ctx.measureText(linea1).width, ctx.measureText(linea2).width);
      if (maxLineW > maxProgW) {
        progFontSize = Math.max(12, Math.floor(progFontSize * (maxProgW / maxLineW)));
        ctx.font = buildCanvasFont(progFontSize, fontProg, esNegritaProg, esCursivaProg);
      }

      const lineSpacing = progFontSize * (cfg.programa.interlineado || 1.25);
      drawStyledText(ctx, linea1, progDrawX, progY - (lineSpacing / 2), progFontSize, cfg.programa.subrayado);
      drawStyledText(ctx, linea2, progDrawX, progY + (lineSpacing / 2), progFontSize, cfg.programa.subrayado);
    }
  }

  // 3. Horas y créditos
  if (cfg.horas.visible) {
    const horasX = (cfg.horas.x / 100) * canvasW;
    const horasY = (cfg.horas.y / 100) * canvasH;
    let maxHorasW = canvasW * 0.84;
    if (cfg.horas.anchoMaximoCm && cfg.horas.anchoMaximoCm > 0) {
      maxHorasW = canvasW * (cfg.horas.anchoMaximoCm / anchoA4Cm);
    } else if (cfg.horas.anchoMaximo) {
      maxHorasW = canvasW * (cfg.horas.anchoMaximo / 100);
    }

    const fontHoras = obtenerFontFamily(cfg.horas.fuente, '"Segoe UI", Arial, sans-serif');
    const colorHoras = cfg.horas.color || '#000000';
    const fontSizeHoras = calcularTamanoPxCanvas(
      cfg.horas.tamanoFuente || 12,
      orientacion,
      canvasW
    );

    ctx.font = buildCanvasFont(fontSizeHoras, fontHoras, !!cfg.horas.negrita, !!cfg.horas.cursiva);
    ctx.fillStyle = colorHoras;
    ctx.textAlign = cfg.horas.alineacion;

    let horasDrawX = horasX;
    if (cfg.horas.alineacion === 'left') {
      horasDrawX = horasX - (maxHorasW / 2);
    } else if (cfg.horas.alineacion === 'right') {
      horasDrawX = horasX + (maxHorasW / 2);
    }

    drawStyledText(ctx, horasTexto, horasDrawX, horasY, fontSizeHoras, cfg.horas.subrayado);
  }

  // 4. Código QR 1:1 estricto (ancho == alto)
  if (cfg.qr.visible && (data.incluyeQr !== false)) {
    const qrFinalSize = calcularTamanoPxCanvas(
      resolverTamanoQrPt(cfg.qr),
      orientacion,
      canvasW
    );

    const qrX = (cfg.qr.x / 100) * canvasW - (qrFinalSize / 2);
    const qrTop = (cfg.qr.y / 100) * canvasH - (qrFinalSize / 2);

    // Contenedor blanco para el QR
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(qrX - 8, qrTop - 8, qrFinalSize + 16, qrFinalSize + 16, 8);
    ctx.fill();
    ctx.stroke();

    // Dibujar Código QR real y escaneable 1:1 conectado a la validación
    try {
      const qrTargetUrl = generarUrlQRValidacion(codigoCert);
      const qrDataUrl = await QRCode.toDataURL(qrTargetUrl, {
        margin: 0,
        errorCorrectionLevel: 'M',
        color: { dark: '#0f172a', light: '#ffffff' }
      });
      const qrImg = new Image();
      qrImg.crossOrigin = 'anonymous';
      qrImg.src = qrDataUrl;
      await new Promise<void>((resolve) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => resolve();
      });
      ctx.drawImage(qrImg, qrX, qrTop, qrFinalSize, qrFinalSize);
    } catch (e) {
      console.error('Error dibujando QR en PDF:', e);
    }
  }

  // 5. Fecha de emisión con prefijo y formato puro configurable
  if (cfg.fecha.visible) {
    const fechaX = (cfg.fecha.x / 100) * canvasW;
    const fechaY = (cfg.fecha.y / 100) * canvasH;
    let maxFechaW = canvasW * 0.35;
    if (cfg.fecha.anchoMaximoCm && cfg.fecha.anchoMaximoCm > 0) {
      maxFechaW = canvasW * (cfg.fecha.anchoMaximoCm / anchoA4Cm);
    }

    const fontFecha = obtenerFontFamily(cfg.fecha.fuente, '"Segoe UI", Arial, sans-serif');
    const colorFecha = cfg.fecha.color || '#000000';
    const fontSizeFecha = calcularTamanoPxCanvas(
      cfg.fecha.tamanoFuente || 10,
      orientacion,
      canvasW
    );

    ctx.fillStyle = colorFecha;
    ctx.font = buildCanvasFont(fontSizeFecha, fontFecha, !!cfg.fecha.negrita, !!cfg.fecha.cursiva);
    ctx.textAlign = cfg.fecha.alineacion;

    let fechaDrawX = fechaX;
    if (cfg.fecha.alineacion === 'left') {
      fechaDrawX = fechaX - (maxFechaW / 2);
    } else if (cfg.fecha.alineacion === 'right') {
      fechaDrawX = fechaX + (maxFechaW / 2);
    }

    drawStyledText(ctx, fechaTextoFinal, fechaDrawX, fechaY, fontSizeFecha, cfg.fecha.subrayado);
  }

  // 6. Código alfanumérico único: Puro texto sin fondo de color
  if (cfg.codigo.visible) {
    const codX = (cfg.codigo.x / 100) * canvasW;
    const codY = (cfg.codigo.y / 100) * canvasH;
    let maxCodW = canvasW * 0.35;
    if (cfg.codigo.anchoMaximoCm && cfg.codigo.anchoMaximoCm > 0) {
      maxCodW = canvasW * (cfg.codigo.anchoMaximoCm / anchoA4Cm);
    }

    const prefijoCod = cfg.codigo.textoPrefijo !== undefined ? cfg.codigo.textoPrefijo : 'CÓD.: ';
    const textoCod = `${prefijoCod}${codigoCert}`;
    const fontCod = obtenerFontFamily(cfg.codigo.fuente, '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif');
    const colorCod = cfg.codigo.color || '#000000';
    const fontSizeCod = calcularTamanoPxCanvas(
      cfg.codigo.tamanoFuente || 11,
      orientacion,
      canvasW
    );

    ctx.textAlign = cfg.codigo.alineacion;
    let codDrawX = codX;
    if (cfg.codigo.alineacion === 'left') {
      codDrawX = codX - (maxCodW / 2);
    } else if (cfg.codigo.alineacion === 'right') {
      codDrawX = codX + (maxCodW / 2);
    }

    ctx.fillStyle = colorCod;
    ctx.font = buildCanvasFont(fontSizeCod, fontCod, cfg.codigo.negrita !== false, !!cfg.codigo.cursiva);
    drawStyledText(ctx, textoCod, codDrawX, codY, fontSizeCod, cfg.codigo.subrayado);
  }

  // Convertir canvas a JPEG de alta fidelidad (calidad 0.95)
  const jpegBlob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.95);
  });

  if (!jpegBlob) {
    throw new Error('Error al generar la imagen del certificado en canvas.');
  }

  const jpegArrayBuffer = await jpegBlob.arrayBuffer();
  const jpegBytes = new Uint8Array(jpegArrayBuffer);

  // Empaquetar en PDF A4 nativo
  const pdfBytes = empaquetarJpegEnPdfA4(jpegBytes, orientacion, canvasW, canvasH);
  const pdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });

  // Disparar descarga directa en el navegador
  const fileNameFinal = nombreArchivo || `Certificado_${codigoCert}_A4_${orientacion}.pdf`;
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileNameFinal;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/**
 * Optimiza en el navegador una imagen de fondo antes de subirla a Supabase Storage:
 * - Redimensiona al tamaño óptimo para A4 (máx 2480px de ancho/alto)
 * - Comprime a WebP/JPEG con calidad balanceada (0.88 - 0.90)
 * - Reduce archivos pesados de 8MB a sólo ~350KB-600KB sin pérdida perceptible
 */
export async function optimizarImagenFondo(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Formato de imagen corrupto o no reconocido.'));
      img.onload = () => {
        const MAX_DIM = 2480;
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > MAX_DIM || height > MAX_DIM) {
          if (width > height) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          } else {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Error al instanciar contexto de canvas.'));
          return;
        }

        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.90);
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({ blob, dataUrl });
          } else {
            reject(new Error('Error al exportar blob optimizado.'));
          }
        }, 'image/webp', 0.90);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
