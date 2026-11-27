const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testSum() {
  const wb = XLSX.readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });

  let excelTotal = 0;
  let excelCuota = 0;
  for (const r of rows) {
    excelTotal += parseFloat(r.MONTO_TOTAL) || 0;
    excelCuota += parseFloat(r.MONTO_CUOTA) || 0;
  }

  console.log('Suma total 212 filas Excel:', excelTotal);
  console.log('Suma cuotas 212 filas Excel:', excelCuota);
}

testSum();
