import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function inspectFiorella() {
  console.log('=== BUSCANDO FIORELLA BEATRIZ / DNI 74567890 O SIMILARES ===');
  const { data: profiles, error } = await admin
    .from('profiles')
    .select('*')
    .or('dni_ce.eq.74567890,nombres.ilike.%Fiorella%');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Perfiles encontrados:', JSON.stringify(profiles, null, 2));
  }
}

inspectFiorella();
