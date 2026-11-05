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
  };
  // Desglose Créditos Cursos Libres
  cursos: {
    contratados: number;
    liberados: number;
    consumidos: number;
    disponibles: number;
  };
  // Total Créditos EDUMIN
  total: {
    contratados: number;
    liberados: number;
    consumidos: number;
    disponibles: number;
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
 * - Contado o cuota final (sin deuda): se liberan el 100% de los créditos del paquete.
 * - Por cuotas:
 *   - Diplomados: Cuota 1 = 1 crédito liberado; Cuota 2 = 2 créditos (si aplica en ILIMITADO); etc.
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
    } else if (esContado) {
      dipLiberados = 1;
      curLiberados = 3;
    } else if (cuotasTotales === 2 && cuotasPagadas === 2) {
      // Estudiante con solo 2 cuotas: al pagar la 2da se libera todo
      dipLiberados = 1;
      curLiberados = 3;
    } else {
      dipLiberados = 1;
      curLiberados = Math.min(3, cuotasPagadas * 1);
    }
  } else if (paquete === 'FULL') {
    dipContratados = 1;
    curContratados = 5;

    if (cuotasPagadas === 0) {
      dipLiberados = 0;
      curLiberados = 0;
    } else if (esContado) {
      dipLiberados = 1;
      curLiberados = 5;
    } else if (cuotasTotales === 2 && cuotasPagadas === 2) {
      // Estudiante con solo 2 cuotas: al pagar la 2da se libera todo
      dipLiberados = 1;
      curLiberados = 5;
    } else {
      dipLiberados = 1;
      curLiberados = Math.min(5, cuotasPagadas * 2);
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
    } else {
      curLiberados = Math.min(15, cuotasPagadas * 3);
      dipLiberados = Math.min(3, cuotasPagadas * 1);
    }

    // Regla especial ILIMITADO:
    // Una vez que consume sus créditos de diplomados, se liberan 3 créditos más sucesivamente
    if (dipConsumidos >= dipLiberados && dipLiberados > 0) {
      const tramosExtras = Math.floor((dipConsumidos - dipLiberados) / 3) + 1;
      dipLiberados += tramosExtras * 3;
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
    },
    cursos: {
      contratados: curContratados,
      liberados: curLiberados,
      consumidos: curConsumidos,
      disponibles: curDisponibles,
    },
    total: {
      contratados: dipContratados + curContratados,
      liberados: dipLiberados + curLiberados,
      consumidos: dipConsumidos + curConsumidos,
      disponibles: dipDisponibles + curDisponibles,
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
