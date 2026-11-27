const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncExact() {
  console.log('=== SINCRONIZANDO EXACTITUD DE CONTRATOS ===\n');

  // Obtener profile de Carlos Paiva
  const { data: profPaiva } = await supabase.from('profiles').select('id').eq('numero_documento', '73901770').single();

  // 1. Restaurar contrato 1 de Carlos Paiva (S/ 199.00 - Básico)
  const metodoPaiva1 = 'CREDITO_1|' + JSON.stringify({
    num_credito: 1,
    cuotas: ["199", "no corresponde", "no corresponde", "no corresponde", "no corresponde", "no corresponde"],
    cuotas_recibos: {
      "0": {
        nro_recibo: "REC-2026-00023",
        nro_operacion: null,
        fecha: "2026-11-27T16:02:31.139Z"
      }
    },
    fechas_vencimiento: ["2026-11-27"],
    total_pagado: 199,
    total_deuda: 0,
    ultimo_pago: {
      monto: 199,
      metodo: "Matrícula Inicial (Carga Masiva)",
      nro_recibo: "REC-2026-00023",
      nro_operacion: null,
      comprobante: "REC-2026-00023",
      fecha: "2026-11-27T16:02:31.139Z"
    }
  });

  await supabase
    .from('pagos')
    .update({
      monto: 199,
      metodo: metodoPaiva1
    })
    .eq('dni_ce', '73901770');

  // 2. Insertar contrato 2 de Carlos Paiva (S/ 550.00 - Completo - Gestión Minera)
  const metodoPaiva2 = 'CREDITO_1|' + JSON.stringify({
    num_credito: 1,
    cuotas: ["550", "no corresponde", "no corresponde", "no corresponde", "no corresponde", "no corresponde"],
    cuotas_recibos: {
      "0": {
        nro_recibo: "REC-2026-00194",
        nro_operacion: null,
        fecha: "2026-11-27T16:04:15.000Z"
      }
    },
    fechas_vencimiento: ["2026-11-27"],
    total_pagado: 550,
    total_deuda: 0,
    ultimo_pago: {
      monto: 550,
      metodo: "Matrícula Inicial (Carga Masiva)",
      nro_recibo: "REC-2026-00194",
      nro_operacion: null,
      comprobante: "REC-2026-00194",
      fecha: "2026-11-27T16:04:15.000Z"
    }
  });

  // Verificar si ya existe el segundo pago
  const { data: existingPagosPaiva } = await supabase.from('pagos').select('id, monto').eq('dni_ce', '73901770');
  if (existingPagosPaiva && existingPagosPaiva.length === 1) {
    await supabase.from('pagos').insert({
      profile_id: profPaiva.id,
      dni_ce: '73901770',
      monto: 550,
      metodo: metodoPaiva2,
      estado: 'Completado'
    });
    console.log('✓ Se insertó el segundo contrato de Carlos Paiva (S/ 550.00)');
  }

  // 3. Verificar Harrinson Salcedo (DNI 71852289) a S/ 0.00
  const metodoSalcedo = 'CREDITO_1|' + JSON.stringify({
    num_credito: 1,
    cuotas: ["0", "no corresponde", "no corresponde", "no corresponde", "no corresponde", "no corresponde"],
    cuotas_recibos: {},
    fechas_vencimiento: ["2026-11-27"],
    total_pagado: 0,
    total_deuda: 0,
    ultimo_pago: null
  });

  await supabase
    .from('pagos')
    .update({
      monto: 0,
      metodo: metodoSalcedo
    })
    .eq('dni_ce', '71852289');

  console.log('\n--- VERIFICACIÓN COMPLETA FINAL ---');
  const { data: todosPagos } = await supabase.from('pagos').select('*');
  const wb = require('xlsx').readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
  const excelRows = require('xlsx').utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

  // Agrupar pagos por DNI en lista
  const pagosPorDni = {};
  for (const p of todosPagos) {
    const d = String(p.dni_ce).trim();
    if (!pagosPorDni[d]) pagosPorDni[d] = [];
    pagosPorDni[d].push(p);
  }

  let totalExcelMonto = 0;
  let totalExcelCuota = 0;
  for (const r of excelRows) {
    totalExcelMonto += parseFloat(r.MONTO_TOTAL) || 0;
    totalExcelCuota += parseFloat(r.MONTO_CUOTA) || 0;
  }

  // Sumar pagos de los alumnos del Excel
  const excelDnis = new Set(excelRows.map(r => String(r.DNI_CE).trim()));
  let sumaPlataformaMontoExcel = 0;
  let sumaPlataformaCuota1Excel = 0;

  for (const dni of excelDnis) {
    const list = pagosPorDni[dni] || [];
    for (const p of list) {
      sumaPlataformaMontoExcel += parseFloat(p.monto) || 0;
      let metodoJson = {};
      try {
        if (p.metodo && p.metodo.includes('|')) metodoJson = JSON.parse(p.metodo.split('|')[1]);
      } catch (e) {}
      const cuotas = p.cuotas || metodoJson.cuotas || [];
      sumaPlataformaCuota1Excel += parseFloat(cuotas[0]) || 0;
    }
  }

  console.log(`Excel Suma MONTO_TOTAL (212 filas): S/ ${totalExcelMonto.toFixed(2)}`);
  console.log(`Plataforma Suma monto de los alumnos del Excel: S/ ${sumaPlataformaMontoExcel.toFixed(2)}`);
  console.log(`>>> DIFERENCIA MONTO TOTAL CONTRATOS: S/ ${(sumaPlataformaMontoExcel - totalExcelMonto).toFixed(2)} <<<`);

  console.log(`\nExcel Suma MONTO_CUOTA (Cobro inicial): S/ ${totalExcelCuota.toFixed(2)}`);
  console.log(`Plataforma Suma Cuota 1 de los alumnos del Excel: S/ ${sumaPlataformaCuota1Excel.toFixed(2)}`);
  console.log(`>>> DIFERENCIA COBRO INICIAL: S/ ${(sumaPlataformaCuota1Excel - totalExcelCuota).toFixed(2)} <<<`);
}

syncExact();
