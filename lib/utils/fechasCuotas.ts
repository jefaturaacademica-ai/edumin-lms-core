/**
 * Utilidades para cálculo y formateo de fechas de vencimiento de cuotas en EDUMIN LMS.
 * 
 * Regla de negocio estándar:
 * - Cuota 1: Fecha de inscripción / matrícula (o fecha base).
 * - Cuota 2: 1 mes después de la Cuota 1 (mismo día del mes o fin de mes).
 * - Cuota 3: 2 meses después de la Cuota 1.
 * - Cuota N: (N - 1) meses después de la Cuota 1.
 */

export function sumarMeses(fecha: Date, meses: number): Date {
  const d = new Date(fecha.getTime());
  const diaOriginal = d.getDate();
  d.setMonth(d.getMonth() + meses);
  // Ajuste para meses con menos días (ej. 31 de enero + 1 mes -> fin de febrero)
  if (d.getDate() !== diaOriginal) {
    d.setDate(0);
  }
  return d;
}

export function formatearFechaISO(fecha: Date): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function formatearFechaVisual(fechaStr: string | null | undefined): string {
  if (!fechaStr) return '-';
  // Si viene en formato YYYY-MM-DD
  const partes = String(fechaStr).split('T')[0].split('-');
  if (partes.length === 3) {
    const [anio, mes, dia] = partes;
    return `${dia}/${mes}/${anio}`;
  }
  try {
    const d = new Date(fechaStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }
  } catch {
    // fallback
  }
  return fechaStr;
}

export function calcularFechasVencimientoPorDefecto(
  fechaBaseStr?: string | Date | null,
  totalCuotas: number = 3
): string[] {
  let base: Date;
  if (fechaBaseStr) {
    base = new Date(fechaBaseStr);
    if (isNaN(base.getTime())) base = new Date();
  } else {
    base = new Date();
  }

  const fechas: string[] = [];
  for (let i = 0; i < totalCuotas; i++) {
    const fechaCuota = sumarMeses(base, i);
    fechas.push(formatearFechaISO(fechaCuota));
  }
  return fechas;
}

export function resolverFechaVencimiento(
  idx: number,
  fechasGuardadas?: string[] | null,
  fechaBase?: string | Date | null
): string {
  if (Array.isArray(fechasGuardadas) && fechasGuardadas[idx]) {
    return fechasGuardadas[idx];
  }
  let base: Date;
  if (fechaBase) {
    base = new Date(fechaBase);
    if (isNaN(base.getTime())) base = new Date();
  } else {
    base = new Date();
  }
  const f = sumarMeses(base, idx);
  return formatearFechaISO(f);
}
