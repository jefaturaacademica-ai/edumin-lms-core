import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function inspectFull() {
  const { data: p } = await admin.from('profiles').select('*').eq('dni_ce', '71234567').maybeSingle();
  console.log('--- DIPLOMADOS JSON ---');
  if (p.diplomados) {
    const raw = p.diplomados.replace('DIPLOMADOS_LIST|', '');
    console.log(JSON.stringify(JSON.parse(raw), null, 2));
  }
  console.log('--- CURSOS JSON ---');
  if (p.cursos) {
    const raw = p.cursos.replace('CURSOS_LIST|', '');
    console.log(JSON.stringify(JSON.parse(raw), null, 2));
  }
}

inspectFull();
