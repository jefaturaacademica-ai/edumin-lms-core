import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno de .env.local
const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w_]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').trim().replace(/^['"]|['"]$/g, '');
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
const sb = createClient(url, serviceRoleKey);

const DIR_RESUMENES = 'G:\\Mi unidad\\CLASES Y RESÚMENES DIPLOMADOS 2026\\RESÚMENES DE DIPLOMADOS\\MD DE DIPLOMADOS';

// Mapeo directo de archivo a código de diplomado
const MAP_ARCHIVOS = {
  'resumenes_de_clases_derecho_minero.md': 'DIP-01',
  'resumenes_de_clases_comercio_internacional_gestion_aduanera_.md': 'DIP-02',
  'resumenes_de_clases_geologia_minera.md': 'DIP-03',
  'resumenes_de_clases_geomecanica_subterranea_y_superficial.md': 'DIP-04',
  'resumenes_de_clases_geometalurgia.md': 'DIP-05',
  'resumenes_de_clases_geotecnia_minera.md': 'DIP-06',
  'resumenes_de_clases_gerencia_de_sistemas_integrados_de_gesti.md': 'DIP-07',
  'resumenes_de_clases_gerencia_estrategica_y_liderazgo.md': 'DIP-08',
  'resumenes_de_clases_gestion_ambiental_para_el_sector_minero_.md': 'DIP-09',
  'resumenes_de_clases_gestion_de_control_operativo_en_procesos.md': 'DIP-10',
  'resumenes_de_clases_gestion_de_operaciones.md': 'DIP-11',
  'resumenes_de_clases_gestion_estrategica_para_empresas.md': 'DIP-12',
  'resumenes_de_clases_gestion_logistica_compras_inventarios_y_.md': 'DIP-13',
  'resumenes_de_clases_gestion_logistica_y_almacenes_en_mineria.md': 'DIP-14',
  'resumenes_de_clases_gestion_logistica_y_proveedores_en_indus.md': 'DIP-15',
  'resumenes_de_clases_gestion_minera.md': 'DIP-16',
  'resumenes_de_clases_legislacion_laboral_y_elaboracion_de_pla.md': 'DIP-17',
  'resumenes_de_clases_mineria_4_0_y_digitalizacion_minera.md': 'DIP-18',
  'resumenes_de_clases_prevencion_de_la_conflictividad_riesgos_.md': 'DIP-19',
  'resumenes_de_clases_seguridad_industrial.md': 'DIP-20',
  'resumenes_de_clases_seguridad_y_salud_ocupacional_en_la_indu.md': 'DIP-21',
  'resumenes_de_clases_supply_chain_management_en_industria_y_m.md': 'DIP-22'
};

function parsearMarkdown(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sections = content.split(/###\s+FUENTE:\s*/i).slice(1);

  return sections.map((sec, idx) => {
    const lines = sec.split(/\r?\n/);
    const fuente = lines[0].trim();

    const resumenMatch = sec.match(/\*\*Resumen:\*\*\s*([\s\S]*?)(?=\*\*Temas clave:\*\*|$)/i);
    const temasMatch = sec.match(/\*\*Temas clave:\*\*\s*([\s\S]*?)(?=---|###|$)/i);

    const parrafo = resumenMatch ? resumenMatch[1].trim() : '';
    const lineasTemas = temasMatch 
      ? temasMatch[1].trim().split(/\r?\n/).filter(l => l.trim().startsWith('-'))
      : [];

    const temasClave = lineasTemas.map(l => {
      const raw = l.trim().replace(/^-\s*/, '').trim();
      const matchTerm = raw.match(/^\*\*(.*?)(?::)?\*\*(?::)?\s*([\s\S]*)$/);
      if (matchTerm) {
        return {
          titulo: matchTerm[1].trim(),
          descripcion: matchTerm[2].trim(),
          texto: `- **${matchTerm[1].trim()}:** ${matchTerm[2].trim()}`
        };
      }
      return {
        titulo: '',
        descripcion: raw,
        texto: `- ${raw}`
      };
    });

    const markdownNormalizado = [
      '**Resumen:**',
      parrafo,
      '',
      '**Temas clave:**',
      ...temasClave.map(t => t.texto)
    ].join('\n');

    return {
      indice: idx,
      fuente,
      parrafo,
      temasClave,
      markdown: markdownNormalizado
    };
  });
}

async function sincronizar() {
  console.log('=== INICIANDO SINCRONIZACIÓN DE RESÚMENES A SUPABASE ===\n');

  if (!fs.existsSync(DIR_RESUMENES)) {
    console.error('No se encontró la carpeta en:', DIR_RESUMENES);
    process.exit(1);
  }

  // Buscar archivos .md en la carpeta raíz y subcarpetas (ej. "PROCESADO Y SUBIDO A SUPABASE")
  const obtenerArchivosMD = (dir) => {
    let resultados = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        resultados = resultados.concat(obtenerArchivosMD(fullPath));
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        resultados.push({ file: entry.name, filePath: fullPath });
      }
    }
    return resultados;
  };

  const mdEntries = obtenerArchivosMD(DIR_RESUMENES);
  console.log(`Archivos detectados (${mdEntries.length}):`, mdEntries.map(e => e.file));

  const cacheGlobal = {};
  let totalActualizadas = 0;

  for (const { file, filePath } of mdEntries) {
    const codDip = MAP_ARCHIVOS[file];
    if (!codDip) {
      console.warn(`[OMITIDO] No hay mapeo para: ${file}`);
      continue;
    }

    const clasesMD = parsearMarkdown(filePath);
    console.log(`\n-> Procesando ${file} (${codDip}): ${clasesMD.length} clases detectadas en el Markdown.`);

    // Obtener las filas de Supabase para este diplomado ordenadas
    const { data: rowsDB, error } = await sb
      .from('lecciones')
      .select('id, CodigoDiplomado, Modulo, Tema, Sesion, orden')
      .eq('CodigoDiplomado', codDip)
      .order('orden', { ascending: true })
      .order('id', { ascending: true });

    if (error) {
      console.error(`Error consultando filas de ${codDip} en Supabase:`, error.message);
      continue;
    }

    console.log(`   Filas en Supabase para ${codDip}: ${rowsDB?.length || 0}`);

    if (!rowsDB || rowsDB.length === 0) {
      console.warn(`   No hay filas en Supabase para ${codDip}`);
      continue;
    }

    // Función auxiliar para extraer clave de emparejamiento ("CLASE_15", "ADICIONAL_1", etc.)
    const extraerClaveClase = (texto) => {
      const mClase = String(texto || '').match(/CLASE[_\s-]*0*(\d+)/i);
      if (mClase) return `CLASE_${parseInt(mClase[1], 10)}`;
      if (/ADICIONAL/i.test(String(texto || ''))) return 'ADICIONAL';
      return null;
    };

    const mapaMD = new Map();
    const adicionalesMD = [];
    for (const mdItem of clasesMD) {
      const k = extraerClaveClase(mdItem.fuente);
      if (k === 'ADICIONAL') {
        adicionalesMD.push(mdItem);
      } else if (k) {
        mapaMD.set(k, mdItem);
      }
    }

    // Asociar por número exacto de Clase (o ADICIONAL) para evitar desfases si falta alguna clase en el MD
    let countSuccess = 0;
    let idxAdicional = 0;
    for (let i = 0; i < rowsDB.length; i++) {
      const row = rowsDB[i];
      const claveDB = extraerClaveClase(row.Sesion) || extraerClaveClase(row.Tema);

      let mdClase = null;
      if (claveDB === 'ADICIONAL') {
        mdClase = adicionalesMD[idxAdicional++] || null;
      } else if (claveDB && mapaMD.has(claveDB)) {
        mdClase = mapaMD.get(claveDB);
      } else if (!claveDB && clasesMD.length === rowsDB.length) {
        mdClase = clasesMD[i];
      }

      if (!mdClase) {
        console.warn(`   ⚠️ Fila ${i + 1} (${row.Sesion}) NO tiene resumen en el MD -> se limpiará ResumenTexto (null).`);
        await sb
          .from('lecciones')
          .update({ ResumenTexto: null })
          .eq('id', row.id);
        continue;
      }

      // Guardar en cache global para el LMS
      cacheGlobal[row.id] = {
        parrafo: mdClase.parrafo,
        temasClave: mdClase.temasClave,
        markdown: mdClase.markdown,
        fuente: mdClase.fuente
      };

      // Actualizar en Supabase en la columna ResumenTexto
      const { error: updErr } = await sb
        .from('lecciones')
        .update({ ResumenTexto: mdClase.markdown })
        .eq('id', row.id);

      if (updErr) {
        console.error(`   Error actualizando ${row.id} (${row.Sesion}):`, updErr.message);
      } else {
        countSuccess++;
        totalActualizadas++;
      }
    }

    console.log(`   ✓ ${countSuccess} lecciones actualizadas exitosamente en Supabase para ${codDip}.`);
  }

  // Guardar archivo de respaldo local para máxima velocidad y carga offline en el LMS
  const cachePath = path.join(__dirname, '..', 'lib', 'data', 'resumenes_clases_cache.json');
  fs.writeFileSync(cachePath, JSON.stringify(cacheGlobal, null, 2), 'utf8');
  console.log(`\n✓ Respaldo local generado en lib/data/resumenes_clases_cache.json (${Object.keys(cacheGlobal).length} lecciones en caché).`);
  console.log(`\n=== SINCRONIZACIÓN COMPLETADA: ${totalActualizadas} FILAS ACTUALIZADAS EN SUPABASE ===\n`);
}

sincronizar();
