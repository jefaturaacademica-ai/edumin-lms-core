import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const codigos = [
  'CUR-07', 'CUR-18', 'CUR-19', 'CUR-20', 'CUR-21', 
  'CUR-23', 'CUR-26', 'CUR-32', 'CUR-36', 'CUR-39', 
  'CUR-42', 'CUR-47', 'CUR-48', 'CUR-53', 'CUR-55', 
  'CUR-57', 'CUR-60', 'CUR-61', 'CUR-67'
];

async function checkNewStats() {
  const { data } = await sb
    .from('banco_preguntas')
    .select('codigo_diplomado, opciones')
    .in('codigo_diplomado', codigos)
    .eq('dificultad', 'FACIL');

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

  console.log(`Auditoría en vivo de las 475 preguntas FÁCIL en Supabase:`);
  console.log(`Sesgo global nuevo: ${sesgoTotal} / ${totalPreguntas} (${((sesgoTotal/totalPreguntas)*100).toFixed(1)}%)`);
}

checkNewStats();
