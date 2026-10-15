const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const htmlContent = fs.readFileSync('c:/Users/USER/Downloads/NOMBRES DIPLOMADOS.html', 'utf8');
const driveVideosJson = JSON.parse(fs.readFileSync('./lib/data/drive_videos_mapped.json', 'utf8'));

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const replacements = [
  [/EE\.\s*UU\./gi, '###EEUU###'],
  [/N\.º/gi, '###NUM###'],
  [/D\.S\./gi, '###DS###'],
  [/\bDS\b/gi, '###DS2###'],
  [/\bSST\b/gi, '###SST###'],
  [/\bIPERC\b/gi, '###IPERC###'],
  [/\bHSEQ\b/gi, '###HSEQ###'],
  [/\bISO\b/gi, '###ISO###'],
  [/\bOEFA\b/gi, '###OEFA###'],
  [/\bSUNAFIL\b/gi, '###SUNAFIL###'],
  [/\bOSINERGMIN\b/gi, '###OSINERGMIN###'],
  [/\bMINEM\b/gi, '###MINEM###'],
  [/\bPLAME\b/gi, '###PLAME###'],
  [/\bT-REGISTRO\b/gi, '###TREG###'],
  [/\bAFPNET\b/gi, '###AFPNET###'],
  [/\bQA\/QC\b/gi, '###QAQC###'],
  [/\bKPI\b/gi, '###KPI###'],
  [/\bERP\b/gi, '###ERP###'],
  [/\bSCM\b/gi, '###SCM###'],
  [/\bWMS\b/gi, '###WMS###'],
  [/\bTMS\b/gi, '###TMS###'],
  [/\bMRP\b/gi, '###MRP###'],
  [/\b5S\b/gi, '###5S###'],
  [/\bLEAN\b/gi, '###LEAN###'],
  [/\bTPM\b/gi, '###TPM###'],
  [/\bSMED\b/gi, '###SMED###'],
  [/\bJIT\b/gi, '###JIT###'],
  [/\bKANBAN\b/gi, '###KANBAN###'],
  [/\bSIX SIGMA\b/gi, '###SIXSIGMA###'],
  [/\bBIG DATA\b/gi, '###BIGDATA###'],
  [/-TR\b/gi, '###TR###'],
  [/-EM\b/gi, '###EM###']
];

const restoreMap = {
  '###EEUU###': 'EE. UU.',
  '###NUM###': 'N.º',
  '###DS###': 'D. S.',
  '###DS2###': 'DS',
  '###SST###': 'SST',
  '###IPERC###': 'IPERC',
  '###HSEQ###': 'HSEQ',
  '###ISO###': 'ISO',
  '###OEFA###': 'OEFA',
  '###SUNAFIL###': 'SUNAFIL',
  '###OSINERGMIN###': 'OSINERGMIN',
  '###MINEM###': 'MINEM',
  '###PLAME###': 'PLAME',
  '###TREG###': 'T-REGISTRO',
  '###AFPNET###': 'AFPNET',
  '###QAQC###': 'QA/QC',
  '###KPI###': 'KPI',
  '###ERP###': 'ERP',
  '###SCM###': 'SCM',
  '###WMS###': 'WMS',
  '###TMS###': 'TMS',
  '###MRP###': 'MRP',
  '###5S###': '5S',
  '###LEAN###': 'LEAN',
  '###TPM###': 'TPM',
  '###SMED###': 'SMED',
  '###JIT###': 'JIT',
  '###KANBAN###': 'KANBAN',
  '###SIXSIGMA###': 'Six Sigma',
  '###BIGDATA###': 'Big Data',
  '###TR###': '-TR',
  '###EM###': '-EM'
};

const minorWords = new Set([
  'y', 'e', 'o', 'u', 'de', 'del', 'a', 'en', 'con', 'por', 'para', 'sin', 'sobre', 'tras',
  'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas', 'al', 'su', 'sus'
]);

function toNiceTitleCase(str) {
  let s = str.trim();
  replacements.forEach(([regex, ph]) => {
    s = s.replace(regex, ph);
  });

  const words = s.toLowerCase().split(/\s+/).map((word, idx, arr) => {
    for (const ph of Object.keys(restoreMap)) {
      if (word.toUpperCase().includes(ph)) {
        return word;
      }
    }

    if (idx > 0 && idx < arr.length && minorWords.has(word.toLowerCase())) {
      const prevWord = arr[idx - 1];
      if (prevWord && prevWord.endsWith(':')) {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }
      return word.toLowerCase();
    }
    return word.charAt(0).toUpperCase() + word.slice(1);
  });

  let result = words.join(' ');
  for (const [ph, real] of Object.entries(restoreMap)) {
    result = result.replace(new RegExp(ph, 'gi'), real);
  }
  return result;
}

const CODE_TO_HTML_NUM = {
  'DIP-01': 1,
  'DIP-02': 2,
  'DIP-03': 3,
  'DIP-04': 4,
  'DIP-05': 5,
  'DIP-06': 6,
  'DIP-07': 7,
  'DIP-08': 8,
  'DIP-09': 9,
  'DIP-10': 10,
  'DIP-11': 11,
  'DIP-12': 12,
  'DIP-13': 13,
  'DIP-14': 14,
  'DIP-15': 15,
  'DIP-16': 16,
  'DIP-17': 17,
  'DIP-18': 18,
  'DIP-19': 19,
  'DIP-20': 20,
  'DIP-21': 22, // (D1) 3-module version
  'DIP-22': 23  // Supply Chain
};

const SYSTEM_TITLES = {
  'DIP-01': 'DERECHO MINERO',
  'DIP-02': 'ESPECIALISTA EN COMERCIO INTERNACIONAL: GESTIÓN ADUANERA Y LOGÍSTICA',
  'DIP-03': 'GEOLOGÍA MINERA',
  'DIP-04': 'GEOMECÁNICA SUBTERRÁNEA Y SUPERFICIAL',
  'DIP-05': 'GEOMETALURGIA',
  'DIP-06': 'GEOTECNIA MINERA',
  'DIP-07': 'GERENCIA DE SISTEMAS INTEGRADOS DE GESTIÓN HSEQ',
  'DIP-08': 'GERENCIA ESTRATÉGICA Y LIDERAZGO DE EQUIPOS EN LA MINERÍA',
  'DIP-09': 'GESTIÓN AMBIENTAL PARA EL SECTOR MINERO E INDUSTRIAL',
  'DIP-10': 'GESTIÓN DE CONTROL OPERATIVO EN PROCESOS MINEROS',
  'DIP-11': 'GESTIÓN DE OPERACIONES INDUSTRIALES',
  'DIP-12': 'GESTIÓN ESTRATÉGICA PARA EMPRESAS UTILIZANDO BIG DATA Y ANÁLISIS PREDICTIVO',
  'DIP-13': 'GESTIÓN LOGÍSTICA: COMPRAS, INVENTARIOS Y MANEJO DE PROVEEDORES',
  'DIP-14': 'GESTIÓN LOGÍSTICA Y ALMACENES EN MINERÍA',
  'DIP-15': 'GESTIÓN LOGÍSTICA Y PROVEEDORES EN INDUSTRIA Y MINERÍA',
  'DIP-16': 'GESTIÓN MINERA',
  'DIP-17': 'LEGISLACIÓN LABORAL Y ELABORACIÓN DE PLANILLAS',
  'DIP-18': 'MINERÍA 4.0 Y DIGITALIZACIÓN MINERA',
  'DIP-19': 'PREVENCIÓN DE LA CONFLICTIVIDAD, RIESGOS SOCIALES Y RESPONSABILIDAD SOCIAL MINERA',
  'DIP-20': 'SEGURIDAD INDUSTRIAL',
  'DIP-21': 'SEGURIDAD Y SALUD OCUPACIONAL EN LA INDUSTRIA Y MINERÍA',
  'DIP-22': 'SUPPLY CHAIN MANAGEMENT EN INDUSTRIA Y MINERÍA'
};

const CODE_TO_SLUG = {
  'DIP-01': 'derecho-minero',
  'DIP-02': 'especialista-en-comercio-internacional-gesti-n-aduanera-y-log-stica',
  'DIP-03': 'geolog-a-minera',
  'DIP-04': 'geomec-nica-subterr-nea-y-superficial',
  'DIP-05': 'geometalurgia',
  'DIP-06': 'geotecnia-minera',
  'DIP-07': 'gerencia-de-sistemas-integrados-de-gesti-n-hseq',
  'DIP-08': 'gerencia-estrat-gica-y-liderazgo-de-equipos-en-la-miner-a',
  'DIP-09': 'gesti-n-ambiental-para-el-sector-minero-e-industrial',
  'DIP-10': 'gesti-n-de-control-operativo-en-procesos-mineros',
  'DIP-11': 'gesti-n-de-operaciones-industriales',
  'DIP-12': 'gesti-n-estrat-gica-para-empresas-utilizando-big-data-y-an-lisis-predictivo',
  'DIP-13': 'gesti-n-log-stica-compras-inventarios-y-manejo-de-proveedores',
  'DIP-14': 'gesti-n-log-stica-y-almacenes-en-miner-a',
  'DIP-15': 'gesti-n-log-stica-y-proveedores-en-industria-y-miner-a',
  'DIP-16': 'gesti-n-minera',
  'DIP-17': 'legislaci-n-laboral-y-elaboraci-n-de-planillas',
  'DIP-18': 'miner-a-4-0-y-digitalizaci-n-minera',
  'DIP-19': 'prevenci-n-de-la-conflictividad-riesgos-sociales-y-responsabilidad-social-minera',
  'DIP-20': 'seguridad-industrial',
  'DIP-21': 'seguridad-y-salud-ocupacional-en-la-industria-y-miner-a',
  'DIP-22': 'supply-chain-management-en-industria-y-miner-a'
};

async function runMigration() {
  console.log('--- 1. Fetching current rows from Supabase diplomados_lecciones ---');
  const { data: currentRows, error: fetchErr } = await supabase.from('diplomados_lecciones').select('*').order('orden');
  if (fetchErr) {
    console.error('Fetch error:', fetchErr);
    process.exit(1);
  }
  console.log(`Fetched ${currentRows.length} existing rows.`);

  // Index existing rows by `CodigoDiplomado|Modulo`
  const existingByCodeMod = new Map();
  currentRows.forEach(r => {
    if (r.Tema && r.Tema.includes('ADICIONAL')) return; // Ignore additional classes
    const key = `${r.CodigoDiplomado}|${r.Modulo}`;
    if (!existingByCodeMod.has(key)) {
      existingByCodeMod.set(key, []);
    }
    existingByCodeMod.get(key).push(r);
  });

  // Parse HTML
  console.log('--- 2. Parsing NOMBRES DIPLOMADOS.html ---');
  const h1Matches = [...htmlContent.matchAll(/<h1>\s*(\d+)\.\s*([\s\S]*?)<\/h1>/g)];
  const htmlPrograms = new Map();

  h1Matches.forEach((m, idx) => {
    const pNum = parseInt(m[1]);
    const start = m.index;
    const end = idx < h1Matches.length - 1 ? h1Matches[idx + 1].index : htmlContent.length;
    const block = htmlContent.slice(start, end);

    const modRegex = /<h2>\s*MÓDULO\s*(\d+)\s*-\s*([\s\S]*?)(?:\(Docente:\s*([\s\S]*?)\))?\s*<\/h2>/gi;
    const mods = [...block.matchAll(modRegex)];

    const parsedMods = mods.map((mod, mIdx) => {
      const mNum = mod[1];
      const mTitle = mod[2].trim().replace(/-\s*$/, '').trim();
      const docente = mod[3] ? mod[3].trim() : '';

      const mStart = mod.index;
      const mEnd = mIdx < mods.length - 1 ? mods[mIdx + 1].index : block.length;
      const mBlock = block.slice(mStart, mEnd);

      const rows = [...mBlock.matchAll(/<tr>\s*<td>(\d+)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g)];

      return {
        mNum,
        mTitle,
        docente,
        rows: rows.map(r => ({
          rawClaseNum: r[1].trim(),
          rawTema: r[2].trim()
        }))
      };
    });

    htmlPrograms.set(pNum, { pNum, modules: parsedMods });
  });

  console.log('--- 3. Generating new rows with continuous Temas and Sesiones ---');
  const newLeccionRows = [];
  const diplomadosJsonStructure = [];
  let ordenGlobal = 1;

  for (let i = 1; i <= 22; i++) {
    const code = `DIP-${String(i).padStart(2, '0')}`;
    const htmlNum = CODE_TO_HTML_NUM[code];
    const program = htmlPrograms.get(htmlNum);
    const dipTitle = SYSTEM_TITLES[code];
    const slug = CODE_TO_SLUG[code];

    let globalClaseCounter = 1;
    let globalTemaCounter = 1;

    const modulosJson = [];

    program.modules.forEach((mod, mIdx) => {
      const modCode = `Módulo ${mod.mNum.padStart(2, '0')}`;
      const modNombre = mod.mTitle;
      const docente = mod.docente;

      const existingRowsForMod = existingByCodeMod.get(`${code}|${modCode}`) || [];

      // Group rows into consecutive temas
      let currentBaseTema = '';
      let currentTemaRows = [];
      const temas = [];

      mod.rows.forEach(r => {
        const rawText = r.rawTema;
        const parteMatch = rawText.match(/\s*-\s*Parte\s*(\d+)/i);
        const baseTema = parteMatch ? rawText.replace(/\s*-\s*Parte\s*(\d+)/i, '').trim() : rawText.trim();
        const parteNum = parteMatch ? parseInt(parteMatch[1]) : null;

        if (baseTema !== currentBaseTema) {
          if (currentTemaRows.length > 0) {
            temas.push({ baseTema: currentBaseTema, rows: currentTemaRows });
          }
          currentBaseTema = baseTema;
          currentTemaRows = [{ rawText, parteNum }];
        } else {
          currentTemaRows.push({ rawText, parteNum });
        }
      });
      if (currentTemaRows.length > 0) {
        temas.push({ baseTema: currentBaseTema, rows: currentTemaRows });
      }

      let classIdxInMod = 0;
      const temasJson = [];
      const moduloClasesList = [];

      temas.forEach(t => {
        const temaPad = String(globalTemaCounter++).padStart(2, '0');
        const temaFormatted = `Tema ${temaPad}: ${toNiceTitleCase(t.baseTema)}`;
        const temaClasesList = [];

        t.rows.forEach((r, rIdx) => {
          const claseNum = globalClaseCounter++;
          const parteLabel = r.parteNum ? `Parte ${r.parteNum}` : (t.rows.length > 1 ? `Parte ${rIdx + 1}` : 'Parte 1');
          const sesionLabel = `Clase ${claseNum}: ${parteLabel}`;

          const existingMatch = existingRowsForMod[classIdxInMod];
          classIdxInMod++;

          // Video: existing row first, fallback to drive mapped json
          let videoUrl = existingMatch?.VideoUrl || null;
          if (!videoUrl && driveVideosJson[slug]?.modulos?.[mIdx]?.clases?.[classIdxInMod - 1]?.videoUrl) {
            videoUrl = driveVideosJson[slug].modulos[mIdx].clases[classIdxInMod - 1].videoUrl;
          }

          const pdfUrl = existingMatch?.PdfUrl || null;
          const resumenVideoUrl = existingMatch?.ResumenVideoUrl || null;
          const resumenAudioUrl = existingMatch?.ResumenAudioUrl || null;
          const resumenInteractivo = existingMatch?.ResumenInteractivo || null;
          const material1 = existingMatch?.Material1 || null;
          const material2 = existingMatch?.Material2 || null;
          const material3 = existingMatch?.Material3 || null;
          const material4 = existingMatch?.Material4 || null;
          const material5 = existingMatch?.Material5 || null;
          const material6 = existingMatch?.Material6 || null;
          const material7 = existingMatch?.Material7 || null;
          const material8 = existingMatch?.Material8 || null;

          const rowObj = {
            CodigoDiplomado: code,
            Diplomado: dipTitle,
            Modulo: modCode,
            NombreModulo: modNombre,
            Docente: docente,
            Tema: temaFormatted,
            Sesion: sesionLabel,
            VideoUrl: videoUrl,
            PdfUrl: pdfUrl,
            ResumenVideoUrl: resumenVideoUrl,
            ResumenAudioUrl: resumenAudioUrl,
            ResumenInteractivo: resumenInteractivo,
            Material1: material1,
            Material2: material2,
            Material3: material3,
            Material4: material4,
            Material5: material5,
            Material6: material6,
            Material7: material7,
            Material8: material8,
            orden: ordenGlobal++
          };

          newLeccionRows.push(rowObj);

          const claseJsonObj = {
            titulo: sesionLabel,
            videoUrl: videoUrl || undefined,
            pdfUrl: pdfUrl || undefined,
            resumenVideoUrl: resumenVideoUrl || undefined,
            resumenAudioUrl: resumenAudioUrl || undefined,
            resumenInteractivo: resumenInteractivo || undefined
          };
          temaClasesList.push(claseJsonObj);
          moduloClasesList.push(claseJsonObj);
        });

        temasJson.push({
          titulo: temaFormatted,
          clases: temaClasesList
        });
      });

      modulosJson.push({
        codigo: modCode,
        nombre: modNombre,
        docente: docente,
        temas: temasJson,
        clases: moduloClasesList
      });
    });

    diplomadosJsonStructure.push({
      diplomado: dipTitle,
      modulos: modulosJson
    });

    console.log(`  ${code}: ${program.modules.length} modulos, ${globalTemaCounter - 1} temas, ${globalClaseCounter - 1} clases.`);
  }

  console.log(`\nTotal new rows generated: ${newLeccionRows.length}`);

  // Delete existing rows in Supabase and insert new rows
  console.log('\n--- 4. Updating Supabase diplomados_lecciones table ---');
  // First, delete all rows
  const { error: delErr } = await supabase.from('diplomados_lecciones').delete().neq('CodigoDiplomado', 'IMPOSSIBLE');
  if (delErr) {
    console.error('Delete error:', delErr);
    process.exit(1);
  }
  console.log('Successfully cleared old rows from diplomados_lecciones.');

  // Insert in batches of 50
  const batchSize = 50;
  for (let i = 0; i < newLeccionRows.length; i += batchSize) {
    const chunk = newLeccionRows.slice(i, i + batchSize);
    const { error: insErr } = await supabase.from('diplomados_lecciones').insert(chunk);
    if (insErr) {
      console.error(`Error inserting batch ${i} to ${i + chunk.length}:`, insErr);
      process.exit(1);
    }
    console.log(`Inserted rows ${i + 1} to ${Math.min(i + batchSize, newLeccionRows.length)}...`);
  }

  console.log('--- 5. Supabase update complete! ---');

  // Also update diplomados_todos.json
  console.log('--- 6. Updating lib/data/diplomados_todos.json ---');
  const jsonPath = './lib/data/diplomados_todos.json';
  const newJsonContent = {
    total: diplomadosJsonStructure.length,
    diplomados: diplomadosJsonStructure
  };
  fs.writeFileSync(jsonPath, JSON.stringify(newJsonContent, null, 2), 'utf8');
  console.log(`Updated ${jsonPath} successfully.`);
}

runMigration().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
