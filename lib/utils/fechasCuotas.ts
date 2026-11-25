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

/**
 * Determina con precisión si una fecha dada ya venció respecto al día de hoy.
 * Admite formatos: YYYY-MM-DD, DD/MM/YYYY, DD/MM, ISO strings.
 */
export function esFechaVencida(fechaStr?: string | null): boolean {
  if (!fechaStr) return false;
  const str = String(fechaStr).trim();
  if (!str || str === '-' || str.toLowerCase() === 'no corresponde') return false;

  const hoy = new Date();
  hoy.setHours(23, 59, 59, 999);

  // Formato DD/MM/YYYY o DD/MM (ej: 24/10/2026 o 24/10)
  const matchDMY = str.match(/^(\d{1,2})[\/-](\d{1,2})(?:[\/-](\d{2,4}))?$/);
  if (matchDMY) {
    const dia = parseInt(matchDMY[1], 10);
    const mes = parseInt(matchDMY[2], 10) - 1;
    let anio = matchDMY[3] ? parseInt(matchDMY[3], 10) : hoy.getFullYear();
    if (anio < 100) anio += 2000;
    const fecha = new Date(anio, mes, dia, 23, 59, 59, 999);
    return fecha.getTime() < Date.now();
  }

  // Formato YYYY-MM-DD
  const matchYMD = str.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (matchYMD) {
    const anio = parseInt(matchYMD[1], 10);
    const mes = parseInt(matchYMD[2], 10) - 1;
    const dia = parseInt(matchYMD[3], 10);
    const fecha = new Date(anio, mes, dia, 23, 59, 59, 999);
    return fecha.getTime() < Date.now();
  }

  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    d.setHours(23, 59, 59, 999);
    return d.getTime() < Date.now();
  }

  return false;
}

export interface EvaluacionEstadoDeuda {
  tieneDeudaVencida: boolean;
  estaAlDia: boolean;
  esCompletado: boolean;
  totalDeuda: number;
  totalPagado: number;
  cuotasVencidasCount: number;
  cuotasPendientesCount: number;
  cuotasPagadasCount: number;
  primeraFechaVencida: string | null;
  proximaFechaPorVencer: string | null;
  motivoBloqueo: string | null;
}

/**
 * Evaluación integral de deuda financiera para alumnos en EDUMIN LMS.
 * Detecta de forma estricta si el alumno registra cuotas vencidas y debe bloquearse el campus.
 */
export function evaluarEstadoDeuda(profile?: any, pagos: any[] = []): EvaluacionEstadoDeuda {
  const result: EvaluacionEstadoDeuda = {
    tieneDeudaVencida: false,
    estaAlDia: true,
    esCompletado: false,
    totalDeuda: 0,
    totalPagado: 0,
    cuotasVencidasCount: 0,
    cuotasPendientesCount: 0,
    cuotasPagadasCount: 0,
    primeraFechaVencida: null,
    proximaFechaPorVencer: null,
    motivoBloqueo: null
  };

  if (!profile) return result;

  // Los administradores, docentes y superadmins nunca son bloqueados por morosidad
  const rol = String(profile.role || profile.roles?.administrativo || '').toUpperCase();
  if (rol === 'SUPERADMIN' || rol === 'ADMIN' || rol === 'DOCENTE') {
    result.esCompletado = true;
    return result;
  }

  // Prórroga activa de pago
  const tieneProrrogaActiva = Boolean(
    profile.prorroga_hasta && !esFechaVencida(profile.prorroga_hasta)
  );

  // Bloqueo manual / administrativo
  if (profile.bloqueado && !tieneProrrogaActiva) {
    result.tieneDeudaVencida = true;
    result.estaAlDia = false;
    result.motivoBloqueo = 'Cuenta bloqueada administrativamente por morosidad';
  }

  const esContado = 
    profile.tipo_pago === 'CONTADO' ||
    String(profile.paquete_adquirido || '').toUpperCase().includes('CONTADO');

  let sumaPagado = 0;
  let sumaDeuda = 0;
  let tieneExplicitDeuda = false;
  let cuotasTotalActivas = 0;

  for (const pago of pagos) {
    if (pago.is_cargo_extra) continue;

    let cuotasArray: string[] = Array.isArray(pago.cuotas) ? pago.cuotas : [];
    let fechasVenc: string[] | null = Array.isArray(pago.fechas_vencimiento) ? pago.fechas_vencimiento : null;
    let pagadoFila = pago.total_pagado !== undefined ? Number(pago.total_pagado) : 0;
    let deudaFila = pago.total_deuda !== undefined ? Number(pago.total_deuda) : undefined;

    if (typeof pago.metodo === 'string' && pago.metodo.startsWith('CREDITO_')) {
      try {
        const jsonStr = pago.metodo.substring(pago.metodo.indexOf('|') + 1).trim();
        const parsed = JSON.parse(jsonStr);
        if (Array.isArray(parsed.cuotas)) cuotasArray = parsed.cuotas;
        if (Array.isArray(parsed.fechas_vencimiento)) fechasVenc = parsed.fechas_vencimiento;
        if (parsed.total_pagado !== undefined) pagadoFila = Number(parsed.total_pagado) || 0;
        if (parsed.total_deuda !== undefined) {
          deudaFila = Number(parsed.total_deuda) || 0;
          tieneExplicitDeuda = true;
        }
      } catch {
        // ignore
      }
    }

    if (cuotasArray.length > 0) {
      cuotasArray.forEach((cVal: string, cIdx: number) => {
        if (cVal === 'no corresponde') return;
        cuotasTotalActivas++;
        const esPagada = Number(cVal) > 0;
        const montoCuota = Number(cVal) || 0;

        if (esPagada) {
          result.cuotasPagadasCount++;
          sumaPagado += montoCuota;
        } else {
          result.cuotasPendientesCount++;
          const fechaVenc = resolverFechaVencimiento(
            cIdx,
            fechasVenc,
            pago.created_at || profile.created_at
          );

          if (esFechaVencida(fechaVenc)) {
            result.cuotasVencidasCount++;
            if (!result.primeraFechaVencida) {
              result.primeraFechaVencida = fechaVenc;
            }
          } else {
            if (!result.proximaFechaPorVencer) {
              result.proximaFechaPorVencer = fechaVenc;
            }
          }
        }
      });
    } else {
      // Registro simple sin cuotas estructuradas
      const esPagadoSimple = pago.estado === 'Pagado' || pago.estado === 'APROBADO' || pago.estado === 'Completado';
      if (esPagadoSimple) {
        result.cuotasPagadasCount++;
        sumaPagado += Number(pago.monto || 0);
      } else {
        result.cuotasPendientesCount++;
        sumaDeuda += Number(pago.monto || 0);
        const fechaVenc = pago.fecha_vencimiento || pago.created_at;
        if (esFechaVencida(fechaVenc)) {
          result.cuotasVencidasCount++;
          if (!result.primeraFechaVencida) result.primeraFechaVencida = fechaVenc;
        } else if (!result.proximaFechaPorVencer) {
          result.proximaFechaPorVencer = fechaVenc;
        }
      }
    }

    if (deudaFila !== undefined) {
      sumaDeuda += deudaFila;
      tieneExplicitDeuda = true;
    }
  }

  // Estimación si no existen cuotas estructuradas en `pagos` pero el perfil tiene un plan en cuotas
  if (cuotasTotalActivas === 0) {
    const pkgUpper = String(profile.paquete_adquirido || '').toUpperCase();
    const cuotasTotalesSugeridas = esContado ? 1 : (pkgUpper === 'ILIMITADO' ? 5 : 3);
    const cuotasTot = Math.max(1, Number(profile.cuotas_totales || cuotasTotalesSugeridas));
    
    // Si hubo registros simples en pagos, respetar la cantidad contada; sino usar profile.cuotas_pagadas
    const pagadasReales = pagos.length > 0 ? result.cuotasPagadasCount : Math.max(0, Number(profile.cuotas_pagadas ?? (esContado ? cuotasTot : 1)));
    result.cuotasPagadasCount = pagadasReales;
    
    if (!esContado) {
      const pendientes = Math.max(0, cuotasTot - pagadasReales);
      result.cuotasPendientesCount = pendientes;
      
      // Evaluar las fechas de vencimiento de las cuotas pendientes que faltan
      for (let cIdx = pagadasReales; cIdx < cuotasTot; cIdx++) {
        const fechaVenc = resolverFechaVencimiento(
          cIdx,
          null,
          profile.created_at || (pagos[0]?.created_at)
        );
        if (esFechaVencida(fechaVenc)) {
          result.cuotasVencidasCount++;
          if (!result.primeraFechaVencida) {
            result.primeraFechaVencida = fechaVenc;
          }
        } else if (!result.proximaFechaPorVencer) {
          result.proximaFechaPorVencer = fechaVenc;
        }
      }
    } else {
      result.cuotasPendientesCount = 0;
    }
  }

  result.totalPagado = sumaPagado;
  result.totalDeuda = tieneExplicitDeuda ? sumaDeuda : Math.max(0, sumaDeuda);

  // Activación de bloqueo por cuotas vencidas
  if (result.cuotasVencidasCount > 0 && !tieneProrrogaActiva) {
    result.tieneDeudaVencida = true;
    result.estaAlDia = false;
    result.motivoBloqueo = `Registra ${result.cuotasVencidasCount} cuota(s) vencida(s)`;
  }

  // Estado completado vs al día
  if (esContado && result.cuotasVencidasCount === 0) {
    result.esCompletado = true;
    result.estaAlDia = true;
    result.tieneDeudaVencida = false;
  } else if (result.cuotasPendientesCount === 0 && result.cuotasPagadasCount > 0 && !result.tieneDeudaVencida) {
    result.esCompletado = true;
    result.estaAlDia = true;
  } else if (!result.tieneDeudaVencida) {
    result.estaAlDia = true;
    result.esCompletado = false;
  }

  return result;
}
