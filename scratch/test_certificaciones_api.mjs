import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function testFetchCertificaciones() {
  console.log('🔍 Probando consulta directa a public.certificaciones en Supabase...');
  const { data, error } = await admin.from('certificaciones').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('❌ Error querying certificaciones:', error);
  } else {
    console.log(`✅ ¡Se encontraron ${data.length} registros en public.certificaciones!`);
    console.log('Muestra de los primeros 3 certificados:');
    data.slice(0, 3).forEach(c => {
      console.log(`- [${c.codigo_verificacion}] (${c.tipo}) ${c.estudiante_nombre} | ${c.programa_titulo} ${c.modulo_titulo ? '- ' + c.modulo_titulo : ''}`);
    });
  }
}

testFetchCertificaciones();
