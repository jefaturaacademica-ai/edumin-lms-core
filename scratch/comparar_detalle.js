const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: pagos } = await supabase.from('pagos').select('*');
  const wb = XLSX.readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
  const excelRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

  const pagosByDni = {};
  for (const p of pagos) {
    pagosByDni[String(p.dni_ce).trim()] = p;
  }

  let totalExcelMonto = 0;
  let totalExcelCuota = 0;
  let totalSupaMonto = 0;
  let totalSupaCuota1 = 0;
  let totalSupaCobradoEnCuotas = 0;
  let conCuota2Plus = [];

  let diferencias = [];

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
        if (p.metodo && p.metodo.includes('|')) {
          metodoJson = JSON.parse(p.metodo.split('|')[1]);
        }
      } catch (e) {}

      const cuotas = p.cuotas || metodoJson.cuotas || [];
      const c1 = parseFloat(cuotas[0]) || 0;
      totalSupaCuota1 += c1;

      let pagado = 0;
      let cResto = 0;
      for (let i = 0; i < cuotas.length; i++) {
        const val = parseFloat(cuotas[i]);
        if (cuotas[i] !== 'no corresponde' && !isNaN(val)) {
          pagado += val;
          if (i > 0 && val > 0) cResto += val;
        }
      }
      totalSupaCobradoEnCuotas += pagado;

      if (cResto > 0) {
        conCuota2Plus.push({
          dni,
          alumno: r.NOMBRES + ' ' + r.APELLIDOS,
          cuota1: c1,
          cuotasPosteriores: cResto,
          totalPagado: pagado
        });
      }

      if (Math.abs(supaMonto - exMonto) > 0.01) {
        diferencias.push({
          dni,
          alumno: r.NOMBRES + ' ' + r.APELLIDOS,
          excel_monto_total: exMonto,
          excel_monto_cuota: exCuota,
          plataforma_monto: supaMonto,
          metodo: p.metodo ? p.metodo.substring(0, 80) : ''
        });
      }
    }
  }

  console.log('=== RESULTADO COMPARACIÓN DETALLADA ===');
  console.log(`Excel Suma MONTO_TOTAL (212 alumnos): S/ ${totalExcelMonto.toFixed(2)}`);
  console.log(`Plataforma Suma monto (para los mismos 212 alumnos): S/ ${totalSupaMonto.toFixed(2)}`);
  console.log(`Diferencia entre ambos: S/ ${(totalSupaMonto - totalExcelMonto).toFixed(2)}`);
  console.log('\nDiferencias específicas en esos 212 alumnos:');
  console.log(JSON.stringify(diferencias, null, 2));

  console.log(`\nExcel Suma MONTO_CUOTA (pago inicial/contado): S/ ${totalExcelCuota.toFixed(2)}`);
  console.log(`Plataforma Suma Cuota 1 (pago inicial registrado): S/ ${totalSupaCuota1.toFixed(2)}`);
  console.log(`Diferencia Cuota 1 (Plataforma - Excel): S/ ${(totalSupaCuota1 - totalExcelCuota).toFixed(2)}`);
  console.log(`Plataforma Suma cuotas posteriores (cuota 2, 3...) pagadas: S/ ${(totalSupaCobradoEnCuotas - totalSupaCuota1).toFixed(2)}`);
  console.log(`Alumnos con cuotas posteriores ya pagadas:`, conCuota2Plus);
}

run();
