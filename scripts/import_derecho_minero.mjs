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

const DIR_EXAMENES = 'G:\\Mi unidad\\CLASES Y RESÚMENES DIPLOMADOS 2026\\RESÚMENES DE DIPLOMADOS\\1. DERECHO MINERO (03 MÓDULOS)\\EXÁMENES';

async function processExamenes() {
  console.log('--- PROCESANDO BANCO DE PREGUNTAS: DERECHO MINERO (DIP-01) ---');
  
  if (!fs.existsSync(DIR_EXAMENES)) {
    console.error('El directorio de exámenes no existe en la ruta:', DIR_EXAMENES);
    return;
  }

  const files = fs.readdirSync(DIR_EXAMENES).filter(f => f.endsWith('.json'));
  console.log(`Archivos encontrados (${files.length}):`, files);

  const todasLasPreguntas = [];

  for (const file of files) {
    // Ejemplo de nombre: "DERECHO MINERO - MÓDULO 01 - EXAMEN NIVEL MEDIO.json"
    const filePath = path.join(DIR_EXAMENES, file);
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Detectar Módulo y Dificultad del nombre
    let modulo = 'Módulo 01';
    if (file.includes('MÓDULO 02') || file.includes('MODULO 02')) modulo = 'Módulo 02';
    else if (file.includes('MÓDULO 03') || file.includes('MODULO 03')) modulo = 'Módulo 03';

    let dificultad = 'MEDIO';
    if (file.toUpperCase().includes('NIVEL ALTO') || file.toUpperCase().includes('ALTO')) {
      dificultad = 'ALTO';
    } else if (file.toUpperCase().includes('NIVEL FACIL') || file.toUpperCase().includes('FÁCIL')) {
      dificultad = 'FACIL';
    }

    const quizList = content.quiz || [];
    console.log(`-> ${file}: ${quizList.length} preguntas detectadas (${modulo} - ${dificultad})`);

    quizList.forEach((q, idx) => {
      // Normalizar tipo
      const tipo = q.type === 'multiple_select' ? 'multiple_select' : 'multiple_choice';

      // Normalizar opciones
      const opciones = (q.answerOptions || []).map(opt => ({
        text: opt.text || '',
        isCorrect: Boolean(opt.isCorrect),
        rationale: opt.rationale || ''
      }));

      // Determinar ID determinístico o UUID
      const itemPregunta = {
        codigo_diplomado: 'DIP-01',
        diplomado: 'DERECHO MINERO',
        modulo: modulo,
        dificultad: dificultad,
        tipo: tipo,
        pregunta: (q.question || '').trim(),
        opciones: opciones,
        hint: q.hint || null,
        activo: true
      };

      todasLasPreguntas.push(itemPregunta);
    });
  }

  console.log(`\nTotal general de preguntas acumuladas: ${todasLasPreguntas.length}`);

  // Guardar copia local en lib/data/banco_preguntas_derecho_minero.json
  const dataDir = path.resolve('lib/data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  const localBackupPath = path.join(dataDir, 'banco_preguntas_derecho_minero.json');
  fs.writeFileSync(localBackupPath, JSON.stringify(todasLasPreguntas, null, 2), 'utf8');
  console.log(`Backup local guardado exitosamente en: ${localBackupPath}`);

  // Intentar insertar en Supabase si la tabla existe
  const { data: testCheck, error: errCheck } = await sb.from('banco_preguntas').select('id').limit(1);
  if (errCheck) {
    console.log(`\nNota: La tabla 'banco_preguntas' aún no está creada en Supabase (${errCheck.message}).`);
    console.log(`Ejecute el script SQL 'supabase/migrations/20261021000000_create_examenes_banco_tables.sql' en el SQL Editor de Supabase.`);
    console.log(`Mientras tanto, la plataforma cargará el banco desde el backup local automáticamente.`);
  } else {
    console.log('\nInsertando lote de preguntas en Supabase public.banco_preguntas...');
    // Insertar en lotes de 25
    let insertadas = 0;
    const batchSize = 25;
    for (let i = 0; i < todasLasPreguntas.length; i += batchSize) {
      const batch = todasLasPreguntas.slice(i, i + batchSize);
      const { error: errInsert } = await sb.from('banco_preguntas').insert(batch);
      if (errInsert) {
        console.error(`Error al insertar lote ${i}-${i + batchSize}:`, errInsert.message);
      } else {
        insertadas += batch.length;
      }
    }
    console.log(`¡Éxito! Se insertaron ${insertadas} preguntas en Supabase.`);

    // Crear configuraciones por defecto en examenes_modulos
    const configs = [
      { codigo_diplomado: 'DIP-01', modulo: 'Módulo 01', titulo: 'Evaluación Modular 01 - Marco Regulatorio Minero', cantidad_preguntas: 10, tiempo_minutos: 30, nota_aprobatoria: 12.00, puntaje_maximo: 20.00, intentos_permitidos: 1, activo: true },
      { codigo_diplomado: 'DIP-01', modulo: 'Módulo 02', titulo: 'Evaluación Modular 02 - Procedimiento Ordinario Minero', cantidad_preguntas: 10, tiempo_minutos: 30, nota_aprobatoria: 12.00, puntaje_maximo: 20.00, intentos_permitidos: 1, activo: true },
      { codigo_diplomado: 'DIP-01', modulo: 'Módulo 03', titulo: 'Evaluación Modular 03 - Fiscalización y Responsabilidad Minera', cantidad_preguntas: 10, tiempo_minutos: 30, nota_aprobatoria: 12.00, puntaje_maximo: 20.00, intentos_permitidos: 1, activo: true }
    ];
    const { error: errConf } = await sb.from('examenes_modulos').upsert(configs, { onConflict: 'codigo_diplomado, modulo' });
    if (!errConf) {
      console.log('Configuraciones modulares inicializadas en examenes_modulos.');
    }
  }
}

processExamenes();
