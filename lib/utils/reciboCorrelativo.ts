/**
 * Utilidad institucional para gestión de correlativos de recibos oficiales EDUMIN.
 * Formato oficial único: REC-YYYY-XXXXX (ej: REC-2026-00001, REC-2026-00002)
 *
 * REGLAS INSTITUCIONALES:
 * 1. Todos los recibos (cuotas académicas y cargos extras) siguen la misma serie correlativa consecutiva.
 * 2. Ningún recibo incluye dígitos del DNI del estudiante (los recibos son de caja institucional correlativos).
 * 3. Ningún recibo incluye la palabra "CARGO" en su correlativo.
 */

export function parsearNumeroCorrelativo(reciboStr: string | null | undefined): number | null {
  if (!reciboStr || typeof reciboStr !== 'string') return null;
  const str = reciboStr.trim();

  // Descartar si incluye CARGO explícito (ej: REC-CARGO-7070-01)
  if (/CARGO/i.test(str)) {
    return null;
  }

  // Descartar formato antiguo que incluía DNI: REC-YYYY-DNI-CUOTA (ej: REC-2026-7070-01 o REC-2026-2117-02)
  if (/^REC-\d{4}-\d{4,8}-\d+$/i.test(str)) {
    return null;
  }

  // Coincidir con formato estándar REC-YYYY-XXXXX o REC-XXXXX (ej: REC-2026-00001 o REC-00001)
  const match = str.match(/^REC(?:-\d{4})?-(\d+)$/i);
  if (match) {
    const rawDigits = match[1];
    const num = parseInt(rawDigits, 10);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }

  return null;
}

export function formatearNroRecibo(numero: number, anio: number = 2026): string {
  const correlativo = Math.max(1, numero);
  const pad = String(correlativo).padStart(5, '0');
  return `REC-${anio}-${pad}`;
}

export function obtenerSiguienteCorrelativo(pagosRegistrados: any[] = [], auditLogs: any[] = []): string {
  let maxCorrelativo = 0;

  pagosRegistrados.forEach((pago) => {
    if (!pago) return;

    // 1. Campo nro_recibo en tabla pagos
    if (pago.nro_recibo) {
      const num = parsearNumeroCorrelativo(pago.nro_recibo);
      if (num && num > maxCorrelativo) maxCorrelativo = num;
    }

    // 2. Campo comprobante (si es formato REC-)
    if (pago.comprobante && typeof pago.comprobante === 'string' && pago.comprobante.startsWith('REC-')) {
      const num = parsearNumeroCorrelativo(pago.comprobante);
      if (num && num > maxCorrelativo) maxCorrelativo = num;
    }

    // 3. Sub-recibos por cuota (cuotas_recibos)
    if (pago.cuotas_recibos && typeof pago.cuotas_recibos === 'object') {
      Object.values(pago.cuotas_recibos).forEach((cr: any) => {
        if (cr?.nro_recibo) {
          const num = parsearNumeroCorrelativo(cr.nro_recibo);
          if (num && num > maxCorrelativo) maxCorrelativo = num;
        }
      });
    }

    // 4. Campo metodo JSON serializado
    if (typeof pago.metodo === 'string' && pago.metodo.startsWith('CREDITO_')) {
      try {
        const jsonStr = pago.metodo.substring(pago.metodo.indexOf('|') + 1).trim();
        const parsed = JSON.parse(jsonStr);
        if (parsed.cuotas_recibos && typeof parsed.cuotas_recibos === 'object') {
          Object.values(parsed.cuotas_recibos).forEach((cr: any) => {
            if (cr?.nro_recibo) {
              const num = parsearNumeroCorrelativo(cr.nro_recibo);
              if (num && num > maxCorrelativo) maxCorrelativo = num;
            }
          });
        }
        if (parsed.ultimo_pago?.nro_recibo) {
          const num = parsearNumeroCorrelativo(parsed.ultimo_pago.nro_recibo);
          if (num && num > maxCorrelativo) maxCorrelativo = num;
        }
      } catch {
        // ignore JSON parse error
      }
    }
  });

  // 5. Historial de auditoría para evitar cualquier salto o desajuste
  if (Array.isArray(auditLogs)) {
    auditLogs.forEach((audit) => {
      const d = audit?.detalles;
      if (!d) return;
      const r = d.nro_recibo || d.recibo || (typeof d.comprobante === 'string' && d.comprobante.startsWith('REC-') ? d.comprobante : null);
      if (r) {
        const num = parsearNumeroCorrelativo(r);
        if (num && num > maxCorrelativo) maxCorrelativo = num;
      }
    });
  }

  return formatearNroRecibo(maxCorrelativo + 1);
}
