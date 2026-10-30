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
  if (upper.includes('MÓDULO 05') || upper.includes('MODULO 05') || upper.includes('MODULO 5') || upper.includes('MÓDULO 5')) return 'Módulo 05';
  if (upper.includes('MÓDULO 04') || upper.includes('MODULO 04') || upper.includes('MODULO 4') || upper.includes('MÓDULO 4')) return 'Módulo 04';
  if (upper.includes('MÓDULO 03') || upper.includes('MODULO 03') || upper.includes('MODULO 3') || upper.includes('MÓDULO 3')) return 'Módulo 03';
  if (upper.includes('MÓDULO 02') || upper.includes('MODULO 02') || upper.includes('MODULO 2') || upper.includes('MÓDULO 2')) return 'Módulo 02';
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
    num: 11,
    codigo_diplomado: 'DIP-11',
    diplomado: 'GESTIÓN DE OPERACIONES INDUSTRIALES',
    backupFile: 'banco_preguntas_gestion_operaciones_industriales.json'
  },
  {
    num: 12,
    codigo_diplomado: 'DIP-12',
    diplomado: 'GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO',
    backupFile: 'banco_preguntas_gestion_estrategica_empresas.json'
  },
  {
    num: 13,
    codigo_diplomado: 'DIP-13',
    diplomado: 'GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES',
    backupFile: 'banco_preguntas_gestion_logistica_compras_inventarios.json'
  },
  {
    num: 14,
    codigo_diplomado: 'DIP-14',
    diplomado: 'GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA',
    backupFile: 'banco_preguntas_gestion_logistica_almacenes_mineria.json'
  },
  {
    num: 15,
    codigo_diplomado: 'DIP-15',
    diplomado: 'GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA',
    backupFile: 'banco_preguntas_gestion_logistica_proveedores_industria_mineria.json'
  },
  {
    num: 16,
    codigo_diplomado: 'DIP-16',
    diplomado: 'GESTIÓN MINERA',
    backupFile: 'banco_preguntas_gestion_minera.json'
  },
  {
    num: 17,
    codigo_diplomado: 'DIP-17',
    diplomado: 'LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS',
    backupFile: 'banco_preguntas_legislacion_laboral_planillas.json'
  },
  {
    num: 18,
    codigo_diplomado: 'DIP-18',
    diplomado: 'MINERÍA 4.0 Y DIGITALIZACIÓN MINERA',
    backupFile: 'banco_preguntas_mineria_4_0.json'
  },
  {
    num: 19,
    codigo_diplomado: 'DIP-19',
    diplomado: 'PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL MINERA',
    backupFile: 'banco_preguntas_prevencion_conflictividad_social.json'
  },
  {
    num: 20,
    codigo_diplomado: 'DIP-20',
    diplomado: 'SEGURIDAD INDUSTRIAL',
    backupFile: 'banco_preguntas_seguridad_industrial.json'
  },
  {
    num: 21,
    codigo_diplomado: 'DIP-21',
    diplomado: 'SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA',
    backupFile: 'banco_preguntas_seguridad_salud_ocupacional.json'
  },
  {
    num: 22,
    codigo_diplomado: 'DIP-22',
    diplomado: 'SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA',
    backupFile: 'banco_preguntas_supply_chain_management.json'
  }
];

async function ejecutarImportacion() {
  const baseDir = 'G:\\Mi unidad\\CLASES Y RESÚMENES DIPLOMADOS 2026\\RESÚMENES DE DIPLOMADOS';

  if (!fs.existsSync(baseDir)) {
    console.error('No se pudo encontrar la ruta base:', baseDir);
    process.exit(1);
  }

  const allDirs = fs.readdirSync(baseDir);
  const dataDir = path.resolve('lib/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const resultadosTotales = [];

  for (const config of DIPLOMADOS_A_IMPORTAR) {
    console.log(`\n================================================================`);
    console.log(`PROCESANDO [${config.codigo_diplomado}] (Num ${config.num}): ${config.diplomado}`);
    console.log(`================================================================`);

    const folderName = allDirs.find(d => d.startsWith(`${config.num}.`) || d.startsWith(`${config.num} `));
    if (!folderName) {
      console.error(`❌ No se encontró carpeta para número: ${config.num}`);
      continue;
    }

    const dipPath = path.join(baseDir, folderName);
    const exFolderName = fs.readdirSync(dipPath).find(c => c.toUpperCase().includes('EX'));
    if (!exFolderName) {
      console.error(`❌ No se encontró subcarpeta EXÁMENES en: ${dipPath}`);
      continue;
    }

    const exDir = path.join(dipPath, exFolderName);
    const files = fs.readdirSync(exDir).filter(f => f.endsWith('.json')).sort();
    console.log(`📁 Carpeta: "${folderName}" -> ${files.length} archivos JSON`);

    const preguntasDiplomado = [];

    for (const file of files) {
      const filePath = path.join(exDir, file);
      const rawContent = fs.readFileSync(filePath, 'utf8');
      let content;
      try {
        content = JSON.parse(rawContent);
      } catch (parseErr) {
        console.error(`Error parseando JSON ${file}:`, parseErr.message);
        continue;
      }

      const quizList = Array.isArray(content) ? content : (content.quiz || []);
      const modulo = detectarModulo(file);
      const dificultad = detectarDificultad(file);

      console.log(`   📄 ${file} -> ${quizList.length} preguntas (${modulo} | ${dificultad})`);

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

    // 1. Guardar backup local
    const backupPath = path.join(dataDir, config.backupFile);
    fs.writeFileSync(backupPath, JSON.stringify(preguntasDiplomado, null, 2), 'utf8');
    console.log(`💾 Backup local guardado: lib/data/${config.backupFile} (${preguntasDiplomado.length} preguntas)`);

    // 2. Limpiar registros previos de este diplomado en Supabase para evitar duplicados
    const { error: delError } = await sb
      .from('banco_preguntas')
      .delete()
      .eq('codigo_diplomado', config.codigo_diplomado);

    if (delError) {
      console.error(`⚠️ Error limpiando registros previos de ${config.codigo_diplomado}:`, delError.message);
    }

    // 3. Insertar en lotes de 25
    let insertadas = 0;
    const batchSize = 25;
    for (let i = 0; i < preguntasDiplomado.length; i += batchSize) {
      const batch = preguntasDiplomado.slice(i, i + batchSize);
      const { error: insError } = await sb.from('banco_preguntas').insert(batch);
      if (insError) {
        console.error(`❌ Error insertando lote ${i}-${i + batchSize} de ${config.codigo_diplomado}:`, insError.message);
      } else {
        insertadas += batch.length;
      }
    }

    console.log(`✅ ${config.codigo_diplomado} completado: ${insertadas} / ${preguntasDiplomado.length} preguntas insertadas en Supabase.`);
    resultadosTotales.push({
      codigo: config.codigo_diplomado,
      nombre: config.diplomado,
      preguntas: insertadas,
      archivos: files.length
    });
  }

  console.log(`\n================================================================`);
  console.log(`RESUMEN FINAL DE IMPORTACIÓN (DIP-11 al DIP-22)`);
  console.log(`================================================================`);
  console.table(resultadosTotales);
}

ejecutarImportacion().catch(err => {
  console.error('Error fatal durante la importación:', err);
  process.exit(1);
});
