const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const dnis = [
  '73247528', '71421710', '73901770', '71900766', '40676948',
  '72618876', '47974848', '73954256', '77300057', '73227033',
  '71974123', '71950241', '42584570', '42766055', '71033050',
  '71324157', '42763727', '48057186', '71867546', '70345239',
  '70562700', '46680094', '45918453', '47757697', '20885885',
  '75022316', '71564810', '46864610', '71852289'
];

async function check() {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, numero_documento, nombres, apellidos, paquete_adquirido, cupos_creditos')
    .in('numero_documento', dnis);

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }

  console.log('Encontrados en BD:', profiles.length, 'de', dnis.length, 'DNIs unicos');
  const byPkg = {};
  profiles.forEach(p => {
    byPkg[p.paquete_adquirido] = (byPkg[p.paquete_adquirido] || 0) + 1;
  });
  console.log('Paquetes actuales de estos alumnos:', JSON.stringify(byPkg));

  profiles.forEach(p => {
    console.log(`DNI: ${p.numero_documento} | Nombre: ${p.nombres} ${p.apellidos} | Paquete actual: ${p.paquete_adquirido}`);
  });

  const { data: paquetes } = await supabase.from('paquetes').select('*');
  console.log('--- Paquetes en public.paquetes ---');
  paquetes.forEach(p => {
    console.log(`ID: ${p.id} | Nombre: ${p.nombre} | Dip: ${p.creditos_diplomados} | Cur: ${p.creditos_cursos}`);
  });

  process.exit(0);
}
check();
