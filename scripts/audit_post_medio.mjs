import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const codigos = [
  'CUR-01', 'CUR-04', 'CUR-06', 'CUR-07', 'CUR-09',
  'CUR-17', 'CUR-18', 'CUR-23', 'CUR-25', 'CUR-36',
  'CUR-43', 'CUR-47', 'CUR-48', 'CUR-54', 'CUR-56',
  'CUR-57', 'CUR-58', 'CUR-61', 'CUR-63', 'CUR-66',
  'CUR-67', 'CUR-68', 'CUR-76', 'TAL-02'
];

async function checkNewStatsMedio() {
  const { data } = await sb
    .from('banco_preguntas')
    .select('codigo_diplomado, opciones')
    .in('codigo_diplomado', codigos)
    .eq('dificultad', 'MEDIO');

  let totalPreguntas = data.length;
  let sesgoTotal = 0;

  data.forEach(q => {
    let maxLen = -1;
    let maxIdx = -1;
    let correctIdx = -1;
    (q.opciones || []).forEach((opt, idx) => {
      const len = (opt.text || '').trim().length;
      if (len > maxLen) {
        maxLen = len;
        maxIdx = idx;
      }
      if (opt.isCorrect) correctIdx = idx;
    });
    if (correctIdx === maxIdx) sesgoTotal++;
  });

  console.log(`Auditoría en vivo de las ${totalPreguntas} preguntas MEDIO en Supabase:`);
  console.log(`Sesgo global nuevo: ${sesgoTotal} / ${totalPreguntas} (${((sesgoTotal/totalPreguntas)*100).toFixed(1)}%)`);
}

checkNewStatsMedio();
