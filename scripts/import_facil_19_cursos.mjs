import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// 1. Cargar variables de entorno
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
const DIR_JSON = 'D:/Descargas/JSON';

const CURSOS_CONFIG = [
  { codigo: 'CUR-07', titulo: 'LOGÍSTICA Y DISTRIBUCIÓN EN LA INDUSTRIA Y MINERÍA', file: '7.json' },
  { codigo: 'CUR-18', titulo: 'GESTIÓN DE INVENTARIOS EN INDUSTRIA Y MINERÍA', file: '18.json' },
  { codigo: 'CUR-19', titulo: 'CONTROL FINANCIERO EN ALMACENES', file: '19.json' },
  { codigo: 'CUR-20', titulo: 'LOGÍSTICA INTERNA EN CONTROL DE ALMACENES', file: '20.json' },
  { codigo: 'CUR-21', titulo: 'FUNDAMENTOS DE BIG DATA', file: '21.json' },
  { codigo: 'CUR-23', titulo: 'TENDENCIAS 2025-2026: CLAVES DE BIG DATA', file: 'curso 23.json' },
  { codigo: 'CUR-26', titulo: 'INNOVACIÓN EN MINERÍA: APLICACIONES DE INTELIGENCIA ARTIFICIAL', file: '26.json' },
  { codigo: 'CUR-32', titulo: 'ECOSISTEMA BIG DATA: HERRAMIENTAS Y TECNOLOGÍAS ESENCIALES', file: '32.json' },
  { codigo: 'CUR-36', titulo: 'TIPOS DE INTELIGENCIA ARTIFICIAL APLICADAS A LA MINERÍA', file: '36.json' },
  { codigo: 'CUR-39', titulo: 'BIG DATA APLICADA A PROCESOS INDUSTRIALES', file: '39.json' },
  { codigo: 'CUR-42', titulo: 'IMPLEMENTACIÓN DE LA NORMA ISO 9001:2015', file: '42.json' },
  { codigo: 'CUR-47', titulo: 'PIRÁMIDE DE PROCESOS: TÉCNICAS DE CONTROL EN MINERÍA', file: 'curso 47.json' },
  { codigo: 'CUR-48', titulo: 'PROCESO DE OPTIMIZACIÓN DEL MANTENIMIENTO A PARTIR DEL USO DE TÉCNICAS DE LA INDUSTRIA 4.0', file: '48.json' },
  { codigo: 'CUR-53', titulo: 'PLANIFICACIÓN DE RIESGOS PARA IMPORTACIÓN Y EXPORTACIÓN', file: '53.json' },
  { codigo: 'CUR-55', titulo: 'MONITOREO Y CONTROL EN LA OPERACIÓN DE PLANTAS MINERAS', file: '55.json' },
  { codigo: 'CUR-57', titulo: 'ANÁLISIS DE DATOS PARA OPTIMIZAR OPERACIONES MINERAS', file: '57.json' },
  { codigo: 'CUR-60', titulo: 'GESTIÓN DE COSTOS DEL MANTENIMIENTO EN LA INDUSTRIA 4.0', file: 'curso 60.json' },
  { codigo: 'CUR-61', titulo: 'SOSTENIBILIDAD Y MINERÍA RESPONSABLE', file: '61.json' },
  { codigo: 'CUR-67', titulo: 'GESTIÓN DE CRISIS Y MANEJO DE CONFLICTOS EN AMBIENTES INDUSTRIALES', file: 'curso 67.json' }
];

function limpiarTexto(texto) {
  if (!texto || typeof texto !== 'string') return texto;
  return texto
    .replace(/(\d+)\{,\}(\d+)/g, '$1,$2')
    .replace(/\\text\{--\}/g, ' – ')
    .replace(/\\text\{-\}/g, '-')
    .replace(/\\%/g, '%')
    .replace(/\\times/g, '×')
    .replace(/\\cdot/g, '·')
    .replace(/\\text\{([^}]+)\}/g, '$1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

async function procesar() {
  console.log('=================================================================');
  console.log('🚀 INICIANDO REEMPLAZO DE PREGUNTAS NIVEL FÁCIL EN SUPABASE');
  console.log('   Total de cursos a procesar: 19');
  console.log('=================================================================\n');

  const backupDir = path.resolve('lib/data/backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  // 1. BACKUP DE TODAS LAS PREGUNTAS FÁCIL ACTUALES EN SUPABASE
  const codigos = CURSOS_CONFIG.map(c => c.codigo);
  console.log('📦 Generando backup de seguridad de preguntas FÁCIL previas en Supabase...');
  const { data: backupData, error: backupErr } = await sb
    .from('banco_preguntas')
    .select('*')
    .in('codigo_diplomado', codigos)
    .eq('dificultad', 'FACIL');

  if (backupErr) {
    console.error('❌ Error al obtener preguntas previas para backup:', backupErr.message);
    process.exit(1);
  }

  const backupFile = path.join(backupDir, `backup_facil_19_cursos_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✅ Backup completado: ${backupData.length} preguntas respaldadas en:\n   ${backupFile}\n`);

  // 2. PROCESAR CADA CURSO
  let totalEliminadas = 0;
  let totalInsertadas = 0;
  const resultados = [];

  for (const curso of CURSOS_CONFIG) {
    const filePath = path.join(DIR_JSON, curso.file);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Archivo no encontrado para ${curso.codigo}: ${filePath}`);
      continue;
    }

    const fileContent = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const quiz = fileContent.quiz || fileContent;

    if (!Array.isArray(quiz) || quiz.length === 0) {
      console.error(`❌ Formato inválido en ${curso.file}`);
      continue;
    }

    // Preparar el lote de nuevas preguntas con el schema exacto de Supabase
    const nuevasPreguntas = quiz.map((q) => {
      const tipo = q.type === 'multiple_select' ? 'multiple_select' : 'multiple_choice';
      const opciones = (q.answerOptions || q.opciones || []).map(opt => ({
        text: limpiarTexto(opt.text || opt.texto || ''),
        isCorrect: Boolean(opt.isCorrect || opt.esCorrecta),
        rationale: limpiarTexto(opt.rationale || opt.retroalimentacion || '')
      }));

      return {
        codigo_diplomado: curso.codigo,
        diplomado: curso.titulo,
        modulo: 'Examen del Curso',
        dificultad: 'FACIL',
        tipo: tipo,
        pregunta: limpiarTexto((q.question || q.enunciado || '').trim()),
        opciones: opciones,
        hint: q.hint ? limpiarTexto(q.hint) : null,
        activo: true
      };
    });

    // A. Eliminar preguntas viejas de nivel FÁCIL
    const { error: delError, count: delCount } = await sb
      .from('banco_preguntas')
      .delete({ count: 'exact' })
      .eq('codigo_diplomado', curso.codigo)
      .eq('dificultad', 'FACIL');

    if (delError) {
      console.error(`❌ Error al eliminar FÁCIL de ${curso.codigo}: ${delError.message}`);
      continue;
    }

    // B. Insertar las 25 nuevas preguntas
    const { data: insData, error: insError } = await sb
      .from('banco_preguntas')
      .insert(nuevasPreguntas)
      .select('id');

    if (insError) {
      console.error(`❌ Error al insertar en ${curso.codigo}: ${insError.message}`);
      continue;
    }

    const insertadasCurso = insData ? insData.length : nuevasPreguntas.length;
    totalEliminadas += (delCount || 0);
    totalInsertadas += insertadasCurso;

    resultados.push({
      codigo: curso.codigo,
      titulo: curso.titulo,
      eliminadas: delCount || 0,
      insertadas: insertadasCurso
    });

    console.log(`✔️ [${curso.codigo}] Eliminadas: ${delCount || 0} | Insertadas: ${insertadasCurso} | ${curso.titulo}`);
  }

  // 3. VERIFICACIÓN POSTERIOR
  console.log('\n=================================================================');
  console.log('🔍 VERIFICANDO RESULTADOS EN VIVO EN SUPABASE...');
  console.log('=================================================================');

  const { data: verifData } = await sb
    .from('banco_preguntas')
    .select('codigo_diplomado, dificultad, activo')
    .in('codigo_diplomado', codigos);

  const conteoFinal = {};
  codigos.forEach(c => conteoFinal[c] = { facil: 0, medio: 0, total: 0 });
  verifData.forEach(r => {
    if (conteoFinal[r.codigo_diplomado]) {
      conteoFinal[r.codigo_diplomado].total++;
      if (r.dificultad === 'FACIL') conteoFinal[r.codigo_diplomado].facil++;
      if (r.dificultad === 'MEDIO') conteoFinal[r.codigo_diplomado].medio++;
    }
  });

  console.log('\nResumen de preguntas por curso tras la actualización:');
  console.table(conteoFinal);

  console.log('\n=================================================================');
  console.log(`🎉 PROCESO COMPLETADO`);
  console.log(`   - Preguntas antiguas eliminadas: ${totalEliminadas}`);
  console.log(`   - Preguntas nuevas insertadas:   ${totalInsertadas}`);
  console.log('=================================================================');
}

procesar();
