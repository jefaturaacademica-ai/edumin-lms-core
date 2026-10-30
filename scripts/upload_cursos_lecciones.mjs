import fs from 'fs';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

// Cargar variables de entorno de .env.local
const envContent = fs.readFileSync('.env.local', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
});

const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

function cleanText(str) {
  if (!str) return '';
  return str
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    return match[1];
  }
  return null;
}

function toYoutubeEmbed(url) {
  const id = extractYoutubeId(url);
  if (id) {
    return `https://www.youtube.com/embed/${id}`;
  }
  return url?.trim() || null;
}

async function uploadCursosLecciones() {
  console.log('=== INICIANDO SUBIDA DE LECCIONES DE CURSOS A SUPABASE ===\n');

  // 1. Obtener cursos de diplomados_y_cursos
  const { data: dbCursos, error: errCursos } = await sb
    .from('diplomados_y_cursos')
    .select('id, codigo, titulo, tipo, docente');

  if (errCursos || !dbCursos) {
    console.error('Error al consultar diplomados_y_cursos:', errCursos);
    return;
  }

  const dbByCleanTitle = new Map();
  dbCursos.forEach(c => {
    dbByCleanTitle.set(cleanText(c.titulo), c);
  });

  // 2. Leer archivo CSV de Google Sheets
  const csvText = fs.readFileSync('scripts/cursos_sheet.csv', 'utf8');
  const wb = XLSX.read(csvText, { type: 'string' });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1 });

  // 3. Obtener el max orden actual de lecciones
  const { data: maxOrderData } = await sb
    .from('lecciones')
    .select('orden')
    .order('orden', { ascending: false })
    .limit(1);

  const maxOrdenActual = (maxOrderData && maxOrderData[0]?.orden) || 557;
  console.log(`Orden base actual en lecciones: ${maxOrdenActual}`);

  let currentCourseName = '';
  let globalOrder = maxOrdenActual + 1;
  const leccionesParaInsertar = [];
  const codigosCursosSet = new Set();
  const temaCounterPorCurso = new Map();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r || r.length === 0) continue;

    const colB = (r[1] || '').trim();
    if (colB) {
      currentCourseName = colB;
    }

    if (!currentCourseName) continue;

    const colJ = (r[9] || '').trim(); // LINK YOUTUBE
    const colI = (r[8] || '').trim(); // LINK YOUTUBE IFRAME
    const colL = (r[11] || '').trim(); // Nombre del tema/clase
    const colM = (r[12] || '').trim(); // ResumenVideoUrl

    if (!colJ && !colI && !colL) continue;

    const cleanTitle = cleanText(currentCourseName);
    const dbCurso = dbByCleanTitle.get(cleanTitle);

    if (!dbCurso) {
      console.warn(`⚠️ Curso no encontrado en base de datos: "${currentCourseName}" (Fila ${i + 1})`);
      continue;
    }

    const codigoCurso = dbCurso.codigo;
    codigosCursosSet.add(codigoCurso);

    const temaIdx = (temaCounterPorCurso.get(codigoCurso) || 0) + 1;
    temaCounterPorCurso.set(codigoCurso, temaIdx);

    const padTema = String(temaIdx).padStart(2, '0');
    const temaLimpio = colL.replace(/^Tema\s*\d+[:\-\s]*/i, '').trim();
    const temaTitulo = `Tema ${padTema}: ${temaLimpio || 'Contenido de la Sesión'}`;

    const videoUrlEmbed = toYoutubeEmbed(colJ || colI);
    const resumenUrl = colM || null;

    leccionesParaInsertar.push({
      CodigoDiplomado: codigoCurso,
      Diplomado: dbCurso.titulo,
      Modulo: '',
      NombreModulo: '',
      Docente: dbCurso.docente || '',
      Tema: temaTitulo,
      Sesion: 'Parte 1',
      VideoUrl: videoUrlEmbed,
      PdfUrl: null,
      ResumenVideoUrl: resumenUrl,
      ResumenAudioUrl: null,
      ResumenInteractivo: null,
      ResumenMapaMental: null,
      ResumenTexto: null,
      Material1: null,
      Material2: null,
      Material3: null,
      Material4: null,
      Material5: null,
      Material6: null,
      Material7: null,
      Material8: null,
      orden: globalOrder++
    });
  }

  console.log(`\nTotal lecciones preparadas: ${leccionesParaInsertar.length}`);
  console.log(`Cursos procesados: ${codigosCursosSet.size}`);

  // 4. Limpiar lecciones previas de estos cursos si existieran (idempotencia)
  console.log('\nLimpiando posibles lecciones previas de estos cursos...');
  const codigosArray = Array.from(codigosCursosSet);
  for (const cod of codigosArray) {
    await sb.from('lecciones').delete().eq('CodigoDiplomado', cod);
  }

  // 5. Insertar filas por lotes
  const batchSize = 50;
  let insertados = 0;

  console.log(`\nInsertando ${leccionesParaInsertar.length} lecciones en lotes de ${batchSize}...`);

  for (let i = 0; i < leccionesParaInsertar.length; i += batchSize) {
    const batch = leccionesParaInsertar.slice(i, i + batchSize);
    const { error } = await sb.from('lecciones').insert(batch);
    if (error) {
      console.error(`❌ Error al insertar lote ${i + 1} a ${i + batch.length}:`, error.message);
      process.exit(1);
    }
    insertados += batch.length;
    console.log(`✅ Lote ${i + 1} a ${i + batch.length} insertado (${insertados}/${leccionesParaInsertar.length})`);
  }

  // 6. Verificar total en Supabase
  const { count, error: errCount } = await sb
    .from('lecciones')
    .select('*', { count: 'exact', head: true })
    .in('CodigoDiplomado', codigosArray);

  console.log(`\n=== PROCESO COMPLETADO EXITOSAMENTE ===`);
  console.log(`Total lecciones de cursos en Supabase: ${count} (esperadas: ${leccionesParaInsertar.length})`);
}

uploadCursosLecciones().catch(err => {
  console.error('Error fatal durante la subida:', err);
  process.exit(1);
});
