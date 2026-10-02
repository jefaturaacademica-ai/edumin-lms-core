import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function discoverTables() {
  console.log('--- Descubriendo todas las tablas en public via RPC o introspección ---');
  
  // Intentar usar Postgres meta REST API endpoint si está disponible
  try {
    const res = await fetch(`${url}/rest/v1/`, {
      headers: {
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`
      }
    });
    const schemaDoc = await res.json();
    if (schemaDoc && schemaDoc.definitions) {
      console.log('📋 Tablas detectadas en el OpenAPI Schema de Supabase:');
      const tableNames = Object.keys(schemaDoc.definitions);
      console.log(tableNames);
      return tableNames;
    } else {
      console.log('Respuesta REST API root:', schemaDoc);
    }
  } catch (e) {
    console.error('Error fetching schema doc:', e.message);
  }
}

discoverTables();
