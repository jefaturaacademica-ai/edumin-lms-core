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

const DIR_PREGUNTAS = 'G:\\Mi unidad\\CLASES Y RESÚMENES DIPLOMADOS 2026\\RESÚMENES DE DIPLOMADOS\\CARPETA DE ADICIONALES\\TRANSCRIPCIONES VIDEOS CURSOS\\MARKDOWN RESUMEN Y EXÁMENES\\PREGUNTAS';

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

const CURSOS_CONFIG = [
  {
    codigo: 'CUR-01',
    titulo: 'MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783',
    archivos: [
      { file: 'CURSO 01 - EXAMEN NIVEL MEDIO.json', dificultad: 'MEDIO' },
      { file: 'CURSO 01 - EXAMEN NIVEL FÁCIL.json', dificultad: 'FACIL' }
    ],
    backupFile: 'banco_preguntas_curso_01.json'
  },
  {
    codigo: 'CUR-02',
    titulo: 'IMPLEMENTACIÓN DE MEDIDAS DE CONTROL EN RIESGOS MINEROS',
    archivos: [
      { file: 'CURSO 02 - EXAMEN NIVEL MEDIO.json', dificultad: 'MEDIO' },
      { file: 'CURSO 02 - EXAMEN NIVEL FÁCIL.json', dificultad: 'FACIL' }
    ],
    backupFile: 'banco_preguntas_curso_02.json'
  },
  {
    codigo: 'CUR-03',
    titulo: 'ERGONOMÍA Y SALUD OCUPACIONAL EN EL SECTOR MINERO E INDUSTRIAL',
    archivos: [
      { file: 'CURSO 03 - EXAMEN NIVEL MEDIO.json', dificultad: 'MEDIO' },
      { file: 'CURSO 03 - EXAMEN NIVEL FÁCIL.json', dificultad: 'FACIL' }
    ],
    backupFile: 'banco_preguntas_curso_03.json'
  }
];

async function importarCursos() {
  console.log('=== IMPORTANDO PREGUNTAS DE LOS 3 PRIMEROS CURSOS ===\n');

  const dataDir = path.resolve('lib/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  for (const curso of CURSOS_CONFIG) {
    console.log(`\n--------------------------------------------------`);
    console.log(`Procesando ${curso.codigo}: ${curso.titulo}`);
    const preguntasCurso = [];

    for (const item of curso.archivos) {
      const filePath = path.join(DIR_PREGUNTAS, item.file);
      if (!fs.existsSync(filePath)) {
        console.error(`⚠️ Archivo no encontrado: ${filePath}`);
        continue;
      }

      const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const quiz = content.quiz || [];
      console.log(`  -> ${item.file}: ${quiz.length} preguntas detectadas (Dificultad: ${item.dificultad})`);

      quiz.forEach((q, idx) => {
        const tipo = q.type === 'multiple_select' ? 'multiple_select' : 'multiple_choice';
        const opciones = (q.answerOptions || []).map(opt => ({
          text: limpiarLatex(opt.text || ''),
          isCorrect: Boolean(opt.isCorrect),
          rationale: limpiarLatex(opt.rationale || '')
        }));

        preguntasCurso.push({
          codigo_diplomado: curso.codigo,
          diplomado: curso.titulo,
          modulo: 'Examen del Curso',
          dificultad: item.dificultad,
          tipo: tipo,
          pregunta: limpiarLatex((q.question || '').trim()),
          opciones: opciones,
          hint: q.hint ? limpiarLatex(q.hint) : null,
          activo: true
        });
      });
    }

    console.log(`  Total preguntas para ${curso.codigo}: ${preguntasCurso.length}`);

    // Guardar backup local
    const backupPath = path.join(dataDir, curso.backupFile);
    fs.writeFileSync(backupPath, JSON.stringify(preguntasCurso, null, 2), 'utf8');
    console.log(`  ✅ Backup local guardado en: lib/data/${curso.backupFile}`);

    // Limpiar registros previos en Supabase para evitar duplicados
    console.log(`  Limpiando registros previos en Supabase para ${curso.codigo}...`);
    const { error: delError } = await sb
      .from('banco_preguntas')
      .delete()
      .eq('codigo_diplomado', curso.codigo);

    if (delError) {
      console.error(`  ❌ Error limpiando registros previos: ${delError.message}`);
    }

    // Insertar preguntas en lotes de 25
    let insertadas = 0;
    const batchSize = 25;
    for (let i = 0; i < preguntasCurso.length; i += batchSize) {
      const batch = preguntasCurso.slice(i, i + batchSize);
      const { error: insError } = await sb.from('banco_preguntas').insert(batch);
      if (insError) {
        console.error(`  ❌ Error al insertar lote ${i}-${i + batchSize}: ${insError.message}`);
      } else {
        insertadas += batch.length;
      }
    }
    console.log(`  ✅ Supabase: ${insertadas} / ${preguntasCurso.length} preguntas insertadas.`);

    // Crear/actualizar configuración en examenes_modulos si la tabla existe
    try {
      const configExamen = {
        codigo_diplomado: curso.codigo,
        modulo: 'Examen del Curso',
        titulo: `Evaluación Final - ${curso.titulo}`,
        cantidad_preguntas: 10,
        tiempo_minutos: 30,
        nota_aprobatoria: 12.00,
        puntaje_maximo: 20.00,
        intentos_permitidos: 1,
        activo: true
      };
      const { error: confErr } = await sb
        .from('examenes_modulos')
        .upsert([configExamen], { onConflict: 'codigo_diplomado, modulo' });
      if (!confErr) {
        console.log(`  ✅ Configuración modular de examen registrada en examenes_modulos.`);
      }
    } catch (e) {
      // Ignorar si no existe tabla
    }
  }

  console.log('\n==================================================');
  console.log('🎉 PROCESO DE IMPORTACIÓN COMPLETADO CON ÉXITO');
}

importarCursos();
