export const PAQUETES_ADQUIRIDOS = [
  "COMPLETO",
  "FULL",
  "ILIMITADO",
] as const;

export type PaqueteAdquirido = (typeof PAQUETES_ADQUIRIDOS)[number];

/**
 * Calcula la cantidad total de cursos que una cuota libera para un paquete.
 * COMPLETO y FULL contemplan los dos tramos comerciales definidos; cuotas
 * adicionales no agregan cupos. ILIMITADO agrega tres cupos por cada cuota.
 */
export function calculateReleasedCredits(
  paqueteAdquirido: PaqueteAdquirido,
  cuotasPagadas: number,
): number {
  if (!Number.isInteger(cuotasPagadas) || cuotasPagadas < 0) {
    throw new RangeError("cuotasPagadas debe ser un entero mayor o igual a cero.");
  }

  switch (paqueteAdquirido) {
    case "COMPLETO":
      if (cuotasPagadas === 0) return 0;
      return cuotasPagadas === 1 ? 1 : 3;
    case "FULL":
      if (cuotasPagadas === 0) return 0;
      return cuotasPagadas === 1 ? 2 : 5;
    case "ILIMITADO":
      return cuotasPagadas * 3;
    default: {
      const exhaustiveCheck: never = paqueteAdquirido;
      throw new Error(`Paquete no soportado: ${exhaustiveCheck}`);
    }
  }
}
