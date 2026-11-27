const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkRemaining() {
  const { data: pagos } = await supabase.from('pagos').select('*');
  const wb = XLSX.readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
  const excelRows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

  const pagosByDni = {};
  for (const p of pagos) pagosByDni[String(p.dni_ce).trim()] = p;

  for (const r of excelRows) {
    const dni = String(r.DNI_CE).trim();
    const exMonto = parseFloat(r.MONTO_TOTAL) || 0;
    const p = pagosByDni[dni];
    if (p && Math.abs(parseFloat(p.monto) - exMonto) > 0.01) {
      console.log('Diferencia:', {
        dni,
        alumno: r.NOMBRES + ' ' + r.APELLIDOS,
        excel_monto: exMonto,
        plataforma_monto: p.monto
      });
    }
  }
}

checkRemaining();
