export const PAQUETES_ADQUIRIDOS = [
  "COMPLETO",
  "FULL",
  "ILIMITADO",
] as const;

export type PaqueteAdquirido = (typeof PAQUETES_ADQUIRIDOS)[number];

export interface EduminCreditsCalculation {
  paquete: PaqueteAdquirido;
  esContado: boolean;
  cuotasPagadas: number;
  cuotasTotales: number;
  // Desglose Créditos Diplomados
  diplomados: {
    contratados: number;
    liberados: number;
    consumidos: number;
    disponibles: number;
    habilitados: number;
  };
  // Desglose Créditos Cursos Libres
  cursos: {
    contratados: number;
    liberados: number;
    consumidos: number;
    disponibles: number;
    habilitados: number;
  };
  // Total Créditos EDUMIN
  total: {
    contratados: number;
    liberados: number;
    consumidos: number;
    disponibles: number;
    habilitados: number;
  };
}

/**
 * Calcula la liberación de Créditos EDUMIN distinguiendo entre Diplomados y Cursos.
 * 
 * Reglas de Juego:
 * - COMPLETO: 1 Crédito Diplomado + 3 Créditos Cursos (Total: 4 Créditos EDUMIN)
 * - FULL: 1 Crédito Diplomado + 5 Créditos Cursos (Total: 6 Créditos EDUMIN)
 * - ILIMITADO: 3 Créditos Diplomados iniciales + 15 Créditos Cursos iniciales (Total: 18 Créditos EDUMIN base)
 *   (En ILIMITADO, una vez consume sus créditos de diplomados, se liberan 3 créditos más sucesivamente).
 * 
 * Reglas por Forma de Pago:
 * - Contado o cuota final (sin deuda / pago total en 1ra cuota): se liberan y habilitan el 100% de los créditos del paquete.
 * - Por cuotas:
 *   - Diplomados: 1er pago = 1 diplomado; 2do pago = 2 diplomados (si tiene créditos); 3ra cuota = 3er diplomado y así sucesivamente.
 *   - Cursos:
 *     - COMPLETO: Cuota 1 = 1 curso; Cuota 2 = 2 cursos; Cuota final = 3 cursos.
 *     - FULL: Cuota 1 = 2 cursos; Cuota 2 = 4 cursos; Cuota final = 5 cursos.
 *     - ILIMITADO: Cuota 1 = 3 cursos; Cuota 2 = 6 cursos; etc. (+3 cursos por cuota).
 */
export function calculateEduminCredits(params: {
  paqueteAdquirido?: PaqueteAdquirido | string | null;
  cuotasPagadas?: number;
  cuotasTotales?: number;
  tipoPago?: string; // 'CONTADO' | 'CUOTAS'
  diplomadosConsumidos?: number;
  cursosConsumidos?: number;
  creditosExtraDiplomados?: number;
  creditosExtraCursos?: number;
}): EduminCreditsCalculation {
  const rawPkg = (params.paqueteAdquirido || 'COMPLETO').toUpperCase();
  const paquete: PaqueteAdquirido = (PAQUETES_ADQUIRIDOS as readonly string[]).includes(rawPkg)
    ? (rawPkg as PaqueteAdquirido)
    : 'COMPLETO';

  const cuotasPagadas = Math.max(0, Number(params.cuotasPagadas ?? 1));
  const cuotasTotales = Math.max(1, Number(params.cuotasTotales ?? (paquete === 'ILIMITADO' ? 5 : (params.tipoPago === 'CONTADO' ? 1 : 3))));
  const esContado = params.tipoPago === 'CONTADO' || (cuotasPagadas >= cuotasTotales && cuotasTotales > 0);

  const dipConsumidos = Math.max(0, Number(params.diplomadosConsumidos ?? 0));
  const curConsumidos = Math.max(0, Number(params.cursosConsumidos ?? 0));

  let dipContratados = 1;
  let curContratados = 3;
  let dipLiberados = 0;
  let curLiberados = 0;

  if (paquete === 'COMPLETO') {
    dipContratados = 1;
    curContratados = 3;

    if (cuotasPagadas === 0) {
      dipLiberados = 0;
      curLiberados = 0;
    } else {
      dipLiberados = 1;
      curLiberados = 3;
    }
  } else if (paquete === 'FULL') {
    dipContratados = 1;
    curContratados = 5;

    if (cuotasPagadas === 0) {
      dipLiberados = 0;
      curLiberados = 0;
    } else {
      dipLiberados = 1;
      curLiberados = 5;
    }
  } else if (paquete === 'ILIMITADO') {
    curContratados = 15;
    dipContratados = 3;

    if (cuotasPagadas === 0) {
      dipLiberados = 0;
      curLiberados = 0;
    } else if (esContado) {
      curLiberados = 15;
      dipLiberados = 3;

      // Regla especial ILIMITADO (al contado o sin deuda):
      // Una vez que consume sus 3 créditos iniciales de diplomados, se liberan 3 créditos más sucesivamente
      if (dipConsumidos >= 3) {
        const tramosExtras = Math.floor((dipConsumidos - 3) / 3) + 1;
        dipLiberados += tramosExtras * 3;
        dipContratados = Math.max(dipContratados, dipLiberados);
      }
    } else {
      curLiberados = Math.min(15, Math.max(5, cuotasPagadas * 3));
      // En cuotas: 1er pago = 1 diplomado, 2do pago = 2 diplomados, 3er pago = 3 diplomados y así sucesivamente
      dipLiberados = cuotasPagadas * 1;
      dipContratados = Math.max(dipContratados, dipLiberados);
    }
  }

  const extraDip = Math.max(0, Number(params.creditosExtraDiplomados ?? 0));
  const extraCur = Math.max(0, Number(params.creditosExtraCursos ?? 0));

  dipContratados += extraDip;
  curContratados += extraCur;
  dipLiberados += extraDip;
  curLiberados += extraCur;

  const dipDisponibles = Math.max(0, dipLiberados - dipConsumidos);
  const curDisponibles = Math.max(0, curLiberados - curConsumidos);

  const curHabilitados = getCursosHabilitadosPorCuotas({
    paquete,
    tipoPago: params.tipoPago,
    cuotasPagadas,
    cuotasTotales
  });
  let dipHabilitados = getDiplomadosHabilitadosPorCuotas({
    paquete,
    tipoPago: params.tipoPago,
    cuotasPagadas,
    cuotasTotales,
    totalCreditos: dipContratados
  });

  // En paquetes de 1 solo diplomado base (COMPLETO / FULL), si tiene créditos adicionales
  // y aún mantiene cuotas pendientes (!esContado), sólo se habilita el 1er diplomado hasta
  // saldar la deuda (salvo que cuente con un crédito de pago adicional ya abonado).
  if (!esContado && (paquete === 'COMPLETO' || paquete === 'FULL') && extraDip > 0 && cuotasPagadas > 0) {
    dipHabilitados = Math.min(dipHabilitados, 1);
  }

  return {
    paquete,
    esContado,
    cuotasPagadas,
    cuotasTotales,
    diplomados: {
      contratados: dipContratados,
      liberados: dipLiberados,
      consumidos: dipConsumidos,
      disponibles: dipDisponibles,
      habilitados: dipHabilitados,
    },
    cursos: {
      contratados: curContratados,
      liberados: curLiberados,
      consumidos: curConsumidos,
      disponibles: curDisponibles,
      habilitados: curHabilitados,
    },
    total: {
      contratados: dipContratados + curContratados,
      liberados: dipLiberados + curLiberados,
      consumidos: dipConsumidos + curConsumidos,
      disponibles: dipDisponibles + curDisponibles,
      habilitados: dipHabilitados + curHabilitados,
    },
  };
}

/**
 * Función retrocompatible para módulos existentes que consultan cupos de diplomados
 */
export function calculateReleasedCredits(
  paqueteAdquirido: PaqueteAdquirido | string,
  cuotasPagadas: number,
  creditosExtraDiplomados: number = 0
): number {
  const result = calculateEduminCredits({
    paqueteAdquirido,
    cuotasPagadas,
    creditosExtraDiplomados
  });
  return result.diplomados.liberados;
}

/**
 * Determina cuántos cursos matriculados se habilitan para estudio según el pago de cuotas.
 */
export function getCursosHabilitadosPorCuotas(params: {
  paquete?: string | null;
  tipoPago?: string | null;
  cuotasPagadas?: number | null;
  cuotasTotales?: number | null;
}): number {
  const paquete = (params.paquete || 'COMPLETO').toUpperCase();
  const cuotasPagadas = params.cuotasPagadas === 0 ? 0 : Math.max(1, Number(params.cuotasPagadas ?? 1));
  const cuotasTotales = Math.max(1, Number(params.cuotasTotales ?? (paquete === 'ILIMITADO' ? 5 : 3)));
  const esContado = params.tipoPago === 'CONTADO' || (cuotasPagadas >= cuotasTotales && cuotasTotales > 0);

  if (esContado) return 999;
  if (cuotasPagadas === 0) return 0;

  if (paquete === 'COMPLETO') {
    return Math.min(3, cuotasPagadas * 1);
  } else if (paquete === 'FULL') {
    return Math.min(5, cuotasPagadas * 2);
  } else if (paquete === 'ILIMITADO') {
    return Math.min(15, cuotasPagadas * 3);
  }
  return cuotasPagadas * 2;
}

/**
 * Determina cuántos diplomados matriculados se habilitan para estudio según el pago de cuotas.
 * - Si pagó todo el precio (Contado o deuda saldada en 1ra cuota o última cuota): todos sus diplomados según créditos.
 * - En cuotas: 1er pago = 1 diplomado, 2do pago = 2 diplomados (si tiene créditos), 3er pago = 3 diplomados, etc.
 */
export function getDiplomadosHabilitadosPorCuotas(params: {
  paquete?: string | null;
  tipoPago?: string | null;
  cuotasPagadas?: number | null;
  cuotasTotales?: number | null;
  totalCreditos?: number | null;
}): number {
  const paquete = (params.paquete || 'COMPLETO').toUpperCase();
  const cuotasPagadas = params.cuotasPagadas === 0 ? 0 : Math.max(1, Number(params.cuotasPagadas ?? 1));
  const cuotasTotales = Math.max(1, Number(params.cuotasTotales ?? (paquete === 'ILIMITADO' ? 5 : 3)));
  const esContado = params.tipoPago === 'CONTADO' || (cuotasPagadas >= cuotasTotales && cuotasTotales > 0);

  if (esContado) return 999;
  if (cuotasPagadas === 0) return 0;

  if (params.totalCreditos !== undefined && params.totalCreditos !== null) {
    return Math.min(Math.max(0, Number(params.totalCreditos)), cuotasPagadas);
  }
  return cuotasPagadas;
}

/**
 * Deriva el estado real de pagos (cuotasPagadas, cuotasTotales, tipoPago) combinando
 * el cronograma real de `pagos` (si existe) con los campos del perfil.
 * Detecta automáticamente si el alumno pagó todo el precio en la primera cuota / Contado.
 */
export function derivePaymentStateForCredits(params: {
  pagos?: any[];
  profile?: any;
  esAdminSinDatos?: boolean;
}): {
  cuotasPagadas: number;
  cuotasTotales: number;
  tipoPago: 'CONTADO' | 'CUOTAS';
} {
  const { pagos = [], profile, esAdminSinDatos = false } = params;

  if (esAdminSinDatos) {
    return { cuotasPagadas: 5, cuotasTotales: 5, tipoPago: 'CONTADO' };
  }

  const paquete = String(profile?.paquete_adquirido || 'COMPLETO').toUpperCase();
  const defaultCuotasTotales = paquete === 'ILIMITADO' ? 5 : 3;

  const creditosRows = (pagos || []).filter(
    (p: any) => p && !p.is_cargo_extra && !(typeof p.metodo === 'string' && p.metodo.startsWith('CARGO_EXTRA|'))
  );

  const profileEsContado =
    profile?.tipo_pago === 'CONTADO' ||
    String(profile?.paquete_adquirido || '').toUpperCase().includes('CONTADO');

  if (creditosRows.length > 0) {
    let totalCuotasAplicables = 0;
    let cuotasPagadasReales = 0;
    let montoTotalPagado = 0;
    let deudaTotalPendiente = 0;
    let tieneCronograma = false;

    for (const row of creditosRows) {
      let cuotasArr: string[] | null = Array.isArray(row.cuotas) ? row.cuotas : null;
      let rowPagado = row.total_pagado !== undefined ? Number(row.total_pagado) : 0;
      let explicitDeuda: number | undefined = row.total_deuda !== undefined ? Number(row.total_deuda) : undefined;

      if (typeof row.metodo === 'string' && row.metodo.startsWith('CREDITO_')) {
        tieneCronograma = true;
        try {
          const jsonStr = row.metodo.substring(row.metodo.indexOf('|') + 1).trim();
          const parsed = JSON.parse(jsonStr);
          if (Array.isArray(parsed.cuotas)) cuotasArr = parsed.cuotas;
          if (parsed.total_pagado !== undefined) rowPagado = Number(parsed.total_pagado) || 0;
          if (parsed.total_deuda !== undefined) explicitDeuda = Number(parsed.total_deuda) || 0;
        } catch {
          // ignore
        }
      }

      if (cuotasArr && (tieneCronograma || cuotasArr.some((c: string) => c !== 'no corresponde' && Number(c) > 0))) {
        tieneCronograma = true;
        const aplicables = cuotasArr.filter((v: string) => v !== 'no corresponde').length;
        const pagadas = cuotasArr.filter((v: string) => v !== 'no corresponde' && Number(v) > 0).length;
        const sumPagadas = cuotasArr.reduce((acc: number, v: string) => (v !== 'no corresponde' ? acc + (Number(v) || 0) : acc), 0);

        totalCuotasAplicables += aplicables;
        cuotasPagadasReales += pagadas;
        if (sumPagadas > 0) rowPagado = sumPagadas;
      } else {
        // Fila heredada sin arreglo de cuotas estructurado
        const estadoPagado = row.estado === 'Pagado' || row.estado === 'APROBADO' || row.estado === 'Completado';
        if (rowPagado === 0 && estadoPagado) {
          rowPagado = Number(row.monto || 0);
        }
        if (estadoPagado || rowPagado > 0) {
          cuotasPagadasReales += 1;
        }
      }

      const rowMonto = Math.max(Number(row.monto || 0), rowPagado);
      const rowDeuda = explicitDeuda !== undefined ? explicitDeuda : Math.max(0, rowMonto - rowPagado);

      montoTotalPagado += rowPagado;
      deudaTotalPendiente += rowDeuda;
    }

    const cuotasTotalesFinal = tieneCronograma && totalCuotasAplicables > 0
      ? totalCuotasAplicables
      : Number(profile?.cuotas_totales || defaultCuotasTotales);

    const cuotasPagadasFinal = tieneCronograma
      ? cuotasPagadasReales
      : Math.max(Number(profile?.cuotas_pagadas ?? 0), cuotasPagadasReales);

    const pagadoTodo =
      profileEsContado ||
      (tieneCronograma && deudaTotalPendiente <= 0 && montoTotalPagado > 0) ||
      (tieneCronograma && cuotasTotalesFinal === 1 && cuotasPagadasFinal >= 1) ||
      (cuotasTotalesFinal > 0 && cuotasPagadasFinal >= cuotasTotalesFinal);

    return {
      cuotasPagadas: cuotasPagadasFinal,
      cuotasTotales: pagadoTodo && cuotasPagadasFinal === 1 ? 1 : cuotasTotalesFinal,
      tipoPago: pagadoTodo ? 'CONTADO' : 'CUOTAS',
    };
  }

  const cuotasPagadasFallback =
    profile?.cuotas_pagadas !== undefined && profile?.cuotas_pagadas !== null
      ? Number(profile.cuotas_pagadas)
      : 1;
  const cuotasTotalesFallback = Number(
    profile?.cuotas_totales || (profileEsContado ? 1 : defaultCuotasTotales)
  );
  const esContadoFallback =
    profileEsContado || (cuotasTotalesFallback > 0 && cuotasPagadasFallback >= cuotasTotalesFallback);

  return {
    cuotasPagadas: cuotasPagadasFallback,
    cuotasTotales: cuotasTotalesFallback,
    tipoPago: esContadoFallback ? 'CONTADO' : 'CUOTAS',
  };
}

export interface EvaluacionReglasCertificados {
  sinRestriccionPago: boolean;
  cuotasPagadas: number;
  cuotasTotales: number;
  limiteModularesPorCuota: number;
}

/**
 * Reglas centralizadas para liberación y bloqueo por cuotas de certificados:
 * - Contado, pago total en 1ra cuota o última cuota pagada (sin deuda): sin restricciones.
 * - En cuotas con saldo pendiente:
 *   - Certificados modulares: 1ra cuota = 1 modular, 2da cuota = 2 modulares, N cuotas = N modulares
 *     (se habilitan en el orden cronológico en que el estudiante aprobó cada módulo).
 *   - Diploma General: requiere aprobar todos los módulos del diplomado Y no tener restricciones de pago.
 *   - Talleres de regalo: se certifican al completar el taller, sin restricción por cuotas.
 */
export function evaluarReglasCertificados(params: {
  cuotasPagadas?: number | null;
  cuotasTotales?: number | null;
  tipoPago?: string | null;
  esContado?: boolean | null;
}): EvaluacionReglasCertificados {
  const cuotasPagadas = Math.max(0, Math.floor(Number(params.cuotasPagadas ?? 0)));
  const cuotasTotales = Math.max(1, Math.floor(Number(params.cuotasTotales ?? 1)));
  const sinRestriccionPago = Boolean(
    params.esContado ||
      params.tipoPago === 'CONTADO' ||
      (cuotasTotales > 0 && cuotasPagadas >= cuotasTotales)
  );

  return {
    sinRestriccionPago,
    cuotasPagadas,
    cuotasTotales,
    limiteModularesPorCuota: sinRestriccionPago ? Number.POSITIVE_INFINITY : cuotasPagadas,
  };
}

/**
 * Convierte fechas ISO o DD/MM/YYYY a timestamp en ms para ordenar módulos aprobados cronológicamente.
 */
export function parseFechaCertificadoMs(fecha?: string | null): number | null {
  if (!fecha || typeof fecha !== 'string') return null;
  const trimmed = fecha.trim();
  if (!trimmed) return null;

  const ddmmyyyy = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (ddmmyyyy) {
    const [, dd, mm, yyyy] = ddmmyyyy;
    const ms = Date.UTC(Number(yyyy), Number(mm) - 1, Number(dd));
    return Number.isNaN(ms) ? null : ms;
  }

  const ms = Date.parse(trimmed);
  return Number.isNaN(ms) ? null : ms;
}
