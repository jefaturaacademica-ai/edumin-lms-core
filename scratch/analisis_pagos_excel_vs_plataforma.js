const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log('=== INICIO DE COMPARACIÓN EXCEL VS PLATAFORMA LMS ===\n');

  // 1. Leer Excel del usuario
  const wb = XLSX.readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  console.log(`[EXCEL] Total registros en hoja: ${rows.length}`);

  let excelSumMontoTotal = 0;
  let excelSumMontoCuota = 0;
  let excelContadoCount = 0;
  let excelCreditoCount = 0;
  let excelContadoMonto = 0;
  let excelCreditoMontoTotal = 0;
  let excelCreditoCuota1 = 0;

  const excelMapByDni = new Map();

  for (const r of rows) {
    const dni = String(r.DNI_CE || '').trim();
    const montoTotal = parseFloat(r.MONTO_TOTAL) || 0;
    const montoCuota = parseFloat(r.MONTO_CUOTA) || 0;
    const tipoPago = String(r.TIPO_PAGO || '').toUpperCase().trim();
    const totalCuotas = parseInt(r.TOTAL_CUOTAS) || 1;

    excelSumMontoTotal += montoTotal;
    excelSumMontoCuota += montoCuota;

    if (tipoPago === 'CONTADO') {
      excelContadoCount++;
      excelContadoMonto += montoTotal;
    } else {
      excelCreditoCount++;
      excelCreditoMontoTotal += montoTotal;
      excelCreditoCuota1 += montoCuota;
    }

    excelMapByDni.set(dni, {
      dni,
      nombres: r.NOMBRES,
      apellidos: r.APELLIDOS,
      tipoPago,
      totalCuotas,
      montoTotal,
      montoCuota,
      paquete: r.PAQUETE
    });
  }

  console.log(`[EXCEL] Suma MONTO_TOTAL (valor total pactado/contratos): S/ ${excelSumMontoTotal.toFixed(2)}`);
  console.log(`[EXCEL] Suma MONTO_CUOTA (pago inicial / contado): S/ ${excelSumMontoCuota.toFixed(2)}`);
  console.log(`[EXCEL] Alumnos al Contado: ${excelContadoCount} (S/ ${excelContadoMonto.toFixed(2)})`);
  console.log(`[EXCEL] Alumnos a Crédito: ${excelCreditoCount} (Contrato: S/ ${excelCreditoMontoTotal.toFixed(2)}, Cuota inicial: S/ ${excelCreditoCuota1.toFixed(2)})`);
  console.log(`[EXCEL] Total cobrado estimado inicial (Contado + Cuota 1 Crédito): S/ ${(excelContadoMonto + excelCreditoCuota1).toFixed(2)}\n`);

  // 2. Consultar Supabase: pagos y profiles
  const { data: pagos, error: errPagos } = await supabase.from('pagos').select('*');
  if (errPagos) {
    console.error('Error al leer pagos en Supabase:', errPagos);
    return;
  }

  const { data: profiles, error: errProfiles } = await supabase.from('profiles').select('id, numero_documento, nombres, apellidos, paquete_adquirido');
  if (errProfiles) {
    console.error('Error al leer profiles en Supabase:', errProfiles);
    return;
  }

  console.log(`[SUPABASE] Total registros en tabla pagos: ${pagos.length}`);
  console.log(`[SUPABASE] Total perfiles en tabla profiles: ${profiles.length}`);

  // ¿Cómo calcula la plataforma los pagos?
  // a) Dashboard Principal (/admin)
  // b) Centro de Reportes (/admin/reportes)
  // c) Suma de cuotas pagadas

  let sumaColumnaMontoTotal = 0;
  let sumaCuotasPagadasReales = 0;
  let sumaSaldoPendiente = 0;
  let countCargosExtra = 0;
  let montoCargosExtra = 0;

  const pagosMapByDni = new Map();

  for (const p of pagos) {
    const montoFila = parseFloat(p.monto) || 0;
    sumaColumnaMontoTotal += montoFila;

    const isExtra = String(p.metodo || '').startsWith('CARGO_EXTRA|');
    if (isExtra) {
      countCargosExtra++;
      montoCargosExtra += montoFila;
    }

    // Calcular cuotas pagadas
    const cuotas = Array.isArray(p.cuotas) ? p.cuotas : [];
    let pagadoFila = 0;
    let cuotasPagadasCount = 0;
    for (const c of cuotas) {
      if (c !== 'no corresponde' && !isNaN(parseFloat(c))) {
        const val = parseFloat(c);
        if (val > 0) {
          pagadoFila += val;
          cuotasPagadasCount++;
        }
      }
    }

    sumaCuotasPagadasReales += pagadoFila;
    const saldoPendiente = Math.max(0, montoFila - pagadoFila);
    sumaSaldoPendiente += saldoPendiente;

    const dni = String(p.dni_ce || '').trim();
    if (dni) {
      pagosMapByDni.set(dni, {
        id: p.id,
        monto: montoFila,
        tipo_pago: p.tipo_pago,
        cuotas,
        pagadoFila,
        saldoPendiente,
        cuotas_recibos: p.cuotas_recibos
      });
    }
  }

  console.log('\n--- MÉTRICAS EN LA PLATAFORMA ---');
  console.log(`1. Suma directa de 'pagos.monto' (Valor total de contratos contratados): S/ ${sumaColumnaMontoTotal.toFixed(2)}`);
  console.log(`   (Esto es lo que muestra /admin/reportes en 'Recaudación Registrada': S/ ${sumaColumnaMontoTotal.toFixed(2)})`);
  console.log(`2. Suma de dinero realmente COBRADO/PAGADO en cuotas: S/ ${sumaCuotasPagadasReales.toFixed(2)}`);
  console.log(`3. Saldo pendiente por cobrar en el LMS: S/ ${sumaSaldoPendiente.toFixed(2)}`);
  console.log(`4. Cargos extra registrados: ${countCargosExtra} (S/ ${montoCargosExtra.toFixed(2)})`);

  // 3. Comparación DNI por DNI entre Excel y Plataforma
  console.log('\n--- COMPARATIVA DNI POR DNI ---');
  let coincidenciasExactas = 0;
  let diferenciasMonto = [];
  let soloEnExcel = [];
  let soloEnPlataforma = [];

  for (const [dni, ex] of excelMapByDni.entries()) {
    const supa = pagosMapByDni.get(dni);
    if (!supa) {
      soloEnExcel.push(ex);
    } else {
      if (Math.abs(supa.monto - ex.montoTotal) < 0.01) {
        coincidenciasExactas++;
      } else {
        diferenciasMonto.push({
          dni,
          alumno: `${ex.nombres} ${ex.apellidos}`,
          excelMontoTotal: ex.montoTotal,
          excelMontoCuota: ex.montoCuota,
          plataformaMonto: supa.monto,
          plataformaPagado: supa.pagadoFila
        });
      }
    }
  }

  for (const [dni, supa] of pagosMapByDni.entries()) {
    if (!excelMapByDni.has(dni)) {
      soloEnPlataforma.push(supa);
    }
  }

  console.log(`Coincidencias exactas de monto total de contrato: ${coincidenciasExactas}`);
  console.log(`Diferencias de monto total: ${diferenciasMonto.length}`);
  if (diferenciasMonto.length > 0) {
    console.log('Muestra de diferencias:', diferenciasMonto.slice(0, 5));
  }
  console.log(`Alumnos en Excel no encontrados en tabla pagos de plataforma: ${soloEnExcel.length}`);
  if (soloEnExcel.length > 0) {
    console.log('Alumnos solo en Excel:', soloEnExcel.slice(0, 5));
  }
  console.log(`Registros en tabla pagos que no están en el Excel: ${soloEnPlataforma.length}`);
  if (soloEnPlataforma.length > 0) {
    console.log('Registros solo en Plataforma (ej. pruebas o registros previos):', soloEnPlataforma.slice(0, 5));
  }
}

run();
