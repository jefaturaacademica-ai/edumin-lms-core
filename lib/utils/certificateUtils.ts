/**
 * Utilidades unificadas para generación de códigos únicos y formatos de certificados EDUMIN & AVANZA
 */

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
  return result;
}

/**
 * Formatea el nombre del alumno en formato oficial (Apellidos, Nombres).
 */
export function formatearNombreCertificado(nombres?: string, apellidos?: string): string {
  const nom = (nombres || '').trim();
  const ape = (apellidos || '').trim();
  if (ape && nom) {
    // Si ya viene con coma, no duplicar
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

  // Si ya contiene la ciudad, devolver con prefijo
  if (textoLimpio.toLowerCase().includes(ciudad.toLowerCase()) || textoLimpio.includes(',')) {
    return `Fecha de emisión: ${textoLimpio}`;
  }

  // Si viene en formato YYYY-MM-DD
  const parts = textoLimpio.split('-');
  if (parts.length === 3) {
    return `Fecha de emisión: ${ciudad}, ${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
  }

  return `Fecha de emisión: ${ciudad}, ${textoLimpio}`;
}
