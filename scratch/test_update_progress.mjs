import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function testUpdateProgress() {
  const { data: p } = await admin.from('profiles').select('*').eq('dni_ce', '71234567').maybeSingle();
  if (!p) {
    console.error('No profile found');
    return;
  }

  console.log('--- TEST ACTUALIZACIÓN EN SUPABASE (SOLO diplomados Y cursos) ---');
  let diplomados = [];
  if (p.diplomados && p.diplomados.startsWith('DIPLOMADOS_LIST|')) {
    diplomados = JSON.parse(p.diplomados.substring(16));
  }

  if (diplomados[0] && diplomados[0].modulos) {
    diplomados[0].modulos[2].completado = true;
    const completados = diplomados[0].modulos.filter(m => m.completado).length;
    diplomados[0].avance = Math.round((completados / diplomados[0].modulos.length) * 100);
    diplomados[0].completado = (diplomados[0].avance === 100);
  }

  const updatedStr = `DIPLOMADOS_LIST|${JSON.stringify(diplomados)}`;
  const { data: resUpdate, error: errUpdate } = await admin
    .from('profiles')
    .update({
      diplomados: updatedStr
    })
    .eq('id', p.id)
    .select();

  if (errUpdate) {
    console.error('❌ Error al actualizar:', errUpdate);
  } else {
    console.log('✅ ¡Perfil actualizado EXITOSAMENTE en Supabase!', resUpdate.length, 'filas afectadas');
  }
}

testUpdateProgress();
