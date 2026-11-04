import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';
const supabase = createClient(url, serviceRoleKey);

async function run() {
  const { data: certs } = await supabase.from('certificaciones').select('*').eq('dni_ce', '71234567');
  console.log('=== CERTIFICACIONES PARA 71234567 ===');
  console.log('Total certs:', certs?.length);
  for (const c of certs || []) {
    console.log({
      id: c.id,
      codigo: c.codigo_verificacion,
      tipo: c.tipo,
      programa: c.programa_titulo,
      modulo: c.modulo_titulo,
      fecha: c.fecha_emision,
      nota: c.nota_final,
      horas: c.horas_lectivas,
      modelo_id: c.plantilla_snapshot?.modelo_id
    });
  }

  const { data: profile } = await supabase.from('profiles').select('*').eq('dni_ce', '71234567').single();
  console.log('=== PERFIL 71234567 ===');
  console.log('Talleres:', profile?.talleres);
  console.log('Diplomados:', JSON.stringify(profile?.diplomados, null, 2));
  console.log('Cursos:', JSON.stringify(profile?.cursos, null, 2));
}
run();
