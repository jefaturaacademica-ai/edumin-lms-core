import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno de .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const subindicesMap = {
  '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
  '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉',
  '+': '₊', '-': '₋'
};

const superindicesMap = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
  '+': '⁺', '-': '⁻'
};

function limpiarLatex(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  return texto
    .replace(/(\d+)\{,\}(\d+)/g, '$1,$2')
    .replace(/\bM_w\b/gi, 'Mw')
    .replace(/\\text\{--\}/g, ' – ')
    .replace(/\\text\{-\}/g, '-')
    .replace(/\s*\\,\s*\^\\circ\s*\\text\{C\}/g, ' °C')
    .replace(/\s*\^\\circ\s*\\text\{C\}/g, ' °C')
    .replace(/\^\{\\circ\}/g, '°')
    .replace(/\^\\circ/g, '°')
    .replace(/\\%/g, '%')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\^\{([0-9\+\-]+)\}/g, (_, p1) => p1.split('').map(c => superindicesMap[c] || c).join(''))
    .replace(/\^([0-9\+\-])/g, (_, p1) => superindicesMap[p1] || p1)
    .replace(/_\{([0-9\+\-]+)\}/g, (_, p1) => p1.split('').map(c => subindicesMap[c] || c).join(''))
    .replace(/_([0-9])/g, (_, p1) => subindicesMap[p1] || p1)
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\\mu/g, 'µ')
    .replace(/\\alpha/g, 'α')
    .replace(/\\beta/g, 'β')
    .replace(/\\gamma/g, 'γ')
    .replace(/\\Delta/g, 'Δ')
    .replace(/\\[,;]/g, ' ')
    .replace(/\\quad/g, ' ')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/\s+([°%])/g, '$1')
    .trim();
}

function detectarModulo(fileName) {
  const upper = fileName.toUpperCase();
  if (upper.includes('MÓDULO 05') || upper.includes('MODULO 05')) return 'Módulo 05';
  if (upper.includes('MÓDULO 04') || upper.includes('MODULO 04')) return 'Módulo 04';
  if (upper.includes('MÓDULO 03') || upper.includes('MODULO 03')) return 'Módulo 03';
  if (upper.includes('MÓDULO 02') || upper.includes('MODULO 02')) return 'Módulo 02';
  return 'Módulo 01';
}

function detectarDificultad(fileName) {
  const upper = fileName.toUpperCase();
  if (upper.includes('NIVEL ALTO') || upper.includes('ALTO')) return 'ALTO';
  if (upper.includes('NIVEL FACIL') || upper.includes('FÁCIL')) return 'FACIL';
  return 'MEDIO';
}

const DIPLOMADOS_A_IMPORTAR = [
  {
    prefijoCarpeta: '5. GEOMEC',
    codigo_diplomado: 'DIP-04',
    diplomado: 'GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL',
    backupFile: 'banco_preguntas_geomecanica.json'
  },
  {
    prefijoCarpeta: '4. GEOMETALURGIA',
    codigo_diplomado: 'DIP-05',
    diplomado: 'GEOMETALURGIA',
    backupFile: 'banco_preguntas_geometalurgia.json'
  },
  {
    prefijoCarpeta: '6. GEOTECNIA',
    codigo_diplomado: 'DIP-06',
    diplomado: 'GEOTECNIA MINERA',
    backupFile: 'banco_preguntas_geotecnia_minera.json'
  },
  {
    prefijoCarpeta: '7. GERENCIA DE SISTEMAS',
    codigo_diplomado: 'DIP-07',
    diplomado: 'GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ',
    backupFile: 'banco_preguntas_sistemas_integrados_hseq.json'
  },
  {
    prefijoCarpeta: '8. GERENCIA ESTRAT',
    codigo_diplomado: 'DIP-08',
    diplomado: 'GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA',
    backupFile: 'banco_preguntas_gerencia_estrategica_liderazgo.json'
  },
  {
    prefijoCarpeta: '9. GESTI',
    codigo_diplomado: 'DIP-09',
    diplomado: 'GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL',
    backupFile: 'banco_preguntas_gestion_ambiental.json'
  }
];

async function ejecutarImportacion() {
  const root = 'G:\\Mi unidad';
  const mainFolder = fs.readdirSync(root).find(d => d.includes('2026'));
  const subRoot = path.join(root, mainFolder);
  const resFolder = fs.readdirSync(subRoot).find(d => d.includes('DIPLOMADOS'));
  const baseDir = path.join(subRoot, resFolder);

  const allDirs = fs.readdirSync(baseDir);
  const dataDir = path.resolve('lib/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  for (const config of DIPLOMADOS_A_IMPORTAR) {
    console.log(`\n================================================================`);
    console.log(`PROCESANDO ${config.codigo_diplomado}: ${config.diplomado}`);
    console.log(`================================================================`);

    const folderName = allDirs.find(d => d.toUpperCase().startsWith(config.prefijoCarpeta));
    if (!folderName) {
      console.error(`No se encontró carpeta para prefijo: ${config.prefijoCarpeta}`);
      continue;
    }

    const dipPath = path.join(baseDir, folderName);
    const exFolderName = fs.readdirSync(dipPath).find(c => c.toUpperCase().includes('EX'));
    if (!exFolderName) {
      console.error(`No se encontró subcarpeta EXÁMENES en: ${dipPath}`);
      continue;
    }

    const exDir = path.join(dipPath, exFolderName);
    const files = fs.readdirSync(exDir).filter(f => f.endsWith('.json')).sort();
    console.log(`Carpeta: ${folderName} -> ${files.length} archivos JSON encontrados`);

    const preguntasDiplomado = [];

    for (const file of files) {
      const filePath = path.join(exDir, file);
      const rawContent = fs.readFileSync(filePath, 'utf8');
      const content = JSON.parse(rawContent);
      const quizList = Array.isArray(content) ? content : (content.quiz || []);

      const modulo = detectarModulo(file);
      const dificultad = detectarDificultad(file);

      console.log(`  -> ${file}: ${quizList.length} preguntas (${modulo} | ${dificultad})`);

      for (const q of quizList) {
        const tipo = q.type === 'multiple_select' ? 'multiple_select' : 'multiple_choice';
        const opcionesLimpias = (q.answerOptions || []).map(opt => ({
          text: limpiarLatex(opt.text || ''),
          isCorrect: Boolean(opt.isCorrect),
          rationale: limpiarLatex(opt.rationale || '')
        }));

        preguntasDiplomado.push({
          codigo_diplomado: config.codigo_diplomado,
          diplomado: config.diplomado,
          modulo,
          dificultad,
          tipo,
          pregunta: limpiarLatex(q.question || ''),
          opciones: opcionesLimpias,
          hint: q.hint ? limpiarLatex(q.hint) : null,
          activo: true
        });
      }
    }

    // Guardar backup local
    const backupPath = path.join(dataDir, config.backupFile);
    fs.writeFileSync(backupPath, JSON.stringify(preguntasDiplomado, null, 2), 'utf8');
    console.log(`Backup local guardado: lib/data/${config.backupFile} (${preguntasDiplomado.length} preguntas)`);

    // Limpiar registros previos de este diplomado en Supabase para evitar duplicados (como el lote previo de DIP-05)
    const { error: delError } = await sb
      .from('banco_preguntas')
      .delete()
      .eq('codigo_diplomado', config.codigo_diplomado);

    if (delError) {
      console.error(`Error limpiando registros previos de ${config.codigo_diplomado}:`, delError.message);
    }

    // Insertar en lotes de 25
    let insertadas = 0;
    const batchSize = 25;
    for (let i = 0; i < preguntasDiplomado.length; i += batchSize) {
      const batch = preguntasDiplomado.slice(i, i + batchSize);
      const { error: insError } = await sb.from('banco_preguntas').insert(batch);
      if (insError) {
        console.error(`Error insertando lote ${i}-${i + batchSize} de ${config.codigo_diplomado}:`, insError.message);
      } else {
        insertadas += batch.length;
      }
    }

    console.log(`✅ ${config.codigo_diplomado} completado: ${insertadas} / ${preguntasDiplomado.length} preguntas insertadas en Supabase.`);
  }
}

ejecutarImportacion().catch(console.error);
