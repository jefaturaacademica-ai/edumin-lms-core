import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const DIR_EXAMENES = 'G:\\Mi unidad\\CLASES Y RESÚMENES DIPLOMADOS 2026\\RESÚMENES DE DIPLOMADOS\\2. ESPECIALISTA EN COMERCIO INTERNACIONAL GESTIÓN ADUANERA Y LOGÍSTICA (03 MÓDULOS)\\EXÁMENES';

// Función para transformar notación científica/matemática a texto natural
function limpiarLatex(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  return texto
    .replace(/\\text\{--\}/g, ' – ')
    .replace(/\\text\{-\}/g, '-')
    .replace(/\s*\\,\s*\^\\circ\s*\\text\{C\}/g, ' °C')
    .replace(/\s*\^\\circ\s*\\text\{C\}/g, ' °C')
    .replace(/\^\\circ/g, '°')
    .replace(/\\%/g, '%')
    .replace(/\^\{\\circ\}/g, '°')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mu/g, 'µ')
    .replace(/\\[,;]/g, ' ')
    .replace(/\\quad/g, ' ')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([°%])/g, '$1')
    .trim();
}

async function procesarComercioInternacional() {
  console.log('=== IMPORTANDO BANCO: COMERCIO INTERNACIONAL (DIP-02) ===');

  if (!fs.existsSync(DIR_EXAMENES)) {
    console.error('No se encontró el directorio:', DIR_EXAMENES);
    return;
  }

  const files = fs.readdirSync(DIR_EXAMENES).filter(f => f.endsWith('.json'));
  console.log(`Archivos encontrados (${files.length}):`, files);

  const todasLasPreguntas = [];

  for (const file of files) {
    const filePath = path.join(DIR_EXAMENES, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Detectar Módulo
    let modulo = 'Módulo 01';
    if (file.includes('MÓDULO 02') || file.includes('MODULO 02')) modulo = 'Módulo 02';
    else if (file.includes('MÓDULO 03') || file.includes('MODULO 03')) modulo = 'Módulo 03';

    // Detectar Dificultad
    let dificultad = 'MEDIO';
    if (file.toUpperCase().includes('NIVEL ALTO') || file.toUpperCase().includes('ALTO')) {
      dificultad = 'ALTO';
    } else if (file.toUpperCase().includes('NIVEL FACIL') || file.toUpperCase().includes('FÁCIL')) {
      dificultad = 'FACIL';
    }

    const quizList = content.quiz || [];
    console.log(`-> Procesando ${file}: ${quizList.length} preguntas (${modulo} - ${dificultad})`);

    for (const q of quizList) {
      const tipo = q.type === 'multiple_select' ? 'multiple_select' : 'multiple_choice';

      const opcionesLimpias = (q.answerOptions || []).map(opt => ({
        text: limpiarLatex(opt.text || ''),
        isCorrect: Boolean(opt.isCorrect),
        rationale: limpiarLatex(opt.rationale || '')
      }));

      const item = {
        codigo_diplomado: 'DIP-02',
        diplomado: 'ESPECIALISTA EN COMERCIO INTERNACIONAL GESTIÓN ADUANERA Y LOGÍSTICA',
        modulo: modulo,
        dificultad: dificultad,
        tipo: tipo,
        pregunta: limpiarLatex(q.question || ''),
        opciones: opcionesLimpias,
        hint: q.hint ? limpiarLatex(q.hint) : null,
        activo: true
      };

      todasLasPreguntas.push(item);
    }
  }

  console.log(`\nTotal preguntas procesadas: ${todasLasPreguntas.length}`);

  // Backup local en lib/data/banco_preguntas_comercio_internacional.json
  const dataDir = path.resolve('lib/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const backupPath = path.join(dataDir, 'banco_preguntas_comercio_internacional.json');
  fs.writeFileSync(backupPath, JSON.stringify(todasLasPreguntas, null, 2), 'utf8');
  console.log(`Backup local guardado en: ${backupPath}`);

  // Subir por lotes a Supabase
  console.log('\nSubiendo preguntas a Supabase public.banco_preguntas...');
  let subidas = 0;
  const batchSize = 25;

  for (let i = 0; i < todasLasPreguntas.length; i += batchSize) {
    const batch = todasLasPreguntas.slice(i, i + batchSize);
    const { error } = await sb.from('banco_preguntas').insert(batch);
    if (error) {
      console.error(`Error en lote ${i}-${i + batchSize}:`, error.message);
    } else {
      subidas += batch.length;
    }
  }

  console.log(`\n🎉 ¡ÉXITO TOTAL! Se insertaron ${subidas} preguntas de COMERCIO INTERNACIONAL en Supabase.`);
}

procesarComercioInternacional().catch(console.error);
