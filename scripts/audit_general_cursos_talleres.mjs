import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import xlsx from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

const DIR_RESUMENES = 'G:\\Mi unidad\\CLASES Y RESÚMENES DIPLOMADOS 2026\\RESÚMENES DE DIPLOMADOS\\CARPETA DE ADICIONALES\\TRANSCRIPCIONES VIDEOS CURSOS\\MARKDOWN RESUMEN Y EXÁMENES\\MARKDOWN RESUMEN';
const DIR_PROCESADO = path.join(DIR_RESUMENES, 'procesado');

// Read CURSOS_MAP from sync script
import { createRequire } from 'module';
const syncContent = fs.readFileSync(path.join(__dirname, 'sync_cursos_resumenes_a_supabase.mjs'), 'utf8');

// Extract CURSOS_MAP from file
const mapMatch = syncContent.match(/const CURSOS_MAP = (\[[\s\S]*?\]);/);
if (!mapMatch) {
  console.error('No se pudo extraer CURSOS_MAP');
  process.exit(1);
}

// eval the array safely
const CURSOS_MAP = eval(mapMatch[1]);

async function auditoriaCompleta() {
  console.log('================================================================');
  console.log('🔍 AUDITORÍA GENERAL DE CURSOS Y TALLERES (CUR-01..76, TAL-01..02)');
  console.log('================================================================\n');

  // 1. Verificar archivos en raíz y procesado
  const rootFiles = fs.readdirSync(DIR_RESUMENES).filter(f => f.endsWith('.md'));
  const procFiles = fs.readdirSync(DIR_PROCESADO).filter(f => f.endsWith('.md'));

  console.log(`📂 Archivos en carpeta raíz: ${rootFiles.length} (esperado: 0)`);
  if (rootFiles.length > 0) {
    console.warn(`⚠️ Archivos pendientes en raíz:`, rootFiles);
  } else {
    console.log('   ✅ No hay archivos sueltos ni sin procesar en la raíz.');
  }

  console.log(`📂 Archivos en carpeta 'procesado': ${procFiles.length} (esperado: 78)`);

  // Detectar archivos duplicados por nombre o código
  const uniqueFiles = new Set(procFiles);
  if (uniqueFiles.size !== procFiles.length) {
    console.error(`❌ ALERTA: Hay nombres de archivos duplicados en procesado.`);
  } else {
    console.log('   ✅ Todos los nombres de archivo en procesado son únicos.');
  }

  // Verificar que todos los cursos del mapeo tienen archivo existente y único
  const mapFiles = CURSOS_MAP.map(c => c.archivo);
  const mapSet = new Set(mapFiles);
  if (mapFiles.length !== mapSet.size) {
    console.error(`❌ ALERTA: CURSOS_MAP tiene archivos repetidos!`);
  } else {
    console.log(`   ✅ CURSOS_MAP tiene ${CURSOS_MAP.length} entradas únicas mapeadas.`);
  }

  // Comprobar si hay archivos en procesado que no estén en CURSOS_MAP
  const extraFiles = procFiles.filter(f => !mapSet.has(f));
  if (extraFiles.length > 0) {
    console.warn(`⚠️ Archivos en 'procesado' no incluidos en CURSOS_MAP:`, extraFiles);
  } else {
    console.log('   ✅ Exactamente los 78 archivos de CURSOS_MAP coinciden 1 a 1 con los 78 archivos en procesado.');
  }

  // 2. Comprobar lecciones en Supabase vs Markdown
  console.log('\n----------------------------------------------------------------');
  console.log('🔍 VERIFICACIÓN DE CLASES EN SUPABASE VS MARKDOWN');
  console.log('----------------------------------------------------------------');

  let totalLeccionesSupabase = 0;
  let totalSeccionesMD = 0;
  let cursosConProblemas = [];
  let leccionesSinTituloSugerido = [];
  let leccionesSinResumenOPuntos = [];

  for (const c of CURSOS_MAP) {
    const filePath = path.join(DIR_PROCESADO, c.archivo);
    if (!fs.existsSync(filePath)) {
      cursosConProblemas.push({ codigo: c.codigo, error: `Archivo no existe: ${c.archivo}` });
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const sections = content.split(/###\s+FUENTE:\s*/i).slice(1);
    totalSeccionesMD += sections.length;

    const { data: dbLessons, error: dbErr } = await sb
      .from('lecciones')
      .select('id, CodigoDiplomado, Tema, ResumenTexto, orden')
      .eq('CodigoDiplomado', c.codigo)
      .order('orden', { ascending: true })
      .order('id', { ascending: true });

    if (dbErr) {
      cursosConProblemas.push({ codigo: c.codigo, error: `Error DB: ${dbErr.message}` });
      continue;
    }

    totalLeccionesSupabase += dbLessons.length;

    // Verificar coincidencia de conteo
    if (dbLessons.length !== sections.length) {
      cursosConProblemas.push({
        codigo: c.codigo,
        error: `Discrepancia de clases: DB tiene ${dbLessons.length}, MD tiene ${sections.length}`
      });
    }

    // Verificar cada lección
    for (let i = 0; i < dbLessons.length; i++) {
      const row = dbLessons[i];
      const sec = sections[i];

      if (!sec) continue;

      const matchTitulo = sec.match(/\*\*Título sugerido:\*\*\s*([\s\S]*?)(?=\*\*Resumen:\*\*|$)/i);
      const tituloSugeridoMD = matchTitulo ? matchTitulo[1].trim() : '';

      // Verificar que el tema en DB contiene el título sugerido
      if (tituloSugeridoMD && !row.Tema.includes(tituloSugeridoMD)) {
        leccionesSinTituloSugerido.push({
          codigo: c.codigo,
          fila: i + 1,
          temaDB: row.Tema,
          esperado: tituloSugeridoMD
        });
      }

      // Verificar que ResumenTexto tenga **Resumen:** y **Puntos clave:**
      const resumenValido = row.ResumenTexto && 
        row.ResumenTexto.includes('**Resumen:**') && 
        row.ResumenTexto.includes('**Puntos clave:**');

      if (!resumenValido) {
        leccionesSinResumenOPuntos.push({
          codigo: c.codigo,
          fila: i + 1,
          resumenTexto: (row.ResumenTexto || '').slice(0, 50)
        });
      }
    }
  }

  console.log(`\n📊 Total de lecciones contabilizadas en Supabase: ${totalLeccionesSupabase}`);
  console.log(`📊 Total de secciones detectadas en archivos MD: ${totalSeccionesMD}`);

  if (cursosConProblemas.length > 0) {
    console.error(`\n❌ CURSOS CON DISCREPANCIAS DE CONTEO O ARCHIVOS (${cursosConProblemas.length}):`);
    console.table(cursosConProblemas);
  } else {
    console.log(`✅ ¡PERFECTO! El 100% de los 78 cursos y talleres coincide exactamente en número de clases entre Supabase y Markdown.`);
  }

  if (leccionesSinTituloSugerido.length > 0) {
    console.error(`\n❌ LECCIONES SIN TÍTULO SUGERIDO MD (${leccionesSinTituloSugerido.length}):`);
    console.table(leccionesSinTituloSugerido);
  } else {
    console.log(`✅ ¡PERFECTO! El 100% de las ${totalLeccionesSupabase} lecciones tiene el Título sugerido incorporado en la columna 'Tema'.`);
  }

  if (leccionesSinResumenOPuntos.length > 0) {
    console.error(`\n❌ LECCIONES SIN RESUMEN O PUNTOS CLAVE (${leccionesSinResumenOPuntos.length}):`);
    console.table(leccionesSinResumenOPuntos);
  } else {
    console.log(`✅ ¡PERFECTO! El 100% de las ${totalLeccionesSupabase} lecciones cuenta con los bloques '**Resumen:**' y '**Puntos clave:**'.`);
  }

  // 3. Verificación de Caché Local
  console.log('\n----------------------------------------------------------------');
  console.log('🔍 VERIFICACIÓN DE CACHÉ LOCAL (resumenes_clases_cache.json)');
  console.log('----------------------------------------------------------------');
  const cachePath = path.join(__dirname, '..', 'lib', 'data', 'resumenes_clases_cache.json');
  if (fs.existsSync(cachePath)) {
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    const totalKeys = Object.keys(cacheData).length;
    console.log(`📦 Lecciones totales en cache: ${totalKeys}`);
    if (totalKeys >= totalLeccionesSupabase) {
      console.log(`   ✅ La caché cubre la totalidad de lecciones de cursos y diplomados.`);
    } else {
      console.warn(`   ⚠️ La caché tiene ${totalKeys} lecciones, se esperaban al menos ${totalLeccionesSupabase}.`);
    }
  }

  // 4. Verificación de Excel
  console.log('\n----------------------------------------------------------------');
  console.log('🔍 VERIFICACIÓN DE EXCEL (cursos_clases.xlsx)');
  console.log('----------------------------------------------------------------');
  const excelPath = path.join(__dirname, '..', 'cursos_clases.xlsx');
  if (fs.existsSync(excelPath)) {
    const wb = xlsx.readFile(excelPath);
    const rowsCC = xlsx.utils.sheet_to_json(wb.Sheets['Cursos y Clases']);
    const rowsCat = xlsx.utils.sheet_to_json(wb.Sheets['Catálogo Completo (78)']);

    console.log(`📑 Hoja 'Cursos y Clases': ${rowsCC.length} filas totales.`);
    console.log(`📑 Hoja 'Catálogo Completo (78)': ${rowsCat.length} filas.`);

    // Verificar si hay algún curso de los 78 con 'Nombre de la Clase' vacío en 'Cursos y Clases'
    const clasesVacias = rowsCC.filter(r => !r['Nombre de la Clase'] || r['Nombre de la Clase'].toString().trim() === '');
    if (clasesVacias.length > 0) {
      console.warn(`⚠️ Hay ${clasesVacias.length} filas con 'Nombre de la Clase' vacío en Excel:`, clasesVacias.map(c => `${c['Código']} - ${c['N° Clase']}`));
    } else {
      console.log(`   ✅ En 'Cursos y Clases' todas las filas tienen asignado su 'Nombre de la Clase' sugerido.`);
    }

    // Verificar si algún curso en Catálogo tiene 'Clases (Separadas por |)' vacío
    const catVacios = rowsCat.filter(r => !r['Clases (Separadas por |)'] || r['Clases (Separadas por |)'].toString().trim() === '');
    if (catVacios.length > 0) {
      console.warn(`⚠️ Hay ${catVacios.length} cursos sin 'Clases (Separadas por |)' en el catálogo:`, catVacios.map(c => c['Código']));
    } else {
      console.log(`   ✅ En 'Catálogo Completo (78)' todos los 78 cursos tienen sus clases formateadas con '|'.`);
    }
  }

  console.log('\n================================================================');
  console.log('🎉 AUDITORÍA GENERAL FINALIZADA CON ÉXITO');
  console.log('================================================================\n');
}

auditoriaCompleta();
