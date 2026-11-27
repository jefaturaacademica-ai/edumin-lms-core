const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectPaiva() {
  const { data: prof } = await supabase.from('profiles').select('*').eq('numero_documento', '73901770').maybeSingle();
  console.log('Profile Paiva:', {
    nombres: prof.nombres,
    apellidos: prof.apellidos,
    paquete_adquirido: prof.paquete_adquirido,
    diplomados: prof.diplomados?.substring(0, 100),
    cupos_creditos: prof.cupos_creditos
  });
  const { data: pagos } = await supabase.from('pagos').select('*').eq('dni_ce', '73901770');
  console.log('Pagos Paiva:', pagos);
}

inspectPaiva();
