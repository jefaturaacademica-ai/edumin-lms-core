import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function testQuery() {
  const { data: d1 } = await sb.from('banco_preguntas').select('codigo_diplomado, diplomado').eq('codigo_diplomado', 'CUR-68').limit(1);
  console.log('CUR-68:', d1);
  const { data: d2 } = await sb.from('banco_preguntas').select('codigo_diplomado, diplomado').eq('codigo_diplomado', 'TAL-02').limit(1);
  console.log('TAL-02:', d2);
  const { data: d3 } = await sb.from('banco_preguntas').select('codigo_diplomado, diplomado').eq('codigo_diplomado', 'CUR-76').limit(1);
  console.log('CUR-76:', d3);
}

testQuery();
