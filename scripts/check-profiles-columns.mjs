import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function testJsonColumns() {
  console.log('=== VERIFICANDO COLUMNAS DIPLOMADOS Y CURSOS EN PROFILES ===');

  const { data: profiles } = await admin.from('profiles').select('*').limit(1);
  if (profiles && profiles[0]) {
    console.log('Columnas actuales de profiles:', Object.keys(profiles[0]));
    
    // Probar si existen las columnas 'diplomados' y 'cursos'
    const hasDiplomados = 'diplomados' in profiles[0];
    const hasCursos = 'cursos' in profiles[0];
    
    console.log('Existe columna diplomados:', hasDiplomados);
    console.log('Existe columna cursos:', hasCursos);
  }
}

testJsonColumns();
