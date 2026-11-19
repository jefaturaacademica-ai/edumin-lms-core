import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  for (const c of ['CUR-67', 'CUR-68', 'CUR-76', 'TAL-02']) {
    const { data } = await sb.from('banco_preguntas').select('id, dificultad').eq('codigo_diplomado', c);
    console.log(`${c}: total ${data.length}`, data.map(d => d.dificultad));
  }
}

check();
