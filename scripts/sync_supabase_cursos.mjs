import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wluuomwkxywpfotbngwf.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';

const admin = createClient(url, serviceRoleKey);

async function main() {
  console.log('--- SINCRONIZANDO DIPLOMADOS Y CURSOS EN PUBLIC.CURSOS DESDE DIPLOMADOS_TODOS.JSON ---');

  const jsonPath = path.join(__dirname, '..', 'lib', 'data', 'diplomados_todos.json');
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(rawData);

  const diplomados = parsed.diplomados || [];
  console.log(`Encontrados ${diplomados.length} diplomados en diplomados_todos.json`);

  for (let i = 0; i < diplomados.length; i++) {
    const d = diplomados[i];
    const numId = i + 1;
    const numStr = String(numId).padStart(2, '0');
    const id = `dip-${numStr}`;
    const codigo = `DIP-${numStr}`;
    const titulo = d.diplomado;

    console.log(`Actualizando ${id}: ${titulo} con ${d.modulos ? d.modulos.length : 0} módulos...`);

    const recordData = {
      id,
      codigo,
      titulo,
      tipo: 'diplomado',
      categoria: 'MINERÍA Y GESTIÓN',
      duracion: '120 horas lectivas',
      nivel: 'Especializado',
      version: 'Versión 1',
      ano: 2026,
      imagen: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=800&q=80',
      docente: d.modulos?.[0]?.docente || 'Docente EDUMIN',
      precio: 150,
      modulos: d.modulos || [],
      num_modulos: d.modulos ? d.modulos.length : 0
    };

    const { error } = await admin
      .from('cursos')
      .upsert(recordData, { onConflict: 'id' });

    if (error) {
      console.error(`Error al upsert ${id}:`, error.message);
    } else {
      console.log(`✅ ¡Sincronizado con éxito ${id}!`);
    }
  }

  console.log('--- SINCRONIZACIÓN COMPLETA ---');
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
