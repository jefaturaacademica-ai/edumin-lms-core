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

async function compareTipos() {
  // 1. Antes (del backup)
  const backupFiles = fs.readdirSync('lib/data/backups').filter(f => f.startsWith('backup_facil_19'));
  const latestBackup = backupFiles.sort().pop();
  const backupData = JSON.parse(fs.readFileSync(path.join('lib/data/backups', latestBackup), 'utf8'));

  let antesChoice = 0;
  let antesSelect = 0;
  let antesMultiCorrect = 0; // preguntas donde opciones tienen > 1 isCorrect

  backupData.forEach(q => {
    if (q.tipo === 'multiple_select') antesSelect++;
    else antesChoice++;

    const numCorrect = (q.opciones || []).filter(o => o.isCorrect).length;
    if (numCorrect > 1) antesMultiCorrect++;
  });

  // 2. Ahora (en vivo de Supabase)
  const { data: ahoraData } = await sb
    .from('banco_preguntas')
    .select('tipo, opciones')
    .in('codigo_diplomado', codigos)
    .eq('dificultad', 'FACIL');

  let ahoraChoice = 0;
  let ahoraSelect = 0;
  let ahoraMultiCorrect = 0;

  ahoraData.forEach(q => {
    if (q.tipo === 'multiple_select') ahoraSelect++;
    else ahoraChoice++;

    const numCorrect = (q.opciones || []).filter(o => o.isCorrect).length;
    if (numCorrect > 1) ahoraMultiCorrect++;
  });

  console.log('=== COMPARACIÓN SIMPLE ===');
  console.log(`Total preguntas antes: ${backupData.length}`);
  console.log(`Total preguntas ahora: ${ahoraData.length}`);
  console.log('');
  console.log(`Tipo 'multiple_choice' (Opción Única):`);
  console.log(`  Antes: ${antesChoice} (${((antesChoice/backupData.length)*100).toFixed(1)}%)`);
  console.log(`  Ahora: ${ahoraChoice} (${((ahoraChoice/ahoraData.length)*100).toFixed(1)}%)`);
  console.log('');
  console.log(`Tipo 'multiple_select' (Selección Múltiple):`);
  console.log(`  Antes: ${antesSelect} (${((antesSelect/backupData.length)*100).toFixed(1)}%)`);
  console.log(`  Ahora: ${ahoraSelect} (${((ahoraSelect/ahoraData.length)*100).toFixed(1)}%)`);
  console.log('');
  console.log(`Preguntas con más de 1 respuesta correcta real:`);
  console.log(`  Antes: ${antesMultiCorrect} (${((antesMultiCorrect/backupData.length)*100).toFixed(1)}%)`);
  console.log(`  Ahora: ${ahoraMultiCorrect} (${((ahoraMultiCorrect/ahoraData.length)*100).toFixed(1)}%)`);
}

compareTipos();
