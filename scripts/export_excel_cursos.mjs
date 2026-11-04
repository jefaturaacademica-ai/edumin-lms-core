import { createClient } from '@supabase/supabase-js';
import XLSX from 'xlsx';

const url = 'https://wluuomwkxywpfotbngwf.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndsdXVvbXdreHl3cGZvdGJuZ3dmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4OTY2MDczNCwiZXhwIjoyMTA1MjM2NzM0fQ.PGIt1fG9X2uhOC7k2D-bi54bNs-kzTyK5sLxkCr5amc';
const sb = createClient(url, key);

async function exportCursosOnly() {
  console.log('Consultando sólo cursos y talleres desde Supabase...');
  
  // 1. Obtener cursos y talleres (excluyendo diplomados)
  const { data: cursos, error: errC } = await sb
    .from('diplomados_y_cursos')
    .select('*')
    .not('codigo', 'ilike', 'DIP%')
    .order('codigo', { ascending: true });

  if (errC) throw errC;
  console.log(`Cursos encontrados: ${cursos.length}`);

  const codigos = cursos.map(c => c.codigo);

  // 2. Obtener todas las lecciones de estos cursos
  let allLecciones = [];
  let page = 0;
  const pageSize = 1000;
  while (true) {
    const { data: lecc, error: errL } = await sb
      .from('lecciones')
      .select('*')
      .in('CodigoDiplomado', codigos)
      .range(page * pageSize, (page + 1) * pageSize - 1)
      .order('CodigoDiplomado', { ascending: true })
      .order('orden', { ascending: true });

    if (errL) throw errL;
    allLecciones.push(...lecc);
    if (lecc.length < pageSize) break;
    page++;
  }
  console.log(`Lecciones de cursos encontradas: ${allLecciones.length}`);

  // Mapear info de curso por código
  const cursoMap = {};
  for (const c of cursos) {
    cursoMap[(c.codigo || '').toUpperCase()] = c;
  }

  // 3. Generar filas de la única hoja detallada de Cursos y Clases
  const rows = [];
  for (const l of allLecciones) {
    const cod = (l.CodigoDiplomado || '').toUpperCase();
    const curso = cursoMap[cod] || {};

    rows.push({
      'Código': l.CodigoDiplomado || curso.codigo || '',
      'Nombre del Curso': l.Diplomado || curso.titulo || '',
      'N° Clase': l.Sesion || '',
      'Nombre de la Clase': l.Tema || '',
      'Link Video': l.VideoUrl || '',
      'Link Material / PDF': l.PdfUrl || '',
      'Link Resumen Video': l.ResumenVideoUrl || '',
      'Link Resumen Audio': l.ResumenAudioUrl || '',
      'Docente': l.Docente || curso.docente || '',
      'Tipo': curso.tipo ? curso.tipo.toUpperCase() : 'CURSO',
      'Categoría': curso.categoria || '',
      'Duración': curso.horas ? `${curso.horas} horas` : '',
      'Nivel': curso.nivel || '',
      'Precio (S/)': curso.precio || '',
      'Versión': curso.version || '',
      'Año': curso.ano || '',
      'Imagen': curso.imagen || ''
    });
  }

  // 4. Crear el Excel con UNA SOLA HOJA
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);

  // Ancho automático de columnas
  if (rows.length > 0) {
    ws['!cols'] = Object.keys(rows[0]).map(k => {
      const maxLen = rows.reduce((max, r) => Math.max(max, String(r[k] || '').length), k.length);
      return { wch: Math.min(Math.max(maxLen + 2, 12), 65) };
    });
  }

  XLSX.utils.book_append_sheet(wb, ws, 'Cursos y Clases');

  const outPath = 'cursos_clases.xlsx';
  XLSX.writeFile(wb, outPath);
  console.log(`✅ Archivo exportado exitosamente con 1 sola hoja: ${outPath}`);
  console.log(`Total filas (clases): ${rows.length} correspondientes a ${cursos.length} cursos.`);
}

exportCursosOnly().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
