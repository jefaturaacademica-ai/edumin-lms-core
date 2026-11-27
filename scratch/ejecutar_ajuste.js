const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function aplicarAjustes() {
  console.log('=== APLICANDO AJUSTES PARA QUE COINCIDA CON EL EXCEL ===\n');

  // 1. Ajustar Carlos Eduardo Paiva Holguino (DNI 73901770) a S/ 550.00
  const metodoPaiva = 'CREDITO_1|' + JSON.stringify({
    num_credito: 1,
    cuotas: ["550", "no corresponde", "no corresponde", "no corresponde", "no corresponde", "no corresponde"],
    cuotas_recibos: {
      "0": {
        nro_recibo: "REC-2026-00023",
        nro_operacion: null,
        fecha: "2026-11-27T16:02:31.139Z"
      }
    },
    fechas_vencimiento: ["2026-11-27"],
    total_pagado: 550,
    total_deuda: 0,
    ultimo_pago: {
      monto: 550,
      metodo: "Matrícula Inicial (Carga Masiva)",
      nro_recibo: "REC-2026-00023",
      nro_operacion: null,
      comprobante: "REC-2026-00023",
      fecha: "2026-11-27T16:02:31.139Z"
    }
  });

  const { error: err1 } = await supabase
    .from('pagos')
    .update({
      monto: 550,
      metodo: metodoPaiva
    })
    .eq('dni_ce', '73901770');

  if (err1) console.error('Error actualizando Paiva:', err1);
  else console.log('✓ Carlos Eduardo Paiva Holguino (73901770) actualizado a S/ 550.00');

  // 2. Ajustar Harrinson Steven Salcedo Ventocilla (DNI 71852289) a S/ 0.00
  const metodoSalcedo = 'CREDITO_1|' + JSON.stringify({
    num_credito: 1,
    cuotas: ["0", "no corresponde", "no corresponde", "no corresponde", "no corresponde", "no corresponde"],
    cuotas_recibos: {},
    fechas_vencimiento: ["2026-11-27"],
    total_pagado: 0,
    total_deuda: 0,
    ultimo_pago: null
  });

  const { error: err2 } = await supabase
    .from('pagos')
    .update({
      monto: 0,
      metodo: metodoSalcedo
    })
    .eq('dni_ce', '71852289');

  if (err2) console.error('Error actualizando Salcedo:', err2);
  else console.log('✓ Harrinson Steven Salcedo Ventocilla (71852289) actualizado a S/ 0.00');

  // Actualizar también en profiles su cuotas_pagadas = 0
  await supabase
    .from('profiles')
    .update({ cuotas_pagadas: 0 })
    .eq('numero_documento', '71852289');

  console.log('\n--- VERIFICACIÓN DE SUMAS TRAS EL AJUSTE ---');
  // Re-ejecutar comparación
  const { data: pagos } = await supabase.from('pagos').select('*');
  const wb = require('xlsx').readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
  const excelRows = require('xlsx').utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

  const pagosByDni = {};
  for (const p of pagos) pagosByDni[String(p.dni_ce).trim()] = p;

  let totalExcelMonto = 0;
  let totalExcelCuota = 0;
  let totalSupaMonto = 0;
  let totalSupaCuota1 = 0;
  let diferenciasRestantes = 0;

  for (const r of excelRows) {
    const dni = String(r.DNI_CE).trim();
    const exMonto = parseFloat(r.MONTO_TOTAL) || 0;
    const exCuota = parseFloat(r.MONTO_CUOTA) || 0;
    totalExcelMonto += exMonto;
    totalExcelCuota += exCuota;

    const p = pagosByDni[dni];
    if (p) {
      const supaMonto = parseFloat(p.monto) || 0;
      totalSupaMonto += supaMonto;

      let metodoJson = {};
      try {
        if (p.metodo && p.metodo.includes('|')) metodoJson = JSON.parse(p.metodo.split('|')[1]);
      } catch (e) {}
      const cuotas = p.cuotas || metodoJson.cuotas || [];
      totalSupaCuota1 += parseFloat(cuotas[0]) || 0;

      if (Math.abs(supaMonto - exMonto) > 0.01) {
        diferenciasRestantes++;
      }
    }
  }

  console.log(`Excel Suma MONTO_TOTAL: S/ ${totalExcelMonto.toFixed(2)}`);
  console.log(`Plataforma Suma monto (212 alumnos): S/ ${totalSupaMonto.toFixed(2)}`);
  console.log(`Diferencia entre ambos: S/ ${(totalSupaMonto - totalExcelMonto).toFixed(2)}`);
  console.log(`Diferencias restantes entre los 212 alumnos: ${diferenciasRestantes}`);
  console.log(`\nExcel Suma MONTO_CUOTA: S/ ${totalExcelCuota.toFixed(2)}`);
  console.log(`Plataforma Suma Cuota 1: S/ ${totalSupaCuota1.toFixed(2)}`);
  console.log(`Diferencia Cuota 1: S/ ${(totalSupaCuota1 - totalExcelCuota).toFixed(2)}`);
}

aplicarAjustes();
