import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function inspectProfile() {
  const { data: p } = await admin.from('profiles').select('*').eq('dni_ce', '71234567').maybeSingle();
  if (!p) {
    console.log('No profile found for 71234567');
    return;
  }
  console.log('--- PERFIL EN SUPABASE (71234567) ---');
  console.log('ID:', p.id);
  console.log('nombres:', p.nombres, p.apellidos);
  console.log('avance_porcentaje:', p.avance_porcentaje);
  console.log('diplomado_1:', p.diplomado_1?.substring(0, 150));
  console.log('diplomados:', p.diplomados?.substring(0, 150));
  console.log('cursos:', p.cursos?.substring(0, 150));
}

inspectProfile();
