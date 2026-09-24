import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function check() {
  const { data, error } = await admin.from('pagos').select('*').limit(1);
  if (error) {
    console.error('Error:', error);
  } else if (data && data[0]) {
    console.log('COLUMNAS DE PAGOS:', Object.keys(data[0]));
    console.log('MUESTRA PAGO:', data[0]);
  } else {
    console.log('Tabla pagos vacía.');
  }
}

check();
