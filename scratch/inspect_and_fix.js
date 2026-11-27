const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspect() {
  const dnis = ['71234567', '73456789', '72345678', '22222222', '76789012', '74567890', '33333333', '70412117', '75678901', '70707070', '77777777', '72040674'];
  const { data: profs } = await supabase.from('profiles').select('id, numero_documento, nombres, apellidos, email, role').in('numero_documento', dnis);
  console.log('--- PERFILES DE LAS CUENTAS EXTRA ---');
  for (const p of (profs || [])) {
    console.log(`${p.numero_documento}: ${p.nombres} ${p.apellidos} (${p.email}) - Rol: ${p.role}`);
  }

  console.log('\n--- DETALLES ACTUALES DE LOS 2 ALUMNOS CON DIFERENCIA ---');
  const { data: pagos2 } = await supabase.from('pagos').select('*').in('dni_ce', ['73901770', '71852289']);
  for (const p of (pagos2 || [])) {
    console.log(p.dni_ce, 'monto:', p.monto, 'metodo:', p.metodo);
  }
}

inspect();
