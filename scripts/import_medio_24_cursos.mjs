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
const DIR_JSON = 'D:/Descargas/JSON/medio';

const CURSOS_MEDIO_CONFIG = [
  { codigo: 'CUR-01', titulo: 'MANEJO DE EPPS SEGÚN LA NORMA TÉCNICA PERUANA LEY 29783', file: '01 Protección Laboral Cuestionario.json' },
  { codigo: 'CUR-04', titulo: 'MARCO JURÍDICO Y NORMATIVO DE LA MINERÍA', file: '04 Derecho Minero Cuestionario.json' },
  { codigo: 'CUR-06', titulo: 'CONTROL DE COSTOS EN ALMACENES MINEROS', file: '06 Logística Minera Cuestionario.json' },
  { codigo: 'CUR-07', titulo: 'LOGÍSTICA Y DISTRIBUCIÓN EN LA INDUSTRIA Y MINERÍA', file: '07 Logística Cuestionario.json' },
  { codigo: 'CUR-09', titulo: 'DERECHOS HUMANOS EN MINERÍA', file: '09 Minería Cuestionario.json' },
  { codigo: 'CUR-17', titulo: 'GESTIÓN DE EMERGENCIAS EN INDUSTRIA Y MINERÍA', file: '17 Seguridad Industrial Cuestionario.json' },
  { codigo: 'CUR-18', titulo: 'GESTIÓN DE INVENTARIOS EN INDUSTRIA Y MINERÍA', file: '18 Gestión Logística Cuestionario.json' },
  { codigo: 'CUR-23', titulo: 'TENDENCIAS 2025-2026: CLAVES DE BIG DATA', file: '23 Gestión de Datos Cuestionario.json' },
  { codigo: 'CUR-25', titulo: 'MINERÍA 4.0 ESSENTIALS: NUEVAS HERRAMIENTAS', file: '25 Minería Digital Quiz.json' },
  { codigo: 'CUR-36', titulo: 'TIPOS DE INTELIGENCIA ARTIFICIAL APLICADAS A LA MINERÍA', file: '36 Optimización Algorítmica Cuestionario.json' },
  { codigo: 'CUR-43', titulo: 'ANÁLISIS DE MERCADOS INTERNACIONALES: ESTRATEGIAS DE IMPORTACIÓN Y EXPORTACIÓN 2025-2026', file: '43 Investigación Comercial Cuestionario.json' },
  { codigo: 'CUR-47', titulo: 'PIRÁMIDE DE PROCESOS: TÉCNICAS DE CONTROL EN MINERÍA', file: '47 Automatización Minera Cuestionario.json' },
  { codigo: 'CUR-48', titulo: 'PROCESO DE OPTIMIZACIÓN DEL MANTENIMIENTO A PARTIR DEL USO DE TÉCNICAS DE LA INDUSTRIA 4.0', file: '48 Mantenimiento Industrial Cuestionario.json' },
  { codigo: 'CUR-54', titulo: 'CONTROL DE CALIDAD EN PROCESOS MINEROS', file: '54 Gestión Minera Cuestionario.json' },
  { codigo: 'CUR-56', titulo: 'SOSTENIBILIDAD Y SEGURIDAD EN CAMPAMENTOS MINEROS', file: '56 Minería Evaluación.json' },
  { codigo: 'CUR-57', titulo: 'ANÁLISIS DE DATOS PARA OPTIMIZAR OPERACIONES MINERAS', file: '57 Automatización Industrial Cuestionario.json' },
  { codigo: 'CUR-58', titulo: 'SEGURIDAD Y CONTROL AMBIENTAL EN EL MANTENIMIENTO', file: '58 Gestión Industrial Quiz.json' },
  { codigo: 'CUR-61', titulo: 'SOSTENIBILIDAD Y MINERÍA RESPONSABLE', file: '61 Minería Sostenible Cuestionario.json' },
  { codigo: 'CUR-63', titulo: 'INDICADORES CLAVE (KPIS) PARA LA CADENA DE ABASTECIMIENTOS', file: '63 Logística Cuestionario.json' },
  { codigo: 'CUR-66', titulo: 'SISTEMAS INTEGRADOS DE GESTIÓN HSEQ (ISO 9001, 14001, 45001)', file: '66 Sistemas de Gestión Test.json' },
  { codigo: 'CUR-67', titulo: 'GESTIÓN DE CRISIS Y MANEJO DE CONFLICTOS EN AMBIENTES INDUSTRIALES', file: '67 Gestión Industrial Cuestionario.json' },
  { codigo: 'CUR-68', titulo: 'PLANIFICACIÓN ESTRATÉGICA Y BALANCED SCORECARD', file: '68 Gestión Minera Cuestionario.json' },
  { codigo: 'CUR-76', titulo: 'GESTIÓN DE RELAVES Y RESIDUOS MINEROS', file: '76 Gestión Minera Cuestionario.json' },
  { codigo: 'TAL-02', titulo: 'TALLER DE SEGURIDAD BASADA EN EL COMPORTAMIENTO', file: 'taller seguridad Liderazgo Preventivo Cuestionario.json' }
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

async function procesarMedio() {
  console.log('=================================================================');
  console.log('🚀 INICIANDO REEMPLAZO DE PREGUNTAS NIVEL MEDIO EN SUPABASE');
  console.log('   Total de cursos a procesar: 24');
  console.log('=================================================================\n');

  const backupDir = path.resolve('lib/data/backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const codigos = CURSOS_MEDIO_CONFIG.map(c => c.codigo);

  // 1. BACKUP DE TODAS LAS PREGUNTAS MEDIO ACTUALES EN SUPABASE
  console.log('📦 Generando backup de seguridad de preguntas MEDIO previas en Supabase...');
  const { data: backupData, error: backupErr } = await sb
    .from('banco_preguntas')
    .select('*')
    .in('codigo_diplomado', codigos)
    .eq('dificultad', 'MEDIO');

  if (backupErr) {
    console.error('❌ Error al obtener preguntas previas para backup:', backupErr.message);
    process.exit(1);
  }

  const backupFile = path.join(backupDir, `backup_medio_24_cursos_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`✅ Backup completado: ${backupData.length} preguntas respaldadas en:\n   ${backupFile}\n`);

  // 2. PROCESAR CADA CURSO
  let totalEliminadas = 0;
  let totalInsertadas = 0;

  for (const curso of CURSOS_MEDIO_CONFIG) {
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
        dificultad: 'MEDIO',
        tipo: tipo,
        pregunta: limpiarTexto((q.question || q.enunciado || '').trim()),
        opciones: opciones,
        hint: q.hint ? limpiarTexto(q.hint) : null,
        activo: true
      };
    });

    // A. Eliminar preguntas viejas de nivel MEDIO
    const { error: delError, count: delCount } = await sb
      .from('banco_preguntas')
      .delete({ count: 'exact' })
      .eq('codigo_diplomado', curso.codigo)
      .eq('dificultad', 'MEDIO');

    if (delError) {
      console.error(`❌ Error al eliminar MEDIO de ${curso.codigo}: ${delError.message}`);
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

procesarMedio();
