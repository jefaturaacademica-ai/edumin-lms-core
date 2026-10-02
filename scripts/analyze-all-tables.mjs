import { createClient } from '@supabase/supabase-js';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

const realTables = [
  'profiles',
  'pagos',
  'cursos',
  'matriculas_cursos',
  'audit_logs',
  'notas_modulos'
];

async function deepAudit() {
  console.log('================================================================');
  console.log('🔍 ANÁLISIS DETALLADO DE LAS 6 TABLAS REALES EN SUPABASE');
  console.log('================================================================\n');

  for (const table of realTables) {
    console.log(`================================================================`);
    console.log(`📌 TABLA: public.${table}`);
    console.log(`================================================================`);
    
    try {
      const { data, error, count } = await admin
        .from(table)
        .select('*', { count: 'exact' });

      if (error) {
        console.log(`❌ ERROR al consultar: ${error.message} (Código: ${error.code})`);
      } else {
        console.log(`📊 TOTAL REGISTROS: ${count}`);
        if (data && data.length > 0) {
          console.log(`📋 COLUMNAS (${Object.keys(data[0]).length}): ${Object.keys(data[0]).join(', ')}`);
          console.log(`\n📄 MOSTRANDO HASTA 3 REGISTROS DE MUESTRA:`);
          console.log(JSON.stringify(data.slice(0, 3), null, 2));
        } else {
          console.log(`ℹ️ La tabla está totalmente VACÍA (0 registros).`);
        }
      }
    } catch (e) {
      console.log(`💥 EXCEPCIÓN: ${e.message}`);
    }
    console.log('\n');
  }
}

deepAudit();
