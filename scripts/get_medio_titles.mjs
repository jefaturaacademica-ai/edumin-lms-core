import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const codigos = [
  'CUR-68', 'CUR-67', 'CUR-58', 'CUR-54', 'CUR-18', 
  'CUR-07', 'CUR-36', 'CUR-57', 'CUR-17', 'CUR-43', 
  'CUR-04', 'CUR-09', 'CUR-66', 'CUR-23', 'CUR-47', 
  'CUR-61', 'CUR-48', 'CUR-01', 'CUR-76', 'CUR-06', 
  'TAL-02', 'CUR-56', 'CUR-63', 'CUR-25'
];

async function checkMedioTitles() {
  const { data, error } = await sb
    .from('banco_preguntas')
    .select('codigo_diplomado, diplomado')
    .in('codigo_diplomado', codigos);

  const map = {};
  data.forEach(r => {
    map[r.codigo_diplomado] = r.diplomado;
  });

  console.log(JSON.stringify(map, null, 2));
}

checkMedioTitles();
