import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const sb = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function searchLinks() {
  console.log('--- 1. Searching lecciones ---');
  const { data: lecc } = await sb.from('lecciones').select('*');
  lecc.forEach(r => {
    // Check any field with non-empty string that is not the defaults
    const nonNulls = Object.entries(r).filter(([k, v]) => {
      if (['id', 'CodigoDiplomado', 'Diplomado', 'Modulo', 'NombreModulo', 'Docente', 'Tema', 'Sesion', 'orden', 'created_at', 'updated_at'].includes(k)) return false;
      return v !== null && v !== '';
    });
    if (nonNulls.length > 0) {
      console.log(r.CodigoDiplomado, r.Diplomado, r.Modulo, r.Sesion, nonNulls);
    }
  });

  console.log('\n--- 2. Searching cursos table ---');
  const { data: cur } = await sb.from('diplomados_y_cursos').select('*');
  cur.forEach(c => {
    const raw = JSON.stringify(c);
    if (raw.includes('drive.google.com/file/d/') || raw.includes('material') || raw.includes('Resumen')) {
      // Find where
      if (Array.isArray(c.modulos)) {
        c.modulos.forEach((m, mIdx) => {
          (m.clases || []).forEach((cl, clIdx) => {
            if (typeof cl === 'object' && cl !== null) {
              const keysWithVal = Object.entries(cl).filter(([k, v]) => v && typeof v === 'string' && v.startsWith('http'));
              if (keysWithVal.length > 1) { // more than just videoUrl
                console.log('Curso', c.id, c.titulo, 'Mod', mIdx, 'Clase', clIdx, keysWithVal);
              }
            }
          });
        });
      }
    }
  });

  console.log('\n--- 3. Searching perfiles table (estudiante) ---');
  const { data: perfiles } = await sb.from('perfiles').select('email, diplomados').limit(5);
  perfiles.forEach(p => {
    const raw = JSON.stringify(p.diplomados || '');
    if (raw.includes('http')) {
      console.log('Perfil', p.email, 'has links in diplomados');
    }
  });
}
searchLinks();
