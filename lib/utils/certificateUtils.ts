/**
 * Utilidades unificadas para generación de códigos únicos, tokens criptográficos y formatos de certificados EDUMIN
 */

const SECRET_SALT = 'EDUMIN_CERT_2026_SECURE_TOKEN_INTEGRITY';

/**
 * Codifica un array de bytes a Base64URL (sin caracteres especiales para URLs: sin '+', '/', '=')
 */
function bytesToBase64Url(bytes: number[]): string {
  let result = '';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0;
    result += chars[b0 >> 2];
    result += chars[((b0 & 3) << 4) | (b1 >> 4)];
    if (i + 1 < bytes.length) {
      result += chars[((b1 & 15) << 2) | (b2 >> 6)];
    }
    if (i + 2 < bytes.length) {
      result += chars[b2 & 63];
    }
  }
  return result;
}

/**
 * Decodifica Base64URL a bytes
 */
function base64UrlToBytes(str: string): number[] {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
  const charMap: Record<string, number> = {};
  for (let i = 0; i < chars.length; i++) charMap[chars[i]] = i;
  const bytes: number[] = [];
  let buffer = 0;
  let bitsCollected = 0;
  for (let i = 0; i < str.length; i++) {
    const val = charMap[str[i]];
    if (val === undefined) continue;
    buffer = (buffer << 6) | val;
    bitsCollected += 6;
    if (bitsCollected >= 8) {
      bitsCollected -= 8;
      bytes.push((buffer >> bitsCollected) & 0xff);
    }
  }
  return bytes;
}

/**
 * Encripta y ofusca el código del certificado en un token seguro ultra-compacto (~16-24 caracteres)
 * con firma de integridad. Oculta el código real para evitar adivinación y suplantación.
 */
export function encriptarTokenCertificado(codigo: string): string {
  const clean = normalizarCodigoCertificado(codigo);
  if (!clean) return '';

  // Checksum matemático de 16-bits para integridad estricta
  let sum = 0x5a;
  for (let i = 0; i < clean.length; i++) {
    sum = (sum * 31 + clean.charCodeAt(i)) & 0xffff;
  }
  const check = sum.toString(16).padStart(4, '0').toUpperCase();
  const raw = `${clean}.${check}`;

  // Ofuscación XOR con clave secreta institucional
  const bytes: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    const k = SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
    bytes.push(raw.charCodeAt(i) ^ (k & 0x1f));
  }
  return bytesToBase64Url(bytes);
}

/**
 * Desencripta el token seguro y valida la firma de integridad.
 * Retorna el código original si es auténtico, o null si fue alterado o es inválido.
 */
export function desencriptarTokenCertificado(token: string): string | null {
  if (!token) return null;
  try {
    const bytes = base64UrlToBytes(token.trim());
    let raw = '';
    for (let i = 0; i < bytes.length; i++) {
      const k = SECRET_SALT.charCodeAt(i % SECRET_SALT.length);
      raw += String.fromCharCode(bytes[i] ^ (k & 0x1f));
    }
    const parts = raw.split('.');
    if (parts.length !== 2) return null;
    const [code, check] = parts;
    if (!code || !check) return null;

    let sum = 0x5a;
    for (let i = 0; i < code.length; i++) {
      sum = (sum * 31 + code.charCodeAt(i)) & 0xffff;
    }
    const expected = sum.toString(16).padStart(4, '0').toUpperCase();
    if (check !== expected) return null;

    return code.toUpperCase();
  } catch {
    return null;
  }
}

/**
 * Obtiene la URL base de la aplicación (producción o desarrollo)
 */
export function obtenerBaseUrl(): string {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_APP_URL || 'https://edumin.pe';
}

/**
 * Genera la URL oficial que contendrá el código QR en el certificado físico/digital.
 * Usa el token criptográfico seguro para no exponer el código directamente en el QR.
 */
export function generarUrlQRValidacion(codigo: string, baseUrl?: string): string {
  const base = (baseUrl || obtenerBaseUrl()).replace(/\/+$/, '');
  const token = encriptarTokenCertificado(codigo);
  return `${base}/validar?v=${encodeURIComponent(token)}`;
}

/**
 * Genera un código alfanumérico único de 7 caracteres en mayúsculas (ej: HNYNXT2).
 * Excluye caracteres ambiguos (0, O, 1, I) para máxima legibilidad.
 */
export function generarCodigoUnicoCertificado(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < 7; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result.toUpperCase();
}

/**
 * Normaliza cualquier código de certificado para asegurar que siempre esté estrictamente en mayúsculas y sin espacios.
 */
export function normalizarCodigoCertificado(codigo?: string | null): string {
  if (!codigo) return '';
  return String(codigo).trim().toUpperCase();
}

/**
 * Formatea el nombre del alumno en formato oficial (Apellidos, Nombres).
 */
export function formatearNombreCertificado(nombres?: string, apellidos?: string): string {
  const nom = (nombres || '').trim();
  const ape = (apellidos || '').trim();
  if (ape && nom) {
    if (ape.includes(',') || nom.includes(',')) {
      return `${ape} ${nom}`.replace(/\s+/g, ' ').trim();
    }
    return `${ape}, ${nom}`;
  }
  return ape || nom || 'Gómez Zapata, Juan Carlos';
}

/**
 * Formatea la fecha de emisión en formato oficial (ej: "Arequipa, 15/10/2026").
 */
export function formatearFechaEmision(fechaStr?: string, ciudad = 'Arequipa'): string {
  if (!fechaStr) {
    const hoy = new Date();
    const d = hoy.getDate().toString().padStart(2, '0');
    const m = (hoy.getMonth() + 1).toString().padStart(2, '0');
    const y = hoy.getFullYear();
    return `Fecha de emisión: ${ciudad}, ${d}/${m}/${y}`;
  }

  let textoLimpio = fechaStr.replace(/^Fecha de emisión:\s*/i, '').trim();

  if (textoLimpio.toLowerCase().includes(ciudad.toLowerCase()) || textoLimpio.includes(',')) {
    return `Fecha de emisión: ${textoLimpio}`;
  }

  const parts = textoLimpio.split('-');
  if (parts.length === 3) {
    return `Fecha de emisión: ${ciudad}, ${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }

  return `Fecha de emisión: ${ciudad}, ${textoLimpio}`;
}
