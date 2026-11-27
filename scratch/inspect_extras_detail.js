const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectExtra() {
  const { data: pagosExtra } = await supabase.from('pagos').select('id, profile_id, dni_ce, monto, created_at');
  const wb = require('xlsx').readFile('C:/Users/USER/.gemini/antigravity/brain/21a0b4ff-30c3-4d2a-8e81-88bc509dcae2/.user_uploaded/media_1795802339529_f80ac338.xlsx');
  const excelRows = require('xlsx').utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
  const excelDnis = new Set(excelRows.map(r => String(r.DNI_CE).trim()));

  const extras = (pagosExtra || []).filter(p => !excelDnis.has(String(p.dni_ce).trim()));
  console.log(`Total pagos extra fuera del excel: ${extras.length}`);
  for (const e of extras) {
    if (e.profile_id) {
      const { data: pr } = await supabase.from('profiles').select('id, numero_documento, nombres, apellidos, email').eq('id', e.profile_id).maybeSingle();
      console.log(`Pago ID ${e.id} | DNI en pago: ${e.dni_ce} | Monto: ${e.monto} | Perfil vinculado:`, pr ? `${pr.nombres} ${pr.apellidos} (${pr.numero_documento})` : 'Sin perfil vinculado');
    } else {
      console.log(`Pago ID ${e.id} | DNI en pago: ${e.dni_ce} | Monto: ${e.monto} | Sin profile_id`);
    }
  }
}

inspectExtra();
